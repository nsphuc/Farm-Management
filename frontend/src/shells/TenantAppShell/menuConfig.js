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
} from 'lucide-react';

/**
 * Cấu hình Menu Bàn Làm Việc (Workspaces) & Module Độc Lập cho từng Role vận hành
 * Tuân thủ 100% Nhiệm vụ 2 - Cải tổ kiến trúc phân cấp thực tế
 */

// Định nghĩa cơ sở của 9 Workspaces
export const ALL_WORKSPACES = {
  A_Geography: {
    id: 'A_Geography',
    label: 'WS-A: Mặt Bằng & Phân Công',
    path: '/app/geography',
    icon: MapPin,
    permission: 'PERM_FARM_VIEW',
    badge: 'Farms',
  },
  B_Personnel360: {
    id: 'B_Personnel360',
    label: 'WS-B: Nhân Sự 360° & SaaS',
    path: '/app/hr',
    icon: Users,
    permission: 'PERM_HR_EMPLOYEE_MANAGE',
    badge: 'HR',
  },
  C_InventoryHub: {
    id: 'C_InventoryHub',
    label: 'WS-C: Kho Bãi & Mã Vạch',
    path: '/app/inventory',
    icon: Warehouse,
    permission: 'PERM_INVENTORY_VIEW',
    badge: 'Kho',
  },
  D_Partners: {
    id: 'D_Partners',
    label: 'WS-D: Danh Bạ Đối Tác',
    path: '/app/partners',
    icon: Contact,
    permission: 'PERM_FINANCE_SALES_ORDER',
  },
  E_FarmingOps: {
    id: 'E_FarmingOps',
    label: 'WS-E: Canh Tác & Chăn Nuôi',
    path: '/app/farming-ops',
    icon: Sprout,
    anyPermissions: ['PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_CROP_LOG'],
    badge: 'Hiện trường',
  },
  F_QaTraceability: {
    id: 'F_QaTraceability',
    label: 'WS-F: Đường Ống QA & QR',
    path: '/app/qa-traceability',
    icon: ShieldCheck,
    anyPermissions: ['PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_LABEL_PRINT'],
    badge: 'Kanban',
  },
  G_EmployeeDailyOps: {
    id: 'G_EmployeeDailyOps',
    label: 'WS-G: Chấm Công GPS / Daily',
    path: '/app/my-dashboard',
    icon: CalendarCheck,
    anyPermissions: [
      'PERM_HR_ATTENDANCE',
      'PERM_TASK_ASSIGN',
      'PERM_INVENTORY_VIEW',
      'PERM_FINANCE_EXPENSE',
      'PERM_CROP_LOG',
      'PERM_FARM_VIEW',
    ],
    badge: 'Mobile',
  },
  H1_CostAccounting: {
    id: 'H1_CostAccounting',
    label: 'WS-H1: Giá Thành & Chi Phí',
    path: '/app/cost-accounting',
    icon: Calculator,
    permission: 'PERM_FINANCE_EXPENSE',
  },
  H2_SalesCashflow: {
    id: 'H2_SalesCashflow',
    label: 'WS-H2: Bán Hàng & VietQR',
    path: '/app/sales-cashflow',
    icon: BadgeDollarSign,
    permission: 'PERM_FINANCE_SALES_ORDER',
    badge: 'VietQR',
  },
};

// Định nghĩa cơ sở của 3 Standalone Modules
export const ALL_INDEPENDENT_MODULES = {
  settings: {
    id: 'settings',
    label: 'Cài Đặt Danh Mục Tĩnh',
    path: '/app/settings',
    icon: Settings,
    permission: 'PERM_TENANT_MANAGE',
  },
  reports: {
    id: 'reports',
    label: 'Báo Cáo & Phân Tích',
    path: '/app/reports',
    icon: BarChart3,
    permission: 'PERM_FINANCE_REPORT',
  },
  system: {
    id: 'system',
    label: 'Quản Trị Hệ Thống & Audit',
    path: '/app/system',
    icon: Sliders,
    permission: 'PERM_TENANT_MANAGE',
  },
};

