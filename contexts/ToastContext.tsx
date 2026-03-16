import React, { createContext, useState, useContext, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast, ToastData } from '@/components/ui/Toast';

interface ToastContextType {
  showToast: (message: string, options?: Partial<ToastData>) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showUndo: (message: string, onUndo: () => void) => void;
  hideToast: (id: string) => void;
  hideAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = (message: string, options?: Partial<ToastData>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastData = {
      id,
      message,
      type: options?.type || 'info',
      duration: options?.duration || 5000,
      action: options?.action,
      onDismiss: options?.onDismiss,
    };

    setToasts(prev => {
      // Keep only last MAX_TOASTS-1 toasts
      const updated = [...prev.slice(-(MAX_TOASTS - 1)), newToast];
      return updated;
    });
  };

  const showSuccess = (message: string) => {
    showToast(message, { type: 'success' });
  };

  const showError = (message: string) => {
    showToast(message, { type: 'error', duration: 7000 });
  };

  const showWarning = (message: string) => {
    showToast(message, { type: 'warning' });
  };

  const showUndo = (message: string, onUndo: () => void) => {
    showToast(message, {
      type: 'warning',
      duration: 5000,
      action: {
        label: 'Undo',
        onPress: onUndo,
      },
    });
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const hideAll = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showUndo,
        hideToast,
        hideAll,
      }}
    >
      {children}
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <View style={[styles.toastContainer, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onDismiss={hideToast} />
          ))}
        </View>
      )}
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

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});
