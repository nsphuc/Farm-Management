import React, { useState, useEffect } from 'react';
import { X, Grid3X3, AlertCircle, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Can } from '../../../permissions/Can';
import { farmApi } from '../../../services/farmApi';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Modal Thêm mới / Cập nhật Vị trí chi tiết trong phân khu (ZoneLocation: Luống rau, Ô đất, Dãy chuồng).
 * Yêu cầu quyền PERM_ZONE_MANAGE.
 */
export const LocationFormModal = ({ isOpen, farmId, zoneId, location = null, onClose, onSuccess }) => {
  const isEditing = Boolean(location?.id);

  const initialForm = {
    code: '',
    name: '',
    description: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location) {
      setFormData({
        code: location.code || '',
        name: location.name || '',
        description: location.description || '',
      });
    } else {
      setFormData(initialForm);
    }
    setErrors({});
  }, [location, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};

    if (!isEditing && !formData.code.trim()) {
      errs.code = 'Mã vị trí không được để trống';
    } else if (!isEditing && !/^[A-Za-z0-9_-]+$/.test(formData.code.trim())) {
      errs.code = 'Mã vị trí chỉ bao gồm chữ, số, dấu gạch nối (-) hoặc gạch dưới (_)';
    }

    if (!formData.name.trim()) {
      errs.name = 'Tên vị trí không được để trống';
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
        description: formData.description.trim() || null,
      };

      if (!isEditing) {
        payload.code = formData.code.trim().toUpperCase();
        await farmApi.createLocation(farmId, zoneId, payload);
        toast.success(`Đã tạo vị trí "${payload.name}" thành công`);
      } else {
        await farmApi.updateLocation(farmId, zoneId, location.id, payload);
        toast.success(`Đã cập nhật vị trí "${payload.name}" thành công`);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        (isEditing ? 'Cập nhật vị trí thất bại' : 'Tạo mới vị trí thất bại');
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Cập nhật vị trí canh tác' : '1.3.2 / 1.3.3. Thêm mới vị trí'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `Mã vị trí: ${location?.code}` : 'Định danh luống rau, ô đất, dãy chuồng trong phân khu'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mã vị trí <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              disabled={isEditing || isSubmitting}
              placeholder="VD: LOC_BED_01, LOC_BARN_A1"
              className={`w-full px-3.5 py-2 rounded-lg border text-sm font-mono uppercase transition-colors focus:outline-none focus:ring-2 ${
                isEditing
                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                  : errors.code
                  ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/30'
                  : 'border-slate-300 focus:ring-violet-500/20 focus:border-violet-500'
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
              Tên vị trí <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="VD: Luống Dưa Lưới Số 01, Ô Đất Cải Bó Xôi"
              className={`w-full px-3.5 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/30'
                  : 'border-slate-300 focus:ring-violet-500/20 focus:border-violet-500'
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
              Mô tả chi tiết / Ghi chú vị trí
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={2}
              placeholder="VD: Dãy chuồng phía đông, giàn thủy canh tầng 2..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
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
              className="gap-2 bg-violet-600 hover:bg-violet-700 focus:ring-violet-500"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Lưu thay đổi' : 'Tạo vị trí'}</span>
            </Button>
          </Can>
        </div>
      </div>
    </div>
  );
};

export default LocationFormModal;
