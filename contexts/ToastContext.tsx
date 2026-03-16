import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ToastData } from '@/components/ui/Toast';

interface ToastContextType {
  toasts: ToastData[];
  showToast: (message: string, type?: ToastData['type'], duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showUndo: (message: string, onUndo: () => void) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (
    message: string,
    type: ToastData['type'] = 'info',
    duration: number = 5000
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: ToastData = {
      id,
      message,
      type,
      duration,
      onDismiss: () => dismiss(id),
    };

    setToasts((prev) => [...prev, toast]);
  };

  const showSuccess = (message: string) => showToast(message, 'success', 3000);
  
  const showError = (message: string) => showToast(message, 'error', 6000);
  
  const showWarning = (message: string) => showToast(message, 'warning', 5000);

  const showUndo = (message: string, onUndo: () => void) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: ToastData = {
      id,
      message,
      type: 'info',
      duration: 5000,
      action: {
        label: 'Undo',
        onPress: onUndo,
      },
      onDismiss: () => dismiss(id),
    };

    setToasts((prev) => [...prev, toast]);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showUndo,
        dismiss,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
