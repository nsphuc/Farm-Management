import React, { useState, useEffect } from 'react';
import { Contact, AlertTriangle, Building, CreditCard, Shield, QrCode, Lock, CheckCircle2 } from 'lucide-react';
import { partnerService } from '@/services/modules/partnerService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea, CodeInput } from '@/components/ui/FormControls';
import { extractApiErrors, VIETNAM_BANKS } from '@/utils/apiHelpers';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';

const PARTNER_TYPES = [
  { value: 'SUPPLIER', label: 'SUPPLIER - Nhà Cung Cấp Vật Tư / Giống' },
  { value: 'BUYER', label: 'BUYER - Khách Hàng / Thương Lái Thu Mua' },
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
  const { isOwner, isFarmManager } = useAuthStore();
  const { activeFarmId, activeFarm, farms, notifyDataChanged } = useActiveFarmStore();
  const owner = isOwner();
  const farmManager = isFarmManager();
  const canEditCredit = Boolean(owner || farmManager);

  const [formData, setFormData] = useState({
    farmId: '',
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
        farmId: editingItem.farmId != null ? String(editingItem.farmId) : '',
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
        notes: editingItem.notes || editingItem.bankAccountInfo || '',
      });
      setIsDualRole(editingItem.partnerType === 'AGENT');
    } else {
      const defaultFarmId = !owner && activeFarmId && activeFarmId !== 'ALL'
        ? String(activeFarmId)
        : '';

      setFormData({
        farmId: defaultFarmId,
        code: generateEntityCode(CODE_PREFIXES.PARTNER),
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
  }, [isOpen, editingItem, owner, activeFarmId]);

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

    if (!formData.name?.trim()) errors.name = 'Tên đối tác không được để trống';
    if (!formData.contactPerson?.trim()) errors.contactPerson = 'Người liên hệ không được để trống';

    // Validate phone VN bắt buộc
    if (!formData.phone?.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
    } else {
      const cleanPhone = formData.phone.trim();
      if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(cleanPhone)) {
        errors.phone = 'Số điện thoại không đúng định dạng số di động Việt Nam (10 chữ số)';
      }
    }

    // Validate taxCode nếu nhập: 10 hoặc 13 số
    if (formData.taxCode?.trim()) {
      const cleanTax = formData.taxCode.trim().replace(/[-\s]/g, '');
      if (!/^\d{10}(\d{3})?$/.test(cleanTax)) {
        errors.taxCode = 'Mã số thuế phải gồm 10 hoặc 13 chữ số';
      }
    }

    // Validate email nếu nhập
    if (formData.email?.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.email = 'Email không hợp lệ';
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

      // Đối với FARM_MANAGER: farmId bắt buộc là activeFarmId, creditLimit bắt buộc là 0
      let resolvedFarmId = null;
      if (owner) {
        resolvedFarmId = formData.farmId ? Number(formData.farmId) : null;
      } else {
        resolvedFarmId = activeFarmId && activeFarmId !== 'ALL'
          ? Number(activeFarmId)
          : editingItem?.farmId || null;
      }

      const payload = {
        ...formData,
        farmId: resolvedFarmId,
        code: formData.code?.trim() ? formData.code.trim().toUpperCase() : null,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        creditLimit: owner
          ? Number(formData.creditLimit)
          : editingItem
          ? Number(editingItem.creditLimit) || 0
          : 0,
        paymentTermDays: Number(formData.paymentTermDays),
        bankBin: formData.bankBin || null,
        bankName: formData.bankName || null,
        bankAccountNo: formData.bankAccountNo?.trim() || null,
        bankAccountName: formData.bankAccountName?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      if (editingItem) {
        await partnerService.updatePartner(editingItem.id, payload);
        toast.success(`Cập nhật thông tin đối tác "${payload.name}" thành công!`);
      } else {
        await partnerService.createPartner(payload);
        toast.success(`Thêm mới đối tác "${payload.name}" cho trang trại thành công!`);
      }

      // Kích hoạt bus đồng bộ liên Workspace để WS-C và WS-H2 nhận tức thì
      await notifyDataChanged?.('partners');
      onSuccess?.();
      onClose();
    } catch (err) {
      const errMsg = applyServerFieldErrors(err, setFieldErrors);
      setGeneralError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Tên trang trại hiển thị cho FARM_MANAGER
  const farmDisplayName = activeFarm?.name || (activeFarmId ? `Trang trại #${activeFarmId}` : 'Trang trại hiện tại');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Cập Nhật Hồ Sơ Đối Tác' : 'Thêm Mới Đối Tác Cho Trang Trại'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Hủy Bỏ
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSubmit}>
            {editingItem ? 'Lưu Thay Đổi' : 'Lưu Đối Tác'}
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
              <Building className="h-4 w-4 text-emerald-600" />
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
            {/* Ô Trang trại quản lý (farmId) */}
            <FormField
              label="Trang Trại Quản Lý"
              required={!owner}
              error={fieldErrors.farmId}
              hint={!owner ? 'Tự động gán cứng theo trang trại bạn đang điều hành' : 'Chọn trang trại hoặc dùng chung toàn chuỗi'}
            >
              {!owner ? (
                <div className="relative">
                  <Input
                    value={farmDisplayName}
                    readOnly
                    disabled
                    className="bg-slate-100 text-slate-700 font-semibold cursor-not-allowed pl-8"
                  />
                  <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-emerald-600" />
                  <Lock className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              ) : (
                <Select
                  name="farmId"
                  value={formData.farmId}
                  onChange={handleChange}
                  options={[
                    { value: '', label: '🌐 Dùng chung toàn chuỗi (Toàn hệ thống)' },
                    ...(farms || []).map((f) => ({
                      value: String(f.id),
                      label: `🏢 ${f.name} (${f.code})`,
                    })),
                  ]}
                />
              )}
            </FormField>

            {/* Ô Phân loại đối tác */}
            <FormField label="Loại Đối Tác" required error={fieldErrors.partnerType}>
              <Select
                name="partnerType"
                value={formData.partnerType}
                onChange={handleChange}
                options={PARTNER_TYPES}
                disabled={isDualRole}
              />
            </FormField>

            {/* Ô Mã đối tác (code) */}
            <FormField
              label="Mã Đối Tác"
              error={fieldErrors.code}
              hint={editingItem ? 'Khóa cứng bất biến' : 'Mã tự sinh dạng PRT-YYMM-XXXX'}
            >
              <CodeInput
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                onRegenerate={() => setFormData((prev) => ({ ...prev, code: generateEntityCode(CODE_PREFIXES.PARTNER) }))}
                isEditMode={Boolean(editingItem)}
                error={fieldErrors.code}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Tên Đơn Vị / Đối Tác Thương Mại" required error={fieldErrors.name}>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="VD: Công ty TNHH Giống Cây Trồng Miền Đông"
                />
              </FormField>
            </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Người Liên Hệ / Đại Diện" required error={fieldErrors.contactPerson}>
              <Input
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="VD: Anh Nguyễn Văn An"
              />
            </FormField>

            <FormField label="Số Điện Thoại" required error={fieldErrors.phone} hint="Định dạng số di động Việt Nam">
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="VD: 0987654321"
                className="font-mono"
              />
            </FormField>

            <FormField label="Email Liên Hệ" error={fieldErrors.email}>
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
              placeholder="VD: 123 Quốc Lộ 1A, Phường Suối Hoa, TP. Bắc Ninh"
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
            <FormField
              label="Hạn Mức Tín Dụng (VNĐ)"
              error={fieldErrors.creditLimit}
            >
              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="500000"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    disabled={!canEditCredit}
                    className={!canEditCredit ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-mono pr-8' : 'font-mono'}
                  />
                  {!canEditCredit && <Lock className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />}
                </div>

                {/* Chú thích dành riêng cho Kế toán (Maker) */}
                {!canEditCredit && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800 flex items-start gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Hạn mức tín dụng ban đầu là 0 VNĐ. Giám đốc trang trại hoặc Chủ đầu tư sẽ thẩm định và phê duyệt hạn mức nợ cho đối tác.
                    </span>
                  </div>
                )}

                {canEditCredit && (
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-500 text-[10px]">Duyệt nhanh:</span>
                    {[0, 20000000, 50000000, 100000000, 500000000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, creditLimit: val }))}
                        className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        {val === 0 ? '0 ₫' : `${val / 1000000}M`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
