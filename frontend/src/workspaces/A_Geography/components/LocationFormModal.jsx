import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';
import { geographyService } from '@/services/modules/geographyService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea, CodeInput } from '@/components/ui/FormControls';
import { extractApiErrors } from '@/utils/apiHelpers';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';

const LOCATION_STATUSES = [
  { value: 'ACTIVE', label: 'ACTIVE - Sẵn sàng canh tác' },
  { value: 'OCCUPIED', label: 'OCCUPIED - Đang có cây/đàn nuôi' },
  { value: 'EMPTY', label: 'EMPTY - Trống (chưa gieo/thả giống)' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE - Đang khử trùng / bảo dưỡng' },
];

export function LocationFormModal({
  isOpen,
  onClose,
  farmId,
  zoneId,
  editingItem = null,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'EMPTY',
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
        description: editingItem.description || '',
        status: editingItem.status || 'EMPTY',
      });
    } else {
      setFormData({
        code: generateEntityCode(CODE_PREFIXES.LOCATION),
        name: '',
        description: '',
        status: 'EMPTY',
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
    if (!formData.code.trim()) errors.code = 'Mã vị trí / luống không được để trống';
    if (!formData.name.trim()) errors.name = 'Tên vị trí / luống không được để trống';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const payload = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        status: formData.status,
      };

      if (editingItem) {
        await geographyService.updateLocation(farmId, zoneId, editingItem.id, payload);
      } else {
        await geographyService.createLocation(farmId, zoneId, payload);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Chỉnh Sửa Vị Trí / Luống / Chuồng' : 'Thêm Mới Vị Trí / Luống / Chuồng'}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSubmit}>
            {editingItem ? 'Lưu' : 'Tạo Vị Trí'}
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

        <FormField label="Mã Vị Trí / Ô Đất / Chuồng" required error={fieldErrors.code} hint={editingItem ? 'Mã vị trí bất biến không thể sửa' : 'Hệ thống tự động sinh mã gợi ý'}>
          <CodeInput
            value={formData.code}
            onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            onRegenerate={() => setFormData((prev) => ({ ...prev, code: generateEntityCode(CODE_PREFIXES.LOCATION) }))}
            isEditMode={Boolean(editingItem)}
            error={fieldErrors.code}
          />
        </FormField>

        <FormField label="Tên Vị Trí / Luống Canh Tác" required error={fieldErrors.name}>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="VD: Luống Cà Chua 01"
          />
        </FormField>

        <FormField label="Trạng Thái Vận Hành" required error={fieldErrors.status}>
          <Select
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={LOCATION_STATUSES}
          />
        </FormField>

        <FormField label="Mô Tả Chi Tiết Vị Trí">
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            placeholder="VD: Chiều dài 25m, rộng 1.2m, có vòi tưới nhỏ giọt"
          />
        </FormField>
      </form>
    </Modal>
  );
}
export default LocationFormModal;
