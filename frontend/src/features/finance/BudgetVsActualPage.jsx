import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  Layers, 
  DollarSign, 
  ArrowUpRight, 
  Trash2 
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { financeService } from '../../services/financeService';
import { cropService } from '../../services/cropService';
import { toast } from 'sonner';

export const BudgetVsActualPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal tạo dự toán ngân sách
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newBudgetForm, setNewBudgetForm] = useState({
    budgetName: '',
    cropSeasonId: '',
    totalAllocatedAmount: '',
    year: new Date().getFullYear(),
    notes: '',
    lineItems: []
  });

  useEffect(() => {
    if (farmId) {
      loadBudgets();
      loadReferenceData();
    }
  }, [farmId]);

  useEffect(() => {
    if (farmId && selectedBudgetId) {
      loadComparison();
    }
  }, [farmId, selectedBudgetId]);

  const loadReferenceData = async () => {
    try {
      const [seasonRes, catRes] = await Promise.all([
        cropService.getSeasons(farmId).catch(() => []),
        financeService.getCostCategories(farmId)
      ]);
      const sList = Array.isArray(seasonRes) ? seasonRes : seasonRes?.items || [];
      const cList = Array.isArray(catRes) ? catRes : catRes?.items || [];
      setSeasons(sList);
      setCategories(cList);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const res = await financeService.getBudgets(farmId);
      const bList = Array.isArray(res) ? res : res?.items || [];
      setBudgets(bList);
      if (bList.length > 0 && !selectedBudgetId) {
        setSelectedBudgetId(bList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    try {
      setLoading(true);
      const res = await financeService.getBudgetVsActual(farmId, selectedBudgetId);
      setComparisonData(res);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu đối soát Budget vs Actual');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    // Chuẩn bị sẵn lineItems theo từng danh mục
    const items = categories.map(c => ({
      categoryId: c.id,
      categoryName: c.categoryName,
      allocatedAmount: 0
    }));

    setNewBudgetForm({
      budgetName: `Dự toán Chi phí Vụ ${new Date().getFullYear()}`,
      cropSeasonId: seasons[0]?.id || '',
      totalAllocatedAmount: 0,
      year: new Date().getFullYear(),
      notes: '',
      lineItems: items
    });
    setIsModalOpen(true);
  };

  const handleLineItemChange = (index, amount) => {
    const updated = [...newBudgetForm.lineItems];
    updated[index].allocatedAmount = Number(amount) || 0;
    const total = updated.reduce((sum, item) => sum + item.allocatedAmount, 0);
    setNewBudgetForm({
      ...newBudgetForm,
      lineItems: updated,
      totalAllocatedAmount: total
    });
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!newBudgetForm.budgetName.trim()) {
      toast.error('Vui lòng nhập tên dự toán ngân sách');
      return;
    }

    try {
      const payload = {
        budgetName: newBudgetForm.budgetName,
        cropSeasonId: newBudgetForm.cropSeasonId ? Number(newBudgetForm.cropSeasonId) : null,
        totalAllocatedAmount: Number(newBudgetForm.totalAllocatedAmount) || 0,
        year: Number(newBudgetForm.year),
        notes: newBudgetForm.notes,
        lineItems: newBudgetForm.lineItems.map(item => ({
          categoryId: item.categoryId,
          allocatedAmount: item.allocatedAmount
        }))
      };

      await financeService.createBudget(farmId, payload);
      toast.success('Lập ngân sách mùa vụ thành công');
      setIsModalOpen(false);
      loadBudgets();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo ngân sách');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Đối Soát Ngân Sách (Budget vs Actual)</h1>
          <p className="mt-1 text-sm text-gray-500">
            Giám sát mức độ giải ngân chi phí thực tế so với ngân sách định mức đã được phê duyệt
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition"
        >
          <Plus className="h-4 w-4" />
          Lập Ngân Sách Mùa Vụ
        </button>
      </div>

      {/* Selector Ngân sách */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-700 uppercase">Chọn kế hoạch ngân sách:</label>
          <select
            value={selectedBudgetId}
            onChange={(e) => setSelectedBudgetId(e.target.value)}
            className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:border-purple-500 focus:outline-none bg-white min-w-[280px]"
          >
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.budgetName} ({new Intl.NumberFormat('vi-VN').format(b.totalAllocatedAmount)} đ)
              </option>
            ))}
          </select>
        </div>
      </div>

      {comparisonData ? (
        <div className="space-y-6">
          {/* Card KPI Đối soát tổng thể */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Ngân sách dự toán (Budget)
              </span>
              <div className="mt-2">
                <span className="text-2xl font-black text-gray-900">
                  {new Intl.NumberFormat('vi-VN').format(comparisonData.totalAllocatedBudget || 0)}
                </span>
                <span className="ml-1 text-xs text-gray-500">VNĐ</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Hạn mức chi tối đa được duyệt</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Thực tế đã chi (Actual)
              </span>
              <div className="mt-2">
                <span className="text-2xl font-black text-purple-700">
                  {new Intl.NumberFormat('vi-VN').format(comparisonData.totalActualSpent || 0)}
                </span>
                <span className="ml-1 text-xs text-purple-600">VNĐ</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Tổng chi phí phát sinh đến nay</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Ngân sách còn lại
              </span>
              <div className="mt-2">
                <span className={`text-2xl font-black ${
                  comparisonData.remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {new Intl.NumberFormat('vi-VN').format(comparisonData.remainingBudget || 0)}
                </span>
                <span className="ml-1 text-xs text-gray-500">VNĐ</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                {comparisonData.remainingBudget >= 0 ? 'Trong hạn mức an toàn' : 'VƯỢT DỰ TOÁN!'}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tỷ lệ giải ngân
              </span>
              <div className="mt-2">
                <span className={`text-2xl font-black ${
                  comparisonData.overallSpentPercentage > 100 ? 'text-rose-600' : 'text-blue-600'
                }`}>
                  {comparisonData.overallSpentPercentage || 0}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div 
                  className={`h-full ${comparisonData.overallSpentPercentage > 100 ? 'bg-rose-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, comparisonData.overallSpentPercentage || 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bảng kê đối soát theo từng hạng mục chi */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <h3 className="text-base font-bold text-gray-900">Chi Tiết Đối Soát Từng Hạng Mục (Line Items)</h3>
              <p className="text-xs text-gray-500">So sánh chi phí dự toán vs chi phí thực tế cho từng phân loại</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5">Hạng mục chi phí</th>
                    <th className="px-5 py-3.5 text-right">Dự toán (VNĐ)</th>
                    <th className="px-5 py-3.5 text-right">Đã chi (VNĐ)</th>
                    <th className="px-5 py-3.5 text-right">Chênh lệch</th>
                    <th className="px-5 py-3.5">Tiến độ chi tiêu</th>
                    <th className="px-5 py-3.5 text-center">Cảnh báo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparisonData.comparisonItems?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-bold text-gray-900">{item.categoryName}</td>
                      
                      <td className="px-5 py-3.5 text-right text-gray-700 font-semibold">
                        {new Intl.NumberFormat('vi-VN').format(item.allocatedAmount)} đ
                      </td>

                      <td className="px-5 py-3.5 text-right text-purple-700 font-bold">
                        {new Intl.NumberFormat('vi-VN').format(item.actualSpent)} đ
                      </td>

                      <td className={`px-5 py-3.5 text-right font-bold ${
                        item.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {new Intl.NumberFormat('vi-VN').format(item.variance)} đ
                      </td>

                      <td className="px-5 py-3.5 w-48">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-gray-700">{item.percentageSpent}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div 
                            className={`h-full ${item.isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, item.percentageSpent || 0)}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {item.isOverBudget ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                            <AlertTriangle className="h-3.5 w-3.5" /> Vượt ngân sách
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Trong hạn mức
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <Layers className="h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-800">Chưa có ngân sách mùa vụ nào</h3>
          <p className="mt-1 text-xs text-gray-400 max-w-sm">
            Nhấn "Lập Ngân Sách Mùa Vụ" ở góc trên bên phải để bắt đầu thiết lập hạn mức dự toán chi phí
          </p>
        </div>
      )}

      {/* Modal Lập Ngân Sách Mùa Vụ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">Lập Dự Toán Ngân Sách Mùa Vụ</h2>
            <form onSubmit={handleCreateBudget} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên kế hoạch ngân sách *</label>
                <input
                  type="text"
                  required
                  value={newBudgetForm.budgetName}
                  onChange={(e) => setNewBudgetForm({ ...newBudgetForm, budgetName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mùa vụ áp dụng</label>
                  <select
                    value={newBudgetForm.cropSeasonId}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, cropSeasonId: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">-- Chọn mùa vụ canh tác --</option>
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>{s.seasonName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Năm ngân sách</label>
                  <input
                    type="number"
                    value={newBudgetForm.year}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, year: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bảng phân bổ ngân sách theo từng danh mục */}
              <div className="rounded-xl border border-gray-200 p-3 space-y-2">
                <span className="text-xs font-bold text-gray-700 uppercase">Phân Bổ Hạn Mức Từng Danh Mục:</span>
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {newBudgetForm.lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-gray-800">{item.categoryName}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="500000"
                          value={item.allocatedAmount}
                          onChange={(e) => handleLineItemChange(idx, e.target.value)}
                          className="w-36 rounded-lg border border-gray-200 px-2.5 py-1 text-right font-bold text-purple-700"
                        />
                        <span className="text-gray-400">đ</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t pt-2 text-xs font-bold text-gray-900">
                  <span>TỔNG DỰ TOÁN ĐÃ PHÂN BỔ:</span>
                  <span className="text-purple-700 font-extrabold text-sm">
                    {new Intl.NumberFormat('vi-VN').format(newBudgetForm.totalAllocatedAmount)} đ
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú kế hoạch</label>
                <input
                  type="text"
                  placeholder="Ghi chú mục tiêu tiết giảm chi phí..."
                  value={newBudgetForm.notes}
                  onChange={(e) => setNewBudgetForm({ ...newBudgetForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-bold text-white hover:bg-purple-700 shadow"
                >
                  Xác nhận lập ngân sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
