import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Package, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Printer, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  Eye, 
  ShieldCheck, 
  Clock, 
  RotateCcw,
  Sparkles,
  Award
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { traceabilityService } from '../../services/traceabilityService';
import { ThermalLabelModal } from './ThermalLabelModal';
import { CreateBatchModal } from './CreateBatchModal';
import { toast } from 'sonner';

export const ProductBatchListPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBatchForPrint, setSelectedBatchForPrint] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Reject / Recall modal state
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: 'REJECT', // 'REJECT' or 'RECALL'
    batchId: null,
    batchCode: '',
    reason: ''
  });

  useEffect(() => {
    if (farmId) {
      loadBatches();
    }
  }, [farmId, statusFilter]);

  const loadBatches = async () => {
    if (!farmId) return;
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.keyword = searchTerm;

      const data = await traceabilityService.searchBatches(farmId, params);
      setBatches(data?.items || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh mục lô thành phẩm');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Safe batches
  const safeBatches = Array.isArray(batches) ? batches : [];

  // KPIs
  const totalBatches = safeBatches.length;
  const pendingCount = safeBatches.filter(b => b.status === 'PENDING_APPROVAL').length;
  const readyCount = safeBatches.filter(b => b.status === 'READY_TO_PRINT').length;
  const printedCount = safeBatches.filter(b => b.status === 'DA_IN_TEM').length;
  const recalledCount = safeBatches.filter(b => b.status === 'RECALLED').length;

  // Filtered
  const filteredBatches = safeBatches.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.productName?.toLowerCase().includes(term) ||
      b.batchCode?.toLowerCase().includes(term) ||
      b.traceabilityCode?.toLowerCase().includes(term)
    );
  });

  // Approval Gate handlers
  const handleApprove = async (batch) => {
    if (!confirm(`Bạn có chắc chắn muốn phê duyệt an toàn cho Lô "${batch.batchCode}"? Sau khi duyệt, hệ thống sẽ tự động sinh mã QR ZXing và đóng băng dữ liệu truy xuất.`)) {
      return;
    }
    try {
      await traceabilityService.approveBatch(farmId, batch.id);
      toast.success(`Đã phê duyệt kiểm định lô ${batch.batchCode}! Lô đã sẵn sàng in tem.`);
      loadBatches();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi khi phê duyệt lô hàng');
    }
  };

  const handleOpenActionModal = (type, batch) => {
    setActionModal({
      isOpen: true,
      type,
      batchId: batch.id,
      batchCode: batch.batchCode,
      reason: ''
    });
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (!actionModal.reason.trim()) {
      toast.error('Vui lòng nhập lý do cụ thể!');
      return;
    }

    try {
      if (actionModal.type === 'REJECT') {
        await traceabilityService.rejectBatch(farmId, actionModal.batchId, {
          rejectionReason: actionModal.reason.trim()
        });
        toast.success(`Đã từ chối kiểm định lô ${actionModal.batchCode}.`);
      } else if (actionModal.type === 'RECALL') {
        await traceabilityService.recallBatch(farmId, actionModal.batchId, {
          recallReason: actionModal.reason.trim()
        });
        toast.error(`ĐÃ KÍCH HOẠT THU HỒI KHẨN CẤP LÔ ${actionModal.batchCode}!`);
      }
      setActionModal(prev => ({ ...prev, isOpen: false }));
      loadBatches();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi thực hiện thao tác');
    }
  };

  const handleOpenPrintModal = (batch) => {
    setSelectedBatchForPrint(batch);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <QrCode className="w-7 h-7 text-emerald-600" />
            Lô Thành Phẩm & Cổng Kiểm Định An Toàn (Approval Gate)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm soát chất lượng trước khi in tem nhiệt, sinh mã QR ma trận độ nét cao và đóng băng dữ liệu VietGAP
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Khởi tạo Lô thành phẩm
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng số Lô</p>
            <h3 className="text-lg font-bold text-slate-900">{totalBatches}</h3>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Chờ duyệt</p>
            <h3 className="text-lg font-bold text-amber-600">{pendingCount}</h3>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Sẵn sàng in</p>
            <h3 className="text-lg font-bold text-blue-600">{readyCount}</h3>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Đã in tem QR</p>
            <h3 className="text-lg font-bold text-emerald-600">{printedCount}</h3>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Đã thu hồi</p>
            <h3 className="text-lg font-bold text-rose-600">{recalledCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, mã lô hoặc mã UUID truy xuất..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING_APPROVAL">Chờ phê duyệt</option>
            <option value="READY_TO_PRINT">Sẵn sàng in tem</option>
            <option value="DA_IN_TEM">Đã in tem nhãn</option>
            <option value="DANG_XUAT_BAN">Đang xuất bán</option>
            <option value="REJECTED">Bị từ chối</option>
            <option value="RECALLED">Thu hồi khẩn cấp</option>
          </select>

          <button
            onClick={loadBatches}
            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-slate-200 transition"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bảng danh sách Lô Thành Phẩm */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Mã Lô Thành Phẩm</th>
                <th className="px-5 py-3.5">Tên Nông Sản</th>
                <th className="px-5 py-3.5">Phẩm cấp</th>
                <th className="px-5 py-3.5">Ngày thu hoạch / HSD</th>
                <th className="px-5 py-3.5 text-right">Sản lượng</th>
                <th className="px-5 py-3.5 text-center">Trạng thái Kiểm định</th>
                <th className="px-5 py-3.5 text-right">Cổng Phê Duyệt & Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Đang tải dữ liệu lô thành phẩm...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Chưa có lô thành phẩm nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const isPending = batch.status === 'PENDING_APPROVAL';
                  const isReady = batch.status === 'READY_TO_PRINT';
                  const isPrinted = batch.status === 'DA_IN_TEM';
                  const isRecalled = batch.status === 'RECALLED';
                  const isRejected = batch.status === 'REJECTED';

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/80 transition group">
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 inline-block">
                          {batch.batchCode}
                        </div>
                        {batch.traceabilityCode && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[130px]" title={batch.traceabilityCode}>
                            UUID: {batch.traceabilityCode}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{batch.productName}</div>
                        {batch.seasonCode && (
                          <div className="text-[11px] text-slate-500">
                            Vụ: {batch.seasonCode}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Award className="w-3 h-3" />
                          {batch.qualityGrade === 'XUAT_KHAU' ? 'Xuất khẩu' : batch.qualityGrade === 'LOAI_1' ? 'Loại 1' : 'Loại 2'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        <div>Thu hoạch: <span className="font-semibold text-slate-800">{new Date(batch.harvestDate).toLocaleDateString('vi-VN')}</span></div>
                        {batch.expiryDate && (
                          <div className="text-slate-500 mt-0.5">HSD: {new Date(batch.expiryDate).toLocaleDateString('vi-VN')}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                        {Number(batch.remainingQuantity || batch.initialQuantity).toLocaleString('vi-VN')}{' '}
                        <span className="text-xs font-medium text-slate-500">{batch.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Chờ phê duyệt
                          </span>
                        )}
                        {isReady && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ShieldCheck className="w-3 h-3" /> Đã duyệt (Sẵn sàng)
                          </span>
                        )}
                        {isPrinted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Printer className="w-3 h-3" /> Đã in tem QR
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200" title={batch.rejectionReason}>
                            <XCircle className="w-3 h-3" /> Bị từ chối
                          </span>
                        )}
                        {isRecalled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={batch.recallReason}>
                            <AlertTriangle className="w-3 h-3" /> Thu hồi khẩn cấp
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Approval Gate: Phê duyệt / Từ chối */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(batch)}
                                title="Phê duyệt kiểm định an toàn (Sinh QR ZXing)"
                                className="min-h-[38px] px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                              </button>
                              <button
                                onClick={() => handleOpenActionModal('REJECT', batch)}
                                title="Từ chối kiểm định lô hàng"
                                className="min-h-[38px] px-2 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-semibold transition"
                              >
                                Từ chối
                              </button>
                            </>
                          )}

                          {/* In tem nhãn nhiệt */}
                          {(isReady || isPrinted) && (
                            <button
                              onClick={() => handleOpenPrintModal(batch)}
                              title="In tem nhãn nhiệt (Khổ 50x50 hoặc 35x22)"
                              className="min-h-[38px] px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" /> In tem
                            </button>
                          )}

                          {/* Link xem Landing Page công khai */}
                          {batch.traceabilityCode && (
                            <a
                              href={`/traceability/${batch.traceabilityCode}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Mở trang tra cứu công khai của khách hàng"
                              className="min-h-[38px] px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Quét QR
                            </a>
                          )}

                          {/* Thu hồi khẩn cấp */}
                          {(isReady || isPrinted) && !isRecalled && (
                            <button
                              onClick={() => handleOpenActionModal('RECALL', batch)}
                              title="Kích hoạt quy trình Thu hồi khẩn cấp"
                              className="min-h-[38px] p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateBatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        farmId={farmId}
        onSuccess={loadBatches}
      />

      <ThermalLabelModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        batch={selectedBatchForPrint}
        farmId={farmId}
        onPrintSuccess={loadBatches}
      />

      {/* Reject / Recall Reason Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {actionModal.type === 'REJECT' ? (
                  <>
                    <XCircle className="w-5 h-5 text-slate-600" />
                    Từ chối kiểm định lô: {actionModal.batchCode}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    Thu hồi khẩn cấp lô: {actionModal.batchCode}
                  </>
                )}
              </h3>
              <button
                onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {actionModal.type === 'REJECT'
                ? 'Lô bị từ chối sẽ bị khóa quyền in tem nhiệt và không thể sinh mã QR công khai.'
                : 'CẢNH BÁO NGUY HIỂM: Khách hàng khi quét mã QR của lô này sẽ thấy ngay banner cảnh báo đỏ thu hồi sản phẩm!'}
            </p>

            <form onSubmit={handleSubmitAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={actionModal.type === 'REJECT' ? 'VD: Phát hiện dư lượng thuốc BVTV vượt ngưỡng cho phép...' : 'VD: Phát hiện vi sinh vật Salmonella trong mẫu kiểm tra sau xuất xưởng...'}
                  value={actionModal.reason}
                  onChange={(e) => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition ${
                    actionModal.type === 'REJECT'
                      ? 'bg-slate-800 hover:bg-slate-900'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Xác nhận thực thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductBatchListPage;
