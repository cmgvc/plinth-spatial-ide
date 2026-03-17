import { useCallback, useEffect } from "react";
import { useNodesState, useEdgesState, useReactFlow } from "reactflow";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter } = useReactFlow();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("test") === "true") {
      setNodes([
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
      ]);
    }
  }, [setNodes]);

  const handleFileSelect = useCallback(
    async (handle: FileSystemFileHandle) => {
      const file = await handle.getFile();
      const content = await file.text();
      const lineCount = content.split("\n").length;

      setNodes((nds) => {
        if (nds.find((n) => n.id === handle.name)) return nds;

        const calculatedHeight = lineCount * 24 + 80;
        const newNodeHeight = Math.min(calculatedHeight, 600);

        const lowestPoint = nds.reduce((max, node) => {
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

        setTimeout(() => {
          setCenter(
            newNode.position.x + 225,
            newNode.position.y + newNodeHeight / 2,
            {
              zoom: 1,
              duration: 800,
            },
          );
        }, 100);

        return nds.concat(newNode);
      });
    },
    [setNodes, setCenter],
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
      <Sidebar onFileSelect={handleFileSelect} />

      <main style={{ flex: 1, position: "relative", height: "100%" }}>
        <Canvas nodes={nodes} onNodesChange={onNodesChange} />
      </main>
    </div>
  );
}
