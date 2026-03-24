import express from "express";
import axios from "axios";
import { User } from "../models/User";

const router = express.Router();

const flyApi = axios.create({
  baseURL: `https://api.machines.dev/v1/apps/${process.env.FLY_APP_NAME}`,
  headers: {
    Authorization: `Bearer ${process.env.FLY_API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function getOrCreateVolume(
  userId: string,
  existingVolumeId?: string | null,
) {
  if (existingVolumeId) return existingVolumeId;

  const volName = `vol_${userId.substring(0, 10).toLowerCase()}`;

  try {
    const { data: volumes } = await flyApi.get(`/volumes`);
    const existing = volumes.find((v: any) => v.name === volName);
    if (existing) return existing.id;

    console.log(`Creating new persistent volume: ${volName}`);
    const { data: newVol } = await flyApi.post(`/volumes`, {
      name: volName,
      region: "yyz",
      size_gb: 1,
    });

    return newVol.id;
  } catch (err: any) {
    console.error("Volume Lifecycle Error:", err.response?.data || err.message);
    return null;
  }
}

router.post("/spawn/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let machineId = user.flyMachineId;

    if (machineId) {
      try {
        const { data: m } = await flyApi.get(`/machines/${machineId}`);

        if (m.state === "started") {
          return res.json({ status: "ready", machineId });
        }

        console.log(`Waking up machine: ${machineId}`);
        await flyApi.post(`/machines/${machineId}/start`);
        return res.json({ status: "starting", machineId });
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.log("Stale Machine ID detected. Rebuilding...");
          machineId = null;
        } else {
          throw err;
        }
      }
    }

    const volumeId = await getOrCreateVolume(userId, user.flyVolumeId);
    if (!volumeId) {
      throw new Error("Could not initialize persistent storage.");
    }

    console.log(`Spawning fresh sandbox for user: ${userId}`);
    const flyResponse = await flyApi.post("/machines", {
      config: {
        image: `registry.io/${process.env.FLY_APP_NAME}:latest`,
        guest: { cpu_kind: "shared", cpus: 1, memory_mb: 1024 },
        user: "sandbox",
        init: {
          exec: ["/bin/bash", "--login"],
          tty: true,
        },
        mounts: [
          {
            volume: volumeId,
            path: "/home/sandbox/workspace",
          },
        ],
        env: {
          USER_ID: userId,
          HOME: "/home/sandbox/workspace",
          TERM: "xterm-256color",
          LANG: "en_US.UTF-8",
          NODE_ENV: "production",
        },
        metadata: {
          owner_id: userId,
          type: "persistent-sandbox",
        },
      },
    });

    const newId = flyResponse.data.id;

    await User.findByIdAndUpdate(userId, {
      flyMachineId: newId,
      flyVolumeId: volumeId,
    });

    res.json({ status: "created", machineId: newId });
  } catch (err: any) {
    console.error(
      "Fly Engine Critical Failure:",
      err.response?.data || err.message,
    );
    res.status(500).json({
      error: "Infrastructure ignition failed.",
      details: err.response?.data?.error || "Check server logs",
    });
  }
});

export default router;
