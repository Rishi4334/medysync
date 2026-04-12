// @ts-ignore
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { comparePassword, signToken } from "./auth.js";
import { store } from "./store.js";
import { emitRealtime } from "./realtime.js";
import { notifyForEvent } from "./notifications.js";
import { publishDeviceCommand } from "./mqtt.js";
import { log } from "./logger.js";

const router = Router();

const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
const createUserSchema = z.object({
  username: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "caretaker", "patient"]),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});
const createAssignmentSchema = z.object({ caretakerId: z.number().int().positive(), patientId: z.number().int().positive() });
const createMedicineSchema = z.object({ patientId: z.number().int().positive(), name: z.string().min(1), dosage: z.string().min(1), unit: z.string().min(1), description: z.string().optional().nullable(), color: z.string().optional().nullable() });
const createReminderSchema = z.object({ patientId: z.number().int().positive(), medicineId: z.number().int().positive(), scheduledTime: z.string().min(1), daysOfWeek: z.string().min(1), dosage: z.string().min(1), notes: z.string().optional().nullable(), deviceId: z.number().int().positive().optional().nullable() });
const manualSyncSchema = z.object({ patientId: z.number().int().positive().optional().nullable() });
const createDeviceSchema = z.object({ deviceCode: z.string().min(1), name: z.string().min(1), patientId: z.number().int().positive().optional().nullable(), firmwareVersion: z.string().optional().nullable() });
const updateTokenSchema = z.object({ fcmToken: z.string().min(1) });

async function syncRemindersForPatientDevices(patientId: number, preferredDeviceId?: number | null) {
  const allDevices = await store.listDevices();
  let targets = allDevices.filter((device) => {
    if (preferredDeviceId && device.id === preferredDeviceId) return true;
    return device.patientId === patientId;
  });

  if (targets.length === 0) {
    log.warn("Reminder sync skipped - no target devices", {
      patientId,
      preferredDeviceId: preferredDeviceId ?? null,
      registeredDevices: allDevices.length,
    });
    return;
  }

  const reminders = await store.listReminders(patientId);
  log.info("Syncing reminders to devices", {
    patientId,
    reminderCount: reminders.length,
    targetDevices: targets.map((device) => device.deviceCode).join(","),
  });

  await Promise.all(
    targets.map((device) =>
      publishDeviceCommand(device.deviceCode, {
        command: "sync_reminders",
        reminders,
      }),
    ),
  );
}

