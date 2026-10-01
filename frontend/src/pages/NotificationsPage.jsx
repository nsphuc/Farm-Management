import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { toast } from 'sonner';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getNotifications(0, 50);
      if (res.success && res.data) {
        setNotifications(res.data.items || res.data.content || []);
      }
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      toast.success('Đã đánh dấu đọc thông báo.');
    } catch {
      toast.error('Không thể thực hiện.');
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu đọc tất cả thông báo.');
    } catch {
      toast.error('Không thể thực hiện.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-600" />
            <span>Trung tâm Thông báo Thời gian thực</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Xem lịch sử thông báo, cảnh báo vận hành và nhật ký gửi từ Backend (BE-1.5 WebSocket/SSE).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors min-h-[44px]"
          >
            <CheckCheck className="w-4 h-4" />
            Đọc tất cả
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Chưa có thông báo nào được ghi nhận.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                item.isRead
                  ? 'bg-transparent'
                  : 'bg-emerald-50/40 dark:bg-emerald-950/20'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {item.message}
                </p>
              </div>

              {!item.isRead && (
                <button
                  onClick={() => handleMarkAsRead(item.id)}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex-shrink-0 min-h-[36px] px-2.5 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/40"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
