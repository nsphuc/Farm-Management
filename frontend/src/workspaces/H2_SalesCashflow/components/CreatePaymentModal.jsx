import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  Layers,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Building,
  QrCode,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { ImageUploadField } from '@/components/common/ImageUploadField';
import { financeService } from '@/services/modules/financeService';
import { partnerService } from '@/services/modules/partnerService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';
import { formatCurrency } from '@/utils/formatters';

const PAYMENT_TYPES = [
  { value: 'RECEIPT', label: '1. Thu tiền khách hàng (RECEIPT - Tiền vào)' },
  { value: 'PAYMENT', label: '2. Chi trả nhà cung cấp (PAYMENT - Tiền ra)' },
  { value: 'REFUND', label: '3. Hoàn tiền giao dịch (REFUND)' },
];

const PAYMENT_METHODS = [
  { value: 'VIETQR', label: 'Chuyển khoản VietQR Napas247 (Tự động)' },
  { value: 'BANK_TRANSFER', label: 'Ủy nhiệm chi / Chuyển khoản ngân hàng' },
  { value: 'CASH', label: 'Tiền mặt tại quỹ trại (CASH)' },
  { value: 'E_WALLET', label: 'Ví điện tử doanh nghiệp (E_WALLET)' },
  { value: 'DEBT_OFFSET', label: 'Cấn trừ bù trừ công nợ (DEBT_OFFSET)' },
];

