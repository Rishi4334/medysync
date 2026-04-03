import mqtt from "mqtt";
import { config } from "./config.js";
import { store } from "./store.js";
import { createEventRecord, normalizeEventType } from "./utils.js";
import { emitRealtime } from "./realtime.js";
import { notifyForEvent } from "./notifications.js";

let client: mqtt.MqttClient | null = null;

export async function startMqttBridge() {
  client = mqtt.connect(config.mqttBrokerUrl, {
    clientId: config.mqttClientId,
    username: config.mqttUsername || undefined,
    password: config.mqttPassword || undefined,
    reconnectPeriod: 5000,
  });

  client.on("connect", async () => {
    await client?.subscribe(`${config.mqttBaseTopic}/devices/+/telemetry`);
    await client?.subscribe(`${config.mqttBaseTopic}/devices/+/status`);
    await client?.subscribe(`${config.mqttBaseTopic}/devices/+/events`);
  });

  client.on("message", async (topic: string, payload: Buffer) => {
    try {
      const parts = topic.split("/");
      const deviceCode = parts[2];
      const tail = parts[3];
      const message = JSON.parse(payload.toString()) as Record<string, unknown>;
      const state = await store.getState();
      const device = state.devices.find((entry) => entry.deviceCode === deviceCode);
      if (!device) return;

      if (tail === "status") {
        await store.updateDevice(device.id, {
          status: (message.status as "online" | "offline" | "unknown") ?? "online",
          lastSeenAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
        });
        const event = await createEventRecord({
          patientId: device.patientId ?? 0,
          deviceId: device.id,
          eventType: message.status === "offline" ? "device_offline" : "device_online",
          description: message.status === "offline" ? `Device ${device.deviceCode} went offline` : `Device ${device.deviceCode} came online`,
          severity: message.status === "offline" ? "warning" : "success",
          meta: { topic, message },
        });
        emitRealtime("event.created", event);
      }

      if (tail === "telemetry" || tail === "events") {
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
          lastReminderAt: eventType === "reminder_triggered" ? new Date().toISOString() : undefined,
        });
        emitRealtime("event.created", event);
        await notifyForEvent(event);
      }
    } catch {
      // Ignore malformed messages and keep the bridge alive.
    }
  });
}

export async function publishDeviceCommand(deviceCode: string, payload: unknown) {
  if (!client) return;
  client.publish(`${config.mqttBaseTopic}/devices/${deviceCode}/commands`, JSON.stringify(payload), { qos: 1, retain: false });
}
