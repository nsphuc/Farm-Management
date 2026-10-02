import React from 'react';
import { 
  X, 
  Archive, 
  Layers, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Barcode, 
  MapPin,
  TrendingDown
} from 'lucide-react';

export const StockCardDrawer = ({
  isOpen,
  onClose,
  stockItem,
  onOpenIssueModal,
  onOpenTransferModal
}) => {
  if (!isOpen || !stockItem) return null;

  const isLow = stockItem.isLowStock;
  const isExp = stockItem.isExpired;
  const isNear = stockItem.isNearExpiry;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Archive className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {stockItem.materialName}
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                SKU: {stockItem.materialSku} | Kho: {stockItem.warehouseName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card Tổng quan tồn kho */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Số lượng Khả dụng
                </span>
                <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
                  {Number(stockItem.availableQuantity || 0).toLocaleString('vi-VN')}{' '}
                  <span className="text-sm font-semibold text-slate-500">
                    {stockItem.standardUnit || 'đơn vị'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Thực tế tại kho
                </span>
                <div className="text-lg font-bold text-slate-700 mt-0.5">
                  {Number(stockItem.quantityOnHand || 0).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            {/* Trạng thái định mức */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 block font-medium">Tồn an toàn tối thiểu</span>
                <span className="text-slate-900 font-bold mt-0.5 block">
                  {stockItem.minStockLevel ? `${Number(stockItem.minStockLevel).toLocaleString('vi-VN')} ${stockItem.standardUnit}` : 'Chưa thiết lập'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 block font-medium">Tình trạng tồn</span>
                <div className="mt-0.5">
                  {isLow ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                      <TrendingDown className="w-3.5 h-3.5" /> Dưới mức an toàn
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Đủ định mức
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chi tiết Lô & Hạn sử dụng */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-emerald-600" />
              Thông tin Lô hàng & Quản lý Hạn dùng (FIFO)
            </h4>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Số Lô (Batch Number):</span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {stockItem.batchNumber || 'DEFAULT'}
                  </p>
                </div>
                {stockItem.storageBinCode && (
                  <div className="text-right">
                    <span className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                      <MapPin className="w-3.5 h-3.5" /> Ô / Kệ:
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {stockItem.storageBinCode}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Hạn sử dụng:
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {stockItem.expiryDate ? new Date(stockItem.expiryDate).toLocaleDateString('vi-VN') : 'Không thời hạn'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Cảnh báo hạn dùng:
                  </span>
                  <div className="mt-1">
                    {isExp ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-rose-200">
                        <AlertTriangle className="w-3 h-3" /> ĐÃ HẾT HẠN
                      </span>
                    ) : isNear ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-amber-200">
                        <Clock className="w-3 h-3" /> Cận hạn ({stockItem.daysUntilExpiry} ngày)
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-xs">
                        An toàn ({stockItem.daysUntilExpiry ? `${stockItem.daysUntilExpiry} ngày` : 'Tốt'})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Thao tác Kho nhanh với mặt hàng này
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenIssueModal?.(stockItem);
                }}
                className="min-h-[44px] px-3 py-2 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs flex items-center justify-center gap-1.5 transition"
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" /> Xuất kho mặt hàng này
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransferModal?.(stockItem);
                }}
                className="min-h-[44px] px-3 py-2 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs flex items-center justify-center gap-1.5 transition"
              >
                <ArrowDownLeft className="w-4 h-4 text-blue-600" /> Điều chuyển nội bộ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StockCardDrawer;
