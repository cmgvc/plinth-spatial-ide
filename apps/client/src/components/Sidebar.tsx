import React, { useState, useEffect, useMemo } from "react";
import { ClearWorkspaceModal } from "./ClearWorkspaceModal";

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
interface FileItem {
  handle: FileSystemFileHandle;
  path: string;
}

async function getAllFiles(
  dirHandle: FileSystemDirectoryHandle,
  path: string,
): Promise<FileItem[]> {
  let files: FileItem[] = [];
  try {
    for await (const entry of dirHandle.values()) {
      const currentPath = `${path}/${entry.name}`;
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === "dist"
      )
        continue;

      if (entry.kind === "directory") {
        const nested = await getAllFiles(
          entry as FileSystemDirectoryHandle,
          currentPath,
        );
        files = [...files, ...nested];
      } else {
        files.push({
          handle: entry as FileSystemFileHandle,
          path: currentPath,
        });
      }
    }
  } catch (e) {
    console.error("Recursive file search failed", e);
  }
  return files;
}

const ExplorerItem = ({
  handle,
  depth,
  onFileSelect,
  path,
}: {
  handle: any;
  depth: number;
  onFileSelect: any;
  path: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileSystemHandle[]>([]);
  const isDirectory = handle.kind === "directory";

  const toggleOpen = async () => {
    if (!isDirectory) {
      onFileSelect(handle as FileSystemFileHandle, path);
      return;
    }
    if (!isOpen) {
      const entries: FileSystemHandle[] = [];
      for await (const entry of (
        handle as FileSystemDirectoryHandle
      ).values()) {
        entries.push(entry);
      }
      setChildren(
        entries.sort((a, b) =>
          a.kind === b.kind
            ? a.name.localeCompare(b.name)
            : a.kind === "directory"
              ? -1
              : 1,
        ),
      );
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex flex-col w-full select-none">
      <button
        onClick={toggleOpen}
        className="group flex items-center py-[6px] w-full hover:bg-[#1a1a1a] transition-all border-l-2 border-transparent hover:border-blue-500/40"
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
      >
        <span
          className={`mr-1.5 text-[8px] text-gray-600 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        >
          {isDirectory ? "▶" : ""}
        </span>
        <span className="mr-2 text-[14px] leading-none">
          {isDirectory ? (isOpen ? "📂" : "📁") : "📄"}
        </span>
        <span className="truncate text-[12px] text-[#ccc] group-hover:text-white font-medium">
          {handle.name}
        </span>
      </button>
      {isOpen && isDirectory && (
        <div className="flex flex-col w-full">
          {children.map((child) => (
            <ExplorerItem
              key={`${path}/${child.name}`}
              handle={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              path={`${path}/${child.name}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  onFileSelect: (handle: FileSystemFileHandle, path: string) => void;
  onFolderUpload: (files: FileItem[]) => void;
  onClear: () => void;
  onLogout: () => void;
  hasNodes: boolean;
  username?: string;
  persistedFolders?: string[]; 
}

export default function Sidebar({
  onFileSelect,
  onFolderUpload,
  onClear,
  onLogout,
  hasNodes,
  username,
  persistedFolders = [],
}: SidebarProps) {
  const [roots, setRoots] = useState<FileSystemDirectoryHandle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const syncFiles = async () => {
      let flatList: FileItem[] = [];
      for (const root of roots) {
        const files = await getAllFiles(root, root.name);
        flatList = [...flatList, ...files];
      }
      setAllFiles(flatList);
    };
    syncFiles();
  }, [roots]);

  const filteredSearch = useMemo(() => {
    if (!searchQuery) return [];
    return allFiles.filter((f) =>
      f.handle.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, allFiles]);

  const triggerPicker = async (shouldClear: boolean) => {
    try {
      const handle = await window.showDirectoryPicker();
      const newFiles = await getAllFiles(handle, handle.name);

      if (shouldClear) {
        onClear();
        setRoots([handle]);
      } else {
        setRoots((prev) =>
          prev.find((r) => r.name === handle.name) ? prev : [...prev, handle],
        );
      }

      if (onFolderUpload) onFolderUpload(newFiles);
      setShowModal(false);
    } catch (e) {
      setShowModal(false);
      console.error("Picker Action Failed:", e);
    }
  };

  const handleOpenClick = () => {
    if (roots.length > 0 || hasNodes) {
      setShowModal(true);
    } else {
      triggerPicker(true);
    }
  };

  // Find folders saved in DB but not connected in this state
  const disconnectedFolders = useMemo(() => {
    return persistedFolders.filter(
      (name) => !roots.some((r) => r.name === name),
    );
  }, [persistedFolders, roots]);

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col text-[#ccc] overflow-hidden font-mono border-r border-[#1a1a1a]">
      {showModal && (
        <ClearWorkspaceModal
          onConfirm={() => triggerPicker(true)}
          onCancel={() => triggerPicker(false)}
        />
      )}

      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a] bg-[#0d0d0d] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] font-bold tracking-[0.2em] text-blue-500 uppercase">
            Plinth
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[8px] text-gray-500 font-bold uppercase">
              {username || "User"}
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenClick}
          className="w-full bg-[#111] hover:bg-blue-600/10 hover:border-blue-500/30 border border-[#222] text-[#aaa] hover:text-blue-400 text-[10px] py-2 rounded transition-all mb-3 font-bold uppercase tracking-widest active:scale-95"
        >
          {roots.length > 0 ? "+ Add Project" : "Open Folder"}
        </button>
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#050505] border border-[#222] rounded px-3 py-1.5 text-[11px] text-gray-300 focus:outline-none focus:border-blue-500/50 placeholder:text-gray-700 tracking-wide"
        />
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar bg-[#0a0a0a]">
        {searchQuery ? (
          <div className="flex flex-col">
            {filteredSearch.map((file) => (
              <button
                key={`search-${file.path}`}
                onClick={() => onFileSelect(file.handle, file.path)}
                className="group flex flex-col px-4 py-2 hover:bg-[#1a1a1a] border-l-2 border-transparent hover:border-blue-500/40 text-left transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">📄</span>
                  <span className="text-[12px] text-white font-medium truncate">
                    {file.handle.name}
                  </span>
                </div>
                <span className="text-[9px] text-gray-600 font-mono truncate ml-6">
                  {file.path}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Active Connected Folders */}
            {roots.map((rootHandle) => (
              <ExplorerItem
                key={`tree-${rootHandle.name}`}
                handle={rootHandle}
                depth={0}
                onFileSelect={onFileSelect}
                path={rootHandle.name}
              />
            ))}

            {/* Ghost Folders */}
            {disconnectedFolders.map((folderName) => (
              <div
                key={`ghost-${folderName}`}
                className="flex items-center justify-between px-4 py-2 opacity-40 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[14px]">📁</span>
                  <span className="text-[12px] font-medium truncate italic text-gray-400">
                    {folderName}
                  </span>
                </div>
                <button
                  onClick={handleOpenClick}
                  className="text-[8px] border border-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded hover:bg-blue-500/10 uppercase font-bold"
                >
                  Link
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-[#1a1a1a] bg-[#080808] flex-shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md group hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
        >
          <div className="flex items-center gap-2.5">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-gray-600 group-hover:text-red-500 transition-colors"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="text-[9px] uppercase tracking-[0.15em] text-gray-600 group-hover:text-red-500 font-bold transition-colors">
              End Session
            </span>
          </div>
          <span className="text-[8px] text-gray-800 font-bold group-hover:text-red-900">
            ESC
          </span>
        </button>
      </div>
    </div>
  );
}
