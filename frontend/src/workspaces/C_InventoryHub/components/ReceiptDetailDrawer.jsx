import React from 'react';
import {
  FileText,
  Warehouse,
  Building,
  Calendar,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { Can } from '@/components/common/Can';
import { inventoryService } from '@/services/modules/inventoryService';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

export function ReceiptDetailDrawer({ isOpen, onClose, receipt, farmId, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!receipt) return null;

  const targetFarmId = farmId || receipt.farmId;

  const handleComplete = async () => {
    if (!window.confirm(`Xác nhận phê duyệt và hoàn tất nhập kho cho phiếu ${receipt.receiptCode}? Số lượng tồn kho sẽ được cộng dồn và công nợ phải trả sẽ được tự động ghi nhận.`)) return;
    try {
      setIsSubmitting(true);
      await inventoryService.completeReceipt(targetFarmId, receipt.id);
      alert('Đã phê duyệt và hoàn tất nhập kho thành công!');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Lỗi khi hoàn tất nhập kho:', err);
      alert('Không thể hoàn tất nhập kho: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy phiếu nhập kho ${receipt.receiptCode}?`)) return;
    try {
      setIsSubmitting(true);
      await inventoryService.cancelReceipt(targetFarmId, receipt.id);
      alert('Đã hủy phiếu nhập kho!');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Lỗi khi hủy phiếu:', err);
      alert('Không thể hủy phiếu: ' + (err.response?.data?.message || err.message));
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
      key: 'batchNumber',
      header: 'Số Lô & Hạn Dùng',
      width: '140px',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] border border-amber-200">
            {row.batchNumber}
          </span>
          {row.expiryDate && (
            <span className="text-[10px] text-slate-400 block mt-0.5">
              HSD: {formatDate(row.expiryDate)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Số Lượng',
      align: 'right',
      width: '120px',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs">
            {formatNumber(row.enteredQuantity ?? row.quantity)} {row.enteredUnit || row.standardUnit}
          </span>
          {row.conversionFactor && row.conversionFactor !== 1 && (
            <span className="text-[10px] text-slate-400 block font-mono">
              = {formatNumber(row.quantity)} {row.standardUnit}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'unitPrice',
      header: 'Đơn Giá',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      key: 'totalPrice',
      header: 'Thành Tiền',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatCurrency(row.totalPrice)}
        </span>
      ),
    },
  ];

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Phiếu Nhập Mua: ${receipt.receiptCode}`}
      subtitle={`Ngày nhập: ${formatDate(receipt.receiptDate)} • Kho: ${receipt.warehouseName}`}
      icon={<FileText className="h-5 w-5 text-emerald-600" />}
      width="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái phiếu:</span>
            <StatusBadge status={receipt.status} size="sm" />
            {receipt.status === 'DRAFT' && (
              <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200">
                Chờ Giám đốc trại phê duyệt
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {receipt.status === 'DRAFT' && (
              <Can permission="PERM_INVENTORY_RECEIPT" role="ROLE_FARM_MANAGER">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  loading={isSubmitting}
                  onClick={handleComplete}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Phê Duyệt & Hoàn Tất Nhập Kho
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={isSubmitting}
                  onClick={handleCancel}
                >
                  Hủy Phiếu
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
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nhà Cung Cấp</span>
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{receipt.partnerName || 'Chưa gắn NCC'}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kho Nhận Hàng</span>
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <Warehouse className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{receipt.warehouseName}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tổng Giá Trị</span>
            <span className="font-mono font-black text-emerald-700 text-sm block">
              {formatCurrency(receipt.totalAmount)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Đối Soát Kế Toán</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 border border-blue-200">
              <CheckCircle2 className="h-3 w-3" />
              <span>
                {receipt.status === 'COMPLETED' ? 'Đã Vào Sổ Kho & Công Nợ' : 'Chờ GĐ Trại Duyệt'}
              </span>
            </span>
          </div>
        </div>

        {receipt.notes && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            <strong>Ghi chú đơn hàng:</strong> {receipt.notes}
          </div>
        )}

        {/* Danh sách mặt hàng */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-emerald-600" />
            <span>Chi Tiết Danh Mục Vật Tư Nhập Mua ({receipt.items?.length || 0})</span>
          </h4>
          <DataTable
            columns={itemColumns}
            data={receipt.items || []}
            emptyStateProps={{
              title: 'Không có mặt hàng nào trong phiếu',
            }}
          />
        </div>
      </div>
    </SlideOverDrawer>
  );
}

export default ReceiptDetailDrawer;
