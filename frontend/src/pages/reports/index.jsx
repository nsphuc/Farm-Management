import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  Warehouse,
  FileSpreadsheet,
  BadgeDollarSign,
  Sprout,
  Activity,
  Layers,
  CreditCard,
  Building,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ExecutiveDashboardTab } from './components/ExecutiveDashboardTab';
import { CropPnlReportTab } from './components/CropPnlReportTab';
import { LivestockPnlReportTab } from './components/LivestockPnlReportTab';
import { PayrollReportTab } from './components/PayrollReportTab';
import { DebtAgingReportTab } from './components/DebtAgingReportTab';

/**
 * Reports Page - Trung Tâm Báo Cáo Điều Hành, Phân Tích Thông Minh & Xuất Báo Cáo
 * Hỗ trợ đa góc nhìn:
 * - Chủ đầu tư (Owner): Dashboard so sánh giữa các trang trại (Cross-farm comparison)
 * - Quản lý trại (Farm Manager): Dashboard dòng tiền, chi phí, sản lượng từng trại
 * - Báo cáo Chấm công & Tiền lương tháng kèm xuất file Excel/CSV
 * - Báo cáo Giá thành & Lợi nhuận vụ mùa (Crop P&L) kèm xuất file Excel/CSV
 */
export function ReportsPage() {
  const { activeFarmId, activeFarm, activeFarmType, syncTrigger } = useActiveFarmStore();
  const { isOwner } = useAuthStore();
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const tabsContainerRef = useRef(null);

  const handleScroll = (direction) => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleWheel = (e) => {
    if (tabsContainerRef.current && e.deltaY !== 0) {
      tabsContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const isAllFarms = !activeFarmId || activeFarmId === 'ALL';

  useEffect(() => {
    setLastRefreshedAt(new Date());
  }, [activeFarmId, syncTrigger?.all, syncTrigger?.finance, syncTrigger?.inventory]);

  const reportTabs = [
    {
      id: 'DASHBOARD',
      label: isAllFarms ? 'Dashboard Đối Sánh Toàn Hệ Thống (Owner)' : 'Báo Cáo Điều Hành & Biểu Đồ',
      icon: TrendingUp,
      badge: isAllFarms ? 'Đa trại' : 'Executive',
    },
    {
      id: 'CROP_PNL',
      label: 'Thu Chi & Lợi Nhuận Vụ Mùa (Crop P&L)',
      icon: Sprout,
      badge: 'Giá thành',
    },
    {
      id: 'LIVESTOCK_PNL',
      label: 'Thu Chi & Lợi Nhuận Lứa Vật Nuôi (Livestock P&L)',
      icon: Layers,
      badge: 'Vật nuôi',
    },
    {
      id: 'PAYROLL',
      label: 'Bảng Chấm Công & Tiền Lương Tháng',
      icon: FileSpreadsheet,
      badge: 'Lương & Công',
    },
    {
      id: 'DEBT',
      label: 'Tuổi Nợ & Rủi Ro Tín Dụng',
      icon: CreditCard,
      badge: 'Công nợ',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Trung Tâm Báo Cáo Điều Hành & Phân Tích
                </h1>
                {isAllFarms ? (
                  <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-[10px] font-bold border border-indigo-200">
                    👑 Chế độ Chủ Đầu Tư (Toàn bộ trang trại)
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold border border-slate-200">
                    🏡 Trang trại: {activeFarm?.name || `#${activeFarmId}`}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-semibold border border-emerald-200">
                  <Activity className="h-3 w-3 text-emerald-600 animate-pulse" />
                  Live Sync (Zero-F5)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đang xem số liệu: <strong className="text-slate-800">{activeFarm?.name || 'Toàn bộ chuỗi trang trại'}</strong> • Cập nhật lần cuối: {lastRefreshedAt.toLocaleTimeString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs with Horizontal Scroll Controls */}
      <div className="relative flex items-center border-b border-slate-200 bg-white/50 backdrop-blur-xs p-1 rounded-t-2xl">
        {/* Nút Cuộn Trái */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-2xs transition-all mr-1.5 active:scale-95"
          title="Cuộn sang trái"
          aria-label="Cuộn sang trái"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Thanh chứa các Tab có thanh trượt ngang & hỗ trợ lăn chuột */}
        <div
          ref={tabsContainerRef}
          onWheel={handleWheel}
          className="flex flex-1 items-center space-x-2 overflow-x-auto scroll-smooth text-xs font-semibold py-1 px-0.5"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 #F1F5F9',
          }}
        >
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                setActiveTab(tab.id);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              }}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-all whitespace-nowrap font-bold shrink-0 rounded-t-xl ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-800 bg-indigo-50/80 rounded-t-xl font-black shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="h-4 w-4 text-indigo-600" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  activeTab === tab.id
                    ? 'bg-indigo-200/70 text-indigo-900'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Nút Cuộn Phải */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-2xs transition-all ml-1.5 active:scale-95"
          title="Cuộn sang phải"
          aria-label="Cuộn sang phải"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'DASHBOARD' && (
        <ExecutiveDashboardTab
          farmId={activeFarmId}
          activeFarm={activeFarm}
          isAllFarms={isAllFarms}
        />
      )}

      {activeTab === 'CROP_PNL' && (
        <CropPnlReportTab
          farmId={activeFarmId}
          activeFarm={activeFarm}
        />
      )}

      {activeTab === 'LIVESTOCK_PNL' && (
        <LivestockPnlReportTab
          farmId={activeFarmId}
          activeFarm={activeFarm}
        />
      )}

      {activeTab === 'PAYROLL' && (
        <PayrollReportTab
          farmId={activeFarmId}
          activeFarm={activeFarm}
        />
      )}

      {activeTab === 'DEBT' && (
        <DebtAgingReportTab
          farmId={activeFarmId}
          activeFarm={activeFarm}
        />
      )}
    </div>
  );
}

export default ReportsPage;
