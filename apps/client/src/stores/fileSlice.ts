import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

interface FileState {
  nodes: Node[];
  edges: Edge[];
}

const initialState: FileState = {
  nodes: [
    {
      id: "1",
      type: "fileNode",
      position: { x: 100, y: 100 },
      style: { width: 500, height: 100 },
      data: {
        filename: "main.ts",
        code: "Welcome to Plinth - your new favourite code editor!",
      },
    },
  ],
  edges: [],
};

const fileSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    setNodesInitial: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },

    nodesChanged: (state, action: PayloadAction<NodeChange[]>) => {
      state.nodes = applyNodeChanges(action.payload, state.nodes);
    },

    edgesChanged: (state, action: PayloadAction<EdgeChange[]>) => {
      state.edges = applyEdgeChanges(action.payload, state.edges);
    },

    onConnect: (state, action: PayloadAction<Connection>) => {
      state.edges = addEdge(action.payload, state.edges);
    },

    updateNodeCode: (
      state,
      action: PayloadAction<{ id: string; code: string }>,
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data = { ...node.data, code: action.payload.code };
      }
    },
    clearAllNodes: (state) => {
      state.nodes = [];
      state.edges = [];
    },
  },
});

export const {
  setNodesInitial,
  nodesChanged,
  edgesChanged,
  onConnect,
  updateNodeCode,
  clearAllNodes,
} = fileSlice.actions;

export default fileSlice.reducer;
