import React, { useState, useEffect, useRef } from 'react';
import {
  Coins,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Receipt,
  Building2,
  Check,
  ChevronDown,
  MapPin,
  X,
} from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select, Textarea, CodeInput } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { extractApiErrors } from '@/utils/apiHelpers';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';

const COST_TYPES = [
  { value: 'MATERIALS', label: 'MATERIALS - Chi phí Vật tư trực tiếp (621)' },
  { value: 'DIRECT_LABOR', label: 'DIRECT_LABOR - Chi phí Nhân công trực tiếp (622)' },
  { value: 'MACHINERY_FUEL', label: 'MACHINERY_FUEL - Chi phí Máy móc & Nhiên liệu' },
  { value: 'DEPRECIATION', label: 'DEPRECIATION - Chi phí Khấu hao tài sản/nhà kính' },
  { value: 'INDIRECT_OVERHEAD', label: 'INDIRECT_OVERHEAD - Chi phí Sản xuất chung & Gián tiếp (627)' },
];

/**
 * Tự động sinh mã khoản mục chi phí tăng dần tuần tự dựa trên danh sách hiện có.
 * Hỗ trợ mọi định dạng: CST-001 -> CST-002, CST-VT-01 -> CST-VT-02, CC-01 -> CC-02...
 */
function generateCostCategoryCode(existingList = []) {
  if (!existingList || existingList.length === 0) {
    return 'CST-001';
  }

  let bestPrefix = 'CST-';
  let maxNum = 0;
  let padLength = 3;

  existingList.forEach((item) => {
    const code = (item?.code || '').trim().toUpperCase();
    if (!code) return;

    const match = code.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      const num = parseInt(numStr, 10);

      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
        bestPrefix = prefix;
        padLength = Math.max(numStr.length, padLength);
      }
    }
  });

  if (maxNum === 0) {
    return `CST-${String(existingList.length + 1).padStart(3, '0')}`;
  }

  const nextNum = maxNum + 1;
  const finalPad = Math.max(padLength, String(nextNum).length);
  return `${bestPrefix}${String(nextNum).padStart(finalPad, '0')}`;
}

