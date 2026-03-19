import express from "express";
import { User } from "../models/User";

const router = express.Router();

// 1. LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      user = new User({
        email,
        username: email.split("@")[0],
        rootFolders: [], // Initialize the array
      });
      await user.save();
    }

    // Return the data exactly as the frontend App.tsx expects it
    res.json({
      id: user._id.toString(),
      username: user.username,
      rootFolders: user.rootFolders || [],
    });
  } catch (err: any) {
    console.error("CRITICAL AUTH ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// 2. SYNC FOLDERS ROUTE
// FIXED: Added /:userId to the path to match your frontend API calls
router.post("/sync-folders/:userId", async (req, res) => {
  const { userId } = req.params; // Get ID from URL
  const { folderName } = req.body;

  if (!userId || !folderName) {
    return res.status(400).json({ error: "Missing userId or folderName" });
  }

  try {
    // A. Remove existing folder entry with same name to prevent duplicates
    await User.findByIdAndUpdate(userId, {
      $pull: { rootFolders: { name: folderName } } as any,
    });

    // B. Push the fresh folder metadata
    const finalUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          rootFolders: {
            name: folderName,
            path: folderName,
            // Note: If you add 'lastSynced' here, ensure it's in your IUser interface!
          },
        } as any,
      },
      { new: true, runValidators: true },
    );

    if (!finalUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(finalUser.rootFolders);
  } catch (err: any) {
    console.error("SYNC ERROR:", err);
    res.status(500).json({ error: "Failed to update folder list" });
  }
});

export default router;