import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertTriangle,
  Warehouse,
  Package,
  Calendar,
  CheckCircle2,
  DollarSign,
  User,
  Barcode,
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { inventoryService } from '@/services/modules/inventoryService';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

const TRANSACTION_TYPE_LABELS = {
  INWARD: { label: 'Nhập kho', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OUTWARD: { label: 'Xuất kho', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  TRANSFER_IN: { label: 'Nhập chuyển kho', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  TRANSFER_OUT: { label: 'Xuất chuyển kho', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  STOCKTAKE_ADJUST: { label: 'Điều chỉnh kiểm kê', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  DAMAGE_DISPOSAL: { label: 'Hư hỏng / Hủy', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function StockLedgerDrawer({ isOpen, onClose, item, farmId }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;

    const fetchLedger = async () => {
      try {
        setIsLoading(true);
        const res = await inventoryService.getTransactions({
          farmId: farmId || undefined,
          warehouseId: item.warehouseId || undefined,
          materialId: item.materialId || undefined,
          batchNumber: item.batchNumber || undefined,
          size: 50,
        });
        const list = res?.content || (Array.isArray(res) ? res : []);
        setTransactions(list);
      } catch (err) {
        console.error('Fetch stock ledger error:', err);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLedger();
  }, [isOpen, item, farmId]);

  if (!item) return null;

  const columns = [
    {
      key: 'transactionDate',
      header: 'Thời Gian',
      width: '110px',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">
            {formatDate(row.transactionDate || row.createdAt)}
          </span>
          {row.createdAt && (
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(row.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'transactionType',
      header: 'Loại Giao Dịch',
      width: '135px',
      render: (row) => {
        const badge = TRANSACTION_TYPE_LABELS[row.transactionType] || {
          label: row.transactionType,
          color: 'bg-slate-100 text-slate-700',
        };
        const isEntry = row.direction === 'IN';
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${badge.color}`}>
            {isEntry ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
            <span>{badge.label}</span>
          </span>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Số Lượng',
      align: 'right',
      width: '100px',
      render: (row) => {
        const isEntry = row.direction === 'IN';
        return (
          <span className={`font-mono font-bold text-xs ${isEntry ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isEntry ? '+' : '-'} {formatNumber(row.quantity)} {item.standardUnit}
          </span>
        );
      },
    },
    {
      key: 'balance',
      header: 'Tồn Sau GD',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatNumber(row.balanceAfter ?? row.quantity)} {item.standardUnit}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Chứng Từ',
      width: '140px',
      render: (row) => (
        <div className="text-xs">
          <span className="font-mono font-bold text-slate-800 block">
            {row.referenceDocType || 'Giao dịch'} #{row.referenceDocId || row.id}
          </span>
          {row.notes && <span className="text-[10px] text-slate-400 truncate block">{row.notes}</span>}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Giá Trị (VNĐ)',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
  ];

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={item.materialName || 'Thẻ Kho Vật Tư'}
      subtitle={`SKU: ${item.skuCode} • Lô: ${item.batchNumber} • Kho: ${item.warehouseName}`}
      icon={<Warehouse className="h-5 w-5 text-amber-600" />}
      width="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">
            Dữ liệu thẻ kho bất biến (Append-only Ledger #38)
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng Khay
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Card Tóm Tắt Tình Trạng Lô Vật Tư */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tồn Hiện Tại</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-black text-slate-900 text-base">
                {formatNumber(item.quantityOnHand)}
              </span>
              <span className="text-xs text-slate-500 font-semibold">{item.standardUnit}</span>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Khả Dụng</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-black text-emerald-900 text-base">
                {formatNumber(item.availableQuantity ?? item.quantityOnHand)}
              </span>
              <span className="text-xs text-emerald-700 font-semibold">{item.standardUnit}</span>
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Đơn Giá Vốn</span>
            <span className="font-mono font-bold text-amber-950 text-sm block mt-0.5">
              {formatCurrency(item.unitCost)}
            </span>
          </div>

          <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-purple-800 uppercase block mb-1">Hạn Sử Dụng</span>
            <span className="font-semibold text-purple-950 text-xs block mt-0.5">
              {formatDate(item.expiryDate)}
            </span>
            {item.daysUntilExpiry != null && (
              <span className={`text-[10px] font-bold block ${item.daysUntilExpiry < 30 ? 'text-rose-600' : 'text-purple-600'}`}>
                {item.daysUntilExpiry > 0 ? `Còn ${item.daysUntilExpiry} ngày` : 'Đã hết hạn'}
              </span>
            )}
          </div>
        </div>

        {/* Thông tin bổ sung */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Barcode className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-mono">{item.internalBatchBarcode || `BAR-${item.batchNumber}`}</span>
          </div>
          {item.storageBinCode && (
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-slate-400" />
              <span>Vị trí/Kệ: <strong>{item.storageBinCode}</strong></span>
            </div>
          )}
          {item.inwardDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Ngày nhập kho: {formatDate(item.inwardDate)}</span>
            </div>
          )}
        </div>

        {/* Bảng Lịch Sử Thẻ Kho */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Lịch Sử Nhập / Xuất Của Lô Này ({transactions.length})</span>
            </h4>
          </div>

          <DataTable
            columns={columns}
            data={transactions}
            isLoading={isLoading}
            emptyStateProps={{
              title: 'Chưa có giao dịch thẻ kho nào cho lô này',
              description: 'Mọi biến động nhập/xuất/điều chuyển lô hàng sẽ được ghi nhận tự động và bất biến tại đây.',
            }}
          />
        </div>
      </div>
    </SlideOverDrawer>
  );
}

export default StockLedgerDrawer;
