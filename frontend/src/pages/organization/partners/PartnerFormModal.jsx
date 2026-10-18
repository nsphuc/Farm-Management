import React, { useState, useEffect } from 'react';
import { X, Building, User, Phone, Mail, MapPin, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { partnerApi } from '../../../services/partnerApi';
import { toast } from '../../../store/ui/useToastStore';

const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
const EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})$/;

/**
 * Modal Thêm mới / Cập nhật Đối tác (Workspace D / Module 1.6).
 * Tuân thủ Hiến pháp:
 * - 2 Checkbox song song: "Là Nhà cung cấp" và "Là Khách hàng"
 * - Auto-ID: Mã tự sinh (NCC-[00X] / KH-[00X] / DT-[00X])
 * - Validate Phone VN Regex & Email RFC 5322 Regex
 * - Bắt lỗi trùng lặp mã số thuế (tax_code)
 */
export const PartnerFormModal = ({ isOpen, onClose, partner = null, onSuccess }) => {
  const isEditing = !!partner;

  // State biểu mẫu
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    isSupplier: true,
    isBuyer: false,
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxCode: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Điền dữ liệu khi cập nhật
  useEffect(() => {
    if (partner) {
      const isSup = partner.isSupplier ?? (partner.partnerType === 'SUPPLIER' || partner.partnerType === 'AGENT');
      const isBuy = partner.isBuyer ?? (partner.partnerType === 'BUYER' || partner.partnerType === 'AGENT');
      setFormData({
        code: partner.code || '',
        name: partner.name || '',
        isSupplier: isSup,
        isBuyer: isBuy,
        contactPerson: partner.contactPerson || partner.contactName || '',
        phone: partner.phone || '',
        email: partner.email || '',
        address: partner.address || '',
        taxCode: partner.taxCode || '',
        notes: partner.notes || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        isSupplier: true,
        isBuyer: false,
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        taxCode: '',
        notes: '',
      });
    }
    setErrors({});
  }, [partner, isOpen]);

  if (!isOpen) return null;

  // Validate form client-side
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên đối tác không được để trống';
    } else if (formData.name.trim().length > 150) {
      newErrors.name = 'Tên đối tác tối đa 150 ký tự';
    }

    if (!formData.isSupplier && !formData.isBuyer) {
      newErrors.role = 'Phải chọn ít nhất một vai trò (Là Nhà cung cấp hoặc Là Khách hàng)';
    }

    if (formData.phone && !PHONE_REGEX.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (Phải là số điện thoại Việt Nam 10 chữ số hợp lệ)';
    }

    if (formData.email && !EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = 'Địa chỉ email không đúng định dạng chuẩn (VD: user@greenfarm.vn)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if ((name === 'isSupplier' || name === 'isBuyer') && errors.role) {
      setErrors((prev) => ({ ...prev, role: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        isSupplier: formData.isSupplier,
        isBuyer: formData.isBuyer,
        contactPerson: formData.contactPerson.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        taxCode: formData.taxCode.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (isEditing) {
        // Cập nhật thông tin đối tác
        await partnerApi.updatePartner(partner.id, {
          ...payload,
          status: partner.status || 'ACTIVE',
        });
        toast.success(`Cập nhật đối tác "${formData.name}" thành công!`);
      } else {
        // Tạo mới đối tác (Mã tự sinh nếu để trống)
        await partnerApi.createPartner({
          code: formData.code.trim() ? formData.code.trim().toUpperCase() : null,
          ...payload,
        });
        toast.success(`Tạo mới đối tác "${formData.name}" thành công!`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu đối tác:', err);
      // Bắt thông báo lỗi chi tiết từ Backend (VD: 409 trùng mã số thuế / mã đối tác)
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Không thể lưu thông tin đối tác. Vui lòng kiểm tra lại.';
      toast.error(serverMsg, 'Lỗi thao tác đối tác');
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
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Cập nhật thông tin đối tác' : 'Thêm mới đối tác thương mại'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `Mã đối tác: ${partner.code}`
                  : 'Workspace D (1.6): Danh bạ Nhà cung cấp & Khách hàng thu mua'}
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
          {/* 1. Phân loại vai trò (2 Checkbox song song) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Phân loại vai trò đối tác <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 italic">Cho phép tích chọn cả hai vai trò</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="isSupplier"
                  checked={formData.isSupplier}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span>Là Nhà cung cấp (Vật tư, Giống, Phân bón)</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="isBuyer"
                  checked={formData.isBuyer}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span>Là Khách hàng (Thương lái, Siêu thị, Đại lý)</span>
              </label>
            </div>
            {errors.role && (
              <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.role}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mã đối tác (Tự sinh) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Mã đối tác</span>
                <span className="text-[11px] text-emerald-600 font-normal flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-ID
                </span>
              </label>
              <input
                type="text"
                name="code"
                disabled={isEditing}
                value={formData.code}
                onChange={handleChange}
                placeholder={isEditing ? formData.code : 'Hệ thống tự cấp (NCC-00X / KH-00X)'}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono uppercase transition-colors ${
                  isEditing
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } focus:outline-none focus:ring-2`}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {isEditing ? 'Mã cố định bảo toàn chứng từ' : 'Để trống để hệ thống tự cấp theo phân loại'}
              </p>
            </div>

            {/* Mã số thuế */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã số thuế doanh nghiệp
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="taxCode"
                  value={formData.taxCode}
                  onChange={handleChange}
                  placeholder="VD: 0101234567"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Hệ thống sẽ kiểm tra chống trùng lặp MST</p>
            </div>
          </div>

          {/* Tên đối tác */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên đối tác / Tên pháp nhân <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Công ty CP Tập đoàn Giống cây trồng Việt Nam"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                errors.name
                  ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
              } focus:outline-none focus:ring-2`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Người liên hệ & Số điện thoại */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Người liên hệ đại diện
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="VD: Nguyễn Văn Đại"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="VD: 0908123456"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                    errors.phone
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Email & Địa chỉ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="VD: contact@vinaseed.com.vn"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                    errors.email
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Địa chỉ trụ sở / Kho giao nhận
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="VD: Số 1 Lương Định Của, Đống Đa, Hà Nội"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú & Điều khoản hợp tác
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="VD: Hợp đồng nguyên tắc cung ứng giống dưa lưới vụ Thu 2026..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Cập nhật đối tác' : 'Lưu đối tác'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerFormModal;
