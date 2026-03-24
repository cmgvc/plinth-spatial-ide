import express from "express";
import { User } from "../models/User";

const router = express.Router();

const DEFAULT_MACHINE_ID = "08003d2b09e378"; 
const DEFAULT_VOLUME_ID = "vol_01kmgeazgjvmjw3g3zg2gzh4gk";

router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user = await User.findOne({ email });

    if (!user) {
      console.log("Creating new user with linked infrastructure:", email);
      user = new User({
        email,
        username: email.split("@")[0],
        rootFolders: [],
        flyMachineId: DEFAULT_MACHINE_ID,
        flyVolumeId: DEFAULT_VOLUME_ID
      });
      await user.save();
    } else if (!user.flyMachineId) {
      user.flyMachineId = DEFAULT_MACHINE_ID;
      user.flyVolumeId = DEFAULT_VOLUME_ID;
      await user.save();
      console.log("Linked existing user to machine:", DEFAULT_MACHINE_ID);
    }

    res.json({
      id: user._id.toString(),
      username: user.username,
      rootFolders: user.rootFolders || [],
      flyMachineId: user.flyMachineId,
      flyVolumeId: user.flyVolumeId
    });
  } catch (err: any) {
    console.error("AUTH ERROR:", err.message);
    res.status(500).json({ error: "Login failed" });
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
