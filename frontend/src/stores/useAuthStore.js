import { create } from 'zustand';

export const normalizeRole = (role) => {
  if (!role) return '';
  return String(role).replace(/^ROLE_/, '').trim().toUpperCase();
};

const formatUser = (user) => {
  if (!user) return null;
  const primaryRole = normalizeRole(user.role || (Array.isArray(user.roles) ? user.roles[0] : ''));
  const rawRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
  const normalizedRoles = rawRoles.map(normalizeRole);
  if (primaryRole && !normalizedRoles.includes(primaryRole)) {
    normalizedRoles.push(primaryRole);
  }
  return {
    ...user,
    role: primaryRole,
    roles: user.roles || normalizedRoles.map((r) => `ROLE_${r}`),
    normalizedRoles,
  };
};

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  currentUser: null,
  isAuthenticated: false,

  setAuth: (accessToken, rawUser) => {
    const formatted = formatUser(rawUser);
    set({
      accessToken,
      user: formatted,
      currentUser: formatted,
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
      currentUser: null,
      isAuthenticated: false,
    });
  },

  hasRole: (role) => {
    const user = get().currentUser || get().user;
    if (!user) return false;
    const target = normalizeRole(role);
    if (user.role === target) return true;
    if (user.normalizedRoles && user.normalizedRoles.includes(target)) return true;
    if (user.roles && user.roles.some((r) => normalizeRole(r) === target)) return true;
    return false;
  },

  hasAnyRole: (roles) => {
    if (!Array.isArray(roles) || roles.length === 0) return false;
    const user = get().currentUser || get().user;
    if (!user) return false;
    const userRoles = [
      user.role,
      ...(user.normalizedRoles || []),
      ...(user.roles ? user.roles.map(normalizeRole) : []),
    ].filter(Boolean);
    const targetRoles = roles.map(normalizeRole);
    return targetRoles.some((target) => userRoles.includes(target));
  },

  hasPermission: (permission) => {
    const user = get().currentUser || get().user;
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  },
}));
