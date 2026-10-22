import { create } from 'zustand';
import { geographyService } from '@/services/modules/geographyService';
import { useAuthStore } from './useAuthStore';

/**
 * Context Preservation Store for Active Farm, Zone and Cycle
 * Tuân thủ Quy tắc 1 File 09: Khi đổi activeFarmId, tự động reset activeZoneId và activeCycleId!
 * Cơ chế cô lập đa trang trại & Bus đồng bộ tự động liên Workspace (ADR-Role-Hierarchy)
 */
export const useActiveFarmStore = create((set, get) => ({
  activeFarmId: 'ALL',
  activeFarm: {
    id: 'ALL',
    farmId: 'ALL',
    name: 'Tất cả trang trại toàn chuỗi',
    farmName: 'Tất cả trang trại toàn chuỗi',
    code: 'ALL',
    isAllFarms: true,
  },
  activeZoneId: null,
  activeCycleId: null,
  farms: [],
  dataVersion: 1,
  isLoadingFarms: false,

  /**
   * Cross-Workspace Sync Bus: Bộ đếm đồng bộ toàn cục cho từng thực thể
   * Giúp các Workspace tự động re-fetch khi có thao tác Thêm / Sửa / Duyệt / Xóa từ Workspace khác
   */
  syncTrigger: {
    farms: 0,
    zones: 0,
    employees: 0,
    partners: 0,
    inventory: 0,
    batches: 0,
    finance: 0,
  },

  /**
   * Kích hoạt tín hiệu thay đổi dữ liệu liên Workspace
   * @param {'farms' | 'zones' | 'employees' | 'partners' | 'inventory' | 'batches' | 'finance' | 'all'} entityKey
   */
  notifyDataChanged: async (entityKey = 'farms') => {
    set((state) => {
      const current = state.syncTrigger || {
        farms: 0,
        zones: 0,
        employees: 0,
        partners: 0,
        inventory: 0,
        batches: 0,
        finance: 0,
      };

      const updated = { ...current };
      if (entityKey && Object.prototype.hasOwnProperty.call(updated, entityKey)) {
        updated[entityKey] = (updated[entityKey] || 0) + 1;
      } else {
        // Tăng tất cả nếu không chỉ định hoặc là 'all'
        Object.keys(updated).forEach((k) => {
          updated[k] = (updated[k] || 0) + 1;
        });
      }

      return {
        syncTrigger: updated,
        dataVersion: state.dataVersion + 1,
      };
    });

    // Nếu entityKey là 'farms' hoặc 'employees' hoặc không truyền entityKey thì tự động gọi lại fetchFarms() ngầm
    if (!entityKey || entityKey === 'farms' || entityKey === 'employees' || entityKey === 'all') {
      return await get().fetchFarms();
    }
  },

  /**
   * Tăng biến đếm dataVersion để kích hoạt re-render/re-fetch reactive tức thì
   */
  bumpDataVersion: () => {
    set((state) => ({ dataVersion: state.dataVersion + 1 }));
  },

  /**
   * Tải lại danh sách trang trại từ API, cập nhật vào store và đồng bộ lên useAuthStore
   */
  fetchFarms: async () => {
    try {
      set({ isLoadingFarms: true });
      const res = await geographyService.getFarms();
      const farmList = Array.isArray(res) ? res : res?.content || [];

      set((state) => ({
        farms: farmList,
        dataVersion: state.dataVersion + 1,
        isLoadingFarms: false,
      }));

      // Đồng bộ vào accessibleFarms của useAuthStore nếu người dùng đã đăng nhập
      const authStore = useAuthStore.getState();
      if (authStore?.userInfo && authStore.setAccessibleFarms) {
        const mappedAccessible = farmList.map((f) => ({
          farmId: f.id,
          id: f.id,
          name: f.name,
          farmName: f.name,
          code: f.code,
          farmCode: f.code,
          farmType: f.farmType,
          totalAreaM2: f.totalAreaM2,
          managerUserId: f.managerUserId,
          managerFullName: f.managerFullName,
          status: f.status,
        }));
        authStore.setAccessibleFarms(mappedAccessible);
      }

      // Khóa cứng activeFarmId vào đúng trang trại phụ trách nếu là Giám đốc trang trại (FARM_MANAGER) hoặc role bị khóa
      const isFm = authStore?.isFarmManager ? authStore.isFarmManager() : false;
      const isLocked = authStore?.isFarmLocked ? authStore.isFarmLocked() : false;
      const isOwner = authStore?.isOwner ? authStore.isOwner() : false;

      if (isFm || (isLocked && !isOwner)) {
        const appointedFarm =
          farmList.find(
            (f) =>
              f.isManager ||
              f.assignedRole === 'FARM_MANAGER' ||
              Number(f.managerUserId) === Number(authStore?.userInfo?.id)
          ) || farmList[0];

        if (appointedFarm) {
          const appointedId = Number(appointedFarm.id || appointedFarm.farmId);
          set({
            activeFarmId: appointedId,
            activeFarm: appointedFarm,
          });
        }
      } else {
        const { activeFarmId } = get();
        if (!activeFarmId || activeFarmId === 'ALL') {
          // Mặc định luôn là 'ALL' (Tất cả trang trại toàn chuỗi) khi load trang hoặc mới đăng nhập cho Owner
          set({
            activeFarmId: 'ALL',
            activeFarm: {
              id: 'ALL',
              farmId: 'ALL',
              name: 'Tất cả trang trại toàn chuỗi',
              farmName: 'Tất cả trang trại toàn chuỗi',
              code: 'ALL',
              isAllFarms: true,
            },
          });
        } else if (farmList.length > 0) {
          const found = farmList.find((f) => Number(f.id) === Number(activeFarmId));
          if (found) {
            set({ activeFarm: found });
          } else {
            set({
              activeFarmId: 'ALL',
              activeFarm: {
                id: 'ALL',
                farmId: 'ALL',
                name: 'Tất cả trang trại toàn chuỗi',
                farmName: 'Tất cả trang trại toàn chuỗi',
                code: 'ALL',
                isAllFarms: true,
              },
            });
          }
        }
      }
      return farmList;
    } catch (err) {
      console.error('Failed to fetch farms in useActiveFarmStore', err);
      set({ isLoadingFarms: false });
      return [];
    }
  },

  /**
   * Thay đổi trang trại đang tác nghiệp
   * - Hỗ trợ chọn 1 farm cụ thể (number) để cô lập 100% dữ liệu
   * - Hỗ trợ chọn "ALL" ('Tất cả trang trại toàn chuỗi') dành riêng cho Owner
   * - FARM_MANAGER bị KHÓA CỨNG vào trại phụ trách, cấm chuyển sang ALL hay trại khác
   * Tự động reset activeZoneId và activeCycleId theo Quy tắc 1 File 09
   */
  setActiveFarmId: (farmId, accessibleFarms = []) => {
    const authStore = useAuthStore.getState();
    const isFm = authStore?.isFarmManager ? authStore.isFarmManager() : false;

    // Giám đốc trang trại (Role 2) bị cô lập 100% vào đúng trại phụ trách
    if (isFm) {
      const farmPool = accessibleFarms.length > 0 ? accessibleFarms : get().farms;
      const appointedFarm =
        farmPool.find(
          (f) =>
            f.isManager ||
            f.assignedRole === 'FARM_MANAGER' ||
            Number(f.managerUserId) === Number(authStore?.userInfo?.id)
        ) || farmPool[0];

      if (appointedFarm) {
        const appointedId = Number(appointedFarm.id || appointedFarm.farmId);
        set({
          activeFarmId: appointedId,
          activeFarm: appointedFarm,
          activeZoneId: null,
          activeCycleId: null,
        });
        return;
      }
    }

    if (farmId === 'ALL') {
      set({
        activeFarmId: 'ALL',
        activeFarm: {
          id: 'ALL',
          farmId: 'ALL',
          name: 'Tất cả trang trại toàn chuỗi',
          farmName: 'Tất cả trang trại toàn chuỗi',
          code: 'ALL',
          isAllFarms: true,
        },
        activeZoneId: null,
        activeCycleId: null,
      });
      return;
    }

    const numericId = farmId ? Number(farmId) : null;
    const farmPool = accessibleFarms.length > 0 ? accessibleFarms : get().farms;
    const foundFarm = farmPool.find(
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
    const authStore = useAuthStore.getState();
    const isFm = authStore?.isFarmManager ? authStore.isFarmManager() : false;
    if (isFm) {
      // Giữ cố định trại phụ trách
      return;
    }

    if (!farmObject) {
      set({
        activeFarmId: null,
        activeFarm: null,
        activeZoneId: null,
        activeCycleId: null,
      });
      return;
    }
    if (farmObject.id === 'ALL' || farmObject.farmId === 'ALL') {
      get().setActiveFarmId('ALL');
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
   * Helper kiểm tra có đang chọn Tất Cả Trang Trại toàn chuỗi không
   */
  isAllFarmsSelected: () => get().activeFarmId === 'ALL',

  /**
   * Helper kiểm tra có đang chọn 1 Trang trại cụ thể không
   */
  isSingleFarmSelected: () => {
    const { activeFarmId } = get();
    return Boolean(activeFarmId && activeFarmId !== 'ALL');
  },

  /**
   * Helper lấy farmId an toàn cho API (nếu ALL thì trả về null/undefined)
   */
  getSelectedFarmId: () => {
    const { activeFarmId } = get();
    return activeFarmId === 'ALL' ? null : (activeFarmId ? Number(activeFarmId) : null);
  },

  /**
   * Đồng bộ từ danh sách accessibleFarms khi đăng nhập hoặc nạp userInfo
   * Tự động khóa cứng vào đúng trang trại đối với FARM_MANAGER
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

    const authStore = useAuthStore.getState();
    const isFm = authStore?.isFarmManager ? authStore.isFarmManager() : false;
    const isOwner = authStore?.isOwner ? authStore.isOwner() : false;
    const isLocked = authStore?.isFarmLocked ? authStore.isFarmLocked() : false;

    // Khóa cứng FARM_MANAGER vào trang trại được bổ nhiệm (accessibleFarms[0])
    if (isFm || (isLocked && !isOwner)) {
      const appointedFarm =
        accessibleFarms.find(
          (f) =>
            f.isManager ||
            f.assignedRole === 'FARM_MANAGER' ||
            Number(f.managerUserId) === Number(authStore?.userInfo?.id)
        ) || accessibleFarms[0];

      if (appointedFarm) {
        const appointedId = Number(appointedFarm.farmId || appointedFarm.id);
        set({
          activeFarmId: appointedId,
          activeFarm: appointedFarm,
          activeZoneId: null,
          activeCycleId: null,
        });
      }
      return;
    }

    const { activeFarmId } = get();

    // Nếu đang chọn ALL và là Owner, giữ nguyên ALL
    if (activeFarmId === 'ALL' && isOwner) {
      return;
    }

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

export default useActiveFarmStore;
