import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  X, 
  DollarSign 
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { financeService } from '../../services/financeService';
import { toast } from 'sonner';

export const CostCategoryPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState({
    categoryName: '',
    costType: 'TRUC_TIEP_VAT_TU',
    description: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (farmId) {
      loadCategories();
    }
  }, [farmId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await financeService.getCostCategories(farmId);
      setCategories(Array.isArray(res) ? res : res?.items || []);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh mục chi phí');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.categoryName.trim()) {
      toast.error('Vui lòng nhập tên danh mục chi phí');
      return;
    }

    try {
      if (editingCategory?.id) {
        await financeService.updateCostCategory(farmId, editingCategory.id, form);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await financeService.createCostCategory(farmId, form);
        toast.success('Thêm mới danh mục thành công');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xác nhận xóa danh mục "${name}"?`)) return;
    try {
      await financeService.deleteCostCategory(farmId, id);
      toast.success('Đã xóa danh mục');
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa danh mục đang có phát sinh chi phí');
    }
  };

  const getCostTypeLabel = (type) => {
    switch (type) {
      case 'TRUC_TIEP_VAT_TU': return 'Trực tiếp - Vật tư';
      case 'TRUC_TIEP_NHAN_CONG': return 'Trực tiếp - Nhân công';
      case 'MAY_MOC': return 'Máy móc & Cơ giới';
      case 'KHAU_HAO': return 'Khấu hao thiết bị';
      case 'GIAN_TIEP': return 'Chi phí chung / Gián tiếp';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Danh Mục Chi Phí Định Mức</h1>
          <p className="mt-1 text-sm text-gray-500">
            Cấu hình phân loại chi phí chuẩn mực cho hạch toán giá thành & kiểm soát ngân sách
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setForm({
              categoryName: '',
              costType: 'TRUC_TIEP_VAT_TU',
              description: '',
              status: 'ACTIVE'
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition"
        >
          <Plus className="h-4 w-4" />
          Thêm Danh Mục Chi Phí
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3.5">Tên danh mục</th>
              <th className="px-5 py-3.5">Phân loại tính giá thành</th>
              <th className="px-5 py-3.5">Mô tả</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition">
                <td className="px-5 py-3.5 font-bold text-gray-900">{c.categoryName}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                    {getCostTypeLabel(c.costType)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{c.description || '—'}</td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {c.status || 'ACTIVE'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(c);
                        setForm({
                          categoryName: c.categoryName,
                          costType: c.costType || 'TRUC_TIEP_VAT_TU',
                          description: c.description || '',
                          status: c.status || 'ACTIVE'
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-gray-400 hover:text-purple-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.categoryName)}
                      className="p-1 text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">
              {editingCategory ? 'Cập nhật Danh mục Chi phí' : 'Thêm Danh mục Chi phí mới'}
            </h2>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phân bón vô cơ, Tiền lương lao động, Điện sinh hoạt..."
                  value={form.categoryName}
                  onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phân loại chi phí *</label>
                <select
                  value={form.costType}
                  onChange={(e) => setForm({ ...form, costType: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="TRUC_TIEP_VAT_TU">Trực tiếp - Vật tư & Hạt giống</option>
                  <option value="TRUC_TIEP_NHAN_CONG">Trực tiếp - Nhân công chăm sóc</option>
                  <option value="MAY_MOC">Máy móc & Cơ giới hóa</option>
                  <option value="KHAU_HAO">Khấu hao tài sản & Chuồng trại</option>
                  <option value="GIAN_TIEP">Chi phí chung / Quản lý gián tiếp</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả</label>
                <input
                  type="text"
                  placeholder="Diễn giải thêm phạm vi hạch toán..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  Lưu Danh Mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
