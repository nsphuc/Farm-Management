import React, { useState, useEffect } from 'react';
import {
  PackageMinus,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Layers,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { inventoryService } from '@/services/modules/inventoryService';
import { farmingService } from '@/services/modules/farmingService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

const ISSUE_TYPES = [
  { value: 'INTERNAL_USE', label: 'Xuất sử dụng nội bộ (INTERNAL_USE)' },
  { value: 'SALE_FULFILLMENT', label: 'Xuất bán giao hàng (SALE_FULFILLMENT)' },
  { value: 'DAMAGE_DISPOSAL', label: 'Xuất hủy hư hỏng (DAMAGE_DISPOSAL)' },
];

export function CreateIssueModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  defaultWarehouseId = '',
  warehouses = [],
}) {
  const { supportsCrop, supportsLivestock, activeFarmType, notifyDataChanged } = useActiveFarmStore();
  const [seasons, setSeasons] = useState([]);
  const [livestockGroups, setLivestockGroups] = useState([]);
  const [inventoryStock, setInventoryStock] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    warehouseId: '',
    issueType: 'INTERNAL_USE',
    receiverName: '',
    seasonId: '',
    livestockGroupId: '',
    issueDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [],
  });

  // Tải danh sách mùa vụ & đàn nuôi khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (farmId) {
        if (supportsCrop || activeFarmType === 'CROP' || activeFarmType === 'MIXED') {
          farmingService.getCropSeasons(farmId, { size: 100 })
            .then((res) => {
              const list = res?.content || (Array.isArray(res) ? res : []);
              setSeasons(list);
            })
            .catch(() => setSeasons([]));
        } else {
          setSeasons([]);
        }

        if (supportsLivestock || activeFarmType === 'LIVESTOCK' || activeFarmType === 'MIXED') {
          farmingService.getLivestockGroups(farmId, { size: 100 })
            .then((res) => {
              const list = res?.content || (Array.isArray(res) ? res : []);
              setLivestockGroups(list);
            })
            .catch(() => setLivestockGroups([]));
        } else {
          setLivestockGroups([]);
        }
      }

      const initialWhId = defaultWarehouseId ? String(defaultWarehouseId) : (warehouses?.[0]?.id ? String(warehouses[0].id) : '');
      setFormData({
        warehouseId: initialWhId,
        issueType: 'INTERNAL_USE',
        receiverName: '',
        seasonId: '',
        livestockGroupId: '',
        issueDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: [createDefaultIssueItem()],
      });
      setErrors({});
    }
  }, [isOpen, defaultWarehouseId, farmId, supportsCrop, supportsLivestock, activeFarmType]);

  // Tải tồn kho khả dụng khi warehouseId thay đổi
  useEffect(() => {
    if (isOpen && formData.warehouseId && farmId) {
      const loadStock = async () => {
        try {
          setIsLoadingStock(true);
          const res = await inventoryService.getInventory({
            farmId,
            warehouseId: Number(formData.warehouseId),
            size: 300,
          });
          const list = res?.content || (Array.isArray(res) ? res : []);
          // Lọc các lô còn tồn khả dụng > 0
          const availableList = list.filter((it) => (it.availableQuantity ?? it.quantityOnHand) > 0);
          setInventoryStock(availableList);
        } catch (err) {
          console.error('Lỗi khi nạp tồn kho khả dụng:', err);
          setInventoryStock([]);
        } finally {
          setIsLoadingStock(false);
        }
      };
      loadStock();
    } else {
      setInventoryStock([]);
    }
  }, [isOpen, formData.warehouseId, farmId]);

  function createDefaultIssueItem() {
    return {
      id: Date.now() + Math.random(),
      materialId: '',
      materialName: '',
      batchNumber: '',
      availableQuantity: 0,
      standardUnit: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      expiryDate: null,
      availableBatches: [],
    };
  }

  // Lấy danh sách các loại vật tư duy nhất có sẵn trong kho
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

  // Khi chọn mặt hàng vật tư trên dòng xuất
  const handleMaterialChange = (index, materialIdStr) => {
    const numMatId = Number(materialIdStr);
    // Lọc các lô thuộc vật tư này có tồn khả dụng > 0, sắp xếp theo FEFO (expiryDate ASC)
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
          batchNumber: defaultBatch.batchNumber,
          standardUnit: defaultBatch.standardUnit || 'KG',
          availableQuantity: availQty,
          availableBatches: batches,
          quantity: Math.min(1, availQty),
          unitPrice: unitCost,
          totalPrice: Math.min(1, availQty) * unitCost,
          expiryDate: defaultBatch.expiryDate,
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          materialId: materialIdStr,
          materialName: '',
          batchNumber: '',
          availableBatches: [],
          availableQuantity: 0,
          quantity: 0,
          totalPrice: 0,
        };
      }
      return { ...prev, items: newItems };
    });
  };

  // Khi chọn số lô xuất (FEFO)
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
          batchNumber,
          availableQuantity: availQty,
          unitPrice: unitCost,
          quantity: currentQty,
          totalPrice: currentQty * unitCost,
          expiryDate: selectedBatch.expiryDate,
        };
      }
      return { ...prev, items: newItems };
    });
  };

  // Cập nhật số lượng xuất
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

  // Thêm dòng mới
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createDefaultIssueItem()],
    }));
  };

  // Xóa dòng
  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      toast.warning('Phiếu xuất kho phải có ít nhất 1 dòng vật tư!');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Tổng tiền cả phiếu xuất
  const totalIssueAmount = formData.items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);

  const validate = () => {
    const errs = {};
    if (!formData.warehouseId) {
      errs.warehouseId = 'Vui lòng chọn kho xuất';
    }
    if (!formData.issueDate) {
      errs.issueDate = 'Ngày xuất kho không được để trống';
    }
    if (formData.items.length === 0) {
      errs.items = 'Phiếu xuất phải có ít nhất 1 dòng vật tư';
    } else {
      for (let i = 0; i < formData.items.length; i++) {
        const it = formData.items[i];
        if (!it.materialId) {
          errs.items = `Dòng #${i + 1}: Vui lòng chọn mặt hàng vật tư xuất`;
          break;
        }
        if (!it.batchNumber) {
          errs.items = `Dòng #${i + 1}: Vui lòng chọn số lô xuất`;
          break;
        }
        if (!it.quantity || Number(it.quantity) <= 0) {
          errs.items = `Dòng #${i + 1}: Số lượng xuất phải lớn hơn 0`;
          break;
        }
        if (Number(it.quantity) > Number(it.availableQuantity)) {
          errs.items = `Dòng #${i + 1}: Số lượng xuất (${it.quantity}) vượt quá tồn khả dụng (${it.availableQuantity}) của lô ${it.batchNumber}`;
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
        issueType: formData.issueType,
        receiverName: formData.receiverName?.trim() || null,
        seasonId: formData.seasonId ? Number(formData.seasonId) : null,
        livestockGroupId: formData.livestockGroupId ? Number(formData.livestockGroupId) : null,
        issueDate: formData.issueDate,
        notes: formData.notes?.trim() || null,
        items: formData.items.map((it) => ({
          materialId: Number(it.materialId),
          batchNumber: it.batchNumber.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice || 0),
          totalPrice: Number(it.totalPrice || 0),
        })),
      };

      await inventoryService.createIssue(farmId, payload);
      toast.success('Lập phiếu xuất kho nháp (DRAFT) thành công! Giám đốc trang trại sẽ kiểm tra và phê duyệt.');
      notifyDataChanged?.('all');
      notifyDataChanged?.('inventory');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lập phiếu xuất kho:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tạo phiếu xuất kho';
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
      title="Lập Phiếu Xuất Kho"
      subtitle="Xuất vật tư canh tác nội bộ, giao hàng bán hoặc xuất hủy hao hụt theo quy tắc FEFO"
      icon={<PackageMinus className="h-5 w-5 text-amber-600" />}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Tổng giá trị xuất:</span>
            <span className="font-mono font-bold text-sm text-slate-900">
              {formatCurrency(totalIssueAmount)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy Bỏ
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} icon={<Save className="h-4 w-4" />}>
              Lưu Phiếu Xuất (DRAFT)
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

        {/* THÔNG TIN CHUNG PHIẾU XUẤT */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Kho Xuất Hàng *" error={errors.warehouseId}>
              <Select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                required
              >
                <option value="">-- Chọn kho xuất hàng --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName || w.name} ({w.warehouseCode || `#${w.id}`})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Loại Phiếu Xuất *">
              <Select
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Người Nhận Hàng">
              <Input
                value={formData.receiverName}
                onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                placeholder="Họ tên người nhận / Trưởng khu..."
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {formData.issueType === 'INTERNAL_USE' && (supportsCrop || activeFarmType === 'CROP' || activeFarmType === 'MIXED') && (
              <FormField
                label="Gắn Mùa Vụ Trồng Trọt (Tùy chọn)"
                hint="Gắn chi phí vật tư vào vụ mùa"
              >
                <Select
                  value={formData.seasonId}
                  disabled={Boolean(formData.livestockGroupId)}
                  onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
                >
                  <option value="">-- Không gắn mùa vụ --</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.seasonCode} ({s.cropTypeName || 'Vụ mùa'})
                    </option>
                  ))}
                </Select>
              </FormField>
            )}

            {formData.issueType === 'INTERNAL_USE' && (supportsLivestock || activeFarmType === 'LIVESTOCK' || activeFarmType === 'MIXED') && (
              <FormField
                label="Gắn Đàn Chăn Nuôi (Tùy chọn)"
                hint="Gắn chi phí thức ăn/thuốc vào đàn"
              >
                <Select
                  value={formData.livestockGroupId}
                  disabled={Boolean(formData.seasonId)}
                  onChange={(e) => setFormData({ ...formData, livestockGroupId: e.target.value })}
                >
                  <option value="">-- Không gắn đàn nuôi --</option>
                  {livestockGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.groupCode} ({g.breedName || 'Đàn nuôi'} - {g.currentQuantity} con)
                    </option>
                  ))}
                </Select>
              </FormField>
            )}

            <FormField label="Ngày Xuất Kho *" error={errors.issueDate}>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
            </FormField>

            <FormField
              label="Ghi Chú Xuất Kho"
              className={formData.issueType === 'INTERNAL_USE' && (supportsCrop && supportsLivestock) ? 'sm:col-span-3' : ''}
            >
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Mục đích sử dụng, lệnh sản xuất..."
              />
            </FormField>
          </div>
        </div>

        {/* BẢNG CHI TIẾT DÒNG VẬT TƯ XUẤT */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-amber-600" />
                <span>Danh Sách Vật Tư Xuất Kho ({formData.items.length})</span>
              </span>
              {errors.items && <span className="text-rose-600 font-bold text-[11px]">{errors.items}</span>}
            </div>

            <Button
              type="button"
              size="xs"
              variant="outline"
              icon={<Plus className="h-3.5 w-3.5 text-amber-600" />}
              onClick={handleAddItem}
            >
              + Thêm Dòng Vật Tư
            </Button>
          </div>

          {uniqueMaterialsInStock.length === 0 && !isLoadingStock && formData.warehouseId && (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Kho đang chọn hiện không có tồn kho khả dụng để xuất. Vui lòng kiểm tra lại số dư kho.</span>
            </div>
          )}

          {/* Bảng Dòng Vật Tư */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5 min-w-[180px]">Mặt Hàng Vật Tư (Có Tồn) *</th>
                    <th className="py-2 px-2 min-w-[200px]">Số Lô FEFO (Hạn Dùng) *</th>
                    <th className="py-2 px-2 min-w-[90px] text-right">Tồn Khả Dụng</th>
                    <th className="py-2 px-2 min-w-[90px] text-right">SL Xuất *</th>
                    <th className="py-2 px-2 min-w-[100px] text-right">Đơn Giá Vốn (₫)</th>
                    <th className="py-2 px-2 min-w-[110px] text-right">Thành Tiền (₫)</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      {/* Chọn mặt hàng */}
                      <td className="py-2 px-2">
                        <select
                          value={item.materialId}
                          onChange={(e) => handleMaterialChange(idx, e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-emerald-500"
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

                      {/* Chọn số lô theo nguyên tắc FEFO */}
                      <td className="py-2 px-2">
                        <select
                          value={item.batchNumber}
                          onChange={(e) => handleBatchChange(idx, e.target.value)}
                          className="w-full font-mono rounded border border-slate-300 px-2 py-1 text-xs focus:outline-emerald-500"
                          required
                          disabled={!item.materialId || item.availableBatches.length === 0}
                        >
                          <option value="">-- Chọn lô xuất (FEFO) --</option>
                          {item.availableBatches.map((b) => (
                            <option key={b.batchNumber} value={b.batchNumber}>
                              Lô {b.batchNumber} (Khả dụng: {formatNumber(b.availableQuantity ?? b.quantityOnHand)} • Hạn: {formatDate(b.expiryDate)})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Tồn khả dụng */}
                      <td className="py-2 px-2 text-right">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded block text-xs">
                          {formatNumber(item.availableQuantity)} {item.standardUnit}
                        </span>
                      </td>

                      {/* SL Xuất */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={item.availableQuantity || undefined}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          className="w-full text-right font-mono font-bold rounded border border-slate-300 px-2 py-1 text-xs focus:outline-emerald-500"
                          required
                        />
                      </td>

                      {/* Đơn giá vốn */}
                      <td className="py-2 px-2 text-right">
                        <span className="font-mono text-slate-800 font-semibold block px-2 py-1">
                          {formatCurrency(item.unitPrice)}
                        </span>
                      </td>

                      {/* Thành tiền */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.totalPrice)}
                      </td>

                      {/* Nút xóa */}
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

export default CreateIssueModal;
