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

const FARM_MANAGER_ROLES = [
  { value: 'ZONE_MANAGER', label: 'ZONE_MANAGER - Trưởng Phân Khu / Trưởng Nhà Màng' },
  { value: 'TECHNICAL_LEAD', label: 'TECHNICAL_LEAD - Trưởng Bộ Phận Kỹ Thuật' },
  { value: 'WAREHOUSE_KEEPER', label: 'WAREHOUSE_KEEPER - Thủ Kho Trang Trại' },
  { value: 'ACCOUNTANT', label: 'ACCOUNTANT - Kế Toán Trang Trại' },
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
  employees = [],
  onSuccess,
}) {
  const navigate = useNavigate();
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
    roleInFarm: availableRoles[0]?.value || 'FIELD_WORKER',
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
    const defaultRole = availableRoles[0]?.value || (zoneId ? 'ZONE_MANAGER' : 'FIELD_WORKER');
    setFormData({
      userId: employees[0]?.userId || employees[0]?.id || '',
      roleInFarm: defaultRole,
      assignedFrom: new Date().toISOString().substring(0, 10),
      assignedTo: '',
    });
  }, [isOpen, zoneId, employees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.userId) errors.userId = 'Vui lòng chọn nhân sự để phân công';
    if (!formData.assignedFrom) errors.assignedFrom = 'Ngày bắt đầu phân công không được để trống';
    if (formData.assignedTo && formData.assignedTo < formData.assignedFrom) {
      errors.assignedTo = 'Ngày kết thúc phân công phải lớn hơn hoặc bằng ngày bắt đầu';
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
        zoneId: zoneId ? Number(zoneId) : null,
        userId: Number(formData.userId),
        roleInFarm: formData.roleInFarm,
        assignedFrom: formData.assignedFrom,
        assignedTo: formData.assignedTo || null,
      };

      await geographyService.createAssignment(farmId, payload);
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
      title="Phân Công Nhân Sự Hiện Trường"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSubmit}>
            Xác Nhận Phân Công
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

        <FormField label="Nhân Sự Phụ Trách" required error={fieldErrors.userId}>
          {employees.length === 0 ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 space-y-2">
              <p>Chưa có hồ sơ nhân sự nào thuộc trang trại này.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                onClick={() => {
                  onClose();
                  navigate('/app/hr');
                }}
              >
                + Tiếp Nhận Nhân Sự Mới (Workspace B)
              </Button>
            </div>
          ) : (
            <Select
              value={formData.userId}
              onChange={(e) => setFormData((prev) => ({ ...prev, userId: e.target.value }))}
              options={[
                { value: '', label: '-- Chọn nhân sự --' },
                ...employees.map((emp) => ({
                  value: String(emp.userId || emp.id),
                  label: `${emp.fullName} (${emp.employeeCode || 'NV'} - ${emp.position || 'Nhân viên'})`,
                })),
              ]}
            />
          )}
        </FormField>

        <FormField label="Vai Trò Tại Hiện Trường (Phân cấp vận hành)" required error={fieldErrors.roleInFarm} hint={roleHelperText}>
          <Select
            value={formData.roleInFarm}
            onChange={(e) => setFormData((prev) => ({ ...prev, roleInFarm: e.target.value }))}
            options={availableRoles}
          />
        </FormField>

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
