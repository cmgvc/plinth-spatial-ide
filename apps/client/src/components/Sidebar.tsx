import { useState } from "react";
import { ClearWorkspaceModal } from "./ClearWorkspaceModal";

declare global {
  interface Window {
    showDirectoryPicker: (options?: any) => Promise<FileSystemDirectoryHandle>;
  }
}

const ExplorerItem = ({
  handle,
  depth,
  onFileSelect,
}: {
  handle: FileSystemHandle;
  depth: number;
  onFileSelect: (h: FileSystemFileHandle) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileSystemHandle[]>([]);
  const isDirectory = handle.kind === "directory";

  const toggleOpen = async () => {
    if (!isDirectory) {
      onFileSelect(handle as FileSystemFileHandle);
      return;
    }

    if (!isOpen) {
      const entries: FileSystemHandle[] = [];
      // @ts-ignore - values() exists on DirectoryHandle
      for await (const entry of handle.values()) {
        entries.push(entry);
      }
      setChildren(
        entries.sort((a, b) => {
          if (a.kind === b.kind) return a.name.localeCompare(b.name);
          return a.kind === "directory" ? -1 : 1;
        }),
      );
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex flex-col w-full">
      <button
        onClick={toggleOpen}
        className="group flex items-center py-[5px] w-full hover:bg-[#2a2d2e] transition-all border-l-2 border-transparent hover:border-blue-500/40"
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <span
          className={`mr-2 text-[9px] transition-transform duration-200 text-gray-500 ${isOpen ? "rotate-90" : ""}`}
        >
          {isDirectory ? "▶" : ""}
        </span>
        <span className="mr-2 text-[14px]">
          {isDirectory ? (isOpen ? "📂" : "📁") : "📄"}
        </span>
        <span
          className={`truncate text-[13px] tracking-tight ${isDirectory ? "font-medium text-[#ccc]" : "font-light text-[#aaa]"} group-hover:text-white`}
        >
          {handle.name}
        </span>
      </button>

      {isOpen && isDirectory && (
        <div className="flex flex-col w-full">
          {children.map((child) => (
            <ExplorerItem
              key={child.name}
              handle={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Sidebar({
  onFileSelect,
  onClear,
  hasNodes,
}: {
  onFileSelect: (h: FileSystemFileHandle) => void;
  onClear: () => void;
  hasNodes: boolean;
}) {
  const [roots, setRoots] = useState<FileSystemDirectoryHandle[]>([]);
  const [showModal, setShowModal] = useState(false);

  const triggerPicker = async (shouldClear: boolean) => {
    try {
      const handle = await window.showDirectoryPicker();

      if (shouldClear) {
        onClear();
        setRoots([handle]);
      } else {
        setRoots((prev) =>
          prev.find((r) => r.name === handle.name) ? prev : [...prev, handle],
        );
      }
      setShowModal(false);
    } catch (e) {
      console.log("Picker cancelled");
      setShowModal(false);
    }
  };

  const handleOpenFolderClick = () => {
    if (roots.length > 0 || hasNodes) {
      setShowModal(true);
    } else {
      triggerPicker(true);
    }
  };

  return (
    <div className="w-72 bg-[#0a0a0a] border-r border-[#222] h-screen flex flex-col text-[#ccc] select-none overflow-hidden">
      {showModal && (
        <ClearWorkspaceModal
          onConfirm={() => triggerPicker(true)}
          onCancel={() => triggerPicker(false)}
        />
      )}

      <div className="p-5 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">
            Workspace
          </span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/20" />
          </div>
        </div>

        <button
          onClick={handleOpenFolderClick}
          className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-[#eee] text-[12px] py-2 rounded-md transition-all active:scale-[0.97]"
        >
          {roots.length > 0 ? "Add Folder" : "Open Folder"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {roots.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
            <span className="text-4xl mb-2">🔭</span>
            <p className="text-[10px] uppercase tracking-widest font-bold">
              Nothing found
            </p>
          </div>
        ) : (
          roots.map((rootHandle) => (
            <div key={rootHandle.name} className="mb-4">
              <div className="px-4 py-1 text-[9px] font-bold text-blue-500/50 uppercase tracking-widest border-b border-white/5 mb-1">
                Project: {rootHandle.name}
              </div>
              <ExplorerItem
                handle={rootHandle}
                depth={0}
                onFileSelect={onFileSelect}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
