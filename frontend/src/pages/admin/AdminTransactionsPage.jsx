import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Eye,
  Zap,
  Code,
  Copy,
  Check,
  X,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';
import { platformAdminService } from '@/services/modules/platformAdminService';
import { toast } from '@/store/useToastStore';

// Mock danh sách giao dịch VNPAY & Webhook IPN
const INITIAL_TRANSACTIONS = [
  {
    id: 'TXN-089',
    orderNo: 'SUB-2026-089',
    vnpTxnRef: '202611151430001',
    vnpTransactionNo: '14598231',
    farmName: 'Trang trại Heo Hòa Bình',
    farmPhone: '0988.123.456',
    serviceName: 'Quản lý Đa chi nhánh',
    duration: '12 tháng',
    amount: 1200000,
    paidAt: '2026-11-15 14:32:18',
    status: 'PAID', // PAID, PENDING, FAILED
    webhookStatus: 'IPN 200 OK',
    bankCode: 'NCB',
    webhookPayload: {
      vnp_TmnCode: 'FARMGO01',
      vnp_Amount: '120000000',
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: 'VNP14598231',
      vnp_CardType: 'ATM',
      vnp_PayDate: '20261115143218',
      vnp_OrderInfo: 'Thanh toan goi cuoc SUB-2026-089 Trang trai Hoa Binh',
      vnp_TransactionNo: '14598231',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: '202611151430001',
      vnp_SecureHashType: 'SHA256',
      vnp_SecureHash: '9a8d7f6e5c4b3a210fedcba9876543210abcdef1234567890abcdef123456789',
    },
  },
  {
    id: 'TXN-088',
    orderNo: 'SUB-2026-088',
    vnpTxnRef: '202611151120002',
    vnpTransactionNo: '14597810',
    farmName: 'Trại Gà Đồi Ba Vì',
    farmPhone: '0977.234.567',
    serviceName: 'Gói Cá nhân Tiêu chuẩn',
    duration: '12 tháng',
    amount: 500000,
    paidAt: '2026-11-15 11:22:05',
    status: 'PAID',
    webhookStatus: 'IPN 200 OK',
    bankCode: 'VIETCOMBANK',
    webhookPayload: {
      vnp_TmnCode: 'FARMGO01',
      vnp_Amount: '50000000',
      vnp_BankCode: 'VIETCOMBANK',
      vnp_BankTranNo: 'VCB992812',
      vnp_CardType: 'QR_CODE',
      vnp_PayDate: '20261115112205',
      vnp_OrderInfo: 'Gia han Standard Starter SUB-2026-088',
      vnp_TransactionNo: '14597810',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: '202611151120002',
      vnp_SecureHash: '7b6c5d4e3f2a1098fedcba09876543210abcdef1234567890abcdef123456789',
    },
  },
  {
    id: 'TXN-087',
    orderNo: 'SUB-2026-087',
    vnpTxnRef: '202611150915003',
    vnpTransactionNo: '14596302',
    farmName: 'Hợp tác xã Nông nghiệp Sông Đà',
    farmPhone: '0912.345.678',
    serviceName: 'Sản xuất phối trộn cám',
    duration: '12 tháng',
    amount: 1600000,
    paidAt: '2026-11-15 09:18:44',
    status: 'PAID',
    webhookStatus: 'IPN 200 OK',
    bankCode: 'TECHCOMBANK',
    webhookPayload: {
      vnp_TmnCode: 'FARMGO01',
      vnp_Amount: '160000000',
      vnp_BankCode: 'TECHCOMBANK',
      vnp_BankTranNo: 'TCB817264',
      vnp_CardType: 'ATM',
      vnp_PayDate: '20261115091844',
      vnp_OrderInfo: 'Kich hoat Addon Feed Mill SUB-2026-087',
      vnp_TransactionNo: '14596302',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: '202611150915003',
      vnp_SecureHash: '6a5b4c3d2e1f0987fedcba9876543210abcdef1234567890abcdef123456789',
    },
  },
  {
    id: 'TXN-086',
    orderNo: 'SUB-2026-086',
    vnpTxnRef: '202611142200004',
    vnpTransactionNo: '0',
    farmName: 'Trang trại Heo Phú Thọ',
    farmPhone: '0903.456.789',
    serviceName: 'Gia súc Sinh sản & Thẻ tai',
    duration: '12 tháng',
    amount: 1500000,
    paidAt: '2026-11-14 22:05:10',
    status: 'FAILED',
    webhookStatus: 'Sai chữ ký / Hủy giao dịch',
    bankCode: 'BIDV',
    webhookPayload: {
      vnp_TmnCode: 'FARMGO01',
      vnp_Amount: '150000000',
      vnp_BankCode: 'BIDV',
      vnp_OrderInfo: 'Thanh toan that bai hoac huy bo SUB-2026-086',
      vnp_ResponseCode: '24', // 24: Khách hàng hủy giao dịch
      vnp_TransactionStatus: '02',
      vnp_TxnRef: '202611142200004',
      vnp_SecureHash: 'INVALID_SIGNATURE_CHECKSUM_MISMATCH',
      error_message: 'Khách hàng bấm hủy tại cổng thanh toán hoặc timeout',
    },
  },
  {
    id: 'TXN-085',
    orderNo: 'SUB-2026-085',
    vnpTxnRef: '202611141730005',
    vnpTransactionNo: '0',
    farmName: 'Nông trại Gà Ri Lạc Thủy',
    farmPhone: '0989.567.890',
    serviceName: 'Gia cầm Đẻ trứng & Ấp nở',
    duration: '6 tháng',
    amount: 750000,
    paidAt: '2026-11-14 17:35:00',
    status: 'PENDING',
    webhookStatus: 'Chờ phản hồi IPN',
    bankCode: 'MBBANK',
    webhookPayload: {
      vnp_TmnCode: 'FARMGO01',
      vnp_Amount: '75000000',
      vnp_BankCode: 'MBBANK',
      vnp_OrderInfo: 'Dang cho phan hoi tu cong ngan hang SUB-2026-085',
      vnp_TxnRef: '202611141730005',
      status: 'Awaiting webhook callback',
    },
  },
  {
    id: 'TXN-084',
    orderNo: 'SUB-2026-084',
    vnpTxnRef: '202611141010006',
    vnpTransactionNo: '14591108',
    farmName: 'Trang trại Heo Đồng Nai Phát',
    farmPhone: '0938.678.901',
    serviceName: 'Bảng lương & Chấm công KPI',
    duration: '12 tháng',
    amount: 800000,
    paidAt: '2026-11-14 10:12:30',
    status: 'PAID',
    webhookStatus: 'IPN 200 OK',
    bankCode: 'VPBANK',
    webhookPayload: {
      vnp_TmnCode: 'FARMGO01',
      vnp_Amount: '80000000',
      vnp_BankCode: 'VPBANK',
      vnp_BankTranNo: 'VPB331902',
      vnp_CardType: 'ATM',
      vnp_PayDate: '20261114101230',
      vnp_OrderInfo: 'Kich hoat Addon Payroll SUB-2026-084',
      vnp_TransactionNo: '14591108',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: '202611141010006',
      vnp_SecureHash: '4d3c2b1a0987fedcba9876543210abcdef1234567890abcdef1234567890abcdef',
    },
  },
];

