import React, { useState, useEffect } from 'react';
import {
  Egg,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { addonsService } from '@/services/modules/addonsService';
import { barnBatchService } from '@/services/modules/barnBatchService';
import { toast } from '@/store/useToastStore';
import { formatNumber } from '@/utils/formatters';

export function HatcheryPage() {
  const { currentFarmId } = useActiveFarmStore();
  const { currentBranchId, triggerRefresh } = useActiveBranchStore();

  const [summary, setSummary] = useState({
    totalIncubatingEggs: 0,
    fertilityRate: 0,
    hatchRate: 0,
    totalHatchedThisMonth: 0,
  });
  const [batches, setBatches] = useState([]);
  const [barns, setBarns] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [eggTypeFilter, setEggTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Modal Tạo mẻ ấp mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    batchCode: '',
    eggType: 'CHICKEN', // CHICKEN, DUCK
    breedName: 'Gà Ri / Mía lai F1',
    setDate: new Date().toISOString().split('T')[0],
    totalEggs: 3000,
    destinationBarnName: 'Chuồng Úm Gà A1',
    notes: '',
  });

  // Modal Chốt nở & chuyển chuồng
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [selectedBatchForFinalize, setSelectedBatchForFinalize] = useState(null);
  const [finalizeForm, setFinalizeForm] = useState({
    actualHatchedCount: 2800,
    cullCount: 50,
    destinationBarnId: '',
    destinationBarnName: 'Chuồng Nuôi Thịt A2',
    notes: '',
  });

  // Modal Soi trứng ngày 7
  const [isCandlingModalOpen, setIsCandlingModalOpen] = useState(false);
  const [selectedBatchForCandling, setSelectedBatchForCandling] = useState(null);
  const [candlingCount, setCandlingCount] = useState(0);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const branchParam = currentBranchId !== 'ALL' ? currentBranchId : undefined;
      const [sumRes, listRes, barnsRes] = await Promise.all([
        addonsService.getHatcherySummary({ farmId: currentFarmId }),
        addonsService.getHatcheryBatches({
          farmId: currentFarmId,
          branchId: branchParam,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          eggType: eggTypeFilter !== 'ALL' ? eggTypeFilter : undefined,
        }),
        barnBatchService.getBarns(currentFarmId, { branchId: branchParam }).catch(() => []),
      ]);
      if (sumRes) setSummary(sumRes);
      if (Array.isArray(listRes)) setBatches(listRes);
      if (Array.isArray(barnsRes)) setBarns(barnsRes);
    } catch (err) {
      console.warn('Could not load hatchery data', err);
      toast.error('Lỗi tải dữ liệu lò ấp trứng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentFarmId, currentBranchId, statusFilter, eggTypeFilter]);

  const handleOpenCreateBatch = () => {
    setCreateForm({
      batchCode: `AP-GA-${new Date().getMonth() + 1}${new Date().getDate()}-${Math.floor(Math.random() * 90 + 10)}`,
      eggType: 'CHICKEN',
      breedName: 'Gà Ri / Mía cao sản',
      setDate: new Date().toISOString().split('T')[0],
      totalEggs: 3000,
      destinationBarnName: 'Chuồng Úm Gà A1',
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveCreateBatch = async (e) => {
    e.preventDefault();
    if (!createForm.totalEggs || Number(createForm.totalEggs) <= 0) {
      toast.error('Vui lòng nhập số lượng trứng vào lò');
      return;
    }
    try {
      await addonsService.createHatcheryBatch(
        {
          ...createForm,
          totalEggs: Number(createForm.totalEggs),
          branchId: currentBranchId !== 'ALL' ? currentBranchId : undefined,
        },
        { farmId: currentFarmId }
      );
      toast.success(`Đã tạo mẻ ấp mới "${createForm.batchCode}" thành công!`);
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo mẻ ấp');
    }
  };

  const handleOpenCandling = (b) => {
    setSelectedBatchForCandling(b);
    setCandlingCount(b.fertileEggs || Math.round(b.totalEggs * 0.95));
    setIsCandlingModalOpen(true);
  };

  const handleSaveCandling = async (e) => {
    e.preventDefault();
    if (!selectedBatchForCandling) return;
    try {
      await addonsService.updateCandling(
        selectedBatchForCandling.id,
        Number(candlingCount),
        { farmId: currentFarmId }
      );
      toast.success(`Đã cập nhật kết quả soi trứng (${candlingCount} trứng có phôi)!`);
      setIsCandlingModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật kết quả soi');
    }
  };

  const handleOpenFinalize = (b) => {
    setSelectedBatchForFinalize(b);
    const est = b.fertileEggs ? Math.round(b.fertileEggs * 0.95) : Math.round(b.totalEggs * 0.9);
    const emptyBarn = barns.find((bn) => !bn.activeBatch && bn.status !== 'ACTIVE' && bn.status !== 'OCCUPIED') || barns[0];
    setFinalizeForm({
      actualHatchedCount: est,
      cullCount: 20,
      destinationBarnId: emptyBarn ? String(emptyBarn.id) : '',
      destinationBarnName: emptyBarn ? emptyBarn.name : (b.destinationBarnName || 'Chuồng Úm Gà A1'),
      notes: 'Con giống đạt chuẩn loại 1, phản xạ nhanh, rốn khô kín',
    });
    setIsFinalizeModalOpen(true);
  };

  const handleSaveFinalize = async (e) => {
    e.preventDefault();
    if (!selectedBatchForFinalize) return;
    try {
      const chosenBarn = barns.find((bn) => String(bn.id) === String(finalizeForm.destinationBarnId));
      const barnName = chosenBarn?.name || finalizeForm.destinationBarnName;
      await addonsService.finalizeHatch(
        selectedBatchForFinalize.id,
        {
          actualHatchedCount: Number(finalizeForm.actualHatchedCount),
          cullCount: Number(finalizeForm.cullCount),
          destinationBarnId: finalizeForm.destinationBarnId ? Number(finalizeForm.destinationBarnId) : undefined,
          destinationBarnName: barnName,
          notes: finalizeForm.notes,
        },
        { farmId: currentFarmId }
      );
      toast.success(
        `🎉 Đã chốt xuất lò ${formatNumber(finalizeForm.actualHatchedCount)} con giống sang ${barnName} (đã mở lứa nuôi)!`
      );
      setIsFinalizeModalOpen(false);
      triggerRefresh?.();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi chốt nở');
    }
  };

  const handleDeleteBatch = async (b) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẻ ấp "${b.batchCode}"?`)) return;
    try {
      await addonsService.deleteHatcheryBatch(b.id, { farmId: currentFarmId });
      toast.success(`Đã xóa mẻ ấp "${b.batchCode}"!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa mẻ ấp');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
            <Egg className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Ấp Nở & Trứng Giống Gia Cầm
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-100 text-amber-800 uppercase">
                Add-on Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy trình đưa trứng vào lò ấp, soi phôi ngày 7, theo dõi tỷ lệ nở và xuất con giống 1 ngày tuổi sang chuồng nuôi
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
            onClick={handleOpenCreateBatch}
            icon={<Plus className="h-4 w-4" />}
            className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            + Tạo Mẻ Ấp Mới
          </Button>
        </div>
      </div>

      {/* 2. Thẻ KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Trứng đang ấp trong lò</span>
            <Egg className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatNumber(summary.totalIncubatingEggs)} quả
          </div>
          <div className="text-[11px] text-slate-400">Đang kiểm soát nhiệt ẩm máy ấp</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Tỷ lệ có phôi bình quân</span>
            <Sparkles className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono">
            {summary.fertilityRate}%
          </div>
          <div className="text-[11px] text-blue-600 font-semibold">Soi phôi ngày 7 tiêu chuẩn</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Tỷ lệ nở bình quân</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {summary.hatchRate}%
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">Số con nở / Trứng có phôi</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Con giống xuất lò kỳ này</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            {formatNumber(summary.totalHatchedThisMonth)} con
          </div>
          <div className="text-[11px] text-slate-400">Đã chuyển sang chuồng nuôi thịt</div>
        </div>
      </div>

      {/* 3. Bảng Quản lý Mẻ Ấp */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-600" />
              <span>Danh Sách Mẻ Ấp Trứng</span>
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Loại trứng:</span>
              <select
                value={eggTypeFilter}
                onChange={(e) => setEggTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium"
              >
                <option value="ALL">Tất cả</option>
                <option value="CHICKEN">Trứng gà</option>
                <option value="DUCK">Trứng vịt</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="INCUBATING">Đang ấp</option>
                <option value="HATCHED">Đã nở & Xuất chuồng</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-700 font-bold">
                <th className="py-3 px-4">Mã mẻ & Loại</th>
                <th className="py-3 px-4">Tên giống</th>
                <th className="py-3 px-4 text-right">Trứng vào lò</th>
                <th className="py-3 px-4 text-right">Có phôi (Soi N7)</th>
                <th className="py-3 px-4">Ngày vào lò</th>
                <th className="py-3 px-4">Ngày dự kiến nở</th>
                <th className="py-3 px-4 text-right">Con giống nở</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {batches.map((b) => {
                const isHatched = b.status === 'HATCHED';
                return (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 font-mono text-sm">{b.batchCode}</div>
                      <div className="text-[11px] font-semibold text-amber-700">
                        {b.eggType === 'DUCK' ? '🦆 Trứng vịt (28 ngày)' : '🐔 Trứng gà (21 ngày)'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{b.breedName}</div>
                      <div className="text-[11px] text-slate-400">{b.destinationBarnName}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatNumber(b.totalEggs)} quả
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">
                      {b.fertileEggs > 0 ? (
                        <span>{formatNumber(b.fertileEggs)} quả ({((b.fertileEggs / b.totalEggs) * 100).toFixed(1)}%)</span>
                      ) : (
                        <span className="text-slate-400 font-normal">Chưa soi</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">{b.setDate}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-amber-500" />
                        <span>{b.expectedHatchDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-800 text-sm">
                      {isHatched ? (
                        <div>
                          <div>{formatNumber(b.actualHatchedCount)} con</div>
                          {b.fertileEggs > 0 && (
                            <div className="text-[11px] font-semibold text-emerald-600">
                              Tỷ lệ nở: {((b.actualHatchedCount / b.fertileEggs) * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isHatched ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã nở
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                          Đang ấp
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!isHatched && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenCandling(b)}
                              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] inline-flex items-center gap-1"
                              title="Cập nhật trứng có phôi soi ngày 7"
                            >
                              <Eye className="h-3 w-3" />
                              Soi Phôi
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenFinalize(b)}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs"
                              title="Chốt nở và chuyển sang chuồng nuôi"
                            >
                              Chốt Nở
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteBatch(b)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                          title="Xóa mẻ ấp"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {batches.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Chưa có mẻ ấp nào trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TẠO MẺ ẤP MỚI */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo Mẻ Ấp Trứng Mới"
        size="md"
      >
        <form onSubmit={handleSaveCreateBatch} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Mã mẻ ấp *" required>
              <Input
                value={createForm.batchCode}
                onChange={(e) => setCreateForm({ ...createForm, batchCode: e.target.value })}
              />
            </FormField>
            <FormField label="Loại trứng giống *" required>
              <Select
                value={createForm.eggType}
                onChange={(e) => setCreateForm({ ...createForm, eggType: e.target.value })}
                options={[
                  { value: 'CHICKEN', label: '🐔 Trứng gà (Chu kỳ 21 ngày)' },
                  { value: 'DUCK', label: '🦆 Trứng vịt (Chu kỳ 28 ngày)' },
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tên giống gà/vịt *" required>
              <Input
                value={createForm.breedName}
                onChange={(e) => setCreateForm({ ...createForm, breedName: e.target.value })}
              />
            </FormField>
            <FormField label="Số lượng trứng vào lò *" required>
              <Input
                type="number"
                value={createForm.totalEggs}
                onChange={(e) => setCreateForm({ ...createForm, totalEggs: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày vào lò ấp *" required>
              <Input
                type="date"
                value={createForm.setDate}
                onChange={(e) => setCreateForm({ ...createForm, setDate: e.target.value })}
              />
            </FormField>
            <FormField label="Chuồng úm dự kiến chuyển đến">
              <Input
                value={createForm.destinationBarnName}
                onChange={(e) => setCreateForm({ ...createForm, destinationBarnName: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Ghi chú kỹ thuật">
            <Input
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="VD: Trứng tuyển chọn loại 1 từ trại giống Phú Lương..."
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold bg-amber-600 hover:bg-amber-700 text-white">
              Bắt Đầu Mẻ Ấp
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: SOI TRỨNG NGÀY 7 */}
      <Modal
        isOpen={isCandlingModalOpen}
        onClose={() => setIsCandlingModalOpen(false)}
        title={`Soi Trứng Có Phôi: Mẻ ${selectedBatchForCandling?.batchCode || ''}`}
        size="sm"
      >
        <form onSubmit={handleSaveCandling} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Tổng số trứng ban đầu: <strong>{formatNumber(selectedBatchForCandling?.totalEggs || 0)} quả</strong>.
          </p>

          <FormField label="Số trứng có phôi đạt chuẩn *" required hint="Loại bỏ trứng loãng, không cồ">
            <Input
              type="number"
              value={candlingCount}
              onChange={(e) => setCandlingCount(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCandlingModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Lưu Kết Quả
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: CHỐT NỞ & XUẤT SANG CHUỒNG NUÔI */}
      <Modal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        title={`Chốt Xuất Lò Mẻ Ấp: ${selectedBatchForFinalize?.batchCode || ''}`}
        size="md"
      >
        <form onSubmit={handleSaveFinalize} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số con giống nở đạt chuẩn *" required>
              <Input
                type="number"
                value={finalizeForm.actualHatchedCount}
                onChange={(e) => setFinalizeForm({ ...finalizeForm, actualHatchedCount: e.target.value })}
              />
            </FormField>
            <FormField label="Số con loại thải (dị tật, yếu)">
              <Input
                type="number"
                value={finalizeForm.cullCount}
                onChange={(e) => setFinalizeForm({ ...finalizeForm, cullCount: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Chuyển sang chuồng nuôi / chuồng úm *" required>
            {barns.length > 0 ? (
              <Select
                value={finalizeForm.destinationBarnId}
                onChange={(e) => {
                  const chosen = barns.find((bn) => String(bn.id) === e.target.value);
                  setFinalizeForm({
                    ...finalizeForm,
                    destinationBarnId: e.target.value,
                    destinationBarnName: chosen ? chosen.name : finalizeForm.destinationBarnName,
                  });
                }}
                options={[
                  ...barns.map((bn) => {
                    const isEmpty = !bn.activeBatch && bn.status !== 'ACTIVE' && bn.status !== 'OCCUPIED';
                    return {
                      value: String(bn.id),
                      label: `${bn.name} (${isEmpty ? 'Chuồng trống' : 'Đang nuôi'})`,
                    };
                  }),
                ]}
              />
            ) : (
              <Input
                value={finalizeForm.destinationBarnName}
                onChange={(e) => setFinalizeForm({ ...finalizeForm, destinationBarnName: e.target.value })}
              />
            )}
          </FormField>

          <FormField label="Ghi chú xuất lò">
            <Input
              value={finalizeForm.notes}
              onChange={(e) => setFinalizeForm({ ...finalizeForm, notes: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFinalizeModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Xác Nhận Xuất Chuồng
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default HatcheryPage;
