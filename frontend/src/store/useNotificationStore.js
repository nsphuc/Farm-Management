import { create } from 'zustand';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';

/**
 * Global Notifications Store
 * Kết nối bảng notifications (#71)
 */
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isOpen: false,

  setOpen: (isOpen) => set({ isOpen }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  fetchNotifications: async (isRead = null, type = null) => {
    set({ isLoading: true });
    try {
      const params = { page: 0, size: 20 };
      if (isRead !== null) params.isRead = isRead;
      if (type) params.type = type;

      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, {
        params,
      });

      const list = response.data?.content || [];
      const unread = list.filter((item) => !item.isRead).length;

      set({
        notifications: list,
        unreadCount: unread,
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
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  },
}));
