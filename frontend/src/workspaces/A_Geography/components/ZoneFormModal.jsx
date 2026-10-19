import React, { useState, useEffect } from 'react';
import { Layers, AlertTriangle } from 'lucide-react';
import { geographyService } from '@/services/modules/geographyService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { GeoJsonPolygonEditor } from './GeoJsonPolygonEditor';
import { extractApiErrors } from '@/utils/apiHelpers';

const ZONE_TYPES = [
  { value: 'GREENHOUSE', label: 'GREENHOUSE - Nhà Màng / Nhà Kính Công Nghệ Cao' },
  { value: 'OPEN_FIELD', label: 'OPEN_FIELD - Vùng Trồng Mở Ngoài Trời' },
  { value: 'BARN', label: 'BARN - Chuồng Trại Chăn Nuôi' },
  { value: 'POND', label: 'POND - Ao Hồ Nuôi Trồng Thủy Sản' },
  { value: 'STORAGE', label: 'STORAGE - Khu Vực Sân Bãi & Kho Chứa' },
  { value: 'ISOLATION', label: 'ISOLATION - Phân Khu Cách Ly & Kiểm Dịch' },
];

const ZONE_STATUSES = [
  { value: 'ACTIVE', label: 'ACTIVE - Đang Canh Tác / Nuôi Trồng' },
  { value: 'FALLOW', label: 'FALLOW - Đang Để Đất Nghỉ / Cải Tạo Đất' },
  { value: 'QUARANTINE', label: 'QUARANTINE - Đang Cách Ly Kiểm Dịch Dịch Bệnh' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE - Đang Bảo Trì / Sửa Chữa Nhà Màng' },
];

export function ZoneFormModal({
  isOpen,
  onClose,
  farmId,
  farmTotalAreaM2 = 1000000,
  farmCenter = null,
  editingItem = null,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    zoneType: 'GREENHOUSE',
    areaM2: 1000,
    soilType: 'Đất đỏ bazan',
    waterSource: 'Hệ thống giếng khoan tầng sâu',
    status: 'ACTIVE',
    mapLayoutJson: null,
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
        zoneType: editingItem.zoneType || 'GREENHOUSE',
        areaM2: editingItem.areaM2 ?? 1000,
        soilType: editingItem.soilType || '',
        waterSource: editingItem.waterSource || '',
        status: editingItem.status || 'ACTIVE',
        mapLayoutJson: editingItem.mapLayoutJson || null,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        zoneType: 'GREENHOUSE',
        areaM2: 1000,
        soilType: 'Đất đỏ bazan',
        waterSource: 'Hệ thống giếng khoan tầng sâu',
        status: 'ACTIVE',
        mapLayoutJson: null,
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
    if (!formData.code.trim()) errors.code = 'Mã phân khu không được để trống';
    if (!formData.name.trim()) errors.name = 'Tên phân khu không được để trống';
    if (Number(formData.areaM2) <= 0) errors.areaM2 = 'Diện tích phải lớn hơn 0 m²';
    if (farmTotalAreaM2 && Number(formData.areaM2) > Number(farmTotalAreaM2)) {
      errors.areaM2 = `Diện tích phân khu (${formData.areaM2} m²) không được vượt quá tổng diện tích trang trại (${farmTotalAreaM2} m²)`;
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
        name: formData.name.trim(),
        areaM2: Number(formData.areaM2),
        soilType: formData.soilType?.trim() || null,
        waterSource: formData.waterSource?.trim() || null,
        mapLayoutJson: formData.mapLayoutJson || null,
      };

      if (editingItem) {
        await geographyService.updateZone(farmId, editingItem.id, payload);
      } else {
        await geographyService.createZone(farmId, payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setFieldErrors(errInfo.fieldErrors);
      setGeneralError(errInfo.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Chỉnh Sửa Phân Khu Canh Tác' : 'Thêm Mới Phân Khu Canh Tác'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSubmit}>
            {editingItem ? 'Lưu Thay Đổi' : 'Tạo Phân Khu'}
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

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Mã Phân Khu" required error={fieldErrors.code}>
            <Input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="VD: ZONE-A-GREENHOUSE"
              className="font-mono font-bold"
            />
          </FormField>

          <FormField label="Tên Phân Khu" required error={fieldErrors.name}>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Phân Khu A - Nhà Kính Công Nghệ Cao"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Loại Phân Khu (6 loại)" required error={fieldErrors.zoneType}>
            <Select
              name="zoneType"
              value={formData.zoneType}
              onChange={handleChange}
              options={ZONE_TYPES}
            />
          </FormField>

          <FormField label="Trạng Thái Vận Hành" required error={fieldErrors.status}>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={ZONE_STATUSES}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Diện Tích (m²)" required error={fieldErrors.areaM2}>
            <Input
              type="number"
              step="1"
              min="1"
              name="areaM2"
              value={formData.areaM2}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Thổ Nhưỡng / Chất Đất">
            <Input
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              placeholder="VD: Đất đỏ bazan, pH 6.2"
            />
          </FormField>

          <FormField label="Nguồn Nước Cấp">
            <Input
              name="waterSource"
              value={formData.waterSource}
              onChange={handleChange}
              placeholder="VD: Giếng ngầm RO"
            />
          </FormField>
        </div>

        {/* Khung trực quan GeoJSON Polygon */}
        <GeoJsonPolygonEditor
          value={formData.mapLayoutJson}
          onChange={(json) => setFormData((prev) => ({ ...prev, mapLayoutJson: json }))}
          farmCenter={farmCenter}
        />
      </form>
    </Modal>
  );
}
export default ZoneFormModal;
