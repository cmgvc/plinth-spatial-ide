import { useState, useEffect, useMemo } from "react";
import { ClearWorkspaceModal } from "./ClearWorkspaceModal";

async function getAllFiles(dirHandle: FileSystemDirectoryHandle, path = "") {
  let files: { handle: FileSystemFileHandle; path: string }[] = [];
  // @ts-ignore
  for await (const entry of dirHandle.values()) {
    const currentPath = path ? `${path}/${entry.name}` : entry.name;
    if (entry.kind === "directory") {
      files = [...files, ...(await getAllFiles(entry, currentPath))];
    } else {
      files.push({ handle: entry as FileSystemFileHandle, path: currentPath });
    }
  }
  return files;
}

const ExplorerItem = ({ handle, depth, onFileSelect, path = "" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileSystemHandle[]>([]);
  const isDirectory = handle.kind === "directory";

  const currentPath = path ? `${path}/${handle.name}` : handle.name;

  const toggleOpen = async () => {
    if (!isDirectory) {
      onFileSelect(handle as FileSystemFileHandle, currentPath);
      return;
    }
    if (!isOpen) {
      const entries: FileSystemHandle[] = [];
      // @ts-ignore
      for await (const entry of handle.values()) entries.push(entry);
      setChildren(entries.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "directory" ? -1 : 1)));
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex flex-col w-full">
      <button onClick={toggleOpen} className="group flex items-center py-[4px] w-full hover:bg-[#1a1a1a] transition-all border-l-2 border-transparent hover:border-blue-500/40" style={{ paddingLeft: `${depth * 12 + 12}px` }}>
        <span className={`mr-2 text-[8px] text-gray-600 ${isOpen ? "rotate-90" : ""}`}>{isDirectory ? "▶" : ""}</span>
        <span className="mr-2 text-[14px]">{isDirectory ? (isOpen ? "📂" : "📁") : "📄"}</span>
        <span className="truncate text-[12px] text-[#ccc] group-hover:text-white">{handle.name}</span>
      </button>
      {isOpen && isDirectory && children.map((child) => (
        <ExplorerItem 
          key={child.name} 
          handle={child} 
          depth={depth + 1} 
          onFileSelect={onFileSelect} 
          path={currentPath} 
        />
      ))}
    </div>
  );
};

export default function Sidebar({ onFileSelect, onClear, hasNodes }: any) {
  const [roots, setRoots] = useState<FileSystemDirectoryHandle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allFiles, setAllFiles] = useState<{ handle: FileSystemFileHandle; path: string }[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const syncFiles = async () => {
      let flatList: any[] = [];
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
    return allFiles.filter(f => f.handle.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, allFiles]);

  const triggerPicker = async (shouldClear: boolean) => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      if (shouldClear) { onClear(); setRoots([handle]); }
      else { setRoots(prev => prev.find(r => r.name === handle.name) ? prev : [...prev, handle]); }
      setShowModal(false);
    } catch (e) { setShowModal(false); }
  };

  return (
    <div className="w-72 bg-[#0a0a0a] border-r border-[#1a1a1a] h-screen flex flex-col text-[#ccc] select-none overflow-hidden font-sans">
      {showModal && <ClearWorkspaceModal onConfirm={() => triggerPicker(true)} onCancel={() => triggerPicker(false)} />}

      <div className="p-4 border-b border-[#1a1a1a]">
        <span className="text-[9px] font-bold tracking-[0.2em] text-gray-600 uppercase block mb-4">Explorer</span>
        <button onClick={() => (roots.length > 0 || hasNodes ? setShowModal(true) : triggerPicker(true))} className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-[#aaa] text-[11px] py-1.5 rounded transition-all mb-3">
          {roots.length > 0 ? "Add Folder" : "Open Folder"}
        </button>
        <input
          type="text"
          placeholder="SEARCH FILES..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#050505] border border-[#222] rounded px-2 py-1.5 text-[10px] text-gray-300 focus:outline-none focus:border-blue-500/30 placeholder:text-gray-700 tracking-wider"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {searchQuery ? (
          <div className="flex flex-col">
            {filteredSearch.length > 0 ? filteredSearch.map((file) => (
              <button
                key={file.path}
                onClick={() => onFileSelect(file.handle, file.path)}
                className="group flex flex-col px-4 py-2 hover:bg-[#1a1a1a] border-l-2 border-transparent hover:border-blue-500/40 text-left transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">📄</span>
                  <span className="text-[12px] text-white font-medium truncate">{file.handle.name}</span>
                </div>
                <span className="text-[9px] text-gray-600 font-mono truncate ml-6">{file.path}</span>
              </button>
            )) : (
              <div className="px-6 py-4 text-[10px] text-gray-600 italic">No matches found.</div>
            )}
          </div>
        ) : (
          roots.map((rootHandle) => (
            <ExplorerItem 
              key={rootHandle.name} 
              handle={rootHandle} 
              depth={0} 
              onFileSelect={onFileSelect} 
              path={rootHandle.name} 
            />
          ))
        )}
      </div>
    </div>
  );
}