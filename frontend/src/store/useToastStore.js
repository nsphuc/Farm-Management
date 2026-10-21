import { create } from 'zustand';

/**
 * Toast Notification Store
 * Hỗ trợ thông báo nổi tức thì cho toàn bộ frontend
 */
export const useToastStore = create((set, get) => ({
  toasts: [],

  showToast: (message, type = 'info', duration = 4000) => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, message, type, duration };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    if (duration > 0) {
      setTimeout(() => {
        get().dismissToast(id);
      }, duration);
    }
    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  success: (msg, duration) => get().showToast(msg, 'success', duration),
  error: (msg, duration) => get().showToast(msg, 'error', duration),
  warning: (msg, duration) => get().showToast(msg, 'warning', duration),
  info: (msg, duration) => get().showToast(msg, 'info', duration),
}));

export const showToast = (message, type = 'info', duration = 4000) =>
  useToastStore.getState().showToast(message, type, duration);

export const toast = {
  success: (msg, duration) => useToastStore.getState().success(msg, duration),
  error: (msg, duration) => useToastStore.getState().error(msg, duration),
  warning: (msg, duration) => useToastStore.getState().warning(msg, duration),
  info: (msg, duration) => useToastStore.getState().info(msg, duration),
};

export default useToastStore;
