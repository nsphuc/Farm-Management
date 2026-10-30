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
import { useAuthStore } from '@/store/useAuthStore';

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
  assignments = [],
  initialData = null,
  editingTask = null,
}) {
  const isEditing = Boolean(editingTask);
  const targetFarmId = farmId || editingTask?.farmId;
  const { activeFarmType, farms } = useActiveFarmStore();
  const { userInfo, isOwner, isFarmManager, getManagedZoneIds } = useAuthStore();

  const currentFarmType = (targetFarmId ? farms.find((f) => Number(f.id || f.farmId) === Number(targetFarmId))?.farmType : null) || activeFarmType || 'MIXED';

  // 1. Xác định quyền hạn: Toàn trại hay Giới hạn theo phân khu (Zone Manager / Tech Lead)
  const isManagerOrOwner = isOwner() || isFarmManager(targetFarmId);
  const rawManagedZoneIds = getManagedZoneIds ? getManagedZoneIds(targetFarmId) : null;
  const userAssignments = (assignments || []).filter((a) =>
    a.isActive !== false &&
    Number(a.userId) === Number(userInfo?.id) &&
    ['ZONE_MANAGER', 'TECHNICAL_LEAD'].includes(a.roleInFarm) &&
    a.zoneId
  );
  const extraZoneIds = userAssignments.map((a) => Number(a.zoneId));
  const managedZoneIds = isManagerOrOwner
    ? null
    : Array.from(new Set([...(rawManagedZoneIds || []), ...extraZoneIds]));
  const isZoneRestricted = managedZoneIds !== null;

  // 2. Danh sách phân khu được phép chọn
  const availableZones = React.useMemo(() => {
    if (!isZoneRestricted) return zones;
    return zones.filter((z) => managedZoneIds.includes(Number(z.id)));
  }, [zones, isZoneRestricted, managedZoneIds]);

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
  const [filterBySelectedZone, setFilterBySelectedZone] = useState(true);

  // Helper: Kiểm tra nhân sự có thuộc phân khu targetZoneId không
  const isEmployeeInZone = React.useCallback((emp, targetZoneId) => {
    if (!targetZoneId) return true;
    const tid = Number(targetZoneId);

    // a) Khớp assignedZoneId hoặc zoneId trên hồ sơ nhân viên
    if (emp.assignedZoneId && Number(emp.assignedZoneId) === tid) return true;
    if (emp.zoneId && Number(emp.zoneId) === tid) return true;

    // b) Khớp trong danh sách phân công farm_assignments (kể cả có hoặc không có tài khoản)
    if (assignments && assignments.length > 0) {
      const hasZoneAssign = assignments.some((a) => {
        if (a.isActive === false || Number(a.zoneId) !== tid) return false;
        return (
          (a.employeeId && Number(a.employeeId) === Number(emp.id)) ||
          (emp.userId && a.userId && Number(a.userId) === Number(emp.userId)) ||
          (emp.employeeCode && a.employeeCode === emp.employeeCode)
        );
      });
      if (hasZoneAssign) return true;
    }

    // c) Khớp qua phòng ban (department) của nhân viên/công nhân hiện trường
    const targetZoneObj = zones.find((z) => Number(z.id) === tid);
    if (targetZoneObj && emp.department) {
      const dept = emp.department.trim().toLowerCase();
      const zName = targetZoneObj.name.trim().toLowerCase();
      if (dept.includes(zName) || zName.includes(dept)) return true;
    }

    // d) Bản thân Zone Manager phụ trách tạo nhiệm vụ
    if (userInfo?.id && emp.userId && Number(emp.userId) === Number(userInfo.id)) {
      return true;
    }

    return false;
  }, [assignments, zones, userInfo?.id]);

  // Danh sách nhân sự được phép phân công (lọc nhân viên ACTIVE và phân khu)
  const assignableEmployees = React.useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
    const effectiveZoneId = formData.zoneId;

    if (isZoneRestricted) {
      // Zone Manager: Bắt buộc CHỈ được thấy nhân sự thuộc phân khu phụ trách
      if (!effectiveZoneId) return [];
      return activeEmployees.filter((emp) => isEmployeeInZone(emp, effectiveZoneId));
    }

    // Cấp Quản lý Farm (Owner / Farm Manager): Lọc theo toggle
    if (filterBySelectedZone && effectiveZoneId) {
      return activeEmployees.filter((emp) => isEmployeeInZone(emp, effectiveZoneId));
    }

    return activeEmployees;
  }, [employees, formData.zoneId, isZoneRestricted, filterBySelectedZone, isEmployeeInZone]);

  useEffect(() => {
    if (isOpen) {
      let defaultZone = '';
      if (isZoneRestricted) {
        if (availableZones.length > 0) {
          defaultZone = String(availableZones[0].id);
        }
      } else {
        defaultZone = zones[0]?.id ? String(zones[0].id) : '';
      }

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

        const taskZoneId = editingTask.zoneId ? String(editingTask.zoneId) : defaultZone;

        setFormData({
          zoneId: isZoneRestricted && !availableZones.some((z) => String(z.id) === taskZoneId) ? defaultZone : taskZoneId,
          taskTitle: editingTask.taskTitle || '',
          taskType: editingTask.taskType || defaultTaskType,
          priority: editingTask.priority || 'MEDIUM',
          deadline: deadlineFormatted || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
          completionNotes: editingTask.completionNotes || '',
          selectedEmployeeIds: assignedIds,
          leaderEmployeeId: leaderId,
        });
      } else if (initialData) {
        const initZoneId = initialData.zoneId ? String(initialData.zoneId) : defaultZone;
        const validZoneId = isZoneRestricted && !availableZones.some((z) => String(z.id) === initZoneId) ? defaultZone : initZoneId;
        const initialZoneStaff = employees.filter((e) => e.status === 'ACTIVE' && isEmployeeInZone(e, validZoneId));

        setFormData({
          zoneId: validZoneId,
          taskTitle: initialData.taskTitle || '',
          taskType: initialData.taskType || defaultTaskType,
          priority: initialData.priority || 'MEDIUM',
          deadline: initialData.deadline || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
          completionNotes: initialData.completionNotes || '',
          selectedEmployeeIds: initialData.selectedEmployeeIds || (initialZoneStaff[0]?.id ? [initialZoneStaff[0].id] : []),
          leaderEmployeeId: initialData.leaderEmployeeId || (initialZoneStaff[0]?.id ? String(initialZoneStaff[0].id) : ''),
        });
      } else {
        const initialZoneStaff = employees.filter((e) => e.status === 'ACTIVE' && isEmployeeInZone(e, defaultZone));

        setFormData({
          zoneId: defaultZone,
          taskTitle: '',
          taskType: defaultTaskType,
          priority: 'MEDIUM',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          completionNotes: '',
          selectedEmployeeIds: initialZoneStaff[0]?.id ? [initialZoneStaff[0].id] : [],
          leaderEmployeeId: initialZoneStaff[0]?.id ? String(initialZoneStaff[0].id) : '',
        });
      }

      setErrors({});
      if (isZoneRestricted && availableZones.length === 0) {
        setGeneralError('Bạn chưa được phân công phụ trách phân khu nào tại trang trại này. Vui lòng liên hệ Quản lý trang trại để được bổ nhiệm.');
      } else {
        setGeneralError(null);
      }
    }
  }, [isOpen, editingTask, initialData, zones, availableZones, employees, defaultTaskType, isZoneRestricted, isEmployeeInZone]);

  // Xử lý khi đổi phân khu: tự động cập nhật danh sách nhân sự nếu là Zone Manager
  const handleZoneChange = (newZoneId) => {
    setFormData((prev) => {
      const updated = { ...prev, zoneId: newZoneId };
      if (isZoneRestricted) {
        // Lọc lại nhân sự thuộc zone mới
        const validStaff = employees.filter((e) => e.status === 'ACTIVE' && isEmployeeInZone(e, newZoneId));
        const retainedIds = prev.selectedEmployeeIds.filter((id) => validStaff.some((s) => s.id === id));
        updated.selectedEmployeeIds = retainedIds.length > 0 ? retainedIds : (validStaff[0]?.id ? [validStaff[0].id] : []);
        updated.leaderEmployeeId = updated.selectedEmployeeIds.length > 0 ? String(updated.selectedEmployeeIds[0]) : '';
      }
      return updated;
    });
  };

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
    if (isZoneRestricted && !formData.zoneId) {
      errs.zoneId = 'Bắt buộc chọn phân khu phụ trách';
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

          <FormField
            label={isZoneRestricted ? "Phân Khu Phụ Trách *" : "Phân Khu Thực Hiện"}
            error={errors.zoneId}
          >
            <Select
              value={formData.zoneId}
              onChange={(e) => handleZoneChange(e.target.value)}
              placeholder={isZoneRestricted ? "-- Chọn phân khu phụ trách --" : "-- Chọn phân khu --"}
            >
              {availableZones.length === 0 ? (
                <option value="" disabled>
                  -- Không có phân khu phụ trách --
                </option>
              ) : (
                availableZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </option>
                ))
              )}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Thành Viên Phân Công</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>

            <div className="flex items-center gap-3">
              {!isZoneRestricted && formData.zoneId && (
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterBySelectedZone}
                    onChange={(e) => setFilterBySelectedZone(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Chỉ hiện nhân sự thuộc phân khu</span>
                </label>
              )}
              <span className="text-[11px] text-slate-500">
                Đã chọn: <strong className="text-emerald-700">{formData.selectedEmployeeIds.length}</strong> người
              </span>
            </div>
          </div>

          {/* Ghi chú phạm vi phân công */}
          {isZoneRestricted && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50/80 border border-blue-200 p-2 text-xs text-blue-800">
              <ShieldAlert className="h-4 w-4 shrink-0 text-blue-600" />
              <span>
                Giới hạn quyền hạn: Bạn chỉ được phân công cho nhân sự thuộc phân khu phụ trách{' '}
                <strong>
                  {availableZones.find((z) => String(z.id) === String(formData.zoneId))?.name || 'đã chọn'}
                </strong>.
              </span>
            </div>
          )}

          {errors.assignees && (
            <p className="text-xs font-medium text-rose-600">{errors.assignees}</p>
          )}

          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 p-1">
            {assignableEmployees.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {formData.zoneId
                  ? 'Phân khu này chưa có nhân sự nào được phân công trực thuộc. Hãy báo Giám đốc trang trại để phân công công nhân vào phân khu này.'
                  : 'Vui lòng chọn phân khu để hiển thị danh sách nhân sự phụ trách.'}
              </div>
            ) : (
              assignableEmployees.map((emp) => {
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
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 block truncate">{emp.fullName}</span>
                          {!emp.userId && (
                            <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 border border-amber-300">
                              Lao động không tài khoản
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {emp.employeeCode} • {emp.position || 'Nhân viên'} {emp.department ? `(${emp.department})` : ''}
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
              })
            )}
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
