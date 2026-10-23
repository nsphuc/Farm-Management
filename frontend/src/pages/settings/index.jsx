import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  Building2,
  Calendar,
  Sprout,
  PawPrint,
  Package,
  Warehouse,
  Layers,
  Clock,
  Coins,
} from 'lucide-react';
import { EnterpriseProfileTab } from './tabs/EnterpriseProfileTab';
import { CyclesAndFarmSettingsTab } from './tabs/CyclesAndFarmSettingsTab';
import { CropTypesTab } from './tabs/CropTypesTab';
import { LivestockBreedsTab } from './tabs/LivestockBreedsTab';
import { MaterialsTab } from './tabs/MaterialsTab';
import { WarehousesTab } from './tabs/WarehousesTab';
import { ConsumptionQuotasTab } from './tabs/ConsumptionQuotasTab';
import { WorkShiftsTab } from './tabs/WorkShiftsTab';
import { CostCategoriesTab } from './tabs/CostCategoriesTab';

const SETTINGS_TABS = [
  {
    id: 'enterprise',
    label: '1. Hồ Sơ Pháp Nhân & VietQR',
    icon: Building2,
    desc: 'Hồ sơ doanh nghiệp, tài khoản Napas 24/7 và chứng chỉ chất lượng',
  },
  {
    id: 'cycles-settings',
    label: '2. Chu Kỳ & Ngưỡng Trang Trại',
    icon: Calendar,
    desc: 'Quản lý niên vụ và cấu hình ngưỡng tưới tự động, chấm công',
  },
  {
    id: 'crop-types',
    label: '3. Giống Cây Trồng',
    icon: Sprout,
    desc: 'Danh mục giống cây, ngày sinh trưởng chuẩn, nhu cầu nước',
  },
  {
    id: 'livestock-breeds',
    label: '4. Giống Vật Nuôi',
    icon: PawPrint,
    desc: 'Danh mục 6 loài vật nuôi, chu kỳ nuôi và trọng lượng xuất',
  },
  {
    id: 'materials',
    label: '5. Nhóm & Mặt Hàng Vật Tư',
    icon: Package,
    desc: 'Danh mục vật tư, bao bì đóng gói và hệ số quy đổi đơn vị',
  },
  {
    id: 'warehouses',
    label: '6. Hệ Thống Kho Bãi',
    icon: Warehouse,
    desc: '7 phân loại kho, dung tích chứa và điều kiện nhiệt độ bảo quản',
  },
  {
    id: 'quotas',
    label: '7. Định Mức Kỹ Thuật (BOM)',
    icon: Layers,
    desc: 'Định mức tiêu hao vật tư theo diện tích hoặc quy mô đàn',
  },
  {
    id: 'shifts',
    label: '8. Ca Làm Việc Chuẩn',
    icon: Clock,
    desc: 'Khung giờ làm việc, ca qua đêm và giờ công danh định',
  },
  {
    id: 'cost-categories',
    label: '9. Nhóm Chi Phí Kế Toán',
    icon: Coins,
    desc: '5 nhóm yếu tố chi phí phục vụ tính giá thành vụ mùa',
  },
];

import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeFarmType, supportsCrop, supportsLivestock } = useActiveFarmStore();
  const activeTab = searchParams.get('tab') || 'enterprise';

  const visibleTabs = React.useMemo(() => {
    return SETTINGS_TABS.filter((tab) => {
      if (tab.id === 'livestock-breeds' && !supportsLivestock) return false;
      if (tab.id === 'crop-types' && !supportsCrop) return false;
      return true;
    });
  }, [supportsCrop, supportsLivestock]);

  React.useEffect(() => {
    const isCurrentVisible = visibleTabs.some((t) => t.id === activeTab);
    if (!isCurrentVisible && visibleTabs.length > 0) {
      setSearchParams({ tab: visibleTabs[0].id }, { replace: true });
    }
  }, [activeTab, visibleTabs, setSearchParams]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const currentTabObj = visibleTabs.find((t) => t.id === activeTab) || visibleTabs[0] || SETTINGS_TABS[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Trung Tâm Cài Đặt Danh Mục Tĩnh
              </h1>
              {activeFarmType && (
                <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold border border-slate-200">
                  {activeFarmType === 'CROP'
                    ? '🌾 Trại Trồng Trọt'
                    : activeFarmType === 'LIVESTOCK'
                    ? '🐄 Trại Chăn Nuôi'
                    : '🌐 Hỗn Hợp / Đa Trại'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cấu hình chuẩn hóa cấp Tenant và Trang trại tác nghiệp theo quy tắc Module Master Data Agri-ERP
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs shrink-0 sticky top-20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
            Phân khu Danh Mục Chuẩn
          </div>
          {visibleTabs.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-left transition-all ${
                  isCurrent
                    ? 'bg-emerald-50 text-emerald-900 shadow-2xs font-bold ring-1 ring-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon
                  className={`h-4 w-4 shrink-0 ${isCurrent ? 'text-emerald-700' : 'text-slate-400'}`}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Pane */}
        <div className="flex-1 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xs min-h-[500px]">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <currentTabObj.icon className="h-5 w-5 text-emerald-700" />
              <span>{currentTabObj.label}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{currentTabObj.desc}</p>
          </div>

          {activeTab === 'enterprise' && <EnterpriseProfileTab />}
          {activeTab === 'cycles-settings' && <CyclesAndFarmSettingsTab />}
          {activeTab === 'crop-types' && <CropTypesTab />}
          {activeTab === 'livestock-breeds' && <LivestockBreedsTab />}
          {activeTab === 'materials' && <MaterialsTab />}
          {activeTab === 'warehouses' && <WarehousesTab />}
          {activeTab === 'quotas' && (
            <ConsumptionQuotasTab onNavigateTab={(tab) => handleTabChange(tab)} />
          )}
          {activeTab === 'shifts' && <WorkShiftsTab />}
          {activeTab === 'cost-categories' && <CostCategoriesTab />}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
