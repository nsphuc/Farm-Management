import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { useTenantStore } from '../stores/useTenantStore';

export const SelectTenantPage = () => {
  const navigate = useNavigate();
  const tenants = useTenantStore((state) => state.tenants);
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant);

  const handleSelect = (tenant) => {
    setCurrentTenant(tenant);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-card text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-600 flex items-center justify-center">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Chọn Trang trại / Tổ chức
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Vui lòng chọn trang trại bạn muốn truy cập để hệ thống thiết lập cách ly dữ liệu.
        </p>

        <div className="mt-6 space-y-3">
          {tenants.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500">
              Chưa có thông tin Trang trại. Hệ thống sẽ tự động gán Trang trại mặc định.
              <button
                onClick={() =>
                  handleSelect({
                    id: 1,
                    code: 'DEFAULT_TENANT',
                    name: 'Trang trại Mẫu AgriTech',
                    subscriptionPlan: 'ENTERPRISE',
                    status: 'ACTIVE',
                  })
                }
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-primary-600 text-white font-semibold text-xs min-h-[44px]"
              >
                Vào Trang trại mặc định
              </button>
            </div>
          ) : (
            tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all text-left min-h-[56px]"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">
                    {t.name}
                  </div>
                  <div className="text-xs text-slate-400">Mã: {t.code}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
