# Execution Guide

## Run backend

```bash
pnpm dev:server
```

## Run web app

```bash
pnpm dev:web
```

## Deploy web app

- Build the web app with `pnpm --filter @medisync/web build`
- Deploy `apps/web/dist/public` to your hosting provider

## Connect ESP32

- Configure Wi-Fi and MQTT broker details in firmware
- Flash the device
- Verify the ESP32 subscribes to `medcare/devices/<deviceCode>/commands`

## Notification triggers

- Reminder time reached
- Motion detected via PIR
- Box interaction detected
