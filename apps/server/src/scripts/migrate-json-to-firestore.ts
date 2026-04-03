import fs from "fs/promises";
import path from "path";
import { getFirebaseAdmin } from "../firebase.js";
import { AppState } from "../types.js";

const dataFile = path.resolve(process.cwd(), "data", "medcare-state.json");
const collection = "medisync";
const documentId = "app_state";

async function main() {
  const firebase = getFirebaseAdmin();
  if (!firebase) {
    throw new Error("Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.");
  }

  const raw = await fs.readFile(dataFile, "utf8");
  const state = JSON.parse(raw) as AppState;

  await firebase.firestore().collection(collection).doc(documentId).set(state);
  console.log("Migrated local JSON state to Firestore document:", `${collection}/${documentId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
