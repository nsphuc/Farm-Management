import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  CreditCard 
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { financeService } from '../../services/financeService';
import { toast } from 'sonner';

export const DebtAgingReportPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [debts, setDebts] = useState([]);
  const [agingReport, setAgingReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debtTypeFilter, setDebtTypeFilter] = useState(''); // '' | 'PHAI_THU_KHACH' | 'PHAI_TRA_NCC'
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'TRONG_HAN' | 'QUA_HAN' | 'DA_TAT_TOAN'

  // Modal Thanh toán nợ
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    if (farmId) {
      loadData();
    }
  }, [farmId, debtTypeFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [debtRes, agingRes] = await Promise.all([
        financeService.getDebts(farmId, {
          debtType: debtTypeFilter || undefined,
          status: statusFilter || undefined
        }),
        financeService.getAgingReport(farmId).catch(() => null)
      ]);

      setDebts(debtRes?.items || (Array.isArray(debtRes) ? debtRes : []));
      setAgingReport(agingRes);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu sổ công nợ');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedDebt || !paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền thanh toán hợp lệ');
      return;
    }

    try {
      await financeService.recordDebtPayment(farmId, selectedDebt.id, {
        amount: Number(paymentAmount),
        paymentMethod,
        note: paymentNote
      });
      toast.success('Ghi nhận thanh toán công nợ thành công');
      setSelectedDebt(null);
      setPaymentAmount('');
      setPaymentNote('');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi khi thanh toán công nợ');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sổ Công Nợ & Báo Cáo Tuổi Nợ</h1>
        <p className="mt-1 text-sm text-gray-500">
          Theo dõi công nợ phải thu bán nông sản và phải trả nhà cung cấp vật tư với phân tầng rủi ro quá hạn (Aging Report)
        </p>
      </div>

      {/* Aging Report Breakdown Cards */}
      {agingReport && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">0 - 30 Ngày (Trong hạn)</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {agingReport.count0To30 || 0} khoản
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-emerald-700">
                {new Intl.NumberFormat('vi-VN').format(agingReport.aging0To30 || 0)}
              </span>
              <span className="ml-1 text-xs text-emerald-800">VNĐ</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-600">Dòng tiền thu/chi an toàn</p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">31 - 60 Ngày</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                {agingReport.count31To60 || 0} khoản
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-blue-700">
                {new Intl.NumberFormat('vi-VN').format(agingReport.aging31To60 || 0)}
              </span>
              <span className="ml-1 text-xs text-blue-800">VNĐ</span>
            </div>
            <p className="mt-1 text-[11px] text-blue-600">Cần nhắc nhở đối tác</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">61 - 90 Ngày</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                {agingReport.count61To90 || 0} khoản
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-amber-700">
                {new Intl.NumberFormat('vi-VN').format(agingReport.aging61To90 || 0)}
              </span>
              <span className="ml-1 text-xs text-amber-800">VNĐ</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-600">Rủi ro trễ hạn thanh toán</p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">&gt; 90 Ngày (Khó đòi)</span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                {agingReport.countOver90 || 0} khoản
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-rose-700">
                {new Intl.NumberFormat('vi-VN').format(agingReport.agingOver90 || 0)}
              </span>
              <span className="ml-1 text-xs text-rose-800">VNĐ</span>
            </div>
            <p className="mt-1 text-[11px] text-rose-600">Cảnh báo nợ quá hạn nghiêm trọng</p>
          </div>
        </div>
      )}

      {/* Filter and Tabs */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDebtTypeFilter('')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              debtTypeFilter === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả công nợ
          </button>
          <button
            onClick={() => setDebtTypeFilter('PHAI_THU_KHACH')}
            className={`flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              debtTypeFilter === 'PHAI_THU_KHACH' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5" /> Phải thu (Khách nợ)
          </button>
          <button
            onClick={() => setDebtTypeFilter('PHAI_TRA_NCC')}
            className={`flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              debtTypeFilter === 'PHAI_TRA_NCC' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" /> Phải trả (Nợ nhà cung cấp)
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Tất cả trạng thái công nợ</option>
          <option value="TRONG_HAN">Nợ trong hạn</option>
          <option value="QUA_HAN">Nợ quá hạn</option>
          <option value="DA_TAT_TOAN">Đã tất toán (Đã trả xong)</option>
        </select>
      </div>

      {/* Debt Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Mã & Đối tác</th>
                <th className="px-5 py-3.5">Phân loại</th>
                <th className="px-5 py-3.5">Hạn thanh toán</th>
                <th className="px-5 py-3.5">Số tiền gốc</th>
                <th className="px-5 py-3.5">Đã trả</th>
                <th className="px-5 py-3.5">Dư nợ còn lại</th>
                <th className="px-5 py-3.5 text-right">Thu/Trả nợ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-sm text-gray-400">
                    Đang tải danh sách công nợ...
                  </td>
                </tr>
              ) : debts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-sm text-gray-400">
                    Không có khoản công nợ nào
                  </td>
                </tr>
              ) : (
                debts.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{item.partnerName || `Đối tác #${item.partnerId}`}</div>
                      <div className="text-xs text-gray-400 font-mono">{item.debtCode}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      {item.debtType === 'PHAI_THU_KHACH' || item.debtType === 'RECEIVABLE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                          Phải thu (Bán hàng)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                          Phải trả (Mua hàng)
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      <div>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : '—'}</div>
                      {item.daysOverdue > 0 && (
                        <div className="text-[11px] font-bold text-rose-600">
                          Quá hạn {item.daysOverdue} ngày
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('vi-VN').format(item.totalAmount)} đ
                    </td>

                    <td className="px-5 py-3.5 text-xs text-emerald-600 font-semibold">
                      {new Intl.NumberFormat('vi-VN').format(item.paidAmount || 0)} đ
                    </td>

                    <td className="px-5 py-3.5 font-bold text-rose-600 text-sm">
                      {new Intl.NumberFormat('vi-VN').format(item.remainingAmount)} đ
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {item.remainingAmount > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedDebt(item);
                            setPaymentAmount(item.remainingAmount);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Thanh toán
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" /> Đã trả hết
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thanh toán nợ */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">Ghi Nhận Thanh Toán Công Nợ</h2>
            <p className="mt-1 text-xs text-gray-500">
              Đối tác: <strong className="text-gray-800">{selectedDebt.partnerName}</strong> ({selectedDebt.debtCode})
            </p>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số tiền thanh toán (VNĐ) *</label>
                <input
                  type="number"
                  min="1000"
                  max={selectedDebt.remainingAmount}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-bold text-emerald-700 focus:border-emerald-500 focus:outline-none"
                />
                <div className="mt-1 text-[11px] text-gray-500">
                  Dư nợ còn lại: <strong className="text-rose-600">{new Intl.NumberFormat('vi-VN').format(selectedDebt.remainingAmount)} đ</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phương thức thanh toán</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                  <option value="CASH">Tiền mặt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú giao dịch</label>
                <input
                  type="text"
                  placeholder="Mã phiếu thu, chứng từ chuyển tiền..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedDebt(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 shadow"
                >
                  Xác nhận thanh toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
