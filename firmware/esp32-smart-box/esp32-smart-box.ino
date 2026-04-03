#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER = "7024cefa43544220aa540998eaed6fc8.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
const char* MQTT_USER = "MedySync";
const char* MQTT_PASSWORD = "MedySync@890";
const char* DEVICE_CODE = "ESP32-001";
const char* BASE_TOPIC = "medcare";

const long GMT_OFFSET_SECONDS = 19800;
const int DAYLIGHT_OFFSET_SECONDS = 0;
const char* NTP_SERVER_1 = "pool.ntp.org";
const char* NTP_SERVER_2 = "time.nist.gov";

const int PIR_MOTION_PIN = 27;
const int PIR_INTERACTION_PIN = 26;
const int BUZZER_PIN = 25;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

struct ReminderSlot {
  bool active = false;
  String id;
  String medicineName;
  String dosage;
  String scheduledTime; // HH:MM
  String daysOfWeek;
  bool enabled = true;
  bool triggeredToday = false;
  int lastTriggeredYDay = -1;
};

static const int MAX_REMINDERS = 12;
ReminderSlot reminders[MAX_REMINDERS];
int reminderCount = 0;

bool motionState = false;
bool interactionState = false;
unsigned long lastMotionPublish = 0;
unsigned long lastInteractionPublish = 0;
unsigned long lastClockRender = 0;
unsigned long lastReminderScan = 0;
unsigned long buzzerOffAt = 0;
unsigned long lastMqttReconnectAttempt = 0;
unsigned long lastWiFiReconnectAttempt = 0;
unsigned long lastNtpSync = 0;

String currentStatus = "BOOTING";
String latestReminderLabel = "No active reminder";

void setStatus(const String& status) {
  currentStatus = status;
}

void buzzerStart(unsigned int frequency, unsigned long durationMs) {
  ledcAttachPin(BUZZER_PIN, 0);
  ledcWriteTone(0, frequency);
  buzzerOffAt = millis() + durationMs;
}

void buzzerStop() {
  ledcWriteTone(0, 0);
  buzzerOffAt = 0;
}

bool isBuzzerActive() {
  return buzzerOffAt != 0 && millis() < buzzerOffAt;
}

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (millis() - lastWiFiReconnectAttempt < 8000) return;
  lastWiFiReconnectAttempt = millis();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  setStatus("CONNECTING_WIFI");
}

void syncTimeNow() {
  configTime(GMT_OFFSET_SECONDS, DAYLIGHT_OFFSET_SECONDS, NTP_SERVER_1, NTP_SERVER_2);
  lastNtpSync = millis();
}

void connectMqtt();

void publishTelemetry(const char* eventType, const String& description, const String& severity, JsonObject extra = JsonObject()) {
  if (!mqttClient.connected()) return;
  JsonDocument doc;
  doc["deviceCode"] = DEVICE_CODE;
  doc["event"] = eventType;
  doc["description"] = description;
  doc["severity"] = severity;
  doc["patientId"] = 0;
  if (extra) {
    doc["meta"] = extra;
  }
  char buffer[512];
  size_t len = serializeJson(doc, buffer, sizeof(buffer));
  String topic = String(BASE_TOPIC) + "/devices/" + DEVICE_CODE + "/telemetry";
  mqttClient.publish(topic.c_str(), buffer, len);
}

void publishStatus(const char* status) {
  if (!mqttClient.connected()) return;
  JsonDocument doc;
  doc["deviceCode"] = DEVICE_CODE;
  doc["status"] = status;
  doc["lastSeenAt"] = millis();
  char buffer[256];
  size_t len = serializeJson(doc, buffer, sizeof(buffer));
  String topic = String(BASE_TOPIC) + "/devices/" + DEVICE_CODE + "/status";
  mqttClient.publish(topic.c_str(), buffer, len, true);
}

