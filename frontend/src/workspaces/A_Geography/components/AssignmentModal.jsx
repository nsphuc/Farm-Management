import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import { geographyService } from '@/services/modules/geographyService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { extractApiErrors } from '@/utils/apiHelpers';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';

const FARM_MANAGER_ROLES = [
  { value: 'ZONE_MANAGER', label: 'ZONE_MANAGER - Trưởng Phân Khu / Trưởng Nhà Màng / Trưởng Khu Chuồng' },
  { value: 'TECHNICAL_LEAD', label: 'TECHNICAL_LEAD - Trưởng Bộ Phận Kỹ Thuật' },
  { value: 'WAREHOUSE_KEEPER', label: 'WAREHOUSE_KEEPER - Thủ Kho Chính Của Trại' },
  { value: 'ACCOUNTANT', label: 'ACCOUNTANT - Kế Toán Phụ Trách Trại' },
];

const TECH_LEAD_ROLES = [
  { value: 'AGRONOMIST', label: 'AGRONOMIST - Kỹ Sư Nông Nghiệp / Trồng Trọt' },
  { value: 'VETERINARIAN', label: 'VETERINARIAN - Bác Sĩ Thú Y / Chăn Nuôi' },
  { value: 'FIELD_WORKER', label: 'FIELD_WORKER - Công Nhân Canh Tác / Nuôi Trồng' },
];

const WAREHOUSE_ROLES = [
  { value: 'FIELD_WORKER', label: 'FIELD_WORKER - Nhân Viên Bốc Xếp / Phụ Kho' },
];

const ALL_ROLES = [
  { value: 'FARM_MANAGER', label: 'FARM_MANAGER - Giám Đốc / Quản Lý Trang Trại' },
  { value: 'ZONE_MANAGER', label: 'ZONE_MANAGER - Trưởng Phân Khu / Trưởng Nhà Màng' },
  { value: 'TECHNICAL_LEAD', label: 'TECHNICAL_LEAD - Trưởng Bộ Phận Kỹ Thuật' },
  { value: 'ACCOUNTANT', label: 'ACCOUNTANT - Kế Toán Trang Trại' },
  { value: 'WAREHOUSE_KEEPER', label: 'WAREHOUSE_KEEPER - Thủ Kho Vật Tư / Nông Sản' },
  { value: 'AGRONOMIST', label: 'AGRONOMIST - Kỹ Sư Nông Nghiệp / Trồng Trọt' },
  { value: 'VETERINARIAN', label: 'VETERINARIAN - Bác Sĩ Thú Y / Chăn Nuôi' },
  { value: 'FIELD_WORKER', label: 'FIELD_WORKER - Công Nhân Nông Nghiệp Hiện Trường' },
];

