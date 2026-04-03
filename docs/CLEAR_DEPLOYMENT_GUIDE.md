# MedCare Production Deployment - Step by Step Guide

**Goal:** Deploy your healthcare app to the cloud so anyone can access it from anywhere.

**Status:**

- ✅ Backend code ready
- ✅ Frontend code ready (responsive)
- ✅ Firebase project created
- ✅ Firestore rules deployed
- 🟡 Cloud services deployment (IN PROGRESS)

---

## IMPORTANT: Security Warning ⚠️

**DO NOT COMMIT these files to github:**

- `docs/cloud-values-to-fill.md` (contains passwords and keys)
- `apps/server/.env` (contains secrets)
- Firebase service account JSON files

**Git already prevents this** (see `.gitignore`), but be careful NOT to override it.

---

## What We're Building

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Your Phone    │──────▶│  Firebase Hosting│──────▶│  Render Backend  │
│  (Web Browser)  │◀─────│  (React App)     │◀─────│  (Node.js API)   │
└─────────────────┘       └──────────────────┘       └──────────────────┘
                                                              │
                                                              ▼
                                          ┌──────────────────────────────┐
                                          │   HiveMQ Cloud MQTT Broker   │
                                          │   (Device Communication)     │
                                          └──────────────────────────────┘
                                                              ▲
                                          ┌───────────────────┘
                                          │
                          ┌───────────────┴──────────┐
                          │                          │
                    ┌─────▼────┐            ┌───────▼──┐
                    │  ESP32    │            │ Android  │
                    │ (Device)  │            │ Wrapper  │
                    └───────────┘            └──────────┘
```

---

## Step 1: Prepare Your Values (ALREADY DONE ✅)

You filled `docs/cloud-values-to-fill.md` with:

- ✅ HiveMQ MQTT credentials
- ✅ Firebase service account JSON
- ✅ JWT secret

**What I did:** Created `apps/server/.env` with these values (it's private, won't be committed).

---

## Step 2: Deploy Backend to Render (FREE TIER)

**What is Render?** A cloud server that runs your Node.js backend 24/7.

**Steps:**

1. **Open** https://render.com
2. **Sign up** (free account)
3. **Connect your GitHub repo**
   - Click "New Web Service"
   - Select your `medisync` repository
   - Authorize GitHub access

4. **Configure the service:**
   - **Name:** `medisync-api`
   - **Root Directory:** `apps/server` (tells Render where the backend code is)
   - **Build Command:** `npm install; npm run build`
   - **Start Command:** `npm run start`
   - **Plan:** Free (accepts)

5. **Add Environment Variables**
   - Click "Environment"
   - Copy ALL these from `apps/server/.env`:

   ```
   PORT=8080
   NODE_ENV=production
   CORS_ORIGIN=https://medysync-cad1d.web.app
   JWT_SECRET=8f9c2e6d4b7a1f93c5e8a2d0b6f4c9e7a1d3f5b8c2e6a9d0f7c4b1e8a2d6c9f3
   API_BASE_URL=https://medisync-api.onrender.com
   MQTT_BROKER_URL=mqtts://7024cefa43544220aa540998eaed6fc8.s1.eu.hivemq.cloud:8883
   MQTT_USERNAME=MedySync
   MQTT_PASSWORD=MedySync@890
   MQTT_BASE_TOPIC=medcare
   MQTT_CLIENT_ID=medcare-backend
   FIREBASE_PROJECT_ID=medysync-cad1d
   FIREBASE_SERVICE_ACCOUNT_JSON=<paste the full JSON>
   ```

6. **Deploy**
   - Click "Deploy Web Service"
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like: `https://medisync-api.onrender.com`

7. **Verify it's working:**
   ```bash
   curl https://medisync-api.onrender.com/health
   ```
   Expected response: `{"ok":true,"service":"medcare-backend"}`

**Save this URL** - you'll need it in the next step.

---

## Step 3: Deploy Frontend to Firebase Hosting

**What is Firebase Hosting?** Serves your React web app (the clickable UI).

**Steps:**

