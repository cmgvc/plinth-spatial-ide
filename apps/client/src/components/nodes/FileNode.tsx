import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from "reactflow";

export default function FileNode({ data }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(true); // Default scroll as locked
  const [code, setCode] = useState(data.code);

  const gutterRef = useRef<HTMLDivElement>(null);
  const lines = code.split("\n");

  // Auto-save logic
  useEffect(() => {
    if (code === data.code) return;
    const timeout = setTimeout(() => {
      data.code = code;
    }, 500);
    return () => clearTimeout(timeout);
  }, [code, data]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#1e1e1e] border border-[#333] rounded-md shadow-2xl overflow-hidden ring-1 ring-white/10 ${
        isEditing ? "nodrag" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-[#252526] px-3 py-2 border-b border-[#333] drag-handle">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400 font-mono truncate max-w-[100px]">
            {data.filename}
          </span>

          {/* Toggle for editor */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`text-[9px] px-2 py-0.5 rounded border transition-all ${
              isEditing
                ? "bg-blue-500/20 border-blue-500 text-blue-300"
                : "border-[#444] text-gray-400"
            }`}
          >
            {isEditing ? "EDITOR: ON" : "EDITOR: OFF"}
          </button>

          {/* Toggle for scroll bar */}
          <button
            onClick={() => setIsScrollLocked(!isScrollLocked)}
            className={`text-[9px] px-2 py-0.5 rounded border transition-all ${
              isScrollLocked
                ? "border-red-900 text-red-500"
                : "bg-green-500/20 border-green-500 text-green-300"
            }`}
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
          {code.split("\n").map((_: any, i: number) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code content area */}
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
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              rows={lines.length}
              className="w-full p-4 bg-transparent text-[#d4d4d4] font-mono text-[13px] leading-6 resize-none outline-none border-none whitespace-pre hide-scrollbar block h-auto"
            />
          ) : (
            <pre className="p-4 font-mono text-[13px] leading-6 text-[#d4d4d4] whitespace-pre hide-scrollbar">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
