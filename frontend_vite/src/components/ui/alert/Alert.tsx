import { useState, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useAlertProvider, type AlertOptions, type AlertVariant } from "../../../pages/UiElements/Alert";

// ─── Config per variant ───────────────────────────────────────────────────────
const VARIANTS: Record<
  AlertVariant,
  {
    icon: React.ElementType;
    bar: string;
    iconClass: string;
    wrapper: string;
    title: string;
    msg: string;
    close: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bar: "bg-emerald-400",
    iconClass: "text-emerald-500",
    wrapper: "bg-white border border-emerald-200 shadow-emerald-100/60",
    title: "text-emerald-800",
    msg: "text-emerald-700/80",
    close: "hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600",
  },
  error: {
    icon: XCircle,
    bar: "bg-rose-400",
    iconClass: "text-rose-500",
    wrapper: "bg-white border border-rose-200 shadow-rose-100/60",
    title: "text-rose-800",
    msg: "text-rose-700/80",
    close: "hover:bg-rose-50 text-rose-400 hover:text-rose-600",
  },
  warning: {
    icon: AlertTriangle,
    bar: "bg-amber-400",
    iconClass: "text-amber-500",
    wrapper: "bg-white border border-amber-200 shadow-amber-100/60",
    title: "text-amber-800",
    msg: "text-amber-700/80",
    close: "hover:bg-amber-50 text-amber-400 hover:text-amber-600",
  },
  info: {
    icon: Info,
    bar: "bg-sky-400",
    iconClass: "text-sky-500",
    wrapper: "bg-white border border-sky-200 shadow-sky-100/60",
    title: "text-sky-800",
    msg: "text-sky-700/80",
    close: "hover:bg-sky-50 text-sky-400 hover:text-sky-600",
  },
};

// ─── Single Alert Item ────────────────────────────────────────────────────────
interface AlertItemProps extends AlertOptions {
  id: number;
  onRemove: (id: number) => void;
}

function AlertItem({
  id,
  variant = "info",
  title,
  message,
  autoClose = 4000,
  onRemove,
}: AlertItemProps) {
  const cfg = VARIANTS[variant];
  const Icon = cfg.icon;

  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const remainRef = useRef(autoClose);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const close = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLeaving(true);
    setTimeout(() => onRemove(id), 380);
  };

  const startTimer = () => {
    if (!autoClose) return;
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, ((remainRef.current - elapsed) / autoClose) * 100);
      setProgress(pct);
      if (pct === 0) close();
    }, 50);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const pause = () => {
    pausedRef.current = true;
    remainRef.current -= Date.now() - startRef.current;
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resume = () => {
    pausedRef.current = false;
    startTimer();
  };

  return (
    <div
      onMouseEnter={pause}
      onMouseLeave={resume}
      style={{ transition: "all 0.38s cubic-bezier(0.16,1,0.3,1)" }}
      className={[
        "relative w-80 rounded-xl shadow-lg overflow-hidden select-none",
        cfg.wrapper,
        visible && !leaving ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
      ].join(" ")}
    >
      {/* left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar}`} />

      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        <Icon
          className={`shrink-0 mt-0.5 ${cfg.iconClass}`}
          size={18}
          strokeWidth={2.2}
        />

        <div className="flex-1 min-w-0">
          {title && (
            <p className={`text-[13px] font-semibold leading-snug ${cfg.title}`}>
              {title}
            </p>
          )}
          {message && (
            <p className={`text-[12.5px] leading-snug mt-0.5 ${cfg.msg}`}>
              {message}
            </p>
          )}
        </div>

        <button
          onClick={close}
          className={`shrink-0 p-1 rounded-md transition-colors duration-150 ${cfg.close}`}
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* progress bar */}
      {autoClose > 0 && (
        <div
          className={`h-[3px] ${cfg.bar} opacity-40`}
          style={{ width: `${progress}%`, transition: "width 50ms linear" }}
        />
      )}
    </div>
  );
}

// ─── Alert Container ──────────────────────────────────────────────────────────
export function AlertProvider() {
  const { alerts, remove } = useAlertProvider();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {alerts.map((a) => (
        <div key={a.id} className="pointer-events-auto">
          <AlertItem {...a} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}