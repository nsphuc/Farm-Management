import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  QrCode, 
  CheckCircle2, 
  Layers, 
  Settings2, 
  Sparkles, 
  Eye, 
  AlertCircle 
} from 'lucide-react';
import { traceabilityService } from '../../services/traceabilityService';
import { toast } from 'sonner';

export const ThermalLabelModal = ({
  isOpen,
  onClose,
  batch,
  farmId,
  onPrintSuccess
}) => {
  if (!isOpen || !batch) return null;

  const [labelSize, setLabelSize] = useState('SIZE_50X50'); // 'SIZE_50X50' or 'SIZE_35X22'
  const [printQuantity, setPrintQuantity] = useState(50);
  const [printerName, setPrinterName] = useState('Xprinter XP-350B (Bàn đóng gói #01)');
  const [loading, setLoading] = useState(false);

  const isApproved = batch.status === 'READY_TO_PRINT' || batch.status === 'DA_IN_TEM' || batch.status === 'DANG_XUAT_BAN';

  const handlePrint = async () => {
    if (!isApproved) {
      toast.error('Lô hàng chưa được phê duyệt an toàn (Approval Gate). Không được phép in tem!');
      return;
    }

    try {
      setLoading(true);
      // Ghi nhận log in tem vào CSDL
      await traceabilityService.recordPrintLog(farmId, batch.id, {
        labelSize,
        printQuantity: parseInt(printQuantity, 10),
        printerName,
        notes: `In tại bàn đóng gói kho trung tâm (${labelSize === 'SIZE_50X50' ? '50x50mm' : '35x22mm'})`
      });

      toast.success(`Đã ghi nhận in ${printQuantity} tem nhãn. Đang gửi lệnh in tới máy in...`);
      onPrintSuccess?.();

      // Trigger trình duyệt in nhiệt
      setTimeout(() => {
        window.print();
      }, 300);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi khi ghi nhận lịch sử in tem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 print:shadow-none print:border-none print:m-0 print:max-w-none print:rounded-none">
        
        {/* Header (Ẩn khi in) */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-emerald-950 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Printer className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">In Tem Nhãn Nhiệt Truy Xuất QR</h3>
              <p className="text-xs text-slate-300 font-mono">
                Lô: {batch.batchCode} | {batch.productName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cảnh báo nếu chưa duyệt (Ẩn khi in) */}
        {!isApproved && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center gap-3 text-xs text-rose-800 font-semibold print:hidden">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>
              CẢNH BÁO KIỂM ĐỊNH (APPROVAL GATE): Lô hàng đang ở trạng thái "{batch.status}". Bạn phải phê duyệt an toàn lô hàng trước khi được phép in tem nhãn nhiệt!
            </span>
          </div>
        )}

        {/* Cấu hình máy in & số lượng (Ẩn khi in) */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-4 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khổ tem in nhiệt *
              </label>
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="SIZE_50X50">Khổ vuông 50 x 50 mm (Hộp / Túi)</option>
                <option value="SIZE_35X22">Khổ nhỏ 35 x 22 mm (Trái cây / Khay)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số lượng tem in (con) *
              </label>
              <input
                type="number"
                min="1"
                max="5000"
                value={printQuantity}
                onChange={(e) => setPrintQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Máy in nhiệt mục tiêu
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Area (Cũng là vùng in Thermal Print Area) */}
        <div className="p-6 sm:p-10 flex flex-col items-center justify-center bg-slate-100 print:bg-white print:p-0">
          <div className="text-xs text-slate-500 font-semibold mb-3 flex items-center gap-1.5 print:hidden">
            <Eye className="w-4 h-4 text-emerald-600" />
            Bản xem trước tem nhãn nhiệt 1-bit đơn sắc (Kích thước thực tế):
          </div>

          {/* VÙNG IN TEM NHIỆT KHỔ 50x50 mm */}
          {labelSize === 'SIZE_50X50' && (
            <div 
              id="thermal-print-area-50"
              className="w-[190px] h-[190px] bg-white border-2 border-black p-2 flex flex-col items-center justify-between text-black font-sans leading-none shadow-md print:shadow-none print:border-none print:m-0"
              style={{ width: '50mm', height: '50mm', boxSizing: 'border-box' }}
            >
              {/* Header Farm Name */}
              <div className="w-full text-center border-b border-black pb-1">
                <p className="font-extrabold text-[9px] uppercase tracking-wider truncate">
                  {batch.farmName || 'NÔNG TRẠI VIETGAP'}
                </p>
                <p className="text-[7px] font-bold text-slate-700">CHỨNG NHẬN AN TOÀN VIETGAP</p>
              </div>

              {/* Tên sản phẩm */}
              <div className="w-full text-center my-0.5">
                <h4 className="font-black text-[11px] uppercase tracking-tight line-clamp-1">
                  {batch.productName}
                </h4>
              </div>

              {/* QR Code ZXing Base64 */}
              <div className="my-0.5 flex items-center justify-center">
                {batch.qrImageUrl ? (
                  <img
                    src={batch.qrImageUrl}
                    alt="QR Code"
                    className="w-[85px] h-[85px] object-contain image-rendering-pixelated"
                  />
                ) : (
                  <div className="w-[85px] h-[85px] border border-dashed border-black flex items-center justify-center text-[8px] text-center p-1">
                    [QR chưa sinh - Cần duyệt lô]
                  </div>
                )}
              </div>

              {/* Footer info: NSX / HSD / Mã Lô */}
              <div className="w-full border-t border-black pt-1 text-[7px] font-bold space-y-0.5">
                <div className="flex justify-between">
                  <span>NSX: {batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString('vi-VN') : '—'}</span>
                  <span>HSD: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('vi-VN') : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[7px] truncate max-w-[100px]">Lô: {batch.batchCode}</span>
                  <span className="uppercase text-[6px] border border-black px-1 rounded-xs">
                    {batch.qualityGrade === 'XUAT_KHAU' ? 'Xuất khẩu' : 'Loại 1'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VÙNG IN TEM NHIỆT KHỔ 35x22 mm */}
          {labelSize === 'SIZE_35X22' && (
            <div 
              id="thermal-print-area-35"
              className="w-[132px] h-[83px] bg-white border border-black p-1.5 flex items-center justify-between text-black font-sans leading-none shadow-md print:shadow-none print:border-none print:m-0"
              style={{ width: '35mm', height: '22mm', boxSizing: 'border-box' }}
            >
              {/* Cột trái: QR Code ZXing */}
              <div className="w-[60px] h-[60px] flex-shrink-0 flex items-center justify-center">
                {batch.qrImageUrl ? (
                  <img
                    src={batch.qrImageUrl}
                    alt="QR Code"
                    className="w-[58px] h-[58px] object-contain image-rendering-pixelated"
                  />
                ) : (
                  <div className="w-[58px] h-[58px] border border-dashed border-black flex items-center justify-center text-[6px] text-center">
                    [QR]
                  </div>
                )}
              </div>

              {/* Cột phải: Thông tin tóm tắt */}
              <div className="flex-1 pl-1.5 flex flex-col justify-between h-full text-[6px] font-bold">
                <div>
                  <p className="font-black text-[8px] uppercase tracking-tight line-clamp-1">
                    {batch.productName}
                  </p>
                  <p className="text-[5.5px] text-slate-700 truncate mt-0.5">
                    {batch.farmName || 'VIETGAP'}
                  </p>
                </div>

                <div className="space-y-0.5 border-t border-black/40 pt-0.5">
                  <p>HSD: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('vi-VN') : '—'}</p>
                  <p className="font-mono text-[5.5px] truncate">Lô: {batch.batchCode}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons (Ẩn khi in) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 print:hidden">
          <span className="text-xs text-slate-500 font-medium">
            Số lượng đặt lệnh: <strong className="text-slate-800">{printQuantity} tem</strong> ({labelSize === 'SIZE_50X50' ? '50x50 mm' : '35x22 mm'})
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={loading || !isApproved}
              onClick={handlePrint}
              className="min-h-[44px] px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              <span>{loading ? 'Đang gửi lệnh in...' : `In ${printQuantity} tem ngay`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ThermalLabelModal;
