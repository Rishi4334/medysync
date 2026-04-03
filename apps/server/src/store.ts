import fs from "fs/promises";
import path from "path";
import { config } from "./config.js";
import { createInitialState, nextId } from "./bootstrap.js";
import { AppState, Assignment, Device, EventRecord, Medicine, NotificationRecord, Reminder, User, AdherenceRecord, DashboardSummary, RecentActivityItem } from "./types.js";

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "medcare-state.json");

function clone<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function ensureDefaults(state: AppState): AppState {
  return {
    ...createInitialState(),
    ...state,
    counters: {
      ...createInitialState().counters,
      ...(state.counters ?? {}),
    },
  };
}

class JsonStateStore {
  private state: AppState | null = null;
  private loadPromise: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  async init(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<AppState> {
    if (this.state) return this.state;
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        try {
          const raw = await fs.readFile(dataFile, "utf8");
          this.state = ensureDefaults(JSON.parse(raw) as AppState);
        } catch {
          this.state = createInitialState();
          await this.persist();
        }
      })();
    }
    await this.loadPromise;
    this.loadPromise = null;
    return this.state!;
  }

  private async persist(): Promise<void> {
    if (!this.state) return;
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(this.state, null, 2), "utf8");
  }

  private async mutate<T>(fn: (state: AppState) => T | Promise<T>): Promise<T> {
    await this.load();
    const result = await fn(this.state!);
    this.writeQueue = this.writeQueue.then(() => this.persist());
    await this.writeQueue;
    return result;
  }

  async getState(): Promise<AppState> {
    return clone(await this.load());
  }

  async replaceState(state: AppState): Promise<void> {
    this.state = ensureDefaults(state);
    await this.persist();
  }

  async listUsers(role?: string): Promise<User[]> {
    const state = await this.load();
    const users = role ? state.users.filter((user) => user.role === role) : state.users;
    return clone(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const state = await this.load();
    return clone(state.users.find((user) => user.id === id));
  }

  async findUserByUsername(username: string): Promise<User | undefined> {
    const state = await this.load();
    return clone(state.users.find((user) => user.username.toLowerCase() === username.toLowerCase()));
  }

  async createUser(input: Omit<User, "id" | "createdAt" | "passwordHash"> & { passwordHash: string }): Promise<User> {
    return this.mutate((state) => {
      const user: User = {
        id: nextId(state, "user"),
        createdAt: new Date().toISOString(),
        ...input,
      };
      state.users.push(user);
      return clone(user);
    });
  }

  async updateUser(id: number, patch: Partial<User>): Promise<User | undefined> {
    return this.mutate((state) => {
      const user = state.users.find((entry) => entry.id === id);
      if (!user) return undefined;
      Object.assign(user, patch);
      return clone(user);
    });
  }

  async deleteUser(id: number): Promise<void> {
    await this.mutate((state) => {
      state.users = state.users.filter((user) => user.id !== id);
      state.assignments = state.assignments.filter((assignment) => assignment.patientId !== id && assignment.caretakerId !== id);
      state.medicines = state.medicines.filter((medicine) => medicine.patientId !== id);
      state.reminders = state.reminders.filter((reminder) => reminder.patientId !== id);
      state.devices = state.devices.filter((device) => device.patientId !== id);
      state.adherenceRecords = state.adherenceRecords.filter((record) => record.patientId !== id);
    });
  }

  async listAssignments(): Promise<Assignment[]> {
    const state = await this.load();
    return clone(state.assignments.map((assignment) => ({
      ...assignment,
      caretaker: state.users.find((user) => user.id === assignment.caretakerId) ?? null,
      patient: state.users.find((user) => user.id === assignment.patientId) ?? null,
    })));
  }

  async createAssignment(caretakerId: number, patientId: number): Promise<Assignment> {
    return this.mutate((state) => {
      const assignment: Assignment = { id: nextId(state, "assignment"), caretakerId, patientId, createdAt: new Date().toISOString() };
      state.assignments.push(assignment);
      return clone(assignment);
    });
  }

  async deleteAssignment(id: number): Promise<void> {
    await this.mutate((state) => {
      state.assignments = state.assignments.filter((assignment) => assignment.id !== id);
    });
  }

  async listMedicines(patientId?: number): Promise<Medicine[]> {
    const state = await this.load();
    return clone(patientId ? state.medicines.filter((medicine) => medicine.patientId === patientId) : state.medicines);
  }

  async createMedicine(input: Omit<Medicine, "id" | "createdAt">): Promise<Medicine> {
    return this.mutate((state) => {
      const medicine: Medicine = { ...input, id: nextId(state, "medicine"), createdAt: new Date().toISOString() };
      state.medicines.push(medicine);
      return clone(medicine);
    });
  }

  async deleteMedicine(id: number): Promise<void> {
    await this.mutate((state) => {
      state.medicines = state.medicines.filter((medicine) => medicine.id !== id);
      state.reminders = state.reminders.filter((reminder) => reminder.medicineId !== id);
    });
  }

  async listReminders(patientId?: number): Promise<Reminder[]> {
    const state = await this.load();
    const reminders = patientId ? state.reminders.filter((reminder) => reminder.patientId === patientId) : state.reminders;
    return clone(reminders);
  }

  async createReminder(input: Omit<Reminder, "id" | "createdAt" | "lastTriggeredAt">): Promise<Reminder> {
    return this.mutate((state) => {
      const reminder: Reminder = {
        ...input,
        id: nextId(state, "reminder"),
        createdAt: new Date().toISOString(),
        lastTriggeredAt: null,
      };
      state.reminders.push(reminder);
      return clone(reminder);
    });
  }

  async updateReminder(id: number, patch: Partial<Reminder>): Promise<Reminder | undefined> {
    return this.mutate((state) => {
      const reminder = state.reminders.find((item) => item.id === id);
      if (!reminder) return undefined;
      Object.assign(reminder, patch);
      return clone(reminder);
    });
  }

  async deleteReminder(id: number): Promise<void> {
    await this.mutate((state) => {
      state.reminders = state.reminders.filter((reminder) => reminder.id !== id);
    });
  }

  async listEvents(patientId?: number, limit = 100): Promise<EventRecord[]> {
    const state = await this.load();
    const events = patientId ? state.events.filter((event) => event.patientId === patientId) : state.events;
    return clone(events.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit));
  }

  async createEvent(input: Omit<EventRecord, "id" | "timestamp"> & { timestamp?: string }): Promise<EventRecord> {
    return this.mutate((state) => {
      const event: EventRecord = {
        ...input,
        id: nextId(state, "event"),
        timestamp: input.timestamp ?? new Date().toISOString(),
      };
      state.events.unshift(event);
      return clone(event);
    });
  }

  async listDevices(): Promise<Device[]> {
    const state = await this.load();
    return clone(state.devices);
  }

  async registerDevice(input: Omit<Device, "id" | "createdAt" | "status" | "lastSeenAt" | "lastSyncAt" | "lastReminderAt"> & Partial<Pick<Device, "status" | "lastSeenAt" | "lastSyncAt" | "lastReminderAt">>): Promise<Device> {
    return this.mutate((state) => {
      const device: Device = {
        id: nextId(state, "device"),
        createdAt: new Date().toISOString(),
        status: input.status ?? "unknown",
        lastSeenAt: input.lastSeenAt ?? null,
        lastSyncAt: input.lastSyncAt ?? null,
        lastReminderAt: input.lastReminderAt ?? null,
        ...input,
      };
      state.devices.push(device);
      return clone(device);
    });
  }

  async updateDevice(id: number, patch: Partial<Device>): Promise<Device | undefined> {
    return this.mutate((state) => {
      const device = state.devices.find((item) => item.id === id);
      if (!device) return undefined;
      Object.assign(device, patch);
      return clone(device);
    });
  }

  async listAdherence(patientId?: number): Promise<AdherenceRecord[]> {
    const state = await this.load();
    const records = patientId ? state.adherenceRecords.filter((record) => record.patientId === patientId) : state.adherenceRecords;
    return clone(records);
  }

  async createAdherenceRecord(input: Omit<AdherenceRecord, "id" | "createdAt">): Promise<AdherenceRecord> {
    return this.mutate((state) => {
      const record: AdherenceRecord = { ...input, id: nextId(state, "adherence"), createdAt: new Date().toISOString() };
      state.adherenceRecords.push(record);
      return clone(record);
    });
  }

  async listNotifications(): Promise<NotificationRecord[]> {
    const state = await this.load();
    return clone(state.notifications);
  }

  async createNotification(input: Omit<NotificationRecord, "id" | "createdAt">): Promise<NotificationRecord> {
    return this.mutate((state) => {
      const notification: NotificationRecord = { ...input, id: nextId(state, "notification"), createdAt: new Date().toISOString() };
      state.notifications.unshift(notification);
      return clone(notification);
    });
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const state = await this.load();
    const today = new Date().toISOString().slice(0, 10);
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - 6);
    const weekStartIso = currentWeekStart.toISOString();

    const todayReminders = state.reminders.filter((reminder) => reminder.isActive).length;
    const devicesOnline = state.devices.filter((device) => device.status === "online").length;
    const devicesOffline = state.devices.filter((device) => device.status === "offline").length;
    const recentAlerts = state.events.filter((event) => event.severity === "warning" || event.severity === "error").length;
    const takenToday = state.adherenceRecords.filter((record) => record.status === "taken" && record.createdAt.startsWith(today)).length;
    const missedToday = state.adherenceRecords.filter((record) => record.status === "missed" && record.createdAt.startsWith(today)).length;
    const weeklyTaken = state.adherenceRecords.filter((record) => record.status === "taken" && record.createdAt >= weekStartIso).length;
    const weeklyTotal = state.adherenceRecords.filter((record) => record.createdAt >= weekStartIso).length;
    const todayTotal = takenToday + missedToday;

    return {
      totalPatients: state.users.filter((user) => user.role === "patient").length,
      totalCaretakers: state.users.filter((user) => user.role === "caretaker").length,
      activeReminders: state.reminders.filter((reminder) => reminder.isActive).length,
      todayReminders,
      todayAdherenceRate: todayTotal === 0 ? 0 : Math.round((takenToday / todayTotal) * 100),
      weeklyAdherenceRate: weeklyTotal === 0 ? 0 : Math.round((weeklyTaken / weeklyTotal) * 100),
      devicesOnline,
      devicesOffline,
      recentAlerts,
      medicinesTaken: state.adherenceRecords.filter((record) => record.status === "taken").length,
      medicinesMissed: state.adherenceRecords.filter((record) => record.status === "missed").length,
    };
  }

  async getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
    const state = await this.load();
    return clone(
      state.events
        .slice()
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit)
        .map((event) => ({
          id: event.id,
          description: event.description,
          patientName: state.users.find((user) => user.id === event.patientId)?.name ?? null,
          severity: event.severity,
          timestamp: event.timestamp,
        }))
    );
  }
}

export const store = new JsonStateStore();