export function AssignmentModal({
  isOpen,
  onClose,
  farmId,
  zoneId = null,
  farmName = '',
  zoneName = '',
  zones = [],
  employees = [],
  editingAssignment = null,
  onSuccess,
}) {
  const navigate = useNavigate();
  const { notifyDataChanged } = useActiveFarmStore();
  const { isOwner, isFarmManager, isTechnicalLead, isWarehouseKeeper } = useAuthStore();
  const owner = isOwner();
  const farmManager = isFarmManager();
  const techLead = isTechnicalLead();
  const whKeeper = isWarehouseKeeper();

  let availableRoles = ALL_ROLES;
  let roleHelperText = 'Chọn vai trò phụ trách phù hợp với vị trí công việc.';

  if (farmManager && !owner) {
    availableRoles = FARM_MANAGER_ROLES;
    roleHelperText = 'Phân công Cấp 1 (Quản lý trại): Bổ nhiệm Trưởng Phân Khu, Trưởng Kỹ Thuật, Thủ Kho hoặc Kế Toán Trại.';
  } else if (techLead && !owner) {
    availableRoles = TECH_LEAD_ROLES;
    roleHelperText = 'Phân công Cấp 2 (Kỹ thuật/Trưởng khu): Phân công kỹ sư nông nghiệp hoặc công nhân canh tác tại phân khu.';
  } else if (whKeeper && !owner) {
    availableRoles = WAREHOUSE_ROLES;
    roleHelperText = 'Phân công Cấp 2 (Kho): Phân công nhân sự bốc xếp / phụ kho.';
  }

  const [formData, setFormData] = useState({
    userId: '',
    roleInFarm: availableRoles[0]?.value || 'ZONE_MANAGER',
    selectedZoneId: '',
    assignedFrom: new Date().toISOString().substring(0, 10),
    assignedTo: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setGeneralError('');

    if (editingAssignment) {
      setFormData({
        userId: String(editingAssignment.userId || ''),
        roleInFarm: editingAssignment.roleInFarm || availableRoles[0]?.value || 'ZONE_MANAGER',
        selectedZoneId: editingAssignment.zoneId ? String(editingAssignment.zoneId) : (zoneId ? String(zoneId) : ''),
        assignedFrom: editingAssignment.assignedFrom || new Date().toISOString().substring(0, 10),
        assignedTo: editingAssignment.assignedTo || '',
      });
    } else {
      const defaultRole = availableRoles[0]?.value || (zoneId ? 'ZONE_MANAGER' : 'TECHNICAL_LEAD');
      setFormData({
        userId: employees[0]?.userId || employees[0]?.id || '',
        roleInFarm: defaultRole,
        selectedZoneId: zoneId ? String(zoneId) : '',
        assignedFrom: new Date().toISOString().substring(0, 10),
        assignedTo: '',
      });
    }
  }, [isOpen, zoneId, employees, editingAssignment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.userId) errors.userId = 'Vui lòng chọn nhân sự để phân công';
    if (!formData.assignedFrom) errors.assignedFrom = 'Ngày bắt đầu phân công không được để trống';
    if (formData.assignedTo && formData.assignedTo < formData.assignedFrom) {
      errors.assignedTo = 'Ngày kết thúc phân công phải lớn hơn hoặc bằng ngày bắt đầu';
    }

    const effectiveZoneId = zoneId || formData.selectedZoneId;
    if (formData.roleInFarm === 'ZONE_MANAGER' && !effectiveZoneId) {
      errors.selectedZoneId = 'Vai trò Trưởng Phân Khu bắt buộc phải chọn phân khu phụ trách';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const payload = {
        zoneId: effectiveZoneId ? Number(effectiveZoneId) : null,
        userId: Number(formData.userId),
        roleInFarm: formData.roleInFarm,
        assignedFrom: formData.assignedFrom,
        assignedTo: formData.assignedTo || null,
      };

      if (editingAssignment?.id) {
        await geographyService.deleteAssignment(farmId, editingAssignment.id);
      }
      await geographyService.createAssignment(farmId, payload);

      toast.success(
        editingAssignment
          ? 'Đã cập nhật thay đổi người phụ trách thành công!'
          : 'Đã hoàn tất phân công nhân sự hiện trường!'
      );

      notifyDataChanged?.('zones');
      notifyDataChanged?.('employees');
      onSuccess?.();
      onClose();
    } catch (err) {
      const errMsg = applyServerFieldErrors(err, setFieldErrors);
      setGeneralError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingAssignment
          ? 'Thay Đổi Người Phụ Trách / Cập Nhật Phân Công'
          : farmManager
          ? 'Phân Công Trưởng Phân Khu / Phụ Trách Bộ Phận'
          : 'Phân Công Nhân Sự Hiện Trường'
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSubmit}>
            {editingAssignment ? 'Xác Nhận Thay Đổi' : 'Xác Nhận Phân Công'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Thông tin ngữ cảnh tự động điền */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Trang trại:</span>
            <strong className="text-slate-900">{farmName || `#${farmId}`}</strong>
          </div>
          {zoneId && (
            <div className="flex justify-between text-slate-600">
              <span>Phân khu phụ trách:</span>
              <strong className="text-blue-700">{zoneName || `#${zoneId}`}</strong>
            </div>
          )}
        </div>

        <FormField label="Nhân Sự Phụ Trách (Cán bộ nhân viên của trại)" required error={fieldErrors.userId}>
          {employees.length === 0 ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-800 space-y-2.5">
              <p className="font-medium">
                Hiện tại trang trại chưa có hồ sơ nhân sự nào đang hoạt động (ACTIVE).
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  onClose();
                  navigate('/app/hr');
                }}
              >
                [👉 Sang WS-B Tuyển Nhân Sự Mới]
              </Button>
            </div>
          ) : (
            <Select
              value={formData.userId}
              onChange={(e) => setFormData((prev) => ({ ...prev, userId: e.target.value }))}
              options={[
                { value: '', label: '-- Chọn nhân sự thuộc trang trại --' },
                ...employees.map((emp) => ({
                  value: String(emp.userId || emp.id),
                  label: `${emp.fullName} (${emp.employeeCode || 'NV'} - ${emp.position || 'Nhân viên'})`,
                })),
              ]}
            />
          )}
        </FormField>

        <FormField label="Vai Trò Phụ Trách Chính (Phân cấp điều hành)" required error={fieldErrors.roleInFarm} hint={roleHelperText}>
          <Select
            value={formData.roleInFarm}
            onChange={(e) => setFormData((prev) => ({ ...prev, roleInFarm: e.target.value }))}
            options={availableRoles}
          />
        </FormField>

        {formData.roleInFarm === 'ZONE_MANAGER' && !zoneId && (
          <FormField
            label="Phân Khu Phụ Trách"
            required
            error={fieldErrors.selectedZoneId}
            hint="Trưởng Phân Khu bắt buộc phải gắn trực tiếp với 1 phân khu cụ thể"
          >
            <Select
              value={formData.selectedZoneId}
              onChange={(e) => setFormData((prev) => ({ ...prev, selectedZoneId: e.target.value }))}
              options={[
                { value: '', label: '-- Chọn phân khu trong trại --' },
                ...zones.map((z) => ({
                  value: String(z.id),
                  label: `${z.name} (${z.code} - ${z.zoneType})`,
                })),
              ]}
            />
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ngày Bắt Đầu Phụ Trách" required error={fieldErrors.assignedFrom}>
            <Input
              type="date"
              value={formData.assignedFrom}
              onChange={(e) => setFormData((prev) => ({ ...prev, assignedFrom: e.target.value }))}
            />
          </FormField>

          <FormField label="Ngày Kết Thúc (Tùy chọn)" error={fieldErrors.assignedTo}>
            <Input
              type="date"
              value={formData.assignedTo}
              onChange={(e) => setFormData((prev) => ({ ...prev, assignedTo: e.target.value }))}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
export default AssignmentModal;
