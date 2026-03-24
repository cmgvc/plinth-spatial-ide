import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import * as pty from "node-pty";
import os from "os";
import cors from "cors";

const app = express();

app.use(cors({
  origin: [
    "https://cmgvc.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  allowedHeaders: ["Content-Type", "Authorization", "fly-force-instance-id"],
  credentials: true,
}));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://cmgvc.github.io", "http://localhost:5173"],
    credentials: true,
  },
  transports: ["websocket"],
});

app.get("/health", (req, res) => res.status(200).send("OK"));

io.on("connection", (socket) => {
  const userId = String(socket.handshake.query.userId ?? "unknown");
  
  const terminalCwd = "/home/sandbox/workspace";

  console.log(`👤 User Connected to Persistent Sandbox: ${userId}`);

  const shell = os.platform() === "win32" ? "powershell.exe" : "/bin/bash";

  const ptyProcess = pty.spawn(shell, ["--login"], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: terminalCwd,
    env: { 
      ...process.env, 
      USER_ID: userId,
      HOME: terminalCwd, 
      TERM: "xterm-256color"
    },
  });

  const dataSubscription = ptyProcess.onData((data) => {
    socket.emit("terminal-output", data);
  });

  socket.on("terminal-input", (data) => {
    if (ptyProcess) ptyProcess.write(data);
  });

  socket.on("terminal-resize", (size) => {
    if (ptyProcess && size.cols && size.rows) {
      try {
        ptyProcess.resize(size.cols, size.rows);
      } catch (e) {
        console.warn("PTY Resize failed");
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Session Ended: ${userId}`);
    dataSubscription.dispose();
    
    ptyProcess.kill();
  });
});

const PORT = 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Engine active on ${PORT}`);
});