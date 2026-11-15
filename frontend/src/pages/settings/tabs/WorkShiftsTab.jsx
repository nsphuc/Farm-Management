import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Moon,
  Sun,
  Building2,
  Check,
  ChevronDown,
  MapPin,
  X,
} from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Switch, CodeInput } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { extractApiErrors } from '@/utils/apiHelpers';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';

export function WorkShiftsTab() {
  const { activeFarmId, activeFarm, farms, fetchFarms } = useActiveFarmStore();
  const accessibleFarms = useAuthStore((s) => s.userInfo?.accessibleFarms) || [];
  const farmList = farms && farms.length > 0 ? farms : accessibleFarms;

  useEffect(() => {
    if ((!farms || farms.length === 0) && typeof fetchFarms === 'function') {
      fetchFarms();
    }
  }, [farms, fetchFarms]);

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedFarmIds, setSelectedFarmIds] = useState(['ALL']);
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
  const farmDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    shiftCode: '',
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    graceLateMinutes: 15,
    isOvernight: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  // Close farm dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (farmDropdownRef.current && !farmDropdownRef.current.contains(e.target)) {
        setIsFarmDropdownOpen(false);
      }
    }
    if (isFarmDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFarmDropdownOpen]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getWorkShifts({
        farmId: activeFarmId || undefined,
      });
      setShifts(Array.isArray(res) ? res : res?.content || []);
    } catch (err) {
      console.error('Failed to load work shifts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [activeFarmId]);

  // Calculate nominal working hours dynamically
  const calculateNominalHours = (startStr, endStr, breakMin, isOvernight) => {
    if (!startStr || !endStr) return 0;
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    let spanMinutes = 0;
    if (isOvernight) {
      spanMinutes = 24 * 60 - startTotal + endTotal;
    } else {
      spanMinutes = endTotal - startTotal;
    }

    const netMinutes = Math.max(0, spanMinutes - (Number(breakMin) || 0));
    return (netMinutes / 60).toFixed(1);
  };

  const nominalHours = calculateNominalHours(
    formData.startTime,
    formData.endTime,
    formData.breakMinutes,
    formData.isOvernight
  );

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFieldErrors({});
    setGeneralError('');
    setIsFarmDropdownOpen(false);

    if (item) {
      if (!item.applicableFarms || item.applicableFarms === 'ALL' || (!item.farmId && (!item.applicableFarmIds || item.applicableFarmIds.length === 0))) {
        setSelectedFarmIds(['ALL']);
      } else if (item.applicableFarmIds && item.applicableFarmIds.length > 0) {
        setSelectedFarmIds(item.applicableFarmIds.map(String));
      } else if (item.applicableFarms) {
        setSelectedFarmIds(item.applicableFarms.split(',').map((s) => s.trim()).filter(Boolean));
      } else if (item.farmId) {
        setSelectedFarmIds([String(item.farmId)]);
      } else {
        setSelectedFarmIds(['ALL']);
      }

      // Ensure HH:mm format
      const start = item.startTime?.substring(0, 5) || '08:00';
      const end = item.endTime?.substring(0, 5) || '17:00';
      setFormData({
        shiftCode: item.shiftCode || '',
        name: item.name || '',
        startTime: start,
        endTime: end,
        breakMinutes: item.breakMinutes ?? 60,
        graceLateMinutes: item.graceLateMinutes ?? 15,
        isOvernight: Boolean(item.isOvernight),
      });
    } else {
      setSelectedFarmIds(['ALL']);
      setFormData({
        shiftCode: generateEntityCode(CODE_PREFIXES.SHIFT, shifts),
        name: '',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        graceLateMinutes: 15,
        isOvernight: false,
      });
    }
    setModalOpen(true);
  };

  const handleToggleFarm = (farmIdStr) => {
    if (farmIdStr === 'ALL') {
      setSelectedFarmIds(['ALL']);
      return;
    }

    setSelectedFarmIds((prev) => {
      const current = prev.filter((id) => id !== 'ALL');
      const targetId = String(farmIdStr);
      let next;
      if (current.includes(targetId)) {
        next = current.filter((id) => id !== targetId);
      } else {
        next = [...current, targetId];
      }

      if (next.length === 0) {
        return ['ALL'];
      }
      if (farmList.length > 0 && next.length === farmList.length) {
        return ['ALL'];
      }
      return next;
    });
  };

  const handleRemoveFarmTag = (farmIdStr, e) => {
    e.stopPropagation();
    handleToggleFarm(farmIdStr);
  };

  const getSelectedFarmsLabel = () => {
    if (selectedFarmIds.includes('ALL') || selectedFarmIds.length === 0) {
      return 'Toàn bộ trang trại (Toàn doanh nghiệp)';
    }
    if (selectedFarmIds.length === 1) {
      const found = farmList.find((f) => String(f.id) === String(selectedFarmIds[0]));
      return found ? found.name : `Trang trại #${selectedFarmIds[0]}`;
    }
    return `Đã chọn ${selectedFarmIds.length} trang trại`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.shiftCode.trim()) errors.shiftCode = 'Mã ca làm việc không được để trống';
    if (!formData.name.trim()) errors.name = 'Tên ca làm việc không được để trống';
    if (!formData.startTime) errors.startTime = 'Giờ bắt đầu không được để trống';
    if (!formData.endTime) errors.endTime = 'Giờ kết thúc không được để trống';

    if (!formData.isOvernight && formData.startTime >= formData.endTime) {
      errors.endTime = 'Nếu không phải ca qua đêm, giờ kết thúc phải sau giờ bắt đầu';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const formatTime = (t) => (t.length === 5 ? `${t}:00` : t);
      const isAll = selectedFarmIds.includes('ALL') || selectedFarmIds.length === 0;
      const cleanFarmIds = isAll ? [] : selectedFarmIds.filter((id) => id !== 'ALL').map(Number);

      const payload = {
        farmId: isAll ? null : cleanFarmIds[0] || null,
        applicableFarmIds: cleanFarmIds,
        shiftCode: formData.shiftCode.toUpperCase().trim(),
        name: formData.name.trim(),
        startTime: formatTime(formData.startTime),
        endTime: formatTime(formData.endTime),
        breakMinutes: Number(formData.breakMinutes),
        graceLateMinutes: Number(formData.graceLateMinutes),
        isOvernight: formData.isOvernight,
      };

      if (editingItem) {
        await masterDataService.updateWorkShift(editingItem.id, payload);
      } else {
        await masterDataService.createWorkShift(payload);
      }

      setModalOpen(false);
      fetchShifts();
    } catch (err) {
      const errMsg = applyServerFieldErrors(err, setFieldErrors);
      setGeneralError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa ca làm việc này?')) return;
    try {
      await masterDataService.deleteWorkShift(id);
      fetchShifts();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa ca làm việc đã có bảng chấm công!');
    }
  };

  const filteredShifts = shifts.filter((s) => {
    // 1. Lọc theo trang trại từ TopBar
    if (activeFarmId && activeFarmId !== 'ALL') {
      const isAll =
        !s.applicableFarms ||
        s.applicableFarms === 'ALL' ||
        (!s.farmId && (!s.applicableFarmIds || s.applicableFarmIds.length === 0));

      if (!isAll) {
        const matchesFarmId = s.farmId && String(s.farmId) === String(activeFarmId);
        const matchesAppFarmIds = s.applicableFarmIds?.some((id) => String(id) === String(activeFarmId));
        const matchesAppFarmsStr = s.applicableFarms
          ?.split(',')
          .map((p) => p.trim())
          .includes(String(activeFarmId));

        if (!matchesFarmId && !matchesAppFarmIds && !matchesAppFarmsStr) {
          return false;
        }
      }
    }

    // 2. Lọc theo từ khóa tìm kiếm
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.shiftCode?.toLowerCase().includes(q);
  });

  const columns = [
    {
      key: 'shiftCode',
      title: 'Mã Ca',
      render: (item) => <span className="font-mono font-bold text-slate-900">{item.shiftCode}</span>,
    },
    {
      key: 'name',
      title: 'Tên Ca Làm Việc',
      render: (item) => {
        const isAll =
          !item.applicableFarms ||
          item.applicableFarms === 'ALL' ||
          (!item.farmId && (!item.applicableFarmIds || item.applicableFarmIds.length === 0));

        return (
          <div className="space-y-1">
            <div className="font-semibold text-slate-900">{item.name}</div>
            <div className="flex flex-wrap items-center gap-1">
              {isAll ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-200">
                  <Building2 className="h-3 w-3" /> Toàn bộ trang trại
                </span>
              ) : item.applicableFarmNames && item.applicableFarmNames.length > 0 ? (
                item.applicableFarmNames.map((fName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200"
                  >
                    <MapPin className="h-3 w-3" /> {fName}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  <MapPin className="h-3 w-3" /> Riêng trang trại #{item.farmId}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'time',
      title: 'Khung Giờ (Start - End)',
      render: (item) => {
        const start = item.startTime?.substring(0, 5);
        const end = item.endTime?.substring(0, 5);
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {item.isOvernight ? (
              <Moon className="h-3.5 w-3.5 text-indigo-600" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="font-bold text-slate-800">
              {start} - {end}
            </span>
            {item.isOvernight && (
              <span className="rounded bg-indigo-50 px-1 text-[10px] text-indigo-700 font-sans font-bold">
                Qua đêm
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'nominalHours',
      title: 'Giờ Công Danh Định',
      render: (item) => {
        const hours = calculateNominalHours(
          item.startTime?.substring(0, 5),
          item.endTime?.substring(0, 5),
          item.breakMinutes,
          item.isOvernight
        );
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800">
            {hours} giờ
          </span>
        );
      },
    },
    {
      key: 'breakGrace',
      title: 'Nghỉ giữa ca / Ân hạn',
      render: (item) => (
        <span className="text-xs text-slate-600">
          Nghỉ: {item.breakMinutes}p • Trễ: {item.graceLateMinutes}p
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Can permission="PERM_FARM_UPDATE">
            <button
              type="button"
              onClick={() => handleOpenModal(item)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Sửa ca làm việc"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Xóa ca làm việc"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên ca, mã ca..."
            className="pl-9 text-xs"
          />
        </div>

        <Can permission="PERM_FARM_UPDATE">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal(null)}
            icon={<Plus className="h-4 w-4" />}
          >
            + Thêm Ca Làm Việc
          </Button>
        </Can>
      </div>

      <DataTable
        columns={columns}
        data={filteredShifts}
        isLoading={loading}
        emptyStateProps={{
          title: 'Chưa có ca làm việc chuẩn nào',
          description: 'Khởi tạo các ca làm việc (ca sáng, ca chiều, ca gác đêm) để phân ca và chấm công GPS.',
          actionLabel: '+ Thêm Ca Làm Việc',
          onAction: () => handleOpenModal(null),
        }}
      />

      {/* Modal WorkShiftForm */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Cập Nhật Ca Làm Việc' : 'Thêm Mới Ca Làm Việc'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSave}>
              {editingItem ? 'Lưu cập nhật' : 'Tạo mới'}
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

          {/* Phạm vi áp dụng dropdown */}
          <div className="space-y-1.5" ref={farmDropdownRef}>
            <label className="text-xs font-bold text-slate-700 block">
              Phạm Vi Áp Dụng Ca Làm Việc <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFarmDropdownOpen(!isFarmDropdownOpen)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm transition hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <div className="flex items-center gap-2 truncate">
                  {selectedFarmIds.includes('ALL') ? (
                    <Building2 className="h-4 w-4 text-sky-600 shrink-0" />
                  ) : (
                    <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="truncate">{getSelectedFarmsLabel()}</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    isFarmDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isFarmDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg animate-in fade-in zoom-in-95">
                  {/* Toàn bộ trang trại option */}
                  <div
                    onClick={() => handleToggleFarm('ALL')}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                      selectedFarmIds.includes('ALL')
                        ? 'bg-sky-50 text-sky-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-sky-600" />
                      <div>
                        <div>Toàn bộ trang trại</div>
                        <div className="text-[10px] font-normal text-slate-500">
                          Áp dụng chung toàn doanh nghiệp
                        </div>
                      </div>
                    </div>
                    {selectedFarmIds.includes('ALL') && (
                      <Check className="h-4 w-4 text-sky-600" />
                    )}
                  </div>

                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hoặc chọn riêng theo từng trang trại
                  </div>

                  {farmList.map((farm) => {
                    const isSelected = selectedFarmIds.includes(String(farm.id));
                    return (
                      <div
                        key={farm.id}
                        onClick={() => handleToggleFarm(farm.id)}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-emerald-600" />
                          <div>
                            <div>{farm.name}</div>
                            {farm.code && (
                              <div className="text-[10px] font-normal text-slate-500">
                                Mã: {farm.code}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected farm pills when specific farms are selected */}
            {!selectedFarmIds.includes('ALL') && selectedFarmIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedFarmIds.map((farmId) => {
                  const farm = farmList.find((f) => String(f.id) === String(farmId));
                  return (
                    <span
                      key={farmId}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200"
                    >
                      <MapPin className="h-3 w-3 text-emerald-600" />
                      <span>{farm ? farm.name : `Trang trại #${farmId}`}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFarmTag(farmId, e)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-100 text-emerald-600"
                        title="Bỏ chọn"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mã Ca Làm Việc" required error={fieldErrors.shiftCode} hint={editingItem ? 'Mã ca làm việc bất biến' : 'Hệ thống tự động sinh mã gợi ý'}>
              <CodeInput
                value={formData.shiftCode}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, shiftCode: e.target.value.toUpperCase() }))
                }
                onRegenerate={() =>
                  setFormData((prev) => ({ ...prev, shiftCode: generateEntityCode(CODE_PREFIXES.SHIFT, shifts) }))
                }
                isEditMode={Boolean(editingItem)}
                error={fieldErrors.shiftCode}
              />
            </FormField>

            <FormField label="Tên Ca Làm Việc" required error={fieldErrors.name}>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Ca Sáng Chuẩn (07:30 - 16:30)"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Giờ Bắt Đầu Ca" required error={fieldErrors.startTime}>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
              />
            </FormField>

            <FormField label="Giờ Kết Thúc Ca" required error={fieldErrors.endTime}>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nghỉ Giữa Ca (Phút)" error={fieldErrors.breakMinutes}>
              <Input
                type="number"
                min="0"
                value={formData.breakMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, breakMinutes: Number(e.target.value) }))
                }
              />
            </FormField>

            <FormField label="Ân Hạn Đi Trễ (Phút)" error={fieldErrors.graceLateMinutes}>
              <Input
                type="number"
                min="0"
                value={formData.graceLateMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, graceLateMinutes: Number(e.target.value) }))
                }
              />
            </FormField>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
            <Switch
              checked={formData.isOvernight}
              onChange={(val) => setFormData((prev) => ({ ...prev, isOvernight: val }))}
              label="Ca Làm Việc Qua Đêm (Qua 00:00)"
              description="Bật khi giờ kết thúc nằm ở ngày hôm sau"
            />

            {/* Read-only Nominal Hours Badge */}
            <div className="text-right">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Tổng Giờ Công Danh Định
              </div>
              <div className="text-base font-black font-mono text-emerald-700">
                {nominalHours} Giờ
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default WorkShiftsTab;
