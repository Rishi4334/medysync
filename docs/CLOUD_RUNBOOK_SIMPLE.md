# MedCare Cloud Deployment Runbook

**This is the SIMPLE, step-by-step guide to deploy your app to the cloud.**

---

## BEFORE YOU START

**You need these (should already have):**

- ✅ Firebase project created
- ✅ HiveMQ Cloud broker created
- ✅ `.env` file with all values filled
- ✅ Git repository with all code

**Estimated time:** 1-2 hours (mostly waiting for services to start)

---

## WHAT EACH STEP DOES

| Step | What                         | Where         | Time   |
| ---- | ---------------------------- | ------------- | ------ |
| 1    | Backend API runs 24/7        | Render.com    | 15 min |
| 2    | Frontend web app loads       | Firebase      | 10 min |
| 3    | Frontend ↔ Backend connected | Config        | 5 min  |
| 4    | Android app updated          | Your code     | 15 min |
| 5    | ESP32 device updated         | Your firmware | 15 min |
| 6    | Everything tested            | Your computer | 30 min |

---

## ⚠️ SECURITY RULES - READ THIS FIRST

**YOUR APP IS NOW PUBLIC.** Anyone with the URL can access it.

**What can leak if you're not careful:**

- 🔴 Firebase private key (in `.env`)
- 🔴 JWT secret (in `.env`)
- 🔴 MQTT password (in `.env`)

**What WILL be committed to GitHub:**

- ✅ All source code
- ✅ Configuration files
- ✅ This documentation

**What WON'T be committed (git protects these):**

- ✅ `.env` file (has PRIVATE_KEY, passwords)
- ✅ `docs/cloud-values-to-fill.md` (has all secrets)
- ✅ Firebase service account JSON files

**To be safe, after deployment:**

1. Delete `docs/cloud-values-to-fill.md` from your local computer
2. Keep `apps/server/.env` private (never share it)

---

## STEP 1️⃣: Deploy Backend to Render

**What is Render?** It's a web server in the cloud. Your Node.js backend runs there.

**Why Render?** Free tier, easy to use, auto-deploys from GitHub.

### 1.1: Create Render Account

1. Go to **https://render.com**
2. Click "Sign up"
3. Use Google or GitHub login (recommended: GitHub)

### 1.2: Connect Your GitHub

1. In Render dashboard, click **"New Web Service"**
2. Click **"Build and deploy from a Git repository"**
3. Click **"Connect account"** next to GitHub
   - Authorize Render to access your GitHub
   - Select your `medisync` repository
4. You'll see your repo in the list

### 1.3: Configure the Backend Service

Fill in these fields exactly:

- **Name:** `medisync-api`
- **Repository:** `<your-username>/medisync`
- **Branch:** `main`
- **Root Directory:** `apps/server` ← Important!
- **Build Command:** `npm install; npm run build`
- **Start Command:** `npm run start`
- **Plan:** Free

### 1.4: Add Environment Variables

1. Click **"Environment"** tab
2. Add these variables (copy from `apps/server/.env`):

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
FIREBASE_SERVICE_ACCOUNT_JSON=<paste-the-full-JSON-string-here>
DEVICE_COMMAND_TTL_SECONDS=30
```

3. Click **"Save"**

### 1.5: Deploy

1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deploy to complete
3. You'll see:
   ```
   ✓ Build succeeded
   ✓ Service live at: https://medisync-api.onrender.com
   ```

### 1.6: Verify It Works

Open terminal and run:

```bash
curl https://medisync-api.onrender.com/health
```

You should see:

```json
{ "ok": true, "service": "medcare-backend" }
```

✅ **Backend is running!**

---

## STEP 2️⃣: Deploy Frontend to Firebase Hosting

**What is Firebase Hosting?** It serves your React web app (the clickable UI).

**Why Firebase?** Free tier, fast, integrates with Firebase services.

### 2.1: Build Frontend Locally

1. Open terminal in `d:\medisync`
2. Run:
   ```bash
   npm run build -w @medisync/web
   ```
3. Wait for it to finish (takes 1-2 minutes)
4. Check that this folder was created:
   ```
   apps/web/dist/public/
   ```

### 2.2: Initialize Firebase Hosting

1. In terminal (root folder), run:

   ```bash
   firebase init hosting
   ```

2. Answer the prompts:
   ```
   Which Firebase project? → medysync-cad1d
   What is your public directory? → apps/web/dist/public
   Configure as single-page app? → Yes
   ```

### 2.3: Deploy to Firebase

1. Run:

   ```bash
   firebase deploy --only hosting
   ```

2. Wait for deploy to complete
3. You'll see:
   ```
   ✓ Deployed to https://medysync-cad1d.web.app
   ✓ Deploy successful!
   ```

### 2.4: Verify Frontend Works

1. Open browser to: `https://medysync-cad1d.web.app`
2. You should see the **login page**
3. ✅ **Frontend is running!**

