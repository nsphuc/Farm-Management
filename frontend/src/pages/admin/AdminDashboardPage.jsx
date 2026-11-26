import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { platformAdminService } from '@/services/modules/platformAdminService';

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalFarms: 128,
    totalUsers: 542,
    totalRevenue: 45500000,
    pendingOrders: 3,
    growthRate: 18.2,
    revenueChart: [
      { month: 'Tháng 6', revenue: 26500000, display: '26.5M' },
      { month: 'Tháng 7', revenue: 31000000, display: '31.0M' },
      { month: 'Tháng 8', revenue: 34500000, display: '34.5M' },
      { month: 'Tháng 9', revenue: 38000000, display: '38.0M' },
      { month: 'Tháng 10', revenue: 41200000, display: '41.2M' },
      { month: 'Tháng 11', revenue: 45500000, display: '45.5M' },
    ],
    farmTypeDistribution: [
      { name: 'Cá nhân kinh doanh', value: 65, color: '#10B981', count: '83 trại' },
      { name: 'Hộ kinh doanh', value: 25, color: '#6366F1', count: '32 trại' },
      { name: 'Doanh nghiệp chuỗi', value: 10, color: '#F59E0B', count: '13 trại' },
    ],
    recentActivities: [],
  });

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const data = await platformAdminService.getDashboard();
        if (isMounted && data) {
          setMetrics((prev) => ({
            ...prev,
            ...data,
          }));
        }
      } catch (err) {
        console.warn('Could not load platform metrics from API', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { isMounted = false; };
  }, []);

  const formatVnd = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Lời chào điều hành */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Tổng quan Nền tảng SaaS</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live Metrics
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Giám sát quy mô trang trại, doanh thu dịch vụ mở rộng và trạng thái cổng thanh toán VNPAY toàn hệ thống FarmGo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/platform/transactions"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm shadow-indigo-500/20 whitespace-nowrap"
          >
            <CreditCard className="w-4 h-4" />
            <span>Đối soát giao dịch</span>
          </Link>
        </div>
      </div>

      {/* ========================================================
          KHỐI 4 THẺ KPI TĂNG TRƯỞNG SAAS
         ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tổng số Trang trại */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Trang trại hoạt động
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{metrics.totalFarms} trại</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{metrics.growthRate}% tăng trưởng</span>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Tổng người dùng */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tài khoản người dùng
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{metrics.totalUsers} tài khoản</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Đang hoạt động trên nền tảng</span>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Doanh thu tháng (Màu xanh lá) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-sm shadow-emerald-500/5 relative overflow-hidden group hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Doanh thu gói tháng này
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400">
              {formatVnd(metrics.totalRevenue)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{metrics.growthRate}% so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* Thẻ 4: Giao dịch chờ / Lỗi Webhook (Màu cam) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-sm shadow-amber-500/5 relative overflow-hidden group hover:border-amber-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
              Chờ xử lý / Lỗi Webhook
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400">
              {metrics.pendingOrders} giao dịch
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-300 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Cần kiểm tra & kích hoạt thủ công</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          KHỐI 2 BIỂU ĐỒ TĂNG TRƯỞNG SAAS (2 CỘT)
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ Doanh thu 6 tháng gần nhất (2/3 cột) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Doanh thu Gói cước SaaS 6 tháng gần nhất</span>
              </h2>
              <p className="text-xs text-slate-400">
                Bao gồm gói thuê bao tiêu chuẩn và 6 dịch vụ mở rộng thanh toán qua VNPAY
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              Đơn vị: Triệu VNĐ
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [formatVnd(val), 'Doanh thu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#adminRevenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ Donut Cơ cấu loại hình trang trại (1/3 cột) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              Cơ cấu loại hình cơ sở
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tỷ lệ phân bổ khách hàng chăn nuôi
            </p>
          </div>

          <div className="h-56 w-full my-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.farmTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {metrics.farmTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val, name, props) => [
                    `${val}% (${props.payload.count})`,
                    props.payload.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend chi tiết bên dưới */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {metrics.farmTypeDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{item.value}%</span>
                  <span className="text-[11px] text-slate-400">({item.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          BẢNG HOẠT ĐỘNG ĐĂNG KÝ & NÂNG CẤP MỚI NHẤT
         ======================================================== */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Giao dịch đăng ký & nâng cấp mới nhất</span>
            </h2>
            <p className="text-xs text-slate-400">
              Các trang trại vừa hoàn tất thanh toán dịch vụ qua cổng VNPAY
            </p>
          </div>
          <Link
            to="/platform/transactions"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>Xem toàn bộ lịch sử</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700/60">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">Trang trại</th>
                <th className="py-3 px-4">Hành động / Gói cước</th>
                <th className="py-3 px-4">Số tiền</th>
                <th className="py-3 px-4">Cổng</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 rounded-r-lg text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {metrics.recentActivities.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">
                    Chưa có giao dịch nâng cấp dịch vụ nào.
                  </td>
                </tr>
              ) : (
                metrics.recentActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{act.farmName || act.farm || '—'}</div>
                      <div className="text-xs text-slate-400">{act.farmCode || ''}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {act.action}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {typeof act.amount === 'number' ? formatVnd(act.amount) : act.amount}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {act.gateway || 'VNPAY'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {(act.status === 'PAID' || act.status === 'SUCCESS') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Thành công</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <span>{act.status || 'PENDING'}</span>
                        </span>
                      )}
                    </td>
                  <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                    {act.time}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
