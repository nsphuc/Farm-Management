import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Trash2, User, DollarSign, Calendar } from 'lucide-react';
import { financeService } from '../../services/financeService';
import { partnerService } from '../../services/partnerService';
import { toast } from 'sonner';

export const CreateSalesOrderModal = ({ isOpen, onClose, farmId, onSaved }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    partnerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    notes: '',
    discountAmount: 0,
    taxAmount: 0,
    paidAmount: 0,
  });

  const [items, setItems] = useState([
    { productName: '', quantity: 1, unit: 'kg', unitPrice: 0, discountAmount: 0 }
  ]);

  useEffect(() => {
    if (isOpen && farmId) {
      loadPartners();
    }
  }, [isOpen, farmId]);

  const loadPartners = async () => {
    try {
      const res = await partnerService.getPartners(farmId).catch(() => []);
      const pList = Array.isArray(res) ? res : res?.items || [];
      setPartners(pList);
      if (pList.length > 0) {
        setFormData(prev => ({ ...prev, partnerId: pList[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { productName: '', quantity: 1, unit: 'kg', unitPrice: 0, discountAmount: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Tính toán tổng tiền
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discountAmount) || 0);
    return sum + (lineTotal > 0 ? lineTotal : 0);
  }, 0);

  const totalAmount = subtotal - (Number(formData.discountAmount) || 0) + (Number(formData.taxAmount) || 0);
  const debtRemaining = Math.max(0, totalAmount - (Number(formData.paidAmount) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partnerId) {
      toast.error('Vui lòng chọn khách hàng / đại lý thu mua');
      return;
    }

    const invalidItem = items.find(i => !i.productName.trim() || Number(i.quantity) <= 0 || Number(i.unitPrice) < 0);
    if (invalidItem) {
      toast.error('Vui lòng kiểm tra lại thông tin các mặt hàng (tên, số lượng > 0, đơn giá)');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        partnerId: Number(formData.partnerId),
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate || null,
        notes: formData.notes,
        discountAmount: Number(formData.discountAmount) || 0,
        taxAmount: Number(formData.taxAmount) || 0,
        paidAmount: Number(formData.paidAmount) || 0,
        items: items.map(item => ({
          productName: item.productName,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount) || 0
        }))
      };

      await financeService.createSalesOrder(farmId, payload);
      toast.success('Tạo đơn hàng xuất bán thành công');
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Tạo Đơn Hàng Xuất Bán Nông Sản</h2>
              <p className="text-xs text-gray-500">Ghi nhận doanh thu bán hàng & tự động lập sổ công nợ phải thu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Khách hàng / Đại lý thu mua *</label>
              <select
                required
                value={formData.partnerId}
                onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn khách hàng --</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.phone || 'N/A'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày lập đơn *</label>
              <input
                type="date"
                required
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày hẹn giao hàng</label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Danh sách mặt hàng bán */}
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Chi Tiết Mặt Hàng Xuất Bán
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm dòng
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Tên nông sản (VD: Bắp cải Green Nova, Heo hơi...)"
                    value={item.productName}
                    onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                    className="flex-[3] rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    placeholder="Số lượng"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-20 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-right focus:border-blue-500 focus:outline-none font-medium"
                  />
                  <input
                    type="text"
                    placeholder="ĐVT"
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    className="w-14 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-center focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="Đơn giá (đ)"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="w-28 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-right focus:border-blue-500 focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                    className="p-1 text-gray-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tính toán thanh toán & công nợ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl bg-gray-50 p-4 border border-gray-100">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú đơn hàng</label>
                <textarea
                  rows="3"
                  placeholder="Ghi chú đóng gói, địa điểm giao nhận..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Tiền hàng (Tạm tính):</span>
                <span className="font-bold text-gray-900">{new Intl.NumberFormat('vi-VN').format(subtotal)} đ</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Chiết khấu đơn hàng:</span>
                <input
                  type="number"
                  min="0"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                  className="w-28 rounded border border-gray-200 px-2 py-0.5 text-right font-medium bg-white"
                />
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Tiền thuế VAT:</span>
                <input
                  type="number"
                  min="0"
                  value={formData.taxAmount}
                  onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                  className="w-28 rounded border border-gray-200 px-2 py-0.5 text-right font-medium bg-white"
                />
              </div>
              <div className="flex justify-between border-t pt-1.5 text-sm font-bold text-gray-900">
                <span>TỔNG CỘNG ĐƠN HÀNG:</span>
                <span className="text-blue-600 font-extrabold">{new Intl.NumberFormat('vi-VN').format(totalAmount)} đ</span>
              </div>
              <div className="flex items-center justify-between border-t pt-1.5">
                <span className="font-semibold text-emerald-700">Khách đã trả (Đặt cọc/TT):</span>
                <input
                  type="number"
                  min="0"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  className="w-32 rounded border border-emerald-300 px-2 py-1 text-right font-bold text-emerald-700 bg-white"
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-600">
                <span>Còn nợ (Tự động ghi nhận công nợ):</span>
                <span>{new Intl.NumberFormat('vi-VN').format(debtRemaining)} đ</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang tạo đơn...' : 'Tạo Đơn Hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
