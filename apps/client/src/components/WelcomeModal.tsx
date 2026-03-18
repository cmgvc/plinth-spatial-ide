export const WelcomeModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#1a1a1b] border border-[#333] rounded-xl shadow-2xl p-8 ring-1 ring-white/10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m18 16 4-4-4-4" />
              <path d="m6 8-4 4 4 4" />
              <path d="m14.5 4-5 16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono">
            Welcome to Plinth
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-mono uppercase tracking-widest text-[10px]">
            spatial code canvas
          </p>
        </div>
        <div className="space-y-4">
          <div className="bg-[#111] border border-[#222] rounded-lg p-4">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter mb-3">
              System Shortcuts
            </h3>
            <div className="space-y-3">
              {[
                { label: "Toggle Sidebar", key: "⌘ + B" },
                { label: "Toggle Terminal", key: "⌘ + J" },
                { label: "Zoom In / Out", key: "⌘ + / -" },
                { label: "Search Canvas", key: "⌘ + F" },
                { label: "Save Sync", key: "Auto-save" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-xs text-gray-300 font-mono">
                    {item.label}
                  </span>
                  <span className="px-2 py-0.5 bg-[#252526] border border-[#333] rounded text-[10px] font-mono text-blue-400 shadow-sm">
                    {item.key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono rounded-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-[0.98] uppercase tracking-widest"
        >
          Enter workspace
        </button>
      </div>
    </div>
  );
};
