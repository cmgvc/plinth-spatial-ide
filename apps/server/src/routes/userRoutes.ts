import express from "express";
import { User } from "../models/User";

const router = express.Router();

router.post("/login", async (req, res) => {
  console.log("Login attempt for:", req.body.email);

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user = await User.findOne({ email });

    if (!user) {
      console.log("Creating new user for:", email);
      user = new User({
        email,
        username: email.split("@")[0],
        rootFolders: [],
      });

      await user.save();
      console.log("New user saved successfully");
    }

    res.json({
      id: user._id.toString(),
      username: user.username,
      rootFolders: user.rootFolders || [],
    });
  } catch (err: any) {
    console.error("AUTH ERROR:", err.message);
    res.status(500).json({ error: "Login failed", details: err.message });
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