1. **Build the frontend locally** (on your computer):

   ```bash
   cd d:\medisync
   npm run build -w @medisync/web
   ```

   This creates `apps/web/dist/public/` folder.

2. **Deploy to Firebase:**

   ```bash
   # Login to Firebase (if not already)
   firebase login

   # Deploy frontend
   firebase deploy --only hosting
   ```

   You'll see a URL like: `https://medysync-cad1d.web.app`

**Save this URL** - everyone uses this to access the app.

---

## Step 4: Fix CORS (Connect Frontend ↔ Backend)

**What is CORS?** Security that lets your frontend talk to your backend.

**Steps:**

1. **Go back to Render**
   - Open your `medisync-api` service
   - Click "Environment"
   - Update `CORS_ORIGIN`:
     ```
     CORS_ORIGIN=https://medysync-cad1d.web.app
     ```
   - Click "Save Changes" → Auto-redeploy

2. **Test it works:**
   - Go to `https://medysync-cad1d.web.app`
   - Try to login
   - You should see the login form work

---

## Step 5: Update Android App (Optional but Recommended)

**What is this?** Makes your app available as a phone app (not just web).

**Steps:**

1. **Edit Android string:**
   - Open `android/app/src/main/res/values/strings.xml`
   - Find `<string name="web_view_url">`
   - Change to: `https://medysync-cad1d.web.app`

2. **Add Firebase config:**
   - Download `google-services.json` from Firebase Console
   - Put it in: `android/app/google-services.json`

3. **Build APK:**

   ```bash
   # In android folder
   ./gradlew assembleRelease
   ```

4. **Install on phone** and test

---

## Step 6: Update ESP32 Firmware (Device Communication)

**What is this?** Configures your ESP32 devices to send data to the cloud MQTT broker.

**Steps:**

1. **Edit firmware config:**
   - Open `firmware/esp32_mqtt_client.ino` (or your firmware file)
   - Find MQTT configuration:

   ```cpp
   const char* mqtt_broker = "7024cefa43544220aa540998eaed6fc8.s1.eu.hivemq.cloud";
   const int mqtt_port = 8883;
   const char* mqtt_user = "MedySync";
   const char* mqtt_password = "MedySync@890";
   ```

2. **Flash to ESP32:**
   - Connect ESP32 via USB
   - Use Arduino IDE or PlatformIO to upload

3. **Test:**
   - Check if ESP32 connects (LED indicator)
   - Device should appear in the backend

---

## Testing Checklist

Before telling anyone the app is ready, verify:

- [ ] Backend health check returns OK

  ```bash
  curl https://medisync-api.onrender.com/health
  ```

- [ ] Frontend loads at the URL
  - Open `https://medysync-cad1d.web.app`
  - You see login page

- [ ] Can login with test user
  - Email: `admin@medcare.com`
  - Password: (check your database)

- [ ] Dashboard loads with no errors
  - Check "Patients" list
  - Check "Medicines" list
  - Check "Reminders" list

- [ ] Mobile app works (if Android was built)
  - Install APK on phone
  - Opens to same web app

- [ ] Device communication works
  - ESP32 sends status to MQTT
  - Shows up in backend under "Devices"

---

## Troubleshooting

### "Backend not accessible/CORS error"

- Check `CORS_ORIGIN` in Render env matches frontend URL
- Redeploy backend after changing env

### "Firebase hosting shows old version"

- Run: `firebase deploy --only hosting` again
- Clear browser cache (Ctrl+Shift+Delete)

### "ESP32 won't connect to MQTT"

- Check broker URL has `:8883` (TLS port)
- Verify credentials in firmware
- Check internet connection on ESP32

### "Render deployment fails"

- Check Build Command output in Render dashboard
- Ensure `package.json` has correct scripts
- Check `npm run build` works locally first

---

## What's Next (After Testing)

1. **Real data migration** (currently uses test data)
2. **User authentication** setup (create real user accounts)
3. **Mobile app distribution** (Google Play Store)
4. **Monitoring** (uptime alerts, error tracking)

---

**Questions?** Check `docs/cloud-runbook.md` for more technical details.
