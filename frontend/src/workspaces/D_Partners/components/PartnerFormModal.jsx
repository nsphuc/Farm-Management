import React, { useState, useEffect } from 'react';
import { Contact, AlertTriangle, Building, CreditCard, Shield, QrCode } from 'lucide-react';
import { partnerService } from '@/services/modules/partnerService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { extractApiErrors, VIETNAM_BANKS } from '@/utils/apiHelpers';

const PARTNER_TYPES = [
  { value: 'SUPPLIER', label: 'SUPPLIER - Nhà Cung Cấp Vật Tư / Giống' },
  { value: 'BUYER', label: 'BUYER - Khách Hàng / Doanh Nghiệp / Thương Lái Thu Mua' },
  { value: 'LOGISTICS', label: 'LOGISTICS - Đơn Vị Vận Chuyển / Hậu Cần' },
  { value: 'AGENT', label: 'AGENT - Đại Lý Hai Chiều (Vừa Cung Cấp Vừa Thu Mua)' },
];

const CREDIT_RATINGS = [
  { value: 'A', label: 'Hạng A - Uy tín cao, rủi ro nợ thấp' },
  { value: 'B', label: 'Hạng B - Uy tín trung bình, kiểm soát hạn mức' },
  { value: 'C', label: 'Hạng C - Rủi ro nợ cao, thanh toán ngay' },
];

