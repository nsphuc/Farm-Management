import React, { useState, useEffect } from 'react';
import { AlertOctagon, ShieldAlert, Building, Package, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Textarea } from '@/components/ui/FormControls';
import { qaService } from '@/services/modules/qaService';
import { extractApiErrors } from '@/utils/apiHelpers';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function EmergencyRecallModal({
  isOpen,
  onClose,
  batch,
  onSuccess,
}) {
  const { notifyDataChanged } = useActiveFarmStore();
  const [recallReason, setRecallReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setRecallReason('');
    setError(null);
  }, [isOpen, batch]);

  if (!batch) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recallReason.trim()) {
      setError('Vui lòng nhập lý do phát lệnh thu hồi khẩn cấp!');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await qaService.recallBatch(batch.farmId, batch.id, recallReason.trim());

      toast.success(`Đã phát lệnh THU HỒI KHẨN CẤP lô hàng "${batch.batchCode}" thành công!`);
      notifyDataChanged?.('batches');
      onSuccess?.();
      onClose();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setError(errInfo.message || 'Không thể phát lệnh thu hồi khẩn cấp!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Phát Lệnh Thu Hồi Khẩn Cấp Toàn Cục"
      subtitle="Đặc quyền Chủ đầu tư (Owner) / Giám đốc chất lượng cấp cao"
      icon={<AlertOctagon className="h-5 w-5 text-rose-600 animate-pulse" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Thông tin cảnh báo đỏ */}
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-4 space-y-2 text-rose-900">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-700">
            <ShieldAlert className="h-4 w-4" />
            <span>Cảnh Báo Chặn Lưu Hành Khẩn Cấp</span>
          </div>
          <p className="text-xs leading-relaxed text-rose-800">
            Khi phát lệnh thu hồi, lô hàng sẽ chuyển sang trạng thái <strong>RECALLED</strong> ngay lập tức.
            Toàn bộ các trang trại và kho vận trong chuỗi bị <strong>khóa cứng không thể xuất bán tiếp (WS-H2)</strong>,
            và bất kỳ người tiêu dùng nào quét mã QR công khai (<code>/trace/:code</code>) đều sẽ thấy <strong>Cảnh Báo Đỏ Nguy Hiểm</strong>.
          </p>
        </div>

        {/* Chi tiết lô hàng cần thu hồi */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-slate-600" />
              <span>{batch.batchCode}</span>
            </span>
            <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-800 text-[10px]">
              Trạng thái: {batch.status}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
            <span>Tên sản phẩm:</span>
            <span className="font-semibold text-slate-900">{batch.productName}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Trang trại:</span>
            <span className="font-medium text-slate-800 flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-emerald-600" />
              {batch.farmName || `Trại #${batch.farmId}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Mã truy xuất QR:</span>
            <span className="font-mono text-slate-700 text-[11px]">{batch.traceabilityCode || 'Chưa cấp'}</span>
          </div>
        </div>

        {/* Lý do thu hồi bắt buộc */}
        <FormField
          label="Lý Do Thu Hồi Khẩn Cấp (Bắt Buộc)"
          required
          error={!recallReason.trim() && error ? error : null}
          hint="Ghi rõ lý do chất lượng, chỉ tiêu vi phạm, khuyến cáo an toàn thực phẩm"
        >
          <Textarea
            rows={3}
            value={recallReason}
            onChange={(e) => setRecallReason(e.target.value)}
            placeholder="VD: Phát hiện dư lượng vi sinh vượt ngưỡng quy chuẩn theo kết quả kiểm định lại của cơ quan chức năng..."
            className="border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-xs text-rose-950"
          />
        </FormField>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="md"
            icon={<AlertOctagon className="h-4 w-4" />}
            isLoading={isSubmitting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
          >
            Xác Nhận Thu Hồi Khẩn Cấp
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EmergencyRecallModal;
