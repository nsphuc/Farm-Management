import React, { useState, useEffect } from 'react';
import { Layers, AlertCircle, Info, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, CodeInput } from '@/components/ui/FormControls';
import { farmingService } from '@/services/modules/farmingService';
import { masterDataService } from '@/services/modules/masterDataService';
import { geographyService } from '@/services/modules/geographyService';
import { partnerService } from '@/services/modules/partnerService';
import { generateEntityCode, commitSequentialCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function LivestockGroupModal({
  isOpen,
  onClose,
  farmId,
  editingGroup = null,
  groups = [],
  onSuccess,
}) {
  const { notifyDataChanged } = useActiveFarmStore();

  const [formData, setFormData] = useState({
    groupCode: '',
    managementType: 'INDIVIDUAL_TAGGED',
    breedId: '',
    zoneId: '',
    locationId: '',
    operationalCycleId: '',
    entryDate: new Date().toISOString().split('T')[0],
    initialQuantity: '',
    currentQuantity: '',
    avgInitialWeightKg: '',
    partnerId: '',
    unitPrice: '',
    totalCost: '',
    healthCertificate: '',
    origin: '',
    notes: '',
  });

  const [zones, setZones] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [cycles, setCycles] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [partners, setPartners] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoOpenBatchTagging, setAutoOpenBatchTagging] = useState(true);



  // Nạp dữ liệu danh mục khi mở Modal
  useEffect(() => {
    if (!isOpen || !farmId) return;

    const loadMetadata = async () => {
      try {
        const [zonesRes, cyclesRes, breedsRes, assignmentsRes, partnersRes] = await Promise.all([
          geographyService.getZones(farmId).catch(() => []),
          geographyService.getCycles(farmId).catch(() => []),
          masterDataService.getLivestockBreeds().catch(() => []),
          geographyService.getAssignments(farmId).catch(() => []),
          partnerService.getPartners().catch(() => []),
        ]);

        const rawZones = Array.isArray(zonesRes) ? zonesRes : (zonesRes?.content || []);
        const activeZones = rawZones.filter((z) => z.status === 'ACTIVE');
        setZones(activeZones);

        const rawCycles = Array.isArray(cyclesRes) ? cyclesRes : (cyclesRes?.content || []);
        const validCycles = rawCycles.filter(
          (c) => c.status === 'ACTIVE' || c.status === 'PLANNING'
        );
        setCycles(validCycles);

        const rawBreeds = Array.isArray(breedsRes) ? breedsRes : (breedsRes?.content || []);
        setBreeds(rawBreeds);

        const rawAssign = Array.isArray(assignmentsRes) ? assignmentsRes : (assignmentsRes?.content || []);
        setAssignments(rawAssign);

        const rawPartners = Array.isArray(partnersRes) ? partnersRes : (partnersRes?.content || []);
        const suppliers = rawPartners.filter((p) => !p.partnerType || p.partnerType === 'SUPPLIER' || p.partnerType === 'AGENT');
        setPartners(suppliers.length > 0 ? suppliers : rawPartners);
      } catch (err) {
        console.error('Lỗi khi nạp danh mục chăn nuôi:', err);
      }
    };

    loadMetadata();
  }, [isOpen, farmId]);

  // Tải danh sách Ô / Chuồng cụ thể thuộc phân khu
  const loadLocationsForZone = async (zId) => {
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
      console.error('Lỗi khi nạp vị trí ô chuồng:', err);
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Thiết lập form khi mở hoặc chuyển chế độ Thêm / Sửa
  useEffect(() => {
    if (!isOpen) return;

    if (editingGroup) {
      setFormData({
        groupCode: editingGroup.groupCode || '',
        managementType: editingGroup.managementType || 'INDIVIDUAL_TAGGED',
        breedId: editingGroup.breedId ? String(editingGroup.breedId) : '',
        zoneId: editingGroup.zoneId ? String(editingGroup.zoneId) : '',
        locationId: editingGroup.locationId ? String(editingGroup.locationId) : '',
        operationalCycleId: editingGroup.operationalCycleId ? String(editingGroup.operationalCycleId) : '',
        entryDate: editingGroup.entryDate ? String(editingGroup.entryDate).split('T')[0] : '',
        initialQuantity: editingGroup.initialQuantity ? String(editingGroup.initialQuantity) : '',
        currentQuantity: editingGroup.currentQuantity ? String(editingGroup.currentQuantity) : '',
        avgInitialWeightKg: editingGroup.avgInitialWeightKg ? String(editingGroup.avgInitialWeightKg) : '',
        partnerId: editingGroup.partnerId ? String(editingGroup.partnerId) : '',
        unitPrice: editingGroup.unitPrice ? String(editingGroup.unitPrice) : '',
        totalCost: editingGroup.totalCost ? String(editingGroup.totalCost) : '',
        healthCertificate: editingGroup.healthCertificate || '',
        origin: editingGroup.origin || '',
        notes: editingGroup.notes || '',
        status: editingGroup.status || 'ACTIVE',
      });
      if (editingGroup.zoneId) {
        loadLocationsForZone(editingGroup.zoneId);
      }
    } else {
      setFormData({
        groupCode: generateEntityCode(CODE_PREFIXES.LIVESTOCK_GROUP, groups),
        managementType: 'INDIVIDUAL_TAGGED',
        breedId: '',
        zoneId: '',
        locationId: '',
        operationalCycleId: '',
        entryDate: new Date().toISOString().split('T')[0],
        initialQuantity: '',
        currentQuantity: '',
        avgInitialWeightKg: '',
        partnerId: '',
        unitPrice: '',
        totalCost: '',
        healthCertificate: '',
        origin: '',
        notes: '',
      });
      setLocations([]);
    }
    setErrors({});
  }, [isOpen, editingGroup, farmId]);

  // Tìm Trưởng phân khu phụ trách cho từng zone
  const getZoneManagerName = (zoneId) => {
    if (!zoneId) return 'Chưa có trưởng khu';
    const numId = Number(zoneId);
    const assign = assignments.find(
      (a) => Number(a.zoneId) === numId && a.roleInFarm === 'ZONE_MANAGER' && a.isActive !== false
    );
    if (!assign) return 'Chưa có trưởng khu';
    return assign.userFullName || assign.username || 'Trưởng khu';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.groupCode.trim()) {
      newErrors.groupCode = 'Mã đàn nuôi không được để trống';
    }
    if (!formData.breedId) {
      newErrors.breedId = 'Vui lòng chọn giống vật nuôi';
    }
    if (!formData.zoneId) {
      newErrors.zoneId = 'Vui lòng chọn phân khu chuồng trại';
    }
    if (!formData.entryDate) {
      newErrors.entryDate = 'Vui lòng chọn ngày nhập đàn';
    }
    if (!formData.initialQuantity || Number(formData.initialQuantity) <= 0) {
      newErrors.initialQuantity = 'Số lượng con ban đầu phải lớn hơn 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      let createdGroup = null;
      if (editingGroup) {
        await farmingService.updateLivestockGroup(farmId, editingGroup.id, {
          zoneId: Number(formData.zoneId),
          locationId: formData.locationId ? Number(formData.locationId) : null,
          currentQuantity: formData.currentQuantity ? Number(formData.currentQuantity) : Number(formData.initialQuantity),
          status: formData.status || editingGroup.status,
        });
        toast.success(`Cập nhật thông tin đàn nuôi ${formData.groupCode} thành công!`);
      } else {
        const payload = {
          zoneId: Number(formData.zoneId),
          locationId: formData.locationId ? Number(formData.locationId) : null,
          operationalCycleId: formData.operationalCycleId ? Number(formData.operationalCycleId) : null,
          groupCode: formData.groupCode.trim(),
          managementType: formData.managementType || 'INDIVIDUAL_TAGGED',
          breedId: Number(formData.breedId),
          partnerId: formData.partnerId ? Number(formData.partnerId) : null,
          initialQuantity: Number(formData.initialQuantity),
          unitPrice: formData.unitPrice ? Number(formData.unitPrice) : null,
          totalCost: formData.totalCost ? Number(formData.totalCost) : null,
          avgInitialWeightKg: formData.avgInitialWeightKg ? Number(formData.avgInitialWeightKg) : null,
          healthCertificate: formData.healthCertificate?.trim() || null,
          origin: formData.origin?.trim() || null,
          notes: formData.notes?.trim() || null,
          entryDate: formData.entryDate,
        };
        createdGroup = await farmingService.createLivestockGroup(farmId, payload);
        commitSequentialCode(CODE_PREFIXES.LIVESTOCK_GROUP, payload.groupCode);
        toast.success(`Khởi tạo đàn nuôi ${payload.groupCode} thành công! Đã tự động cập nhật công nợ và chi phí đàn.`);
      }

      // Thông báo đồng bộ dữ liệu liên Workspace (WS-E <-> WS-A)
      notifyDataChanged('all');
      notifyDataChanged('zones');
      notifyDataChanged('locations');
      notifyDataChanged('groups');

      if (onSuccess) {
        onSuccess(createdGroup, autoOpenBatchTagging && formData.managementType === 'INDIVIDUAL_TAGGED');
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu đàn nuôi:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu đàn nuôi';
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
      title={editingGroup ? `Sửa Đàn Vật Nuôi: ${editingGroup.groupCode}` : 'Nhập Đàn / Lứa Vật Nuôi Mới'}
      subtitle="Khai báo đàn gia súc/gia cầm gắn với chu kỳ vận hành và chuồng trại"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {editingGroup ? 'Lưu Thay Đổi' : 'Nhập Đàn Nuôi'}
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

        {/* Mã đàn tự động tăng dần (Chỉ đọc) */}
        <div>
          <FormField
            label="Mã đàn / lứa nuôi *"
            error={errors.groupCode}
            hint="Mã định danh tự động tăng dần do hệ thống cấp (Chỉ đọc)"
          >
            <CodeInput
              value={formData.groupCode}
              placeholder="GRP-001"
              error={errors.groupCode}
            />
          </FormField>
        </div>

        {/* Trạng thái đàn nuôi (Khi chỉnh sửa) */}
        {editingGroup && (
          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
            <FormField label="Trạng Thái Đàn Nuôi (Điều chỉnh thủ công)" hint="Giám đốc có thể chuyển nhanh trạng thái cách ly kiểm dịch hoặc xuất bán tại đây">
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Đang nuôi dưỡng (ACTIVE)</option>
                <option value="QUARANTINED">Đang cách ly kiểm dịch (QUARANTINED)</option>
                <option value="SOLD">Đã xuất chuồng / bán hết (SOLD)</option>
                <option value="CULLED">Đã loại thải / thanh lý (CULLED)</option>
              </Select>
            </FormField>
          </div>
        )}

        {/* Giống vật nuôi & Phân khu chuồng trại */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Giống vật nuôi *" error={errors.breedId}>
            <Select
              name="breedId"
              value={formData.breedId}
              onChange={(e) => {
                const bId = e.target.value;
                const selectedBreed = breeds.find((b) => String(b.id) === String(bId));
                let mType = formData.managementType;
                if (selectedBreed) {
                  if (selectedBreed.managementType) {
                    mType = selectedBreed.managementType;
                  } else if (selectedBreed.species === 'POULTRY') {
                    mType = 'FLOCK_HERD';
                  } else {
                    mType = 'INDIVIDUAL_TAGGED';
                  }
                }
                setFormData((prev) => ({
                  ...prev,
                  breedId: bId,
                  managementType: mType,
                }));
              }}
              disabled={Boolean(editingGroup)}
            >
              <option value="">-- Chọn giống gia súc / gia cầm --</option>
              {breeds.map((b) => {
                const speciesText =
                  b.species === 'SWINE' ? 'Heo/Lợn' :
                  b.species === 'CATTLE' ? 'Bò' :
                  b.species === 'POULTRY' ? 'Gia cầm' :
                  b.species === 'GOAT' ? 'Dê' :
                  b.species === 'SHEEP' ? 'Cừu' : b.species;
                return (
                  <option key={b.id} value={b.id}>
                    {b.breedName || b.name} ({speciesText})
                  </option>
                );
              })}
            </Select>
          </FormField>

          <FormField
            label="Phân khu chuồng nuôi *"
            error={errors.zoneId}
            hint="Chỉ hiển thị các phân khu chuồng đang Hoạt động"
          >
            <Select
              name="zoneId"
              value={formData.zoneId}
              onChange={(e) => {
                const zId = e.target.value;
                setFormData((prev) => ({ ...prev, zoneId: zId, locationId: '' }));
                if (zId) {
                  loadLocationsForZone(zId);
                } else {
                  setLocations([]);
                }
              }}
            >
              <option value="">-- Chọn ô chuồng / phân khu --</option>
              {zones.map((zone) => {
                const mgr = getZoneManagerName(zone.id);
                return (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.code}) [Phụ trách: {mgr}]
                  </option>
                );
              })}
            </Select>
          </FormField>
        </div>

        {/* PHƯƠNG THỨC QUẢN LÝ ĐÀN: FLOCK_HERD vs INDIVIDUAL_TAGGED */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
          <label className="block text-[11px] font-bold text-slate-800">
            Phương thức phân loại & quản lý đàn:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={Boolean(editingGroup)}
              onClick={() => setFormData((prev) => ({ ...prev, managementType: 'FLOCK_HERD' }))}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                formData.managementType === 'FLOCK_HERD'
                  ? 'border-cyan-500 bg-cyan-50/70 text-cyan-900 ring-1 ring-cyan-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100/60'
              }`}
            >
              <span className="text-lg">🦆</span>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>Nuôi Theo Bầy / Đàn</span>
                  {formData.managementType === 'FLOCK_HERD' && (
                    <span className="text-[10px] bg-cyan-200 text-cyan-800 px-1.5 py-0.2 rounded font-bold">Đang chọn</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Gia cầm, thủy cầm (gà, vịt, ngan, cút...). Quản lý tỷ lệ sống, cám FCR theo tổng đàn, không gắn thẻ tai.
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={Boolean(editingGroup)}
              onClick={() => setFormData((prev) => ({ ...prev, managementType: 'INDIVIDUAL_TAGGED' }))}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                formData.managementType === 'INDIVIDUAL_TAGGED'
                  ? 'border-purple-500 bg-purple-50/70 text-purple-900 ring-1 ring-purple-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100/60'
              }`}
            >
              <span className="text-lg">🐄</span>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>Quản Lý Cá Thể Gắn Thẻ Tai</span>
                  {formData.managementType === 'INDIVIDUAL_TAGGED' && (
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-bold">Đang chọn</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Gia súc lớn (bò, heo, dê, cừu...). Mỗi con mang thẻ tai RFID, theo dõi cân nặng ADG, phả hệ, bệnh án riêng.
                </p>
              </div>
            </button>
          </div>

          {!editingGroup && formData.managementType === 'INDIVIDUAL_TAGGED' && (
            <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-purple-800 font-medium">
              <input
                type="checkbox"
                checked={autoOpenBatchTagging}
                onChange={(e) => setAutoOpenBatchTagging(e.target.checked)}
                className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
              <span>Tự động mở bộ công cụ <strong>Gán Thẻ Tai Hàng Loạt</strong> ngay sau khi nhập đàn thành công</span>
            </label>
          )}
        </div>

        {/* Ô chuồng / Vị trí cụ thể (locationId) */}
        <div>
          <FormField
            label="Ô chuồng / Vị trí cụ thể (locationId - Tùy chọn)"
            hint={
              isLoadingLocations
                ? 'Đang nạp danh sách ô chuồng...'
                : locations.length > 0
                ? 'Tự động đồng bộ trạng thái OCCUPIED sang Sơ đồ vị trí (WS-A)'
                : 'Khu chuồng này chưa chia các ô cụ thể'
            }
          >
            <Select
              name="locationId"
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              disabled={!formData.zoneId || isLoadingLocations}
            >
              <option value="">-- Toàn bộ khu chuồng (hoặc chưa chọn ô cụ thể) --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code}) - {loc.status === 'OCCUPIED' ? '⚠️ Đang nuôi (OCCUPIED)' : '✅ Còn trống (EMPTY)'}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Chu kỳ vận hành & Ngày nhập đàn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Chu kỳ vận hành" hint="Chu kỳ đang 'ACTIVE' hoặc 'PLANNING'">
            <Select
              name="operationalCycleId"
              value={formData.operationalCycleId}
              onChange={(e) => setFormData({ ...formData, operationalCycleId: e.target.value })}
            >
              <option value="">-- Chọn chu kỳ vận hành --</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.fiscalYear}) [{c.status}]
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Ngày nhập đàn *" error={errors.entryDate}>
            <Input
              type="date"
              name="entryDate"
              value={formData.entryDate}
              onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
              disabled={Boolean(editingGroup)}
            />
          </FormField>
        </div>

        {/* Số lượng con & Trọng lượng đầu vào */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Số lượng con ban đầu *"
            error={errors.initialQuantity}
            hint={editingGroup ? 'Số lượng ban đầu cố định' : 'Bắt buộc > 0'}
          >
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Ví dụ: 100"
              name="initialQuantity"
              value={formData.initialQuantity}
              onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
              readOnly={Boolean(editingGroup)}
              className={editingGroup ? 'bg-slate-100 font-mono text-slate-600' : 'font-mono'}
            />
          </FormField>

          {editingGroup ? (
            <FormField label="Số lượng con hiện tại" hint="Số lượng thực tế còn lại trong chuồng">
              <Input
                type="number"
                min="0"
                step="1"
                name="currentQuantity"
                value={formData.currentQuantity}
                onChange={(e) => setFormData({ ...formData, currentQuantity: e.target.value })}
                className="font-mono font-bold text-emerald-700"
              />
            </FormField>
          ) : (
            <FormField label="Trọng lượng bình quân đầu vào (kg/con)" hint="Dùng để đối chiếu tốc độ tăng trọng ADG">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ví dụ: 25.5"
                name="avgInitialWeightKg"
                value={formData.avgInitialWeightKg}
                onChange={(e) => setFormData({ ...formData, avgInitialWeightKg: e.target.value })}
              />
            </FormField>
          )}
        </div>

        {/* Thông tin Mua Con Giống & Nguồn Gốc */}
        {!editingGroup ? (
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <span>🏷️</span> Thông Tin Mua Con Giống & Đối Tác Cung Cấp
              </span>
              <span className="text-[10px] text-amber-700 font-medium">
                (Tùy chọn - Tự động ghi nhận Công nợ & Chi phí)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Nhà cung cấp con giống" hint="Đối tác cung cấp lợn/bò/gà giống">
                <Select
                  name="partnerId"
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                >
                  <option value="">-- Mua ngoài / Chưa gắn NCC --</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code || 'NCC'})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Đơn giá mua (đ/con)">
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Ví dụ: 1200000"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={(e) => {
                    const price = e.target.value;
                    const qty = Number(formData.initialQuantity) || 0;
                    const total = price && qty ? String(Number(price) * qty) : formData.totalCost;
                    setFormData({ ...formData, unitPrice: price, totalCost: total });
                  }}
                  className="font-mono text-right"
                />
              </FormField>

              <FormField label="Tổng tiền mua giống (đ)">
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Tự tính = Đơn giá x Số lượng"
                  name="totalCost"
                  value={formData.totalCost}
                  onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                  className="font-mono text-right font-bold text-amber-900"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Số Giấy kiểm dịch thú y" hint="Chứng nhận kiểm dịch khi vận chuyển">
                <Input
                  name="healthCertificate"
                  placeholder="Ví dụ: KD-2026-8899/TY"
                  value={formData.healthCertificate}
                  onChange={(e) => setFormData({ ...formData, healthCertificate: e.target.value })}
                  className="font-mono"
                />
              </FormField>

              <FormField label="Xuất xứ / Trại giống gốc" hint="Nguồn gốc bố mẹ, vùng nuôi">
                <Input
                  name="origin"
                  placeholder="Ví dụ: Trại giống CP Đồng Nai F1"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                />
              </FormField>
            </div>

            {formData.partnerId && Number(formData.totalCost) > 0 && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 font-medium flex items-center gap-1.5">
                <span>✅</span>
                <span>
                  Hệ thống sẽ <strong>tự động tạo khoản Công nợ phải trả</strong> cho {partners.find(p => String(p.id) === String(formData.partnerId))?.name || 'Nhà cung cấp'} với số tiền <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(formData.totalCost))}</strong> và hạch toán vào <strong>Chi phí con giống ban đầu</strong> của đàn nuôi.
                </span>
              </div>
            )}
          </div>
        ) : (
          (editingGroup.partnerName || editingGroup.totalCost || editingGroup.healthCertificate) && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 space-y-1.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <span>🏷️</span> Nguồn Gốc & Thông Tin Mua Giống
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {editingGroup.partnerName && (
                  <div>NCC: <span className="font-semibold">{editingGroup.partnerName}</span></div>
                )}
                {editingGroup.totalCost && (
                  <div>Tiền mua giống: <span className="font-semibold text-emerald-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(editingGroup.totalCost))}</span></div>
                )}
                {editingGroup.healthCertificate && (
                  <div>Số kiểm dịch: <span className="font-mono">{editingGroup.healthCertificate}</span></div>
                )}
                {editingGroup.origin && (
                  <div>Xuất xứ: <span>{editingGroup.origin}</span></div>
                )}
              </div>
            </div>
          )
        )}

        {/* Ghi chú chuyển tiếp */}
        <div className="flex items-start gap-2.5 bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
          <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
          <div>
            <strong>Kế hoạch chăn nuôi:</strong> Sau khi Giám đốc trại nhập đàn, Bác sĩ thú y / Kỹ thuật chăn nuôi sẽ thực hiện ghi nhận các sự kiện thú y, vắc-xin tiêm phòng (Auto-Backflushing trừ kho thuốc) và cân đo tăng trọng ADG định kỳ.
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default LivestockGroupModal;
