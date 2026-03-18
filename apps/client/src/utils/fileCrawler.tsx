const EXCLUDED_NAMES = new Set(["node_modules", ".git", "dist", ".DS_Store"]);

interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
}
interface FileSystemFileHandle extends FileSystemHandle {
  kind: "file";
  getFile(): Promise<File>;
}
interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory";
  values(): AsyncIterableIterator<
    FileSystemHandle | FileSystemDirectoryHandle | FileSystemFileHandle
  >;
}

export interface FileItem {
  handle: FileSystemFileHandle;
  path: string;
}

export interface SidebarProps {
  onFileSelect: (handle: FileSystemFileHandle, path: string) => void;
  onFolderUpload: (files: FileItem[]) => void;
  onClear: () => void;
  onLogout: () => void;
  hasNodes: boolean;
  username?: string;
  persistedFolders?: string[];
}

export async function getAllFiles(
  dirHandle: FileSystemDirectoryHandle,
  path: string
): Promise<FileItem[]> {
  const files: FileItem[] = [];

  async function crawl(handle: FileSystemDirectoryHandle, currentPath: string) {
    try {
      for await (const entry of handle.values()) {
        if (EXCLUDED_NAMES.has(entry.name)) continue;
        
        const itemPath = `${currentPath}/${entry.name}`;
        if (entry.kind === "directory") {
          await crawl(entry as FileSystemDirectoryHandle, itemPath);
        } else {
          files.push({ handle: entry as FileSystemFileHandle, path: itemPath });
        }
      }
    } catch (e) {
      console.error("Crawl failed at:", currentPath, e);
    }
  }

  await crawl(dirHandle, path);
  return files;
}