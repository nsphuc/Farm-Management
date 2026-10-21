import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { SmartEmptyState } from './SmartEmptyState';
import { cn } from '@/utils/formatters';

/**
 * DataTable Component - Bảng dữ liệu hỗ trợ phân trang Server-side,
 * loading skeleton và tự động hiển thị SmartEmptyState khi rỗng.
 */
export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  page = 0,
  pageSize = 20,
  totalElements = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  sortField,
  sortDirection,
  onSort,
  emptyStateProps,
  keyExtractor = (item, index) => item.id || item.code || index,
  className,
}) {
  const pageSizeOptions = [10, 20, 50, 100];

  const handleSort = (field) => {
    if (!onSort) return;
    let nextDirection = 'asc';
    if (sortField === field) {
      if (sortDirection === 'asc') nextDirection = 'desc';
      else if (sortDirection === 'desc') nextDirection = null;
    }
    onSort(field, nextDirection);
  };

  const startItem = totalElements === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className={cn('flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden', className)}>
      {/* Sleek Loading Indicator Bar */}
      <div className="h-0.5 w-full bg-slate-100 overflow-hidden relative">
        {isLoading && (
          <div className="h-full bg-emerald-500 animate-pulse w-full transition-all duration-300" />
        )}
      </div>

      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((col) => {
                const isSorted = sortField === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={cn(
                      'px-4 py-3.5 select-none',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.sortable && 'cursor-pointer hover:bg-slate-100 transition-colors'
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5',
                        col.align === 'right' && 'justify-end',
                        col.align === 'center' && 'justify-center'
                      )}
                    >
                      <span>{col.header || col.title}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted && sortDirection === 'asc' && <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />}
                          {isSorted && sortDirection === 'desc' && <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />}
                          {(!isSorted || !sortDirection) && <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody
            className={cn(
              'divide-y divide-slate-100 bg-white transition-opacity duration-200',
              isLoading && data && data.length > 0 && 'opacity-50 pointer-events-none'
            )}
          >
            {isLoading && (!data || data.length === 0) ? (
              // Skeleton Loading Rows (Only when there is no data at all yet!)
              Array.from({ length: Math.min(pageSize, 6) }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse h-14">
                  {columns.map((col, cIdx) => (
                    <td key={`sk-cell-${cIdx}`} className="px-4 py-3.5">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={keyExtractor(row, index)}
                  onClick={() => onRowClick?.(row, index)}
                  className={cn(
                    'transition-colors duration-150 group h-14',
                    onRowClick ? 'cursor-pointer hover:bg-emerald-50/40' : 'hover:bg-slate-50/80'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3.5 text-xs text-slate-700',
                        col.align === 'right' && 'text-right font-mono',
                        col.align === 'center' && 'text-center'
                      )}
                    >
                      {col.render ? col.render(row, index) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Khi không có dữ liệu và không loading: hiển thị SmartEmptyState */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="p-8">
          <SmartEmptyState {...emptyStateProps} />
        </div>
      )}

      {/* Pagination Footer */}
      {totalElements > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
            <span>
              | <strong className="font-semibold text-slate-900">{startItem}-{endItem}</strong> trong tổng số{' '}
              <strong className="font-semibold text-slate-900">{totalElements}</strong> bản ghi
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => onPageChange?.(0)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Trang đầu"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => onPageChange?.(page - 1)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2 font-medium">
              Trang <strong className="text-slate-900">{page + 1}</strong> / {totalPages || 1}
            </span>

            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange?.(page + 1)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange?.(totalPages - 1)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Trang cuối"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
