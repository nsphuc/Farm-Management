import React from 'react';
import {
  FileText,
  Warehouse,
  Calendar,
  DollarSign,
  User,
  Package,
  Layers,
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { Can } from '@/components/common/Can';
import { inventoryService } from '@/services/modules/inventoryService';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import { CheckCircle2 } from 'lucide-react';

const ISSUE_TYPE_LABELS = {
  FIELD_CONSUMPTION: 'Xuất sử dụng đồng ruộng',
  INTERNAL_USE: 'Xuất dùng nội bộ',
  DAMAGE_DISPOSAL: 'Xuất hủy hỏng hóc',
  SALE: 'Xuất bán thương mại',
};

export function IssueDetailDrawer({ isOpen, onClose, issue, farmId, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!issue) return null;

  const targetFarmId = farmId || issue.farmId;

  const handleComplete = async () => {
    if (!window.confirm(`Xác nhận phê duyệt xuất kho cho phiếu ${issue.issueCode}? Số lượng tồn kho khả dụng sẽ được trừ và ghi sổ thẻ kho.`)) return;
    try {
      setIsSubmitting(true);
      await inventoryService.completeIssue(targetFarmId, issue.id);
      alert('Đã phê duyệt xuất kho thành công!');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Lỗi khi duyệt xuất kho:', err);
      alert('Không thể duyệt xuất kho: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy phiếu xuất kho ${issue.issueCode}?`)) return;
    try {
      setIsSubmitting(true);
      await inventoryService.cancelIssue(targetFarmId, issue.id);
      alert('Đã hủy phiếu xuất kho!');
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
      header: 'Lô Xuất Kho',
      width: '140px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
          {row.batchNumber}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Số Lượng Xuất',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatNumber(row.quantity)} {row.standardUnit}
        </span>
      ),
    },
    {
      key: 'unitPrice',
      header: 'Đơn Giá Vốn',
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
      title={`Phiếu Xuất Kho: ${issue.issueCode}`}
      subtitle={`Ngày xuất: ${formatDate(issue.issueDate)} • Kho: ${issue.warehouseName}`}
      icon={<FileText className="h-5 w-5 text-amber-600" />}
      width="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái phiếu:</span>
            <StatusBadge status={issue.status} size="sm" />
            {issue.status === 'DRAFT' && (
              <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200">
                Chờ Giám đốc trại phê duyệt
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {issue.status === 'DRAFT' && (
              <Can permission="PERM_INVENTORY_ISSUE" role="ROLE_FARM_MANAGER">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  loading={isSubmitting}
                  onClick={handleComplete}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Phê Duyệt Xuất Kho
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
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Người Nhận Hàng</span>
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="truncate">{issue.receiverName || 'Bộ phận kỹ thuật'}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mục Đích Xuất</span>
            <span className="text-xs font-semibold text-slate-800 block truncate">
              {ISSUE_TYPE_LABELS[issue.issueType] || issue.issueType}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tổng Giá Trị</span>
            <span className="font-mono font-black text-amber-700 text-sm block">
              {formatCurrency(issue.totalAmount)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vụ Mùa / Lứa Nuôi</span>
            <span className="text-xs font-medium text-slate-600 block">
              {issue.seasonId ? `Mùa vụ #${issue.seasonId}` : 'Xuất kho chung'}
            </span>
          </div>
        </div>

        {issue.notes && (
          <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-700">
            <strong>Ghi chú:</strong> {issue.notes}
          </div>
        )}

        {/* Danh sách mặt hàng */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-amber-600" />
            <span>Chi Tiết Danh Mục Vật Tư Xuất Kho ({issue.items?.length || 0})</span>
          </h4>
          <DataTable
            columns={itemColumns}
            data={issue.items || []}
            emptyStateProps={{
              title: 'Không có mặt hàng nào trong phiếu',
            }}
          />
        </div>
      </div>
    </SlideOverDrawer>
  );
}

export default IssueDetailDrawer;
