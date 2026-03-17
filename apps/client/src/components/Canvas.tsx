import ReactFlow, {
  Background,
  BackgroundVariant,
  PanOnScrollMode,
} from "reactflow";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../stores";
import { nodesChanged, edgesChanged, onConnect } from "../stores/fileSlice";
import FileNode from "./nodes/FileNode";
// import CanvasControls from "./CanvasControls"; // The Fit View button we made
import "reactflow/dist/style.css";

const nodeTypes = {
  fileNode: FileNode,
};

export default function Canvas() {
  const dispatch = useDispatch();
  
  // Pull nodes and edges from Redux store
  const nodes = useSelector((state: RootState) => state.files.nodes);
  const edges = useSelector((state: RootState) => state.files.edges);

  // Wrap Redux dispatchers for React Flow
  const onNodesChange = (changes: any) => dispatch(nodesChanged(changes));
  const onEdgesChange = (changes: any) => dispatch(edgesChanged(changes));
  const handleConnect = (connection: any) => dispatch(onConnect(connection));

  return (
    <div style={{ width: "100%", height: "100%" }}>
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
        preventScrolling={true}
      >
        <Background color="#222" variant={BackgroundVariant.Dots} gap={20} />
        {/* <CanvasControls /> */}
      </ReactFlow>
    </div>
  );
}