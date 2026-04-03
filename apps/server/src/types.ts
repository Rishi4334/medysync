export type Role = "admin" | "caretaker" | "patient";
export type DeviceStatus = "online" | "offline" | "unknown";
export type EventType =
  | "motion_detected"
  | "box_opened"
  | "box_closed"
  | "reminder_triggered"
  | "medicine_taken"
  | "medicine_missed"
  | "device_online"
  | "device_offline"
  | "sync_error";
export type Severity = "info" | "success" | "warning" | "error";

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
  fcmToken?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Assignment {
  id: number;
  caretakerId: number;
  patientId: number;
  createdAt: string;
  caretaker?: User | null;
  patient?: User | null;
}

export interface Medicine {
  id: number;
  patientId: number;
  name: string;
  dosage: string;
  unit: string;
  description?: string | null;
  color?: string | null;
  createdAt: string;
}

export interface Reminder {
  id: number;
  patientId: number;
  medicineId: number;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  daysOfWeek: string;
  notes?: string | null;
  isActive: boolean;
  deviceId?: number | null;
  lastTriggeredAt?: string | null;
  createdAt: string;
}

export interface EventRecord {
  id: number;
  patientId: number;
  deviceId?: number | null;
  eventType: EventType;
  description: string;
  severity: Severity;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface Device {
  id: number;
  deviceCode: string;
  name: string;
  patientId?: number | null;
  status: DeviceStatus;
  firmwareVersion?: string | null;
  lastSeenAt?: string | null;
  lastSyncAt?: string | null;
  lastReminderAt?: string | null;
  createdAt: string;
}

export interface AdherenceRecord {
  id: number;
  patientId: number;
  reminderId?: number | null;
  status: "taken" | "missed" | "pending";
  scheduledAt: string;
  takenAt?: string | null;
  source: "manual" | "esp32" | "system";
  note?: string | null;
  createdAt: string;
}

export interface NotificationRecord {
  id: number;
  userId?: number | null;
  patientId?: number | null;
  title: string;
  body: string;
  category: "reminder" | "motion" | "device" | "assignment" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  totalPatients: number;
  totalCaretakers: number;
  activeReminders: number;
  todayReminders: number;
  todayAdherenceRate: number;
  weeklyAdherenceRate: number;
  devicesOnline: number;
  devicesOffline: number;
  recentAlerts: number;
  medicinesTaken: number;
  medicinesMissed: number;
}

export interface RecentActivityItem {
  id: number;
  description: string;
  patientName?: string | null;
  severity: Severity;
  timestamp: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface AppState {
  counters: Record<string, number>;
  users: User[];
  assignments: Assignment[];
  medicines: Medicine[];
  reminders: Reminder[];
  events: EventRecord[];
  devices: Device[];
  adherenceRecords: AdherenceRecord[];
  notifications: NotificationRecord[];
}
