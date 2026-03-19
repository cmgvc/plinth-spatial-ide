import { useCallback, useRef, useState } from "react";
import axios from "axios";

// This points to RENDER (The Brain)
// Use Render backend URL only in production; keep local dev on localhost.
const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || "http://localhost:5001"
  : "http://localhost:5001";
const USER_API = `${API_BASE_URL}/api/users`;

// This must match the volume/path inside your FLY.IO container
// The Fly terminal engine runs its shell with cwd `/home/sandbox` (see backend `src/server.ts`).
// Keep all uploaded files under that directory.
const WORKSPACE_PATH = `/home/sandbox`;

export function useWorkspaceSync(user: any, socket: any, isConnected: boolean, setUser: any) {
  const [uploadStatus, setUploadStatus] = useState<{ current: number; total: number } | null>(null);
  const createdDirs = useRef<Set<string>>(new Set());

  const syncFolder = useCallback(async (files: any[]) => {
    // 1. Guard: Ensure we have a user and a live connection to the FLY engine
    if (!socket || !isConnected || !user?.id) return;
    
    setUploadStatus({ current: 0, total: files.length });
    createdDirs.current.clear();

    try {
      // 2. Identify the root folder name from the upload
      const rootName = files[0].path.split("/")[0];

      // 3. Update the folder list in MongoDB (RENDER)
      // We pass the userId in the body or URL depending on your preference
      const { data: updatedFolders } = await axios.post(`${USER_API}/sync-folders/${user.id}`, { 
        folderName: rootName 
      });
      
      setUser((prev: any) => prev ? { ...prev, rootFolders: updatedFolders } : null);

      // 4. Prepare the FLY terminal for the upload
      socket.emit(
        "terminal-input",
        `mkdir -p "${WORKSPACE_PATH}/${rootName}" && cd "${WORKSPACE_PATH}/${rootName}"\n`,
      );

      // 5. Batch Upload Files via Socket
      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        const fileData = await fileItem.handle.getFile();
        const code = await fileData.text();
        
        // Sanitize paths
        const absolutePath = `${WORKSPACE_PATH}/${fileItem.path}`.replace(/\/+/g, "/");
        const dirPath = absolutePath.substring(0, absolutePath.lastIndexOf("/"));

        // Create directories on the fly if they haven't been made yet
        if (!createdDirs.current.has(dirPath)) {
          socket.emit("terminal-input", `mkdir -p "${dirPath}"\n`);
          createdDirs.current.add(dirPath);
        }

        // Encode to Base64 to avoid escaping issues with special characters in code
        const base64Content = btoa(unescape(encodeURIComponent(code)));
        
        // Pipe the content into the file on the Fly machine
        socket.emit(
          "terminal-input",
          `echo "${base64Content}" | base64 -d > "${absolutePath}"\n`,
        );
        
        // Throttle slightly to prevent overwhelming the socket buffer
        if (i % 10 === 0) {
          await new Promise((res) => setTimeout(res, 50));
          setUploadStatus({ current: i + 1, total: files.length });
        }
      }

      socket.emit(
        "terminal-input",
        `clear && echo "Workspace '${rootName}' synced successfully."\n`,
      );
      
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      // Hide progress bar after completion
      setTimeout(() => setUploadStatus(null), 1500);
    }
  }, [socket, isConnected, user, setUser]);

  return { syncFolder, uploadStatus };
}