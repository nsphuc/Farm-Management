import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  setAuth: (accessToken, user) => {
    set({
      accessToken,
      user,
      isAuthenticated: true,
    });
  },

  setAccessToken: (accessToken) => {
    set({
      accessToken,
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  hasRole: (role) => {
    const user = get().user;
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  },

  hasAnyRole: (roles) => {
    const user = get().user;
    if (!user || !user.roles) return false;
    return roles.some((r) => user.roles.includes(r));
  },

  hasPermission: (permission) => {
    const user = get().user;
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  },
}));
