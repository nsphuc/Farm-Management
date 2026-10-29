import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { financeService } from '@/services/modules/financeService';
import { partnerService } from '@/services/modules/partnerService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';
import { formatNumber } from '@/utils/formatters';

export function CreateDeliveryModal({ isOpen, onClose, onSuccess, initialFarmId, preselectedOrderId }) {
  const { farms, activeFarmId } = useActiveFarmStore();
  const currentFarmId = (initialFarmId && initialFarmId !== 'ALL') ? initialFarmId : (activeFarmId !== 'ALL' ? activeFarmId : '');

  const [selectedFarmId, setSelectedFarmId] = useState(currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : ''));
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId ? String(preselectedOrderId) : '');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [logisticsPartners, setLogisticsPartners] = useState([]);

  const [formData, setFormData] = useState({
    deliveryCode: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    logisticsPartnerId: '',
    driverName: '',
    vehiclePlate: '',
    receiverName: '',
    shippingAddress: '',
    proofOfDeliveryUrl: '',
    notes: '',
    items: [],
  });

  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const generateDeliveryCode = () => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(10 + Math.random() * 90);
    return `DO-${yy}${mm}${dd}-${random}`;
  };

  useEffect(() => {
    if (isOpen) {
      const defFarm = currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : '');
      setSelectedFarmId(defFarm);
      setSelectedOrderId(preselectedOrderId ? String(preselectedOrderId) : '');
      setFormData({
        deliveryCode: generateDeliveryCode(),
        deliveryDate: new Date().toISOString().split('T')[0],
        logisticsPartnerId: '',
        driverName: '',
        vehiclePlate: '',
        receiverName: '',
        shippingAddress: '',
        proofOfDeliveryUrl: '',
        notes: '',
        items: [],
      });
      setErrors({});
    }
  }, [isOpen]);

  // Load logistics partners
  useEffect(() => {
    if (!isOpen) return;
    partnerService.getPartners({ size: 100 })
      .then((res) => {
        const list = res?.content || (Array.isArray(res) ? res : []);
        const log = list.filter((p) => p.status === 'ACTIVE' && (p.partnerType === 'LOGISTICS' || p.partnerType === 'AGENT'));
        setLogisticsPartners(log.length > 0 ? log : list);
      })
      .catch(() => setLogisticsPartners([]));
  }, [isOpen]);

  // Load sales orders for farm
  useEffect(() => {
    if (!isOpen || !selectedFarmId) {
      setSalesOrders([]);
      setSelectedOrder(null);
      return;
    }

    const loadOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const res = await financeService.getSalesOrders({ farmId: Number(selectedFarmId), size: 100 });
        const list = res?.content || (Array.isArray(res) ? res : []);
        // Filter orders that are CONFIRMED or DELIVERING
        const eligible = list.filter((o) => o.status === 'CONFIRMED' || o.status === 'DELIVERING');
        setSalesOrders(eligible.length > 0 ? eligible : list);

        if (eligible.length > 0 && !selectedOrderId) {
          handleOrderSelect(eligible[0].id, eligible);
        } else if (selectedOrderId) {
          handleOrderSelect(selectedOrderId, eligible.length > 0 ? eligible : list);
        }
      } catch (err) {
        console.error('Failed to load sales orders:', err);
        setSalesOrders([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    loadOrders();
  }, [isOpen, selectedFarmId]);

  const handleOrderSelect = (orderIdVal, orderList = salesOrders) => {
    setSelectedOrderId(String(orderIdVal));
    const found = orderList.find((o) => String(o.id) === String(orderIdVal));
    setSelectedOrder(found || null);

    if (found && found.items && found.items.length > 0) {
      // Build items to deliver with remaining quantities
      const deliveryItems = found.items
        .map((it) => {
          const totalQty = Number(it.quantity) || 0;
          const shipped = Number(it.shippedQuantity) || 0;
          const remaining = Math.max(0, totalQty - shipped);
          return {
            salesOrderItemId: it.id,
            productBatchId: it.productBatchId || 1,
            itemName: it.itemName || `Sản phẩm #${it.id}`,
            unit: it.unit || 'kg',
            totalOrderedQuantity: totalQty,
            shippedQuantity: shipped,
            remainingQuantity: remaining,
            quantity: remaining > 0 ? remaining : 0,
            notes: '',
          };
        })
        .filter((it) => it.remainingQuantity > 0);

      setFormData((prev) => ({
        ...prev,
        receiverName: found.partnerName || prev.receiverName,
        items: deliveryItems.length > 0 ? deliveryItems : [],
      }));
    } else {
      setFormData((prev) => ({ ...prev, items: [] }));
    }
  };

  const handleItemQtyChange = (index, value) => {
    setFormData((prev) => {
      const copy = [...prev.items];
      copy[index] = { ...copy[index], quantity: value === '' ? '' : Math.max(0, parseFloat(value) || 0) };
      return { ...prev, items: copy };
    });
  };

  const validate = () => {
    const errs = {};
    if (!selectedOrderId) errs.order = 'Vui lòng chọn đơn bán hàng';
    if (!formData.deliveryDate) errs.deliveryDate = 'Vui lòng chọn ngày giao hàng';
    if (formData.items.length === 0) {
      errs.items = 'Đơn hàng này đã giao đủ hoặc không có mặt hàng nào cần xuất giao';
    }

    for (let i = 0; i < formData.items.length; i++) {
      const it = formData.items[i];
      const qty = parseFloat(it.quantity);
      if (it.quantity === '' || isNaN(qty) || qty <= 0) {
        errs[`qty_${i}`] = `Dòng ${i + 1}: Số lượng giao phải > 0`;
      } else if (qty > it.remainingQuantity) {
        errs[`qty_${i}`] = `Dòng ${i + 1}: Vượt số lượng còn lại (${it.remainingQuantity})`;
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
        salesOrderId: Number(selectedOrderId),
        deliveryCode: formData.deliveryCode?.trim() || generateDeliveryCode(),
        deliveryDate: formData.deliveryDate,
        logisticsPartnerId: formData.logisticsPartnerId ? Number(formData.logisticsPartnerId) : null,
        driverName: formData.driverName?.trim() || null,
        vehiclePlate: formData.vehiclePlate?.trim() || null,
        receiverName: formData.receiverName?.trim() || null,
        shippingAddress: formData.shippingAddress?.trim() || null,
        proofOfDeliveryUrl: formData.proofOfDeliveryUrl?.trim() || null,
        notes: formData.notes?.trim() || null,
        items: formData.items.map((it) => ({
          salesOrderItemId: Number(it.salesOrderItemId),
          productBatchId: Number(it.productBatchId),
          quantity: Number(it.quantity),
          notes: it.notes?.trim() || null,
        })),
      };

      await financeService.createDelivery(Number(selectedFarmId), payload);
      toast.success('Lập phiếu xuất giao hàng thành công! Trừ tồn kho và cập nhật tiến độ giao vận.');
      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('finance');
      store.notifyDataChanged?.('partners');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lập phiếu giao hàng:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lập phiếu giao hàng';
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
      title="Lập Đợt Xuất Giao Hàng Bán Sỉ"
      subtitle="Xuất giao nông sản theo đợt từ đơn bán sỉ, giải phóng giữ chỗ và sinh công nợ phải thu"
      icon={<Truck className="h-5 w-5 text-blue-600" />}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-mono">
            {selectedOrder ? (
              <span>Đơn hàng: <strong className="text-blue-900">{selectedOrder.orderCode}</strong> ({selectedOrder.partnerName})</span>
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Lưu Phiếu Giao Hàng
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <FormField label="Trang Trại Xuất Hàng">
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

          <FormField label="Chọn Đơn Bán Hàng Cần Giao (*)" error={errors.order}>
            <Select
              value={selectedOrderId}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="w-full text-xs"
            >
              <option value="">-- Chọn đơn hàng đã duyệt --</option>
              {salesOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderCode} - {o.partnerName} (Trạng thái: {o.status})
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Mã Phiếu Giao Hàng">
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                value={formData.deliveryCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, deliveryCode: e.target.value }))}
                placeholder="DO-YYMMDD-XX"
                className="w-full text-xs font-mono font-bold text-blue-900"
              />
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setFormData((prev) => ({ ...prev, deliveryCode: generateDeliveryCode() }))}
                title="Tạo mã mới"
              >
                Gợi Ý
              </Button>
            </div>
          </FormField>

          <FormField label="Ngày Giao Hàng (*)" error={errors.deliveryDate}>
            <Input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, deliveryDate: e.target.value }))}
              className="w-full text-xs"
            />
          </FormField>

          <FormField label="Đơn Vị Vận Chuyển / Logistics">
            <Select
              value={formData.logisticsPartnerId}
              onChange={(e) => setFormData((prev) => ({ ...prev, logisticsPartnerId: e.target.value }))}
              className="w-full text-xs"
            >
              <option value="">-- Xe nhà / Tự giao --</option>
              {logisticsPartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.partnerType})
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Tên Tài Xế & SĐT">
            <Input
              type="text"
              placeholder="VD: Nguyễn Văn Tài - 0987654321"
              value={formData.driverName}
              onChange={(e) => setFormData((prev) => ({ ...prev, driverName: e.target.value }))}
              className="w-full text-xs"
            />
          </FormField>

          <FormField label="Biển Số Xe Vận Chuyển">
            <Input
              type="text"
              placeholder="VD: 49C-123.45"
              value={formData.vehiclePlate}
              onChange={(e) => setFormData((prev) => ({ ...prev, vehiclePlate: e.target.value }))}
              className="w-full text-xs font-mono"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Người Nhận Hàng">
            <Input
              type="text"
              placeholder="Họ tên người nhận tại kho đích"
              value={formData.receiverName}
              onChange={(e) => setFormData((prev) => ({ ...prev, receiverName: e.target.value }))}
              className="w-full text-xs"
            />
          </FormField>

          <FormField label="Địa Chỉ Giao Hàng">
            <Input
              type="text"
              placeholder="Kho hàng hoặc địa chỉ nhận của khách"
              value={formData.shippingAddress}
              onChange={(e) => setFormData((prev) => ({ ...prev, shippingAddress: e.target.value }))}
              className="w-full text-xs"
            />
          </FormField>
        </div>

        {/* Bảng chi tiết mặt hàng xuất giao */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span>Mặt Hàng & Số Lượng Xuất Giao Đợt Này ({formData.items.length})</span>
          </h4>

          {errors.items && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              {errors.items}
            </div>
          )}

          {formData.items.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Mặt Hàng</th>
                    <th className="py-2.5 px-3 text-right">Đã Đặt</th>
                    <th className="py-2.5 px-3 text-right">Đã Giao</th>
                    <th className="py-2.5 px-3 text-right">Còn Lại</th>
                    <th className="py-2.5 px-3 w-32 text-right">Xuất Giao Đợt Này (*)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((row, idx) => (
                    <tr key={row.salesOrderItemId} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {row.itemName}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {formatNumber(row.totalOrderedQuantity)} {row.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">
                        {formatNumber(row.shippedQuantity)} {row.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-800">
                        {formatNumber(row.remainingQuantity)} {row.unit}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            min="0"
                            max={row.remainingQuantity}
                            step="any"
                            value={row.quantity}
                            onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                            className="w-24 text-xs font-mono font-bold text-right"
                          />
                          <span className="text-[10px] text-slate-400 shrink-0">{row.unit}</span>
                        </div>
                        {errors[`qty_${idx}`] && (
                          <span className="text-[10px] text-rose-600 block mt-0.5 text-right">{errors[`qty_${idx}`]}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <FormField label="URL Ảnh Biên Bản Bàn Giao (POD - Proof of Delivery)">
          <Input
            type="text"
            placeholder="https://... ảnh chụp biên bản có chữ ký nhận của khách"
            value={formData.proofOfDeliveryUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, proofOfDeliveryUrl: e.target.value }))}
            className="w-full text-xs"
          />
        </FormField>

        <FormField label="Ghi Chú Đợt Giao">
          <textarea
            rows="2"
            placeholder="Ghi chú về tình trạng niêm phong, tài xế hoặc lịch trình..."
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default CreateDeliveryModal;
