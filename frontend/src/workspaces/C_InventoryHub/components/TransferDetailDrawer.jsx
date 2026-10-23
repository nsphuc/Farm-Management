import React from 'react';
import {
  ArrowLeftRight,
  Warehouse,
  Calendar,
  Package,
  Layers,
  Clock,
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

export function TransferDetailDrawer({ isOpen, onClose, transfer }) {
  if (!transfer) return null;

  const itemColumns = [
    {
      key: 'materialName',
      header: 'Vật Tư / Hàng Hóa',
      width: '180px',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs truncate">{row.materialName}</span>
          <span className="font-mono text-[10px] text-slate-400 block">{row.skuCode || 'SKU —'}</span>
        </div>
      ),
    },
    {
      key: 'fromBatchNumber',
      header: 'Số Lô & Hạn Dùng',
      width: '150px',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
            {row.fromBatchNumber || row.toBatchNumber || 'Lô tiêu chuẩn'}
          </span>
          {row.expiryDate && (
            <span className="text-[10px] text-slate-500 block mt-0.5">
              HSD: {formatDate(row.expiryDate)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Số Lượng Chuyển',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span className="font-mono font-bold text-blue-800 text-xs">
          {formatNumber(row.quantity)} {row.standardUnit}
        </span>
      ),
    },
    {
      key: 'unitPrice',
      header: 'Đơn Giá Hạch Toán',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Thành Tiền',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
  ];

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Lệnh Điều Chuyển Kho: ${transfer.transferCode}`}
      subtitle={`Ngày chuyển: ${formatDate(transfer.transferDate)} • ${transfer.fromWarehouseName || 'Kho nguồn'} ➔ ${transfer.toWarehouseName || 'Kho đích'}`}
      icon={<ArrowLeftRight className="h-5 w-5 text-blue-600" />}
      width="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái lệnh:</span>
            <StatusBadge status={transfer.status} size="sm" />
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng Khay
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header Tóm Tắt */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kho Xuất Chuyển</span>
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <Warehouse className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{transfer.fromWarehouseName || `Kho #${transfer.fromWarehouseId}`}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kho Tiếp Nhận</span>
            <span className="font-bold text-emerald-800 text-xs flex items-center gap-1">
              <Warehouse className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{transfer.toWarehouseName || `Kho #${transfer.toWarehouseId}`}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Thời Gian Xuất</span>
            <span className="text-xs font-medium text-slate-700 block">
              {transfer.dispatchedAt ? formatDate(transfer.dispatchedAt) : 'Chưa xuất kho'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Thời Gian Nhận</span>
            <span className="text-xs font-medium text-slate-700 block">
              {transfer.receivedAt ? formatDate(transfer.receivedAt) : 'Đang luân chuyển'}
            </span>
          </div>
        </div>

        {transfer.notes && (
          <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-700">
            <strong>Ghi chú điều chuyển:</strong> {transfer.notes}
          </div>
        )}

        {/* Danh sách mặt hàng chuyển */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-blue-600" />
            <span>Danh Sách Vật Tư Điều Chuyển ({transfer.items?.length || 0})</span>
          </h4>
          <DataTable
            columns={itemColumns}
            data={transfer.items || []}
            emptyStateProps={{
              title: 'Không có mặt hàng nào trong phiếu chuyển',
            }}
          />
        </div>
      </div>
    </SlideOverDrawer>
  );
}

export default TransferDetailDrawer;
