import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, AlertTriangle, Building, Layers, Plus } from 'lucide-react';
import { geographyService } from '@/services/modules/geographyService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea, CodeInput } from '@/components/ui/FormControls';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';

const LOCATION_STATUSES = [
  { value: 'EMPTY', label: 'EMPTY - Còn trống (chưa gieo trồng / thả đàn)' },
  { value: 'ACTIVE', label: 'ACTIVE - Sẵn sàng sản xuất / canh tác' },
  { value: 'OCCUPIED', label: 'OCCUPIED - Đang có cây trồng / đàn vật nuôi' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE - Đang khử trùng / bảo dưỡng kỹ thuật' },
];

export function LocationFormModal({
  isOpen,
  onClose,
  farms = [],
  initialFarmId = null,
  initialZoneId = null,
  editingItem = null,
  onOpenZoneModal,
  onSuccess,
}) {
  const { activeFarmId } = useActiveFarmStore();

  // Danh sách trang trại active
  const activeFarms = useMemo(() => {
    return (farms || []).filter((f) => f.status !== 'INACTIVE');
  }, [farms]);

  // Ngữ cảnh farm & zone được chọn trong form
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');

  // Đối tượng Farm hiện tại
  const currentFarm = useMemo(() => {
    return (farms || []).find((f) => Number(f.id) === Number(selectedFarmId)) || activeFarms[0] || null;
  }, [farms, activeFarms, selectedFarmId]);

  // Danh sách phân khu ACTIVE trực thuộc Farm được chọn
  const activeZones = useMemo(() => {
    return (currentFarm?.zones || []).filter((z) => z.status === 'ACTIVE');
  }, [currentFarm]);

  // Đối tượng Zone hiện tại
  const currentZone = useMemo(() => {
    return (currentFarm?.zones || []).find((z) => Number(z.id) === Number(selectedZoneId)) || activeZones[0] || null;
  }, [currentFarm, activeZones, selectedZoneId]);

  const zoneType = (currentZone?.zoneType || 'GREENHOUSE').toUpperCase();

  // Xác định xem ngữ cảnh có bị khóa cứng hay cho phép chọn cascading
  const isLockedContext = Boolean(editingItem || (initialFarmId && initialZoneId));

  // Nhãn động theo loại phân khu
  const dynamicConfig = useMemo(() => {
    if (zoneType === 'BARN') {
      return {
        titleCreate: 'Thêm Ô Chuồng / Dãy Chuồng Chăn Nuôi',
        titleEdit: 'Chỉnh Sửa Ô Chuồng / Dãy Chuồng Chăn Nuôi',
        codePrefix: 'LOC-BARN',
        nameLabel: 'Tên Ô Chuồng / Dãy Chuồng',
        namePlaceholder: 'VD: Ô chuồng số 01, Dãy chuồng heo thịt B1',
        descLabel: 'Mô Tả Quy Cách Ô Chuồng',
        descPlaceholder: 'VD: Diện tích 30m², sức chứa 20 con, có sàn đan bê tông và máng ăn tự động',
        btnSubmit: 'Tạo Ô Chuồng Mới',
      };
    }
    if (zoneType === 'GREENHOUSE' || zoneType === 'OPEN_FIELD') {
      return {
        titleCreate: 'Thêm Luống / Lô Đất Canh Tác',
        titleEdit: 'Chỉnh Sửa Luống / Lô Đất Canh Tác',
        codePrefix: 'LOC-PLOT',
        nameLabel: 'Tên Luống / Lô Đất Canh Tác',
        namePlaceholder: 'VD: Luống Dưa Lưới 01, Lô Đất A1',
        descLabel: 'Mô Tả Luống / Lô Đất',
        descPlaceholder: 'VD: Chiều dài 30m, rộng 1.2m, màng phủ nông nghiệp kèm vòi tưới nhỏ giọt',
        btnSubmit: 'Tạo Luống / Lô Đất Mới',
      };
    }
    if (zoneType === 'STORAGE') {
      return {
        titleCreate: 'Thêm Kệ / Vị Trí Kho Lưu Trữ',
        titleEdit: 'Chỉnh Sửa Kệ / Vị Trí Kho Lưu Trữ',
        codePrefix: 'LOC-STR',
        nameLabel: 'Tên Kệ / Vị Trí Lưu Trữ',
        namePlaceholder: 'VD: Kệ Chứa Phân Bón K1, Dãy Giá 02',
        descLabel: 'Mô Tả Vị Trí Kho',
        descPlaceholder: 'VD: Tải trọng tối đa 1.000 kg, thoáng mát, đạt chuẩn GSP',
        btnSubmit: 'Tạo Vị Trí Kho Mới',
      };
    }
    if (zoneType === 'ISOLATION') {
      return {
        titleCreate: 'Thêm Ô / Khu Vực Cách Ly Kiểm Dịch',
        titleEdit: 'Chỉnh Sửa Ô / Khu Vực Cách Ly Kiểm Dịch',
        codePrefix: 'LOC-ISO',
        nameLabel: 'Tên Ô Cách Ly Kiểm Dịch',
        namePlaceholder: 'VD: Ô cách ly thú y số 01, Khu kiểm dịch K1',
        descLabel: 'Mô Tả Quy Cách Ô Cách Ly',
        descPlaceholder: 'VD: Hàng rào lưới ngăn cách hoàn toàn, có hố sát trùng trước cửa',
        btnSubmit: 'Tạo Ô Cách Ly Mới',
      };
    }
    return {
      titleCreate: 'Thêm Mới Vị Trí / Ô / Chuồng',
      titleEdit: 'Chỉnh Sửa Vị Trí / Ô / Chuồng',
      codePrefix: 'LOC',
      nameLabel: 'Tên Vị Trí / Luống / Chuồng',
      namePlaceholder: 'VD: Vị trí 01',
      descLabel: 'Mô Tả Chi Tiết Vị Trí',
      descPlaceholder: 'VD: Kích thước, quy cách, thiết bị đi kèm...',
      btnSubmit: 'Tạo Vị Trí Mới',
    };
  }, [zoneType]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'EMPTY',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  // Khởi tạo ngữ cảnh khi Modal mở
  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setGeneralError('');

    // Xác định Farm ID ban đầu
    let targetFarm = null;
    if (editingItem?.farmId) {
      targetFarm = editingItem.farmId;
    } else if (initialFarmId) {
      targetFarm = initialFarmId;
    } else if (activeFarmId && activeFarmId !== 'ALL') {
      targetFarm = Number(activeFarmId);
    } else if (activeFarms.length > 0) {
      targetFarm = activeFarms[0].id;
    }
    const resolvedFarmIdStr = targetFarm ? String(targetFarm) : '';
    setSelectedFarmId(resolvedFarmIdStr);

    // Xác định Zone ID ban đầu
    const matchedFarm = (farms || []).find((f) => Number(f.id) === Number(targetFarm));
    const farmActiveZones = (matchedFarm?.zones || []).filter((z) => z.status === 'ACTIVE');

    let targetZone = null;
    if (editingItem?.zoneId) {
      targetZone = editingItem.zoneId;
    } else if (initialZoneId) {
      targetZone = initialZoneId;
    } else if (farmActiveZones.length > 0) {
      targetZone = farmActiveZones[0].id;
    }
    const resolvedZoneIdStr = targetZone ? String(targetZone) : '';
    setSelectedZoneId(resolvedZoneIdStr);

    // Xác định prefix theo zone
    const matchedZone = (matchedFarm?.zones || []).find((z) => Number(z.id) === Number(targetZone));
    const matchedZoneType = (matchedZone?.zoneType || 'GREENHOUSE').toUpperCase();
    const prefix = matchedZoneType === 'BARN' ? 'LOC-BARN' : matchedZoneType === 'STORAGE' ? 'LOC-STR' : matchedZoneType === 'ISOLATION' ? 'LOC-ISO' : 'LOC-PLOT';

    if (editingItem) {
      setFormData({
        code: editingItem.code || '',
        name: editingItem.name || '',
        description: editingItem.description || '',
        status: editingItem.status || 'EMPTY',
      });
    } else {
      setFormData({
        code: generateEntityCode(prefix),
        name: '',
        description: '',
        status: 'EMPTY',
      });
    }
  }, [isOpen, editingItem, initialFarmId, initialZoneId, activeFarmId, activeFarms, farms]);

  // Khi người dùng đổi Farm trong dropdown Cascading
  const handleFarmChange = (e) => {
    const newFarmId = e.target.value;
    setSelectedFarmId(newFarmId);

    // Tự động chọn zone đầu tiên của farm mới
    const newFarm = (farms || []).find((f) => Number(f.id) === Number(newFarmId));
    const newActiveZones = (newFarm?.zones || []).filter((z) => z.status === 'ACTIVE');
    const newZoneId = newActiveZones.length > 0 ? String(newActiveZones[0].id) : '';
    setSelectedZoneId(newZoneId);

    // Tự động đổi mã code gợi ý theo loại zone mới
    if (!editingItem && newActiveZones.length > 0) {
      const zType = (newActiveZones[0].zoneType || 'GREENHOUSE').toUpperCase();
      const pfx = zType === 'BARN' ? 'LOC-BARN' : zType === 'STORAGE' ? 'LOC-STR' : zType === 'ISOLATION' ? 'LOC-ISO' : 'LOC-PLOT';
      setFormData((prev) => ({ ...prev, code: generateEntityCode(pfx) }));
    }

    if (fieldErrors.farmId) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.farmId;
        return next;
      });
    }
  };

  // Khi người dùng đổi Zone trong dropdown Cascading
  const handleZoneChange = (e) => {
    const newZoneId = e.target.value;
    setSelectedZoneId(newZoneId);

    // Tự động sinh mã mới nếu chưa nhập tên hoặc là tạo mới
    if (!editingItem) {
      const newZone = activeZones.find((z) => String(z.id) === String(newZoneId));
      if (newZone) {
        const zType = (newZone.zoneType || 'GREENHOUSE').toUpperCase();
        const pfx = zType === 'BARN' ? 'LOC-BARN' : zType === 'STORAGE' ? 'LOC-STR' : zType === 'ISOLATION' ? 'LOC-ISO' : 'LOC-PLOT';
        setFormData((prev) => ({ ...prev, code: generateEntityCode(pfx) }));
      }
    }

    if (fieldErrors.zoneId) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.zoneId;
        return next;
      });
    }
  };

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

    if (!selectedFarmId) {
      errors.farmId = 'Vui lòng chọn Trang trại trực thuộc';
    }
    if (!selectedZoneId) {
      errors.zoneId = 'Vui lòng chọn Phân khu canh tác';
    }
    if (!formData.code.trim()) {
      errors.code = 'Mã vị trí / luống không được để trống';
    }
    if (!formData.name.trim()) {
      errors.name = `${dynamicConfig.nameLabel} không được để trống`;
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
      const targetZoneIdNumber = Number(selectedZoneId);

      const payload = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        status: formData.status,
      };

      let result;
      if (editingItem) {
        result = await geographyService.updateLocation(targetFarmIdNumber, targetZoneIdNumber, editingItem.id, payload);
        toast.success(`Cập nhật "${payload.name}" thành công!`);
      } else {
        result = await geographyService.createLocation(targetFarmIdNumber, targetZoneIdNumber, payload);
        toast.success(`Tạo mới "${payload.name}" thành công!`);
      }

      onSuccess?.(result || payload, targetFarmIdNumber, targetZoneIdNumber);
      onClose();
    } catch (err) {
      const errMsg = applyServerFieldErrors(err, setFieldErrors);
      setGeneralError(errMsg || 'Đã xảy ra lỗi khi lưu vị trí. Vui lòng kiểm tra lại!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? dynamicConfig.titleEdit : dynamicConfig.titleCreate}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={saving}
            disabled={!selectedZoneId || activeZones.length === 0}
            onClick={handleSubmit}
          >
            {editingItem ? 'Lưu Thay Đổi' : dynamicConfig.btnSubmit}
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

        {/* 1. Ngữ cảnh Trang trại -> Phân khu (Cascading Selector) */}
        {isLockedContext && currentFarm && currentZone ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-purple-200 bg-purple-50/80 p-3 text-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">
                Vị Trí Trực Thuộc Phân Khu
              </div>
              <div className="flex items-center gap-1.5 flex-wrap font-bold text-slate-900 mt-0.5 truncate">
                <span className="truncate">{currentFarm.name}</span>
                <span className="text-slate-400 font-normal">&rarr;</span>
                <span className="text-purple-900 font-bold truncate">{currentZone.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 font-mono text-[10px] font-bold shrink-0">
                  {currentZone.zoneType}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-500" />
              Chọn Phân Cấp Mặt Bằng (Trang Trại &rarr; Phân Khu)
            </div>

            {/* Bước 1: Chọn Trang Trại */}
            <FormField label="1. Trang Trại" required error={fieldErrors.farmId}>
              <Select
                name="farmId"
                value={selectedFarmId}
                onChange={handleFarmChange}
                options={activeFarms.map((f) => ({
                  value: String(f.id),
                  label: `${f.name} (${f.code} • ${f.farmType})`,
                }))}
              />
            </FormField>

            {/* Bước 2: Chọn Phân Khu hoặc Hiển thị Smart Empty State */}
            {activeZones.length === 0 ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2 text-xs animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Trang trại "{currentFarm?.name}" chưa có phân khu ACTIVE nào!</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Cần có ít nhất một phân khu ở trạng thái hoạt động (ACTIVE) trước khi thêm các luống đất hoặc ô chuồng chi tiết.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="xs"
                  onClick={() => onOpenZoneModal?.(currentFarm?.id)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold w-full justify-center shadow-xs"
                  icon={<Plus className="h-3.5 w-3.5" />}
                >
                  [+ Tạo Phân Khu Cho Trang Trại Này Ngay]
                </Button>
              </div>
            ) : (
              <FormField label="2. Phân Khu Canh Tác" required error={fieldErrors.zoneId}>
                <Select
                  name="zoneId"
                  value={selectedZoneId}
                  onChange={handleZoneChange}
                  options={activeZones.map((z) => ({
                    value: String(z.id),
                    label: `${z.name} (${z.code} • ${z.zoneType})`,
                  }))}
                />
              </FormField>
            )}
          </div>
        )}

        {/* 2. Mã vị trí */}
        <FormField
          label="Mã Vị Trí / Ô Đất / Chuồng"
          required
          error={fieldErrors.code}
          hint={editingItem ? 'Mã vị trí bất biến không thể sửa' : `Hệ thống tự động sinh mã gợi ý ${dynamicConfig.codePrefix}-...`}
        >
          <CodeInput
            value={formData.code}
            onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            onRegenerate={() => setFormData((prev) => ({ ...prev, code: generateEntityCode(dynamicConfig.codePrefix) }))}
            isEditMode={Boolean(editingItem)}
            error={fieldErrors.code}
          />
        </FormField>

        {/* 3. Tên vị trí (Thích ứng theo zoneType) */}
        <FormField label={dynamicConfig.nameLabel} required error={fieldErrors.name}>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={dynamicConfig.namePlaceholder}
          />
        </FormField>

        {/* 4. Trạng thái vận hành */}
        <FormField label="Trạng Thái Vận Hành" required error={fieldErrors.status}>
          <Select
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={LOCATION_STATUSES}
          />
        </FormField>

        {/* 5. Mô tả quy cách */}
        <FormField label={dynamicConfig.descLabel}>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            placeholder={dynamicConfig.descPlaceholder}
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default LocationFormModal;