---

## STEP 3️⃣: Connect Frontend to Backend

**What's happening?** Your frontend needs to know where to find the backend API.

### 3.1: Update CORS on Render

1. Go to **Render dashboard** → `medisync-api` service
2. Click **"Environment"**
3. Find `CORS_ORIGIN`
4. Change it to:
   ```
   https://medysync-cad1d.web.app
   ```
5. Click **"Save"**
6. Render will auto-redeploy (wait 1-2 minutes)

### 3.2: Test Login

1. Go to frontend URL: `https://medysync-cad1d.web.app`
2. Try to login with test credentials
3. If it works, you see the dashboard
4. If it fails, check browser console for errors

✅ **Frontend ↔ Backend connected!**

---

## STEP 4️⃣: Update Android App (Optional)

**What is this?** Makes your web app work as a native Android app on phones.

### 4.1: Update Web URL

1. Open: `android/app/src/main/res/values/strings.xml`
2. Find: `<string name="web_view_url">`
3. Change to:
   ```xml
   <string name="web_view_url">https://medysync-cad1d.web.app</string>
   ```

### 4.2: Add Firebase Configuration

1. Download `google-services.json` from:
   - Google Cloud Console → Firebase → Your Project → Project Settings → Service Accounts
2. Place it in:
   ```
   android/app/google-services.json
   ```

### 4.3: Build APK

1. Open terminal in `android/` folder
2. Run:
   ```bash
   ./gradlew assembleRelease
   ```
3. Wait for build (5-10 minutes)
4. APK created at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

### 4.4: Install on Phone

1. Connect Android phone via USB
2. Enable Developer Mode on phone
3. Run:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```
4. Or manually copy APK to phone and tap to install

✅ **Android app installed!**

---

## STEP 5️⃣: Update ESP32 Firmware

**What is this?** Configures your ESP32 devices to send sensor data to the cloud.

### 5.1: Edit Firmware Configuration

1. Open your ESP32 firmware file (e.g., `firmware/esp32_mqtt_client.ino`)
2. Find MQTT configuration section:

   ```cpp
   const char* mqtt_broker = "broker.address";
   const int mqtt_port = 8883;
   const char* mqtt_user = "username";
   const char* mqtt_password = "password";
   ```

3. Replace with:
   ```cpp
   const char* mqtt_broker = "7024cefa43544220aa540998eaed6fc8.s1.eu.hivemq.cloud";
   const int mqtt_port = 8883;
   const char* mqtt_user = "MedySync";
   const char* mqtt_password = "MedySync@890";
   ```

### 5.2: Flash ESP32

1. Connect ESP32 to computer via USB
2. In Arduino IDE or PlatformIO:
   - Select board: ESP32
   - Select port: COM (check Device Manager)
   - Click "Upload"
3. Wait for flash to complete

### 5.3: Verify Device Connects

1. Open Serial Monitor (Arduino IDE)
2. Set baud rate to 115200
3. You should see:
   ```
   Connecting to MQTT...
   Connected to medcare MQTT broker
   Publishing to medcare/devices/<code>/status
   ```

✅ **ESP32 connected to cloud!**

---

## STEP 6️⃣: Final Testing

**Do all of these to confirm everything works:**

### 6.1: Health Check

```bash
curl https://medisync-api.onrender.com/health
# Expected: {"ok":true,"service":"medcare-backend"}
```

### 6.2: Frontend Login

1. Go to: `https://medysync-cad1d.web.app`
2. Login with test credentials
3. See dashboard load

