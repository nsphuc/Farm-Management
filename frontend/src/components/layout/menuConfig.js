import {
  LayoutDashboard,
  Layers,
  ClipboardList,
  Package,
  ArrowLeftRight,
  Receipt,
  BadgeDollarSign,
  Wallet,
  Users,
  Sliders,
  Settings,
  Building2,
  Calculator,
  ShieldCheck,
  Activity,
  Egg,
  Factory,
} from 'lucide-react';

/**
 * 10 CHỨC NĂNG CỐT LÕI (CORE) TRANG TRẠI CHĂN NUÔI FARMGO
 */
/**
 * MỤC TỔNG QUAN (DASHBOARD) TRUNG TÂM FARMGO
 */
export const DASHBOARD_MENU_ITEM = {
  id: 'dashboard',
  label: 'Tổng quan',
  path: '/app/dashboard',
  icon: LayoutDashboard,
  badge: 'KPIs & Cảnh báo',
};

/**
 * 10 CHỨC NĂNG CỐT LÕI (CORE) TRANG TRẠI CHĂN NUÔI FARMGO
 */
export const FARM_MENU_ITEMS = [
  {
    id: 'barns',
    label: 'Khu nuôi',
    path: '/app/barns',
    icon: Layers,
    badge: 'Đàn nuôi',
    permission: 'barns.view',
  },
  {
    id: 'daily-logs',
    label: 'Ghi nhật ký',
    path: '/app/daily-logs',
    icon: ClipboardList,
    badge: 'Nhiệt độ & FCR',
    permission: 'daily_logs.view',
  },
  {
    id: 'inventory',
    label: 'Kho hàng hóa',
    path: '/app/inventory',
    icon: Package,
    badge: 'Cám & Thuốc',
    permission: 'inventory.view',
  },
  {
    id: 'internal-transfers',
    label: 'Xuất nhập nội bộ',
    path: '/app/internal-transfers',
    icon: ArrowLeftRight,
    badge: 'Vật tư & Hoàn cám',
    permission: 'internal_transfers.view',
    anyPermissions: ['internal_transfers.view', 'inventory.view', 'transfers.view'],
  },
  {
    id: 'purchase-invoices',
    label: 'Hóa đơn nhập hàng',
    path: '/app/purchase-invoices',
    icon: Receipt,
    badge: 'Cám & Con giống',
    permission: 'purchase_invoices.view',
  },
  {
    id: 'sales',
    label: 'Quản lý bán hàng',
    path: '/app/sales',
    icon: BadgeDollarSign,
    badge: 'VietQR',
    permission: 'sales.view',
  },
  {
    id: 'cashbook',
    label: 'Sổ quỹ',
    path: '/app/cashbook',
    icon: Wallet,
    badge: 'Dòng tiền',
    permission: 'cashbook.view',
  },
  {
    id: 'workforce',
    label: 'Nhân công',
    path: '/app/workforce',
    icon: Users,
    badge: 'Khoán & Lương',
    permission: 'workforce.view',
  },
  {
    id: 'livestock-settings',
    label: 'Thiết lập chăn nuôi',
    path: '/app/livestock-settings',
    icon: Sliders,
    badge: 'FCR & Vắc xin',
    permission: 'livestock_settings.view',
  },
  {
    id: 'general-settings',
    label: 'Thiết lập chung',
    path: '/app/general-settings',
    icon: Settings,
    badge: 'Hệ thống',
    permission: 'general_settings.view',
    subItems: [
      { id: 'service-info', label: 'Thông tin dịch vụ', path: '/app/general-settings?tab=service-info' },
      { id: 'user-permissions', label: 'Quyền hạn người dùng', path: '/app/general-settings?tab=users' },
      { id: 'labor-roles', label: 'Vai trò phân công', path: '/app/general-settings?tab=labor-roles' },
      { id: 'zone-roles', label: 'Vai trò khu nuôi', path: '/app/general-settings?tab=zone-roles' },
      { id: 'warehouse-roles', label: 'Vai trò kho hàng', path: '/app/general-settings?tab=warehouse-roles' },
    ],
  },
];

