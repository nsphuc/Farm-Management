import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Building,
  Download,
  Printer,
  Calendar,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Warehouse,
  Sprout,
  ShieldCheck,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { exportToCsv, printReport } from '@/utils/exportUtils';
import { reportService } from '@/services/modules/reportService';
import { financeService } from '@/services/modules/financeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function ExecutiveDashboardTab({ farmId, activeFarm, isAllFarms }) {
  const { farms } = useActiveFarmStore();
  const { isOwner } = useAuthStore();
  const [data, setData] = useState(null);
  const [crossFarmData, setCrossFarmData] = useState([]);
  const [realMonthlyData, setRealMonthlyData] = useState([]);
  const [realExpenseCategories, setRealExpenseCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadDashboard();
  }, [farmId, fiscalYear, isAllFarms]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const qFarm = farmId && farmId !== 'ALL' ? Number(farmId) : undefined;
      const [res, expensesRes, ordersRes] = await Promise.all([
        reportService.getExecutiveDashboard(farmId, fiscalYear),
        financeService.getExpenses({ farmId: qFarm, size: 200 }).catch(() => ({ content: [] })),
        financeService.getSalesOrders({ farmId: qFarm, size: 200 }).catch(() => ({ content: [] })),
      ]);
      setData(res);

      // Process Monthly Breakdown (100% Real from API & DB)
      if (res?.monthlyFinancials && res.monthlyFinancials.length > 0) {
        setRealMonthlyData(res.monthlyFinancials.map(m => ({
          month: m.month,
          revenue: Number(m.revenue || 0),
          expense: Number(m.expense || 0),
        })));
      } else {
        const ordersList = ordersRes?.content || (Array.isArray(ordersRes) ? ordersRes : []);
        const expensesList = expensesRes?.content || (Array.isArray(expensesRes) ? expensesRes : []);

        const mRev = {};
        ordersList.forEach(o => {
          if (o.status !== 'CANCELLED' && o.orderDate) {
            const m = 'T' + parseInt(o.orderDate.split('-')[1], 10);
            mRev[m] = (mRev[m] || 0) + Number(o.finalAmount || 0);
          }
        });

        const mExp = {};
        expensesList.forEach(e => {
          if (e.status !== 'CANCELLED' && e.expenseDate) {
            const m = 'T' + parseInt(e.expenseDate.split('-')[1], 10);
            mExp[m] = (mExp[m] || 0) + Number(e.amount || 0);
          }
        });

        const allMonths = Array.from(new Set([...Object.keys(mRev), ...Object.keys(mExp)])).sort((a, b) => {
          return parseInt(a.replace('T', ''), 10) - parseInt(b.replace('T', ''), 10);
        });

        if (allMonths.length > 0) {
          setRealMonthlyData(allMonths.map(m => ({
            month: m,
            revenue: mRev[m] || 0,
            expense: mExp[m] || 0,
          })));
        } else {
          setRealMonthlyData([]);
        }
      }

      // Process Expense Categories Breakdown (100% Real matching WS-H1)
      if (res?.expenseCategories && res.expenseCategories.length > 0) {
        setRealExpenseCategories(res.expenseCategories.map(c => ({
          name: c.name,
          value: Number(c.value || 0),
        })));
      } else {
        const expensesList = expensesRes?.content || (Array.isArray(expensesRes) ? expensesRes : []);
        const catMap = {};
        expensesList.forEach(e => {
          if (e.status !== 'CANCELLED') {
            const catName = e.costCategoryName || 'Chi phí khác';
            catMap[catName] = (catMap[catName] || 0) + Number(e.amount || 0);
          }
        });
        const catArr = Object.entries(catMap).map(([name, value]) => ({ name, value })).filter(c => c.value > 0);
        setRealExpenseCategories(catArr);
      }

      // Nếu đang xem Tất cả trang trại (Chế độ Owner), nạp số liệu so sánh từng trại
      if (isAllFarms || isOwner()) {
        const farmPromises = (farms || []).map(async (f) => {
          try {
            const fRes = await reportService.getExecutiveDashboard(f.id, fiscalYear);
            return {
              farmId: f.id,
              farmName: f.name,
              farmCode: f.code,
              revenue: Number(fRes?.totalRevenue || 0),
              expense: Number(fRes?.totalExpense || 0),
              profit: Number(fRes?.grossProfit || 0),
              yieldKg: Number(fRes?.totalHarvestYieldKg || 0),
              inventory: Number(fRes?.totalInventoryValuation || 0),
              roi: Number(fRes?.grossMarginPct || 0),
            };
          } catch {
            return {
              farmId: f.id,
              farmName: f.name,
              farmCode: f.code,
              revenue: 0,
              expense: 0,
              profit: 0,
              yieldKg: 0,
              inventory: 0,
              roi: 0,
            };
          }
        });
        const cross = await Promise.all(farmPromises);
        setCrossFarmData(cross);
      }
    } catch (err) {
      console.error('Failed to load executive dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Xuất báo cáo tổng quan ra CSV
  const handleExportCsv = () => {
    if (isAllFarms && crossFarmData.length > 0) {
      const headers = [
        { label: 'Mã Trại', key: 'farmCode' },
        { label: 'Tên Trang Trại', key: 'farmName' },
        { label: 'Doanh Thu (VNĐ)', key: 'revenue', formatter: (v) => formatCurrency(v) },
        { label: 'Tổng Chi Phí (VNĐ)', key: 'expense', formatter: (v) => formatCurrency(v) },
        { label: 'Lợi Nhuận Gộp (VNĐ)', key: 'profit', formatter: (v) => formatCurrency(v) },
        { label: 'Sản Lượng Thu Hoạch (kg)', key: 'yieldKg', formatter: (v) => formatNumber(v) },
        { label: 'Biên Lợi Nhuận (%)', key: 'roi', formatter: (v) => `${v}%` },
      ];
      exportToCsv(`Bao_Cao_So_Sanh_Trang_Trai_${fiscalYear}`, headers, crossFarmData);
    } else if (data) {
      const rows = [
        { metric: 'Doanh thu xuất bán', value: formatCurrency(data.totalRevenue || 0) },
        { metric: 'Tổng chi phí vận hành & sản xuất', value: formatCurrency(data.totalExpense || 0) },
        { metric: 'Lợi nhuận gộp', value: formatCurrency(data.grossProfit || 0) },
        { metric: 'Biên lợi nhuận gộp (%)', value: `${data.grossMarginPct || 0}%` },
        { metric: 'Tổng sản lượng thu hoạch (kg)', value: formatNumber(data.totalHarvestYieldKg || 0) },
        { metric: 'Định giá tồn kho vật tư', value: formatCurrency(data.totalInventoryValuation || 0) },
        { metric: 'Công nợ phải thu từ khách', value: formatCurrency(data.totalReceivableDebt || 0) },
        { metric: 'Công nợ phải trả NCC', value: formatCurrency(data.totalPayableDebt || 0) },
      ];
      const headers = [
        { label: 'Chỉ Số Điều Hành', key: 'metric' },
        { label: 'Giá Trị', key: 'value' },
      ];
      exportToCsv(`Bao_Cao_Dieu_Hanh_${activeFarm?.name || 'Toan_Chuoi'}_${fiscalYear}`, headers, rows);
    }
  };

  const monthlyFinancialData = realMonthlyData.length > 0 ? realMonthlyData : [
    { month: 'Hiện tại', revenue: Number(data?.totalRevenue || 0), expense: Number(data?.totalExpense || 0) }
  ];

  const expenseCategories = realExpenseCategories;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            {isAllFarms
              ? 'Báo Cáo Điều Hành & Đối Sánh Toàn Hệ Thống (Owner Dashboard)'
              : `Báo Cáo Điều Hành Trang Trại: ${activeFarm?.name || ''}`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp kết quả kinh doanh, dòng tiền, sản lượng và cấu trúc chi phí năm tài chính {fiscalYear}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(Number(e.target.value))}
            className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
          >
            <option value={2026}>Năm tài chính 2026</option>
            <option value={2025}>Năm tài chính 2025</option>
            <option value={2024}>Năm tài chính 2024</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={handleExportCsv}
            className="text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            Xuất Excel/CSV
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={<Printer className="h-3.5 w-3.5" />}
            onClick={() => printReport('Bao_Cao_Dieu_Hanh')}
            className="text-xs text-slate-600"
          >
            In
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span>Tổng Doanh Thu Xuất Bán</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(data?.totalRevenue || 0)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600">Đơn hàng B2B & bán buôn chu kỳ</div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-rose-900">
            <span>Tổng Chi Phí Thực Tế</span>
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 font-mono">
            {formatCurrency(data?.totalExpense || 0)}
          </div>
          <div className="mt-1 text-[11px] text-rose-600">Chi phí vật tư, nhân công & vận hành</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <span>Lợi Nhuận Gộp & Tỷ Suất</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-800 font-mono">
            {formatCurrency(data?.grossProfit || 0)}
          </div>
          <div className="mt-1 text-[11px] font-bold text-blue-700">
            Biên lợi nhuận gộp: <span className="underline">{data?.grossMarginPct || 0}%</span>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-purple-900">
            <span>Sản Lượng & Định Giá Tồn Kho</span>
            <Sprout className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-800 font-mono">
            {formatNumber(data?.totalHarvestYieldKg || 0)} <span className="text-sm font-semibold">kg</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-600">
            Tồn kho vật tư: {formatCurrency(data?.totalInventoryValuation || 0)}
          </div>
        </div>
      </div>

      {/* SECTION 1: CHỦ ĐẦU TƯ (OWNER) - SO SÁNH GIỮA CÁC TRANG TRẠI */}
      {isAllFarms && crossFarmData.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-600" />
                  Đối Sánh Hiệu Quả Tài Chính Giữa Các Trang Trại (Owner Comparison)
                </h3>
                <p className="text-xs text-slate-500">
                  So sánh trực quan Doanh thu (xanh) và Chi phí (đỏ) giữa các nông trại trực thuộc
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={crossFarmData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="farmName" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Doanh Thu" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Tổng Chi Phí" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Lợi Nhuận Gộp" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bảng so sánh chi tiết giữa các trang trại */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Bảng Tổng Hợp Chỉ Số Hiệu Suất Sinh Lời Theo Trang Trại
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-3">Mã Trại</th>
                    <th className="p-3">Tên Trang Trại</th>
                    <th className="p-3 text-right">Doanh Thu</th>
                    <th className="p-3 text-right">Tổng Chi Phí</th>
                    <th className="p-3 text-right">Lợi Nhuận Gộp</th>
                    <th className="p-3 text-right">Sản Lượng (kg)</th>
                    <th className="p-3 text-right">Tồn Kho Vật Tư</th>
                    <th className="p-3 text-center">Tỷ Suất ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {crossFarmData.map((f) => (
                    <tr key={f.farmId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-700">{f.farmCode || `#${f.farmId}`}</td>
                      <td className="p-3 font-semibold text-slate-900">{f.farmName}</td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-bold">{formatCurrency(f.revenue)}</td>
                      <td className="p-3 text-right font-mono text-rose-700">{formatCurrency(f.expense)}</td>
                      <td className="p-3 text-right font-mono text-blue-800 font-bold">{formatCurrency(f.profit)}</td>
                      <td className="p-3 text-right font-mono">{formatNumber(f.yieldKg)} kg</td>
                      <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(f.inventory)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${f.roi >= 20 ? 'bg-emerald-100 text-emerald-800' : f.roi > 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                          {f.roi}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: BIỂU ĐỒ CHI TIẾT TỪNG TRANG TRẠI (CHO FARM MANAGER) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ Doanh thu & Chi phí theo tháng */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                Dòng Tiền Doanh Thu vs Chi Phí Qua Các Tháng
              </h3>
              <p className="text-xs text-slate-500">So sánh doanh số bán sỉ và các khoản chi giải ngân</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFinancialData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" name="Doanh Thu" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Chi Phí" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ Cơ cấu các khoản chi phí */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-blue-600" />
                Cơ Cấu Chi Phí Sản Xuất Nông Trại
              </h3>
              <p className="text-xs text-slate-500">Tỷ trọng các nhóm chi phí cấu thành giá thành sản phẩm</p>
            </div>
          </div>

          {expenseCategories.length > 0 ? (
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              Chưa có dữ liệu phân loại chi phí phát sinh trong kỳ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExecutiveDashboardTab;

