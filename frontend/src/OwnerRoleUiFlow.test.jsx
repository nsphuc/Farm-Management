import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryHubWorkspace } from '@/workspaces/C_InventoryHub';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { inventoryService } from '@/services/modules/inventoryService';

// Mock inventoryService API calls so the component renders without real HTTP requests
vi.mock('@services/modules/inventoryService', () => ({
  inventoryService: {
    getWarehouses: vi.fn().mockResolvedValue([]),
    getStockOverview: vi.fn().mockResolvedValue([]),
    getReceipts: vi.fn().mockResolvedValue([]),
    getIssues: vi.fn().mockResolvedValue([]),
    getTransfers: vi.fn().mockResolvedValue([]),
    getStocktakes: vi.fn().mockResolvedValue([]),
    getExpiryAlerts: vi.fn().mockResolvedValue([]),
  },
}));

describe('Owner Role UI Flow & Security Isolation Tests (OwnerRoleUiFlow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useActiveFarmStore.setState({
      activeFarmId: 'ALL',
      accessibleFarms: [
        { id: 1, name: 'Trang Trại Bắc Ninh', code: 'FRM-BN-001' },
        { id: 2, name: 'Trang Trại Đà Lạt', code: 'FRM-DL-001' },
      ],
    });
  });

  // =========================================================================
  // Luồng WS-C: Chặn thao tác vượt quyền của Chủ đầu tư (Assert 4.1)
  // =========================================================================
  it('Assert 4.1: Trên UI WS-C khi isOwner = true, kiểm tra DOM không render các nút tạo phiếu nhập/xuất kho của Thủ kho', async () => {
    // 1. Giả lập đăng nhập tài khoản Owner (ROLE_FARM_OWNER ở cấp TENANT)
    useAuthStore.setState({
      accessToken: 'mock-owner-token',
      isAuthenticated: true,
      isInitialized: true,
      userInfo: {
        id: 101,
        username: 'owner@greenfarm.vn',
        fullName: 'Chủ Đầu Tư Xanh',
        scopeLevel: 'TENANT',
        isOwner: true,
        roles: [{ code: 'ROLE_FARM_OWNER', scopeLevel: 'TENANT' }],
        permissions: [
          'PERM_FARM_VIEW',
          'PERM_INVENTORY_VIEW',
          'PERM_INVENTORY_RECEIPT', // Mặc dù có quyền generic nhưng trên UI kho bãi Owner phải là Read-only
        ],
      },
    });

    const isOwner = useAuthStore.getState().isOwner();
    expect(isOwner).toBe(true);

    // 2. Render Workspace C (Inventory Hub)
    render(<InventoryHubWorkspace />);

    // 3. Kiểm tra Banner Giám Sát Chủ Đầu Tư xuất hiện
    expect(
      screen.getByText(/Chế độ Giám sát Chủ đầu tư/i)
    ).toBeInTheDocument();

    // 4. Assert 4.1 cốt lõi: DOM tuyệt đối KHÔNG render các nút tạo/lập phiếu kho của Thủ kho
    expect(
      screen.queryByRole('button', { name: /\+ Lập Phiếu Kho/i })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: /Tạo Phiếu Nhập/i })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: /Tạo Phiếu Xuất/i })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText('+ Lập Phiếu Kho')
    ).not.toBeInTheDocument();
  });

  // =========================================================================
  // Kiểm chứng đối trọng: Khi là Thủ kho (Role 4), nút lập phiếu kho PHẢI hiển thị
  // =========================================================================
  it('Khi là Thủ kho (Role 4 - WAREHOUSE_STAFF), nút Lập Phiếu Kho phải xuất hiện bình thường', async () => {
    useAuthStore.setState({
      accessToken: 'mock-wh-token',
      isAuthenticated: true,
      isInitialized: true,
      userInfo: {
        id: 202,
        username: 'warehouse_keeper',
        fullName: 'Nguyễn Văn Thủ Kho',
        scopeLevel: 'FARM',
        operationalRole: 'WAREHOUSE_KEEPER',
        roles: [{ code: 'ROLE_WAREHOUSE_STAFF', scopeLevel: 'FARM' }],
        permissions: ['PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_INVENTORY_ISSUE'],
      },
    });

    const isOwner = useAuthStore.getState().isOwner();
    expect(isOwner).toBe(false);

    render(<InventoryHubWorkspace />);

    // Thủ kho có nút Lập Phiếu Kho
    expect(
      screen.getByRole('button', { name: /\+ Lập Phiếu Kho/i })
    ).toBeInTheDocument();
  });

  // =========================================================================
  // Kiểm tra các quy tắc phân cấp nghiệp vụ chuẩn của Owner trong useAuthStore
  // =========================================================================
  it('Quy tắc phân cấp chuẩn của Chủ Đầu Tư trong useAuthStore', () => {
    useAuthStore.setState({
      accessToken: 'mock-owner-token',
      isAuthenticated: true,
      isInitialized: true,
      userInfo: {
        id: 101,
        username: 'owner@greenfarm.vn',
        scopeLevel: 'TENANT',
        roles: [{ code: 'ROLE_FARM_OWNER', scopeLevel: 'TENANT' }],
      },
    });

    const store = useAuthStore.getState();

    // 1. Owner là người bỏ vốn -> Tuyệt đối không cần chấm công
    expect(store.canSkipAttendance()).toBe(true);

    // 2. Owner quản lý chuỗi trại -> Không bị khóa vào 1 trại đơn lẻ
    expect(store.isFarmLocked()).toBe(false);

    // 3. Owner không trực tiếp ghi nhật ký canh tác vi mô hàng ngày
    expect(store.canLogDailyDiary()).toBe(false);

    // 4. Vai trò vận hành chuẩn
    expect(store.getOperationalRole()).toBe('OWNER');
    expect(store.getOperationalRoleInfo().roleNumber).toBe(1);
  });

  // =========================================================================
  // Kiểm tra Hotfix: geographyService chặn an toàn tham số farmId = 'ALL'
  // =========================================================================
  it('Hotfix geographyService: getZones("ALL") trả về mảng rỗng [] mà không gọi API', async () => {
    const { geographyService } = await import('@/services/modules/geographyService');
    const resultAll = await geographyService.getZones('ALL');
    expect(resultAll).toEqual([]);

    const resultEmpty = await geographyService.getZones('');
    expect(resultEmpty).toEqual([]);

    const resultNull = await geographyService.getZones(null);
    expect(resultNull).toEqual([]);

    const cyclesAll = await geographyService.getCycles('ALL');
    expect(cyclesAll).toEqual([]);
  });

  // =========================================================================
  // Kiểm tra Hotfix: useAuthStore cờ hasLoggedOut & isLoggingOut khi logout
  // =========================================================================
  it('Hotfix useAuthStore: quản lý trạng thái hasLoggedOut & isLoggingOut khi logout và login', async () => {
    const store = useAuthStore.getState();

    // 1. Đăng nhập
    store.login('valid-token', { id: 10, username: 'test_user' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().hasLoggedOut).toBe(false);
    expect(useAuthStore.getState().isLoggingOut).toBe(false);

    // 2. Gọi logout
    await store.logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().userInfo).toBeNull();
    expect(useAuthStore.getState().hasLoggedOut).toBe(true);
    expect(useAuthStore.getState().isLoggingOut).toBe(false);

    // 3. Đăng nhập lại: cờ hasLoggedOut được đặt lại về false
    store.login('new-token', { id: 10, username: 'test_user' });
    expect(useAuthStore.getState().hasLoggedOut).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
