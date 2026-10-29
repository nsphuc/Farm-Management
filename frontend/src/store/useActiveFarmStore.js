import { create } from 'zustand';
import { geographyService } from '@/services/modules/geographyService';
import { useAuthStore } from './useAuthStore';

/**
 * Helper tính toán metadata loại hình trang trại thích ứng (CROP, LIVESTOCK, MIXED)
 */
export const resolveFarmTypeMeta = (activeFarmId, activeFarm, farms = []) => {
  if (!activeFarmId || activeFarmId === 'ALL') {
    return {
      activeFarmType: 'MIXED',
      supportsCrop: true,
      supportsLivestock: true,
    };
  }
  let type = activeFarm?.farmType;
  if (!type && farms && farms.length > 0) {
    const matched = farms.find((f) => Number(f.farmId || f.id) === Number(activeFarmId));
    type = matched?.farmType;
  }
  if (!type) {
    const authStore = useAuthStore.getState();
    const accessible = authStore?.accessibleFarms || [];
    const matched = accessible.find((f) => Number(f.farmId || f.id) === Number(activeFarmId));
    type = matched?.farmType;
  }
  const cleanType = type ? String(type).toUpperCase() : 'MIXED';
  return {
    activeFarmType: cleanType,
    supportsCrop: cleanType === 'CROP' || cleanType === 'MIXED',
    supportsLivestock: cleanType === 'LIVESTOCK' || cleanType === 'MIXED',
  };
};

/**
 * Module-level In-flight Promise để chống gọi trùng API fetchFarms
 */
let fetchFarmsInFlightPromise = null;

export const DEFAULT_SYNC_TRIGGER = {
  all: 0,
  farms: 0,
  zones: 0,
  locations: 0,
  employees: 0,
  attendance: 0,
  tasks: 0,
  partners: 0,
  inventory: 0,
  batches: 0,
  seasons: 0,
  groups: 0,
  farming: 0,
  expenses: 0,
  finance: 0,
};

const SYNC_CHANNEL_NAME = 'agri_erp_sync_bus';
const SYNC_STORAGE_KEY = 'agri_erp_last_sync_event';

const currentTabId = typeof window !== 'undefined'
  ? (window.__agriTabId || (window.__agriTabId = Math.random().toString(36).substring(2, 9)))
  : 'server';

