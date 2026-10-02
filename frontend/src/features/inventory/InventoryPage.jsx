import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Warehouse, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  TrendingDown, 
  Search, 
  Filter, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  RefreshCw, 
  Eye, 
  Printer, 
  Layers, 
  MapPin, 
  Barcode 
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { inventoryService } from '../../services/inventoryService';
import { CreateTransactionModal } from './CreateTransactionModal';
import { StockCardDrawer } from './StockCardDrawer';
import { PrintTransactionModal } from './PrintTransactionModal';
import { toast } from 'sonner';

export const InventoryPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [stocks, setStocks] = useState([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'LOW_STOCK', 'NEAR_EXPIRY', 'EXPIRED'

  // Modals & Drawer states
  const [transactionModalState, setTransactionModalState] = useState({
    isOpen: false,
    type: 'RECEIPT',
    stockItem: null
  });

  const [selectedStockCard, setSelectedStockCard] = useState(null);
  const [isStockCardOpen, setIsStockCardOpen] = useState(false);

  const [printModalState, setPrintModalState] = useState({
    isOpen: false,
    type: 'RECEIPT',
    data: null
  });

  useEffect(() => {
    if (farmId) {
      loadWarehouses();
    }
  }, [farmId]);

  useEffect(() => {
    if (farmId) {
      loadStocks();
    }
  }, [farmId, selectedWarehouseId]);

  const loadWarehouses = async () => {
    try {
      const data = await inventoryService.getWarehouses(farmId);
      setWarehouses(data || []);
      if (data && data.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách kho vật tư');
    }
  };

  const loadStocks = async () => {
    if (!farmId) return;
    try {
      setLoading(true);
      const data = await inventoryService.getStocksByWarehouse(farmId, selectedWarehouseId || null);
      const stockList = data?.items || (Array.isArray(data) ? data : []);
      setStocks(stockList);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu tồn kho');
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  // Safe stocks
  const safeStocks = Array.isArray(stocks) ? stocks : [];

  // KPIs
  const totalItems = safeStocks.length;
  const lowStockCount = safeStocks.filter(s => s.isLowStock).length;
  const nearExpiryCount = safeStocks.filter(s => s.isNearExpiry && !s.isExpired).length;
  const expiredCount = safeStocks.filter(s => s.isExpired).length;

  // Filtered items
  const filteredStocks = safeStocks.filter((item) => {
    const matchSearch = searchTerm
      ? item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.materialSku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.batchNumber && item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;

    let matchStatus = true;
    if (statusFilter === 'LOW_STOCK') matchStatus = item.isLowStock;
    else if (statusFilter === 'NEAR_EXPIRY') matchStatus = item.isNearExpiry && !item.isExpired;
    else if (statusFilter === 'EXPIRED') matchStatus = item.isExpired;

    return matchSearch && matchStatus;
  });

  const handleOpenTransaction = (type, stockItem = null) => {
    setTransactionModalState({
      isOpen: true,
      type,
      stockItem
    });
  };

  const handleOpenStockCard = (item) => {
    setSelectedStockCard(item);
    setIsStockCardOpen(true);
  };

  const handlePrintReceiptOrIssue = (type, resultData) => {
    setPrintModalState({
      isOpen: true,
      type,
      data: resultData
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-emerald-600" />
            Quản trị Kho Vật tư & Tồn kho Đa cấp
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi tồn kho theo Lô (Batch) & Hạn sử dụng, cơ chế xuất FIFO và điều chuyển nội bộ
          </p>
        </div>

        {/* Action buttons >= 44px ergonomics */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenTransaction('RECEIPT')}
            className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-1.5"
          >
            <ArrowDownLeft className="w-4 h-4" /> Nhập Kho (PNK)
          </button>

          <button
            onClick={() => handleOpenTransaction('ISSUE')}
            className="min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 hover:shadow-lg transition flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" /> Xuất Kho (PXK)
          </button>

          <button
            onClick={() => handleOpenTransaction('TRANSFER')}
            className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-4 h-4" /> Điều Chuyển
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Mặt hàng tồn kho</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalItems}</h3>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Dưới định mức an toàn</p>
            <h3 className="text-xl font-bold text-amber-600 mt-0.5">{lowStockCount}</h3>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Cận hạn (≤ 30 ngày)</p>
            <h3 className="text-xl font-bold text-orange-600 mt-0.5">{nearExpiryCount}</h3>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Đã hết hạn</p>
            <h3 className="text-xl font-bold text-rose-600 mt-0.5">{expiredCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Kho Selector */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Warehouse className="w-4 h-4 text-slate-400" />
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">Tất cả các kho</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên vật tư, mã SKU hoặc số Lô..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="LOW_STOCK">Dưới định mức an toàn</option>
            <option value="NEAR_EXPIRY">Cận hạn dùng (≤ 30 ngày)</option>
            <option value="EXPIRED">Đã hết hạn</option>
          </select>

          <button
            onClick={loadStocks}
            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-slate-200 transition"
            title="Làm mới tồn kho"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tồn kho Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Mã SKU</th>
                <th className="px-5 py-3.5">Tên Vật tư / Hàng hóa</th>
                <th className="px-5 py-3.5">Kho lưu trữ</th>
                <th className="px-5 py-3.5">Số Lô (Batch)</th>
                <th className="px-5 py-3.5">Hạn sử dụng</th>
                <th className="px-5 py-3.5 text-right">Khả dụng</th>
                <th className="px-5 py-3.5 text-center">Tình trạng</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Đang truy vấn số dư tồn kho thời gian thực...
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Không có mặt hàng nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">
                        {item.materialSku}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{item.materialName}</div>
                        {item.storageBinCode && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> Ô kệ: {item.storageBinCode}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                        {item.warehouseName}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                        {item.batchNumber || 'DEFAULT'}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {item.expiryDate ? (
                          <div>
                            <span className="font-medium text-slate-800">
                              {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                            </span>
                            {item.isExpired ? (
                              <span className="ml-1 text-[10px] text-rose-600 font-bold block">
                                Hết hạn ({Math.abs(item.daysUntilExpiry)} ngày trước)
                              </span>
                            ) : item.isNearExpiry ? (
                              <span className="ml-1 text-[10px] text-amber-600 font-bold block">
                                Cận hạn (còn {item.daysUntilExpiry} ngày)
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Không HSD</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                        {Number(item.availableQuantity || 0).toLocaleString('vi-VN')}{' '}
                        <span className="text-xs font-medium text-slate-500">
                          {item.standardUnit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {item.isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Hết hạn
                          </span>
                        ) : item.isNearExpiry ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            <Clock className="w-3 h-3" /> Cận hạn
                          </span>
                        ) : item.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <TrendingDown className="w-3 h-3" /> Dưới an toàn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> Đủ hàng
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenTransaction('ISSUE', item)}
                            title="Xuất kho nhanh mặt hàng này"
                            className="min-h-[40px] px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" /> Xuất
                          </button>

                          <button
                            onClick={() => handleOpenStockCard(item)}
                            title="Xem thẻ kho chi tiết"
                            className="min-h-[40px] px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Thẻ kho
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Drawer */}
      <CreateTransactionModal
        isOpen={transactionModalState.isOpen}
        onClose={() => setTransactionModalState(prev => ({ ...prev, isOpen: false }))}
        farmId={farmId}
        initialType={transactionModalState.type}
        initialStockItem={transactionModalState.stockItem}
        onSuccess={loadStocks}
        onPrintRequested={handlePrintReceiptOrIssue}
      />

      <StockCardDrawer
        isOpen={isStockCardOpen}
        onClose={() => setIsStockCardOpen(false)}
        stockItem={selectedStockCard}
        onOpenIssueModal={(item) => handleOpenTransaction('ISSUE', item)}
        onOpenTransferModal={(item) => handleOpenTransaction('TRANSFER', item)}
      />

      <PrintTransactionModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState(prev => ({ ...prev, isOpen: false }))}
        transactionType={printModalState.type}
        data={printModalState.data}
        farmInfo={currentFarm}
      />
    </div>
  );
};
export default InventoryPage;
