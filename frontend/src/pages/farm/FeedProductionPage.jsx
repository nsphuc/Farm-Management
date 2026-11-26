import React, { useState, useEffect } from 'react';
import {
  Factory,
  Plus,
  Trash2,
  Edit,
  Play,
  Layers,
  FileText,
  DollarSign,
  Scale,
  RefreshCw,
  Warehouse,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { addonsService } from '@/services/modules/addonsService';
import { masterDataService } from '@/services/modules/masterDataService';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export function FeedProductionPage() {
  const rawFarmId = useActiveFarmStore((s) => s.activeFarmId);
  const currentFarmId = (rawFarmId && rawFarmId !== 'ALL' && !isNaN(Number(rawFarmId))) ? Number(rawFarmId) : 1;
  const { currentBranchId, branches, triggerRefresh } = useActiveBranchStore();

  const [activeTab, setActiveTab] = useState('BOM'); // BOM | ORDERS
  const [boms, setBoms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Tạo / Sửa BOM
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [editingBom, setEditingBom] = useState(null);
  const [bomForm, setBomForm] = useState({
    code: '',
    name: '',
    targetSpecies: 'SWINE',
    batchWeightKg: 100,
    description: '',
    items: [
      { materialId: '', materialName: 'Ngô hạt nghiền mịn', quantityKg: 55, unitPrice: 9500 },
      { materialId: '', materialName: 'Khô đậu tương 46% đạm', quantityKg: 25, unitPrice: 16500 },
      { materialId: '', materialName: 'Cám gạo xát mới thơm', quantityKg: 18, unitPrice: 8500 },
      { materialId: '', materialName: 'Premix khoáng vitamin tổng hợp', quantityKg: 2, unitPrice: 25000 },
    ],
  });

  // Modal Thực hiện lệnh trộn cám
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedBomForOrder, setSelectedBomForOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    bomId: '',
    batchCount: 5,
    targetWarehouseId: '',
    targetWarehouseName: 'Kho Cám Tự Trộn',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const branchParam = currentBranchId !== 'ALL' ? currentBranchId : undefined;
      const [bomsData, ordersData, matsRes, whsRes] = await Promise.all([
        addonsService.getFeedBoms({ farmId: currentFarmId }),
        addonsService.getFeedOrders({
          farmId: currentFarmId,
          branchId: branchParam,
        }),
        masterDataService.getMaterials({ size: 200 }).catch(() => []),
        masterDataService.getWarehouses(currentFarmId, { branchId: branchParam }).catch(() => []),
      ]);
      if (Array.isArray(bomsData)) setBoms(bomsData);
      if (Array.isArray(ordersData)) setOrders(ordersData);
      const matList = Array.isArray(matsRes) ? matsRes : (matsRes?.content || []);
      setMaterials(matList);
      const whList = Array.isArray(whsRes) ? whsRes : (whsRes?.content || []);
      setWarehouses(whList);
    } catch (err) {
      console.warn('Could not load feed production data', err);
      toast.error('Lỗi tải dữ liệu sản xuất cám');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentFarmId, currentBranchId]);

  // Handler BOM Item rows
  const handleAddItemRow = () => {
    setBomForm({
      ...bomForm,
      items: [...bomForm.items, { materialId: '', materialName: '', quantityKg: 10, unitPrice: 10000 }],
    });
  };

  const handleSelectMaterialForRow = (idx, materialId) => {
    const updated = [...bomForm.items];
    const mat = materials.find((m) => String(m.id) === String(materialId));
    if (mat) {
      updated[idx] = {
        ...updated[idx],
        materialId: mat.id,
        materialName: mat.name,
        unitPrice: Number(mat.unitPriceStandard) || updated[idx].unitPrice || 0,
      };
    } else {
      updated[idx] = { ...updated[idx], materialId: '' };
    }
    setBomForm({ ...bomForm, items: updated });
  };

  const handleRemoveItemRow = (idx) => {
    const updated = bomForm.items.filter((_, i) => i !== idx);
    setBomForm({ ...bomForm, items: updated });
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...bomForm.items];
    updated[idx] = { ...updated[idx], [field]: value };
    setBomForm({ ...bomForm, items: updated });
  };

  const totalCalculatedCost = bomForm.items.reduce(
    (sum, it) => sum + (Number(it.quantityKg) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const totalCalculatedWeight = bomForm.items.reduce(
    (sum, it) => sum + (Number(it.quantityKg) || 0),
    0
  );
  const calculatedCostPerKg =
    totalCalculatedWeight > 0 ? Math.round(totalCalculatedCost / totalCalculatedWeight) : 0;

  const handleOpenCreateBom = () => {
    setEditingBom(null);
    setBomForm({
      code: `BOM-${Math.floor(Math.random() * 900 + 100)}`,
      name: 'Cám Tự Trộn Tiêu Chuẩn 100kg',
      targetSpecies: 'SWINE',
      batchWeightKg: 100,
      description: 'Công thức cân đối dinh dưỡng nội bộ',
      items: [
        { materialName: 'Ngô hạt nghiền mịn', quantityKg: 55, unitPrice: 9500 },
        { materialName: 'Khô đậu tương 46% đạm', quantityKg: 25, unitPrice: 16500 },
        { materialName: 'Cám gạo xát mới', quantityKg: 18, unitPrice: 8500 },
        { materialName: 'Premix khoáng vi lượng', quantityKg: 2, unitPrice: 25000 },
      ],
    });
    setIsBomModalOpen(true);
  };

  const handleSaveBom = async (e) => {
    e.preventDefault();
    if (!bomForm.name.trim()) {
      toast.error('Vui lòng nhập tên công thức BOM');
      return;
    }
    try {
      const payload = {
        ...bomForm,
        batchWeightKg: totalCalculatedWeight,
        items: bomForm.items.map((it) => ({
          materialId: it.materialId ? Number(it.materialId) : null,
          materialName: it.materialName,
          quantityKg: Number(it.quantityKg) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        })),
      };
      if (editingBom) {
        await addonsService.updateFeedBom(editingBom.id, payload, { farmId: currentFarmId });
        toast.success(`Đã cập nhật công thức "${bomForm.name}"!`);
      } else {
        await addonsService.createFeedBom(payload, { farmId: currentFarmId });
        toast.success(`Đã tạo công thức phối trộn "${bomForm.name}" thành công!`);
      }
      setIsBomModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu công thức BOM');
    }
  };

  const handleDeleteBom = async (bom) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa công thức "${bom.name}"?`)) return;
    try {
      await addonsService.deleteFeedBom(bom.id, { farmId: currentFarmId });
      toast.success(`Đã xóa công thức "${bom.name}"!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa BOM');
    }
  };

  const handleOpenExecuteOrder = (bom = null) => {
    const initialBom = bom || boms[0] || null;
    if (!initialBom) {
      toast.info('Vui lòng tạo ít nhất 1 công thức BOM trước khi lập lệnh sản xuất');
      return;
    }
    const defaultWh = warehouses.find((w) => w.warehouseType === 'FEED') || warehouses[0];
    setSelectedBomForOrder(initialBom);
    setOrderForm({
      bomId: String(initialBom.id),
      batchCount: 5,
      targetWarehouseId: defaultWh ? String(defaultWh.id) : '',
      targetWarehouseName: defaultWh ? defaultWh.name : 'Kho Cám Khu B',
      notes: `Trộn ${5 * Number(initialBom.batchWeightKg || 100)}kg cám thành phẩm`,
    });
    setIsOrderModalOpen(true);
  };

  const handleSaveExecuteOrder = async (e) => {
    e.preventDefault();
    const activeBom =
      boms.find((b) => String(b.id) === String(orderForm.bomId)) || selectedBomForOrder;
    if (!activeBom) return;
    try {
      const chosenWh = warehouses.find((w) => String(w.id) === String(orderForm.targetWarehouseId));
      const whName = chosenWh?.name || orderForm.targetWarehouseName;
      await addonsService.executeFeedOrder(
        {
          bomId: activeBom.id,
          batchCount: Number(orderForm.batchCount),
          targetWarehouseId: orderForm.targetWarehouseId ? Number(orderForm.targetWarehouseId) : undefined,
          targetWarehouseName: whName,
          branchId: currentBranchId !== 'ALL' ? currentBranchId : undefined,
          notes: orderForm.notes,
        },
        { farmId: currentFarmId }
      );
      toast.success(
        `🎉 Đã hoàn tất lệnh sản xuất: Trộn ${orderForm.batchCount} mẻ (${
          orderForm.batchCount * Number(activeBom.batchWeightKg)
        } kg), trừ kho nguyên liệu FEFO và nhập thành phẩm vào ${whName}!`
      );
      setIsOrderModalOpen(false);
      setActiveTab('ORDERS');
      triggerRefresh?.();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi thực hiện lệnh trộn cám');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-orange-50 text-orange-700">
            <Factory className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Sản Xuất & Phối Trộn Cám Nội Bộ
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-orange-100 text-orange-800 uppercase">
                Add-on Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Xây dựng định mức BOM từ nguyên liệu thô, tự động tính giá thành 1kg cám và quản lý lệnh trộn nhập kho
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs font-bold"
          >
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateBom}
            icon={<Plus className="h-4 w-4" />}
            className="text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
          >
            + Tạo Công Thức BOM Mới
          </Button>
        </div>
      </div>

      {/* 2. Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('BOM')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'BOM'
              ? 'border-orange-600 text-orange-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>1. Công Thức Phối Trộn (BOM) ({boms.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ORDERS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'ORDERS'
              ? 'border-orange-600 text-orange-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>2. Lịch Sử Lệnh Trộn Cám ({orders.length})</span>
        </button>
      </div>

      {/* 3. Nội dung Tab 1: Công Thức BOM */}
      {activeTab === 'BOM' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boms.map((bom) => (
            <div
              key={bom.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-orange-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{bom.code}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {bom.targetSpecies === 'SWINE' ? '🐷 Cám Heo' : '🐔 Cám Gia cầm'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-1">{bom.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{bom.description || 'Định mức phối trộn'}</p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Giá thành 1 kg:</div>
                  <div className="text-lg font-black text-orange-700 font-mono">
                    {formatCurrency(bom.costPerKg)} / kg
                  </div>
                </div>
              </div>

              {/* Bảng nguyên liệu chi tiết trong mẻ */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                <div className="text-[11px] font-bold text-slate-600 flex justify-between border-b border-slate-200 pb-1">
                  <span>Nguyên liệu thô trong mẻ {bom.batchWeightKg}kg</span>
                  <span>Khối lượng &amp; Thành tiền</span>
                </div>
                <div className="space-y-1 text-xs">
                  {bom.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700">
                      <span className="truncate max-w-[220px]">{it.materialName}</span>
                      <div className="font-mono text-right">
                        <span className="font-bold">{it.quantityKg} kg</span>
                        <span className="text-slate-400 text-[11px]"> ({formatCurrency(it.amount)})</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-xs">
                  <span>Tổng chi phí mẻ {bom.batchWeightKg}kg:</span>
                  <span className="font-mono text-orange-700">{formatCurrency(bom.totalCost)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteBom(bom)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Xóa công thức"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenExecuteOrder(bom)}
                  icon={<Play className="h-3.5 w-3.5" />}
                  className="text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
                >
                  Tạo Lệnh Trộn Cám
                </Button>
              </div>
            </div>
          ))}

          {boms.length === 0 && !isLoading && (
            <div className="col-span-2 py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Scale className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Chưa có công thức phối trộn BOM nào.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreateBom}
                className="mt-3 text-xs font-bold"
              >
                + Tạo Công Thức Đầu Tiên
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 4. Nội dung Tab 2: Lịch Sử Lệnh Trộn */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-orange-600" />
              <span>Nhật Ký Các Mẻ Cám Đã Trộn &amp; Nhập Kho Thành Phẩm</span>
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenExecuteOrder(null)}
              icon={<Play className="h-3.5 w-3.5" />}
              className="text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white"
            >
              + Tạo Lệnh Trộn Cám
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-700 font-bold">
                  <th className="py-3 px-4">Mã lệnh & Ngày trộn</th>
                  <th className="py-3 px-4">Công thức áp dụng</th>
                  <th className="py-3 px-4 text-center">Số mẻ trộn</th>
                  <th className="py-3 px-4 text-right">Tổng thành phẩm</th>
                  <th className="py-3 px-4 text-right">Tổng chi phí</th>
                  <th className="py-3 px-4 text-right">Giá vốn 1kg</th>
                  <th className="py-3 px-4">Kho nhập thành phẩm</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{o.orderCode}</div>
                      <div className="text-[11px] text-slate-400">{o.executedDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{o.bomName}</div>
                      <div className="text-[11px] text-slate-500">{o.notes}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-slate-800">
                      {o.batchCount} mẻ
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-orange-700 text-sm">
                      {formatNumber(o.totalOutputKg)} kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      {formatCurrency(o.totalMaterialCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(o.costPerKg)} / kg
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                        <Warehouse className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{o.targetWarehouseName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Đã nhập kho
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      Chưa có lệnh sản xuất cám nào được thực hiện.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: TẠO / SỬA CÔNG THỨC BOM */}
      <Modal
        isOpen={isBomModalOpen}
        onClose={() => setIsBomModalOpen(false)}
        title={editingBom ? `Sửa Công Thức: ${editingBom.name}` : 'Tạo Công Thức Phối Trộn Cám Mới (BOM)'}
        size="lg"
      >
        <form onSubmit={handleSaveBom} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Mã công thức *" required>
              <Input
                value={bomForm.code}
                onChange={(e) => setBomForm({ ...bomForm, code: e.target.value })}
              />
            </FormField>
            <FormField label="Loại cám áp dụng">
              <Select
                value={bomForm.targetSpecies}
                onChange={(e) => setBomForm({ ...bomForm, targetSpecies: e.target.value })}
                options={[
                  { value: 'SWINE', label: '🐷 Cám Heo (Thịt, Nái, Cai sữa)' },
                  { value: 'POULTRY', label: '🐔 Cám Gia Cầm (Gà thịt, Vịt)' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Tên công thức phối trộn *" required>
            <Input
              value={bomForm.name}
              onChange={(e) => setBomForm({ ...bomForm, name: e.target.value })}
              placeholder="VD: Cám Heo Thịt Tự Trộn 100kg"
            />
          </FormField>

          {/* Bảng nguyên liệu động */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">Danh Sách Nguyên Liệu Thô (Trong 1 Mẻ)</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItemRow}
                icon={<Plus className="h-3 w-3" />}
                className="text-[11px] font-bold"
              >
                + Thêm nguyên liệu
              </Button>
            </div>

            <div className="space-y-2">
              {bomForm.items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {materials.length > 0 && (
                    <select
                      value={it.materialId || ''}
                      onChange={(e) => handleSelectMaterialForRow(idx, e.target.value)}
                      className="w-44 text-xs rounded-lg border border-slate-300 px-2 py-2 bg-white text-slate-800"
                      title="Chọn nguyên liệu từ danh mục kho để tự động trừ tồn kho FEFO"
                    >
                      <option value="">-- Chọn từ Kho --</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.skuCode})
                        </option>
                      ))}
                    </select>
                  )}
                  <Input
                    value={it.materialName}
                    onChange={(e) => handleItemChange(idx, 'materialName', e.target.value)}
                    placeholder="Tên nguyên liệu (VD: Ngô hạt, Cám gạo, Premix)"
                    className="flex-1"
                  />
                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.1"
                      value={it.quantityKg}
                      onChange={(e) => handleItemChange(idx, 'quantityKg', e.target.value)}
                      placeholder="Kg"
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      value={it.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      placeholder="Đơn giá (đ)"
                    />
                  </div>
                  <div className="w-28 text-right font-mono font-bold text-slate-700">
                    {formatCurrency((Number(it.quantityKg) || 0) * (Number(it.unitPrice) || 0))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Tổng hợp mẻ */}
            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-600">Tổng khối lượng mẻ: </span>
                <strong className="text-slate-900 font-mono">{totalCalculatedWeight} kg</strong>
              </div>
              <div>
                <span className="text-slate-600">Tổng chi phí mẻ: </span>
                <strong className="text-orange-700 font-mono">{formatCurrency(totalCalculatedCost)}</strong>
              </div>
              <div className="bg-orange-600 text-white px-3 py-1 rounded-lg font-bold">
                Giá thành: {formatCurrency(calculatedCostPerKg)} / kg
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBomModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold bg-orange-600 hover:bg-orange-700 text-white">
              {editingBom ? 'Lưu Công Thức' : 'Tạo Công Thức BOM'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: THỰC HIỆN LỆNH TRỘN CÁM */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title={`Lập Lệnh Trộn Cám: ${selectedBomForOrder?.name || ''}`}
        size="md"
      >
        <form onSubmit={handleSaveExecuteOrder} className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 space-y-1">
            <div className="font-bold">
              Công thức BOM: {selectedBomForOrder?.name} (Giá thành: {formatCurrency(selectedBomForOrder?.costPerKg)}/kg)
            </div>
            <p className="text-[11px] text-orange-800">
              Hệ thống sẽ <strong>tự động trừ tồn kho nguyên liệu thô</strong> theo định mức và{' '}
              <strong>cộng thêm thành phẩm cám mới</strong> vào kho đích đã chọn.
            </p>
          </div>

          <FormField label="Công thức phối trộn (BOM) *" required>
            <Select
              value={orderForm.bomId}
              onChange={(e) => {
                const chosen = boms.find((b) => String(b.id) === e.target.value);
                setSelectedBomForOrder(chosen || null);
                setOrderForm({ ...orderForm, bomId: e.target.value });
              }}
              options={boms.map((b) => ({
                value: String(b.id),
                label: `${b.name} (${b.batchWeightKg}kg/mẻ — ${formatCurrency(b.costPerKg)}/kg)`,
              }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số lượng mẻ cần trộn *" required>
              <Input
                type="number"
                min="1"
                value={orderForm.batchCount}
                onChange={(e) => setOrderForm({ ...orderForm, batchCount: e.target.value })}
              />
            </FormField>
            <FormField label="Tổng thành phẩm ra lò (kg)">
              <div className="w-full text-xs font-black font-mono px-3 py-2 bg-slate-100 rounded-lg border border-slate-300">
                {formatNumber(Number(orderForm.batchCount) * Number(selectedBomForOrder?.batchWeightKg || 100))} kg
              </div>
            </FormField>
          </div>

          <FormField label="Kho đích nhận cám thành phẩm *" required>
            {warehouses.length > 0 ? (
              <Select
                value={orderForm.targetWarehouseId}
                onChange={(e) => {
                  const chosen = warehouses.find((w) => String(w.id) === e.target.value);
                  setOrderForm({
                    ...orderForm,
                    targetWarehouseId: e.target.value,
                    targetWarehouseName: chosen ? chosen.name : orderForm.targetWarehouseName,
                  });
                }}
                options={warehouses.map((w) => ({
                  value: String(w.id),
                  label: `${w.name} (${w.code || w.warehouseType || 'KHO'})`,
                }))}
              />
            ) : (
              <Select
                value={orderForm.targetWarehouseName}
                onChange={(e) => setOrderForm({ ...orderForm, targetWarehouseName: e.target.value })}
                options={[
                  { value: 'Kho Cám Khu A', label: 'Kho Cám Khu A (Gia cầm)' },
                  { value: 'Kho Cám Khu B', label: 'Kho Cám Khu B (Heo thịt)' },
                  { value: 'Kho Cám Tự Trộn Tổng', label: 'Kho Cám Tự Trộn Tổng' },
                ]}
              />
            )}
          </FormField>

          <FormField label="Ghi chú lệnh sản xuất">
            <Input
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              placeholder="VD: Trộn phục vụ cho đàn heo thịt xuất chuồng tuần sau..."
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOrderModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="font-bold bg-orange-600 hover:bg-orange-700 text-white"
            >
              Xác Nhận Trộn &amp; Nhập Kho Cám
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default FeedProductionPage;
