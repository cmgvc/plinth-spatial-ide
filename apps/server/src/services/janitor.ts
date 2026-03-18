import Docker from "dockerode";
import { User } from "../models/User";

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export async function cleanupAbandonedVolumes() {
  console.log("🧹 Janitor: Checking for expired workspaces...");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Users who haven't logged in for 30 days
    const expiredUsers = await User.find({ 
      lastActive: { $lt: thirtyDaysAgo } 
    });

    if (expiredUsers.length === 0) {
      console.log("✨ No expired workspaces found.");
      return;
    }

    // Get list of all current Docker volumes
    const { Volumes } = await docker.listVolumes();
    
    for (const user of expiredUsers) {
      const volumeName = `vol_user_${user._id}`;
      
      // Check if user actually has volume on disk
      const volumeExists = Volumes.some(v => v.Name === volumeName);

      if (volumeExists) {
        console.log(`Deleting abandoned volume for user: ${user.username}`);
        await docker.getVolume(volumeName).remove()
          .catch(e => console.error(`Failed to remove ${volumeName}:`, e.message));
      }
    }
  } catch (err) {
    console.error("Janitor Error:", err);
  }
}