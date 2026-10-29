import React, { useState, useEffect } from 'react';
import { Plus, Save, AlertCircle, CheckSquare, Users, ShieldAlert, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { hrService } from '@/services/modules/hrService';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { toast } from '@/store/useToastStore';

import { useActiveFarmStore } from '@/store/useActiveFarmStore';

const TASK_TYPES = [
  { value: 'PLANTING', label: 'Gieo trồng / Cấy giống (PLANTING)' },
  { value: 'FERTILIZING', label: 'Bón phân / Dinh dưỡng (FERTILIZING)' },
  { value: 'HARVESTING', label: 'Thu hoạch nông sản (HARVESTING)' },
  { value: 'FEEDING', label: 'Cho ăn / Chăm sóc đàn (FEEDING)' },
  { value: 'MAINTENANCE', label: 'Bảo trì máy móc / Nhà màng (MAINTENANCE)' },
  { value: 'SANITATION', label: 'Vệ sinh chuồng / Khử trùng (SANITATION)' },
];

const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Thấp (LOW)' },
  { value: 'MEDIUM', label: 'Bình thường (MEDIUM)' },
  { value: 'HIGH', label: 'Ưu tiên cao (HIGH)' },
  { value: 'URGENT', label: 'Khẩn cấp (URGENT)' },
];

