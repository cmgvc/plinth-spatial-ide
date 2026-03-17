import { useState } from "react";

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
}: {
  onFileSelect: (h: FileSystemFileHandle) => void;
}) {
  const [root, setRoot] = useState<FileSystemDirectoryHandle | null>(null);

  const selectFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setRoot(handle);
    } catch (e) {
      console.error("Picker cancelled");
    }
  };

  return (
    <div className="w-72 bg-[#0a0a0a] border-r border-[#222] h-screen flex flex-col text-[#ccc] select-none overflow-hidden">
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
          onClick={selectFolder}
          className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-[#eee] text-[12px] py-2 rounded-md transition-all active:scale-[0.97]"
        >
          {root ? "Change Folder" : "Open Folder"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {!root ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
            <span className="text-4xl mb-2">🔭</span>
            <p className="text-[10px] uppercase tracking-widest font-bold">
              Nothing found
            </p>
          </div>
        ) : (
          <ExplorerItem handle={root} depth={0} onFileSelect={onFileSelect} />
        )}
      </div>
    </div>
  );
}
