import ReactFlow, { Background, Controls, Node } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  {
    id: '1',
    position: { x: 100, y: 100 },
    data: { label: 'Code block' },
    type: 'input',
  },
];

export default function Canvas() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
      <ReactFlow 
        nodes={initialNodes} 
        style={{ width: '100%', height: '100%' }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}