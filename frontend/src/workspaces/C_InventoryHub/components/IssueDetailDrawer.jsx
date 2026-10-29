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
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

const ISSUE_TYPE_LABELS = {
  FIELD_CONSUMPTION: 'Xuất sử dụng đồng ruộng',
  INTERNAL_USE: 'Xuất dùng nội bộ',
  DAMAGE_DISPOSAL: 'Xuất hủy hỏng hóc',
  SALE: 'Xuất bán thương mại',
};

export function IssueDetailDrawer({ isOpen, onClose, issue, farmId, onSuccess }) {
  const [currentIssue, setCurrentIssue] = React.useState(issue);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showCancelForm, setShowCancelForm] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelError, setCancelError] = React.useState('');
  const syncTrigger = useActiveFarmStore((state) => state.syncTrigger);

  React.useEffect(() => {
    setCurrentIssue(issue);
    setShowCancelForm(false);
    setCancelReason('');
    setCancelError('');
  }, [issue]);

  const activeIssue = currentIssue || issue;
  const targetFarmId = farmId || activeIssue?.farmId;

  // GAP-SYNC-05: Lắng nghe syncTrigger để tự động làm mới phiếu đang mở
  React.useEffect(() => {
    if (isOpen && activeIssue?.id && targetFarmId) {
      inventoryService
        .getIssueById(targetFarmId, activeIssue.id)
        .then((res) => {
          if (res) setCurrentIssue(res);
        })
        .catch(() => {});
    }
  }, [isOpen, activeIssue?.id, targetFarmId, syncTrigger?.inventory, syncTrigger?.all]);

  if (!issue && !currentIssue) return null;

  const handleComplete = async () => {
    if (!window.confirm(`Xác nhận phê duyệt xuất kho cho phiếu ${activeIssue.issueCode}? Số lượng tồn kho khả dụng sẽ được trừ và ghi sổ thẻ kho.`)) return;
    try {
      setIsSubmitting(true);
      await inventoryService.completeIssue(targetFarmId, activeIssue.id);
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('inventory');
      toast.success('Đã phê duyệt xuất kho thành công!');
      setCurrentIssue((prev) => ({ ...prev, status: 'COMPLETED' }));
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Lỗi khi duyệt xuất kho:', err);
      toast.error('Không thể duyệt xuất kho: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason || cancelReason.trim().length < 5) {
      setCancelError('Vui lòng nhập lý do hủy tối thiểu 5 ký tự');
      return;
    }
    try {
      setIsSubmitting(true);
      setCancelError('');
      await inventoryService.cancelIssue(targetFarmId, activeIssue.id, {
        cancellationReason: cancelReason.trim(),
      });
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('inventory');
      toast.success(`Đã hủy phiếu xuất kho ${activeIssue.issueCode}!`);
      setCurrentIssue((prev) => ({
        ...prev,
        status: 'CANCELLED',
        cancellationReason: cancelReason.trim(),
      }));
      setShowCancelForm(false);
      onSuccess?.();
    } catch (err) {
      console.error('Lỗi khi hủy phiếu:', err);
      toast.error('Không thể hủy phiếu: ' + (err.response?.data?.message || err.message));
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
      title={`Phiếu Xuất Kho: ${activeIssue.issueCode}`}
      subtitle={`Ngày xuất: ${formatDate(activeIssue.issueDate)} • Kho: ${activeIssue.warehouseName}`}
      icon={<FileText className="h-5 w-5 text-amber-600" />}
      width="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái phiếu:</span>
            <StatusBadge status={activeIssue.status} size="sm" />
            {activeIssue.status === 'DRAFT' && (
              <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200">
                Chờ Giám đốc trại phê duyệt
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeIssue.status === 'DRAFT' && (
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
                  onClick={() => setShowCancelForm((prev) => !prev)}
                >
                  {showCancelForm ? 'Đóng Hủy' : 'Hủy Phiếu'}
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
        {/* Khung nhập lý do hủy phiếu (Inline Collapse Form) */}
        {showCancelForm && (
          <div className="bg-rose-50/90 border-2 border-rose-300 rounded-2xl p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Xác Nhận Hủy Phiếu Xuất Kho ({activeIssue.issueCode})</span>
            </div>
            <p className="text-[11px] text-rose-700">
              Vui lòng cung cấp lý do hủy phiếu (bắt buộc, tối thiểu 5 ký tự) để phục vụ kiểm toán kho:
            </p>
            <textarea
              className="w-full text-xs rounded-xl border border-rose-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              rows={3}
              placeholder="VD: Kế hoạch canh tác thay đổi, hủy phiếu theo chỉ đạo của Kỹ sư trưởng..."
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError) setCancelError('');
              }}
            />
            {cancelError && (
              <span className="text-[11px] text-rose-600 font-semibold block">{cancelError}</span>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCancelForm(false);
                  setCancelError('');
                }}
                disabled={isSubmitting}
              >
                Đóng / Bỏ qua
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={isSubmitting}
                onClick={handleConfirmCancel}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Xác Nhận Hủy Phiếu
              </Button>
            </div>
          </div>
        )}

        {/* Cảnh báo Phiếu đã bị HỦY kèm lý do */}
        {activeIssue.status === 'CANCELLED' && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-1 text-xs text-rose-900 flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm text-rose-800">PHIẾU ĐÃ BỊ HỦY (CANCELLED)</span>
              <p className="text-xs text-rose-700 mt-0.5">
                <strong>Lý do hủy:</strong> {activeIssue.cancellationReason || 'Không có lý do chi tiết ghi nhận.'}
              </p>
            </div>
          </div>
        )}

        {/* Header Tóm Tắt */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Người Nhận Hàng</span>
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="truncate">{activeIssue.receiverName || 'Bộ phận kỹ thuật'}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mục Đích Xuất</span>
            <span className="text-xs font-semibold text-slate-800 block truncate">
              {ISSUE_TYPE_LABELS[activeIssue.issueType] || activeIssue.issueType}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tổng Giá Trị</span>
            <span className="font-mono font-black text-amber-700 text-sm block">
              {formatCurrency(activeIssue.totalAmount)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vụ Mùa / Đàn Nuôi</span>
            <span className="text-xs font-medium text-slate-600 block">
              {activeIssue.seasonId
                ? `Mùa vụ #${activeIssue.seasonId}`
                : activeIssue.livestockGroupId
                ? `Đàn nuôi #${activeIssue.livestockGroupId}`
                : 'Xuất kho chung'}
            </span>
          </div>
        </div>

        {activeIssue.notes && (
          <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-700">
            <strong>Ghi chú:</strong> {activeIssue.notes}
          </div>
        )}

        {/* Danh sách mặt hàng */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-amber-600" />
            <span>Chi Tiết Danh Mục Vật Tư Xuất Kho ({activeIssue.items?.length || 0})</span>
          </h4>
          <DataTable
            columns={itemColumns}
            data={activeIssue.items || []}
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
