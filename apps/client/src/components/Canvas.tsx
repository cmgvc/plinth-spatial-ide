import ReactFlow, {
  Background,
  BackgroundVariant,
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
      >
        <Background color="#222" variant={BackgroundVariant.Dots} gap={20} />
      </ReactFlow>
    </div>
  );
}
