import React, { useState, useEffect } from 'react';
import { X, Layers, AlertCircle, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Can } from '../../../permissions/Can';
import { farmApi } from '../../../services/farmApi';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Modal Thêm mới / Cập nhật Phân khu sản xuất (ProductionZone: Nhà màng, Nhà kính, Đồng ruộng, Chuồng trại).
 * Yêu cầu quyền PERM_ZONE_MANAGE.
 */
export const ZoneFormModal = ({ isOpen, farmId, zone = null, onClose, onSuccess }) => {
  const isEditing = Boolean(zone?.id);

  const initialForm = {
    code: '',
    name: '',
    zoneType: 'GREENHOUSE',
    areaM2: '',
    soilType: '',
    waterSource: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (zone) {
      setFormData({
        code: zone.code || '',
        name: zone.name || '',
        zoneType: zone.zoneType || 'GREENHOUSE',
        areaM2: zone.areaM2 ?? '',
        soilType: zone.soilType || '',
        waterSource: zone.waterSource || '',
      });
    } else {
      setFormData(initialForm);
    }
    setErrors({});
  }, [zone, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};

    if (!isEditing && !formData.code.trim()) {
      errs.code = 'Mã phân khu không được để trống';
    } else if (!isEditing && !/^[A-Za-z0-9_-]+$/.test(formData.code.trim())) {
      errs.code = 'Mã phân khu chỉ bao gồm chữ, số, dấu gạch nối (-) hoặc gạch dưới (_)';
    }

    if (!formData.name.trim()) {
      errs.name = 'Tên phân khu không được để trống';
    }

    if (!formData.zoneType) {
      errs.zoneType = 'Vui lòng chọn loại phân khu sản xuất';
    }

    if (formData.areaM2 === '' || formData.areaM2 === null) {
      errs.areaM2 = 'Diện tích phân khu không được để trống';
    } else if (Number(formData.areaM2) < 0) {
      errs.areaM2 = 'Diện tích phải lớn hơn hoặc bằng 0';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
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
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        zoneType: formData.zoneType,
        areaM2: Number(formData.areaM2),
        soilType: formData.soilType.trim() || null,
        waterSource: formData.waterSource.trim() || null,
      };

      if (!isEditing) {
        payload.code = formData.code.trim().toUpperCase();
        await farmApi.createZone(farmId, payload);
        toast.success(`Đã tạo phân khu "${payload.name}" thành công`);
      } else {
        await farmApi.updateZone(farmId, zone.id, payload);
        toast.success(`Đã cập nhật phân khu "${payload.name}" thành công`);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        (isEditing ? 'Cập nhật phân khu thất bại' : 'Tạo mới phân khu thất bại');
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const zoneTypes = [
    { value: 'GREENHOUSE', label: 'Nhà màng / Nhà kính (Greenhouse)' },
    { value: 'OPEN_FIELD', label: 'Đồng ruộng mở (Open Field)' },
    { value: 'BARN', label: 'Chuồng trại gia súc (Barn)' },
    { value: 'POND', label: 'Ao hồ nuôi thủy sản (Pond)' },
    { value: 'STORAGE', label: 'Khu bảo quản / Sơ chế (Storage)' },
    { value: 'ISOLATION', label: 'Khu cách ly dịch bệnh (Isolation)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Cập nhật phân khu sản xuất' : '1.3.1. Thêm mới phân khu sản xuất'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `Mã phân khu: ${zone?.code}` : 'Khai báo phân khu sản xuất trực thuộc trang trại'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã phân khu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                disabled={isEditing || isSubmitting}
                placeholder="VD: ZONE_GH_01"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm font-mono uppercase transition-colors focus:outline-none focus:ring-2 ${
                  isEditing
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : errors.code
                    ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-sky-500/20 focus:border-sky-500'
                }`}
              />
              {errors.code && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.code}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Diện tích (m²) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="areaM2"
                  value={formData.areaM2}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  min="0"
                  step="0.01"
                  placeholder="VD: 2500"
                  className={`w-full px-3.5 py-2 pr-10 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                    errors.areaM2
                      ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-sky-500/20 focus:border-sky-500'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  m²
                </span>
              </div>
              {errors.areaM2 && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.areaM2}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên phân khu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="VD: Nhà Màng Trồng Dưa Lưới Công Nghệ Cao 01"
              className={`w-full px-3.5 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/30'
                  : 'border-slate-300 focus:ring-sky-500/20 focus:border-sky-500'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Loại hình phân khu <span className="text-rose-500">*</span>
            </label>
            <select
              name="zoneType"
              value={formData.zoneType}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {zoneTypes.map((zt) => (
                <option key={zt.value} value={zt.value}>
                  {zt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Loại đất / Giá thể
              </label>
              <input
                type="text"
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="VD: Giá thể xơ dừa, Đất bazan..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nguồn nước tưới
              </label>
              <input
                type="text"
                name="waterSource"
                value={formData.waterSource}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="VD: Nước giếng khoan qua lọc RO..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>

          {/* Dùng component Can để ẩn nút Lưu nếu user không có quyền PERM_ZONE_MANAGE */}
          <Can permission="PERM_ZONE_MANAGE">
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              className="gap-2 bg-sky-600 hover:bg-sky-700 focus:ring-sky-500"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Lưu thay đổi' : 'Tạo phân khu'}</span>
            </Button>
          </Can>
        </div>
      </div>
    </div>
  );
};

export default ZoneFormModal;
