import { create } from 'zustand';

/**
 * Zustand Store quản lý thông báo Toast toàn ứng dụng.
 * Hỗ trợ các loại thông báo: success, error, warning, info.
 */
export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: ({ type = 'success', message, title, duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, message, title, duration };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAll: () => set({ toasts: [] }),
}));

// Helper tiện ích để gọi nhanh từ mọi nơi
export const toast = {
  success: (message, title = 'Thành công') =>
    useToastStore.getState().addToast({ type: 'success', message, title }),
  error: (message, title = 'Có lỗi xảy ra') =>
    useToastStore.getState().addToast({ type: 'error', message, title }),
  warning: (message, title = 'Cảnh báo') =>
    useToastStore.getState().addToast({ type: 'warning', message, title }),
  info: (message, title = 'Thông báo') =>
    useToastStore.getState().addToast({ type: 'info', message, title }),
};

export default useToastStore;
