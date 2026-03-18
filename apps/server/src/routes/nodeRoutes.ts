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

    const nodes = await Node.find({ userId });
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching nodes" });
  }
});

router.post("/sync/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { nodes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const ops = nodes.map((node: any) => ({
      updateOne: {
        filter: { nodeId: node.id, userId: userId },
        update: {
          $set: {
            ...node,
            nodeId: node.id,
            userId: userId,
          },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await Node.bulkWrite(ops);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Sync Error:", err);
    res.status(500).json({ message: "Error syncing nodes" });
  }
});

router.delete("/clear/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    await Node.deleteMany({ userId });
    res.json({ message: "User workspace cleared" });
  } catch (err) {
    res.status(500).json({ message: "Error clearing nodes" });
  }
});

export default router;
