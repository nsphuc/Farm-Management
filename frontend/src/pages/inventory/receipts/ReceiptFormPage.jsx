import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileText,
  Boxes,
  Building2,
  Calendar,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { inventoryTransactionApi } from '../../../services/inventoryTransactionApi';
import { warehouseApi } from '../../../services/warehouseApi';
import { materialApi } from '../../../services/materialApi';
import { partnerApi } from '../../../services/partnerApi';
import { farmApi } from '../../../services/farmApi';
import { useTenantStore } from '../../../store/tenant/useTenantStore';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Trang Lập Phiếu Nhập Kho (Form Master-Detail phức tạp).
 * Nghiệp vụ: 3.3. Nhập kho - Lập phiếu nhập (Sơ đồ phân cấp).
 */
export const ReceiptFormPage = () => {
  const navigate = useNavigate();
  const { currentFarm } = useTenantStore();

  // State danh mục nền tảng (Master Data) để điền vào Form
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [partners, setPartners] = useState([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  // State Form Header (Master Info)
  const [formData, setFormData] = useState({
    warehouseId: '',
    receiptCode: '',
    receiptType: 'PURCHASE',
    partnerId: '',
    receiptDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // State Form Detail (Dynamic Table: Dòng chi tiết vật tư)
  const [items, setItems] = useState([
    {
      id: Date.now(),
      materialId: '',
      batchNumber: '',
      expiryDate: '',
      storageBinCode: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Tải danh sách Trang trại, Vật tư, Đối tác
  useEffect(() => {
    const fetchInitData = async () => {
      setIsLoadingMaster(true);
      try {
        const [farmsRes, materialsRes, partnersRes] = await Promise.all([
          farmApi.getAllFarms(),
          materialApi.getAllMaterials(),
          partnerApi.getAllPartners(),
        ]);

        const farmList = farmsRes.data || [];
        setFarms(farmList);
        if (farmList.length > 0 && !selectedFarmId) {
          setSelectedFarmId(farmList[0].id);
        }

        setMaterials(materialsRes.data || []);
        // Lọc đối tác có vai trò Nhà cung cấp (SUPPLIER) hoặc Đại lý hai chiều (AGENT)
        const supplierList = (partnersRes.data || []).filter(
          (p) => (p.partnerType === 'SUPPLIER' || p.partnerType === 'AGENT') && p.status !== 'INACTIVE'
        );
        setPartners(supplierList);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu nền tảng:', err);
        toast.error('Không thể tải danh mục vật tư hoặc đối tác', 'Lỗi hệ thống');
      } finally {
        setIsLoadingMaster(false);
      }
    };

    fetchInitData();
  }, [selectedFarmId]);

  // 2. Tải danh sách kho theo Farm đã chọn
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!selectedFarmId) return;
      try {
        const res = await warehouseApi.getAllWarehousesByFarm(selectedFarmId);
        const whList = res.data || [];
        setWarehouses(whList);
        if (whList.length > 0) {
          setFormData((prev) => ({ ...prev, warehouseId: whList[0].id }));
        } else {
          setFormData((prev) => ({ ...prev, warehouseId: '' }));
        }
      } catch (err) {
        console.error('Lỗi khi tải kho bãi:', err);
      }
    };

    fetchWarehouses();
  }, [selectedFarmId]);

  // Thêm một dòng chi tiết mới
  const handleAddRow = () => {
    const newRow = {
      id: Date.now() + Math.random(),
      materialId: '',
      batchNumber: '',
      expiryDate: '',
      storageBinCode: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setItems((prev) => [...prev, newRow]);
  };

  // Xóa một dòng chi tiết
  const handleRemoveRow = (rowId) => {
    if (items.length <= 1) {
      toast.warning('Phiếu nhập kho phải có ít nhất 1 dòng chi tiết', 'Thông báo');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== rowId));
  };

  // Cập nhật giá trị của một dòng
  const handleItemChange = (rowId, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;

        const updated = { ...item, [field]: value };

        // Nếu thay đổi Vật tư -> Tự động điền đơn giá tiêu chuẩn nếu có
        if (field === 'materialId') {
          const mat = materials.find((m) => m.id === Number(value));
          if (mat && mat.unitPriceStandard) {
            updated.unitPrice = Number(mat.unitPriceStandard);
          }
        }

        // Tự động tính lại thành tiền = quantity * unitPrice
        const qty = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
        const price = field === 'unitPrice' ? Number(value) || 0 : Number(item.unitPrice) || 0;
        updated.totalPrice = qty * price;

        return updated;
      })
    );
  };

  // Tính tổng tiền và tổng số lượng của toàn phiếu nhập
  const summary = useMemo(() => {
    let totalQty = 0;
    let totalAmount = 0;

    items.forEach((item) => {
      totalQty += Number(item.quantity) || 0;
      totalAmount += Number(item.totalPrice) || 0;
    });

    return { totalQty, totalAmount };
  }, [items]);

  // Client Validation: Kiểm tra hợp lệ trước khi Submit
  const isFormValid = useMemo(() => {
    if (!formData.warehouseId) return false;
    if (!formData.receiptDate) return false;
    if (formData.receiptType === 'PURCHASE' && !formData.partnerId) return false;
    if (items.length === 0) return false;

    // Kiểm tra từng dòng
    for (const item of items) {
      if (!item.materialId) return false;
      if (!item.batchNumber || !item.batchNumber.trim()) return false;
      if (!item.quantity || Number(item.quantity) <= 0) return false;
      if (item.unitPrice === null || item.unitPrice === undefined || Number(item.unitPrice) < 0) return false;
    }

    return true;
  }, [formData, items]);

  // Xử lý gửi Form tạo phiếu nhập kho
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.receiptType === 'PURCHASE' && !formData.partnerId) {
      toast.warning('Hình thức Nhập mua từ Nhà cung cấp BẮT BUỘC phải chọn Đối tác / Nhà cung cấp', 'Thiếu thông tin');
      return;
    }

    if (!isFormValid) {
      toast.warning('Vui lòng điền đầy đủ kho bãi, vật tư, số lô và số lượng > 0 cho từng dòng', 'Thiếu dữ liệu');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        warehouseId: Number(formData.warehouseId),
        receiptCode: formData.receiptCode?.trim() || null,
        receiptType: formData.receiptType,
        partnerId: formData.partnerId ? Number(formData.partnerId) : null,
        receiptDate: formData.receiptDate,
        notes: formData.notes?.trim() || null,
        items: items.map((item) => ({
          materialId: Number(item.materialId),
          batchNumber: item.batchNumber.trim(),
          expiryDate: item.expiryDate || null,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          storageBinCode: item.storageBinCode?.trim() || null,
        })),
      };

      const res = await inventoryTransactionApi.createReceipt(payload);
      toast.success(
        `Đã lập thành công phiếu nhập kho ${res.data?.receiptCode || ''}`,
        'Nhập kho thành công'
      );
      navigate('/inventory/receipts');
    } catch (err) {
      console.error('Lỗi khi tạo phiếu nhập kho:', err);
      // Hiển thị thông báo lỗi chi tiết từ backend
      toast.error(err.message || 'Không thể tạo phiếu nhập kho', 'Lỗi giao dịch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* 1. Header Trang & Nút Hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inventory/receipts')}
            className="p-2 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Lập chứng từ 3.3
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Nhập kho vật tư</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Lập Phiếu Nhập Kho Vật Tư
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/inventory/receipts')}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!isFormValid || isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            <Save className={`w-4 h-4 mr-1.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            {isSubmitting ? 'Đang lưu phiếu...' : 'Lưu & Nhập Kho'}
          </Button>
        </div>
      </div>

      {/* 2. Thông tin Chung (Master Details Header) */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-sm rounded-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          1. Thông tin chung chứng từ nhập kho
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Trang trại */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trang trại áp dụng <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>

          {/* Kho tiếp nhận */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kho bãi tiếp nhận <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              required
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">-- Chọn kho bãi --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          {/* Loại nhập kho */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Loại hình nhập kho <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.receiptType}
              onChange={(e) => setFormData({ ...formData, receiptType: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="PURCHASE">Nhập mua từ nhà cung cấp</option>
              <option value="HARVEST_RETURN">Thu hồi / Nhập sau thu hoạch</option>
              <option value="INTERNAL_TRANSFER">Nhập điều chuyển nội bộ</option>
              <option value="ADJUSTMENT">Nhập điều chỉnh kiểm kê</option>
            </select>
          </div>

          {/* Nhà cung cấp (Nếu là PURCHASE) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nhà cung cấp / Đối tác {formData.receiptType === 'PURCHASE' && <span className="text-rose-500">*</span>}
            </label>
            <select
              value={formData.partnerId}
              onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">-- Chọn đối tác cung cấp --</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Ngày nhập kho */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày hạch toán nhập kho <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.receiptDate}
              onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
              required
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Mã phiếu nhập (Tùy chọn) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã chứng từ <span className="text-slate-400 font-normal">(Hệ thống tự sinh nếu để trống)</span>
            </label>
            <input
              type="text"
              placeholder="VD: PNK-20261017-001"
              value={formData.receiptCode}
              onChange={(e) => setFormData({ ...formData, receiptCode: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase font-mono"
            />
          </div>

          {/* Ghi chú */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú chứng từ
            </label>
            <input
              type="text"
              placeholder="Nhập ghi chú hoặc diễn giải mục đích nhập kho..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>
      </Card>

      {/* 3. Bảng Động Chi tiết Vật tư (Dynamic Items Table) */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-sm rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              2. Danh sách vật tư & số lô nhập kho ({items.length} mặt hàng)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Mỗi dòng vật tư phải có số lô để quản lý hạn dùng (FEFO) và truy xuất nguồn gốc thẻ kho.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Thêm dòng vật tư
          </Button>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[200px]">
                  Mặt hàng vật tư <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 min-w-[130px]">
                  Số lô sản xuất <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 min-w-[120px]">Hạn sử dụng</th>
                <th className="py-2.5 px-3 min-w-[90px]">Vị trí lưu trữ</th>
                <th className="py-2.5 px-3 w-28 text-right">
                  Số lượng <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 w-32 text-right">
                  Đơn giá (đ) <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 w-36 text-right">Thành tiền (đ)</th>
                <th className="py-2.5 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const selectedMaterial = materials.find((m) => m.id === Number(item.materialId));

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                      {index + 1}
                    </td>

                    {/* Chọn vật tư */}
                    <td className="py-2.5 px-3">
                      <select
                        value={item.materialId}
                        onChange={(e) => handleItemChange(item.id, 'materialId', e.target.value)}
                        required
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      >
                        <option value="">-- Chọn mặt hàng --</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.skuCode}) [{m.standardUnit}]
                          </option>
                        ))}
                      </select>
                      {selectedMaterial && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          ĐVT: {selectedMaterial.standardUnit} • Chiến lược: {selectedMaterial.dispatchStrategy}
                        </p>
                      )}
                    </td>

                    {/* Số lô */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        placeholder="VD: LOT-202610-01"
                        value={item.batchNumber}
                        onChange={(e) => handleItemChange(item.id, 'batchNumber', e.target.value)}
                        required
                        className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </td>

                    {/* Hạn sử dụng */}
                    <td className="py-2.5 px-3">
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => handleItemChange(item.id, 'expiryDate', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </td>

                    {/* Vị trí lưu trữ */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        placeholder="Kệ/Ngăn"
                        value={item.storageBinCode}
                        onChange={(e) => handleItemChange(item.id, 'storageBinCode', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </td>

                    {/* Số lượng */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        required
                        className="w-full text-xs text-right font-bold border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </td>

                    {/* Đơn giá */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                        required
                        className="w-full text-xs text-right border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </td>

                    {/* Thành tiền */}
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {formatCurrency(item.totalPrice)}
                    </td>

                    {/* Nút xóa dòng */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Xóa dòng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Tổng kết giá trị phiếu nhập */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500">
            Tổng cộng: <span className="font-bold text-slate-800">{items.length}</span> mặt hàng • Tổng số lượng:{' '}
            <span className="font-bold text-slate-800">{summary.totalQty.toLocaleString('vi-VN')}</span> đơn vị
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Tổng giá trị tiền hàng:
            </span>
            <span className="text-base font-extrabold text-emerald-600">
              {formatCurrency(summary.totalAmount)}
            </span>
          </div>
        </div>
      </Card>
    </form>
  );
};

export default ReceiptFormPage;
