# MedCare Android Wrapper

This is a thin WebView wrapper around the deployed MedCare web app.

## Before running

- Replace `app_url` in `app/src/main/res/values/strings.xml` with your production URL.
- Add `google-services.json` from your Firebase project to `app/`.
- Register the Android app in Firebase and enable FCM.

## Notes

- The wrapper intentionally avoids adding business logic.
- Push notifications are handled by Firebase Messaging in the wrapper.
- After login, the web app should register the caretaker's FCM token with the backend.
