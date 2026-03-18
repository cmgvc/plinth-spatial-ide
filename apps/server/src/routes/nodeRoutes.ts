import express from "express";
import Node from "../models/Node";
import mongoose from "mongoose";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const container = await Node.findOne({ userId });

    if (!container) {
      return res.status(200).json({ nodes: [] });
    }

    res.json(container);
  } catch (err) {
    res.status(500).json({ message: "Error fetching nodes" });
  }
});

router.post("/sync/:userId", async (req, res) => {
  const { userId } = req.params;
  const { nodes } = req.body;

  try {
    const result = await Node.findOneAndUpdate(
      { userId },
      {
        nodes: nodes.map((n: any) => ({
          ...n,
          nodeId: n.id,
        })),
        lastSynced: new Date(),
      },
      { upsert: true, new: true },
    );

    res.status(200).json({ success: true, count: result?.nodes?.length || 0 });
  } catch (err) {
    console.error("Sync Error:", err);
    res.status(500).json({ error: "Failed to sync canvas to cloud." });
  }
});

router.delete("/clear/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    await Node.deleteOne({ userId });
    res.json({ message: "User workspace cleared" });
  } catch (err) {
    res.status(500).json({ message: "Error clearing nodes" });
  }
});

export default router;
