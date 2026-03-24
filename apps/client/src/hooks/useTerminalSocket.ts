import { useState, useCallback, useEffect } from "react";
import { getSocket } from "../services/socket";
import { Socket } from "socket.io-client";

export function useTerminalSocket(userId?: string, machineId?: string) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const toggleTerminal = useCallback(() => {
    setIsTerminalOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!userId || !machineId || userId === "undefined") return;

    const s = getSocket(userId, machineId);
    if (!s) return;

    setSocket(s);

    const onConnect = () => {
      setIsConnected(true);
    };
    const onDisconnect = () => setIsConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    if (!s.connected) {
      s.connect();
    } else {
      setIsConnected(true);
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [userId, machineId]);

  return {
    isTerminalOpen,
    toggleTerminal,
    socket,
    isConnected,
  };
}
