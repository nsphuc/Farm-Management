import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, AlertCircle, Info, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { farmingService } from '@/services/modules/farmingService';
import { masterDataService } from '@/services/modules/masterDataService';
import { geographyService } from '@/services/modules/geographyService';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function LivestockGroupModal({
  isOpen,
  onClose,
  farmId,
  editingGroup = null,
  onSuccess,
}) {
  const { notifyDataChanged } = useActiveFarmStore();

  const [formData, setFormData] = useState({
    groupCode: '',
    breedId: '',
    zoneId: '',
    operationalCycleId: '',
    entryDate: new Date().toISOString().split('T')[0],
    initialQuantity: '',
    currentQuantity: '',
    avgInitialWeightKg: '',
  });

  const [zones, setZones] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sinh mã tự động
  const handleGenerateCode = () => {
    const newCode = generateEntityCode(CODE_PREFIXES.LIVESTOCK_GROUP);
    setFormData((prev) => ({ ...prev, groupCode: newCode }));
  };

  // Nạp dữ liệu danh mục khi mở Modal
  useEffect(() => {
    if (!isOpen || !farmId) return;

    const loadMetadata = async () => {
      try {
        const [zonesRes, cyclesRes, breedsRes, assignmentsRes] = await Promise.all([
          geographyService.getZones(farmId).catch(() => []),
          geographyService.getCycles(farmId).catch(() => []),
          masterDataService.getLivestockBreeds().catch(() => []),
          geographyService.getAssignments(farmId).catch(() => []),
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
      } catch (err) {
        console.error('Lỗi khi nạp danh mục chăn nuôi:', err);
      }
    };

    loadMetadata();
  }, [isOpen, farmId]);

  // Thiết lập form khi mở hoặc chuyển chế độ Thêm / Sửa
  useEffect(() => {
    if (!isOpen) return;

    if (editingGroup) {
      setFormData({
        groupCode: editingGroup.groupCode || '',
        breedId: editingGroup.breedId ? String(editingGroup.breedId) : '',
        zoneId: editingGroup.zoneId ? String(editingGroup.zoneId) : '',
        operationalCycleId: editingGroup.operationalCycleId ? String(editingGroup.operationalCycleId) : '',
        entryDate: editingGroup.entryDate ? String(editingGroup.entryDate).split('T')[0] : '',
        initialQuantity: editingGroup.initialQuantity ? String(editingGroup.initialQuantity) : '',
        currentQuantity: editingGroup.currentQuantity ? String(editingGroup.currentQuantity) : '',
        avgInitialWeightKg: editingGroup.avgInitialWeightKg ? String(editingGroup.avgInitialWeightKg) : '',
      });
    } else {
      setFormData({
        groupCode: generateEntityCode(CODE_PREFIXES.LIVESTOCK_GROUP),
        breedId: '',
        zoneId: '',
        operationalCycleId: '',
        entryDate: new Date().toISOString().split('T')[0],
        initialQuantity: '',
        currentQuantity: '',
        avgInitialWeightKg: '',
      });
    }
    setErrors({});
  }, [isOpen, editingGroup]);

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

      if (editingGroup) {
        await farmingService.updateLivestockGroup(farmId, editingGroup.id, {
          zoneId: Number(formData.zoneId),
          currentQuantity: formData.currentQuantity ? Number(formData.currentQuantity) : Number(formData.initialQuantity),
          status: editingGroup.status,
        });
        toast.success(`Cập nhật thông tin đàn nuôi ${formData.groupCode} thành công!`);
      } else {
        const payload = {
          zoneId: Number(formData.zoneId),
          operationalCycleId: formData.operationalCycleId ? Number(formData.operationalCycleId) : null,
          groupCode: formData.groupCode.trim(),
          breedId: Number(formData.breedId),
          initialQuantity: Number(formData.initialQuantity),
          entryDate: formData.entryDate,
        };
        await farmingService.createLivestockGroup(farmId, payload);
        toast.success(`Khởi tạo đàn nuôi ${payload.groupCode} thành công! Dữ liệu đã chuyển sang bàn làm việc của Bác sĩ thú y / Trưởng khu.`);
      }

      notifyDataChanged('zones');
      notifyDataChanged('groups');

      if (onSuccess) onSuccess();
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

        {/* Mã đàn & Tự sinh */}
        <div>
          <FormField
            label="Mã đàn / lứa nuôi *"
            error={errors.groupCode}
            hint={editingGroup ? 'Khóa cứng bất biến khi sửa' : 'Mã tự sinh theo chuẩn GRP-YYMM-XXXX'}
          >
            <div className="flex gap-2">
              <Input
                name="groupCode"
                value={formData.groupCode}
                onChange={(e) => setFormData({ ...formData, groupCode: e.target.value })}
                placeholder="GRP-2610-XXXX"
                readOnly={Boolean(editingGroup)}
                className={editingGroup ? 'bg-slate-100 font-mono text-slate-600 font-bold' : 'font-mono font-bold'}
              />
              {!editingGroup && (
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

        {/* Giống vật nuôi & Phân khu chuồng trại */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Giống vật nuôi *" error={errors.breedId}>
            <Select
              name="breedId"
              value={formData.breedId}
              onChange={(e) => setFormData({ ...formData, breedId: e.target.value })}
              disabled={Boolean(editingGroup)}
            >
              <option value="">-- Chọn giống gia súc / gia cầm --</option>
              {breeds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.species})
                </option>
              ))}
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
              onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
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