export const FARM_CORE_MENU_ITEMS = FARM_MENU_ITEMS;

/**
 * 6 DỊCH VỤ MỞ RỘNG (ADD-ONS)
 * Quy tắc 1: Điều kiện hiển thị kép (Service Enabled AND User Permission)
 */
export const FARM_ADDON_MENU_ITEMS = [
  {
    id: 'branches',
    label: 'Đa chi nhánh',
    path: '/app/branches',
    icon: Building2,
    badge: 'Chuỗi trại',
    addonCode: 'BRANCHES',
    permission: 'branches.view',
  },
  {
    id: 'payroll',
    label: 'Lương & Chấm công KPI',
    path: '/app/payroll-kpi',
    icon: Calculator,
    badge: 'KPI & Lương',
    addonCode: 'PAYROLL',
    permission: 'payroll.view',
  },
  {
    id: 'roles',
    label: 'Mở rộng vai trò',
    path: '/app/custom-roles',
    icon: ShieldCheck,
    badge: 'Custom Role',
    addonCode: 'CUSTOM_ROLES',
    permission: 'roles.view',
  },
  {
    id: 'breeding',
    label: 'Gia súc sinh sản',
    path: '/app/breeding-livestock',
    icon: Activity,
    badge: 'Thẻ tai & Nái',
    addonCode: 'BREEDING',
    permission: 'breeding.view',
  },
  {
    id: 'poultry-hatchery',
    label: 'Ấp nở & Trứng giống',
    path: '/app/hatchery',
    icon: Egg,
    badge: 'Lò ấp & Trứng',
    addonCode: 'POULTRY_HATCHERY',
    permission: 'poultry_hatchery.view',
  },
  {
    id: 'feed-mill',
    label: 'Sản xuất cám',
    path: '/app/feed-production',
    icon: Factory,
    badge: 'Phối trộn',
    addonCode: 'FEED_MILL',
    permission: 'feed_mill.view',
  },
];

/**
 * Lấy cấu hình menu thống nhất
 * - 10 Chức năng cốt lõi (FARM_CORE_MENU_ITEMS)
 * - 6 Dịch vụ mở rộng (FARM_ADDON_MENU_ITEMS) khi thỏa mãn: Service Enabled AND User Permission
 */
export function getSidebarMenuConfig(
  permissionsOrRole = [],
  isOwner = false,
  enabledAddons = []
) {
  // 1. Xử lý 10 chức năng cốt lõi
  let allowedCore = FARM_MENU_ITEMS;

  if (typeof permissionsOrRole === 'string' || isOwner) {
    allowedCore = FARM_MENU_ITEMS;
  } else if (Array.isArray(permissionsOrRole) && permissionsOrRole.length > 0) {
    const permSet = new Set(permissionsOrRole);
    if (permSet.has('*')) {
      allowedCore = FARM_MENU_ITEMS;
    } else {
      allowedCore = FARM_MENU_ITEMS.filter(
        (item) =>
          !item.permission ||
          permSet.has(item.permission) ||
          (Array.isArray(item.anyPermissions) && item.anyPermissions.some((p) => permSet.has(p)))
      );
    }
  }

  // 2. Xử lý 6 Add-ons (Quy tắc 1: Điều kiện kép)
  let allowedAddons = [];
  if (Array.isArray(enabledAddons) && enabledAddons.length > 0) {
    const activeAddonsSet = new Set(enabledAddons);
    allowedAddons = FARM_ADDON_MENU_ITEMS.filter((item) => {
      if (!activeAddonsSet.has(item.addonCode)) return false;
      if (isOwner || typeof permissionsOrRole === 'string') return true;
      if (Array.isArray(permissionsOrRole)) {
        if (permissionsOrRole.includes('*')) return true;
        return permissionsOrRole.includes(item.permission);
      }
      return false;
    });
  }

  return {
    sectionTitle: 'Chức Năng Trang Trại',
    workspaces: [...allowedCore, ...allowedAddons],
    independentModules: [],
  };
}

export const ALL_WORKSPACES = {};
export const ALL_INDEPENDENT_MODULES = {};

export default getSidebarMenuConfig;
