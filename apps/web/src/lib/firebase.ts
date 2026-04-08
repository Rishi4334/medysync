import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasConfig(): boolean {
  return Object.values(firebaseConfig).every((value) => typeof value === "string" && value.trim().length > 0);
}

export function canUseFirebaseMessaging(): boolean {
  return hasConfig() && typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window;
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!hasConfig()) return null;
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!canUseFirebaseMessaging()) return null;
  if (!(await isSupported())) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  return getMessaging(app);
}

export function getVapidKey(): string {
  return import.meta.env.VITE_FIREBASE_VAPID_KEY ?? "";
}
