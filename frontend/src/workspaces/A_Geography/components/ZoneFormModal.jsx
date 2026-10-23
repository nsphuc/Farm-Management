import React, { useState, useEffect, useMemo } from 'react';
import { Layers, AlertTriangle, Building, CheckCircle2, RefreshCw } from 'lucide-react';
import { geographyService } from '@/services/modules/geographyService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, CodeInput } from '@/components/ui/FormControls';
import { GeoJsonPolygonEditor } from './GeoJsonPolygonEditor';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { formatArea } from '@/utils/formatters';

import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';

const ALL_ZONE_TYPES = [
  { value: 'GREENHOUSE', label: 'GREENHOUSE - Nhà Màng / Nhà Kính Công Nghệ Cao' },
  { value: 'OPEN_FIELD', label: 'OPEN_FIELD - Đồng Ruộng Mở / Bãi Chăn Thả' },
  { value: 'BARN', label: 'BARN - Chuồng Trại Chăn Nuôi' },
  { value: 'STORAGE', label: 'STORAGE - Kho Bãi & Khu Lưu Trữ Vật Tư' },
  { value: 'ISOLATION', label: 'ISOLATION - Phân Khu Cách Ly & Kiểm Dịch' },
];

const ZONE_STATUSES = [
  { value: 'ACTIVE', label: 'ACTIVE - Đang Canh Tác / Nuôi Trồng' },
  { value: 'FALLOW', label: 'FALLOW - Đang Để Đất Nghỉ / Cải Tạo Đất' },
  { value: 'QUARANTINE', label: 'QUARANTINE - Đang Cách Ly Kiểm Dịch Dịch Bệnh' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE - Chờ Phê Duyệt / Bảo Trì' },
];

export function ZoneFormModal({
  isOpen,
  onClose,
  farms = [],
  initialFarmId = null,
  editingItem = null,
  onSuccess,
}) {
  const { isOwner, isFarmManager } = useAuthStore();
  const { activeFarmId } = useActiveFarmStore();
  const owner = isOwner();
  const farmManager = isFarmManager();
  const isProposalMode = !owner && farmManager && !editingItem;

  // Lọc danh sách farm active
  const activeFarms = useMemo(() => {
    return (farms || []).filter((f) => f.status !== 'INACTIVE');
  }, [farms]);

  // Ngữ cảnh farm đang chọn trong form
  const [selectedFarmId, setSelectedFarmId] = useState('');

  // Tìm đối tượng farm hiện tại
  const currentFarm = useMemo(() => {
    return (farms || []).find((f) => Number(f.id) === Number(selectedFarmId)) || activeFarms[0] || null;
  }, [farms, activeFarms, selectedFarmId]);

  const resolvedFarmType = (currentFarm?.farmType || 'MIXED').toUpperCase();

  // Tự động lọc loại phân khu theo loại hình trang trại
  const availableZoneTypes = useMemo(() => {
    if (resolvedFarmType === 'CROP') {
      return ALL_ZONE_TYPES.filter((t) => t.value !== 'BARN');
    }
    if (resolvedFarmType === 'LIVESTOCK') {
      return ALL_ZONE_TYPES.filter((t) => t.value !== 'GREENHOUSE');
    }
    return ALL_ZONE_TYPES;
  }, [resolvedFarmType]);

  const defaultZoneType = useMemo(() => {
    if (resolvedFarmType === 'LIVESTOCK') return 'BARN';
    return 'GREENHOUSE';
  }, [resolvedFarmType]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    zoneType: 'GREENHOUSE',
    areaM2: 1000,
    soilType: 'Đất phù sa / Đất đỏ bazan',
    waterSource: 'Hệ thống giếng ngầm đạt chuẩn tưới tiêu',
    status: 'ACTIVE',
    mapLayoutJson: null,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  // Khởi tạo ngữ cảnh khi mở Modal
  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setGeneralError('');

    // Xác định farmId ban đầu
    let targetId = null;
    if (editingItem?.farmId) {
      targetId = editingItem.farmId;
    } else if (initialFarmId) {
      targetId = initialFarmId;
    } else if (activeFarmId && activeFarmId !== 'ALL') {
      targetId = Number(activeFarmId);
    } else if (activeFarms.length > 0) {
      targetId = activeFarms[0].id;
    }
    setSelectedFarmId(targetId ? String(targetId) : '');

    const resolvedDefaultType = targetId && (farms || []).find((f) => Number(f.id) === Number(targetId))?.farmType === 'LIVESTOCK' ? 'BARN' : 'GREENHOUSE';

    if (editingItem) {
      setFormData({
        code: editingItem.code || '',
        name: editingItem.name || '',
        zoneType: editingItem.zoneType || resolvedDefaultType,
        areaM2: editingItem.areaM2 ?? 1000,
        soilType: editingItem.soilType || '',
        waterSource: editingItem.waterSource || '',
        status: editingItem.status || 'ACTIVE',
        mapLayoutJson: editingItem.mapLayoutJson || null,
      });
    } else {
      setFormData({
        code: generateEntityCode(CODE_PREFIXES.ZONE),
        name: '',
        zoneType: resolvedDefaultType,
        areaM2: 1000,
        soilType: 'Đất phù sa / Đất đỏ bazan',
        waterSource: 'Hệ thống giếng ngầm đạt chuẩn tưới tiêu',
        status: isProposalMode ? 'MAINTENANCE' : 'ACTIVE',
        mapLayoutJson: null,
      });
    }
  }, [isOpen, editingItem, initialFarmId, activeFarmId, activeFarms, isProposalMode]);

  // Đồng bộ loại phân khu khi farm thay đổi (đảm bảo hợp lệ theo farmType)
  useEffect(() => {
    if (!isOpen) return;
    const isAllowed = availableZoneTypes.some((t) => t.value === formData.zoneType);
    if (!isAllowed && availableZoneTypes.length > 0) {
      setFormData((prev) => ({
        ...prev,
        zoneType: availableZoneTypes[0].value,
      }));
    }
  }, [isOpen, availableZoneTypes, formData.zoneType]);

  // Tính toán diện tích đã phân bổ và còn trống
  const { farmTotalAreaM2, existingSum, remainingArea } = useMemo(() => {
    const total = Number(currentFarm?.totalAreaM2 || 0);
    const sum = (currentFarm?.zones || [])
      .filter((z) => Number(z.id) !== Number(editingItem?.id) && z.status !== 'DELETED')
      .reduce((acc, z) => acc + Number(z.areaM2 || 0), 0);
    const remaining = Math.max(0, total - sum);
    return { farmTotalAreaM2: total, existingSum: sum, remainingArea: remaining };
  }, [currentFarm, editingItem]);

  // Xác định xem có cố định Farm hay hiển thị Dropdown chọn Farm
  const isFarmPreSelected = Boolean(editingItem || initialFarmId);

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

  const handleFarmChange = (e) => {
    const newFarmId = e.target.value;
    setSelectedFarmId(newFarmId);
    if (fieldErrors.farmId) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.farmId;
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!selectedFarmId) {
      errors.farmId = 'Vui lòng chọn Trang trại trực thuộc';
    }
    if (!formData.code.trim()) {
      errors.code = 'Mã phân khu không được để trống';
    }
    if (!formData.name.trim()) {
      errors.name = 'Tên phân khu không được để trống';
    }
    if (Number(formData.areaM2) <= 0) {
      errors.areaM2 = 'Diện tích phải lớn hơn 0 m²';
    }

    // Kiểm tra tổng diện tích các phân khu không vượt quá diện tích trang trại
    const newTotalArea = existingSum + Number(formData.areaM2 || 0);
    if (farmTotalAreaM2 > 0 && newTotalArea > farmTotalAreaM2) {
      errors.areaM2 = `Tổng diện tích phân khu (${newTotalArea.toLocaleString()} m²) vượt quá tổng diện tích trang trại (${farmTotalAreaM2.toLocaleString()} m²)`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const targetFarmIdNumber = Number(selectedFarmId);

      const payload = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        zoneType: formData.zoneType,
        areaM2: Number(formData.areaM2),
        soilType: formData.soilType?.trim() || null,
        waterSource: formData.waterSource?.trim() || null,
        mapLayoutJson: formData.mapLayoutJson || null,
        status: isProposalMode ? 'MAINTENANCE' : formData.status,
      };

      let result;
      if (editingItem) {
        result = await geographyService.updateZone(targetFarmIdNumber, editingItem.id, payload);
        toast.success(`Cập nhật phân khu "${payload.name}" thành công!`);
      } else {
        result = await geographyService.createZone(targetFarmIdNumber, payload);
        if (isProposalMode) {
          toast.success(`Đã gửi đề xuất mở phân khu "${payload.name}" đến Chủ đầu tư! (Trạng thái: ⏳ Chờ Owner phê duyệt)`);
        } else {
          toast.success(`Tạo mới phân khu "${payload.name}" thành công!`);
        }
      }

      onSuccess?.(result || payload, targetFarmIdNumber);
      onClose();
    } catch (err) {
      const errMsg = applyServerFieldErrors(err, setFieldErrors);
      setGeneralError(errMsg || 'Đã xảy ra lỗi khi lưu phân khu. Vui lòng thử lại!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingItem
          ? 'Chỉnh Sửa Phân Khu Canh Tác'
          : isProposalMode
          ? 'Đề Xuất Thêm Phân Khu Mới (Chờ Owner Phê Duyệt)'
          : 'Thêm Mới Phân Khu Canh Tác'
      }
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSubmit}>
            {editingItem ? 'Lưu Thay Đổi' : isProposalMode ? 'Gửi Đề Xuất Mở Phân Khu' : 'Tạo Phân Khu'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner Đề xuất cho Quản lý trang trại */}
        {isProposalMode && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-bold">Đề xuất mở phân khu mới:</strong>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Phân khu do Giám đốc trang trại đề xuất sẽ được khởi tạo ở trạng thái{' '}
                <span className="font-bold font-mono text-amber-900">MAINTENANCE (⏳ Chờ duyệt)</span>.
                Chủ đầu tư (Owner) sẽ nhận được thông báo để phê duyệt trước khi phân công nhân sự và gieo cấy.
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

        {/* 1. Ngữ cảnh Trang trại (Farm Context) */}
        {isFarmPreSelected && currentFarm ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
              <Building className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Trang Trại Trực Thuộc
              </div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2 mt-0.5 truncate">
                <span className="truncate">{currentFarm.name}</span>
                <span className="font-mono text-xs text-slate-500 font-semibold shrink-0">({currentFarm.code})</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold shrink-0">
                  {currentFarm.farmType}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <FormField
            label="Trang Trại Trực Thuộc"
            required
            error={fieldErrors.farmId}
            hint="Chọn trang trại bạn muốn phân bổ mặt bằng phân khu"
          >
            <Select
              name="farmId"
              value={selectedFarmId}
              onChange={handleFarmChange}
              options={activeFarms.map((f) => ({
                value: String(f.id),
                label: `${f.name} (${f.code} • ${f.farmType} • ${formatArea(f.totalAreaM2)})`,
              }))}
            />
          </FormField>
        )}

        {/* Thống kê diện tích mặt bằng */}
        {farmTotalAreaM2 > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-600">
              Tổng diện tích trại: <strong className="font-mono text-slate-900 font-bold">{formatArea(farmTotalAreaM2)}</strong>
            </span>
            <span className="text-slate-600">
              Đã phân bổ: <strong className="font-mono text-blue-700 font-bold">{formatArea(existingSum)}</strong>
            </span>
            <span className="text-slate-600">
              Còn trống: <strong className="font-mono text-emerald-700 font-bold">{formatArea(remainingArea)}</strong>
            </span>
          </div>
        )}

        {/* 2. Mã và Tên phân khu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Mã Phân Khu"
            required
            error={fieldErrors.code}
            hint={editingItem ? 'Mã phân khu bất biến không thể sửa' : 'Hệ thống tự động sinh mã chuẩn ZON-...'}
          >
            <CodeInput
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              onRegenerate={() => setFormData((prev) => ({ ...prev, code: generateEntityCode(CODE_PREFIXES.ZONE) }))}
              isEditMode={Boolean(editingItem)}
              error={fieldErrors.code}
            />
          </FormField>

          <FormField label="Tên Phân Khu" required error={fieldErrors.name}>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={
                resolvedFarmType === 'LIVESTOCK'
                  ? 'VD: Khu Chuồng Nuôi Heo Thịt Số 01'
                  : 'VD: Phân Khu A - Nhà Màng Dưa Lưới'
              }
            />
          </FormField>
        </div>

        {/* 3. Loại phân khu (Lọc theo farmType) và Trạng thái */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Loại Phân Khu"
            required
            error={fieldErrors.zoneType}
            hint={
              resolvedFarmType === 'CROP'
                ? '🌾 Trại Trồng trọt: Cho phép Nhà màng, Đồng ruộng, Kho, Cách ly'
                : resolvedFarmType === 'LIVESTOCK'
                ? '🐄 Trại Chăn nuôi: Cho phép Chuồng trại, Bãi chăn thả, Kho, Cách ly thú y'
                : '🌱 Trại Hỗn hợp: Đầy đủ 5 loại phân khu canh tác & chăn nuôi'
            }
          >
            <Select
              name="zoneType"
              value={formData.zoneType}
              onChange={handleChange}
              options={availableZoneTypes}
            />
          </FormField>

          <FormField
            label="Trạng Thái Vận Hành"
            required
            error={fieldErrors.status}
            hint={isProposalMode ? 'Cố định MAINTENANCE khi gửi đề xuất chờ Owner duyệt' : undefined}
          >
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={ZONE_STATUSES}
              disabled={isProposalMode}
            />
          </FormField>
        </div>

        {/* 4. Diện tích, Thổ nhưỡng, Nguồn nước */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              placeholder="VD: Giếng khoan ngầm RO"
            />
          </FormField>
        </div>

        {/* 5. Khung trực quan GeoJSON Polygon */}
        <GeoJsonPolygonEditor
          value={formData.mapLayoutJson}
          onChange={(json) => setFormData((prev) => ({ ...prev, mapLayoutJson: json }))}
          farmCenter={currentFarm}
        />
      </form>
    </Modal>
  );
}

export default ZoneFormModal;
