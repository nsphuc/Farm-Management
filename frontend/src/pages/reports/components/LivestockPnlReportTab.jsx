import React, { useState, useEffect } from 'react';
import {
  Layers,
  BarChart3,
  DollarSign,
  Download,
  Printer,
  Calendar,
  AlertCircle,
  TrendingUp,
  Tag,
  CheckCircle2,
  ShieldAlert,
  Filter,
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
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { exportToCsv, printReport } from '@/utils/exportUtils';
import { reportService } from '@/services/modules/reportService';
import { financeService } from '@/services/modules/financeService';
import { farmingService } from '@/services/modules/farmingService';

export function LivestockPnlReportTab({ farmId, activeFarm }) {
  const [reportData, setReportData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Load danh sách niên vụ để đưa vào bộ lọc
  useEffect(() => {
    loadOperationalCycles();
  }, [farmId]);

  // Load báo cáo khi đổi farmId hoặc selectedCycleId
  useEffect(() => {
    loadLivestockPnl();
  }, [farmId, selectedCycleId]);

  const loadOperationalCycles = async () => {
    try {
      if (farmId && farmId !== 'ALL') {
        const res = await financeService.getOperationalCycles(farmId);
        const list = Array.isArray(res) ? res : (res?.content || []);
        setCycles(list);
      } else {
        setCycles([]);
      }
    } catch (err) {
      console.warn('Không thể tải danh sách niên vụ:', err);
      setCycles([]);
    }
  };

  const loadLivestockPnl = async () => {
    setIsLoading(true);
    try {
      const qFarm = farmId && farmId !== 'ALL' ? Number(farmId) : undefined;
      const qCycle = selectedCycleId && selectedCycleId !== 'ALL' ? Number(selectedCycleId) : undefined;

      const [res, fallbackGroupsRes] = await Promise.all([
        reportService.getLivestockCostProfit(qFarm, qCycle).catch(() => null),
        qFarm
          ? farmingService.getLivestockGroups(qFarm, { size: 50 }).catch(() => ({ content: [] }))
          : Promise.resolve({ content: [] }),
      ]);

      let list = res?.groups || [];

      // Fallback nếu backend trả về danh sách rỗng thì lấy từ farmingService
      if (list.length === 0 && fallbackGroupsRes) {
        const rawGroups = fallbackGroupsRes?.content || (Array.isArray(fallbackGroupsRes) ? fallbackGroupsRes : []);
        list = rawGroups
          .filter((g) => !qCycle || Number(g.operationalCycleId) === qCycle)
          .map((g) => ({
            groupId: g.id,
            groupCode: g.groupCode,
            groupName: `${g.groupCode} - ${g.breedName || 'Đàn vật nuôi'}`,
            breedName: g.breedName || 'Bò Thịt Vỗ Béo BBB',
            species: g.species || 'CATTLE',
            operationalCycleId: g.operationalCycleId,
            cycleName: g.operationalCycleName || 'Niên vụ 2026',
            initialQuantity: g.initialQuantity || 20,
            currentQuantity: g.currentQuantity || 20,
            initialCost: Number(g.totalCost || 0),
            directExpense: 0,
            allocatedCost: 0,
            totalCost: Number(g.totalCost || 0),
            actualYield: Number(g.currentQuantity || 20),
            yieldUnit: 'CON',
            unitCost: g.currentQuantity ? Math.round(Number(g.totalCost || 0) / g.currentQuantity) : 0,
            revenue: 0,
            grossProfit: -Number(g.totalCost || 0),
            grossMarginPct: 0,
            status: g.status || 'ACTIVE',
            entryDate: g.entryDate,
          }));
      }

      setReportData(res);
      setGroups(list);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo thu chi & lợi nhuận lứa vật nuôi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!groups || groups.length === 0) return;
    const headers = [
      { label: 'Mã Đàn', key: 'groupCode' },
      { label: 'Tên Lứa / Giống', key: 'groupName' },
      { label: 'Chủng Loại', key: 'species' },
      { label: 'Niên Vụ', key: 'cycleName' },
      { label: 'Quy Mô Ban Đầu (con)', key: 'initialQuantity', formatter: (v) => formatNumber(v) },
      { label: 'Hiện Tại (con)', key: 'currentQuantity', formatter: (v) => formatNumber(v) },
      { label: 'Tiền Con Giống (VNĐ)', key: 'initialCost', formatter: (v) => formatCurrency(v) },
      { label: 'Thức Ăn & Thú Y (VNĐ)', key: 'directExpense', formatter: (v) => formatCurrency(v) },
      { label: 'Chi Phí Phân Bổ (VNĐ)', key: 'allocatedCost', formatter: (v) => formatCurrency(v) },
      { label: 'Tổng Chi Phí (VNĐ)', key: 'totalCost', formatter: (v) => formatCurrency(v) },
      { label: 'Sản Lượng (Đơn vị)', key: 'actualYield', formatter: (v, row) => `${formatNumber(v)} ${row.yieldUnit || 'CON'}` },
      { label: 'Giá Thành Đơn Vị (VNĐ)', key: 'unitCost', formatter: (v) => formatCurrency(v) },
      { label: 'Doanh Thu (VNĐ)', key: 'revenue', formatter: (v) => formatCurrency(v) },
      { label: 'Lợi Nhuận Gộp (VNĐ)', key: 'grossProfit', formatter: (v) => formatCurrency(v) },
      { label: 'Biên Lợi Nhuận (%)', key: 'grossMarginPct', formatter: (v) => `${v}%` },
      { label: 'Trạng Thái', key: 'status' },
    ];
    exportToCsv(`Bao_Cao_Thu_Chi_Loi_Nhuan_Vat_Nuoi_${activeFarm?.name || 'Trang_Trai'}`, headers, groups);
  };

  // Tính toán tổng hợp KPI cho toàn bộ lứa nuôi
  const totalRevenue = reportData?.overallRevenue ?? groups.reduce((sum, g) => sum + Number(g.revenue || 0), 0);
  const totalCost = reportData?.overallCost ?? groups.reduce((sum, g) => sum + Number(g.totalCost || 0), 0);
  const totalGrossProfit = reportData?.overallGrossProfit ?? (totalRevenue - totalCost);
  const totalBreedingCost = groups.reduce((sum, g) => sum + Number(g.initialCost || 0), 0);
  const totalCareExpense = groups.reduce((sum, g) => sum + Number(g.directExpense || 0) + Number(g.allocatedCost || 0), 0);

  // Dữ liệu biểu đồ so sánh: Con giống vs Chăm sóc vs Doanh thu vs Lợi nhuận
  const chartData = groups.map((g) => ({
    name: g.groupCode || g.groupName,
    initialCost: Number(g.initialCost || 0),
    careExpense: Number(g.directExpense || 0) + Number(g.allocatedCost || 0),
    totalCost: Number(g.totalCost || 0),
    revenue: Number(g.revenue || 0),
    profit: Number(g.grossProfit || 0),
  }));

  return (
    <div className="space-y-6">
      {/* 1. Header Bar & Niên Vụ Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            Báo Cáo Thu Chi & Giá Thành - Lợi Nhuận Lứa Vật Nuôi (Livestock P&L)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bóc tách giá thành từng lứa gia súc, gia cầm (chi phí con giống, thức ăn dinh dưỡng, thuốc thú y & phân bổ chi phí)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bộ lọc Niên Vụ / Chu Kỳ Vận Hành */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Niên Vụ:</span>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="bg-transparent font-bold text-indigo-900 border-none outline-none cursor-pointer pr-1"
            >
              <option value="ALL">Tất cả niên vụ</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || `Niên vụ #${c.id}`} ({c.fiscalYear || '2026'})
                </option>
              ))}
            </select>
          </div>

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
            onClick={() => printReport('Bao_Cao_P_and_L_Vat_Nuoi')}
            className="text-xs text-slate-600"
          >
            In
          </Button>
        </div>
      </div>

      {/* 2. Overview Totals (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span>Tổng Doanh Thu Xuất Bán</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600">
            Doanh số bò thịt, heo, trứng, sữa xuất chuồng
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span>Tổng Chi Phí Con Giống</span>
            <Tag className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800 font-mono">
            {formatCurrency(totalBreedingCost)}
          </div>
          <div className="mt-1 text-[11px] text-amber-600">
            Vốn đầu tư nhập đàn ban đầu
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-rose-900">
            <span>Tổng Chi Phí Thức Ăn & Chăm Sóc</span>
            <BarChart3 className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 font-mono">
            {formatCurrency(totalCareExpense)}
          </div>
          <div className="mt-1 text-[11px] text-rose-600">
            Thức ăn, cám, vắc-xin, thẻ tai RFID & phân bổ
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <span>Lợi Nhuận Gộp Đàn Nuôi</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-800 font-mono">
            {formatCurrency(totalGrossProfit)}
          </div>
          <div className="mt-1 text-[11px] text-blue-600">
            Doanh thu trừ tổng chi phí nuôi lũy kế
          </div>
        </div>
      </div>

      {/* 3. Recharts BarChart: Chi Phí Con Giống vs Chăm Sóc vs Doanh Thu vs Lợi Nhuận */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            Biểu Đồ Đối Soát: Chi Phí Con Giống vs Chi Phí Chăm Sóc vs Doanh Thu Từng Lứa Nuôi
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Đánh giá cơ cấu chi phí đầu tư đàn vật nuôi và biên lợi nhuận ròng của từng chuồng / ô nuôi
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="initialCost" name="Tiền Con Giống" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="careExpense" name="Thức Ăn & Chăm Sóc" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Doanh Thu Bán Sỉ" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Lợi Nhuận Gộp" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Bảng Kê Chi Tiết Thu Chi & Giá Thành Từng Lứa Vật Nuôi
          </span>
          <span className="text-[11px] text-slate-500">
            Tổng cộng: <strong>{groups.length}</strong> lứa nuôi {selectedCycleId !== 'ALL' ? 'trong niên vụ chọn' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              <tr>
                <th className="p-3">Mã Đàn</th>
                <th className="p-3">Giống Vật Nuôi</th>
                <th className="p-3">Niên Vụ</th>
                <th className="p-3 text-center">Quy Mô (Đầu Con)</th>
                <th className="p-3 text-right">Tiền Giống</th>
                <th className="p-3 text-right">Thức Ăn & Thú Y</th>
                <th className="p-3 text-right">Tổng Chi Phí</th>
                <th className="p-3 text-right">Sản Lượng</th>
                <th className="p-3 text-right">Giá Thành / Đơn Vị</th>
                <th className="p-3 text-right">Doanh Thu</th>
                <th className="p-3 text-right">Lợi Nhuận Gộp</th>
                <th className="p-3 text-center">Biên LN (%)</th>
                <th className="p-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.length > 0 ? (
                groups.map((g) => (
                  <tr key={g.groupId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-700">{g.groupCode || `#${g.groupId}`}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{g.breedName || g.groupName}</div>
                      <div className="text-[10px] text-slate-500">{g.species}</div>
                    </td>
                    <td className="p-3 text-slate-600 max-w-[130px] truncate" title={g.cycleName}>
                      {g.cycleName || 'Niên vụ 2026'}
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className="font-bold text-slate-800">{g.currentQuantity}</span>
                      <span className="text-slate-400 text-[10px]"> / {g.initialQuantity}</span>
                    </td>
                    <td className="p-3 text-right font-mono text-amber-700 font-semibold">{formatCurrency(g.initialCost)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {formatCurrency(Number(g.directExpense || 0) + Number(g.allocatedCost || 0))}
                    </td>
                    <td className="p-3 text-right font-mono text-rose-700 font-bold">{formatCurrency(g.totalCost)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">
                      {formatNumber(g.actualYield)} {g.yieldUnit || 'CON'}
                    </td>
                    <td className="p-3 text-right font-mono text-indigo-700 font-bold bg-indigo-50/40">
                      {formatCurrency(g.unitCost)}/{g.yieldUnit || 'con'}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700 font-bold">{formatCurrency(g.revenue)}</td>
                    <td className="p-3 text-right font-mono text-blue-800 font-black">
                      <span className={Number(g.grossProfit) >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {formatCurrency(g.grossProfit)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        Number(g.grossMarginPct) >= 20
                          ? 'bg-emerald-100 text-emerald-800'
                          : Number(g.grossMarginPct) > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {g.grossMarginPct}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        g.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : g.status === 'CLOSED' || g.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {g.status === 'ACTIVE' ? 'Đang nuôi' : (g.status === 'COMPLETED' ? 'Đã xuất chuồng' : g.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={13} className="p-6 text-center text-slate-400">
                    Chưa có lứa vật nuôi nào trong niên vụ này hoặc trang trại chưa tạo đàn vật nuôi.
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

export default LivestockPnlReportTab;

