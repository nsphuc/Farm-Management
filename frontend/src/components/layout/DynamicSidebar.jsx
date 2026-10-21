import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, X, Shield } from 'lucide-react';
import { Can } from '@/components/common/Can';
import { cn } from '@/utils/formatters';
import { renderIcon } from '@/utils/iconHelper';
import { useAuthStore } from '@/store/useAuthStore';
import { getSidebarMenuConfig } from '@/shells/TenantAppShell/menuConfig';

/**
 * Dynamic Sidebar (Mục 1.1.3 File 08 & Nhiệm Vụ 2)
 * Tự động cấu hình Menu riêng biệt cho từng Role vận hành ngoài thực địa:
 * - Role 1 (Owner): ẨN HOÀN TOÀN WS-E & WS-G, hiển thị WS-A, B, C (read-only), D, F, H1, H2, Cài đặt, Báo cáo, Hệ thống.
 * - Role 2 (Farm Manager): Đầy đủ bàn làm việc trại WS-G (GPS + Selfie), WS-A, B, C (xem kho), D, E, F, H1, H2, Báo cáo.
 * - Role 3 (Technical Lead): WS-G (điểm danh tổ), WS-A, WS-E (tác nghiệp chính), WS-F.
 * - Role 4 (Warehouse Keeper): WS-G (tổ bốc xếp), WS-C (thao tác độc quyền kho), WS-F (in tem QR), WS-H2 (giao hàng).
 * - Role 5 (Farm Accountant): WS-G, WS-B (bảng công), WS-C (đối soát), WS-D, WS-H1 (giá thành), WS-H2 (kết toán lãi), Báo cáo.
 * - Role 6A (Field Worker): Duy nhất WS-G (Bảng tác nghiệp di động & Chấm công GPS).
 */
export function DynamicSidebar({ isMobileOpen, onCloseMobile }) {
  const { getOperationalRole, getOperationalRoleInfo } = useAuthStore();
  const operationalRole = getOperationalRole();
  const roleInfo = getOperationalRoleInfo();

  const { workspaces, independentModules, sectionTitle } = useMemo(
    () => getSidebarMenuConfig(operationalRole),
    [operationalRole]
  );

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

        {/* Role Identity Banner */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <Shield className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-700 truncate">
                {roleInfo.title}
              </span>
            </div>
            <span
              className={cn(
                'text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 uppercase tracking-wide',
                roleInfo.badgeColor
              )}
            >
              {roleInfo.shortTitle}
            </span>
          </div>
        </div>

        {/* Navigation Links Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Workspaces Section */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {sectionTitle}
            </div>
            <nav className="space-y-1">
              {workspaces.map((item) => (
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
                          {renderIcon(
                            item.icon,
                            cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                            )
                          )}
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

          {/* Standalone Modules Section (Chỉ hiển thị nếu role có module) */}
          {independentModules && independentModules.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Cài Đặt & Quản Trị
              </div>
              <nav className="space-y-1">
                {independentModules.map((item) => (
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
                          {renderIcon(
                            item.icon,
                            cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                            )
                          )}
                          <span className="truncate">{item.label}</span>
                        </div>
                      )}
                    </NavLink>
                  </Can>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-200 bg-slate-50 p-3 text-center text-[10px] text-slate-500">
          Agri-ERP v2.0 • {roleInfo.shortTitle} Mode
        </div>
      </aside>
    </>
  );
}

export default DynamicSidebar;
