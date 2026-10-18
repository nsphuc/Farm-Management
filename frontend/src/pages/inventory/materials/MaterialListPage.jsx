import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Layers,
  ArrowUpDown,
  Barcode,
  Clock,
  DollarSign,
  AlertTriangle,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Can } from '../../../permissions/Can';
import { materialApi } from '../../../services/materialApi';
import { MaterialFormModal } from './MaterialFormModal';
import { MaterialCategoryModal } from './MaterialCategoryModal';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Trang Quản lý Danh mục & Mặt hàng Vật tư Nông nghiệp (Chức năng 3.2 trong Sơ đồ phân cấp).
 * Cung cấp: Quản lý vật tư, Nhóm vật tư, Chiến lược xuất kho FIFO / FEFO, Hạn sử dụng, Định mức tồn kho.
 */
export const MaterialListPage = () => {
  // State danh mục nhóm vật tư
  const [categories, setCategories] = useState([]);

  // State danh sách mặt hàng vật tư
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [strategyFilter, setStrategyFilter] = useState('ALL');

  // State Modal Form & Dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // 1. Tải danh mục nhóm vật tư
  const fetchCategories = useCallback(async () => {
    try {
      const res = await materialApi.getAllCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải nhóm vật tư:', err);
    }
  }, []);

  // 2. Tải danh sách mặt hàng vật tư
  const fetchMaterials = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await materialApi.getAllMaterials();
      setMaterials(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải vật tư:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể kết nối đến máy chủ để tải danh mục vật tư.';
      setError(msg);
      toast.error(msg, 'Lỗi tải vật tư');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchMaterials();
  }, [fetchCategories, fetchMaterials]);

  // Bộ lọc dữ liệu client-side
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        !searchTerm.trim() ||
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.barcode?.includes(searchTerm.trim());

      const matchCategory =
        selectedCategory === 'ALL' || String(m.categoryId) === String(selectedCategory);

      const matchStrategy =
        strategyFilter === 'ALL' || m.outboundStrategy === strategyFilter;

      return matchSearch && matchCategory && matchStrategy;
    });
  }, [materials, searchTerm, selectedCategory, strategyFilter]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = materials.length;
    const catCount = categories.length;
    const fefoCount = materials.filter((m) => m.outboundStrategy === 'FEFO').length;
    const fifoCount = materials.filter((m) => m.outboundStrategy === 'FIFO').length;
    return { total, catCount, fefoCount, fifoCount };
  }, [materials, categories]);

  // Xử lý mở Modal Form
  const handleOpenCreate = () => {
    setSelectedMaterial(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (material) => {
    setSelectedMaterial(material);
    setIsFormOpen(true);
  };

  // Xử lý xóa vật tư
  const handleOpenDelete = (material) => {
    setMaterialToDelete(material);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    setIsSubmittingAction(true);
    try {
      await materialApi.deleteMaterial(materialToDelete.id);
      toast.success(`Đã xóa mặt hàng "${materialToDelete.name}"!`);
      setIsDeleteOpen(false);
      setMaterialToDelete(null);
      fetchMaterials();
    } catch (err) {
      console.error('Lỗi khi xóa vật tư:', err);
      toast.error(
        err.response?.data?.message || 'Không thể xóa mặt hàng vật tư này',
        'Lỗi thao tác'
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Định dạng tiền tệ VNĐ
  const formatCurrency = (val) => {
    if (val == null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Trang & Các Nút Thao tác */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              3.2. Quản lý Danh mục & Mặt hàng vật tư
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              {stats.total} mặt hàng
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh mục giống cây trồng, phân bón, thuốc bảo vệ thực vật, thức ăn chăn nuôi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Nút Quản lý nhóm vật tư */}
          <Can role="ROLE_FARM_OWNER" permission="PERM_FARM_UPDATE">
            <Button
              variant="outline"
              onClick={() => setIsCategoryModalOpen(true)}
              className="shadow-sm bg-white"
            >
              <Layers className="w-4 h-4 mr-2 text-indigo-500" />
              Nhóm vật tư ({categories.length})
            </Button>

            {/* Nút Thêm vật tư mới */}
            <Button onClick={handleOpenCreate} className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Thêm vật tư mới
            </Button>
          </Can>
        </div>
      </div>

      {/* 2. Thẻ KPI Tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng mặt hàng</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <Package className="w-5 h-5 text-slate-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nhóm vật tư</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-indigo-600">{stats.catCount}</span>
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chiến lược FEFO</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-amber-600">{stats.fefoCount}</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ưu tiên lô cận hạn trước</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chiến lược FIFO</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">{stats.fifoCount}</span>
            <ArrowUpDown className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Nhập trước xuất trước</p>
        </Card>
      </div>

      {/* 3. Thanh tìm kiếm & Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên vật tư, SKU, mã vạch (barcode)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Lọc theo nhóm vật tư */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors max-w-[200px]"
          >
            <option value="ALL">Tất cả nhóm vật tư</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Lọc theo chiến lược xuất kho */}
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
          >
            <option value="ALL">Tất cả chiến lược</option>
            <option value="FIFO">FIFO (Nhập trước xuất trước)</option>
            <option value="FEFO">FEFO (Hạn trước xuất trước)</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchCategories();
              fetchMaterials();
            }}
            disabled={isLoading}
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 4. Trạng thái Loading, Error, Empty và Bảng dữ liệu */}
      {isLoading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600 mt-4">Đang tải danh mục vật tư nông nghiệp...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Không thể tải danh mục vật tư</h3>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchMaterials} className="mt-4">
            Thử lại
          </Button>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy vật tư nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'ALL' || strategyFilter !== 'ALL'
              ? 'Không có mặt hàng vật tư nào khớp với tiêu chí tìm kiếm.'
              : 'Chưa có mặt hàng vật tư nào được tạo trong danh mục.'}
          </p>
          <Can role="ROLE_FARM_OWNER" permission="PERM_FARM_UPDATE">
            <Button size="sm" onClick={handleOpenCreate} className="mt-4">
              <Plus className="w-4 h-4 mr-1.5" /> Thêm vật tư mới
            </Button>
          </Can>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">SKU & Tên vật tư</th>
                  <th className="py-3.5 px-4">Nhóm vật tư</th>
                  <th className="py-3.5 px-4">Đơn vị</th>
                  <th className="py-3.5 px-4">Chiến lược xuất kho</th>
                  <th className="py-3.5 px-4">Tồn an toàn (Min - Max)</th>
                  <th className="py-3.5 px-4">Đơn giá tiêu chuẩn</th>
                  <th className="py-3.5 px-4">Hạn dùng</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((m) => {
                  const isFefo = m.outboundStrategy === 'FEFO';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono font-medium text-slate-500">{m.code}</span>
                          {m.barcode && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                              <Barcode className="w-3 h-3" /> {m.barcode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {m.categoryName || 'Chung'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                        {m.unit}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isFefo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" /> FEFO (Cận hạn)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                            <ArrowUpDown className="w-3 h-3 text-emerald-600" /> FIFO (Nhập trước)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs text-slate-700 font-medium">
                          Min: <span className="font-bold text-slate-900">{m.minStockLevel ?? 0}</span> {m.unit}
                        </div>
                        {m.maxStockLevel && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Max: {m.maxStockLevel} {m.unit}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800">
                        {formatCurrency(m.unitPriceStandard)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                        {m.expireDays ? `${m.expireDays} ngày` : 'Không giới hạn'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ẩn nút Sửa / Xóa vật tư nếu không có quyền */}
                          <Can
                            role="ROLE_FARM_OWNER"
                            permission="PERM_FARM_UPDATE"
                          >
                            <button
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Sửa thông tin vật tư"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(m)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Xóa mặt hàng vật tư"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Thêm mới / Cập nhật Vật tư */}
      <MaterialFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        material={selectedMaterial}
        categories={categories}
        onSuccess={fetchMaterials}
      />

      {/* Modal Quản lý Nhóm vật tư */}
      <MaterialCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesUpdated={() => {
          fetchCategories();
          fetchMaterials();
        }}
      />

      {/* Confirm Dialog Xóa vật tư */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmittingAction}
        title="Xác nhận xóa mặt hàng vật tư"
        message={`Bạn có chắc chắn muốn xóa mặt hàng "${materialToDelete?.name}" (${materialToDelete?.code}) không?`}
        confirmText="Xóa vật tư"
        variant="danger"
      />
    </div>
  );
};

export default MaterialListPage;
