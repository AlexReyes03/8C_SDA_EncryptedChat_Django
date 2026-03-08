import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ToastContext } from './ToastContext';

// Un simple sistema de subscripción para aislar el re-render de estado
const toastEmitter = {
  listeners: [] as ((msg: string) => void)[],
  subscribe(fn: (msg: string) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  },
  emit(msg: string) {
    this.listeners.forEach(fn => fn(msg));
  }
};

const ToastMessage: React.FC = React.memo(() => {
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    const unsub = toastEmitter.subscribe((msg: string) => {
      setToast({ show: true, message: msg });
      setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 4000);
    });
    return unsub;
  }, []);

  if (!toast.show) return null;

  return (
    <div 
      className="toast align-items-center text-bg-success border-0 show position-fixed start-50 translate-middle-x shadow-lg" 
      role="alert" 
      aria-live="assertive" 
      aria-atomic="true"
      style={{ top: '20px', zIndex: 9999, minWidth: '300px' }}
    >
      <div className="d-flex">
        <div className="toast-body fw-bold text-center w-100 fs-6">
          {toast.message}
        </div>
      </div>
    </div>
  );
});

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const showToast = useCallback((message: string) => {
    toastEmitter.emit(message);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastMessage />
    </ToastContext.Provider>
  );
};
