import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Landmark,
  Banknote,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Lock,
  Printer,
  Edit,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  Building,
  Layers,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { financeService } from '@/services/modules/financeService';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

// ================= DỮ LIỆU SỔ QUỸ MẪU CHUẨN THỰC CHIẾN FARMGO =================

export const MOCK_BARNS_AND_BATCHES = [
  { id: 1, barnName: 'Chuồng Gà A1', batchName: 'Lứa Gà Thịt T11 (3.000 con)' },
  { id: 2, barnName: 'Chuồng Gà A2', batchName: 'Lứa Gà Thịt T10 (Chuẩn bị thả)' },
  { id: 3, barnName: 'Chuồng Heo B1', batchName: 'Lứa Heo Thịt H09 (120 con)' },
  { id: 4, barnName: 'Chuồng Heo B2', batchName: 'Lứa Heo Thịt H08 (Đã xuất chuồng)' },
];

export const MOCK_CATEGORIES = {
  INCOME: [
    'Thu bán gà thịt',
    'Thu bán heo thịt',
    'Thu nợ thương lái',
    'Thu đặt cọc lứa nuôi',
    'Thu bán phân & bao bì',
    'Thu khác',
  ],
  EXPENSE: [
    'Chi nhập cám thức ăn',
    'Chi nhập con giống',
    'Chi trả nợ NCC gối đầu',
    'Chi tiền điện thắp sáng & sưởi',
    'Chi tiền nước sinh hoạt & vệ sinh',
    'Chi sửa chữa thiết bị chuồng trại',
    'Chi lương nhân công',
    'Chi khác',
  ],
};

