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
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { BarcodeScannerInput } from '@/components/common/BarcodeScannerInput';
import { geographyService } from '@/services/modules/geographyService';
import { inventoryService } from '@/services/modules/inventoryService';
import { masterDataService } from '@/services/modules/masterDataService';
import { partnerService } from '@/services/modules/partnerService';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { formatCurrency } from '@/utils/formatters';
import { generateLotCode, commitLotCode } from '@/utils/codeGenerator';
import { convertQuantityToCapacityUnit } from '@/utils/unitConverter';

const RECEIPT_TYPES = [
  { value: 'PURCHASE', label: 'Nhập mua từ NCC (PURCHASE)' },
  { value: 'HARVEST_RETURN', label: 'Nhập nông sản / trả hàng (HARVEST_RETURN)' },
  { value: 'INTERNAL_TRANSFER', label: 'Nhập điều chuyển nội bộ (INTERNAL_TRANSFER)' },
  { value: 'ADJUSTMENT', label: 'Nhập điều chỉnh kho (ADJUSTMENT)' },
];

// Helper tính ngày hết hạn tự động chuẩn xác theo múi giờ địa phương
function calcExpiryDate(receiptDateStr, shelfLifeDays) {
  const days = Number(shelfLifeDays) > 0 ? Number(shelfLifeDays) : 180;
  let d;
  if (receiptDateStr && String(receiptDateStr).includes('-')) {
    const parts = String(receiptDateStr).split('-');
    d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  } else {
    d = new Date();
  }
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  const [zoneLocations, setZoneLocations] = useState([]);
  const [selectedZoneName, setSelectedZoneName] = useState('');
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [existingBatches, setExistingBatches] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    warehouseId: '',
    receiptType: 'PURCHASE',
    partnerId: '',
    receiptDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [],
  });

  // Tải danh mục vật tư, đối tác & danh sách lô hiện có để sinh mã số lô tuần tự
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          setIsLoadingMasterData(true);
          const [matRes, partRes, invRes, recRes] = await Promise.all([
            masterDataService.getMaterials({ size: 200 }).catch(() => ({ content: [] })),
            partnerService.getPartners({ size: 100, partnerType: 'SUPPLIER' }).catch(() => ({ content: [] })),
            inventoryService.getInventory({ farmId, size: 200 }).catch(() => ({ content: [] })),
            inventoryService.getReceipts({ farmId, size: 50 }).catch(() => ({ content: [] })),
          ]);
          setMaterials(matRes?.content || (Array.isArray(matRes) ? matRes : []));
          setPartners(partRes?.content || (Array.isArray(partRes) ? partRes : []));

          const batches = [
            ...(invRes?.content || (Array.isArray(invRes) ? invRes : [])).map((i) => i.batchNumber),
            ...(recRes?.content || (Array.isArray(recRes) ? recRes : [])).flatMap((r) => (r.items || []).map((i) => i.batchNumber)),
          ].filter(Boolean);
          setExistingBatches(batches);

          // Tự động đồng bộ số lô tuần tự cho dòng đầu tiên nếu chưa chọn vật tư
          setFormData((prev) => {
            if (prev.items.length === 1 && (!prev.items[0].materialId || prev.items[0].batchNumber.startsWith('LOT-'))) {
              const updatedFirstBatch = generateLotCode(prev.receiptDate || new Date(), batches, []);
              return {
                ...prev,
                items: [{ ...prev.items[0], batchNumber: updatedFirstBatch }],
              };
            }
            return prev;
          });
        } catch (err) {
          console.error('Lỗi tải dữ liệu lập phiếu nhập:', err);
        } finally {
          setIsLoadingMasterData(false);
        }
      };

      loadData();

      // Reset form với số lô tuần tự ban đầu
      const initialBatch = generateLotCode(new Date(), existingBatches, []);
      setFormData({
        warehouseId: defaultWarehouseId ? String(defaultWarehouseId) : (warehouses?.[0]?.id ? String(warehouses[0].id) : ''),
        receiptType: 'PURCHASE',
        partnerId: '',
        receiptDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: [createDefaultItem(null, initialBatch)],
      });
      setErrors({});
    }
  }, [isOpen, defaultWarehouseId, farmId]);

  // Đồng bộ vị trí kệ (zoneLocations) từ Phân khu mặt bằng khi chọn kho nhận hàng
  useEffect(() => {
    if (!formData.warehouseId || !farmId) {
      setZoneLocations([]);
      setSelectedZoneName('');
      return;
    }
    const currentWh = warehouses.find((w) => String(w.id) === String(formData.warehouseId));
    if (currentWh?.zoneId) {
      setSelectedZoneName(currentWh.zoneName || `Phân khu #${currentWh.zoneId}`);
      geographyService
        .getLocations(farmId, currentWh.zoneId)
        .then((res) => {
          const allLocs = Array.isArray(res) ? res : res?.content || [];
          // CHỈ lọc các kệ thuộc kho nhận hàng này
          const whShelves = allLocs.filter((loc) => Number(loc.warehouseId) === Number(currentWh.id));
          setZoneLocations(whShelves);
        })
        .catch((err) => {
          console.error('Lỗi tải vị trí kệ phân khu:', err);
          setZoneLocations([]);
        });
    } else {
      setZoneLocations([]);
      setSelectedZoneName('');
    }
  }, [formData.warehouseId, farmId, warehouses]);

  // Xử lý đổi kho nhận hàng: tự động làm sạch kệ cũ đã chọn
  const handleWarehouseChange = (newWhId) => {
    setFormData((prev) => ({
      ...prev,
      warehouseId: newWhId,
      items: prev.items.map((it) => ({
        ...it,
        storageBinCode: '',
      })),
    }));
  };

  function createDefaultItem(material = null, customBatch = null) {
    const batch = customBatch || generateLotCode(formData?.receiptDate || new Date(), existingBatches, formData?.items || []);
    const purchaseConv = (material?.conversions || []).find((c) => c.isPurchaseUnit || c.is_purchase_unit);
    const enteredUnit = purchaseConv ? (purchaseConv.unitName || purchaseConv.packagingUnit) : (material?.standardUnit || 'KG');
    const factor = purchaseConv ? Number(purchaseConv.conversionFactor || 1) : 1;
    const stdPrice = Number(material?.unitPriceStandard) || Number(material?.unitPrice) || 0;
    const shelfLife = Number(material?.shelfLifeDays) || 180;
    const expiry = calcExpiryDate(formData?.receiptDate, shelfLife);
    return {
      id: Date.now() + Math.random(),
      materialId: material?.id ? String(material.id) : '',
      materialName: material?.name || '',
      skuCode: material?.skuCode || '',
      standardUnit: material?.standardUnit || 'KG',
      availableUnits: material ? [material.standardUnit, ...(material.conversions || []).map((c) => c.packagingUnit || c.unitName)].filter(Boolean) : ['KG'],
      conversions: material?.conversions || [],
      batchNumber: batch,
      enteredUnit,
      enteredQuantity: 1,
      conversionFactor: factor,
      quantity: factor,
      unitPrice: stdPrice,
      totalPrice: stdPrice,
      expiryDate: expiry,
      storageBinCode: '',
    };
  }

  // Khi người dùng chọn vật tư trên dòng
  const handleMaterialChange = (index, materialIdStr) => {
    const selectedMat = materials.find((m) => String(m.id) === String(materialIdStr));
    setFormData((prev) => {
      const newItems = [...prev.items];
      if (selectedMat) {
        const units = [
          selectedMat.standardUnit,
          ...(selectedMat.conversions || []).map((c) => c.packagingUnit || c.unitName),
        ].filter(Boolean);

        // ƯU TIÊN tự động chọn Đơn vị mua hàng (isPurchaseUnit) trong cài đặt tĩnh
        const purchaseConv = (selectedMat.conversions || []).find((c) => c.isPurchaseUnit || c.is_purchase_unit);
        const enteredUnit = purchaseConv ? (purchaseConv.unitName || purchaseConv.packagingUnit) : (selectedMat.standardUnit || 'KG');
        const conversionFactor = purchaseConv ? Number(purchaseConv.conversionFactor || 1) : 1;

        const enteredQuantity = Number(newItems[index].enteredQuantity) || 1;
        const quantity = enteredQuantity * conversionFactor;

        // Đơn giá chuẩn từ Danh mục vật tư (đã gắn cho đơn vị nhập/mua hàng)
        const stdPrice = Number(selectedMat.unitPriceStandard) || Number(selectedMat.unitPrice) || 0;
        const unitPrice = stdPrice > 0 ? stdPrice : (Number(newItems[index].unitPrice) || 0);

        // Tự động tính hạn sử dụng dựa trên shelfLifeDays cấu hình trong danh mục vật tư
        const shelfLife = Number(selectedMat.shelfLifeDays) || 180;
        const expiryDate = calcExpiryDate(prev.receiptDate, shelfLife);

        newItems[index] = {
          ...newItems[index],
          materialId: String(selectedMat.id),
          materialName: selectedMat.name,
          skuCode: selectedMat.skuCode,
          standardUnit: selectedMat.standardUnit || 'KG',
          availableUnits: units,
          conversions: selectedMat.conversions || [],
          enteredUnit,
          conversionFactor,
          quantity,
          unitPrice,
          totalPrice: enteredQuantity * unitPrice,
          expiryDate,
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          materialId: '',
          materialName: '',
          skuCode: '',
          availableUnits: [],
          unitPrice: 0,
          totalPrice: 0,
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
      const selectedMat = materials.find((m) => String(m.id) === String(item.materialId));
      const purchaseConv = (selectedMat?.conversions || []).find((c) => c.isPurchaseUnit || c.is_purchase_unit)
        || (selectedMat?.conversions || [])[0];
      const basePackFactor = purchaseConv ? Number(purchaseConv.conversionFactor || 1) : 1;
      const stdPrice = Number(selectedMat?.unitPriceStandard) || Number(selectedMat?.unitPrice) || 0;

      let factor = 1;
      if (enteredUnit !== item.standardUnit) {
        const conv = (item.conversions || []).find((c) => (c.packagingUnit || c.unitName) === enteredUnit);
        if (conv && conv.conversionFactor) {
          factor = Number(conv.conversionFactor);
        }
      }
      const qty = Number(item.enteredQuantity || 0) * factor;

      // Đơn giá chuẩn trong danh mục là giá cho 1 đơn vị đóng gói/mua hàng (bao, chai, lọ, thùng...)
      // Khi người dùng đổi đơn vị nhập:
      // - Nếu chọn đơn vị mua hàng chuẩn: unitPrice = stdPrice
      // - Nếu chọn đơn vị chuẩn (KG/Lít): unitPrice = stdPrice / basePackFactor
      // - Nếu chọn đơn vị quy đổi khác: unitPrice = (stdPrice / basePackFactor) * factor
      let unitPrice = Number(item.unitPrice) || 0;
      if (stdPrice > 0 && basePackFactor > 0) {
        unitPrice = Math.round((stdPrice / basePackFactor) * factor);
      }

      newItems[index] = {
        ...item,
        enteredUnit,
        conversionFactor: factor,
        quantity: qty,
        unitPrice,
        totalPrice: Number(item.enteredQuantity || 0) * unitPrice,
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

  // Thêm dòng mới với số lô tự động tăng dần tuần tự
  const handleAddItem = () => {
    setFormData((prev) => {
      const nextBatch = generateLotCode(prev.receiptDate || new Date(), existingBatches, prev.items);
      return {
        ...prev,
        items: [...prev.items, createDefaultItem(null, nextBatch)],
      };
    });
  };

  // Tự động sinh lại số lô tuần tự cho một dòng
  const handleRegenerateBatch = (index) => {
    setFormData((prev) => {
      const otherItems = prev.items.filter((_, i) => i !== index);
      const nextBatch = generateLotCode(prev.receiptDate || new Date(), existingBatches, otherItems);
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], batchNumber: nextBatch };
      return { ...prev, items: newItems };
    });
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
      // Thêm dòng mới với số lô tuần tự
      const nextBatch = generateLotCode(formData.receiptDate || new Date(), existingBatches, formData.items);
      const newItem = createDefaultItem(matchedMat, nextBatch);
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

      // Kiểm tra sức chứa kệ lưu trữ (có tự động quy đổi đơn vị: kg -> tấn, v.v.)
      if (!errs.items && zoneLocations && zoneLocations.length > 0) {
        const binSums = {};
        for (const it of formData.items) {
          if (it.storageBinCode) {
            const loc = zoneLocations.find((l) => l.code === it.storageBinCode);
            const capUnit = loc?.capacityUnit;
            const convertedQty = convertQuantityToCapacityUnit(it, capUnit);
            // Chỉ cộng dồn nếu 2 đơn vị có thể quy đổi với nhau
            if (convertedQty !== null && convertedQty !== undefined) {
              binSums[it.storageBinCode] = (binSums[it.storageBinCode] || 0) + convertedQty;
            }
          }
        }
        for (const [code, sumQty] of Object.entries(binSums)) {
          const loc = zoneLocations.find((l) => l.code === code);
          if (loc && loc.capacity !== null && loc.capacity !== undefined) {
            if (sumQty > loc.capacity) {
              const unitStr = loc.capacityUnit ? ` ${loc.capacityUnit}` : '';
              errs.items = `Kệ [${loc.code} - ${loc.name}] không đủ sức chứa! Sức chứa còn lại: ${loc.capacity}${unitStr}, tổng số lượng cần nhập: ${Number(sumQty.toFixed(2))}${unitStr}. Vui lòng giảm số lượng hoặc phân bổ sang kệ khác!`;
              break;
            }
          }
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e, autoComplete = false) => {
    if (e && e.preventDefault) e.preventDefault();
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

      const created = await inventoryService.createReceipt(farmId, payload);
      // Ghi nhận các số lô tuần tự đã tạo
      payload.items.forEach((it) => {
        if (it.batchNumber) {
          commitLotCode(it.batchNumber);
        }
      });

      if (autoComplete && created?.id) {
        await inventoryService.completeReceipt(farmId, created.id);
        toast.success(`Đã lập và hoàn tất nhập kho [${created.receiptCode || ''}]! Tồn kho, sức chứa kệ và công nợ WS-H2 đã được cập nhật.`);
      } else {
        toast.success('Lập phiếu nhập kho nháp (DRAFT) thành công! Vào danh sách phiếu để duyệt hoàn tất.');
      }

      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('inventory');
      useActiveFarmStore.getState().notifyDataChanged?.('finance');
      useActiveFarmStore.getState().notifyDataChanged?.('geography');
      useActiveFarmStore.getState().notifyDataChanged?.('partners');
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => handleSubmit(e, false)}
              isLoading={isSubmitting}
              icon={<Save className="h-4 w-4" />}
            >
              Lưu Bản Nháp (DRAFT)
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={(e) => handleSubmit(e, true)}
              isLoading={isSubmitting}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Lưu & Hoàn Tất Nhập Kho
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 text-xs">
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
                onChange={(e) => handleWarehouseChange(e.target.value)}
                required
              >
                <option value="">-- Chọn kho nhận hàng --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName || w.name} ({w.warehouseCode || w.code || `#${w.id}`})
                    {w.zoneName ? ` • [Phân khu: ${w.zoneName}]` : ''}
                  </option>
                ))}
              </Select>
              {selectedZoneName && (
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <MapPin className="w-3 h-3 text-emerald-600 inline" />
                  <span>Phân khu: <strong>{selectedZoneName}</strong> ({zoneLocations.length} kệ thuộc kho)</span>
                </div>
              )}
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
                onChange={(e) => {
                  const newDate = e.target.value;
                  setFormData((prev) => {
                    const updatedItems = prev.items.map((it) => {
                      if (!it.materialId) return it;
                      const mat = materials.find((m) => String(m.id) === String(it.materialId));
                      const shelfLife = Number(mat?.shelfLifeDays) || 180;
                      return { ...it, expiryDate: calcExpiryDate(newDate, shelfLife) };
                    });
                    return { ...prev, receiptDate: newDate, items: updatedItems };
                  });
                }}
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
                    <th className="py-2 px-2.5 min-w-[180px]">Mặt Hàng Vật Tư *</th>
                    <th className="py-2 px-2 min-w-[155px]">Số Lô (Batch) *</th>
                    <th className="py-2 px-2 min-w-[100px]">ĐVT Nhập</th>
                    <th className="py-2 px-2 min-w-[90px] text-right">SL Nhập *</th>
                    <th className="py-2 px-2 min-w-[90px] text-right">SL Chuẩn</th>
                    <th className="py-2 px-2 min-w-[100px] text-right">Đơn Giá (₫)</th>
                    <th className="py-2 px-2 min-w-[110px] text-right">Thành Tiền (₫)</th>
                    <th className="py-2 px-2 min-w-[145px]">Hạn Dùng</th>
                    <th className="py-2 px-2 min-w-[110px]">
                      Vị Trí Kệ {selectedZoneName ? <span className="text-[10px] text-emerald-600 block font-normal">({zoneLocations.length} kệ)</span> : ''}
                    </th>
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
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={item.batchNumber}
                            onChange={(e) => handleItemValueChange(idx, 'batchNumber', e.target.value.toUpperCase())}
                            placeholder="LOT-YYMMDD-01"
                            className="w-full font-mono font-bold rounded border border-slate-300 px-2 py-1 pr-6 text-xs focus:outline-emerald-500 uppercase bg-slate-50/50"
                            required
                          />
                          <button
                            type="button"
                            title="Tự động sinh lại số lô tuần tự"
                            onClick={() => handleRegenerateBatch(idx)}
                            className="absolute right-1 text-slate-400 hover:text-emerald-600 transition-colors p-0.5 rounded cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Đơn vị nhập quy đổi */}
                      <td className="py-2 px-2">
                        <select
                          value={item.enteredUnit}
                          onChange={(e) => handleUnitChange(idx, e.target.value)}
                          className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-emerald-500 font-medium"
                        >
                          <option value={item.standardUnit}>
                            {item.standardUnit} (ĐVT Chuẩn)
                          </option>
                          {(item.conversions || []).map((c) => {
                            const uName = c.unitName || c.packagingUnit;
                            const isPurch = c.isPurchaseUnit || c.is_purchase_unit;
                            return (
                              <option key={uName} value={uName}>
                                {uName} (1 {uName} = {c.conversionFactor} {item.standardUnit}){isPurch ? ' • [ĐVT Mua]' : ''}
                              </option>
                            );
                          })}
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
                        <span className="font-mono text-slate-800 block px-2 py-1 bg-slate-100 rounded text-xs font-bold">
                          {item.quantity} {item.standardUnit}
                        </span>
                        {item.conversionFactor && Number(item.conversionFactor) !== 1 && (
                          <span className="text-[10px] text-emerald-700 font-mono block mt-0.5 font-medium">
                            (= {item.enteredQuantity} × {item.conversionFactor} {item.standardUnit})
                          </span>
                        )}
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
                          className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-emerald-500 font-mono"
                        />
                        {item.materialId && (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium whitespace-nowrap">
                            {(() => {
                              const mat = materials.find((m) => String(m.id) === String(item.materialId));
                              const days = Number(mat?.shelfLifeDays) || 180;
                              const years = Number((days / 365).toFixed(1));
                              return `Hạn ${days} ngày (${years} năm)`;
                            })()}
                          </div>
                        )}
                      </td>

                      {/* Vị trí kệ */}
                      <td className="py-2 px-2">
                        {zoneLocations && zoneLocations.length > 0 ? (
                          <>
                            <select
                              value={item.storageBinCode || ''}
                              onChange={(e) => handleItemValueChange(idx, 'storageBinCode', e.target.value)}
                              className={`w-full font-mono rounded border px-1.5 py-1 text-xs focus:outline-emerald-500 bg-white ${
                                (() => {
                                  if (!item.storageBinCode) return 'border-slate-300';
                                  const loc = zoneLocations.find((l) => l.code === item.storageBinCode);
                                  if (!loc || loc.capacity === null || loc.capacity === undefined) return 'border-slate-300';
                                  const totalQty = formData.items
                                    .filter((it) => it.storageBinCode === item.storageBinCode)
                                    .reduce((acc, it) => acc + (Number(it.quantity) || Number(it.enteredQuantity) || 0), 0);
                                  return totalQty > loc.capacity ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-slate-300';
                                })()
                              }`}
                            >
                              <option value="">-- Chọn kệ ({zoneLocations.length}) --</option>
                              {zoneLocations.map((loc) => {
                                const isFull = loc.capacity !== null && loc.capacity !== undefined && loc.capacity <= 0;
                                return (
                                  <option key={loc.id} value={loc.code} disabled={isFull}>
                                    {loc.code} - {loc.name} {loc.capacity !== null && loc.capacity !== undefined ? (isFull ? '(❌ ĐÃ ĐẦY - Sức chứa: 0)' : `(Còn lại: ${loc.capacity} ${loc.capacityUnit || ''})`.trim()) : '(Không giới hạn)'}
                                  </option>
                                );
                              })}
                            </select>
                            {(() => {
                              if (!item.storageBinCode) return null;
                              const loc = zoneLocations.find((l) => l.code === item.storageBinCode);
                              if (!loc || loc.capacity === null || loc.capacity === undefined) return null;
                              const relevantItems = formData.items.filter((it) => it.storageBinCode === item.storageBinCode);
                              let totalConverted = 0;
                              let canConvert = false;
                              for (const it of relevantItems) {
                                const c = convertQuantityToCapacityUnit(it, loc.capacityUnit);
                                if (c !== null && c !== undefined) {
                                  totalConverted += c;
                                  canConvert = true;
                                }
                              }
                              if (canConvert && totalConverted > loc.capacity) {
                                const unitStr = loc.capacityUnit ? ` ${loc.capacityUnit}` : '';
                                return (
                                  <div className="text-[10px] text-amber-800 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 mt-1 font-semibold flex items-center gap-1">
                                    <span>⚠️ Vượt sức chứa: Còn {loc.capacity}{unitStr}, nhập {Number(totalConverted.toFixed(2))}{unitStr}</span>
                                  </div>
                                );
                              }
                              return (
                                <div className="text-[10px] text-emerald-700 mt-0.5 font-mono">
                                  Sức chứa còn lại: <span className="font-bold">{loc.capacity} {loc.capacityUnit || ''}</span>
                                </div>
                              );
                            })()}
                          </>
                        ) : (
                          <input
                            type="text"
                            value={item.storageBinCode || ''}
                            onChange={(e) => handleItemValueChange(idx, 'storageBinCode', e.target.value)}
                            placeholder={formData.warehouseId ? "Kho chưa có kệ (nhập tự do)..." : "Chọn kho trước..."}
                            className="w-full font-mono rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-emerald-500 bg-white"
                          />
                        )}
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
