# MedSync Health Care Ecosystem

Production-focused monorepo for a medicine reminder and patient-care platform.

## What is included

- React web app using the exact frontend structure you provided
- Node.js backend with REST, MQTT bridge, Socket.IO realtime events, and Firebase Admin push support
- Android WebView wrapper
- ESP32 Arduino firmware for the smart medicine box
- Firebase security rules and MQTT broker config

## Main flow

1. Admin or caretaker creates users, assignments, medicines, and reminders in the web app.
2. Backend stores the state, publishes reminder sync payloads through MQTT, and pushes realtime events to the UI.
3. ESP32 subscribes to device commands, keeps accurate time through NTP, and reports PIR/buzzer/display events.
4. Firebase Cloud Messaging notifies caretakers on reminder, motion, and box interaction events.

## Recommended stack choices

- ESP32 firmware: Arduino C++
- Device comms: MQTT
- Realtime UI: Socket.IO + React Query invalidation
- Notifications: Firebase Cloud Messaging
- Database: Firebase Firestore in production

## Important note about the frontend

The UI here preserves the structure and visual direction from the frontend you attached. Do not replace it with a different template unless you intentionally want a redesign.

## Finish to 100% (cloud)

- Step-by-step runbook: `docs/cloud-runbook.md`
- Values you need to fill and share: `docs/cloud-values-to-fill.md`
