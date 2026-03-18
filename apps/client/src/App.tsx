import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow } from "reactflow";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./stores";
import {
  setNodesInitial,
  nodesChanged,
  clearAllNodes,
} from "./stores/fileSlice";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";

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

export default function App() {
  const { setCenter } = useReactFlow();
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.files.nodes);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("app-theme") as "dark" | "light") || "dark";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("test") === "true") {
      dispatch(
        setNodesInitial([
          {
            id: "test-file.ts",
            type: "fileNode",
            position: { x: 100, y: 100 },
            data: {
              filename: "test-file.ts",
              path: "test-file.ts",
              code: 'console.log("Hello from Playwright!");',
            },
            style: { width: 450, height: 200 },
          },
        ]),
      );
    }
  }, [dispatch]);

  const handleFileSelect = useCallback(
    async (handle: FileSystemFileHandle, path?: string) => {
      const currentNodes = nodesRef.current;
      const nodeId = path || handle.name;
      const existingNode = currentNodes.find((n) => n.id === nodeId);

      if (existingNode) {
        const { x, y } = existingNode.position;
        const width = (existingNode.style?.width as number) || 1000;
        const height = (existingNode.style?.height as number) || 600;
        setCenter(x + width / 2, y + height / 2, { zoom: 1, duration: 800 });
        return;
      }

      const file = await handle.getFile();
      const content = await file.text();
      const lineCount = content.split("\n").length;
      const newNodeHeight = Math.min(lineCount * 24 + 80, 600);

      const lowestPoint = currentNodes.reduce((max, node) => {
        const nodeBottom =
          node.position.y + ((node.style?.height as number) || 200);
        return Math.max(max, nodeBottom);
      }, 50);

      const newNode = {
        id: nodeId,
        type: "fileNode",
        position: { x: 100, y: lowestPoint + 20 },
        style: { width: 1000, height: newNodeHeight },
        data: {
          filename: handle.name,
          path: nodeId,
          code: content,
          fileHandle: handle,
        },
      };

      dispatch(nodesChanged([{ type: "add", item: newNode }]));
      setTimeout(
        () =>
          setCenter(
            newNode.position.x + 500,
            newNode.position.y + newNodeHeight / 2,
            { zoom: 1, duration: 800 },
          ),
        100,
      );
    },
    [dispatch, setCenter],
  );

  return (
    <div
      data-theme={theme}
      className="flex w-screen h-screen overflow-hidden bg-[var(--bg-main)] transition-colors duration-300"
    >
      <div
        className={`transition-all duration-300 ease-in-out border-r border-[var(--border-color)] overflow-hidden bg-[var(--bg-node)]`}
        style={{ width: isSidebarOpen ? "280px" : "0px" }}
      >
        <Sidebar
          onFileSelect={handleFileSelect}
          onClear={() => dispatch(clearAllNodes())}
          hasNodes={nodes.length > 0}
        />
      </div>

      <main className="flex-1 relative h-full overflow-hidden">
        <Canvas theme={theme} />

        <div
          className="fixed top-4 z-50 flex items-center gap-2 px-2 py-1.5 bg-[var(--bg-node)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-md shadow-sm transition-all duration-300"
          style={{ left: isSidebarOpen ? "296px" : "16px" }}
        >
          <button
            onClick={toggleSidebar}
            className={`p-1 rounded transition-all ${isSidebarOpen ? "text-blue-400 bg-blue-400/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            <SidebarIcon />
          </button>

          <div className="h-3 w-[1px] bg-[var(--border-color)] mx-1" />

          <button
            onClick={toggleTheme}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="h-3 w-[1px] bg-[var(--border-color)] mx-1" />

          <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-[0.2em] select-none pr-1">
            {theme}
          </span>
        </div>

        <button
          onClick={() =>
            window.confirm("Clear workspace?") && dispatch(clearAllNodes())
          }
          className="fixed bottom-6 right-6 z-50 p-3 bg-[var(--bg-node)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/50 rounded-full shadow-xl transition-all group flex items-center gap-2"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider hidden group-hover:inline ml-2">
            Clear
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
      </main>
    </div>
  );
}