export function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  zones = [],
  employees = [],
  initialData = null,
  editingTask = null,
}) {
  const isEditing = Boolean(editingTask);
  const { activeFarmType, farms } = useActiveFarmStore();
  const currentFarmType = (farmId ? farms.find((f) => Number(f.id || f.farmId) === Number(farmId))?.farmType : null) || activeFarmType || 'MIXED';

  const availableTaskTypes = React.useMemo(() => {
    if (currentFarmType === 'CROP') {
      return TASK_TYPES.filter((t) => t.value !== 'FEEDING');
    }
    if (currentFarmType === 'LIVESTOCK') {
      return TASK_TYPES.filter((t) => t.value !== 'PLANTING' && t.value !== 'FERTILIZING');
    }
    return TASK_TYPES;
  }, [currentFarmType]);

  const defaultTaskType = currentFarmType === 'LIVESTOCK' ? 'FEEDING' : 'FERTILIZING';

  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');

  const [formData, setFormData] = useState({
    zoneId: '',
    taskTitle: '',
    taskType: defaultTaskType,
    priority: 'MEDIUM',
    deadline: '',
    completionNotes: '',
    selectedEmployeeIds: [],
    leaderEmployeeId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        const assignedIds = (editingTask.assignees && editingTask.assignees.length > 0)
          ? editingTask.assignees.map((a) => a.employeeId)
          : (editingTask.assignedToEmployeeId ? [editingTask.assignedToEmployeeId] : []);
        const leaderId = editingTask.assignedToEmployeeId
          ? String(editingTask.assignedToEmployeeId)
          : (editingTask.assignees?.find((a) => a.roleInTask === 'LEADER')?.employeeId
              ? String(editingTask.assignees.find((a) => a.roleInTask === 'LEADER').employeeId)
              : (assignedIds[0] ? String(assignedIds[0]) : ''));

        let deadlineFormatted = '';
        if (editingTask.deadline) {
          try {
            deadlineFormatted = new Date(editingTask.deadline).toISOString().slice(0, 16);
          } catch {
            deadlineFormatted = '';
          }
        }

        setFormData({
          zoneId: editingTask.zoneId ? String(editingTask.zoneId) : (zones[0]?.id ? String(zones[0].id) : ''),
          taskTitle: editingTask.taskTitle || '',
          taskType: editingTask.taskType || defaultTaskType,
          priority: editingTask.priority || 'MEDIUM',
          deadline: deadlineFormatted || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
          completionNotes: editingTask.completionNotes || '',
          selectedEmployeeIds: assignedIds,
          leaderEmployeeId: leaderId,
        });
      } else if (initialData) {
        setFormData({
          zoneId: initialData.zoneId ? String(initialData.zoneId) : (zones[0]?.id ? String(zones[0].id) : ''),
          taskTitle: initialData.taskTitle || '',
          taskType: initialData.taskType || defaultTaskType,
          priority: initialData.priority || 'MEDIUM',
          deadline: initialData.deadline || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
          completionNotes: initialData.completionNotes || '',
          selectedEmployeeIds: initialData.selectedEmployeeIds || (activeEmployees[0]?.id ? [activeEmployees[0].id] : []),
          leaderEmployeeId: initialData.leaderEmployeeId || (activeEmployees[0]?.id ? String(activeEmployees[0].id) : ''),
        });
      } else {
        setFormData({
          zoneId: zones[0]?.id ? String(zones[0].id) : '',
          taskTitle: '',
          taskType: defaultTaskType,
          priority: 'MEDIUM',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          completionNotes: '',
          selectedEmployeeIds: activeEmployees[0]?.id ? [activeEmployees[0].id] : [],
          leaderEmployeeId: activeEmployees[0]?.id ? String(activeEmployees[0].id) : '',
        });
      }
      setErrors({});
      setGeneralError(null);
    }
  }, [isOpen, editingTask, initialData, zones, employees, defaultTaskType]);

  const handleToggleEmployee = (empId) => {
    setFormData((prev) => {
      const exists = prev.selectedEmployeeIds.includes(empId);
      let updated;
      if (exists) {
        updated = prev.selectedEmployeeIds.filter((id) => id !== empId);
      } else {
        updated = [...prev.selectedEmployeeIds, empId];
      }

      // If removed leader, reset leader to first available
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
    if (!formData.taskTitle?.trim()) {
      errs.taskTitle = 'Tiêu đề nhiệm vụ không được để trống';
    }
    if (!formData.deadline) {
      errs.deadline = 'Hạn chót không được để trống';
    }
    if (formData.selectedEmployeeIds.length === 0) {
      errs.assignees = 'Cần phân công ít nhất 1 nhân viên thực hiện';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const targetFarmId = farmId || editingTask?.farmId;
    if (!targetFarmId || targetFarmId === 'ALL' || Number.isNaN(Number(targetFarmId))) {
      setGeneralError('Vui lòng chọn trang trại cụ thể để thực hiện giao việc');
      return;
    }

    try {
      setIsSubmitting(true);
      setGeneralError(null);

      const assigneesPayload = formData.selectedEmployeeIds.map((empId) => ({
        employeeId: empId,
        roleInTask: String(empId) === String(formData.leaderEmployeeId) ? 'LEADER' : 'MEMBER',
      }));

      const payload = {
        zoneId: formData.zoneId ? Number(formData.zoneId) : null,
        taskTitle: formData.taskTitle.trim(),
        taskType: formData.taskType,
        priority: formData.priority,
        deadline: new Date(formData.deadline).toISOString(),
        assignedToEmployeeId: formData.leaderEmployeeId ? Number(formData.leaderEmployeeId) : null,
        completionNotes: formData.completionNotes?.trim() || null,
        assignees: assigneesPayload,
      };

      if (isEditing) {
        await hrService.updateTask(targetFarmId, editingTask.id, payload);
        toast.success('Đã cập nhật nhiệm vụ hiện trường thành công!');
      } else {
        await hrService.createTask(targetFarmId, payload);
        toast.success('Đã giao nhiệm vụ hiện trường thành công!');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Save task error:', err);
      const msg = applyServerFieldErrors(err, setErrors);
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={isEditing ? 'Chỉnh Sửa Nhiệm Vụ Hiện Trường' : 'Giao Nhiệm Vụ Hiện Trường Mới'}
      subtitle={isEditing ? 'Cập nhật nội dung công việc, phân khu, ưu tiên hoặc nhân sự phụ trách' : 'Phân công công việc, chỉ tiêu kỹ thuật & hạn chót cho nhân sự'}
      icon={isEditing ? <Pencil className="h-5 w-5 text-blue-600" /> : <CheckSquare className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        <FormField label="Tiêu Đề Nhiệm Vụ" required error={errors.taskTitle}>
          <Input
            value={formData.taskTitle}
            onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
            placeholder="VD: Bón phân NPK Haifa cho nhà màng Dưa lưới N01"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <FormField label="Loại Công Việc" required>
            <Select
              value={formData.taskType}
              onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
              options={availableTaskTypes}
            />
          </FormField>

          <FormField label="Mức Độ Ưu Tiên" required>
            <Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={TASK_PRIORITIES}
            />
          </FormField>

          <FormField label="Phân Khu Thực Hiện">
            <Select
              value={formData.zoneId}
              onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
              placeholder="-- Chọn phân khu --"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Hạn Chót Hoàn Thành (Deadline)" required error={errors.deadline}>
          <Input
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </FormField>

        <FormField label="Chỉ Tiêu Kỹ Thuật / Hướng Dẫn Thực Hiện" error={errors.completionNotes}>
          <Textarea
            rows={2}
            value={formData.completionNotes}
            onChange={(e) => setFormData({ ...formData, completionNotes: e.target.value })}
            placeholder="VD: Sử dụng 50kg phân vi sinh pha tỷ lệ 1:200, hoàn thành trước 11h trưa..."
          />
        </FormField>

        {/* Phân công nhân sự: Chọn danh sách & Leader */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Thành Viên Phân Công (Lọc nhân viên ACTIVE)</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Đã chọn: <strong className="text-emerald-700">{formData.selectedEmployeeIds.length}</strong> người
            </span>
          </div>

          {errors.assignees && (
            <p className="text-xs font-medium text-rose-600">{errors.assignees}</p>
          )}

          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 p-1">
            {activeEmployees.map((emp) => {
              const isSelected = formData.selectedEmployeeIds.includes(emp.id);
              const isLeader = String(emp.id) === String(formData.leaderEmployeeId);

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
                      <span className="font-bold text-slate-900 block truncate">{emp.fullName}</span>
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
                      {isLeader ? '★ TRƯỞNG NHÓM (LEADER)' : 'Đặt làm Trưởng nhóm'}
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
          <Can permission="PERM_TASK_ASSIGN" role={['ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF']} farmRole={['FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD', 'WAREHOUSE_KEEPER']}>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Save className="h-4 w-4" />}
              isLoading={isSubmitting}
              loadingText={isEditing ? 'Đang lưu thay đổi...' : 'Đang giao việc...'}
            >
              {isEditing ? 'Lưu Thay Đổi Nhiệm Vụ' : 'Xác Nhận Giao Nhiệm Vụ'}
            </Button>
          </Can>
        </div>
      </form>
    </Modal>
  );
}

export default CreateTaskModal;
