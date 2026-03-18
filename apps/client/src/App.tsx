import React, { useState, useRef, useCallback, useEffect } from "react";
import { useReactFlow } from "reactflow";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./stores";
import {
  clearAllNodes,
  setNodesInitial,
  addNode,
  updateNodeStatus,
} from "./stores/fileSlice";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import TerminalWindow from "./components/Terminal";
import LoginOverlay from "./components/LoginOverlay";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useTerminalSocket } from "./hooks/useTerminalSocket";

const UploadProgressBar = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  const percentage = Math.round((current / total) * 100);
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-72 bg-[#111]/90 border border-blue-500/20 rounded-lg p-4 shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
          Syncing Workspace
        </span>
        <span className="text-[10px] font-mono text-gray-400">
          {percentage}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-[9px] text-gray-500 font-mono text-center">
        {current} / {total} files synced
      </div>
    </div>
  );
};

const SunIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const MoonIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
const SidebarIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);
const SearchIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const API_BASE = "http://localhost:5001/api/nodes";
const USER_API = "http://localhost:5001/api/users";

export default function App() {
  const [user, setUser] = useState<{
    id: string;
    username: string;
    rootFolders?: any[];
  } | null>(null);
  const { setCenter, screenToFlowPosition } = useReactFlow();
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.files.nodes);

  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("app-theme") as "dark" | "light") || "dark",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const { isTerminalOpen, toggleTerminal, socket } = useTerminalSocket(
    user?.id,
  );
  const lastQuery = useRef("");
  const createdDirs = useRef<Set<string>>(new Set());

  useEffect(() => {
    const savedUser = localStorage.getItem("blonde-user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!socket) return;
    const check = () => setIsConnected(socket.connected);
    socket.on("connect", check);
    socket.on("disconnect", check);
    check();
    return () => {
      socket.off("connect", check);
      socket.off("disconnect", check);
    };
  }, [socket]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      if (isModifier && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarOpen((s) => !s);
      }
      if (isModifier && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggleTerminal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTerminal]);

  useEffect(() => {
    if (!user) return;
    const fetchWorkspace = async () => {
      try {
        const { data } = await axios.get(API_BASE);
        if (data && data.length > 0) dispatch(setNodesInitial(data));
      } catch (err) {
        console.error("Workspace load failed", err);
      }
    };
    fetchWorkspace();
  }, [dispatch, user]);

  const handleLogin = (userData: any) => {
    localStorage.setItem("blonde-user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("blonde-user");
      setUser(null);
    }
  };

  const handleFolderUpload = useCallback(
    async (files: any[]) => {
      if (!socket || !isConnected || !user) return;
      setUploadStatus({ current: 0, total: files.length });
      createdDirs.current.clear(); // Clear cache for new upload

      try {
        const rootName = files[0].path.split("/")[0];
        const WORKSPACE_PATH = `/home/workspace`;

        // PERSISTENCE: Save folder name to User DB
        const { data: updatedFolders } = await axios.post(
          `${USER_API}/sync-folders`,
          {
            userId: user.id,
            folderName: rootName,
          },
        );
        setUser((prev) =>
          prev ? { ...prev, rootFolders: updatedFolders } : null,
        );
        socket.emit(
          "terminal:input",
          `mkdir -p ${WORKSPACE_PATH}/${rootName} && cd ${WORKSPACE_PATH}/${rootName}\n`,
        );
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          const fileData = await fileItem.handle.getFile();
          const code = await fileData.text();
          const absolutePath = `${WORKSPACE_PATH}/${fileItem.path}`.replace(
            /\/+/g,
            "/",
          );
          const dirPath = absolutePath.substring(
            0,
            absolutePath.lastIndexOf("/"),
          );
          if (!createdDirs.current.has(dirPath)) {
            socket.emit("terminal:input", `mkdir -p "${dirPath}"\n`);
            createdDirs.current.add(dirPath);
          }
          const base64Content = btoa(unescape(encodeURIComponent(code)));
          socket.emit(
            "terminal:input",
            `echo "${base64Content}" | base64 -d > "${absolutePath}"\n`,
          );

          if (i % 5 === 0) {
            await new Promise((res) => setTimeout(res, 80));
          }

          setUploadStatus({ current: i + 1, total: files.length });
        }
        socket.emit(
          "terminal:input",
          `clear && echo "Workspace '${rootName}' synced successfully."\n`,
        );
      } catch (err) {
        console.error("Upload error:", err);
      } finally {
        setTimeout(() => setUploadStatus(null), 1500);
      }
    },
    [socket, isConnected, user],
  );

  const handleFileSelect = useCallback(
    async (fileHandle: any, path: string) => {
      try {
        // If already on canvas then just focus on it
        const existingNode = nodes.find((n) => n.data.path === path);
        if (existingNode) {
          setCenter(
            existingNode.position.x + 150,
            existingNode.position.y + 200,
            { zoom: 1.1, duration: 800 },
          );
          return;
        }

        const file = await fileHandle.getFile();
        const code = await file.text();
        const nodeId = uuidv4();
        const position = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
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
        if (socket && isConnected) {
          const WORKSPACE_PATH = `/home/workspace`;
          const absoluteFilePath = `${WORKSPACE_PATH}/${path}`.replace(
            /\/+/g,
            "/",
          );
          const absoluteDirPath = absoluteFilePath.substring(
            0,
            absoluteFilePath.lastIndexOf("/"),
          );
          const base64 = btoa(unescape(encodeURIComponent(code)));
          const atomicCommand = `mkdir -p "${absoluteDirPath}" && echo "${base64}" | base64 -d > "${absoluteFilePath}"\n`;
          socket.emit("terminal:input", atomicCommand);
          createdDirs.current.add(absoluteDirPath);

          setTimeout(() => {
            dispatch(updateNodeStatus({ id: nodeId, status: "synced" }));
          }, 500);
        }
      } catch (err) {
        console.error("Manual file sync failed:", err);
      }
    },
    [nodes, dispatch, setCenter, screenToFlowPosition, socket, isConnected],
  );

  const handleClearWorkspace = () => {
    if (
      !window.confirm(
        "Clear all nodes from the canvas? Your files will remain synced in the terminal.",
      )
    )
      return;

    try {
      dispatch(clearAllNodes());
      console.log("Canvas cleared. Files preserved in /home/workspace.");
    } catch (err) {
      console.error("Failed to clear canvas:", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const matches = nodes.filter((n) =>
      n.data.filename.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    if (matches.length === 0) return;
    let nextIndex =
      searchQuery === lastQuery.current
        ? (currentIndex + 1) % matches.length
        : 0;
    setCurrentIndex(nextIndex);
    lastQuery.current = searchQuery;
    const target = matches[nextIndex];
    setCenter(target.position.x + 150, target.position.y + 200, {
      zoom: 1.2,
      duration: 800,
    });
  };
  if (!user) return <LoginOverlay onLogin={handleLogin} />;
  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[var(--bg-main)] font-sans text-[var(--text-main)]">
      {uploadStatus && (
        <UploadProgressBar
          current={uploadStatus.current}
          total={uploadStatus.total}
        />
      )}

      <aside
        className="h-full border-r border-[var(--border-color)] bg-[var(--bg-node)] flex-shrink-0 transition-all duration-300"
        style={{ width: isSidebarOpen ? "280px" : "0px" }}
      >
        <div className="h-full w-[280px] overflow-hidden">
          <Sidebar
            onFileSelect={handleFileSelect}
            onFolderUpload={handleFolderUpload}
            onClear={handleClearWorkspace}
            onLogout={handleLogout}
            hasNodes={nodes.length > 0}
            username={user.username}
            persistedFolders={user.rootFolders?.map((f: any) => f.name)}
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <div className="flex-1 relative bg-[var(--bg-main)]">
          <Canvas theme={theme} />

          <header
            className="fixed top-4 z-50 flex items-center gap-2 px-2 py-1.5 bg-[var(--bg-node)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-md shadow-lg"
            style={{ left: isSidebarOpen ? "296px" : "16px" }}
          >
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={isSidebarOpen ? "text-blue-500" : "text-gray-400"}
            >
              <SidebarIcon />
            </button>
            <div className="h-3 w-[1px] bg-[var(--border-color)] mx-1" />
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 px-1 relative"
            >
              <SearchIcon />
              <input
                id="node-search"
                type="text"
                placeholder="Find..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] font-mono w-24 focus:w-40 transition-all"
              />
            </form>
            <div className="h-3 w-[1px] bg-[var(--border-color)] mx-1" />
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </header>

          <button
            onClick={handleClearWorkspace}
            className="absolute bottom-6 right-6 z-50 p-3 bg-[var(--bg-node)] border border-[var(--border-color)] rounded-full group flex items-center gap-2"
          >
            <span className="text-[10px] uppercase hidden group-hover:inline ml-2">
              Reset Space
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>

        <section
          className={`w-full border-t border-[var(--border-color)] bg-[#0d0d0d] z-20 transition-all duration-300 ${isTerminalOpen ? "h-72" : "h-0"} overflow-hidden`}
        >
          <TerminalWindow />
        </section>
      </main>
    </div>
  );
}
