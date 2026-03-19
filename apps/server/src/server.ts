import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import * as pty from "node-pty";
import os from "os";
import fs from "fs";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://cmgvc.github.io",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  },
  transports: ["websocket"],
});

// Health check for Fly.io monitoring
app.get("/health", (req, res) => res.send("Terminal Engine Live"));

io.on("connection", (socket) => {
  // socket.io query params are untyped; normalize to string.
  const rawUserId = socket.handshake.query.userId;
  const userId = String(rawUserId ?? "");
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "");

  // Start each terminal in a clean, deterministic directory.
  // This ensures the shell starts from an empty directory.
  const terminalCwd = `/home/sandbox/terminal-${safeUserId || "unknown"}`;
  try {
    fs.rmSync(terminalCwd, { recursive: true, force: true });
    fs.mkdirSync(terminalCwd, { recursive: true });
  } catch (err) {
    console.error("Failed to prepare terminal cwd:", err);
  }
  console.log(`👤 User Connected to Terminal: ${userId}`);

  const shell = os.platform() === "win32" ? "powershell.exe" : "/bin/bash";
  const bashRcFile = `${terminalCwd}/.plinth_bashrc`;

  // For bash sessions: make the user's sandbox directory look like `/` and
  // prevent `cd` from escaping the sandbox root.
  if (shell === "/bin/bash") {
    const rcContent = `# Plinth restricted shell
BASE="${terminalCwd}"
export HOME="$BASE"

_plinth_fake_pwd() {
  local cur
  cur="$(command pwd -P)"
  if [ "$cur" = "$BASE" ]; then
    echo "/"
  else
    echo "/\${cur#"$BASE"/}"
  fi
}

pwd() {
  _plinth_fake_pwd
}

cd() {
  local target
  target="\${1:-$BASE}"

  # Treat /... as within the fake root.
  if [[ "\$target" == /* ]]; then
    target="$BASE\$target"
  fi

  # Perform the move, then clamp back inside BASE if needed.
  if ! builtin cd "\$target" 2>/dev/null; then
    return 1
  fi

  local newpath
  newpath="$(command pwd -P)"
  case "\$newpath" in
    "$BASE"|"$BASE"/*)
      ;;
    *)
      builtin cd "$BASE"
      ;;
  esac
}

PROMPT_COMMAND='
  PLINTH_FAKE_PWD="$(_plinth_fake_pwd)"
  PS1="\\u@\\h:\${PLINTH_FAKE_PWD}\\$ "
'

builtin cd "$BASE"
`;

    try {
      fs.writeFileSync(bashRcFile, rcContent, {
        encoding: "utf8",
        mode: 0o600,
      });
    } catch (err) {
      console.error("Failed to write bash rcfile:", err);
    }
  }

  // Important: On Linux/Fly.io, ensure /home/sandbox exists in your Dockerfile
  const ptyProcess =
    shell === "/bin/bash"
      ? pty.spawn(
          shell,
          ["--noprofile", "--norc", "--rcfile", bashRcFile, "-i"],
          {
            name: "xterm-256color",
            cols: 80,
            rows: 24,
            cwd: terminalCwd,
            env: { ...process.env, USER_ID: String(userId) },
          },
        )
      : pty.spawn(shell, [], {
          name: "xterm-256color",
          cols: 80,
          rows: 24,
          cwd: os.platform() === "win32" ? process.cwd() : terminalCwd,
          env: { ...process.env, USER_ID: String(userId) },
        });

  // PTY -> Frontend
  ptyProcess.onData((data) => {
    socket.emit("terminal-output", data);
  });

  // Frontend -> PTY
  socket.on("terminal-input", (data) => {
    if (ptyProcess) ptyProcess.write(data);
  });

  socket.on("terminal-resize", (size) => {
    if (ptyProcess) ptyProcess.resize(size.cols, size.rows);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 User Disconnected: ${userId}`);
    ptyProcess.kill();
    // Best-effort cleanup of the per-session scratch directory.
    try {
      fs.rmSync(terminalCwd, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });
});

const PORT = 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Engine active on ${PORT}`);
});
