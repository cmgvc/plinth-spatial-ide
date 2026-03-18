import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodeRoutes from "./routes/nodeRoutes";
import { Server } from "socket.io";
import http from "http";
import Docker from "dockerode";
import cron from "node-cron";
import userRoutes from "./routes/userRoutes";
import { cleanupAbandonedVolumes } from "./services/janitor";
import { User } from "./models/User";

dotenv.config();

const app = express();
const server = http.createServer(app);

const isMac = process.platform === "darwin";
const dockerSocket = isMac
  ? "/Users/chloe/.docker/run/docker.sock"
  : "/var/run/docker.sock";

const docker = new Docker({ socketPath: dockerSocket });
const PORT = process.env.PORT || 5001;

let activeContainers = 0;
const MAX_FREE_CONCURRENCY = 5;
const SESSION_TIMEOUT = 30 * 60 * 1000;

cron.schedule("0 0 * * *", () => {
  cleanupAbandonedVolumes();
});

app.use(cors({
  origin: [
    'https://cmgvc.github.io',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use("/api/nodes", nodeRoutes);
app.use("/api/users", userRoutes);

mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("Connected to MongoDB");
    mongoose.connection.collections['nodes'].dropIndex('id_1')
      .catch(() => console.log("Old index id_1 not found, skipping."));
  })
  .catch((err) => console.error("MongoDB Error:", err.message));

const io = new Server(server, {
  cors: {
    origin: ["https://cmgvc.github.io", "http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId as string;
  let inactivityTimer: NodeJS.Timeout;
  let container: any = null;
  let hasIncremented = false;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.log("Connection rejected: Invalid User ID");
    return socket.disconnect();
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      socket.emit("terminal-output", "\r\n\x1b[31m[Error: User profile not found]\x1b[0m\r\n");
      return socket.disconnect();
    }

    // Search for existing container owned by this user before creating a new one
    const existing = await docker.listContainers({
      all: true,
      filters: { label: [`owner=${userId}`] }
    });

    for (const containerInfo of existing) {
      console.log(`Cleaning up ghost container for ${user.username}`);
      const ghost = docker.getContainer(containerInfo.Id);
      try {
        await ghost.stop({ t: 0 }); // Stop immediately
        await ghost.remove();
        if (activeContainers > 0) activeContainers--;
      } catch (e) {
        console.error("Ghost cleanup failed", e);
      }
    }

    // Re-check capacity after ghost cleanup
    if (activeContainers >= MAX_FREE_CONCURRENCY && !user.isPro) {
      socket.emit("terminal-output", "\r\n\x1b[33m[Server at capacity. Upgrade to Pro for instant access!]\x1b[0m\r\n");
      return socket.disconnect();
    }

    const memLimit = user.isPro ? 2048 * 1024 * 1024 : 1024 * 1024 * 1024;
    const cpuLimit = user.isPro ? 2000000000 : 1000000000;

    activeContainers++;
    hasIncremented = true;
    const userVolume = user.workspaceVolume;
    
    console.log(`User ${user.username} connected (${activeContainers}/${MAX_FREE_CONCURRENCY})`);

    await docker.createVolume({ Name: userVolume as string }).catch(() => {});

    container = await docker.createContainer({
      Image: "plinth-sandbox-node",
      Labels: { owner: userId },
      Tty: true,
      OpenStdin: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Cmd: ["/bin/sh"],
      WorkingDir: "/home/workspace",
      HostConfig: {
        Binds: [`${userVolume}:/home/workspace`],
        Memory: memLimit,
        MemorySwap: memLimit * 2,
        NanoCpus: cpuLimit,
      },
    });

    await container.start();

    // Bandwidth throttle
    try {
      const netLimitExec = await container.exec({
        Cmd: ["sh", "-c", "tc qdisc add dev eth0 root tbf rate 5mbit burst 32kbit latency 400ms"],
        AttachStdout: true,
        AttachStderr: true,
      });
      await netLimitExec.start({});
    } catch (e) {
      console.error("TC Limit Failed", e);
    }

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        socket.emit("terminal-output", "\r\n\x1b[33m[Session timed out after 30m of inactivity]\x1b[0m\r\n");
        socket.disconnect();
      }, SESSION_TIMEOUT);
    };

    const stream = await container.attach({
      stream: true, stdin: true, stdout: true, stderr: true, hijack: true,
    });

    socket.emit("container-ready");
    resetTimer();

    stream.on("data", (chunk: any) => {
      socket.emit("terminal-output", chunk.toString());
    });

    socket.on("terminal:input", (data) => {
      resetTimer();
      if (stream && (stream as any).writable) stream.write(Buffer.from(data));
    });

    socket.on("file-save", ({ fileName, content, isBase64 }) => {
      resetTimer();
      if (stream && (stream as any).writable) {
        const command = isBase64
          ? `mkdir -p "$(dirname "${fileName}")" && echo "${content}" | base64 -d > "${fileName}"\n`
          : `mkdir -p "$(dirname "${fileName}")" && cat << 'EOF' > "${fileName}"\n${content}\nEOF\n`;
        stream.write(Buffer.from(command));
      }
    });

    socket.on("terminal-resize", ({ cols, rows }) => {
      container.resize({ h: rows, w: cols }).catch(() => {});
    });

    socket.on("disconnect", async () => {
      if (hasIncremented) {
        activeContainers = Math.max(0, activeContainers - 1);
        hasIncremented = false;
      }
      clearTimeout(inactivityTimer);

      if (container) {
        console.log(`Cleanup: Terminating container for ${user.username}`);
        try {
          await container.stop({ t: 2 });
          await container.remove();
        } catch (e) {
          console.error("Container removal failed:", e);
        }
      }
    });
  } catch (err: any) {
    if (hasIncremented) activeContainers = Math.max(0, activeContainers - 1);
    console.error("Sandbox Runtime Error:", err.message);
    socket.emit("terminal-output", `\r\n\x1b[31m[Sandbox Error: ${err.message}]\x1b[0m\r\n`);
  }
});

server.listen(PORT, () => console.log(`Terminal Server active on port ${PORT}`));