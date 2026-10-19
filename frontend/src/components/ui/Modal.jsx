import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/formatters';
import { renderIcon } from '@/utils/iconHelper';

const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

/**
 * Modal Component - Hộp thoại chuẩn trung tâm
 * Hỗ trợ prop icon đa định dạng (JSX Element hoặc Component type) ở Header.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  preventClose = false,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !preventClose) {
        onClose?.();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" />

      {/* Modal Card */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-white shadow-2xl transition-all transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]',
          MODAL_SIZES[size] || MODAL_SIZES.md
        )}
      >
        {/* Header */}
        {(title || showCloseButton || icon) && (
          <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              {renderIcon(icon, 'h-5 w-5 text-emerald-600 shrink-0')}
              <div>
                {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
              </div>
            </div>
            {showCloseButton && !preventClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