let syncBroadcastChannel = null;
if (typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function') {
  try {
    syncBroadcastChannel = new window.BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch (e) {
    console.warn('[SyncBus] Failed to initialize BroadcastChannel', e);
  }
}

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
    farmType: 'MIXED',
  },
  activeFarmType: 'MIXED',
  supportsCrop: true,
  supportsLivestock: true,
  activeZoneId: null,
  activeCycleId: null,
  farms: [],
  dataVersion: 1,
  isLoadingFarms: false,

  /**
   * Cross-Workspace Sync Bus: Bộ đếm đồng bộ toàn cục cho từng thực thể (GAP-SYNC-01)
   * Khởi tạo đầy đủ 15 kênh thực thể phản ứng tức thì không cần F5
   */
  syncTrigger: { ...DEFAULT_SYNC_TRIGGER },

  /**
   * Kích hoạt tín hiệu thay đổi dữ liệu liên Workspace & đa Tab (GAP-SYNC-01 & GAP-SYNC-02)
   * @param {string} entityKey - Kênh thực thể thay đổi hoặc 'all'
   * @param {{ broadcast?: boolean }} options - Tùy chọn phát sóng đa Tab
   */
  notifyDataChanged: async (entityKey = 'all', options = { broadcast: true }) => {
    const isBroadcast = options?.broadcast !== false;

    set((state) => {
      const current = state.syncTrigger || { ...DEFAULT_SYNC_TRIGGER };
      const updated = { ...current };
      const targets = new Set();
      targets.add('all'); // GAP-SYNC-01: updated.all luôn luôn tăng trong mọi trường hợp!

      if (!entityKey || entityKey === 'all') {
        Object.keys(DEFAULT_SYNC_TRIGGER).forEach((k) => targets.add(k));
      } else {
        targets.add(entityKey);

        // Tự động kích hoạt các kênh liên đới theo nghiệp vụ
        if (entityKey === 'expenses' || entityKey === 'finance') {
          targets.add('expenses');
          targets.add('finance');
          targets.add('partners');
        } else if (entityKey === 'seasons' || entityKey === 'groups' || entityKey === 'locations') {
          targets.add('seasons');
          targets.add('groups');
          targets.add('farming');
          targets.add('locations');
          targets.add('zones');
        } else if (entityKey === 'attendance' || entityKey === 'tasks' || entityKey === 'employees') {
          targets.add('attendance');
          targets.add('tasks');
          targets.add('employees');
        } else if (entityKey === 'inventory' || entityKey === 'batches') {
          targets.add('inventory');
          targets.add('batches');
          targets.add('expenses');
          targets.add('finance');
        }
      }

      targets.forEach((key) => {
        updated[key] = (updated[key] || 0) + 1;
      });

      return {
        syncTrigger: updated,
        dataVersion: state.dataVersion + 1,
      };
    });

    // GAP-SYNC-02: Phát sóng BroadcastChannel & storage fallback sang các tab khác
    if (isBroadcast && typeof window !== 'undefined') {
      const payload = {
        type: 'DATA_CHANGED',
        entityKey: entityKey || 'all',
        farmId: get().activeFarmId,
        timestamp: Date.now(),
        senderId: currentTabId,
      };

      if (syncBroadcastChannel) {
        try {
          syncBroadcastChannel.postMessage(payload);
        } catch (err) {
          console.warn('[SyncBus] BroadcastChannel postMessage error', err);
        }
      }

      try {
        localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Safe ignore
      }
    }

    // Nếu entityKey là 'farms' hoặc 'all' thì tự động gọi lại fetchFarms() ngầm với force = true
    if (!entityKey || entityKey === 'farms' || entityKey === 'all') {
      return await get().fetchFarms(true);
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
   * Hỗ trợ In-flight Promise deduplication và xử lý êm ái Request aborted
   */
  fetchFarms: async (force = false) => {
    // 1. Chống gọi trùng API: Nếu đang có request in-flight thì tái sử dụng Promise đó
    if (fetchFarmsInFlightPromise) {
      return fetchFarmsInFlightPromise;
    }

    // 2. Nếu đã có danh sách farms và không ép buộc (force = false), tái sử dụng dữ liệu
    if (!force && get().farms && get().farms.length > 0) {
      return get().farms;
    }

    fetchFarmsInFlightPromise = (async () => {
      try {
        if (!get().isLoadingFarms) {
          set({ isLoadingFarms: true });
        }
        const res = await geographyService.getFarms();
        const farmList = Array.isArray(res) ? res : res?.content || [];

        const currentFarms = get().farms || [];
        const isFarmsSame =
          currentFarms.length === farmList.length &&
          currentFarms.every(
            (cf, idx) =>
              Number(cf.id) === Number(farmList[idx]?.id) &&
              cf.name === farmList[idx]?.name &&
              cf.farmType === farmList[idx]?.farmType &&
              Number(cf.managerUserId) === Number(farmList[idx]?.managerUserId)
          );

        if (!isFarmsSame || get().isLoadingFarms) {
          set({
            farms: farmList,
            isLoadingFarms: false,
          });
        }

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
            if (get().activeFarmId !== appointedId) {
              set({
                activeFarmId: appointedId,
                activeFarm: appointedFarm,
                ...resolveFarmTypeMeta(appointedId, appointedFarm, farmList),
              });
            }
          }
        } else {
          const { activeFarmId } = get();
          if (!activeFarmId || activeFarmId === 'ALL') {
            if (activeFarmId !== 'ALL' || !get().activeFarm) {
              const allFarmObj = {
                id: 'ALL',
                farmId: 'ALL',
                name: 'Tất cả trang trại toàn chuỗi',
                farmName: 'Tất cả trang trại toàn chuỗi',
                code: 'ALL',
                isAllFarms: true,
                farmType: 'MIXED',
              };
              set({
                activeFarmId: 'ALL',
                activeFarm: allFarmObj,
                ...resolveFarmTypeMeta('ALL', allFarmObj, farmList),
              });
            }
          } else if (farmList.length > 0) {
            const found = farmList.find((f) => Number(f.id) === Number(activeFarmId));
            if (found) {
              if (get().activeFarm?.id !== found.id || get().activeFarm?.farmType !== found.farmType) {
                set({
                  activeFarm: found,
                  ...resolveFarmTypeMeta(activeFarmId, found, farmList),
                });
              }
            } else {
              const allFarmObj = {
                id: 'ALL',
                farmId: 'ALL',
                name: 'Tất cả trang trại toàn chuỗi',
                farmName: 'Tất cả trang trại toàn chuỗi',
                code: 'ALL',
                isAllFarms: true,
                farmType: 'MIXED',
              };
              set({
                activeFarmId: 'ALL',
                activeFarm: allFarmObj,
                ...resolveFarmTypeMeta('ALL', allFarmObj, farmList),
              });
            }
          }
        }
        return farmList;
      } catch (err) {
        const isAborted =
          err?.code === 'ERR_CANCELED' ||
          err?.code === 'ECONNABORTED' ||
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError' ||
          err?.message?.includes('Request aborted') ||
          err?.message?.includes('canceled');

        if (isAborted) {
          return get().farms || [];
        }

        console.error('Failed to fetch farms in useActiveFarmStore', err);
        return [];
      } finally {
        fetchFarmsInFlightPromise = null;
        if (get().isLoadingFarms) {
          set({ isLoadingFarms: false });
        }
      }
    })();

    return fetchFarmsInFlightPromise;
  },

  /**
   * Thay đổi trang trại đang tác nghiệp
   * - Hỗ trợ chọn 1 farm cụ thể (number) để cô lập 100% dữ liệu
   * - Hỗ trợ chọn "ALL" ('Tất cả trang trại toàn chuỗi') dành riêng cho Owner
   * - FARM_MANAGER bị KHÓA CỨNG vào trại phụ trách, cấm chuyển sang ALL hay trại khác
   * Tự động reset activeZoneId và activeCycleId theo Quy tắc 1 File 09
   */
  setActiveFarmId: (farmId, accessibleFarms = []) => {
    const currentId = get().activeFarmId;
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
        if (currentId === appointedId && get().activeZoneId === null && get().activeCycleId === null) {
          return;
        }
        set({
          activeFarmId: appointedId,
          activeFarm: appointedFarm,
          ...resolveFarmTypeMeta(appointedId, appointedFarm, farmPool),
          activeZoneId: null,
          activeCycleId: null,
        });
        return;
      }
    }

    if (farmId === 'ALL') {
      if (currentId === 'ALL' && get().activeZoneId === null && get().activeCycleId === null) {
        return;
      }
      const allFarmObj = {
        id: 'ALL',
        farmId: 'ALL',
        name: 'Tất cả trang trại toàn chuỗi',
        farmName: 'Tất cả trang trại toàn chuỗi',
        code: 'ALL',
        isAllFarms: true,
        farmType: 'MIXED',
      };
      set({
        activeFarmId: 'ALL',
        activeFarm: allFarmObj,
        ...resolveFarmTypeMeta('ALL', allFarmObj, get().farms),
        activeZoneId: null,
        activeCycleId: null,
      });
      return;
    }

    const numericId = farmId ? Number(farmId) : null;
    if (currentId === numericId && get().activeZoneId === null && get().activeCycleId === null) {
      return;
    }

    const farmPool = accessibleFarms.length > 0 ? accessibleFarms : get().farms;
    const foundFarm = farmPool.find(
      (f) => Number(f.farmId || f.id) === numericId
    ) || null;

    set({
      activeFarmId: numericId,
      activeFarm: foundFarm,
      ...resolveFarmTypeMeta(numericId, foundFarm, farmPool),
      activeZoneId: null,
      activeCycleId: null,
    });
  },

  setActiveFarm: (farmObject) => {
    const authStore = useAuthStore.getState();
    const isFm = authStore?.isFarmManager ? authStore.isFarmManager() : false;
    if (isFm) {
      return;
    }

    if (!farmObject) {
      if (get().activeFarmId === null) return;
      set({
        activeFarmId: null,
        activeFarm: null,
        activeFarmType: 'MIXED',
        supportsCrop: true,
        supportsLivestock: true,
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
    if (get().activeFarmId === farmId && get().activeZoneId === null && get().activeCycleId === null) {
      return;
    }
    set({
      activeFarmId: farmId,
      activeFarm: farmObject,
      ...resolveFarmTypeMeta(farmId, farmObject, get().farms),
      activeZoneId: null,
      activeCycleId: null,
    });
  },

  setActiveZoneId: (zoneId) => {
    const newZoneId = zoneId ? Number(zoneId) : null;
    if (get().activeZoneId === newZoneId) return;
    set({ activeZoneId: newZoneId });
  },

  setActiveCycleId: (cycleId) => {
    const newCycleId = cycleId ? Number(cycleId) : null;
    if (get().activeCycleId === newCycleId) return;
    set({ activeCycleId: newCycleId });
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
      if (get().activeFarmId === null) return;
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
        if (get().activeFarmId === appointedId) return;
        set({
          activeFarmId: appointedId,
          activeFarm: appointedFarm,
          ...resolveFarmTypeMeta(appointedId, appointedFarm, accessibleFarms),
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
      const defId = Number(defaultFarm.farmId || defaultFarm.id);
      if (get().activeFarmId === defId) return;
      set({
        activeFarmId: defId,
        activeFarm: defaultFarm,
        ...resolveFarmTypeMeta(defId, defaultFarm, accessibleFarms),
        activeZoneId: null,
        activeCycleId: null,
      });
    }
  },

  clearActiveContext: () => {
    set({
      activeFarmId: null,
      activeFarm: null,
      activeFarmType: 'MIXED',
      supportsCrop: true,
      supportsLivestock: true,
      activeZoneId: null,
      activeCycleId: null,
    });
  },
}));

// =========================================================================
// CROSS-TAB REACTIVITY & EVENT BUS LISTENERS (GAP-SYNC-02)
// Chống lặp vô hạn (Infinite Loop Prevention): broadcast: false khi nhận event
// =========================================================================
if (syncBroadcastChannel) {
  syncBroadcastChannel.onmessage = (event) => {
    const data = event?.data;
    if (data && data.type === 'DATA_CHANGED' && data.senderId !== currentTabId) {
      useActiveFarmStore.getState().notifyDataChanged(data.entityKey || 'all', { broadcast: false });
    }
  };
}

if (typeof window !== 'undefined') {
  // Fallback qua localStorage storage event
  window.addEventListener('storage', (e) => {
    if (e.key === SYNC_STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        if (data && data.type === 'DATA_CHANGED' && data.senderId !== currentTabId) {
          useActiveFarmStore.getState().notifyDataChanged(data.entityKey || 'all', { broadcast: false });
        }
      } catch {
        // Safe ignore
      }
    }
  });

  // Tab Visibility & Focus Reactivity với debounce tối thiểu 5s
  let lastFocusSyncTime = Date.now();
  const handleFocusOrVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      const now = Date.now();
      if (now - lastFocusSyncTime >= 5000) {
        lastFocusSyncTime = now;
        useActiveFarmStore.getState().notifyDataChanged('all', { broadcast: false });
      }
    }
  };

  document.addEventListener('visibilitychange', handleFocusOrVisibilityChange);
  window.addEventListener('focus', handleFocusOrVisibilityChange);
}

export default useActiveFarmStore;
