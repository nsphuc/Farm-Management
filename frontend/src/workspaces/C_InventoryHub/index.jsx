import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ClipboardCheck,
  Building,
  Eye,
  Info,
  AlertTriangle,
  AlertCircle,
  Package,
  DollarSign,
  Search,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Input, Select } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { inventoryService } from '@/services/modules/inventoryService';
import { StockLedgerDrawer } from './components/StockLedgerDrawer';
import { ReceiptDetailDrawer } from './components/ReceiptDetailDrawer';
import { IssueDetailDrawer } from './components/IssueDetailDrawer';

/**
 * Workspace C: Giám Sát Kho Vận & Quản Trị Tồn Kho Thời Gian Thực
 * Phân quyền phân cấp:
 * - isOwner === true: 100% READ-ONLY, ẩn toàn bộ nút lập/sửa/hủy phiếu, hiển thị 4 KPI & 3 Tab tra cứu
 * - WAREHOUSE_STAFF: Có quyền tạo phiếu, quét mã, hoàn tất nhập/xuất/kiểm kê
 */
export function InventoryHubWorkspace() {
  const { isOwner } = useAuthStore();
  const owner = isOwner();
  const { activeFarmId, syncTrigger } = useActiveFarmStore();

  const isSpecificFarm = Boolean(activeFarmId && activeFarmId !== 'ALL');
  const queryFarmId = isSpecificFarm ? Number(activeFarmId) : undefined;

  // State bộ lọc kho bãi
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Tab điều hướng: Đối với Owner mặc định là 'STOCK' (Tồn kho thời gian thực)
  const [activeTab, setActiveTab] = useState(owner ? 'STOCK' : 'RECEIPTS');

  // Dữ liệu bảng & KPI
  const [summary, setSummary] = useState({
    totalInventoryValuation: 0,
    totalPurchasedAmount: 0,
    nearExpiryCount: 0,
    lowStockCount: 0,
  });
  const [stockItems, setStockItems] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Drawers state
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [isStockDrawerOpen, setIsStockDrawerOpen] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptDrawerOpen, setIsReceiptDrawerOpen] = useState(false);

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isIssueDrawerOpen, setIsIssueDrawerOpen] = useState(false);

  // 1. Nạp danh sách kho bãi khi đổi trang trại trên TopBar
  useEffect(() => {
    const loadWarehouses = async () => {
      if (!isSpecificFarm) {
        setWarehouses([]);
        setSelectedWarehouseId('');
        return;
      }
      try {
        const data = await inventoryService.getWarehouses(queryFarmId);
        setWarehouses(Array.isArray(data) ? data : []);
        setSelectedWarehouseId('');
      } catch (err) {
        console.error('Fetch warehouses error:', err);
        setWarehouses([]);
      }
    };
    loadWarehouses();
  }, [activeFarmId, isSpecificFarm, queryFarmId]);

  // 2. Tải toàn bộ dữ liệu 3 bảng và KPI song song theo trang trại và kho bãi
  const fetchInventoryHubData = async () => {
    try {
      setIsLoading(true);
      const queryWhId = selectedWarehouseId ? Number(selectedWarehouseId) : undefined;

      const [stockRes, receiptsRes, issuesRes, summaryRes] = await Promise.all([
        inventoryService.getInventory({
          farmId: queryFarmId,
          warehouseId: queryWhId,
          size: 100,
        }).catch((err) => {
          console.error('Fetch inventory error:', err);
          return [];
        }),
        inventoryService.getReceipts({
          farmId: queryFarmId,
          warehouseId: queryWhId,
          size: 100,
        }).catch((err) => {
          console.error('Fetch receipts error:', err);
          return [];
        }),
        inventoryService.getIssues({
          farmId: queryFarmId,
          warehouseId: queryWhId,
          size: 100,
        }).catch((err) => {
          console.error('Fetch issues error:', err);
          return [];
        }),
        inventoryService.getInventorySummary({
          farmId: queryFarmId,
          warehouseId: queryWhId,
        }).catch((err) => {
          console.error('Fetch inventory summary error:', err);
          return null;
        }),
      ]);

      const stockList = stockRes?.content || (Array.isArray(stockRes) ? stockRes : []);
      const receiptsList = receiptsRes?.content || (Array.isArray(receiptsRes) ? receiptsRes : []);
      const issuesList = issuesRes?.content || (Array.isArray(issuesRes) ? issuesRes : []);

      setStockItems(stockList);
      setReceipts(receiptsList);
      setIssues(issuesList);

      setSummary({
        totalInventoryValuation: summaryRes?.totalInventoryValuation || 0,
        totalPurchasedAmount: summaryRes?.totalPurchasedAmount || 0,
        nearExpiryCount: summaryRes?.nearExpiryCount || 0,
        lowStockCount: summaryRes?.lowStockCount || 0,
      });
    } catch (err) {
      console.error('Fetch inventory hub data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryHubData();
  }, [activeFarmId, selectedWarehouseId, syncTrigger?.inventory]);

  // Lọc client-side bổ trợ theo ô tìm kiếm
  const filteredStock = stockItems.filter((i) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      i.skuCode?.toLowerCase().includes(q) ||
      i.materialName?.toLowerCase().includes(q) ||
      i.batchNumber?.toLowerCase().includes(q) ||
      i.warehouseName?.toLowerCase().includes(q)
    );
  });

  const filteredReceipts = receipts.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.receiptCode?.toLowerCase().includes(q) ||
      r.warehouseName?.toLowerCase().includes(q) ||
      r.partnerName?.toLowerCase().includes(q)
    );
  });

  const filteredIssues = issues.filter((i) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      i.issueCode?.toLowerCase().includes(q) ||
      i.warehouseName?.toLowerCase().includes(q) ||
      i.receiverName?.toLowerCase().includes(q)
    );
  });

  // ==========================================================
  // Cột Dữ Liệu Cho Tab 1: Sổ Tồn Kho Thời Gian Thực
  // ==========================================================
  const stockColumns = [
    {
      key: 'materialName',
      header: 'Vật Tư / Hàng Hóa',
      width: '220px',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs truncate">{row.materialName}</span>
          <span className="font-mono text-[10px] text-slate-400 block">{row.skuCode || 'SKU —'}</span>
        </div>
      ),
    },
    {
      key: 'batchNumber',
      header: 'Số Lô & Vị Trí',
      width: '150px',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
            {row.batchNumber}
          </span>
          {row.storageBinCode && (
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Kệ/Vị trí: <strong>{row.storageBinCode}</strong>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Kho Bãi',
      width: '160px',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
          <Warehouse className="h-3 w-3 text-slate-500 shrink-0" />
          <span className="truncate">{row.warehouseName || `Kho #${row.warehouseId}`}</span>
        </span>
      ),
    },
    {
      key: 'quantityOnHand',
      header: 'Tồn Thực Tế',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatNumber(row.quantityOnHand)} {row.standardUnit}
        </span>
      ),
    },
    {
      key: 'reservedQuantity',
      header: 'Giữ Chỗ',
      align: 'right',
      width: '95px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {formatNumber(row.reservedQuantity || 0)} {row.standardUnit}
        </span>
      ),
    },
    {
      key: 'availableQuantity',
      header: 'Khả Dụng',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {formatNumber(row.availableQuantity ?? row.quantityOnHand)} {row.standardUnit}
        </span>
      ),
    },
    {
      key: 'unitCost',
      header: 'Đơn Giá Vốn',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 text-xs">
          {formatCurrency(row.unitCost)}
        </span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Hạn Sử Dụng',
      width: '140px',
      render: (row) => {
        const isNear = Boolean(row.isNearExpiry);
        const days = row.daysUntilExpiry;
        return (
          <div>
            <span className="text-xs text-slate-700 font-semibold block">
              {formatDate(row.expiryDate)}
            </span>
            {isNear && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 px-2 py-0.2 text-[9px] font-bold border border-rose-200 mt-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                <span>{days > 0 ? `Còn ${days} ngày` : 'Hết hạn'}</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      width: '120px',
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          icon={<Clock className="h-3.5 w-3.5" />}
          onClick={() => {
            setSelectedStockItem(row);
            setIsStockDrawerOpen(true);
          }}
          title="Xem Lịch Sử Thẻ Kho Bất Biến (#38)"
        >
          Thẻ Kho
        </Button>
      ),
    },
  ];

  // ==========================================================
  // Cột Dữ Liệu Cho Tab 2: Phiếu Nhập Kho
  // ==========================================================
  const receiptColumns = [
    {
      key: 'receiptDate',
      header: 'Ngày Nhập',
      width: '140px',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-800 font-bold block">{formatDate(row.receiptDate)}</span>
          <span className="font-mono text-[10px] text-slate-400 block">{row.receiptCode}</span>
        </div>
      ),
    },
    { key: 'warehouseName', header: 'Kho Nhận', width: '150px' },
    {
      key: 'partnerName',
      header: 'Nhà Cung Cấp',
      width: '180px',
      render: (row) => (
        <span className="text-xs text-slate-800 font-medium">
          {row.partnerName || 'Nhà cung cấp vãng lai'}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Tổng Tiền (VNĐ)',
      align: 'right',
      width: '135px',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-800 text-xs">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      width: '120px',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      width: '110px',
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          icon={<Eye className="h-3.5 w-3.5" />}
          onClick={() => {
            setSelectedReceipt(row);
            setIsReceiptDrawerOpen(true);
          }}
        >
          Chi Tiết
        </Button>
      ),
    },
  ];

  // ==========================================================
  // Cột Dữ Liệu Cho Tab 3: Phiếu Xuất Kho
  // ==========================================================
  const issueColumns = [
    {
      key: 'issueDate',
      header: 'Ngày Xuất',
      width: '140px',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-800 font-bold block">{formatDate(row.issueDate)}</span>
          <span className="font-mono text-[10px] text-slate-400 block">{row.issueCode}</span>
        </div>
      ),
    },
    { key: 'warehouseName', header: 'Kho Xuất', width: '150px' },
    {
      key: 'receiverName',
      header: 'Người Nhận Hàng',
      width: '160px',
      render: (row) => (
        <span className="text-xs text-slate-800 font-medium">{row.receiverName || 'Kỹ thuật trại'}</span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Tổng Giá Trị (VNĐ)',
      align: 'right',
      width: '135px',
      render: (row) => (
        <span className="font-mono font-bold text-amber-800 text-xs">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      width: '120px',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      width: '110px',
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          icon={<Eye className="h-3.5 w-3.5" />}
          onClick={() => {
            setSelectedIssue(row);
            setIsIssueDrawerOpen(true);
          }}
        >
          Chi Tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. HEADER BANNER PHÂN TÁCH THEO ROLE                   */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <Warehouse className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                WS-C: Giám Sát Kho Vận & Quản Trị Tồn Kho
              </h1>
              {owner && (
                <span className="rounded-full bg-blue-100 text-blue-900 px-2.5 py-0.5 text-[10px] font-bold border border-blue-200">
                  Chế Độ Giám Sát (Read-Only)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi biến động tồn kho thời gian thực, chi phí vật tư nhập mua và sổ thẻ kho bất biến
            </p>
          </div>
        </div>

        {/* ẨN TOÀN BỘ NÚT TẠO PHIẾU ĐỐI VỚI OWNER */}
        {!owner && (
          <div className="flex items-center gap-2">
            <Can permission="PERM_INVENTORY_RECEIPT">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => alert('Thủ kho lập phiếu')}
              >
                + Lập Phiếu Kho
              </Button>
            </Can>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. BANNER THÔNG TIN MÀU XANH LAM DÀNH CHO OWNER         */}
      {/* ======================================================== */}
      {owner && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-2xs animate-in fade-in">
          <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="block font-bold text-blue-950">
              Chế độ Giám sát Chủ đầu tư:
            </strong>
            <p className="text-blue-800">
              Mọi thao tác lập phiếu Nhập/Xuất/Kiểm kê vật tư được thực hiện bởi Thủ kho tại từng trang trại. Chủ đầu tư kiểm soát chi phí mua bán, giá trị hàng hóa và tính minh bạch của sổ thẻ kho bất biến.
            </p>
          </div>
        </div>
      )}

      {/* Bộ lọc kho bãi của trang trại đang chọn */}
      {isSpecificFarm && warehouses.length > 0 && (
        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
            Kho Lưu Trữ:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedWarehouseId('')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedWarehouseId === ''
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất Cả Kho ({warehouses.length})
            </button>
            {warehouses.map((w) => {
              const isSelected = String(selectedWarehouseId) === String(w.id);
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWarehouseId(String(w.id))}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Warehouse className="h-3 w-3" />
                  <span>{w.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. HỆ THỐNG 4 THẺ KPI GIÁM SÁT KHO CHO OWNER             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Giá Trị Tồn Kho */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Giá Trị Tồn Kho
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Warehouse className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {formatCurrency(summary.totalInventoryValuation)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {isSpecificFarm ? 'Tại trang trại đã chọn' : 'Toàn bộ chuỗi trang trại'}
          </p>
        </div>

        {/* Card 2: Tổng Tiền Nhập Mua Trong Kỳ */}
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/40 to-white p-4 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              Tổng Tiền Nhập Mua
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl font-black text-blue-950 tracking-tight">
              {formatCurrency(summary.totalPurchasedAmount)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-blue-700/80">
            Tổng chi mua vật tư từ Nhà cung cấp
          </p>
        </div>

        {/* Card 3: Số Lô Hàng Sắp Hết Hạn */}
        <div className={`rounded-2xl border p-4 shadow-xs transition-all ${
          summary.nearExpiryCount > 0
            ? 'border-amber-300 bg-amber-50/50 hover:border-amber-400'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Lô Sắp Hết Hạn
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950 tracking-tight">
              {summary.nearExpiryCount}
            </span>
            <span className="text-xs text-amber-700 font-medium">lô hàng</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-700/80">
            {summary.nearExpiryCount > 0 ? 'Cần ưu tiên xuất dùng trước (FEFO)' : 'Tất cả lô đều an toàn'}
          </p>
        </div>

        {/* Card 4: Chạm Đáy Tồn Kho Tối Thiểu */}
        <div className={`rounded-2xl border p-4 shadow-xs transition-all ${
          summary.lowStockCount > 0
            ? 'border-rose-300 bg-rose-50/50 hover:border-rose-400'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Chạm Đáy Tối Thiểu
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-950 tracking-tight">
              {summary.lowStockCount}
            </span>
            <span className="text-xs text-rose-700 font-medium">mặt hàng</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-700/80">
            {summary.lowStockCount > 0 ? 'Dưới ngưỡng tồn an toàn (Cần tái đặt hàng)' : 'Lượng tồn đạt chuẩn'}
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. ĐIỀU HƯỚNG TABS                                      */}
      {/* ======================================================== */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'STOCK'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Warehouse className="h-4 w-4" />
          <span>1. Bảng Tồn Kho Thời Gian Thực ({stockItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RECEIPTS')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'RECEIPTS'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownLeft className="h-4 w-4" />
          <span>2. Lịch Sử Phiếu Nhập Mua ({receipts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ISSUES')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'ISSUES'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>3. Lịch Sử Phiếu Xuất Kho ({issues.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 6. THANH TÌM KIẾM & BẢNG DỮ LIỆU TƯƠNG ỨNG               */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
          <div className="relative w-full sm:w-80">
            <Input
              prefixIcon={<Search className="h-4 w-4 text-slate-400" />}
              placeholder="Tìm mã SKU, tên vật tư, số lô, mã phiếu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => fetchInventoryHubData()}
            isLoading={isLoading}
          >
            Làm Mới
          </Button>
        </div>

        {/* Tab 1: Bảng Tồn Kho Thời Gian Thực */}
        {activeTab === 'STOCK' && (
          <DataTable
            columns={stockColumns}
            data={filteredStock}
            isLoading={isLoading}
            onRowClick={(row) => {
              setSelectedStockItem(row);
              setIsStockDrawerOpen(true);
            }}
            emptyStateProps={{
              title: 'Không có vật tư nào trong kho',
              description: isSpecificFarm
                ? 'Trang trại này chưa có lô hàng vật tư nào trong kho lưu trữ.'
                : 'Hệ thống chuỗi chưa có dữ liệu tồn kho.',
            }}
          />
        )}

        {/* Tab 2: Lịch Sử Phiếu Nhập Mua */}
        {activeTab === 'RECEIPTS' && (
          <DataTable
            columns={receiptColumns}
            data={filteredReceipts}
            isLoading={isLoading}
            onRowClick={(row) => {
              setSelectedReceipt(row);
              setIsReceiptDrawerOpen(true);
            }}
            emptyStateProps={{
              title: 'Chưa có phiếu nhập mua nào',
              description: 'Chưa có dữ liệu phiếu nhập mua từ Nhà cung cấp theo bộ lọc hiện tại.',
            }}
          />
        )}

        {/* Tab 3: Lịch Sử Phiếu Xuất Kho */}
        {activeTab === 'ISSUES' && (
          <DataTable
            columns={issueColumns}
            data={filteredIssues}
            isLoading={isLoading}
            onRowClick={(row) => {
              setSelectedIssue(row);
              setIsIssueDrawerOpen(true);
            }}
            emptyStateProps={{
              title: 'Chưa có phiếu xuất kho nào',
              description: 'Chưa có dữ liệu phiếu xuất kho vật tư ra đồng ruộng hoặc nội bộ theo bộ lọc hiện tại.',
            }}
          />
        )}
      </div>

      {/* Slide-over Drawer xem sổ thẻ kho bất biến của lô */}
      <StockLedgerDrawer
        isOpen={isStockDrawerOpen}
        onClose={() => setIsStockDrawerOpen(false)}
        item={selectedStockItem}
        farmId={queryFarmId}
      />

      {/* Slide-over Drawer xem chi tiết phiếu nhập mua */}
      <ReceiptDetailDrawer
        isOpen={isReceiptDrawerOpen}
        onClose={() => setIsReceiptDrawerOpen(false)}
        receipt={selectedReceipt}
      />

      {/* Slide-over Drawer xem chi tiết phiếu xuất kho */}
      <IssueDetailDrawer
        isOpen={isIssueDrawerOpen}
        onClose={() => setIsIssueDrawerOpen(false)}
        issue={selectedIssue}
      />
    </div>
  );
}

export default InventoryHubWorkspace;
