import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { io, Socket } from "socket.io-client";
import "xterm/css/xterm.css";

export default function TerminalWindow() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!terminalRef.current || termInstance.current) return;
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#1a1a1a",
        foreground: "#d4d4d4",
        cursor: "#666666",
        selectionBackground: "#333333",
        blue: "#569cd6",
        green: "#6a9955",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    termInstance.current = term;

    const socket = io("http://localhost:5000", { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("terminal-resize", {
        cols: term.cols,
        rows: term.rows,
      });
    });

    socket.on("terminal-output", (data: string) => {
      term.write(data);
    });

    term.onData((data) => {
      if (socket.connected) {
        socket.emit("terminal-input", data);
      }
    });
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();

        if (term.cols > 0 && term.rows > 0) {
          socket.emit("terminal-resize", {
            cols: term.cols,
            rows: term.rows,
          });
        }
      } catch (e) {
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      socket.disconnect();
      term.dispose();
      termInstance.current = null;
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#1a1a1a] p-4">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}
