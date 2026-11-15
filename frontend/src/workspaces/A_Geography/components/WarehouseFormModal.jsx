import React, { useState, useEffect } from 'react';
import { Warehouse, AlertTriangle } from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea, CodeInput } from '@/components/ui/FormControls';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { toast } from '@/store/useToastStore';

export const WAREHOUSE_TYPES = [
  { value: 'FERTILIZER', label: 'FERTILIZER - Kho Phân bón' },
  { value: 'PESTICIDE', label: 'PESTICIDE - Kho Thuốc BVTV' },
  { value: 'ANIMAL_FEED', label: 'ANIMAL_FEED - Kho Thức ăn chăn nuôi' },
  { value: 'HARVESTED_PRODUCE', label: 'HARVESTED_PRODUCE - Kho Nông sản sau thu hoạch' },
  { value: 'COLD_STORAGE', label: 'COLD_STORAGE - Kho Lạnh bảo quản' },
  { value: 'TOOLS_EQUIPMENT', label: 'TOOLS_EQUIPMENT - Kho Công cụ & Thiết bị' },
  { value: 'GENERAL', label: 'GENERAL - Kho Tổng hợp' },
];

export const WAREHOUSE_STATUSES = [
  { value: 'ACTIVE', label: 'ACTIVE - Đang hoạt động' },
  { value: 'INACTIVE', label: 'INACTIVE - Tạm dừng' },
  { value: 'FULL', label: 'FULL - Đã đầy kho' },
];