/**
 * Lấy cấu hình Menu Workspaces và Modules theo đúng 6 Role Vận Hành
 * @param {string} operationalRole Mã vai trò: 'OWNER' | 'FARM_MANAGER' | 'TECHNICAL_LEAD' | 'WAREHOUSE_KEEPER' | 'FARM_ACCOUNTANT' | 'FIELD_WORKER' | 'SUPER_ADMIN'
 * @returns {{ workspaces: Array, independentModules: Array, sectionTitle: string }}
 */
export function getSidebarMenuConfig(operationalRole) {
  switch (operationalRole) {
    // 1. Role 1: Owner (Chủ đầu tư / Chủ doanh nghiệp)
    // ẨN HOÀN TOÀN WS-E (Canh tác) và WS-G (Chấm công cá nhân)
    case 'OWNER':
      return {
        sectionTitle: 'Bàn Quản Trị Chủ Đầu Tư',
        workspaces: [
          {
            ...ALL_WORKSPACES.A_Geography,
            label: 'WS-A: Mặt Bằng & Trang Trại',
            badge: 'Chuỗi trại',
          },
          {
            ...ALL_WORKSPACES.B_Personnel360,
            label: 'WS-B: Nhân Sự Toàn Chuỗi',
            badge: 'Giám sát',
          },
          {
            ...ALL_WORKSPACES.C_InventoryHub,
            label: 'WS-C: Giám Sát Kho Vận',
            badge: 'Chỉ xem',
          },
          {
            ...ALL_WORKSPACES.D_Partners,
            label: 'WS-D: Đối Tác & Duyệt Hạn Mức',
            badge: 'Duyệt hạn mức',
          },
          {
            ...ALL_WORKSPACES.F_QaTraceability,
            label: 'WS-F: Giám Sát Thành Phẩm & Thu Hồi',
            badge: 'Thu hồi',
          },
          {
            ...ALL_WORKSPACES.H1_CostAccounting,
            label: 'WS-H1: Thống Kê Chi Phí & Ngân Sách',
            badge: 'Ngân sách',
          },
          {
            ...ALL_WORKSPACES.H2_SalesCashflow,
            label: 'WS-H2: Dòng Tiền & Nhận Kết Toán',
            badge: 'Kết toán',
          },
        ],
        independentModules: [
          ALL_INDEPENDENT_MODULES.settings,
          ALL_INDEPENDENT_MODULES.reports,
          ALL_INDEPENDENT_MODULES.system,
        ],
      };

    // 2. Role 2: Farm Manager (Giám đốc / Quản lý 1 Trang trại)
    case 'FARM_MANAGER':
      return {
        sectionTitle: 'Bàn Điều Hành Giám Đốc Trại',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'WS-G: Chấm Công Cá Nhân & Tổng Quan',
            badge: 'GPS + Selfie',
          },
          {
            ...ALL_WORKSPACES.A_Geography,
            label: 'WS-A: Phân Khu & Phân Công Bộ Phận',
            badge: 'Phân khu',
          },
          {
            ...ALL_WORKSPACES.B_Personnel360,
            label: 'WS-B: Tuyển Dụng & Nhân Sự Trại',
            badge: 'Nhân sự trại',
          },
          {
            ...ALL_WORKSPACES.C_InventoryHub,
            label: 'WS-C: Theo Dõi Tồn Kho & Vật Tư',
            badge: 'Xem kho',
          },
          {
            ...ALL_WORKSPACES.D_Partners,
            label: 'WS-D: Danh Bạ Đối Tác Trại',
          },
          {
            ...ALL_WORKSPACES.E_FarmingOps,
            label: 'WS-E: Kế Hoạch Vụ & Việc Cố Định',
            badge: 'Kế hoạch',
          },
          {
            ...ALL_WORKSPACES.F_QaTraceability,
            label: 'WS-F: Phê Duyệt KCS & Lô Hàng',
            badge: 'Duyệt KCS',
          },
          {
            ...ALL_WORKSPACES.H1_CostAccounting,
            label: 'WS-H1: Chi Phí & Giá Thành Trại',
            badge: 'Chi phí',
          },
          {
            ...ALL_WORKSPACES.H2_SalesCashflow,
            label: 'WS-H2: Doanh Thu & Duyệt Kết Toán',
            badge: 'Kết toán',
          },
        ],
        independentModules: [
          ALL_INDEPENDENT_MODULES.reports,
        ],
      };

    // 3. Role 3: Technical Lead (Trưởng bộ phận kỹ thuật / Trưởng phân khu)
    case 'TECHNICAL_LEAD':
      return {
        sectionTitle: 'Bàn Tác Nghiệp Trưởng Kỹ Thuật',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'WS-G: Chấm Công & Điểm Danh Tổ',
            badge: 'Điểm danh tổ',
          },
          {
            ...ALL_WORKSPACES.A_Geography,
            label: 'WS-A: Phân Khu & Nhân Sự Khu Mình',
            badge: 'Khu vực',
          },
          {
            ...ALL_WORKSPACES.E_FarmingOps,
            label: 'WS-E: Nhật Ký Canh Tác / Nuôi & Thu Hoạch',
            badge: 'Tác nghiệp',
          },
          {
            ...ALL_WORKSPACES.F_QaTraceability,
            label: 'WS-F: Lập Biên Bản Kiểm Định KCS',
            badge: 'Kiểm định',
          },
        ],
        independentModules: [],
      };

    // 4. Role 4: Warehouse Keeper (Thủ kho trang trại)
    case 'WAREHOUSE_KEEPER':
      return {
        sectionTitle: 'Bàn Thao Tác Thủ Kho Trang Trại',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'WS-G: Chấm Công & Điểm Danh Tổ Kho',
            badge: 'Tổ kho',
          },
          {
            ...ALL_WORKSPACES.C_InventoryHub,
            label: 'WS-C: Quét Mã Vạch & Nhập / Xuất / Kiểm Kê',
            badge: 'Thủ kho',
          },
          {
            ...ALL_WORKSPACES.F_QaTraceability,
            label: 'WS-F: In Tem Nhãn Nhiệt QR & Mã Vạch',
            badge: 'In tem QR',
          },
          {
            ...ALL_WORKSPACES.H2_SalesCashflow,
            label: 'WS-H2: Xuất Giao Hàng Lên Xe',
            badge: 'Giao hàng',
          },
        ],
        independentModules: [],
      };

    // 5. Role 5: Farm Accountant (Kế toán trang trại)
    case 'FARM_ACCOUNTANT':
      return {
        sectionTitle: 'Bàn Kế Toán & Dòng Tiền Nông Trại',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'WS-G: Chấm Công Cá Nhân',
            badge: 'Cá nhân',
          },
          {
            ...ALL_WORKSPACES.B_Personnel360,
            label: 'WS-B: Tổng Hợp Công Tính Lương',
            badge: 'Bảng công',
          },
          {
            ...ALL_WORKSPACES.C_InventoryHub,
            label: 'WS-C: Đối Soát Phiếu Nhập / Xuất Kho',
            badge: 'Đối soát',
          },
          {
            ...ALL_WORKSPACES.D_Partners,
            label: 'WS-D: Quản Lý Đối Tác & Khách Hàng',
            badge: 'Đối tác',
          },
          {
            ...ALL_WORKSPACES.H1_CostAccounting,
            label: 'WS-H1: Hạch Toán Chi Phí & Giá Thành / Kg',
            badge: 'Giá thành',
          },
          {
            ...ALL_WORKSPACES.H2_SalesCashflow,
            label: 'WS-H2: Bán Sỉ, VietQR & Kết Toán Lãi',
            badge: 'Chuyển lãi',
          },
        ],
        independentModules: [
          ALL_INDEPENDENT_MODULES.reports,
        ],
      };

    // 6. Role 6A: Field Worker (Nhân viên hiện trường có tài khoản)
    // Chỉ hiển thị DUY NHẤT WS-G
    case 'FIELD_WORKER':
      return {
        sectionTitle: 'Bàn Tác Nghiệp Hiện Trường',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'WS-G: Bảng Tác Nghiệp & Chấm Công',
            badge: 'Hôm nay',
          },
        ],
        independentModules: [],
      };

    // Mặc định hoặc Super Admin: Hiển thị đầy đủ
    default:
      return {
        sectionTitle: '9 Bàn Làm Việc Vận Hành (A → H2)',
        workspaces: Object.values(ALL_WORKSPACES),
        independentModules: Object.values(ALL_INDEPENDENT_MODULES),
      };
  }
}

export default {
  ALL_WORKSPACES,
  ALL_INDEPENDENT_MODULES,
  getSidebarMenuConfig,
};
