import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, X, Shield, ChevronLeft, ChevronRight, ChevronDown, PanelLeftClose, PanelLeftOpen, LayoutDashboard, Plus } from 'lucide-react';
import { Can } from '@/components/common/Can';
import { cn } from '@/utils/formatters';
import { renderIcon } from '@/utils/iconHelper';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { masterDataService } from '@/services/modules/masterDataService';
import { enterpriseService } from '@/services/modules/enterpriseService';
import { getSidebarMenuConfig } from './menuConfig';

/**
 * Dynamic Sidebar (Mục 1.1.3 File 08 & Nhiệm Vụ 2)
 * Tự động cấu hình Menu riêng biệt cho từng Role vận hành ngoài thực địa, hỗ trợ thu gọn linh hoạt.
 */
export function DynamicSidebar({ isMobileOpen, onCloseMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userInfo, isOwner, getOperationalRole, getOperationalRoleInfo } = useAuthStore();
  const operationalRole = getOperationalRole();
  const roleInfo = getOperationalRoleInfo();

  const [openSubmenus, setOpenSubmenus] = useState({ 'general-settings': true });

  const toggleSubmenu = (itemId) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const [enterpriseLogo, setEnterpriseLogo] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('app_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('app_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const loadEnterpriseProfile = async () => {
    try {
      const p = await enterpriseService.getProfile();
      if (p?.logoUrl) {
        setEnterpriseLogo(p.logoUrl);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadEnterpriseProfile();
    const handleLogoUpdated = (e) => {
      if (e?.detail?.logoUrl !== undefined) {
        setEnterpriseLogo(e.detail.logoUrl);
      } else {
        loadEnterpriseProfile();
      }
    };
    window.addEventListener('enterprise_profile_updated', handleLogoUpdated);
    return () => window.removeEventListener('enterprise_profile_updated', handleLogoUpdated);
  }, []);

  const permissions = userInfo?.permissions || operationalRole;
  const enabledAddons = useMemo(() => {
    const subs = userInfo?.farmAddOnSubscriptions || [];
    return subs
      .filter((s) => s.isEnabled || s.status === 'ACTIVE')
      .map((s) => s.addonCode);
  }, [userInfo?.farmAddOnSubscriptions]);

  const rawActiveFarmId = useActiveFarmStore((s) => s.activeFarmId);
  const defaultFarmId = Number(userInfo?.accessibleFarms?.[0]?.farmId || userInfo?.accessibleFarms?.[0]?.id || 1);
  const activeFarmId = rawActiveFarmId && rawActiveFarmId !== 'ALL' && !Number.isNaN(Number(rawActiveFarmId))
    ? Number(rawActiveFarmId)
    : defaultFarmId;
  const currentBranchId = useActiveBranchStore((s) => s.currentBranchId);
  const dataVersion = useActiveBranchStore((s) => s.dataVersion);

  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadWarehouses = async () => {
      try {
        const effectiveBranchId = currentBranchId === 'ALL' ? undefined : currentBranchId;
        const res = await masterDataService.getWarehouses(activeFarmId, { branchId: effectiveBranchId });
        if (isMounted && Array.isArray(res)) {
          setWarehouses(res);
        }
      } catch (e) {
        console.warn('Failed to load warehouses for dynamic sidebar:', e);
      }
    };
    loadWarehouses();
    return () => { isMounted = false; };
  }, [activeFarmId, currentBranchId, dataVersion]);

  useEffect(() => {
    if (location.pathname.startsWith('/app/inventory')) {
      setOpenSubmenus((prev) => ({ ...prev, inventory: true }));
    }
  }, [location.pathname]);

  const { workspaces, independentModules, sectionTitle } = useMemo(
    () => getSidebarMenuConfig(permissions, typeof isOwner === 'function' ? isOwner() : false, enabledAddons),
    [permissions, isOwner, enabledAddons]
  );

  const roleCodes = useMemo(
    () => (userInfo?.roles || []).map((r) => (typeof r === 'string' ? r : r?.code)).filter(Boolean),
    [userInfo?.roles]
  );
  const isWorkerOnly = useMemo(() => {
    const hasWorkerRole =
      roleCodes.includes('ROLE_BARN_WORKER') || roleCodes.includes('ROLE_FIELD_STAFF');
    const hasElevatedRole =
      (typeof isOwner === 'function' && isOwner()) ||
      roleCodes.includes('ROLE_SUPER_ADMIN') ||
      roleCodes.includes('ROLE_FARM_OWNER') ||
      roleCodes.includes('ROLE_FARM_MANAGER') ||
      roleCodes.includes('ROLE_ACCOUNTANT') ||
      roleCodes.includes('ROLE_TECHNICAL_STAFF');
    return hasWorkerRole && !hasElevatedRole;
  }, [roleCodes, isOwner]);

  const enrichedWorkspaces = useMemo(() => {
    const filteredWorkspaces = isWorkerOnly
      ? workspaces.filter((item) => item.id !== 'inventory' && item.id !== 'internal-transfers')
      : workspaces;

    return filteredWorkspaces.map((item) => {
      if (item.id === 'inventory') {
        const warehouseSubItems = [
          {
            id: 'all-warehouses',
            label: 'Tất cả kho',
            path: '/app/inventory',
            isAll: true,
          },
          ...warehouses.map((w) => ({
            id: `wh-${w.id}`,
            warehouseId: w.id,
            label: `${w.name} (${w.itemsCount ?? w.currentInventoryLotsCount ?? 0})`,
            path: `/app/inventory?warehouseId=${w.id}`,
          })),
        ];
        return {
          ...item,
          subItems: warehouseSubItems,
        };
      }
      return item;
    });
  }, [workspaces, warehouses, isWorkerOnly]);

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
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:static lg:translate-x-0',
          isCollapsed ? 'w-20' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-slate-200 bg-slate-50/50 transition-all duration-300',
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          )}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleCollapse}
              title="Mở rộng menu"
              className="flex items-center justify-center p-1 rounded-xl hover:bg-slate-200/70 transition-colors"
            >
              {enterpriseLogo ? (
                <img
                  src={enterpriseLogo}
                  alt="Logo"
                  className="h-9 w-9 rounded-xl object-contain bg-white shadow-xs ring-1 ring-slate-200 p-0.5 shrink-0"
                  onError={() => setEnterpriseLogo('')}
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-sm ring-1 ring-emerald-600/30 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
              )}
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {enterpriseLogo ? (
                  <img
                    src={enterpriseLogo}
                    alt="Logo Doanh Nghiệp"
                    className="h-9 w-9 rounded-xl object-contain bg-white shadow-xs ring-1 ring-slate-200 p-0.5 shrink-0"
                    onError={() => setEnterpriseLogo('')}
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-sm ring-1 ring-emerald-600/30 shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-slate-900 text-base tracking-tight leading-none truncate max-w-[145px]">
                    {userInfo?.tenantName || 'FarmGo'}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase mt-0.5 truncate max-w-[145px]">
                    Farm SaaS Platform
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Desktop Collapse Toggle */}
                <button
                  type="button"
                  onClick={toggleCollapse}
                  title="Thu gọn menu"
                  className="hidden lg:flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>

                {/* Mobile Close Button */}
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 lg:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Role Identity Banner */}
        <div
          className={cn(
            'border-b border-slate-100 bg-slate-50/40 transition-all duration-300',
            isCollapsed ? 'py-2 px-1 text-center' : 'px-4 py-2.5'
          )}
          title={roleInfo.title}
        >
          {isCollapsed ? (
            <div className="flex justify-center">
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider',
                  roleInfo.badgeColor
                )}
              >
                {roleInfo.shortTitle}
              </span>
            </div>
          ) : (
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
          )}
        </div>

        {/* Navigation Links Scrollable */}
        <div
          className={cn(
            'flex-1 overflow-y-auto space-y-4 transition-all duration-300',
            isCollapsed ? 'px-2 py-3' : 'px-3 py-3'
          )}
        >
          {/* Dashboard Item */}
          <div className="space-y-1">
            <NavLink
              to="/app/dashboard"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'group flex items-center rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                  isCollapsed && 'justify-center px-0'
                )
              }
              title={isCollapsed ? 'Tổng quan' : undefined}
            >
              <LayoutDashboard className={cn('h-4 w-4 shrink-0', !isCollapsed && 'mr-2.5')} />
              {!isCollapsed && <span>Tổng quan</span>}
            </NavLink>
          </div>

          {/* Workspaces Section */}
          <div>
            {!isCollapsed ? (
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {sectionTitle}
              </div>
            ) : (
              <div className="my-1 border-t border-slate-100" />
            )}
            <nav className="space-y-1">
              {enrichedWorkspaces.map((item) => {
                const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
                const isSubmenuOpen = Boolean(openSubmenus[item.id]);
                const isCurrentParentActive = location.pathname.startsWith(item.path);

                if (hasSubItems && !isCollapsed) {
                  return (
                    <Can
                      key={item.id}
                      permission={item.permission}
                      anyPermissions={item.anyPermissions}
                    >
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            toggleSubmenu(item.id);
                            if (!isCurrentParentActive) {
                              navigate(item.path);
                            }
                          }}
                          className={cn(
                            'w-full group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                            isCurrentParentActive
                              ? 'bg-emerald-50/70 text-emerald-900 font-bold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          )}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {renderIcon(
                              item.icon,
                              cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                isCurrentParentActive ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                              )
                            )}
                            <span className="truncate">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className="rounded-full px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 text-slate-600">
                                {item.badge}
                              </span>
                            )}
                            {isSubmenuOpen ? (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
                            )}
                          </div>
                        </button>

                        {/* Sub-menu items */}
                        {isSubmenuOpen && (
                          <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-emerald-100 ml-4">
                            {item.subItems.map((sub) => {
                              let isSubActive = false;
                              if (item.id === 'general-settings') {
                                isSubActive =
                                  location.pathname === '/app/general-settings' &&
                                  (location.search.includes(sub.id) ||
                                    (sub.id === 'service-info' && (!location.search || location.search.includes('service-info'))));
                              } else if (item.id === 'inventory') {
                                if (sub.isAll) {
                                  isSubActive = location.pathname === '/app/inventory' && (!location.search || !location.search.includes('warehouseId='));
                                } else {
                                  isSubActive = location.pathname === '/app/inventory' && location.search.includes(`warehouseId=${sub.warehouseId}`);
                                }
                              } else {
                                isSubActive = location.pathname === sub.path;
                              }

                              return (
                                <NavLink
                                  key={sub.id}
                                  to={sub.path}
                                  onClick={onCloseMobile}
                                  className={cn(
                                    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all',
                                    isSubActive
                                      ? 'bg-emerald-100/70 text-emerald-900 font-bold'
                                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                  )}
                                >
                                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isSubActive ? 'bg-emerald-600' : 'bg-slate-300')} />
                                  <span className="truncate">{sub.label}</span>
                                </NavLink>
                              );
                            })}

                            {item.id === 'inventory' && (
                              <button
                                type="button"
                                onClick={() => {
                                  onCloseMobile?.();
                                  navigate('/app/inventory?action=create-warehouse');
                                }}
                                className="flex items-center gap-1.5 w-full text-left rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 transition-all border border-dashed border-emerald-300 mt-1"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Thêm kho mới</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </Can>
                  );
                }

                return (
                  <Can
                    key={item.id}
                    permission={item.permission}
                    anyPermissions={item.anyPermissions}
                  >
                    <NavLink
                      to={item.path}
                      onClick={onCloseMobile}
                      title={item.label}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center rounded-xl text-xs font-semibold transition-all',
                          isCollapsed
                            ? 'justify-center p-2.5'
                            : 'justify-between px-3 py-2',
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold ring-1 ring-emerald-600/20'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            className={cn(
                              'flex items-center',
                              isCollapsed ? 'justify-center' : 'gap-2.5 truncate'
                            )}
                          >
                            {renderIcon(
                              item.icon,
                              cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                isActive ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                              )
                            )}
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </div>
                          {!isCollapsed && item.badge && (
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
                );
              })}
            </nav>
          </div>

          {/* Standalone Modules Section (Chỉ hiển thị nếu role có module) */}
          {independentModules && independentModules.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              {!isCollapsed ? (
                <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  Cài Đặt & Quản Trị
                </div>
              ) : (
                <div className="my-1 border-t border-slate-100" />
              )}
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
                      title={item.label}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center rounded-xl text-xs font-semibold transition-all',
                          isCollapsed
                            ? 'justify-center p-2.5'
                            : 'justify-between px-3 py-2',
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold ring-1 ring-emerald-600/20'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <div
                          className={cn(
                            'flex items-center',
                            isCollapsed ? 'justify-center' : 'gap-2.5 truncate'
                          )}
                        >
                          {renderIcon(
                            item.icon,
                            cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                            )
                          )}
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                      )}
                    </NavLink>
                  </Can>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Footer info & Toggle Expand Button */}
        <div className="border-t border-slate-200 bg-slate-50 p-2.5 text-center text-[10px] text-slate-500">
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleCollapse}
              title="Mở rộng menu"
              className="w-full flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center justify-between px-1">
              <span className="truncate">FarmGo v2.0 • {roleInfo.shortTitle}</span>
              <button
                type="button"
                onClick={toggleCollapse}
                title="Thu gọn menu"
                className="hidden lg:flex items-center gap-1 rounded-lg px-1.5 py-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors text-[10px]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Thu gọn</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default DynamicSidebar;
