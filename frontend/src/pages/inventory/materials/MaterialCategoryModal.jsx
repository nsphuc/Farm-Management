import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, Edit, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { materialApi } from '../../../services/materialApi';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Modal Quản lý Nhóm vật tư nông nghiệp (Material Categories).
 * Ví dụ: Phân bón vô cơ, Phân bón hữu cơ, Thuốc BVTV, Hạt giống, Thức ăn gia súc...
 */
export const MaterialCategoryModal = ({ isOpen, onClose, onCategoriesUpdated }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form tạo / sửa nhóm
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await materialApi.getAllCategories();
      setCategories(res.data || []);
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      console.error('Lỗi khi tải nhóm vật tư:', err);
      toast.error('Không thể tải danh sách nhóm vật tư', 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setIsFormOpen(false);
      setEditingCategory(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ code: '', name: '', description: '' });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!editingCategory && !formData.code.trim()) {
      errs.code = 'Mã nhóm không được để trống';
    }
    if (!formData.name.trim()) {
      errs.name = 'Tên nhóm không được để trống';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await materialApi.updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        });
        toast.success(`Cập nhật nhóm "${formData.name}" thành công!`);
      } else {
        await materialApi.createCategory({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        });
        toast.success(`Tạo mới nhóm "${formData.name}" thành công!`);
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Lỗi khi lưu nhóm vật tư:', err);
      toast.error(
        err.response?.data?.message || 'Không thể lưu thông tin nhóm vật tư',
        'Lỗi thao tác'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhóm vật tư "${category.name}"?`)) {
      return;
    }
    try {
      await materialApi.deleteCategory(category.id);
      toast.success(`Đã xóa nhóm "${category.name}"!`);
      fetchCategories();
    } catch (err) {
      console.error('Lỗi khi xóa nhóm vật tư:', err);
      toast.error(
        err.response?.data?.message || 'Không thể xóa nhóm vật tư này',
        'Lỗi thao tác'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Quản lý Nhóm vật tư</h3>
              <p className="text-xs text-slate-500">
                Phân loại danh mục vật tư nông nghiệp (Phân bón, Thuốc BVTV, Giống, Thức ăn...)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Danh sách nhóm hiện có ({categories.length})
            </span>
            {!isFormOpen && (
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-1.5" /> Thêm nhóm mới
              </Button>
            )}
          </div>

          {/* Form thêm/sửa nhanh */}
          {isFormOpen && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {editingCategory ? `Cập nhật nhóm: ${editingCategory.code}` : 'Thêm mới nhóm vật tư'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Đóng form
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {!editingCategory && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Mã nhóm <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="VD: PHAN_BON, THUOC_BVTV"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs uppercase font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    {formErrors.code && <p className="text-xs text-rose-500 mt-0.5">{formErrors.code}</p>}
                  </div>
                )}
                <div className={editingCategory ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tên nhóm vật tư <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Phân bón vô cơ & hữu cơ"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  {formErrors.name && <p className="text-xs text-rose-500 mt-0.5">{formErrors.name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả nhóm</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="VD: Nhóm các loại phân vi sinh, NPK, lân..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  {editingCategory ? 'Lưu thay đổi' : 'Thêm nhóm'}
                </Button>
              </div>
            </form>
          )}

          {/* Danh sách table */}
          {isLoading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Đang tải danh mục...</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">Chưa có nhóm vật tư nào.</div>
          ) : (
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="font-semibold text-slate-800 text-xs">{cat.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-400">({cat.code})</span>
                    {cat.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50"
                      title="Sửa nhóm"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                      title="Xóa nhóm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MaterialCategoryModal;
