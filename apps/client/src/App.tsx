import { useCallback, useEffect } from "react";
import { useReactFlow } from "reactflow";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./stores";
import { setNodesInitial, nodesChanged } from "./stores/fileSlice";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import { clearAllNodes } from "./stores/fileSlice";

export default function App() {
  const { setCenter } = useReactFlow();
  const dispatch = useDispatch();

  const nodes = useSelector((state: RootState) => state.files.nodes);

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
              code: 'console.log("Hello from Playwright!");',
            },
            style: { width: 450, height: 200 },
          },
        ]),
      );
    }
  }, [dispatch]);

  const handleFileSelect = useCallback(
    async (handle: FileSystemFileHandle) => {
      if (nodes.find((n) => n.id === handle.name)) return;

      const file = await handle.getFile();
      const content = await file.text();
      const lineCount = content.split("\n").length;

      const calculatedHeight = lineCount * 24 + 80;
      const newNodeHeight = Math.min(calculatedHeight, 600);

      const lowestPoint = nodes.reduce((max, node) => {
        const nodeBottom =
          node.position.y + ((node.style?.height as number) || 200);
        return Math.max(max, nodeBottom);
      }, 50);

      const newNode = {
        id: handle.name,
        type: "fileNode",
        position: { x: 100, y: lowestPoint + 20 },
        style: { width: 1000, height: newNodeHeight },
        data: {
          filename: handle.name,
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
    [nodes, dispatch, setCenter],
  );

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#FFFFFF",
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
            if (
              window.confirm(
                "Are you sure you want to clear the entire workspace?",
              )
            ) {
              dispatch(clearAllNodes());
            }
          }}
          className="fixed bottom-6 right-6 z-50 p-3 bg-[#1e1e1e] hover:bg-red-500 border border-[#333] hover:border-red-500/50 text-gray-400 hover:text-white rounded-full shadow-2xl transition-all group"
          title="Clear Workspace"
        >
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider hidden group-hover:inline">
              Clear Canvas
            </span>
            <span className="text-lg">🗑️</span>
          </div>
        </button>
      </main>
    </div>
  );
}
