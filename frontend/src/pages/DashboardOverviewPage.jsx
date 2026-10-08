import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { useFarmStore } from '../stores/useFarmStore';
import { analyticsService } from '../services/analyticsService';
import {
  Sprout,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';

export const DashboardOverviewPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const currentTenant = useTenantStore((state) => state.currentTenant);
  const currentFarm = useFarmStore((state) => state.currentFarm);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const loadData = async () => {
    if (!currentFarm?.id) return;
    setLoading(true);
    try {
      const [sumData, alertData] = await Promise.all([
        analyticsService.getExecutiveSummary(currentFarm.id),
        analyticsService.getEarlyAlerts(currentFarm.id)
      ]);
      setSummary(sumData);
      setAlerts(alertData || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu tổng quan dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFarm?.id]);

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Tính toán biểu đồ đường xu hướng dòng tiền (SVG Trend Line)
  const renderTrendChart = () => {
    const trend = summary?.monthlyTrend || [];
    if (trend.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
          Chưa có đủ dữ liệu dòng tiền 6 tháng
        </div>
      );
    }

    const maxVal = Math.max(...trend.map(t => Math.max(t.revenue || 0, t.expense || 0, t.profit || 0)), 1000000);
    const height = 180;
    const width = 500;
    const padding = 30;
    const stepX = (width - padding * 2) / (trend.length - 1 || 1);

    const getPoints = (key) => {
      return trend.map((t, idx) => {
        const x = padding + idx * stepX;
        const y = height - padding - ((t[key] || 0) / maxVal) * (height - padding * 2);
        return `${x},${Math.max(padding, Math.min(height - padding, y))}`;
      }).join(' ');
    };

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 select-none">
          {/* Horizontal grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" opacity="0.2" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="3 3" opacity="0.2" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" opacity="0.4" />

          {/* Revenue Line (Emerald) */}
          <polyline fill="none" stroke="#10b981" strokeWidth="3" points={getPoints('revenue')} />

          {/* Expense Line (Rose) */}
          <polyline fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="4 2" points={getPoints('expense')} />

          {/* Profit Line (Indigo) */}
          <polyline fill="none" stroke="#6366f1" strokeWidth="3" points={getPoints('profit')} />

          {/* Month labels */}
          {trend.map((t, idx) => {
            const x = padding + idx * stepX;
            return (
              <text key={idx} x={x} y={height - 8} fontSize="10" fill="#94a3b8" textAnchor="middle">
                {t.month}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-3 h-0.5 bg-emerald-500 rounded" />
            <span>Doanh thu</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
            <span className="w-3 h-0.5 bg-rose-500 border-dashed rounded" />
            <span>Chi phí</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <span className="w-3 h-0.5 bg-indigo-500 rounded" />
            <span>Lợi nhuận ròng</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-primary-700 to-teal-800 text-white p-6 sm:p-8 shadow-card">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>Executive Dashboard • Điều hành Thời gian thực</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {user?.fullName || 'Nhà quản trị'}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100 font-light leading-relaxed">
            Hệ sinh thái đang vận hành tại <strong className="font-semibold text-white underline decoration-emerald-400">{currentFarm?.name || 'Trang trại hiện tại'}</strong> thuộc tổ chức <span className="font-medium text-white">{currentTenant?.name}</span>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={() => navigate('/analytics')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-emerald-900 hover:bg-emerald-50 transition-all shadow-sm"
            >
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Trung tâm Phân tích & Báo cáo</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-900/50 hover:bg-emerald-900 text-emerald-100 backdrop-blur-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới chỉ số</span>
            </button>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute -right-8 -bottom-8 text-white/10 pointer-events-none">
          <Sprout className="w-72 h-72 stroke-[1]" />
        </div>
      </div>

      {/* 4 Thẻ KPI Tài chính & Tăng trưởng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Doanh thu tháng */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-card transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Doanh thu tháng này</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(summary?.totalRevenue)}
            </span>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Từ đơn hàng nông sản đã xuất</span>
            </p>
          </div>
        </div>

        {/* Chi phí tháng */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-card transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Chi phí phát sinh</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(summary?.totalExpense)}
            </span>
            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
              <span>Vật tư, nhân công & vận hành</span>
            </p>
          </div>
        </div>

        {/* Lợi nhuận ròng */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-card transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Lợi nhuận ròng (P&L)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-xl sm:text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(summary?.netProfit)}
            </span>
            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
              <span>Doanh thu - Tổng chi phí</span>
            </p>
          </div>
        </div>

        {/* Suất sinh lời ROI */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-card transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Suất sinh lời ROI</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {summary?.roiPercentage ? `${Number(summary.roiPercentage).toFixed(1)}%` : '0.0%'}
            </span>
            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
              <span>Hiệu quả sử dụng vốn</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4 Chỉ số Hoạt động Vận hành Sản xuất */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/crops')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>Vụ mùa đang trồng</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {summary?.activeCropSeasonsCount || 0} vụ mùa
          </p>
        </div>

        <div
          onClick={() => navigate('/livestock')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Đàn gia súc / gia cầm</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {summary?.activeLivestockCount || 0} cá thể
          </p>
        </div>

        <div
          onClick={() => navigate('/inventory')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <Package className="w-4 h-4 text-rose-600" />
            <span>Vật tư cận hạn (&lt;30 ngày)</span>
          </div>
          <p className={`text-lg font-bold mt-1 ${(summary?.expiringMaterialCount || 0) > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {summary?.expiringMaterialCount || 0} lô cảnh báo
          </p>
        </div>

        <div
          onClick={() => navigate('/tasks')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Công việc trễ hạn</span>
          </div>
          <p className={`text-lg font-bold mt-1 ${(summary?.overdueTasksCount || 0) > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {summary?.overdueTasksCount || 0} nhiệm vụ
          </p>
        </div>
      </div>

      {/* Main Grid: Biểu đồ Dòng tiền & Bản đồ Phân khu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ xu hướng dòng tiền (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Xu Hướng Dòng Tiền & Lợi Nhuận (6 Tháng Gần Nhất)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Đối chiếu doanh thu thực tế và chi phí phát sinh</p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Xem chi tiết P&L</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {renderTrendChart()}
        </div>

        {/* Mini Map Phân Khu Canh Tác (1 col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Bản Đồ Phân Khu Canh Tác</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                {summary?.zoneStatuses?.length || 0} khu
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Trạng thái và diện tích canh tác thời gian thực</p>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {summary?.zoneStatuses && summary.zoneStatuses.length > 0 ? (
                summary.zoneStatuses.map((zone) => (
                  <div
                    key={zone.zoneId}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {zone.zoneName} ({zone.zoneCode})
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{zone.areaM2 ? `${Number(zone.areaM2).toLocaleString()} m²` : 'N/A'}</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{zone.currentActivity}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Hoạt động
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">Chưa có phân khu nào được cấu hình</div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate(`/farms/${currentFarm?.id}`)}
            className="mt-4 w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center"
          >
            Quản lý Sơ đồ Phân khu
          </button>
        </div>
      </div>

      {/* Trung tâm Cảnh Báo Sớm Thông Minh (Early Alert Center) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Trung Tâm Cảnh Báo Sớm Thông Minh
              </h2>
              <p className="text-xs text-slate-400">
                Tự động quét và phát hiện các rủi ro kho vật tư, tiến độ công việc và dòng tiền quá hạn
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
            {alerts.length} cảnh báo đang xử lý
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  alert.severity === 'CRITICAL'
                    ? 'border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20 hover:border-rose-400'
                    : 'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20 hover:border-amber-400'
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    alert.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {alert.title}
                    </span>
                    <span className="text-[10px] text-slate-400">Hôm nay</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <span>Tuyệt vời! Hiện tại trang trại không có cảnh báo rủi ro nào cần xử lý khẩn cấp.</span>
          </div>
        )}
      </div>
    </div>
  );
};
