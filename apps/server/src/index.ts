// @ts-ignore
import express from "express";
import cors from "cors";
import { createServer } from "http";
// @ts-ignore
import { Server } from "socket.io";
import { config } from "./config.js";
import router from "./routes.js";
import { registerSocketServer } from "./realtime.js";
import { store } from "./store.js";
import { startMqttBridge } from "./mqtt.js";
import { log } from "./logger.js";

async function main() {
  await store.init();
  await startMqttBridge();

  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
  });
  registerSocketServer(io);

  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use((req: any, res: any, next: any) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      log.info("HTTP request", {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });
    next();
  });
  app.use("/api", router);

  io.on("connection", (socket: any) => {
    log.info("Socket connected", { socketId: socket.id });
    socket.emit("connected", { ok: true, service: "medcare-backend" });
    socket.on("disconnect", (reason: any) => {
      log.info("Socket disconnected", { socketId: socket.id, reason });
    });
  });

  server.listen(config.port, () => {
    log.info("MedCare backend started", {
      port: config.port,
      corsOrigin: config.corsOrigin,
      mqttBaseTopic: config.mqttBaseTopic,
      usingFirebase: Boolean(config.firebaseServiceAccountJson || (config.firebaseClientEmail && config.firebasePrivateKey)),
    });
  });
}

main().catch((error) => {
  log.error("Fatal startup error", { error: String(error) });
  process.exit(1);
});
