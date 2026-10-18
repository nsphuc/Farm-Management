import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { operationalCycleApi } from '../../../services/operationalCycleApi';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Modal Thêm mới / Cập nhật Chu kỳ vận hành & Năm tài chính.
 * Cung cấp DatePicker cho startDate và endDate, bắt lỗi 400 khi endDate < startDate và hiển thị Toast đỏ cảnh báo.
 */
export const OperationalCycleFormModal = ({ isOpen, onClose, farmId, farmName, cycle = null, onSuccess }) => {
  const isEditing = !!cycle;

  // State biểu mẫu
  const [formData, setFormData] = useState({
    name: '',
    fiscalYear: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    status: 'PLANNING',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Điền dữ liệu khi chỉnh sửa
  useEffect(() => {
    if (cycle) {
      setFormData({
        name: cycle.name || '',
        fiscalYear: cycle.fiscalYear || new Date().getFullYear(),
        startDate: cycle.startDate || '',
        endDate: cycle.endDate || '',
        status: cycle.status || 'PLANNING',
      });
    } else {
      const currentYear = new Date().getFullYear();
      setFormData({
        name: '',
        fiscalYear: currentYear,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-06-30`,
        status: 'PLANNING',
      });
    }
    setErrors({});
  }, [cycle, isOpen]);

  if (!isOpen) return null;

  // Validate form client-side
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên chu kỳ không được để trống';
    } else if (formData.name.trim().length > 150) {
      newErrors.name = 'Tên chu kỳ tối đa 150 ký tự';
    }

    if (!formData.fiscalYear || Number(formData.fiscalYear) < 2000) {
      newErrors.fiscalYear = 'Năm tài chính phải từ năm 2000 trở đi';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày bắt đầu chu kỳ';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Vui lòng chọn ngày kết thúc chu kỳ';
    }

    // Bắt buộc kiểm tra ngày kết thúc >= ngày bắt đầu
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isDateRangeInvalid = Boolean(
    formData.startDate && formData.endDate && formData.endDate < formData.startDate
  );
  const isClosed = Boolean(isEditing && cycle?.status === 'CLOSED');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (next.startDate && next.endDate && next.endDate < next.startDate) {
        setErrors((prevErr) => ({
          ...prevErr,
          endDate: 'Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!',
        }));
      } else {
        setErrors((prevErr) => {
          const updated = { ...prevErr, [name]: null };
          if (name === 'startDate' || name === 'endDate') {
            delete updated.endDate;
          }
          return updated;
        });
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isClosed) {
      toast.error('Chu kỳ vận hành này đã đóng (CLOSED), không thể chỉnh sửa dữ liệu!', 'Thao tác bị chặn');
      return;
    }
    if (!validateForm() || isDateRangeInvalid) {
      // Cảnh báo người dùng nếu ngày kết thúc < ngày bắt đầu
      if (isDateRangeInvalid) {
        toast.error('Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!', 'Lỗi ngày tháng');
      }
      return;
    }

    if (!farmId) {
      toast.error('Chưa xác định trang trại ngữ cảnh!', 'Thiếu thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        // Cập nhật chu kỳ
        await operationalCycleApi.updateCycle(farmId, cycle.id, {
          name: formData.name.trim(),
          fiscalYear: Number(formData.fiscalYear),
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
        });
        toast.success(`Cập nhật chu kỳ "${formData.name}" thành công!`);
      } else {
        // Tạo mới chu kỳ
        await operationalCycleApi.createCycle(farmId, {
          name: formData.name.trim(),
          fiscalYear: Number(formData.fiscalYear),
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
        toast.success(`Tạo mới chu kỳ "${formData.name}" thành công!`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu chu kỳ vận hành:', err);
      // Bắt lỗi Validate từ API (mã 400 Bad Request do sai ngày tháng hoặc conflict) và hiển thị Toast màu Đỏ cảnh báo
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Không thể lưu chu kỳ vận hành. Vui lòng kiểm tra lại ngày tháng.';
      toast.error(serverMsg, 'Lỗi kiểm tra dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Cập nhật chu kỳ vận hành' : 'Tạo mới chu kỳ vận hành'}
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
          {isClosed && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Chu kỳ vận hành đã ĐÓNG (CLOSED)</p>
                <p className="mt-0.5 text-amber-700">Theo Hiến pháp nghiệp vụ (Điều 8.2), chu kỳ đã đóng sổ không thể chỉnh sửa để bảo toàn tính toàn vẹn của dữ liệu kế toán và nhật ký sản xuất.</p>
              </div>
            </div>
          )}

          {/* Tên chu kỳ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên chu kỳ vận hành / Vụ mùa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              disabled={isClosed}
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Vụ Đông Xuân 2026 - Lô A, Đợt nuôi heo giống Q1"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                errors.name
                  ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
              } ${isClosed ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''} focus:outline-none focus:ring-2`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Năm tài chính */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Năm tài chính (Fiscal Year) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="2000"
                name="fiscalYear"
                disabled={isClosed}
                value={formData.fiscalYear}
                onChange={handleChange}
                placeholder="VD: 2026"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                  errors.fiscalYear
                    ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } ${isClosed ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''} focus:outline-none focus:ring-2`}
              />
              {errors.fiscalYear && <p className="text-xs text-rose-500 mt-1">{errors.fiscalYear}</p>}
            </div>

            {/* Trạng thái chu kỳ khi edit */}
            {isEditing && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Trạng thái chu kỳ <span className="text-rose-500">*</span>
                </label>
                <select
                  name="status"
                  disabled={isClosed}
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none text-sm transition-colors ${
                    isClosed ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
                  }`}
                >
                  <option value="PLANNING">Lên kế hoạch (PLANNING)</option>
                  <option value="ACTIVE">Đang canh tác / Nuôi (ACTIVE)</option>
                  <option value="CLOSED">Đã kết thúc / Đóng vụ (CLOSED)</option>
                </select>
              </div>
            )}
          </div>

          {/* DatePicker cho Ngày bắt đầu & Ngày kết thúc */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Ngày bắt đầu <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                disabled={isClosed}
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  errors.startDate
                    ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } ${isClosed ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''} focus:outline-none focus:ring-2`}
              />
              {errors.startDate && <p className="text-xs text-rose-500 mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Ngày kết thúc <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                disabled={isClosed}
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  errors.endDate || isDateRangeInvalid
                    ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } ${isClosed ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''} focus:outline-none focus:ring-2`}
              />
              {(errors.endDate || isDateRangeInvalid) && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.endDate || 'Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!'}
                </p>
              )}
            </div>

            <div className="col-span-full">
              <p className="text-[11px] text-slate-500 italic">
                * Quy tắc nghiệp vụ: Ngày kết thúc chu kỳ bắt buộc phải lớn hơn hoặc bằng ngày bắt đầu. Nút gửi sẽ bị khóa nếu ngày kết thúc &lt; ngày bắt đầu.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting || isDateRangeInvalid || isClosed}
              className={isDateRangeInvalid || isClosed ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isEditing ? 'Cập nhật chu kỳ' : 'Lưu chu kỳ'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OperationalCycleFormModal;
