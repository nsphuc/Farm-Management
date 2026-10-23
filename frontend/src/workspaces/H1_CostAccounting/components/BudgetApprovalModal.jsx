import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormControls';
import { CheckCircle2, DollarSign, Building, Calendar, Layers, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { financeService } from '@/services/modules/financeService';
import { geographyService } from '@/services/modules/geographyService';

const STANDARD_COST_TYPES = [
  {
    type: 'MATERIALS',
    label: '1. Vật tư nông nghiệp (MATERIALS)',
    desc: 'Hạt giống, phân bón, thuốc BVTV, thức ăn tiêu hao',
    defaultAmount: 200000000,
  },
  {
    type: 'DIRECT_LABOR',
    label: '2. Chi phí nhân công (DIRECT_LABOR)',
    desc: 'Tiền công gieo cấy, chăm sóc, thu hoạch, OT công nhân',
    defaultAmount: 150000000,
  },
  {
    type: 'MACHINERY_FUEL',
    label: '3. Máy móc & Nhiên liệu (MACHINERY_FUEL)',
    desc: 'Xăng dầu trạm bơm, điện 3 pha, máy cày bừa, bảo dưỡng',
    defaultAmount: 80000000,
  },
  {
    type: 'DEPRECIATION',
    label: '4. Khấu hao tài sản (DEPRECIATION)',
    desc: 'Khấu hao nhà kính, hệ thống tưới nhỏ giọt, máy móc',
    defaultAmount: 40000000,
  },
  {
    type: 'INDIRECT_OVERHEAD',
    label: '5. Chi phí chung & Khác (INDIRECT_OVERHEAD)',
    desc: 'Chi phí kiểm định KCS, vật dụng bảo hộ, quản lý trại',
    defaultAmount: 30000000,
  },
];

export function BudgetApprovalModal({ isOpen, onClose, onSuccess, initialFarmId, farms = [] }) {
  const currentYear = new Date().getFullYear();
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [fiscalYear, setFiscalYear] = useState(currentYear);
  const [budgetName, setBudgetName] = useState('');
  const [costCategories, setCostCategories] = useState([]);
  const [lineAmounts, setLineAmounts] = useState({});
  const [lineNotes, setLineNotes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize selectedFarmId
  useEffect(() => {
    if (isOpen) {
      const defaultFarm = (initialFarmId && initialFarmId !== 'ALL')
        ? String(initialFarmId)
        : (farms[0]?.id ? String(farms[0].id) : '');
      setSelectedFarmId(defaultFarm);
      setFiscalYear(currentYear);
      setError(null);

      // Default line amounts
      const initAmounts = {};
      const initNotes = {};
      STANDARD_COST_TYPES.forEach((c) => {
        initAmounts[c.type] = c.defaultAmount;
        initNotes[c.type] = '';
      });
      setLineAmounts(initAmounts);
      setLineNotes(initNotes);
    }
  }, [isOpen, initialFarmId, farms]);

  // Load cost categories
  useEffect(() => {
    if (!isOpen) return;
    const loadCategories = async () => {
      try {
        const res = await financeService.getCostCategories();
        const list = Array.isArray(res) ? res : res?.content || [];
        setCostCategories(list);
      } catch (err) {
        console.error('Failed to load cost categories:', err);
      }
    };
    loadCategories();
  }, [isOpen]);

  // Load operational cycles when selectedFarmId changes
  useEffect(() => {
    if (!selectedFarmId) {
      setCycles([]);
      setSelectedCycleId('');
      return;
    }
    const loadCycles = async () => {
      try {
        const res = await financeService.getOperationalCycles(selectedFarmId);
        const list = Array.isArray(res) ? res : res?.content || [];
        setCycles(list);
        if (list.length > 0) {
          setSelectedCycleId(String(list[0].id));
          const farmObj = farms.find((f) => String(f.id) === String(selectedFarmId));
          setBudgetName(`Ngân Sách Chu Kỳ ${list[0].name} - ${farmObj?.name || 'Trang Trại'}`);
        } else {
          setSelectedCycleId('');
          const farmObj = farms.find((f) => String(f.id) === String(selectedFarmId));
          setBudgetName(`Kế Hoạch Ngân Sách Năm ${currentYear} - ${farmObj?.name || 'Trang Trại'}`);
        }
      } catch (err) {
        console.error('Failed to load cycles for budget:', err);
        setCycles([]);
      }
    };
    loadCycles();
  }, [selectedFarmId, farms]);

  // Total budget calculation
  const totalBudget = Object.values(lineAmounts).reduce((sum, val) => sum + (Number(val) || 0), 0);

  const handleAmountChange = (type, value) => {
    const num = Math.max(0, Number(value) || 0);
    setLineAmounts((prev) => ({ ...prev, [type]: num }));
  };

  const handleNotesChange = (type, value) => {
    setLineNotes((prev) => ({ ...prev, [type]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFarmId) {
      setError('Vui lòng chọn trang trại thụ hưởng ngân sách.');
      return;
    }
    if (!budgetName.trim()) {
      setError('Vui lòng nhập tên kế hoạch ngân sách.');
      return;
    }
    if (totalBudget <= 0) {
      setError('Tổng hạn mức ngân sách phải lớn hơn 0 VNĐ.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Build budget line items mapped to cost categories
      const items = STANDARD_COST_TYPES.map((std) => {
        // Find matching category or fallback
        const matched = costCategories.find((cc) => cc.costType === std.type) || costCategories[0];
        return {
          costCategoryId: matched ? matched.id : 1,
          allocatedAmount: lineAmounts[std.type] || 0,
          notes: lineNotes[std.type] || std.desc,
        };
      });

      const payload = {
        farmId: Number(selectedFarmId),
        operationalCycleId: selectedCycleId ? Number(selectedCycleId) : null,
        name: budgetName.trim(),
        fiscalYear: Number(fiscalYear),
        totalBudgetAmount: totalBudget,
        items,
      };

      await financeService.createBudget(payload, Number(selectedFarmId));
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Failed to create/approve budget:', err);
      setError(err?.response?.data?.message || err.message || 'Lỗi khi cấp ngân sách');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấp & Phê Duyệt Ngân Sách Chu Kỳ Cho Trang Trại"
      subtitle="Đặc quyền Chủ đầu tư (Owner): Phê duyệt hạn mức cấp vốn đầu kỳ (Status: ACTIVE) và kích hoạt cảnh báo 85% thực chi"
      icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500 font-medium">Tổng hạn mức phê duyệt:</span>
            <span className="text-lg font-black text-emerald-700">{formatCurrency(totalBudget)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Hủy Bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              Phê Duyệt & Cấp Vốn Ngay
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Chọn Trang Trại */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Trang Trại Thụ Hưởng <span className="text-rose-500">*</span>
            </label>
            <Select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              prefixIcon={<Building className="h-4 w-4 text-slate-400" />}
            >
              <option value="">-- Chọn trang trại --</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </Select>
          </div>

          {/* Chọn Chu Kỳ Vận Hành */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chu Kỳ Vận Hành / Vụ Mùa
            </label>
            <Select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              prefixIcon={<Layers className="h-4 w-4 text-slate-400" />}
            >
              <option value="">Toàn bộ chu kỳ trong năm</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.startDate} ~ {c.endDate})
                </option>
              ))}
            </Select>
          </div>

          {/* Năm Tài Chính */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Năm Tài Chính <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              prefixIcon={<Calendar className="h-4 w-4 text-slate-400" />}
            />
          </div>
        </div>

        {/* Tên Kế Hoạch Ngân Sách */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tên Quyết Định Dự Toán / Cấp Vốn <span className="text-rose-500">*</span>
          </label>
          <Input
            value={budgetName}
            onChange={(e) => setBudgetName(e.target.value)}
            placeholder="Ví dụ: Ngân Sách Chu Kỳ Thu Đông 2026 - Trại Bắc Ninh"
          />
        </div>

        {/* Bảng phân bổ 5 nhóm định mức chi phí chuẩn */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Phân Bổ Hạn Mức Theo 5 Nhóm Chi Phí Chuẩn
            </span>
            <span className="text-[11px] text-slate-400">
              Kế toán trại chỉ được chi trong phạm vi các nhóm này
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
            {STANDARD_COST_TYPES.map((std) => (
              <div key={std.type} className="p-3 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-1/2">
                  <span className="text-xs font-bold text-slate-900 block">{std.label}</span>
                  <span className="text-[11px] text-slate-500 block">{std.desc}</span>
                </div>
                <div className="flex items-center gap-2 sm:w-1/2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={0}
                      step={1000000}
                      value={lineAmounts[std.type] || ''}
                      onChange={(e) => handleAmountChange(std.type, e.target.value)}
                      placeholder="Số tiền cấp (VNĐ)"
                      suffix="VNĐ"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badge cam kết phê duyệt ngay */}
        <div className="flex items-center gap-2 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Hạn mức này sẽ được kích hoạt ở trạng thái <strong>ACTIVE</strong> ngay sau khi lưu. Khi thực chi của Kế toán trại chạm ngưỡng <strong>85%</strong> hạn mức, hệ thống sẽ gửi chuông cảnh báo tới Chủ đầu tư.
          </span>
        </div>
      </form>
    </Modal>
  );
}
