import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Sprout,
  Building2,
  Handshake,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Wheat,
  Beef,
  Package,
  QrCode,
  Clock,
  MapPin,
  CalendarCheck,
  Kanban,
  DollarSign,
  Calculator,
  ShoppingBag,
  FileSpreadsheet,
  BarChart3,
  Tag,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import { useAuthStore, normalizeRole } from '../stores/useAuthStore';
import { UserRole, ROLE_LABELS, NavItemConfig } from '../types/rbac.types';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

/**
 * CẤU HÌNH MENU CHUẨN XÁC THEO MA TRẬN 6 ROLES
 * Tuyệt đối không sáng tạo thêm role và ẩn triệt để các menu không thuộc phạm vi.
 */
export const ROLE_NAVIGATION_MAP: Record<UserRole, NavItemConfig[]> = {
  // 1. SUPER ADMIN (Quản trị hệ thống)
  SUPER_ADMIN: [
    {
      to: '/dashboard',
      label: 'Dashboard Đa Trang Trại',
      icon: LayoutDashboard,
      allowedRoles: ['SUPER_ADMIN'],
      badge: 'Cross-farm',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
    },
    {
      to: '/enterprise',
      label: 'Quản lý Doanh nghiệp/HTX',
      icon: Building2,
      allowedRoles: ['SUPER_ADMIN'],
      badge: 'SaaS Core',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
    },
    {
      to: '/farms',
      label: 'Quản lý Trang trại',
      icon: Sprout,
      allowedRoles: ['SUPER_ADMIN'],
    },
    {
      to: '/users',
      label: 'Tài khoản & Phân quyền',
      icon: Users,
      allowedRoles: ['SUPER_ADMIN'],
      badge: 'RBAC',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    },
    {
      to: '/analytics',
      label: 'Báo cáo Hệ thống',
      icon: BarChart3,
      allowedRoles: ['SUPER_ADMIN'],
    },
    {
      to: '/notifications',
      label: 'Thông báo hệ thống',
      icon: Bell,
      allowedRoles: ['SUPER_ADMIN'],
    },
    {
      to: '/settings',
      label: 'Cài đặt hệ thống',
      icon: Settings,
      allowedRoles: ['SUPER_ADMIN'],
    },
  ],

  // 2. FARM OWNER (Chủ trang trại / Quản lý)
  FARM_OWNER: [
    {
      to: '/dashboard',
      label: 'Bảng điều khiển Trang trại',
      icon: LayoutDashboard,
      allowedRoles: ['FARM_OWNER'],
    },
    {
      to: '/crops',
      label: 'Trồng trọt & Mùa vụ',
      icon: Wheat,
      allowedRoles: ['FARM_OWNER'],
      badge: 'VietGAP',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    },
    {
      to: '/livestock',
      label: 'Chăn nuôi & RFID',
      icon: Beef,
      allowedRoles: ['FARM_OWNER'],
      badge: 'RFID',
    },
    {
      to: '/inventory',
      label: 'Kho vật tư & Tồn kho',
      icon: Package,
      allowedRoles: ['FARM_OWNER'],
      badge: 'FIFO',
    },
    {
      to: '/traceability',
      label: 'Lô thành phẩm & Tem QR',
      icon: QrCode,
      allowedRoles: ['FARM_OWNER'],
      badge: 'Duyệt QR',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
    },
    {
      to: '/tasks',
      label: 'Bảng việc Kanban',
      icon: Kanban,
      allowedRoles: ['FARM_OWNER'],
      badge: 'Giao việc',
    },
    {
      to: '/hr/employees',
      label: 'Hồ sơ Nhân sự',
      icon: Users,
      allowedRoles: ['FARM_OWNER'],
      badge: 'HR',
    },
    {
      to: '/hr/shifts',
      label: 'Ca kíp & Phân ca',
      icon: Clock,
      allowedRoles: ['FARM_OWNER'],
    },
    {
      to: '/hr/attendance',
      label: 'Chấm công GPS',
      icon: MapPin,
      allowedRoles: ['FARM_OWNER'],
    },
    {
      to: '/hr/leave-overtime',
      label: 'Nghỉ phép & Tăng ca',
      icon: CalendarCheck,
      allowedRoles: ['FARM_OWNER'],
    },
    {
      to: '/finance/expenses',
      label: 'Chi phí & Duyệt chi',
      icon: DollarSign,
      allowedRoles: ['FARM_OWNER'],
      badge: 'Tài chính',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    },
    {
      to: '/finance/unit-cost',
      label: 'Giá thành & Chốt sổ',
      icon: Calculator,
      allowedRoles: ['FARM_OWNER'],
      badge: 'VNĐ/kg',
    },
    {
      to: '/finance/sales-orders',
      label: 'Đơn hàng & Bán sỉ',
      icon: ShoppingBag,
      allowedRoles: ['FARM_OWNER'],
    },
    {
      to: '/finance/debts',
      label: 'Sổ nợ & Aging Report',
      icon: FileSpreadsheet,
      allowedRoles: ['FARM_OWNER'],
    },
    {
      to: '/finance/budgets',
      label: 'Đối soát Ngân sách',
      icon: BarChart3,
      allowedRoles: ['FARM_OWNER'],
    },
    {
      to: '/partners',
      label: 'Đối tác & Chuỗi cung ứng',
      icon: Handshake,
      allowedRoles: ['FARM_OWNER'],
    },
    {
      to: '/analytics',
      label: 'Báo cáo & Phân tích',
      icon: BarChart3,
      allowedRoles: ['FARM_OWNER'],
      badge: 'BI',
    },
    {
      to: '/notifications',
      label: 'Trung tâm Thông báo',
      icon: Bell,
      allowedRoles: ['FARM_OWNER'],
    },
    {
      to: '/settings',
      label: 'Cài đặt trang trại',
      icon: Settings,
      allowedRoles: ['FARM_OWNER'],
    },
  ],

  // 3. FIELD STAFF (Nhân viên hiện trường - Mobile First rút gọn)
  FIELD_STAFF: [
    {
      to: '/tasks',
      label: 'Việc cần làm hôm nay (My Tasks)',
      icon: Kanban,
      allowedRoles: ['FIELD_STAFF'],
      badge: 'Hôm nay',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    },
    {
      to: '/hr/attendance',
      label: 'Chấm công GPS',
      icon: MapPin,
      allowedRoles: ['FIELD_STAFF'],
      badge: 'Check-in',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
    },
  ],

  // 4. WAREHOUSE STAFF (Thủ kho)
  WAREHOUSE_STAFF: [
    {
      to: '/inventory',
      label: 'Kho & Vật tư (Tồn, Nhập, Xuất)',
      icon: Package,
      allowedRoles: ['WAREHOUSE_STAFF'],
      badge: 'FIFO',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    },
    {
      to: '/traceability',
      label: 'Lô Thành Phẩm & In tem',
      icon: QrCode,
      allowedRoles: ['WAREHOUSE_STAFF'],
      badge: 'Tem nhiệt',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    },
    {
      to: '/hr/attendance',
      label: 'Chấm công GPS',
      icon: MapPin,
      allowedRoles: ['WAREHOUSE_STAFF'],
    },
    {
      to: '/notifications',
      label: 'Thông báo',
      icon: Bell,
      allowedRoles: ['WAREHOUSE_STAFF'],
    },
  ],

  // 5. TECHNICAL STAFF (Kỹ thuật/Thú y/QC)
  TECHNICAL_STAFF: [
    {
      to: '/crops',
      label: 'Trồng trọt & Quy trình',
      icon: Wheat,
      allowedRoles: ['TECHNICAL_STAFF'],
      badge: 'VietGAP',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    },
    {
      to: '/livestock',
      label: 'Chăn nuôi & Phác đồ thú y',
      icon: Beef,
      allowedRoles: ['TECHNICAL_STAFF'],
      badge: 'RFID',
    },
    {
      to: '/inventory',
      label: 'Kho vật tư (Xem lượng tồn)',
      icon: Package,
      allowedRoles: ['TECHNICAL_STAFF'],
      badge: 'Chỉ xem',
      badgeColor: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      to: '/analytics',
      label: 'Báo cáo kỹ thuật & QC',
      icon: BarChart3,
      allowedRoles: ['TECHNICAL_STAFF'],
      badge: 'QC',
    },
    {
      to: '/tasks',
      label: 'Nhiệm vụ kỹ thuật',
      icon: Kanban,
      allowedRoles: ['TECHNICAL_STAFF'],
    },
    {
      to: '/hr/attendance',
      label: 'Chấm công GPS',
      icon: MapPin,
      allowedRoles: ['TECHNICAL_STAFF'],
    },
    {
      to: '/notifications',
      label: 'Thông báo',
      icon: Bell,
      allowedRoles: ['TECHNICAL_STAFF'],
    },
  ],

  // 6. ACCOUNTANT (Kế toán)
  ACCOUNTANT: [
    {
      to: '/finance/unit-cost',
      label: 'Báo cáo Giá thành (Cost/Kg)',
      icon: Calculator,
      allowedRoles: ['ACCOUNTANT'],
      badge: 'Chốt sổ',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
    },
    {
      to: '/finance/expenses',
      label: 'Sổ chi & Hạch toán',
      icon: DollarSign,
      allowedRoles: ['ACCOUNTANT'],
      badge: 'Chi phí',
    },
    {
      to: '/finance/sales-orders',
      label: 'Đơn hàng & Doanh thu',
      icon: ShoppingBag,
      allowedRoles: ['ACCOUNTANT'],
    },
    {
      to: '/finance/debts',
      label: 'Sổ nợ & Aging Report',
      icon: FileSpreadsheet,
      allowedRoles: ['ACCOUNTANT'],
      badge: 'Aging',
    },
    {
      to: '/finance/budgets',
      label: 'Đối soát Ngân sách',
      icon: BarChart3,
      allowedRoles: ['ACCOUNTANT'],
    },
    {
      to: '/finance/cost-categories',
      label: 'Danh mục Chi phí',
      icon: Tag,
      allowedRoles: ['ACCOUNTANT'],
    },
    {
      to: '/inventory',
      label: 'Kho vật tư (Tính giá vốn)',
      icon: Package,
      allowedRoles: ['ACCOUNTANT'],
      badge: 'Giá trị tồn',
    },
    {
      to: '/analytics',
      label: 'Báo cáo Tài chính',
      icon: BarChart3,
      allowedRoles: ['ACCOUNTANT'],
    },
    {
      to: '/hr/attendance',
      label: 'Chấm công GPS',
      icon: MapPin,
      allowedRoles: ['ACCOUNTANT'],
    },
    {
      to: '/notifications',
      label: 'Thông báo',
      icon: Bell,
      allowedRoles: ['ACCOUNTANT'],
    },
  ],
};

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  // Lấy role của user từ Zustand store theo đúng yêu cầu
  const currentUser = useAuthStore((state) => state.currentUser || state.user);
  const normalizedRole = (normalizeRole(currentUser?.role) || 'FARM_OWNER') as UserRole;

  // Lấy danh sách menu động dành riêng cho Role này
  const navItems = ROLE_NAVIGATION_MAP[normalizedRole] || ROLE_NAVIGATION_MAP.FARM_OWNER;

  const isFieldStaff = normalizedRole === 'FIELD_STAFF';
  const roleName = ROLE_LABELS[normalizedRole] || normalizedRole;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary-600/20">
            <Sprout className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Farm SaaS
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">AgriTech Platform</span>
            </div>
          )}
        </div>

        {/* Toggle Collapse Desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Profile Indicator Banner */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        {!isCollapsed ? (
          <div className="rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Vai trò truy cập
              </span>
            </div>
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
              {roleName}
            </div>
            {isFieldStaff && (
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                <Smartphone className="w-3 h-3" />
                Giao diện Hiện trường (Mobile-First)
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center" title={roleName}>
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
              {normalizedRole.charAt(0)}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Nav Items List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-md flex-shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeColor || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Field Staff Simplified Notice */}
      {isFieldStaff && !isCollapsed && (
        <div className="p-3 m-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
          <div className="font-semibold mb-0.5 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Chế độ Hiện trường
          </div>
          Giao diện tối giản dành cho công nhân ngoài ruộng/nhà màng. Mọi dữ liệu tài chính & in tem được bảo mật.
        </div>
      )}

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="truncate">Hệ thống Nông nghiệp Số</span>
          <span className="font-mono text-[10px]">v1.0-RBAC</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 bottom-0 left-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
