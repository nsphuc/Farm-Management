import { create } from 'zustand';
import { branchService } from '@/services/modules/branchService';
import { useActiveFarmStore } from './useActiveFarmStore';
import { useAuthStore } from './useAuthStore';

/**
 * Khởi tạo ID chi nhánh mặc định từ URL Search Params hoặc LocalStorage
 */
export const getInitialBranchId = () => {
  if (typeof window === 'undefined') return 1;
  try {
    const urlParam = new URLSearchParams(window.location.search).get('branchId');
    if (urlParam) {
      return urlParam === 'ALL' ? 'ALL' : (isNaN(Number(urlParam)) ? urlParam : Number(urlParam));
    }
    const saved = localStorage.getItem('farmgo_active_branch_id');
    if (saved) {
      return saved === 'ALL' ? 'ALL' : (isNaN(Number(saved)) ? saved : Number(saved));
    }
  } catch {
    // safe ignore
  }
  return 1;
};

const initialBranchId = getInitialBranchId();

/**
 * useActiveBranchStore - Quản lý Chi Nhánh Tác Nghiệp & Cơ Chế Làm Mới Dữ Liệu Toàn Cục (GAP-SYNC-01)
 * Lưu trữ currentBranchId, danh sách branches từ Database và cung cấp triggerRefresh()
 */
