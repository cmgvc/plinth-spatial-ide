import React, { useState, useRef, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setConfirm } from "../../stores/uiSlice";
import { updateNodeCode, removeNode } from "../../stores/fileSlice";
import { Handle, Position } from "reactflow";
import { useFileTheme } from "../../hooks/useFileTheme";
import { getSocket } from "../../services/socket";

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
  const gutterRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(true);
  const [localCode, setLocalCode] = useState(data.code);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const theme = useFileTheme(data.filename);
  const isDirty = localCode !== data.code;
  const lines = localCode.split("\n");

  useEffect(() => {
    setLocalCode(data.code);
  }, [data.code]);

  const isImage = useMemo(() => {
    const ext = data.filename.split(".").pop()?.toLowerCase();
    return ["png", "webp", "jpg", "jpeg", "gif", "svg"].includes(ext || "");
  }, [data.filename]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();

    dispatch(
      setConfirm({
        title: "Remove Node",
        message: `Are you sure you want to remove ${data.filename} from the canvas?`,
        type: "danger",
        onConfirm: () => {
          dispatch(removeNode(id));
          dispatch(setConfirm(null));
        },
      }),
    );
  };

  useEffect(() => {
    if (!isDirty || !data.fileHandle || isImage) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const status = await (data.fileHandle as any).queryPermission({
          mode: "readwrite",
        });
        if (status !== "granted")
          await (data.fileHandle as any).requestPermission({
            mode: "readwrite",
          });

        const writable = await data.fileHandle!.createWritable();
        await writable.write(localCode);
        await writable.close();

        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("file-save", {
            fileName: data.filename,
            content: localCode,
            path: data.path,
          });
        }
        dispatch(updateNodeCode({ id, code: localCode }));
      } catch (err) {
        console.error("Sync failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    localCode,
    data.fileHandle,
    id,
    dispatch,
    isDirty,
    isImage,
    data.filename,
    data.path,
  ]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  useEffect(() => {
    let currentUrl: string | null = null;
    if (isImage && data.fileHandle) {
      data.fileHandle.getFile().then((file: File) => {
        currentUrl = URL.createObjectURL(file);
        setImageUrl(currentUrl);
      });
    }
    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [isImage, data.fileHandle]);

  return (
    <div
      className={`flex flex-col w-[50vw] h-[100vh] bg-[#1e1e1e] border border-[#333] rounded-md shadow-2xl overflow-hidden ring-1 ring-white/10 ${isEditing ? "nodrag nopan" : ""}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between bg-[#1a1a1b] px-3 py-2 border-b border-[#333] drag-handle cursor-grab active:cursor-grabbing"
        style={{ borderTop: `2px solid ${theme.color}` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-200 font-bold font-mono truncate">
                {data.filename}
              </span>
              {isSaving ? (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              ) : isDirty ? (
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
              )}
            </div>
          </div>

          {!isImage && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`text-[9px] px-2 py-0.5 rounded border font-bold transition-all ${isEditing ? "bg-blue-500/20 border-blue-500 text-blue-300" : "border-[#333] text-gray-500 hover:text-gray-300"}`}
              >
                {isEditing ? "EDITOR: ON" : "EDITOR: OFF"}
              </button>
              <button
                onClick={() => setIsScrollLocked(!isScrollLocked)}
                className={`text-[9px] px-2 py-0.5 rounded border font-bold transition-all ${isScrollLocked ? "border-red-900/40 text-red-500/50" : "bg-green-500/20 border-green-500 text-green-300"}`}
              >
                {isScrollLocked ? "SCROLL: LOCKED" : "SCROLL: ACTIVE"}
              </button>
            </div>
          )}
        </div>

        {/* Delete button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="nodrag p-1 hover:bg-red-500/20 rounded transition-colors group"
            title="Remove from canvas"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500 group-hover:text-red-500"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative bg-[#1e1e1e]">
        {isImage ? (
          <div className="flex-1 flex items-center justify-center p-4 bg-[#111] overflow-auto">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={data.filename}
                className="max-w-full max-h-full object-contain shadow-2xl rounded"
              />
            )}
          </div>
        ) : (
          <>
            {/* Line numbers */}
            <div
              ref={gutterRef}
              className="bg-[#1c1c1c] text-[#6e7681] text-right px-3 py-4 select-none border-r border-[#333] min-w-[45px] font-mono text-[12px] leading-6 overflow-hidden"
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code area */}
            <div
              onScroll={handleScroll}
              className={`flex-1 relative ${
                isScrollLocked
                  ? "overflow-hidden hide-scrollbar"
                  : "overflow-auto custom-scrollbar nodrag nopan nowheel"
              }`}
              style={{ height: "100%" }}
            >
              {isEditing ? (
                <textarea
                  value={localCode}
                  onChange={(e) => setLocalCode(e.target.value)}
                  spellCheck={false}
                  rows={lines.length}
                  className="w-full p-4 bg-transparent text-[#d4d4d4] font-mono text-[13px] leading-6 resize-none outline-none border-none whitespace-pre hide-scrollbar block h-auto"
                />
              ) : (
                <pre className="p-4 font-mono text-[13px] leading-6 text-[#d4d4d4] whitespace-pre hide-scrollbar">
                  <code>{localCode}</code>
                </pre>
              )}
            </div>
          </>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
