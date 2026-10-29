import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useActiveFarmStore, DEFAULT_SYNC_TRIGGER } from '@/store/useActiveFarmStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { apiClient } from '@/services/api/apiClient';

describe('System Auto-Sync & Zero-F5 Reactivity Test Suite (GAP-SYNC-01 -> GAP-SYNC-08)', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { success: true, data: [] } });

    // Reset syncTrigger to DEFAULT_SYNC_TRIGGER
    useActiveFarmStore.setState({
      syncTrigger: { ...DEFAULT_SYNC_TRIGGER },
      dataVersion: 1,
      activeFarmId: 1,
    });

    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      lastTopNotificationId: null,
      prevUnreadCount: 0,
      hasInitialized: false,
      isLoading: false,
      isOpen: false,
    });

    vi.clearAllMocks();
  });

  it('1. GAP-SYNC-01: Khởi tạo đầy đủ 15 kênh thực thể trong syncTrigger và syncTrigger.all luôn tồn tại', () => {
    const { syncTrigger } = useActiveFarmStore.getState();

    expect(syncTrigger).toBeDefined();
    expect(syncTrigger.all).toBe(0);
    expect(syncTrigger.farms).toBe(0);
    expect(syncTrigger.zones).toBe(0);
    expect(syncTrigger.locations).toBe(0);
    expect(syncTrigger.employees).toBe(0);
    expect(syncTrigger.attendance).toBe(0);
    expect(syncTrigger.tasks).toBe(0);
    expect(syncTrigger.partners).toBe(0);
    expect(syncTrigger.inventory).toBe(0);
    expect(syncTrigger.batches).toBe(0);
    expect(syncTrigger.seasons).toBe(0);
    expect(syncTrigger.groups).toBe(0);
    expect(syncTrigger.farming).toBe(0);
    expect(syncTrigger.expenses).toBe(0);
    expect(syncTrigger.finance).toBe(0);
  });

  it('2. GAP-SYNC-01: Khắc phục Nghịch lý Lan truyền - syncTrigger.all luôn tăng kèm khi gọi bất kỳ kênh đơn lẻ nào', async () => {
    const store = useActiveFarmStore.getState();

    // Gọi notifyDataChanged cho kênh 'inventory'
    await store.notifyDataChanged('inventory', { broadcast: false });

    const state1 = useActiveFarmStore.getState();
    expect(state1.syncTrigger.inventory).toBe(1);
    expect(state1.syncTrigger.batches).toBe(1); // Cascade
    expect(state1.syncTrigger.expenses).toBe(1); // Cascade
    expect(state1.syncTrigger.finance).toBe(1); // Cascade
    expect(state1.syncTrigger.all).toBe(1); // GAP-SYNC-01: all luôn tăng!
    expect(state1.dataVersion).toBe(2);

    // Kênh không liên quan (như employees, tasks) không bị tăng oan
    expect(state1.syncTrigger.employees).toBe(0);
    expect(state1.syncTrigger.tasks).toBe(0);
  });

  it('3. GAP-SYNC-01: Cascade liên đới theo nghiệp vụ cho Nhân sự (attendance / tasks / employees)', async () => {
    const store = useActiveFarmStore.getState();

    await store.notifyDataChanged('tasks', { broadcast: false });

    const state = useActiveFarmStore.getState();
    expect(state.syncTrigger.tasks).toBe(1);
    expect(state.syncTrigger.attendance).toBe(1);
    expect(state.syncTrigger.employees).toBe(1);
    expect(state.syncTrigger.all).toBe(1);
  });

  it('4. GAP-SYNC-01: Cascade liên đới theo nghiệp vụ cho Chi phí & Tài chính (expenses / finance / partners)', async () => {
    const store = useActiveFarmStore.getState();

    await store.notifyDataChanged('expenses', { broadcast: false });

    const state = useActiveFarmStore.getState();
    expect(state.syncTrigger.expenses).toBe(1);
    expect(state.syncTrigger.finance).toBe(1);
    expect(state.syncTrigger.partners).toBe(1);
    expect(state.syncTrigger.all).toBe(1);
  });

  it('5. GAP-SYNC-01: Khi gọi notifyDataChanged("all"), toàn bộ 15 kênh đều tăng giá trị đồng loạt', async () => {
    const store = useActiveFarmStore.getState();

    await store.notifyDataChanged('all', { broadcast: false });

    const state = useActiveFarmStore.getState();
    Object.keys(DEFAULT_SYNC_TRIGGER).forEach((key) => {
      expect(state.syncTrigger[key]).toBe(1);
    });
    expect(state.syncTrigger.all).toBe(1);
  });

  it('6. GAP-SYNC-02: Chống lặp vô hạn (Infinite Loop Prevention) khi đồng bộ qua BroadcastChannel', async () => {
    const store = useActiveFarmStore.getState();

    // Giả lập nhận event từ tab khác với broadcast: false
    await store.notifyDataChanged('inventory', { broadcast: false });

    const state = useActiveFarmStore.getState();
    expect(state.syncTrigger.inventory).toBe(1);
    expect(state.syncTrigger.all).toBe(1);

    // Xác nhận không xảy ra Exception hoặc tràn stack call
    expect(state.dataVersion).toBe(2);
  });

  it('7. GAP-SYNC-03: useNotificationStore kích hoạt tự động notifyDataChanged("all") khi phát hiện thông báo mới', async () => {
    // Mock apiClient.get
    const initialList = [{ id: 101, title: 'Thông báo cũ', isRead: true }];
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { content: initialList },
    });

    // 1. Fetch khởi tạo lần đầu (silent = true)
    await useNotificationStore.getState().fetchNotifications(true);
    expect(useNotificationStore.getState().hasInitialized).toBe(true);
    expect(useActiveFarmStore.getState().syncTrigger.all).toBe(0);

    // 2. Giả lập đợt polling tiếp theo có thông báo mới (ID 102 chưa đọc)
    const updatedList = [
      { id: 102, title: 'Thông báo duyệt chi phí mới', isRead: false },
      { id: 101, title: 'Thông báo cũ', isRead: true },
    ];
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { content: updatedList },
    });

    await useNotificationStore.getState().fetchNotifications(true);

    // 3. Kiểm chứng: unreadCount = 1 và useActiveFarmStore.syncTrigger.all đã tự động tăng lên 1!
    expect(useNotificationStore.getState().unreadCount).toBe(1);
    expect(useActiveFarmStore.getState().syncTrigger.all).toBe(1);
  });
});