bool parseDaysMatch(const String& daysOfWeek, const tm& now) {
  if (daysOfWeek == "daily") return true;
  String day = String(now.tm_wday);
  int start = 0;
  while (start < daysOfWeek.length()) {
    int comma = daysOfWeek.indexOf(',', start);
    String token = comma >= 0 ? daysOfWeek.substring(start, comma) : daysOfWeek.substring(start);
    token.trim();
    if (token == day) return true;
    if (comma < 0) break;
    start = comma + 1;
  }
  return false;
}

void clearReminders() {
  for (int i = 0; i < MAX_REMINDERS; i++) {
    reminders[i] = ReminderSlot();
  }
  reminderCount = 0;
}

void addReminder(const JsonObject& item) {
  if (reminderCount >= MAX_REMINDERS) return;
  ReminderSlot slot;
  slot.active = true;
  slot.id = item["id"] | "";
  slot.medicineName = item["medicineName"] | "Medicine";
  slot.dosage = item["dosage"] | "";
  slot.scheduledTime = item["scheduledTime"] | "00:00";
  slot.daysOfWeek = item["daysOfWeek"] | "daily";
  slot.enabled = item["isActive"] | true;
  reminders[reminderCount++] = slot;
}

void syncRemindersFromPayload(const JsonDocument& doc) {
  clearReminders();
  if (doc["reminders"].is<JsonArray>()) {
    for (JsonObject item : doc["reminders"].as<JsonArray>()) {
      addReminder(item);
    }
  } else if (doc["reminder"].is<JsonObject>()) {
    addReminder(doc["reminder"].as<JsonObject>());
  }
  latestReminderLabel = reminderCount > 0 ? reminders[0].medicineName : "No active reminder";
  setStatus("REMINDERS_SYNCED");
  publishStatus("online");
}

void handleCommand(const JsonDocument& doc) {
  const char* command = doc["command"] | "";
  if (strcmp(command, "sync_reminders") == 0) {
    syncRemindersFromPayload(doc);
    return;
  }
  if (strcmp(command, "trigger_alarm") == 0) {
    buzzerStart(2200, 3000);
    publishTelemetry("reminder_triggered", "Alarm triggered by backend command", "warning");
    return;
  }
  if (strcmp(command, "stop_alarm") == 0) {
    buzzerStop();
    return;
  }
  if (strcmp(command, "status_ping") == 0) {
    publishStatus("online");
    return;
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) return;
  handleCommand(doc);
}

void connectMqtt() {
  if (mqttClient.connected()) return;
  if (millis() - lastMqttReconnectAttempt < 5000) return;
  lastMqttReconnectAttempt = millis();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);

  String clientId = String("medcare-") + DEVICE_CODE + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  bool ok = MQTT_USER[0] == '\0'
    ? mqttClient.connect(clientId.c_str())
    : mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD);

  if (ok) {
    String commandTopic = String(BASE_TOPIC) + "/devices/" + DEVICE_CODE + "/commands";
    mqttClient.subscribe(commandTopic.c_str());
    publishStatus("online");
    setStatus("MQTT_CONNECTED");
  }
}

String formatTime(const tm& now) {
  char buffer[16];
  snprintf(buffer, sizeof(buffer), "%02d:%02d:%02d", now.tm_hour, now.tm_min, now.tm_sec);
  return String(buffer);
}

String formatDate(const tm& now) {
  char buffer[20];
  snprintf(buffer, sizeof(buffer), "%04d-%02d-%02d", now.tm_year + 1900, now.tm_mon + 1, now.tm_mday);
  return String(buffer);
}

bool getLocalNow(tm& out) {
  time_t raw = time(nullptr);
  if (raw < 1700000000) return false;
  localtime_r(&raw, &out);
  return true;
}

String nextReminderLabel(tm now) {
  int bestMinutes = 24 * 60;
  String label = "No upcoming reminder";
  for (int i = 0; i < reminderCount; i++) {
    if (!reminders[i].active || !reminders[i].enabled) continue;
    if (!parseDaysMatch(reminders[i].daysOfWeek, now)) continue;
    int hour = reminders[i].scheduledTime.substring(0, 2).toInt();
    int minute = reminders[i].scheduledTime.substring(3, 5).toInt();
    int currentMinutes = now.tm_hour * 60 + now.tm_min;
    int diff = (hour * 60 + minute) - currentMinutes;
    if (diff < 0) diff += 24 * 60;
    if (diff < bestMinutes) {
      bestMinutes = diff;
      label = reminders[i].medicineName + " " + reminders[i].scheduledTime;
    }
  }
  return label;
}

