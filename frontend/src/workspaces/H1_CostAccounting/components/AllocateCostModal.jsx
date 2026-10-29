import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  DollarSign,
  Building,
  CheckCircle2,
  AlertCircle,
  Equal,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { financeService } from '@/services/modules/financeService';
import { farmingService } from '@/services/modules/farmingService';
import { geographyService } from '@/services/modules/geographyService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { formatCurrency } from '@/utils/formatters';

const TARGET_TYPES = [
  { value: 'CROP_SEASON', label: '1. Mùa vụ canh tác (CROP_SEASON)' },
  { value: 'LIVESTOCK_GROUP', label: '2. Đàn vật nuôi (LIVESTOCK_GROUP)' },
  { value: 'PRODUCTION_ZONE', label: '3. Phân khu sản xuất (PRODUCTION_ZONE)' },
];

export function AllocateCostModal({ isOpen, onClose, onSuccess, initialFarmId, preselectedExpenseId }) {
  const { farms, activeFarmId } = useActiveFarmStore();
  const { isFarmManager, hasRole, isFarmAccountant, isOwner, isSuperAdmin } = useAuthStore();

  const isFarmLocked = (isFarmManager() || isFarmAccountant() || hasRole('ROLE_FARM_MANAGER') || hasRole('ROLE_ACCOUNTANT'))
    && !isOwner() && !isSuperAdmin()
    && activeFarmId !== 'ALL' && Boolean(activeFarmId);

  const currentFarmId = (initialFarmId && initialFarmId !== 'ALL') ? initialFarmId : (activeFarmId !== 'ALL' ? activeFarmId : '');

  const [selectedFarmId, setSelectedFarmId] = useState(currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : ''));
  const [expenses, setExpenses] = useState([]);
  const [selectedExpenseId, setSelectedExpenseId] = useState(preselectedExpenseId ? String(preselectedExpenseId) : '');
  const [selectedExpense, setSelectedExpense] = useState(null);

  const selectedFarm = farms.find((f) => String(f.id) === String(selectedFarmId));
  const farmType = selectedFarm?.farmType || 'MIXED';

  const availableTargetTypes = TARGET_TYPES.filter((t) => {
    if (farmType === 'CROP' && t.value === 'LIVESTOCK_GROUP') return false;
    if (farmType === 'LIVESTOCK' && t.value === 'CROP_SEASON') return false;
    return true;
  });

  const defaultTargetType = farmType === 'LIVESTOCK' ? 'LIVESTOCK_GROUP' : 'CROP_SEASON';

  // Lists for targets
  const [seasons, setSeasons] = useState([]);
  const [livestockGroups, setLivestockGroups] = useState([]);
  const [zones, setZones] = useState([]);

  // Allocation lines
  const [allocations, setAllocations] = useState([
    { id: 1, targetType: defaultTargetType, targetId: '', allocatedAmount: '' },
  ]);

  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Cập nhật targetType khi chuyển đổi giữa các loại hình trang trại
  useEffect(() => {
    setAllocations((prev) =>
      prev.map((a) => {
        const isInvalid = (farmType === 'CROP' && a.targetType === 'LIVESTOCK_GROUP') ||
                          (farmType === 'LIVESTOCK' && a.targetType === 'CROP_SEASON');
        if (isInvalid) {
          return { ...a, targetType: defaultTargetType, targetId: '' };
        }
        return a;
      })
    );
  }, [farmType, defaultTargetType]);

  useEffect(() => {
    if (isOpen) {
      const defFarm = currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : '');
      setSelectedFarmId(defFarm);
      setSelectedExpenseId(preselectedExpenseId ? String(preselectedExpenseId) : '');
      setAllocations([{ id: Date.now(), targetType: defaultTargetType, targetId: '', allocatedAmount: '' }]);
      setErrors({});
    }
  }, [isOpen]);

  // Load eligible expenses when farm changes
  useEffect(() => {
    if (!isOpen || !selectedFarmId) {
      setExpenses([]);
      setSelectedExpense(null);
      return;
    }

    const loadExpenses = async () => {
      try {
        setIsLoadingExpenses(true);
        const res = await financeService.getExpenses({ farmId: Number(selectedFarmId), size: 100 });
        const list = res?.content || (Array.isArray(res) ? res : []);
        // Eligible: unitCostEligible === true or status != CANCELLED
        const eligible = list.filter((e) => e.status !== 'CANCELLED');
        setExpenses(eligible);

        if (eligible.length > 0 && !selectedExpenseId) {
          setSelectedExpenseId(String(eligible[0].id));
          setSelectedExpense(eligible[0]);
        } else if (selectedExpenseId) {
          const found = eligible.find((e) => String(e.id) === String(selectedExpenseId));
          setSelectedExpense(found || null);
        }
      } catch (err) {
        console.error('Failed to load expenses:', err);
        setExpenses([]);
      } finally {
        setIsLoadingExpenses(false);
      }
    };
    loadExpenses();
  }, [isOpen, selectedFarmId]);

  // Update selectedExpense when selectedExpenseId changes
  useEffect(() => {
    if (selectedExpenseId && expenses.length > 0) {
      const found = expenses.find((e) => String(e.id) === String(selectedExpenseId));
      setSelectedExpense(found || null);
    }
  }, [selectedExpenseId, expenses]);

  // Load target lists for the farm
  useEffect(() => {
    if (!isOpen || !selectedFarmId) return;

    const loadTargets = async () => {
      try {
        setIsLoadingTargets(true);
        const [seasonRes, groupRes, zoneRes] = await Promise.all([
          farmingService.getCropSeasons(selectedFarmId, { size: 100 }).catch(() => []),
          farmingService.getLivestockGroups(selectedFarmId, { size: 100 }).catch(() => []),
          geographyService.getZones(selectedFarmId).catch(() => []),
        ]);
        setSeasons(seasonRes?.content || (Array.isArray(seasonRes) ? seasonRes : []));
        setLivestockGroups(groupRes?.content || (Array.isArray(groupRes) ? groupRes : []));
        setZones(Array.isArray(zoneRes) ? zoneRes : (zoneRes?.content || []));
      } catch (err) {
        console.error('Failed to load targets:', err);
      } finally {
        setIsLoadingTargets(false);
      }
    };
    loadTargets();
  }, [isOpen, selectedFarmId]);

  const handleAddLine = () => {
    setAllocations((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), targetType: defaultTargetType, targetId: '', allocatedAmount: '' },
    ]);
  };

  const handleRemoveLine = (index) => {
    if (allocations.length <= 1) {
      toast.warning('Cần ít nhất một đối tượng phân bổ!');
      return;
    }
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index, field, value) => {
    setAllocations((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'targetType') {
        copy[index].targetId = '';
      }
      return copy;
    });
  };

  const expenseTotal = Number(selectedExpense?.amount) || 0;
  const currentTotalAllocated = allocations.reduce((sum, a) => sum + (Number(a.allocatedAmount) || 0), 0);
  const remainingToAllocate = expenseTotal - currentTotalAllocated;

  // Split evenly
  const handleSplitEvenly = () => {
    if (expenseTotal <= 0 || allocations.length === 0) return;
    const splitAmount = Math.floor(expenseTotal / allocations.length);
    const remainder = expenseTotal - splitAmount * allocations.length;

    setAllocations((prev) =>
      prev.map((item, idx) => ({
        ...item,
        allocatedAmount: idx === 0 ? splitAmount + remainder : splitAmount,
      }))
    );
  };

  const validate = () => {
    const errs = {};
    if (!selectedExpenseId) errs.expense = 'Vui lòng chọn chứng từ chi phí';
    if (allocations.length === 0) errs.allocations = 'Cần ít nhất một dòng phân bổ';

    for (let i = 0; i < allocations.length; i++) {
      const a = allocations[i];
      if (!a.targetId) {
        errs[`target_${i}`] = `Dòng ${i + 1}: Vui lòng chọn đối tượng nhận phân bổ`;
      }
      const amt = parseFloat(a.allocatedAmount);
      if (!a.allocatedAmount || isNaN(amt) || amt <= 0) {
        errs[`amount_${i}`] = `Dòng ${i + 1}: Số tiền phân bổ phải lớn hơn 0`;
      }
    }

    if (currentTotalAllocated > expenseTotal) {
      errs.math = `Tổng số tiền phân bổ (${formatCurrency(currentTotalAllocated)}) vượt quá số tiền chi phí (${formatCurrency(expenseTotal)})!`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        allocations: allocations.map((a) => ({
          targetType: a.targetType,
          targetId: Number(a.targetId),
          allocatedAmount: Number(a.allocatedAmount),
        })),
      };

      await financeService.allocateCost(Number(selectedFarmId), Number(selectedExpenseId), payload);
      toast.success('Phân bổ chi phí đa đối tượng thành công! Giá thành đơn vị đã được đồng bộ.');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi khi phân bổ chi phí:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi phân bổ chi phí';
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
      title="Phân Bổ Chi Phí Đa Đối Tượng"
      subtitle="Phân bổ chi phí vận hành vào Mùa vụ, Đàn vật nuôi hoặc Phân khu sản xuất với bảo toàn tổng tiền"
      icon={<Layers className="h-5 w-5 text-purple-600" />}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs font-mono">
            <span>Tổng phân bổ: </span>
            <strong className={currentTotalAllocated > expenseTotal ? 'text-rose-600' : 'text-emerald-700'}>
              {formatCurrency(currentTotalAllocated)}
            </strong>
            <span className="text-slate-400"> / {formatCurrency(expenseTotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy Bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={handleSubmit}
              icon={<CheckCircle2 className="h-4 w-4" />}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              Lưu Phân Bổ Chi Phí
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}
        {errors.math && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.math}</span>
          </div>
        )}

        {/* 1. Chọn trang trại & chứng từ chi phí */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <FormField label="Trang Trại Phân Bổ">
            <Select
              value={selectedFarmId}
              disabled={isFarmLocked}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full text-xs font-semibold"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (#{f.id})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Chọn Chứng Từ Chi Phí Cần Phân Bổ (*)" error={errors.expense}>
            <Select
              value={selectedExpenseId}
              onChange={(e) => setSelectedExpenseId(e.target.value)}
              className="w-full text-xs"
            >
              <option value="">-- Chọn chứng từ chi phí --</option>
              {expenses.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.expenseCode} - {formatCurrency(e.amount)} ({e.costCategoryName || 'Chi phí'})
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Thông tin chứng từ chi phí đang chọn */}
        {selectedExpense && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/60 p-3 rounded-xl border border-purple-200 text-xs">
            <div>
              <span className="text-[10px] text-purple-700 font-bold block uppercase">Số Tiền Gốc</span>
              <span className="font-bold font-mono text-purple-950 text-sm">
                {formatCurrency(selectedExpense.amount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-purple-700 font-bold block uppercase">Khoản Mục</span>
              <span className="font-semibold text-slate-800">
                {selectedExpense.costCategoryName || 'Vận hành'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-purple-700 font-bold block uppercase">Trạng Thái</span>
              <span className="font-semibold text-slate-800">
                {selectedExpense.status}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-purple-700 font-bold block uppercase">Còn Lại Cần Phân Bổ</span>
              <span className={`font-bold font-mono ${remainingToAllocate < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {formatCurrency(remainingToAllocate)}
              </span>
            </div>
          </div>
        )}

        {/* 2. Bảng các dòng đối tượng phân bổ */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-purple-600" />
              <span>Danh Sách Đối Tượng Nhận Phân Bổ ({allocations.length})</span>
            </h4>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={<Equal className="h-3 w-3" />}
                onClick={handleSplitEvenly}
                disabled={!selectedExpense}
                title="Chia đều số tiền chi phí cho các dòng"
              >
                Chia Đều Tự Động
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={<Plus className="h-3 w-3" />}
                onClick={handleAddLine}
              >
                + Thêm Đối Tượng
              </Button>
            </div>
          </div>

          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
            {allocations.map((line, idx) => {
              // Options based on targetType
              let targetOptions = [];
              if (line.targetType === 'CROP_SEASON') {
                targetOptions = seasons.map((s) => ({ value: s.id, label: `${s.name} (${s.seasonCode || `Mùa #${s.id}`})` }));
              } else if (line.targetType === 'LIVESTOCK_GROUP') {
                targetOptions = livestockGroups.map((g) => ({ value: g.id, label: `${g.name} (${g.code || `Đàn #${g.id}`})` }));
              } else if (line.targetType === 'PRODUCTION_ZONE') {
                targetOptions = zones.map((z) => ({ value: z.id, label: `${z.name} (${z.code || `Khu #${z.id}`})` }));
              }

              return (
                <div
                  key={line.id}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-200 text-xs"
                >
                  <div className="col-span-1 text-slate-400 font-mono text-center font-bold text-[11px]">
                    #{idx + 1}
                  </div>

                  <div className="col-span-3">
                    <Select
                      value={line.targetType}
                      onChange={(e) => handleLineChange(idx, 'targetType', e.target.value)}
                      className="w-full text-xs"
                    >
                      {availableTargetTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="col-span-4">
                    <Select
                      value={line.targetId}
                      onChange={(e) => handleLineChange(idx, 'targetId', e.target.value)}
                      className="w-full text-xs"
                    >
                      <option value="">-- Chọn đối tượng đích --</option>
                      {targetOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                    {errors[`target_${idx}`] && (
                      <span className="text-[10px] text-rose-600 block mt-0.5">{errors[`target_${idx}`]}</span>
                    )}
                  </div>

                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Số tiền phân bổ"
                      value={line.allocatedAmount}
                      onChange={(e) => handleLineChange(idx, 'allocatedAmount', e.target.value)}
                      className="w-full text-xs font-mono font-bold text-right"
                    />
                    {errors[`amount_${idx}`] && (
                      <span className="text-[10px] text-rose-600 block mt-0.5 text-right">{errors[`amount_${idx}`]}</span>
                    )}
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      title="Xóa dòng"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default AllocateCostModal;
