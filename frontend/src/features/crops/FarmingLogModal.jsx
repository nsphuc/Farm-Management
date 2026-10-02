import React, { useState, useEffect } from 'react';
import {
  X,
  Droplets,
  Sprout,
  ShieldAlert,
  Scissors,
  Layers,
  Sparkles,
  Package,
  Plus,
  Trash2,
  CloudSun,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { cropService } from '../../services/cropService';
import { inventoryService } from '../../services/inventoryService';

const ACTIVITY_BUTTONS = [
  { type: 'TUOI_NUOC', label: 'Tưới nước', icon: Droplets, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' },
  { type: 'BON_PHAN', label: 'Bón phân', icon: Sprout, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  { type: 'PHUN_THUOC_BVTV', label: 'Phun thuốc BVTV', icon: ShieldAlert, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  { type: 'TIA_CANH', label: 'Tỉa cành/lá', icon: Scissors, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  { type: 'LAM_CO', label: 'Làm cỏ / Vệ sinh', icon: Layers, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800' },
  { type: 'THU_HOACH', label: 'Thu hái', icon: Sparkles, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
];

export const FarmingLogModal = ({ isOpen, onClose, farmId, season, onSuccess }) => {
  const [activityType, setActivityType] = useState('TUOI_NUOC');
  const [stage, setStage] = useState('');
  const [weatherNotes, setWeatherNotes] = useState('Trời nắng ráo, nhiệt độ 28°C, độ ẩm 70%');
  const [notes, setNotes] = useState('');

  // Inventory Backflushing states
  const [useSupplies, setUseSupplies] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [suppliesList, setSuppliesList] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && farmId) {
      loadWarehouses();
    }
  }, [isOpen, farmId]);

  const loadWarehouses = async () => {
    try {
      const [whData, matData] = await Promise.all([
        inventoryService.getWarehouses(farmId),
        inventoryService.searchMaterials({ size: 100 }),
      ]);
      setWarehouses(whData || []);
      if (whData?.length > 0) {
        setSelectedWarehouseId(whData[0].id);
      }
      setMaterials(matData?.items || matData?.content || (Array.isArray(matData) ? matData : []));
    } catch {
      // Ignored
    }
  };

  const handleAddSupplyItem = () => {
    const safeMats = Array.isArray(materials) ? materials : [];
    if (safeMats.length === 0) {
      toast.error('Chưa có danh mục vật tư nào trong hệ thống.');
      return;
    }
    const firstMat = safeMats[0];
    setSuppliesList([
      ...suppliesList,
      {
        materialId: firstMat.id,
        batchNumber: '',
        quantity: 1,
        unit: firstMat.standardUnit || 'KG',
      },
    ]);
  };

  const handleRemoveSupplyItem = (index) => {
    setSuppliesList(suppliesList.filter((_, i) => i !== index));
  };

  const handleSupplyChange = (index, field, value) => {
    const updated = [...suppliesList];
    updated[index][field] = value;
    if (field === 'materialId') {
      const selectedMat = materials.find((m) => String(m.id) === String(value));
      if (selectedMat) {
        updated[index].unit = selectedMat.standardUnit || 'KG';
      }
    }
    setSuppliesList(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activityType) {
      toast.error('Vui lòng chọn loại hoạt động canh tác.');
      return;
    }

    if (useSupplies && suppliesList.length > 0 && !selectedWarehouseId) {
      toast.error('Vui lòng chọn kho vật tư xuất dùng.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        activityType,
        stage: stage?.trim() || null,
        weatherNotes: weatherNotes?.trim() || null,
        notes: notes?.trim() || null,
        warehouseId: useSupplies && suppliesList.length > 0 ? Number(selectedWarehouseId) : null,
        suppliesUsed:
          useSupplies && suppliesList.length > 0
            ? suppliesList.map((s) => ({
                materialId: Number(s.materialId),
                batchNumber: s.batchNumber?.trim() || null,
                quantity: parseFloat(s.quantity),
                unit: s.unit,
              }))
            : null,
      };

      await cropService.createFarmingLog(farmId, season.id, payload);
      toast.success(
        useSupplies && suppliesList.length > 0
          ? 'Ghi nhật ký canh tác thành công (Đã tự động trừ kho vật tư)!'
          : 'Ghi nhật ký canh tác VietGAP thành công!'
      );
      onSuccess?.();
      onClose();
    } catch {
      // Handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !season) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Nhật Ký Canh Tác Điện Tử VietGAP
              </h3>
              <p className="text-xs text-slate-500">
                Vụ: {season.seasonCode} | {season.cropTypeName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Activity Buttons (Touch target >= 44px) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Hoạt động thực hiện ngoài đồng <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ACTIVITY_BUTTONS.map((act) => {
                const Icon = act.icon;
                const isSelected = activityType === act.type;
                return (
                  <button
                    key={act.type}
                    type="button"
                    onClick={() => {
                      setActivityType(act.type);
                      if (act.type === 'BON_PHAN' || act.type === 'PHUN_THUOC_BVTV') {
                        setUseSupplies(true);
                      }
                    }}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? `${act.color} ring-2 ring-emerald-500/40 shadow-sm`
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Giai đoạn sinh trưởng */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Giai đoạn phát triển cây trồng
              </label>
              <input
                type="text"
                placeholder="VD: Cây con, Ra hoa, Nuôi trái non, Cách ly trước thu hoạch..."
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Thời tiết */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ghi chú thời tiết / Tiểu khí hậu
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="VD: Trời nắng ráo, 28°C"
                  value={weatherNotes}
                  onChange={(e) => setWeatherNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <CloudSun className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Ghi chú chi tiết kỹ thuật */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi chú nhật ký kỹ thuật & Hiện trường
            </label>
            <textarea
              rows={2}
              placeholder="VD: Tưới nước nhỏ giọt 2m3. Cây sinh trưởng tốt, không thấy sâu bệnh."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* INVENTORY BACKFLUSHING SECTION */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useSuppliesCheck"
                  checked={useSupplies}
                  onChange={(e) => {
                    setUseSupplies(e.target.checked);
                    if (e.target.checked && suppliesList.length === 0) {
                      handleAddSupplyItem();
                    }
                  }}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor="useSuppliesCheck"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Kích hoạt Trừ Kho Vật Tư Ngầm (Inventory Backflushing)
                </label>
              </div>

              {useSupplies && (
                <button
                  type="button"
                  onClick={handleAddSupplyItem}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm vật tư
                </button>
              )}
            </div>

            {useSupplies && (
              <div className="space-y-3 pt-2">
                {/* Chọn kho vật tư */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Kho xuất vật tư <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required={useSupplies}
                  >
                    <option value="">-- Chọn kho vật tư --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code}) - {w.warehouseType}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Danh sách vật tư tiêu hao */}
                {suppliesList.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="col-span-5">
                      <select
                        value={item.materialId}
                        onChange={(e) => handleSupplyChange(index, 'materialId', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.skuCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Mã lô (để trống: FIFO)"
                        value={item.batchNumber}
                        onChange={(e) => handleSupplyChange(index, 'batchNumber', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs placeholder-slate-400"
                      />
                    </div>

                    <div className="col-span-3 flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="SL"
                        value={item.quantity}
                        onChange={(e) => handleSupplyChange(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-center"
                        required
                      />
                      <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                        {item.unit}
                      </span>
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveSupplyItem(index)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang lưu nhật ký...' : 'Ghi nhật ký VietGAP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
