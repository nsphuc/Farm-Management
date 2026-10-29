import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSearch,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  Layers,
  Activity,
  Code,
  Copy,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { platformService } from '@/services/modules/platformService';
import { toast } from '@/store/useToastStore';

const MODULE_OPTIONS = [
  { value: '', label: '-- Tất cả phân hệ --' },
  { value: 'PLATFORM', label: 'PLATFORM (Nền tảng)' },
  { value: 'USERS', label: 'USERS (Người dùng)' },
  { value: 'AUTH', label: 'AUTH (Xác thực & Bảo mật)' },
  { value: 'FINANCE', label: 'FINANCE (Tài chính & Thu chi)' },
  { value: 'INVENTORY', label: 'INVENTORY (Kho & Vật tư)' },
  { value: 'HR', label: 'HR (Nhân sự & Điểm danh)' },
];

/**
 * PlatformAuditLogsConsole - Sổ cái Nhật ký Kiểm toán Toàn cầu (GAP-SA-06)
 * Giám sát mọi hoạt động nhạy cảm, bảo mật và thay đổi trạng thái trên toàn hệ thống
 */
export function PlatformAuditLogsConsole() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [keyword, setKeyword] = useState('');

  // JSON Diff modal state
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        size: 50,
      };
      if (moduleFilter) params.module = moduleFilter;
      if (actionFilter) params.action = actionFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await platformService.getAuditLogs(params);
      const logList = Array.isArray(res?.content)
        ? res.content
        : Array.isArray(res)
        ? res
        : [];
      setLogs(logList);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      toast.error('Không thể tải nhật ký kiểm toán toàn cầu');
    } finally {
      setIsLoading(false);
    }
  }, [moduleFilter, actionFilter, fromDate, toDate, keyword]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Format JSON beautify helper
  const formatJson = (val) => {
    if (!val) return 'null';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(val);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Keyword search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo hành động, người thực hiện..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9.5 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-400" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-rose-500 focus:bg-white focus:outline-none"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-rose-500 focus:outline-none"
              title="Từ ngày"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-rose-500 focus:outline-none"
              title="Đến ngày"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={fetchLogs}
          title="Làm mới sổ cái kiểm toán"
        >
          Làm Mới
        </Button>
      </div>

      {/* AUDIT LOGS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Thời Gian</th>
                <th className="px-5 py-3.5">Khách Thuê</th>
                <th className="px-5 py-3.5">Người Thực Hiện</th>
                <th className="px-5 py-3.5">Phân Hệ</th>
                <th className="px-5 py-3.5">Hành Động</th>
                <th className="px-5 py-3.5">Endpoint / Phương Thức</th>
                <th className="px-5 py-3.5 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSearch className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    Không có bản ghi nhật ký kiểm toán nào phù hợp.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isPost = log.method === 'POST';
                  const isPut = log.method === 'PUT';
                  const isDelete = log.method === 'DELETE';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors font-mono">
                      <td className="px-5 py-4 font-sans text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDate(log.createdAt || log.timestamp)}
                      </td>

                      <td className="px-5 py-4">
                        {log.tenantId ? (
                          <span className="font-bold text-slate-800">Tenant #{log.tenantId}</span>
                        ) : (
                          <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                            GLOBAL PLATFORM
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-sans">
                        <div className="font-bold text-slate-900">{log.username || `User #${log.userId}`}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.ipAddress || '127.0.0.1'}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {log.module}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            log.action?.includes('CREATE')
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : log.action?.includes('UPDATE') || log.action?.includes('RESET')
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : log.action?.includes('DELETE') || log.action?.includes('SUSPEND')
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase ${
                              isPost
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPut
                                ? 'bg-amber-100 text-amber-800'
                                : isDelete
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {log.method || 'GET'}
                          </span>
                          <span className="text-slate-600 truncate max-w-[200px]">
                            {log.endpoint || '—'}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right font-sans">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          icon={<Eye className="h-3.5 w-3.5 text-slate-600" />}
                          onClick={() => setSelectedLog(log)}
                          title="Xem dữ liệu thay đổi JSON Diff"
                        >
                          Diff
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON DIFF & DETAILS MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="absolute right-4 top-4 rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Code className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Chi Tiết Kiểm Toán #{selectedLog.id}
                </h3>
                <p className="text-xs text-slate-500">
                  Hành động: <strong>{selectedLog.action}</strong> • Phân hệ: {selectedLog.module}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Metadata strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px]">Thời gian:</span>
                  <div className="font-semibold text-slate-800">{formatDate(selectedLog.createdAt)}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Người thực hiện:</span>
                  <div className="font-semibold text-slate-800">{selectedLog.username || `#${selectedLog.userId}`}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Tenant:</span>
                  <div className="font-semibold text-slate-800">{selectedLog.tenantId || 'GLOBAL'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">IP Address:</span>
                  <div className="font-mono text-slate-800">{selectedLog.ipAddress || '127.0.0.1'}</div>
                </div>
              </div>

              {/* Old value vs New value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-rose-600 mb-1">
                    Dữ Liệu Cũ (Old Value)
                  </span>
                  <pre className="rounded-xl border border-rose-200 bg-rose-50/40 p-3 font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {formatJson(selectedLog.oldValue)}
                  </pre>
                </div>
                <div>
                  <span className="block text-xs font-bold text-emerald-600 mb-1">
                    Dữ Liệu Mới (New Value)
                  </span>
                  <pre className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {formatJson(selectedLog.newValue)}
                  </pre>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-1">
                    Thông Tin Bổ Sung (Details)
                  </span>
                  <pre className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                    {formatJson(selectedLog.details)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Copy className="h-3.5 w-3.5" />}
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                  toast.success('Đã sao chép toàn bộ bản ghi JSON!');
                }}
              >
                Sao Chép JSON
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setSelectedLog(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlatformAuditLogsConsole;

