import React, { useState, useEffect } from 'react';
import { Tag, Save, AlertCircle, Sparkles, Activity } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { farmingService } from '@/services/modules/farmingService';
import { toast } from '@/store/useToastStore';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Đực (MALE ♂)' },
  { value: 'FEMALE', label: 'Cái (FEMALE ♀)' },
  { value: 'CASTRATED', label: 'Đã thiến (CASTRATED ⚲)' },
];

const HEALTH_STATUS_OPTIONS = [
  { value: 'HEALTHY', label: 'HEALTHY - Khỏe mạnh bình thường' },
  { value: 'SICK', label: 'SICK - Bị ốm / Nhiễm bệnh' },
  { value: 'INJURED', label: 'INJURED - Bị thương' },
  { value: 'QUARANTINED', label: 'QUARANTINED - Đang cách ly thú y' },
  { value: 'DECEASED', label: 'DECEASED - Chết / Tiêu hủy' },
  { value: 'SOLD', label: 'SOLD - Đã xuất bán' },
];

export function LivestockIndividualModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  defaultGroupId = null,
  defaultZoneId = null,
  zones = [],
  groups = [],
  individual = null,
}) {
  const isEditing = Boolean(individual?.id);

  const [formData, setFormData] = useState({
    rfidTagCode: '',
    gender: 'FEMALE',
    birthDate: '',
    motherTagCode: '',
    fatherTagCode: '',
    currentWeightKg: '',
    healthStatus: 'HEALTHY',
    zoneId: '',
    groupId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (individual) {
        setFormData({
          rfidTagCode: individual.rfidTagCode || '',
          gender: individual.gender || 'FEMALE',
          birthDate: individual.birthDate ? String(individual.birthDate).split('T')[0] : '',
          motherTagCode: individual.motherTagCode || '',
          fatherTagCode: individual.fatherTagCode || '',
          currentWeightKg: individual.currentWeightKg != null ? String(individual.currentWeightKg) : '',
          healthStatus: individual.healthStatus || 'HEALTHY',
          zoneId: individual.zoneId ? String(individual.zoneId) : (defaultZoneId ? String(defaultZoneId) : ''),
          groupId: individual.groupId ? String(individual.groupId) : (defaultGroupId ? String(defaultGroupId) : ''),
        });
      } else {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        setFormData({
          rfidTagCode: `TAG-${randomNum}`,
          gender: 'FEMALE',
          birthDate: new Date().toISOString().split('T')[0],
          motherTagCode: '',
          fatherTagCode: '',
          currentWeightKg: '',
          healthStatus: 'HEALTHY',
          zoneId: defaultZoneId ? String(defaultZoneId) : (zones[0]?.id ? String(zones[0].id) : ''),
          groupId: defaultGroupId ? String(defaultGroupId) : (groups[0]?.id ? String(groups[0].id) : ''),
        });
      }
      setErrors({});
    }
  }, [isOpen, individual, defaultGroupId, defaultZoneId, zones, groups]);

  const validate = () => {
    const errs = {};
    if (!formData.rfidTagCode.trim()) {
      errs.rfidTagCode = 'Mã thẻ tai RFID không được để trống';
    }
    if (!formData.gender) {
      errs.gender = 'Vui lòng chọn giới tính';
    }
    if (!formData.zoneId) {
      errs.zoneId = 'Vui lòng chọn phân khu / chuồng nuôi';
    }
    if (formData.currentWeightKg && Number(formData.currentWeightKg) < 0) {
      errs.currentWeightKg = 'Cân nặng không được là số âm';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!farmId) {
      toast.error('Không tìm thấy thông tin trang trại!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const payload = {
        zoneId: Number(formData.zoneId),
        groupId: formData.groupId ? Number(formData.groupId) : null,
        gender: formData.gender,
        birthDate: formData.birthDate || null,
        motherTagCode: formData.motherTagCode.trim() || null,
        fatherTagCode: formData.fatherTagCode.trim() || null,
        currentWeightKg: formData.currentWeightKg ? Number(formData.currentWeightKg) : 0,
        healthStatus: formData.healthStatus,
      };

      if (isEditing) {
        await farmingService.updateLivestockIndividual(farmId, individual.id, payload);
        toast.success(`Cập nhật thông tin cá thể RFID ${individual.rfidTagCode} thành công!`);
      } else {
        payload.rfidTagCode = formData.rfidTagCode.trim().toUpperCase();
        await farmingService.createLivestockIndividual(farmId, payload);
        toast.success(`Gắn thẻ tai RFID ${payload.rfidTagCode} thành công!`);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi lưu cá thể RFID:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu thông tin cá thể RFID';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={isEditing ? `Cập Nhật Cá Thể RFID: ${individual?.rfidTagCode}` : 'Gắn Thẻ Tai RFID Cho Cá Thể Mới'}
      subtitle="Khai báo thông tin phả hệ, thể trọng và theo dõi sức khỏe cá thể vật nuôi"
      icon={<Tag className="h-5 w-5 text-emerald-600" />}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} icon={<Save className="h-4 w-4" />}>
            {isEditing ? 'Lưu Cập Nhật' : 'Xác Nhận Gắn Thẻ'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errors.form && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errors.form}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Mã Thẻ Tai RFID */}
          <FormField label="Mã Thẻ Tai RFID *" hint="Mã số khắc trên thẻ tai (Duy nhất)" error={errors.rfidTagCode}>
            <Input
              value={formData.rfidTagCode}
              onChange={(e) => setFormData({ ...formData, rfidTagCode: e.target.value.toUpperCase() })}
              placeholder="VD: TAG-00124"
              disabled={isEditing}
              className="font-mono font-bold"
              required
            />
          </FormField>

          {/* Giới Tính */}
          <FormField label="Giới Tính *" error={errors.gender}>
            <Select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Ngày Sinh */}
          <FormField label="Ngày Sinh">
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </FormField>

          {/* Thẻ Mẹ */}
          <FormField label="Mã Thẻ Mẹ (Mother Tag)" hint="Để trống nếu không rõ">
            <Input
              value={formData.motherTagCode}
              onChange={(e) => setFormData({ ...formData, motherTagCode: e.target.value.toUpperCase() })}
              placeholder="TAG-MẸ..."
              className="font-mono"
            />
          </FormField>

          {/* Thẻ Cha */}
          <FormField label="Mã Thẻ Cha (Father Tag)" hint="Để trống nếu không rõ">
            <Input
              value={formData.fatherTagCode}
              onChange={(e) => setFormData({ ...formData, fatherTagCode: e.target.value.toUpperCase() })}
              placeholder="TAG-CHA..."
              className="font-mono"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Thể Trọng Hiện Tại (kg) */}
          <FormField label="Trọng Lượng Hiện Tại (kg)" hint="Cân nặng thực tế" error={errors.currentWeightKg}>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.currentWeightKg}
              onChange={(e) => setFormData({ ...formData, currentWeightKg: e.target.value })}
              placeholder="VD: 54.5"
            />
          </FormField>

          {/* Tình Trạng Sức Khỏe */}
          <FormField label="Tình Trạng Sức Khỏe *">
            <Select
              value={formData.healthStatus}
              onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
            >
              {HEALTH_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Phân Khu / Chuồng Nuôi */}
          <FormField label="Phân Khu / Chuồng Nuôi *" error={errors.zoneId}>
            <Select
              value={formData.zoneId}
              onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
            >
              <option value="">-- Chọn phân khu / chuồng --</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name || z.zoneName} ({z.code || `#${z.id}`})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Thuộc Đàn Nuôi */}
          <FormField label="Thuộc Đàn / Lứa Nuôi">
            <Select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
            >
              <option value="">-- Nuôi cá thể độc lập / Chưa phân đàn --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.groupCode} {g.breedName ? `(${g.breedName})` : ''}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed flex items-start gap-2">
          <Activity className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Hệ thống liên kết mã RFID với thẻ tai điện tử. Khi thực hiện cân hoặc tiêm phòng có chỉ định mã cá thể, nhật ký cân nặng và lịch sử khám chữa bệnh sẽ được đồng bộ tự động.
          </span>
        </div>
      </form>
    </Modal>
  );
}

export default LivestockIndividualModal;
