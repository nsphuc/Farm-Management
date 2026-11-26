import { create } from 'zustand';
import axios from 'axios';

/**
 * Auth Store - IN-MEMORY ONLY for Access Token (ADR-02)
 * Cấm tuyệt đối lưu accessToken vào localStorage hay sessionStorage để chống XSS.
 */
export const useAuthStore = create((set, get) => ({
  accessToken: null,
  userInfo: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoggingOut: false,
  hasLoggedOut: false,

  setAuth: (accessToken, userInfo) => {
    set({
      accessToken,
      userInfo,
      user: userInfo,
      isAuthenticated: Boolean(accessToken && userInfo),
      isInitialized: true,
      isLoggingOut: false,
      hasLoggedOut: false,
    });
  },

  login: (accessToken, userInfo) => {
    set({
      accessToken,
      userInfo,
      user: userInfo,
      isAuthenticated: Boolean(accessToken && userInfo),
      isInitialized: true,
      isLoggingOut: false,
      hasLoggedOut: false,
    });
  },

  refreshToken: (accessToken, userInfo = null) => {
    set((state) => ({
      accessToken,
      userInfo: userInfo || state.userInfo,
      user: userInfo || state.userInfo,
      isAuthenticated: Boolean(accessToken && (userInfo || state.userInfo)),
      isInitialized: true,
      isLoggingOut: false,
      hasLoggedOut: false,
    }));
  },

  setAccessToken: (accessToken) => {
    set({
      accessToken,
      isAuthenticated: Boolean(accessToken && get().userInfo),
      isLoggingOut: false,
      hasLoggedOut: false,
    });
  },

  setUserInfo: (userInfo) => {
    set({
      userInfo,
      user: userInfo,
      isAuthenticated: Boolean(get().accessToken && userInfo),
    });
  },

  setMustChangePassword: (mustChange) => {
    const current = get().userInfo;
    if (current) {
      const updated = {
        ...current,
        mustChangePassword: Boolean(mustChange),
      };
      set({
        userInfo: updated,
        user: updated,
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
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      hasLoggedOut: true,
      isLoggingOut: false,
    });
  },

  logout: async () => {
    set({
      isLoggingOut: true,
      hasLoggedOut: true,
      accessToken: null,
      userInfo: null,
      user: null,
      isAuthenticated: false,
      isInitialized: true,
    });
    try {
      await axios.post('/api/v1/auth/logout', {}, { withCredentials: true });
    } catch {
      // Bỏ qua lỗi nếu có
    } finally {
      set({ isLoggingOut: false });
    }
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
   * Helper: Kiểm tra người dùng có quyền cụ thể không (Dynamic RBAC - Data-driven)
   * Super Admin và Farm Owner mặc định full quyền, các vai trò khác kiểm tra trực tiếp theo mã quyền (permission code)
   */
  hasPermission: (permCode) => {
    const { userInfo, isSuperAdmin, isOwner } = get();
    if (!userInfo) return false;
    if (isSuperAdmin() || isOwner()) return true;
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
   * Quy tắc 2: Kiểm tra quyền xem giá vốn / đơn giá / thành tiền tài chính
   */
  canViewFinancialPrice: () => {
    const { isOwner, hasPermission } = get();
    return isOwner() || hasPermission('financial.price.view');
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
   * Helper: Kiểm tra có ít nhất 1 vai trò trong danh sách không
   */
  hasAnyRole: (roleCodes) => {
    if (!Array.isArray(roleCodes) || roleCodes.length === 0) return false;
    return roleCodes.some((role) => get().hasRole(role));
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
   * Helper: Kiểm tra Cấp 2: Chủ trang trại (Quản trị viên cao nhất) (ROLE_FARM_OWNER)
   */
  isFarmOwner: () => get().isOwner(),

  /**
   * Helper: Hệ thống 5 Vai trò Chuẩn (Nhiệm vụ 8):
   * 1. Chủ trang trại (isOwner / isFarmOwner)
   * 2. Quản lý trại / Trại trưởng (isFarmManager)
   * 3. Kỹ thuật viên / Bác sĩ thú y (isVetTechnician / isTechnicalLead)
   * 4. Kế toán / Thủ kho (isFarmAccountant / isWarehouseKeeper)
   * 5. Công nhân chuồng trại (isBarnWorker / isFieldWorker)
   * (Đã xóa bỏ hoàn toàn role zone_manager)
   */
  isZoneManager: () => false,

  isVetTechnician: () => {
    const { userInfo, hasRole, isOwner, isFarmManager } = get();
    if (!userInfo) return false;
    if (isOwner() || isFarmManager()) return false;
    if (hasRole('ROLE_VET_TECHNICIAN') || hasRole('ROLE_TECHNICAL_STAFF')) return true;
    return get().hasFarmAssignmentRole(['VET_TECHNICIAN', 'TECHNICAL_LEAD', 'VETERINARIAN']);
  },

  isBarnWorker: () => {
    const { userInfo, hasRole, isOwner, isFarmManager, isVetTechnician, isFarmAccountant } = get();
    if (!userInfo) return false;
    if (isOwner() || isFarmManager() || isVetTechnician() || isFarmAccountant()) return false;
    if (hasRole('ROLE_BARN_WORKER') || hasRole('ROLE_FIELD_STAFF')) return true;
    return get().hasFarmAssignmentRole(['BARN_WORKER', 'FIELD_WORKER']);
  },

  /**
   * Helper: Kiểm tra Cấp 4: Nhân sự chuyên môn cấp trại (Kỹ thuật, Kho, Kế toán trại, Hiện trường)
   */
  isTier4Staff: () => {
    const { isSuperAdmin, isFarmOwner, isFarmManager } = get();
    return !isSuperAdmin() && !isFarmOwner() && !isFarmManager();
  },

  /**
   * Helper: Kiểm tra chức danh hiện trường trong farm_assignments
   */
  hasFarmAssignmentRole: (roleInFarm, farmId = null) => {
    const { userInfo } = get();
    if (!userInfo) return false;
    const assignments = userInfo.farmAssignments || [];
    const rolesToCheck = Array.isArray(roleInFarm) ? roleInFarm : [roleInFarm];
    return assignments.some((a) => {
      if (a.isActive === false) return false;
      const roleMatch = rolesToCheck.includes(a.roleInFarm || a.role_in_farm);
      if (!roleMatch) return false;
      if (farmId != null) {
        return Number(a.farmId) === Number(farmId);
      }
      return true;
    });
  },

  /**
   * Helper: Kiểm tra chức danh hiện trường (hỗ trợ cả farmAssignments và accessibleFarms)
   */
  hasFarmRole: (roleName, farmId = null) => {
    const { userInfo, hasFarmAssignmentRole } = get();
    if (!userInfo) return false;
    if (hasFarmAssignmentRole(roleName, farmId)) return true;
    const accessibleFarms = userInfo.accessibleFarms || [];
    const rolesToCheck = Array.isArray(roleName) ? roleName : [roleName];
    return accessibleFarms.some((f) => {
      if (farmId != null && Number(f.farmId || f.id) !== Number(farmId)) return false;
      return rolesToCheck.includes(f.assignedRole);
    });
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

    // Khi tài khoản là ROLE_FARM_OWNER hoặc OWNER
    const roles = userInfo.roles || [];
    const hasFarmOwnerRole = roles.some((r) => {
      const code = typeof r === 'string' ? r : (r?.code || r?.name);
      return code === 'ROLE_FARM_OWNER' || code === 'OWNER';
    });
    if (hasFarmOwnerRole || userInfo.role === 'ROLE_FARM_OWNER' || userInfo.operationalRole === 'OWNER' || userInfo.isOwner === true) {
      return true;
    }

    // Giám đốc trang trại (FARM_MANAGER) làm thuê tuyệt đối KHÔNG PHẢI là Chủ đầu tư cấp Tenant
    if (
      userInfo.operationalRole === 'FARM_MANAGER' ||
      userInfo.position === 'FARM_MANAGER' ||
      userInfo.assignedRole === 'FARM_MANAGER'
    ) {
      return false;
    }

    const hasFmRole = roles.some((r) => {
      const code = typeof r === 'string' ? r : (r?.code || r?.name);
      return code === 'ROLE_FARM_MANAGER' || code === 'FARM_MANAGER';
    });
    if (hasFmRole && !userInfo.isTenantOwner && !userInfo.isOwner) return false;

    return false;
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
   * Role 3B - Trưởng phân khu / Tổ trưởng sản xuất hiện trường (isZoneManager)
   * Tài khoản có vai trò ZONE_MANAGER tại phân khu (farm_assignments.role_in_farm == 'ZONE_MANAGER' hoặc operationalRole == 'ZONE_MANAGER').
   * Phụ trách trực tiếp phân khu sản xuất, chấm công tổ và điều phối việc tại phân khu.
   */
  isZoneManager: (farmId = null) => {
    const { userInfo, isOwner, isFarmManager, hasFarmRole } = get();
    if (!userInfo) return false;
    if (isOwner() || isFarmManager(farmId)) return false;

    if (userInfo.operationalRole === 'ZONE_MANAGER') return true;
    return hasFarmRole('ZONE_MANAGER', farmId);
  },

  /**
   * Lấy danh sách ID các phân khu mà user hiện tại đang được phân công phụ trách (ZONE_MANAGER / TECHNICAL_LEAD).
   * - Nếu là Super Admin, Farm Owner hoặc Farm Manager: trả về null (Toàn quyền quản lý tất cả các phân khu).
   * - Nếu là Zone Manager / Technical Lead: trả về mảng các ID phân khu [zoneId, ...] (bị giới hạn trong phạm vi phân khu phụ trách).
   */
  getManagedZoneIds: (farmId = null) => {
    const { userInfo, isOwner, isFarmManager } = get();
    if (!userInfo) return [];
    if (isOwner() || isFarmManager(farmId)) {
      return null; // Không bị giới hạn phân khu
    }

    const assignments = userInfo.farmAssignments || userInfo.farm_assignments || [];
    const zoneIds = new Set();

    // 1. Quét farmAssignments
    assignments.forEach((a) => {
      if (a.isActive === false) return;
      if (farmId != null && a.farmId != null && Number(a.farmId) !== Number(farmId)) return;
      const role = a.roleInFarm || a.role_in_farm;
      if (['ZONE_MANAGER', 'TECHNICAL_LEAD'].includes(role) && (a.zoneId || a.zone_id)) {
        zoneIds.add(Number(a.zoneId || a.zone_id));
      }
    });

    // 2. Kiểm tra assignedZoneId / zoneId trực tiếp trên userInfo (nếu có)
    if (userInfo.assignedZoneId) {
      zoneIds.add(Number(userInfo.assignedZoneId));
    }
    if (userInfo.zoneId) {
      zoneIds.add(Number(userInfo.zoneId));
    }

    return Array.from(zoneIds);
  },

  /**
   * Role 3 - Trưởng bộ phận kỹ thuật (isTechnicalLead)
   * Tài khoản có ROLE_TECHNICAL_STAFF (kiêm TECHNICAL_LEAD / AGRONOMIST / VETERINARIAN tại phân khu).
   * Phụ trách các phân khu trồng trọt/chăn nuôi, quản lý đội công nhân khu mình,
   * chấm công cá nhân và điểm danh hộ công nhân không có tài khoản trong khu.
   */
  isTechnicalLead: () => {
    const { userInfo, hasRole, isOwner, isFarmManager, isZoneManager } = get();
    if (!userInfo) return false;
    if (isOwner() || isFarmManager()) return false;
    if (isZoneManager()) return false;

    if (userInfo.operationalRole === 'TECHNICAL_LEAD') return true;
    if (hasRole('ROLE_TECHNICAL_STAFF')) return true;

    const techRoles = ['TECHNICAL_LEAD', 'AGRONOMIST', 'VETERINARIAN'];
    const assignments = userInfo.farmAssignments || [];
    const hasTechAssignment = assignments.some(
      (a) => techRoles.includes(a.roleInFarm || a.role_in_farm) && a.isActive !== false
    );
    if (hasTechAssignment) return true;

    const accessibleFarms = userInfo.accessibleFarms || [];
    return accessibleFarms.some((f) => techRoles.includes(f.assignedRole));
  },

  /**
   * Role 4 - Kế toán kho trang trại (isFarmAccountant)
   * Tài khoản có ROLE_ACCOUNTANT. Quản lý toàn diện kho hàng hóa cám/thuốc,
   * xuất nhập nội bộ, hóa đơn mua bán, sổ quỹ thu chi, bảng lương và đối chiếu chi phí chăn nuôi.
   */
  isFarmAccountant: () => {
    const { userInfo, hasRole, isOwner } = get();
    if (!userInfo) return false;
    if (isOwner()) return false;

    if (userInfo.operationalRole === 'FARM_ACCOUNTANT' || userInfo.operationalRole === 'ACCOUNTANT') return true;
    return hasRole('ROLE_ACCOUNTANT');
  },

  /**
   * Role Thủ kho trang trại (Đã gộp vào Kế toán kho trong FarmGo)
   */
  isWarehouseKeeper: () => {
    return get().isFarmAccountant();
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
      isZoneManager,
      isTechnicalLead,
      isWarehouseKeeper,
      isFarmAccountant,
    } = get();
    if (!userInfo) return false;
    if (
      isOwner() ||
      isFarmManager() ||
      isZoneManager() ||
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
   * Trả về 1 trong 8 mã:
   * 'SUPER_ADMIN' | 'OWNER' | 'FARM_MANAGER' | 'ZONE_MANAGER' | 'TECHNICAL_LEAD' | 'WAREHOUSE_KEEPER' | 'FARM_ACCOUNTANT' | 'FIELD_WORKER' | 'STAFF'
   */
  getOperationalRole: (farmId = null) => {
    const {
      isSuperAdmin,
      isOwner,
      isFarmManager,
      isZoneManager,
      isFarmAccountant,
      isTechnicalLead,
      isWarehouseKeeper,
      isFieldWorker,
    } = get();
    if (isSuperAdmin()) return 'SUPER_ADMIN';
    if (isFarmManager(farmId)) return 'FARM_MANAGER';
    if (isOwner()) return 'OWNER';
    if (isWarehouseKeeper()) return 'WAREHOUSE_KEEPER';
    if (isFarmAccountant()) return 'FARM_ACCOUNTANT';
    if (isZoneManager(farmId)) return 'ZONE_MANAGER';
    if (isTechnicalLead()) return 'TECHNICAL_LEAD';
    if (isFieldWorker()) return 'FIELD_WORKER';
    return 'STAFF';
  },

  /**
   * Getter: Lấy siêu dữ liệu chi tiết của vai trò vận hành
   */
  getOperationalRoleInfo: (farmId = null) => {
    const role = get().getOperationalRole(farmId);
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
          title: 'Chủ Trang Trại',
          shortTitle: 'Chủ trang trại',
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
      case 'ZONE_MANAGER':
        return {
          code: 'ZONE_MANAGER',
          roleNumber: 3.5,
          title: 'Trưởng Phân Khu / Tổ Trưởng Hiện Trường',
          shortTitle: 'Trưởng Phân Khu',
          badgeColor: 'bg-sky-100 text-sky-900 border-sky-300 font-bold',
          canSkipAttendance: false,
          isFarmLocked: true,
          canProxyAttendance: true, // Điểm danh hộ tổ công nhân trong phân khu
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
      case 'FARM_ACCOUNTANT':
      case 'ACCOUNTANT':
        return {
          code: 'FARM_ACCOUNTANT',
          roleNumber: 4,
          title: 'Kế Toán Kho',
          shortTitle: 'Kế Toán Kho',
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