export function WarehouseFormModal({
  isOpen,
  onClose,
  farmId,
  initialZoneId = null,
  zones = [],
  employees = [],
  warehouses = [],
  editingItem = null,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    warehouseType: 'GENERAL',
    zoneId: '',
    capacityM3: 0,
    floorAreaM2: 0,
    standardTempC: '',
    standardHumidityPct: '',
    locationDesc: '',
    managerUserId: '',
    status: 'ACTIVE',
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
        warehouseType: editingItem.warehouseType || 'GENERAL',
        zoneId: editingItem.zoneId ? String(editingItem.zoneId) : (initialZoneId ? String(initialZoneId) : ''),
        capacityM3: editingItem.capacityM3 ?? 0,
        floorAreaM2: editingItem.floorAreaM2 ?? 0,
        standardTempC: editingItem.standardTempC ?? '',
        standardHumidityPct: editingItem.standardHumidityPct ?? '',
        locationDesc: editingItem.locationDesc || '',
        managerUserId: editingItem.managerUserId ? String(editingItem.managerUserId) : '',
        status: editingItem.status || 'ACTIVE',
      });
    } else {
      setFormData({
        code: generateEntityCode(CODE_PREFIXES.WAREHOUSE, warehouses),
        name: '',
        warehouseType: 'GENERAL',
        zoneId: initialZoneId ? String(initialZoneId) : '',
        capacityM3: 0,
        floorAreaM2: 0,
        standardTempC: '',
        standardHumidityPct: '',
        locationDesc: '',
        managerUserId: '',
        status: 'ACTIVE',
      });
    }
  }, [isOpen, editingItem, initialZoneId]);

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

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Mã kho không được để trống';
    if (!formData.name.trim()) errors.name = 'Tên kho không được để trống';
    if (
      formData.warehouseType === 'COLD_STORAGE' &&
      (formData.standardTempC === '' || isNaN(Number(formData.standardTempC)))
    ) {
      errors.standardTempC = 'Kho lạnh bắt buộc phải thiết lập nhiệt độ chuẩn (°C)';
    }
    if (formData.standardHumidityPct !== '') {
      const hum = Number(formData.standardHumidityPct);
      if (hum < 0 || hum > 100) {
        errors.standardHumidityPct = 'Độ ẩm chuẩn phải nằm trong khoảng từ 0% đến 100%';
      }
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
        ...formData,
        code: formData.code.toUpperCase().trim(),
        zoneId: formData.zoneId ? Number(formData.zoneId) : null,
        capacityM3: formData.capacityM3 !== '' ? Number(formData.capacityM3) : null,
        floorAreaM2: formData.floorAreaM2 !== '' ? Number(formData.floorAreaM2) : null,
        standardTempC: formData.standardTempC !== '' ? Number(formData.standardTempC) : null,
        standardHumidityPct: formData.standardHumidityPct !== '' ? Number(formData.standardHumidityPct) : null,
        managerUserId: formData.managerUserId ? Number(formData.managerUserId) : null,
      };

      let result;
      if (editingItem) {
        result = await masterDataService.updateWarehouse(farmId, editingItem.id, payload);
        toast.success(`Cập nhật kho bãi "${payload.name}" thành công!`);
      } else {
        result = await masterDataService.createWarehouse(farmId, payload);
        toast.success(`Tạo mới kho bãi "${payload.name}" thành công!`);
      }

      onSuccess?.(result || payload);
      onClose();
    } catch (err) {
      const errMsg = applyServerFieldErrors(err, setFieldErrors);
      setGeneralError(errMsg || 'Đã xảy ra lỗi khi lưu kho bãi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Cập Nhật Kho Bãi' : 'Thêm Mới Kho Bãi'}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSave}>
            {editingItem ? 'Lưu cập nhật' : 'Tạo mới kho bãi'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {generalError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Mã Kho"
            required
            error={fieldErrors.code}
            hint={editingItem ? 'Mã kho bất biến' : 'Hệ thống tự động sinh mã gợi ý'}
          >
            <CodeInput
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
              }
              onRegenerate={() =>
                setFormData((prev) => ({ ...prev, code: generateEntityCode(CODE_PREFIXES.WAREHOUSE, warehouses) }))
              }
              isEditMode={Boolean(editingItem)}
              error={fieldErrors.code}
            />
          </FormField>

          <FormField label="Tên Kho Bãi" required error={fieldErrors.name}>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Kho Vật Tư Nông Nghiệp C1"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Phân Loại Kho (7 loại chuẩn WMS)" required error={fieldErrors.warehouseType}>
            <Select
              name="warehouseType"
              value={formData.warehouseType}
              onChange={handleChange}
              options={WAREHOUSE_TYPES}
            />
          </FormField>

          <FormField
            label="Phân Khu Trực Thuộc (WS-A)"
            error={fieldErrors.zoneId}
            hint="Kho bãi sẽ trực thuộc và hiển thị trong phân khu này"
          >
            <Select
              name="zoneId"
              value={formData.zoneId}
              onChange={handleChange}
              options={[
                { value: '', label: '-- Toàn trang trại (Không gán phân khu) --' },
                ...zones.map((z) => ({
                  value: String(z.id),
                  label: `${z.name} (${z.code || `#${z.id}`} • ${z.zoneType})`,
                })),
              ]}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Trạng Thái Vận Hành" required error={fieldErrors.status}>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={WAREHOUSE_STATUSES}
            />
          </FormField>

          <FormField label="Thủ Kho / Người Phụ Trách" error={fieldErrors.managerUserId}>
            <Select
              name="managerUserId"
              value={formData.managerUserId}
              onChange={handleChange}
              options={[
                { value: '', label: '-- Chọn nhân sự quản lý --' },
                ...employees.map((emp) => ({
                  value: String(emp.userId || emp.id),
                  label: `${emp.fullName || emp.name} (${emp.employeeCode || emp.code || 'NV'})`,
                })),
              ]}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Diện Tích Sàn (m²)" error={fieldErrors.floorAreaM2}>
            <div className="relative">
              <Input
                name="floorAreaM2"
                type="number"
                min="0"
                step="0.1"
                value={formData.floorAreaM2}
                onChange={handleChange}
                placeholder="VD: 250"
                className="pr-12 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                m²
              </span>
            </div>
          </FormField>

          <FormField label="Dung Tích Chứa (m³)" error={fieldErrors.capacityM3}>
            <div className="relative">
              <Input
                name="capacityM3"
                type="number"
                min="0"
                step="0.1"
                value={formData.capacityM3}
                onChange={handleChange}
                placeholder="VD: 500"
                className="pr-12 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                m³
              </span>
            </div>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Nhiệt Độ Chuẩn (°C)"
            required={formData.warehouseType === 'COLD_STORAGE'}
            error={fieldErrors.standardTempC}
            hint={formData.warehouseType === 'COLD_STORAGE' ? 'Bắt buộc với Kho Lạnh bảo quản' : undefined}
          >
            <div className="relative">
              <Input
                name="standardTempC"
                type="number"
                step="0.5"
                value={formData.standardTempC}
                onChange={handleChange}
                placeholder="VD: 4.5"
                className="pr-12 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                °C
              </span>
            </div>
          </FormField>

          <FormField label="Độ Ẩm Chuẩn (%)" error={fieldErrors.standardHumidityPct}>
            <div className="relative">
              <Input
                name="standardHumidityPct"
                type="number"
                min="0"
                max="100"
                value={formData.standardHumidityPct}
                onChange={handleChange}
                placeholder="VD: 75"
                className="pr-12 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                %
              </span>
            </div>
          </FormField>
        </div>

        <FormField label="Mô Tả Vị Trí Địa Lý Kho">
          <Textarea
            name="locationDesc"
            value={formData.locationDesc}
            onChange={handleChange}
            rows={2}
            placeholder="VD: Cửa phía Đông, giáp đường nội bộ phân khu, thuận tiện cho xe tải bốc dỡ..."
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default WarehouseFormModal;
