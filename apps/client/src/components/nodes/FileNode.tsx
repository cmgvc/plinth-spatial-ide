import React, { useState, useEffect, useRef } from "react";
import { Handle, Position, NodeResizer } from "reactflow";

export default function FileNode({
  data,
  selected,
}: {
  data: any;
  selected: boolean;
}) {
  const [code, setCode] = useState(data.code || "");
  const lines = code.split("\n");

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    data.code = newCode;
  };

  return (
    <div
      className="group relative flex flex-col bg-[#1e1e1e] border border-[#3c3c3c] rounded-sm shadow-2xl overflow-hidden"
      style={{ height: "100%", width: "100%" }}
    >
      <NodeResizer
        isVisible={selected}
        minHeight={100}
        minWidth={250}
        lineClassName="border-[#007acc]"
        handleClassName="h-3 w-3 bg-white border border-[#007acc] rounded-full"
      />

      <div className="flex items-center justify-between bg-[#252526] px-3 py-1.5 border-b border-[#3c3c3c] select-none">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-[10px] font-bold">TS</span>
          <span className="text-[#cccccc] text-[11px] font-medium tracking-wide">
            {data.filename || "index.ts"}
          </span>
        </div>
        {selected && <div className="text-[#858585] text-[10px]">Editing</div>}
      </div>

      <div className="flex flex-1 font-mono text-[13px] leading-6 overflow-hidden">
        <div className="bg-[#1e1e1e] text-[#858585] text-right px-3 py-1 select-none border-r border-[#333333] min-w-[40px]">
          {lines.map((_, i) => (
            <div key={i} className="h-6 text-[11px]">
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          className="w-full h-full bg-transparent text-[#d4d4d4] p-1 pl-3 outline-none resize-none overflow-y-auto custom-scrollbar"
          spellCheck={false}
          value={code}
          onChange={handleCodeChange}
          placeholder="// Start coding..."
        />
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#007acc] !w-1 !h-4 !rounded-none border-none opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#007acc] !w-1 !h-4 !rounded-none border-none opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}
