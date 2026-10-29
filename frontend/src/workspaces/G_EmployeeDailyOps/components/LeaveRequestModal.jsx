import React, { useState, useEffect } from 'react';
import { CalendarOff, Send, AlertCircle, Info } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';


const LEAVE_TYPES = [
  { value: 'ANNUAL_LEAVE', label: 'Nghỉ phép năm hưởng lương (ANNUAL_LEAVE)' },
  { value: 'SICK_LEAVE', label: 'Nghỉ ốm đau BHXH (SICK_LEAVE)' },
  { value: 'UNPAID_LEAVE', label: 'Nghỉ không hưởng lương (UNPAID_LEAVE)' },
  { value: 'MATERNITY_LEAVE', label: 'Nghỉ thai sản chế độ (MATERNITY_LEAVE)' },
  { value: 'BEREAVEMENT_LEAVE', label: 'Nghỉ hiếu hỷ gia đình (BEREAVEMENT_LEAVE)' },
];

export function LeaveRequestModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  employeeId,
  annualLeaveQuota = 12.0,
}) {
  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL_LEAVE',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: '1.0',
    reason: '',
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tự động tính số ngày khi thay đổi startDate / endDate
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const s = new Date(formData.startDate);
      const e = new Date(formData.endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
        const diffTime = Math.abs(e - s);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData((prev) => ({ ...prev, totalDays: String(diffDays) }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  const isExceedingQuota =
    formData.leaveType === 'ANNUAL_LEAVE' &&
    Number(formData.totalDays) > Number(annualLeaveQuota);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reason?.trim()) {
      setError('Vui lòng nhập lý do xin nghỉ phép');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
      return;
    }

    if (isExceedingQuota) {
      setError(`Số ngày xin nghỉ (${formData.totalDays} ngày) vượt quá quỹ phép năm còn lại (${annualLeaveQuota} ngày)!`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await hrService.createLeaveRequest({
        farmId: Number(farmId),
        employeeId: employeeId ? Number(employeeId) : null,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays: Number(formData.totalDays),
        reason: formData.reason.trim(),
      });

      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('employees');
      store.notifyDataChanged?.('tasks');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Create leave error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi đơn xin nghỉ phép');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Gửi Đơn Xin Nghỉ Phép"
      subtitle="Đơn sẽ được tự động gửi đến Quản lý trang trại để xét duyệt"
      icon={<CalendarOff className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Thông báo quỹ phép năm */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-center justify-between text-xs">
          <span className="text-blue-700 flex items-center gap-1.5">
            <Info className="h-4 w-4" />
            Quỹ phép năm hiện có:
          </span>
          <span className="font-bold text-blue-900 font-mono text-sm">
            {annualLeaveQuota} ngày
          </span>
        </div>

        <FormField label="Loại Nghỉ Phép" required>
          <Select
            value={formData.leaveType}
            onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
            options={LEAVE_TYPES}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="Từ Ngày (Start Date)" required>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </FormField>

          <FormField label="Đến Ngày (End Date)" required>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Tổng Số Ngày Xin Nghỉ" required>
          <Input
            type="number"
            step="0.5"
            min="0.5"
            value={formData.totalDays}
            onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })}
          />
        </FormField>

        {isExceedingQuota && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>
              Cảnh báo: Bạn chỉ còn {annualLeaveQuota} ngày phép năm. Số ngày nghỉ vượt quá sẽ bị khóa gửi đơn.
            </span>
          </div>
        )}

        <FormField label="Lý Do Xin Nghỉ Phép" required>
          <Textarea
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Nêu rõ lý do nghỉ phép, kế hoạch bàn giao công việc..."
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
            disabled={isExceedingQuota}
          >
            Gửi Đơn Xin Nghỉ
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default LeaveRequestModal;
