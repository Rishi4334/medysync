import { store } from "./store.js";
import { sendPushNotification } from "./firebase.js";
import { EventRecord } from "./types.js";

export async function notifyForEvent(event: EventRecord) {
  const state = await store.getState();
  const patient = state.users.find((user) => user.id === event.patientId);
  const assignments = state.assignments.filter((assignment) => assignment.patientId === event.patientId);
  const caretakers = assignments.map((assignment) => state.users.find((user) => user.id === assignment.caretakerId)).filter(Boolean);

  const title = patient ? `${patient.name}: ${event.description}` : event.description;
  const body = `Status: ${event.severity.toUpperCase()}`;
  const notification = await store.createNotification({
    patientId: event.patientId,
    title,
    body,
    category: event.eventType.includes("device") ? "device" : event.eventType === "reminder_triggered" ? "reminder" : "motion",
    isRead: false,
  });

  const tokens = caretakers
    .flatMap((caretaker) => (caretaker ? [(caretaker as { fcmToken?: string }).fcmToken].filter(Boolean) : []))
    .map((token) => String(token));

  await sendPushNotification(tokens, notification.title, notification.body, {
    patientId: String(event.patientId),
    eventType: event.eventType,
  });
}
