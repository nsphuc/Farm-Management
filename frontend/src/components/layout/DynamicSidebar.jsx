import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MapPin,
  Users,
  Warehouse,
  Contact,
  Sprout,
  ShieldCheck,
  CalendarCheck,
  Calculator,
  BadgeDollarSign,
  Settings,
  BarChart3,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import { Can } from '@/components/common/Can';
import { cn } from '@/utils/formatters';

// 9 Workspaces configuration (Khớp Điều 2 File 08)
const WORKSPACES = [
  {
    id: 'A_Geography',
    label: 'WS-A: Mặt Bằng & Phân Công',
    path: '/app/geography',
    icon: MapPin,
    permission: 'PERM_FARM_VIEW',
    badge: 'Farms',
  },
  {
    id: 'B_Personnel360',
    label: 'WS-B: Nhân Sự 360° & SaaS',
    path: '/app/hr',
    icon: Users,
    permission: 'PERM_HR_EMPLOYEE_MANAGE',
    badge: 'HR',
  },
  {
    id: 'C_InventoryHub',
    label: 'WS-C: Kho Bãi & Mã Vạch',
    path: '/app/inventory',
    icon: Warehouse,
    permission: 'PERM_INVENTORY_VIEW',
    badge: 'Kho',
  },
  {
    id: 'D_Partners',
    label: 'WS-D: Danh Bạ Đối Tác',
    path: '/app/partners',
    icon: Contact,
    permission: 'PERM_FINANCE_SALES_ORDER',
  },
  {
    id: 'E_FarmingOps',
    label: 'WS-E: Canh Tác & Chăn Nuôi',
    path: '/app/farming-ops',
    icon: Sprout,
    anyPermissions: ['PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_CROP_LOG'],
    badge: 'Hiện trường',
  },
  {
    id: 'F_QaTraceability',
    label: 'WS-F: Đường Ống QA & QR',
    path: '/app/qa-traceability',
    icon: ShieldCheck,
    anyPermissions: ['PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_LABEL_PRINT'],
    badge: 'Kanban',
  },
  {
    id: 'G_EmployeeDailyOps',
    label: 'WS-G: Chấm Công GPS / Daily',
    path: '/app/daily-ops',
    icon: CalendarCheck,
    permission: 'PERM_HR_ATTENDANCE',
    badge: 'Mobile',
  },
  {
    id: 'H1_CostAccounting',
    label: 'WS-H1: Giá Thành & Chi Phí',
    path: '/app/cost-accounting',
    icon: Calculator,
    permission: 'PERM_FINANCE_EXPENSE',
  },
  {
    id: 'H2_SalesCashflow',
    label: 'WS-H2: Bán Hàng & VietQR',
    path: '/app/sales-cashflow',
    icon: BadgeDollarSign,
    permission: 'PERM_FINANCE_SALES_ORDER',
    badge: 'VietQR',
  },
];

// 3 Independent Modules (Khớp Điều 3 File 08)
const INDEPENDENT_MODULES = [
  {
    id: 'settings',
    label: 'Cài Đặt Danh Mục Tĩnh',
    path: '/app/settings',
    icon: Settings,
    permission: 'PERM_TENANT_MANAGE',
  },
  {
    id: 'reports',
    label: 'Báo Cáo & Phân Tích',
    path: '/app/reports',
    icon: BarChart3,
    permission: 'PERM_FINANCE_REPORT',
  },
  {
    id: 'system',
    label: 'Quản Trị Hệ Thống & Audit',
    path: '/app/system',
    icon: Sliders,
    permission: 'PERM_TENANT_MANAGE',
  },
];

/**
 * Dynamic Sidebar (Mục 1.1.3 File 08)
 * Tự động kiểm tra mảng 30 mã quyền của người dùng hiện tại thông qua component <Can>,
 * tự động ẩn/hiện từng mục trong 9 Workspaces và 3 Module bổ trợ.
 */
export function DynamicSidebar({ isMobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-sm ring-1 ring-emerald-600/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 text-base tracking-tight leading-none">
                AGRI-ERP
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase mt-0.5">
                Farm SaaS Platform
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Workspaces Section */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              9 Bàn Làm Việc Vận Hành (A → H2)
            </div>
            <nav className="space-y-1">
              {WORKSPACES.map((item) => (
                <Can
                  key={item.id}
                  permission={item.permission}
                  anyPermissions={item.anyPermissions}
                >
                  <NavLink
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold ring-1 ring-emerald-600/20'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 truncate">
                          <item.icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.2 text-[9px] font-bold shrink-0',
                              isActive
                                ? 'bg-emerald-200/80 text-emerald-900'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </Can>
              ))}
            </nav>
          </div>

          {/* Standalone Modules Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Cài Đặt & Quản Trị
            </div>
            <nav className="space-y-1">
              {INDEPENDENT_MODULES.map((item) => (
                <Can
                  key={item.id}
                  permission={item.permission}
                  anyPermissions={item.anyPermissions}
                >
                  <NavLink
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold ring-1 ring-emerald-600/20'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <div className="flex items-center gap-2.5 truncate">
                        <item.icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            isActive ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                    )}
                  </NavLink>
                </Can>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-200 bg-slate-50 p-3 text-center text-[10px] text-slate-600">
          Agri-ERP v2.0 • MySQL 72 Tables
        </div>
      </aside>
    </>
  );
}

export default DynamicSidebar;
