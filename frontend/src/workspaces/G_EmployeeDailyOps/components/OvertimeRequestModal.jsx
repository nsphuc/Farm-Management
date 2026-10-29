import React, { useState, useEffect } from 'react';
import { Clock, Send, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';


const OT_MULTIPLIERS = [
  { value: '1.50', label: '1.50 - Ngày thường (150% lương)' },
  { value: '2.00', label: '2.00 - Ngày nghỉ cuối tuần (200% lương)' },
  { value: '3.00', label: '3.00 - Ngày nghỉ Lễ Tết (300% lương)' },
];

export function OvertimeRequestModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  employeeId,
  shifts = [],
}) {
  const [formData, setFormData] = useState({
    shiftId: '',
    otDate: new Date().toISOString().split('T')[0],
    startTime: '17:30',
    endTime: '20:30',
    totalHours: '3.00',
    otMultiplier: '1.50',
    reason: '',
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shifts.length > 0 && !formData.shiftId) {
      setFormData((prev) => ({ ...prev, shiftId: String(shifts[0].id) }));
    }
  }, [shifts, isOpen]);

  // Tự động tính số giờ khi thay đổi startTime / endTime
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const [sh, sm] = formData.startTime.split(':').map(Number);
      const [eh, em] = formData.endTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      if (endMinutes > startMinutes) {
        const diffHours = (endMinutes - startMinutes) / 60;
        setFormData((prev) => ({ ...prev, totalHours: diffHours.toFixed(2) }));
      }
    }
  }, [formData.startTime, formData.endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reason?.trim()) {
      setError('Vui lòng nhập lý do đăng ký làm thêm giờ');
      return;
    }

    if (Number(formData.totalHours) <= 0) {
      setError('Giờ kết thúc phải lớn hơn giờ bắt đầu');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await hrService.createOvertimeRequest({
        farmId: Number(farmId),
        employeeId: employeeId ? Number(employeeId) : null,
        shiftId: formData.shiftId ? Number(formData.shiftId) : null,
        otDate: formData.otDate,
        startTime: `${formData.startTime}:00`,
        endTime: `${formData.endTime}:00`,
        totalHours: Number(formData.totalHours),
        otMultiplier: Number(formData.otMultiplier),
        reason: formData.reason.trim(),
      });

      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('employees');
      store.notifyDataChanged?.('tasks');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Create overtime error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi đơn làm thêm giờ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Đăng Ký Làm Thêm Giờ (OT)"
      subtitle="Ghi nhận giờ tăng ca phục vụ tính lương và phân bổ chi phí nhân công"
      icon={<Clock className="h-5 w-5 text-indigo-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="Ngày Làm Thêm" required>
            <Input
              type="date"
              value={formData.otDate}
              onChange={(e) => setFormData({ ...formData, otDate: e.target.value })}
            />
          </FormField>

          <FormField label="Ca Làm Việc Gắn Liền">
            <Select
              value={formData.shiftId}
              onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shiftName} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-3.5">
          <FormField label="Giờ Bắt Đầu" required>
            <Input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </FormField>

          <FormField label="Giờ Kết Thúc" required>
            <Input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </FormField>

          <FormField label="Tổng Giờ (Giờ)" required>
            <Input
              type="number"
              step="0.25"
              value={formData.totalHours}
              onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Hệ Số Nhân Lương OT" required>
          <Select
            value={formData.otMultiplier}
            onChange={(e) => setFormData({ ...formData, otMultiplier: e.target.value })}
            options={OT_MULTIPLIERS}
          />
        </FormField>

        <FormField label="Lý Do Làm Thêm Giờ" required>
          <Textarea
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="VD: Thu hoạch dưa lưới khẩn cấp kịp chuyến xe chở hàng lên cảng..."
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
            icon={<Send className="h-4 w-4" />}
            isLoading={isSubmitting}
            loadingText="Đang gửi đơn..."
          >
            Gửi Đăng Ký OT
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default OvertimeRequestModal;
