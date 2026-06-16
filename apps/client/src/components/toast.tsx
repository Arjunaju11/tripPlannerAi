import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "../lib/utils";

type ToastType = "success" | "error" | "info" | "warning";
type Toast = {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
};

type ToastInput = Omit<Toast, "id">;
type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      setItems((current) => [...current, { ...input, id }].slice(-4));
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 grid w-[calc(100%-2rem)] max-w-sm gap-3 sm:right-6 sm:top-6">
        {items.map((item) => {
          const Icon = icons[item.type];
          return (
            <div
              key={item.id}
              className={cn(
                "reveal-card flex items-start gap-3 rounded-lg border bg-surface/95 p-4 shadow-lg backdrop-blur-xl",
                item.type === "success" && "border-emerald-200",
                item.type === "error" && "border-red-200",
                item.type === "info" && "border-sky-200",
                item.type === "warning" && "border-amber-200"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  item.type === "success" && "text-emerald-600",
                  item.type === "error" && "text-red-600",
                  item.type === "info" && "text-sky-600",
                  item.type === "warning" && "text-amber-600"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.title}</p>
                {item.message && <p className="mt-1 text-sm text-slate-500">{item.message}</p>}
              </div>
              <button className="rounded-md p-1 text-slate-400 transition hover:bg-muted hover:text-foreground" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context.toast;
}
