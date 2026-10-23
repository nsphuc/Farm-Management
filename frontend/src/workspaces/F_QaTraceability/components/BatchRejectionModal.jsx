import React, { useState, useEffect } from 'react';
import { XCircle, ShieldAlert, Package, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Textarea } from '@/components/ui/FormControls';
import { qaService } from '@/services/modules/qaService';
import { extractApiErrors } from '@/utils/apiHelpers';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function BatchRejectionModal({
  isOpen,
  onClose,
  batch,
  onSuccess,
}) {
  const { notifyDataChanged } = useActiveFarmStore();
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setRejectionReason('');
    setError(null);
  }, [isOpen, batch]);

  if (!batch) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Vui lòng nhập lý do từ chối lô hàng!');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await qaService.rejectBatch(batch.farmId, batch.id, {
        rejectionReason: rejectionReason.trim(),
      });

      toast.success(`Đã từ chối nghiệm thu lô hàng "${batch.batchCode}" thành công!`);
      notifyDataChanged?.('batches');
      onSuccess?.();
      onClose();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setError(errInfo.message || 'Không thể từ chối lô hàng!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Từ Chối Nghiệm Thu Lô Hàng (REJECTED)"
      subtitle="Thẩm quyền Giám đốc trang trại (FARM_MANAGER)"
      icon={<XCircle className="h-5 w-5 text-rose-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-1.5 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-800 text-[11px]">
            <ShieldAlert className="h-4 w-4" />
            <span>Xác Nhận Không Đạt Tiêu Chuẩn KCS</span>
          </div>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            Khi từ chối, lô hàng sẽ chuyển sang trạng thái <strong>REJECTED</strong>. Lô này sẽ không được cấp mã QR truy xuất và Thủ kho sẽ không thể in tem nhãn nhiệt để xuất bán.
          </p>
        </div>

        {/* Thông tin lô hàng */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-slate-600" />
              <span>{batch.batchCode}</span>
            </span>
            <span className="rounded bg-slate-200 px-2 py-0.5 font-bold text-slate-700 text-[10px]">
              {batch.qualityGrade || 'Loại A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Sản phẩm:</span>
            <span className="font-semibold text-slate-900">{batch.productName}</span>
          </div>
        </div>

        {/* Lý do từ chối bắt buộc */}
        <FormField
          label="Lý Do Từ Chối Nghiệm Thu (Bắt Buộc)"
          required
          error={!rejectionReason.trim() && error ? error : null}
          hint="Ghi rõ tiêu chí cảm quan, độ ẩm, dư lượng hoặc sai lệch định mức..."
        >
          <Textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="VD: Kết quả kiểm nghiệm mẫu có độ ẩm vượt quá 14%, kích cỡ hạt không đồng đều..."
            className="border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-xs text-slate-900"
          />
        </FormField>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="md"
            icon={<XCircle className="h-4 w-4" />}
            isLoading={isSubmitting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
          >
            Xác Nhận Từ Chối
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default BatchRejectionModal;
