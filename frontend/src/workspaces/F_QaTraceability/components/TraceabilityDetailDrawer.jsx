import React, { useState } from 'react';
import {
  ShieldCheck,
  Building,
  QrCode,
  Calendar,
  AlertOctagon,
  Award,
  Hash,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  Package,
  Layers,
  Clock,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Check,
  Ban,
  Printer,
  Plus,
  Trash2,
  Sparkles,
  FlaskConical,
  Camera,
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const DEFAULT_VIETGAP_CRITERIA = [
  {
    criterionName: 'Dư lượng thuốc BVTV / Kháng sinh',
    standardValue: 'Âm tính (< MRL)',
    measuredValue: '0.00',
    unit: 'ppm',
    isPassed: true,
    notes: 'Test nhanh kit quang phổ đạt chuẩn xuất xưởng',
  },
  {
    criterionName: 'Vi sinh vật (E.Coli / Salmonella)',
    standardValue: 'Không phát hiện',
    measuredValue: '0',
    unit: 'CFU/g',
    isPassed: true,
    notes: 'Mẫu cấy khuẩn 24h âm tính',
  },
  {
    criterionName: 'Độ tươi / Ngoại quan & Quy cách',
    standardValue: 'Đạt chuẩn Loại A',
    measuredValue: '98',
    unit: '%',
    isPassed: true,
    notes: 'Đồng đều về kích cỡ, vỏ sáng bóng, không dập nát',
  },
];
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { qaService } from '@/services/modules/qaService';
import { toast } from '@/store/useToastStore';
import { extractApiErrors } from '@/utils/apiHelpers';
import { formatWeight, formatDate, formatDateTime } from '@/utils/formatters';

function safeParse(json) {
  if (!json) return null;
  if (typeof json === 'object') return json;
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function TraceabilityDetailDrawer({
  isOpen,
  onClose,
  batch: initialBatch,
  onOpenRecall,
  onOpenReject,
  onApproveSuccess,
  isOwner = false,
}) {
  const { isFarmManager, userInfo } = useAuthStore();
  const { notifyDataChanged, syncTrigger } = useActiveFarmStore();
  const manager = isFarmManager();

  const [currentBatch, setCurrentBatch] = useState(initialBatch);

  React.useEffect(() => {
    setCurrentBatch(initialBatch);
  }, [initialBatch]);

  const batch = currentBatch || initialBatch;
  const targetFarmId = batch?.farmId;

  // GAP-SYNC-05: Lắng nghe syncTrigger để tự động làm mới lô thành phẩm đang mở
  React.useEffect(() => {
    if (isOpen && batch?.id && targetFarmId) {
      qaService
        .getProductBatchById(targetFarmId, batch.id)
        .then((res) => {
          if (res) setCurrentBatch(res);
        })
        .catch(() => { });
    }
  }, [isOpen, batch?.id, targetFarmId, syncTrigger?.batches, syncTrigger?.all]);

  const [activeTab, setActiveTab] = useState('SNAPSHOT'); // SNAPSHOT | BASIC | LAB
  const [isApproving, setIsApproving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    labelSize: '50x50',
    printQuantity: 10,
    printerModel: 'Xprinter XP-365B ESC/POS',
  });
  const [inspectForm, setInspectForm] = useState({
    inspectionCode: `QC-${Date.now().toString().slice(-6)}`,
    inspectionDate: new Date().toISOString().split('T')[0],
    sampleSize: '5.0',
    sampleUnit: 'KG',
    overallResult: 'PASSED',
    notes: 'Kiểm tra cảm quan và chỉ tiêu an toàn đạt chuẩn VietGAP',
    photoUrl: '',
    items: JSON.parse(JSON.stringify(DEFAULT_VIETGAP_CRITERIA)),
  });

  const handleLoadVietGapTemplate = () => {
    setInspectForm((prev) => ({
      ...prev,
      items: JSON.parse(JSON.stringify(DEFAULT_VIETGAP_CRITERIA)),
      overallResult: 'PASSED',
    }));
    toast.info('Đã nạp bộ 3 chỉ tiêu mẫu VietGAP!');
  };

  const handleAddCriterion = () => {
    setInspectForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          criterionName: '',
          standardValue: '',
          measuredValue: '',
          unit: '',
          isPassed: true,
          notes: '',
        },
      ],
    }));
  };

  const handleRemoveCriterion = (index) => {
    setInspectForm((prev) => {
      if (prev.items.length <= 1) {
        toast.warning('Biên bản KCS phải có ít nhất 1 chỉ tiêu kiểm nghiệm!');
        return prev;
      }
      const updated = prev.items.filter((_, idx) => idx !== index);
      const allPassed = updated.every((it) => it.isPassed);
      return {
        ...prev,
        items: updated,
        overallResult: allPassed ? 'PASSED' : 'FAILED',
      };
    });
  };

  const handleCriterionChange = (index, field, value) => {
    setInspectForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      let newOverall = prev.overallResult;
      if (field === 'isPassed') {
        const allPassed = updated.every((it) => it.isPassed);
        newOverall = allPassed ? 'PASSED' : 'FAILED';
      }
      return {
        ...prev,
        items: updated,
        overallResult: newOverall,
      };
    });
  };

  if (!batch) return null;

  const isPending = batch.status === 'PENDING_APPROVAL';
  const isRecalled = batch.status === 'RECALLED';
  const isRejected = batch.status === 'REJECTED';
  const isMarketActive = ['READY_TO_PRINT', 'PRINTED', 'SELLING'].includes(batch.status);

  // Parse 5 frozen blocks
  const enterprise = safeParse(batch.enterpriseInfoJson);
  const vietgap = safeParse(batch.vietgapCertJson);
  const timeline = safeParse(batch.farmingTimelineJson);
  const harvest = safeParse(batch.harvestInfoJson);
  const qc = safeParse(batch.qcInspectionJson);

  // Maker-Checker calculation
  const inspectorId = batch.inspectorUserId;
  const currentUserId = userInfo?.id;
  const isInspectorSelf = Boolean(inspectorId && currentUserId && Number(inspectorId) === Number(currentUserId));

  const overallVerdict = batch.qcOverallResult || qc?.overallVerdict;
  const hasQcInspection = Boolean(batch.qcInspectionCode || qc?.inspectionCode || overallVerdict);
  const isQcPassed = overallVerdict === 'PASSED' || overallVerdict === 'CONDITIONAL';

  // Thẩm quyền phê duyệt: Farm Manager hoặc Owner
  const hasApprovalAuthority = manager || isOwner;
  const canApprove = hasApprovalAuthority && hasQcInspection && isQcPassed && !isInspectorSelf;

  const publicTraceUrl = batch.traceabilityCode
    ? `${window.location.origin}/trace/${batch.traceabilityCode}`
    : null;

  // Handle Approve Batch
  const handleApprove = async () => {
    if (!canApprove) return;
    try {
      setIsApproving(true);
      await qaService.approveBatch(batch.farmId, batch.id);
      toast.success(`Đã phê duyệt xuất xưởng lô "${batch.batchCode}" và cấp mã QR bất biến!`);
      notifyDataChanged?.('batches');
      onApproveSuccess?.();
      onClose();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || 'Không thể phê duyệt lô thành phẩm!');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Print Label Modal Open
  const handleOpenPrintModal = () => {
    const defaultQty = batch.remainingQuantity ? Math.max(1, Math.min(10, Math.floor(batch.remainingQuantity))) : 10;
    setPrintConfig({
      labelSize: '50x50',
      printQuantity: defaultQty,
      printerModel: 'Xprinter XP-365B ESC/POS',
    });
    setIsPrintModalOpen(true);
  };

  // Handle Confirm Print Label
  const handleConfirmPrintLabel = async (e) => {
    e?.preventDefault();
    if (!printConfig.printQuantity || printConfig.printQuantity < 1) {
      toast.error('Số lượng bản in bắt buộc lớn hơn hoặc bằng 1');
      return;
    }
    try {
      setIsPrinting(true);
      await qaService.printLabel(batch.farmId, batch.id, {
        labelSize: printConfig.labelSize,
        printQuantity: Number(printConfig.printQuantity),
        printerModel: printConfig.printerModel?.trim() || 'Xprinter XP-365B ESC/POS',
      });
      toast.success(`Đã phát lệnh in ${printConfig.printQuantity} tem nhiệt (${printConfig.labelSize}) cho lô ${batch.batchCode}!`);
      setIsPrintModalOpen(false);
      notifyDataChanged?.('batches');
      onApproveSuccess?.();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || err.response?.data?.message || err.message || 'Lỗi in tem nhãn nhiệt');
    } finally {
      setIsPrinting(false);
    }
  };

  // Handle Create QC Inspection (ROLE_TECHNICAL_STAFF)
  const handleCreateInspection = async (e) => {
    e.preventDefault();
    const emptyRow = inspectForm.items.find(
      (it) => !it.criterionName?.trim() || it.measuredValue === undefined || it.measuredValue === ''
    );
    if (emptyRow) {
      toast.error('Vui lòng điền đầy đủ Tên chỉ tiêu và Giá trị đo thực tế cho tất cả các dòng!');
      return;
    }
    try {
      setIsApproving(true);
      await qaService.createQcInspection(batch.farmId, {
        productBatchId: batch.id,
        inspectionCode: inspectForm.inspectionCode,
        inspectionDate: inspectForm.inspectionDate,
        sampleSize: Number(inspectForm.sampleSize),
        sampleUnit: inspectForm.sampleUnit,
        overallResult: inspectForm.overallResult,
        notes: inspectForm.notes,
        photoUrl: inspectForm.photoUrl,
        items: inspectForm.items,
      });
      toast.success(`Đã lập biên bản kiểm định KCS thành công: ${inspectForm.inspectionCode}!`);
      setIsInspectModalOpen(false);
      notifyDataChanged?.('batches');
      useActiveFarmStore.getState().notifyDataChanged?.('all');
      onApproveSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi lập biên bản KCS');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900">{batch.batchCode}</span>
          <StatusBadge status={batch.status} size="sm" />
        </div>
      }
      subtitle="Hồ sơ truy xuất nguồn gốc 360°, bản chụp JSON đóng băng và chữ ký băm SHA-256"
    >
      <div className="p-5 space-y-5 text-xs text-slate-700">
        {/* 1. CẢNH BÁO THU HỒI NẾU LÔ ĐÃ BỊ THU HỒI */}
        {isRecalled && (
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 space-y-2 text-rose-900 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
              <AlertOctagon className="h-5 w-5 shrink-0 text-rose-600 animate-pulse" />
              <span>LÔ HÀNG ĐÃ BỊ THU HỒI KHẨN CẤP (RECALLED)</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              Lô hàng này đã bị thu hồi khỏi thị trường. Lệnh khóa tự động ngăn chặn toàn bộ hoạt động xuất bán,
              giao dịch và cảnh báo người tiêu dùng khi tra cứu mã QR.
            </p>
            <div className="pt-2 border-t border-rose-200/80 space-y-1 font-mono text-[11px] text-rose-950">
              <div><strong>Lý do thu hồi:</strong> {batch.recallReason || 'Không xác định'}</div>
              <div><strong>Người phát lệnh:</strong> {batch.recallerFullName || 'Chủ đầu tư / Ban Giám Đốc'}</div>
              <div><strong>Thời gian thu hồi:</strong> {formatDateTime(batch.recalledAt)}</div>
            </div>
          </div>
        )}

        {/* 2. CẢNH BÁO TỪ CHỐI NẾU LÔ BỊ TỪ CHỐI KCS */}
        {isRejected && (
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-4 space-y-2 text-slate-900 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
              <Ban className="h-5 w-5 shrink-0 text-slate-600" />
              <span>LÔ HÀNG ĐÃ BỊ TỪ CHỐI NGHIỆM THU (REJECTED)</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Lô hàng không đạt tiêu chuẩn xuất xưởng và đã bị Giám đốc trang trại từ chối. Không cấp mã QR truy xuất và không thể in tem nhãn nhiệt.
            </p>
            <div className="pt-2 border-t border-slate-300/80 space-y-1 font-mono text-[11px] text-slate-900">
              <div><strong>Lý do từ chối:</strong> {batch.rejectionReason || 'Không xác định'}</div>
              <div><strong>Người từ chối:</strong> {batch.rejecterFullName || 'Giám đốc trang trại'}</div>
              <div><strong>Thời gian từ chối:</strong> {formatDateTime(batch.rejectedAt)}</div>
            </div>
          </div>
        )}

        {/* 3A. Khối thao tác lập biên bản KCS dành cho Kỹ Sư KCS (ROLE_TECHNICAL_STAFF) nếu lô chưa có KCS */}
        {isPending && !hasQcInspection && !hasApprovalAuthority && (
          <Can permission="PERM_QC_INSPECT" role="ROLE_TECHNICAL_STAFF">
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <FlaskConical className="h-4 w-4 text-emerald-600" />
                  <span>Nhiệm Vụ KCS: Lập Biên Bản Kiểm Định Chất Lượng Lô</span>
                </span>
                <span className="rounded bg-emerald-200 px-2 py-0.5 font-bold text-emerald-900 text-[10px]">
                  Kỹ Sư KCS (Maker)
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-emerald-200 text-xs">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-bold block text-slate-900">Lô thành phẩm đang chờ KCS lấy mẫu kiểm nghiệm</span>
                    <span className="text-[11px] text-slate-600">
                      Lập biên bản kiểm định đa chỉ tiêu (dư lượng, vi sinh, cảm quan) theo chuẩn VietGAP trước khi chuyển Giám đốc trại phê duyệt.
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<FlaskConical className="h-3.5 w-3.5" />}
                  onClick={() => setIsInspectModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0"
                >
                  🔬 Lập Biên Bản KCS Ngay
                </Button>
              </div>
            </div>
          </Can>
        )}

        {/* 3. KHỐI THAO TÁC CỦA FARM_MANAGER / OWNER KHI ĐANG Ở PENDING_APPROVAL */}
        {isPending && hasApprovalAuthority && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
              <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <span>Nghiệm Thu KCS & Quyết Định Xuất Xưởng</span>
              </span>
              <span className="rounded bg-amber-200/70 px-2 py-0.5 font-bold text-amber-900 text-[10px]">
                {manager ? 'Thẩm Quyền Giám Đốc Trại' : 'Thẩm Quyền Chủ Đầu Tư'}
              </span>
            </div>

            {/* Thông báo tình trạng Maker-Checker & Biên bản KCS */}
            {!hasQcInspection && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-amber-300 bg-white p-3 text-xs text-amber-900">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-bold block text-amber-950">⏳ Chờ Kỹ Sư KCS Kiểm Định Mẫu</span>
                    <span className="text-[11px] text-slate-600">
                      Đang chờ Kỹ sư KCS lập biên bản kiểm nghiệm mẫu trước khi phê duyệt.
                    </span>
                  </div>
                </div>
                <Can permission="PERM_QC_INSPECT" role="ROLE_TECHNICAL_STAFF">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<FlaskConical className="h-3.5 w-3.5" />}
                    onClick={() => setIsInspectModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0"
                  >
                    🔬 Lập Biên Bản KCS Ngay
                  </Button>
                </Can>
              </div>
            )}

            {isInspectorSelf && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
                <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Vi phạm chốt chặn Maker-Checker!</span>
                  <span className="text-[11px] text-rose-800">
                    Bạn chính là người lập biên bản kiểm tra mẫu ({batch.inspectorFullName || 'Người kiểm định'}).
                    Theo quy chuẩn phân tách trách nhiệm, người kiểm định mẫu tuyệt đối không được tự phê duyệt lô hàng!
                  </span>
                </div>
              </div>
            )}

            {hasQcInspection && !isQcPassed && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
                <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Biên bản kiểm định chưa đạt tiêu chuẩn!</span>
                  <span className="text-[11px] text-rose-800">
                    Kết quả KCS: <strong>{overallVerdict || 'FAILED'}</strong>. Bạn chỉ có thể Từ Chối lô hàng này hoặc chờ kiểm định lại.
                  </span>
                </div>
              </div>
            )}

            {canApprove && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Biên bản kiểm định KCS đạt chuẩn ({overallVerdict})</span>
                  <span className="text-[11px] text-emerald-800">
                    Người kiểm định: <strong>{batch.inspectorFullName || 'Kỹ thuật viên'}</strong>.
                    Lô hàng đủ điều kiện cấp mã QR xuất xưởng và chuyển sang cho Thủ kho in tem.
                  </span>
                </div>
              </div>
            )}

            {/* Cặp nút Phê duyệt / Từ chối (Dành cho Checker: Farm Manager & Owner) */}
            <Can permission="PERM_QC_APPROVE" role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Check className="h-4 w-4" />}
                  onClick={handleApprove}
                  disabled={!canApprove || isApproving}
                  isLoading={isApproving}
                  title={
                    !hasQcInspection
                      ? 'Đang chờ Kỹ thuật viên KCS cập nhật kết quả kiểm nghiệm mẫu'
                      : isInspectorSelf
                        ? 'Luật Maker-Checker: Bạn là người kiểm định mẫu nên không được duyệt lô này'
                        : !isQcPassed
                          ? 'Biên bản kiểm định chưa đạt tiêu chuẩn'
                          : 'Phê duyệt KCS & đóng băng mã QR xuất xưởng'
                  }
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  Phê Duyệt Lô & Cấp Mã QR
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  icon={<XCircle className="h-4 w-4 text-rose-600" />}
                  onClick={() => onOpenReject?.(batch)}
                  disabled={isApproving}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 font-bold"
                >
                  Từ Chối Lô Hàng (REJECTED)
                </Button>
              </div>
            </Can>
          </div>
        )}

        {/* 4. KHỐI THAO TÁC KHI LÔ ĐANG Ở READY_TO_PRINT, PRINTED, SELLING */}
        {isMarketActive && !isRecalled && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-emerald-600" />
                <span>Thao Tác Điều Hành Lô Hàng Đã Duyệt</span>
              </span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Đã Cấp QR
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Nút xem bản chụp QR công khai */}
              {publicTraceUrl ? (
                <a
                  href={publicTraceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                >
                  <Eye className="h-4 w-4 text-emerald-600" />
                  <span>Xem Bản Chụp Truy Xuất QR Công Khai</span>
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono italic">
                  Chưa khởi tạo cổng tra cứu QR
                </span>
              )}

              {/* Nút In Tem Nhãn Nhiệt QR dành cho Thủ Kho & Quản Lý Trại */}
              <Can anyPermissions={['PERM_LABEL_PRINT', 'PERM_QC_APPROVE']} role={['ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER']}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Printer className="h-4 w-4 text-slate-700" />}
                  onClick={handleOpenPrintModal}
                  disabled={isPrinting}
                  isLoading={isPrinting}
                  className="font-bold border-slate-300 hover:bg-slate-100"
                >
                  🖨️ In Tem Nhãn Nhiệt QR
                </Button>
              </Can>

              {/* Nút phát lệnh thu hồi khẩn cấp cho Farm Manager hoặc Owner */}
              <Can permission="PERM_QC_RECALL" role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<AlertOctagon className="h-4 w-4" />}
                  onClick={() => onOpenRecall?.(batch)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
                >
                  Phát Lệnh Thu Hồi Khẩn Cấp
                </Button>
              </Can>
            </div>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('SNAPSHOT')}
            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${activeTab === 'SNAPSHOT'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            5 Khối Đóng Băng & SHA-256
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BASIC')}
            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${activeTab === 'BASIC'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            Thông Tin Lô & Phân Bổ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LAB')}
            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${activeTab === 'LAB'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            Biên Bản KCS & Chỉ Tiêu Lab
          </button>
        </div>

        {/* Tab 1: 5 Khối dữ liệu đóng băng (#49) */}
        {activeTab === 'SNAPSHOT' && (
          <div className="space-y-4">
            {/* Chữ ký băm SHA-256 */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5 text-xs">
                  <Hash className="h-4 w-4 text-indigo-600" />
                  <span>Chữ Ký Băm Toàn Vẹn SHA-256 (Immutable Hash)</span>
                </span>
                <span className="rounded bg-indigo-200/70 px-2 py-0.5 font-bold text-indigo-900 text-[10px]">
                  {batch.snapshotHash ? 'Đã đóng băng' : 'Chờ phê duyệt'}
                </span>
              </div>
              <p className="font-mono text-[11px] text-indigo-950 break-all bg-white p-2 rounded-lg border border-indigo-200/60 select-all">
                {batch.snapshotHash || 'Chưa khởi tạo chữ ký băm (Lô chưa được phê duyệt xuất xưởng)'}
              </p>
              <p className="text-[10px] text-indigo-700">
                Chữ ký băm kết hợp 5 khối dữ liệu thời điểm phê duyệt xuất xưởng, đảm bảo tính bất biến chống can thiệp.
              </p>
            </div>

            {/* Mã QR & Lượt quét người tiêu dùng */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  <span>Cổng Tra Cứu QR Công Khai & Lượt Quét</span>
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono font-bold text-emerald-800 text-xs">
                  {batch.scanCount ?? 0} lượt quét
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 font-mono">
                <div className="truncate mr-2">
                  <span className="text-slate-400">Mã: </span>
                  <span className="font-bold text-slate-800">{batch.traceabilityCode || 'Chưa cấp mã QR'}</span>
                </div>
                {publicTraceUrl && (
                  <a
                    href={publicTraceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold shrink-0 text-xs underline"
                  >
                    <span>Mở trang /trace</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* 1. Doanh nghiệp */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span>1. Đơn Vị Chủ Quản & Tài Khoản Thanh Toán</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Khối #1</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-400">Doanh nghiệp:</span> <strong className="text-slate-800 block">{enterprise?.enterpriseName || 'Hệ Thống Trang Trại Xanh'}</strong></div>
                <div><span className="text-slate-400">Mã số thuế:</span> <strong className="text-slate-800 block font-mono">{enterprise?.taxNumber || '0109876543'}</strong></div>
                <div className="col-span-2"><span className="text-slate-400">Trụ sở:</span> <span className="text-slate-700 block">{enterprise?.address || 'Khu nông nghiệp công nghệ cao'}</span></div>
                <div><span className="text-slate-400">Ngân hàng:</span> <span className="text-slate-700 block">{enterprise?.bankInfo?.bankName || 'MBBank'}</span></div>
                <div><span className="text-slate-400">Số tài khoản:</span> <strong className="text-slate-800 block font-mono">{enterprise?.bankInfo?.accountNo || '030123456789'}</strong></div>
              </div>
            </div>

            {/* 2. VietGAP */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-600" />
                  <span>2. Chứng Nhận VietGAP Hợp Chuẩn</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Khối #2</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-400">Số chứng nhận:</span> <strong className="text-emerald-800 block font-mono">{vietgap?.certNumber || 'VIETGAP-VN-2026-088'}</strong></div>
                <div><span className="text-slate-400">Tổ chức cấp:</span> <span className="text-slate-700 block">{vietgap?.certifyingOrganization || 'Vinacert'}</span></div>
                <div><span className="text-slate-400">Hiệu lực đến:</span> <span className="text-slate-700 block">{vietgap?.validUntil || '2027-12-31'}</span></div>
                <div><span className="text-slate-400">Diện tích chứng nhận:</span> <strong className="text-slate-800 block">{vietgap?.certifiedAreaM2 ? `${vietgap.certifiedAreaM2} m²` : '50,000 m²'}</strong></div>
              </div>
            </div>

            {/* 3. Dòng thời gian canh tác */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>3. Nhật Ký Canh Tác Sinh Học & Cách Ly</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Khối #3</span>
              </div>
              {Array.isArray(timeline) && timeline.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {timeline.map((stage, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] pb-1.5 border-b border-slate-100 last:border-none">
                      <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 font-bold text-indigo-700 text-[10px] shrink-0 font-mono">
                        #{stage.stageIndex || idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>{stage.stageName}</span>
                          <span className="font-mono text-slate-400 text-[10px]">{stage.activityDate}</span>
                        </div>
                        <p className="text-slate-500 text-[10px] mt-0.5">{stage.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-[11px]">Không có nhật ký canh tác ghi nhận.</p>
              )}
            </div>

            {/* 4. Thu hoạch */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-amber-600" />
                  <span>4. Hồ Sơ Thu Hoạch & Phân Khu</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Khối #4</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-400">Mã thu hoạch:</span> <strong className="text-slate-800 block font-mono">{harvest?.harvestRecordCode || `HAR-${batch.batchCode}`}</strong></div>
                <div><span className="text-slate-400">Ngày thu hoạch:</span> <span className="text-slate-700 block font-mono">{harvest?.harvestDate || formatDate(batch.harvestDate)}</span></div>
                <div><span className="text-slate-400">Trang trại:</span> <strong className="text-slate-800 block">{harvest?.farmName || batch.farmName || 'Toàn chuỗi'}</strong></div>
                <div><span className="text-slate-400">Sản lượng:</span> <strong className="text-slate-800 block">{formatWeight(harvest?.actualHarvestYieldKg || batch.initialQuantity)}</strong></div>
              </div>
            </div>

            {/* 5. Kết quả KCS */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>5. Biên Bản KCS Xuất Xưởng</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Khối #5</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-400">Mã kiểm định:</span> <strong className="text-slate-800 block font-mono">{qc?.inspectionCode || batch.qcInspectionCode || 'KCS-QC-001'}</strong></div>
                <div>
                  <span className="text-slate-400">Kết quả tổng:</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${overallVerdict === 'PASSED' ? 'text-emerald-700' : overallVerdict === 'CONDITIONAL' ? 'text-amber-700' : 'text-rose-700'
                    }`}>
                    {overallVerdict || 'PASSED'}
                  </span>
                </div>
                <div><span className="text-slate-400">Kỹ thuật viên KCS:</span> <span className="text-slate-700 block">{batch.inspectorFullName || 'Chưa chỉ định'}</span></div>
                <div><span className="text-slate-400">Người phê duyệt:</span> <span className="text-slate-700 block">{batch.approverFullName || 'Chưa phê duyệt'}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Thông tin cơ bản & Phân bổ kho */}
        {activeTab === 'BASIC' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <span className="font-bold text-slate-900 text-xs">Chi Tiết Lô Thành Phẩm</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-slate-400 block">Tên sản phẩm:</span><strong className="text-slate-900">{batch.productName}</strong></div>
                <div><span className="text-slate-400 block">Hạng chất lượng:</span><StatusBadge status={batch.qualityGrade} size="sm" /></div>
                <div><span className="text-slate-400 block">Trang trại sản xuất:</span><strong className="text-slate-800">{batch.farmName || `Trại #${batch.farmId}`}</strong></div>
                <div><span className="text-slate-400 block">Kho lưu trữ:</span><span className="text-slate-700">{batch.warehouseName || 'Kho trung tâm'}</span></div>
                <div><span className="text-slate-400 block">Ngày thu hoạch:</span><span className="font-mono">{formatDate(batch.harvestDate)}</span></div>
                <div><span className="text-slate-400 block">Hạn sử dụng:</span><span className="font-mono">{formatDate(batch.expiryDate) || 'Theo điều kiện kho'}</span></div>
                <div><span className="text-slate-400 block">Điều kiện bảo quản:</span><span className="text-slate-700">{batch.storageConditions || 'Nhiệt độ thường / Thoáng mát'}</span></div>
                <div><span className="text-slate-400 block">Mã GTIN / Barcode:</span><span className="font-mono text-slate-600">{batch.gtinBarcode || '—'}</span></div>
              </div>
            </div>

            {/* Cân đối sản lượng: Ban đầu / Đã bán / Còn tồn */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
              <span className="font-bold text-emerald-950 text-xs">Cân Đối Sản Lượng Lô Hàng</span>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sản lượng ban đầu</span>
                  <span className="font-mono text-sm font-black text-slate-900">{formatWeight(batch.initialQuantity)}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Đã xuất bán</span>
                  <span className="font-mono text-sm font-black text-blue-700">{formatWeight(batch.soldQuantity || 0)}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tồn kho khả dụng</span>
                  <span className="font-mono text-sm font-black text-emerald-700">{formatWeight(batch.remainingQuantity)}</span>
                </div>
              </div>
            </div>

            {/* Phân trách nhiệm Maker-Checker */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <span className="font-bold text-slate-900 text-xs">Trách Nhiệm Kiểm Soát Chất Lượng (Maker - Checker)</span>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Kỹ thuật viên KCS (Inspector - Maker):</span>
                  <strong className="text-slate-800">{batch.inspectorFullName || 'Chưa phân công'}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Giám đốc trại phê duyệt (Approver - Checker):</span>
                  <strong className="text-slate-800">{batch.approverFullName || 'Chưa phê duyệt'}</strong>
                  {batch.approvedAt && (
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{formatDate(batch.approvedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Chi tiết chỉ tiêu phòng Lab & Biên bản KCS */}
        {activeTab === 'LAB' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Biên Bản Kiểm Định Chất Lượng KCS (#46)</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Mã KCS: {qc?.inspectionCode || batch.qcInspectionCode || 'KCS-QC-PENDING'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Kết luận chung:</span>
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${overallVerdict === 'PASSED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : overallVerdict === 'CONDITIONAL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                    }`}>
                    {overallVerdict === 'PASSED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {overallVerdict === 'CONDITIONAL' && <AlertTriangle className="h-3.5 w-3.5" />}
                    {overallVerdict !== 'PASSED' && overallVerdict !== 'CONDITIONAL' && <XCircle className="h-3.5 w-3.5" />}
                    <span>{overallVerdict || 'CHƯA CÓ KẾT QUẢ'}</span>
                  </span>
                </div>
              </div>

              {Array.isArray(qc?.testMetrics) && qc.testMetrics.length > 0 ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                        <th className="py-2">Chỉ tiêu kiểm định (#47)</th>
                        <th className="py-2">Ngưỡng chuẩn cho phép</th>
                        <th className="py-2">Kết quả đo được</th>
                        <th className="py-2 text-right">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {qc.testMetrics.map((metric, idx) => (
                        <tr key={idx}>
                          <td className="py-2 font-semibold text-slate-800 font-sans">{metric.metricName}</td>
                          <td className="py-2 text-slate-500">{metric.standardLimit}</td>
                          <td className="py-2 font-bold text-slate-900">{metric.testResult}</td>
                          <td className="py-2 text-right">
                            {metric.isPassed ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" /> Đạt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                <XCircle className="h-3 w-3" /> Trượt
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-2 py-6 text-center text-slate-400">
                  <Clock className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-600 text-xs">
                    {hasQcInspection
                      ? 'Lô hàng được nghiệm thu theo tiêu chuẩn cảm quan và ngoại quan chung.'
                      : 'Kỹ thuật viên KCS chưa cập nhật biên bản kiểm nghiệm mẫu cho lô này.'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Kỹ thuật viên phòng Lab / Hiện trường sẽ tiến hành lấy mẫu và gửi kết quả chỉ tiêu đo lường trước khi Giám đốc trại duyệt.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Lập Biên Bản KCS Dành Cho ROLE_TECHNICAL_STAFF (GAP-TECH-07) */}
      <Modal
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
        title="Lập Biên Bản Kiểm Định Chất Lượng KCS Đa Chỉ Tiêu (Maker)"
        size="lg"
      >
        <form onSubmit={handleCreateInspection} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormField label="Mã Biên Bản KCS" required>
              <Input
                value={inspectForm.inspectionCode}
                onChange={(e) => setInspectForm({ ...inspectForm, inspectionCode: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Ngày Lấy Mẫu / Kiểm Định" required>
              <Input
                type="date"
                value={inspectForm.inspectionDate}
                onChange={(e) => setInspectForm({ ...inspectForm, inspectionDate: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Cỡ Mẫu Kiểm Tra" required>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={inspectForm.sampleSize}
                onChange={(e) => setInspectForm({ ...inspectForm, sampleSize: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Đơn Vị Mẫu" required>
              <Select
                value={inspectForm.sampleUnit}
                onChange={(e) => setInspectForm({ ...inspectForm, sampleUnit: e.target.value })}
              >
                <option value="KG">Kilogram (KG)</option>
                <option value="BOX">Thùng (BOX)</option>
                <option value="SAMPLE">Mẫu thử (SAMPLE)</option>
                <option value="BUNCH">Bó (BUNCH)</option>
              </Select>
            </FormField>
          </div>

          {/* Bảng Chỉ Tiêu Kiểm Định Động (Multi-Criteria QC Table) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <FlaskConical className="h-4 w-4 text-emerald-600" />
                <span>Bảng Chỉ Tiêu Kiểm Nghiệm Mẫu ({inspectForm.items.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                  onClick={handleLoadVietGapTemplate}
                  className="bg-white border-amber-300 text-amber-900 hover:bg-amber-50 text-[11px]"
                >
                  Nạp Bộ Chỉ Tiêu Mẫu VietGAP
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5 text-emerald-600" />}
                  onClick={handleAddCriterion}
                  className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-[11px]"
                >
                  Thêm Chỉ Tiêu
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                    <th className="py-2 px-2.5 w-8">#</th>
                    <th className="py-2 px-2.5">Tên Chỉ Tiêu Kiểm Nghiệm *</th>
                    <th className="py-2 px-2.5">Ngưỡng Tiêu Chuẩn</th>
                    <th className="py-2 px-2.5">Giá Trị Đo Thực Tế *</th>
                    <th className="py-2 px-2.5 w-20">Đơn Vị</th>
                    <th className="py-2 px-2.5 w-28 text-center">Đánh Giá</th>
                    <th className="py-2 px-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspectForm.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-2.5 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-1.5 px-2.5">
                        <Input
                          value={item.criterionName}
                          placeholder="VD: Dư lượng thuốc BVTV"
                          onChange={(e) => handleCriterionChange(idx, 'criterionName', e.target.value)}
                          className="h-8 text-xs"
                          required
                        />
                      </td>
                      <td className="py-1.5 px-2.5">
                        <Input
                          value={item.standardValue}
                          placeholder="VD: <= 0.01 ppm"
                          onChange={(e) => handleCriterionChange(idx, 'standardValue', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-1.5 px-2.5">
                        <Input
                          value={item.measuredValue}
                          placeholder="VD: 0.00 ppm"
                          onChange={(e) => handleCriterionChange(idx, 'measuredValue', e.target.value)}
                          className="h-8 text-xs font-semibold"
                          required
                        />
                      </td>
                      <td className="py-1.5 px-2.5">
                        <Input
                          value={item.unit}
                          placeholder="ppm, %"
                          onChange={(e) => handleCriterionChange(idx, 'unit', e.target.value)}
                          className="h-8 text-xs w-20"
                        />
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleCriterionChange(idx, 'isPassed', !item.isPassed)}
                          className={`w-full py-1 px-2 rounded-lg font-bold text-[10px] inline-flex items-center justify-center gap-1 transition-all ${item.isPassed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                            }`}
                        >
                          {item.isPassed ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span>ĐẠT</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-rose-600" />
                              <span>HỎNG</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa chỉ tiêu này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Banner gợi ý tự động kết luận tổng thể */}
          {inspectForm.items.every((it) => it.isPassed) ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 flex items-center gap-2.5 text-emerald-900 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <strong>Tất cả {inspectForm.items.length} chỉ tiêu đều ĐẠT CHUẨN!</strong>
                <p className="text-[11px] text-emerald-800">
                  Hệ thống tự động đề xuất kết luận <strong>ĐẠT (PASSED)</strong> để Giám đốc trại phê duyệt xuất xưởng.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 flex items-center gap-2.5 text-rose-900 text-xs">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <div>
                <strong>Cảnh báo: Có chỉ tiêu KHÔNG ĐẠT TIÊU CHUẨN!</strong>
                <p className="text-[11px] text-rose-800">
                  Hệ thống tự động chuyển đề xuất kết luận sang <strong>KHÔNG ĐẠT (FAILED)</strong>. Giám đốc trại sẽ nhận khuyến nghị từ chối lô hàng.
                </p>
              </div>
            </div>
          )}

          <FormField label="Kết Luận Kiểm Nghiệm Tổng Thể (Overall Verdict)" required>
            <Select
              value={inspectForm.overallResult}
              onChange={(e) => setInspectForm({ ...inspectForm, overallResult: e.target.value })}
            >
              <option value="PASSED">ĐẠT CHUẨN (PASSED - Cho phép phê duyệt)</option>
              <option value="FAILED">KHÔNG ĐẠT (FAILED - Đề xuất từ chối lô hàng)</option>
              <option value="CONDITIONAL">CÓ ĐIỀU KIỆN (CONDITIONAL - Chờ xử lý)</option>
            </Select>
          </FormField>

          <FormField label="Ảnh Minh Chứng / Phiếu Xét Nghiệm Phòng Lab (photosJson)">
            <div className="relative">
              <Camera className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={inspectForm.photoUrl}
                placeholder="https://... hoặc URL ảnh chụp kết quả kiểm nghiệm"
                onChange={(e) => setInspectForm({ ...inspectForm, photoUrl: e.target.value })}
                className="pl-9"
              />
            </div>
          </FormField>

          <FormField label="Ghi Chú Đánh Giá Kỹ Thuật">
            <Input
              value={inspectForm.notes}
              placeholder="VD: Kiểm tra cảm quan và chỉ tiêu an toàn đạt chuẩn VietGAP"
              onChange={(e) => setInspectForm({ ...inspectForm, notes: e.target.value })}
            />
          </FormField>

          <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 text-[11px]">
            ℹ️ Sau khi Kỹ sư KCS lập biên bản, Giám đốc trang trại (ROLE_FARM_MANAGER) hoặc Chủ đầu tư (ROLE_FARM_OWNER) sẽ là người độc quyền phê duyệt cấp mã QR truy xuất.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsInspectModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={isApproving}>
              {isApproving ? 'Đang gửi...' : 'Lưu Biên Bản KCS'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Cấu Hình In Tem Nhiệt ESC/POS */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Cấu Hình Lệnh In Tem Nhãn Nhiệt QR ESC/POS"
        subtitle={`Lô hàng: ${batch.batchCode} • ${batch.productName || 'Nông sản'} (Tồn khả dụng: ${batch.remainingQuantity || batch.initialQuantity || 0} ${batch.unit || 'KG'})`}
        size="md"
      >
        <form onSubmit={handleConfirmPrintLabel} className="space-y-4 text-xs">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 space-y-1.5 text-blue-900">
            <span className="font-bold flex items-center gap-1.5">
              <Printer className="h-4 w-4 text-blue-700" />
              <span>Máy In Nhiệt & Định Dạng Mã QR Bất Biến</span>
            </span>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Tem nhãn in trực tiếp lệnh ESC/POS tới máy in nhiệt bóc dán. Mã QR chứa URL tra cứu nguồn gốc nông sản theo tiêu chuẩn VietGAP.
            </p>
            <div className="font-mono text-[11px] text-blue-950 pt-1 border-t border-blue-200/80">
              <strong>Mã truy xuất:</strong> {batch.traceabilityCode || 'Chưa khởi tạo'}
            </div>
          </div>

          <FormField label="Khổ Tem Nhãn Nhiệt (ESC/POS)" required>
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="labelSize"
                  value="50x50"
                  checked={printConfig.labelSize === '50x50'}
                  onChange={(e) => setPrintConfig({ ...printConfig, labelSize: e.target.value })}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Tem vuông 50x50mm</span>
                  <span className="text-[11px] text-slate-500">Dán thùng/bao lớn, pallet xuất kho</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="labelSize"
                  value="35x22"
                  checked={printConfig.labelSize === '35x22'}
                  onChange={(e) => setPrintConfig({ ...printConfig, labelSize: e.target.value })}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Tem nhỏ 35x22mm</span>
                  <span className="text-[11px] text-slate-500">Dán quả/hộp lẻ, khay siêu thị</span>
                </div>
              </label>
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số Lượng Bản In" required>
              <Input
                type="number"
                min="1"
                step="1"
                value={printConfig.printQuantity}
                onChange={(e) => setPrintConfig({ ...printConfig, printQuantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                required
              />
            </FormField>

            <FormField label="Model Máy In Nhiệt">
              <Input
                value={printConfig.printerModel}
                onChange={(e) => setPrintConfig({ ...printConfig, printerModel: e.target.value })}
                placeholder="Xprinter XP-365B ESC/POS"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsPrintModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isPrinting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isPrinting ? 'Đang phát lệnh...' : 'Xác Nhận In Tem'}
            </Button>
          </div>
        </form>
      </Modal>
    </SlideOverDrawer>
  );
}

export default TraceabilityDetailDrawer;
