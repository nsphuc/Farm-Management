import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Plus,
  RefreshCw,
  Building,
  Calendar,
  Layers,
  Eye,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { financeService } from '@/services/modules/financeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { BudgetApprovalModal } from './BudgetApprovalModal';

export function BudgetManagementTab() {
  const { activeFarmId, activeFarm, farms, syncTrigger, notifyDataChanged } = useActiveFarmStore();

  const isAllFarms = !activeFarmId || activeFarmId === 'ALL';
  const queryFarmId = isAllFarms ? undefined : Number(activeFarmId);
  const currentFarmName = isAllFarms ? 'Toàn Bộ Chuỗi Trang Trại' : (activeFarm?.name || `Trại #${activeFarmId}`);

  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal cấp / duyệt ngân sách
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // Drawer xem chi tiết các dòng định mức chi phí (budget_line_items #70)
  const [selectedBudgetForDetail, setSelectedBudgetForDetail] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const fetchBudgets = async () => {
    try {
      setIsLoading(true);
      const res = await financeService.getBudgets({
        farmId: queryFarmId,
        filterFarmId: queryFarmId,
        size: 50,
      });
      const list = res?.content || (Array.isArray(res) ? res : []);
      setBudgets(list);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
      setBudgets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [activeFarmId, syncTrigger?.finance]);

  // Phê duyệt nhanh ngân sách (chuyển sang ACTIVE)
  const handleApproveBudget = async (budget) => {
    try {
      setIsLoading(true);
      await financeService.updateBudgetStatus(budget.id, 'ACTIVE', budget.farmId);
      await fetchBudgets();
      notifyDataChanged?.('finance');
    } catch (err) {
      console.error('Failed to approve budget:', err);
      alert('Không thể phê duyệt ngân sách: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Tính toán 3 thẻ KPI
  const totalAllocated = budgets.reduce((sum, b) => sum + (Number(b.totalBudgetAmount) || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (Number(b.totalSpentAmount) || 0), 0);
  const overallUsagePct = totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0;

  // ==========================================================
  // Cột Dữ Liệu Bảng Quản Trị Ngân Sách
  // ==========================================================
  const columns = [
    {
      key: 'name',
      header: 'Tên Kế Hoạch / Quyết Định',
      width: '260px',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.name}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Năm tài chính: <strong>{row.fiscalYear}</strong>
          </span>
        </div>
      ),
    },
    {
      key: 'farmName',
      header: 'Trang Trại',
      width: '180px',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
          <Building className="h-3 w-3 text-emerald-600" />
          <span>{row.farmName || `Trại #${row.farmId}`}</span>
        </span>
      ),
    },
    {
      key: 'totalBudgetAmount',
      header: 'Hạn Mức Ngân Sách',
      align: 'right',
      width: '170px',
      render: (row) => (
        <span className="font-bold text-slate-900 text-xs">
          {formatCurrency(row.totalBudgetAmount)}
        </span>
      ),
    },
    {
      key: 'totalSpentAmount',
      header: 'Thực Chi Lũy Kế',
      align: 'right',
      width: '170px',
      render: (row) => (
        <span className="font-bold text-slate-800 text-xs">
          {formatCurrency(row.totalSpentAmount)}
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Tiến Độ Tiêu Dùng Ngân Sách',
      width: '260px',
      render: (row) => {
        const allocated = Number(row.totalBudgetAmount) || 0;
        const spent = Number(row.totalSpentAmount) || 0;
        const pct = allocated > 0 ? (spent / allocated) * 100 : 0;

        // Phân cấp màu cảnh báo: >= 85% vàng, > 100% đỏ
        let barColor = 'bg-emerald-500';
        let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        let statusText = 'An toàn';

        if (pct > 100) {
          barColor = 'bg-rose-600';
          badgeColor = 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse';
          statusText = 'VƯỢT HẠN MỨC';
        } else if (pct >= 85) {
          barColor = 'bg-amber-500';
          badgeColor = 'text-amber-800 bg-amber-50 border-amber-300';
          statusText = 'Chạm ngưỡng 85%';
        }

        return (
          <div className="space-y-1.5 py-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className={`px-2 py-0.5 rounded font-bold border text-[10px] ${badgeColor}`}>
                {pct.toFixed(1)}% • {statusText}
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                {formatCurrency(allocated - spent)} còn lại
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      align: 'center',
      width: '130px',
      render: (row) => {
        if (row.status === 'ACTIVE') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-200">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Đang Hiệu Lực</span>
            </span>
          );
        }
        if (row.status === 'PENDING') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-bold border border-amber-300">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              <span>Chờ Phê Duyệt</span>
            </span>
          );
        }
        return (
          <span className="rounded-full bg-slate-100 text-slate-500 px-2.5 py-0.5 text-[11px] font-medium">
            {row.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      width: '180px',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            size="xs"
            variant="outline"
            icon={<Eye className="h-3 w-3" />}
            onClick={() => {
              setSelectedBudgetForDetail(row);
              setIsDetailDrawerOpen(true);
            }}
          >
            Định Mức
          </Button>

          {row.status !== 'ACTIVE' && (
            <Button
              size="xs"
              variant="primary"
              icon={<CheckCircle2 className="h-3 w-3" />}
              onClick={() => handleApproveBudget(row)}
            >
              Phê Duyệt
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. THANH CÔNG CỤ VÀ NÚT CẤP NGÂN SÁCH DÀNH CHO OWNER     */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Quản Trị & Phê Duyệt Hạn Mức Ngân Sách Đầu Kỳ Cho Trang Trại</span>
            <span className="rounded-full bg-blue-100 text-blue-900 px-2.5 py-0.5 text-[10px] font-bold border border-blue-200">
              Đặc Quyền Owner
            </span>
            {!isAllFarms && (
              <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-300">
                {currentFarmName}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phê duyệt trần chi tiêu cho 5 nhóm chi phí. Kế toán trại không được phép chi tiêu vượt hạn mức này.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={fetchBudgets}
            isLoading={isLoading}
          >
            Làm Mới
          </Button>

          {/* NÚT CẤP / DUYỆT NGÂN SÁCH CHU KỲ CHO TRANG TRẠI */}
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsApprovalModalOpen(true)}
          >
            + Cấp / Duyệt Ngân Sách Chu Kỳ
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. HỆ THỐNG 3 THẺ KPI GIẢI NGÂN NGÂN SÁCH TOÀN CHUỖI    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Tổng Ngân Sách Đã Cấp */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Ngân Sách Đã Cấp
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalAllocated)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Hạn mức tối đa kế toán các trại được phép giải ngân
          </p>
        </div>

        {/* Card 2: Thực Chi Lũy Kế */}
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/40 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Thực Chi Lũy Kế
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-blue-950 tracking-tight">
              {formatCurrency(totalSpent)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-blue-700/80">
            Cộng dồn các chứng từ chi phí đã xác nhận
          </p>
        </div>

        {/* Card 3: Tỷ Lệ Giải Ngân Toàn Chuỗi */}
        <div className={`rounded-2xl border p-4 shadow-xs transition-all ${
          Number(overallUsagePct) >= 85
            ? 'border-amber-300 bg-amber-50/50'
            : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tỷ Lệ Tiêu Dùng Ngân Sách
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {overallUsagePct}%
            </span>
            <span className="text-xs text-slate-500 font-medium">toàn chuỗi</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {Number(overallUsagePct) >= 85 ? 'Cần siết chi phí các trại chạm ngưỡng' : 'Tiến độ giải ngân trong tầm kiểm soát'}
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. BẢNG DANH SÁCH DỰ TOÁN NGÂN SÁCH CÁC TRANG TRẠI      */}
      {/* ======================================================== */}
      <DataTable
        columns={columns}
        data={budgets}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có kế hoạch ngân sách nào',
          description: 'Chủ đầu tư bấm nút "+ Cấp / Duyệt Ngân Sách Chu Kỳ" ở trên để phân bổ ngân sách đầu kỳ cho các trang trại.',
        }}
      />

      {/* Modal Cấp / Phê Duyệt Ngân Sách */}
      <BudgetApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onSuccess={() => {
          fetchBudgets();
          notifyDataChanged?.('finance');
        }}
        initialFarmId={activeFarmId !== 'ALL' ? activeFarmId : undefined}
        farms={farms}
      />

      {/* Slide-over Drawer xem chi tiết các dòng định mức (budget_line_items #70) */}
      <SlideOverDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedBudgetForDetail ? selectedBudgetForDetail.name : 'Chi Tiết Định Mức Ngân Sách'}
        subtitle={selectedBudgetForDetail ? `Trang trại: ${selectedBudgetForDetail.farmName} • Tổng ngân sách: ${formatCurrency(selectedBudgetForDetail.totalBudgetAmount)}` : ''}
        icon={<Layers className="h-5 w-5 text-emerald-600" />}
        width="max-w-3xl"
      >
        {selectedBudgetForDetail && (
          <div className="p-6 space-y-6">
            {/* Banner tóm tắt */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-400 block">Năm Tài Chính</span>
                <span className="text-sm font-bold text-slate-900">{selectedBudgetForDetail.fiscalYear}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Đã Giải Ngân</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(selectedBudgetForDetail.totalSpentAmount)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Trạng Thái</span>
                <span className="text-sm font-bold text-emerald-700">{selectedBudgetForDetail.status}</span>
              </div>
            </div>

            {/* Bảng 5 dòng chi tiết định mức */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Chi Tiết Phân Bổ Hạn Mức Từng Khoản Mục (budget_line_items)
              </h4>

              <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
                {(selectedBudgetForDetail.lineItems || []).map((item) => {
                  const pct = item.usagePercentage || 0;
                  let barColor = 'bg-emerald-500';
                  let textColor = 'text-emerald-700';

                  if (pct > 100) {
                    barColor = 'bg-rose-600';
                    textColor = 'text-rose-700 font-bold';
                  } else if (pct >= 85) {
                    barColor = 'bg-amber-500';
                    textColor = 'text-amber-800 font-bold';
                  }

                  return (
                    <div key={item.id} className="p-4 hover:bg-slate-50/50 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {item.costCategoryName || item.costType}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Loại chi phí: <strong>{item.costType}</strong> • {item.notes || 'Không có ghi chú'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 block">
                            {formatCurrency(item.spentAmount)} / {formatCurrency(item.allocatedAmount)}
                          </span>
                          <span className={`text-[11px] ${textColor}`}>
                            Đã chi: {pct.toFixed(1)}% {pct >= 85 && '(Cảnh báo)'}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${barColor}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
