import React, { useState, useEffect } from 'react';
import { RotateCcw, Save, AlertCircle, Users, CheckSquare, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { applyServerFieldErrors } from '@/utils/errorHandler';

const TASK_TYPES = [
  { value: 'FEEDING', label: 'Cho ăn / Chăm sóc đàn (FEEDING)' },
  { value: 'PLANTING', label: 'Tưới nước & Chăm sóc cây (PLANTING)' },
  { value: 'FERTILIZING', label: 'Bón phân & Dinh dưỡng (FERTILIZING)' },
  { value: 'SANITATION', label: 'Dọn cỏ / Quét rác / Vệ sinh chuồng kho (SANITATION)' },
  { value: 'MAINTENANCE', label: 'Bảo trì máy móc / Kho bãi (MAINTENANCE)' },
  { value: 'HARVESTING', label: 'Thu hoạch định kỳ (HARVESTING)' },
];

const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Thấp (LOW)' },
  { value: 'MEDIUM', label: 'Bình thường (MEDIUM)' },
  { value: 'HIGH', label: 'Ưu tiên cao (HIGH)' },
  { value: 'URGENT', label: 'Khẩn cấp (URGENT)' },
];

export function RoutineTaskModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  zones = [],
  employees = [],
  initialData = null,
}) {
  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');

  const [formData, setFormData] = useState({
    titleText: '',
    taskType: 'FEEDING',
    priority: 'MEDIUM',
    zoneId: '',
    completionNotes: '',
    selectedEmployeeIds: [],
    leaderEmployeeId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Mode: Chỉnh sửa hoặc nạp từ preset
        const rawTitle = initialData.taskTitle || '';
        const cleanTitle = rawTitle.replace(/^\[CỐ ĐỊNH HÀNG NGÀY\]\s*/i, '');
        const currentAssigneeIds = (initialData.assignees || []).map((a) => a.employeeId);
        const leader = (initialData.assignees || []).find((a) => a.roleInTask === 'LEADER');

        setFormData({
          titleText: cleanTitle,
          taskType: initialData.taskType || 'FEEDING',
          priority: initialData.priority || 'MEDIUM',
          zoneId: initialData.zoneId ? String(initialData.zoneId) : (zones[0]?.id ? String(zones[0].id) : ''),
          completionNotes: initialData.completionNotes || '',
          selectedEmployeeIds: currentAssigneeIds.length > 0 ? currentAssigneeIds : (activeEmployees[0]?.id ? [activeEmployees[0].id] : []),
          leaderEmployeeId: leader?.employeeId ? String(leader.employeeId) : (currentAssigneeIds[0] ? String(currentAssigneeIds[0]) : ''),
        });
      } else {
        // Mode: Thêm mới hoàn toàn
        setFormData({
          titleText: '',
          taskType: 'FEEDING',
          priority: 'MEDIUM',
          zoneId: zones[0]?.id ? String(zones[0].id) : '',
          completionNotes: '',
          selectedEmployeeIds: activeEmployees[0]?.id ? [activeEmployees[0].id] : [],
          leaderEmployeeId: activeEmployees[0]?.id ? String(activeEmployees[0].id) : '',
        });
      }
      setErrors({});
      setGeneralError(null);
    }
  }, [isOpen, initialData, zones, employees]);

  const handleToggleEmployee = (empId) => {
    setFormData((prev) => {
      const exists = prev.selectedEmployeeIds.includes(empId);
      let updated;
      if (exists) {
        updated = prev.selectedEmployeeIds.filter((id) => id !== empId);
      } else {
        updated = [...prev.selectedEmployeeIds, empId];
      }

      let leader = prev.leaderEmployeeId;
      if (exists && String(empId) === prev.leaderEmployeeId) {
        leader = updated.length > 0 ? String(updated[0]) : '';
      } else if (!prev.leaderEmployeeId && updated.length > 0) {
        leader = String(updated[0]);
      }

      return {
        ...prev,
        selectedEmployeeIds: updated,
        leaderEmployeeId: leader,
      };
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.titleText?.trim()) {
      errs.titleText = 'Tiêu đề công việc không được để trống';
    }
    if (formData.selectedEmployeeIds.length === 0) {
      errs.assignees = 'Cần phân công ít nhất 1 nhân viên thực hiện việc cố định này';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!farmId) {
      setGeneralError('Vui lòng chọn trang trại');
      return;
    }

    try {
      setIsSubmitting(true);
      setGeneralError(null);

      const fullTitle = `[CỐ ĐỊNH HÀNG NGÀY] ${formData.titleText.trim()}`;
      const assigneesPayload = formData.selectedEmployeeIds.map((empId) => ({
        employeeId: empId,
        roleInTask: String(empId) === String(formData.leaderEmployeeId) ? 'LEADER' : 'MEMBER',
      }));

      // Hạn chót mặc định hôm nay 18:00
      const today18h = new Date();
      today18h.setHours(18, 0, 0, 0);

      const payload = {
        zoneId: formData.zoneId ? Number(formData.zoneId) : null,
        taskTitle: fullTitle,
        taskType: formData.taskType,
        priority: formData.priority,
        deadline: today18h.toISOString(),
        completionNotes: formData.completionNotes?.trim() || null,
        assignedToEmployeeId: formData.leaderEmployeeId ? Number(formData.leaderEmployeeId) : null,
        assignees: assigneesPayload,
      };

      if (initialData?.id) {
        // Cập nhật việc cố định đã có
        await hrService.updateTask(farmId, initialData.id, payload);
      } else {
        // Tạo việc cố định mới
        await hrService.createTask(farmId, payload);
      }

      onSuccess?.();
    } catch (err) {
      console.error('Save routine task error:', err);
      const msg = applyServerFieldErrors(err, setErrors);
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(initialData?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={isEditing ? 'Đổi Người Thực Hiện / Sửa Việc Cố Định' : 'Thiết Lập Công Việc Cố Định Hàng Ngày'}
      subtitle="Việc lặp lại mỗi ngày cho phân khu hoặc kho bãi trang trại"
      icon={<RotateCcw className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Tiền tố cố định */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
          <span className="font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px]">
            [CỐ ĐỊNH HÀNG NGÀY]
          </span>
          <span>Tiêu đề công việc sẽ tự động gắn tiền tố cố định để phân biệt với việc phát sinh.</span>
        </div>

        <FormField label="Tên Công Việc Lặp Lại Hàng Ngày" required error={errors.titleText}>
          <Input
            value={formData.titleText}
            onChange={(e) => setFormData({ ...formData, titleText: e.target.value })}
            placeholder="VD: Cho vật nuôi ăn sáng/chiều, Tưới rau thuỷ canh..."
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <FormField label="Loại Công Việc" required>
            <Select
              value={formData.taskType}
              onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
              options={TASK_TYPES}
            />
          </FormField>

          <FormField label="Mức Độ Ưu Tiên" required>
            <Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={TASK_PRIORITIES}
            />
          </FormField>

          <FormField label="Khu Vực Áp Dụng (Zone)">
            <Select
              value={formData.zoneId}
              onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
              placeholder="-- Toàn trang trại --"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Mô Tả Quy Trình / Ghi Chú Kỹ Thuật">
          <Textarea
            rows={2}
            value={formData.completionNotes}
            onChange={(e) => setFormData({ ...formData, completionNotes: e.target.value })}
            placeholder="Quy chuẩn định lượng, công thức pha dinh dưỡng, thời điểm thực hiện trong ngày..."
          />
        </FormField>

        {/* Danh sách nhân sự: Hỗ trợ cả Role 6A và Role 6B */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Phân Công Nhân Sự Thực Hiện Hàng Ngày</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Đã chọn: <strong className="text-emerald-700">{formData.selectedEmployeeIds.length}</strong> người
            </span>
          </div>

          {errors.assignees && (
            <p className="text-xs font-medium text-rose-600">{errors.assignees}</p>
          )}

          <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 p-1">
            {activeEmployees.map((emp) => {
              const isSelected = formData.selectedEmployeeIds.includes(emp.id);
              const isLeader = String(emp.id) === String(formData.leaderEmployeeId);
              const hasAccount = Boolean(emp.userId);

              return (
                <div
                  key={emp.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors ${
                    isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleEmployee(emp.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate">{emp.fullName}</span>
                        {hasAccount ? (
                          <span className="rounded bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2">
                            Có App (Role 6A)
                          </span>
                        ) : (
                          <span className="rounded bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2">
                            Thời vụ (Role 6B)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {emp.employeeCode} • {emp.position || 'Nhân viên'}
                      </span>
                    </div>
                  </label>

                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, leaderEmployeeId: String(emp.id) })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                        isLeader
                          ? 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400/40'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isLeader ? '★ TRƯỞNG NHÓM (LEADER)' : 'Chọn làm Trưởng nhóm'}
                    </button>
                  )}
                </div>
              );
            })}
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
            loadingText="Đang lưu việc cố định..."
          >
            {isEditing ? 'Lưu Thay Đổi Phân Công' : 'Xác Nhận Thiết Lập Việc Cố Định'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default RoutineTaskModal;