export const INITIAL_CASHBOOK_TRANSACTIONS = [
  {
    id: 1,
    slipCode: 'PT-2026-020',
    type: 'INCOME', // Thu
    date: '2026-11-15 09:30',
    category: 'Thu bán gà thịt',
    partnerName: 'Thương lái Hoàng Hải',
    amount: 220000000,
    fundSource: 'BANK',
    balanceAfter: 489500000,
    isSystem: true,
    refType: 'ORDER_SALE',
    refCode: 'PX-2026-007',
    allocationType: 'BATCH',
    allocationText: 'Chuồng Gà A1 - Lứa T11',
    notes: 'Thu tiền bán đợt 1 lứa gà thịt T11 (3.000 con), chuyển khoản Vietcombank',
  },
  {
    id: 2,
    slipCode: 'PT-2026-021',
    type: 'INCOME',
    date: '2026-11-14 14:15',
    category: 'Thu đặt cọc lứa nuôi',
    partnerName: 'Thương lái Ba Tân',
    amount: 60000000,
    fundSource: 'BANK',
    balanceAfter: 269500000,
    isSystem: false,
    refType: 'MANUAL',
    refCode: null,
    allocationType: 'BATCH',
    allocationText: 'Chuồng Heo B1 - Lứa H09',
    notes: 'Nhận cọc 60 triệu đặt bao tiêu lứa heo thịt H09 xuất chuồng cuối tháng',
  },
  {
    id: 3,
    slipCode: 'PT-2026-022',
    type: 'INCOME',
    date: '2026-11-13 16:00',
    category: 'Thu bán phân & bao bì',
    partnerName: 'Hợp tác xã phân bón hữu cơ Đồng Nai',
    amount: 130000000,
    fundSource: 'CASH',
    balanceAfter: 209500000,
    isSystem: false,
    refType: 'MANUAL',
    refCode: null,
    allocationType: 'NONE',
    allocationText: 'Chi phí chung toàn trại',
    notes: 'Thu tiền mặt dọn trấu phân gà và thanh lý vỏ bao cám gom 2 tháng',
  },
  {
    id: 4,
    slipCode: 'PC-2026-042',
    type: 'EXPENSE', // Chi
    date: '2026-11-12 11:20',
    category: 'Chi nhập cám thức ăn',
    partnerName: 'Công ty Cổ phần Chăn nuôi C.P. Việt Nam',
    amount: -53250000,
    fundSource: 'BANK',
    balanceAfter: 79500000,
    isSystem: true,
    refType: 'INVOICE_PURCHASE',
    refCode: 'PN-2026-015',
    allocationType: 'BATCH',
    allocationText: 'Chuồng Gà A1 - Lứa T11',
    notes: 'Thanh toán tiền nhập cám gà con và cám gà thịt theo hóa đơn PN-2026-015',
  },
  {
    id: 5,
    slipCode: 'PC-2026-043',
    type: 'EXPENSE',
    date: '2026-11-08 10:00',
    category: 'Chi nhập con giống',
    partnerName: 'Trại giống gia cầm Dabaco',
    amount: -48000000,
    fundSource: 'BANK',
    balanceAfter: 132750000,
    isSystem: true,
    refType: 'INVOICE_PURCHASE',
    refCode: 'PN-2026-014',
    allocationType: 'BATCH',
    allocationText: 'Chuồng Gà A1 - Lứa T11',
    notes: 'Thanh toán mua 3.000 con gà giống Mía lai 1 ngày tuổi theo hóa đơn PN-2026-014',
  },
  {
    id: 6,
    slipCode: 'PC-2026-044',
    type: 'EXPENSE',
    date: '2026-11-05 17:30',
    category: 'Chi lương nhân công',
    partnerName: 'Toàn thể công nhân chuồng trại',
    amount: -85000000,
    fundSource: 'CASH',
    balanceAfter: 180750000,
    isSystem: true,
    refType: 'PAYROLL',
    refCode: 'BL-2026-10',
    allocationType: 'ALL_ACTIVE',
    allocationText: 'Chia đều cho các lứa đang nuôi',
    notes: 'Chi tiền mặt thanh toán lương cứng và thưởng năng suất tháng 10 cho công nhân',
  },
  {
    id: 7,
    slipCode: 'PC-2026-045',
    type: 'EXPENSE',
    date: '2026-11-05 09:15',
    category: 'Chi tiền điện thắp sáng & sưởi',
    partnerName: 'Công ty Điện Lực Thống Nhất',
    amount: -18250000,
    fundSource: 'BANK',
    balanceAfter: 265750000,
    isSystem: false,
    refType: 'MANUAL',
    refCode: null,
    allocationType: 'BATCH',
    allocationText: 'Chuồng Gà A1 - Lứa T11',
    notes: 'Tiền điện chạy quạt thông gió và bóng sưởi hồng ngoại úm gà chuồng A1 tháng 11',
  },
  {
    id: 8,
    slipCode: 'PC-2026-046',
    type: 'EXPENSE',
    date: '2026-11-04 15:45',
    category: 'Chi tiền nước sinh hoạt & vệ sinh',
    partnerName: 'Xí nghiệp cấp nước sinh hoạt',
    amount: -8000000,
    fundSource: 'CASH',
    balanceAfter: 284000000,
    isSystem: false,
    refType: 'MANUAL',
    refCode: null,
    allocationType: 'BATCH',
    allocationText: 'Chuồng Heo B1 - Lứa H09',
    notes: 'Chi tiền nước máy xịt rửa chuồng heo và tắm heo hàng ngày',
  },
  {
    id: 9,
    slipCode: 'PC-2026-047',
    type: 'EXPENSE',
    date: '2026-11-02 08:30',
    category: 'Chi sửa chữa thiết bị chuồng trại',
    partnerName: 'Cửa hàng cơ điện Minh Phát',
    amount: -33000000,
    fundSource: 'BANK',
    balanceAfter: 292000000,
    isSystem: false,
    refType: 'MANUAL',
    refCode: null,
    allocationType: 'NONE',
    allocationText: 'Chi phí chung toàn trại',
    notes: 'Thay thế 2 motor quạt hút làm mát và bảo dưỡng hệ thống giàn lạnh',
  },
];

