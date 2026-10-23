import React from 'react';
import {
  ClipboardCheck,
  Warehouse,
  Calendar,
  Package,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { Can } from '@/components/common/Can';
import { inventoryService } from '@/services/modules/inventoryService';
import { formatDate, formatNumber } from '@/utils/formatters';

export function StocktakeDetailDrawer({ isOpen, onClose, stocktake, farmId, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!stocktake) return null;

  const targetFarmId = farmId || stocktake.farmId;

  const handleAdjust = async () => {
    if (!window.confirm(`Xác nhận phê duyệt đợt kiểm kê ${stocktake.stocktakeCode}? Hệ thống sẽ tự động cân chỉnh tồn kho (ADJUST_IN / ADJUST_OUT) và cập nhật số dư cuối cùng.`)) return;
    try {
      setIsSubmitting(true);
      await inventoryService.adjustStocktake(targetFarmId, stocktake.id);
      alert('Đã phê duyệt và cân chỉnh tồn kho thành công!');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Lỗi khi duyệt kiểm kê:', err);
      alert('Không thể duyệt kiểm kê: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemColumns = [
    {
      key: 'materialName',
      header: 'Vật Tư Kiểm Kê',
      width: '180px',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs truncate">{row.materialName}</span>
          <span className="font-mono text-[10px] text-slate-400 block">{row.skuCode || 'SKU —'}</span>
        </div>
      ),
    },
    {
      key: 'batchNumber',
      header: 'Lô Hàng',
      width: '120px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
          {row.batchNumber || '—'}
        </span>
      ),
    },
    {
      key: 'bookQuantity',
      header: 'Sổ Sách',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {formatNumber(row.bookQuantity)} {row.standardUnit}
        </span>
      ),
    },
    {
      key: 'actualQuantity',
      header: 'Thực Đếm',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatNumber(row.actualQuantity)} {row.standardUnit}
        </span>
      ),
    },
    {
      key: 'differenceQuantity',
      header: 'Chênh Lệch',
      align: 'right',
      width: '120px',
      render: (row) => {
        const diff = Number(row.differenceQuantity) || 0;
        if (diff === 0) {
          return (
            <span className="font-mono text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>0 (Khớp)</span>
            </span>
          );
        }
        if (diff < 0) {
          return (
            <span className="font-mono font-bold text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {formatNumber(diff)} {row.standardUnit}
            </span>
          );
        }
        return (
          <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            +{formatNumber(diff)} {row.standardUnit}
          </span>
        );
      },
    },
    {
      key: 'reason',
      header: 'Giải Trình / Lý Do',
      width: '160px',
      render: (row) => (
        <span className="text-xs text-slate-600 truncate block" title={row.reason}>
          {row.reason || '—'}
        </span>
      ),
    },
  ];

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Biên Bản Kiểm Kê Kho: ${stocktake.stocktakeCode}`}
      subtitle={`Ngày kiểm: ${formatDate(stocktake.stocktakeDate)} • Kho: ${stocktake.warehouseName || `Kho #${stocktake.warehouseId}`}`}
      icon={<ClipboardCheck className="h-5 w-5 text-purple-600" />}
      width="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái đợt kiểm:</span>
            <StatusBadge status={stocktake.status} size="sm" />
            {(stocktake.status === 'IN_PROGRESS' || stocktake.status === 'DRAFT') && (
              <span className="text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-purple-200">
                Chờ Giám đốc trại phê duyệt & cân chỉnh
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(stocktake.status === 'IN_PROGRESS' || stocktake.status === 'DRAFT') && (
              <>
                <Can permission="PERM_INVENTORY_STOCKTAKE" role="ROLE_WAREHOUSE_STAFF">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('Thủ kho nhập số liệu kiểm đếm thực tế')}
                  >
                    Nhập Số Lượng Đếm
                  </Button>
                </Can>
                <Can permission="PERM_INVENTORY_STOCKTAKE" role="ROLE_FARM_MANAGER">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    loading={isSubmitting}
                    onClick={handleAdjust}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Phê Duyệt & Chốt Kiểm Kê
                  </Button>
                </Can>
              </>
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
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kho Kiểm Kê</span>
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <Warehouse className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{stocktake.warehouseName || `Kho #${stocktake.warehouseId}`}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ngày Kiểm Kê</span>
            <span className="text-xs font-semibold text-slate-800 block">
              {formatDate(stocktake.stocktakeDate)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tổng Số Mặt Hàng</span>
            <span className="font-mono font-bold text-slate-900 text-xs block">
              {stocktake.items?.length || 0} mặt hàng
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Thời Gian Duyệt</span>
            <span className="text-xs font-medium text-slate-700 block">
              {stocktake.approvedAt ? formatDate(stocktake.approvedAt) : (stocktake.status === 'IN_PROGRESS' ? 'Chờ GĐ trại phê duyệt' : 'Đang kiểm đếm')}
            </span>
          </div>
        </div>

        {stocktake.notes && (
          <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-700">
            <strong>Ghi chú kiểm kê:</strong> {stocktake.notes}
          </div>
        )}

        {/* Danh sách mặt hàng kiểm kê */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-purple-600" />
            <span>Chi Tiết Bảng Kiểm Đếm & Chênh Lệch Tồn Kho ({stocktake.items?.length || 0})</span>
          </h4>
          <DataTable
            columns={itemColumns}
            data={stocktake.items || []}
            emptyStateProps={{
              title: 'Không có dữ liệu mặt hàng trong đợt kiểm kê',
            }}
          />
        </div>
      </div>
    </SlideOverDrawer>
  );
}

export default StocktakeDetailDrawer;
