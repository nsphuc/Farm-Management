import React, { useState, useEffect } from 'react';
import { Calendar, Save, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';

export function ShiftScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  employees = [],
  shifts = [],
  farmId,
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Chỉ lấy nhân viên ACTIVE
  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');

  useEffect(() => {
    if (activeEmployees.length > 0 && !employeeId) {
      setEmployeeId(String(activeEmployees[0].id));
    }
    if (shifts.length > 0 && !shiftId) {
      setShiftId(String(shifts[0].id));
    }
    setError(null);
  }, [isOpen, employees, shifts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !shiftId || !workDate) {
      setError('Vui lòng chọn đầy đủ nhân viên, ca làm việc và ngày');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await hrService.assignShift({
        farmId: Number(farmId),
        employeeId: Number(employeeId),
        shiftId: Number(shiftId),
        workDate,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Assign shift error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi phân ca làm việc');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Phân Ca Làm Việc Cho Nhân Sự"
      subtitle="Thiết lập ca trực nhật, sản xuất hiện trường trong tuần"
      icon={<Calendar className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <FormField label="Chọn Nhân Viên (Chỉ nạp ACTIVE)" required>
          <Select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            {activeEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({emp.employeeCode} - {emp.position || 'Nhân viên'})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Chọn Ca Làm Việc Chuẩn" required>
          <Select
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
          >
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shiftName} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Ngày Làm Việc (workDate)" required>
          <Input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
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
            loadingText="Đang phân ca..."
          >
            Lưu Phân Ca
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ShiftScheduleModal;
