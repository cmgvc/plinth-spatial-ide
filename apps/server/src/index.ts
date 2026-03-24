import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import * as pty from "node-pty";
import os from "os";

import nodeRoutes from "./routes/nodeRoutes";
import flyRoutes from "./routes/flyRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://cmgvc.github.io", "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  },
  transports: ["websocket"], 
});

app.set("trust proxy", 1); 
app.use(cors({
  origin: ["https://cmgvc.github.io", "http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));
app.use(express.json());

app.get("/health", (req, res) => res.status(200).send("OK"));

app.use("/api/fly", flyRoutes); 
app.use("/api/nodes", nodeRoutes);
app.use("/api/users", userRoutes);

io.on("connection", (socket) => {
  const userId = String(socket.handshake.query.userId ?? "unknown");
  const terminalCwd = "/home/sandbox/workspace"; 

  console.log(`Terminal session started: ${userId}`);

  const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

  try {
    const ptyProcess = pty.spawn(shell, ["--login"], {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      cwd: terminalCwd,
      uid: 1000, 
      gid: 1000,
      env: { 
        ...process.env, 
        HOME: "/home/sandbox", 
        TERM: "xterm-256color",
        USER: "sandbox",
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        WORKSPACE: terminalCwd
      },
    });

    const startupTimeout = setTimeout(() => {
      try {
        ptyProcess.write("\n");
      } catch (e) {
        console.error("PTY Write Error during startup:", e);
      }
    }, 500);

    ptyProcess.onData((data) => {
      socket.emit("terminal-output", data);
    });

socket.on("terminal-input", (data) => {
      if (ptyProcess) {
        ptyProcess.write(data);
      }
    });

    socket.on("terminal-resize", (size) => {
      if (ptyProcess && size.cols > 0 && size.rows > 0) {
        try {
          ptyProcess.resize(size.cols, size.rows);
        } catch (e) {
          console.error("PTY Resize Error:", e);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Session Ended: ${userId}`);
      clearTimeout(startupTimeout);
      try {
        ptyProcess.kill();
      } catch (e) {
        // Process might already be dead
      }
    });

  } catch (err) {
    console.error("PTY Spawn Error:", err);
    socket.emit("terminal-output", "\r\n\x1b[31m[ERROR]: Failed to spawn sandbox shell.\x1b[0m\r\n");
  }
});

const PORT = process.env.PORT || 8080;
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Unified Backend active on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB Error:", err.message));