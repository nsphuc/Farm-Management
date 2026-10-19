import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/formatters';
import { renderIcon } from '@/utils/iconHelper';

/**
 * SlideOverDrawer Component - Khay trượt ngang từ cạnh phải
 * Phục vụ nhập liệu thực thể 360° (Hồ sơ nhân sự, lô hàng, phiếu kho)
 * Hỗ trợ đa định dạng icon: JSX element hoặc component type cho cả Drawer header và Tabs.
 */
export function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  tabs = [],
  activeTab,
  onTabChange,
  width = 'max-w-2xl',
}) {
  // Lắng nghe phím Escape và khóa cuộn trang
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={cn(
            'w-screen transform bg-white shadow-2xl transition-all duration-300 animate-in slide-in-from-right flex flex-col',
            width
          )}
        >
          {/* Header */}
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {renderIcon(icon, 'h-5 w-5 text-emerald-600 shrink-0')}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                  {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs nếu có */}
            {tabs && tabs.length > 0 && (
              <div className="mt-4 flex space-x-2 border-b border-slate-200">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange?.(tab.id)}
                      className={cn(
                        'flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors',
                        isActive
                          ? 'border-emerald-600 text-emerald-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      )}
                    >
                      {renderIcon(tab.icon, 'h-4 w-4 shrink-0')}
                      <span>{tab.label}</span>
                      {tab.badge !== undefined && (
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          )}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SlideOverDrawer;
