import { useState, useCallback, useEffect, useRef } from "react";
import { getSocket } from "../services/socket";
import { Socket } from "socket.io-client";

export function useTerminalSocket(userId?: string) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

  const toggleTerminal = useCallback(() => {
    setIsTerminalOpen((prev) => {
      const nextState = !prev;
      if (nextState) {
        setTimeout(() => {
          const textarea = document.querySelector(".xterm-helper-textarea") as HTMLTextAreaElement;
          textarea?.focus();
        }, 300);
      }
      return nextState;
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsConnected(false);
      return;
    }

    const s = getSocket(userId);
    socketRef.current = s;

    const onConnect = () => {
      console.log(`✅ Socket connected to Sandbox: ${userId}`);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected from Backend");
      setIsConnected(false);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    if (s.connected) setIsConnected(true);

    return () => {
      console.log("🧹 Cleaning up socket connection...");
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return { 
    isTerminalOpen, 
    toggleTerminal, 
    socket: socketRef.current,
    isConnected
  };
}