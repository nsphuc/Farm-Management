import { create } from 'zustand';

const FARM_STORAGE_KEY = 'farm_saas_current_farm';

const getInitialFarm = () => {
  try {
    const saved = localStorage.getItem(FARM_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useFarmStore = create((set, get) => ({
  currentFarm: getInitialFarm(),
  accessibleFarms: [],

  setCurrentFarm: (farm) => {
    if (farm) {
      localStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(farm));
    } else {
      localStorage.removeItem(FARM_STORAGE_KEY);
    }
    set({ currentFarm: farm });
  },

  setAccessibleFarms: (farms) => {
    set({ accessibleFarms: farms || [] });

    // Tự động chọn farm đầu tiên nếu chưa chọn farm nào hoặc farm đã chọn không còn trong danh sách
    const current = get().currentFarm;
    if (farms && farms.length > 0) {
      const stillAccessible = current && farms.some((f) => f.id === current.id);
      if (!stillAccessible) {
        get().setCurrentFarm(farms[0]);
      }
    } else {
      get().setCurrentFarm(null);
    }
  },

  clearFarm: () => {
    localStorage.removeItem(FARM_STORAGE_KEY);
    set({ currentFarm: null, accessibleFarms: [] });
  },
}));
