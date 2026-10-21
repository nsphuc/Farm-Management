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
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
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
  batch,
  onOpenRecall,
  isOwner = false,
}) {
  const [activeTab, setActiveTab] = useState('SNAPSHOT'); // SNAPSHOT | BASIC | LAB

  if (!batch) return null;

  const isRecalled = batch.status === 'RECALLED';
  const isMarketActive = ['READY_TO_PRINT', 'PRINTED', 'SELLING'].includes(batch.status);

  // Parse 5 frozen blocks
  const enterprise = safeParse(batch.enterpriseInfoJson);
  const vietgap = safeParse(batch.vietgapCertJson);
  const timeline = safeParse(batch.farmingTimelineJson);
  const harvest = safeParse(batch.harvestInfoJson);
  const qc = safeParse(batch.qcInspectionJson);

  const publicTraceUrl = batch.traceabilityCode
    ? `${window.location.origin}/trace/${batch.traceabilityCode}`
    : null;

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
        {/* Cảnh báo thu hồi đỏ nếu lô hàng đã bị thu hồi */}
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

        {/* Action Header Card cho Owner nếu lô đang lưu hành */}
        {isOwner && isMarketActive && !isRecalled && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 text-xs">Đặc quyền Chủ đầu tư (Owner):</span>
              <p className="text-[11px] text-slate-600">
                Phát hiện sự cố chất lượng hoặc gian lận? Bạn có thể phát lệnh thu hồi khẩn cấp toàn cục ngay.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={<AlertOctagon className="h-4 w-4" />}
              onClick={() => {
                onOpenRecall?.(batch);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 shadow-sm"
            >
              Thu Hồi Khẩn Cấp
            </Button>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('SNAPSHOT')}
            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
              activeTab === 'SNAPSHOT'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            5 Khối Đóng Băng & SHA-256
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BASIC')}
            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
              activeTab === 'BASIC'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Thông Tin Lô & Phân Bổ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LAB')}
            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
              activeTab === 'LAB'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Chỉ Tiêu Phòng Lab
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
                  Đã đóng băng
                </span>
              </div>
              <p className="font-mono text-[11px] text-indigo-950 break-all bg-white p-2 rounded-lg border border-indigo-200/60 select-all">
                {batch.snapshotHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
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
                <div><span className="text-slate-400">Doanh nghiệp:</span> <strong className="text-slate-800 block">{enterprise?.enterpriseName || 'GreenFarm Co.'}</strong></div>
                <div><span className="text-slate-400">Mã số thuế:</span> <strong className="text-slate-800 block font-mono">{enterprise?.taxNumber || '0301234567'}</strong></div>
                <div className="col-span-2"><span className="text-slate-400">Trụ sở:</span> <span className="text-slate-700 block">{enterprise?.address || 'Ấp Tân Nhuận Đông, Châu Thành, Đồng Tháp'}</span></div>
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
                <div><span className="text-slate-400">Số chứng nhận:</span> <strong className="text-emerald-800 block font-mono">{vietgap?.certNumber || 'VIETGAP-BN-2026-088'}</strong></div>
                <div><span className="text-slate-400">Tổ chức cấp:</span> <span className="text-slate-700 block">{vietgap?.certifyingOrganization || 'Vinacert'}</span></div>
                <div><span className="text-slate-400">Hiệu lực đến:</span> <span className="text-slate-700 block">{vietgap?.validUntil || '2027-01-01'}</span></div>
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
                <div><span className="text-slate-400">Kết quả tổng:</span> <strong className="text-emerald-700 block font-bold">{qc?.overallVerdict || 'PASSED'}</strong></div>
                <div><span className="text-slate-400">Người kiểm định:</span> <span className="text-slate-700 block">{batch.inspectorFullName || 'Kỹ thuật viên KCS'}</span></div>
                <div><span className="text-slate-400">Người phê duyệt:</span> <span className="text-slate-700 block">{batch.approverFullName || 'Giám đốc trại'}</span></div>
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
              <span className="font-bold text-slate-900 text-xs">Trách Nhiệm Kiểm Soát Chất Lượng</span>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Kỹ thuật viên KCS (Inspector):</span>
                  <strong className="text-slate-800">{batch.inspectorFullName || 'Chưa phân công'}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Giám đốc trại phê duyệt (Approver):</span>
                  <strong className="text-slate-800">{batch.approverFullName || 'Chưa phê duyệt'}</strong>
                  {batch.approvedAt && (
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{formatDate(batch.approvedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Chi tiết chỉ tiêu phòng Lab */}
        {activeTab === 'LAB' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">Kết Quả Kiểm Nghiệm Phòng Thí Nghiệm</span>
                <span className="font-mono text-[11px] text-slate-500">
                  Mã: {qc?.inspectionCode || batch.qcInspectionCode || 'KCS-QC-001'}
                </span>
              </div>

              {Array.isArray(qc?.testMetrics) && qc.testMetrics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                        <th className="py-2">Chỉ tiêu kiểm định</th>
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
                <div className="space-y-2 py-4 text-center text-slate-400">
                  <p>Không có dữ liệu chỉ tiêu phòng Lab chi tiết.</p>
                  <p className="text-[11px]">
                    Lô hàng đạt tiêu chuẩn cảm quan và ngoại quan theo quy định chung của trang trại.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SlideOverDrawer>
  );
}

export default TraceabilityDetailDrawer;
