import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// FORCE THE CLOUD ENGINE ALWAYS
const SOCKET_URL = "https://plinth.fly.dev";

export const getSocket = (
  userId?: string,
): Socket => {
  if (!userId || userId === "undefined") {
    throw new Error("Socket requires a valid User ID.");
  }

  // Handle User Swapping (Critical for multi-user or logout/login)
  if (
    socket &&
    (socket as any).userId !== userId
  ) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    console.log(`🌐 Connecting to Fly.io Engine: ${SOCKET_URL}`);
    
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"], 
      query: { userId },
      reconnection: true,
      reconnectionDelay: 2000,    // Don't spam Fly.io while it's booting
      reconnectionAttempts: 50,   // High attempts because boot-up can take 20s
      timeout: 60000,             // 1 minute timeout for slow machine starts
      autoConnect: false        
    });

    (socket as any).userId = userId; // Store for the swap check

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket connecting... (Engine might be waking up)");
    });

    socket.on("connect", () => {
      console.log(`🚀 Connected to Cloud Engine: ${socket?.id}`);
    });
  }

  return socket;
};