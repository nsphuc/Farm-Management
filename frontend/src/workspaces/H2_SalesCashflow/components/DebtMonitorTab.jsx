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

export function DebtMonitorTab({ farmId }) {
  const { syncTrigger } = useActiveFarmStore();
  const [debts, setDebts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtTypeFilter, setDebtTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadDebts = async () => {
    setIsLoading(true);
    try {
      const params = {};
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
  }, [farmId, debtTypeFilter, statusFilter, syncTrigger?.finance]);

  const filteredDebts = debts.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.partnerName?.toLowerCase().includes(term) ||
      d.partnerCode?.toLowerCase().includes(term) ||
      d.orderCode?.toLowerCase().includes(term) ||
      d.receiptCode?.toLowerCase().includes(term) ||
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
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
            isReceivable
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
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.partnerName}</div>
          <div className="text-[10px] text-slate-500 font-mono">{row.partnerCode}</div>
        </div>
      ),
    },
    {
      key: 'referenceCode',
      header: 'Chứng từ gốc',
      render: (row) => {
        const code = row.orderCode || row.receiptCode || '---';
        return <span className="font-mono text-xs text-slate-600 font-medium">{code}</span>;
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
        return (
          <div>
            <div className={`text-xs ${isOverdue ? 'font-bold text-rose-600' : 'text-slate-600'}`}>
              {formatDate(row.dueDate)}
            </div>
            {isOverdue && (
              <span className="inline-block text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                Quá hạn {row.daysOverdue} ngày
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
  ];

  return (
    <div className="space-y-4">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <span>Tổng Phải Thu Khách Hàng (Receivable)</span>
            <ArrowDownLeft className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-800">
            {formatCurrency(totalReceivable)}
          </div>
          <p className="mt-1 text-[11px] text-blue-700 font-medium">Tiền hàng khách mua sỉ còn nợ trại</p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-orange-900">
            <span>Tổng Phải Trả Nhà Cung Cấp (Payable)</span>
            <ArrowUpRight className="h-4 w-4 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-orange-800">
            {formatCurrency(totalPayable)}
          </div>
          <p className="mt-1 text-[11px] text-orange-700 font-medium">Nợ tiền thức ăn, giống, phân bón, thuốc</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-rose-900">
            <span>Khoản Nợ Quá Hạn Cần Đôn Đốc</span>
            <Clock className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">
            {overdueCount} <span className="text-xs font-medium text-slate-500">khoản nợ</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600 font-medium">Cần kiểm tra hạn mức và thu hồi sớm</p>
        </div>
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
              <option value="OPEN">Chưa thanh toán (OPEN)</option>
              <option value="PARTIALLY_PAID">Thanh toán 1 phần</option>
              <option value="PAID">Đã tất toán (PAID)</option>
              <option value="OVERDUE">Quá hạn (OVERDUE)</option>
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