export function CostCategoriesTab() {
  const { activeFarmId, farms, fetchFarms } = useActiveFarmStore();
  const accessibleFarms = useAuthStore((s) => s.userInfo?.accessibleFarms) || [];
  const farmList = farms && farms.length > 0 ? farms : accessibleFarms;

  useEffect(() => {
    if ((!farms || farms.length === 0) && typeof fetchFarms === 'function') {
      fetchFarms();
    }
  }, [farms, fetchFarms]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCostType, setSelectedCostType] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedFarmIds, setSelectedFarmIds] = useState(['ALL']);
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
  const farmDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    costType: 'MATERIALS',
    description: '',
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getCostCategories();
      setData(Array.isArray(res) ? res : res?.content || []);
    } catch (err) {
      console.error('Failed to load cost categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

      setFormData({
        code: item.code || '',
        name: item.name || '',
        costType: item.costType || 'MATERIALS',
        description: item.description || '',
      });
    } else {
      setSelectedFarmIds(['ALL']);
      setFormData({
        code: generateCostCategoryCode(data),
        name: '',
        costType: selectedCostType || 'MATERIALS',
        description: '',
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
    if (!formData.code.trim()) errors.code = 'Mã khoản mục chi phí không được để trống';
    if (!formData.name.trim()) errors.name = 'Tên khoản mục chi phí không được để trống';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const isAll = selectedFarmIds.includes('ALL') || selectedFarmIds.length === 0;
      const cleanFarmIds = isAll ? [] : selectedFarmIds.filter((id) => id !== 'ALL').map(Number);

      const payload = {
        farmId: isAll ? null : cleanFarmIds[0] || null,
        applicableFarmIds: cleanFarmIds,
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        costType: formData.costType,
        description: formData.description?.trim() || null,
      };

      if (editingItem) {
        await masterDataService.updateCostCategory(editingItem.id, payload);
      } else {
        await masterDataService.createCostCategory(payload);
      }

      setModalOpen(false);
      fetchData();
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('finance');
    } catch (err) {
      const errMsg = applyServerFieldErrors(err, setFieldErrors);
      setGeneralError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhóm chi phí này?')) return;
    try {
      await masterDataService.deleteCostCategory(id);
      fetchData();
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('finance');
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa nhóm chi phí đã có phát sinh chi phí thực tế!');
    }
  };

  const filteredData = data.filter((item) => {
    // 1. Lọc theo Phân loại yếu tố chi phí
    if (selectedCostType && item.costType !== selectedCostType) {
      return false;
    }

    // 2. Lọc theo Trang trại được chọn trên TopBar
    if (activeFarmId && activeFarmId !== 'ALL') {
      const isAll =
        !item.applicableFarms ||
        item.applicableFarms === 'ALL' ||
        (!item.farmId && (!item.applicableFarmIds || item.applicableFarmIds.length === 0));

      if (!isAll) {
        const matchesFarmId = item.farmId && String(item.farmId) === String(activeFarmId);
        const matchesAppFarmIds = item.applicableFarmIds?.some((id) => String(id) === String(activeFarmId));
        const matchesAppFarmsStr = item.applicableFarms
          ?.split(',')
          .map((p) => p.trim())
          .includes(String(activeFarmId));

        if (!matchesFarmId && !matchesAppFarmIds && !matchesAppFarmsStr) {
          return false;
        }
      }
    }

    // 3. Lọc theo từ khóa tìm kiếm
    if (!search) return true;
    const q = search.toLowerCase();
    return item.name?.toLowerCase().includes(q) || item.code?.toLowerCase().includes(q);
  });

  const columns = [
    {
      key: 'code',
      title: 'Mã Khoản Mục',
      render: (item) => <span className="font-mono font-bold text-slate-900">{item.code}</span>,
    },
    {
      key: 'name',
      title: 'Tên Khoản Mục Chi Phí',
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
            {item.description && <div className="text-[11px] text-slate-500 pt-0.5">{item.description}</div>}
          </div>
        );
      },
    },
    {
      key: 'costType',
      title: 'Nhóm Yếu Tố Chi Phí (5 loại)',
      render: (item) => {
        const found = COST_TYPES.find((c) => c.value === item.costType);
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {found ? found.label.split(' - ')[1] : item.costType}
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Can anyPermissions={['PERM_FINANCE_EXPENSE', 'PERM_FARM_UPDATE']}>
            <button
              type="button"
              onClick={() => handleOpenModal(item)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Sửa nhóm chi phí"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Xóa nhóm chi phí"
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
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã khoản mục..."
              className="pl-9 text-xs"
            />
          </div>
          <div className="w-56">
            <Select
              value={selectedCostType}
              onChange={(e) => setSelectedCostType(e.target.value)}
              options={[{ value: '', label: 'Tất cả loại chi phí' }, ...COST_TYPES]}
            />
          </div>
        </div>

        <Can anyPermissions={['PERM_FINANCE_EXPENSE', 'PERM_FARM_UPDATE']}>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal(null)}
            icon={<Plus className="h-4 w-4" />}
          >
            + Thêm Nhóm Chi Phí
          </Button>
        </Can>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={loading}
        emptyStateProps={{
          title: 'Chưa có khoản mục chi phí nào',
          description: 'Thiết lập các nhóm chi phí kế toán để tính giá thành vụ mùa và phân bổ gián tiếp.',
          actionLabel: '+ Thêm Nhóm Chi Phí',
          onAction: () => handleOpenModal(null),
        }}
      />

      {/* Modal CostCategoryForm */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Cập Nhật Nhóm Chi Phí' : 'Thêm Mới Nhóm Chi Phí'}
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
              Phạm Vi Áp Dụng Khoản Mục <span className="text-rose-500">*</span>
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

          <FormField label="Phân Loại Yếu Tố Chi Phí" required error={fieldErrors.costType}>
            <Select
              value={formData.costType}
              onChange={(e) => setFormData((prev) => ({ ...prev, costType: e.target.value }))}
              options={COST_TYPES}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mã Khoản Mục" required error={fieldErrors.code} hint={editingItem ? 'Mã khoản mục chi phí bất biến' : 'Hệ thống tự động sinh mã gợi ý'}>
              <CodeInput
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                onRegenerate={() =>
                  setFormData((prev) => ({ ...prev, code: generateCostCategoryCode(data) }))
                }
                isEditMode={Boolean(editingItem)}
                error={fieldErrors.code}
              />
            </FormField>

            <FormField label="Tên Khoản Mục Chi Phí" required error={fieldErrors.name}>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Chi phí phân bón NPK"
              />
            </FormField>
          </div>

          <FormField label="Mô Tả / Diễn Giải Hạch Toán">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="VD: Định khoản vào TK 621, phân bổ theo diện tích luống canh tác..."
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
export default CostCategoriesTab;
