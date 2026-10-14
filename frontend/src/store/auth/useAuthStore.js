import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  role: null,
  permissions: [],
  setUser: (user) => set({ user, isAuthenticated: !!user, role: user?.role, permissions: user?.permissions || [] }),
  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false, role: null, permissions: [] });
  },
}));

export default useAuthStore;
