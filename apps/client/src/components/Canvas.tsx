import ReactFlow, {
  Background,
  BackgroundVariant,
  PanOnScrollMode,
  Node,
  OnNodesChange,
} from "reactflow";
import FileNode from "./nodes/FileNode";
import "reactflow/dist/style.css";

const nodeTypes = {
  fileNode: FileNode,
};

export default function Canvas({
  nodes,
  onNodesChange,
}: {
  nodes: Node[];
  onNodesChange: OnNodesChange;
}) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll={true} // Move around with two fingers
        panOnScrollMode={PanOnScrollMode.Free} // Allow diagonal movement
        zoomOnPinch={true} // Zoom with pinch gesture
        zoomOnScroll={false} // STOP zooming with two-finger scroll
        preventScrolling={true} // Prevents the whole browser page from moving
      >
        <Background color="#222" variant={BackgroundVariant.Dots} gap={20} />
      </ReactFlow>
    </div>
  );
}
