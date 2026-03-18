import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodeRoutes from "./routes/nodeRoutes";
import { Server } from "socket.io";
import http from "http";
import * as pty from "node-pty";
import os from "os";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI is not defined in your .env file.");
  process.exit(1);
}

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/nodes", nodeRoutes);

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => {
    console.error(
      "❌ MongoDB Connection Error. Check your Atlas IP Whitelist!",
    );
    console.error(`Reason: ${err.message}`);
  });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("👤 Socket connected - Spawning PTY...");

  const shell = process.platform === "win32" ? "powershell.exe" : "/bin/zsh";

  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: os.homedir(),
    env: { ...process.env, LANG: "en_US.UTF-8" },
  });

  ptyProcess.onData((data) => {
    socket.emit("terminal-output", data);
  });

  socket.on("terminal-input", (data) => {
    if (ptyProcess) {
      ptyProcess.write(data);
    }
  });

  socket.on("terminal-resize", ({ cols, rows }) => {
    if (ptyProcess && cols > 0 && rows > 0) {
      try {
        ptyProcess.resize(cols, rows);
      } catch (err) {
        console.error("PTY Resize Error:", err);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("👤 Socket disconnected - Killing PTY");
    ptyProcess.kill();
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
