import express from "express";
import Node from "../models/Node";

const router = express.Router();

/**
 * FETCH CANVAS
 * GET /api/nodes/:userId
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const workspace = await Node.findOne({ userId });
    res.json(workspace || { nodes: [], edges: [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch workspace" });
  }
});

/**
 * FULL SYNC (Code & Structure)
 * POST /api/nodes/sync/:userId
 */
router.post("/sync/:userId", async (req, res) => {
  const { userId } = req.params;
  const { nodes, edges } = req.body;

  try {
    const result = await Node.findOneAndUpdate(
      { userId },
      { nodes, edges, lastSynced: new Date() },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, count: result?.nodes?.length });
  } catch (err) {
    res.status(500).json({ error: "Cloud sync failed." });
  }
});

/**
 * INCREMENTAL MOVE (Position Only)
 * PATCH /api/nodes/move/:userId
 */
router.patch("/move/:userId", async (req, res) => {
  const { userId } = req.params;
  const { nodeId, position } = req.body;

  try {
    await Node.updateOne(
      { userId, "nodes.nodeId": nodeId },
      { 
        $set: { 
          "nodes.$.position": position,
          lastSynced: new Date() 
        } 
      }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Position update failed." });
  }
});

/**
 * PURGE CANVAS
 * DELETE /api/nodes/clear/:userId
 */
// ✅ FIXED: Extract userId first
router.delete("/clear/:userId", async (req, res) => {
  try {
    const { userId } = req.params; // <--- Add this line
    await Node.findOneAndUpdate({ userId }, { nodes: [], edges: [] });
    res.json({ message: "Canvas cleared" });
  } catch (err) {
    res.status(500).json({ error: "Clear failed" });
  }
});

export default router;