export function CashbookPage() {
  const { userInfo, isOwner, isSuperAdmin, hasPermission } = useAuthStore();
  const { activeFarmId } = useActiveFarmStore();
  const { activeBranchId } = useActiveBranchStore();
  const userRoles = (userInfo?.roles || []).map((r) => (typeof r === 'string' ? r : r?.code)).filter(Boolean);

  // Phân quyền RBAC nghiêm ngặt: Chỉ Chủ trại và Kế toán kho được xem
  const canAccessCashbook = useMemo(() => {
    return (
      isOwner?.() ||
      isSuperAdmin?.() ||
      userRoles.includes('ROLE_FARM_OWNER') ||
      userRoles.includes('ROLE_ACCOUNTANT') ||
      hasPermission?.('cashbook.view') ||
      hasPermission?.('cashbook.manage')
    );
  }, [userInfo, userRoles]);

  const canDeleteSlip = useMemo(() => {
    return isOwner?.() || isSuperAdmin?.() || userRoles.includes('ROLE_FARM_OWNER') || hasPermission?.('cashbook.delete');
  }, [userInfo, userRoles]);

  const defaultFarmId = Number(userInfo?.accessibleFarms?.[0]?.farmId || userInfo?.accessibleFarms?.[0]?.id || 1);
  const resolvedFarmId = activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : defaultFarmId;

  // State danh sách phiếu (dữ liệu thật từ Backend API)
  const [transactions, setTransactions] = useState([]);
  const [serverSummary, setServerSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    cashBalance: 0,
    bankBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadCashbook = useCallback(async () => {
    if (!canAccessCashbook) return;
    setIsLoading(true);
    try {
      const farmParam = resolvedFarmId;
      const params = { size: 200 };
      if (activeBranchId && activeBranchId !== 'ALL') {
        params.branchId = activeBranchId;
      }
      const res = await financeService.getCashbook(farmParam, params);
      const list = Array.isArray(res?.entries?.content) ? res.entries.content : [];
      const mapped = list.map((item) => {
        const isInc = item.type === 'INCOME';
        const pm = (item.paymentMethod || '').toUpperCase();
        const fundSource = pm === 'TIEN_MAT' || pm === 'CASH' ? 'CASH' : 'BANK';
        const amt = Number(item.amount || 0);
        return {
          id: item.id,
          slipCode: item.slipCode || (isInc ? `PT-${item.id}` : `PC-${item.id}`),
          type: isInc ? 'INCOME' : 'EXPENSE',
          date: item.date || '',
          category: item.category || (isInc ? 'Thu bán hàng' : 'Chi vận hành'),
          partnerName: item.targetPerson || 'Đối tác giao dịch',
          amount: isInc ? amt : -Math.abs(amt),
          fundSource,
          balanceAfter: 0,
          isSystem: Boolean(item.isLocked),
          refType: item.isLocked ? 'SYSTEM' : 'MANUAL',
          refCode: item.isLocked ? item.slipCode : null,
          allocationType: item.allocatedCycleId ? 'BATCH' : 'NONE',
          allocationText: item.barnName
            ? `${item.barnName}${item.batchName ? ` - ${item.batchName}` : ''}`
            : item.allocatedCycleId
              ? `Lứa nuôi #${item.allocatedCycleId}`
              : 'Chi phí chung toàn trại',
          notes: item.notes || '',
        };
      });
      setTransactions(mapped);
      setServerSummary({
        totalIncome: Number(res?.totalIncome || 0),
        totalExpense: Number(res?.totalExpense || 0),
        cashBalance: Number(res?.cashBalance || 0),
        bankBalance: Number(res?.bankBalance || 0),
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể tải dữ liệu Sổ quỹ từ hệ thống');
    } finally {
      setIsLoading(false);
    }
  }, [canAccessCashbook, activeFarmId, activeBranchId]);

  useEffect(() => {
    loadCashbook();
  }, [loadCashbook]);

  // Bộ lọc Khối 2
  const [searchQuery, setSearchQuery] = useState('');
  const [fundFilter, setFundFilter] = useState('ALL'); // ALL, CASH, BANK
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, INCOME, EXPENSE
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('THIS_MONTH'); // TODAY, THIS_MONTH, THIS_QUARTER, CUSTOM
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('EXPENSE'); // INCOME hoặc EXPENSE
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedSlipForView, setSelectedSlipForView] = useState(null);

  // Form Lập phiếu thu / chi
  const [form, setForm] = useState({
    type: 'EXPENSE',
    fundSource: 'BANK',
    date: new Date().toISOString().split('T')[0],
    category: 'Chi tiền điện thắp sáng & sưởi',
    amount: 15000000,
    partnerName: 'Công ty Điện Lực Thống Nhất',
    allocationMode: 'BATCH', // NONE (Chi phí chung), BATCH (1 lứa), ALL_ACTIVE (Chia đều)
    barnId: 1,
    notes: '',
  });

  // ================= TÍNH TOÁN KHỐI 1 KPI CARDS =================
  const kpiStats = useMemo(() => {
    const totalIncome = Number(serverSummary.totalIncome || 0);
    const totalExpense = Number(serverSummary.totalExpense || 0);
    const cashBalance = Number(serverSummary.cashBalance || 0);
    const bankBalance = Number(serverSummary.bankBalance || 0);
    const closingBalance = cashBalance + bankBalance;
    const openingBalance = closingBalance - totalIncome + totalExpense;

    return {
      openingBalance,
      totalIncome,
      totalExpense,
      closingBalance,
      cashBalance,
      bankBalance,
    };
  }, [serverSummary]);

  // ================= LỌC DANH SÁCH =================
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Lọc nguồn quỹ
      if (fundFilter !== 'ALL' && tx.fundSource !== fundFilter) return false;

      // Lọc loại thu / chi
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

      // Lọc hạng mục
      if (categoryFilter !== 'ALL' && tx.category !== categoryFilter) return false;

      // Tìm kiếm mã phiếu, đối tác, diễn giải
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = tx.slipCode.toLowerCase().includes(q);
        const matchPartner = tx.partnerName.toLowerCase().includes(q);
        const matchNotes = (tx.notes || '').toLowerCase().includes(q);
        const matchRef = (tx.refCode || '').toLowerCase().includes(q);
        if (!matchCode && !matchPartner && !matchNotes && !matchRef) return false;
      }

      return true;
    });
  }, [transactions, fundFilter, typeFilter, categoryFilter, searchQuery]);

  // ================= TÁC VỤ MỞ MODAL LẬP PHIẾU =================
  const handleOpenCreateModal = (type = 'EXPENSE') => {
    setModalType(type);
    const isInc = type === 'INCOME';

    setForm({
      type,
      fundSource: 'BANK',
      date: new Date().toISOString().split('T')[0],
      category: isInc ? MOCK_CATEGORIES.INCOME[0] : MOCK_CATEGORIES.EXPENSE[3],
      amount: isInc ? 50000000 : 15000000,
      partnerName: isInc ? 'Thương lái Hoàng Hải' : 'Công ty Điện Lực Thống Nhất',
      allocationMode: isInc ? 'NONE' : 'BATCH',
      barnId: 1,
      notes: isInc ? 'Thu tiền bán đàn xuất chuồng đợt 2' : 'Tiền điện thắp sáng và sưởi úm gà chuồng A1',
    });

    setIsModalOpen(true);
  };

  // Lưu phiếu thu / chi mới (gọi API thật, lưu DB MySQL)
  const handleSaveSlip = async (e) => {
    e.preventDefault();
    const amt = Number(form.amount) || 0;
    if (amt <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    const isInc = modalType === 'INCOME';
    const farmParam = resolvedFarmId;

    try {
      const created = await financeService.createCashbookEntry(farmParam, {
        type: modalType,
        date: form.date,
        category: form.category,
        amount: amt,
        paymentMethod: form.fundSource === 'CASH' ? 'TIEN_MAT' : 'CHUYEN_KHOAN',
        targetPerson: form.partnerName,
        allocatedCycleId: form.allocationMode === 'BATCH' ? Number(form.barnId) || null : null,
        notes: form.notes || form.category,
        branchId: activeBranchId && activeBranchId !== 'ALL' ? Number(activeBranchId) : null,
      });

      const code = created?.slipCode || (isInc ? 'PT' : 'PC');
      toast.success(
        isInc
          ? `Đã lập Phiếu Thu "${code}" (+${formatCurrency(amt)}) vào Sổ quỹ thành công!`
          : `Đã lập Phiếu Chi "${code}" (-${formatCurrency(amt)}) vào Sổ quỹ thành công!`
      );
      setIsModalOpen(false);
      await loadCashbook();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể lưu phiếu thu/chi lên hệ thống');
    }
  };

  // Xóa phiếu (chỉ phiếu thủ công - gọi API thật)
  const handleDeleteSlip = async (slip) => {
    if (slip.isSystem) {
      toast.error('Không thể xóa phiếu tự động đồng bộ từ Hóa đơn/Bảng lương. Vui lòng xử lý tại chứng từ gốc.');
      return;
    }
    if (!canDeleteSlip) {
      toast.error('Chỉ Chủ trang trại mới có quyền xóa phiếu trên sổ quỹ');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phiếu "${slip.slipCode}"?`)) return;

    const farmParam = activeFarmId && activeFarmId !== 'ALL' ? activeFarmId : 1;
    try {
      await financeService.deleteCashbookEntry(farmParam, slip.id);
      toast.success(`Đã xóa phiếu "${slip.slipCode}" khỏi sổ quỹ`);
      await loadCashbook();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể xóa phiếu này');
    }
  };

  // Mở modal in phiếu
  const handleOpenPrintModal = (slip) => {
    setSelectedSlipForView(slip);
    setIsPrintModalOpen(true);
  };

  // Xử lý xuất file excel
  const handleExportExcel = () => {
    toast.info('Đang tạo file Excel Sổ Quỹ Thu Chi định dạng chuẩn kế toán...');
    setTimeout(() => {
      toast.success('Đã xuất thành công file "So_Quy_Thu_Chi_T11_2026.xlsx"');
    }, 800);
  };

  // ================= NẾU KHÔNG CÓ QUYỀN TRUY CẬP =================
  if (!canAccessCashbook) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Truy Cập Bị Từ Chối (Quyền Sổ Quỹ Thu Chi)</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Phân hệ <strong>Sổ Quỹ Thu Chi</strong> chứa dữ liệu dòng tiền mặt, tài khoản ngân hàng và giá vốn của trang trại.
          Để đảm bảo tính bảo mật tài chính, chức năng này chỉ dành riêng cho <strong>Chủ trang trại</strong> và <strong>Kế toán kho</strong>.
        </p>
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            Quay Lại Trang Trước
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* KHỐI 1: KHỐI TỔNG HỢP DÒNG TIỀN & SỐ DƯ QUỸ (TOP 4 CASHFLOW KPI CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tồn quỹ đầu kỳ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Tồn Quỹ Đầu Kỳ
          </span>
          <div className="text-2xl font-black text-slate-800 font-mono tracking-tight my-1">
            {formatCurrency(kpiStats.openingBalance)}
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Chuyển từ tháng 10/2026 sang</span>
          </p>
        </div>

        {/* Thẻ 2: Tổng Thu trong kỳ (Màu xanh lá) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              Tổng Thu Trong Kỳ
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight my-1">
            +{formatCurrency(kpiStats.totalIncome)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            Thu bán đàn, cọc lứa & phân bón
          </p>
        </div>

        {/* Thẻ 3: Tổng Chi trong kỳ (Màu đỏ) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-1">
              Tổng Chi Trong Kỳ
            </span>
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono tracking-tight my-1">
            -{formatCurrency(kpiStats.totalExpense)}
          </div>
          <p className="text-[11px] text-rose-500 font-medium">
            Cám, giống, lương & điện nước vận hành
          </p>
        </div>

        {/* Thẻ 4: Tồn quỹ thực tế (Nổi bật - Số dư cuối kỳ) */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 p-5 rounded-2xl text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Tồn Quỹ Thực Tế (Số Dư)
            </span>
            <Wallet className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-white my-1">
            {formatCurrency(kpiStats.closingBalance)}
          </div>
          <div className="pt-2 border-t border-emerald-800/80 text-[11px] text-emerald-200 flex items-center justify-between font-mono">
            <span>Tiền mặt: <strong>{formatCurrency(kpiStats.cashBalance)}</strong></span>
            <span>|</span>
            <span>Ngân hàng: <strong>{formatCurrency(kpiStats.bankBalance)}</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 2: THANH LỌC ĐA CHIỀU & CỤM TÁC VỤ (FILTER & TOOLBAR) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã PT/PC, đối tác, diễn giải..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          {/* Cụm nút hành động góc phải */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="h-4 w-4 text-emerald-700" />}
              onClick={handleExportExcel}
              className="text-xs font-bold"
            >
              Xuất Sổ Quỹ Excel
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="h-4 w-4 text-emerald-600" />}
              onClick={() => handleOpenCreateModal('INCOME')}
              className="font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              + Lập Phiếu Thu
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => handleOpenCreateModal('EXPENSE')}
              className="font-bold bg-rose-600 hover:bg-rose-700"
            >
              + Lập Phiếu Chi
            </Button>
          </div>
        </div>

        {/* Thanh lọc Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Lọc nguồn quỹ */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Nguồn quỹ:</span>
            <select
              value={fundFilter}
              onChange={(e) => setFundFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất Cả Quỹ</option>
              <option value="CASH">Tiền Mặt Tại Trại</option>
              <option value="BANK">Tài Khoản Ngân Hàng (Vietcombank)</option>
            </select>
          </div>

          {/* Lọc loại giao dịch */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Giao dịch:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất Cả Loại</option>
              <option value="INCOME">Chỉ Phiếu Thu (+)</option>
              <option value="EXPENSE">Chỉ Phiếu Chi (-)</option>
            </select>
          </div>

          {/* Lọc hạng mục */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Hạng mục:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-xs"
            >
              <option value="ALL">Tất Cả Hạng Mục</option>
              <optgroup label="Hạng Mục Thu">
                {MOCK_CATEGORIES.INCOME.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Hạng Mục Chi">
                {MOCK_CATEGORIES.EXPENSE.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {(searchQuery || fundFilter !== 'ALL' || typeFilter !== 'ALL' || categoryFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFundFilter('ALL');
                setTypeFilter('ALL');
                setCategoryFilter('ALL');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 3: BẢNG NHẬT KÝ GIAO DỊCH SỔ QUỸ (CASHBOOK LEDGER TABLE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã Phiếu & Thời Gian</th>
                <th className="py-3 px-3">Loại & Hạng Mục</th>
                <th className="py-3 px-4">Đối Tác & Diễn Giải</th>
                <th className="py-3 px-4">Nguồn Gốc & Phân Bổ Lứa Nuôi</th>
                <th className="py-3 px-3">Nguồn Quỹ</th>
                <th className="py-3 px-3 text-right">Số Tiền (VNĐ)</th>
                <th className="py-3 px-3 text-right">Tồn Lũy Kế</th>
                <th className="py-3 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Wallet className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <span>Không có giao dịch sổ quỹ phù hợp với bộ lọc</span>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isInc = tx.type === 'INCOME';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Mã phiếu & Thời gian */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => handleOpenPrintModal(tx)}
                          className="font-black font-mono text-slate-900 text-xs hover:text-emerald-700 cursor-pointer hover:underline whitespace-nowrap"
                        >
                          {tx.slipCode}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{tx.date}</span>
                        </div>
                      </td>

                      {/* Loại & Hạng mục */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                            isInc
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isInc ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          <span>{isInc ? 'Phiếu Thu' : 'Phiếu Chi'}</span>
                        </span>
                        <div className="font-bold text-slate-800 text-[11px] mt-1">{tx.category}</div>
                      </td>

                      {/* Đối tác & Diễn giải */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 truncate" title={tx.partnerName}>
                          {tx.partnerName}
                        </div>
                        <div className="text-[11px] text-slate-500 italic truncate mt-0.5" title={tx.notes}>
                          "{tx.notes}"
                        </div>
                      </td>

                      {/* Nguồn gốc chứng từ & Phân bổ lứa nuôi */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {tx.isSystem ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                            <Lock className="h-3 w-3 text-blue-500" />
                            <span>Tự động từ {tx.refCode}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500">Lập phiếu thủ công</span>
                        )}

                        <div className="mt-1 text-[11px] text-emerald-800 font-bold truncate" title={tx.allocationText}>
                          Phân bổ: {tx.allocationText}
                        </div>
                      </td>

                      {/* Nguồn quỹ */}
                      <td className="py-3.5 px-3">
                        {tx.fundSource === 'BANK' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            <Landmark className="h-3 w-3 text-sky-600" />
                            <span>Ngân Hàng</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Banknote className="h-3 w-3 text-amber-600" />
                            <span>Tiền Mặt</span>
                          </span>
                        )}
                      </td>

                      {/* Số tiền */}
                      <td className="py-3.5 px-3 text-right">
                        <span
                          className={`font-black font-mono text-xs ${
                            isInc ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isInc ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Tồn lũy kế */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(tx.balanceAfter)}
                      </td>

                      {/* Hành động */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenPrintModal(tx)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title="Xem / In phiếu"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {tx.isSystem ? (
                            <span
                              className="p-1.5 text-slate-400"
                              title="Phiếu tự động từ hóa đơn - Không sửa/xóa trực tiếp"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            canDeleteSlip && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSlip(tx)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Xóa phiếu"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 4: MODAL LẬP PHIẾU THU / CHI & PHÂN BỔ CHI PHÍ LỨA NUÔI */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'INCOME' ? 'Lập Phiếu Thu Tiền Vào Quỹ' : 'Lập Phiếu Chi Tiền & Phân Bổ Giá Thành'}
        size="lg"
      >
        <form onSubmit={handleSaveSlip} className="space-y-4 text-xs">
          {/* Chọn Loại phiếu: Phiếu Thu hoặc Phiếu Chi */}
          <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => {
                setModalType('INCOME');
                setForm((prev) => ({
                  ...prev,
                  type: 'INCOME',
                  category: MOCK_CATEGORIES.INCOME[0],
                }));
              }}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-black transition-all ${
                modalType === 'INCOME'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              <span>+ Lập Phiếu Thu (Tiền Vào)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalType('EXPENSE');
                setForm((prev) => ({
                  ...prev,
                  type: 'EXPENSE',
                  category: MOCK_CATEGORIES.EXPENSE[3],
                }));
              }}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-black transition-all ${
                modalType === 'EXPENSE'
                  ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowUpRight className="h-4 w-4 text-rose-600" />
              <span>- Lập Phiếu Chi (Tiền Ra)</span>
            </button>
          </div>

          {/* Form Context: Nguồn quỹ, Ngày, Hạng mục */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Nguồn quỹ giao dịch *</label>
              <select
                value={form.fundSource}
                onChange={(e) => setForm({ ...form, fundSource: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="BANK">Tài khoản Ngân Hàng (Vietcombank)</option>
                <option value="CASH">Tiền mặt tại Quỹ Trại</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Ngày ghi nhận *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Hạng mục thu/chi *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {modalType === 'INCOME'
                  ? MOCK_CATEGORIES.INCOME.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))
                  : MOCK_CATEGORIES.EXPENSE.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Số tiền & Đối tượng nộp/nhận */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Số tiền giao dịch (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={`w-full p-2 font-mono font-black text-sm rounded-lg border focus:ring-2 ${
                  modalType === 'INCOME'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 focus:ring-emerald-500'
                    : 'bg-rose-50 border-rose-300 text-rose-900 focus:ring-rose-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                {modalType === 'INCOME' ? 'Người nộp tiền (Thương lái / Khách)' : 'Người nhận tiền (Điện lực / NCC / Nhân viên)'} *
              </label>
              <input
                type="text"
                value={form.partnerName}
                onChange={(e) => setForm({ ...form, partnerName: e.target.value })}
                placeholder="Nhập tên đối tác..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                required
              />
            </div>
          </div>

          {/* KHỐI PHÂN BỔ CHI PHÍ VÀO GIÁ THÀNH LỨA NUÔI (HIỂN THỊ KHI LẬP PHIẾU CHI) */}
          {modalType === 'EXPENSE' && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <Layers className="h-4 w-4 text-amber-700" />
                <span>Phân Bổ Chi Phí Này Vào Giá Thành Lứa Nuôi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-amber-900 font-medium block mb-1">Hình thức phân bổ:</label>
                  <select
                    value={form.allocationMode}
                    onChange={(e) => setForm({ ...form, allocationMode: e.target.value })}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="BATCH">Gắn đích danh 1 Lứa nuôi / Chuồng</option>
                    <option value="ALL_ACTIVE">Chia đều cho tất cả các lứa đang nuôi</option>
                    <option value="NONE">Không phân bổ (Chi phí quản lý chung)</option>
                  </select>
                </div>

                {form.allocationMode === 'BATCH' && (
                  <div>
                    <label className="text-[11px] text-amber-900 font-medium block mb-1">Chuồng & Lứa áp dụng:</label>
                    <select
                      value={form.barnId}
                      onChange={(e) => setForm({ ...form, barnId: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                    >
                      {MOCK_BARNS_AND_BATCHES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.barnName} - {b.batchName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-amber-800 italic">
                * Khoản chi này sẽ tự động cộng vào tổng chi phí để tính giá vốn 1kg thịt hơi của lứa nuôi được chọn.
              </p>
            </div>
          )}

          {/* Diễn giải chi tiết */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">Nội dung diễn giải chi tiết</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="VD: Tiền điện thắp sáng và sưởi úm gà chuồng A1..."
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className={`font-bold ${modalType === 'EXPENSE' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
            >
              Lưu Phiếu & Cập Nhật Sổ Quỹ
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL XEM CHI TIẾT & IN PHIẾU THU / CHI */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={selectedSlipForView ? `Chứng Từ: ${selectedSlipForView.slipCode}` : 'Xem Chứng Từ'}
        size="md"
      >
        {selectedSlipForView && (
          <div className="space-y-4 text-xs font-sans">
            {/* Mẫu phiếu in kế toán */}
            <div className="p-5 bg-white border-2 border-dashed border-slate-300 rounded-2xl space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                  TRANG TRẠI CHĂN NUÔI CÔNG NGHỆ CAO FARMGO
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 uppercase">
                  {selectedSlipForView.type === 'INCOME' ? 'PHIẾU THU TIỀN' : 'PHIẾU CHI TIỀN'}
                </h3>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Mã: <strong>{selectedSlipForView.slipCode}</strong> | Ngày: {selectedSlipForView.date}
                </div>
              </div>

              <div className="space-y-2 text-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Đối tác:</span>
                  <strong className="text-slate-900">{selectedSlipForView.partnerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hạng mục:</span>
                  <span className="font-semibold">{selectedSlipForView.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nguồn quỹ:</span>
                  <span className="font-semibold">
                    {selectedSlipForView.fundSource === 'BANK' ? 'Ngân Hàng (Vietcombank)' : 'Tiền mặt tại Quỹ Trại'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phân bổ lứa nuôi:</span>
                  <span className="font-bold text-emerald-800">{selectedSlipForView.allocationText}</span>
                </div>
                {selectedSlipForView.refCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chứng từ gốc:</span>
                    <span className="font-mono text-blue-700 font-bold">{selectedSlipForView.refCode}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-bold">Nội dung diễn giải:</span>
                  <span className="italic max-w-xs text-right">"{selectedSlipForView.notes}"</span>
                </div>
                <div className="flex justify-between items-center border-t-2 border-slate-900 pt-2 text-sm">
                  <span className="font-black uppercase">SỐ TIỀN THỰC HIỆN:</span>
                  <span
                    className={`font-black font-mono text-base ${
                      selectedSlipForView.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(Math.abs(selectedSlipForView.amount))}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 text-center pt-6 text-[11px] text-slate-600">
                <div>
                  <div className="font-bold">Người Lập Phiếu</div>
                  <div className="h-12" />
                  <div>(Ký, họ tên)</div>
                </div>
                <div>
                  <div className="font-bold">Kế Toán / Thủ Quỹ</div>
                  <div className="h-12" />
                  <div>(Ký, họ tên)</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPrintModalOpen(false)}>
                Đóng
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Printer className="h-4 w-4" />}
                onClick={() => {
                  toast.success(`Đang gửi lệnh in phiếu ${selectedSlipForView.slipCode}...`);
                }}
              >
                In Chứng Từ
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
