# System Architecture

```mermaid
flowchart LR
  subgraph UI[Web / Android]
    Web[React Web App]
    Android[Android WebView Wrapper]
  end

  subgraph Cloud[Backend + Firebase]
    API[Node.js API]
    MQTT[MQTT Broker]
    DB[Firebase Firestore]
    FCM[Firebase Cloud Messaging]
    RT[Socket.IO Realtime]
  end

  subgraph Device[Smart Medicine Box]
    ESP32[ESP32 Arduino Firmware]
    PIR1[PIR Motion Sensor]
    PIR2[PIR Interaction Sensor]
    Buzzer[Passive Buzzer]
    Disp[OLED/LCD Display]
  end

  Web --> API
  Android --> Web
  API <--> DB
  API <--> MQTT
  API <--> FCM
  API <--> RT
  MQTT <--> ESP32
  ESP32 --> PIR1
  ESP32 --> PIR2
  ESP32 --> Buzzer
  ESP32 --> Disp
  ESP32 --> API
```

## Data flow

- Web app writes schedules, users, assignments, and devices.
- Backend persists the state and publishes reminder sync payloads over MQTT.
- ESP32 receives schedule updates, maintains the clock locally, and triggers buzzer/display updates immediately.
- PIR events and box interactions flow back to the backend through MQTT.
- Backend writes events into Firebase and broadcasts realtime updates to the web app.
- FCM sends alerts to caretaker Android devices even when the app is closed.
