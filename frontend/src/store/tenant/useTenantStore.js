import { create } from 'zustand';

export const useTenantStore = create((set) => ({
  currentTenant: null,
  currentFarm: null,
  setTenant: (tenant) => set({ currentTenant: tenant }),
  setFarm: (farm) => set({ currentFarm: farm }),
}));

export default useTenantStore;
