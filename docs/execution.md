# Execution Guide

## Run backend

```bash
npm run dev:server
```

## Run web app

```bash
npm run dev:web
```

## Deploy web app

- Build the web app with `npm run build -w @medisync/web`
- Deploy `apps/web/dist/public` to your hosting provider

## Connect ESP32

- Configure Wi-Fi and MQTT broker details in firmware
- Flash the device
- Verify the ESP32 subscribes to `medcare/devices/<deviceCode>/commands`

## Android wrapper

- Point the WebView to the deployed web URL
- Install Firebase configuration for push notifications
- Publish the APK from Android Studio

## Notification triggers

- Reminder time reached
- Motion detected via PIR
- Box interaction detected

## Cloud deployment path (free tier)

1. Create Firebase project and enable Firestore + FCM.
2. Create HiveMQ Cloud free broker and copy URL/username/password.
3. Deploy backend (`apps/server`) to Render free web service.
4. Set backend environment variables from `.env.example`.
5. Set `VITE_API_BASE_URL` for frontend build to your backend URL.
6. Deploy frontend static build to Firebase Hosting or another static host.
7. Update ESP32 MQTT settings to cloud broker and verify telemetry/events.

Use `docs/cloud-runbook.md` for the exact command-by-command sequence.
