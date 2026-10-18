import React, { useState } from 'react';
import { QrCode, Copy, Check, Download, Building, User, Banknote } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';

/**
 * VietQRModal Component (Mục 2.3 File 09, Workspace H2 File 08)
 * Hiển thị mã QR động chuẩn Napas 24/7, kèm nút sao chép nội dung chuyển khoản và tải ảnh QR.
 */
export function VietQRModal({
  isOpen,
  onClose,
  bankBin = '970422', // Mặc định MBBank
  bankName = 'Ngân hàng Quân Đội (MBBank)',
  accountNo = '0987654321',
  accountName = 'CONG TY NONG NGHIEP SO VINAGREEN',
  amount = 0,
  orderCode = '',
  transferContent,
}) {
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const addInfo = transferContent || (orderCode ? `SO ${orderCode}` : 'THANH TOAN NONG SAN');
  const sanitizedAccountName = (accountName || '').toUpperCase();

  // URL sinh ảnh VietQR chuẩn Napas 24/7
  const vietQrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact.png?amount=${encodeURIComponent(
    amount || 0
  )}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(
    sanitizedAccountName
  )}`;

  const handleCopyMemo = async () => {
    try {
      await navigator.clipboard.writeText(addInfo);
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(accountNo);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(vietQrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VietQR_${orderCode || 'payment'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(vietQrUrl, '_blank');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mã Thanh Toán VietQR (NAPAS 24/7)"
      subtitle="Quét mã bằng bất kỳ ứng dụng Ngân hàng nào để tự động điền số tiền và nội dung"
      size="md"
    >
      <div className="flex flex-col items-center gap-5">
        {/* QR Code Container */}
        <div className="relative rounded-2xl border-2 border-emerald-500/30 bg-white p-3 shadow-lg ring-4 ring-emerald-500/10">
          <img
            src={vietQrUrl}
            alt="VietQR Napas247"
            className="h-64 w-64 object-contain rounded-xl"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            Napas 24/7
          </div>
        </div>

        {/* Amount Display */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-500">Số tiền cần thanh toán</span>
          <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
            {formatCurrency(amount)}
          </span>
        </div>

        {/* Banking Details Card */}
        <div className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Building className="h-3.5 w-3.5 text-slate-400" /> Ngân hàng:
            </span>
            <span className="font-semibold text-slate-800">{bankName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <User className="h-3.5 w-3.5 text-slate-400" /> Chủ tài khoản:
            </span>
            <span className="font-bold text-slate-900 uppercase">{sanitizedAccountName}</span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Banknote className="h-3.5 w-3.5 text-slate-400" /> Số tài khoản:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-sm">{accountNo}</span>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                title="Sao chép STK"
              >
                {copiedAccount ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="flex items-center gap-1.5 text-slate-500">
              <QrCode className="h-3.5 w-3.5 text-slate-400" /> Nội dung chuyển khoản:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {addInfo}
              </span>
              <button
                type="button"
                onClick={handleCopyMemo}
                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                title="Sao chép nội dung"
              >
                {copiedMemo ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full items-center justify-between pt-1">
          <Button variant="secondary" size="md" onClick={onClose}>
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={copiedMemo ? Check : Copy}
              onClick={handleCopyMemo}
            >
              {copiedMemo ? 'Đã sao chép' : 'Sao chép nội dung'}
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Download}
              onClick={handleDownloadQR}
            >
              Tải ảnh QR
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default VietQRModal;
