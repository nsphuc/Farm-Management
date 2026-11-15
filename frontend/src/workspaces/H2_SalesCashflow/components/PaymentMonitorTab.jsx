import React, { useState, useEffect } from 'react';
import {
  Building,
  Search,
  Filter,
  RotateCcw,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  DollarSign,
  QrCode,
  CheckCircle2,
  FileText,
  CreditCard,
  Eye,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { VietQRModal } from '@/components/common/VietQRModal';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { financeService } from '@/services/modules/financeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { Can } from '@/components/common/Can';
import { toast } from '@/store/useToastStore';

export function PaymentMonitorTab({ farmId, onOpenCreatePayment, onOpenAllocateModal }) {
  const { syncTrigger, notifyDataChanged } = useActiveFarmStore();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // VietQR / Receipt Preview modal
  const [selectedPaymentForQr, setSelectedPaymentForQr] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Detail / Receipt image modal
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (farmId && farmId !== 'ALL') {
        params.farmId = farmId;
      }
      if (paymentTypeFilter) {
        params.paymentType = paymentTypeFilter;
      }
      if (paymentMethodFilter) {
        params.paymentMethod = paymentMethodFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      const data = await financeService.getPayments(params);
      const items = data?.content || (Array.isArray(data) ? data : []);
      setPayments(items);
    } catch (err) {
      console.error('Failed to load payments:', err);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [farmId, paymentTypeFilter, paymentMethodFilter, statusFilter, syncTrigger?.finance, syncTrigger?.all]);

  const handleConfirmPayment = async (paymentId) => {
    const targetFarmId = Number(farmId || payments.find((p) => p.id === paymentId)?.farmId);
    if (!targetFarmId) {
      toast.error('Không xác định được trang trại cho phiếu thanh toán này');
      return;
    }
    try {
      await financeService.confirmPayment(targetFarmId, paymentId);
      toast.success('Duyệt phiếu giao dịch thành công!');
      loadPayments();
      notifyDataChanged?.('finance');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể duyệt phiếu thanh toán');
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.paymentCode?.toLowerCase().includes(term) ||
      p.partnerName?.toLowerCase().includes(term) ||
      p.referenceCode?.toLowerCase().includes(term) ||
      p.orderCode?.toLowerCase().includes(term) ||
      p.notes?.toLowerCase().includes(term)
    );
  });

  // Calculate totals
  const totalReceipts = payments
    .filter((p) => p.paymentType === 'RECEIPT' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalDisbursements = payments
    .filter((p) => p.paymentType === 'PAYMENT' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;

  const columns = [
    {
      key: 'paymentCode',
      header: 'Mã Phiếu',
      width: '140px',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800">{row.paymentCode}</span>
          <div className="text-[10px] text-slate-400">{formatDate(row.paymentDate)}</div>
        </div>
      ),
    },
    {
      key: 'paymentType',
      header: 'Loại GD',
      width: '130px',
      render: (row) => {
        const isReceipt = row.paymentType === 'RECEIPT';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isReceipt
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isReceipt ? <ArrowDownLeft className="h-3 w-3 text-emerald-600" /> : <ArrowUpRight className="h-3 w-3 text-amber-600" />}
            <span>{isReceipt ? 'Thu tiền KH' : 'Chi trả NCC'}</span>
          </span>
        );
      },
    },
    {
      key: 'partnerName',
      header: 'Đối Tác / Khách Hàng',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.partnerName || 'Khách vãng lai / Nội bộ'}</div>
          {row.orderCode && (
            <div className="text-[10px] text-slate-500 font-mono">Đơn hàng: {row.orderCode}</div>
          )}
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Phương Thức',
      render: (row) => {
        const isVietQr = row.paymentMethod === 'VIETQR';
        return (
          <div className="flex items-center gap-1.5">
            {isVietQr ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200">
                <QrCode className="h-3 w-3 text-indigo-600" />
                VietQR Napas247
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                <CreditCard className="h-3 w-3 text-slate-500" />
                {row.paymentMethod}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Số Tiền GD',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <div className={`font-mono font-bold text-sm ${row.paymentType === 'RECEIPT' ? 'text-emerald-700' : 'text-slate-800'}`}>
            {row.paymentType === 'RECEIPT' ? '+' : '-'}{formatCurrency(row.amount)}
          </div>
          <div className="text-[10px] text-slate-400">
            Đã trừ nợ: {formatCurrency(row.allocatedAmount || 0)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          {/* Nút VietQR chỉ hiển thị khi THU TIỀN VÀO TÀI KHOẢN TRẠI (RECEIPT) qua VietQR */}
          {row.paymentType === 'RECEIPT' && row.paymentMethod === 'VIETQR' && (
            <Button
              size="xs"
              variant="outline"
              className="text-indigo-700 border-indigo-300 hover:bg-indigo-50 font-semibold text-[11px]"
              icon={<QrCode className="h-3 w-3 text-indigo-600" />}
              onClick={() => {
                setSelectedPaymentForQr(row);
                setIsQrModalOpen(true);
              }}
            >
              Mã QR
            </Button>
          )}

          {/* Nút xem chi tiết & ảnh biên lai */}
          <Button
            size="xs"
            variant={row.proofImageUrl ? "outline" : "ghost"}
            className={row.proofImageUrl ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-[11px]" : "text-slate-600 hover:text-slate-900 text-[11px]"}
            icon={<Eye className="h-3 w-3" />}
            onClick={() => {
              setSelectedPaymentDetail(row);
              setIsDetailModalOpen(true);
            }}
            title={row.proofImageUrl ? "Xem ảnh chứng từ / biên lai đã tải" : "Xem chi tiết chứng từ"}
          >
            {row.proofImageUrl ? 'Xem Biên Lai' : 'Chi Tiết'}
          </Button>

          {/* Nút Duyệt dành cho Giám đốc trại (Checker) */}
          {row.status === 'PENDING' && (
            <Can role={['ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER']}>
              <Button
                size="xs"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                icon={<CheckCircle2 className="h-3 w-3" />}
                onClick={() => handleConfirmPayment(row.id)}
              >
                Duyệt Chi
              </Button>
            </Can>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span>Tổng Thu Vào (Tiền Bán Sỉ & VietQR)</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(totalReceipts)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600">Đã đối soát ghi nhận quỹ thực tế</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span>Tổng Chi Trả (Vật Tư & Nhà Cung Cấp)</span>
            <ArrowUpRight className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700 font-mono">
            {formatCurrency(totalDisbursements)}
          </div>
          <div className="mt-1 text-[11px] text-amber-600">Giải ngân tiền giống, phân bón, thức ăn</div>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-purple-900">
            <span>Phiếu Chờ Phê Duyệt</span>
            <Clock className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-700 font-mono">
            {pendingCount} <span className="text-sm font-normal text-purple-600">chứng từ</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-600">Cần Giám đốc trại xác nhận chi/thu</div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã phiếu, đối tác, đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/60"
            />
          </div>

          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">Tất cả loại giao dịch</option>
            <option value="RECEIPT">Thu tiền khách hàng (RECEIPT)</option>
            <option value="PAYMENT">Chi trả nhà cung cấp (PAYMENT)</option>
            <option value="REFUND">Hoàn tiền giao dịch (REFUND)</option>
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">Tất cả phương thức</option>
            <option value="VIETQR">Chuyển khoản VietQR Napas247</option>
            <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
            <option value="CASH">Tiền mặt tại quỹ</option>
            <option value="DEBT_OFFSET">Cấn trừ công nợ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
            <option value="PENDING">Chờ duyệt (PENDING)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={loadPayments}
            className="text-xs font-semibold"
          >
            Làm Mới
          </Button>

          <Can permission="PERM_FINANCE_PAYMENT" role="ROLE_ACCOUNTANT">
            <Button
              size="sm"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={onOpenCreatePayment}
            >
              + Lập Phiếu Thu/Chi
            </Button>
          </Can>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        loading={isLoading}
        emptyMessage="Chưa có giao dịch thu/chi hoặc thanh toán VietQR nào phù hợp."
      />

      {/* VietQR Quick Preview Modal */}
      {selectedPaymentForQr && (
        <VietQRModal
          isOpen={isQrModalOpen}
          onClose={() => {
            setIsQrModalOpen(false);
            setSelectedPaymentForQr(null);
          }}
          amount={selectedPaymentForQr.amount || 0}
          orderCode={selectedPaymentForQr.paymentCode}
          transferContent={selectedPaymentForQr.qrTransferContent || selectedPaymentForQr.paymentCode}
        />
      )}
      {/* Detail & Receipt Image Modal */}
      {selectedPaymentDetail && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedPaymentDetail(null);
          }}
          title={`Chi Tiết Phiếu Giao Dịch ${selectedPaymentDetail.paymentCode}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Loại giao dịch:</span>
                <span className="font-bold text-slate-800">
                  {selectedPaymentDetail.paymentType === 'RECEIPT' ? 'Thu tiền khách hàng' : 'Chi trả nhà cung cấp'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Phương thức:</span>
                <span className="font-bold text-slate-800">{selectedPaymentDetail.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Đối tác:</span>
                <span className="font-bold text-slate-800">{selectedPaymentDetail.partnerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Số tiền:</span>
                <span className="font-mono font-black text-sm text-emerald-700">
                  {formatCurrency(selectedPaymentDetail.amount)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Ngày thực hiện:</span>
                <span className="font-semibold text-slate-700">{formatDate(selectedPaymentDetail.paymentDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Trạng thái:</span>
                <StatusBadge status={selectedPaymentDetail.status} />
              </div>
              {selectedPaymentDetail.notes && (
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-500 block">Ghi chú:</span>
                  <span className="text-slate-700 italic">{selectedPaymentDetail.notes}</span>
                </div>
              )}
            </div>

            {/* Proof Image Section */}
            <div className="rounded-2xl border border-slate-200 p-3 bg-white">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Ảnh Chụp Biên Lai / Ủy Nhiệm Chi:
              </span>
              {selectedPaymentDetail.proofImageUrl ? (
                <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl">
                  <img
                    src={selectedPaymentDetail.proofImageUrl}
                    alt="Biên lai thanh toán"
                    className="max-h-72 w-auto object-contain rounded-lg border border-slate-200 shadow-xs cursor-pointer hover:opacity-95"
                    onClick={() => window.open(selectedPaymentDetail.proofImageUrl, '_blank')}
                  />
                  <span className="text-[10px] text-slate-400 mt-1.5 italic">
                    Nhấp vào ảnh để mở ảnh kích thước gốc trong tab mới
                  </span>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Chưa có ảnh chụp biên lai hoặc ủy nhiệm chi được đính kèm cho phiếu này.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedPaymentDetail(null);
                }}
              >
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default PaymentMonitorTab;

