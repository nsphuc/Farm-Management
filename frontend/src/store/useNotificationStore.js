import { create } from 'zustand';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { useActiveFarmStore } from './useActiveFarmStore';

/**
 * Global Notifications Store (GAP-SYNC-03)
 * Kết nối bảng notifications (#71) với cơ chế Smart Polling & Cascade Auto-Sync
 */
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  lastTopNotificationId: null,
  prevUnreadCount: 0,
  hasInitialized: false,
  isLoading: false,
  isOpen: false,

  setOpen: (isOpen) => set({ isOpen }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  fetchNotifications: async (arg1 = null, arg2 = null, arg3 = false) => {
    let isRead = null;
    let type = null;
    let silent = false;

    if (typeof arg1 === 'boolean' && arg2 === null && !arg3) {
      silent = arg1;
    } else {
      isRead = arg1;
      type = arg2;
      silent = Boolean(arg3);
    }

    if (!silent) {
      set({ isLoading: true });
    }

    try {
      const params = { page: 0, size: 20 };
      if (isRead !== null) params.isRead = isRead;
      if (type) params.type = type;

      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, {
        params,
      });

      const list = response.data?.content || [];
      const unread = list.filter((item) => !item.isRead).length;
      const topId = list.length > 0 ? list[0].id : null;
      const state = get();

      // GAP-SYNC-03: Nếu đã khởi tạo và phát hiện có thông báo mới vừa đến, tự động cascade notifyDataChanged('all')
      if (state.hasInitialized) {
        const hasNewNotification =
          (topId && state.lastTopNotificationId && topId !== state.lastTopNotificationId) ||
          unread > state.prevUnreadCount;

        if (hasNewNotification) {
          useActiveFarmStore.getState().notifyDataChanged('all', { broadcast: false });
        }
      }

      set({
        notifications: list,
        unreadCount: unread,
        lastTopNotificationId: topId,
        prevUnreadCount: unread,
        hasInitialized: true,
        isLoading: false,
      });
    } catch {
      // In case of error (e.g. offline), retain current state without breaking
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await apiClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        );
        const unread = updated.filter((item) => !item.isRead).length;
        return {
          notifications: updated,
          unreadCount: unread,
          prevUnreadCount: unread,
        };
      });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
        prevUnreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  },
}));
