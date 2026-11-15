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
  pagination = true,
  page: externalPage,
  pageSize: externalPageSize = 10,
  totalElements: externalTotalElements,
  totalPages: externalTotalPages,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  sortField,
  sortDirection,
  onSort,
  emptyStateProps,
  keyExtractor = (item, index) => item.id || item.code || index,
  mobileCardRender,
  className,
}) {
  const pageSizeOptions = [10, 20, 50, 100];
  const isServerPagination = Boolean(onPageChange && externalTotalElements !== undefined);
  const isClientPagination = Boolean(pagination && !isServerPagination);

  const [internalPage, setInternalPage] = React.useState(0);
  const [internalPageSize, setInternalPageSize] = React.useState(externalPageSize || 10);

  const currentPage = isServerPagination ? (externalPage || 0) : internalPage;
  const currentPageSize = isServerPagination ? (externalPageSize || 10) : internalPageSize;

  const totalElements = isServerPagination
    ? (externalTotalElements || 0)
    : (data && Array.isArray(data) ? data.length : 0);

  const totalPages = isServerPagination
    ? (externalTotalPages || 1)
    : Math.max(1, Math.ceil(totalElements / currentPageSize));

  // Reset internal page if out of bounds when data changes
  React.useEffect(() => {
    if (isClientPagination && internalPage >= totalPages && totalPages > 0) {
      setInternalPage(Math.max(0, totalPages - 1));
    }
  }, [isClientPagination, internalPage, totalPages, data?.length]);

  const handlePageChange = (newPage) => {
    if (isClientPagination) {
      setInternalPage(newPage);
    }
    onPageChange?.(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    if (isClientPagination) {
      setInternalPageSize(newSize);
      setInternalPage(0);
    }
    onPageSizeChange?.(newSize);
  };

  const displayData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (isClientPagination) {
      const start = currentPage * currentPageSize;
      return data.slice(start, start + currentPageSize);
    }
    return data;
  }, [data, isClientPagination, currentPage, currentPageSize]);

  const handleSort = (field) => {
    if (!onSort) return;
    let nextDirection = 'asc';
    if (sortField === field) {
      if (sortDirection === 'asc') nextDirection = 'desc';
      else if (sortDirection === 'desc') nextDirection = null;
    }
    onSort(field, nextDirection);
  };

  const startItem = totalElements === 0 ? 0 : currentPage * currentPageSize + 1;
  const endItem = Math.min((currentPage + 1) * currentPageSize, totalElements);

  return (
    <div className={cn('flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden', className)}>
      {/* Sleek Loading Indicator Bar */}
      <div className="h-0.5 w-full bg-slate-100 overflow-hidden relative">
        {isLoading && (
          <div className="h-full bg-emerald-500 animate-pulse w-full transition-all duration-300" />
        )}
      </div>

      {/* 1. Mobile Card View (< md) - Responsive Touch-friendly (Nhiệm vụ 7) */}
      <div className="block md:hidden divide-y divide-slate-100 bg-white">
        {isLoading && (!data || data.length === 0) ? (
          Array.from({ length: 3 }).map((_, rIdx) => (
            <div key={`m-sk-${rIdx}`} className="p-4 space-y-2 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))
        ) : displayData && displayData.length > 0 ? (
          displayData.map((row, index) => {
            if (mobileCardRender) {
              return (
                <div key={keyExtractor(row, index)} onClick={() => onRowClick?.(row, index)} className="p-3.5 hover:bg-slate-50 transition-colors">
                  {mobileCardRender(row, index)}
                </div>
              );
            }
            const actionCol = columns.find((c) => c.key === 'actions');
            const dataCols = columns.filter((c) => c.key !== 'actions');
            return (
              <div
                key={keyExtractor(row, index)}
                onClick={() => onRowClick?.(row, index)}
                className="p-3.5 hover:bg-slate-50 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-900 text-sm">
                    {dataCols[0]?.render ? dataCols[0].render(row, index) : row[dataCols[0]?.key]}
                  </div>
                  {dataCols[1] && (
                    <div className="text-xs shrink-0">
                      {dataCols[1]?.render ? dataCols[1].render(row, index) : row[dataCols[1]?.key]}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  {dataCols.slice(2, 6).map((col) => (
                    <div key={col.key} className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {col.header || col.title}
                      </span>
                      <span className="font-medium text-slate-800 truncate">
                        {col.render ? col.render(row, index) : row[col.key] ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
                {actionCol && (
                  <div className="pt-1 flex items-center justify-end gap-1.5">
                    {actionCol.render(row, index)}
                  </div>
                )}
              </div>
            );
          })
        ) : null}
      </div>

      {/* 2. Desktop & Tablet Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto min-h-[220px]">
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
              Array.from({ length: Math.min(currentPageSize, 6) }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse h-14">
                  {columns.map((col, cIdx) => (
                    <td key={`sk-cell-${cIdx}`} className="px-4 py-3.5">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayData && displayData.length > 0 ? (
              displayData.map((row, index) => (
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
      {Boolean(pagination && totalElements > 0) && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={currentPageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
              disabled={currentPage <= 0}
              onClick={() => handlePageChange(0)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Trang đầu"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage <= 0}
              onClick={() => handlePageChange(currentPage - 1)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2 font-medium">
              Trang <strong className="text-slate-900">{currentPage + 1}</strong> / {totalPages || 1}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => handlePageChange(currentPage + 1)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => handlePageChange(totalPages - 1)}
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
