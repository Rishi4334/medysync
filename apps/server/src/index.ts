import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./config.js";
import router from "./routes.js";
import { registerSocketServer } from "./realtime.js";
import { store } from "./store.js";
import { startMqttBridge } from "./mqtt.js";

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
  app.use("/api", router);

  io.on("connection", (socket) => {
    socket.emit("connected", { ok: true, service: "medcare-backend" });
  });

  server.listen(config.port, () => {
    console.log(`MedCare backend listening on http://localhost:${config.port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
