import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';

export function ReceiptPhotoModal({ isOpen, onClose, expense }) {
  if (!expense) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Hóa Đơn / Chứng Từ: ${expense.expenseCode}`}
      subtitle={`${expense.costCategoryName || 'Khoản mục chi phí'} • Ngày: ${formatDate(expense.expenseDate)} • Số tiền: ${formatCurrency(expense.amount)}`}
      icon={<FileText className="h-5 w-5 text-amber-600" />}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            {expense.receiptPhotoUrl ? 'Chứng từ gốc được kế toán lưu trữ' : 'Chưa có ảnh chụp chứng từ'}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {expense.receiptPhotoUrl ? (
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200">
            <img
              src={expense.receiptPhotoUrl}
              alt={`Hóa đơn ${expense.expenseCode}`}
              className="max-h-[500px] w-auto rounded-lg object-contain shadow-xs"
            />
            <div className="mt-3 flex items-center gap-2">
              <a
                href={expense.receiptPhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Mở trong tab mới</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <FileText className="h-12 w-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">Khoản chi phí này không có ảnh chụp hóa đơn đính kèm.</p>
            <p className="text-xs text-slate-400 mt-1">
              Phát sinh từ nguồn: <strong className="text-slate-600">{expense.expenseSource}</strong>
            </p>
          </div>
        )}

        {/* Thông tin đối soát hóa đơn */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Người nhận tiền</span>
            <span className="font-bold text-slate-800">{expense.recipientName || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Hình thức thanh toán</span>
            <span className="font-bold text-slate-800">{expense.paymentMethod || 'Tiền mặt'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Tính giá thành (KCS)</span>
            <span className={`font-bold ${expense.unitCostEligible ? 'text-emerald-700' : 'text-slate-500'}`}>
              {expense.unitCostEligible ? 'Hợp lệ' : 'Chi phí quản lý'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Trạng thái duyệt</span>
            <span className="font-bold text-slate-800">{expense.status || 'CONFIRMED'}</span>
          </div>
        </div>

        {expense.notes && (
          <div className="text-xs bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-amber-900">
            <span className="font-bold block mb-0.5">Ghi chú kế toán:</span>
            <span>{expense.notes}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