export function PartnerFormModal({
  isOpen,
  onClose,
  editingItem = null,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    partnerType: 'SUPPLIER',
    taxCode: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0,
    paymentTermDays: 30,
    creditRating: 'A',
    bankBin: '970422',
    bankName: 'MBBank - Ngân hàng Quân Đội',
    bankAccountNo: '',
    bankAccountName: '',
    notes: '',
  });

  const [isDualRole, setIsDualRole] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setGeneralError('');

    if (editingItem) {
      setFormData({
        code: editingItem.code || '',
        name: editingItem.name || '',
        partnerType: editingItem.partnerType || 'SUPPLIER',
        taxCode: editingItem.taxCode || '',
        contactPerson: editingItem.contactPerson || '',
        phone: editingItem.phone || '',
        email: editingItem.email || '',
        address: editingItem.address || '',
        creditLimit: editingItem.creditLimit ?? 0,
        paymentTermDays: editingItem.paymentTermDays ?? 30,
        creditRating: editingItem.creditRating || 'A',
        bankBin: editingItem.bankBin || '970422',
        bankName: editingItem.bankName || 'MBBank - Ngân hàng Quân Đội',
        bankAccountNo: editingItem.bankAccountNo || '',
        bankAccountName: editingItem.bankAccountName || '',
        notes: editingItem.notes || '',
      });
      setIsDualRole(editingItem.partnerType === 'AGENT');
    } else {
      setFormData({
        code: '',
        name: '',
        partnerType: 'SUPPLIER',
        taxCode: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        creditLimit: 0,
        paymentTermDays: 30,
        creditRating: 'A',
        bankBin: '970422',
        bankName: 'MBBank - Ngân hàng Quân Đội',
        bankAccountNo: '',
        bankAccountName: '',
        notes: '',
      });
      setIsDualRole(false);
    }
  }, [isOpen, editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'code'
          ? value.toUpperCase()
          : name === 'bankAccountName'
          ? value.toUpperCase()
          : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBankChange = (e) => {
    const bin = e.target.value;
    const foundBank = VIETNAM_BANKS.find((b) => b.bin === bin);
    setFormData((prev) => ({
      ...prev,
      bankBin: bin,
      bankName: foundBank ? foundBank.name : prev.bankName,
    }));
  };

  const handleDualRoleToggle = (checked) => {
    setIsDualRole(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, partnerType: 'AGENT' }));
    } else {
      setFormData((prev) => ({ ...prev, partnerType: 'SUPPLIER' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Tên đối tác không được để trống';

    // Validate taxCode nếu nhập: 10 hoặc 13 số
    if (formData.taxCode?.trim()) {
      const cleanTax = formData.taxCode.trim().replace(/[-\s]/g, '');
      if (!/^\d{10}(\d{3})?$/.test(cleanTax)) {
        errors.taxCode = 'Mã số thuế phải gồm 10 hoặc 13 chữ số';
      }
    }

    // Validate phone VN nếu nhập
    if (formData.phone?.trim()) {
      const cleanPhone = formData.phone.trim();
      if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(cleanPhone)) {
        errors.phone = 'Số điện thoại không đúng định dạng số di động Việt Nam';
      }
    }

    if (Number(formData.creditLimit) < 0) {
      errors.creditLimit = 'Hạn mức tín dụng phải lớn hơn hoặc bằng 0';
    }

    if (Number(formData.paymentTermDays) < 0) {
      errors.paymentTermDays = 'Thời hạn nợ phải lớn hơn hoặc bằng 0 ngày';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const payload = {
        ...formData,
        code: formData.code?.trim() ? formData.code.trim().toUpperCase() : null,
        name: formData.name.trim(),
        creditLimit: Number(formData.creditLimit),
        paymentTermDays: Number(formData.paymentTermDays),
        bankBin: formData.bankBin || null,
        bankName: formData.bankName || null,
        bankAccountNo: formData.bankAccountNo?.trim() || null,
        bankAccountName: formData.bankAccountName?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      if (editingItem) {
        await partnerService.updatePartner(editingItem.id, payload);
      } else {
        await partnerService.createPartner(payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setFieldErrors(errInfo.fieldErrors);
      setGeneralError(errInfo.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Cập Nhật Hồ Sơ Đối Tác' : 'Thêm Mới Đối Tác Thương Mại'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSubmit}>
            {editingItem ? 'Lưu Thay Đổi' : 'Tạo Đối Tác'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {generalError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* 1. Phân loại & Pháp lý */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Building className="h-4 w-4 text-indigo-600" />
              1. Thông Tin Định Danh & Phân Loại
            </div>

            {/* Checkbox Đại lý hai chiều AGENT */}
            <label className="flex items-center gap-2 text-xs font-semibold text-indigo-700 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg">
              <input
                type="checkbox"
                checked={isDualRole}
                onChange={(e) => handleDualRoleToggle(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Vừa Cung Cấp Vừa Thu Mua (Đại Lý Hai Chiều)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Phân Loại Đối Tác" required error={fieldErrors.partnerType}>
              <Select
                name="partnerType"
                value={formData.partnerType}
                onChange={handleChange}
                options={PARTNER_TYPES}
                disabled={isDualRole}
              />
            </FormField>

            <FormField label="Mã Đối Tác (Để trống tự sinh)" error={fieldErrors.code}>
              <Input
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="VD: NCC-PHAN-01"
                className="font-mono font-bold"
              />
            </FormField>

            <FormField label="Mã Số Thuế (10 hoặc 13 số)" error={fieldErrors.taxCode}>
              <Input
                name="taxCode"
                value={formData.taxCode}
                onChange={handleChange}
                placeholder="VD: 0312345678"
                className="font-mono"
              />
            </FormField>
          </div>

          <FormField label="Tên Đơn Vị / Đối Tác Thương Mại" required error={fieldErrors.name}>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Công ty TNHH Vật Tư Nông Nghiệp Miền Đông"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Người Đại Diện / Liên Hệ" error={fieldErrors.contactPerson}>
              <Input
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="VD: Anh Trần Tuấn"
              />
            </FormField>

            <FormField label="Số Điện Thoại" error={fieldErrors.phone}>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="VD: 0987654321"
              />
            </FormField>

            <FormField label="Email" error={fieldErrors.email}>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@doitac.vn"
              />
            </FormField>
          </div>

          <FormField label="Địa Chỉ Trụ Sở / Kho Hàng">
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="VD: 123 Quốc Lộ 20, Huyện Đức Trọng, Tỉnh Lâm Đồng"
            />
          </FormField>
        </div>

        {/* 2. Chính sách tín dụng & Công nợ */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            2. Chính Sách Tín Dụng & Thời Hạn Thanh Toán
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Hạn Mức Tín Dụng (VNĐ)" error={fieldErrors.creditLimit}>
              <Input
                type="number"
                min="0"
                step="500000"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Thời Hạn Nợ (Số Ngày)" error={fieldErrors.paymentTermDays}>
              <Input
                type="number"
                min="0"
                name="paymentTermDays"
                value={formData.paymentTermDays}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Xếp Hạng Tín Nhiệm" error={fieldErrors.creditRating}>
              <Select
                name="creditRating"
                value={formData.creditRating}
                onChange={handleChange}
                options={CREDIT_RATINGS}
              />
            </FormField>
          </div>
        </div>

        {/* 3. Ngân hàng Napas247 & VietQR */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
            <QrCode className="h-4 w-4 text-blue-600" />
            3. Tài Khoản Ngân Hàng Thụ Hưởng Của Đối Tác (VietQR Napas 24/7)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <FormField label="Ngân Hàng Đối Tác">
                <Select
                  name="bankBin"
                  value={formData.bankBin}
                  onChange={handleBankChange}
                  options={VIETNAM_BANKS.map((b) => ({
                    value: b.bin,
                    label: `${b.code} - ${b.name}`,
                  }))}
                />
              </FormField>
            </div>

            <div className="sm:col-span-3">
              <FormField label="Số Tài Khoản">
                <Input
                  name="bankAccountNo"
                  value={formData.bankAccountNo}
                  onChange={handleChange}
                  placeholder="VD: 1903..."
                  className="font-mono"
                />
              </FormField>
            </div>

            <div className="sm:col-span-4">
              <FormField label="Tên Chủ Tài Khoản">
                <Input
                  name="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                  placeholder="VD: NGUYEN VAN A"
                  className="font-mono font-bold"
                />
              </FormField>
            </div>
          </div>
        </div>

        <FormField label="Ghi Chú Về Đối Tác">
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Ghi chú thêm về điều khoản giao hàng, chiết khấu thương mại..."
          />
        </FormField>
      </form>
    </Modal>
  );
}
export default PartnerFormModal;
