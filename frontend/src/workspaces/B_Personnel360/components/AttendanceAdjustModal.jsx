import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Textarea } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';

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
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (attendance) {
      setCheckInTime(toDateTimeLocalString(attendance.checkInTime));
      setCheckOutTime(toDateTimeLocalString(attendance.checkOutTime));
      setAdjustmentReason(attendance.adjustmentReason || '');
      setError(null);
    }
  }, [attendance, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkInTime) {
      setError('Vui lòng nhập giờ vào ca (Check-in)');
      return;
    }

    if (checkOutTime && new Date(checkOutTime) < new Date(checkInTime)) {
      setError('Giờ ra ca (Check-out) phải sau giờ vào ca');
      return;
    }

    if (!adjustmentReason.trim() || adjustmentReason.trim().length < 10) {
      setError('Lý do điều chỉnh bắt buộc nhập tối thiểu 10 ký tự (nêu rõ nguyên nhân kiểm toán)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await hrService.adjustAttendance(attendance.id, {
        checkInTime: new Date(checkInTime).toISOString(),
        checkOutTime: checkOutTime ? new Date(checkOutTime).toISOString() : null,
        adjustmentReason: adjustmentReason.trim(),
      });

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
      subtitle={`Ngày làm: ${attendance.workDate} • Ca: ${attendance.shiftName || '—'}`}
      icon={<Clock className="h-5 w-5 text-indigo-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Dữ liệu gốc lúc vào ca:</span>
            <span className="font-mono font-semibold text-slate-800">
              {attendance.originalCheckIn || attendance.checkInTime
                ? new Date(attendance.originalCheckIn || attendance.checkInTime).toLocaleTimeString('vi-VN')
                : 'Chưa có'}
            </span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Dữ liệu gốc lúc ra ca:</span>
            <span className="font-mono font-semibold text-slate-800">
              {attendance.originalCheckOut || attendance.checkOutTime
                ? new Date(attendance.originalCheckOut || attendance.checkOutTime).toLocaleTimeString('vi-VN')
                : 'Chưa có'}
            </span>
          </div>
        </div>

        <FormField label="Giờ Vào Ca Điều Chỉnh" required>
          <Input
            type="datetime-local"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
          />
        </FormField>

        <FormField label="Giờ Ra Ca Điều Chỉnh">
          <Input
            type="datetime-local"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
          />
        </FormField>

        <FormField
          label="Lý Do Điều Chỉnh (Kiểm toán bắt buộc, >= 10 ký tự)"
          required
          hint="VD: Quên bấm máy do hỗ trợ sự cố khẩn cấp tại nhà màng số 2"
        >
          <Textarea
            rows={3}
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            placeholder="Nêu rõ lý do điều chỉnh..."
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
          >
            Lưu Điều Chỉnh
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AttendanceAdjustModal;
