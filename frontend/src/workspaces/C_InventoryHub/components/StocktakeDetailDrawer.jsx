import React from 'react';
import {
  ClipboardCheck,
  Warehouse,
  Calendar,
  Package,
  Layers,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Save,
  RotateCcw,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { Can } from '@/components/common/Can';
import { inventoryService } from '@/services/modules/inventoryService';
import { formatDate, formatNumber } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function StocktakeDetailDrawer({ isOpen, onClose, stocktake, farmId, onSuccess }) {
  const [currentStocktake, setCurrentStocktake] = React.useState(stocktake);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSavingCount, setIsSavingCount] = React.useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = React.useState(false);
  const [isCountingMode, setIsCountingMode] = React.useState(false);
  const [countItems, setCountItems] = React.useState([]);
  const syncTrigger = useActiveFarmStore((state) => state.syncTrigger);

  React.useEffect(() => {
    setCurrentStocktake(stocktake);
    setIsCountingMode(false);
    setCountItems([]);
  }, [stocktake, isOpen]);

  const targetFarmId = farmId || currentStocktake?.farmId;

  // GAP-SYNC-05: Lắng nghe syncTrigger để tự động làm mới phiếu kiểm kê đang mở
  React.useEffect(() => {
    if (isOpen && currentStocktake?.id && targetFarmId) {
      inventoryService
        .getStocktakeById(targetFarmId, currentStocktake.id)
        .then((res) => {
          if (res) setCurrentStocktake(res);
        })
        .catch(() => {});
    }
  }, [isOpen, currentStocktake?.id, targetFarmId, syncTrigger?.inventory, syncTrigger?.all]);

  if (!currentStocktake) return null;

  const handleAdjust = async () => {
    if (!window.confirm(`Xác nhận phê duyệt đợt kiểm kê ${currentStocktake.stocktakeCode}? Hệ thống sẽ tự động cân chỉnh tồn kho (ADJUST_IN / ADJUST_OUT) và cập nhật số dư cuối cùng.`)) return;
    try {
      setIsSubmitting(true);
      await inventoryService.adjustStocktake(targetFarmId, currentStocktake.id);
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('inventory');
      toast.success('Đã phê duyệt và cân chỉnh tồn kho thành công!');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Lỗi khi duyệt kiểm kê:', err);
      toast.error('Không thể duyệt kiểm kê: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const initCountItemsFromStocktake = () => {
    if (currentStocktake.items && currentStocktake.items.length > 0) {
      return currentStocktake.items.map((item) => {
        const book = Number(item.bookQuantity) || 0;
        const actual = item.actualQuantity != null ? Number(item.actualQuantity) : book;
        return {
          id: item.id,
          materialId: item.materialId,
          materialName: item.materialName || `Vật tư #${item.materialId}`,
          skuCode: item.skuCode || '',
          standardUnit: item.standardUnit || 'Đơn vị',
          batchNumber: item.batchNumber || 'DEFAULT',
          bookQuantity: book,
          actualQuantity: actual,
          differenceQuantity: actual - book,
          reason: item.reason || '',
        };
      });
    }
    return [];
  };

  const handleStartCounting = async () => {
    const existing = initCountItemsFromStocktake();
    if (existing.length > 0) {
      setCountItems(existing);
      setIsCountingMode(true);
    } else {
      // Tự động nạp tồn kho của kho đang kiểm kê
      await handleLoadInventory();
      setIsCountingMode(true);
    }
  };

  const handleLoadInventory = async () => {
    if (!currentStocktake.warehouseId) return;
    try {
      setIsLoadingInventory(true);
      const res = await inventoryService.getInventory({
        farmId: targetFarmId,
        warehouseId: currentStocktake.warehouseId,
        size: 200,
      });
      const list = res?.content || (Array.isArray(res) ? res : (res?.items || []));
      if (!list || list.length === 0) {
        toast.warning('Kho này hiện chưa ghi nhận tồn kho nào trong hệ thống.');
        setCountItems([]);
        return;
      }
      const mapped = list.map((inv) => {
        const book = Number(inv.quantityOnHand ?? inv.quantity ?? 0);
        return {
          materialId: inv.materialId,
          materialName: inv.materialName || inv.material?.name || `Vật tư #${inv.materialId}`,
          skuCode: inv.materialCode || inv.material?.code || inv.skuCode || '',
          standardUnit: inv.standardUnit || inv.unit || 'Đơn vị',
          batchNumber: inv.batchNumber || 'DEFAULT',
          bookQuantity: book,
          actualQuantity: book, // Mặc định để bằng book, người kiểm đếm nhập thực tế
          differenceQuantity: 0,
          reason: '',
        };
      });
      setCountItems(mapped);
      toast.info(`Đã nạp ${mapped.length} lô tồn kho hiện hữu vào bảng kiểm đếm.`);
    } catch (err) {
      console.error('Lỗi khi nạp tồn kho:', err);
      toast.error('Không thể nạp dữ liệu tồn kho: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const handleCountItemChange = (index, field, value) => {
    setCountItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      if (field === 'actualQuantity') {
        const valNum = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
        target.actualQuantity = valNum;
        const actual = typeof valNum === 'number' ? valNum : 0;
        target.differenceQuantity = Number((actual - target.bookQuantity).toFixed(4));
      } else {
        target[field] = value;
      }
      copy[index] = target;
      return copy;
    });
  };

  const handleRemoveCountItem = (index) => {
    setCountItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCount = async () => {
    if (countItems.length === 0) {
      toast.warning('Vui lòng thêm ít nhất một mặt hàng để lưu kiểm đếm.');
      return;
    }

    // Kiểm tra tính hợp lệ
    for (let i = 0; i < countItems.length; i++) {
      const it = countItems[i];
      if (it.actualQuantity === '' || it.actualQuantity === null || isNaN(Number(it.actualQuantity))) {
        toast.error(`Dòng ${i + 1} (${it.materialName}): Số lượng thực đếm không hợp lệ.`);
        return;
      }
    }

    const payload = {
      items: countItems.map((it) => ({
        materialId: it.materialId,
        batchNumber: it.batchNumber || null,
        actualQuantity: Number(it.actualQuantity) || 0,
        reason: it.reason || null,
      })),
    };

    try {
      setIsSavingCount(true);
      const res = await inventoryService.recordStocktakeCount(targetFarmId, currentStocktake.id, payload);
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      useActiveFarmStore.getState().notifyDataChanged?.('inventory');
      toast.success('Đã ghi nhận kết quả kiểm đếm thực tế thành công!');
      setIsCountingMode(false);
      if (res && res.id) {
        setCurrentStocktake(res);
      } else {
        const refreshed = await inventoryService.getStocktakeById(targetFarmId, currentStocktake.id);
        setCurrentStocktake(refreshed);
      }
      onSuccess?.();
    } catch (err) {
      console.error('Lỗi khi ghi nhận kiểm đếm:', err);
      toast.error('Không thể lưu kết quả kiểm đếm: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingCount(false);
    }
  };

  const itemColumns = [
    {
      key: 'materialName',
      header: 'Vật Tư Kiểm Kê',
      width: '180px',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs truncate">{row.materialName}</span>
          <span className="font-mono text-[10px] text-slate-400 block">{row.skuCode || 'SKU —'}</span>
        </div>
      ),
    },
    {
      key: 'batchNumber',
      header: 'Lô Hàng',
      width: '120px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
          {row.batchNumber || '—'}
        </span>
      ),
    },
    {
      key: 'bookQuantity',
      header: 'Sổ Sách',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {formatNumber(row.bookQuantity)} {row.standardUnit}
        </span>
      ),
    },
    {
      key: 'actualQuantity',
      header: 'Thực Đếm',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatNumber(row.actualQuantity)} {row.standardUnit}
        </span>
      ),
    },
    {
      key: 'differenceQuantity',
      header: 'Chênh Lệch',
      align: 'right',
      width: '120px',
      render: (row) => {
        const diff = Number(row.differenceQuantity) || 0;
        if (diff === 0) {
          return (
            <span className="font-mono text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>0 (Khớp)</span>
            </span>
          );
        }
        if (diff < 0) {
          return (
            <span className="font-mono font-bold text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {formatNumber(diff)} {row.standardUnit}
            </span>
          );
        }
        return (
          <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            +{formatNumber(diff)} {row.standardUnit}
          </span>
        );
      },
    },
    {
      key: 'reason',
      header: 'Giải Trình / Lý Do',
      width: '160px',
      render: (row) => (
        <span className="text-xs text-slate-600 truncate block" title={row.reason}>
          {row.reason || '—'}
        </span>
      ),
    },
  ];

  const canEditCount = (currentStocktake.status === 'DRAFT' || currentStocktake.status === 'IN_PROGRESS');

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={() => {
        if (isCountingMode) {
          if (window.confirm('Bạn đang trong chế độ đếm kho. Bạn có chắc muốn đóng và hủy thay đổi chưa lưu?')) {
            setIsCountingMode(false);
            onClose();
          }
        } else {
          onClose();
        }
      }}
      title={`Biên Bản Kiểm Kê Kho: ${currentStocktake.stocktakeCode}`}
      subtitle={`Ngày kiểm: ${formatDate(currentStocktake.stocktakeDate)} • Kho: ${currentStocktake.warehouseName || `Kho #${currentStocktake.warehouseId}`}`}
      icon={<ClipboardCheck className="h-5 w-5 text-purple-600" />}
      width="max-w-4xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái đợt kiểm:</span>
            <StatusBadge status={currentStocktake.status} size="sm" />
            {isCountingMode && (
              <span className="text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200 flex items-center gap-1">
                <Edit3 className="h-3 w-3" /> Đang nhập số liệu thực đếm
              </span>
            )}
            {!isCountingMode && (currentStocktake.status === 'IN_PROGRESS' || currentStocktake.status === 'DRAFT') && (
              <span className="text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-purple-200">
                Chờ Giám đốc trại phê duyệt & cân chỉnh
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCountingMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCountingMode(false)}
                  disabled={isSavingCount}
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                >
                  Hủy Bỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={isSavingCount}
                  onClick={handleSaveCount}
                  icon={<Save className="h-3.5 w-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Lưu Kết Quả Kiểm Đếm
                </Button>
              </>
            ) : (
              <>
                {canEditCount && (
                  <Can permission="PERM_INVENTORY_STOCKTAKE" role={["ROLE_WAREHOUSE_STAFF", "ROLE_FARM_MANAGER"]}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit3 className="h-3.5 w-3.5 text-slate-600" />}
                      onClick={handleStartCounting}
                    >
                      Nhập Số Lượng Đếm
                    </Button>
                  </Can>
                )}
                {canEditCount && (
                  <Can permission="PERM_INVENTORY_STOCKTAKE" role="ROLE_FARM_MANAGER">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      loading={isSubmitting}
                      onClick={handleAdjust}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                    >
                      Phê Duyệt & Chốt Kiểm Kê
                    </Button>
                  </Can>
                )}
                <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Đóng Khay
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header Tóm Tắt */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kho Kiểm Kê</span>
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <Warehouse className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{currentStocktake.warehouseName || `Kho #${currentStocktake.warehouseId}`}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ngày Kiểm Kê</span>
            <span className="text-xs font-semibold text-slate-800 block">
              {formatDate(currentStocktake.stocktakeDate)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tổng Số Mặt Hàng</span>
            <span className="font-mono font-bold text-slate-900 text-xs block">
              {isCountingMode ? countItems.length : (currentStocktake.items?.length || 0)} mặt hàng
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Thời Gian Duyệt</span>
            <span className="text-xs font-medium text-slate-700 block">
              {currentStocktake.approvedAt ? formatDate(currentStocktake.approvedAt) : (currentStocktake.status === 'IN_PROGRESS' ? 'Chờ GĐ trại phê duyệt' : 'Đang kiểm đếm')}
            </span>
          </div>
        </div>

        {currentStocktake.notes && (
          <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-700">
            <strong>Ghi chú kiểm kê:</strong> {currentStocktake.notes}
          </div>
        )}

        {/* Chế độ nhập kiểm đếm thực tế */}
        {isCountingMode ? (
          <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Edit3 className="h-4 w-4 text-amber-600" />
                  <span>Chế Độ Nhập Số Liệu Thực Tế ({countItems.length} dòng)</span>
                </h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Nhập số lượng thực tế kiểm đếm và lý do chênh lệch (nếu có). Cột chênh lệch sẽ tự động đổi màu cảnh báo.
                </p>
              </div>
              <Button
                variant="outline"
                size="xs"
                icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoadingInventory ? 'animate-spin' : ''}`} />}
                loading={isLoadingInventory}
                onClick={handleLoadInventory}
                title="Tải lại toàn bộ danh sách tồn kho hiện có của kho này"
              >
                Nạp Lại Tồn Kho
              </Button>
            </div>

            {countItems.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-amber-200">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">Chưa có dòng tồn kho nào trong bảng kiểm đếm</p>
                <p className="text-[11px] text-slate-500 mt-1 mb-4">
                  Bấm nút bên dưới để tự động nạp các lô hàng đang tồn tại kho vào bảng kiểm đếm
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  loading={isLoadingInventory}
                  onClick={handleLoadInventory}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Nạp Tồn Kho Để Kiểm Đếm
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Vật Tư</th>
                      <th className="py-2.5 px-3">Số Lô</th>
                      <th className="py-2.5 px-3 text-right">Tồn Sổ Sách</th>
                      <th className="py-2.5 px-3 w-28 text-right">Thực Đếm (*)</th>
                      <th className="py-2.5 px-3 text-right">Chênh Lệch</th>
                      <th className="py-2.5 px-3 w-48">Lý Do / Giải Trình</th>
                      <th className="py-2.5 px-2 text-center w-10">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {countItems.map((row, idx) => {
                      const diff = Number(row.differenceQuantity) || 0;
                      return (
                        <tr key={`${row.materialId}-${row.batchNumber}-${idx}`} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-900 block truncate max-w-[150px]">{row.materialName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{row.skuCode || 'SKU —'}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {row.batchNumber || '—'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {formatNumber(row.bookQuantity)} {row.standardUnit}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.actualQuantity}
                                onChange={(e) => handleCountItemChange(idx, 'actualQuantity', e.target.value)}
                                className="w-20 px-2 py-1 text-right text-xs font-mono font-bold border border-slate-300 rounded focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                              />
                              <span className="text-[10px] text-slate-400 shrink-0">{row.standardUnit}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-xs">
                            {diff === 0 ? (
                              <span className="text-emerald-600">0</span>
                            ) : diff < 0 ? (
                              <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                {formatNumber(diff)}
                              </span>
                            ) : (
                              <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                +{formatNumber(diff)}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.reason}
                              placeholder="Lý do chênh lệch (hao hụt, dập nát...)"
                              onChange={(e) => handleCountItemChange(idx, 'reason', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCountItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded"
                              title="Loại khỏi đợt đếm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Danh sách mặt hàng kiểm kê (Chế độ xem) */
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-purple-600" />
                <span>Chi Tiết Bảng Kiểm Đếm & Chênh Lệch Tồn Kho ({currentStocktake.items?.length || 0})</span>
              </h4>
              {canEditCount && (!currentStocktake.items || currentStocktake.items.length === 0) && (
                <Can permission="PERM_INVENTORY_STOCKTAKE" role={["ROLE_WAREHOUSE_STAFF", "ROLE_FARM_MANAGER"]}>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={<Edit3 className="h-3.5 w-3.5 text-purple-600" />}
                    onClick={handleStartCounting}
                  >
                    Bắt Đầu Nhập Số Liệu
                  </Button>
                </Can>
              )}
            </div>
            <DataTable
              columns={itemColumns}
              data={currentStocktake.items || []}
              emptyStateProps={{
                title: 'Chưa có dữ liệu mặt hàng trong đợt kiểm kê',
                description: 'Đợt kiểm kê mới mở chưa ghi nhận số liệu. Bấm "Nhập Số Lượng Đếm" để tải tồn kho và ghi nhận kết quả.',
              }}
            />
          </div>
        )}
      </div>
    </SlideOverDrawer>
  );
}

export default StocktakeDetailDrawer;