export function CreatePaymentModal({ isOpen, onClose, onSuccess, initialFarmId, preselectedPartnerId, initialDebt }) {
  const { farms, activeFarmId } = useActiveFarmStore();
  const currentFarmId = (initialDebt?.farmId) || ((initialFarmId && initialFarmId !== 'ALL') ? initialFarmId : (activeFarmId !== 'ALL' ? activeFarmId : ''));

  const isPayable = initialDebt?.debtType === 'PAYABLE';

  const [formData, setFormData] = useState({
    farmId: currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : ''),
    partnerId: initialDebt?.partnerId ? String(initialDebt.partnerId) : (preselectedPartnerId ? String(preselectedPartnerId) : ''),
    paymentType: isPayable ? 'PAYMENT' : 'RECEIPT',
    paymentMethod: isPayable ? 'BANK_TRANSFER' : 'VIETQR',
    amount: initialDebt?.remainingDebt ? String(initialDebt.remainingDebt) : '',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceCode: initialDebt?.orderCode || initialDebt?.receiptCode || '',
    qrTransferContent: (!isPayable && initialDebt?.orderCode) ? `GF DALAT TT DON HANG ${initialDebt.orderCode}` : '',
    proofImageUrl: '',
    notes: initialDebt
      ? (isPayable ? `Chi trả nợ tiền vật tư cho ${initialDebt.partnerName || 'NCC'}` : `Thu tiền công nợ đơn hàng ${initialDebt.orderCode || initialDebt.id}`)
      : '',
  });

  const [partners, setPartners] = useState([]);
  const [partnerDebts, setPartnerDebts] = useState([]);
  const [selectedDebtId, setSelectedDebtId] = useState(initialDebt?.id ? String(initialDebt.id) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const defFarm = initialDebt?.farmId ? String(initialDebt.farmId) : (currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : ''));
      const defPartner = initialDebt?.partnerId ? String(initialDebt.partnerId) : (preselectedPartnerId ? String(preselectedPartnerId) : '');
      const defType = initialDebt?.debtType === 'PAYABLE' ? 'PAYMENT' : 'RECEIPT';
      const defMethod = defType === 'PAYMENT' ? 'BANK_TRANSFER' : 'VIETQR';
      const defAmount = initialDebt?.remainingDebt ? String(initialDebt.remainingDebt) : '';
      const defRef = initialDebt?.orderCode || initialDebt?.receiptCode || '';
      const defQr = (defType === 'RECEIPT' && defRef) ? `GF DALAT TT DON HANG ${defRef}` : '';

      setFormData({
        farmId: defFarm,
        partnerId: defPartner,
        paymentType: defType,
        paymentMethod: defMethod,
        amount: defAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        referenceCode: defRef,
        qrTransferContent: defQr,
        proofImageUrl: '',
        notes: initialDebt
          ? (defType === 'PAYMENT' ? `Chi trả nợ tiền vật tư cho ${initialDebt.partnerName || 'NCC'}` : `Thu tiền công nợ đơn hàng ${defRef || initialDebt.id}`)
          : '',
      });
      setSelectedDebtId(initialDebt?.id ? String(initialDebt.id) : '');
      setErrors({});
    }
  }, [isOpen, initialDebt, preselectedPartnerId, currentFarmId, farms]);

  // Load partners
  useEffect(() => {
    if (!isOpen) return;
    partnerService.getPartners({ size: 100 })
      .then((res) => {
        const list = res?.content || (Array.isArray(res) ? res : []);
        setPartners(list.filter((p) => p.status === 'ACTIVE'));
      })
      .catch(() => setPartners([]));
  }, [isOpen]);

  // Load debts for selected partner & farm
  useEffect(() => {
    if (!isOpen || !formData.partnerId || !formData.farmId) {
      setPartnerDebts([]);
      return;
    }

    const loadDebts = async () => {
      try {
        const debtType = formData.paymentType === 'RECEIPT' ? 'RECEIVABLE' : 'PAYABLE';
        const res = await financeService.getDebts({
          farmId: Number(formData.farmId),
          partnerId: Number(formData.partnerId),
          debtType,
          size: 50,
        });
        const list = res?.content || (Array.isArray(res) ? res : []);
        // Filter out fully paid or cancelled
        const activeDebts = list.filter((d) => Number(d.remainingDebt || 0) > 0 && d.status !== 'PAID' && d.status !== 'CANCELLED');
        setPartnerDebts(activeDebts);

        if (initialDebt && String(initialDebt.partnerId) === String(formData.partnerId)) {
          setSelectedDebtId(String(initialDebt.id));
          if (!formData.amount) {
            setFormData((prev) => ({ ...prev, amount: String(initialDebt.remainingDebt || '') }));
          }
        }
      } catch (err) {
        console.error('Failed to load partner debts:', err);
        setPartnerDebts([]);
      }
    };
    loadDebts();
  }, [isOpen, formData.partnerId, formData.farmId, formData.paymentType, initialDebt]);

  const handleDebtSelect = (debtIdVal) => {
    setSelectedDebtId(debtIdVal);
    const found = partnerDebts.find((d) => String(d.id) === String(debtIdVal));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        amount: String(found.remainingDebt || ''),
        referenceCode: found.orderCode || found.receiptCode || prev.referenceCode,
      }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.farmId) errs.farmId = 'Vui lòng chọn trang trại';
    if (!formData.partnerId) errs.partnerId = 'Vui lòng chọn đối tác';
    if (!formData.paymentDate) errs.paymentDate = 'Vui lòng chọn ngày thanh toán';
    const amt = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0) {
      errs.amount = 'Số tiền thanh toán phải lớn hơn 0 VNĐ';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        partnerId: Number(formData.partnerId),
        paymentType: formData.paymentType,
        paymentMethod: formData.paymentMethod,
        amount: Number(formData.amount),
        paymentDate: formData.paymentDate,
        referenceCode: formData.referenceCode?.trim() || null,
        qrTransferContent: formData.qrTransferContent?.trim() || null,
        proofImageUrl: formData.proofImageUrl?.trim() || null,
        notes: formData.notes?.trim() || null,
        debtRecordId: selectedDebtId ? Number(selectedDebtId) : null,
        allocations: selectedDebtId ? [
          {
            debtRecordId: Number(selectedDebtId),
            allocatedAmount: Number(formData.amount),
            notes: formData.notes?.trim() || 'Thanh toán trực tiếp',
          }
        ] : null,
      };

      await financeService.createPayment(Number(formData.farmId), payload);
      toast.success('Lập phiếu giao dịch thanh toán mới thành công! Giám đốc trại sẽ kiểm tra và phê duyệt.');
      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('finance');
      store.notifyDataChanged?.('partners');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lập phiếu thanh toán:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lập phiếu thanh toán';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lập Phiếu Giao Dịch Thu / Chi Tiền"
      subtitle="Ghi nhận giao dịch thanh toán qua VietQR, Ngân hàng hoặc Tiền mặt kèm phân bổ trừ nợ"
      icon={<CreditCard className="h-5 w-5 text-emerald-600" />}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs font-mono">
            {formData.amount && !isNaN(Number(formData.amount)) ? (
              <span>Số tiền: <strong className="text-emerald-700 font-bold">{formatCurrency(formData.amount)}</strong></span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy Bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={handleSubmit}
              icon={<CheckCircle2 className="h-4 w-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Lưu Phiếu Thanh Toán (PENDING)
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Trang Trại Hạch Toán (*)" error={errors.farmId}>
            <Select
              value={formData.farmId}
              onChange={(e) => setFormData((prev) => ({ ...prev, farmId: e.target.value }))}
              className="w-full text-xs font-semibold"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (#{f.id})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Đối Tác Thanh Toán (*)" error={errors.partnerId}>
            <Select
              value={formData.partnerId}
              onChange={(e) => setFormData((prev) => ({ ...prev, partnerId: e.target.value }))}
              className="w-full text-xs"
            >
              <option value="">-- Chọn khách hàng / nhà cung cấp --</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.partnerType})
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Loại Giao Dịch">
            <Select
              value={formData.paymentType}
              onChange={(e) => setFormData((prev) => ({ ...prev, paymentType: e.target.value }))}
              className="w-full text-xs"
            >
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Phương Thức Thanh Toán">
            <Select
              value={formData.paymentMethod}
              onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full text-xs"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Chọn khoản nợ cần phân bổ trực tiếp nếu có */}
        {partnerDebts.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <FormField label="Khoản Nợ Cần Cấn Trừ Trực Tiếp (Tùy chọn)">
              <Select
                value={selectedDebtId}
                onChange={(e) => handleDebtSelect(e.target.value)}
                className="w-full text-xs"
              >
                <option value="">-- Để trống nếu là thanh toán tạm ứng / chưa phân bổ --</option>
                {partnerDebts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.orderCode || d.receiptCode || `Nợ #${d.id}`} - Còn nợ: {formatCurrency(d.remainingDebt)} (Hạn trả: {d.dueDate})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Số Tiền Thanh Toán (VNĐ) (*)" error={errors.amount}>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="VD: 15,000,000"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full text-xs font-mono font-bold text-slate-900"
            />
          </FormField>

          <FormField label="Ngày Thực Hiện (*)" error={errors.paymentDate}>
            <Input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, paymentDate: e.target.value }))}
              className="w-full text-xs"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Mã Tham Chiếu / Số Giao Dịch Ngân Hàng">
            <Input
              type="text"
              placeholder="VD: FT26102412345, UNC-01..."
              value={formData.referenceCode}
              onChange={(e) => setFormData((prev) => ({ ...prev, referenceCode: e.target.value }))}
              className="w-full text-xs font-mono"
            />
          </FormField>

          <FormField label="Nội Dung Chuyển Khoản QR">
            <Input
              type="text"
              placeholder="VD: GF DALAT TT DON HANG SO..."
              value={formData.qrTransferContent}
              onChange={(e) => setFormData((prev) => ({ ...prev, qrTransferContent: e.target.value }))}
              className="w-full text-xs"
            />
          </FormField>
        </div>

        <ImageUploadField
          label="Ảnh Biên Lai / Ủy Nhiệm Chi / Chứng Từ Chuyển Khoản"
          value={formData.proofImageUrl}
          onChange={(url) => setFormData((prev) => ({ ...prev, proofImageUrl: url }))}
          placeholder="https://... hoặc tải ảnh chụp biên lai thanh toán từ thiết bị"
        />

        <FormField label="Ghi Chú Giao Dịch">
          <textarea
            rows="2"
            placeholder="Ghi chú chi tiết về chứng từ thanh toán..."
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default CreatePaymentModal;
