export const ClearWorkspaceModal = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="w-80 bg-[#1c1c1c] border border-[#333] rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
      <h3 className="text-white text-sm font-semibold mb-2">Clear Workspace?</h3>
      <p className="text-gray-400 text-xs leading-relaxed mb-6">
        Do you want to clear current nodes before opening a new folder? This cannot be undone.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-[11px] text-gray-400 hover:text-white transition-colors"
        >
          Keep Nodes
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 text-[11px] rounded transition-all"
        >
          Clear All
        </button>
      </div>
    </div>
  </div>
);