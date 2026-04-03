import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { AppState, Assignment, Device, EventRecord, Medicine, NotificationRecord, Reminder, User, AdherenceRecord } from "./types.js";

function now() {
  return new Date().toISOString();
}

export function createInitialState(): AppState {
  const adminPassword = bcrypt.hashSync("admin123", 10);
  const caretakerPassword = bcrypt.hashSync("care123", 10);
  const patientPassword = bcrypt.hashSync("patient123", 10);

  const users: User[] = [
    {
      id: 1,
      username: "admin",
      passwordHash: adminPassword,
      name: "Aarav Shah",
      email: "admin@medcare.local",
      role: "admin",
      phone: "+91 90000 00001",
      avatarUrl: null,
      fcmToken: null,
      isActive: true,
      createdAt: now(),
    },
    {
      id: 2,
      username: "caretaker1",
      passwordHash: caretakerPassword,
      name: "Priya Mehta",
      email: "priya@medcare.local",
      role: "caretaker",
      phone: "+91 90000 00002",
      avatarUrl: null,
      fcmToken: null,
      isActive: true,
      createdAt: now(),
    },
    {
      id: 3,
      username: "patient1",
      passwordHash: patientPassword,
      name: "Ravi Kumar",
      email: "ravi@medcare.local",
      role: "patient",
      phone: "+91 90000 00003",
      avatarUrl: null,
      fcmToken: null,
      isActive: true,
      createdAt: now(),
    },
  ];

  const medicines: Medicine[] = [
    {
      id: 1,
      patientId: 3,
      name: "Metformin",
      dosage: "500",
      unit: "mg",
      description: "After breakfast",
      color: "#3B82F6",
      createdAt: now(),
    },
  ];

  const reminders: Reminder[] = [
    {
      id: 1,
      patientId: 3,
      medicineId: 1,
      medicineName: "Metformin",
      dosage: "500mg",
      scheduledTime: "08:00",
      daysOfWeek: "daily",
      notes: "Take after food",
      isActive: true,
      deviceId: 1,
      lastTriggeredAt: null,
      createdAt: now(),
    },
  ];

  const assignments: Assignment[] = [
    { id: 1, caretakerId: 2, patientId: 3, createdAt: now() },
  ];

  const devices: Device[] = [
    {
      id: 1,
      deviceCode: "ESP32-001",
      name: "Patient Room Box",
      patientId: 3,
      status: "online",
      firmwareVersion: "arduino-1.0.0",
      lastSeenAt: now(),
      lastSyncAt: now(),
      createdAt: now(),
    },
  ];

  const events: EventRecord[] = [
    {
      id: 1,
      patientId: 3,
      deviceId: 1,
      eventType: "device_online",
      description: "Smart medicine box connected",
      severity: "success",
      timestamp: now(),
      meta: { source: "seed" },
    },
  ];

  const adherenceRecords: AdherenceRecord[] = [
    {
      id: 1,
      patientId: 3,
      reminderId: 1,
      status: "taken",
      scheduledAt: now(),
      takenAt: now(),
      source: "system",
      createdAt: now(),
    },
  ];

  const notifications: NotificationRecord[] = [];

  return {
    counters: {
      user: users.length + 1,
      assignment: assignments.length + 1,
      medicine: medicines.length + 1,
      reminder: reminders.length + 1,
      event: events.length + 1,
      device: devices.length + 1,
      adherence: adherenceRecords.length + 1,
      notification: 1,
    },
    users,
    assignments,
    medicines,
    reminders,
    events,
    devices,
    adherenceRecords,
    notifications,
  };
}

export function nextId(state: AppState, key: keyof AppState["counters"]): number {
  const current = state.counters[key as string] ?? 1;
  state.counters[key as string] = current + 1;
  return current;
}

export function createId(prefix: string): string {
  return `${prefix}_${nanoid(8)}`;
}
