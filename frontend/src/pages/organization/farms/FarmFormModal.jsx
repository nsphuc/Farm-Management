import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Compass, AlertCircle, Save, Sprout } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Can } from '../../../permissions/Can';
import { farmApi } from '../../../services/farmApi';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Modal Tạo mới / Cập nhật Trang trại.
 * Tuân thủ bảo mật Input: TUYỆT ĐỐI KHÔNG gửi `tenantId` hay `status` lên server.
 */
export const FarmFormModal = ({ isOpen, farm = null, onClose, onSuccess }) => {
  const isEditing = Boolean(farm?.id);

  const initialForm = {
    code: '',
    name: '',
    farmType: 'CROP',
    totalAreaM2: '',
    latitude: '',
    longitude: '',
    address: '',
    managerUserId: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (farm) {
      setFormData({
        code: farm.code || '',
        name: farm.name || '',
        farmType: farm.farmType || 'CROP',
        totalAreaM2: farm.totalAreaM2 ?? '',
        latitude: farm.latitude ?? '',
        longitude: farm.longitude ?? '',
        address: farm.address || '',
        managerUserId: farm.managerUserId || '',
      });
    } else {
      setFormData(initialForm);
    }
    setErrors({});
  }, [farm, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};

    if (!isEditing && !formData.code.trim()) {
      errs.code = 'Mã trang trại không được để trống';
    } else if (!isEditing && !/^[A-Za-z0-9_-]+$/.test(formData.code.trim())) {
      errs.code = 'Mã trang trại chỉ chứa chữ, số, dấu gạch nối (-) hoặc gạch dưới (_)';
    }

    if (!formData.name.trim()) {
      errs.name = 'Tên trang trại không được để trống';
    }

    if (!formData.farmType) {
      errs.farmType = 'Vui lòng chọn loại hình trang trại';
    }

    if (formData.totalAreaM2 === '' || formData.totalAreaM2 === null) {
      errs.totalAreaM2 = 'Tổng diện tích không được để trống';
    } else if (Number(formData.totalAreaM2) < 0) {
      errs.totalAreaM2 = 'Tổng diện tích phải lớn hơn hoặc bằng 0';
    }

    if (formData.latitude !== '' && (Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
      errs.latitude = 'Vĩ độ phải nằm trong khoảng -90 đến 90';
    }

    if (formData.longitude !== '' && (Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
      errs.longitude = 'Kinh độ phải nằm trong khoảng -180 đến 180';
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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.warning('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.info('Đã tự động lấy tọa độ GPS từ thiết bị');
      },
      (err) => {
        toast.warning('Không thể lấy tọa độ GPS: ' + err.message);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Chuẩn bị payload sạch: Tuyệt đối không gửi tenantId hoặc status
      const payload = {
        name: formData.name.trim(),
        farmType: formData.farmType,
        totalAreaM2: Number(formData.totalAreaM2),
        latitude: formData.latitude !== '' ? Number(formData.latitude) : null,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : null,
        address: formData.address.trim() || null,
        managerUserId: formData.managerUserId ? Number(formData.managerUserId) : null,
      };

      if (!isEditing) {
        payload.code = formData.code.trim().toUpperCase();
        await farmApi.createFarm(payload);
        toast.success(`Đã tạo trang trại "${payload.name}" thành công`);
      } else {
        await farmApi.updateFarm(farm.id, payload);
        toast.success(`Đã cập nhật trang trại "${payload.name}" thành công`);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        (isEditing ? 'Cập nhật trang trại thất bại' : 'Tạo mới trang trại thất bại');
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const farmTypes = [
    { value: 'CROP', label: 'Trồng trọt (Crop)', desc: 'Rau củ, hoa màu, cây ăn quả' },
    { value: 'LIVESTOCK', label: 'Chăn nuôi (Livestock)', desc: 'Bò, lợn, gia cầm theo đàn/cá thể' },
    { value: 'MIXED', label: 'Hỗn hợp (Mixed)', desc: 'Mô hình kết hợp Vườn - Ao - Chuồng' },
    { value: 'AQUACULTURE', label: 'Thủy sản (Aquaculture)', desc: 'Nuôi tôm, cá, thủy hải sản' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? '1.2.4. Cập nhật thông tin trang trại' : '1.2.1. Thêm mới trang trại'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `Mã trang trại: ${farm?.code}` : 'Khai báo thông tin trang trại mới trực thuộc doanh nghiệp'}
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

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Mã và Tên Trang Trại */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã trang trại <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                disabled={isEditing || isSubmitting}
                placeholder="VD: FARM_DALAT_01"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm font-mono uppercase transition-colors focus:outline-none focus:ring-2 ${
                  isEditing
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : errors.code
                    ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.code && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.code}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên trang trại <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="VD: Trang Trại Công Nghệ Cao Đà Lạt 01"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
                </p>
              )}
            </div>
          </div>

          {/* Loại hình trang trại (Radio Cards) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              1.2.8. Loại hình sản xuất <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {farmTypes.map((t) => {
                const isSelected = formData.farmType === t.value;
                return (
                  <label
                    key={t.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="farmType"
                      value={t.value}
                      checked={isSelected}
                      onChange={handleChange}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{t.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.farmType && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.farmType}
              </p>
            )}
          </div>

          {/* Diện tích */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              1.2.7. Tổng diện tích mặt bằng (m²) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="totalAreaM2"
                value={formData.totalAreaM2}
                onChange={handleChange}
                disabled={isSubmitting}
                min="0"
                step="0.01"
                placeholder="VD: 50000"
                className={`w-full px-3.5 py-2 pr-12 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                  errors.totalAreaM2
                    ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                m²
              </span>
            </div>
            {errors.totalAreaM2 && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.totalAreaM2}
              </p>
            )}
          </div>

          {/* Tọa độ GPS & Nút lấy tọa độ */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>1.2.6. Tọa độ GPS địa lý (Bản đồ & Chấm công)</span>
              </div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
              >
                <MapPin className="w-3.5 h-3.5" /> Lấy GPS hiện tại
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Vĩ độ (Latitude)</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  step="0.00000001"
                  placeholder="VD: 11.940419"
                  className={`w-full px-3 py-1.5 rounded-lg border text-sm bg-white ${
                    errors.latitude ? 'border-rose-300' : 'border-slate-300'
                  }`}
                />
                {errors.latitude && <p className="text-xs text-rose-500 mt-0.5">{errors.latitude}</p>}
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Kinh độ (Longitude)</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  step="0.00000001"
                  placeholder="VD: 108.458313"
                  className={`w-full px-3 py-1.5 rounded-lg border text-sm bg-white ${
                    errors.longitude ? 'border-rose-300' : 'border-slate-300'
                  }`}
                />
                {errors.longitude && <p className="text-xs text-rose-500 mt-0.5">{errors.longitude}</p>}
              </div>
            </div>
          </div>

          {/* Địa chỉ hành chính */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa chỉ hành chính chi tiết
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={2}
              placeholder="VD: Thôn Măng Lin, Phường 7, TP. Đà Lạt, Tỉnh Lâm Đồng"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>

          {/* Chỉ render nút Lưu nếu người dùng có quyền tương ứng */}
          <Can permission={isEditing ? 'PERM_FARM_UPDATE' : 'PERM_FARM_CREATE'}>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Lưu thay đổi' : 'Tạo trang trại'}</span>
            </Button>
          </Can>
        </div>
      </div>
    </div>
  );
};

export default FarmFormModal;
