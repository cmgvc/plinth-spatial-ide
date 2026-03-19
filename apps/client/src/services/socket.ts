import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const getSocket = (userId?: string): Socket => {
  if (socket && userId && socket.io.opts.query?.userId !== userId) {
    console.log("User ID changed, reconnecting socket...");
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
      query: { userId },
    });

    socket.on("connect", () => {
      console.log(`Connected to ${SOCKET_URL} as ${userId || "guest"}`);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err.message);
    });
  }

  return socket;
};
