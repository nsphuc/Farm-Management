import React, { useState } from 'react';
import { X, Calendar, Boxes, Building2, User, Hash, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { Can } from '../../../permissions/Can';
import { inventoryTransactionApi } from '../../../services/inventoryTransactionApi';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Modal hiển thị chi tiết Phiếu Nhập Kho (Nghiệp vụ 3.3).
 * Bao gồm thông tin chứng từ, nhà cung cấp, kho bãi và bảng dòng chi tiết vật tư nhập.
 */
export const ReceiptDetailModal = ({ isOpen, onClose, receipt, onReceiptUpdated }) => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen || !receipt) return null;

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'APPROVED':
        return <Badge variant="info">Đã duyệt</Badge>;
      case 'DRAFT':
        return <Badge variant="warning">Bản nháp</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReceiptTypeName = (type) => {
    switch (type) {
      case 'PURCHASE':
        return 'Nhập mua từ NCC';
      case 'HARVEST_RETURN':
        return 'Thu hồi / Nhập sau thu hoạch';
      case 'INTERNAL_TRANSFER':
        return 'Nhập điều chuyển nội bộ';
      case 'ADJUSTMENT':
        return 'Nhập điều chỉnh kiểm kê';
      default:
        return type;
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.warning('Vui lòng nhập lý do hủy phiếu', 'Thông báo');
      return;
    }

    setIsCancelling(true);
    try {
      await inventoryTransactionApi.cancelReceipt(receipt.id, cancelReason);
      toast.success(`Đã hủy thành công phiếu nhập ${receipt.receiptCode}`, 'Hủy phiếu thành công');
      setIsCancelDialogOpen(false);
      onClose();
      if (onReceiptUpdated) onReceiptUpdated();
    } catch (err) {
      console.error('Lỗi khi hủy phiếu nhập:', err);
      toast.error(err.message || 'Không thể hủy phiếu nhập này', 'Lỗi hủy phiếu');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800">
                    Chi tiết Phiếu Nhập Kho: {receipt.receiptCode}
                  </h3>
                  {getStatusBadge(receipt.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ngày lập: {receipt.receiptDate} • Loại: {getReceiptTypeName(receipt.receiptType)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Thông tin chứng từ tóm tắt */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Boxes className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Kho tiếp nhận</p>
                  <p className="text-xs font-bold text-slate-700">{receipt.warehouseName || '---'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Nhà cung cấp / Đối tác</p>
                  <p className="text-xs font-bold text-slate-700">{receipt.partnerName || 'Không có (Nội bộ)'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Ngày hạch toán kho</p>
                  <p className="text-xs font-bold text-slate-700">{receipt.receiptDate}</p>
                </div>
              </div>
            </div>

            {receipt.notes && (
              <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl text-xs text-amber-800">
                <span className="font-semibold">Ghi chú:</span> {receipt.notes}
              </div>
            )}

            {/* Bảng chi tiết các mặt hàng nhập */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Chi tiết các dòng hàng nhập kho ({receipt.items?.length || 0} mục)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Mặt hàng vật tư</th>
                      <th className="py-2.5 px-3">Số lô</th>
                      <th className="py-2.5 px-3">Hạn sử dụng</th>
                      <th className="py-2.5 px-3">Vị trí</th>
                      <th className="py-2.5 px-3 text-right">Số lượng</th>
                      <th className="py-2.5 px-3 text-right">Đơn giá</th>
                      <th className="py-2.5 px-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {receipt.items && receipt.items.length > 0 ? (
                      receipt.items.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-800">{item.materialName || `Vật tư #${item.materialId}`}</p>
                            <p className="text-[11px] text-slate-400">{item.materialCode ? `SKU: ${item.materialCode}` : ''}</p>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{item.batchNumber}</td>
                          <td className="py-2.5 px-3 text-slate-500">{item.expiryDate || '---'}</td>
                          <td className="py-2.5 px-3 text-slate-500">{item.storageBinCode || '---'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                            {Number(item.quantity).toLocaleString('vi-VN')} {item.standardUnit || ''}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-4 text-center text-slate-400">
                          Không có dòng chi tiết nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                      <td colSpan="7" className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                        Tổng giá trị tiền hàng:
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-emerald-600">
                        {formatCurrency(receipt.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <div>
              {receipt.status !== 'CANCELLED' && (
                <Can permission="PERM_INVENTORY_RECEIPT">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsCancelDialogOpen(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                    Hủy phiếu nhập này
                  </Button>
                </Can>
              )}
            </div>
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Dialog Hủy phiếu */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Xác nhận hủy phiếu nhập kho"
        confirmText="Xác nhận hủy phiếu"
        cancelText="Bỏ qua"
        variant="danger"
        isLoading={isCancelling}
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Hành động này sẽ chuyển trạng thái phiếu <span className="font-bold text-slate-800">#{receipt.receiptCode}</span> sang <span className="font-bold text-rose-600">CANCELLED</span> và hoàn trừ số lượng đã nhập ra khỏi thẻ kho.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do hủy phiếu <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              rows="3"
              placeholder="Nhập lý do hủy phiếu nhập kho (bắt buộc)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
};

export default ReceiptDetailModal;
