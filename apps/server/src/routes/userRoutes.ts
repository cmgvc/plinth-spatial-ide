import express from "express";
import { User } from "../models/User";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        username: email.split("@")[0],
        rootFolders: [],
      });
      await user.save();
    }

    res.json({
      id: user._id.toString(),
      username: user.username,
      rootFolders: user.rootFolders || [],
    });
  } catch (err: any) {
    console.error("CRITICAL AUTH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/sync-folders", async (req, res) => {
  const { userId, folderName } = req.body;

  if (!userId || !folderName) {
    return res.status(400).json({ error: "Missing userId or folderName" });
  }

  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { rootFolders: { name: folderName } },
    });

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
      { new: true, runValidators: true },
    );

    if (!finalUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(finalUser.rootFolders);
  } catch (err: any) {
    console.error("SYNC ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
