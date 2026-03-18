import React, { useState, useRef, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateNodeCode } from "../../stores/fileSlice";
import { Handle, Position } from "reactflow";
import { useFileTheme } from "../../hooks/useFileTheme";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

interface FileNodeProps {
  id: string;
  data: {
    filename: string;
    path: string;
    code: string;
    fileHandle?: FileSystemFileHandle;
  };
}

export default function FileNode({ id, data }: FileNodeProps) {
  const dispatch = useDispatch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(true);
  const [localCode, setLocalCode] = useState(data.code);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const theme = useFileTheme(data.filename);
  const isDirty = localCode !== data.code;
  const lines = localCode.split("\n");

  const isImage = useMemo(() => {
    const ext = data.filename.split('.').pop()?.toLowerCase();
    return ["png", "webp", "jpg", "jpeg", "gif", "svg"].includes(ext || "");
  }, [data.filename]);

  // Auto save logic
  useEffect(() => {
    if (!isDirty || !data.fileHandle || isImage) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const status = await data.fileHandle!.queryPermission({ mode: 'readwrite' });
        if (status !== 'granted') {
          await data.fileHandle!.requestPermission({ mode: 'readwrite' });
        }

        const writable = await data.fileHandle!.createWritable();
        await writable.write(localCode);
        await writable.close();

        dispatch(updateNodeCode({ id, code: localCode }));
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [localCode, data.fileHandle, id, dispatch, isDirty, isImage]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  useEffect(() => {
    let currentUrl: string | null = null;
    if (isImage && data.fileHandle) {
      data.fileHandle.getFile().then((file: File) => {
        currentUrl = URL.createObjectURL(file);
        setImageUrl(currentUrl);
      });
    }
    return () => { if (currentUrl) URL.revokeObjectURL(currentUrl); };
  }, [isImage, data.fileHandle]);

  return (
    <div className={`flex flex-col h-full bg-[#1e1e1e] border border-[#333] rounded-md shadow-2xl overflow-hidden ring-1 ring-white/10 ${isEditing ? "nodrag" : ""}`}>
      
      <div className="flex items-center justify-between bg-[#1a1a1b] px-3 py-2 border-b border-[#333] drag-handle" style={{ borderTop: `2px solid ${theme.color}` }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-200 font-bold font-mono truncate">{data.filename}</span>
              
              {isSaving ? (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              ) : isDirty ? (
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80" title="Unsaved changes" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" title="Synced to disk" />
              )}
            </div>
            <span className="text-[8px] text-gray-600 font-mono truncate opacity-60 uppercase tracking-tighter">
              {data.path}
            </span>
          </div>
          
          {!isImage && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`text-[9px] px-2 py-0.5 rounded border transition-all ${isEditing ? "bg-blue-500/20 border-blue-500 text-blue-300" : "border-[#333] text-gray-500 hover:text-gray-300"}`}
              >
                {isEditing ? "EDITING" : "VIEWING"}
              </button>
              <button
                onClick={() => setIsScrollLocked(!isScrollLocked)}
                className={`text-[9px] px-2 py-0.5 rounded border transition-all ${isScrollLocked ? "border-red-900/40 text-red-500/50" : "border-green-900/40 text-green-500/50"}`}
              >
                {isScrollLocked ? "LOCKED" : "SCROLL"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative bg-[#1e1e1e]">
        {isImage ? (
          <div className="flex-1 flex items-center justify-center p-4 bg-[#111] overflow-auto">
            {imageUrl && <img src={imageUrl} alt={data.filename} className="max-w-full max-h-full object-contain shadow-2xl rounded" />}
          </div>
        ) : (
          <>
            <div ref={gutterRef} className="bg-[#1c1c1c] text-[#4b535d] text-right px-3 py-4 select-none border-r border-[#2b2b2b] min-w-[45px] font-mono text-[11px] leading-6 overflow-hidden">
              {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>

            <div ref={scrollContainerRef} onScroll={handleScroll} className={`flex-1 relative ${isScrollLocked ? "overflow-hidden hide-scrollbar" : "overflow-auto custom-scrollbar nodrag nopan nowheel"}`}>
              <div className="grid grid-cols-1 grid-rows-1 min-h-full w-full">
                <textarea
                  value={localCode}
                  onChange={(e) => setLocalCode(e.target.value)}
                  spellCheck={false}
                  className={`col-start-1 row-start-1 w-full p-4 bg-transparent text-[#d4d4d4] font-mono text-[13px] leading-6 resize-none outline-none border-none whitespace-pre overflow-hidden z-10 transition-opacity ${isEditing ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                />
                <pre className={`col-start-1 row-start-1 p-4 font-mono text-[13px] leading-6 text-[#d4d4d4] whitespace-pre transition-opacity ${!isEditing ? "opacity-100" : "opacity-0"}`}>
                  <code className="block">{localCode}</code>
                </pre>
              </div>
            </div>
          </>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}