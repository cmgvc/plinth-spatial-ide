import { useCallback, useRef, useState } from "react";
import axios from "axios";

const USER_API = "http://localhost:5001/api/users";
const WORKSPACE_PATH = `/home/workspace`;

export function useWorkspaceSync(user: any, socket: any, isConnected: boolean, setUser: any) {
  const [uploadStatus, setUploadStatus] = useState<{ current: number; total: number } | null>(null);
  const createdDirs = useRef<Set<string>>(new Set());

  const syncFolder = useCallback(async (files: any[]) => {
    if (!socket || !isConnected || !user) return;
    
    setUploadStatus({ current: 0, total: files.length });
    createdDirs.current.clear();

    try {
      const rootName = files[0].path.split("/")[0];
      const { data: updatedFolders } = await axios.post(`${USER_API}/sync-folders`, { 
        userId: user.id, 
        folderName: rootName 
      });
      
      setUser((prev: any) => prev ? { ...prev, rootFolders: updatedFolders } : null);
      socket.emit("terminal:input", `mkdir -p ${WORKSPACE_PATH}/${rootName} && cd ${WORKSPACE_PATH}/${rootName}\n`);

      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        const fileData = await fileItem.handle.getFile();
        const code = await fileData.text();
        const absolutePath = `${WORKSPACE_PATH}/${fileItem.path}`.replace(/\/+/g, "/");
        const dirPath = absolutePath.substring(0, absolutePath.lastIndexOf("/"));

        if (!createdDirs.current.has(dirPath)) {
          socket.emit("terminal:input", `mkdir -p "${dirPath}"\n`);
          createdDirs.current.add(dirPath);
        }

        const base64Content = btoa(unescape(encodeURIComponent(code)));
        socket.emit("terminal:input", `echo "${base64Content}" | base64 -d > "${absolutePath}"\n`);
        
        if (i % 5 === 0) await new Promise((res) => setTimeout(res, 80));
        setUploadStatus({ current: i + 1, total: files.length });
      }
      socket.emit("terminal:input", `clear && echo "Workspace '${rootName}' synced successfully."\n`);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setTimeout(() => setUploadStatus(null), 1500);
    }
  }, [socket, isConnected, user, setUser]);

  return { syncFolder, uploadStatus };
}