import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { useTenantStore } from '../../stores/useTenantStore';
import { toast } from 'sonner';

export const TenantSwitcher = () => {
  const currentTenant = useTenantStore((state) => state.currentTenant);
  const tenants = useTenantStore((state) => state.tenants);
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:hover:bg-slate-700/70 border border-slate-200/60 dark:border-slate-700/60 transition-colors min-h-[44px]"
      >
        <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
            {currentTenant?.name || 'Chọn Trang trại'}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {currentTenant?.subscriptionPlan || 'Gói dịch vụ'}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Trang trại / Hợp tác xã
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setCurrentTenant(t);
                  setIsOpen(false);
                  toast.success(`Đã chuyển sang trang trại: ${t.name}`);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors ${
                  t.id === currentTenant?.id
                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="truncate font-medium">{t.name}</div>
                  <div className="text-xs text-slate-400">Mã: {t.code}</div>
                </div>
                {t.id === currentTenant?.id && (
                  <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 px-2">
            <button
              onClick={() => {
                setIsOpen(false);
                toast.info('Tính năng đăng ký thêm Trang trại mới sẽ khả dụng ở Phase 2.');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm Trang trại / Tổ chức
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
