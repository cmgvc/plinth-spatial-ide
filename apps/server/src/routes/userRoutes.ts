import express from "express";
import { User } from "../models/User";
import axios from "axios";

const router = express.Router();

const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
const FLY_APP_NAME = "plinth-workers";

interface FlyVolume {
  id: string;
  name: string;
}

interface FlyMachine {
  id: string;
  name: string;
}

router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email, username: email.split("@")[0] });
      await user.save();
    }

    if (!user.flyMachineId) {
      console.log(`Provisioning infrastructure for ${email}...`);

      const volumeResponse = await axios.post<FlyVolume>(
        `https://api.machines.dev/v1/apps/${FLY_APP_NAME}/volumes`,
        {
          name: `vol_${user._id.toString().slice(-10)}`,
          region: "yyz",
          size_gb: 1,
        },
        { headers: { Authorization: `Bearer ${FLY_API_TOKEN}` } },
      );

      const volumeId = volumeResponse.data.id;

      const machineResponse = await axios.post<FlyMachine>(
        `https://api.machines.dev/v1/apps/${FLY_APP_NAME}/machines`,
        {
          config: {
            image: `registry.fly.io/${FLY_APP_NAME}:latest`,
            mounts: [{ volume: volumeId, path: "/home/sandbox/workspace" }],
            guest: { cpu_kind: "shared", cpus: 1, memory_mb: 256 },
            auto_destroy: false,
            restart: { policy: "no" },
          },
        },
        { headers: { Authorization: `Bearer ${FLY_API_TOKEN}` } },
      );

      user.flyMachineId = machineResponse.data.id;
      user.flyVolumeId = volumeId;
      await user.save();
    }

    res.json({
      id: user._id,
      username: user.username,
      machineId: user.flyMachineId,
    });
  } catch (err: any) {
    console.error("FLY API ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to initialize user environment",
      details: err.response?.data?.error || "Check server logs",
    });
  }
});

router.post("/sync-folders/:userId", async (req, res) => {
  const { userId } = req.params;
  const { folderName } = req.body;

  if (!folderName)
    return res.status(400).json({ error: "Folder name required" });

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { rootFolders: { name: folderName } },
      },
      { new: true },
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    const finalUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          rootFolders: {
            name: folderName,
            path: folderName,
            lastSynced: new Date(),
          },
        },
      },
      { new: true },
    );

    res.status(200).json(finalUser?.rootFolders || []);
  } catch (err: any) {
    console.error("SYNC ERROR:", err.message);
    res.status(500).json({ error: "Failed to sync folder" });
  }
});

export default router;
