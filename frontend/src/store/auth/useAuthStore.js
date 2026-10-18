import { create } from 'zustand';

/**
 * Zustand Store quản lý trạng thái xác thực và phiên làm việc.
 * Tuân thủ DEC-05 (D-12): Lưu Access Token HOÀN TOÀN IN-MEMORY để triệt tiêu nguy cơ XSS.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: !!accessToken && !!user,
      isLoading: false,
    }),

  setAccessToken: (accessToken) =>
    set({
      accessToken,
      isAuthenticated: !!accessToken && !!get().user,
    }),

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!get().accessToken && !!user,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  hasPermission: (permissionCode) => {
    const { user } = get();
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permissionCode);
  },

  hasRole: (roleCode) => {
    const { user } = get();
    if (!user || !user.roles) return false;
    return user.roles.includes(roleCode);
  },

  isSuperAdmin: () => {
    const { user } = get();
    return !!(user?.roles && user.roles.includes('ROLE_SUPER_ADMIN'));
  },

  canAccessFarm: (farmId) => {
    const { user } = get();
    if (!user || !farmId) return false;
    if (user.roles && user.roles.includes('ROLE_FARM_OWNER')) return true;
    const accessible = user.accessibleFarmIds || user.farmIds || [];
    return accessible.includes(Number(farmId));
  },
}));

export default useAuthStore;
