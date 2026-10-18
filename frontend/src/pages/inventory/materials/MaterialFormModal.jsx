import React, { useState, useEffect } from 'react';
import { X, Package, Barcode, DollarSign, Clock, Layers, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { materialApi } from '../../../services/materialApi';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Modal Thêm mới / Cập nhật Mặt hàng Vật tư Nông nghiệp (Material).
 * Đáp ứng yêu cầu nghiệp vụ: Cho phép chọn chiến lược xuất kho FIFO / FEFO.
 */
export const MaterialFormModal = ({ isOpen, onClose, material = null, categories = [], onSuccess }) => {
  const isEditing = !!material;

  // State biểu mẫu
  const [formData, setFormData] = useState({
    categoryId: '',
    code: '',
    name: '',
    barcode: '',
    unit: 'kg',
    outboundStrategy: 'FIFO', // 'FIFO' | 'FEFO'
    minStockLevel: '0',
    maxStockLevel: '',
    unitPriceStandard: '0',
    expireDays: '',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Điền dữ liệu khi chỉnh sửa
  useEffect(() => {
    if (material) {
      setFormData({
        categoryId: material.categoryId || (categories.length > 0 ? categories[0].id : ''),
        code: material.code || '',
        name: material.name || '',
        barcode: material.barcode || '',
        unit: material.unit || 'kg',
        outboundStrategy: material.outboundStrategy || 'FIFO',
        minStockLevel: material.minStockLevel != null ? String(material.minStockLevel) : '0',
        maxStockLevel: material.maxStockLevel != null ? String(material.maxStockLevel) : '',
        unitPriceStandard: material.unitPriceStandard != null ? String(material.unitPriceStandard) : '0',
        expireDays: material.expireDays != null ? String(material.expireDays) : '',
        description: material.description || '',
      });
    } else {
      setFormData({
        categoryId: categories.length > 0 ? categories[0].id : '',
        code: '',
        name: '',
        barcode: '',
        unit: 'kg',
        outboundStrategy: 'FIFO',
        minStockLevel: '0',
        maxStockLevel: '',
        unitPriceStandard: '0',
        expireDays: '',
        description: '',
      });
    }
    setErrors({});
  }, [material, categories, isOpen]);

  if (!isOpen) return null;

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn nhóm vật tư';
    }

    if (formData.code.trim() && formData.code.trim().length > 50) {
      newErrors.code = 'Mã SKU tối đa 50 ký tự';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên vật tư không được để trống';
    } else if (formData.name.trim().length > 150) {
      newErrors.name = 'Tên vật tư tối đa 150 ký tự';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Đơn vị tính không được để trống';
    }

    if (formData.minStockLevel === '' || Number(formData.minStockLevel) < 0) {
      newErrors.minStockLevel = 'Mức tồn tối thiểu phải >= 0';
    }

    if (formData.unitPriceStandard === '' || Number(formData.unitPriceStandard) < 0) {
      newErrors.unitPriceStandard = 'Đơn giá tiêu chuẩn phải >= 0';
    }

    if (formData.outboundStrategy === 'FEFO' && (!formData.expireDays || Number(formData.expireDays) <= 0)) {
      newErrors.expireDays = 'Chiến lược FEFO yêu cầu cấu hình hạn sử dụng > 0 ngày';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        categoryId: Number(formData.categoryId),
        name: formData.name.trim(),
        barcode: formData.barcode.trim() || null,
        unit: formData.unit.trim(),
        outboundStrategy: formData.outboundStrategy,
        minStockLevel: Number(formData.minStockLevel),
        maxStockLevel: formData.maxStockLevel !== '' ? Number(formData.maxStockLevel) : null,
        unitPriceStandard: Number(formData.unitPriceStandard),
        expireDays: formData.expireDays !== '' ? Number(formData.expireDays) : null,
        description: formData.description.trim() || null,
      };

      if (isEditing) {
        // Cập nhật vật tư
        await materialApi.updateMaterial(material.id, payload);
        toast.success(`Cập nhật vật tư "${formData.name}" thành công!`);
      } else {
        // Tạo mới vật tư (Tự sinh VT-00X nếu để trống)
        await materialApi.createMaterial({
          code: formData.code.trim() ? formData.code.trim().toUpperCase() : null,
          ...payload,
        });
        toast.success(`Tạo mới vật tư "${formData.name}" thành công!`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu vật tư:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Không thể lưu vật tư nông nghiệp. Vui lòng kiểm tra lại.';
      toast.error(serverMsg, 'Lỗi thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Cập nhật mặt hàng vật tư' : 'Thêm mới mặt hàng vật tư'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `SKU: ${material.code} — Phân loại: ${material.categoryName || ''}`
                  : '3.2. Quản lý phân bón, giống cây trồng, thuốc BVTV, thức ăn'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nhóm vật tư */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nhóm vật tư <span className="text-rose-500">*</span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                  errors.categoryId
                    ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } focus:outline-none focus:ring-2`}
              >
                <option value="">-- Chọn nhóm vật tư --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-rose-500 mt-1">{errors.categoryId}</p>}
            </div>

            {/* Mã SKU vật tư (Tự sinh) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Mã SKU / Mã vật tư</span>
                {!isEditing && (
                  <span className="text-[11px] text-emerald-600 font-normal">Tự sinh VT-00X</span>
                )}
              </label>
              <input
                type="text"
                name="code"
                disabled={isEditing}
                value={formData.code}
                onChange={handleChange}
                placeholder={isEditing ? formData.code : 'Hệ thống tự cấp (VT-00X)'}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono uppercase transition-colors ${
                  errors.code
                    ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                    : isEditing
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } focus:outline-none focus:ring-2`}
              />
              {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code}</p>}
              {!isEditing && (
                <p className="text-[11px] text-slate-400 mt-1">Để trống để hệ thống tự động sinh mã</p>
              )}
            </div>
          </div>

          {/* Tên vật tư & Mã vạch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên mặt hàng vật tư <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Phân bón NPK Đầu Trâu 20-20-15 TE"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                  errors.name
                    ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } focus:outline-none focus:ring-2`}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã vạch (Barcode)
              </label>
              <div className="relative">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="VD: 893500123456"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* CHIẾN LƯỢC XUẤT KHO (FIFO / FEFO) - Radio & Select chuẩn UI/UX */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Chiến lược xuất kho (Outbound Strategy) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Lựa chọn FIFO */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.outboundStrategy === 'FIFO'
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="outboundStrategy"
                  value="FIFO"
                  checked={formData.outboundStrategy === 'FIFO'}
                  onChange={handleChange}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    FIFO <span className="font-normal text-slate-500">(First-In First-Out)</span>
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Nhập trước xuất trước. Phù hợp vật tư không hạn chế ngày, phân bón vô cơ, bao bì, màng phủ.
                  </p>
                </div>
              </label>

              {/* Lựa chọn FEFO */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.outboundStrategy === 'FEFO'
                    ? 'bg-amber-50/70 border-amber-500 shadow-sm ring-1 ring-amber-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="outboundStrategy"
                  value="FEFO"
                  checked={formData.outboundStrategy === 'FEFO'}
                  onChange={handleChange}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    FEFO <span className="font-normal text-slate-500">(First-Expired First-Out)</span>
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Hết hạn trước xuất trước. Bắt buộc cho hạt giống, vắc-xin, vi sinh, thuốc BVTV sinh học.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Đơn vị tính, Hạn sử dụng, Mức tồn an toàn */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Đơn vị tính <span className="text-rose-500">*</span>
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
              >
                <option value="kg">kg (Kilogram)</option>
                <option value="tấn">tấn</option>
                <option value="lít">lít</option>
                <option value="ml">ml (Mililit)</option>
                <option value="bao">bao (Bao 25kg / 50kg)</option>
                <option value="chai">chai / lọ</option>
                <option value="gói">gói / túi</option>
                <option value="cuộn">cuộn</option>
                <option value="cái">cái / chiếc</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Hạn sử dụng (Ngày)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  min="0"
                  name="expireDays"
                  value={formData.expireDays}
                  onChange={handleChange}
                  placeholder="VD: 365"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                    errors.expireDays
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.expireDays && <p className="text-xs text-rose-500 mt-1">{errors.expireDays}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tồn tối thiểu (Min) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                placeholder="VD: 10"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                  errors.minStockLevel
                    ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } focus:outline-none focus:ring-2`}
              />
              {errors.minStockLevel && <p className="text-xs text-rose-500 mt-1">{errors.minStockLevel}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tồn tối đa (Max)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="maxStockLevel"
                value={formData.maxStockLevel}
                onChange={handleChange}
                placeholder="VD: 500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none text-sm transition-colors"
              />
            </div>
          </div>

          {/* Đơn giá tiêu chuẩn */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Đơn giá tiêu chuẩn (VNĐ / đơn vị) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                min="0"
                step="500"
                name="unitPriceStandard"
                value={formData.unitPriceStandard}
                onChange={handleChange}
                placeholder="VD: 250000"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                  errors.unitPriceStandard
                    ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.unitPriceStandard && <p className="text-xs text-rose-500 mt-1">{errors.unitPriceStandard}</p>}
          </div>

          {/* Mô tả / Hướng dẫn sử dụng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô tả & Hướng dẫn bảo quản
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="VD: Bảo quản nơi khô ráo, tránh ánh nắng trực tiếp, buộc kín miệng bao sau khi dùng..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Cập nhật vật tư' : 'Lưu vật tư'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialFormModal;
