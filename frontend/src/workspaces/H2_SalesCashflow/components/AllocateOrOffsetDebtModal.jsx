import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ArrowLeftRight,
  Layers,
  DollarSign,
  Building,
  CheckCircle2,
  AlertCircle,
  Equal,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { financeService } from '@/services/modules/financeService';
import { partnerService } from '@/services/modules/partnerService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';
import { formatCurrency } from '@/utils/formatters';

export function AllocateOrOffsetDebtModal({ isOpen, onClose, onSuccess, initialFarmId, preselectedDebtId }) {
  const { farms, activeFarmId } = useActiveFarmStore();
  const currentFarmId = (initialFarmId && initialFarmId !== 'ALL') ? initialFarmId : (activeFarmId !== 'ALL' ? activeFarmId : '');

  const [activeTab, setActiveTab] = useState('ALLOCATE'); // 'ALLOCATE' | 'OFFSET'
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : ''));

  // Tab 1 state: Allocate payment to debt
  const [debts, setDebts] = useState([]);
  const [selectedDebtId, setSelectedDebtId] = useState(preselectedDebtId ? String(preselectedDebtId) : '');
  const [paymentId, setPaymentId] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [allocateNotes, setAllocateNotes] = useState('');

  // Tab 2 state: 2-way debt offset
  const [partners, setPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [receivableDebts, setReceivableDebts] = useState([]);
  const [payableDebts, setPayableDebts] = useState([]);
  const [selectedReceivableId, setSelectedReceivableId] = useState('');
  const [selectedPayableId, setSelectedPayableId] = useState('');
  const [offsetAmount, setOffsetAmount] = useState('');
  const [offsetNotes, setOffsetNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const defFarm = currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : '');
      setSelectedFarmId(defFarm);
      setSelectedDebtId(preselectedDebtId ? String(preselectedDebtId) : '');
      setPaymentId('');
      setAllocatedAmount('');
      setAllocateNotes('');
      setOffsetAmount('');
      setOffsetNotes('');
      setErrors({});
    }
  }, [isOpen, currentFarmId, preselectedDebtId, farms]);

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

  // Load debts for selected farm
  useEffect(() => {
    if (!isOpen || !selectedFarmId) {
      setDebts([]);
      return;
    }

    financeService.getDebts({ farmId: Number(selectedFarmId), size: 100, status: 'OPEN' })
      .then((res) => {
        const list = res?.content || (Array.isArray(res) ? res : []);
        setDebts(list);
        if (preselectedDebtId) {
          const found = list.find((d) => String(d.id) === String(preselectedDebtId));
          if (found) {
            setAllocatedAmount(String(found.remainingDebt || ''));
          }
        }
      })
      .catch(() => setDebts([]));
  }, [isOpen, selectedFarmId, preselectedDebtId]);

  // Load debts for offset when selectedPartnerId changes
  useEffect(() => {
    if (!isOpen || !selectedPartnerId || !selectedFarmId) {
      setReceivableDebts([]);
      setPayableDebts([]);
      return;
    }

    const loadOffsetDebts = async () => {
      try {
        const [recRes, payRes] = await Promise.all([
          financeService.getDebts({
            farmId: Number(selectedFarmId),
            partnerId: Number(selectedPartnerId),
            debtType: 'RECEIVABLE',
            status: 'OPEN',
            size: 50,
          }),
          financeService.getDebts({
            farmId: Number(selectedFarmId),
            partnerId: Number(selectedPartnerId),
            debtType: 'PAYABLE',
            status: 'OPEN',
            size: 50,
          }),
        ]);
        const recList = recRes?.content || (Array.isArray(recRes) ? recRes : []);
        const payList = payRes?.content || (Array.isArray(payRes) ? payRes : []);
        setReceivableDebts(recList);
        setPayableDebts(payList);

        if (recList.length > 0) setSelectedReceivableId(String(recList[0].id));
        if (payList.length > 0) setSelectedPayableId(String(payList[0].id));
      } catch (err) {
        console.error('Failed to load offset debts:', err);
      }
    };
    loadOffsetDebts();
  }, [isOpen, selectedPartnerId, selectedFarmId]);

  // Max offset calculation
  const selRec = receivableDebts.find((d) => String(d.id) === String(selectedReceivableId));
  const selPay = payableDebts.find((d) => String(d.id) === String(selectedPayableId));
  const maxPossibleOffset = Math.min(Number(selRec?.remainingDebt) || 0, Number(selPay?.remainingDebt) || 0);

  const handleSetMaxOffset = () => {
    if (maxPossibleOffset > 0) {
      setOffsetAmount(String(maxPossibleOffset));
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!paymentId) errs.paymentId = 'Vui lòng nhập ID phiếu thanh toán';
    if (!selectedDebtId) errs.debtId = 'Vui lòng chọn khoản nợ cần phân bổ';
    const amt = parseFloat(allocatedAmount);
    if (!allocatedAmount || isNaN(amt) || amt <= 0) {
      errs.allocatedAmount = 'Số tiền phân bổ phải lớn hơn 0 VNĐ';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      await financeService.allocatePayment(Number(selectedFarmId), Number(paymentId), {
        debtRecordId: Number(selectedDebtId),
        allocatedAmount: Number(allocatedAmount),
        notes: allocateNotes?.trim() || null,
      });
      toast.success('Phân bổ thanh toán vào công nợ thành công! Dư nợ đã được cấn trừ.');
      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('finance');
      store.notifyDataChanged?.('partners');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi phân bổ thanh toán:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi phân bổ';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOffsetSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!selectedPartnerId) errs.partnerId = 'Vui lòng chọn đối tác';
    if (!selectedReceivableId) errs.receivableId = 'Vui lòng chọn khoản nợ phải thu';
    if (!selectedPayableId) errs.payableId = 'Vui lòng chọn khoản nợ phải trả';
    const amt = parseFloat(offsetAmount);
    if (!offsetAmount || isNaN(amt) || amt <= 0) {
      errs.offsetAmount = 'Số tiền cấn trừ phải lớn hơn 0 VNĐ';
    } else if (maxPossibleOffset > 0 && amt > maxPossibleOffset) {
      errs.offsetAmount = `Số tiền cấn trừ không được vượt quá số dư nhỏ hơn (${formatCurrency(maxPossibleOffset)})`;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      await financeService.offsetDebts(Number(selectedFarmId), {
        partnerId: Number(selectedPartnerId),
        receivableDebtId: Number(selectedReceivableId),
        payableDebtId: Number(selectedPayableId),
        offsetAmount: Number(offsetAmount),
        notes: offsetNotes?.trim() || null,
      });
      toast.success('Cấn trừ công nợ 2 chiều (DEBT_OFFSET) thành công! Cả hai khoản nợ đã được tất toán tương ứng.');
      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('finance');
      store.notifyDataChanged?.('partners');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi cấn trừ công nợ:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi cấn trừ công nợ';
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
      title="Phân Bổ Thanh Toán & Cấn Trừ Công Nợ 2 Chiều"
      subtitle="Quản lý bù trừ công nợ đối tác và phân bổ nguồn tiền thanh toán vào các hóa đơn còn mở"
      icon={<ArrowLeftRight className="h-5 w-5 text-indigo-600" />}
      size="xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab('ALLOCATE'); setErrors({}); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'ALLOCATE'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Tab 1. Phân Bổ Tiền Thanh Toán Vào Nợ</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('OFFSET'); setErrors({}); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'OFFSET'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Tab 2. Cấn Trừ Công Nợ 2 Chiều (Phải Thu vs Phải Trả)</span>
          </button>
        </div>

        {errors.form && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* TAB 1: ALLOCATE PAYMENT */}
        {activeTab === 'ALLOCATE' && (
          <form onSubmit={handleAllocateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <FormField label="Trang Trại Tác Nghiệp">
                <Select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full text-xs font-semibold"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (#{f.id})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="ID Phiếu Thanh Toán (Payment ID) (*)" error={errors.paymentId}>
                <Input
                  type="number"
                  placeholder="Nhập ID phiếu thanh toán (VD: 1, 2...)"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  className="w-full text-xs font-mono font-bold"
                />
              </FormField>
            </div>

            <FormField label="Khoản Nợ Cần Phân Bổ (*)" error={errors.debtId}>
              <Select
                value={selectedDebtId}
                onChange={(e) => {
                  setSelectedDebtId(e.target.value);
                  const found = debts.find((d) => String(d.id) === String(e.target.value));
                  if (found) setAllocatedAmount(String(found.remainingDebt || ''));
                }}
                className="w-full text-xs"
              >
                <option value="">-- Chọn khoản công nợ đang mở --</option>
                {debts.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.debtType === 'RECEIVABLE' ? 'Phải thu' : 'Phải trả'}] {d.partnerName} - Còn nợ: {formatCurrency(d.remainingDebt)} ({d.orderCode || d.receiptCode || `Nợ #${d.id}`})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Số Tiền Phân Bổ (VNĐ) (*)" error={errors.allocatedAmount}>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="VD: 5,000,000"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
                className="w-full text-xs font-mono font-bold"
              />
            </FormField>

            <FormField label="Ghi Chú Phân Bổ">
              <textarea
                rows="2"
                placeholder="Ghi chú hạch toán cấn trừ..."
                value={allocateNotes}
                onChange={(e) => setAllocateNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isSubmitting}
                onClick={handleAllocateSubmit}
                icon={<CheckCircle2 className="h-4 w-4" />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Thực Hiện Phân Bổ
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: 2-WAY DEBT OFFSET */}
        {activeTab === 'OFFSET' && (
          <form onSubmit={handleOffsetSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <FormField label="Trang Trại Tác Nghiệp">
                <Select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full text-xs font-semibold"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (#{f.id})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Đối Tác 2 Chiều (*)" error={errors.partnerId}>
                <Select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="">-- Chọn đối tác vừa mua sỉ vừa cung ứng --</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.partnerType})
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 space-y-2">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">
                  1. Khoản Nợ Phải Thu (Receivable - Tiền hàng khách nợ trại)
                </span>
                <Select
                  value={selectedReceivableId}
                  onChange={(e) => setSelectedReceivableId(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="">-- Chọn khoản phải thu --</option>
                  {receivableDebts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.orderCode || `Đơn #${d.id}`} - Còn nợ: {formatCurrency(d.remainingDebt)}
                    </option>
                  ))}
                </Select>
                {selRec && (
                  <span className="text-[11px] text-blue-900 font-bold block font-mono">
                    Dư nợ còn lại: {formatCurrency(selRec.remainingDebt)}
                  </span>
                )}
                {errors.receivableId && (
                  <span className="text-[10px] text-rose-600 block">{errors.receivableId}</span>
                )}
              </div>

              <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-200 space-y-2">
                <span className="text-[10px] font-bold text-orange-800 uppercase block">
                  2. Khoản Nợ Phải Trả (Payable - Tiền vật tư trại nợ NCC)
                </span>
                <Select
                  value={selectedPayableId}
                  onChange={(e) => setSelectedPayableId(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="">-- Chọn khoản phải trả --</option>
                  {payableDebts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.receiptCode || `Phiếu #${d.id}`} - Còn nợ: {formatCurrency(d.remainingDebt)}
                    </option>
                  ))}
                </Select>
                {selPay && (
                  <span className="text-[11px] text-orange-900 font-bold block font-mono">
                    Dư nợ còn lại: {formatCurrency(selPay.remainingDebt)}
                  </span>
                )}
                {errors.payableId && (
                  <span className="text-[10px] text-rose-600 block">{errors.payableId}</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  Số Tiền Cấn Trừ Bù Trừ (*):
                </span>
                {maxPossibleOffset > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    icon={<Sparkles className="h-3 w-3" />}
                    onClick={handleSetMaxOffset}
                    title="Cấn trừ toàn bộ số dư nhỏ hơn"
                  >
                    Cấn Trừ Tối Đa ({formatCurrency(maxPossibleOffset)})
                  </Button>
                )}
              </div>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="VD: 10,000,000"
                value={offsetAmount}
                onChange={(e) => setOffsetAmount(e.target.value)}
                className="w-full text-xs font-mono font-bold"
              />
              {errors.offsetAmount && (
                <span className="text-[10px] text-rose-600 block mt-1">{errors.offsetAmount}</span>
              )}
            </div>

            <FormField label="Ghi Chú Biên Bản Cấn Trừ Công Nợ">
              <textarea
                rows="2"
                placeholder="Ghi chú thỏa thuận bù trừ công nợ giữa 2 bên..."
                value={offsetNotes}
                onChange={(e) => setOffsetNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isSubmitting}
                onClick={handleOffsetSubmit}
                icon={<ArrowLeftRight className="h-4 w-4" />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Xác Nhận Cấn Trừ 2 Chiều
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

export default AllocateOrOffsetDebtModal;
