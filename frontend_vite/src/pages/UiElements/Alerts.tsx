import { useState, useCallback } from "react";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertOptions {
  variant: AlertVariant;
  message: string;
  title?: string;
  autoClose?: number;
}

type PushFn = (options: AlertOptions) => void;

let _push: PushFn | null = null;

export function useAlertProvider() {
  const [alerts, setAlerts] = useState<(AlertOptions & { id: number })[]>([]);

  const push = useCallback((options: AlertOptions) => {
    const id = Date.now() + Math.random();
    setAlerts((prev) => [...prev, { id, ...options }]);
  }, []);

  const remove = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  _push = push;

  return { alerts, remove };
}

export function useAlert() {
  const show = useCallback((options: AlertOptions) => {
    if (_push) _push(options);
  }, []);

  return {
    success: (message: string, opts?: Partial<AlertOptions>) =>
      show({ variant: "success", message, ...opts }),
    error: (message: string, opts?: Partial<AlertOptions>) =>
      show({ variant: "error", message, ...opts }),
    warning: (message: string, opts?: Partial<AlertOptions>) =>
      show({ variant: "warning", message, ...opts }),
    info: (message: string, opts?: Partial<AlertOptions>) =>
      show({ variant: "info", message, ...opts }),
  };
}