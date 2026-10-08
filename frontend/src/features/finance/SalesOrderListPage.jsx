import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Truck, 
  Trash2, 
  DollarSign, 
  User, 
  FileText 
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { financeService } from '../../services/financeService';
import { CreateSalesOrderModal } from './CreateSalesOrderModal';
import { toast } from 'sonner';

export const SalesOrderListPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (farmId) {
      loadOrders();
    }
  }, [farmId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await financeService.getSalesOrders(farmId);
      setOrders(res?.items || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách đơn hàng xuất bán');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, deliveryStatus) => {
    try {
      await financeService.updateSalesOrderStatus(farmId, id, { deliveryStatus });
      toast.success('Cập nhật trạng thái giao hàng thành công');
      loadOrders();
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Xác nhận xóa đơn hàng ${code}?`)) return;
    try {
      await financeService.deleteSalesOrder(farmId, id);
      toast.success('Đã xóa đơn hàng');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa đơn hàng');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.partnerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? o.paymentStatus === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const totalPaid = filteredOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);
  const totalDebt = filteredOrders.reduce((sum, o) => sum + (Number(o.debtAmount) || 0), 0);

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'DA_XONG':
      case 'PAID':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">Đã thanh toán</span>;
      case 'MOT_PHAN':
      case 'PARTIAL':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">Trả một phần</span>;
      case 'CHUA_THANH_TOAN':
      case 'UNPAID':
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">Chưa thanh toán</span>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Đơn Hàng & Doanh Thu Bán</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý hợp đồng xuất bán nông sản buôn sỉ, đối soát doanh thu và phát sinh công nợ
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Tạo Đơn Hàng Bán
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng doanh thu bán</span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-blue-700">
              {new Intl.NumberFormat('vi-VN').format(totalRevenue)}
            </span>
            <span className="ml-1 text-xs text-gray-500 font-medium">VNĐ</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Đã thực thu (Tiền mặt/CK)</span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-600">
              {new Intl.NumberFormat('vi-VN').format(totalPaid)}
            </span>
            <span className="ml-1 text-xs text-gray-500 font-medium">VNĐ</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Công nợ còn lại</span>
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-rose-600">
              {new Intl.NumberFormat('vi-VN').format(totalDebt)}
            </span>
            <span className="ml-1 text-xs text-gray-500 font-medium">VNĐ</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc tên đối tác khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Tất cả trạng thái thanh toán</option>
          <option value="DA_XONG">Đã thanh toán đủ</option>
          <option value="MOT_PHAN">Thanh toán một phần</option>
          <option value="CHUA_THANH_TOAN">Chưa thanh toán</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Mã đơn & Ngày lập</th>
                <th className="px-5 py-3.5">Khách hàng</th>
                <th className="px-5 py-3.5">Tổng tiền</th>
                <th className="px-5 py-3.5">Đã trả / Còn nợ</th>
                <th className="px-5 py-3.5">Thanh toán</th>
                <th className="px-5 py-3.5">Giao hàng</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-sm text-gray-400">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-sm text-gray-400">
                    Chưa có đơn hàng bán nào
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-900 font-mono">{order.orderCode}</div>
                      <div className="text-xs text-gray-400">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : ''}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      {order.partnerName || `Đối tác #${order.partnerId}`}
                    </td>

                    <td className="px-5 py-3.5 font-bold text-blue-700 text-sm">
                      {new Intl.NumberFormat('vi-VN').format(order.totalAmount)} đ
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="text-emerald-600 font-semibold">
                        Đã trả: {new Intl.NumberFormat('vi-VN').format(order.paidAmount || 0)} đ
                      </div>
                      {order.debtAmount > 0 && (
                        <div className="text-rose-600 font-bold mt-0.5">
                          Còn nợ: {new Intl.NumberFormat('vi-VN').format(order.debtAmount)} đ
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {getPaymentBadge(order.paymentStatus)}
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <select
                        value={order.deliveryStatus || 'CHO_XUAT'}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold focus:border-blue-500 focus:outline-none bg-white"
                      >
                        <option value="CHO_XUAT">Chờ xuất kho</option>
                        <option value="DANG_GIAO">Đang giao hàng</option>
                        <option value="DA_GIAO">Đã giao hàng</option>
                        <option value="HUY">Hủy đơn</option>
                      </select>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(order.id, order.orderCode)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Xóa đơn hàng"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tạo đơn hàng */}
      <CreateSalesOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        farmId={farmId}
        onSaved={loadOrders}
      />
    </div>
  );
};
