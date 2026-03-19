import express from "express";
import axios from "axios";
import Node from "../models/Node";

const router = express.Router();

const flyApi = axios.create({
  baseURL: `https://api.machines.dev/v1/apps/${process.env.FLY_APP_NAME}`,
  headers: {
    Authorization: `Bearer ${process.env.FLY_API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

/**
 * SPAWN / WAKE ENGINE
 * POST /api/fly/spawn/:userId
 */
router.post("/spawn/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    let workspace = await Node.findOne({ userId });
    let machineId = workspace?.flyMachineId;

    // 1. If we have a stored ID, check/start it
    if (machineId) {
      try {
        const { data: m } = await flyApi.get(`/machines/${machineId}`);
        if (m.state === "started") return res.json({ status: "ready", machineId });
        
        await flyApi.post(`/machines/${machineId}/start`);
        return res.json({ status: "starting", machineId });
      } catch (err: any) {
        if (err.response?.status === 404) machineId = null; // ID is stale
        else throw err;
      }
    }

    // 2. If no ID (or stale), create a new Machine
    const flyResponse = await flyApi.post("/machines", {
      config: {
        image: `registry.fly.io/${process.env.FLY_APP_NAME}:latest`,
        guest: { cpu_kind: "shared", cpus: 1, memory_mb: 256 },
        env: { USER_ID: userId },
        metadata: { owner: userId }
      },
    });

    const newId = flyResponse.data.id;
    await Node.findOneAndUpdate({ userId }, { flyMachineId: newId }, { upsert: true });
    
    res.json({ status: "created", machineId: newId });

  } catch (err) {
    console.error("Fly Engine Error:", err);
    res.status(500).json({ error: "Infrastructure ignition failed." });
  }
});

export default router;