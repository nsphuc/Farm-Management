import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, ExternalLink, Info, AlertTriangle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '@/store/useNotificationStore';
import { formatDateTime, cn } from '@/utils/formatters';

const TYPE_ICONS = {
  INFO: { icon: Info, color: 'text-blue-500 bg-blue-50' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
  ALERT: { icon: AlertCircle, color: 'text-rose-500 bg-rose-50' },
  TASK: { icon: Clock, color: 'text-purple-500 bg-purple-50' },
  QC: { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50' },
  SYSTEM: { icon: Info, color: 'text-slate-500 bg-slate-50' },
};

/**
 * NotificationBell Component (Mục 1.1.3 File 08)
 * Nút chuông thông báo kết nối bảng notifications (#71).
 * Badge đỏ hiển thị số chưa đọc, click mở danh sách, đánh dấu đã đọc và điều hướng action_url.
 */
export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, isLoading } =
    useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'UNREAD'
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    setIsOpen(false);
    if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const filteredList =
    filterTab === 'UNREAD'
      ? notifications.filter((item) => !item.isRead)
      : notifications;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        title="Thông báo hệ thống"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 px-4 bg-white text-xs">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={cn(
                'py-2 px-3 border-b-2 font-medium transition-colors',
                filterTab === 'ALL'
                  ? 'border-emerald-600 text-emerald-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('UNREAD')}
              className={cn(
                'py-2 px-3 border-b-2 font-medium transition-colors',
                filterTab === 'UNREAD'
                  ? 'border-emerald-600 text-emerald-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Đang tải thông báo...</div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Không có thông báo nào {filterTab === 'UNREAD' ? 'chưa đọc' : ''}
              </div>
            ) : (
              filteredList.map((item) => {
                const typeConfig = TYPE_ICONS[item.type] || TYPE_ICONS.INFO;
                const IconComponent = typeConfig.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={cn(
                      'flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer group',
                      item.isRead ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5',
                        typeConfig.color
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{formatDateTime(item.createdAt)}</span>
                        {item.actionUrl && (
                          <span className="flex items-center gap-0.5 text-emerald-600 font-sans group-hover:underline">
                            Xem chi tiết <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
