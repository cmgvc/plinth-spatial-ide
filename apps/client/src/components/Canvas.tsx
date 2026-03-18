import { useState, useEffect } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  PanOnScrollMode,
  MiniMap,
  Controls,
  Panel,
  useReactFlow,
} from "reactflow";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../stores";
import { nodesChanged, edgesChanged, onConnect } from "../stores/fileSlice";
import FileNode from "./nodes/FileNode";
import "reactflow/dist/style.css";

const nodeTypes = {
  fileNode: FileNode,
};

interface CanvasProps {
  theme: "dark" | "light";
}

const MiniMapNode = ({ id, x, y, width, height, data, theme }: any) => {
  const nodes = useSelector((state: RootState) => state.files.nodes);
  const actualNode = nodes.find((n) => n.id === id);
  const rawName = data?.filename || actualNode?.data?.filename || id || "";
  const filename =
    rawName.length > 18 ? rawName.substring(0, 15) + "..." : rawName;
  const fill = theme === "dark" ? "#2a2a2a" : "#e0e0e0";
  const stroke = theme === "dark" ? "#444" : "#ccc";
  const textFill = theme === "dark" ? "#999" : "#666";

  return (
    <g>
      <rect
        x={x}
        y={y}
        rx="10"
        ry="10"
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + 12}
        textAnchor="middle"
        style={{
          fontSize: "40px",
          fill: textFill,
          fontWeight: "500",
          fontFamily: "Inter, sans-serif",
          pointerEvents: "none",
        }}
      >
        {filename.toUpperCase()}
      </text>
    </g>
  );
};

export default function Canvas({ theme }: CanvasProps) {
  const [showMiniMap, setShowMiniMap] = useState(true);
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.files.nodes);
  const edges = useSelector((state: RootState) => state.files.edges);

  const { zoomIn, zoomOut } = useReactFlow();

  const onNodesChange = (changes: any) => dispatch(nodesChanged(changes));
  const onEdgesChange = (changes: any) => dispatch(edgesChanged(changes));
  const handleConnect = (connection: any) => dispatch(onConnect(connection));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      if (isModifier && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomIn();
      }
      if (isModifier && e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomIn, zoomOut]);

  return (
    <div className="w-full h-full bg-[var(--bg-main)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll={true}
        panOnScrollMode={PanOnScrollMode.Free}
        zoomOnPinch={true}
        zoomOnScroll={false}
      >
        <Background
          color={theme === "dark" ? "#333" : "#bbb"}
          variant={BackgroundVariant.Dots}
          gap={20}
        />
        <Panel
          position="top-right"
          className="flex flex-col items-end gap-3 m-4"
        >
          <div className="flex items-center gap-2">
            <Controls
              showFitView={false}
              showInteractive={false}
              orientation="horizontal"
              style={{ position: "static", margin: 0 }}
            />
            <button
              onClick={() => setShowMiniMap(!showMiniMap)}
              className="group flex items-center justify-center text-center w-[9vw] h-[4vh] px-3 bg-[var(--bg-node)] border border-[var(--border-color)] rounded hover:border-blue-500 transition-all shadow-xl"
            >
              <span className="text-[9px] font-bold tracking-[0.1em] text-[var(--text-muted)] group-hover:text-[var(--text-main)] uppercase w-full">
                {showMiniMap ? "Hide Navigator" : "Show Navigator"}
              </span>
            </button>
          </div>
          {showMiniMap && (
            <div className="overflow-hidden rounded-lg border border-[var(--border-color)] shadow-2xl transition-all">
              <MiniMap
                nodeComponent={(props) => (
                  <MiniMapNode {...props} theme={theme} />
                )}
                style={{
                  position: "static",
                  backgroundColor: theme === "dark" ? "#0d0d0d" : "#f9f9f9",
                  width: 200,
                  height: 120,
                  margin: 0,
                }}
                maskColor={
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)"
                }
                zoomable
                pannable
              />
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}
