import React, { useState } from 'react';
import { Warehouse, Plus, ScanBarcode, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BarcodeScannerInput } from '@/components/common/BarcodeScannerInput';
import { Can } from '@/components/common/Can';
import { formatCurrency, formatDate } from '@/utils/formatters';

/**
 * Workspace C: Trung Tâm Giao Dịch Kho & Quét Đa Mã Vạch (Điều 2.3 File 08)
 */
export function InventoryHubWorkspace() {
  const [activeTab, setActiveTab] = useState('RECEIPTS');
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const columns = [
    { key: 'receiptCode', header: 'Mã phiếu', width: '130px', sortable: true },
    { key: 'receiptDate', header: 'Ngày nhập', render: (row) => formatDate(row.receiptDate) },
    { key: 'warehouseName', header: 'Kho nhận' },
    { key: 'partnerName', header: 'Nhà cung cấp' },
    { key: 'totalAmount', header: 'Tổng tiền (VNĐ)', align: 'right', render: (row) => formatCurrency(row.totalAmount) },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <Warehouse className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Trung Tâm Giao Dịch Kho & Quét Mã Vạch
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập mua, xuất tiêu hao tự động FEFO, điều chuyển và kiểm kê định kỳ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Can permission="PERM_INVENTORY_RECEIPT">
            <Button variant="primary" size="sm" icon={Plus}>
              Tạo Giao Dịch Kho
            </Button>
          </Can>
        </div>
      </div>

      {/* Barcode Fast Scan Strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
          Quét nhanh mã vạch thùng / bao / lô nội bộ (Laser HID & Camera)
        </span>
        <BarcodeScannerInput
          placeholder="Quét mã vạch để tự động tải thông tin vật tư hoặc kiểm tra tồn kho..."
          onScanSuccess={(item) => {
            console.log('Scanned material:', item);
          }}
        />
      </div>

      {/* Transaction Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: 'RECEIPTS', label: 'Phiếu Nhập Kho', icon: ArrowDownLeft },
          { id: 'ISSUES', label: 'Phiếu Xuất Kho', icon: ArrowUpRight },
          { id: 'TRANSFERS', label: 'Điều Chuyển Kho', icon: ArrowLeftRight },
          { id: 'STOCKTAKES', label: 'Kiểm Kê Kho', icon: ClipboardCheck },
          { id: 'STOCK', label: 'Sổ Tồn Kho Thời Gian Thực', icon: Warehouse },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={receipts}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có giao dịch kho nào',
          description: 'Lập phiếu nhập mua từ nhà cung cấp hoặc mở đợt kiểm kê định kỳ.',
          actionLabel: 'Tạo Phiếu Nhập Kho',
          permission: 'PERM_INVENTORY_RECEIPT',
          onAction: () => {},
        }}
      />
    </div>
  );
}

export default InventoryHubWorkspace;
