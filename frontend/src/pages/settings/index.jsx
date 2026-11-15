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
  PanelLeftClose,
  PanelLeftOpen,
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
import { useAuthStore } from '@/store/useAuthStore';

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isNavCollapsed, setIsNavCollapsed] = React.useState(false);
  const { activeFarmType, supportsCrop, supportsLivestock } = useActiveFarmStore();
  const { isTechnicalLead, isWarehouseKeeper, isFarmAccountant, hasPermission } = useAuthStore();

  const isTechStaff = isTechnicalLead() || (!hasPermission('PERM_FARM_UPDATE') && (hasPermission('PERM_CROP_PLAN') || hasPermission('PERM_LIVESTOCK_MANAGE')));
  const isWarehouseStaff = isWarehouseKeeper() || (!hasPermission('PERM_FARM_UPDATE') && hasPermission('PERM_INVENTORY_RECEIPT'));
  const isAccountantStaff =
    isFarmAccountant() ||
    (!hasPermission('PERM_FARM_UPDATE') && hasPermission('PERM_FINANCE_EXPENSE'));

  const visibleTabs = React.useMemo(() => {
    return SETTINGS_TABS.filter((tab) => {
      // Kế toán chỉ quản lý đúng 1 danh mục: Nhóm chi phí kế toán ('cost-categories')
      if (isAccountantStaff) {
        return tab.id === 'cost-categories';
      }
      // Thủ kho chỉ quản lý 2 danh mục: Nhóm & Mặt hàng vật tư ('materials'), Hệ thống kho bãi ('warehouses')
      if (isWarehouseStaff && !['materials', 'warehouses'].includes(tab.id)) {
        return false;
      }
      // Kỹ sư kỹ thuật chỉ quản lý 3 danh mục kỹ thuật: Giống cây, Giống vật nuôi, Định mức BOM
      if (isTechStaff && !['crop-types', 'livestock-breeds', 'quotas'].includes(tab.id)) {
        return false;
      }
      if (tab.id === 'livestock-breeds' && !supportsLivestock) return false;
      if (tab.id === 'crop-types' && !supportsCrop) return false;
      return true;
    });
  }, [isAccountantStaff, isWarehouseStaff, isTechStaff, supportsCrop, supportsLivestock]);

  const defaultTab = React.useMemo(() => {
    if (visibleTabs.length > 0) return visibleTabs[0].id;
    if (isAccountantStaff) return 'cost-categories';
    return isWarehouseStaff ? 'materials' : 'enterprise';
  }, [visibleTabs, isAccountantStaff, isWarehouseStaff]);

  const rawActiveTab = searchParams.get('tab');
  const activeTab = rawActiveTab || defaultTab;

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
            {isWarehouseStaff ? (
              <Warehouse className="h-6 w-6" />
            ) : isAccountantStaff ? (
              <Coins className="h-6 w-6" />
            ) : (
              <Settings className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {isWarehouseStaff
                  ? 'Danh Mục Kho Bãi & Vật Tư'
                  : isTechStaff
                  ? 'Danh Mục Giống & Định Mức BOM'
                  : isAccountantStaff
                  ? 'Danh Mục Nhóm Chi Phí & Khoản Mục Hạch Toán'
                  : 'Trung Tâm Cài Đặt Danh Mục Tĩnh'}
              </h1>
              {isWarehouseStaff && (
                <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold border border-blue-300">
                  📦 Chuyên môn Kho bãi & Vật tư
                </span>
              )}
              {isTechStaff && (
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-300">
                  🔬 Chuyên môn Kỹ thuật
                </span>
              )}
              {isAccountantStaff && (
                <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold border border-amber-300">
                  💰 Chuyên môn Kế toán Giá thành
                </span>
              )}
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
              {isWarehouseStaff
                ? 'Cấu hình chuẩn hóa danh mục vật tư, bao bì đóng gói và hệ thống kho bãi bảo quản cho trang trại'
                : isTechStaff
                ? 'Thiết lập danh mục giống cây trồng, giống vật nuôi và định mức tiêu hao kỹ thuật (BOM) cho sản xuất'
                : isAccountantStaff
                ? 'Chuẩn hóa 5 nhóm yếu tố chi phí (621, 622, máy móc, khấu hao, 627) phục vụ tính giá thành vụ mùa và kiểm soát ngân sách'
                : 'Cấu hình chuẩn hóa cấp Tenant và Trang trại tác nghiệp theo quy tắc Module Master Data Agri-ERP'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Sidebar (Menu 1 -> 9 có thể thu gọn linh hoạt) */}
        <div
          className={`space-y-1 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs shrink-0 sticky top-20 transition-all duration-200 ${
            isNavCollapsed ? 'w-full lg:w-16' : 'w-full lg:w-72'
          }`}
        >
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-1">
            {!isNavCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isWarehouseStaff
                  ? 'Danh Mục Kho & Vật Tư'
                  : isTechStaff
                  ? 'Danh Mục Kỹ Thuật'
                  : isAccountantStaff
                  ? 'Danh Mục Kế Toán'
                  : 'Phân khu Danh Mục Chuẩn'}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsNavCollapsed(!isNavCollapsed)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
              title={isNavCollapsed ? 'Mở rộng menu (1 -> 9)' : 'Thu gọn menu (1 -> 9)'}
            >
              {isNavCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 text-emerald-700" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="space-y-1">
            {visibleTabs.map((tab) => {
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  title={isNavCollapsed ? tab.label : undefined}
                  className={`w-full flex items-center ${
                    isNavCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'
                  } rounded-xl text-xs font-semibold text-left transition-all ${
                    isCurrent
                      ? 'bg-emerald-50 text-emerald-900 shadow-2xs font-bold ring-1 ring-emerald-600/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <tab.icon
                    className={`h-4 w-4 shrink-0 ${isCurrent ? 'text-emerald-700' : 'text-slate-400'}`}
                  />
                  {!isNavCollapsed && <span className="truncate">{tab.label}</span>}
                </button>
              );
            })}
          </div>
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
