export const UploadProgressBar = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  const percentage = Math.round((current / total) * 100);
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-72 bg-[#111]/90 border border-blue-500/20 rounded-lg p-4 shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
          Syncing Workspace
        </span>
        <span className="text-[10px] font-mono text-gray-400">
          {percentage}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-[9px] text-gray-500 font-mono text-center">
        {current} / {total} files synced
      </div>
    </div>
  );
};