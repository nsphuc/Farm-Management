import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarmStore } from '../../stores/useFarmStore';
import { analyticsService } from '../../services/analyticsService';
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  Sprout,
  Beef,
  Scale,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  PieChart
} from 'lucide-react';

export const AnalyticsDashboardPage = () => {
  const navigate = useNavigate();
  const currentFarm = useFarmStore((state) => state.currentFarm);

  const [activeTab, setActiveTab] = useState('production'); // 'production', 'inventory', 'financials', 'alerts'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // States cho từng loại báo cáo
  const [productionReport, setProductionReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [financialReport, setFinancialReport] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Tải dữ liệu tương ứng với activeTab
  const loadTabData = async () => {
    if (!currentFarm?.id) return;
    setLoading(true);
    try {
      if (activeTab === 'production') {
        const data = await analyticsService.getProductionReport(currentFarm.id, selectedYear);
        setProductionReport(data);
      } else if (activeTab === 'inventory') {
        const data = await analyticsService.getInventoryReport(currentFarm.id);
        setInventoryReport(data);
      } else if (activeTab === 'financials') {
        const data = await analyticsService.getFinancialReport(currentFarm.id, selectedYear);
        setFinancialReport(data);
      } else if (activeTab === 'alerts') {
        const data = await analyticsService.getEarlyAlerts(currentFarm.id);
        setAlerts(data || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu báo cáo analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData();
  }, [activeTab, selectedYear, currentFarm?.id]);

  // Xử lý xuất báo cáo
  const handleExport = async (format = 'csv') => {
    if (!currentFarm?.id) return;
    setExporting(true);
    try {
      const type = activeTab === 'alerts' ? 'inventory' : activeTab;
      await analyticsService.exportReport(currentFarm.id, type, format);
    } catch (err) {
      console.error('Lỗi khi xuất file báo cáo:', err);
      alert('Không thể xuất báo cáo. Vui lòng thử lại sau.');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Phân tích & Trí tuệ Nông nghiệp (BI Engine)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Trung Tâm Báo Cáo & Phân Tích Đa Chiều
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng hợp dữ liệu sản xuất, biến động kho vật tư, kết quả kinh doanh P&L và cảnh báo vận hành sớm
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lọc Năm */}
          {(activeTab === 'production' || activeTab === 'financials') && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value={2026}>Năm 2026</option>
                <option value={2025}>Năm 2025</option>
                <option value={2024}>Năm 2024</option>
              </select>
            </div>
          )}

          {/* Nút làm mới */}
          <button
            onClick={loadTabData}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Nút Xuất file Excel / CSV */}
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? 'Đang xuất...' : 'Xuất Excel / CSV (UTF-8)'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('production')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'production'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Sản Xuất & Năng Suất</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Kho & Định Giá Vật Tư</span>
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'financials'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Tài Chính P&L & Suất Sinh Lời ROI</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Trung Tâm Cảnh Báo Sớm</span>
        </button>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Đang tổng hợp dữ liệu báo cáo...</span>
        </div>
      )}

      {/* TAB 1: SẢN XUẤT & NĂNG SUẤT */}
      {!loading && activeTab === 'production' && (
        <div className="space-y-6">
          {/* 4 Thẻ chỉ số năng suất */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng diện tích gieo trồng</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                {Number(productionReport?.totalPlantedAreaM2 || 0).toLocaleString()} m²
              </p>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">Quy mô canh tác vụ mùa</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng sản lượng thu hoạch</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {Number(productionReport?.totalActualYieldKg || 0).toLocaleString()} kg
              </p>
              <span className="text-[11px] text-slate-400 mt-1 inline-block">
                Dự kiến: {Number(productionReport?.totalEstimatedYieldKg || 0).toLocaleString()} kg
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tỷ lệ hoàn thành kế hoạch</span>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {Number(productionReport?.averageAchievementRate || 0).toFixed(1)}%
              </p>
              <span className="text-[11px] text-blue-500 font-medium mt-1 inline-block">Đạt chỉ tiêu dự kiến</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tỷ lệ hao hụt / thất thoát</span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                {Number(productionReport?.wasteLossRatio || 0).toFixed(2)}%
              </p>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">Dưới ngưỡng tiêu chuẩn VietGAP (5%)</span>
            </div>
          </div>

          {/* Bảng Năng suất từng mùa vụ */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bảng Kê Năng Suất Cây Trồng Theo Vụ Mùa ({selectedYear})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Đối chiếu sản lượng thực tế và định mức kỹ thuật</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã Vụ Mùa</th>
                    <th className="py-3 px-4">Tên Cây Trồng</th>
                    <th className="py-3 px-4">Phân Khu Canh Tác</th>
                    <th className="py-3 px-4 text-right">Diện Tích (m²)</th>
                    <th className="py-3 px-4 text-right">Dự Kiến (kg)</th>
                    <th className="py-3 px-4 text-right">Thực Tế (kg)</th>
                    <th className="py-3 px-4 text-right">Năng Suất (kg/m²)</th>
                    <th className="py-3 px-4 text-right">Hoàn Thành</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productionReport?.cropYields && productionReport.cropYields.length > 0 ? (
                    productionReport.cropYields.map((item) => (
                      <tr key={item.seasonId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                          {item.seasonCode}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {item.cropName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {item.zoneName}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {Number(item.plantedAreaM2).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {Number(item.estimatedYieldKg).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          {Number(item.actualYieldKg).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {item.yieldPerM2}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${Number(item.achievementRate) >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {Number(item.achievementRate).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">
                        Chưa có dữ liệu vụ mùa nào trong năm {selectedYear}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phân hệ FCR & Phân loại chất lượng đóng gói */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FCR Chăn Nuôi */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <Beef className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Hệ Số Chuyển Đổi Thức Ăn FCR (Chăn Nuôi)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">FCR = Tổng lượng cám tiêu thụ (kg) / Tăng trọng đàn (kg)</p>

              <div className="space-y-3">
                {productionReport?.fcrSummaries && productionReport.fcrSummaries.length > 0 ? (
                  productionReport.fcrSummaries.map((fcr) => (
                    <div key={fcr.groupId} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">
                          {fcr.groupCode} ({fcr.breedName}) • {fcr.totalAnimals} con
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                          FCR: {fcr.fcr}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 mt-1">
                        <span>Cám tiêu thụ: {Number(fcr.feedConsumedKg).toLocaleString()} kg</span>
                        <span>Tăng trọng: {Number(fcr.weightGainedKg).toLocaleString()} kg</span>
                      </div>
                      <div className="mt-2 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md inline-block">
                        {fcr.evaluation}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">Chưa có đàn vật nuôi nào đang nuôi</div>
                )}
              </div>
            </div>

            {/* Phân loại đóng gói (Quality Grading) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Phân Loại Chất Lượng Lô Nông Sản Đóng Gói
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">Tỷ lệ nông sản đạt chuẩn Xuất Khẩu, Loại 1, Loại 2</p>

              <div className="space-y-4">
                {productionReport?.qualityGrading && productionReport.qualityGrading.length > 0 ? (
                  productionReport.qualityGrading.map((grade) => (
                    <div key={grade.qualityGrade}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {grade.qualityGrade === 'XUAT_KHAU'
                            ? '⭐ Chuẩn Xuất Khẩu (GlobalGAP)'
                            : grade.qualityGrade === 'LOAI_1'
                            ? '🥇 Nông Sản Loại 1 (VietGAP)'
                            : '🥈 Nông Sản Loại 2 (Chợ truyền thống)'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {Number(grade.totalQuantity).toLocaleString()} kg ({Number(grade.percentage).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            grade.qualityGrade === 'XUAT_KHAU'
                              ? 'bg-purple-600'
                              : grade.qualityGrade === 'LOAI_1'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${grade.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">Chưa có lô thành phẩm đóng gói</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KHO & VẬT TƯ */}
      {!loading && activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* 4 Thẻ chỉ số Kho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng giá trị tài sản kho</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {formatCurrency(inventoryReport?.totalInventoryValue)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 inline-block">Định giá theo giá tiêu chuẩn</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Số mã vật tư hoạt động</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                {inventoryReport?.totalMaterialsCount || 0} mã SKU
              </p>
              <span className="text-[11px] text-blue-500 mt-1 inline-block">Phân bón, BVTV, giống, cám</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cảnh báo tồn dưới mức an toàn</span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                {inventoryReport?.lowStockCount || 0} vật tư
              </p>
              <span className="text-[11px] text-amber-600 font-medium mt-1 inline-block">Cần tạo phiếu nhập kho bổ sung</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Vật tư cận hạn (&lt;60 ngày)</span>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                {inventoryReport?.expiringCount || 0} lô hàng
              </p>
              <span className="text-[11px] text-rose-600 font-medium mt-1 inline-block">Ưu tiên xuất dùng trước (FIFO)</span>
            </div>
          </div>

          {/* Định giá tồn kho theo danh mục & Vật tư cận hạn */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Định giá theo danh mục */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cơ Cấu Giá Trị Tồn Kho Theo Phân Loại Danh Mục
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">Tỷ lệ giá trị tài sản đang lưu kho</p>

              <div className="space-y-3">
                {inventoryReport?.categoryValuations && inventoryReport.categoryValuations.length > 0 ? (
                  inventoryReport.categoryValuations.map((cat) => (
                    <div key={cat.categoryId} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{cat.categoryName}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cat.totalValue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px] mt-1">
                        <span>{cat.totalItems} mặt hàng</span>
                        <span className="text-emerald-600 font-semibold">{Number(cat.valuePercentage).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cat.valuePercentage || 0}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">Chưa có dữ liệu tồn kho</div>
                )}
              </div>
            </div>

            {/* Danh sách vật tư cận hạn */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Danh Sách Lô Vật Tư Cận Hạn Sử Dụng (&lt;60 Ngày)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">Khuyến nghị xuất dùng trước theo nguyên tắc FIFO</p>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {inventoryReport?.expiringItems && inventoryReport.expiringItems.length > 0 ? (
                  inventoryReport.expiringItems.map((exp) => (
                    <div
                      key={exp.inventoryId}
                      className="p-3 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {exp.materialName} ({exp.skuCode})
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Lô: <span className="font-mono">{exp.batchNumber}</span> • Kho: {exp.warehouseName}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          Hạn dùng: <span className="font-semibold text-rose-600">{exp.expiryDate}</span> (còn {exp.daysRemaining} ngày)
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {Number(exp.quantityOnHand).toLocaleString()} {exp.unit}
                        </span>
                        <span className={`block text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${
                          exp.riskLevel === 'CRITICAL' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                        }`}>
                          {exp.riskLevel === 'CRITICAL' ? 'NGUY HIỂM' : 'CẢNH BÁO'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Không có vật tư nào cận hạn trong 60 ngày tới.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TÀI CHÍNH P&L & ROI */}
      {!loading && activeTab === 'financials' && (
        <div className="space-y-6">
          {/* 4 Thẻ P&L */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng doanh thu ({selectedYear})</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                {formatCurrency(financialReport?.totalRevenue)}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">Từ bán buôn & bán lẻ nông sản</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng chi phí hoạt động</span>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                {formatCurrency(financialReport?.totalExpenses)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 inline-block">
                Trực tiếp: {formatCurrency(financialReport?.directCosts)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lợi nhuận ròng (Net Profit)</span>
              <p className={`text-xl font-bold mt-2 ${(financialReport?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatCurrency(financialReport?.netProfit)}
              </p>
              <span className="text-[11px] text-blue-500 font-medium mt-1 inline-block">
                Biên lợi nhuận: {Number(financialReport?.profitMarginPercentage || 0).toFixed(1)}%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tỷ suất hoàn vốn ROI</span>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {Number(financialReport?.roiPercentage || 0).toFixed(1)}%
              </p>
              <span className="text-[11px] text-purple-500 font-medium mt-1 inline-block">Hiệu quả đầu tư mùa vụ</span>
            </div>
          </div>

          {/* Bảng P&L 12 Tháng */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bảng Kết Quả Hoạt Động Kinh Doanh P&L 12 Tháng ({selectedYear})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Chi tiết doanh thu, chi phí và lợi nhuận ròng theo từng kỳ kế toán</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Kỳ Kế Toán</th>
                    <th className="py-3 px-4 text-right">Doanh Thu (VNĐ)</th>
                    <th className="py-3 px-4 text-right">Chi Phí (VNĐ)</th>
                    <th className="py-3 px-4 text-right">Lợi Nhuận Ròng (VNĐ)</th>
                    <th className="py-3 px-4 text-right">Biên Lãi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {financialReport?.monthlyPL && financialReport.monthlyPL.length > 0 ? (
                    financialReport.monthlyPL.map((item) => (
                      <tr key={item.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {item.monthName}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">
                          {formatCurrency(item.expense)}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${(item.profit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(item.profit)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {Number(item.marginPercentage || 0).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        Chưa có dữ liệu giao dịch trong năm {selectedYear}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phân bổ chi phí & Tình hình công nợ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cơ cấu chi phí theo danh mục */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cơ Cấu Chi Phí Theo Hạng Mục Kế Toán
                </h3>
              </div>
              <div className="space-y-3">
                {financialReport?.expenseBreakdown && financialReport.expenseBreakdown.length > 0 ? (
                  financialReport.expenseBreakdown.map((exp) => (
                    <div key={exp.categoryId} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{exp.categoryName}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(exp.amount)}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${exp.percentage || 0}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">Chưa có dữ liệu phân loại chi phí</div>
                )}
              </div>
            </div>

            {/* Đối soát công nợ */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tình Trạng Công Nợ Trang Trại
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Nợ phải thu (Khách hàng)</span>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-2">
                      {formatCurrency(financialReport?.totalReceivableDebt)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900">
                    <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">Nợ phải trả (Nhà cung cấp)</span>
                    <p className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-2">
                      {formatCurrency(financialReport?.totalPayableDebt)}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/finance/debts')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all text-center"
              >
                Xem Báo Cáo Tuổi Nợ (Debt Aging Report)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TRUNG TÂM CẢNH BÁO SỚM */}
      {!loading && activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Danh Sách Các Cảnh Báo Vận Hành Đang Kích Hoạt
            </h3>
            <span className="text-xs text-slate-400">
              Quét tự động bởi AI Early-Warning Subsystem
            </span>
          </div>

          {alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                    alert.severity === 'CRITICAL'
                      ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/30'
                      : 'border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        alert.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {alert.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-200 text-rose-800'
                            : 'bg-amber-200 text-amber-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {alert.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-2 block">
                        Phân loại: {alert.category} • Thời gian: {new Date(alert.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                  >
                    Xử lý ngay
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Trang trại đang hoạt động an toàn
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Không phát hiện nguy cơ hết hạn vật tư, công việc trễ hạn hay công nợ quá hạn tại thời điểm này.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
