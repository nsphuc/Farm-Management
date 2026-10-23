import React, { useState, useEffect } from 'react';
import { Building, AlertTriangle } from 'lucide-react';
import { geographyService } from '@/services/modules/geographyService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea, CodeInput } from '@/components/ui/FormControls';
import { extractApiErrors } from '@/utils/apiHelpers';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { useAuthStore } from '@/store/useAuthStore';

const FARM_TYPES = [
  { value: 'CROP', label: 'CROP - Chuyên Trồng Trọt' },
  { value: 'LIVESTOCK', label: 'LIVESTOCK - Chuyên Chăn Nuôi' },
  { value: 'MIXED', label: 'MIXED - Nông Nghiệp Kết Hợp (Vườn - Ao - Chuồng)' },
  { value: 'AQUACULTURE', label: 'AQUACULTURE - Chuyên Thủy Hải Sản' },
];

export function FarmFormModal({
  isOpen,
  onClose,
  editingItem = null,
  employees = [],
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    farmType: 'MIXED',
    totalAreaM2: 10000,
    latitude: 10.7725,
    longitude: 106.6812,
    geofenceRadiusM: 300,
    address: '',
    managerUserId: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setGeneralError('');

    if (editingItem) {
      setFormData({
        code: editingItem.code || '',
        name: editingItem.name || '',
        farmType: editingItem.farmType || 'MIXED',
        totalAreaM2: editingItem.totalAreaM2 ?? 10000,
        latitude: editingItem.latitude ?? 10.7725,
        longitude: editingItem.longitude ?? 106.6812,
        geofenceRadiusM: editingItem.geofenceRadiusM ?? 300,
        address: editingItem.address || '',
        managerUserId: editingItem.managerUserId ? String(editingItem.managerUserId) : '',
      });
    } else {
      setFormData({
        code: generateEntityCode(CODE_PREFIXES.FARM),
        name: '',
        farmType: 'MIXED',
        totalAreaM2: 10000,
        latitude: 10.7725,
        longitude: 106.6812,
        geofenceRadiusM: 300,
        address: '',
        managerUserId: '',
      });
    }
  }, [isOpen, editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Mã trang trại không được để trống';
    if (!formData.name.trim()) errors.name = 'Tên trang trại không được để trống';
    if (Number(formData.totalAreaM2) <= 0) errors.totalAreaM2 = 'Tổng diện tích phải lớn hơn 0 m²';
    if (Number(formData.geofenceRadiusM) < 1) errors.geofenceRadiusM = 'Bán kính Geofence tối thiểu 1 mét';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        totalAreaM2: Number(formData.totalAreaM2),
        latitude: formData.latitude !== '' ? Number(formData.latitude) : null,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : null,
        geofenceRadiusM: Number(formData.geofenceRadiusM),
        managerUserId: formData.managerUserId ? Number(formData.managerUserId) : null,
      };

      if (editingItem) {
        await geographyService.updateFarm(editingItem.id, payload);
      } else {
        await geographyService.createFarm(payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const errMsg = applyServerFieldErrors(err, setFieldErrors);
      setGeneralError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const { isOwner, isFarmManager } = useAuthStore();
  const owner = isOwner();
  const farmManager = isFarmManager();
  const isRestrictedManager = farmManager && !owner;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? (isRestrictedManager ? 'Cập Nhật Thông Số Trang Trại' : 'Chỉnh Sửa Thông Tin Trang Trại') : 'Thêm Mới Trang Trại'}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSubmit}>
            {editingItem ? 'Lưu Thay Đổi' : 'Tạo Trang Trại'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRestrictedManager && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <span className="font-bold">Quyền hạn Giám Đốc Trang Trại:</span>
              <p className="mt-0.5 text-blue-800">
                Bạn chỉ có quyền cập nhật tên, loại hình, tọa độ GPS, bán kính geofence và địa chỉ chi tiết. Mã định danh và tổng diện tích trang trại được khóa cố định theo hồ sơ Chủ đầu tư (Owner).
              </p>
            </div>
          </div>
        )}

        {generalError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Mã Trang Trại" required error={fieldErrors.code} hint={editingItem ? 'Mã trang trại bất biến không thể sửa' : 'Hệ thống tự động sinh mã gợi ý'}>
            <CodeInput
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              onRegenerate={() => setFormData((prev) => ({ ...prev, code: generateEntityCode(CODE_PREFIXES.FARM) }))}
              isEditMode={Boolean(editingItem) || isRestrictedManager}
              error={fieldErrors.code}
            />
          </FormField>

          <FormField label="Loại Hình Canh Tác" required error={fieldErrors.farmType}>
            <Select
              name="farmType"
              value={formData.farmType}
              onChange={handleChange}
              options={FARM_TYPES}
            />
          </FormField>
        </div>

        <FormField label="Tên Trang Trại" required error={fieldErrors.name}>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="VD: Nông Trại Công Nghệ Cao Đà Lạt"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Tổng Diện Tích (m²)"
            required
            error={fieldErrors.totalAreaM2}
            hint={
              isRestrictedManager
                ? '🔒 Khóa cố định: Chỉ Owner mới có quyền thay đổi diện tích trại'
                : `Tương đương ${(Number(formData.totalAreaM2) / 10000 || 0).toFixed(2)} hecta (ha)`
            }
          >
            <Input
              type="number"
              step="10"
              min="1"
              name="totalAreaM2"
              value={formData.totalAreaM2}
              onChange={handleChange}
              disabled={isRestrictedManager}
              className={isRestrictedManager ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}
            />
          </FormField>

          <FormField
            label="Bán Kính Geofence (Mét)"
            required
            error={fieldErrors.geofenceRadiusM}
            hint="Vùng cho phép chấm công di động"
          >
            <Input
              type="number"
              min="1"
              name="geofenceRadiusM"
              value={formData.geofenceRadiusM}
              onChange={handleChange}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tọa Độ Tâm GPS - Vĩ Độ (Latitude)" error={fieldErrors.latitude}>
            <Input
              type="number"
              step="0.000001"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="10.772500"
            />
          </FormField>

          <FormField label="Tọa Độ Tâm GPS - Kinh Độ (Longitude)" error={fieldErrors.longitude}>
            <Input
              type="number"
              step="0.000001"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="106.681200"
            />
          </FormField>
        </div>

        <FormField
          label="Giám Đốc / Quản Lý Trang Trại"
          hint={isRestrictedManager ? '🔒 Khóa cố định: Chỉ Owner mới có quyền bổ nhiệm lại Giám đốc' : undefined}
        >
          <Select
            name="managerUserId"
            value={formData.managerUserId}
            onChange={handleChange}
            disabled={isRestrictedManager}
            className={isRestrictedManager ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}
            options={[
              { value: '', label: '-- Chọn nhân sự quản lý --' },
              ...employees.map((emp) => ({
                value: String(emp.userId || emp.id),
                label: `${emp.fullName} (${emp.employeeCode || emp.position || 'Nhân viên'})`,
              })),
            ]}
          />
        </FormField>

        <FormField label="Địa Chỉ Thực Tế Của Trang Trại">
          <Textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            placeholder="VD: Thôn 4, Xã Tà Nung, TP. Đà Lạt, Tỉnh Lâm Đồng"
          />
        </FormField>
      </form>
    </Modal>
  );
}
export default FarmFormModal;
