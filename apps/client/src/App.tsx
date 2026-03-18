import { useCallback, useEffect, useRef } from "react";
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

export default function App() {
  const { setCenter } = useReactFlow();
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.files.nodes);

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
      const ext = handle.name.split(".").pop()?.toLowerCase() || "";
      const isImage = ["png", "webp", "jpg", "jpeg", "gif", "svg"].includes(ext);

      let content = "";
      let newNodeHeight = 450;

      if (!isImage) {
        content = await file.text();
        const lineCount = content.split("\n").length;
        newNodeHeight = Math.min(lineCount * 24 + 80, 600);
      }

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

      setTimeout(() => {
        setCenter(
          newNode.position.x + 500,
          newNode.position.y + newNodeHeight / 2,
          { zoom: 1, duration: 800 },
        );
      }, 100);
    },
    [dispatch, setCenter],
  );

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#0a0a0a", 
        color: "white",
        overflow: "hidden",
      }}
    >
      <Sidebar
        onFileSelect={handleFileSelect}
        onClear={() => dispatch(clearAllNodes())}
        hasNodes={nodes.length > 0}
      />

      <main style={{ flex: 1, position: "relative", height: "100%" }}>
        <Canvas />

        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to clear the entire workspace?")) {
              dispatch(clearAllNodes());
            }
          }}
          className="fixed bottom-6 right-6 z-50 p-3 bg-[#1e1e1e] hover:bg-red-500 border border-[#333] hover:border-red-500/50 text-gray-400 hover:text-white rounded-full shadow-2xl transition-all group flex items-center gap-2"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider hidden group-hover:inline ml-2">
            Clear Canvas
          </span>
          <span className="text-lg px-1">🗑️</span>
        </button>
      </main>
    </div>
  );
}