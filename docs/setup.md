# Setup Guide

## 1. Install prerequisites

- Node.js 20+
- pnpm 9+
- Arduino IDE or PlatformIO
- MQTT broker such as Mosquitto
- Firebase project with Firestore and FCM enabled

## 2. Configure environment

- Copy `.env.example` to `.env`
- Fill backend values for MQTT, JWT, and Firebase credentials
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

## 8. Migrate existing local data to Firestore (one-time)

- Ensure Firebase service account env vars are configured for the backend
- Run `npm run migrate:json-to-firestore -w @medisync/server`
