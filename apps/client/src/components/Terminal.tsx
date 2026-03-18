import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { getSocket } from "../services/socket";
import "xterm/css/xterm.css";

export default function TerminalWindow() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current || termInstance.current) return;
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#0d0d0d",
        foreground: "#d4d4d4",
        cursor: "#666666",
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    const initTimeout = setTimeout(() => {
      if (terminalRef.current) {
        term.open(terminalRef.current);
        fitAddon.fit();
        term.focus();
        socket.emit("terminal:input", "\n");
      }
    }, 150);

    termInstance.current = term;
    const socket = getSocket();

    const handleOutput = (data: string) => {
      term.write(data);
    };

    socket.on("terminal-output", handleOutput);
    socket.emit("terminal-resize", {
      cols: term.cols,
      rows: term.rows,
    });
    term.onData((data) => {
      if (socket.connected) {
        socket.emit("terminal:input", data);
      }
    });
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        if (term.cols > 0 && term.rows > 0 && socket.connected) {
          socket.emit("terminal-resize", {
            cols: term.cols,
            rows: term.rows,
          });
        }
      } catch (e) {}
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      clearTimeout(initTimeout);
      resizeObserver.disconnect();
      socket.off("terminal-output", handleOutput);
      term.dispose();
      termInstance.current = null;
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#0d0d0d] p-2">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}
