import { create } from 'zustand';

/**
 * Context Preservation Store for Active Farm, Zone and Cycle
 * Tuân thủ Quy tắc 1 File 09: Khi đổi activeFarmId, tự động reset activeZoneId và activeCycleId!
 */
export const useActiveFarmStore = create((set, get) => ({
  activeFarmId: null,
  activeFarm: null,
  activeZoneId: null,
  activeCycleId: null,

  /**
   * Thay đổi trang trại đang tác nghiệp
   * Tự động reset activeZoneId và activeCycleId theo Quy tắc 1 File 09
   */
  setActiveFarmId: (farmId, accessibleFarms = []) => {
    const numericId = farmId ? Number(farmId) : null;
    const foundFarm = accessibleFarms.find(
      (f) => Number(f.farmId || f.id) === numericId
    ) || null;

    set({
      activeFarmId: numericId,
      activeFarm: foundFarm,
      activeZoneId: null,
      activeCycleId: null,
    });
  },

  setActiveFarm: (farmObject) => {
    if (!farmObject) {
      set({
        activeFarmId: null,
        activeFarm: null,
        activeZoneId: null,
        activeCycleId: null,
      });
      return;
    }
    const farmId = Number(farmObject.farmId || farmObject.id);
    set({
      activeFarmId: farmId,
      activeFarm: farmObject,
      activeZoneId: null,
      activeCycleId: null,
    });
  },

  setActiveZoneId: (zoneId) => {
    set({ activeZoneId: zoneId ? Number(zoneId) : null });
  },

  setActiveCycleId: (cycleId) => {
    set({ activeCycleId: cycleId ? Number(cycleId) : null });
  },

  /**
   * Đồng bộ từ danh sách accessibleFarms khi đăng nhập hoặc nạp userInfo
   * Tự động chọn Farm đầu tiên nếu chưa chọn hoặc farm hiện tại không nằm trong danh sách được cấp quyền
   */
  syncFromAccessibleFarms: (accessibleFarms = []) => {
    if (!accessibleFarms || !accessibleFarms.length) {
      set({
        activeFarmId: null,
        activeFarm: null,
        activeZoneId: null,
        activeCycleId: null,
      });
      return;
    }

    const { activeFarmId } = get();
    const isCurrentValid = accessibleFarms.some(
      (f) => Number(f.farmId || f.id) === Number(activeFarmId)
    );

    if (!isCurrentValid) {
      const defaultFarm = accessibleFarms[0];
      set({
        activeFarmId: Number(defaultFarm.farmId || defaultFarm.id),
        activeFarm: defaultFarm,
        activeZoneId: null,
        activeCycleId: null,
      });
    } else {
      const currentFarm = accessibleFarms.find(
        (f) => Number(f.farmId || f.id) === Number(activeFarmId)
      );
      set({ activeFarm: currentFarm || accessibleFarms[0] });
    }
  },

  clearActiveContext: () => {
    set({
      activeFarmId: null,
      activeFarm: null,
      activeZoneId: null,
      activeCycleId: null,
    });
  },
}));
