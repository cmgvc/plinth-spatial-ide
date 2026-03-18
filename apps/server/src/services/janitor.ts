import Docker from "dockerode";
import fs from "fs";
import { User } from "../models/User";

interface DockerVolume {
  Name: string;
}

const isDockerAvailable = fs.existsSync("/var/run/docker.sock");
const docker = isDockerAvailable
  ? new Docker({ socketPath: "/var/run/docker.sock" })
  : null;

export async function cleanupAbandonedVolumes() {
  console.log("🧹 Janitor: Checking for expired workspaces...");

  if (!docker) {
    console.warn(
      "⚠️ Janitor: Docker socket not found. Skipping volume cleanup (Expected on Render).",
    );
    return;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const expiredUsers = await User.find({
      lastActive: { $lt: thirtyDaysAgo },
    });

    if (expiredUsers.length === 0) {
      console.log("✨ No expired workspaces found.");
      return;
    }

    const { Volumes } = await docker.listVolumes();
    for (const user of expiredUsers) {
      const volumeName = `vol_user_${user._id}`;

      const volumeExists = ((Volumes as DockerVolume[]) || []).some(
        (v: DockerVolume) => v.Name === volumeName,
      );

      if (volumeExists) {
        console.log(`Deleting abandoned volume for user: ${user.username}`);
        await docker
          .getVolume(volumeName)
          .remove()
          .catch((e: Error) =>
            console.error(`Failed to remove ${volumeName}:`, e.message),
          );
      }
    }
  } catch (err) {
    console.error("Janitor Error:", err);
  }
}
