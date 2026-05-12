import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/id"; 

dayjs.extend(utc);
dayjs.extend(timezone);


dayjs.locale('id');
export const filterLogStyles = {
  offline:   { badge: "bg-red-100 text-red-800 dark:bg-red-400/40 dark:text-red-200 dark:border dark:border-red-500",     dot: "bg-red-500",    label: "Offline" },
  online: { badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/40 dark:text-emerald-200 dark:border dark:border-emerald-500", dot: "bg-emerald-500",  label: "Online" },
  maintenance: { badge: "bg-amber-100 text-amber-800 dark:bg-amber-400/40 dark:text-amber-200 dark:border dark:border-amber-500", dot: "bg-amber-400",  label: "Perawatan" },
  info:    { badge: "bg-blue-100 text-blue-800 dark:bg-blue-400/40 dark:text-blue-200 dark:border dark:border-blue-500",   dot: "bg-blue-400",   label: "Info" },
  success: { badge: "bg-green-100 text-green-800 dark:bg-green-400/40 dark:text-green-200 dark:border dark:border-green-500", dot: "bg-green-500",  label: "Berhasil" },
  fail:   { badge: "bg-red-100 text-red-800 dark:bg-red-400/40 dark:text-red-200 dark:border dark:border-red-500",     dot: "bg-red-500",    label: "Fail" },
  process:   { badge: "bg-gray-100 text-gray-600 dark:bg-gray-400/40 dark:text-gray-200 dark:border dark:border-gray-500",   dot: "bg-gray-400",   label: "Proses" },
  all:   { badge: "",   dot: "",   label: "Semua Status" },
};

export const filterLogTypes = ["all", "info", "success", "maintenance", "fail", "process", "online", "offline"];

export function LogRow({ log }: any) {
  const style = filterLogStyles[log.tipe as keyof typeof filterLogStyles] || { badge: "bg-gray-100 text-gray-600 dark:bg-gray-400/40 dark:text-gray-200 dark:border dark:border-gray-500", dot: "bg-gray-400" };
  return (
    <div key={log.id} className=" px-4 py-3 border-b border-blue-200 dark:border-gray-700 hover:bg-blue-100/50 dark:hover:bg-slate-950 transition-colors duration-100 last:border-b-0">
      <div className='flex items-start gap-3'>
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style?.dot}`} />
        <span className="text-xs text-gray-400 font-mono pt-0.5 min-w-[68px] shrink-0">
          {dayjs(log.created_at).format('dddd, DD MMMM YYYY HH:mm')}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${style?.badge}`}>
              {log.tipe}
            </span>
            <span className="text-[12px] font-bold text-gray-400 dark:text-gray-400 font-mono truncate">{log.mesin.nama}</span>
          </div>
        </div>

      </div>
      <div className='flex gap-3'>
          <div className='w-2 h-2'></div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{log.payload.message}</p>

      </div>
    </div>
  );
}