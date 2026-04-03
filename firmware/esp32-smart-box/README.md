# ESP32 Smart Medicine Box

This firmware uses Arduino C++ with MQTT, NTP, PIR sensors, a buzzer, and an SSD1306 OLED display.

## Why Arduino C++ over MicroPython

- Better timing predictability for real-time display updates
- Stronger support for MQTT and display libraries
- Lower runtime overhead for continuous sensor monitoring
- Easier to keep the clock update loop non-blocking

## Libraries

- PubSubClient
- ArduinoJson
- Adafruit SSD1306
- Adafruit GFX Library

## Wiring

- PIR motion sensor -> GPIO 27
- PIR interaction sensor -> GPIO 26
- Passive buzzer -> GPIO 25
- OLED SDA/SCL -> default ESP32 I2C pins

## MQTT topics

- Subscribe: `medcare/devices/ESP32-001/commands`
- Publish telemetry: `medcare/devices/ESP32-001/telemetry`
- Publish status: `medcare/devices/ESP32-001/status`

## Sync payload

Send a command like:

```json
{
  "command": "sync_reminders",
  "reminders": [
    {
      "id": 1,
      "medicineName": "Metformin",
      "dosage": "500mg",
      "scheduledTime": "08:00",
      "daysOfWeek": "daily",
      "isActive": true
    }
  ]
}
```

## Setup steps

1. Install Arduino IDE or PlatformIO.
2. Install the listed libraries.
3. Update Wi-Fi and MQTT credentials in `esp32-smart-box.ino`.
4. Adjust the timezone offset if you are outside IST.
5. Flash the firmware and open the serial monitor at 115200.
