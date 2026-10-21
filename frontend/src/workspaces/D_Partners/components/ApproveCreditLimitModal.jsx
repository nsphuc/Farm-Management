import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Building,
  Save,
  AlertTriangle,
  Clock,
  Award,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { partnerService } from '@/services/modules/partnerService';
import { formatCurrency } from '@/utils/formatters';
import { extractApiErrors } from '@/utils/apiHelpers';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

const CREDIT_RATINGS = [
  { value: 'A', label: 'Hạng A - Uy tín cao, rủi ro nợ thấp' },
  { value: 'B', label: 'Hạng B - Uy tín trung bình, kiểm soát hạn mức' },
  { value: 'C', label: 'Hạng C - Rủi ro nợ cao, khuyến nghị tiền mặt' },
  { value: 'UNRATED', label: 'UNRATED - Chưa xếp hạng tín nhiệm' },
];

export function ApproveCreditLimitModal({
  isOpen,
  onClose,
  partner,
  onSuccess,
}) {
  const { notifyDataChanged } = useActiveFarmStore();
  const [creditLimit, setCreditLimit] = useState(0);
  const [paymentTermDays, setPaymentTermDays] = useState(30);
  const [creditRating, setCreditRating] = useState('A');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !partner) return;
    setCreditLimit(partner.creditLimit ?? 0);
    setPaymentTermDays(partner.paymentTermDays ?? 30);
    setCreditRating(partner.creditRating || 'A');
    setError(null);
  }, [isOpen, partner]);

  if (!partner) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      await partnerService.updatePartner(partner.id, {
        code: partner.code,
        name: partner.name,
        partnerType: partner.partnerType,
        taxCode: partner.taxCode,
        contactPerson: partner.contactPerson,
        phone: partner.phone,
        email: partner.email,
        address: partner.address,
        bankBin: partner.bankBin,
        bankName: partner.bankName,
        bankAccountNo: partner.bankAccountNo,
        bankAccountName: partner.bankAccountName,
        notes: partner.notes,
        status: partner.status,
        creditLimit: Number(creditLimit) || 0,
        paymentTermDays: Number(paymentTermDays) || 0,
        creditRating,
      });

      toast.success(`Đã cập nhật hạn mức tín dụng cho "${partner.name}" thành công!`);
      notifyDataChanged?.('partners');
      onSuccess?.();
      onClose();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setError(errInfo.message || 'Không thể cập nhật hạn mức tín dụng!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Phê Duyệt Hạn Mức Tín Dụng & Thời Hạn Nợ"
      subtitle="Đặc quyền Chủ đầu tư (Owner): Cấp hạn mức mua chịu và xếp hạng rủi ro tín dụng"
      icon={<CreditCard className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Thông tin đối tác */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Building className="h-4 w-4 text-indigo-600" />
              <span>{partner.name}</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
              {partner.code}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 text-slate-500">
            <span>Dư nợ phải thu hiện tại:</span>
            <span className="font-mono font-bold text-amber-700">
              {formatCurrency(partner.currentReceivableDebt || 0)}
            </span>
          </div>
        </div>

        {/* Hạn mức tín dụng */}
        <FormField
          label="Hạn Mức Tín Dụng Tối Đa (Credit Limit - VNĐ)"
          required
          hint="Hạn mức tối đa khách hàng được phép mua chịu tại các trang trại"
        >
          <div className="space-y-2">
            <Input
              type="number"
              min="0"
              step="1000000"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              className="font-mono font-bold text-emerald-800 text-base"
              placeholder="0"
            />
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-400 text-[10px]">Cấp nhanh:</span>
              {[0, 20000000, 50000000, 100000000, 200000000, 500000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCreditLimit(val)}
                  className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition-all ${
                    Number(creditLimit) === val
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {val === 0 ? '0 ₫ (Tiền mặt)' : `${val / 1000000} Triệu`}
                </button>
              ))}
            </div>
          </div>
        </FormField>

        {/* Thời hạn cho nợ */}
        <FormField
          label="Thời Hạn Cho Nợ (Số Ngày)"
          required
          hint="Số ngày tối đa tính từ ngày giao hàng đến hạn phải thanh toán"
        >
          <div className="space-y-2">
            <Input
              type="number"
              min="0"
              max="180"
              value={paymentTermDays}
              onChange={(e) => setPaymentTermDays(e.target.value)}
              className="font-mono"
            />
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-400 text-[10px]">Gợi ý hạn:</span>
              {[0, 7, 15, 30, 45, 60].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setPaymentTermDays(days)}
                  className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition-all ${
                    Number(paymentTermDays) === days
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {days === 0 ? 'Thanh toán ngay' : `${days} ngày`}
                </button>
              ))}
            </div>
          </div>
        </FormField>

        {/* Xếp hạng tín nhiệm */}
        <FormField
          label="Xếp Hạng Tín Nhiệm (Credit Rating)"
          required
          hint="Đánh giá năng lực thanh toán và lịch sử giao dịch đối tác"
        >
          <Select
            value={creditRating}
            onChange={(e) => setCreditRating(e.target.value)}
            options={CREDIT_RATINGS}
          />
        </FormField>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Save className="h-4 w-4" />}
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Lưu Hạn Mức Tín Dụng
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ApproveCreditLimitModal;
