import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormControls';
import { CheckCircle2, DollarSign, Building, Calendar, Layers, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { financeService } from '@/services/modules/financeService';
import { geographyService } from '@/services/modules/geographyService';
import { useAuthStore } from '@/store/useAuthStore';

const STANDARD_BUDGET_CATEGORIES = [
  {
    key: 'BREED_SEEDS',
    catCode: 'CST-002',
    costType: 'MATERIALS',
    label: '1. Cây giống & Con giống vật nuôi (Nhập đàn / Mua giống)',
    desc: 'Kinh phí nhập đàn gia súc/gia cầm (đàn bò BBB, đàn gà, dê...), hom giống cỏ voi, cây giống ăn trái',
    defaultAmount: 500000000,
  },
  {
    key: 'FEED_FERTILIZER',
    catCode: 'CST-001',
    costType: 'MATERIALS',
    label: '2. Thức ăn chăn nuôi & Phân bón dinh dưỡng',
    desc: 'Cỏ voi, bắp ủ chua, thức ăn hỗn hợp TMR, cám viên, phân bón NPK & vi sinh hữu cơ',
    defaultAmount: 150000000,
  },
  {
    key: 'VET_PESTICIDE',
    catCode: 'CST-006',
    costType: 'MATERIALS',
    label: '3. Thuốc thú y, Vắc-xin & Bảo vệ thực vật',
    desc: 'Vắc-xin tiêm phòng định kỳ, thuốc thú y, sát trùng chuồng trại, thuốc BVTV sinh học an toàn',
    defaultAmount: 30000000,
  },
  {
    key: 'LABOR',
    catCode: 'CST-008',
    costType: 'DIRECT_LABOR',
    label: '4. Chi phí nhân công & Tiền lương trực tiếp',
    desc: 'Tiền công gieo trồng, chăm sóc đàn vật nuôi, vắt sữa, thu hoạch, trực ca đêm & làm thêm OT',
    defaultAmount: 120000000,
  },
  {
    key: 'MACHINERY',
    catCode: 'CST-011',
    costType: 'MACHINERY_FUEL',
    label: '5. Máy móc, Nhiên liệu & Cơ giới nông nghiệp',
    desc: 'Xăng dầu trạm bơm, dầu máy cày, máy băm cỏ, xe vận chuyển nội bộ, bảo dưỡng phụ tùng',
    defaultAmount: 50000000,
  },
  {
    key: 'DEPRECIATION',
    catCode: 'CST-014',
    costType: 'DEPRECIATION',
    label: '6. Khấu hao tài sản, Chuồng trại & Nhà màng',
    desc: 'Trích khấu hao chuồng đệm lót sinh học, nhà màng công nghệ cao, giàn tưới nhỏ giọt Israel',
    defaultAmount: 40000000,
  },
  {
    key: 'OVERHEAD_TAGS',
    catCode: 'TAG_COST',
    costType: 'INDIRECT_OVERHEAD',
    label: '7. Thẻ tai RFID, Điện nước & Chi phí chung',
    desc: 'Thẻ tai điện tử thông minh, tiền điện trạm bơm 3 pha, nước sạch lọc RO, bảo hộ lao động, kiểm định VietGAP',
    defaultAmount: 30000000,
  },
];

export function BudgetApprovalModal({ isOpen, onClose, onSuccess, initialFarmId, farms = [] }) {
  const { isFarmAccountant, isOwner } = useAuthStore();
  const isAccountant = isFarmAccountant();
  const owner = isOwner();
  const isMaker = !owner; // Farm Manager hoặc Kế toán đóng vai trò Maker lập đề xuất trình duyệt
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
      STANDARD_BUDGET_CATEGORIES.forEach((c) => {
        initAmounts[c.key] = c.defaultAmount;
        initNotes[c.key] = '';
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
      const items = STANDARD_BUDGET_CATEGORIES.map((std) => {
        // Find matching category by code first, then by name or costType, or fallback
        const matched =
          costCategories.find((cc) => cc.code === std.catCode) ||
          costCategories.find((cc) => cc.name?.toLowerCase().includes('giống') && std.key === 'BREED_SEEDS') ||
          costCategories.find((cc) => cc.costType === std.costType) ||
          costCategories[0];
        return {
          costCategoryId: matched ? matched.id : 1,
          allocatedAmount: lineAmounts[std.key] || 0,
          notes: lineNotes[std.key] || std.desc,
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
      title={isMaker ? "Lập Đề Xuất Dự Toán Ngân Sách Chu Kỳ (Trình Owner Cấp Vốn)" : "Cấp & Phê Duyệt Ngân Sách Chu Kỳ Cho Trang Trại"}
      subtitle={isMaker
        ? "Quy trình Maker-Checker: Giám đốc trại / Kế toán lập dự trù nhu cầu vốn vận hành hoặc đề xuất cấp bổ sung ngân sách (Status: DRAFT) trình Chủ đầu tư phê duyệt."
        : "Đặc quyền Chủ đầu tư (Owner): Thiết lập và kích hoạt hạn mức cấp vốn niên vụ (Status: ACTIVE), tự động bật cảnh báo 85% thực chi."
      }
      icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {isMaker ? 'Tổng đề xuất xin cấp vốn:' : 'Tổng hạn mức phê duyệt:'}
            </span>
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
              {isMaker ? '[Gửi Đề Xuất Cho Chủ Đầu Tư (DRAFT)]' : '[Lưu & Cấp Vốn Ngân Sách (ACTIVE)]'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isMaker && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              💡 <strong>Quy trình Maker-Checker:</strong> Đề xuất ngân sách này sẽ được lưu ở trạng thái <strong>DRAFT (Chờ phê duyệt)</strong> và chuyển đến Chủ sở hữu trang trại (Owner) để thẩm định và rót vốn. Sau khi Owner duyệt, ngân sách mới chính thức có hiệu lực <strong>ACTIVE</strong>.
            </span>
          </div>
        )}

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

        {/* Bảng phân bổ các nhóm định mức chi phí chuẩn */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Phân Bổ Hạn Mức Theo Các Hạng Mục Chi Phí Chuẩn ({STANDARD_BUDGET_CATEGORIES.length} nhóm)
            </span>
            <span className="text-[11px] text-slate-400">
              Kế toán trại chỉ được chi trong phạm vi các nhóm này
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
            {STANDARD_BUDGET_CATEGORIES.map((std) => (
              <div key={std.key} className="p-3 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-1/2">
                  <span className="text-xs font-bold text-slate-900 block">{std.label}</span>
                  <span className="text-[11px] text-slate-500 block">{std.desc}</span>
                </div>
                <div className="flex flex-col gap-1 sm:w-1/2">
                  <div className="relative w-full">
                    <Input
                      type="number"
                      min={0}
                      step={1000000}
                      value={lineAmounts[std.key] ?? ''}
                      onChange={(e) => handleAmountChange(std.key, e.target.value)}
                      placeholder={isMaker ? "Số tiền đề xuất (VNĐ)" : "Số tiền cấp (VNĐ)"}
                      suffix="VNĐ"
                    />
                  </div>
                  <input
                    type="text"
                    value={lineNotes[std.key] ?? ''}
                    onChange={(e) => setLineNotes({ ...lineNotes, [std.key]: e.target.value })}
                    placeholder="Ghi chú / Lý do giải trình đề xuất (nếu có)..."
                    className="w-full text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badge cam kết phê duyệt hoặc lưu ý đề xuất */}
        {isMaker ? (
          <div className="flex items-center gap-2 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              Đề xuất sẽ được gửi đến <strong>Chủ đầu tư (Owner)</strong>. Bạn có thể giải trình chi tiết lý do và hạn mức cho từng nhóm chi phí ở trên để Owner thẩm định phê duyệt nhanh chóng.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Hạn mức này sẽ được kích hoạt ở trạng thái <strong>ACTIVE</strong> ngay sau khi lưu. Khi thực chi của Kế toán trại chạm ngưỡng <strong>85%</strong> hạn mức, hệ thống sẽ gửi chuông cảnh báo tới Chủ đầu tư.
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
}
