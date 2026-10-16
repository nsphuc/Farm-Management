import React, { useState, useEffect } from 'react';
import { X, Boxes, Thermometer, Droplets, Maximize2, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { warehouseApi } from '../../../services/warehouseApi';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Modal Thêm mới / Cập nhật Kho bãi trong Trang trại.
 * Thuộc Phân hệ 3.1 Quản lý kho bãi.
 */
export const WarehouseFormModal = ({ isOpen, onClose, farmId, farmName, warehouse = null, onSuccess }) => {
  const isEditing = !!warehouse;

  // State biểu mẫu
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    warehouseType: 'RAW_MATERIAL',
    capacityM3: '',
    areaM2: '',
    standardTemperature: '',
    standardHumidity: '',
    address: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Điền dữ liệu khi cập nhật
  useEffect(() => {
    if (warehouse) {
      setFormData({
        code: warehouse.code || '',
        name: warehouse.name || '',
        warehouseType: warehouse.warehouseType || 'RAW_MATERIAL',
        capacityM3: warehouse.capacityM3 ?? '',
        areaM2: warehouse.areaM2 ?? '',
        standardTemperature: warehouse.standardTemperature ?? '',
        standardHumidity: warehouse.standardHumidity ?? '',
        address: warehouse.address || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        warehouseType: 'RAW_MATERIAL',
        capacityM3: '',
        areaM2: '',
        standardTemperature: '',
        standardHumidity: '',
        address: '',
      });
    }
    setErrors({});
  }, [warehouse, isOpen]);

  if (!isOpen) return null;

  // Validate form client-side
  const validateForm = () => {
    const newErrors = {};

    if (!isEditing && !formData.code.trim()) {
      newErrors.code = 'Mã kho không được để trống';
    } else if (!isEditing && formData.code.trim().length > 50) {
      newErrors.code = 'Mã kho tối đa 50 ký tự';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên kho không được để trống';
    } else if (formData.name.trim().length > 150) {
      newErrors.name = 'Tên kho tối đa 150 ký tự';
    }

    if (formData.capacityM3 && Number(formData.capacityM3) < 0) {
      newErrors.capacityM3 = 'Sức chứa không được âm';
    }

    if (formData.areaM2 && Number(formData.areaM2) < 0) {
      newErrors.areaM2 = 'Diện tích không được âm';
    }

    if (formData.standardHumidity && (Number(formData.standardHumidity) < 0 || Number(formData.standardHumidity) > 100)) {
      newErrors.standardHumidity = 'Độ ẩm tiêu chuẩn phải từ 0% đến 100%';
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

    if (!farmId) {
      toast.error('Chưa xác định trang trại ngữ cảnh!', 'Thiếu thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        warehouseType: formData.warehouseType,
        capacityM3: formData.capacityM3 !== '' ? Number(formData.capacityM3) : null,
        areaM2: formData.areaM2 !== '' ? Number(formData.areaM2) : null,
        standardTemperature: formData.standardTemperature !== '' ? Number(formData.standardTemperature) : null,
        standardHumidity: formData.standardHumidity !== '' ? Number(formData.standardHumidity) : null,
        address: formData.address.trim() || null,
      };

      if (isEditing) {
        // Cập nhật kho
        await warehouseApi.updateWarehouse(farmId, warehouse.id, payload);
        toast.success(`Cập nhật thông tin kho "${formData.name}" thành công!`);
      } else {
        // Tạo mới kho
        await warehouseApi.createWarehouse(farmId, {
          code: formData.code.trim().toUpperCase(),
          ...payload,
        });
        toast.success(`Tạo mới kho "${formData.name}" thành công!`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu kho bãi:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Không thể lưu thông tin kho bãi. Vui lòng kiểm tra lại.';
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
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Cập nhật thông tin kho bãi' : 'Thêm mới kho bãi'}
              </h3>
              <p className="text-xs text-slate-500">
                Thuộc trang trại: <span className="font-semibold text-slate-700">{farmName || `ID: ${farmId}`}</span>
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
            {/* Mã kho */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã kho {!isEditing && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                name="code"
                disabled={isEditing}
                value={formData.code}
                onChange={handleChange}
                placeholder="VD: KHO-PB-01, KHO-LANH-A"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono uppercase transition-colors ${
                  errors.code
                    ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                    : isEditing
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } focus:outline-none focus:ring-2`}
              />
              {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code}</p>}
            </div>

            {/* Phân loại kho */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phân loại kho <span className="text-rose-500">*</span>
              </label>
              <select
                name="warehouseType"
                value={formData.warehouseType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none text-sm transition-colors"
              >
                <option value="RAW_MATERIAL">Kho vật tư thô (Phân bón, Giống, Thuốc BVTV)</option>
                <option value="FINISHED_GOODS">Kho nông sản thành phẩm (Sau thu hoạch)</option>
                <option value="COLD_STORAGE">Kho lạnh bảo quản (Nhiệt độ thấp)</option>
                <option value="GENERAL">Kho tổng hợp / Dụng cụ máy móc</option>
              </select>
            </div>
          </div>

          {/* Tên kho */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên kho bãi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Kho bảo quản phân bón hữu cơ số 1"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                errors.name
                  ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
              } focus:outline-none focus:ring-2`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Sức chứa & Diện tích */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Sức chứa thiết kế (m³)
              </label>
              <div className="relative">
                <Maximize2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="0.1"
                  name="capacityM3"
                  value={formData.capacityM3}
                  onChange={handleChange}
                  placeholder="VD: 500.0"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                    errors.capacityM3
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.capacityM3 && <p className="text-xs text-rose-500 mt-1">{errors.capacityM3}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Diện tích mặt sàn (m²)
              </label>
              <div className="relative">
                <Maximize2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="0.1"
                  name="areaM2"
                  value={formData.areaM2}
                  onChange={handleChange}
                  placeholder="VD: 200.0"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                    errors.areaM2
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.areaM2 && <p className="text-xs text-rose-500 mt-1">{errors.areaM2}</p>}
            </div>
          </div>

          {/* Nhiệt độ & Độ ẩm tiêu chuẩn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nhiệt độ bảo quản (°C)
              </label>
              <div className="relative">
                <Thermometer className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="0.1"
                  name="standardTemperature"
                  value={formData.standardTemperature}
                  onChange={handleChange}
                  placeholder="VD: 4.0 hoặc 25.0"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Độ ẩm tiêu chuẩn (%)
              </label>
              <div className="relative">
                <Droplets className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  name="standardHumidity"
                  value={formData.standardHumidity}
                  onChange={handleChange}
                  placeholder="VD: 65"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                    errors.standardHumidity
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.standardHumidity && <p className="text-xs text-rose-500 mt-1">{errors.standardHumidity}</p>}
            </div>
          </div>

          {/* Địa chỉ / Vị trí chi tiết */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa chỉ / Vị trí chi tiết trong trang trại
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="VD: Cạnh cổng số 2, Phía Bắc phân khu A"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Cập nhật kho' : 'Lưu kho bãi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseFormModal;
