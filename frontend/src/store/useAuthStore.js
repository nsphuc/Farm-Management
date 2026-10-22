import { create } from 'zustand';

/**
 * Auth Store - IN-MEMORY ONLY for Access Token (ADR-02)
 * Cấm tuyệt đối lưu accessToken vào localStorage hay sessionStorage để chống XSS.
 */
export const useAuthStore = create((set, get) => ({
  accessToken: null,
  userInfo: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (accessToken, userInfo) => {
    set({
      accessToken,
      userInfo,
      isAuthenticated: Boolean(accessToken && userInfo),
      isInitialized: true,
    });
  },

  setAccessToken: (accessToken) => {
    set({
      accessToken,
      isAuthenticated: Boolean(accessToken && get().userInfo),
    });
  },

  setUserInfo: (userInfo) => {
    set({
      userInfo,
      isAuthenticated: Boolean(get().accessToken && userInfo),
    });
  },

  setMustChangePassword: (mustChange) => {
    const current = get().userInfo;
    if (current) {
      set({
        userInfo: {
          ...current,
          mustChangePassword: Boolean(mustChange),
        },
      });
    }
  },

  setInitialized: (isInitialized) => {
    set({ isInitialized });
  },

  clearAuth: () => {
    set({
      accessToken: null,
      userInfo: null,
      isAuthenticated: false,
      isInitialized: true,
    });
  },

  setAccessibleFarms: (farms) => {
    const { userInfo } = get();
    if (!userInfo) return;
    set({
      userInfo: {
        ...userInfo,
        accessibleFarms: farms,
      },
    });
  },

  /**
   * Helper: Kiểm tra người dùng có quyền cụ thể không
   */
  hasPermission: (permCode) => {
    const { userInfo, isSuperAdmin, isOwner, isFarmManager } = get();
    if (!userInfo) return false;
    if (isSuperAdmin() || isOwner()) return true;

    // Giám đốc trang trại (Role 2) có toàn quyền điều hành 9 workspaces của cơ sở phụ trách (trừ quyền platform và tạo farm mới)
    if (isFarmManager()) {
      if (permCode === 'PERM_TENANT_MANAGE' || permCode === 'PERM_FARM_CREATE') return false;
      const farmManagerPermissions = [
        'PERM_FARM_VIEW',
        'PERM_FARM_UPDATE',
        'PERM_ZONE_MANAGE',
        'PERM_CROP_VIEW',
        'PERM_CROP_PLAN',
        'PERM_CROP_LOG',
        'PERM_LIVESTOCK_VIEW',
        'PERM_LIVESTOCK_MANAGE',
        'PERM_LIVESTOCK_VET',
        'PERM_INVENTORY_VIEW',
        'PERM_HARVEST_MANAGE',
        'PERM_QC_INSPECT',
        'PERM_QC_APPROVE',
        'PERM_LABEL_PRINT',
        'PERM_HR_EMPLOYEE_MANAGE',
        'PERM_HR_ATTENDANCE',
        'PERM_TASK_ASSIGN',
        'PERM_FINANCE_EXPENSE',
        'PERM_FINANCE_SALES_ORDER',
        'PERM_FINANCE_REPORT',
        'PERM_PAYMENT_ALLOCATE',
      ];
      if (farmManagerPermissions.includes(permCode)) return true;
      if (Array.isArray(userInfo.permissions)) {
        return userInfo.permissions.includes(permCode);
      }
      return false;
    }

    if (!Array.isArray(userInfo.permissions)) return false;
    return userInfo.permissions.includes(permCode);
  },

  /**
   * Helper: Kiểm tra có ít nhất 1 quyền trong danh sách không
   */
  hasAnyPermission: (permCodes) => {
    const { hasPermission } = get();
    if (!Array.isArray(permCodes) || permCodes.length === 0) return false;
    return permCodes.some((perm) => hasPermission(perm));
  },

  /**
   * Helper: Kiểm tra có vai trò cụ thể không
   */
  hasRole: (roleCode) => {
    const { userInfo } = get();
    if (!userInfo || !Array.isArray(userInfo.roles)) return false;
    return userInfo.roles.some((r) =>
      typeof r === 'string' ? r === roleCode : r.code === roleCode
    );
  },

  /**
   * Helper: Kiểm tra có phải Super Admin không
   */
  isSuperAdmin: () => {
    const { userInfo } = get();
    if (!userInfo) return false;
    return Boolean(userInfo.isSuperAdmin || get().hasRole('ROLE_SUPER_ADMIN'));
  },

  /**
   * Role 1 - Chủ đầu tư / Chủ doanh nghiệp (isOwner)
   * Tài khoản có ROLE_FARM_OWNER ở cấp toàn doanh nghiệp (scope_level = 'TENANT' hoặc quản lý chuỗi trang trại,
   * không bị khóa cố định vào vị trí làm thuê tại 1 trại).
   * Quy tắc cứng cho isOwner:
   * 1. Owner là người bỏ vốn và trả lương nên TUYỆT ĐỐI KHÔNG CHẤM CÔNG.
   * 2. Owner không trực tiếp ghi nhật ký đồng ruộng vụn vặt hàng ngày.
   */
  isOwner: () => {
    const { userInfo, isSuperAdmin } = get();
    if (!userInfo) return false;
    if (isSuperAdmin()) return true;

    // Giám đốc trang trại (FARM_MANAGER) làm thuê tuyệt đối KHÔNG PHẢI là Chủ đầu tư cấp Tenant
    if (
      userInfo.operationalRole === 'FARM_MANAGER' ||
      userInfo.position === 'FARM_MANAGER' ||
      userInfo.assignedRole === 'FARM_MANAGER'
    ) {
      return false;
    }

    const roles = userInfo.roles || [];
    const hasFmRole = roles.some((r) => {
      const code = typeof r === 'string' ? r : (r?.code || r?.name);
      return code === 'ROLE_FARM_MANAGER' || code === 'FARM_MANAGER';
    });
    if (hasFmRole && !userInfo.isTenantOwner && !userInfo.isOwner) return false;

    if (userInfo.operationalRole === 'OWNER' || userInfo.isOwner === true) return true;

    const ownerRole = roles.find((r) =>
      typeof r === 'string' ? r === 'ROLE_FARM_OWNER' : r?.code === 'ROLE_FARM_OWNER'
    );
    if (!ownerRole) return false;

    // Nếu scopeLevel là 'FARM', thì là Quản lý trang trại làm thuê, không phải Owner cấp tenant
    const roleScope =
      typeof ownerRole === 'object'
        ? ownerRole.scopeLevel || ownerRole.scope_level
        : userInfo.scopeLevel || userInfo.scope_level;

    if (roleScope === 'FARM') {
      return false;
    }

    // Nếu có scopeLevel === 'TENANT' hoặc tenantOwner = true
    const hasTenantScope =
      roleScope === 'TENANT' ||
      userInfo.scope_level === 'TENANT' ||
      userInfo.scopeLevel === 'TENANT' ||
      Boolean(userInfo.isTenantOwner);

    if (!hasTenantScope) {
      const accessibleFarms = userInfo.accessibleFarms || [];
      const assignments = userInfo.farmAssignments || userInfo.farm_assignments || [];
      // Nếu chỉ có 1 trang trại và bị gán cứng vai trò làm thuê (FARM_MANAGER)
      const isSingleAssignedEmployee =
        (accessibleFarms.length === 1 &&
          (accessibleFarms[0]?.assignedRole === 'FARM_MANAGER' || accessibleFarms[0]?.isManager)) ||
        (assignments.length === 1 &&
          (assignments[0]?.roleInFarm === 'FARM_MANAGER' || assignments[0]?.role_in_farm === 'FARM_MANAGER'));

      if (isSingleAssignedEmployee) return false;
    }

    return true;
  },

  /**
   * Quy tắc cứng: Owner không trực tiếp ghi nhật ký đồng ruộng vụn vặt hàng ngày
   */
  canLogDailyDiary: () => {
    const { isOwner } = get();
    return !isOwner();
  },

  /**
   * Role 2 - Giám đốc / Quản lý 1 Trang trại (isFarmManager)
   * Người được Owner bổ nhiệm phụ trách điều hành 1 trang trại cụ thể:
   * (farms.manager_user_id == currentUser.id hoặc có farm_assignments.role_in_farm == 'FARM_MANAGER' /
   * ROLE_FARM_OWNER giới hạn ở scope_level = 'FARM' / ROLE_FARM_MANAGER / position == 'FARM_MANAGER').
   * Chỉ nhìn thấy dữ liệu của đúng trang trại mình phụ trách (activeFarmId khóa chặt vào trại đó).
   * Bắt buộc phải chấm công GPS + Selfie hàng ngày.
   */
  isFarmManager: (farmId = null) => {
    const { userInfo, isOwner } = get();
    if (!userInfo) return false;
    if (isOwner()) return false;

    if (
      userInfo.operationalRole === 'FARM_MANAGER' ||
      userInfo.position === 'FARM_MANAGER' ||
      userInfo.assignedRole === 'FARM_MANAGER' ||
      userInfo.role === 'ROLE_FARM_MANAGER'
    ) {
      return true;
    }

    const roles = userInfo.roles || [];
    const hasFmRole = roles.some((r) => {
      const code = typeof r === 'string' ? r : (r?.code || r?.name);
      return code === 'ROLE_FARM_MANAGER' || code === 'FARM_MANAGER';
    });
    if (hasFmRole) return true;

    const ownerRole = roles.find((r) =>
      typeof r === 'string' ? r === 'ROLE_FARM_OWNER' : r?.code === 'ROLE_FARM_OWNER'
    );
    if (ownerRole && typeof ownerRole === 'object' && ownerRole.scopeLevel === 'FARM') {
      return true;
    }

    const accessibleFarms = userInfo.accessibleFarms || [];
    if (farmId) {
      const targetFarm = accessibleFarms.find(
        (f) => Number(f.farmId || f.id) === Number(farmId)
      );
      if (
        targetFarm &&
        (targetFarm.isManager ||
          targetFarm.assignedRole === 'FARM_MANAGER' ||
          Number(targetFarm.managerUserId) === Number(userInfo.id))
      ) {
        return true;
      }
    }

    const isManagerOfAnyFarm = accessibleFarms.some(
      (f) =>
        f.isManager ||
        f.assignedRole === 'FARM_MANAGER' ||
        Number(f.managerUserId) === Number(userInfo.id)
    );
    if (isManagerOfAnyFarm) return true;

    const assignments = userInfo.farmAssignments || [];
    return assignments.some(
      (a) =>
        (a.roleInFarm === 'FARM_MANAGER' || a.role_in_farm === 'FARM_MANAGER') &&
        a.isActive !== false
    );
  },

  /**
   * Role 3 - Trưởng bộ phận kỹ thuật / Trưởng phân khu (isTechnicalLead)
   * Tài khoản có ROLE_TECHNICAL_STAFF (kiêm ZONE_MANAGER / TECHNICAL_LEAD / AGRONOMIST / VETERINARIAN tại phân khu).
   * Phụ trách các phân khu trồng trọt/chăn nuôi, quản lý đội công nhân khu mình,
   * chấm công cá nhân và điểm danh hộ công nhân không có tài khoản trong khu.
   */
  isTechnicalLead: () => {
    const { userInfo, hasRole, isOwner, isFarmManager } = get();
    if (!userInfo) return false;
    if (isOwner() || isFarmManager()) return false;

    if (userInfo.operationalRole === 'TECHNICAL_LEAD') return true;
    if (hasRole('ROLE_TECHNICAL_STAFF')) return true;

    const techRoles = ['ZONE_MANAGER', 'TECHNICAL_LEAD', 'AGRONOMIST', 'VETERINARIAN'];
    const assignments = userInfo.farmAssignments || [];
    const hasTechAssignment = assignments.some(
      (a) => techRoles.includes(a.roleInFarm || a.role_in_farm) && a.isActive !== false
    );
    if (hasTechAssignment) return true;

    const accessibleFarms = userInfo.accessibleFarms || [];
    return accessibleFarms.some((f) => techRoles.includes(f.assignedRole));
  },

  /**
   * Role 4 - Thủ kho trang trại (isWarehouseKeeper)
   * Tài khoản có ROLE_WAREHOUSE_STAFF. Chịu trách nhiệm toàn bộ thao tác Nhập kho / Xuất kho / Kiểm kê trên hệ thống,
   * phân công nhân viên kho bê hàng và điểm danh hộ nhân viên bốc xếp kho không có tài khoản.
   */
  isWarehouseKeeper: () => {
    const { userInfo, hasRole, isOwner, isFarmManager } = get();
    if (!userInfo) return false;
    if (isOwner() || isFarmManager()) return false;

    if (userInfo.operationalRole === 'WAREHOUSE_KEEPER') return true;
    if (hasRole('ROLE_WAREHOUSE_STAFF')) return true;

    const assignments = userInfo.farmAssignments || [];
    const hasWhAssignment = assignments.some(
      (a) =>
        (a.roleInFarm === 'WAREHOUSE_KEEPER' || a.role_in_farm === 'WAREHOUSE_KEEPER') &&
        a.isActive !== false
    );
    if (hasWhAssignment) return true;

    const accessibleFarms = userInfo.accessibleFarms || [];
    return accessibleFarms.some((f) => f.assignedRole === 'WAREHOUSE_KEEPER');
  },

  /**
   * Role 5 - Kế toán trang trại - Mỗi trại 1 người (isFarmAccountant)
   * Tài khoản có ROLE_ACCOUNTANT gắn với trang trại. Phối hợp với Thủ kho và Kỹ thuật để chi tiền nhập hàng,
   * thu tiền bán hàng VietQR vào tài khoản trại, tính giá thành/kg và cuối Chu kỳ vận hành thực hiện Kết toán chuyển lợi nhuận ròng về cho Owner.
   */
  isFarmAccountant: () => {
    const { userInfo, hasRole, isOwner } = get();
    if (!userInfo) return false;
    if (isOwner()) return false;

    if (userInfo.operationalRole === 'FARM_ACCOUNTANT') return true;
    return hasRole('ROLE_ACCOUNTANT');
  },

  /**
   * Role 6A - Nhân viên hiện trường CÓ tài khoản (isFieldWorker)
   * Tài khoản có ROLE_FIELD_STAFF.
   * Giao diện cực kỳ tinh gọn (Mobile-First): Chỉ dùng để Chấm công GPS + Selfie cá nhân và Xem/Báo cáo hoàn thành các công việc cố định hàng ngày (cho ăn, tưới cây, chăm sóc) hoặc việc phát sinh do Role 3 / Role 4 giao.
   */
  isFieldWorker: () => {
    const {
      userInfo,
      hasRole,
      isOwner,
      isFarmManager,
      isTechnicalLead,
      isWarehouseKeeper,
      isFarmAccountant,
    } = get();
    if (!userInfo) return false;
    if (
      isOwner() ||
      isFarmManager() ||
      isTechnicalLead() ||
      isWarehouseKeeper() ||
      isFarmAccountant()
    ) {
      return false;
    }

    if (userInfo.operationalRole === 'FIELD_WORKER') return true;
    if (hasRole('ROLE_FIELD_STAFF')) return true;

    const assignments = userInfo.farmAssignments || [];
    return assignments.some(
      (a) =>
        (a.roleInFarm === 'FIELD_WORKER' || a.role_in_farm === 'FIELD_WORKER') &&
        a.isActive !== false
    );
  },

  /**
   * Getter: Lấy vai trò vận hành phân cấp chính xác nhất của người dùng
   * Trả về 1 trong 7 mã:
   * 'SUPER_ADMIN' | 'OWNER' | 'FARM_MANAGER' | 'TECHNICAL_LEAD' | 'WAREHOUSE_KEEPER' | 'FARM_ACCOUNTANT' | 'FIELD_WORKER' | 'STAFF'
   */
  getOperationalRole: () => {
    const {
      isSuperAdmin,
      isOwner,
      isFarmManager,
      isFarmAccountant,
      isTechnicalLead,
      isWarehouseKeeper,
      isFieldWorker,
    } = get();
    if (isSuperAdmin()) return 'SUPER_ADMIN';
    if (isFarmManager()) return 'FARM_MANAGER';
    if (isOwner()) return 'OWNER';
    if (isFarmAccountant()) return 'FARM_ACCOUNTANT';
    if (isTechnicalLead()) return 'TECHNICAL_LEAD';
    if (isWarehouseKeeper()) return 'WAREHOUSE_KEEPER';
    if (isFieldWorker()) return 'FIELD_WORKER';
    return 'STAFF';
  },

  /**
   * Getter: Lấy siêu dữ liệu chi tiết của vai trò vận hành
   */
  getOperationalRoleInfo: () => {
    const role = get().getOperationalRole();
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          code: 'SUPER_ADMIN',
          roleNumber: 0,
          title: 'Quản Trị Viên Toàn Hệ Thống',
          shortTitle: 'Super Admin',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          canSkipAttendance: true,
          isFarmLocked: false,
          canProxyAttendance: true,
          isMobileFirst: false,
        };
      case 'OWNER':
        return {
          code: 'OWNER',
          roleNumber: 1,
          title: 'Chủ Đầu Tư / Chủ Doanh Nghiệp',
          shortTitle: 'Chủ Đầu Tư',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          canSkipAttendance: true, // TUYỆT ĐỐI KHÔNG CẦN CHẤM CÔNG
          isFarmLocked: false,     // Tự do chuyển đổi toàn chuỗi trại
          canProxyAttendance: false,
          isMobileFirst: false,
        };
      case 'FARM_MANAGER':
        return {
          code: 'FARM_MANAGER',
          roleNumber: 2,
          title: 'Giám Đốc / Quản Lý Trang Trại',
          shortTitle: 'Quản Lý Trại',
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
          canSkipAttendance: false, // Bắt buộc chấm công GPS + Selfie hàng ngày
          isFarmLocked: true,       // Khóa chặt vào trang trại phụ trách
          canProxyAttendance: true,
          isMobileFirst: false,
        };
      case 'TECHNICAL_LEAD':
        return {
          code: 'TECHNICAL_LEAD',
          roleNumber: 3,
          title: 'Trưởng Bộ Phận Kỹ Thuật / Phân Khu',
          shortTitle: 'Trưởng Kỹ Thuật',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          canSkipAttendance: false,
          isFarmLocked: true,
          canProxyAttendance: true, // Điểm danh hộ công nhân không có tài khoản
          isMobileFirst: false,
        };
      case 'WAREHOUSE_KEEPER':
        return {
          code: 'WAREHOUSE_KEEPER',
          roleNumber: 4,
          title: 'Thủ Kho Trang Trại',
          shortTitle: 'Thủ Kho',
          badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
          canSkipAttendance: false,
          isFarmLocked: true,
          canProxyAttendance: true, // Điểm danh hộ nhân viên bốc xếp kho không có tài khoản
          isMobileFirst: false,
        };
      case 'FARM_ACCOUNTANT':
        return {
          code: 'FARM_ACCOUNTANT',
          roleNumber: 5,
          title: 'Kế Toán Trang Trại',
          shortTitle: 'Kế Toán Trại',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
          canSkipAttendance: false,
          isFarmLocked: true,
          canProxyAttendance: false,
          isMobileFirst: false,
        };
      case 'FIELD_WORKER':
        return {
          code: 'FIELD_WORKER',
          roleNumber: 6,
          title: 'Nhân Viên Hiện Trường / Nông Vụ',
          shortTitle: 'Nông Vụ Hiện Trường',
          badgeColor: 'bg-teal-100 text-teal-900 border-teal-300 font-bold',
          canSkipAttendance: false,
          isFarmLocked: true,
          canProxyAttendance: false,
          isMobileFirst: true, // Giao diện cực kỳ tinh gọn Mobile-First
        };
      default:
        return {
          code: 'STAFF',
          roleNumber: 7,
          title: 'Nhân Viên Vận Hành',
          shortTitle: 'Nhân Viên',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
          canSkipAttendance: false,
          isFarmLocked: true,
          canProxyAttendance: false,
          isMobileFirst: false,
        };
    }
  },

  /**
   * Cờ: Người dùng có được miễn chấm công hoàn toàn không?
   * isOwner tuyệt đối không cần chấm công!
   */
  canSkipAttendance: () => {
    const { isOwner, isSuperAdmin } = get();
    return Boolean(isOwner() || isSuperAdmin());
  },

  /**
   * Cờ: Trang trại của người dùng có bị khóa cứng vào 1 trại không?
   * isOwner và SuperAdmin được tự do chuyển đổi, tất cả vai trò khác bị khóa vào trại phụ trách.
   */
  isFarmLocked: () => {
    const { isOwner, isSuperAdmin } = get();
    if (isSuperAdmin() || isOwner()) return false;
    return true;
  },
}));
