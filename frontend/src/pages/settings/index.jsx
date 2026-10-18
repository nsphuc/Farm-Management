import React, { useState } from 'react';
import { Settings, Building, Calendar, Warehouse, Package, Clock, Coins, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Settings Page - Trung Tâm Cài Đặt Danh Mục Tĩnh (Mục 3.1 File 08)
 * 7 Tabs: Enterprises, Cycles, Warehouses, Materials, BOM Quotas, Shifts, Cost Categories.
 */
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('ENTERPRISE');

  const tabs = [
    { id: 'ENTERPRISE', label: '1. Hồ Sơ Pháp Nhân & VietQR', icon: Building },
    { id: 'CYCLES', label: '2. Chu Kỳ Vận Hành', icon: Calendar },
    { id: 'WAREHOUSES', label: '3. Danh Mục Kho Bãi', icon: Warehouse },
    { id: 'MATERIALS', label: '4. Danh Mục Vật Tư & Quy Đổi', icon: Package },
    { id: 'BOM', label: '5. Định Mức Vật Tư (BOM)', icon: Layers },
    { id: 'SHIFTS', label: '6. Ca Làm Việc & Chấm Công', icon: Clock },
    { id: 'COST_CATEGORIES', label: '7. Khoản Mục Chi Phí', icon: Coins },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Trung Tâm Cài Đặt Danh Mục Tĩnh
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản trị các bảng danh mục chuẩn hóa cấp Tenant với tần suất thay đổi thấp
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Vertical Tabs Sidebar */}
        <div className="w-full md:w-64 space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-left transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold ring-1 ring-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <tab.icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-emerald-700' : 'text-slate-500'}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Detail Pane */}
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs min-h-[400px]">
          <h2 className="text-base font-bold text-slate-900 mb-2">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
          <p className="text-xs text-slate-500">
            Bảng dữ liệu danh mục tĩnh cấu hình theo tiêu chuẩn Agri-ERP Module Master Data.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
