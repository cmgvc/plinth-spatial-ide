import React, { useState, useEffect, useMemo } from "react";
import { FileItem, getAllFiles } from "../utils/fileCrawler";
import { ExplorerItem } from "./ExplorerItem";

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
  onLogout,
  username,
  persistedFolders = [],
}: SidebarProps) {
  const [roots, setRoots] = useState<FileSystemDirectoryHandle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const syncFiles = async () => {
      const flatList: FileItem[] = [];
      for (const root of roots) {
        const files = await getAllFiles(root, root.name);
        flatList.push(...files);
      }
      if (isMounted) setAllFiles(flatList);
    };
    syncFiles();
    return () => {
      isMounted = false;
    };
  }, [roots]);

  const filteredSearch = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return allFiles
      .filter((f) => f.handle.name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [searchQuery, allFiles]);

  const triggerPicker = async () => {
    try {
      const handle = await window.showDirectoryPicker();

      setRoots((prev) =>
        prev.find((r) => r.name === handle.name) ? prev : [...prev, handle],
      );

      const newFiles = await getAllFiles(handle, handle.name);
      onFolderUpload(newFiles);
    } catch (e) {
      console.warn("User aborted directory selection");
    }
  };

  const disconnectedFolders = useMemo(() => {
    return persistedFolders.filter(
      (name) => !roots.some((r) => r.name === name),
    );
  }, [persistedFolders, roots]);

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col text-[#ccc] overflow-hidden font-mono border-r border-[#1a1a1a]">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a] bg-[#0d0d0d] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] font-bold tracking-[0.2em] text-blue-500 uppercase italic">
            Plinth
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full border border-white/5">
            <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
            <span className="text-[8px] text-gray-400 font-bold uppercase">
              {username || "User"}
            </span>
          </div>
        </div>

        <button
          onClick={triggerPicker}
          className="w-full bg-[#111] hover:bg-blue-600/10 hover:border-blue-500/30 border border-[#222] text-[#aaa] hover:text-blue-400 text-[10px] py-2 rounded transition-all mb-3 font-bold uppercase tracking-widest active:scale-95 shadow-inner"
        >
          {roots.length > 0 ? "+ Mount Project" : "Open Folder"}
        </button>

        <input
          type="text"
          placeholder="SEARCH FILENAME..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#050505] border border-[#222] rounded px-3 py-1.5 text-[11px] text-gray-300 focus:outline-none focus:border-blue-500/50 placeholder:text-gray-700 tracking-wide transition-colors"
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
                  <span className="text-sm">📄</span>
                  <span className="text-[12px] text-white font-medium truncate">
                    {file.handle.name}
                  </span>
                </div>
                <span className="text-[9px] text-gray-600 truncate ml-6">
                  {file.path}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {roots.map((rootHandle) => (
              <ExplorerItem
                key={`tree-${rootHandle.name}`}
                handle={rootHandle}
                depth={0}
                onFileSelect={onFileSelect}
                path={rootHandle.name}
              />
            ))}

            {disconnectedFolders.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                <span className="px-4 text-[8px] font-bold text-gray-700 uppercase tracking-widest mb-2 block">
                  Inactive projects
                </span>
                {disconnectedFolders.map((folderName) => (
                  <div
                    key={`ghost-${folderName}`}
                    className="flex items-center justify-between px-4 py-2 opacity-30 hover:opacity-100 group transition-all"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-sm">📁</span>
                      <span className="text-[12px] font-medium truncate italic text-gray-500">
                        {folderName}
                      </span>
                    </div>
                    <button
                      onClick={triggerPicker}
                      className="text-[8px] border border-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded hover:bg-blue-500/10 uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Relink
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-[#1a1a1a] bg-[#080808] flex-shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between px-3 py-2 rounded group hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
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
              Logout
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
