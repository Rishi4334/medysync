import { getToken } from "firebase/messaging";
import { getFirebaseMessaging, getVapidKey } from "./firebase";

const API_BASE_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "http://localhost:8080";

export type PushSetupResult =
  | { ok: true; token: string }
  | { ok: false; reason: string };

async function saveToken(userId: number, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/fcm-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fcmToken: token }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save FCM token (${response.status})`);
  }
}

export async function setupPushNotifications(userId: number, options?: { requestPermission?: boolean }): Promise<PushSetupResult> {
  if (typeof window === "undefined") return { ok: false, reason: "Browser environment unavailable" };
  if (!("Notification" in window)) return { ok: false, reason: "Notifications are not supported in this browser" };
  if (!("serviceWorker" in navigator)) return { ok: false, reason: "Service workers are not supported in this browser" };

  const currentPermission = Notification.permission;
  if (currentPermission === "denied") {
    return { ok: false, reason: "Notification permission is denied in browser settings" };
  }

  let permission = currentPermission;
  if (permission !== "granted") {
    if (!options?.requestPermission) {
      return { ok: false, reason: "Notification permission has not been granted yet" };
    }
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return { ok: false, reason: "Notification permission was not granted" };
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return { ok: false, reason: "Firebase messaging is not available" };
  }

  const registration = await navigator.serviceWorker.register(new URL("../firebase-messaging-sw.ts", import.meta.url), {
    type: "module",
  });

  const vapidKey = getVapidKey();
  if (!vapidKey) {
    return { ok: false, reason: "Missing VAPID key" };
  }

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    return { ok: false, reason: "Unable to retrieve FCM token" };
  }

  await saveToken(userId, token);
  return { ok: true, token };
}
