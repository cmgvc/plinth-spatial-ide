import React, { useCallback } from "react";
import { useNodesState, useEdgesState, useReactFlow } from "reactflow";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter } = useReactFlow();

  function handleFileSelect() {
    return;
  }

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
