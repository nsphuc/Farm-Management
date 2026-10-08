import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  PieChart, 
  Sprout, 
  Scale, 
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { financeService } from '../../services/financeService';
import { cropService } from '../../services/cropService';
import { livestockService } from '../../services/livestockService';
import { toast } from 'sonner';

export const UnitCostCalculatorPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [calcType, setCalcType] = useState('CROP'); // 'CROP' | 'LIVESTOCK'
  const [seasons, setSeasons] = useState([]);
  const [herds, setHerds] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedHerdId, setSelectedHerdId] = useState('');

  const [costResult, setCostResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (farmId) {
      loadEntities();
    }
  }, [farmId]);

  const loadEntities = async () => {
    try {
      const [seasonRes, herdRes] = await Promise.all([
        cropService.getSeasons(farmId).catch(() => []),
        livestockService.getLivestockGroups(farmId).catch(() => [])
      ]);
      const seasonList = Array.isArray(seasonRes) ? seasonRes : seasonRes?.items || [];
      const herdList = Array.isArray(herdRes) ? herdRes : herdRes?.items || [];
      setSeasons(seasonList);
      setHerds(herdList);

      if (seasonList.length > 0) {
        setSelectedSeasonId(seasonList[0].id);
      }
      if (herdList.length > 0) {
        setSelectedHerdId(herdList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalculate = async () => {
    try {
      setLoading(true);
      if (calcType === 'CROP') {
        if (!selectedSeasonId) {
          toast.error('Vui lòng chọn mùa vụ canh tác');
          return;
        }
        const res = await financeService.calculateCropSeasonCost(farmId, selectedSeasonId);
        setCostResult(res);
      } else {
        if (!selectedHerdId) {
          toast.error('Vui lòng chọn đàn vật nuôi');
          return;
        }
        const res = await financeService.calculateLivestockGroupCost(farmId, selectedHerdId);
        setCostResult(res);
      }
      toast.success('Tính toán giá thành nông sản thành công');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể tính giá thành');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tính Giá Thành Đơn Vị Nông Sản</h1>
          <p className="mt-1 text-sm text-gray-500">
            Hạch toán toàn diện chi phí trực tiếp và phân bổ chi phí gián tiếp trên mỗi kg nông sản xuất bán
          </p>
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Đang hạch toán...' : 'Tính Toán Giá Thành'}
        </button>
      </div>

      {/* Bộ chọn phân hệ tính toán */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-xs font-bold text-gray-600 uppercase">Đối tượng phân tích:</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCalcType('CROP');
                setCostResult(null);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                calcType === 'CROP'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Trồng trọt (Mùa vụ canh tác)
            </button>
            <button
              onClick={() => {
                setCalcType('LIVESTOCK');
                setCostResult(null);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                calcType === 'LIVESTOCK'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Chăn nuôi (Đàn vật nuôi)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {calcType === 'CROP' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Chọn mùa vụ cây trồng *</label>
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.seasonName} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Chọn đàn vật nuôi *</label>
              <select
                value={selectedHerdId}
                onChange={(e) => setSelectedHerdId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
              >
                {herds.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.groupCode || h.name} ({h.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Hiển thị kết quả tính toán */}
      {costResult ? (
        <div className="space-y-6">
          {/* Card KPI Tổng quan */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Giá thành 1 đơn vị
              </span>
              <div className="mt-2">
                <span className="text-3xl font-black text-emerald-700">
                  {new Intl.NumberFormat('vi-VN').format(Math.round(costResult.unitCostPerKg || 0))}
                </span>
                <span className="ml-1 text-sm font-semibold text-emerald-900">VNĐ / kg</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-600">Đã gồm chi phí trực tiếp & gián tiếp</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tổng chi phí sản xuất
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN').format(costResult.totalProductionCost || 0)}
                </span>
                <span className="ml-1 text-xs text-gray-500">VNĐ</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Toàn bộ chi phí đầu vào tích lũy</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Sản lượng thu hoạch
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('vi-VN').format(costResult.totalHarvestQuantityKg || 0)}
                </span>
                <span className="ml-1 text-xs text-gray-500">kg sản phẩm</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Sản lượng hoàn thành nhập kho</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Suất đầu tư diện tích
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-purple-600">
                  {new Intl.NumberFormat('vi-VN').format(Math.round(costResult.costPerSquareMeter || 0))}
                </span>
                <span className="ml-1 text-xs text-gray-500">VNĐ / m²</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Hiệu suất sử dụng đất canh tác</p>
            </div>
          </div>

          {/* Chi tiết phân bổ cơ cấu chi phí */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-600" />
              Cơ Cấu Chi Phí & Tỷ Trọng Đầu Vào
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-700">Chi phí trực tiếp (Vật tư, Giống, Phân thuốc, Nhân công)</span>
                  <span className="text-gray-900 font-bold">
                    {new Intl.NumberFormat('vi-VN').format(costResult.directExpensesTotal || 0)} VNĐ
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${costResult.totalProductionCost > 0 ? (costResult.directExpensesTotal / costResult.totalProductionCost) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-700">Chi phí gián tiếp phân bổ (Khấu hao, Điện nước, Quản lý chung)</span>
                  <span className="text-gray-900 font-bold">
                    {new Intl.NumberFormat('vi-VN').format(costResult.allocatedOverheadTotal || 0)} VNĐ
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{
                      width: `${costResult.totalProductionCost > 0 ? (costResult.allocatedOverheadTotal / costResult.totalProductionCost) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {costResult.costBreakdown && costResult.costBreakdown.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Bảng kê chi tiết theo danh mục:
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Hạng mục chi phí</th>
                        <th className="px-4 py-2.5">Phân loại</th>
                        <th className="px-4 py-2.5 text-right">Số tiền (VNĐ)</th>
                        <th className="px-4 py-2.5 text-right">Tỷ trọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {costResult.costBreakdown.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{item.categoryName}</td>
                          <td className="px-4 py-2.5">{item.costType}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                            {new Intl.NumberFormat('vi-VN').format(item.amount)} đ
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">
                            {item.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <Calculator className="h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-800">Chưa có kết quả tính giá thành</h3>
          <p className="mt-1 text-xs text-gray-400 max-w-sm">
            Chọn một mùa vụ canh tác hoặc đàn vật nuôi ở trên, sau đó nhấn "Tính Toán Giá Thành" để hạch toán giá vốn đơn vị
          </p>
        </div>
      )}
    </div>
  );
};
