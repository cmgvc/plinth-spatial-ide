import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (userId?: string): Socket => {
  if (socket && userId && socket.io.opts.query?.userId !== userId) {
    console.log("🔄 User ID changed, reconnecting socket...");
    socket.disconnect();
    socket = null;
  }
  if (!socket) {
    socket = io("http://localhost:5001", {
      withCredentials: true,
      transports: ["websocket"],
      query: { userId },
    });
    socket.on("connect", () => {
      console.log(`🔌 Connected as ${userId || "guest"}`);
    });
    socket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err.message);
    });
  }
  return socket;
};