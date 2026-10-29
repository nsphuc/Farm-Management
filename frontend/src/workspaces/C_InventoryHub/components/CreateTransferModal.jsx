import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Layers,
  Warehouse,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { inventoryService } from '@/services/modules/inventoryService';
import { masterDataService } from '@/services/modules/masterDataService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

export function CreateTransferModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  defaultWarehouseId = '',
  warehouses = [],
}) {
  const farms = useActiveFarmStore((s) => s.farms);

  const [toWarehouses, setToWarehouses] = useState([]);
  const [inventoryStock, setInventoryStock] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toFarmId: farmId ? String(farmId) : '',
    toWarehouseId: '',
    transferDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [],
  });

  // Khởi tạo form khi mở modal
  useEffect(() => {
    if (isOpen) {
      const initialFromWh = defaultWarehouseId ? String(defaultWarehouseId) : (warehouses?.[0]?.id ? String(warehouses[0].id) : '');
      const otherWh = (warehouses || []).find((w) => String(w.id) !== initialFromWh);

      setFormData({
        fromWarehouseId: initialFromWh,
        toFarmId: farmId ? String(farmId) : '',
        toWarehouseId: otherWh?.id ? String(otherWh.id) : '',
        transferDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: [createDefaultTransferItem()],
      });
      setToWarehouses(warehouses || []);
      setErrors({});
    }
  }, [isOpen, defaultWarehouseId, farmId]);

  // Tải danh sách kho đích khi toFarmId thay đổi
  useEffect(() => {
    if (isOpen && formData.toFarmId) {
      if (String(formData.toFarmId) === String(farmId)) {
        setToWarehouses(warehouses || []);
      } else {
        masterDataService.getWarehouses(formData.toFarmId)
          .then((res) => {
            const list = Array.isArray(res) ? res : (res?.content || []);
            setToWarehouses(list);
            if (list.length > 0) {
              setFormData((prev) => ({ ...prev, toWarehouseId: String(list[0].id) }));
            }
          })
          .catch(() => setToWarehouses([]));
      }
    }
  }, [isOpen, formData.toFarmId, farmId]);

  // Tải tồn kho khả dụng của kho nguồn fromWarehouseId
  useEffect(() => {
    if (isOpen && formData.fromWarehouseId && farmId) {
      const loadStock = async () => {
        try {
          setIsLoadingStock(true);
          const res = await inventoryService.getInventory({
            farmId,
            warehouseId: Number(formData.fromWarehouseId),
            size: 300,
          });
          const list = res?.content || (Array.isArray(res) ? res : []);
          const availableList = list.filter((it) => (it.availableQuantity ?? it.quantityOnHand) > 0);
          setInventoryStock(availableList);
        } catch (err) {
          console.error('Lỗi khi nạp tồn kho điều chuyển:', err);
          setInventoryStock([]);
        } finally {
          setIsLoadingStock(false);
        }
      };
      loadStock();
    } else {
      setInventoryStock([]);
    }
  }, [isOpen, formData.fromWarehouseId, farmId]);

  function createDefaultTransferItem() {
    return {
      id: Date.now() + Math.random(),
      materialId: '',
      materialName: '',
      fromBatchNumber: '',
      toBatchNumber: '',
      expiryDate: '',
      availableQuantity: 0,
      standardUnit: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      fromBinCode: '',
      toBinCode: '',
      availableBatches: [],
    };
  }

  // Danh sách vật tư có sẵn trong kho nguồn
  const uniqueMaterialsInStock = React.useMemo(() => {
    const map = new Map();
    for (const item of inventoryStock) {
      if (!map.has(item.materialId)) {
        map.set(item.materialId, {
          materialId: item.materialId,
          materialName: item.materialName,
          skuCode: item.skuCode,
          standardUnit: item.standardUnit,
        });
      }
    }
    return Array.from(map.values());
  }, [inventoryStock]);

  // Khi chọn mặt hàng vật tư
  const handleMaterialChange = (index, materialIdStr) => {
    const numMatId = Number(materialIdStr);
    const batches = inventoryStock
      .filter((s) => s.materialId === numMatId)
      .sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      });

    setFormData((prev) => {
      const newItems = [...prev.items];
      if (batches.length > 0) {
        const defaultBatch = batches[0];
        const availQty = Number(defaultBatch.availableQuantity ?? defaultBatch.quantityOnHand ?? 0);
        const unitCost = Number(defaultBatch.unitCost || 0);

        newItems[index] = {
          ...newItems[index],
          materialId: materialIdStr,
          materialName: defaultBatch.materialName,
          fromBatchNumber: defaultBatch.batchNumber,
          toBatchNumber: defaultBatch.batchNumber,
          standardUnit: defaultBatch.standardUnit || 'KG',
          availableQuantity: availQty,
          availableBatches: batches,
          quantity: Math.min(1, availQty),
          unitPrice: unitCost,
          totalPrice: Math.min(1, availQty) * unitCost,
          expiryDate: defaultBatch.expiryDate ? String(defaultBatch.expiryDate).split('T')[0] : '',
          fromBinCode: defaultBatch.storageBinCode || '',
          toBinCode: '',
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          materialId: materialIdStr,
          materialName: '',
          fromBatchNumber: '',
          toBatchNumber: '',
          availableBatches: [],
          availableQuantity: 0,
          quantity: 0,
          totalPrice: 0,
        };
      }
      return { ...prev, items: newItems };
    });
  };

  // Khi chọn số lô nguồn (fromBatchNumber)
  const handleBatchChange = (index, batchNumber) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = newItems[index];
      const selectedBatch = item.availableBatches.find((b) => b.batchNumber === batchNumber);
      if (selectedBatch) {
        const availQty = Number(selectedBatch.availableQuantity ?? selectedBatch.quantityOnHand ?? 0);
        const unitCost = Number(selectedBatch.unitCost || 0);
        const currentQty = Math.min(Number(item.quantity || 1), availQty);

        newItems[index] = {
          ...item,
          fromBatchNumber: batchNumber,
          toBatchNumber: batchNumber,
          availableQuantity: availQty,
          unitPrice: unitCost,
          quantity: currentQty,
          totalPrice: currentQty * unitCost,
          expiryDate: selectedBatch.expiryDate ? String(selectedBatch.expiryDate).split('T')[0] : '',
          fromBinCode: selectedBatch.storageBinCode || '',
        };
      }
      return { ...prev, items: newItems };
    });
  };

  // Cập nhật số lượng chuyển
  const handleQuantityChange = (index, qtyVal) => {
    const qty = Number(qtyVal || 0);
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = newItems[index];
      newItems[index] = {
        ...item,
        quantity: qty,
        totalPrice: qty * Number(item.unitPrice || 0),
      };
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createDefaultTransferItem()],
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      toast.warning('Phiếu điều chuyển phải có ít nhất 1 dòng vật tư!');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const totalTransferAmount = formData.items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);

  const validate = () => {
    const errs = {};
    if (!formData.fromWarehouseId) {
      errs.fromWarehouseId = 'Vui lòng chọn kho xuất điều chuyển';
    }
    if (!formData.toWarehouseId) {
      errs.toWarehouseId = 'Vui lòng chọn kho nhận điều chuyển';
    }
    if (
      String(formData.toFarmId) === String(farmId) &&
      String(formData.fromWarehouseId) === String(formData.toWarehouseId)
    ) {
      errs.toWarehouseId = 'Kho nhận không được trùng với kho xuất';
    }
    if (!formData.transferDate) {
      errs.transferDate = 'Ngày điều chuyển không được để trống';
    }
    if (formData.items.length === 0) {
      errs.items = 'Phiếu điều chuyển phải có ít nhất 1 dòng vật tư';
    } else {
      for (let i = 0; i < formData.items.length; i++) {
        const it = formData.items[i];
        if (!it.materialId) {
          errs.items = `Dòng #${i + 1}: Vui lòng chọn mặt hàng vật tư`;
          break;
        }
        if (!it.fromBatchNumber) {
          errs.items = `Dòng #${i + 1}: Vui lòng chọn lô nguồn xuất`;
          break;
        }
        if (!it.quantity || Number(it.quantity) <= 0) {
          errs.items = `Dòng #${i + 1}: Số lượng điều chuyển phải lớn hơn 0`;
          break;
        }
        if (Number(it.quantity) > Number(it.availableQuantity)) {
          errs.items = `Dòng #${i + 1}: Số lượng chuyển (${it.quantity}) vượt quá tồn khả dụng (${it.availableQuantity}) của lô ${it.fromBatchNumber}`;
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
        fromWarehouseId: Number(formData.fromWarehouseId),
        toFarmId: formData.toFarmId ? Number(formData.toFarmId) : Number(farmId),
        toWarehouseId: Number(formData.toWarehouseId),
        transferDate: formData.transferDate,
        notes: formData.notes?.trim() || null,
        items: formData.items.map((it) => ({
          materialId: Number(it.materialId),
          fromBatchNumber: it.fromBatchNumber.trim(),
          toBatchNumber: (it.toBatchNumber?.trim() || it.fromBatchNumber.trim()).toUpperCase(),
          expiryDate: it.expiryDate || null,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice || 0),
          totalPrice: Number(it.totalPrice || 0),
          fromBinCode: it.fromBinCode?.trim() || null,
          toBinCode: it.toBinCode?.trim() || null,
        })),
      };

      await inventoryService.createTransfer(farmId, payload);
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('inventory');
      toast.success('Lập phiếu điều chuyển (DRAFT) thành công! Giám đốc trang trại sẽ duyệt xuất hàng.');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi khi tạo lệnh điều chuyển:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tạo lệnh điều chuyển';
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
      title="Lập Lệnh Điều Chuyển Kho"
      subtitle="Điều chuyển vật tư, phân bón giữa các kho nội bộ hoặc giữa các trang trại"
      icon={<ArrowLeftRight className="h-5 w-5 text-blue-600" />}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Tổng giá trị điều chuyển:</span>
            <span className="font-mono font-bold text-sm text-slate-900">
              {formatCurrency(totalTransferAmount)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy Bỏ
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} icon={<Save className="h-4 w-4" />}>
              Tạo Lệnh Điều Chuyển (DRAFT)
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

        {/* THÔNG TIN CHUNG ĐIỀU CHUYỂN */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Kho Xuất Hàng (Nguồn) *" error={errors.fromWarehouseId}>
              <Select
                value={formData.fromWarehouseId}
                onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                required
              >
                <option value="">-- Chọn kho xuất --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName || w.name} ({w.warehouseCode || `#${w.id}`})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Trang Trại Nhận (Đích) *">
              <Select
                value={formData.toFarmId}
                onChange={(e) => setFormData({ ...formData, toFarmId: e.target.value })}
              >
                {farms.map((f) => (
                  <option key={f.id || f.farmId} value={f.id || f.farmId}>
                    {f.name || f.farmName} {String(f.id || f.farmId) === String(farmId) ? '(Hiện tại)' : ''}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Kho Nhận Hàng (Đích) *" error={errors.toWarehouseId}>
              <Select
                value={formData.toWarehouseId}
                onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                required
              >
                <option value="">-- Chọn kho nhận --</option>
                {toWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName || w.name} ({w.warehouseCode || `#${w.id}`})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Ngày Điều Chuyển *" error={errors.transferDate}>
              <Input
                type="date"
                value={formData.transferDate}
                onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                required
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Ghi Chú Điều Chuyển" hint="Lý do điều phối kho, tài xế vận chuyển...">
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Nhập ghi chú điều chuyển..."
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* BẢNG CHI TIẾT DÒNG VẬT TƯ ĐIỀU CHUYỂN */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>Danh Sách Vật Tư Điều Chuyển ({formData.items.length})</span>
              </span>
              {errors.items && <span className="text-rose-600 font-bold text-[11px]">{errors.items}</span>}
            </div>

            <Button
              type="button"
              size="xs"
              variant="outline"
              icon={<Plus className="h-3.5 w-3.5 text-blue-600" />}
              onClick={handleAddItem}
            >
              + Thêm Dòng Vật Tư
            </Button>
          </div>

          {uniqueMaterialsInStock.length === 0 && !isLoadingStock && formData.fromWarehouseId && (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Kho nguồn hiện không có tồn kho khả dụng để điều chuyển. Vui lòng kiểm tra lại số dư kho.</span>
            </div>
          )}

          {/* Bảng Dòng Vật Tư */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5 min-w-[170px]">Mặt Hàng Vật Tư *</th>
                    <th className="py-2 px-2 min-w-[180px]">Lô Xuất Nguồn (FEFO) *</th>
                    <th className="py-2 px-2 min-w-[110px]">Mã Lô Kho Đích</th>
                    <th className="py-2 px-2 min-w-[85px] text-right">Tồn Khả Dụng</th>
                    <th className="py-2 px-2 min-w-[85px] text-right">SL Chuyển *</th>
                    <th className="py-2 px-2 min-w-[95px] text-right">Đơn Giá Vốn</th>
                    <th className="py-2 px-2 min-w-[105px] text-right">Thành Tiền</th>
                    <th className="py-2 px-2 min-w-[80px]">Kệ Nguồn</th>
                    <th className="py-2 px-2 min-w-[80px]">Kệ Đích</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      {/* Chọn vật tư */}
                      <td className="py-2 px-2">
                        <select
                          value={item.materialId}
                          onChange={(e) => handleMaterialChange(idx, e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-blue-500"
                          required
                        >
                          <option value="">-- Chọn vật tư tồn kho --</option>
                          {uniqueMaterialsInStock.map((m) => (
                            <option key={m.materialId} value={m.materialId}>
                              {m.materialName} ({m.skuCode})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Chọn lô nguồn */}
                      <td className="py-2 px-2">
                        <select
                          value={item.fromBatchNumber}
                          onChange={(e) => handleBatchChange(idx, e.target.value)}
                          className="w-full font-mono rounded border border-slate-300 px-2 py-1 text-xs focus:outline-blue-500"
                          required
                          disabled={!item.materialId || item.availableBatches.length === 0}
                        >
                          <option value="">-- Chọn lô nguồn --</option>
                          {item.availableBatches.map((b) => (
                            <option key={b.batchNumber} value={b.batchNumber}>
                              Lô {b.batchNumber} ({formatNumber(b.availableQuantity ?? b.quantityOnHand)} • {formatDate(b.expiryDate)})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Mã lô kho đích */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.toBatchNumber}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setFormData((prev) => {
                              const newItems = [...prev.items];
                              newItems[idx] = { ...newItems[idx], toBatchNumber: val };
                              return { ...prev, items: newItems };
                            });
                          }}
                          className="w-full font-mono rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-blue-500"
                        />
                      </td>

                      {/* Tồn khả dụng */}
                      <td className="py-2 px-2 text-right">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded block text-[11px]">
                          {formatNumber(item.availableQuantity)} {item.standardUnit}
                        </span>
                      </td>

                      {/* SL Chuyển */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={item.availableQuantity || undefined}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          className="w-full text-right font-mono font-bold rounded border border-slate-300 px-2 py-1 text-xs focus:outline-blue-500"
                          required
                        />
                      </td>

                      {/* Đơn giá */}
                      <td className="py-2 px-2 text-right font-mono text-slate-700">
                        {formatCurrency(item.unitPrice)}
                      </td>

                      {/* Thành tiền */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.totalPrice)}
                      </td>

                      {/* Kệ nguồn */}
                      <td className="py-2 px-2 font-mono text-slate-500 text-[11px]">
                        {item.fromBinCode || '—'}
                      </td>

                      {/* Kệ đích */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.toBinCode}
                          placeholder="B-01"
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => {
                              const newItems = [...prev.items];
                              newItems[idx] = { ...newItems[idx], toBinCode: val };
                              return { ...prev, items: newItems };
                            });
                          }}
                          className="w-full font-mono rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-blue-500"
                        />
                      </td>

                      {/* Xóa dòng */}
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

export default CreateTransferModal;
