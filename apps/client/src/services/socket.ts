import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (
  userId?: string,
  machineId?: string,
): Socket | null => {
  if (!userId || userId === "undefined" || !machineId) {
    return null;
  }

  const BASE_URL = "https://plinth.fly.dev";

  if (socket && (socket as any).machineId !== machineId) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    console.log(`🔌 Connecting to Machine: ${machineId}`);

    socket = io(BASE_URL, {
      withCredentials: true,
      transports: ["websocket"],
      forceNew: true,
      query: {
        userId,
        machineId,
        "fly-machine-id": machineId,
      },
      extraHeaders: {
        "fly-force-instance-id": machineId,
      },
    });

    socket.on("connect", () => {
      console.log("✅ Socket Connected! ID:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err.message);
      console.error("Details:", err);
    });

    socket.on("disconnect", (reason) => {
      console.warn("🔌 Socket Disconnected:", reason);
    });

    socket.on("terminal-output", (data) => {
      if (data.length > 0) {
        console.debug(`📥 Received ${data.length} bytes from PTY`);
      }
    });

    (socket as any).userId = userId;
    (socket as any).machineId = machineId;
  }

  return socket;
};
