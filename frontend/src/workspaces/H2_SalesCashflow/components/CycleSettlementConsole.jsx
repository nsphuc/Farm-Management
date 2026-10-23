import React, { useState, useEffect } from 'react';
import { 
  Building, CheckCircle2, Eye, TrendingUp, TrendingDown, 
  RotateCcw, DollarSign, Clock, ShieldCheck, QrCode, Search, Filter 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { financeService } from '@/services/modules/financeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { SettlementDetailDrawer } from './SettlementDetailDrawer';

export function CycleSettlementConsole({ farmId }) {
  const { syncTrigger, notifyDataChanged } = useActiveFarmStore();
  const { isOwner, isFarmManager } = useAuthStore();
  const owner = isOwner();
  const manager = isFarmManager();

  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const loadSettlements = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (farmId && farmId !== 'ALL') {
        params.farmId = farmId;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      const data = await financeService.getCycleSettlements(params);
      setSettlements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load cycle settlements:', err);
      setSettlements([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, [farmId, statusFilter, syncTrigger?.finance]);

  const handleOpenDetail = async (row) => {
    try {
      const detail = await financeService.getCycleSettlementSummary(row.farmId, row.cycleId);
      setSelectedSettlement(detail);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error('Failed to get settlement detail:', err);
      // Fallback to row data if API error
      setSelectedSettlement(row);
      setIsDrawerOpen(true);
    }
  };

  const handleConfirmSettlement = async (settlement, notes) => {
    if (!settlement) return;
    const confirmMsg = `Bạn có chắc chắn muốn xác nhận đã nhận lợi nhuận (${formatCurrency(settlement.netProfit)}) và KHÓA SỔ chu kỳ "${settlement.cycleName}" của "${settlement.farmName}"?`;
    if (!window.confirm(confirmMsg)) return;

    setIsConfirming(true);
    try {
      await financeService.confirmSettlement(settlement.farmId, settlement.cycleId, { notes });
      notifyDataChanged('finance');
      setIsDrawerOpen(false);
      setSelectedSettlement(null);
      await loadSettlements();
      alert('Đã xác nhận kết toán và khóa sổ chu kỳ thành công!');
    } catch (err) {
      console.error('Failed to confirm settlement:', err);
      alert('Có lỗi xảy ra khi xác nhận kết toán: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleApproveSettlement = async (settlement, notes) => {
    if (!settlement) return;
    const confirmMsg = `Bạn có chắc chắn muốn KÝ DUYỆT bảng kết toán chu kỳ "${settlement.cycleName}" (Lợi nhuận ròng: ${formatCurrency(settlement.netProfit)}) để cấp phép cho Kế toán trại chuyển tiền về Chủ đầu tư?`;
    if (!window.confirm(confirmMsg)) return;

    setIsApproving(true);
    try {
      await financeService.approveSettlement(settlement.farmId, settlement.cycleId, { notes });
      notifyDataChanged('finance');
      setIsDrawerOpen(false);
      setSelectedSettlement(null);
      await loadSettlements();
      alert('Đã ký duyệt bảng kết toán chu kỳ thành công! Kế toán trại đã sẵn sàng quét mã VietQR chuyển lợi nhuận về Owner.');
    } catch (err) {
      console.error('Failed to approve settlement:', err);
      alert('Có lỗi xảy ra khi ký duyệt kết toán: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsApproving(false);
    }
  };

  // Filtered rows by search
  const filteredData = settlements.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.farmName?.toLowerCase().includes(term) ||
      item.cycleName?.toLowerCase().includes(term) ||
      item.cycleCode?.toLowerCase().includes(term)
    );
  });

  // KPI calculations
  const totalSettlements = settlements.length;
  const totalRevenueAll = settlements.reduce((sum, item) => sum + (Number(item.totalRevenue) || 0), 0);
  const totalExpenseAll = settlements.reduce((sum, item) => sum + (Number(item.totalExpense) || 0), 0);
  const totalNetProfitAll = settlements.reduce((sum, item) => sum + (Number(item.netProfit) || 0), 0);
  const pendingCount = settlements.filter(i => i.status === 'PENDING_SETTLEMENT').length;
  const closedCount = settlements.filter(i => i.status === 'CLOSED').length;

  const columns = [
    {
      key: 'farmName',
      header: 'Trang Trại',
      width: '180px',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Building className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{row.farmName}</span>
        </div>
      ),
    },
    {
      key: 'cycleName',
      header: 'Tên Chu Kỳ / Đợt',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.cycleName}</div>
          <div className="text-[11px] font-mono text-slate-500">{row.cycleCode}</div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Thời Gian Chu Kỳ',
      render: (row) => (
        <span className="text-slate-600 text-xs">
          {formatDate(row.startDate)} - {formatDate(row.endDate)}
        </span>
      ),
    },
    {
      key: 'totalRevenue',
      header: 'Tổng Thu Tại Trại',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-emerald-700">
          {formatCurrency(row.totalRevenue)}
        </span>
      ),
    },
    {
      key: 'totalExpense',
      header: 'Tổng Chi Tại Trại',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-amber-700">
          {formatCurrency(row.totalExpense)}
        </span>
      ),
    },
    {
      key: 'netProfit',
      header: 'Lợi Nhuận Ròng Chuyển Về Owner',
      align: 'right',
      render: (row) => {
        const val = Number(row.netProfit) || 0;
        const isPos = val >= 0;
        return (
          <div className="text-right">
            <span className={`font-black text-sm ${isPos ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatCurrency(val)}
            </span>
            {isPos && (
              <span className="block text-[10px] text-emerald-600 font-semibold">
                (Thu - Chi)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      align: 'center',
      render: (row) => {
        let badgeVariant = 'outline';
        let label = row.status;
        if (row.status === 'ACTIVE') {
          label = 'Đang Chạy';
          badgeVariant = 'info';
        } else if (row.status === 'PENDING_SETTLEMENT') {
          label = 'Chờ Owner Xác Nhận';
          badgeVariant = 'warning';
        } else if (row.status === 'CLOSED') {
          label = 'Đã Tất Toán';
          badgeVariant = 'success';
        }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
            row.status === 'CLOSED'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : row.status === 'PENDING_SETTLEMENT'
              ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: manager ? 'Thao Tác Giám Đốc Trại' : 'Thao Tác Owner',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            icon={<Eye className="h-3.5 w-3.5 text-slate-600" />}
            onClick={() => handleOpenDetail(row)}
            title="Xem chi tiết bảng kê thu chi và chứng từ kết toán"
          >
            Chi Tiết
          </Button>

          {manager && row.status !== 'CLOSED' && (
            <Button
              size="sm"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={() => handleOpenDetail(row)}
              title="Ký duyệt bảng kết toán chu kỳ nội bộ trại"
            >
              Ký Duyệt
            </Button>
          )}

          {owner && row.status !== 'CLOSED' && (
            <Button
              size="sm"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={() => handleConfirmSettlement(row, 'Chốt sổ trực tiếp từ danh sách')}
            >
              Chốt Sổ
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Owner KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tổng Chu Kỳ Vận Hành</span>
            <Building className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalSettlements}</div>
          <p className="mt-1 text-[11px] text-slate-400">Trên các trang trại trực thuộc</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>Tổng Lợi Nhuận Ròng Chuyển Về</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {formatCurrency(totalNetProfitAll)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            Thu: {formatCurrency(totalRevenueAll)} • Chi: {formatCurrency(totalExpenseAll)}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800">
            <span>Chờ Owner Chốt Sổ</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{pendingCount}</div>
          <p className="mt-1 text-[11px] text-amber-600">Kế toán trại đã gửi kết toán</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Đã Tất Toán Hoàn Tất</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-800">{closedCount}</div>
          <p className="mt-1 text-[11px] text-slate-400">Đã khóa sổ kế toán chu kỳ</p>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo trang trại, mã hoặc tên chu kỳ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang chạy</option>
              <option value="PENDING_SETTLEMENT">Chờ Owner xác nhận</option>
              <option value="CLOSED">Đã tất toán (Khóa sổ)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={loadSettlements}
          >
            Làm Mới
          </Button>
        </div>
      </div>

      {/* Table of Cycle Settlements */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có chu kỳ vận hành nào',
          description: 'Hệ thống tự động tổng hợp kết toán lợi nhuận khi các trang trại có dữ liệu doanh thu và chi phí chu kỳ.',
        }}
      />

      {/* Detail Drawer */}
      <SettlementDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedSettlement(null);
        }}
        settlement={selectedSettlement}
        onConfirmSettlement={handleConfirmSettlement}
        onApproveSettlement={handleApproveSettlement}
        isConfirming={isConfirming}
        isApproving={isApproving}
      />
    </div>
  );
}

export { CycleSettlementConsole as FarmManagerCycleSettlementTab };
export default CycleSettlementConsole;
