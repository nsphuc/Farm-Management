import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';

describe('useActiveBranchStore (1-Branch Lock for Staff)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
  });

  it('locks non-owner staff to assignedBranchId even if ALL or branch 2 is requested', () => {
    useAuthStore.getState().setAuth('tok', {
      id: 3,
      roles: [{ code: 'ROLE_FARM_MANAGER' }],
      assignedBranchId: 1,
      branches: [{ id: 1, name: 'Chi nhánh 1' }],
    });

    const store = useActiveBranchStore.getState();
    store.setBranches([{ id: 1, name: 'Chi nhánh 1' }]);

    store.setCurrentBranchId('ALL');
    expect(useActiveBranchStore.getState().currentBranchId).toBe(1);

    store.setCurrentBranchId(2);
    expect(useActiveBranchStore.getState().currentBranchId).toBe(1);
  });

  it('allows Owner to switch freely between ALL, branch 1, and branch 2', () => {
    useAuthStore.getState().setAuth('tok', {
      id: 2,
      roles: [{ code: 'ROLE_FARM_OWNER' }],
      assignedBranchId: null,
      branches: [
        { id: 1, name: 'Chi nhánh 1' },
        { id: 2, name: 'Chi nhánh 2' },
      ],
    });

    const store = useActiveBranchStore.getState();
    store.setBranches([
      { id: 1, name: 'Chi nhánh 1' },
      { id: 2, name: 'Chi nhánh 2' },
    ]);

    store.setCurrentBranchId('ALL');
    expect(useActiveBranchStore.getState().currentBranchId).toBe('ALL');

    store.setCurrentBranchId(2);
    expect(useActiveBranchStore.getState().currentBranchId).toBe(2);
  });
});
