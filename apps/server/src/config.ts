import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

function fromEnv(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  nodeEnv: fromEnv(process.env.NODE_ENV, "development"),
  corsOrigin: fromEnv(process.env.CORS_ORIGIN, "http://localhost:5173"),
  jwtSecret: fromEnv(process.env.JWT_SECRET, "replace-this-secret"),
  apiBaseUrl: fromEnv(process.env.API_BASE_URL, "http://localhost:8080"),
  mqttBrokerUrl: fromEnv(process.env.MQTT_BROKER_URL, "mqtt://localhost:1883"),
  mqttClientId: fromEnv(process.env.MQTT_CLIENT_ID, "medcare-backend"),
  mqttUsername: process.env.MQTT_USERNAME ?? "",
  mqttPassword: process.env.MQTT_PASSWORD ?? "",
  mqttBaseTopic: fromEnv(process.env.MQTT_BASE_TOPIC, "medcare"),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL ?? "",
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "",
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "",
  deviceCommandTtlSeconds: Number(process.env.DEVICE_COMMAND_TTL_SECONDS ?? 30),
};
