import React, { useState, useEffect } from 'react';
import { X, Building, User, Phone, Mail, MapPin, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { partnerApi } from '../../../services/partnerApi';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Modal Thêm mới / Cập nhật Đối tác (Nhà cung cấp, Khách hàng, Logistics, Đại lý).
 * Thuộc chức năng 1.6 trong Sơ đồ phân cấp chức năng.
 */
export const PartnerFormModal = ({ isOpen, onClose, partner = null, onSuccess }) => {
  const isEditing = !!partner;

  // State biểu mẫu
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    partnerType: 'SUPPLIER',
    contactName: '',
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
      setFormData({
        code: partner.code || '',
        name: partner.name || '',
        partnerType: partner.partnerType || 'SUPPLIER',
        contactName: partner.contactName || '',
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
        partnerType: 'SUPPLIER',
        contactName: '',
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

    if (!isEditing && !formData.code.trim()) {
      newErrors.code = 'Mã đối tác không được để trống';
    } else if (!isEditing && formData.code.trim().length > 50) {
      newErrors.code = 'Mã đối tác tối đa 50 ký tự';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên đối tác không được để trống';
    } else if (formData.name.trim().length > 150) {
      newErrors.name = 'Tên đối tác tối đa 150 ký tự';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
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
      if (isEditing) {
        // Cập nhật thông tin đối tác
        await partnerApi.updatePartner(partner.id, {
          name: formData.name.trim(),
          contactName: formData.contactName.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          taxCode: formData.taxCode.trim() || null,
          notes: formData.notes.trim() || null,
        });
        toast.success(`Cập nhật đối tác "${formData.name}" thành công!`);
      } else {
        // Tạo mới đối tác
        await partnerApi.createPartner({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          partnerType: formData.partnerType,
          contactName: formData.contactName.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          taxCode: formData.taxCode.trim() || null,
          notes: formData.notes.trim() || null,
        });
        toast.success(`Tạo mới đối tác "${formData.name}" thành công!`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu đối tác:', err);
      // Bắt thông báo lỗi chi tiết từ Backend (VD: Mã lỗi 400 enum không hợp lệ hoặc 409 trùng mã)
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Không thể lưu thông tin đối tác. Vui lòng kiểm tra lại.';
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
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Cập nhật thông tin đối tác' : 'Thêm mới đối tác'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `Mã đối tác: ${partner.code} — Phân loại: ${partner.partnerType}`
                  : '1.6. Quản lý Nhà cung cấp, Khách hàng tiêu thụ và Logistics'}
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
            {/* Mã đối tác */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã đối tác {!isEditing && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                name="code"
                disabled={isEditing}
                value={formData.code}
                onChange={handleChange}
                placeholder="VD: NCC-VINASEED, KH-BIGC"
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

            {/* Phân loại đối tác */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phân loại đối tác <span className="text-rose-500">*</span>
              </label>
              <select
                name="partnerType"
                disabled={isEditing}
                value={formData.partnerType}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                  isEditing
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                } focus:outline-none focus:ring-2`}
              >
                <option value="SUPPLIER">Nhà cung cấp (Vật tư, Giống, Phân bón)</option>
                <option value="BUYER">Khách hàng tiêu thụ (Đầu ra nông sản)</option>
                <option value="LOGISTICS">Đơn vị vận chuyển / Logistics</option>
                <option value="AGENT">Đại lý / Nhà phân phối</option>
              </select>
            </div>
          </div>

          {/* Tên đối tác */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên đối tác / Doanh nghiệp <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Công ty Cổ phần Giống cây trồng Trung ương"
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
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="VD: Nguyễn Văn A"
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
                  placeholder="VD: 0987654321"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Email & Mã số thuế */}
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
            </div>
          </div>

          {/* Địa chỉ */}
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
              placeholder="VD: Chiết khấu 5% khi thanh toán trong 15 ngày..."
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
