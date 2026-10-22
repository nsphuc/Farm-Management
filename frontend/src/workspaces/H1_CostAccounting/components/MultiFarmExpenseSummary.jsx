import React, { useState, useEffect, useMemo } from 'react';
import {
  Building,
  Layers,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Eye,
  FileText,
  Package,
  Users,
  Search,
  CheckCircle2,
  Camera,
  Globe2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/FormControls';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { financeService } from '@/services/modules/financeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { ReceiptPhotoModal } from './ReceiptPhotoModal';

/**
 * Workspace H1: Quản Trị Giá Thành & Bảng Thống Kê Chi Phí (Điều 2.8 File 08)
 * - Tự động đồng bộ với thanh TopBar:
 *   + Khi TopBar chọn "Tất cả trang trại" (ALL): Bảng hiển thị thống kê toàn bộ chuỗi trang trại và so sánh các trại.
 *   + Khi TopBar chọn 1 trang trại cụ thể: Bảng và các chỉ số KPI tự động cô lập hiển thị đúng theo trang trại đó.
 * - Không còn thanh bộ lọc trang trại riêng lẻ gây trùng lặp.
 */
export function MultiFarmExpenseSummary() {
  const { activeFarmId, activeFarm, syncTrigger } = useActiveFarmStore();

  const isAllFarms = !activeFarmId || activeFarmId === 'ALL';
  const selectedFarmId = isAllFarms ? undefined : Number(activeFarmId);
  const currentFarmName = isAllFarms ? 'Toàn Bộ Chuỗi Trang Trại' : (activeFarm?.name || `Trang Trại #${activeFarmId}`);

  // Chế độ xem: 'ALL' (Cả hai) | 'ENTERPRISE' (Toàn bộ trang trại) | 'PER_FARM' (Từng trang trại)
  const [viewMode, setViewMode] = useState('ALL');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');

  // Dữ liệu bảng thống kê
  const [summaryData, setSummaryData] = useState({
    items: [],
    totalMaterialsExpense: 0,
    totalLaborExpense: 0,
    totalOverheadExpense: 0,
    grandTotalExpense: 0,
    overallAvgUnitCost: 0,
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Chi tiết chứng từ của đối tượng đang chọn
  const [activeDetailTarget, setActiveDetailTarget] = useState(null);
  const [detailExpenses, setDetailExpenses] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Lightbox xem ảnh hóa đơn
  const [selectedExpenseForProof, setSelectedExpenseForProof] = useState(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  // Tải dữ liệu Bảng Thống Kê Chi Phí theo activeFarmId từ TopBar
  const fetchSummary = async () => {
    try {
      setIsLoadingSummary(true);
      const params = {};
      if (selectedFarmId) {
        params.farmId = selectedFarmId;
        params.filterFarmId = selectedFarmId;
      }

      const res = await financeService.getMultiFarmExpenseSummary(params);
      if (res) {
        setSummaryData(res);
        // Tự động chọn đối tượng chi tiết tương ứng
        if (selectedFarmId && res.items?.length > 0) {
          setActiveDetailTarget(res.items[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch multi-farm expense summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [activeFarmId, syncTrigger?.finance]);

  // Tạo đối tượng đại diện cho Toàn Bộ Doanh Nghiệp (chỉ dùng khi isAllFarms === true)
  const enterpriseRow = useMemo(() => {
    const totalYield = summaryData.items?.reduce((sum, item) => sum + (Number(item.totalYieldKg) || 0), 0) || 0;
    return {
      farmId: 'ALL',
      farmName: 'Toàn Bộ Chuỗi Trang Trại (Tổng Hợp Toàn Doanh Nghiệp)',
      operationalCycleName: 'Tất cả chu kỳ hợp nhất',
      materialExpense: summaryData.totalMaterialsExpense || 0,
      laborExpense: summaryData.totalLaborExpense || 0,
      overheadExpense: summaryData.totalOverheadExpense || 0,
      totalExpense: summaryData.grandTotalExpense || 0,
      avgUnitCost: summaryData.overallAvgUnitCost || 0,
      totalYieldKg: totalYield,
      isEnterprise: true,
    };
  }, [summaryData]);

  // Khởi tạo đối tượng xem chi tiết mặc định khi đổi trang trại hoặc nạp xong dữ liệu
  useEffect(() => {
    if (isAllFarms) {
      setActiveDetailTarget(enterpriseRow);
    } else if (summaryData.items?.length > 0) {
      setActiveDetailTarget(summaryData.items[0]);
    } else {
      setActiveDetailTarget(null);
    }
  }, [isAllFarms, summaryData.items, enterpriseRow]);

  // Tải chi tiết chứng từ của đối tượng được chọn (Master-Detail)
  const fetchDetailExpenses = async (target) => {
    if (!target) return;
    try {
      setIsLoadingDetails(true);
      const targetIsAll = target.isEnterprise || target.farmId === 'ALL';
      const params = { size: 50 };
      if (!targetIsAll && target.farmId) {
        params.farmId = target.farmId;
      } else if (selectedFarmId) {
        params.farmId = selectedFarmId;
      }
      if (target.operationalCycleId) {
        params.operationalCycleId = target.operationalCycleId;
      }

      const res = await financeService.getExpenses(params);
      const list = res?.content || (Array.isArray(res) ? res : []);
      setDetailExpenses(list);
    } catch (err) {
      console.error('Failed to fetch detail expenses:', err);
      setDetailExpenses([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (activeDetailTarget) {
      fetchDetailExpenses(activeDetailTarget);
    }
  }, [activeDetailTarget]);

  // Chọn hàng để xem chi tiết
  const handleRowClick = (item) => {
    setActiveDetailTarget(item);
  };

  // Chuẩn bị danh sách hàng hiển thị dựa trên activeFarmId, viewMode & tìm kiếm
  const displayItems = useMemo(() => {
    let rows = [];
    if (!isAllFarms) {
      // Khi chọn một trang trại cụ thể trên TopBar -> Chỉ hiển thị các chu kỳ của trang trại đó
      rows = summaryData.items || [];
    } else {
      // Khi chọn "Tất cả trang trại" trên TopBar -> Tùy theo viewMode
      if (viewMode === 'ENTERPRISE') {
        rows = [enterpriseRow];
      } else if (viewMode === 'PER_FARM') {
        rows = summaryData.items || [];
      } else {
        rows = [enterpriseRow, ...(summaryData.items || [])];
      }
    }

    if (!tableSearchTerm) return rows;
    const q = tableSearchTerm.toLowerCase();
    return rows.filter(
      (r) =>
        r.farmName?.toLowerCase().includes(q) ||
        r.operationalCycleName?.toLowerCase().includes(q)
    );
  }, [isAllFarms, viewMode, enterpriseRow, summaryData.items, tableSearchTerm]);

  // ==========================================================
  // Cột Dữ Liệu Bảng Thống Kê Chi Phí
  // ==========================================================
  const summaryColumns = [
    {
      key: 'farmName',
      header: 'Đơn Vị / Trang Trại',
      width: '260px',
      render: (row) => {
        const isSelected =
          (row.isEnterprise && activeDetailTarget?.isEnterprise) ||
          (!row.isEnterprise &&
            activeDetailTarget?.farmId === row.farmId &&
            activeDetailTarget?.operationalCycleId === row.operationalCycleId);

        if (row.isEnterprise) {
          return (
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl shadow-xs transition-colors ${
                isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <Globe2 className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs text-emerald-950 uppercase tracking-tight">
                    Toàn Chuỗi Doanh Nghiệp
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 text-amber-900 px-1.5 py-0.2 text-[9px] font-black border border-amber-300">
                    <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                    Hợp Nhất
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  Tổng hợp {summaryData.items?.length || 0} trang trại thành viên
                </span>
              </div>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg transition-colors ${
              isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Building className="h-4 w-4" />
            </div>
            <div>
              <span className={`font-bold block text-xs ${isSelected ? 'text-slate-950 font-black' : 'text-slate-900'}`}>
                {row.farmName}
              </span>
              <span className="text-[10px] text-slate-400">Trại #{row.farmId}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'operationalCycleName',
      header: 'Chu Kỳ Vận Hành',
      width: '180px',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] border ${
          row.isEnterprise 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' 
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          <Layers className="h-3 w-3 text-slate-500" />
          <span>{row.operationalCycleName || 'Toàn bộ chu kỳ'}</span>
        </span>
      ),
    },
    {
      key: 'materialExpense',
      header: 'Vật Tư Xuất Kho',
      align: 'right',
      width: '160px',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{formatCurrency(row.materialExpense)}</span>
          <span className="text-[10px] text-slate-400 block">
            {row.totalExpense > 0 ? `${((row.materialExpense / row.totalExpense) * 100).toFixed(1)}%` : '0%'}
          </span>
        </div>
      ),
    },
    {
      key: 'laborExpense',
      header: 'Chi Phí Nhân Công',
      align: 'right',
      width: '160px',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{formatCurrency(row.laborExpense)}</span>
          <span className="text-[10px] text-slate-400 block">
            {row.totalExpense > 0 ? `${((row.laborExpense / row.totalExpense) * 100).toFixed(1)}%` : '0%'}
          </span>
        </div>
      ),
    },
    {
      key: 'overheadExpense',
      header: 'Máy Móc, Điện & Chung',
      align: 'right',
      width: '170px',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{formatCurrency(row.overheadExpense)}</span>
          <span className="text-[10px] text-slate-400 block">
            {row.totalExpense > 0 ? `${((row.overheadExpense / row.totalExpense) * 100).toFixed(1)}%` : '0%'}
          </span>
        </div>
      ),
    },
    {
      key: 'totalExpense',
      header: 'Tổng Chi Phí (VNĐ)',
      align: 'right',
      width: '180px',
      render: (row) => (
        <div>
          <span className={`block ${
            row.isEnterprise 
              ? 'font-black text-emerald-900 text-sm' 
              : 'font-black text-slate-950 text-sm'
          }`}>
            {formatCurrency(row.totalExpense)}
          </span>
        </div>
      ),
    },
    {
      key: 'avgUnitCost',
      header: 'Giá Thành Thực Tế',
      align: 'right',
      width: '160px',
      render: (row) => (
        <div>
          <span className={`px-2 py-0.5 rounded text-xs border block text-right font-bold ${
            row.isEnterprise
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {formatCurrency(row.avgUnitCost)}/kg
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 text-right">
            SL: {(row.totalYieldKg || 0).toLocaleString()} kg
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      width: '130px',
      render: (row) => {
        const isSelected =
          (row.isEnterprise && activeDetailTarget?.isEnterprise) ||
          (!row.isEnterprise &&
            activeDetailTarget?.farmId === row.farmId &&
            activeDetailTarget?.operationalCycleId === row.operationalCycleId);

        return (
          <Button
            size="xs"
            variant={isSelected ? 'primary' : 'outline'}
            className={isSelected ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            icon={<Eye className="h-3 w-3" />}
            onClick={() => handleRowClick(row)}
          >
            {isSelected ? 'Đang Xem' : 'Xem Sổ Cái'}
          </Button>
        );
      },
    },
  ];

  // ==========================================================
  // Cột Dữ Liệu Sổ Cái Chứng Từ Chi Phí Vận Hành (farm_expenses)
  // ==========================================================
  const filteredDetailExpenses = detailExpenses.filter((e) => {
    if (!expenseSearchTerm) return true;
    const q = expenseSearchTerm.toLowerCase();
    return (
      e.expenseCode?.toLowerCase().includes(q) ||
      e.costCategoryName?.toLowerCase().includes(q) ||
      e.recipientName?.toLowerCase().includes(q) ||
      e.expenseSource?.toLowerCase().includes(q)
    );
  });

  const expenseColumns = [
    {
      key: 'expenseCode',
      header: 'Mã Chứng Từ',
      width: '140px',
      render: (row) => (
        <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
          {row.expenseCode}
        </span>
      ),
    },
    {
      key: 'farmName',
      header: 'Trang Trại',
      width: '160px',
      render: (row) => (
        <div className="flex items-center gap-1 font-semibold text-slate-800 text-xs">
          <Building className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{row.farmName || (row.farmId ? `Trại #${row.farmId}` : '---')}</span>
        </div>
      ),
    },
    {
      key: 'expenseDate',
      header: 'Ngày Ghi Nhận',
      width: '120px',
      render: (row) => formatDate(row.expenseDate),
    },
    {
      key: 'costCategoryName',
      header: 'Khoản Mục Chi Phí',
      width: '200px',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 block text-xs">{row.costCategoryName || 'Chi phí vận hành'}</span>
          <span className="font-mono text-[10px] text-slate-400 block">{row.costType || 'EXPENSE'}</span>
        </div>
      ),
    },
    {
      key: 'expenseSource',
      header: 'Nguồn Nghiệp Vụ',
      width: '160px',
      render: (row) => {
        const sourceMap = {
          INVENTORY_BACKFLUSH: { label: 'Xuất kho vật tư (E)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          PAYROLL_ALLOCATION: { label: 'Bảng lương nhân công (G)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
          UTILITY_BILL: { label: 'Điện nước & Tiện ích', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          MANUAL: { label: 'Chi phí ngoài / Hóa đơn', color: 'bg-slate-100 text-slate-700 border-slate-200' },
        };
        const cfg = sourceMap[row.expenseSource] || { label: row.expenseSource, color: 'bg-slate-100 text-slate-700 border-slate-200' };
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'Số Tiền (VNĐ)',
      align: 'right',
      width: '140px',
      render: (row) => (
        <span className="font-bold text-slate-900 text-xs">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Hình Thức',
      width: '110px',
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
        </span>
      ),
    },
    {
      key: 'receiptPhotoUrl',
      header: 'Hóa Đơn / Biên Lai',
      align: 'center',
      width: '140px',
      render: (row) =>
        row.receiptPhotoUrl ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedExpenseForProof(row);
              setIsProofModalOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-all shadow-2xs"
          >
            <Camera className="h-3 w-3 text-amber-600" />
            <span>Xem Hóa Đơn</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-400">Chưa đính kèm</span>
        ),
    },
    {
      key: 'unitCostEligible',
      header: 'Tính Giá Thành',
      align: 'center',
      width: '130px',
      render: (row) =>
        row.unitCostEligible ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Hợp Lệ KCS</span>
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            Chi Phí Quản Lý
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. 4 THẺ KPI TỔNG QUAN THEO TRANG TRẠI ĐƯỢC CHỌN        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Chi Phí Vận Hành */}
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/50 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAllFarms ? 'Tổng Chi Phí Toàn Chuỗi' : 'Tổng Chi Phí Trại'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(summaryData.grandTotalExpense)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium truncate">
            {isAllFarms
              ? `Lũy kế ${summaryData.items?.length || 0} trang trại thành viên`
              : currentFarmName}
          </p>
        </div>

        {/* Card 2: Chi Phí Vật Tư Tiêu Hao */}
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/40 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Vật Tư Xuất Kho
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-blue-950 tracking-tight">
              {formatCurrency(summaryData.totalMaterialsExpense)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-blue-700/80">
            Kết chuyển tự động từ kho (Auto-Backflush)
          </p>
        </div>

        {/* Card 3: Chi Phí Nhân Công Trực Tiếp */}
        <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/40 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
              Chi Phí Nhân Công
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-purple-950 tracking-tight">
              {formatCurrency(summaryData.totalLaborExpense)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-purple-700/80">
            Chấm công & phân bổ giờ làm việc thực tế
          </p>
        </div>

        {/* Card 4: Giá Thành Đơn Vị Bình Quân */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Giá Thành TB / Kg
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-emerald-950 tracking-tight">
              {formatCurrency(summaryData.overallAvgUnitCost)}/kg
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700/80">
            Chuẩn Agri-ERP: Chi phí hợp lệ / Sản lượng
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BẢNG THỐNG KÊ CHI PHÍ & THANH ĐIỀU HƯỚNG             */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {isAllFarms ? (
              <>
                <span className="text-xs font-bold text-slate-500 mr-1">Chế Độ Xem:</span>
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'ALL'
                        ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📊 Xem Đầy Đủ (Toàn Chuỗi & Từng Trại)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('ENTERPRISE');
                      setActiveDetailTarget(enterpriseRow);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'ENTERPRISE'
                        ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏢 Toàn Bộ Trang Trại (Hợp Nhất)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('PER_FARM');
                      if (summaryData.items?.length > 0) {
                        setActiveDetailTarget(summaryData.items[0]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'PER_FARM'
                        ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌾 Từng Trang Trại Thành Viên ({summaryData.items?.length || 0})
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900 border border-emerald-300">
                  <Building className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Dữ liệu thống kê: {currentFarmName}</span>
                </span>
                <span className="text-xs text-slate-500">
                  (Đổi trang trại trên TopBar để xem trang trại khác hoặc xem toàn chuỗi)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm trang trại, chu kỳ..."
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={fetchSummary}
            >
              Làm Mới
            </Button>
          </div>
        </div>

        {/* Bảng Thống Kê */}
        <DataTable
          columns={summaryColumns}
          data={displayItems}
          isLoading={isLoadingSummary}
          onRowClick={handleRowClick}
          emptyStateProps={{
            title: isAllFarms ? 'Chưa có dữ liệu chi phí vận hành' : `${currentFarmName} chưa có dữ liệu chi phí`,
            description: 'Các trang trại chưa phát sinh chứng từ chi phí hoặc phiếu xuất kho tiêu hao.',
          }}
        />
      </div>

      {/* ======================================================== */}
      {/* 3. MASTER-DETAIL: SỔ CÁI CHỨNG TỪ CHI PHÍ CỦA MỤC CHỌN  */}
      {/* ======================================================== */}
      {activeDetailTarget && (
        <div className="space-y-3 pt-4 border-t border-slate-200 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs ${
                activeDetailTarget.isEnterprise ? 'bg-emerald-600' : 'bg-slate-900'
              }`}>
                {activeDetailTarget.isEnterprise ? <Globe2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>
                    Sổ Cái Chứng Từ Chi Phí:{' '}
                    {activeDetailTarget.isEnterprise
                      ? 'TOÀN BỘ CHUỖI TRANG TRẠI (TẤT CẢ DOANH NGHIỆP)'
                      : activeDetailTarget.farmName}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    activeDetailTarget.isEnterprise
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {activeDetailTarget.operationalCycleName}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tổng chi phí:{' '}
                  <strong className="text-slate-900">{formatCurrency(activeDetailTarget.totalExpense)}</strong> •
                  Hiển thị danh sách hóa đơn và chứng từ chi phí kế toán đã xác nhận
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Input
                prefixIcon={<Search className="h-4 w-4 text-slate-400" />}
                placeholder="Tìm mã chứng từ, khoản mục..."
                value={expenseSearchTerm}
                onChange={(e) => setExpenseSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={expenseColumns}
            data={filteredDetailExpenses}
            isLoading={isLoadingDetails}
            emptyStateProps={{
              title: `${
                activeDetailTarget.isEnterprise ? 'Toàn bộ chuỗi trang trại' : activeDetailTarget.farmName
              } chưa có chứng từ chi phí nào`,
              description: 'Kế toán chưa ghi nhận hóa đơn hoặc phiếu xuất kho trong kỳ này.',
            }}
          />
        </div>
      )}

      {/* Lightbox xem ảnh hóa đơn chứng từ */}
      <ReceiptPhotoModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        expense={selectedExpenseForProof}
      />
    </div>
  );
}

export default MultiFarmExpenseSummary;
