import React, { useState } from "react";

interface ExplorerItemProps {
  handle: FileSystemHandle;
  depth: number;
  onFileSelect: (handle: FileSystemFileHandle, path: string) => void;
  path: string;
}

export const ExplorerItem: React.FC<ExplorerItemProps> = ({ 
  handle, depth, onFileSelect, path 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileSystemHandle[]>([]);
  const isDirectory = handle.kind === "directory";

  const toggleOpen = async () => {
    if (!isDirectory) {
      onFileSelect(handle as FileSystemFileHandle, path);
      return;
    }
    if (!isOpen && children.length === 0) {
      const entries: FileSystemHandle[] = [];
      for await (const entry of (handle as FileSystemDirectoryHandle).values()) {
        entries.push(entry);
      }
      setChildren(entries.sort((a, b) => 
        a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "directory" ? -1 : 1
      ));
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
        <span className={`mr-1.5 text-[8px] text-gray-600 transition-transform ${isOpen ? "rotate-90" : ""}`}>
          {isDirectory ? "▶" : ""}
        </span>
        <span className="mr-2 text-[14px]">{isDirectory ? (isOpen ? "📂" : "📁") : "📄"}</span>
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