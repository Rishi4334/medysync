# Setup Guide

## 1. Install prerequisites

- Node.js 20+
- npm 10+
- Android Studio
- Arduino IDE or PlatformIO
- Firebase project with Firestore and FCM enabled
- HiveMQ Cloud account (free tier) for managed MQTT broker
- Render account (free tier) for backend deployment

## 2. Configure environment

- Copy `.env.example` to `.env`
- Fill backend values for MQTT, JWT, and Firebase credentials
- Set the deployed web URL in `android/MedCareWrapper/app/src/main/res/values/strings.xml`
- Update Wi-Fi and MQTT values in `firmware/esp32-smart-box/esp32-smart-box.ino`

## 3. Install dependencies

- Run `npm install` from the repository root

## 4. Start local MQTT broker

- Run `docker compose up -d`

## 5. Start the backend

- Run `npm run dev:server`

## 6. Start the web app

- Run `npm run dev:web`

## 7. Flash ESP32

- Open `firmware/esp32-smart-box/esp32-smart-box.ino` in Arduino IDE or PlatformIO
- Install the listed libraries
- Flash to the ESP32

## 8. Open Android wrapper

- Open `android/MedCareWrapper` in Android Studio
- Sync Gradle
- Add your `google-services.json`
- Build and run on device
