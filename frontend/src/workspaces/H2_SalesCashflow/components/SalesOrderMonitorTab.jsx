import React, { useState, useEffect } from 'react';
import { 
  Building, Search, Filter, RotateCcw, Eye, QrCode, 
  Calendar, User, Truck, DollarSign, Package, CheckCircle2, Clock, X 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { VietQRModal } from '@/components/common/VietQRModal';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { financeService } from '@/services/modules/financeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function SalesOrderMonitorTab({ farmId }) {
  const { syncTrigger } = useActiveFarmStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderForQR, setSelectedOrderForQR] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (farmId && farmId !== 'ALL') {
        params.farmId = farmId;
      }
      const data = await financeService.getSalesOrders(params);
      const items = data?.content || (Array.isArray(data) ? data : []);
      setOrders(items);
    } catch (err) {
      console.error('Failed to load sales orders:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [farmId, syncTrigger?.finance]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter && order.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.orderCode?.toLowerCase().includes(term) ||
      order.partnerName?.toLowerCase().includes(term) ||
      order.farmName?.toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      key: 'orderCode',
      header: 'Mã đơn hàng',
      width: '130px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900">{row.orderCode}</span>
      ),
    },
    {
      key: 'farmName',
      header: 'Trang Trại',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Building className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{row.farmName || (row.farmId ? `Trại #${row.farmId}` : '---')}</span>
        </div>
      ),
    },
    {
      key: 'orderDate',
      header: 'Ngày đặt',
      render: (row) => formatDate(row.orderDate),
    },
    {
      key: 'partnerName',
      header: 'Khách hàng B2B',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.partnerName}</div>
          <div className="text-[10px] text-slate-500 font-mono">{row.partnerCode}</div>
        </div>
      ),
    },
    {
      key: 'finalAmount',
      header: 'Tổng tiền',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-slate-900">{formatCurrency(row.finalAmount)}</span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Đã thu',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-emerald-700">{formatCurrency(row.paidAmount)}</span>
      ),
    },
    {
      key: 'debtAmount',
      header: 'Còn nợ',
      align: 'right',
      render: (row) => {
        const debt = Number(row.debtAmount) || 0;
        return (
          <span className={`font-bold ${debt > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
            {formatCurrency(debt)}
          </span>
        );
      },
    },
    {
      key: 'deliveryStatus',
      header: 'Giao hàng',
      align: 'center',
      render: (row) => <StatusBadge status={row.deliveryStatus || 'PENDING'} />,
    },
    {
      key: 'paymentStatus',
      header: 'Thanh toán',
      align: 'center',
      render: (row) => <StatusBadge status={row.paymentStatus || 'UNPAID'} />,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Chi tiết',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            icon={<Eye className="h-3.5 w-3.5 text-slate-600" />}
            onClick={() => setSelectedOrderForDetail(row)}
          >
            Xem
          </Button>
          {Number(row.debtAmount) > 0 && (
            <Button
              size="sm"
              variant="outline"
              icon={<QrCode className="h-3.5 w-3.5 text-emerald-600" />}
              onClick={() => setSelectedOrderForQR(row)}
              title="Xem mã VietQR thu nợ đơn này"
            >
              QR
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách hàng, trang trại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="">Tất cả trạng thái đơn</option>
              <option value="DRAFT">Nháp (DRAFT)</option>
              <option value="CONFIRMED">Đã duyệt (CONFIRMED)</option>
              <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={loadOrders}
          >
            Làm Mới
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có đơn hàng bán sỉ nào',
          description: 'Các đơn bán sỉ phát sinh tại từng trang trại sẽ được hiển thị đầy đủ tại đây để Chủ đầu tư giám sát.',
        }}
      />

      {/* Detail Modal */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">
                  Chi Tiết Đơn Hàng: {selectedOrderForDetail.orderCode}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Trang trại thực hiện:</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedOrderForDetail.farmName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Khách hàng B2B:</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedOrderForDetail.partnerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ngày đặt hàng:</span>
                  <span className="font-semibold text-slate-700">{formatDate(selectedOrderForDetail.orderDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hạn thanh toán:</span>
                  <span className="font-semibold text-slate-700">{formatDate(selectedOrderForDetail.dueDate) || 'Theo hợp đồng'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Danh sách sản phẩm / Lô hàng xuất bán</h4>
                {selectedOrderForDetail.items && selectedOrderForDetail.items.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <tr>
                          <th className="py-2 px-3">Sản phẩm</th>
                          <th className="py-2 px-3">Mã lô KCS</th>
                          <th className="py-2 px-3 text-right">Số lượng</th>
                          <th className="py-2 px-3 text-right">Đơn giá</th>
                          <th className="py-2 px-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrderForDetail.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{item.itemName}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">{item.batchCode || '---'}</td>
                            <td className="py-2 px-3 text-right">{item.quantity} {item.unit}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(item.finalAmount || (item.quantity * item.unitPrice))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Không có mặt hàng chi tiết.</p>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600">Tổng thanh toán:</span>
                <span className="font-black text-emerald-700 text-base">
                  {formatCurrency(selectedOrderForDetail.finalAmount)}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedOrderForDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VietQR Modal */}
      {selectedOrderForQR && (
        <VietQRModal
          isOpen={Boolean(selectedOrderForQR)}
          onClose={() => setSelectedOrderForQR(null)}
          amount={selectedOrderForQR.debtAmount || selectedOrderForQR.finalAmount || 0}
          orderCode={selectedOrderForQR.orderCode || 'SO-001'}
        />
      )}
    </div>
  );
}

export default SalesOrderMonitorTab;
