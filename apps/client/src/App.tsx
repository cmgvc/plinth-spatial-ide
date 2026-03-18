import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useReactFlow } from "reactflow";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./stores";
import {
  clearAllNodes,
  setNodesInitial,
} from "./stores/fileSlice";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import axios from "axios";
import TerminalWindow from "./components/Terminal";

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

const API_BASE = "http://localhost:5000/api/nodes";

export default function App() {
  const { setCenter } = useReactFlow();
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.files.nodes);

  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("app-theme") as "dark" | "light") || "dark",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const lastQuery = useRef("");
  const nodesRef = useRef(nodes);

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  // Keyboard shortcut terminal Cmd+J
  const toggleSidebar = useCallback(
    () => setIsSidebarOpen((prev) => !prev),
    [],
  );
  const toggleTerminal = useCallback(
    () => setIsTerminalOpen((prev) => !prev),
    [],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (isModifier && key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if (isModifier && key === "j") {
        e.preventDefault();
        toggleTerminal();
      }
      if (isModifier && key === "f") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("#node-search")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, toggleTerminal]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const { data } = await axios.get(API_BASE);
        if (data && data.length > 0) {
          dispatch(setNodesInitial(data));
        }
      } catch (err) {
        console.error("Failed to load workspace", err);
      }
    };
    fetchWorkspace();
  }, [dispatch]);

  const handleClearWorkspace = async () => {
    if (!window.confirm("Permanently clear workspace?")) return;
    try {
      await axios.delete(`${API_BASE}/clear`);
      dispatch(clearAllNodes());
    } catch (err) {
      console.error("Failed to clear DB", err);
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
    setCenter(
      target.position.x + ((target.style?.width as number) || 0) / 2,
      target.position.y + ((target.style?.height as number) || 0) / 2,
      { zoom: 1.1, duration: 800 },
    );
  };

  return (
    <div
      data-theme={theme}
      className="flex w-screen h-screen overflow-hidden bg-[var(--bg-main)] transition-colors duration-300 font-sans"
    >
      {/* Sidebar */}
      <div
        className="transition-all duration-300 ease-in-out border-r border-[var(--border-color)] overflow-hidden bg-[var(--bg-node)] flex-shrink-0"
        style={{ width: isSidebarOpen ? "280px" : "0px" }}
      >
        <div style={{ width: "280px" }}>
          <Sidebar
            onFileSelect={() => {}}
            onClear={handleClearWorkspace}
            hasNodes={nodes.length > 0}
          />
        </div>
      </div>
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-main)]">
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas theme={theme} />
          {/* Header */}
          <div
            className="fixed top-4 z-50 flex items-center gap-2 px-2 py-1.5 bg-[var(--bg-node)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-md shadow-sm transition-all duration-300"
            style={{ left: isSidebarOpen ? "296px" : "16px" }}
          >
            <button
              onClick={toggleSidebar}
              className={`p-1 rounded transition-all ${isSidebarOpen ? "text-blue-500/70 bg-blue-500/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
            >
              <SidebarIcon />
            </button>
            <div className="h-3 w-[1px] bg-[var(--border-color)] mx-1" />
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 px-1 relative"
            >
              <span className="text-[var(--text-muted)]">
                <SearchIcon />
              </span>
              <input
                id="node-search"
                type="text"
                placeholder="Find file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] font-mono text-[var(--text-main)] w-24 focus:w-40 transition-all duration-300"
              />
            </form>
            <div className="h-3 w-[1px] bg-[var(--border-color)] mx-1" />
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
          <button
            onClick={handleClearWorkspace}
            className="absolute bottom-6 right-6 z-50 p-3 bg-[var(--bg-node)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/50 rounded-full shadow-xl transition-all group flex items-center gap-2"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider hidden group-hover:inline ml-2">
              Clear Workspace
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>

        {/* Terminal */}
        <div
          className={`w-full border-t border-[var(--border-color)] bg-[#1a1a1a] z-20 transition-all duration-300 ease-in-out flex-shrink-0 ${
            isTerminalOpen ? "h-72" : "h-0"
          } overflow-hidden`}
        >
          <TerminalWindow />
        </div>
      </main>
    </div>
  );
}
