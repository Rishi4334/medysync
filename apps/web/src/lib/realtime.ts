import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "http://localhost:8080";

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(API_BASE_URL, { transports: ["websocket"] });

    const invalidateAll = async () => {
      await queryClient.invalidateQueries();
    };

    socket.on("connected", invalidateAll);
    socket.on("user.created", invalidateAll);
    socket.on("user.updated", invalidateAll);
    socket.on("user.deleted", invalidateAll);
    socket.on("assignment.created", invalidateAll);
    socket.on("assignment.deleted", invalidateAll);
    socket.on("medicine.created", invalidateAll);
    socket.on("medicine.deleted", invalidateAll);
    socket.on("reminder.created", invalidateAll);
    socket.on("reminder.updated", invalidateAll);
    socket.on("reminder.deleted", invalidateAll);
    socket.on("event.created", invalidateAll);
    socket.on("device.created", invalidateAll);
    socket.on("device.updated", invalidateAll);
    socket.on("adherence.created", invalidateAll);

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}
