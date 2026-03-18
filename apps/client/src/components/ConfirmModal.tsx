export const ConfirmModal = ({
  title,
  message,
  onConfirm,
  onCancel,
  type = "default",
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "default" | "danger";
}) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className="w-full max-w-sm bg-[#1a1a1b] border border-[#333] rounded-xl shadow-2xl p-6 ring-1 ring-white/10">
      <h2 className="text-sm font-bold font-mono text-white mb-2 uppercase tracking-tight">
        {title}
      </h2>
      <p className="text-xs text-gray-400 font-mono mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-[#252526] hover:bg-[#2d2d2e] text-gray-300 text-[10px] font-bold font-mono rounded border border-[#333] transition-all uppercase"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 py-2 text-white text-[10px] font-bold font-mono rounded shadow-lg transition-all uppercase ${
            type === "danger"
              ? "bg-red-600 hover:bg-red-500"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);
