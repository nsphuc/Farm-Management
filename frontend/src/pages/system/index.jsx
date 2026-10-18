import React, { useState } from 'react';
import { Sliders, ShieldCheck, FileSearch, Bell, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * System Page - Phân Hệ Quản Trị Hệ Thống, An Ninh & Audit (Mục 3.3 File 08)
 */
export function SystemPage() {
  const [activeTab, setActiveTab] = useState('RBAC');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Quản Trị Hệ Thống, An Ninh & Audit
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ma trận phân quyền RBAC 30 mã quyền, nhật ký kiểm toán bất biến và cấu hình tích hợp
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: 'RBAC', label: 'Ma Trận Vai Trò & 30 Quyền (RBAC)', icon: ShieldCheck },
          { id: 'AUDIT', label: 'Nhật Ký Kiểm Toán (Audit Trail)', icon: FileSearch },
          { id: 'NOTIF', label: 'Cấu Hình Thông Báo', icon: Bell },
          { id: 'IOT', label: 'Tích Hợp Trạm IoT & Thiết Bị', icon: Cpu },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs min-h-[350px]">
        <h3 className="font-bold text-sm text-slate-900 mb-2">
          {activeTab === 'RBAC' && 'Quản Lý 5 Vai Trò Tenant & Ma Trận 30 Permissions'}
          {activeTab === 'AUDIT' && 'Truy Vấn Lịch Sử Thao Tác Bất Biến (Audit Trail)'}
          {activeTab === 'NOTIF' && 'Kênh Gửi Thông Báo (In-App & Email)'}
          {activeTab === 'IOT' && 'Cổng Kết Nối Cảm Biến Môi Trường Nhà Màng IoT'}
        </h3>
        <p className="text-xs text-slate-500">
          Dữ liệu được bảo mật tối đa theo cơ chế TransactionPhase.AFTER_COMMIT và Spring Security Context.
        </p>
      </div>
    </div>
  );
}

export default SystemPage;
