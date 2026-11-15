import React, { useState, useEffect } from 'react';
import {
  Building, Search, Filter, RotateCcw, AlertCircle,
  ArrowUpRight, ArrowDownLeft, Clock, DollarSign, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { financeService } from '@/services/modules/financeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { Can } from '@/components/common/Can';
import { toast } from '@/store/useToastStore';

export function DebtMonitorTab({ farmId, onOpenAllocateModal, onOpenPaymentModal }) {
  const { syncTrigger } = useActiveFarmStore();
  const [debts, setDebts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtTypeFilter, setDebtTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadDebts = async () => {
    setIsLoading(true);
    try {
      const params = { size: 100 };
      if (farmId && farmId !== 'ALL') {
        params.farmId = farmId;
      }
      if (debtTypeFilter) {
        params.debtType = debtTypeFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      const data = await financeService.getDebts(params);
      const items = data?.content || (Array.isArray(data) ? data : []);
      setDebts(items);
    } catch (err) {
      console.error('Failed to load debts:', err);
      setDebts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, [farmId, debtTypeFilter, statusFilter, syncTrigger?.finance, syncTrigger?.partners, syncTrigger?.all]);

  const filteredDebts = debts.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.partnerName?.toLowerCase().includes(term) ||
      d.partnerCode?.toLowerCase().includes(term) ||
      d.orderCode?.toLowerCase().includes(term) ||
      d.receiptCode?.toLowerCase().includes(term) ||
      d.livestockGroupCode?.toLowerCase().includes(term) ||
      d.itemSummary?.toLowerCase().includes(term) ||
      d.notes?.toLowerCase().includes(term) ||
      d.farmName?.toLowerCase().includes(term)
    );
  });

  // Calculate totals
  const totalReceivable = debts
    .filter((d) => d.debtType === 'RECEIVABLE')
    .reduce((sum, d) => sum + (Number(d.remainingDebt) || 0), 0);

  const totalPayable = debts
    .filter((d) => d.debtType === 'PAYABLE')
    .reduce((sum, d) => sum + (Number(d.remainingDebt) || 0), 0);

  const overdueCount = debts.filter((d) => (d.daysOverdue && d.daysOverdue > 0) || d.status === 'OVERDUE').length;

  const columns = [
    {
      key: 'debtType',
      header: 'Loại Nợ',
      width: '130px',
      render: (row) => {
        const isReceivable = row.debtType === 'RECEIVABLE';
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${isReceivable
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
            {isReceivable ? <ArrowDownLeft className="h-3 w-3 text-blue-600" /> : <ArrowUpRight className="h-3 w-3 text-orange-600" />}
            <span>{isReceivable ? 'Phải thu KH' : 'Phải trả NCC'}</span>
          </span>
        );
      },
    },
    {
      key: 'farmName',
      header: 'Trang Trại',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Building className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{row.farmName || (row.farmId ? `Trại #${row.farmId}` : '---')}</span>
        </div>
      ),
    },
    {
      key: 'partnerName',
      header: 'Đối Tác',
      width: '200px',
      render: (row) => (
        <div className="min-w-[160px]">
          <div className="font-bold text-slate-800">{row.partnerName}</div>
          <div className="text-[10px] text-slate-500 font-mono">{row.partnerCode}</div>
        </div>
      ),
    },
    {
      key: 'itemSummary',
      header: 'Nội Dung Nhập & Số Lượng',
      width: '260px',
      render: (row) => {
        const summary = row.itemSummary || row.notes || (row.orderCode ? `Đơn hàng ${row.orderCode}` : (row.receiptCode ? `Phiếu nhập ${row.receiptCode}` : 'Hàng hóa / Dịch vụ'));
        const subCode = row.livestockGroupCode || row.receiptCode || row.orderCode;
        return (
          <div className="min-w-[220px]">
            <div className="font-bold text-xs text-slate-800 leading-normal">
              {summary}
            </div>
            {subCode && (
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Mã: {subCode}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'totalDebt',
      header: 'Tổng nợ gốc',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-slate-700">{formatCurrency(row.totalDebt)}</span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Đã thanh toán',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-emerald-700">{formatCurrency(row.paidAmount)}</span>
      ),
    },
    {
      key: 'remainingDebt',
      header: 'Dư nợ còn lại',
      align: 'right',
      render: (row) => {
        const remaining = Number(row.remainingDebt) || 0;
        const isRec = row.debtType === 'RECEIVABLE';
        return (
          <span className={`font-black text-sm ${isRec ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatCurrency(remaining)}
          </span>
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Hạn thanh toán',
      render: (row) => {
        const isOverdue = (row.daysOverdue && row.daysOverdue > 0) || row.status === 'OVERDUE';
        const daysRemaining = row.dueDate ? Math.ceil((new Date(row.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const isNearDue = !isOverdue && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7;
        return (
          <div>
            <div className={`text-xs ${isOverdue ? 'font-bold text-rose-600' : (isNearDue ? 'font-bold text-amber-700' : 'text-slate-600')}`}>
              {formatDate(row.dueDate)}
            </div>
            {isOverdue ? (
              <span className="inline-block text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                Quá hạn {row.daysOverdue || Math.abs(daysRemaining)} ngày
              </span>
            ) : isNearDue ? (
              <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                Còn {daysRemaining} ngày
              </span>
            ) : (
              <span className="inline-block text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Trong hạn
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <Can permission="PERM_PAYMENT_ALLOCATE" role="ROLE_ACCOUNTANT">
            <Button
              size="xs"
              variant="outline"
              onClick={() => onOpenAllocateModal ? onOpenAllocateModal(row) : toast.info(`Mở bảng phân bổ / cấn trừ nợ cho ${row.partnerName}`)}
            >
              Phân Bổ Nợ
            </Button>
          </Can>
          <Can permission="PERM_FINANCE_PAYMENT" role="ROLE_ACCOUNTANT">
            <Button
              size="xs"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={() => onOpenPaymentModal ? onOpenPaymentModal(row) : toast.info(`Lập phiếu thu / chi cho ${row.partnerName}`)}
            >
              Thu / Trả Nợ
            </Button>
          </Can>
          <Can role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 select-none">
              Theo dõi
            </span>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <span>Tổng Phải Thu Khách Hàng</span>
            <ArrowDownLeft className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-black text-blue-800 font-mono">
            {formatCurrency(totalReceivable)}
          </div>
          <p className="mt-1 text-[11px] text-blue-700 font-medium">Tiền hàng khách mua sỉ còn nợ trại</p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-orange-900">
            <span>Tổng Phải Trả Nhà Cung Cấp</span>
            <ArrowUpRight className="h-4 w-4 text-orange-600" />
          </div>
          <div className="mt-2 text-xl font-black text-orange-800 font-mono">
            {formatCurrency(totalPayable)}
          </div>
          <p className="mt-1 text-[11px] text-orange-700 font-medium">Nợ tiền thức ăn, giống, phân bón, thuốc</p>
        </div>

        <div className={`rounded-2xl border p-4 shadow-xs ${
          (totalReceivable - totalPayable) >= 0
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40'
            : 'border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50/40'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Vị Thế Dòng Tiền Ròng (Thu - Trả)</span>
            <DollarSign className={`h-4 w-4 ${(totalReceivable - totalPayable) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className={`mt-2 text-xl font-black font-mono ${
            (totalReceivable - totalPayable) >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {formatCurrency(totalReceivable - totalPayable)}
          </div>
          <p className="mt-1 text-[11px] text-slate-600 font-medium">
            {(totalReceivable - totalPayable) >= 0 ? 'Dương tiền: Dòng tiền an toàn' : 'Âm tiền: Cần ưu tiên thu hồi nợ'}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-rose-900">
            <span>Khoản Nợ Quá Hạn Cần Đôn Đốc</span>
            <Clock className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-xl font-black text-rose-700">
            {overdueCount} <span className="text-xs font-medium text-slate-500">khoản nợ</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600 font-medium">Cần kiểm tra hạn mức và thu hồi sớm</p>
        </div>
      </div>

      {/* Segmented Quick Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit flex-wrap border border-slate-200">
        <button
          type="button"
          onClick={() => { setDebtTypeFilter(''); setStatusFilter(''); }}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
            !debtTypeFilter && !statusFilter
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tất Cả ({debts.length})
        </button>
        <button
          type="button"
          onClick={() => { setDebtTypeFilter('PAYABLE'); setStatusFilter(''); }}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
            debtTypeFilter === 'PAYABLE' && !statusFilter
              ? 'bg-white text-orange-800 shadow-2xs'
              : 'text-slate-600 hover:text-orange-800'
          }`}
        >
          <ArrowUpRight className="h-3.5 w-3.5 text-orange-600" />
          <span>Phải Trả NCC ({debts.filter(d => d.debtType === 'PAYABLE').length})</span>
        </button>
        <button
          type="button"
          onClick={() => { setDebtTypeFilter('RECEIVABLE'); setStatusFilter(''); }}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
            debtTypeFilter === 'RECEIVABLE' && !statusFilter
              ? 'bg-white text-blue-800 shadow-2xs'
              : 'text-slate-600 hover:text-blue-800'
          }`}
        >
          <ArrowDownLeft className="h-3.5 w-3.5 text-blue-600" />
          <span>Phải Thu Khách Hàng ({debts.filter(d => d.debtType === 'RECEIVABLE').length})</span>
        </button>
        <button
          type="button"
          onClick={() => { setDebtTypeFilter(''); setStatusFilter('OVERDUE'); }}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
            statusFilter === 'OVERDUE'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Quá Hạn Cần Đôn Đốc ({overdueCount})</span>
        </button>
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo đối tác, mã chứng từ, trang trại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1" />
            <select
              value={debtTypeFilter}
              onChange={(e) => setDebtTypeFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="">Tất cả loại nợ</option>
              <option value="RECEIVABLE">Phải thu (Khách hàng)</option>
              <option value="PAYABLE">Phải trả (Nhà cung cấp)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="">Tất cả trạng thái nợ</option>
              <option value="ACTIVE">Đang trong hạn / Chưa tất toán (ACTIVE)</option>
              <option value="OVERDUE">Quá hạn (OVERDUE)</option>
              <option value="SETTLED">Đã tất toán (SETTLED)</option>
              <option value="BAD_DEBT">Nợ xấu (BAD_DEBT)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={loadDebts}
          >
            Làm Mới
          </Button>
        </div>
      </div>

      {/* Debt Table */}
      <DataTable
        columns={columns}
        data={filteredDebts}
        pageSize={25}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có khoản công nợ nào',
          description: 'Sổ cái công nợ 2 chiều của các trang trại sẽ tự động đồng bộ khi phát sinh giao dịch mua sỉ hoặc nhập kho.',
        }}
      />
    </div>
  );
}

export default DebtMonitorTab;
