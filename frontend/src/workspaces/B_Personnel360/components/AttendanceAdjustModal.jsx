import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle, ShieldAlert, History } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Textarea } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

/**
 * Chuyển Instant UTC sang định dạng YYYY-MM-DDTHH:mm cho input datetime-local
 */
function toDateTimeLocalString(instantStr) {
  if (!instantStr) return '';
  const d = new Date(instantStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function AttendanceAdjustModal({
  isOpen,
  onClose,
  onSuccess,
  attendance = null,
}) {
  const { notifyDataChanged } = useActiveFarmStore();
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (attendance && isOpen) {
      setCheckInTime(toDateTimeLocalString(attendance.checkInTime));
      setCheckOutTime(toDateTimeLocalString(attendance.checkOutTime));
      setAdjustmentReason(attendance.adjustmentReason || '');
      setError(null);
    }
  }, [attendance, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkInTime) {
      setError('Vui lòng nhập Giờ vào ca điều chỉnh *');
      return;
    }

    if (!checkOutTime) {
      setError('Vui lòng nhập Giờ ra ca điều chỉnh *');
      return;
    }

    if (new Date(checkOutTime) <= new Date(checkInTime)) {
      setError('Giờ ra ca điều chỉnh phải sau giờ vào ca');
      return;
    }

    if (!adjustmentReason.trim() || adjustmentReason.trim().length < 10) {
      setError('Lý do điều chỉnh (adjustmentReason) bắt buộc nhập tối thiểu 10 ký tự để phục vụ kiểm toán');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await hrService.adjustAttendance(attendance.id, {
        checkInTime: new Date(checkInTime).toISOString(),
        checkOutTime: new Date(checkOutTime).toISOString(),
        adjustmentReason: adjustmentReason.trim(),
      });

      toast.success('Điều chỉnh giờ công và ghi nhận nhật ký kiểm toán thành công!');
      notifyDataChanged?.('employees');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Adjust attendance error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi điều chỉnh công');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!attendance) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={`Điều Chỉnh Giờ Công: ${attendance.employeeFullName}`}
      subtitle={`Ngày làm việc: ${attendance.workDate} • Ca: ${attendance.shiftName || '—'}`}
      icon={<Clock className="h-5 w-5 text-indigo-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Khung hiển thị dữ liệu gốc - Read only */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 pb-1 border-b border-slate-200">
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span>Dữ Liệu Chấm Công Gốc Lúc Ghi Nhận (Chỉ xem)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-lg bg-white p-2 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Giờ vào gốc (originalCheckIn):</span>
              <span className="font-mono font-bold text-slate-800 text-xs">
                {attendance.originalCheckIn || attendance.checkInTime
                  ? new Date(attendance.originalCheckIn || attendance.checkInTime).toLocaleTimeString('vi-VN')
                  : 'Chưa có'}
              </span>
            </div>
            <div className="rounded-lg bg-white p-2 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Giờ ra gốc (originalCheckOut):</span>
              <span className="font-mono font-bold text-slate-800 text-xs">
                {attendance.originalCheckOut || attendance.checkOutTime
                  ? new Date(attendance.originalCheckOut || attendance.checkOutTime).toLocaleTimeString('vi-VN')
                  : 'Chưa check-out'}
              </span>
            </div>
          </div>
        </div>

        {/* Form nhập dữ liệu điều chỉnh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Giờ Vào Ca Điều Chỉnh" required>
            <Input
              type="datetime-local"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />
          </FormField>

          <FormField label="Giờ Ra Ca Điều Chỉnh" required>
            <Input
              type="datetime-local"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
            />
          </FormField>
        </div>

        <FormField
          label="Lý Do Điều Chỉnh (Kiểm toán bắt buộc, >= 10 ký tự)"
          required
          hint="Ghi rõ nguyên nhân (VD: Quên bấm máy do xử lý khẩn cấp tại nhà màng A, thiết bị mất mạng...)"
        >
          <Textarea
            rows={3}
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            placeholder="Nêu rõ lý do điều chỉnh để lưu dấu kiểm toán..."
          />
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Save className="h-4 w-4" />}
            isLoading={isSubmitting}
            loadingText="Đang lưu kiểm toán..."
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
          >
            Lưu Điều Chỉnh Giờ Công
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AttendanceAdjustModal;
