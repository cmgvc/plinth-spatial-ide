import { useState, useCallback, useEffect } from "react";
import { useReactFlow, ReactFlow, Background, Controls } from "reactflow";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { RootState } from "./stores";
import {
  clearAllNodes,
  setNodesInitial,
  addNode,
  updateNodeStatus,
} from "./stores/fileSlice";
import { setConfirm } from "./stores/uiSlice";
import { useTerminalSocket } from "./hooks/useTerminalSocket";
import { useWorkspaceSync } from "./hooks/useWorkspaceSync";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import TerminalWindow from "./components/Terminal";
import LoginOverlay from "./components/LoginOverlay";
import { WelcomeModal } from "./components/WelcomeModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { UploadProgressBar } from "./components/ProgressBar";
import {
  SearchIcon,
  SidebarIcon,
  MoonIcon,
  SunIcon,
  HelpIcon,
} from "./utils/icons";

const ROOT_URL = import.meta.env.VITE_API_URL;
export const API_BASE = `${ROOT_URL}/api`;

export default function App() {
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.files.nodes);
  const confirmConfig = useSelector(
    (state: RootState) => state.ui.confirmConfig,
  );
  const { setCenter, screenToFlowPosition, zoomIn, zoomOut } = useReactFlow();
  const [user, setUser] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("app-theme") as any) || "dark",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "saving" | "synced" | "error"
  >("synced");

  const { isTerminalOpen, toggleTerminal, socket } = useTerminalSocket(
    user?.id,
  );
  const { syncFolder, uploadStatus } = useWorkspaceSync(
    user,
    socket,
    isConnected,
    setUser,
  );

  useKeyboardShortcuts({
    b: () => setIsSidebarOpen((s) => !s),
    j: () => toggleTerminal(),
    f: () => document.getElementById("node-search")?.focus(),
    "=": () => zoomIn(),
    "-": () => zoomOut(),
    escape: () => dispatch(setConfirm(null)),
  });

  useEffect(() => {
    const saved = localStorage.getItem("blonde-user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!socket) return;
    const check = () => setIsConnected(socket.connected);
    socket.on("connect", check);
    socket.on("disconnect", check);
    return () => {
      socket.off("connect", check);
      socket.off("disconnect", check);
    };
  }, [socket]);

  useEffect(() => {
    if (user?.id) {
      axios
        .get(`${API_BASE}/${user.id}`)
        .then(({ data }) => {
          if (data && data.nodes && data.nodes.length > 0) {
            const mappedNodes = data.nodes.map((n: any) => ({
              ...n,
              id: n.nodeId,
            }));
            dispatch(setNodesInitial(mappedNodes));
          }
        })
        .catch((err) => {
          if (err.response?.status !== 404) {
            console.error("Cloud fetch failed:", err);
          }
        });
    }
  }, [user?.id, dispatch]);

  useEffect(() => {
    if (!user?.id) return;
    setSyncStatus("saving");
    const handler = setTimeout(async () => {
      try {
        await axios.post(`${API_BASE}/sync/${user.id}`, { nodes });
        setSyncStatus("synced");
      } catch (err) {
        setSyncStatus("error");
        console.error("Cloud sync failed:", err);
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [nodes, user?.id]);

  const handleLogout = () =>
    dispatch(
      setConfirm({
        title: "System Termination",
        message: "End session and clear local workspace state?",
        onConfirm: () => {
          localStorage.removeItem("blonde-user");
          dispatch(clearAllNodes());
          setUser(null);
          dispatch(setConfirm(null));
        },
      }),
    );

  const handleClearWorkspace = () =>
    dispatch(
      setConfirm({
        title: "Clear Canvas",
        message:
          "Remove all nodes from the cloud and local canvas? Files remain in terminal.",
        type: "danger",
        onConfirm: async () => {
          if (user?.id) {
            try {
              await axios.delete(`${API_BASE}/clear/${user.id}`);
              dispatch(clearAllNodes());
            } catch (err) {
              console.error("Failed to clear cloud workspace", err);
            }
          } else {
            dispatch(clearAllNodes());
          }
          dispatch(setConfirm(null));
        },
      }),
    );

  const handleMountRequest = useCallback(
    (files: any[]) => {
      if (nodes.length > 0) {
        dispatch(
          setConfirm({
            title: "Workspace Conflict",
            message: "Clear canvas before mounting this project?",
            onConfirm: () => {
              dispatch(clearAllNodes());
              syncFolder(files);
              dispatch(setConfirm(null));
            },
            onCancel: () => {
              syncFolder(files);
              dispatch(setConfirm(null));
            },
          }),
        );
      } else {
        syncFolder(files);
      }
    },
    [nodes.length, dispatch, syncFolder],
  );

  const handleFileSelect = useCallback(
    async (fileHandle: any, path: string) => {
      const existing = nodes.find((n) => n.data.path === path);
      if (existing) {
        return setCenter(existing.position.x + 250, existing.position.y + 200, {
          zoom: 1.1,
          duration: 800,
        });
      }

      const file = await fileHandle.getFile();
      const code = await file.text();
      const nodeId = uuidv4();
      const position = screenToFlowPosition({
        x: window.innerWidth / 2 - 250,
        y: window.innerHeight / 2 - 150,
      });

      dispatch(
        addNode({
          id: nodeId,
          type: "fileNode",
          position,
          data: {
            filename: fileHandle.name,
            path,
            code,
            fileHandle,
            syncStatus: "syncing",
          },
        }),
      );

      if (socket?.connected) {
        const base64 = btoa(unescape(encodeURIComponent(code)));
        socket.emit(
          "terminal:input",
          `mkdir -p "$(dirname "/home/workspace/${path}")" && echo "${base64}" | base64 -d > "/home/workspace/${path}"\n`,
        );
        setTimeout(
          () => dispatch(updateNodeStatus({ id: nodeId, status: "synced" })),
          500,
        );
      }
    },
    [nodes, setCenter, screenToFlowPosition, socket, dispatch],
  );

  if (!user) {
    return (
      <LoginOverlay
        onLogin={(data) => {
          setUser(data);
          localStorage.setItem("blonde-user", JSON.stringify(data));
          setShowWelcome(true);
        }}
      />
    );
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)] font-mono">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {confirmConfig && (
        <ConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type === "info" ? "default" : confirmConfig.type}
          onConfirm={confirmConfig.onConfirm}
          onCancel={
            confirmConfig.onCancel || (() => dispatch(setConfirm(null)))
          }
        />
      )}

      {uploadStatus && <UploadProgressBar {...uploadStatus} />}

      <aside
        className="h-full border-r border-[var(--border-color)] bg-[var(--bg-node)] transition-all"
        style={{ width: isSidebarOpen ? "280px" : "0" }}
      >
        <div className="w-[280px] h-full overflow-hidden">
          <Sidebar
            onFileSelect={handleFileSelect}
            onFolderUpload={handleMountRequest}
            onClear={handleClearWorkspace}
            onLogout={handleLogout}
            username={user.username}
            persistedFolders={user.rootFolders?.map((f: any) => f.name)}
            hasNodes={nodes.length > 0}
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0">
        <div className="flex-1 relative">
          <Canvas theme={theme} />

          <header
            className="fixed top-4 z-50 flex items-center gap-2 px-3 py-2 bg-[var(--bg-node)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-lg shadow-xl"
            style={{ left: isSidebarOpen ? "296px" : "16px" }}
          >
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <SidebarIcon />
            </button>
            <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

            <div
              className={`w-2 h-2 rounded-full mr-1 ${
                syncStatus === "synced"
                  ? "bg-green-500"
                  : syncStatus === "saving"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
              }`}
              title={syncStatus}
            />

            <SearchIcon />
            <input
              id="node-search"
              placeholder="Find node..."
              className="bg-transparent outline-none text-[11px] w-32 focus:w-48 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </header>

          <button
            onClick={() => setShowWelcome(true)}
            className="absolute bottom-6 left-6 z-50 p-3 bg-[var(--bg-node)] border border-[var(--border-color)] rounded-full shadow-2xl hover:border-blue-500/50 transition-all"
          >
            <HelpIcon />
          </button>

          <button
            onClick={handleClearWorkspace}
            className="absolute bottom-6 right-6 z-50 p-3 bg-[var(--bg-node)] border border-[var(--border-color)] rounded-full shadow-2xl hover:border-red-500/50 transition-all text-red-500 group"
            title="Clear Workspace"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:scale-110 transition-transform"
            >
              <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>

        <section
          className={`w-full border-t border-[var(--border-color)] bg-[#0d0d0d] transition-all ${isTerminalOpen ? "h-72" : "h-0"} overflow-hidden`}
        >
          <TerminalWindow />
        </section>
      </main>
    </div>
  );
}
