import React, { useState, useEffect } from 'react';
import { Calendar, Save, AlertCircle, Clock, Users, ArrowRight, Settings } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { toast } from '@/store/useToastStore';
import { useNavigate } from 'react-router-dom';

/**
 * Sinh danh sách các ngày liên tục giữa startDate và endDate
 */
function getDatesInRange(startDateStr, endDateStr) {
  const dates = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return [startDateStr];
  }
  const curr = new Date(start);
  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export function ShiftScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  employees = [],
  shifts = [],
  farmId,
}) {
  const navigate = useNavigate();
  const [shiftId, setShiftId] = useState('');
  const [dateMode, setDateMode] = useState('single'); // 'single' | 'range'
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [empSearch, setEmpSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Chỉ lấy nhân viên ACTIVE
  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');

  useEffect(() => {
    if (shifts.length > 0 && !shiftId) {
      setShiftId(String(shifts[0].id));
    }
    if (isOpen) {
      setError(null);
      // Mặc định chọn tất cả nhân viên hoặc rỗng
      if (activeEmployees.length > 0 && selectedEmpIds.length === 0) {
        setSelectedEmpIds(activeEmployees.map((e) => e.id));
      }
    }
  }, [isOpen, shifts, employees]);

  const handleToggleSelectAll = () => {
    if (selectedEmpIds.length === activeEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(activeEmployees.map((e) => e.id));
    }
  };

  const handleToggleEmp = (id) => {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredEmployees = activeEmployees.filter((e) => {
    if (!empSearch) return true;
    const q = empSearch.toLowerCase();
    return (
      e.fullName?.toLowerCase().includes(q) ||
      e.employeeCode?.toLowerCase().includes(q) ||
      e.position?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shiftId) {
      setError('Vui lòng chọn Ca làm việc chuẩn');
      return;
    }

    if (selectedEmpIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 nhân viên để phân ca');
      return;
    }

    const targetDates =
      dateMode === 'single'
        ? [singleDate]
        : getDatesInRange(startDate, endDate);

    if (targetDates.length === 0) {
      setError('Vui lòng chọn ngày phân ca hợp lệ');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let successCount = 0;
      let duplicateCount = 0;

      // Thực thi phân ca cho từng nhân viên và từng ngày
      for (const empId of selectedEmpIds) {
        for (const wDate of targetDates) {
          try {
            await hrService.assignShift({
              farmId: Number(farmId),
              employeeId: Number(empId),
              shiftId: Number(shiftId),
              workDate: wDate,
            });
            successCount++;
          } catch (err) {
            // Nếu trùng ca đã được phân từ trước, bỏ qua và đếm
            if (
              err.response?.data?.message?.includes('DUPLICATE') ||
              err.response?.data?.message?.includes('đã được phân ca')
            ) {
              duplicateCount++;
            } else {
              throw err;
            }
          }
        }
      }

      toast.success(
        `Đã phân ca thành công cho ${successCount} lượt công${
          duplicateCount > 0 ? ` (Bỏ qua ${duplicateCount} lượt trùng lặp)` : ''
        }!`
      );

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
      size="lg"
      title="Phân Ca Làm Việc Cho Nhân Sự Trại"
      subtitle="Thiết lập ca trực nhật, sản xuất hiện trường cho một hoặc nhiều nhân sự"
      icon={<Calendar className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Chọn Ca Làm Việc */}
        {shifts.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Clock className="h-4 w-4 text-amber-700" />
              <span>Chưa có Ca Làm Việc chuẩn nào</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Hệ thống chưa tìm thấy ca làm việc nào cho trang trại. Vui lòng cấu hình danh mục ca làm việc (Ca sáng, Ca chiều, Ca đêm) trước.
            </p>
            <Button
              type="button"
              variant="outline"
              size="xs"
              icon={<Settings className="h-3.5 w-3.5" />}
              onClick={() => {
                onClose();
                navigate('/app/settings?tab=shifts');
              }}
              className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Đến Cài Đặt Ca Làm Việc
            </Button>
          </div>
        ) : (
          <FormField label="1. Chọn Ca Làm Việc Chuẩn" required>
            <Select value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.shiftName} ({s.startTime ? s.startTime.substring(0, 5) : '—'} -{' '}
                  {s.endTime ? s.endTime.substring(0, 5) : '—'})
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {/* 2. Chọn Ngày / Dải Ngày */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-600" />
              <span>2. Thời Gian Phân Ca</span>
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setDateMode('single')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                  dateMode === 'single'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Ngày
              </button>
              <button
                type="button"
                onClick={() => setDateMode('range')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                  dateMode === 'range'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dải Ngày (Khoảng Ngày)
              </button>
            </div>
          </div>

          {dateMode === 'single' ? (
            <FormField label="Ngày Làm Việc" required>
              <Input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
              />
            </FormField>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Từ Ngày (Bắt đầu)" required>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FormField>
              <FormField label="Đến Ngày (Kết thúc)" required>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </FormField>
            </div>
          )}
        </div>

        {/* 3. Chọn 1 Hoặc Nhiều Nhân Viên */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-600" />
              <span>3. Chọn Nhân Viên Trại ({selectedEmpIds.length}/{activeEmployees.length})</span>
            </span>
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              {selectedEmpIds.length === activeEmployees.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          <Input
            placeholder="Tìm theo tên, mã NV hoặc chức vụ..."
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
            className="text-xs"
          />

          <div className="max-h-[180px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 divide-y divide-slate-100">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Không tìm thấy nhân viên phù hợp.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = selectedEmpIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleEmp(emp.id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <span className="font-bold text-slate-800 block truncate">
                        {emp.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {emp.employeeCode} • {emp.position || 'Nhân viên'} {emp.assignedZoneName ? `(Khu: ${emp.assignedZoneName})` : ''}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

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
            disabled={shifts.length === 0 || selectedEmpIds.length === 0}
          >
            Lưu Phân Ca ({selectedEmpIds.length} nhân viên)
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export const ShiftAssignmentModal = ShiftScheduleModal;
export default ShiftScheduleModal;
