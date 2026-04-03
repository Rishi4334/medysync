# Cloud Runbook (Free Tier, No Railway)

This runbook is the exact order to finish MedSync to production-ready cloud state.

## 0. Assumptions

- Repository root is `D:\medisync`
- You already ran `npm install`
- Backend build is green (`npm run build`)

## 1. Create Firebase project

1. Open Firebase Console and create a project.
2. Enable Firestore (production mode).
3. Enable Cloud Messaging.
4. Create a service account key JSON (Project Settings -> Service Accounts -> Generate new private key).
5. Keep the JSON file safe. Do not commit it.

## 2. Deploy Firestore security rules

1. Install Firebase CLI (once):

```bash
npm i -g firebase-tools
```

2. Login:

```bash
firebase login
```

3. In repository root, initialize (if not already):

```bash
firebase init firestore
```

4. Use these exact answers during init:

- Firestore Rules file: `firebase/firestore.rules`
- Firestore Indexes file: `firebase/firestore.indexes.json`

Do not use the same path for both rules and indexes.

5. Deploy rules:

```bash
firebase deploy --only firestore:rules
```

If rules were overwritten accidentally, restore these two files before deploy:

- `firebase/firestore.rules` (Firestore rules syntax)
- `firebase/firestore.indexes.json` (JSON indexes syntax)

## 3. Create HiveMQ Cloud broker (MQTT)

1. Create a free HiveMQ Cloud cluster.
2. Create credentials (username/password).
3. Copy broker endpoint and TLS port.
4. Decide your base topic (default `medcare`).

Expected backend vars:

- `MQTT_BROKER_URL` (example: `mqtts://<cluster>.s1.eu.hivemq.cloud:8883`)
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- `MQTT_BASE_TOPIC`

## 4. Prepare backend environment values

Fill `docs/cloud-values-to-fill.md` first. Then use those exact values in Render.

Important:

- Use a strong random `JWT_SECRET`.
- Set `CORS_ORIGIN` to your frontend production URL.
- Prefer `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON string in one env var).

## 5. Deploy backend to Render (free tier)

1. Create new Render Web Service from this repo.
2. Service root directory: `apps/server`.
3. Build command:

```bash
npm install; npm run build
```

4. Start command:

```bash
npm run start
```

5. Add env vars from section 4.
6. Deploy and copy backend URL, for example:

- `https://medisync-api.onrender.com`

7. Verify health endpoint:

```bash
curl https://<your-backend-url>/health
```

Expected: `{ "ok": true, "service": "medcare-backend" }`

## 6. Deploy frontend (Firebase Hosting recommended)

1. Set frontend API URL for build:

- `VITE_API_BASE_URL=https://<your-backend-url>`

2. Build frontend:

```bash
npm run build -w @medisync/web
```

3. Initialize Firebase Hosting if needed:

```bash
firebase init hosting
```

- Public directory: `apps/web/dist/public`
- Single-page app rewrite: Yes

4. Deploy hosting:

```bash
firebase deploy --only hosting
```

5. Copy frontend URL and set backend `CORS_ORIGIN` to that URL in Render.

## 7. Update Android wrapper

1. Put production web URL in Android string resources (WebView URL).
2. Add `google-services.json` in Android app module.
3. Build and test on device.
4. Confirm FCM token is generated and posted to backend endpoint.

## 8. Update ESP32 for cloud MQTT

1. Set cloud broker host/credentials in firmware.
2. If using TLS endpoint (`mqtts`), configure secure client and CA cert in firmware.
3. Flash firmware.
4. Verify backend receives:

- `medcare/devices/<deviceCode>/status`
- `medcare/devices/<deviceCode>/telemetry`
- `medcare/devices/<deviceCode>/events`

## 9. Final validation checklist

All must pass:

- Backend `/health` returns OK.
- Web login works in deployed frontend.
- CRUD works for users/patients/medicines/reminders.
- MQTT events appear in dashboard/events.
- Push notifications arrive via FCM.
- Android wrapper loads production web app.
- ESP32 publishes and receives command topics.

## 10. Remaining technical gap for true cloud durability

Current backend still uses file storage in `apps/server/src/store.ts`.

For true cloud production, migrate store methods to Firestore so state survives restarts and scaling.

If you want, I will perform this migration next in code.
