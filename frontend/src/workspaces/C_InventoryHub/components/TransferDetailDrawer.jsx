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
import { Can } from '@/components/common/Can';
import { inventoryService } from '@/services/modules/inventoryService';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import { CheckCircle2 } from 'lucide-react';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function TransferDetailDrawer({ isOpen, onClose, transfer, farmId, onSuccess }) {
  const [currentTransfer, setCurrentTransfer] = React.useState(transfer);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const syncTrigger = useActiveFarmStore((state) => state.syncTrigger);

  React.useEffect(() => {
    setCurrentTransfer(transfer);
  }, [transfer]);

  const activeTransfer = currentTransfer || transfer;
  const targetFarmId = farmId || activeTransfer?.fromFarmId || activeTransfer?.farmId;

  // GAP-SYNC-05: Lắng nghe syncTrigger để tự động làm mới lệnh điều chuyển đang mở
  React.useEffect(() => {
    if (isOpen && activeTransfer?.id && targetFarmId) {
      inventoryService
        .getTransferById(targetFarmId, activeTransfer.id)
        .then((res) => {
          if (res) setCurrentTransfer(res);
        })
        .catch(() => {});
    }
  }, [isOpen, activeTransfer?.id, targetFarmId, syncTrigger?.inventory, syncTrigger?.all]);

  if (!transfer && !currentTransfer) return null;
  const item = activeTransfer;

  const handleDispatch = async () => {
    if (!window.confirm(`Xác nhận phê duyệt lệnh xuất điều chuyển ${activeTransfer.transferCode}? Hàng sẽ được trừ khỏi kho xuất và chuyển sang trạng thái IN_TRANSIT.`)) return;
    try {
      setIsSubmitting(true);
      await inventoryService.dispatchTransfer(targetFarmId, activeTransfer.id);
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('inventory');
      toast.success('Đã phê duyệt lệnh xuất điều chuyển thành công!');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Lỗi khi duyệt xuất điều chuyển:', err);
      toast.error('Không thể duyệt xuất điều chuyển: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async () => {
    if (!window.confirm(`Xác nhận tiếp nhận hàng điều chuyển của lệnh ${activeTransfer.transferCode}? Hàng sẽ được cộng dồn vào kho đích và hoàn tất lệnh.`)) return;
    try {
      setIsSubmitting(true);
      await inventoryService.receiveTransfer(targetFarmId, activeTransfer.id);
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('inventory');
      toast.success('Đã tiếp nhận hàng điều chuyển thành công!');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Lỗi khi tiếp nhận điều chuyển:', err);
      toast.error('Không thể tiếp nhận điều chuyển: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

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
      title={`Lệnh Điều Chuyển Kho: ${activeTransfer.transferCode}`}
      subtitle={`Ngày chuyển: ${formatDate(activeTransfer.transferDate)} • ${activeTransfer.fromWarehouseName || 'Kho nguồn'} ➔ ${activeTransfer.toWarehouseName || 'Kho đích'}`}
      icon={<ArrowLeftRight className="h-5 w-5 text-blue-600" />}
      width="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái lệnh:</span>
            <StatusBadge status={activeTransfer.status} size="sm" />
            {(activeTransfer.status === 'DRAFT' || activeTransfer.status === 'PENDING') && (
              <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200">
                Chờ Giám đốc trại duyệt xuất chuyển
              </span>
            )}
            {activeTransfer.status === 'IN_TRANSIT' && (
              <span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-blue-200">
                Đang luân chuyển trên đường
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(activeTransfer.status === 'DRAFT' || activeTransfer.status === 'PENDING') && (
              <Can permission="PERM_INVENTORY_TRANSFER" role="ROLE_FARM_MANAGER">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  loading={isSubmitting}
                  onClick={handleDispatch}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Duyệt Lệnh Xuất Điều Chuyển
                </Button>
              </Can>
            )}

            {activeTransfer.status === 'IN_TRANSIT' && (
              <Can permission="PERM_INVENTORY_TRANSFER" role={['ROLE_FARM_MANAGER', 'ROLE_WAREHOUSE_STAFF']}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  loading={isSubmitting}
                  onClick={handleReceive}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Tiếp Nhận Hàng Điều Chuyển
                </Button>
              </Can>
            )}

            <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
              Đóng Khay
            </Button>
          </div>
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
              <span className="truncate">{activeTransfer.fromWarehouseName || `Kho #${activeTransfer.fromWarehouseId}`}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kho Tiếp Nhận</span>
            <span className="font-bold text-emerald-800 text-xs flex items-center gap-1">
              <Warehouse className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{activeTransfer.toWarehouseName || `Kho #${activeTransfer.toWarehouseId}`}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Thời Gian Xuất</span>
            <span className="text-xs font-medium text-slate-700 block">
              {activeTransfer.dispatchedAt ? formatDate(activeTransfer.dispatchedAt) : 'Chưa xuất kho'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Thời Gian Nhận</span>
            <span className="text-xs font-medium text-slate-700 block">
              {activeTransfer.receivedAt ? formatDate(activeTransfer.receivedAt) : 'Đang luân chuyển'}
            </span>
          </div>
        </div>

        {activeTransfer.notes && (
          <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-700">
            <strong>Ghi chú điều chuyển:</strong> {activeTransfer.notes}
          </div>
        )}

        {/* Danh sách mặt hàng chuyển */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-blue-600" />
            <span>Danh Sách Vật Tư Điều Chuyển ({activeTransfer.items?.length || 0})</span>
          </h4>
          <DataTable
            columns={itemColumns}
            data={activeTransfer.items || []}
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
