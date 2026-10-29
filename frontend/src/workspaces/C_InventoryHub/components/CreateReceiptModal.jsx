import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Save,
  ScanBarcode,
  Layers,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { BarcodeScannerInput } from '@/components/common/BarcodeScannerInput';
import { inventoryService } from '@/services/modules/inventoryService';
import { masterDataService } from '@/services/modules/masterDataService';
import { partnerService } from '@/services/modules/partnerService';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { formatCurrency } from '@/utils/formatters';

const RECEIPT_TYPES = [
  { value: 'PURCHASE', label: 'Nhập mua từ NCC (PURCHASE)' },
  { value: 'HARVEST_RETURN', label: 'Nhập nông sản / trả hàng (HARVEST_RETURN)' },
  { value: 'INTERNAL_TRANSFER', label: 'Nhập điều chuyển nội bộ (INTERNAL_TRANSFER)' },
  { value: 'ADJUSTMENT', label: 'Nhập điều chỉnh kho (ADJUSTMENT)' },
];

export function CreateReceiptModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  defaultWarehouseId = '',
  warehouses = [],
}) {
  const [partners, setPartners] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    warehouseId: '',
    receiptType: 'PURCHASE',
    partnerId: '',
    receiptDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [],
  });

  // Tải danh mục vật tư & đối tác nhà cung cấp khi mở modal
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          setIsLoadingMasterData(true);
          const [matRes, partRes] = await Promise.all([
            masterDataService.getMaterials({ size: 200 }).catch(() => ({ content: [] })),
            partnerService.getPartners({ size: 100, partnerType: 'SUPPLIER' }).catch(() => ({ content: [] })),
          ]);
          setMaterials(matRes?.content || (Array.isArray(matRes) ? matRes : []));
          setPartners(partRes?.content || (Array.isArray(partRes) ? partRes : []));
        } catch (err) {
          console.error('Lỗi tải dữ liệu lập phiếu nhập:', err);
        } finally {
          setIsLoadingMasterData(false);
        }
      };

      loadData();

      // Reset form
      setFormData({
        warehouseId: defaultWarehouseId ? String(defaultWarehouseId) : (warehouses?.[0]?.id ? String(warehouses[0].id) : ''),
        receiptType: 'PURCHASE',
        partnerId: '',
        receiptDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: [createDefaultItem()],
      });
      setErrors({});
    }
  }, [isOpen, defaultWarehouseId, farmId]);

  function createDefaultItem(material = null) {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(10 + Math.random() * 90);
    return {
      id: Date.now() + Math.random(),
      materialId: material?.id ? String(material.id) : '',
      materialName: material?.name || '',
      skuCode: material?.skuCode || '',
      standardUnit: material?.standardUnit || 'KG',
      availableUnits: material ? [material.standardUnit, ...(material.conversions || []).map((c) => c.packagingUnit)] : ['KG'],
      conversions: material?.conversions || [],
      batchNumber: `LOT-${dateStr}-${rand}`,
      enteredUnit: material?.standardUnit || 'KG',
      enteredQuantity: 1,
      conversionFactor: 1,
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      storageBinCode: '',
    };
  }

  // Khi người dùng chọn vật tư trên dòng
  const handleMaterialChange = (index, materialIdStr) => {
    const selectedMat = materials.find((m) => String(m.id) === materialIdStr);
    setFormData((prev) => {
      const newItems = [...prev.items];
      if (selectedMat) {
        const units = [selectedMat.standardUnit, ...(selectedMat.conversions || []).map((c) => c.packagingUnit)].filter(Boolean);
        const enteredUnit = selectedMat.standardUnit || 'KG';
        const enteredQuantity = newItems[index].enteredQuantity || 1;
        const conversionFactor = 1;
        const quantity = enteredQuantity * conversionFactor;
        const unitPrice = newItems[index].unitPrice || 0;

        newItems[index] = {
          ...newItems[index],
          materialId: materialIdStr,
          materialName: selectedMat.name,
          skuCode: selectedMat.skuCode,
          standardUnit: selectedMat.standardUnit || 'KG',
          availableUnits: units,
          conversions: selectedMat.conversions || [],
          enteredUnit,
          conversionFactor,
          quantity,
          totalPrice: enteredQuantity * unitPrice,
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          materialId: '',
          materialName: '',
          skuCode: '',
          availableUnits: [],
        };
      }
      return { ...prev, items: newItems };
    });
  };

  // Khi thay đổi đơn vị nhập quy đổi
  const handleUnitChange = (index, enteredUnit) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = newItems[index];
      let factor = 1;
      if (enteredUnit !== item.standardUnit) {
        const conv = (item.conversions || []).find((c) => c.packagingUnit === enteredUnit);
        if (conv && conv.conversionFactor) {
          factor = Number(conv.conversionFactor);
        }
      }
      const qty = Number(item.enteredQuantity || 0) * factor;
      newItems[index] = {
        ...item,
        enteredUnit,
        conversionFactor: factor,
        quantity: qty,
      };
      return { ...prev, items: newItems };
    });
  };

  // Cập nhật số lượng nhập hoặc đơn giá
  const handleItemValueChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], [field]: value };
      if (field === 'enteredQuantity') {
        item.quantity = Number(value || 0) * Number(item.conversionFactor || 1);
        item.totalPrice = Number(value || 0) * Number(item.unitPrice || 0);
      } else if (field === 'unitPrice') {
        item.totalPrice = Number(item.enteredQuantity || 0) * Number(value || 0);
      }
      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  };

  // Thêm dòng mới
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createDefaultItem()],
    }));
  };

  // Xóa dòng
  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      toast.warning('Phiếu nhập kho phải có ít nhất 1 dòng vật tư!');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Quét mã vạch tự động
  const handleScanBarcodeSuccess = ({ barcode, data }) => {
    if (!data) return;
    const matchedMat = materials.find(
      (m) => m.id === data.materialId || m.barcode === barcode || m.skuCode === barcode
    ) || data;

    const existingIdx = formData.items.findIndex((item) => String(item.materialId) === String(matchedMat.id));
    if (existingIdx >= 0) {
      // Tăng số lượng nếu đã có dòng
      handleItemValueChange(existingIdx, 'enteredQuantity', Number(formData.items[existingIdx].enteredQuantity || 0) + 1);
      toast.success(`Đã tăng số lượng ${matchedMat.materialName || matchedMat.name} lên 1`);
    } else {
      // Thêm dòng mới
      const newItem = createDefaultItem(matchedMat);
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      toast.success(`Đã thêm dòng vật tư: ${matchedMat.materialName || matchedMat.name}`);
    }
  };

  // Tổng tiền cả phiếu
  const totalReceiptAmount = formData.items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);

  const validate = () => {
    const errs = {};
    if (!formData.warehouseId) {
      errs.warehouseId = 'Vui lòng chọn kho nhận hàng';
    }
    if (formData.receiptType === 'PURCHASE' && !formData.partnerId) {
      errs.partnerId = 'Phiếu nhập mua bắt buộc phải chọn Nhà cung cấp';
    }
    if (!formData.receiptDate) {
      errs.receiptDate = 'Ngày nhập kho không được để trống';
    }
    if (formData.items.length === 0) {
      errs.items = 'Phiếu nhập phải có ít nhất 1 dòng vật tư';
    } else {
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        if (!item.materialId) {
          errs.items = `Dòng #${i + 1}: Vui lòng chọn mặt hàng vật tư`;
          break;
        }
        if (!item.batchNumber?.trim()) {
          errs.items = `Dòng #${i + 1}: Số lô không được để trống`;
          break;
        }
        if (!item.enteredQuantity || Number(item.enteredQuantity) <= 0) {
          errs.items = `Dòng #${i + 1}: Số lượng nhập phải lớn hơn 0`;
          break;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!farmId) {
      toast.error('Không tìm thấy ID trang trại!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const payload = {
        warehouseId: Number(formData.warehouseId),
        receiptType: formData.receiptType,
        partnerId: formData.partnerId ? Number(formData.partnerId) : null,
        receiptDate: formData.receiptDate,
        notes: formData.notes?.trim() || null,
        items: formData.items.map((it) => ({
          materialId: Number(it.materialId),
          batchNumber: it.batchNumber.trim().toUpperCase(),
          expiryDate: it.expiryDate || null,
          enteredUnit: it.enteredUnit || it.standardUnit,
          enteredQuantity: Number(it.enteredQuantity),
          conversionFactor: Number(it.conversionFactor || 1),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice || 0),
          totalPrice: Number(it.totalPrice || 0),
          storageBinCode: it.storageBinCode?.trim() || null,
        })),
      };

      await inventoryService.createReceipt(farmId, payload);
      toast.success('Lập phiếu nhập kho nháp (DRAFT) thành công! Giám đốc trang trại sẽ kiểm tra và phê duyệt.');
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('inventory');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lập phiếu nhập kho:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tạo phiếu nhập kho';
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
      size="xl"
      title="Lập Phiếu Nhập Kho"
      subtitle="Nhập mua vật tư, phân bón, thuốc BVTV, cá thể giống hoặc nhập điều chỉnh"
      icon={<PackagePlus className="h-5 w-5 text-emerald-600" />}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Tổng giá trị phiếu:</span>
            <span className="font-mono font-bold text-sm text-emerald-700">
              {formatCurrency(totalReceiptAmount)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy Bỏ
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} icon={<Save className="h-4 w-4" />}>
              Lưu Bản Nháp (DRAFT)
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errors.form && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* THÔNG TIN CHUNG PHIẾU NHẬP */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Kho Nhận Hàng *" error={errors.warehouseId}>
              <Select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                required
              >
                <option value="">-- Chọn kho nhận hàng --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName || w.name} ({w.warehouseCode || `#${w.id}`})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Loại Phiếu Nhập *">
              <Select
                value={formData.receiptType}
                onChange={(e) => setFormData({ ...formData, receiptType: e.target.value })}
              >
                {RECEIPT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label={formData.receiptType === 'PURCHASE' ? 'Nhà Cung Cấp *' : 'Đối Tác / Nguồn Nhập'}
              error={errors.partnerId}
            >
              <Select
                value={formData.partnerId}
                onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                required={formData.receiptType === 'PURCHASE'}
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.partnerCode || p.taxCode || 'NCC'})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Ngày Nhập Kho *" error={errors.receiptDate}>
              <Input
                type="date"
                value={formData.receiptDate}
                onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                required
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Ghi Chú Nhập Kho" hint="Số hóa đơn đỏ, biển số xe giao hàng...">
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Nhập ghi chú hoặc diễn giải..."
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* BẢNG CHI TIẾT DÒNG VẬT TƯ & SCANNER */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-600" />
                <span>Chi Tiết Mặt Hàng Nhập Kho ({formData.items.length})</span>
              </span>
              {errors.items && <span className="text-rose-600 font-bold text-[11px]">{errors.items}</span>}
            </div>

            <Button
              type="button"
              size="xs"
              variant="outline"
              icon={<Plus className="h-3.5 w-3.5 text-emerald-600" />}
              onClick={handleAddItem}
            >
              + Thêm Dòng Vật Tư
            </Button>
          </div>

          {/* Quét Mã Vạch Barcode */}
          <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
            <BarcodeScannerInput
              onScanSuccess={handleScanBarcodeSuccess}
              placeholder="Quét mã vạch GS1/EAN-13 vật tư để tự động thêm dòng..."
            />
          </div>

          {/* Bảng Dòng Vật Tư */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5 min-w-[170px]">Mặt Hàng Vật Tư *</th>
                    <th className="py-2 px-2 min-w-[120px]">Số Lô (Batch) *</th>
                    <th className="py-2 px-2 min-w-[100px]">ĐVT Nhập</th>
                    <th className="py-2 px-2 min-w-[90px] text-right">SL Nhập *</th>
                    <th className="py-2 px-2 min-w-[90px] text-right">SL Chuẩn</th>
                    <th className="py-2 px-2 min-w-[100px] text-right">Đơn Giá (₫)</th>
                    <th className="py-2 px-2 min-w-[110px] text-right">Thành Tiền (₫)</th>
                    <th className="py-2 px-2 min-w-[110px]">Hạn Dùng</th>
                    <th className="py-2 px-2 min-w-[90px]">Vị Trí Kệ</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      {/* Vật tư */}
                      <td className="py-2 px-2">
                        <select
                          value={item.materialId}
                          onChange={(e) => handleMaterialChange(idx, e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-emerald-500"
                          required
                        >
                          <option value="">-- Chọn vật tư --</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.skuCode})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Số lô */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => handleItemValueChange(idx, 'batchNumber', e.target.value.toUpperCase())}
                          placeholder="LOT-YYMMDD"
                          className="w-full font-mono font-bold rounded border border-slate-300 px-2 py-1 text-xs focus:outline-emerald-500"
                          required
                        />
                      </td>

                      {/* Đơn vị nhập quy đổi */}
                      <td className="py-2 px-2">
                        <select
                          value={item.enteredUnit}
                          onChange={(e) => handleUnitChange(idx, e.target.value)}
                          className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-emerald-500"
                        >
                          {item.availableUnits.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* SL Nhập */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.enteredQuantity}
                          onChange={(e) => handleItemValueChange(idx, 'enteredQuantity', e.target.value)}
                          className="w-full text-right font-mono font-bold rounded border border-slate-300 px-2 py-1 text-xs focus:outline-emerald-500"
                          required
                        />
                      </td>

                      {/* SL Quy chuẩn */}
                      <td className="py-2 px-2 text-right">
                        <span className="font-mono text-slate-600 block px-2 py-1 bg-slate-100 rounded text-xs font-semibold">
                          {item.quantity} {item.standardUnit}
                        </span>
                      </td>

                      {/* Đơn giá */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemValueChange(idx, 'unitPrice', e.target.value)}
                          className="w-full text-right font-mono rounded border border-slate-300 px-2 py-1 text-xs focus:outline-emerald-500"
                        />
                      </td>

                      {/* Thành tiền */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(item.totalPrice)}
                      </td>

                      {/* Hạn sử dụng */}
                      <td className="py-2 px-2">
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleItemValueChange(idx, 'expiryDate', e.target.value)}
                          className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-emerald-500"
                        />
                      </td>

                      {/* Vị trí kệ */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.storageBinCode}
                          onChange={(e) => handleItemValueChange(idx, 'storageBinCode', e.target.value)}
                          placeholder="A-01"
                          className="w-full font-mono rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-emerald-500"
                        />
                      </td>

                      {/* Nút xóa dòng */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default CreateReceiptModal;
