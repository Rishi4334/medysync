import { EventRecord, EventType, Severity } from "./types.js";
import { store } from "./store.js";

const EVENT_TYPES: EventType[] = [
  "motion_detected",
  "box_opened",
  "box_closed",
  "reminder_triggered",
  "medicine_taken",
  "medicine_missed",
  "device_online",
  "device_offline",
  "sync_error",
];

export function normalizeEventType(value: string): EventType {
  return (EVENT_TYPES as string[]).includes(value) ? (value as EventType) : "motion_detected";
}

export async function createEventRecord(input: Omit<EventRecord, "id" | "timestamp"> & { timestamp?: string }): Promise<EventRecord> {
  return store.createEvent({
    ...input,
    severity: input.severity ?? "info",
    timestamp: input.timestamp,
  });
}

export function severityFromStatus(status: string): Severity {
  if (status === "success") return "success";
  if (status === "error") return "error";
  if (status === "warning") return "warning";
  return "info";
}
