import { Server } from "socket.io";

let io: Server | null = null;

export function registerSocketServer(server: Server) {
  io = server;
}

export function emitRealtime(event: string, payload: unknown) {
  io?.emit(event, payload);
}
