import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { Socket } from "socket.io-client";
import "xterm/css/xterm.css";

export default function TerminalWindow({ socket }: { socket: Socket | null }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current || !socket) return;

    // 1. Initialize Terminal & Addon
    const term = new Terminal({
      cursorBlink: true,
      theme: { 
        background: "#0d0d0d",
        foreground: "#cccccc",
        cursor: "#555555"
      },
      fontFamily: '"Cascadia Code", Menlo, monospace',
      fontSize: 13,
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    
    // Store refs for access in observers/socket listeners
    termInstance.current = term;
    fitAddonRef.current = fitAddon;

    // 2. The Robust Resize Logic
    // ResizeObserver ensures we only fit() when the element actually has dimensions
    const resizeObserver = new ResizeObserver(() => {
      if (terminalRef.current && terminalRef.current.offsetWidth > 0) {
        try {
          // Wrap in a microtask to ensure xterm has finished internal setup
          Promise.resolve().then(() => {
            fitAddon.fit();
            if (socket.connected) {
              socket.emit("terminal-resize", { 
                cols: term.cols, 
                rows: term.rows 
              });
            }
          });
        } catch (e) {
          console.warn("xterm fit prevented during container transition");
        }
      }
    });

    resizeObserver.observe(terminalRef.current);

    // 3. Socket Event Management
    const handleOutput = (data: string) => term.write(data);
    
    socket.on("terminal-output", handleOutput);
    
    const dataListener = term.onData(data => {
      if (socket.connected) {
        socket.emit("terminal-input", data);
      }
    });

    // Ensure socket connects/reconnects
    if (!socket.connected) {
      socket.connect();
    }

    // 4. Cleanup
    return () => {
      resizeObserver.disconnect();
      dataListener.dispose();
      socket.off("terminal-output", handleOutput);
      term.dispose();
      termInstance.current = null;
    };
  }, [socket]);

  return (
    <div className="h-full w-full bg-[#0d0d0d] overflow-hidden p-2">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}