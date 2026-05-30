import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";

export const ToastContext = createContext(null);

const TOAST_DURATION_MS = 3500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeoutId = timersRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ message, tone = "info" }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, tone }]);

      const timeoutId = setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION_MS);
      timersRef.current.set(id, timeoutId);
    },
    [removeToast]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timersRef.current.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div
            className={`toast toast--${toast.tone}`}
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            role="button"
            tabIndex={0}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
