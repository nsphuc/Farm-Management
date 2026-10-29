import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Calendar,
  Layers,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { financeService } from '@/services/modules/financeService';
import { qaService } from '@/services/modules/qaService';
import { partnerService } from '@/services/modules/partnerService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export function CreateSalesOrderModal({ isOpen, onClose, onSuccess, initialFarmId }) {
  const { farms, activeFarmId } = useActiveFarmStore();
  const currentFarmId = (initialFarmId && initialFarmId !== 'ALL') ? initialFarmId : (activeFarmId !== 'ALL' ? activeFarmId : '');

  const [formData, setFormData] = useState({
    farmId: currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : ''),
    partnerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    discountAmount: 0,
    vatRate: 5,
    notes: '',
    items: [createDefaultOrderItem()],
  });

  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [productBatches, setProductBatches] = useState([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function createDefaultOrderItem() {
    return {
      id: Date.now() + Math.random(),
      productBatchId: '',
      batchCode: '',
      itemName: '',
      unit: 'kg',
      quantity: 1,
      availableQuantity: 0,
      unitPrice: 0,
      discountAmount: 0,
    };
  }

  useEffect(() => {
    if (isOpen) {
      const defFarm = currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : '');
      setFormData({
        farmId: defFarm,
        partnerId: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        discountAmount: 0,
        vatRate: 5,
        notes: '',
        items: [createDefaultOrderItem()],
      });
      setSelectedPartner(null);
      setErrors({});
    }
  }, [isOpen]);

  // Load partners (buyers/agents)
  useEffect(() => {
    if (!isOpen) return;
    const loadPartners = async () => {
      try {
        const res = await partnerService.getPartners({ size: 100 });
        const list = res?.content || (Array.isArray(res) ? res : []);
        // Active B2B partners
        const b2b = list.filter((p) => p.status === 'ACTIVE' && (p.partnerType === 'BUYER' || p.partnerType === 'AGENT' || p.partnerType === 'CUSTOMER'));
        setPartners(b2b.length > 0 ? b2b : list);
      } catch (err) {
        console.error('Failed to load partners:', err);
      }
    };
    loadPartners();
  }, [isOpen]);

  // Load product batches for selected farm
  useEffect(() => {
    if (!isOpen || !formData.farmId) {
      setProductBatches([]);
      return;
    }

    const loadBatches = async () => {
      try {
        setIsLoadingBatches(true);
        const res = await qaService.getProductBatches({ farmId: Number(formData.farmId), size: 200 });
        const list = res?.content || (Array.isArray(res) ? res : []);
        // Filter selling/ready batches with remaining > 0
        const available = list.filter((b) => {
          const rem = Number(b.remainingQuantity || 0) - Number(b.reservedQuantity || 0);
          return rem > 0 && (b.status === 'SELLING' || b.status === 'PRINTED' || b.status === 'READY_TO_PRINT');
        });
        setProductBatches(available.length > 0 ? available : list);
      } catch (err) {
        console.error('Failed to load batches:', err);
        setProductBatches([]);
      } finally {
        setIsLoadingBatches(false);
      }
    };
    loadBatches();
  }, [isOpen, formData.farmId]);

  const handlePartnerChange = (partnerIdVal) => {
    setFormData((prev) => ({ ...prev, partnerId: partnerIdVal }));
    const found = partners.find((p) => String(p.id) === String(partnerIdVal));
    setSelectedPartner(found || null);
    if (errors.partnerId) setErrors((prev) => ({ ...prev, partnerId: null }));
  };

  const handleBatchSelect = (index, batchIdVal) => {
    const batch = productBatches.find((b) => String(b.id) === String(batchIdVal));
    setFormData((prev) => {
      const copy = [...prev.items];
      if (batch) {
        const available = Math.max(0, Number(batch.remainingQuantity || 0) - Number(batch.reservedQuantity || 0));
        copy[index] = {
          ...copy[index],
          productBatchId: batch.id,
          batchCode: batch.batchCode || `Lô #${batch.id}`,
          itemName: batch.productName || batch.batchCode || 'Nông sản thành phẩm',
          unit: batch.unit || 'kg',
          availableQuantity: available,
          unitPrice: Number(batch.unitPrice || batch.price || copy[index].unitPrice || 0),
        };
      } else {
        copy[index] = {
          ...copy[index],
          productBatchId: '',
          batchCode: '',
          itemName: '',
          availableQuantity: 0,
        };
      }
      return { ...prev, items: copy };
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const copy = [...prev.items];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, items: copy };
    });
  };

  const handleAddItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, createDefaultOrderItem()] }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      toast.warning('Đơn bán sỉ phải có ít nhất 1 dòng mặt hàng!');
      return;
    }
    setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  // Calculations
  const subtotal = formData.items.reduce((sum, item) => {
    const lineQty = Number(item.quantity) || 0;
    const linePrice = Number(item.unitPrice) || 0;
    const lineDisc = Number(item.discountAmount) || 0;
    return sum + (lineQty * linePrice - lineDisc);
  }, 0);

  const orderDiscount = Number(formData.discountAmount) || 0;
  const taxableAmount = Math.max(0, subtotal - orderDiscount);
  const vatRate = Number(formData.vatRate) || 0;
  const vatAmount = taxableAmount * (vatRate / 100);
  const finalAmount = taxableAmount + vatAmount;

  // Credit limit check
  const creditLimit = Number(selectedPartner?.creditLimit) || 0;
  const currentDebt = Number(selectedPartner?.currentDebt) || 0;
  const isCreditExceeded = creditLimit > 0 && (currentDebt + finalAmount > creditLimit);

  const validate = () => {
    const errs = {};
    if (!formData.farmId) errs.farmId = 'Vui lòng chọn trang trại';
    if (!formData.partnerId) errs.partnerId = 'Vui lòng chọn khách hàng B2B';
    if (!formData.orderDate) errs.orderDate = 'Vui lòng chọn ngày đặt hàng';
    if (formData.items.length === 0) {
      errs.items = 'Đơn hàng phải có ít nhất 1 dòng mặt hàng';
    }

    for (let i = 0; i < formData.items.length; i++) {
      const it = formData.items[i];
      if (!it.itemName?.trim()) {
        errs[`name_${i}`] = `Dòng ${i + 1}: Vui lòng nhập tên mặt hàng`;
      }
      const qty = parseFloat(it.quantity);
      if (!it.quantity || isNaN(qty) || qty <= 0) {
        errs[`qty_${i}`] = `Dòng ${i + 1}: Số lượng phải > 0`;
      } else if (it.availableQuantity > 0 && qty > it.availableQuantity) {
        errs[`qty_${i}`] = `Dòng ${i + 1}: Vượt tồn khả dụng (${it.availableQuantity})`;
      }
      const pr = parseFloat(it.unitPrice);
      if (it.unitPrice === '' || isNaN(pr) || pr < 0) {
        errs[`price_${i}`] = `Dòng ${i + 1}: Đơn giá không hợp lệ`;
      }
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
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate || null,
        discountAmount: Number(formData.discountAmount || 0),
        vatRate: Number(formData.vatRate || 0),
        notes: formData.notes?.trim() || null,
        items: formData.items.map((it) => ({
          productBatchId: it.productBatchId ? Number(it.productBatchId) : null,
          itemName: it.itemName.trim(),
          quantity: Number(it.quantity),
          unit: it.unit?.trim() || 'kg',
          unitPrice: Number(it.unitPrice || 0),
          discountAmount: Number(it.discountAmount || 0),
        })),
      };

      await financeService.createSalesOrder(Number(formData.farmId), payload);
      toast.success('Tạo đơn hàng bán sỉ mới thành công! Giám đốc trại sẽ kiểm tra và phê duyệt giữ chỗ lô hàng.');
      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('finance');
      store.notifyDataChanged?.('partners');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi khi tạo đơn bán sỉ:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tạo đơn bán sỉ';
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
      title="Lập Đơn Đặt Hàng Bán Sỉ Nông Sản"
      subtitle="Tạo mới đơn hàng B2B, kiểm soát hạn mức tín dụng công nợ và giữ chỗ lô thành phẩm"
      icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />}
      size="2xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="text-xs font-mono">
            <span>Tổng thanh toán: </span>
            <strong className="text-emerald-700 text-sm">{formatCurrency(finalAmount)}</strong>
            <span className="text-slate-400 text-[11px] ml-2">
              (Hàng: {formatCurrency(subtotal)} | VAT: {formData.vatRate}% = {formatCurrency(vatAmount)})
            </span>
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
              Lưu Đơn Bán Sỉ (PENDING)
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
          <FormField label="Trang Trại Xuất Bán (*)" error={errors.farmId}>
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

          <FormField label="Khách Hàng / Đối Tác B2B (*)" error={errors.partnerId}>
            <Select
              value={formData.partnerId}
              onChange={(e) => handlePartnerChange(e.target.value)}
              className="w-full text-xs"
            >
              <option value="">-- Chọn khách hàng / đại lý --</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.partnerCode || `KH #${p.id}`})
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Thẻ hiển thị hạn mức tín dụng đối tác */}
        {selectedPartner && (
          <div className={`p-3 rounded-xl border text-xs transition-all ${
            isCreditExceeded
              ? 'bg-rose-50/80 border-rose-300 text-rose-900'
              : 'bg-blue-50/60 border-blue-200 text-blue-900'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="font-bold">
                  Hạn mức tín dụng: {creditLimit > 0 ? formatCurrency(creditLimit) : 'Không giới hạn'}
                </span>
                <span className="text-slate-400">|</span>
                <span>Dư nợ hiện tại: <strong>{formatCurrency(currentDebt)}</strong></span>
              </div>
              {isCreditExceeded && (
                <div className="flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>CẢNH BÁO: Đơn mới vượt hạn mức tín dụng đối tác!</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <FormField label="Ngày Đặt Hàng (*)" error={errors.orderDate}>
            <Input
              type="date"
              value={formData.orderDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, orderDate: e.target.value }))}
              className="w-full text-xs"
            />
          </FormField>

          <FormField label="Ngày Giao Dự Kiến">
            <Input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, deliveryDate: e.target.value }))}
              className="w-full text-xs"
            />
          </FormField>

          <FormField label="Chiết Khấu Đơn (VNĐ)">
            <Input
              type="number"
              min="0"
              step="any"
              value={formData.discountAmount}
              onChange={(e) => setFormData((prev) => ({ ...prev, discountAmount: e.target.value }))}
              className="w-full text-xs font-mono text-right"
            />
          </FormField>

          <FormField label="Thuế Suất VAT (%)">
            <Select
              value={formData.vatRate}
              onChange={(e) => setFormData((prev) => ({ ...prev, vatRate: e.target.value }))}
              className="w-full text-xs font-mono text-right"
            >
              <option value="0">0% (Không chịu thuế)</option>
              <option value="5">5% (Nông sản sơ chế)</option>
              <option value="8">8% (Thuế suất ưu đãi)</option>
              <option value="10">10% (Thương mại chuẩn)</option>
            </Select>
          </FormField>
        </div>

        {/* Bảng dòng mặt hàng */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>Danh Sách Mặt Hàng & Lô Xuất Bán ({formData.items.length})</span>
            </h4>
            <Button
              type="button"
              variant="outline"
              size="xs"
              icon={<Plus className="h-3 w-3" />}
              onClick={handleAddItem}
            >
              + Thêm Mặt Hàng
            </Button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3 w-48">Lô Thành Phẩm Khả Dụng</th>
                  <th className="py-2.5 px-3">Tên Mặt Hàng (*)</th>
                  <th className="py-2.5 px-2 w-16 text-center">ĐVT</th>
                  <th className="py-2.5 px-3 w-28 text-right">Số Lượng (*)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Đơn Giá (*)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Thành Tiền</th>
                  <th className="py-2.5 px-2 w-10 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.items.map((row, idx) => {
                  const lineTotal = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0) - (Number(row.discountAmount) || 0);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <Select
                          value={row.productBatchId}
                          onChange={(e) => handleBatchSelect(idx, e.target.value)}
                          className="w-full text-xs"
                        >
                          <option value="">-- Tự do / Nhập tay --</option>
                          {productBatches.map((b) => {
                            const avail = Math.max(0, Number(b.remainingQuantity || 0) - Number(b.reservedQuantity || 0));
                            return (
                              <option key={b.id} value={b.id}>
                                {b.batchCode} ({b.productName}) - Còn {formatNumber(avail)} {b.unit || 'kg'}
                              </option>
                            );
                          })}
                        </Select>
                        {row.availableQuantity > 0 && (
                          <span className="text-[10px] text-emerald-700 font-mono block mt-0.5">
                            Tồn khả dụng: {formatNumber(row.availableQuantity)} {row.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="text"
                          value={row.itemName}
                          placeholder="Tên sản phẩm xuất bán"
                          onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                          className="w-full text-xs font-semibold"
                        />
                        {errors[`name_${idx}`] && (
                          <span className="text-[10px] text-rose-600 block mt-0.5">{errors[`name_${idx}`]}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Input
                          type="text"
                          value={row.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-14 text-xs text-center"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-24 text-xs font-mono font-bold text-right"
                        />
                        {errors[`qty_${idx}`] && (
                          <span className="text-[10px] text-rose-600 block mt-0.5 text-right">{errors[`qty_${idx}`]}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={row.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-24 text-xs font-mono font-bold text-right"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(lineTotal)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                          title="Xóa dòng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <FormField label="Ghi Chú Đơn Hàng / Thỏa Thuận Giao">
          <textarea
            rows="2"
            placeholder="Ghi chú điều khoản thanh toán, quy cách đóng gói hoặc địa điểm giao nhận..."
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default CreateSalesOrderModal;
