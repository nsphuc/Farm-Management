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

  /**
   * Helper: Kiểm tra người dùng có quyền cụ thể không
   */
  hasPermission: (permCode) => {
    const { userInfo } = get();
    if (!userInfo) return false;
    if (userInfo.isSuperAdmin) return true;
    if (!Array.isArray(userInfo.permissions)) return false;
    return userInfo.permissions.includes(permCode);
  },

  /**
   * Helper: Kiểm tra có ít nhất 1 quyền trong danh sách không
   */
  hasAnyPermission: (permCodes) => {
    const { userInfo } = get();
    if (!userInfo) return false;
    if (userInfo.isSuperAdmin) return true;
    if (!Array.isArray(userInfo.permissions) || !Array.isArray(permCodes)) return false;
    return permCodes.some((perm) => userInfo.permissions.includes(perm));
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
}));
