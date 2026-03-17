import ReactFlow, { Background, Controls, Node } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: { label: 'Hello' },
    type: 'input',
  },
];

export default function Canvas() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a' }}>
      <ReactFlow nodes={initialNodes}>
        <Background color="#334155" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
}