void triggerReminder(ReminderSlot& reminder, const tm& now) {
  reminder.lastTriggeredYDay = now.tm_yday;
  reminder.triggeredToday = true;
  buzzerStart(2400, 2500);
  latestReminderLabel = reminder.medicineName + " at " + reminder.scheduledTime;
  JsonDocument extra;
  extra["scheduledTime"] = reminder.scheduledTime;
  extra["medicineName"] = reminder.medicineName;
  extra["dosage"] = reminder.dosage;
  publishTelemetry("reminder_triggered", "Medicine reminder reached", "warning", extra.as<JsonObject>());
}

void scanReminders() {
  tm now;
  if (!getLocalNow(now)) return;
  if (now.tm_sec % 2 != 0) return;

  for (int i = 0; i < reminderCount; i++) {
    ReminderSlot& reminder = reminders[i];
    if (!reminder.active || !reminder.enabled) continue;
    if (!parseDaysMatch(reminder.daysOfWeek, now)) continue;

    int hour = reminder.scheduledTime.substring(0, 2).toInt();
    int minute = reminder.scheduledTime.substring(3, 5).toInt();
    if (now.tm_hour == hour && now.tm_min == minute && reminder.lastTriggeredYDay != now.tm_yday) {
      triggerReminder(reminder, now);
    }
  }
}

void readSensors() {
  bool motion = digitalRead(PIR_MOTION_PIN) == HIGH;
  bool interaction = digitalRead(PIR_INTERACTION_PIN) == HIGH;
  unsigned long now = millis();

  if (motion && !motionState && now - lastMotionPublish > 3000) {
    lastMotionPublish = now;
    JsonDocument extra;
    extra["source"] = "pir_motion";
    publishTelemetry("motion_detected", "Motion detected near medicine box", "warning", extra.as<JsonObject>());
  }

  if (interaction && !interactionState && now - lastInteractionPublish > 3000) {
    lastInteractionPublish = now;
    buzzerStart(1800, 1200);
    JsonDocument extra;
    extra["source"] = "pir_interaction";
    publishTelemetry("box_opened", "Medicine box interaction detected", "success", extra.as<JsonObject>());
  }

  motionState = motion;
  interactionState = interaction;
}

void renderDisplay() {
  tm now;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  if (getLocalNow(now)) {
    display.setTextSize(2);
    display.setCursor(0, 0);
    display.print(formatTime(now));
    display.setTextSize(1);
    display.setCursor(0, 24);
    display.print(formatDate(now));
    display.setCursor(0, 36);
    display.print("Status: ");
    display.print(currentStatus);
    display.setCursor(0, 48);
    display.print("Next: ");
    display.print(nextReminderLabel(now));
  } else {
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("MedCare Syncing Time");
    display.setCursor(0, 16);
    display.print("Waiting for NTP...");
    display.setCursor(0, 32);
    display.print(currentStatus);
  }

  display.display();
}

void setupDisplay() {
  Wire.begin();
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    while (true) {
      delay(1000);
    }
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("MedCare Booting...");
  display.display();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIR_MOTION_PIN, INPUT);
  pinMode(PIR_INTERACTION_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  setupDisplay();
  connectWifi();
  syncTimeNow();
  mqttClient.setBufferSize(1024);
  setStatus("STARTING");
}

void loop() {
  connectWifi();
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      connectMqtt();
    } else {
      mqttClient.loop();
    }
  }

  readSensors();
  scanReminders();

  if (millis() - lastClockRender >= 1000) {
    lastClockRender = millis();
    renderDisplay();
  }

  if (millis() - lastNtpSync > 30UL * 60UL * 1000UL) {
    syncTimeNow();
  }

  if (isBuzzerActive()) {
    if (millis() > buzzerOffAt) {
      buzzerStop();
    }
  }

  delay(10);
}
