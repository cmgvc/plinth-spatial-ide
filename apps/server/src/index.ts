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
const docker = new Docker({
  socketPath: `/Users/chloe/.docker/run/docker.sock`,
});
const PORT = 5001;

cron.schedule("0 0 * * *", () => {
  cleanupAbandonedVolumes();
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api/nodes", nodeRoutes);
app.use("/api/users", userRoutes);

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Error:", err.message));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.log("Connection rejected: Invalid or missing User ID");
    return socket.disconnect();
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      socket.emit(
        "terminal-output",
        "\r\n\x1b[31m[Error: User profile not found]\x1b[0m\r\n",
      );
      return socket.disconnect();
    }
    const userVolume = user.workspaceVolume;
    console.log(`User ${user.username} connected - Mounting ${userVolume}`);
    user.lastActive = new Date();
    await user.save();
    await docker.createVolume({ Name: userVolume }).catch(() => {});

    const container = await docker.createContainer({
      Image: "node:20-alpine",
      Tty: true,
      OpenStdin: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Cmd: ["/bin/sh"],
      WorkingDir: "/home/workspace",
      HostConfig: {
        Binds: [`${userVolume}:/home/workspace`],
        Memory: 1024 * 1024 * 1024,
        MemorySwap: 2048 * 1024 * 1024,
        NanoCpus: 1000000000,
      },
    });
    await container.start();
    const setupExec = await container.exec({
      Cmd: [
        "sh",
        "-c",
        "command -v npm >/dev/null 2>&1 || apk add --no-cache nodejs npm",
      ],
      AttachStdout: true,
      AttachStderr: true,
    });
    setupExec.start({});

    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
      hijack: true,
    });

    socket.emit("container-ready");

    stream.on("data", (chunk) =>
      socket.emit("terminal-output", chunk.toString()),
    );

    socket.on("terminal:input", (data) => {
      if (stream && (stream as any).writable) stream.write(Buffer.from(data));
    });

    socket.on("file-save", ({ fileName, content, isBase64 }) => {
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
      console.log(`Cleanup: Removing container for ${user.username}`);
      try {
        await container.stop({ t: 2 });
        await container.remove();
      } catch (e) {
        console.error("Cleanup Error", e);
      }
    });
  } catch (err: any) {
    console.error("Sandbox Error:", err.message);
    socket.emit(
      "terminal-output",
      `\r\n\x1b[31m[Sandbox Error: ${err.message}]\x1b[0m\r\n`,
    );
  }
});

server.listen(PORT, () => console.log(`Terminal Server ready on port ${PORT}`));
