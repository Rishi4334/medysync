import mqtt from "mqtt";
import { config } from "./config.js";
import { store } from "./store.js";
import { createEventRecord, normalizeEventType } from "./utils.js";
import { emitRealtime } from "./realtime.js";
import { notifyForEvent } from "./notifications.js";
import { log } from "./logger.js";

let client: mqtt.MqttClient | null = null;
const lastStatusByDevice = new Map<string, string>();
const lastStatusEventAtByDevice = new Map<string, number>();
const STATUS_EVENT_COOLDOWN_MS = 5 * 60 * 1000;
const PENDING_ADHERENCE_WINDOW_MS = 90 * 60 * 1000;

async function createPendingAdherenceFromReminder(devicePatientId: number) {
  await store.createAdherenceRecord({
    patientId: devicePatientId,
    reminderId: null,
    status: "pending",
    scheduledAt: new Date().toISOString(),
    takenAt: null,
    source: "esp32",
    note: "Auto-created from reminder_triggered",
  });
}

async function resolveLatestPendingAdherence(devicePatientId: number, status: "taken" | "missed", note: string): Promise<boolean> {
  const records = await store.listAdherence(devicePatientId);
  const pending = records
    .filter((record) => record.status === "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!pending) {
    return false;
  }

  const pendingAgeMs = Date.now() - new Date(pending.createdAt).getTime();
  if (pendingAgeMs > PENDING_ADHERENCE_WINDOW_MS) {
    return false;
  }

  await store.updateAdherenceRecord(pending.id, {
    status,
    takenAt: status === "taken" ? new Date().toISOString() : null,
    source: "esp32",
    note,
  });
  return true;
}

export async function startMqttBridge() {
  log.info("Starting MQTT bridge", { broker: config.mqttBrokerUrl, topic: config.mqttBaseTopic });
  client = mqtt.connect(config.mqttBrokerUrl, {
    clientId: config.mqttClientId,
    username: config.mqttUsername || undefined,
    password: config.mqttPassword || undefined,
    reconnectPeriod: 5000,
  });

  client.on("connect", async () => {
    log.info("MQTT connected");
    await client?.subscribe(`${config.mqttBaseTopic}/devices/+/telemetry`);
    await client?.subscribe(`${config.mqttBaseTopic}/devices/+/status`);
    await client?.subscribe(`${config.mqttBaseTopic}/devices/+/events`);
    log.info("MQTT subscriptions registered");
  });

  client.on("error", (err: Error) => {
    log.error("MQTT error", { error: err.message });
  });

  client.on("message", async (topic: string, payload: Buffer) => {
    try {
      const parts = topic.split("/");
      const deviceCode = parts[2];
      const tail = parts[3];
      const message = JSON.parse(payload.toString()) as Record<string, unknown>;
      const state = await store.getState();
      const device = state.devices.find((entry) => entry.deviceCode === deviceCode);
      if (!device) {
        log.warn("MQTT message for unknown device", { topic, deviceCode, tail });
        return;
      }

      if (tail === "status") {
        const status = String(message.status ?? "unknown");
        log.info("MQTT device status", { deviceCode, status });
        await store.updateDevice(device.id, {
          status: (message.status as "online" | "offline" | "unknown") ?? "online",
          lastSeenAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
        });
        const lastStatus = lastStatusByDevice.get(deviceCode);
        const nowMs = Date.now();
        const lastStatusEventAt = lastStatusEventAtByDevice.get(deviceCode) ?? 0;
        const shouldCreateStatusEvent = lastStatus !== status || nowMs - lastStatusEventAt >= STATUS_EVENT_COOLDOWN_MS;

        if (shouldCreateStatusEvent) {
          const event = await createEventRecord({
            patientId: device.patientId ?? 0,
            deviceId: device.id,
            eventType: status === "offline" ? "device_offline" : "device_online",
            description: status === "offline" ? `Device ${device.deviceCode} went offline` : `Device ${device.deviceCode} came online`,
            severity: status === "offline" ? "warning" : "success",
            meta: { topic, message },
          });
          emitRealtime("event.created", event);
          lastStatusEventAtByDevice.set(deviceCode, nowMs);
        }

        lastStatusByDevice.set(deviceCode, status);
      }

      if (tail === "telemetry" || tail === "events") {
        log.info("MQTT telemetry event", { deviceCode, tail, event: String(message.event ?? message.type ?? "unknown") });
        const eventType = normalizeEventType(String(message.event ?? message.type ?? "motion_detected"));
        const event = await createEventRecord({
          patientId: device.patientId ?? Number(message.patientId ?? 0),
          deviceId: device.id,
          eventType,
          description: String(message.description ?? `${eventType.replace(/_/g, " ")}`),
          severity: (message.severity as "info" | "success" | "warning" | "error") ?? (eventType === "medicine_taken" ? "success" : eventType === "medicine_missed" ? "error" : "warning"),
          meta: message,
        });
        await store.updateDevice(device.id, {
          lastSeenAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
          status: "online",
          ...(eventType === "reminder_triggered" ? { lastReminderAt: new Date().toISOString() } : {}),
        });
        emitRealtime("event.created", event);
        await notifyForEvent(event);

        if (device.patientId) {
          if (eventType === "reminder_triggered") {
            await createPendingAdherenceFromReminder(device.patientId);
            log.info("Adherence pending created from reminder", { patientId: device.patientId, deviceCode });
          }

          if (eventType === "motion_detected" || eventType === "box_opened" || eventType === "medicine_taken") {
            const updated = await resolveLatestPendingAdherence(device.patientId, "taken", "Auto-marked as taken from post-reminder interaction");
            if (updated) {
              log.info("Adherence marked taken from telemetry", { patientId: device.patientId, deviceCode, event: eventType });
            } else {
              log.info("Telemetry ignored for adherence (no recent pending reminder)", { patientId: device.patientId, deviceCode, event: eventType });
            }
          }

          if (eventType === "medicine_missed") {
            const updated = await resolveLatestPendingAdherence(device.patientId, "missed", "Auto-marked as missed from reminder timeout telemetry");
            if (updated) {
              log.info("Adherence marked missed from telemetry", { patientId: device.patientId, deviceCode });
            } else {
              log.info("Missed telemetry ignored for adherence (no recent pending reminder)", { patientId: device.patientId, deviceCode });
            }
          }
        }
      }
    } catch (error) {
      log.warn("Malformed MQTT payload ignored", { topic, error: String(error) });
    }
  });
}

export async function publishDeviceCommand(deviceCode: string, payload: unknown) {
  if (!client) return;
  log.info("Publishing device command", { deviceCode });
  client.publish(`${config.mqttBaseTopic}/devices/${deviceCode}/commands`, JSON.stringify(payload), { qos: 1, retain: false });
}
