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
    label: 'Mặt Bằng & Phân Công',
    path: '/app/geography',
    icon: MapPin,
    permission: 'PERM_FARM_VIEW',
    badge: 'Farms',
  },
  B_Personnel360: {
    id: 'B_Personnel360',
    label: 'Nhân Sự 360° & SaaS',
    path: '/app/hr',
    icon: Users,
    anyPermissions: ['PERM_HR_EMPLOYEE_MANAGE', 'PERM_FINANCE_EXPENSE'],
    badge: 'HR',
  },
  C_InventoryHub: {
    id: 'C_InventoryHub',
    label: 'Kho Bãi & Mã Vạch',
    path: '/app/inventory',
    icon: Warehouse,
    permission: 'PERM_INVENTORY_VIEW',
    badge: 'Kho',
  },
  D_Partners: {
    id: 'D_Partners',
    label: 'Danh Bạ Đối Tác',
    path: '/app/partners',
    icon: Contact,
    permission: 'PERM_FINANCE_SALES_ORDER',
  },
  E_FarmingOps: {
    id: 'E_FarmingOps',
    label: 'Canh Tác & Chăn Nuôi',
    path: '/app/farming',
    icon: Sprout,
    anyPermissions: ['PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_CROP_LOG'],
    badge: 'Hiện trường',
  },
  F_QaTraceability: {
    id: 'F_QaTraceability',
    label: 'Đường Ống QA & QR',
    path: '/app/qa-traceability',
    icon: ShieldCheck,
    anyPermissions: ['PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_LABEL_PRINT', 'PERM_HARVEST_MANAGE'],
    badge: 'Kanban',
  },
  G_EmployeeDailyOps: {
    id: 'G_EmployeeDailyOps',
    label: 'Chấm Công GPS / Daily',
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
    label: 'Giá Thành & Chi Phí',
    path: '/app/cost-accounting',
    icon: Calculator,
    permission: 'PERM_FINANCE_EXPENSE',
  },
  H2_SalesCashflow: {
    id: 'H2_SalesCashflow',
    label: 'Bán Hàng & VietQR',
    path: '/app/sales-cashflow',
    icon: BadgeDollarSign,
    anyPermissions: ['PERM_FINANCE_SALES_ORDER', 'PERM_DELIVERY_MANAGE', 'PERM_FINANCE_PAYMENT'],
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
    anyPermissions: ['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_INVENTORY_RECEIPT', 'PERM_FINANCE_EXPENSE'],
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
        sectionTitle: 'Quản Trị Chủ Đầu Tư',
        workspaces: [
          {
            ...ALL_WORKSPACES.A_Geography,
            label: 'Mặt Bằng & Trang Trại',
            badge: 'Chuỗi trại',
          },
          {
            ...ALL_WORKSPACES.B_Personnel360,
            label: 'Nhân Sự Toàn Chuỗi',
            badge: 'Giám sát',
          },
          {
            ...ALL_WORKSPACES.C_InventoryHub,
            label: 'Giám Sát Kho Vận',
            badge: 'Chỉ xem',
          },
          {
            ...ALL_WORKSPACES.D_Partners,
            label: 'Đối Tác & Duyệt Hạn Mức',
            badge: 'Duyệt hạn mức',
          },
          {
            ...ALL_WORKSPACES.F_QaTraceability,
            label: 'Giám Sát Thành Phẩm & Thu Hồi',
            badge: 'Thu hồi',
          },
          {
            ...ALL_WORKSPACES.H1_CostAccounting,
            label: 'Thống Kê Chi Phí & Ngân Sách',
            badge: 'Ngân sách',
          },
          {
            ...ALL_WORKSPACES.H2_SalesCashflow,
            label: 'Dòng Tiền & Nhận Kết Toán',
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
        sectionTitle: 'Điều Hành Giám Đốc Trại',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'Chấm Công & Điều Hành Trại',
            path: '/app/my-dashboard',
            badge: 'GPS + Selfie',
          },
          {
            ...ALL_WORKSPACES.A_Geography,
            label: 'Mặt Bằng & Phân Công Khu',
            path: '/app/geography',
            badge: 'Phân khu',
          },
          {
            ...ALL_WORKSPACES.B_Personnel360,
            label: 'Quản Trị Nhân Sự Trại',
            path: '/app/hr',
            badge: 'Nhân sự trại',
          },
          {
            ...ALL_WORKSPACES.C_InventoryHub,
            label: 'Theo Dõi Kho Bãi',
            path: '/app/inventory',
            badge: 'Giám sát kho',
          },
          {
            ...ALL_WORKSPACES.D_Partners,
            label: 'Danh Bạ Đối Tác Trại',
            path: '/app/partners',
          },
          {
            ...ALL_WORKSPACES.E_FarmingOps,
            label: 'Mùa Vụ, Đàn Nuôi & Việc Cố Định',
            path: '/app/farming',
            badge: 'Kế hoạch',
          },
          {
            ...ALL_WORKSPACES.F_QaTraceability,
            label: 'Phê Duyệt QA/KCS & QR',
            path: '/app/qa-traceability',
            badge: 'Duyệt KCS',
          },
          {
            ...ALL_WORKSPACES.H1_CostAccounting,
            label: 'Theo Dõi Chi Phí & Giá Thành',
            path: '/app/cost-accounting',
            badge: 'Chi phí',
          },
          {
            ...ALL_WORKSPACES.H2_SalesCashflow,
            label: 'Doanh Thu & Duyệt Kết Toán Trại',
            path: '/app/sales-cashflow',
            badge: 'Kết toán',
          },
        ],
        independentModules: [
          ALL_INDEPENDENT_MODULES.reports,
          ALL_INDEPENDENT_MODULES.settings,
        ],
      };

    // 3B. Role 3B: Zone Manager (Trưởng phân khu / Tổ trưởng sản xuất hiện trường / Kỹ sư)
    case 'ZONE_MANAGER':
      return {
        sectionTitle: 'Chỉ Huy Phân Khu & Kỹ Thuật',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'Điểm Danh Tổ & Điều Phối Việc',
            badge: 'Tổ trưởng',
          },
          {
            ...ALL_WORKSPACES.A_Geography,
            label: 'Sơ Đồ Phân Khu & Nhân Sự Tổ',
            badge: 'Phân khu',
          },
          {
            ...ALL_WORKSPACES.E_FarmingOps,
            label: 'Nhật Ký Canh Tác & Thu Hoạch Khu',
            badge: 'Sản xuất',
          },
          {
            ...ALL_WORKSPACES.C_InventoryHub,
            label: 'Tra Cứu Tồn Kho Vật Tư',
            badge: 'Kho',
          },
          {
            ...ALL_WORKSPACES.F_QaTraceability,
            label: 'Kiểm Định KCS & Lấy Mẫu',
            badge: 'KCS',
          },
        ],
        independentModules: [
          {
            ...ALL_INDEPENDENT_MODULES.settings,
            label: 'Danh Mục Giống & Định Mức',
            badge: 'Kỹ thuật',
          },
        ],
      };

    // 3. Role 3: Technical Lead (Trưởng bộ phận kỹ thuật / Trưởng phân khu)
    case 'TECHNICAL_LEAD':
      return {
        sectionTitle: 'Tác Nghiệp Trưởng Kỹ Thuật',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'Chấm Công & Điểm Danh Tổ',
            badge: 'Điểm danh tổ',
          },
          {
            ...ALL_WORKSPACES.A_Geography,
            label: 'Phân Khu & Nhân Sự Khu Mình',
            badge: 'Khu vực',
          },
          {
            ...ALL_WORKSPACES.E_FarmingOps,
            label: 'Nhật Ký Canh Tác / Nuôi & Thu Hoạch',
            badge: 'Tác nghiệp',
          },
          {
            ...ALL_WORKSPACES.C_InventoryHub,
            label: 'Tra Cứu Tồn Kho Vật Tư',
            badge: 'Tra cứu kho',
          },
          {
            ...ALL_WORKSPACES.F_QaTraceability,
            label: 'Lập Biên Bản Kiểm Định KCS',
            badge: 'Kiểm định',
          },
        ],
        independentModules: [
          {
            ...ALL_INDEPENDENT_MODULES.settings,
            label: 'Danh Mục Giống & Định Mức BOM',
            badge: 'Kỹ thuật',
          },
        ],
      };

    // 4. Role 4: Warehouse Keeper (Thủ kho trang trại)
    case 'WAREHOUSE_KEEPER':
      return {
        sectionTitle: 'Thao Tác Thủ Kho Trang Trại',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'Chấm Công & Điểm Danh Tổ Kho',
            badge: 'Tổ kho',
          },
          {
            ...ALL_WORKSPACES.C_InventoryHub,
            label: 'Quét Mã Vạch & Nhập / Xuất / Kiểm Kê',
            badge: 'Thủ kho',
          },
          {
            ...ALL_WORKSPACES.F_QaTraceability,
            label: 'Đóng Gói Lô & In Tem Nhãn Nhiệt QR',
            badge: 'In tem QR',
          },
          {
            ...ALL_WORKSPACES.H2_SalesCashflow,
            label: 'Xuất Giao Hàng Lên Xe',
            badge: 'Giao hàng',
          },
        ],
        independentModules: [
          {
            ...ALL_INDEPENDENT_MODULES.settings,
            label: 'Danh Mục Kho Bãi & Vật Tư',
            badge: 'Kho & Vật tư',
          },
        ],
      };

    // 5. Role 5: Farm Accountant (Kế toán trang trại)
    case 'FARM_ACCOUNTANT':
      return {
        sectionTitle: 'Kế Toán & Dòng Tiền Nông Trại',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'Chấm Công Cá Nhân',
            badge: 'Cá nhân',
          },
          {
            ...ALL_WORKSPACES.B_Personnel360,
            label: 'Tổng Hợp Công Tính Lương',
            badge: 'Bảng công',
          },
          {
            ...ALL_WORKSPACES.C_InventoryHub,
            label: 'Đối Soát Phiếu Nhập / Xuất Kho',
            badge: 'Đối soát',
          },
          {
            ...ALL_WORKSPACES.D_Partners,
            label: 'Quản Lý Đối Tác & Khách Hàng',
            badge: 'Đối tác',
          },
          {
            ...ALL_WORKSPACES.H1_CostAccounting,
            label: 'Hạch Toán Chi Phí & Giá Thành / Kg',
            badge: 'Giá thành',
          },
          {
            ...ALL_WORKSPACES.H2_SalesCashflow,
            label: 'Bán Sỉ, VietQR & Kết Toán Lãi',
            badge: 'Chuyển lãi',
          },
        ],
        independentModules: [
          ALL_INDEPENDENT_MODULES.reports,
          {
            ...ALL_INDEPENDENT_MODULES.settings,
            label: 'Danh Mục Nhóm Chi Phí',
            badge: 'Kế toán',
          },
        ],
      };

    // 6. Role 6A: Field Worker (Nhân viên hiện trường có tài khoản)
    // Hiển thị 2 Workspaces phục vụ hiện trường: WS-G và WS-E
    case 'FIELD_WORKER':
      return {
        sectionTitle: 'Tác Nghiệp Hiện Trường',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'Bảng Tác Nghiệp & Chấm Công',
            badge: 'Hôm nay',
          },
          {
            ...ALL_WORKSPACES.E_FarmingOps,
            label: 'Nhật Ký Canh Tác & Thu Hoạch',
            badge: 'Đồng ruộng / Chuồng',
          },
        ],
        independentModules: [],
      };

    // Mặc định hoặc Super Admin: Hiển thị đầy đủ
    default:
      return {
        sectionTitle: 'Bàn Làm Việc Vận Hành',
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
