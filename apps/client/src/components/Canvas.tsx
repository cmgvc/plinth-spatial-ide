import React, { useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  PanOnScrollMode,
  MiniMap,
  Controls,
  Panel,
} from "reactflow";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../stores";
import { nodesChanged, edgesChanged, onConnect } from "../stores/fileSlice";
import FileNode from "./nodes/FileNode";
import "reactflow/dist/style.css";

const nodeTypes = {
  fileNode: FileNode,
};

const MiniMapNode = ({ id, x, y, width, height, data }: any) => {
  const nodes = useSelector((state: RootState) => state.files.nodes);
  const actualNode = nodes.find((n) => n.id === id);

  const rawName = data?.filename || actualNode?.data?.filename || id || "";
  const filename =
    rawName.length > 18 ? rawName.substring(0, 15) + "..." : rawName;

  return (
    <g>
      <rect
        x={x}
        y={y}
        rx="10"
        ry="10"
        width={width}
        height={height}
        fill="#2a2a2a"
        stroke="#444"
        strokeWidth="2"
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + 12}
        textAnchor="middle"
        style={{
          fontSize: "40px",
          fill: "#999",
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

export default function Canvas() {
  const [showMiniMap, setShowMiniMap] = useState(true);
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.files.nodes);
  const edges = useSelector((state: RootState) => state.files.edges);

  const onNodesChange = (changes: any) => dispatch(nodesChanged(changes));
  const onEdgesChange = (changes: any) => dispatch(edgesChanged(changes));
  const handleConnect = (connection: any) => dispatch(onConnect(connection));

  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#0a0a0a" }}>
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
        <Background color="#1a1a1a" variant={BackgroundVariant.Dots} gap={20} />

        <Controls
          showFitView={false}
          showInteractive={false}
          position="bottom-left"
        />

        <Panel
          position="top-right"
          className="flex flex-col items-end gap-3 m-4"
        >
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className="group flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded hover:border-[#555] transition-all"
          >
            <span className="text-[10px] font-medium tracking-[0.1em] text-gray-500 group-hover:text-gray-300 uppercase">
              {showMiniMap ? "Hide Navigator" : "Show Navigator"}
            </span>
          </button>

          {showMiniMap && (
            <div className="overflow-hidden rounded-lg border border-[#222] shadow-2xl transition-all">
              <MiniMap
                nodeComponent={MiniMapNode}
                style={{
                  position: "static",
                  backgroundColor: "#0d0d0d",
                  width: 200,
                  height: 120,
                  margin: 0,
                }}
                maskColor="rgba(255, 255, 255, 0.03)"
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
