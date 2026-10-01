import React from 'react';
import { Sprout, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const FarmsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sprout className="w-6 h-6 text-primary-600" />
            <span>Quản lý Trang trại & Phân khu</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cấu hình trang trại, nhà màng, lô đất và các phân khu sản xuất.
          </p>
        </div>
        <button
          onClick={() => toast.info('Chức năng Quản lý Trang trại chi tiết sẽ triển khai ở Phase 2 (Module 1).')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Thêm Trang trại
        </button>
      </div>

      <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
        <Sprout className="w-12 h-12 text-primary-600 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Phân hệ Quản lý Trang trại (Module 1)
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          Các tính năng quản lý chi tiết danh mục trang trại, phân khu nhà màng, chỉ mục đàn và lô canh tác sẽ được kích hoạt toàn diện trong Phase 2 theo Master Plan.
        </p>
      </div>
    </div>
  );
};