### 6.3: Data CRUD

- ✅ Go to "Patients" → Can see patients
- ✅ Go to "Medicines" → Can see medicines
- ✅ Go to "Reminders" → Can see reminders
- ✅ Try creating something new

### 6.4: Device Communication

1. Check ESP32 is connected (LED indicator)
2. Go to "Devices" in dashboard
3. Your ESP32 should appear
4. Check "Events" page for device messages

### 6.5: Mobile App

1. Open Android app (if built)
2. You see the login page
3. Login works
4. All features work same as web

✅ **Everything works! You're done!**

---

## TROUBLESHOOTING

### Issue: "Cannot connect to backend" (CORS error)

**Cause:** Backend doesn't know frontend URL

**Fix:**

1. Go to Render → `medisync-api` → Environment
2. Check `CORS_ORIGIN` matches frontend URL exactly
3. Redeploy
4. Try again

### Issue: "Render deployment failed"

**Cause:** Code has errors

**Fix:**

1. Go to Render dashboard
2. Scroll to "Build & Deployment" section
3. Look at error messages
4. Run locally: `npm run build -w @medisync/server`
5. Fix errors, commit, push to GitHub
6. Render auto-redeploys

### Issue: "ESP32 won't connect to MQTT"

**Cause:** Wrong credentials or broker address

**Fix:**

1. Check credentials exactly match:
   - Address: `7024cefa43544220aa540998eaed6fc8.s1.eu.hivemq.cloud`
   - Port: `8883` (NOT 1883)
   - User: `MedySync`
   - Password: `MedySync@890`
2. Check internet connection on ESP32
3. Check firewall isn't blocking port 8883

### Issue: "Firebase deployment failed"

**Cause:** Public directory path is wrong

**Fix:**

```bash
firebase init hosting
# When asked "public directory?", enter: apps/web/dist/public
firebase deploy --only hosting
```

---

## WHAT TO COMMIT (AND WHAT NOT TO)

### ✅ Safe to Commit to GitHub:

```
ALL source code
docs/
firebase.json
.firebaserc
package.json
tsconfig.json
README.md
android/
firmware/
```

### 🔴 DO NOT Commit:

```
.env (git prevents this)
docs/cloud-values-to-fill.md (delete after deployment)
apps/server/.env (git prevents this)
android/google-services.json (contains credentials)
firebase/ (service account keys)
```

---

## NEXT STEPS (After Successful Deployment)

1. **Create real users** in your backend database
2. **Migrate real data** from test to Firebase
3. **Publish to Google Play Store** (for Android)
4. **Monitor uptime** (add monitoring service)
5. **Backup database** regularly
6. **Migrate file storage to Firestore** (for true durability)

---

## QUICK REFERENCE

| Service  | URL                                            | What It Does            |
| -------- | ---------------------------------------------- | ----------------------- |
| Backend  | `https://medisync-api.onrender.com`            | REST API, MQTT bridge   |
| Frontend | `https://medysync-cad1d.web.app`               | React web UI            |
| MQTT     | `mqtts://7024...cloud:8883`                    | Device communication    |
| Firebase | Console: `https://console.firebase.google.com` | Database, auth, hosting |
| Render   | Dashboard: `https://dashboard.render.com`      | Backend hosting         |

---

**Questions?** Check the detailed guide at `docs/CLEAR_DEPLOYMENT_GUIDE.md`

**Still stuck?** Review the checklist: `docs/DEPLOYMENT_CHECKLIST.md`
