import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types/recipe';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-[#990f4b] shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-[#c05f72] shrink-0 mt-0.5" />,
  };

  const bgStyles = {
    success: 'bg-white border-emerald-200 text-stone-800 shadow-md',
    error: 'bg-white border-[#d27f87] text-stone-800 shadow-md',
    info: 'bg-white border-[#e39e9c] text-stone-800 shadow-md',
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border text-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${bgStyles[toast.type]}`}
    >
      {icons[toast.type]}
      <p className="flex-1 leading-snug font-medium text-stone-800">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Chiudi notifica"
        className="text-stone-400 hover:text-stone-600 p-0.5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
