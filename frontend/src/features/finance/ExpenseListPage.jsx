import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  CreditCard, 
  ArrowDownRight, 
  Trash2, 
  Layers, 
  TrendingUp,
  Receipt,
  RotateCw
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { financeService } from '../../services/financeService';
import { ExpenseModal } from './ExpenseModal';
import { toast } from 'sonner';

export const ExpenseListPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (farmId) {
      loadData();
    }
  }, [farmId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, catRes] = await Promise.all([
        financeService.getExpenses(farmId),
        financeService.getCostCategories(farmId)
      ]);
      setExpenses(expRes?.items || (Array.isArray(expRes) ? expRes : []));
      setCategories(Array.isArray(catRes) ? catRes : catRes?.items || []);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu chi phí');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xác nhận xóa khoản chi "${title}"?`)) return;
    try {
      await financeService.deleteExpense(farmId, id);
      toast.success('Đã xóa khoản chi');
      loadData();
    } catch (err) {
      toast.error('Không thể xóa khoản chi');
    }
  };

  const handleBackflush = async () => {
    const txId = window.prompt('Nhập Mã Phiếu Xuất Kho (Inventory Transaction ID) để tự động hạch toán chi phí vật tư:');
    if (!txId) return;

    try {
      await financeService.backflushMaterialExpense(farmId, txId);
      toast.success('Hạch toán tự động vật tư xuất kho thành công');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi hạch toán xuất kho');
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory ? String(e.categoryId) === String(selectedCategory) : true;
    return matchesSearch && matchesCat;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chi Phí & Sổ Chi Nông Trại</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ghi nhận và hạch toán dòng tiền chi: vật tư, nhân công, máy móc và khấu hao trang thiết bị
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBackflush}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
            title="Tự động đồng bộ chi phí từ phiếu xuất kho Phase 3"
          >
            <RotateCw className="h-4 w-4 text-blue-600" />
            Hạch Toán Từ Xuất Kho
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition"
          >
            <Plus className="h-4 w-4" />
            Ghi Nhận Khoản Chi
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng chi phí phát sinh</span>
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-gray-900">
              {new Intl.NumberFormat('vi-VN').format(totalExpenseAmount)}
            </span>
            <span className="ml-1 text-xs text-gray-500 font-medium">VNĐ</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng số khoản chi</span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-blue-600">{filteredExpenses.length}</span>
            <span className="ml-2 text-xs text-gray-500 font-medium">Giao dịch chi</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Danh mục cấu hình</span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-600">{categories.length}</span>
            <span className="ml-2 text-xs text-gray-500 font-medium">Hạng mục chi phí</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khoản chi, số hóa đơn chứng từ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 focus:border-purple-500 focus:outline-none"
        >
          <option value="">Tất cả danh mục chi phí</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.categoryName}</option>
          ))}
        </select>
      </div>

      {/* Table Chi phí */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Khoản chi</th>
                <th className="px-5 py-3.5">Hạng mục</th>
                <th className="px-5 py-3.5">Ngày chi</th>
                <th className="px-5 py-3.5">Số tiền (VNĐ)</th>
                <th className="px-5 py-3.5">Phương thức</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm text-gray-400">
                    Đang tải danh sách chi phí...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm text-gray-400">
                    Chưa có khoản chi nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{exp.title}</div>
                      {exp.receiptNumber && (
                        <div className="text-[11px] text-gray-400 font-mono">HĐ: {exp.receiptNumber}</div>
                      )}
                      {exp.cropSeasonName && (
                        <span className="inline-block mt-0.5 text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                          Vụ: {exp.cropSeasonName}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-800">{exp.categoryName || 'N/A'}</span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString('vi-VN') : '—'}
                    </td>

                    <td className="px-5 py-3.5 font-bold text-purple-900 text-sm">
                      {new Intl.NumberFormat('vi-VN').format(exp.amount)} đ
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {exp.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' :
                       exp.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Ghi nợ'}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(exp.id, exp.title)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Xóa khoản chi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ghi nhận chi phí */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        farmId={farmId}
        onSaved={loadData}
      />
    </div>
  );
};
