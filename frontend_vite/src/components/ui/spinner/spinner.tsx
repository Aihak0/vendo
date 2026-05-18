

export default function Spinner() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 flex flex-col items-center justify-center z-50 overflow-hidden">
      
      {/* Pulse rings */}
      <div className="absolute w-44 h-44 rounded-full border border-blue-500/25 animate-ping" style={{ animationDuration: "2.4s" }} />
      <div className="absolute w-60 h-60 rounded-full border border-blue-500/20 animate-ping" style={{ animationDuration: "2.4s", animationDelay: "0.6s" }} />
      <div className="absolute w-80 h-80 rounded-full border border-blue-500/15 animate-ping" style={{ animationDuration: "2.4s", animationDelay: "1.2s" }} />

    

      {/* Spinner rings */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-100 dark:border-t-blue-900 border-r-blue-300 dark:border-r-blue-950 animate-spin" style={{ animationDuration: "1.1s" }} />
        {/* Mid ring */}
        <div className="absolute inset-[10px] rounded-full border-[2.5px] border-transparent border-b-blue-100 border-b-blue-400 dark:border-b-blue-900 dark:border-l-blue-800 animate-spin" style={{ animationDuration: "0.85s", animationDirection: "reverse" }} />
        {/* Inner ring */}
        <div className="absolute inset-[22px] rounded-full border-2 border-transparent border-t-blue-300 dark:border-t-blue-800 animate-spin" style={{ animationDuration: "1.4s" }} />
        {/* Center core */}
        <div className="w-[18px] h-[18px] rounded-full bg-gray-100 dark:bg-slate-900 border-2 bg-blue-100 dark:border-blue-950 z-10" />
      </div>

      {/* Label */}
      <div className="mt-7 flex flex-col items-center gap-2">
        <span className="text-sm font-medium tracking-[0.12em] uppercase text-gray-600 dark:text-slate-500 animate-pulse">
          Memuat
        </span>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-200 dark:bg-blue-900 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}