export const useActiveBranchStore = create((set, get) => ({
  currentBranchId: initialBranchId,
  activeBranchId: initialBranchId,
  currentBranch: null,
  activeBranch: null,
  branches: [],
  isLoadingBranches: false,
  dataVersion: 1,

  /**
   * Chọn chi nhánh hoạt động hiện tại và đồng bộ sang useActiveFarmStore & localStorage
   * @param {string|number} branchId - ID chi nhánh hoặc 'ALL'
   */
  setCurrentBranchId: (branchId) => {
    const authState = useAuthStore.getState();
    const canSwitch = authState.isOwner?.() || authState.isSuperAdmin?.();
    const assignedId = !canSwitch ? authState.userInfo?.assignedBranchId : null;
    const effectiveInput = assignedId || branchId;
    const cleanId = (effectiveInput === 'ALL' || !effectiveInput) ? 'ALL' : Number(effectiveInput);
    const { branches } = get();
    const isAll = cleanId === 'ALL';
    let selectedBranch = null;

    if (isAll) {
      selectedBranch = {
        id: 'ALL',
        name: 'Cơ sở chính (Tổng hợp toàn hệ thống)',
        livestockType: 'MIXED',
        isDefault: true,
      };
    } else {
      selectedBranch = branches.find((b) => Number(b.id) === Number(cleanId)) || null;
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('farmgo_active_branch_id', String(cleanId));
      } catch (e) {
        // safe ignore
      }
    }

    set({
      currentBranchId: cleanId,
      activeBranchId: cleanId,
      currentBranch: selectedBranch,
      activeBranch: selectedBranch,
    });

    // Đồng bộ sang useActiveFarmStore
    const farmStore = useActiveFarmStore.getState();
    if (farmStore.activeBranchId !== cleanId) {
      useActiveFarmStore.setState({
        activeBranchId: cleanId,
        currentBranchId: cleanId,
        activeBranch: selectedBranch,
        currentBranch: selectedBranch,
        activeLivestockType: selectedBranch?.livestockType || 'LIVESTOCK_MEAT',
      });
    }

    // Tự động kích hoạt cơ chế làm mới toàn cục để các trang đang mở tự động tải lại dữ liệu theo chi nhánh mới
    get().triggerRefresh();
  },

  setActiveBranchId: (branchId) => {
    get().setCurrentBranchId(branchId);
  },

  /**
   * Thiết lập danh sách chi nhánh và tự động chọn chi nhánh mặc định
   */
  setBranches: (branches) => {
    const branchList = Array.isArray(branches) ? branches : [];
    const currentId = get().currentBranchId;
    let selected = null;
    if (currentId && currentId !== 'ALL') {
      selected = branchList.find((b) => Number(b.id) === Number(currentId)) || null;
    }
    if (!selected && branchList.length > 0) {
      selected = branchList.find((b) => b.isDefault) || branchList[0];
    }

    const cleanId = selected ? selected.id : (currentId || 1);
    if (typeof window !== 'undefined' && cleanId) {
      try {
        localStorage.setItem('farmgo_active_branch_id', String(cleanId));
      } catch (e) {
        // safe ignore
      }
    }

    set({
      branches: branchList,
      currentBranch: selected,
      activeBranch: selected,
      currentBranchId: cleanId,
      activeBranchId: cleanId,
    });

    useActiveFarmStore.setState({
      branches: branchList,
      activeBranch: selected,
      currentBranch: selected,
      activeBranchId: cleanId,
      currentBranchId: cleanId,
      activeLivestockType: selected?.livestockType || 'LIVESTOCK_MEAT',
    });
  },

  /**
   * Tải danh sách chi nhánh thật từ Database qua branchService
   * @param {number} farmId - ID trang trại
   */
  fetchBranches: async (farmId) => {
    if (!farmId || farmId === 'ALL') {
      set({ branches: [], currentBranch: null, currentBranchId: null, activeBranchId: null });
      useActiveFarmStore.setState({ branches: [], activeBranchId: null, currentBranchId: null, activeBranch: null, currentBranch: null });
      return [];
    }

    try {
      set({ isLoadingBranches: true });
      const data = await branchService.getBranches(farmId);
      const branchList = Array.isArray(data) ? data : (data?.content || []);

      const authState = useAuthStore.getState();
      const canSwitch = authState.isOwner?.() || authState.isSuperAdmin?.();
      const assignedId = !canSwitch ? (authState.userInfo?.assignedBranchId || branchList[0]?.id) : null;

      const savedBranchId = assignedId
        ? String(assignedId)
        : (typeof window !== 'undefined'
            ? (new URLSearchParams(window.location.search).get('branchId') || localStorage.getItem('farmgo_active_branch_id'))
            : null);

      let chosen = null;
      if (savedBranchId === 'ALL') {
        chosen = {
          id: 'ALL',
          name: 'Cơ sở chính (Tổng hợp toàn hệ thống)',
          livestockType: 'MIXED',
          isDefault: true,
        };
      } else if (savedBranchId) {
        chosen = branchList.find((b) => Number(b.id) === Number(savedBranchId));
      }

      if (!chosen && get().currentBranchId && get().currentBranchId !== 'ALL') {
        chosen = branchList.find((b) => Number(b.id) === Number(get().currentBranchId));
      }

      if (!chosen && branchList.length > 0) {
        chosen = branchList.find((b) => b.isDefault) || branchList[0];
      }

      const cleanId = chosen ? chosen.id : 1;
      if (typeof window !== 'undefined' && cleanId) {
        try {
          localStorage.setItem('farmgo_active_branch_id', String(cleanId));
        } catch {
          // safe ignore
        }
      }

      set({
        branches: branchList,
        currentBranch: chosen,
        activeBranch: chosen,
        currentBranchId: cleanId,
        activeBranchId: cleanId,
        isLoadingBranches: false,
      });

      // Đồng bộ sang useActiveFarmStore
      useActiveFarmStore.setState({
        branches: branchList,
        activeBranch: chosen,
        currentBranch: chosen,
        activeBranchId: cleanId,
        currentBranchId: cleanId,
        activeLivestockType: chosen?.livestockType || 'LIVESTOCK_MEAT',
      });

      return branchList;
    } catch (err) {
      console.warn('Lỗi khi tải danh sách chi nhánh:', err);
      set({ isLoadingBranches: false });
      return [];
    }
  },

  /**
   * Cơ chế làm mới dữ liệu toàn cục (GAP-SYNC-01)
   * Tự động tăng dataVersion và kích hoạt bus đồng bộ để các trang liên kết
   * tự động tải lại số liệu mới nhất mà không cần F5.
   */
  triggerRefresh: () => {
    set((state) => ({ dataVersion: state.dataVersion + 1 }));

    // Tăng dataVersion trên useActiveFarmStore & kích hoạt notifyDataChanged
    const farmStore = useActiveFarmStore.getState();
    if (farmStore.bumpDataVersion) {
      farmStore.bumpDataVersion();
    }
    if (farmStore.notifyDataChanged) {
      farmStore.notifyDataChanged('all');
    }

    // Phát sự kiện toàn cục cho window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farmgo_data_refreshed', {
        detail: { dataVersion: get().dataVersion, timestamp: Date.now() },
      }));
    }
  },
}));

// Expose store globally on window for cross-store hydration without circular dependencies
if (typeof window !== 'undefined') {
  window.__useActiveBranchStore = useActiveBranchStore;
}
