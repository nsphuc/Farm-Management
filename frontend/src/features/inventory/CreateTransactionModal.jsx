import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Package, 
  Calendar, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { toast } from 'sonner';

export const CreateTransactionModal = ({
  isOpen,
  onClose,
  farmId,
  initialType = 'RECEIPT', // 'RECEIPT', 'ISSUE', 'TRANSFER'
  initialStockItem = null,
  onSuccess,
  onPrintRequested
}) => {
  const [transactionType, setTransactionType] = useState(initialType);
  const [loading, setLoading] = useState(false);

  // Danh mục kho & vật tư
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Form chung
  const [warehouseId, setWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [subType, setSubType] = useState('MUA_MOI'); // hoặc CANH_TAC_DONG_RUONG

  // Dynamic rows items
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen && farmId) {
      loadInitialData();
      setTransactionType(initialType);
      setTransactionDate(new Date().toISOString().slice(0, 16));
      setNotes('');
      if (initialType === 'RECEIPT') setSubType('MUA_MOI');
      else if (initialType === 'ISSUE') setSubType('CANH_TAC_DONG_RUONG');
    }
  }, [isOpen, farmId, initialType]);

  const loadInitialData = async () => {
    try {
      const [whData, matData] = await Promise.all([
        inventoryService.getWarehouses(farmId),
        inventoryService.searchMaterials({ size: 100 })
      ]);
      const whList = whData?.items || whData?.content || (Array.isArray(whData) ? whData : []);
      const matList = matData?.items || matData?.content || (Array.isArray(matData) ? matData : []);
      setWarehouses(whList);
      setMaterials(matList);

      if (whList.length > 0) {
        setWarehouseId(initialStockItem?.warehouseId || whList[0].id);
        if (whList.length > 1) {
          setToWarehouseId(whList[1].id);
        }
      }

      // Initial item row
      if (initialStockItem) {
        setItems([
          {
            materialId: initialStockItem.materialId,
            batchNumber: initialStockItem.batchNumber || 'DEFAULT',
            expiryDate: initialStockItem.expiryDate || '',
            quantity: 1,
            unitPrice: 0,
            unit: initialStockItem.standardUnit || 'đơn vị'
          }
        ]);
      } else if (matList.length > 0) {
        setItems([
          {
            materialId: matList[0].id,
            batchNumber: 'DEFAULT',
            expiryDate: '',
            quantity: 1,
            unitPrice: 0,
            unit: matList[0].standardUnit || 'đơn vị'
          }
        ]);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi nạp danh mục kho và vật tư');
    }
  };

  const handleAddItem = () => {
    const safeMats = Array.isArray(materials) ? materials : [];
    if (safeMats.length === 0) {
      toast.error('Chưa có danh mục vật tư nào trong hệ thống! Vui lòng thêm vật tư trước.');
      return;
    }
    setItems([
      ...items,
      {
        materialId: safeMats[0].id,
        batchNumber: 'DEFAULT',
        expiryDate: '',
        quantity: 1,
        unitPrice: 0,
        unit: safeMats[0].standardUnit || 'đơn vị'
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error('Phiếu phải có ít nhất 1 mặt hàng!');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const next = [...items];
    next[index][field] = value;
    if (field === 'materialId') {
      const mat = materials.find(m => m.id === Number(value));
      if (mat) {
        next[index].unit = mat.standardUnit;
      }
    }
    setItems(next);
  };

  const calculateTotalAmount = () => {
    return items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unitPrice || 0)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một mặt hàng!');
      return;
    }

    try {
      setLoading(true);

      if (transactionType === 'RECEIPT') {
        const payload = {
          warehouseId: Number(warehouseId),
          receiptType: subType,
          receiptDate: new Date(transactionDate).toISOString(),
          notes: notes.trim() || null,
          items: items.map(it => ({
            materialId: Number(it.materialId),
            batchNumber: it.batchNumber?.trim() || 'DEFAULT',
            expiryDate: it.expiryDate || null,
            quantity: parseFloat(it.quantity),
            unitPrice: parseFloat(it.unitPrice || 0)
          }))
        };
        const res = await inventoryService.createReceipt(farmId, payload);
        toast.success(`Đã lập Phiếu Nhập Kho thành công: ${res.receiptCode}`);
        onSuccess?.();
        onClose();
        onPrintRequested?.('RECEIPT', res);
      } else if (transactionType === 'ISSUE') {
        const payload = {
          warehouseId: Number(warehouseId),
          issueType: subType,
          issueDate: new Date(transactionDate).toISOString(),
          notes: notes.trim() || null,
          items: items.map(it => ({
            materialId: Number(it.materialId),
            batchNumber: it.batchNumber?.trim() || null, // null thì hệ thống tự FIFO
            quantity: parseFloat(it.quantity)
          }))
        };
        const res = await inventoryService.createIssue(farmId, payload);
        toast.success(`Đã lập Phiếu Xuất Kho thành công: ${res.issueCode}`);
        onSuccess?.();
        onClose();
        onPrintRequested?.('ISSUE', res);
      } else if (transactionType === 'TRANSFER') {
        if (Number(warehouseId) === Number(toWarehouseId)) {
          toast.error('Kho xuất và kho nhận không được trùng nhau!');
          setLoading(false);
          return;
        }
        const payload = {
          fromWarehouseId: Number(warehouseId),
          toWarehouseId: Number(toWarehouseId),
          transferDate: new Date(transactionDate).toISOString(),
          notes: notes.trim() || null,
          items: items.map(it => ({
            materialId: Number(it.materialId),
            batchNumber: it.batchNumber?.trim() || null,
            quantity: parseFloat(it.quantity)
          }))
        };
        const res = await inventoryService.createTransfer(farmId, payload);
        toast.success(`Đã lập Phiếu Điều Chuyển thành công: ${res.transferCode} (Trạng thái: IN_TRANSIT)`);
        onSuccess?.();
        onClose();
        onPrintRequested?.('TRANSFER', res);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi thực hiện giao dịch kho');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Package className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Lập Phiếu Giao dịch Kho Vật tư</h2>
              <p className="text-xs text-slate-300">
                Thực thi luồng Nhập kho, Xuất kho theo FIFO và Điều chuyển kho nội bộ
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setTransactionType('RECEIPT');
              setSubType('MUA_MOI');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-t border-x ${
              transactionType === 'RECEIPT'
                ? 'bg-white text-emerald-700 border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            1. Phiếu Nhập Kho (PNK)
          </button>
          <button
            type="button"
            onClick={() => {
              setTransactionType('ISSUE');
              setSubType('CANH_TAC_DONG_RUONG');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-t border-x ${
              transactionType === 'ISSUE'
                ? 'bg-white text-rose-700 border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            2. Phiếu Xuất Kho (PXK)
          </button>
          <button
            type="button"
            onClick={() => {
              setTransactionType('TRANSFER');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-t border-x ${
              transactionType === 'TRANSFER'
                ? 'bg-white text-blue-700 border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            3. Điều Chuyển Kho (PDC)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Thông tin kho và ngày giờ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                {transactionType === 'TRANSFER' ? 'Kho xuất đi *' : 'Kho thực hiện *'}
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            {transactionType === 'TRANSFER' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Kho nhận đến *
                </label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Loại nghiệp vụ *
                </label>
                {transactionType === 'RECEIPT' ? (
                  <select
                    value={subType}
                    onChange={(e) => setSubType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="MUA_MOI">Mua mới từ Nhà cung cấp</option>
                    <option value="THU_HOACH_NOI_BO">Thu hoạch nông sản nội bộ</option>
                    <option value="TRA_HANG_NHA_CUNG_CAP">Trả lại hàng / Thu hồi</option>
                    <option value="DIEU_CHINH_KIEM_KE">Điều chỉnh sau kiểm kê kho</option>
                  </select>
                ) : (
                  <select
                    value={subType}
                    onChange={(e) => setSubType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                  >
                    <option value="CANH_TAC_DONG_RUONG">Xuất dùng canh tác đồng ruộng</option>
                    <option value="CHAN_NUOI_THU_Y">Xuất dùng chăn nuôi & thú y</option>
                    <option value="BAN_HANG">Xuất bán thương phẩm</option>
                    <option value="HU_HONG_HET_HAN">Hư hỏng / Hết hạn / Tiêu hủy</option>
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Thời gian chứng từ *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="datetime-local"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Danh sách mặt hàng Dynamic Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Chi tiết danh mục hàng hóa ({items.length})
                </h3>
                <p className="text-xs text-slate-500">
                  {transactionType === 'ISSUE' 
                    ? 'Lưu ý: Để trống Số Lô hệ thống sẽ tự động trừ kho theo thứ tự FIFO (lô cận hạn nhất xuất trước).'
                    : 'Khai báo chính xác số lượng và đơn vị tính.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="min-h-[40px] px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm mặt hàng
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-3"
                >
                  <div className="w-full md:w-56">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Vật tư / Hàng hóa *</label>
                    <select
                      value={item.materialId}
                      onChange={(e) => handleItemChange(idx, 'materialId', e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"
                    >
                      {(Array.isArray(materials) ? materials : []).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full md:w-36">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Số Lô (Batch)</label>
                    <input
                      type="text"
                      placeholder={transactionType === 'ISSUE' ? 'FIFO tự động' : 'DEFAULT'}
                      value={item.batchNumber}
                      onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none font-mono"
                    />
                  </div>

                  {transactionType === 'RECEIPT' && (
                    <div className="w-full md:w-36">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Hạn sử dụng</label>
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                  )}

                  <div className="w-full md:w-28">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Số lượng *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none font-bold text-right text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="w-16 text-center text-xs font-semibold text-slate-500 pt-5">
                    {item.unit}
                  </div>

                  {transactionType === 'RECEIPT' && (
                    <div className="w-full md:w-32">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Đơn giá (đ)</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none font-medium text-right text-slate-800"
                      />
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Xóa dòng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {transactionType === 'RECEIPT' && (
              <div className="flex justify-end p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-sm font-bold text-emerald-900">
                <span>Tổng giá trị nhập: </span>
                <span className="ml-2 font-mono text-base">{calculateTotalAmount().toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
              Ghi chú chứng từ
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú người giao hàng, số hóa đơn đỏ, mục đích xuất dùng..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Footer buttons >= 44px ergonomics */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý chứng từ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất & Lưu chứng từ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateTransactionModal;
