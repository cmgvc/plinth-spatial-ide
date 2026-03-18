import { useState, useCallback, useEffect } from "react";
import { getSocket } from "../services/socket";
import { Socket } from "socket.io-client";

export function useTerminalSocket(userId?: string) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
      setSocket(null);
      setIsConnected(false);
      return;
    }
    const s = getSocket(userId);
    setSocket(s);

    const onConnect = () => {
      console.log(`Connected to Sandbox as: ${userId}`);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("Socket Disconnected");
      setIsConnected(false);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    if (s.connected) setIsConnected(true);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [userId]);

  return { 
    isTerminalOpen, 
    toggleTerminal, 
    socket,
    isConnected
  };
}