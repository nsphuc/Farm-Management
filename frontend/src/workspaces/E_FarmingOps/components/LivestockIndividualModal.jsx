import React, { useState, useEffect } from 'react';
import { Tag, Save, AlertCircle, Sparkles, Activity, MapPin, Layers, Home } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { farmingService } from '@/services/modules/farmingService';
import { geographyService } from '@/services/modules/geographyService';
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
  item = null,
  defaultGroupId = null,
  defaultZoneId = null,
  defaultLocationId = null,
  zones = [],
  groups = [],
  individual = null,
}) {
  const isEditing = Boolean(individual?.id);

  // Fallbacks from item (group)
  const resolvedZoneId = individual?.zoneId || item?.zoneId || defaultZoneId || '';
  const resolvedLocationId = individual?.locationId || item?.locationId || defaultLocationId || '';
  const resolvedGroupId = individual?.groupId || item?.id || defaultGroupId || '';

  const [formData, setFormData] = useState({
    rfidTagCode: '',
    gender: 'FEMALE',
    birthDate: '',
    motherTagCode: '',
    fatherTagCode: '',
    currentWeightKg: '',
    healthStatus: 'HEALTHY',
    zoneId: resolvedZoneId ? String(resolvedZoneId) : '',
    locationId: resolvedLocationId ? String(resolvedLocationId) : '',
    groupId: resolvedGroupId ? String(resolvedGroupId) : '',
  });

  const [availableZones, setAvailableZones] = useState(zones || []);
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoDeductInventory, setAutoDeductInventory] = useState(true);

  // Nạp danh sách khu chuồng nếu prop zones chưa có
  useEffect(() => {
    if (!isOpen || !farmId) return;
    if (zones && zones.length > 0) {
      setAvailableZones(zones);
    } else {
      geographyService.getZones(farmId)
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.content || []);
          setAvailableZones(list);
        })
        .catch(() => setAvailableZones([]));
    }
  }, [isOpen, farmId, zones]);

  // Nạp danh sách Ô chuồng cụ thể thuộc zoneId
  const loadLocations = async (zId) => {
    if (!zId || !farmId) {
      setLocations([]);
      return;
    }
    try {
      setIsLoadingLocations(true);
      const res = await geographyService.getLocations(farmId, zId);
      const list = Array.isArray(res) ? res : (res?.content || []);
      setLocations(list);
    } catch (err) {
      console.error('Lỗi nạp ô chuồng:', err);
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  useEffect(() => {
    if (formData.zoneId) {
      loadLocations(formData.zoneId);
    } else {
      setLocations([]);
    }
  }, [formData.zoneId, farmId]);

  // Khởi tạo form khi mở Modal
  useEffect(() => {
    if (!isOpen) return;

    const zId = individual?.zoneId || item?.zoneId || defaultZoneId || '';
    const locId = individual?.locationId || item?.locationId || defaultLocationId || '';
    const gId = individual?.groupId || item?.id || defaultGroupId || '';

    if (individual) {
      setFormData({
        rfidTagCode: individual.rfidTagCode || '',
        gender: individual.gender || 'FEMALE',
        birthDate: individual.birthDate ? String(individual.birthDate).split('T')[0] : '',
        motherTagCode: individual.motherTagCode || '',
        fatherTagCode: individual.fatherTagCode || '',
        currentWeightKg: individual.currentWeightKg != null ? String(individual.currentWeightKg) : '',
        healthStatus: individual.healthStatus || 'HEALTHY',
        zoneId: zId ? String(zId) : '',
        locationId: locId ? String(locId) : '',
        groupId: gId ? String(gId) : '',
      });
    } else {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const groupPrefix = item?.groupCode ? `${item.groupCode.replace(/[^a-zA-Z0-9]/g, '')}-` : 'TAG-';
      setFormData({
        rfidTagCode: `${groupPrefix}${randomNum}`,
        gender: 'FEMALE',
        birthDate: new Date().toISOString().split('T')[0],
        motherTagCode: '',
        fatherTagCode: '',
        currentWeightKg: item?.avgInitialWeightKg ? String(item.avgInitialWeightKg) : '',
        healthStatus: 'HEALTHY',
        zoneId: zId ? String(zId) : '',
        locationId: locId ? String(locId) : '',
        groupId: gId ? String(gId) : '',
      });
    }
    setErrors({});
  }, [isOpen, individual, item, defaultGroupId, defaultZoneId, defaultLocationId]);

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
        motherTagCode: formData.motherTagCode?.trim() || null,
        fatherTagCode: formData.fatherTagCode?.trim() || null,
        currentWeightKg: formData.currentWeightKg ? Number(formData.currentWeightKg) : 0,
        healthStatus: formData.healthStatus,
      };

      if (isEditing) {
        await farmingService.updateLivestockIndividual(farmId, individual.id, payload);
        toast.success(`Cập nhật thông tin cá thể RFID ${individual.rfidTagCode} thành công!`);
      } else {
        payload.rfidTagCode = formData.rfidTagCode.trim().toUpperCase();
        payload.autoDeductTagInventory = autoDeductInventory;
        await farmingService.createLivestockIndividual(farmId, payload);
        toast.success(`Gắn thẻ tai RFID ${payload.rfidTagCode} thành công!${autoDeductInventory ? ' Đã tự động xuất 1 thẻ tai từ kho và tính chi phí.' : ''}`);
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

  const currentZoneName = item?.zoneName || availableZones.find((z) => String(z.id) === String(formData.zoneId))?.name;
  const currentGroupName = item?.groupCode || groups.find((g) => String(g.id) === String(formData.groupId))?.groupCode;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={isEditing ? `Cập Nhật Cá Thể RFID: ${individual?.rfidTagCode}` : 'Gắn Thẻ Tai RFID Cho Cá Thể Mới'}
      subtitle={
        currentGroupName
          ? `Gắn thẻ cho đàn: ${currentGroupName} • Vị trí: ${currentZoneName || 'Chuồng trại'}`
          : 'Khai báo thông tin phả hệ, thể trọng và theo dõi sức khỏe cá thể vật nuôi'
      }
      icon={<Tag className="h-5 w-5 text-purple-600" />}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            icon={<Save className="h-4 w-4" />}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
          >
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

        {/* Banner Vị Trí & Đàn Nuôi đã liên kết */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-purple-900">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-purple-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Vị Trí Chuồng Nuôi / Phân Khu:</span>
              <strong className="text-xs font-bold text-purple-950">
                {currentZoneName || `Khu chuồng #${formData.zoneId || 'Chưa chọn'}`}
                {item?.locationName ? ` (Ô ${item.locationName})` : ''}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Đàn Nuôi Trực Thuộc:</span>
              <strong className="text-xs font-bold text-purple-950">
                {currentGroupName || 'Nuôi cá thể độc lập'}
              </strong>
            </div>
          </div>
        </div>

        {/* Mã Thẻ Tai & Giới Tính */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="Mã Thẻ Tai RFID *" hint="Mã số khắc trên thẻ tai (Duy nhất)" error={errors.rfidTagCode}>
            <Input
              value={formData.rfidTagCode}
              onChange={(e) => setFormData({ ...formData, rfidTagCode: e.target.value.toUpperCase() })}
              placeholder="VD: TAG-00124"
              disabled={isEditing}
              className="font-mono font-bold text-purple-800"
              required
            />
          </FormField>

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

        {/* Phân Khu & Ô Chuồng Cụ Thể */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="Phân Khu / Chuồng Nuôi *" error={errors.zoneId}>
            <Select
              value={formData.zoneId}
              onChange={(e) => setFormData({ ...formData, zoneId: e.target.value, locationId: '' })}
            >
              <option value="">-- Chọn phân khu / chuồng --</option>
              {availableZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name || z.zoneName} ({z.code || `#${z.id}`})
                </option>
              ))}
              {formData.zoneId && !availableZones.some((z) => String(z.id) === String(formData.zoneId)) && (
                <option value={formData.zoneId}>
                  {item?.zoneName ? `${item.zoneName} (Đang nuôi)` : `Khu chuồng #${formData.zoneId}`}
                </option>
              )}
            </Select>
          </FormField>

          <FormField
            label="Ô Chuồng / Vị Trí Cụ Thể"
            hint={isLoadingLocations ? 'Đang tải danh sách ô...' : 'Tùy chọn theo sơ đồ trại'}
          >
            <Select
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              disabled={!formData.zoneId || isLoadingLocations}
            >
              <option value="">-- Toàn bộ chuồng (không chia ô) --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
              {formData.locationId && !locations.some((l) => String(l.id) === String(formData.locationId)) && (
                <option value={formData.locationId}>
                  {item?.locationName ? `Ô ${item.locationName} (Hiện tại)` : `Ô #${formData.locationId}`}
                </option>
              )}
            </Select>
          </FormField>
        </div>

        {/* Thuộc Đàn Nuôi & Ngày Sinh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              {formData.groupId && !groups.some((g) => String(g.id) === String(formData.groupId)) && (
                <option value={formData.groupId}>
                  {item?.groupCode ? `${item.groupCode} (${item.breedName || 'Đàn đang chọn'})` : `Đàn #${formData.groupId}`}
                </option>
              )}
            </Select>
          </FormField>

          <FormField label="Ngày Sinh">
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </FormField>
        </div>

        {/* Phả Hệ: Thẻ Mẹ & Thẻ Cha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="Mã Thẻ Mẹ (Mother Tag)" hint="Để trống nếu không rõ">
            <Input
              value={formData.motherTagCode}
              onChange={(e) => setFormData({ ...formData, motherTagCode: e.target.value.toUpperCase() })}
              placeholder="VD: BO-ME-01..."
              className="font-mono"
            />
          </FormField>

          <FormField label="Mã Thẻ Cha (Father Tag)" hint="Để trống nếu không rõ">
            <Input
              value={formData.fatherTagCode}
              onChange={(e) => setFormData({ ...formData, fatherTagCode: e.target.value.toUpperCase() })}
              placeholder="VD: BO-CHA-01..."
              className="font-mono"
            />
          </FormField>
        </div>

        {/* Thể Trọng & Tình Trạng Sức Khỏe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

        {!isEditing && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-emerald-950">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
              <input
                type="checkbox"
                checked={autoDeductInventory}
                onChange={(e) => setAutoDeductInventory(e.target.checked)}
                className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span>📦 Tự động xuất 1 thẻ tai RFID từ kho và tính vào chi phí đàn</span>
            </label>
            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
              ~15.000 đ
            </span>
          </div>
        )}

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
