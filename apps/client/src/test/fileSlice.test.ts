import { describe, it, expect } from "vitest";
import reducer, {
  addNode,
  updateNodeStatus,
  updateNodeCode,
  clearAllNodes,
  setNodesInitial,
} from "../stores/fileSlice"; 
import { Node } from "reactflow";

const createMockNode = (id: string, filename: string): Node => ({
  id,
  type: "fileNode",
  position: { x: 0, y: 0 },
  data: {
    filename,
    path: `src/${filename}`,
    code: 'console.log("test")',
    syncStatus: "synced",
  },
});

const populatedState = {
  nodes: [createMockNode("1", "welcome.ts")],
  edges: [],
};

describe("File Slice Redux Logic", () => {
  it('should initialize with an empty node list', () => {
    const state = reducer(undefined, { type: "@@INIT" });
    expect(state.nodes).toHaveLength(0);
  });

  it("should handle setNodesInitial by replacing existing nodes", () => {
    const newNodes = [createMockNode("2", "app.ts")];
    const state = reducer(populatedState, setNodesInitial(newNodes));

    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe("2");
  });

  it("should add a new node to the existing list", () => {
    const newNode = createMockNode("3", "utils.ts");
    const state = reducer(populatedState, addNode(newNode));

    expect(state.nodes).toHaveLength(2);
    expect(state.nodes[1].data.filename).toBe("utils.ts");
  });

  it("should update only the sync status of a specific node", () => {
    const state = reducer(
      populatedState,
      updateNodeStatus({ id: "1", status: "syncing" }),
    );
    expect(state.nodes[0].data.syncStatus).toBe("syncing");
    expect(state.nodes[0].data.filename).toBe("welcome.ts");
  });

  it('should update code and automatically set status to "syncing"', () => {
    const newCode = "const x = 10;";
    const state = reducer(
      populatedState,
      updateNodeCode({ id: "1", code: newCode }),
    );

    expect(state.nodes[0].data.code).toBe(newCode);
    expect(state.nodes[0].data.syncStatus).toBe("syncing");
  });

  it("should wipe both nodes and edges on clearAllNodes", () => {
    const dirtyState = {
      nodes: [createMockNode("1", "main.ts")],
      edges: [{ id: "e1", source: "1", target: "2" }],
    };

    const state = reducer(dirtyState as any, clearAllNodes());

    expect(state.nodes).toHaveLength(0);
    expect(state.edges).toHaveLength(0);
  });

  it("should not crash or modify when updating a non-existent node", () => {
    const state = reducer(
      populatedState,
      updateNodeStatus({ id: "999", status: "error" }),
    );
    expect(state.nodes[0].data.syncStatus).toBe("synced");
    expect(state.nodes).toHaveLength(1);
  });
});