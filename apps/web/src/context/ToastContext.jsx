import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ToastContext = createContext(null);

const TOAST_TONES = {
  success: {
    accent: "border-emerald-300/22 bg-[linear-gradient(180deg,rgba(6,18,14,0.96),rgba(7,12,16,0.98))] text-emerald-50",
    badge: "border-emerald-200/22 bg-emerald-500/14 text-emerald-100",
    glow: "bg-emerald-400/18",
    progress: "from-emerald-300 to-sky-300",
    icon: "Done",
    label: "Success"
  },
  error: {
    accent: "border-red-300/22 bg-[linear-gradient(180deg,rgba(25,10,12,0.96),rgba(14,8,10,0.98))] text-red-50",
    badge: "border-red-200/22 bg-red-500/14 text-red-100",
    glow: "bg-red-400/18",
    progress: "from-red-300 to-orange-300",
    icon: "Hold",
    label: "Error"
  },
  info: {
    accent: "border-sky-300/22 bg-[linear-gradient(180deg,rgba(10,16,24,0.96),rgba(8,10,16,0.98))] text-sky-50",
    badge: "border-sky-200/22 bg-sky-500/14 text-sky-100",
    glow: "bg-sky-400/18",
    progress: "from-sky-300 to-violet-300",
    icon: "Note",
    label: "Info"
  }
};

const createToastId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutMapRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timeoutId = timeoutMapRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }

    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    ({ type = "info", title, description = "", duration = 3600 }) => {
      const id = createToastId();
      const toast = { id, type, title, description, duration };
      setToasts((previous) => [...previous, toast]);

      const timeoutId = window.setTimeout(() => {
        dismiss(id);
      }, duration);

      timeoutMapRef.current.set(id, timeoutId);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      push,
      dismiss,
      success: (title, description = "", duration) => push({ type: "success", title, description, duration }),
      error: (title, description = "", duration) => push({ type: "error", title, description, duration }),
      info: (title, description = "", duration) => push({ type: "info", title, description, duration })
    }),
    [dismiss, push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex justify-center px-4 sm:justify-end sm:px-8">
        <div className="flex w-full max-w-md flex-col gap-3">
          <AnimatePresence>
            {toasts.map((toast) => {
              const tone = TOAST_TONES[toast.type] || TOAST_TONES.info;

              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={`pointer-events-auto relative overflow-hidden rounded-[1.55rem] border px-4 py-4 shadow-[0_18px_55px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl ${tone.accent}`}
                >
                  <div className={`pointer-events-none absolute -left-6 top-2 h-20 w-20 rounded-full blur-3xl ${tone.glow}`} />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative z-10">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${tone.badge}`}>
                          {tone.label}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/58">
                          {tone.icon}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-medium text-white">{toast.title}</p>
                      {toast.description ? (
                        <p className="mt-1 text-sm leading-6 text-white/72">{toast.description}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(toast.id)}
                      className="relative z-10 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/72 transition hover:bg-white/10 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <motion.div
                    className={`absolute inset-x-4 bottom-0 h-[3px] origin-left rounded-full bg-gradient-to-r ${tone.progress}`}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: toast.duration / 1000, ease: "linear" }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
};

export { ToastProvider, useToast };
