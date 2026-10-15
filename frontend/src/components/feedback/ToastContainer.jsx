import React from 'react';
import { useToastStore } from '../../store/ui/useToastStore';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Component hiển thị danh sách Toast thông báo nổi ở góc trên bên phải màn hình.
 */
export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  if (!toasts.length) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-white/95 text-slate-800 shadow-emerald-500/10',
    error: 'border-rose-200 bg-white/95 text-slate-800 shadow-rose-500/10',
    warning: 'border-amber-200 bg-white/95 text-slate-800 shadow-amber-500/10',
    info: 'border-sky-200 bg-white/95 text-slate-800 shadow-sky-500/10',
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            borders[toast.type] || borders.info
          }`}
        >
          {icons[toast.type] || icons.info}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                {toast.title}
              </h4>
            )}
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
