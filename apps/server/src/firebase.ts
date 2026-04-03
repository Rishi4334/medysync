import admin from "firebase-admin";
import { config } from "./config.js";

let app: admin.app.App | null = null;

function parseServiceAccount() {
  if (config.firebaseServiceAccountJson) {
    return JSON.parse(config.firebaseServiceAccountJson) as admin.ServiceAccount;
  }
  if (config.firebaseClientEmail && config.firebasePrivateKey) {
    return {
      projectId: config.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: config.firebasePrivateKey,
    } as admin.ServiceAccount;
  }
  return null;
}

export function getFirebaseAdmin(): admin.app.App | null {
  if (app) return app;
  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) return null;
  app = admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebaseProjectId || serviceAccount.projectId,
        databaseURL: config.firebaseDatabaseUrl || undefined,
        storageBucket: config.firebaseStorageBucket || undefined,
      });
  return app;
}

export async function sendPushNotification(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  const firebase = getFirebaseAdmin();
  if (!firebase || tokens.length === 0) return;
  await firebase.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  });
}
