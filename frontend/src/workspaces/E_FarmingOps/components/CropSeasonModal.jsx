import React, { useState, useEffect } from 'react';
import { Sprout, RefreshCw, AlertCircle, Info, Calendar, MapPin, Layers } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { farmingService } from '@/services/modules/farmingService';
import { masterDataService } from '@/services/modules/masterDataService';
import { geographyService } from '@/services/modules/geographyService';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { formatArea } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function CropSeasonModal({
  isOpen,
  onClose,
  farmId,
  editingSeason = null,
  onSuccess,
}) {
  const { notifyDataChanged } = useActiveFarmStore();

  const [formData, setFormData] = useState({
    seasonCode: '',
    zoneId: '',
    operationalCycleId: '',
    cropTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
    plantedAreaM2: '',
    seedQuantity: '',
    estimatedYieldKg: '',
  });

  const [zones, setZones] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCropTypeInfo, setSelectedCropTypeInfo] = useState(null);

  // Sinh mã tự động
  const handleGenerateCode = () => {
    const newCode = generateEntityCode(CODE_PREFIXES.SEASON);
    setFormData((prev) => ({ ...prev, seasonCode: newCode }));
  };

  // Nạp dữ liệu danh mục khi mở Modal
  useEffect(() => {
    if (!isOpen || !farmId) return;

    const loadMetadata = async () => {
      try {
        const [zonesRes, cyclesRes, cropTypesRes, assignmentsRes] = await Promise.all([
          geographyService.getZones(farmId).catch(() => []),
          geographyService.getCycles(farmId).catch(() => []),
          masterDataService.getCropTypes().catch(() => []),
          geographyService.getAssignments(farmId).catch(() => []),
        ]);

        const rawZones = Array.isArray(zonesRes) ? zonesRes : (zonesRes?.content || []);
        // Chỉ nạp các phân khu có status === 'ACTIVE'
        const activeZones = rawZones.filter((z) => z.status === 'ACTIVE');
        setZones(activeZones);

        const rawCycles = Array.isArray(cyclesRes) ? cyclesRes : (cyclesRes?.content || []);
        // Chỉ nạp chu kỳ đang 'ACTIVE' hoặc 'PLANNING'
        const validCycles = rawCycles.filter(
          (c) => c.status === 'ACTIVE' || c.status === 'PLANNING'
        );
        setCycles(validCycles);

        const rawCrops = Array.isArray(cropTypesRes) ? cropTypesRes : (cropTypesRes?.content || []);
        setCropTypes(rawCrops);

        const rawAssign = Array.isArray(assignmentsRes) ? assignmentsRes : (assignmentsRes?.content || []);
        setAssignments(rawAssign);
      } catch (err) {
        console.error('Lỗi khi nạp dữ liệu danh mục mùa vụ:', err);
      }
    };

    loadMetadata();
  }, [isOpen, farmId]);

  // Thiết lập form khi mở hoặc chuyển chế độ Thêm / Sửa
  useEffect(() => {
    if (!isOpen) return;

    if (editingSeason) {
      setFormData({
        seasonCode: editingSeason.seasonCode || '',
        zoneId: editingSeason.zoneId ? String(editingSeason.zoneId) : '',
        operationalCycleId: editingSeason.operationalCycleId ? String(editingSeason.operationalCycleId) : '',
        cropTypeId: editingSeason.cropTypeId ? String(editingSeason.cropTypeId) : '',
        startDate: editingSeason.startDate ? String(editingSeason.startDate).split('T')[0] : '',
        expectedHarvestDate: editingSeason.expectedHarvestDate ? String(editingSeason.expectedHarvestDate).split('T')[0] : '',
        plantedAreaM2: editingSeason.plantedAreaM2 ? String(editingSeason.plantedAreaM2) : '',
        seedQuantity: editingSeason.seedQuantity ? String(editingSeason.seedQuantity) : '',
        estimatedYieldKg: editingSeason.estimatedYieldKg ? String(editingSeason.estimatedYieldKg) : '',
      });
    } else {
      setFormData({
        seasonCode: generateEntityCode(CODE_PREFIXES.SEASON),
        zoneId: '',
        operationalCycleId: '',
        cropTypeId: '',
        startDate: new Date().toISOString().split('T')[0],
        expectedHarvestDate: '',
        plantedAreaM2: '',
        seedQuantity: '',
        estimatedYieldKg: '',
      });
      setSelectedCropTypeInfo(null);
    }
    setErrors({});
  }, [isOpen, editingSeason]);

  // Tìm Trưởng phân khu phụ trách cho từng zone
  const getZoneManagerName = (zoneId) => {
    if (!zoneId) return 'Chưa có trưởng khu';
    const numId = Number(zoneId);
    const assign = assignments.find(
      (a) => a.zoneId === numId && a.roleInFarm === 'ZONE_MANAGER' && a.isActive !== false
    );
    if (!assign) return 'Chưa có trưởng khu';
    return assign.userFullName || assign.username || 'Trưởng khu';
  };

  // Khi chọn Giống cây trồng: tự động tính ngày thu hoạch dự kiến
  const handleCropTypeChange = (cropTypeIdStr) => {
    const selected = cropTypes.find((c) => String(c.id) === cropTypeIdStr);
    setSelectedCropTypeInfo(selected || null);

    setFormData((prev) => {
      let expectedDate = prev.expectedHarvestDate;
      if (selected && selected.growthDaysStandard && prev.startDate) {
        const start = new Date(prev.startDate);
        if (!isNaN(start.getTime())) {
          start.setDate(start.getDate() + Number(selected.growthDaysStandard));
          expectedDate = start.toISOString().split('T')[0];
        }
      }
      return {
        ...prev,
        cropTypeId: cropTypeIdStr,
        expectedHarvestDate: expectedDate,
      };
    });
  };

  // Khi chọn Ngày gieo trồng: cập nhật lại ngày thu hoạch dự kiến nếu đã chọn giống
  const handleStartDateChange = (startDateStr) => {
    setFormData((prev) => {
      let expectedDate = prev.expectedHarvestDate;
      if (selectedCropTypeInfo && selectedCropTypeInfo.growthDaysStandard && startDateStr) {
        const start = new Date(startDateStr);
        if (!isNaN(start.getTime())) {
          start.setDate(start.getDate() + Number(selectedCropTypeInfo.growthDaysStandard));
          expectedDate = start.toISOString().split('T')[0];
        }
      }
      return {
        ...prev,
        startDate: startDateStr,
        expectedHarvestDate: expectedDate,
      };
    });
  };

  // Lấy thông tin phân khu đang chọn
  const selectedZone = zones.find((z) => String(z.id) === String(formData.zoneId));

  // Kiểm tra diện tích gieo trồng có vượt phân khu không
  const isAreaExceeded = Boolean(
    selectedZone &&
    formData.plantedAreaM2 &&
    Number(formData.plantedAreaM2) > Number(selectedZone.areaM2)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.seasonCode.trim()) {
      newErrors.seasonCode = 'Mã mùa vụ không được để trống';
    }
    if (!formData.zoneId) {
      newErrors.zoneId = 'Vui lòng chọn phân khu canh tác';
    }
    if (!formData.cropTypeId) {
      newErrors.cropTypeId = 'Vui lòng chọn giống cây trồng';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày bắt đầu gieo trồng';
    }
    if (!formData.plantedAreaM2 || Number(formData.plantedAreaM2) <= 0) {
      newErrors.plantedAreaM2 = 'Diện tích gieo trồng phải lớn hơn 0 m²';
    } else if (isAreaExceeded) {
      newErrors.plantedAreaM2 = `Diện tích gieo trồng không được vượt quá diện tích phân khu (${formatArea(selectedZone.areaM2)})`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const payload = {
        zoneId: Number(formData.zoneId),
        operationalCycleId: formData.operationalCycleId ? Number(formData.operationalCycleId) : null,
        seasonCode: formData.seasonCode.trim(),
        cropTypeId: Number(formData.cropTypeId),
        startDate: formData.startDate,
        expectedHarvestDate: formData.expectedHarvestDate || null,
        plantedAreaM2: Number(formData.plantedAreaM2),
        seedQuantity: formData.seedQuantity ? Number(formData.seedQuantity) : null,
        estimatedYieldKg: formData.estimatedYieldKg ? Number(formData.estimatedYieldKg) : null,
      };

      if (editingSeason) {
        await farmingService.updateCropSeason(farmId, editingSeason.id, {
          expectedHarvestDate: payload.expectedHarvestDate,
          actualHarvestDate: editingSeason.actualHarvestDate,
          actualYieldKg: editingSeason.actualYieldKg,
          status: editingSeason.status,
        });
        toast.success(`Cập nhật kế hoạch mùa vụ ${payload.seasonCode} thành công!`);
      } else {
        await farmingService.createCropSeason(farmId, payload);
        toast.success(`Khởi tạo mùa vụ ${payload.seasonCode} thành công! Dữ liệu đã chuyển sang bàn làm việc của Trưởng phân khu.`);
      }

      // Thông báo đồng bộ dữ liệu liên Workspace
      notifyDataChanged('zones');
      notifyDataChanged('seasons');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu kế hoạch mùa vụ:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu kế hoạch mùa vụ';
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
      title={editingSeason ? `Sửa Kế Hoạch Mùa Vụ: ${editingSeason.seasonCode}` : 'Mở Kế Hoạch Mùa Vụ Trồng Trọt Mới'}
      subtitle="Thiết lập mùa vụ canh tác, liên kết phân khu nhà màng và chu kỳ vận hành"
      size="lg"
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
            disabled={isAreaExceeded}
          >
            {editingSeason ? 'Lưu Thay Đổi' : 'Khởi Tạo Mùa Vụ'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errors.form && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-rose-800 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Mã mùa vụ & Nút tự sinh */}
        <div>
          <FormField
            label="Mã mùa vụ *"
            error={errors.seasonCode}
            hint={editingSeason ? 'Khóa cứng bất biến khi sửa' : 'Mã tự sinh theo chuẩn SSN-YYMM-XXXX'}
          >
            <div className="flex gap-2">
              <Input
                name="seasonCode"
                value={formData.seasonCode}
                onChange={(e) => setFormData({ ...formData, seasonCode: e.target.value })}
                placeholder="SSN-2610-XXXX"
                readOnly={Boolean(editingSeason)}
                className={editingSeason ? 'bg-slate-100 font-mono text-slate-600 font-bold' : 'font-mono font-bold'}
              />
              {!editingSeason && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={handleGenerateCode}
                  title="Tự sinh mã mới"
                >
                  Tự sinh
                </Button>
              )}
            </div>
          </FormField>
        </div>

        {/* Phân khu canh tác */}
        <div>
          <FormField
            label="Phân khu canh tác *"
            error={errors.zoneId}
            hint={
              selectedZone
                ? `Diện tích tối đa: ${formatArea(selectedZone.areaM2)} • Trưởng khu: ${getZoneManagerName(selectedZone.id)}`
                : 'Chỉ hiển thị các phân khu đang Hoạt động (ACTIVE)'
            }
          >
            <Select
              name="zoneId"
              value={formData.zoneId}
              onChange={(e) => {
                const zId = e.target.value;
                const zoneObj = zones.find((z) => String(z.id) === zId);
                setFormData((prev) => ({
                  ...prev,
                  zoneId: zId,
                  // Gợi ý luôn diện tích phân khu làm diện tích gieo trồng ban đầu
                  plantedAreaM2: prev.plantedAreaM2 || (zoneObj ? String(zoneObj.areaM2) : ''),
                }));
              }}
              disabled={Boolean(editingSeason)}
            >
              <option value="">-- Chọn phân khu nhà màng / đồng ruộng --</option>
              {zones.map((zone) => {
                const mgr = getZoneManagerName(zone.id);
                return (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.code}) - {formatArea(zone.areaM2)} [Trưởng khu: {mgr}]
                  </option>
                );
              })}
            </Select>
          </FormField>
        </div>

        {/* Chu kỳ vận hành & Giống cây trồng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Chu kỳ vận hành"
            hint="Chu kỳ đang 'ACTIVE' hoặc 'PLANNING'"
          >
            <Select
              name="operationalCycleId"
              value={formData.operationalCycleId}
              onChange={(e) => setFormData({ ...formData, operationalCycleId: e.target.value })}
            >
              <option value="">-- Chọn chu kỳ kế toán / mùa vụ --</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.fiscalYear}) [{c.status}]
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Giống cây trồng *"
            error={errors.cropTypeId}
            hint={
              selectedCropTypeInfo
                ? `Thời gian sinh trưởng: ${selectedCropTypeInfo.growthDaysStandard || 0} ngày`
                : 'Chọn giống để tự động tính ngày thu hoạch dự kiến'
            }
          >
            <Select
              name="cropTypeId"
              value={formData.cropTypeId}
              onChange={(e) => handleCropTypeChange(e.target.value)}
              disabled={Boolean(editingSeason)}
            >
              <option value="">-- Chọn giống cây trồng --</option>
              {cropTypes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.varietyCode}) - {c.growthDaysStandard} ngày
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Ngày bắt đầu & Ngày thu hoạch dự kiến */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Ngày bắt đầu gieo trồng *" error={errors.startDate}>
            <Input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </FormField>

          <FormField
            label="Ngày thu hoạch dự kiến"
            hint="Tự động tính = Ngày gieo + Số ngày sinh trưởng chuẩn"
          >
            <Input
              type="date"
              name="expectedHarvestDate"
              value={formData.expectedHarvestDate}
              onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
            />
          </FormField>
        </div>

        {/* Diện tích canh tác & Cảnh báo vượt diện tích */}
        <div>
          <FormField
            label="Diện tích gieo trồng (m²) *"
            error={errors.plantedAreaM2}
            hint={selectedZone ? `Tối đa ${formatArea(selectedZone.areaM2)}` : ''}
          >
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ví dụ: 2500"
              name="plantedAreaM2"
              value={formData.plantedAreaM2}
              onChange={(e) => setFormData({ ...formData, plantedAreaM2: e.target.value })}
            />
          </FormField>

          {isAreaExceeded && (
            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 mt-1.5 font-semibold text-[11px]">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>
                Cảnh báo: Diện tích gieo trồng ({formatArea(formData.plantedAreaM2)}) vượt quá diện tích phân khu ({formatArea(selectedZone.areaM2)})!
              </span>
            </div>
          )}
        </div>

        {/* Lượng giống & Sản lượng dự kiến */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Lượng giống ban đầu (kg/hạt)" hint="Tổng khối lượng hạt giống / cây giống">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ví dụ: 15.5"
              name="seedQuantity"
              value={formData.seedQuantity}
              onChange={(e) => setFormData({ ...formData, seedQuantity: e.target.value })}
            />
          </FormField>

          <FormField label="Sản lượng dự kiến (kg)" hint="Kế hoạch sản lượng ước tính khi thu hoạch">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ví dụ: 4500"
              name="estimatedYieldKg"
              value={formData.estimatedYieldKg}
              onChange={(e) => setFormData({ ...formData, estimatedYieldKg: e.target.value })}
            />
          </FormField>
        </div>

        {/* Thông tin chuyển tiếp cho Role 3 */}
        <div className="flex items-start gap-2.5 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
          <Info className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <strong>Quy trình phân cấp:</strong> Ngay sau khi Giám đốc trại bấm Khởi tạo, mùa vụ sẽ xuất hiện trên màn hình của <strong>Trưởng phân khu ({selectedZone ? getZoneManagerName(selectedZone.id) : 'Role 3'})</strong> để họ tiến hành điều phối kỹ sư, công nhân chăm sóc và ghi nhật ký hiện trường.
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default CropSeasonModal;
