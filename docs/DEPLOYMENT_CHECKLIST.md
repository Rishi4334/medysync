# MedCare Deployment Checklist

Track your progress deploying MedCare to the cloud.

---

## Phase 1: Preparation ✅

- [x] Backend code ready (build passes)
- [x] Frontend code ready (responsive)
- [x] Firebase project created
- [x] Firestore rules deployed
- [x] HiveMQ Cloud broker created
- [x] Values filled in `docs/cloud-values-to-fill.md`
- [x] `.env` file created with production values

---

## Phase 2: Backend Deployment (IN PROGRESS)

### Deploy to Render

- [ ] **Render account created**
  - Go to https://render.com
  - Sign up

- [ ] **GitHub connected to Render**
  - Go to Render dashboard
  - Click "Connect GitHub"
  - Select `medisync` repository

- [ ] **Web Service created**
  - Name: `medisync-api`
  - Root Directory: `apps/server`
  - Build: `npm install; npm run build`
  - Start: `npm run start`

- [ ] **Environment variables added**

  ```
  PORT=8080
  NODE_ENV=production
  CORS_ORIGIN=<frontend-url-here>
  JWT_SECRET=8f9c2e6d4b7a1f93c5e8a2d0b6f4c9e7a1d3f5b8c2e6a9d0f7c4b1e8a2d6c9f3
  API_BASE_URL=https://medisync-api.onrender.com
  MQTT_BROKER_URL=mqtts://7024cefa43544220aa540998eaed6fc8.s1.eu.hivemq.cloud:8883
  MQTT_USERNAME=MedySync
  MQTT_PASSWORD=MedySync@890
  MQTT_BASE_TOPIC=medcare
  MQTT_CLIENT_ID=medcare-backend
  FIREBASE_PROJECT_ID=medysync-cad1d
  FIREBASE_SERVICE_ACCOUNT_JSON=<full-json-here>
  ```

- [ ] **Deployment started**
  - Take note of backend URL: ************\_\_\_************

- [ ] **Health check passes**
  ```bash
  curl https://<your-backend-url>/health
  # Should return: {"ok":true,"service":"medcare-backend"}
  ```

---

## Phase 3: Frontend Deployment

### Build Frontend

- [ ] **Build locally**
  ```bash
  npm run build -w @medisync/web
  ```
  Output folder: `apps/web/dist/public/`

### Deploy to Firebase Hosting

- [ ] **Firebase Hosting initialized**

  ```bash
  firebase init hosting
  # Public directory: apps/web/dist/public
  # Single-page app rewrite: Yes
  ```

- [ ] **Deployed to Firebase**

  ```bash
  firebase deploy --only hosting
  ```

  Frontend URL: ************\_\_\_************

- [ ] **Frontend loads**
  - Visit the URL in browser
  - See login page

---

## Phase 4: Connect Frontend ↔ Backend

### Fix CORS

- [ ] **Update Render environment**
  - Go to Render dashboard → `medisync-api`
  - Add/Update: `CORS_ORIGIN=<frontend-url>`
  - Save (auto-redeploy)

- [ ] **Test login works**
  - Go to frontend URL
  - Try login
  - Should not get CORS error

---

## Phase 5: Device Integration

### Android App

- [ ] **Update WebView URL**
  - Edit `android/app/src/main/res/values/strings.xml`
  - Set `web_view_url` to frontend URL

- [ ] **Add Firebase config**
  - Download `google-services.json` from Firebase
  - Put in `android/app/google-services.json`

- [ ] **Build APK**

  ```bash
  cd android && ./gradlew assembleRelease
  ```

- [ ] **Installed on test phone**
  - APK file: ************\_\_\_************
  - Test user: ************\_\_\_************

### ESP32 Firmware

- [ ] **Update MQTT config**
  - Edit firmware file
  - Set broker: `7024cefa43544220aa540998eaed6fc8.s1.eu.hivemq.cloud:8883`
  - Set username: `MedySync`
  - Set password: `MedySync@890`

- [ ] **Flashed to device**
  - Device ID/Code: ************\_\_\_************
  - COM Port: ************\_\_\_************

---

## Phase 6: Final Validation

### Smoke Tests (Must All Pass)

- [ ] Backend `/health` endpoint works
- [ ] Frontend loads at production URL
- [ ] Can login with test credentials
- [ ] Dashboard page displays without errors
- [ ] Can view Patients list
- [ ] Can view Medicines list
- [ ] Can view Reminders list
- [ ] Mobile app (Android) launches and shows web app
- [ ] ESP32 device connects and sends data
- [ ] Device status appears in backend
- [ ] Push notifications work (if set up)

### Sign-Off

- **Deployment Status:** [ ] Ready for Production / [ ] Needs Fixes
- **Date:** ************\_\_\_************
- **Notes:** ************\_\_\_************

---

## Troubleshooting & Notes

### Issue 1:

**Problem:** ************\_\_\_************
**Solution Tried:** ************\_\_\_************
**Result:** ************\_\_\_************

### Issue 2:

**Problem:** ************\_\_\_************
**Solution Tried:** ************\_\_\_************
**Result:** ************\_\_\_************

---

## Useful Commands

```bash
# Check backend health
curl https://<backend-url>/health

# View Render logs
# (Go to Render dashboard, select service, scroll to Logs)

# Redeploy backend if env changed
# (Go to Render dashboard, select service, click Manual Deploy)

# Check local build
npm run build -w @medisync/web

# Firebase deployment
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## Keep This Private!

**DO NOT COMMIT:**

- `.env` files (git will ignore automatically)
- `docs/cloud-values-to-fill.md` (contains secrets)
- Firebase JSON key files

**DO COMMIT:**

- All source code
- `docs/` files (except values file)
- `firebase.json` config
- Deployment docs

---

**Questions?** See `docs/CLEAR_DEPLOYMENT_GUIDE.md` for detailed steps.
