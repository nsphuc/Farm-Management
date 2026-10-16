import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layers,
  Boxes,
  Search,
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar,
  AlertTriangle,
  Package,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { inventoryTransactionApi } from '../../../services/inventoryTransactionApi';
import { warehouseApi } from '../../../services/warehouseApi';
import { farmApi } from '../../../services/farmApi';
import { useTenantStore } from '../../../store/tenant/useTenantStore';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Trang Theo Dõi Tồn Kho Hiện Tại (Nghiệp vụ: 3.7. Theo dõi tồn kho trong Sơ đồ phân cấp).
 * Cung cấp: Xem số lượng tồn thực tế trên thẻ kho (quantityOnHand), tồn giữ chỗ (reservedQuantity),
 * số lượng khả dụng (availableQuantity), hạn sử dụng (FEFO), ngày nhập (FIFO), và đơn giá vốn.
 */
export const InventoryBalancePage = () => {
  const { currentFarm, setFarm } = useTenantStore();

  // State trang trại & kho
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('ALL');

  // State bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('ALL'); // ALL, EXPIRING_SOON, EXPIRED

  // State danh sách tồn kho & phân trang
  const [balances, setBalances] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
  });

  // State trạng thái giao diện: Loading, Error, Empty
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Tải danh sách trang trại của Tenant
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await farmApi.getAllFarms();
        const farmList = res.data || [];
        setFarms(farmList);
        if (farmList.length > 0 && !selectedFarmId) {
          setSelectedFarmId(farmList[0].id);
          setFarm(farmList[0]);
        }
      } catch (err) {
        console.error('Lỗi khi tải trang trại:', err);
      }
    };
    fetchFarms();
  }, [selectedFarmId, setFarm]);

  // 2. Tải danh sách kho khi chọn Farm
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!selectedFarmId) return;
      try {
        const res = await warehouseApi.getAllWarehousesByFarm(selectedFarmId);
        setWarehouses(res.data || []);
      } catch (err) {
        console.error('Lỗi khi tải kho bãi:', err);
      }
    };
    fetchWarehouses();
  }, [selectedFarmId]);

  // 3. Tải danh sách tồn kho hiện tại
  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        farmId: selectedFarmId || undefined,
        warehouseId: selectedWarehouseId !== 'ALL' ? selectedWarehouseId : undefined,
        page: pagination.page,
        size: pagination.size,
      };

      const res = await inventoryTransactionApi.getBalances(params);
      const pageData = res.data || {};
      setBalances(pageData.content || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: pageData.totalPages || 0,
        totalElements: pageData.totalElements || 0,
      }));
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu tồn kho:', err);
      setError(err.message || 'Không thể tải dữ liệu tồn kho');
      toast.error('Không thể tải dữ liệu tồn kho', 'Lỗi hệ thống');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFarmId, selectedWarehouseId, pagination.page, pagination.size]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Helper tính ngày chênh lệch hạn sử dụng
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'Không có HSD', color: 'text-slate-400' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Đã quá hạn (${Math.abs(diffDays)} ngày)`,
        color: 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100',
        isExpired: true,
      };
    } else if (diffDays <= 30) {
      return {
        label: `Sắp hết hạn (${diffDays} ngày)`,
        color: 'text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100',
        isExpiringSoon: true,
      };
    }
    return {
      label: `Còn ${diffDays} ngày`,
      color: 'text-slate-600',
    };
  };

  // Filter client-side
  const filteredBalances = useMemo(() => {
    return balances.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.materialCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.storageBinCode?.toLowerCase().includes(searchTerm.toLowerCase());

      const expStatus = getExpiryStatus(item.expiryDate);
      let matchesExpiry = true;
      if (expiryFilter === 'EXPIRED') matchesExpiry = expStatus.isExpired;
      if (expiryFilter === 'EXPIRING_SOON') matchesExpiry = expStatus.isExpiringSoon;

      return matchesSearch && matchesExpiry;
    });
  }, [balances, searchTerm, expiryFilter]);

  // Thống kê tổng quan thẻ đầu trang
  const metrics = useMemo(() => {
    let totalItems = 0;
    let totalValue = 0;
    let expiredCount = 0;
    let expiringSoonCount = 0;

    balances.forEach((b) => {
      const onHand = Number(b.quantityOnHand) || 0;
      const cost = Number(b.unitCost) || 0;
      totalItems += 1;
      totalValue += onHand * cost;

      const exp = getExpiryStatus(b.expiryDate);
      if (exp.isExpired) expiredCount += 1;
      if (exp.isExpiringSoon) expiringSoonCount += 1;
    });

    return { totalItems, totalValue, expiredCount, expiringSoonCount };
  }, [balances]);

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề trang & Nút hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-100/70 text-sky-800">
              Mục 3.7 Sơ đồ phân cấp
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Báo cáo & Thẻ kho</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-sky-600 shrink-0" />
            Theo Dõi Tồn Kho Hiện Tại
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem số lượng tồn kho khả dụng, số lượng giữ chỗ theo từng kho bãi, từng số lô và cảnh báo hạn sử dụng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBalances}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới thẻ kho
          </Button>
        </div>
      </div>

      {/* 2. Thẻ Thống kê Tổng quan (Metrics Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm rounded-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Số lô hàng lưu kho</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {pagination.totalElements || metrics.totalItems} <span className="text-xs font-normal text-slate-400">lô</span>
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm rounded-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng giá trị tồn kho ước tính</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">
              {formatCurrency(metrics.totalValue)}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm rounded-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Lô sắp hết hạn (&le; 30 ngày)</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">
              {metrics.expiringSoonCount} <span className="text-xs font-normal text-slate-400">lô</span>
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm rounded-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Lô đã quá hạn (Cần hủy)</p>
            <p className="text-xl font-bold text-rose-600 mt-0.5">
              {metrics.expiredCount} <span className="text-xs font-normal text-slate-400">lô</span>
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Thanh lọc và Ngữ cảnh Trang trại / Kho */}
      <Card className="p-4 bg-white border border-slate-200/80 shadow-sm rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* Lọc Trang trại */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Trang trại ngữ cảnh
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => {
                const fId = e.target.value;
                setSelectedFarmId(fId);
                const selected = farms.find((f) => f.id === Number(fId));
                if (selected) setFarm(selected);
              }}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name} ({farm.code})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Kho bãi */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Kho bãi lưu trữ
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="ALL">-- Tất cả kho bãi --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Hạn sử dụng */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Cảnh báo hạn dùng (FEFO)
            </label>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="ALL">-- Tất cả hạn dùng --</option>
              <option value="EXPIRING_SOON">Sắp hết hạn (&le; 30 ngày)</option>
              <option value="EXPIRED">Đã quá hạn sử dụng</option>
            </select>
          </div>
        </div>

        {/* Ô tìm kiếm từ khóa */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã SKU, tên vật tư, số lô, mã vị trí kệ/ngăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>
      </Card>

      {/* 4. Bảng Dữ Liệu Tồn Kho */}
      <Card className="border border-slate-200/80 shadow-sm rounded-xl overflow-hidden bg-white">
        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-xs font-medium">Đang truy xuất số dư thẻ kho...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="py-16 flex flex-col items-center justify-center text-rose-500 space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <p className="text-xs font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchBalances}>
              Thử lại
            </Button>
          </div>
        ) : filteredBalances.length === 0 ? (
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="p-4 rounded-full bg-slate-100 text-slate-400">
              <Layers className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu tồn kho</p>
            <p className="text-xs text-slate-400 max-w-sm text-center">
              Chưa phát sinh số dư tồn kho cho điều kiện lọc đã chọn. Hãy thực hiện Nhập kho để bắt đầu ghi nhận số dư.
            </p>
          </div>
        ) : (
          /* Table Data */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Kho bãi</th>
                  <th className="py-3 px-4">Mặt hàng vật tư</th>
                  <th className="py-3 px-4">Số lô</th>
                  <th className="py-3 px-4">Ngày nhập (FIFO)</th>
                  <th className="py-3 px-4">Hạn dùng (FEFO)</th>
                  <th className="py-3 px-4">Vị trí</th>
                  <th className="py-3 px-4 text-right">Đơn giá vốn</th>
                  <th className="py-3 px-4 text-right">Tồn thực tế</th>
                  <th className="py-3 px-4 text-right">Đặt trước</th>
                  <th className="py-3 px-4 text-right">Tồn khả dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredBalances.map((item) => {
                  const expStatus = getExpiryStatus(item.expiryDate);
                  const isZero = Number(item.availableQuantity) <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{item.warehouseName || '---'}</span>
                      </td>

                      {/* Tên vật tư & SKU */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.materialName || `Vật tư #${item.materialId}`}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.materialCode ? `SKU: ${item.materialCode}` : ''} {item.categoryName ? `• ${item.categoryName}` : ''}
                        </p>
                      </td>

                      {/* Số lô */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {item.batchNumber}
                      </td>

                      {/* Ngày nhập (FIFO) */}
                      <td className="py-3 px-4 text-slate-600">
                        {item.inwardDate || '---'}
                      </td>

                      {/* Hạn sử dụng (FEFO) */}
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-slate-700">{item.expiryDate || 'Không có'}</p>
                          {item.expiryDate && (
                            <span className={`text-[10px] inline-block mt-0.5 ${expStatus.color}`}>
                              {expStatus.label}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vị trí kệ/ngăn */}
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {item.storageBinCode || '---'}
                      </td>

                      {/* Đơn giá vốn */}
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(item.unitCost)}
                      </td>

                      {/* Tồn thực tế */}
                      <td className="py-3 px-4 text-right text-slate-800">
                        {Number(item.quantityOnHand).toLocaleString('vi-VN')} {item.standardUnit || ''}
                      </td>

                      {/* Đặt trước */}
                      <td className="py-3 px-4 text-right text-slate-400">
                        {Number(item.reservedQuantity).toLocaleString('vi-VN')}
                      </td>

                      {/* Tồn khả dụng */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs inline-block ${
                            isZero
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          {Number(item.availableQuantity).toLocaleString('vi-VN')} {item.standardUnit || ''}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Phân trang */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <div>
              Hiển thị trang <span className="font-bold text-slate-700">{pagination.page + 1}</span> /{' '}
              <span className="font-bold text-slate-700">{pagination.totalPages}</span> ({pagination.totalElements} lô hàng)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 0}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages - 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Sau <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InventoryBalancePage;