export function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal Payload JSON
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modal Kích hoạt thủ công
  const [isManualActivateModalOpen, setIsManualActivateModalOpen] = useState(false);

  const formatVnd = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const fetchTransactions = async () => {
    try {
      const data = await platformAdminService.getTransactions();
      if (Array.isArray(data)) {
        const safeParseJson = (raw) => {
          if (!raw) return {};
          if (typeof raw !== 'string') return raw;
          try {
            return JSON.parse(raw);
          } catch {
            return { rawPayload: raw };
          }
        };
        const mapped = data.map((d) => {
          const durationLabel =
            d.packagePlan === 'YEARLY'
              ? '12 tháng (1 năm)'
              : d.packagePlan === 'HALF_YEAR'
              ? '6 tháng'
              : '1 tháng';
          return {
            id: d.id,
            orderNo: d.orderCode,
            vnpTxnRef: d.vnpTxnRef || d.orderCode,
            farmId: d.farmId,
            farmName: d.farmName,
            farmPhone: d.farmPhone || '0912 888 999',
            addonId: d.addonCode,
            addonName: d.addonName,
            serviceName: d.addonName || d.addonCode,
            packageCycle: durationLabel,
            duration: durationLabel,
            amount: Number(d.amount),
            status: d.status,
            webhookStatus: d.status === 'PAID' ? 'IPN 200 OK (Đã cộng hạn)' : (d.status === 'FAILED' ? 'IPN 400 (Sai mã băm checksum)' : 'Chờ phản hồi IPN từ VNPAY'),
            gateway: d.paymentGateway || 'VNPAY',
            bankCode: d.vnpBankCode || 'NCB',
            createdAt: d.createdAt ? new Date(d.createdAt).toLocaleString('vi-VN') : '',
            paidAt: d.paidAt ? new Date(d.paidAt).toLocaleString('vi-VN') : '—',
            webhookPayload: safeParseJson(d.payloadJson),
          };
        });
        setTransactions(mapped);
      }
    } catch (err) {
      console.warn('Could not load transactions from API', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Thống kê nhanh
  const paidTotal = transactions
    .filter((t) => t.status === 'PAID')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingCount = transactions.filter((t) => t.status === 'PENDING').length;
  const pendingTotal = transactions
    .filter((t) => t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  const failedCount = transactions.filter((t) => t.status === 'FAILED').length;

  // Lọc
  const filteredTxns = transactions.filter((t) => {
    const matchKeyword =
      (t.orderNo || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (t.vnpTxnRef || '').includes(searchKeyword) ||
      (t.farmName || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (t.farmPhone || '').includes(searchKeyword);

    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchKeyword && matchStatus;
  });

  // Sao chép JSON
  const handleCopyJson = () => {
    if (!selectedTxn) return;
    navigator.clipboard.writeText(JSON.stringify(selectedTxn.webhookPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kích hoạt thủ công
  const handleConfirmManualActivate = async () => {
    if (!selectedTxn) return;
    try {
      await platformAdminService.manualActivateTransaction(selectedTxn.id);
      toast.success(`Đã kích hoạt thủ công thành công giao dịch #${selectedTxn.orderNo}!`);
      setIsManualActivateModalOpen(false);
      fetchTransactions();
    } catch (err) {
      toast.error('Lỗi khi kích hoạt thủ công giao dịch');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Đối soát Giao dịch VNPAY &amp; Webhook IPN</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              HMAC-SHA512
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kiểm tra tính toàn vẹn gói tin IPN Webhook, đối soát mã giao dịch ngân hàng và kích hoạt dịch vụ thủ công khi có sự cố mạng.
          </p>
        </div>
      </div>

      {/* ========================================================
          3 THẺ THỐNG KÊ GIAO DỊCH NHANH
         ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thẻ 1: Thành công */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Giao dịch thành công (PAID)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400">
              {formatVnd(paidTotal)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Khách hàng đã nhận quyền dịch vụ tự động
            </div>
          </div>
        </div>

        {/* Thẻ 2: Chờ xử lý */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Đang chờ phản hồi (PENDING)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400">
              {pendingCount} giao dịch ({formatVnd(pendingTotal)})
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Đang kết nối cổng thanh toán ngân hàng
            </div>
          </div>
        </div>

        {/* Thẻ 3: Hủy / Lỗi chữ ký */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Lỗi Webhook / Hủy (FAILED)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-400">
              {failedCount} giao dịch cần kiểm tra
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Sai chữ ký hoặc khách bấm hủy đơn
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          BỘ LỌC & TÌM KIẾM
         ======================================================== */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn (SUB-...), Mã VNPAY, Tên trại..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Lọc trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Tất cả giao dịch</option>
            <option value="PAID">PAID — Thành công</option>
            <option value="PENDING">PENDING — Đang chờ</option>
            <option value="FAILED">FAILED — Lỗi / Hủy</option>
          </select>
        </div>
      </div>

      {/* ========================================================
          BẢNG LỊCH SỬ GIAO DỊCH & ĐỐI SOÁT IPN
         ======================================================== */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700/80">
              <tr>
                <th className="py-3.5 px-4">Mã đơn &amp; Mã VNPAY</th>
                <th className="py-3.5 px-4">Trang trại thanh toán</th>
                <th className="py-3.5 px-4">Dịch vụ &amp; Thời hạn</th>
                <th className="py-3.5 px-4">Số tiền &amp; Thời gian</th>
                <th className="py-3.5 px-4">Trạng thái &amp; Webhook</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">
                    Không tìm thấy giao dịch nào.
                  </td>
                </tr>
              ) : (
                filteredTxns.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* Cột 1: Mã đơn & Mã VNPAY */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-white font-mono">{txn.orderNo}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        TxnRef: {txn.vnpTxnRef}
                      </div>
                    </td>

                    {/* Cột 2: Trang trại thanh toán */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-200">{txn.farmName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{txn.farmPhone}</span>
                      </div>
                    </td>

                    {/* Cột 3: Dịch vụ & Thời hạn */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{txn.serviceName}</div>
                      <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        {txn.duration}
                      </span>
                    </td>

                    {/* Cột 4: Số tiền & Thời gian */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-emerald-400 text-sm">
                        {formatVnd(txn.amount)}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {txn.paidAt}
                      </div>
                    </td>

                    {/* Cột 5: Trạng thái & Tín hiệu Webhook */}
                    <td className="py-4 px-4">
                      {txn.status === 'PAID' && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PAID</span>
                          </span>
                          <div className="text-[11px] text-slate-400 font-mono mt-1">
                            {txn.webhookStatus}
                          </div>
                        </div>
                      )}

                      {txn.status === 'PENDING' && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                          <div className="text-[11px] text-slate-400 font-mono mt-1">
                            {txn.webhookStatus}
                          </div>
                        </div>
                      )}

                      {txn.status === 'FAILED' && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            <span>FAILED</span>
                          </span>
                          <div className="text-[11px] text-rose-400 font-mono mt-1">
                            {txn.webhookStatus}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Cột 6: Thao tác */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Nút Xem Payload JSON */}
                        <button
                          onClick={() => {
                            setSelectedTxn(txn);
                            setIsPayloadModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
                          title="Xem chi tiết gói tin JSON Webhook VNPAY gửi về"
                        >
                          <Code className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Payload JSON</span>
                        </button>

                        {/* Nút Kích hoạt thủ công (nếu PENDING hoặc FAILED do lỗi mạng) */}
                        {txn.status !== 'PAID' && (
                          <button
                            onClick={() => {
                              setSelectedTxn(txn);
                              setIsManualActivateModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shadow-sm"
                            title="Kích hoạt thủ công cho khách nếu đã nhận tiền nhưng lỗi mạng"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Kích hoạt</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL 1: XEM PAYLOAD JSON WEBHOOK VNPAY
         ======================================================== */}
      {isPayloadModalOpen && selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Chi tiết Gói tin Webhook IPN (VNPAY Callback)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Đơn hàng: {selectedTxn.orderNo} • Ref: {selectedTxn.vnpTxnRef}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPayloadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <div className="absolute right-3 top-3">
                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
                {JSON.stringify(selectedTxn.webhookPayload, null, 2)}
              </pre>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-300">Ghi chú đối soát:</span> Chữ ký bảo mật <code>vnp_SecureHash</code> được tính toán theo thuật toán <strong>HMAC-SHA512</strong> với Secret Key bí mật của FarmGo tại cổng VNPAY Sandbox.
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsPayloadModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: KÍCH HOẠT DỊCH VỤ THỦ CÔNG
         ======================================================== */}
      {isManualActivateModalOpen && selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  Xác nhận Kích hoạt Thủ công
                </h3>
              </div>
              <button
                onClick={() => setIsManualActivateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Bạn đang chuẩn bị kích hoạt thủ công dịch vụ cho khách hàng:
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div><strong>Trang trại:</strong> {selectedTxn.farmName}</div>
                <div><strong>Dịch vụ:</strong> {selectedTxn.serviceName} ({selectedTxn.duration})</div>
                <div><strong>Số tiền:</strong> {formatVnd(selectedTxn.amount)}</div>
                <div><strong>Mã đơn:</strong> {selectedTxn.orderNo}</div>
              </div>
              <p className="text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                ⚠️ Chỉ kích hoạt khi đã kiểm tra sao kê ngân hàng và xác thực khách hàng đã chuyển khoản thành công nhưng Webhook bị gián đoạn.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsManualActivateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmManualActivate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Xác nhận Kích hoạt ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTransactionsPage;
