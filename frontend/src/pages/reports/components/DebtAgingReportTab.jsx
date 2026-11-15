import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Printer,
  Search,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';
import { exportToCsv, printReport } from '@/utils/exportUtils';
import { reportService } from '@/services/modules/reportService';
import { financeService } from '@/services/modules/financeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function DebtAgingReportTab({ farmId, activeFarm }) {
  const [agingData, setAgingData] = useState(null);
  const [debts, setDebts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debtTypeFilter, setDebtTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDebtData();
  }, [farmId]);

  const loadDebtData = async () => {
    setIsLoading(true);
    try {
      const qFarm = farmId && farmId !== 'ALL' ? Number(farmId) : undefined;
      const [agingRes, debtsRes] = await Promise.all([
        reportService.getDebtAging(farmId).catch(() => null),
        financeService.getDebts(qFarm ? { farmId: qFarm, size: 100 } : { size: 100 }).catch(() => []),
      ]);

      setAgingData(agingRes);
      const list = debtsRes?.content || (Array.isArray(debtsRes) ? debtsRes : []);
      setDebts(list);
    } catch (err) {
      console.error('Failed to load debt aging report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (debts.length === 0) return;
    const headers = [
      { label: 'Loại Công Nợ', key: 'debtType', formatter: (v) => v === 'RECEIVABLE' ? 'Phải thu KH' : 'Phải trả NCC' },
      { label: 'Đối Tác', key: 'partnerName' },
      { label: 'Chứng Từ Gốc', key: 'orderCode' },
      { label: 'Tổng Nợ (VNĐ)', key: 'totalDebt', formatter: (v) => formatCurrency(v) },
      { label: 'Đã Trả (VNĐ)', key: 'paidAmount', formatter: (v) => formatCurrency(v) },
      { label: 'Còn Nợ (VNĐ)', key: 'remainingDebt', formatter: (v) => formatCurrency(v) },
      { label: 'Hạn Thanh Toán', key: 'dueDate', formatter: (v) => formatDate(v) },
      { label: 'Số Ngày Quá Hạn', key: 'daysOverdue', formatter: (v) => v > 0 ? `${v} ngày` : 'Trong hạn' },
      { label: 'Trạng Thái', key: 'status' },
    ];
    exportToCsv(`Bao_Cao_Cong_No_Tuoi_No_${activeFarm?.name || 'Trang_Trai'}`, headers, debts);
  };

  const filteredDebts = debts.filter((d) => {
    if (debtTypeFilter && d.debtType !== debtTypeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        d.partnerName?.toLowerCase().includes(term) ||
        d.orderCode?.toLowerCase().includes(term) ||
        d.receiptCode?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalReceivable = debts.filter((d) => d.debtType === 'RECEIVABLE').reduce((sum, d) => sum + Number(d.remainingDebt || 0), 0);
  const totalPayable = debts.filter((d) => d.debtType === 'PAYABLE').reduce((sum, d) => sum + Number(d.remainingDebt || 0), 0);
  const overdueDebts = debts.filter((d) => d.daysOverdue > 0 || d.status === 'OVERDUE');

  // Chart data: Phân loại tuổi nợ (100% Real from agingData & real debts)
  const agingChartData = [
    {
      band: 'Trong hạn',
      receivable: Number(agingData?.receivable?.currentTerm ?? debts.filter(d => d.debtType === 'RECEIVABLE' && (d.daysOverdue <= 0 || !d.daysOverdue)).reduce((s, d) => s + Number(d.remainingDebt || 0), 0)),
      payable: Number(agingData?.payable?.currentTerm ?? debts.filter(d => d.debtType === 'PAYABLE' && (d.daysOverdue <= 0 || !d.daysOverdue)).reduce((s, d) => s + Number(d.remainingDebt || 0), 0)),
    },
    {
      band: 'Quá hạn 1-30 ngày',
      receivable: Number(agingData?.receivable?.overdue1To30 ?? debts.filter(d => d.debtType === 'RECEIVABLE' && d.daysOverdue > 0 && d.daysOverdue <= 30).reduce((s, d) => s + Number(d.remainingDebt || 0), 0)),
      payable: Number(agingData?.payable?.overdue1To30 ?? debts.filter(d => d.debtType === 'PAYABLE' && d.daysOverdue > 0 && d.daysOverdue <= 30).reduce((s, d) => s + Number(d.remainingDebt || 0), 0)),
    },
    {
      band: 'Quá hạn 31-60 ngày',
      receivable: Number(agingData?.receivable?.overdue31To60 ?? debts.filter(d => d.debtType === 'RECEIVABLE' && d.daysOverdue > 30 && d.daysOverdue <= 60).reduce((s, d) => s + Number(d.remainingDebt || 0), 0)),
      payable: Number(agingData?.payable?.overdue31To60 ?? debts.filter(d => d.debtType === 'PAYABLE' && d.daysOverdue > 30 && d.daysOverdue <= 60).reduce((s, d) => s + Number(d.remainingDebt || 0), 0)),
    },
    {
      band: 'Quá hạn >60 ngày',
      receivable: Number(((agingData?.receivable?.overdue61To90 || 0) + (agingData?.receivable?.overdueOver90 || 0)) || debts.filter(d => d.debtType === 'RECEIVABLE' && d.daysOverdue > 60).reduce((s, d) => s + Number(d.remainingDebt || 0), 0)),
      payable: Number(((agingData?.payable?.overdue61To90 || 0) + (agingData?.payable?.overdueOver90 || 0)) || debts.filter(d => d.debtType === 'PAYABLE' && d.daysOverdue > 60).reduce((s, d) => s + Number(d.remainingDebt || 0), 0)),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            Báo Cáo Phân Tích Tuổi Nợ & Rủi Ro Tín Dụng (Debt Aging Analysis)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân nhóm công nợ khách hàng và nhà cung cấp theo các mốc thời hạn để chủ động thu hồi và cân đối vốn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={handleExportCsv}
            className="text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            Xuất Báo Cáo (Excel/CSV)
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={<Printer className="h-3.5 w-3.5" />}
            onClick={() => printReport('Bao_Cao_Tuoi_No')}
            className="text-xs text-slate-600"
          >
            In
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <span>Tổng Nợ Phải Thu Khách Hàng</span>
            <ArrowDownLeft className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-800 font-mono">
            {formatCurrency(totalReceivable)}
          </div>
          <div className="mt-1 text-[11px] text-blue-600">Tiền bán nông sản các đại lý & siêu thị còn nợ</div>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-orange-900">
            <span>Tổng Nợ Phải Trả Nhà Cung Cấp</span>
            <ArrowUpRight className="h-4 w-4 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-orange-800 font-mono">
            {formatCurrency(totalPayable)}
          </div>
          <div className="mt-1 text-[11px] text-orange-600">Tiền vật tư, giống, phân bón trại cần thanh toán</div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-rose-900">
            <span>Khoản Nợ Quá Hạn Cần Đôn Đốc</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 font-mono">
            {overdueDebts.length} <span className="text-sm font-semibold">khoản nợ</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-600">Đã vượt quá hạn cam kết thanh toán</div>
        </div>
      </div>

      {/* Chart: Tuổi nợ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-600" />
          Biểu Đồ Phân Loại Tuổi Nợ (Aging Bands)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          So sánh quy mô nợ trong hạn và nợ quá hạn giữa Phải thu (xanh) và Phải trả (cam)
        </p>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agingChartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="band" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="receivable" name="Phải Thu Khách Hàng" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="payable" name="Phải Trả Nhà Cung Cấp" fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm đối tác, mã đơn, mã phiếu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/60"
            />
          </div>

          <select
            value={debtTypeFilter}
            onChange={(e) => setDebtTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-semibold"
          >
            <option value="">Tất cả loại nợ</option>
            <option value="RECEIVABLE">Chỉ nợ phải thu (Receivable)</option>
            <option value="PAYABLE">Chỉ nợ phải trả (Payable)</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              <tr>
                <th className="p-3">Loại Nợ</th>
                <th className="p-3">Đối Tác</th>
                <th className="p-3">Chứng Từ Gốc</th>
                <th className="p-3 text-right">Tổng Nợ</th>
                <th className="p-3 text-right">Đã Thanh Toán</th>
                <th className="p-3 text-right">Còn Nợ</th>
                <th className="p-3">Hạn Trả</th>
                <th className="p-3 text-center">Tình Trạng Hạn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.length > 0 ? (
                filteredDebts.map((d) => {
                  const isRec = d.debtType === 'RECEIVABLE';
                  const isOverdue = d.daysOverdue > 0 || d.status === 'OVERDUE';
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isRec ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                          {isRec ? 'Phải thu KH' : 'Phải trả NCC'}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{d.partnerName}</td>
                      <td className="p-3 font-mono text-slate-600">{d.orderCode || d.receiptCode || `Nợ #${d.id}`}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(d.totalDebt)}</td>
                      <td className="p-3 text-right font-mono text-emerald-700">{formatCurrency(d.paidAmount || 0)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 bg-slate-50/60">
                        {formatCurrency(d.remainingDebt)}
                      </td>
                      <td className="p-3 text-slate-600 font-mono">{formatDate(d.dueDate)}</td>
                      <td className="p-3 text-center">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                            Quá hạn {d.daysOverdue || 1} ngày
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[10px]">
                            Trong hạn
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Không có khoản công nợ nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DebtAgingReportTab;

