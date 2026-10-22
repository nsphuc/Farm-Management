import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, Plus, QrCode, Truck, CreditCard, Receipt, ArrowLeftRight, Building } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { VietQRModal } from '@/components/common/VietQRModal';
import { Can } from '@/components/common/Can';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Workspace H2: Trung Tâm Bán Hàng, Giao Hàng & Thu Phí VietQR (Điều 2.9 File 08)
 */
export function SalesCashflowWorkspace() {
  const { activeFarmId, syncTrigger, notifyDataChanged } = useActiveFarmStore();
  const { isOwner } = useAuthStore();
  const [activeTab, setActiveTab] = useState('ORDERS');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderForQR, setSelectedOrderForQR] = useState(null);

  useEffect(() => {
    // Tự động tải/lọc đơn hàng theo activeFarmId (khi chọn ALL thì tải toàn bộ chuỗi)
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [activeFarmId, syncTrigger?.finance]);

  const columns = [
    { key: 'orderCode', header: 'Mã đơn hàng', width: '130px', sortable: true },
    {
      key: 'farmName',
      header: 'Trang Trại',
      render: (row) => {
        const name = row.farmName || (row.farmId ? `Trại #${row.farmId}` : null);
        return name ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
            <Building className="h-3 w-3 text-emerald-600" />
            <span>{name}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
            Toàn chuỗi
          </span>
        );
      },
    },
    { key: 'orderDate', header: 'Ngày đặt', render: (row) => formatDate(row.orderDate) },
    { key: 'partnerName', header: 'Khách hàng B2B' },
    { key: 'finalAmount', header: 'Tổng tiền (VNĐ)', align: 'right', render: (row) => formatCurrency(row.finalAmount) },
    { key: 'debtAmount', header: 'Còn nợ (VNĐ)', align: 'right', render: (row) => formatCurrency(row.debtAmount) },
    { key: 'paymentStatus', header: 'Thanh toán', render: (row) => <StatusBadge status={row.paymentStatus} /> },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <Can permission="PERM_FINANCE_PAYMENT">
            <Button
              size="sm"
              variant="outline"
              icon={<QrCode className="h-3.5 w-3.5 text-emerald-600" />}
              onClick={() => setSelectedOrderForQR(row)}
            >
              VietQR
            </Button>
          </Can>
          <Can permission="PERM_DELIVERY_MANAGE">
            <Button
              size="sm"
              variant="outline"
              icon={<Truck className="h-3.5 w-3.5 text-blue-600" />}
              onClick={() => alert(`Lập phiếu giao hàng cho đơn ${row.orderCode}`)}
            >
              Giao Hàng
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <BadgeDollarSign className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Trung Tâm Bán Hàng, Giao Hàng & Thu Phí VietQR
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Lên đơn bán sỉ, giữ chỗ lô hàng, xuất giao nhiều đợt và cấn trừ công nợ hai chiều
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'ORDERS' && (
            <Can permission="PERM_FINANCE_SALES_ORDER">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => alert('Tạo đơn bán sỉ mới')}
              >
                + Tạo Đơn Bán Sỉ
              </Button>
            </Can>
          )}

          {activeTab === 'DELIVERIES' && (
            <Can permission="PERM_DELIVERY_MANAGE">
              <Button
                variant="primary"
                size="sm"
                icon={<Truck className="h-4 w-4" />}
                onClick={() => alert('Tạo đợt xuất giao hàng')}
              >
                + Lập Đợt Giao Hàng
              </Button>
            </Can>
          )}

          {activeTab === 'DEBT' && (
            <Can permission="PERM_PAYMENT_ALLOCATE">
              <Button
                variant="primary"
                size="sm"
                icon={<CreditCard className="h-4 w-4" />}
                onClick={() => alert('Cấn trừ công nợ đối tác 2 chiều')}
              >
                + Cấn Trừ Công Nợ
              </Button>
            </Can>
          )}

          {activeTab === 'PAYMENTS' && (
            <Can permission="PERM_FINANCE_PAYMENT">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => alert('Tạo giao dịch thanh toán / thu tiền')}
              >
                + Ghi Nhận Thanh Toán
              </Button>
            </Can>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: 'ORDERS', label: 'Đơn Hàng Bán Sỉ', icon: Receipt },
          { id: 'DELIVERIES', label: 'Giao Hàng (Split Shipments)', icon: Truck },
          { id: 'DEBT', label: 'Sổ Cái Công Nợ Hai Chiều', icon: CreditCard },
          { id: 'PAYMENTS', label: 'Thu Chi & VietQR', icon: ArrowLeftRight },
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

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có đơn hàng bán sỉ nào',
          description: 'Lên đơn bán cho thương lái hoặc chuỗi siêu thị và sinh mã thanh toán VietQR.',
          actionLabel: 'Tạo Đơn Bán Sỉ Đầu Tiên',
          permission: 'PERM_FINANCE_SALES_ORDER',
          onAction: () => {},
        }}
      />

      {/* VietQR Modal */}
      {selectedOrderForQR && (
        <VietQRModal
          isOpen={Boolean(selectedOrderForQR)}
          onClose={() => setSelectedOrderForQR(null)}
          amount={selectedOrderForQR.debtAmount || selectedOrderForQR.finalAmount || 5000000}
          orderCode={selectedOrderForQR.orderCode || 'SO-001'}
        />
      )}
    </div>
  );
}

export default SalesCashflowWorkspace;
