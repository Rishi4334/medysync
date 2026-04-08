import { useMutation, useQuery } from "@tanstack/react-query";

const API_BASE_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "http://localhost:8080";

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
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
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
  patient?: User | null;
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

interface ApiError extends Error {
  status: number;
  details?: unknown;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`) as ApiError;
    error.status = response.status;
    try {
      error.details = await response.json();
    } catch {
      error.details = await response.text();
    }
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getLoginUserQueryKey() {
  return ["auth", "login"] as const;
}
export function getGetDashboardSummaryQueryKey() {
  return ["dashboard", "summary"] as const;
}
export function getGetRecentActivityQueryKey(params: { limit?: number }) {
  return ["dashboard", "recent-activity", params] as const;
}
export function getListUsersQueryKey(params: { role?: Role }) {
  return ["users", params] as const;
}
export function getGetUserQueryKey(id: number) {
  return ["users", id] as const;
}
export function getListAssignmentsQueryKey(params: Record<string, never> = {}) {
  return ["assignments", params] as const;
}
export function getListMedicinesQueryKey(params: { patientId?: number } = {}) {
  return ["medicines", params] as const;
}
export function getListRemindersQueryKey(params: { patientId?: number } = {}) {
  return ["reminders", params] as const;
}
export function getListEventsQueryKey(params: { patientId?: number; limit?: number } = {}) {
  return ["events", params] as const;
}
export function getListDevicesQueryKey() {
  return ["devices"] as const;
}
export function getListAdherenceRecordsQueryKey() {
  return ["adherence"] as const;
}
export function getGetAdherenceStatsQueryKey(params: { patientId?: number }) {
  return ["adherence", "stats", params] as const;
}

export function useLoginUser() {
  return useMutation({
    mutationFn: async ({ data }: { data: { username: string; password: string } }) => request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useGetDashboardSummary(_params: Record<string, never>, options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetDashboardSummaryQueryKey(),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => request<DashboardSummary>("/dashboard/summary"),
  });
}

export function useGetRecentActivity(params: { limit?: number }, options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetRecentActivityQueryKey(params),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => request<RecentActivityItem[]>(`/activity/recent?limit=${params.limit ?? 10}`),
  });
}

export function useListUsers(params: { role?: Role } = {}, options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListUsersQueryKey(params),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => request<User[]>(`/users${params.role ? `?role=${params.role}` : ""}`),
  });
}

export function useGetUser(id: number, options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetUserQueryKey(id),
    enabled: options?.query?.enabled ?? !!id,
    queryFn: () => request<User>(`/users/${id}`),
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: async ({ data }: { data: { username: string; name: string; email: string; password: string; role: Role; phone?: string | null; avatarUrl?: string | null } }) => request<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useDeleteUser() {
  return useMutation({ mutationFn: async ({ id }: { id: number }) => request<void>(`/users/${id}`, { method: "DELETE" }) });
}

export function useListAssignments(_params: Record<string, never> = {}, options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListAssignmentsQueryKey(),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => request<Assignment[]>("/assignments"),
  });
}

export function useCreateAssignment() {
  return useMutation({ mutationFn: async ({ data }: { data: { caretakerId: number; patientId: number } }) => request<Assignment>("/assignments", { method: "POST", body: JSON.stringify(data) }) });
}

export function useDeleteAssignment() {
  return useMutation({ mutationFn: async ({ id }: { id: number }) => request<void>(`/assignments/${id}`, { method: "DELETE" }) });
}

export function useListMedicines(params: { patientId?: number } = {}, options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  const query = params.patientId ? `?patientId=${params.patientId}` : "";
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListMedicinesQueryKey(params),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => request<Medicine[]>(`/medicines${query}`),
  });
}

export function useCreateMedicine() {
  return useMutation({ mutationFn: async ({ data }: { data: { patientId: number; name: string; dosage: string; unit: string; description?: string | null; color?: string | null } }) => request<Medicine>("/medicines", { method: "POST", body: JSON.stringify(data) }) });
}

export function useDeleteMedicine() {
  return useMutation({ mutationFn: async ({ id }: { id: number }) => request<void>(`/medicines/${id}`, { method: "DELETE" }) });
}

export function useListReminders(params: { patientId?: number } = {}, options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  const query = params.patientId ? `?patientId=${params.patientId}` : "";
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListRemindersQueryKey(params),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => request<Reminder[]>(`/reminders${query}`),
  });
}

export function useCreateReminder() {
  return useMutation({ mutationFn: async ({ data }: { data: { patientId: number; medicineId: number; scheduledTime: string; daysOfWeek: string; dosage: string; notes?: string | null; deviceId?: number | null } }) => request<Reminder>("/reminders", { method: "POST", body: JSON.stringify(data) }) });
}

export function useDeleteReminder() {
  return useMutation({ mutationFn: async ({ id }: { id: number }) => request<void>(`/reminders/${id}`, { method: "DELETE" }) });
}

export function useToggleReminder() {
  return useMutation({ mutationFn: async ({ id }: { id: number }) => request<Reminder>(`/reminders/${id}/toggle`, { method: "PATCH" }) });
}

export function useManualSyncReminders() {
  return useMutation({
    mutationFn: async ({ patientId }: { patientId?: number | null } = {}) =>
      request<{ ok: boolean; syncedPatientIds: number[] }>("/reminders/sync", {
        method: "POST",
        body: JSON.stringify({ patientId: patientId ?? null }),
      }),
  });
}

export function useListEvents(params: { patientId?: number; limit?: number } = {}, options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  const query = new URLSearchParams();
  if (params.patientId) query.set("patientId", String(params.patientId));
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListEventsQueryKey(params),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => request<EventRecord[]>(`/events${suffix}`),
  });
}

export function useDeleteEvent() {
  return useMutation({ mutationFn: async ({ id }: { id: number }) => request<void>(`/events/${id}`, { method: "DELETE" }) });
}

export function useClearEventsByType() {
  return useMutation({
    mutationFn: async ({ eventType, limit }: { eventType: string; limit?: number }) =>
      request<{ deleted: number }>(`/events/clear-by-type/${eventType}`, {
        method: "POST",
        body: JSON.stringify({ limit }),
      }),
  });
}

export function useListDevices(options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListDevicesQueryKey(),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => request<Device[]>("/devices"),
  });
}

export function useRegisterDevice() {
  return useMutation({ mutationFn: async ({ data }: { data: { deviceCode: string; name: string; patientId?: number | null; firmwareVersion?: string | null } }) => request<Device>("/devices", { method: "POST", body: JSON.stringify(data) }) });
}

export function useUpdateDevice() {
  return useMutation({ mutationFn: async ({ id, data }: { id: number; data: Partial<Device> }) => request<Device>(`/devices/${id}`, { method: "PATCH", body: JSON.stringify(data) }) });
}

export function useDeleteDevice() {
  return useMutation({ mutationFn: async ({ id }: { id: number }) => request<void>(`/devices/${id}`, { method: "DELETE" }) });
}

export function useConfigureDevice() {
  return useMutation({
    mutationFn: async ({ id, duration }: { id: number; duration: number }) =>
      request<{ message: string; deviceCode: string }>(`/devices/${id}/config`, {
        method: "POST",
        body: JSON.stringify({ duration }),
      }),
  });
}

export function useListAdherenceRecords(params: { patientId?: number } = {}, options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  const query = params.patientId ? `?patientId=${params.patientId}` : "";
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListAdherenceRecordsQueryKey(),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => request<AdherenceRecord[]>(`/adherence${query}`),
  });
}

export function useGetAdherenceStats(params: { patientId?: number }, options?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } }) {
  const query = params.patientId ? `?patientId=${params.patientId}` : "";
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetAdherenceStatsQueryKey(params),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => request<{ takenDoses: number; missedDoses: number; adherenceRate: number }>(`/adherence/stats${query}`),
  });
}
