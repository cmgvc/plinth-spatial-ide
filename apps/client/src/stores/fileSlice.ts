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

interface FileNodeData {
  filename: string;
  path: string;
  code: string;
  syncStatus: 'synced' | 'syncing' | 'error';
  fileHandle?: any;
}

interface FileState {
  nodes: Node<FileNodeData>[];
  edges: Edge[];
}

export const initialState: FileState = {
  nodes: [],
  edges: [],
};

const fileSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    setNodesInitial: (state, action: PayloadAction<Node<FileNodeData>[]>) => {
      state.nodes = action.payload;
    },
    setEdgesInitial: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload;
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
    addNode: (state, action: PayloadAction<Node<FileNodeData>>) => {
      state.nodes.push(action.payload);
    },
    removeNode: (state, action: PayloadAction<string>) => {
      state.nodes = state.nodes.filter((node) => node.id !== action.payload);
    },
    updateNodeStatus: (
      state,
      action: PayloadAction<{ id: string; status: FileNodeData['syncStatus'] }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data.syncStatus = action.payload.status;
      }
    },
    updateNodeCode: (
      state,
      action: PayloadAction<{ id: string; code: string }>,
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data.code = action.payload.code;
        node.data.syncStatus = 'syncing';
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
  setEdgesInitial,
  nodesChanged,
  edgesChanged,
  onConnect,
  addNode,
  removeNode,
  updateNodeStatus,
  updateNodeCode,
  clearAllNodes,
} = fileSlice.actions;

export default fileSlice.reducer;