router.post("/auth/login", async (req: any, res: any) => {
  const payload = loginSchema.parse(req.body);
  const user = await store.findUserByUsername(payload.username);
  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const ok = await comparePassword(payload.password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  res.json({ token: signToken(user), user: stripPassword(user) });
});

router.get("/dashboard/summary", async (_req: any, res: any) => {
  res.json(await store.getDashboardSummary());
});

router.get("/activity/recent", async (req: any, res: any) => {
  const limit = Number(req.query.limit ?? 10);
  res.json(await store.getRecentActivity(limit));
});

router.get("/users", async (req: any, res: any) => {
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const users = await store.listUsers(role);
  res.json(users.map(stripPassword));
});

router.get("/users/:id", async (req: any, res: any) => {
  const user = await store.getUser(Number(req.params.id));
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(stripPassword(user));
});

router.post("/users", async (req: any, res: any) => {
  const payload = createUserSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await store.createUser({ ...payload, passwordHash, phone: payload.phone ?? null, avatarUrl: payload.avatarUrl ?? null, isActive: true });
  emitRealtime("user.created", stripPassword(user));
  res.status(201).json(stripPassword(user));
});

router.delete("/users/:id", async (req: any, res: any) => {
  await store.deleteUser(Number(req.params.id));
  emitRealtime("user.deleted", { id: Number(req.params.id) });
  res.status(204).end();
});

router.post("/users/:id/fcm-token", async (req: any, res: any) => {
  const payload = updateTokenSchema.parse(req.body);
  const updated = await store.updateUser(Number(req.params.id), { fcmToken: payload.fcmToken });
  if (!updated) return res.status(404).json({ message: "User not found" });
  emitRealtime("user.updated", stripPassword(updated));
  res.json(stripPassword(updated));
});

router.get("/assignments", async (_req: any, res: any) => {
  res.json(await store.listAssignments());
});

router.post("/assignments", async (req: any, res: any) => {
  const payload = createAssignmentSchema.parse(req.body);
  const assignment = await store.createAssignment(payload.caretakerId, payload.patientId);
  emitRealtime("assignment.created", assignment);
  await store.createEvent({
    patientId: payload.patientId,
    eventType: "sync_error",
    description: `Caretaker assigned to patient ${payload.patientId}`,
    severity: "info",
    meta: { caretakerId: payload.caretakerId },
  });
  res.status(201).json(assignment);
});

router.delete("/assignments/:id", async (req: any, res: any) => {
  await store.deleteAssignment(Number(req.params.id));
  emitRealtime("assignment.deleted", { id: Number(req.params.id) });
  res.status(204).end();
});

router.get("/medicines", async (req: any, res: any) => {
  const patientId = typeof req.query.patientId === "string" ? Number(req.query.patientId) : undefined;
  res.json(await store.listMedicines(Number.isFinite(patientId as number) ? patientId : undefined));
});

router.post("/medicines", async (req: any, res: any) => {
  const payload = createMedicineSchema.parse(req.body);
  const medicine = await store.createMedicine(payload);
  emitRealtime("medicine.created", medicine);
  res.status(201).json(medicine);
});

router.delete("/medicines/:id", async (req: any, res: any) => {
  await store.deleteMedicine(Number(req.params.id));
  emitRealtime("medicine.deleted", { id: Number(req.params.id) });
  res.status(204).end();
});

router.get("/reminders", async (req: any, res: any) => {
  const patientId = typeof req.query.patientId === "string" ? Number(req.query.patientId) : undefined;
  res.json(await store.listReminders(Number.isFinite(patientId as number) ? patientId : undefined));
});

router.post("/reminders", async (req: any, res: any) => {
  const payload = createReminderSchema.parse(req.body);
  const medicine = (await store.listMedicines(payload.patientId)).find((item) => item.id === payload.medicineId);
  const reminder = await store.createReminder({
    ...payload,
    medicineName: medicine?.name ?? "Medicine",
    isActive: true,
  });
  emitRealtime("reminder.created", reminder);
  await syncRemindersForPatientDevices(payload.patientId, payload.deviceId ?? null);
  res.status(201).json(reminder);
});

router.post("/reminders/sync", async (req: any, res: any) => {
  const payload = manualSyncSchema.parse(req.body ?? {});

  if (payload.patientId) {
    await syncRemindersForPatientDevices(payload.patientId);
    return res.json({ ok: true, syncedPatientIds: [payload.patientId] });
  }

  const reminders = await store.listReminders();
  const patientIds = Array.from(new Set(reminders.map((reminder) => reminder.patientId)));
  await Promise.all(patientIds.map((patientId) => syncRemindersForPatientDevices(patientId)));
  return res.json({ ok: true, syncedPatientIds: patientIds });
});

router.patch("/reminders/:id/toggle", async (req: any, res: any) => {
  const id = Number(req.params.id);
  const reminder = (await store.listReminders()).find((item) => item.id === id);
  if (!reminder) return res.status(404).json({ message: "Reminder not found" });
  const updated = await store.updateReminder(id, { isActive: !reminder.isActive });
  emitRealtime("reminder.updated", updated);
  await syncRemindersForPatientDevices(reminder.patientId, reminder.deviceId ?? null);
  res.json(updated);
});

router.delete("/reminders/:id", async (req: any, res: any) => {
  const id = Number(req.params.id);
  const reminder = (await store.listReminders()).find((item) => item.id === id);
  await store.deleteReminder(id);
  emitRealtime("reminder.deleted", { id });
  if (reminder) {
    await syncRemindersForPatientDevices(reminder.patientId, reminder.deviceId ?? null);
  }
  res.status(204).end();
});

router.get("/events", async (req: any, res: any) => {
  const patientId = typeof req.query.patientId === "string" ? Number(req.query.patientId) : undefined;
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 100;
  res.json(await store.listEvents(Number.isFinite(patientId as number) ? patientId : undefined, Number.isFinite(limit) ? limit : 100));
});

router.post("/events", async (req: any, res: any) => {
  const payload = req.body as Record<string, unknown>;
  const event = await store.createEvent({
    patientId: Number(payload.patientId ?? 0),
    deviceId: payload.deviceId ? Number(payload.deviceId) : null,
    eventType: String(payload.eventType ?? "motion_detected") as any,
    description: String(payload.description ?? "Event received"),
    severity: String(payload.severity ?? "info") as any,
    meta: payload.meta as Record<string, unknown> | undefined,
  });
  emitRealtime("event.created", event);
  await notifyForEvent(event);
  res.status(201).json(event);
});

router.delete("/events/:id", async (req: any, res: any) => {
  const id = Number(req.params.id);
  await store.deleteEvent(id);
  emitRealtime("event.deleted", { id });
  res.status(204).end();
});

router.post("/events/clear-by-type/:type", async (req: any, res: any) => {
  const eventType = String(req.params.type ?? "device_online");
  const limit = req.body?.limit ? Number(req.body.limit) : undefined;
  const deleted = await store.deleteEventsByType(eventType, limit);
  emitRealtime("events.cleared", { eventType, deleted });
  res.json({ deleted });
});

router.get("/devices", async (_req: any, res: any) => {
  res.json(await store.listDevices());
});

router.post("/devices", async (req: any, res: any) => {
  const payload = createDeviceSchema.parse(req.body);
  const device = await store.registerDevice({
    ...payload,
    patientId: payload.patientId ?? null,
    status: "unknown",
    lastSeenAt: null,
    lastSyncAt: null,
    lastReminderAt: null,
  });
  emitRealtime("device.created", device);
  res.status(201).json(device);
});

router.patch("/devices/:id", async (req: any, res: any) => {
  const device = await store.updateDevice(Number(req.params.id), req.body as Partial<never>);
  if (!device) return res.status(404).json({ message: "Device not found" });
  emitRealtime("device.updated", device);
  res.json(device);
});

router.delete("/devices/:id", async (req: any, res: any) => {
  const id = Number(req.params.id);
  const device = (await store.listDevices()).find((item) => item.id === id);
  if (!device) return res.status(404).json({ message: "Device not found" });
  await store.deleteDevice(id);
  emitRealtime("device.deleted", { id });
  res.status(204).end();
});

router.post("/devices/:id/config", async (req: any, res: any) => {
  const id = Number(req.params.id);
  const device = (await store.listDevices()).find((item) => item.id === id);
  if (!device) return res.status(404).json({ message: "Device not found" });
  const payload = req.body as Record<string, unknown>;
  await publishDeviceCommand(device.deviceCode, {
    command: "configure_buzzer",
    duration: payload.duration ? Number(payload.duration) : 2500,
  });
  res.json({ message: "Configuration sent to device", deviceCode: device.deviceCode });
});

router.get("/adherence", async (req: any, res: any) => {
  const patientId = typeof req.query.patientId === "string" ? Number(req.query.patientId) : undefined;
  res.json(await store.listAdherence(Number.isFinite(patientId as number) ? patientId : undefined));
});

router.get("/adherence/stats", async (req: any, res: any) => {
  const patientId = typeof req.query.patientId === "string" ? Number(req.query.patientId) : undefined;
  const records = await store.listAdherence(Number.isFinite(patientId as number) ? patientId : undefined);
  const takenDoses = records.filter((record) => record.status === "taken").length;
  const missedDoses = records.filter((record) => record.status === "missed").length;
  const adherenceRate = takenDoses + missedDoses === 0 ? 0 : Math.round((takenDoses / (takenDoses + missedDoses)) * 100);
  res.json({ takenDoses, missedDoses, adherenceRate });
});

router.post("/adherence", async (req: any, res: any) => {
  const payload = req.body as Record<string, unknown>;
  const record = await store.createAdherenceRecord({
    patientId: Number(payload.patientId ?? 0),
    reminderId: payload.reminderId ? Number(payload.reminderId) : null,
    status: (payload.status as "taken" | "missed" | "pending") ?? "pending",
    scheduledAt: String(payload.scheduledAt ?? new Date().toISOString()),
    takenAt: payload.takenAt ? String(payload.takenAt) : null,
    source: (payload.source as "manual" | "esp32" | "system") ?? "system",
    note: payload.note ? String(payload.note) : null,
  });
  emitRealtime("adherence.created", record);
  res.status(201).json(record);
});

router.get("/health", (_req: any, res: any) => {
  res.json({ ok: true, service: "medcare-backend" });
});

function stripPassword<T extends { passwordHash: string }>(user: T): Omit<T, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default router;

