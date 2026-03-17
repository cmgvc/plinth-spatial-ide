import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateNodeCode } from "../../stores/fileSlice";
import { Handle, Position } from "reactflow";
import { useAutoSave } from "../../hooks/useAutoSave";
import { useFileTheme } from "../../hooks/useFileTheme";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

interface FileNodeProps {
  id: string;
  data: {
    filename: string;
    code: string;
  };
}

export default function FileNode({ id, data }: FileNodeProps) {
  const dispatch = useDispatch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(true);
  const [localCode, setLocalCode] = useState(data.code);
  const theme = useFileTheme(data.filename);

  useAutoSave(id, localCode);
  const lines = localCode.split("\n");

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  useKeyboardShortcuts(
    "s",
    () => {
      if (isEditing) {
        dispatch(updateNodeCode({ id, code: localCode }));
        setIsEditing(false);
        console.log("File saved and editor closed via Cmd+S");
      }
    },
    true,
  );

  useKeyboardShortcuts(
    "Escape",
    () => {
      if (isEditing) {
        setIsEditing(false);
        setLocalCode(data.code);
      }
    },
    false,
  );

  return (
    <div
      className={`flex flex-col h-full bg-[#1e1e1e] border border-[#333] rounded-md shadow-2xl overflow-hidden ring-1 ring-white/10 ${isEditing ? "nodrag" : ""}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between bg-[#252526] px-3 py-2 border-b border-[#333] drag-handle"
        style={{ borderTop: `2px solid ${theme.color}` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400 font-mono truncate max-w-[150px]">
            {data.filename}
          </span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`text-[9px] px-2 py-0.5 rounded border transition-standard ${isEditing ? "bg-blue-500/20 border-blue-500 text-blue-300" : "border-[#444] text-gray-400"}`}
          >
            {isEditing ? "EDITOR: ON" : "EDITOR: OFF"}
          </button>
          <button
            onClick={() => setIsScrollLocked(!isScrollLocked)}
            className={`text-[9px] px-2 py-0.5 rounded border transition-standard ${isScrollLocked ? "border-red-900/50 text-red-500/70" : "bg-green-500/20 border-green-500 text-green-300"}`}
          >
            {isScrollLocked ? "SCROLL: LOCKED" : "SCROLL: ACTIVE"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative bg-[#1e1e1e]">
        {/* Line numbers */}
        <div
          ref={gutterRef}
          className="bg-[#1c1c1c] text-[#6e7681] text-right px-3 py-4 select-none border-r border-[#333] min-w-[45px] font-mono text-[12px] leading-6 overflow-hidden"
        >
          {lines.map((_: string, i: number) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code content area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={`flex-1 relative ${isScrollLocked ? "overflow-hidden hide-scrollbar" : "overflow-auto custom-scrollbar nodrag nopan nowheel"}`}
        >
          <div className="grid grid-cols-1 grid-rows-1 min-h-full w-full">
            <textarea
              value={localCode}
              onChange={(e) => setLocalCode(e.target.value)}
              spellCheck={false}
              className={`col-start-1 row-start-1 w-full p-4 bg-transparent text-[#d4d4d4] font-mono text-[13px] leading-6 resize-none outline-none border-none whitespace-pre overflow-hidden z-10 transition-opacity duration-75 ${
                isEditing
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
            />
            <pre
              className={`col-start-1 row-start-1 p-4 font-mono text-[13px] leading-6 text-[#d4d4d4] whitespace-pre transition-opacity duration-75 ${
                !isEditing ? "opacity-100" : "opacity-0"
              }`}
            >
              <code>{localCode}</code>
            </pre>
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
