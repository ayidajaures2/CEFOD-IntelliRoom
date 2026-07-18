import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/** Toasts applicatifs (succès / erreur / info), empilés en bas à droite. */
const NotificationContext = createContext(null);

let nextId = 1;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const notify = useCallback((message, type = "info") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const value = useMemo(
    () => ({
      notify,
      success: (m) => notify(m, "success"),
      error: (m) => notify(m, "error"),
    }),
    [notify]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-left text-sm font-medium text-paper shadow-lg transition-opacity ${
              t.type === "error" ? "bg-accent-dark" : t.type === "success" ? "bg-ink" : "bg-ink/90"
            }`}
          >
            {t.type === "success" && <span className="mr-2 text-accent">✓</span>}
            {t.message}
          </button>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotify = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotify doit être utilisé dans <NotificationProvider>");
  return ctx;
};
