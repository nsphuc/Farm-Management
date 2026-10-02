import React from 'react';
import { Printer, X, Download } from 'lucide-react';

export const PrintTransactionModal = ({
  isOpen,
  onClose,
  transactionType = 'RECEIPT', // 'RECEIPT', 'ISSUE', 'TRANSFER', 'STOCKTAKE'
  data = null,
  farmInfo = null,
}) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const getTitle = () => {
    switch (transactionType) {
      case 'RECEIPT':
        return {
          title: 'PHIẾU NHẬP KHO',
          sub: 'VẬT TƯ NÔNG NGHIỆP & PHÂN BÓN / THUỐC BVTV',
          codePrefix: 'Số phiếu: ',
          code: data.receiptCode || data.code || 'PNK-AUTO',
        };
      case 'ISSUE':
        return {
          title: 'PHIẾU XUẤT KHO',
          sub: 'VẬT TƯ PHỤC VỤ SẢN XUẤT / CHĂN NUÔI',
          codePrefix: 'Số phiếu: ',
          code: data.issueCode || data.code || 'PXK-AUTO',
        };
      case 'TRANSFER':
        return {
          title: 'PHIẾU ĐIỀU CHUYỂN KHO',
          sub: 'LUÂN CHUYỂN NỘI BỘ TRANG TRẠI',
          codePrefix: 'Số phiếu: ',
          code: data.transferCode || data.code || 'PDC-AUTO',
        };
      default:
        return {
          title: 'PHIẾU GIAO DỊCH KHO',
          sub: 'CHỨNG TỪ NỘI BỘ',
          codePrefix: 'Mã: ',
          code: data.code || 'PGD-AUTO',
        };
    }
  };

  const info = getTitle();
  const currentDate = new Date(data.date || data.receiptDate || data.issueDate || data.transferDate || Date.now());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Container - In được cả màn hình & in giấy A4 */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 print:shadow-none print:border-none print:m-0 print:max-w-none print:rounded-none">
        
        {/* Header điều khiển (chỉ hiển thị trên màn hình, ẩn khi in) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Xem trước & In mẫu chứng từ A4 / A5</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> In chứng từ
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nội dung chứng từ In chuẩn Form A4 / A5 */}
        <div className="p-8 sm:p-12 print:p-6 text-slate-800 font-serif leading-relaxed text-sm bg-white">
          {/* Header công ty / HTX */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-6">
            <div>
              <h2 className="font-bold text-base uppercase text-slate-900 font-sans tracking-wide">
                {farmInfo?.name || 'HỆ THỐNG QUẢN LÝ NÔNG TRẠI VIETGAP'}
              </h2>
              <p className="text-xs text-slate-600 font-sans">
                Địa chỉ: {farmInfo?.address || 'Khu nông nghiệp công nghệ cao'}
              </p>
              <p className="text-xs text-slate-600 font-sans">
                Mã trang trại: <span className="font-mono">{farmInfo?.farmCode || 'FARM-SAAS'}</span>
              </p>
            </div>
            <div className="text-right font-sans text-xs">
              <p className="font-semibold text-slate-700">Mẫu số: 01-VT/KTNN</p>
              <p className="text-slate-500 italic text-[11px]">(Ban hành theo QĐ chuẩn kế toán)</p>
            </div>
          </div>

          {/* Tiêu đề phiếu */}
          <div className="text-center my-6">
            <h1 className="text-2xl font-bold uppercase text-slate-900 tracking-wider">
              {info.title}
            </h1>
            <p className="text-xs text-slate-600 uppercase tracking-widest mt-1">
              {info.sub}
            </p>
            <p className="text-xs text-slate-600 italic mt-2">
              Ngày {currentDate.getDate()} tháng {currentDate.getMonth() + 1} năm {currentDate.getFullYear()}
            </p>
            <p className="font-mono text-xs font-bold text-slate-800 mt-1">
              {info.codePrefix} {info.code}
            </p>
          </div>

          {/* Thông tin phiếu */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-xs mb-6 font-sans">
            <div>
              <span className="font-semibold text-slate-700">Kho thực hiện: </span>
              <span className="text-slate-900 font-medium">{data.warehouseName || data.fromWarehouseName || 'Kho chính'}</span>
            </div>
            {data.toWarehouseName && (
              <div>
                <span className="font-semibold text-slate-700">Kho tiếp nhận: </span>
                <span className="text-slate-900 font-medium">{data.toWarehouseName}</span>
              </div>
            )}
            {data.partnerName && (
              <div>
                <span className="font-semibold text-slate-700">Nhà cung cấp / Đối tác: </span>
                <span className="text-slate-900 font-medium">{data.partnerName}</span>
              </div>
            )}
            <div>
              <span className="font-semibold text-slate-700">Lý do / Nghiệp vụ: </span>
              <span className="text-slate-900 font-medium">{data.type || data.receiptType || data.issueType || 'Phục vụ sản xuất'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-slate-700">Ghi chú kèm theo: </span>
              <span className="text-slate-900 italic">{data.notes || 'Không có ghi chú'}</span>
            </div>
          </div>

          {/* Bảng kê mặt hàng */}
          <table className="w-full border-collapse border border-slate-400 text-xs font-sans mb-8">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-center font-bold">
                <th className="border border-slate-400 p-2 w-10">STT</th>
                <th className="border border-slate-400 p-2 text-left">Tên vật tư, nhãn hiệu, quy cách</th>
                <th className="border border-slate-400 p-2 w-24">Số Lô (Batch)</th>
                <th className="border border-slate-400 p-2 w-24">Hạn dùng</th>
                <th className="border border-slate-400 p-2 w-16">ĐVT</th>
                <th className="border border-slate-400 p-2 w-20 text-right">Số lượng</th>
                {transactionType === 'RECEIPT' && (
                  <>
                    <th className="border border-slate-400 p-2 w-24 text-right">Đơn giá</th>
                    <th className="border border-slate-400 p-2 w-28 text-right">Thành tiền (VNĐ)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(data.items || []).map((item, idx) => {
                const qty = Number(item.quantity || 0);
                const price = Number(item.unitPrice || 0);
                const total = qty * price;
                return (
                  <tr key={idx} className="text-slate-800">
                    <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-400 p-2">
                      <div className="font-semibold text-slate-900">{item.materialName || `Vật tư #${item.materialId}`}</div>
                      {item.materialSku && (
                        <div className="text-[11px] text-slate-500 font-mono">SKU: {item.materialSku}</div>
                      )}
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-mono text-[11px]">
                      {item.batchNumber || 'DEFAULT'}
                    </td>
                    <td className="border border-slate-400 p-2 text-center text-[11px]">
                      {item.expiryDate || '—'}
                    </td>
                    <td className="border border-slate-400 p-2 text-center">{item.unit || item.standardUnit || '—'}</td>
                    <td className="border border-slate-400 p-2 text-right font-bold">{qty.toLocaleString('vi-VN')}</td>
                    {transactionType === 'RECEIPT' && (
                      <>
                        <td className="border border-slate-400 p-2 text-right">{price.toLocaleString('vi-VN')}</td>
                        <td className="border border-slate-400 p-2 text-right font-bold">{total.toLocaleString('vi-VN')}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
            {transactionType === 'RECEIPT' && (
              <tfoot>
                <tr className="font-bold bg-slate-50">
                  <td colSpan={7} className="border border-slate-400 p-2 text-right uppercase">Tổng cộng:</td>
                  <td className="border border-slate-400 p-2 text-right text-emerald-800 font-mono">
                    {(data.items || []).reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Phần ký nhận chứng từ */}
          <div className="grid grid-cols-4 gap-4 text-center font-sans text-xs mt-12 pt-4">
            <div>
              <p className="font-bold uppercase text-slate-800">Người lập phiếu</p>
              <p className="text-[11px] text-slate-500 italic">(Ký, họ tên)</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-700">{data.createdByName || 'Nhân viên kho'}</p>
            </div>
            <div>
              <p className="font-bold uppercase text-slate-800">Thủ kho</p>
              <p className="text-[11px] text-slate-500 italic">(Ký, họ tên)</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-700">........................</p>
            </div>
            <div>
              <p className="font-bold uppercase text-slate-800">Kế toán trưởng</p>
              <p className="text-[11px] text-slate-500 italic">(Ký, họ tên)</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-700">........................</p>
            </div>
            <div>
              <p className="font-bold uppercase text-slate-800">Chủ trang trại / HTX</p>
              <p className="text-[11px] text-slate-500 italic">(Ký, đóng dấu)</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-700">........................</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PrintTransactionModal;
