import { useEffect, useRef } from "react";
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

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#0d0d0d",
        foreground: "#cccccc",
        cursor: "#555555",
      },
      fontFamily: '"Cascadia Code", Menlo, monospace',
      fontSize: 13,
      allowProposedApi: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    termInstance.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      if (!terminalRef.current || terminalRef.current.offsetWidth === 0) return;
      fitAddon.fit();
      if (socket.connected) {
        socket.emit("terminal-resize", { cols: term.cols, rows: term.rows });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(handleResize);
    });
    resizeObserver.observe(terminalRef.current);

    const handleOutput = (data: string) => {
      term.write(data);
    };

    const handleConnect = () => {
      term.write(
        "\r\n\x1b[32m[SYSTEM]: Terminal Engine Link Established...\x1b[0m\r\n",
      );
      handleResize();
      setTimeout(() => {
        socket.emit("terminal-input", "\n");
      }, 300);
    };

    socket.on("terminal-output", handleOutput);
    socket.on("connect", handleConnect);

    if (socket.connected) {
      handleConnect();
    }

    const dataListener = term.onData((data) => {
      if (socket.connected) {
        socket.emit("terminal-input", data);
      }
    });

    setTimeout(() => {
      handleResize();
      term.focus();
    }, 100);

    return () => {
      resizeObserver.disconnect();
      dataListener.dispose();
      socket.off("terminal-output", handleOutput);
      socket.off("connect", handleConnect);
      term.dispose();
      termInstance.current = null;
    };
  }, [socket]);

  return (
    <div
      className="h-full w-full bg-[#0d0d0d] overflow-hidden p-2"
      onClick={() => termInstance.current?.focus()}
    >
      <div ref={terminalRef} className="h-full w-full min-h-[200px]" />
    </div>
  );
}
