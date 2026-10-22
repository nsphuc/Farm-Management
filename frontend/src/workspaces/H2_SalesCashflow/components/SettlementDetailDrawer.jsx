import React, { useState } from 'react';
import { 
  X, CheckCircle2, TrendingUp, TrendingDown, DollarSign, 
  QrCode, ExternalLink, Receipt, FileText, Calendar, 
  Building, Copy, Check, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';

export function SettlementDetailDrawer({
  isOpen,
  onClose,
  settlement,
  onConfirmSettlement,
  isConfirming = false
}) {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('SUMMARY'); // SUMMARY | REVENUE | EXPENSE | RECEIPT

  if (!isOpen || !settlement) return null;

  const {
    farmId,
    farmName,
    cycleId,
    cycleName,
    cycleCode,
    startDate,
    endDate,
    status,
    totalRevenue = 0,
    totalExpense = 0,
    netProfit = 0,
    ownerVietQrUrl,
    bankBin,
    bankAccountNo,
    bankAccountName,
    transferContent,
    settlementReceiptUrl,
    settlementNotes,
    revenueItems = [],
    expenseItems = []
  } = settlement;

  const isClosed = status === 'CLOSED';
  const isProfitable = Number(netProfit) >= 0;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-xs">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  Đối Soát & Kết Toán Chu Kỳ: {cycleName}
                </h2>
                <StatusBadge status={status} />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {farmName} • Mã đợt: <span className="font-semibold text-slate-700">{cycleCode}</span> • Thời gian: {formatDate(startDate)} - {formatDate(endDate)}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation in Drawer */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-white">
          {[
            { id: 'SUMMARY', label: 'Tổng Quan & VietQR Owner', icon: DollarSign },
            { id: 'REVENUE', label: `Khoản Thu Bán Hàng (${revenueItems.length})`, icon: TrendingUp },
            { id: 'EXPENSE', label: `Khoản Chi Vận Hành (${expenseItems.length})`, icon: TrendingDown },
            { id: 'RECEIPT', label: 'Ủy Nhiệm Chi / Chứng Từ', icon: Receipt },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'SUMMARY' && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span>Tổng Doanh Thu Đã Thu</span>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-black text-emerald-700 mt-2">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <p className="text-[11px] text-emerald-600/80 mt-1">Từ các đơn hàng bán sỉ đã thu tiền</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-amber-50/50 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
                    <span>Tổng Chi Phí Vận Hành</span>
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-black text-amber-700 mt-2">
                    {formatCurrency(totalExpense)}
                  </div>
                  <p className="text-[11px] text-amber-600/80 mt-1">Các khoản chi đã xác nhận tại trại</p>
                </div>

                <div className={`rounded-xl border p-4 ${
                  isProfitable 
                    ? 'border-emerald-300 bg-gradient-to-br from-emerald-100/70 to-teal-50 text-emerald-950' 
                    : 'border-rose-300 bg-rose-50 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Lợi Nhuận Ròng Chuyển Về</span>
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div className={`text-2xl font-black mt-2 ${isProfitable ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {formatCurrency(netProfit)}
                  </div>
                  <p className="text-[11px] font-medium opacity-80 mt-1">
                    {isProfitable ? 'Số tiền Kế toán trại chuyển về tài khoản Owner' : 'Chu kỳ thâm hụt / chưa đạt điểm hòa vốn'}
                  </p>
                </div>
              </div>

              {/* VietQR Owner Transfer Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Mã Thanh Toán VietQR Chuẩn Napas247 Về Tài Khoản Owner
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kế toán trại quét mã này bằng App Ngân hàng để chuyển trực tiếp lợi nhuận ròng vào tài khoản Chủ đầu tư
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    {ownerVietQrUrl ? (
                      <img 
                        src={ownerVietQrUrl} 
                        alt="VietQR Chuyển Lợi Nhuận" 
                        className="w-full max-w-[240px] aspect-square object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                        <QrCode className="h-12 w-12 stroke-[1.5] mb-2" />
                        <span className="text-xs font-semibold">Chưa cấu hình tài khoản</span>
                      </div>
                    )}
                    <span className="text-[11px] text-slate-500 mt-2 font-medium">Quét qua bất kỳ ứng dụng Mobile Banking</span>
                  </div>

                  <div className="md:col-span-7 space-y-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Chủ tài khoản thụ hưởng:</span>
                        <span className="font-bold text-slate-900">{bankAccountName || 'DOANH NGHIEP NONG NGHIEP'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Số tài khoản:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-emerald-700 text-sm">{bankAccountNo || '---'}</span>
                          {bankAccountNo && (
                            <button
                              type="button"
                              onClick={() => handleCopy(bankAccountNo, 'account')}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                              title="Sao chép số tài khoản"
                            >
                              {copiedAccount ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Mã Ngân hàng (BIN):</span>
                        <span className="font-bold text-slate-800">{bankBin || '970422 (MBBank)'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-2">
                        <span>Số tiền kết toán:</span>
                        <span className="font-black text-emerald-700 text-sm">
                          {formatCurrency(Math.max(0, netProfit))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Nội dung chuyển khoản:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {transferContent || `KET TOAN ${cycleCode}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(transferContent || `KET TOAN ${cycleCode}`, 'content')}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                            title="Sao chép nội dung"
                          >
                            {copiedContent ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Lưu ý đối soát cho Owner:</span> Chỉ bấm xác nhận chốt sổ khi kế toán trại đã tải lên Ủy nhiệm chi hoặc tài khoản ngân hàng của bạn đã nhận đủ số tiền lợi nhuận trên.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'REVENUE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Bảng kê các đơn hàng bán sỉ phát sinh trong chu kỳ
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  Tổng thu: <span className="font-bold text-emerald-700">{formatCurrency(totalRevenue)}</span>
                </span>
              </div>

              {revenueItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Không có đơn hàng bán sỉ nào ghi nhận trong chu kỳ này.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Mã đơn</th>
                        <th className="py-2.5 px-3">Ngày đặt</th>
                        <th className="py-2.5 px-3">Khách hàng</th>
                        <th className="py-2.5 px-3 text-right">Tổng tiền (VNĐ)</th>
                        <th className="py-2.5 px-3 text-right">Đã thu (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {revenueItems.map(item => (
                        <tr key={item.orderId || item.orderCode} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{item.orderCode}</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatDate(item.orderDate)}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{item.partnerName}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatCurrency(item.finalAmount)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(item.paidAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'EXPENSE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Bảng kê các khoản chi phí vận hành đã xác nhận trong chu kỳ
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  Tổng chi: <span className="font-bold text-amber-700">{formatCurrency(totalExpense)}</span>
                </span>
              </div>

              {expenseItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Không có chứng từ chi phí nào ghi nhận trong chu kỳ này.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Mã phiếu chi</th>
                        <th className="py-2.5 px-3">Ngày chi</th>
                        <th className="py-2.5 px-3">Khoản mục</th>
                        <th className="py-2.5 px-3">Đối tác / Nhà cung cấp</th>
                        <th className="py-2.5 px-3 text-right">Số tiền (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {expenseItems.map(item => (
                        <tr key={item.expenseId || item.expenseCode} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{item.expenseCode}</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatDate(item.expenseDate)}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{item.categoryName}</td>
                          <td className="py-2.5 px-3 text-slate-600">{item.partnerName || 'Chi nội bộ'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-800">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'RECEIPT' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800">
                Chứng từ chuyển lợi nhuận / Ủy nhiệm chi từ Kế toán trang trại
              </h4>

              {settlementReceiptUrl ? (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 flex flex-col items-center justify-center p-4">
                  <img 
                    src={settlementReceiptUrl} 
                    alt="Biên lai chuyển khoản" 
                    className="max-h-[450px] object-contain rounded-lg shadow-md"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <a 
                      href={settlementReceiptUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Mở ảnh gốc độ phân giải cao</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Receipt className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">Kế toán trại chưa đính kèm ảnh Ủy nhiệm chi</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Nếu Kế toán đã chuyển khoản ngoài hệ thống và bạn đã nhận được tiền, bạn vẫn có thể xác nhận chốt sổ chu kỳ bên dưới.
                  </p>
                </div>
              )}

              {settlementNotes && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Ghi chú từ Kế toán trại:</span>
                  <p className="text-xs text-slate-600 italic">"{settlementNotes}"</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái:</span>
            <StatusBadge status={status} />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>

            {!isClosed && (
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="h-4 w-4" />}
                loading={isConfirming}
                onClick={() => onConfirmSettlement(settlement, notes)}
              >
                Xác Nhận Đã Nhận Lợi Nhuận & Chốt Sổ Chu Kỳ
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default SettlementDetailDrawer;
