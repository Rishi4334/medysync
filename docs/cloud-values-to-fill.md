# Cloud Values To Fill

Fill this file and send the values back (or paste masked versions). I will then verify final config and commands.

## Backend URL plan

- BACKEND_PUBLIC_URL =
- FRONTEND_PUBLIC_URL =

## Security

- JWT_SECRET = 8f9c2e6d4b7a1f93c5e8a2d0b6f4c9e7a1d3f5b8c2e6a9d0f7c4b1e8a2d6c9f3

## CORS

- CORS_ORIGIN =

## MQTT (HiveMQ Cloud)

- MQTT_BROKER_URL =
- MQTT_USERNAME =
- MQTT_PASSWORD =
- MQTT_BASE_TOPIC = medcare
- MQTT_CLIENT_ID = medcare-backend

## Firebase

- FIREBASE_PROJECT_ID =
- FIREBASE_DATABASE_URL =
- FIREBASE_STORAGE_BUCKET =
- FIREBASE_SERVICE_ACCOUNT_JSON =

Alternative (use only if not using SERVICE_ACCOUNT_JSON):

- FIREBASE_CLIENT_EMAIL =
- FIREBASE_PRIVATE_KEY =

## Frontend build env

- VITE_API_BASE_URL =
- VITE_APP_NAME = MedCare

## Optional tuning

- DEVICE_COMMAND_TTL_SECONDS = 30

## Confirmation items

- Firestore rules deployed? (yes/no):
- Backend deployed on Render? (yes/no):
- Frontend deployed? (yes/no):
- ESP32 flashed with cloud MQTT config? (yes/no):
