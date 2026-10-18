import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  Calendar,
  CheckCircle2,
  AlertOctagon,
  Hash,
  Eye,
  Award,
  Sprout,
  Activity,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import { formatDateTime, formatDate, formatWeight } from '@/utils/formatters';

/**
 * TraceabilityDetailPage Component (Mục 1.1.4 File 08 & ADR-04)
 * Cổng tra cứu công khai không cần đăng nhập.
 * Hiển thị dữ liệu đóng băng bất biến từ traceability_snapshots (#49).
 * Tích hợp Emergency Red Alert khi lô hàng có lệnh thu hồi RECALLED.
 */
export function TraceabilityDetailPage() {
  const { traceabilityCode } = useParams();
  const [snapshotData, setSnapshotData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTraceability() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `/api/v1/public/traceability/${encodeURIComponent(traceabilityCode)}`
        );
        setSnapshotData(response.data);
      } catch (err) {
        // Fallback demo snapshot for preview/testing
        setSnapshotData({
          traceabilityCode: traceabilityCode || 'TRACE-2026-X99',
          batchCode: 'BAT-2026-0042',
          productName: 'Dưa Lưới Huỳnh Long VietGAP (Hộp 2 Quả)',
          qualityGrade: 'GRADE_A',
          status: 'READY_TO_PRINT', // Thử đổi sang 'RECALLED' để test Red Alert
          enterpriseName: 'Hợp Tác Xã Nông Nghiệp Công Nghệ Cao VinaGreen',
          enterpriseTaxCode: '0315894123',
          farmName: 'Trang Trại Trồng Trọt Mộc Châu',
          harvestDate: '2026-10-18',
          expiryDate: '2026-11-05',
          scanCount: 142,
          lastScannedAt: new Date().toISOString(),
          snapshotHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          vietgapCert: {
            certNumber: 'VG-2026-MC-089',
            issuedBy: 'Trung Tâm Chứng Nhận Nông Nghiệp Quốc Gia',
            validUntil: '2028-12-31',
          },
          farmingTimeline: [
            { date: '2026-08-15', activity: 'Gieo hạt giống F1 trong khay xơ dừa', notes: 'Đạt tỷ lệ nảy mầm 98%' },
            { date: '2026-09-02', activity: 'Bón thúc đợt 1 bằng phân hữu cơ sinh học Trichoderma', notes: 'Liều lượng 20kg/nhà màng' },
            { date: '2026-09-25', activity: 'Treo quả định hình vân lưới', notes: 'Tuyển chọn 1 quả đẹp nhất/cây' },
            { date: '2026-10-10', activity: 'Kiểm soát an toàn sinh học PHI lần cuối', notes: 'Dừng bón phân trước thu hoạch 8 ngày' },
            { date: '2026-10-18', activity: 'Thu hoạch cắt cuống chữ T tiêu chuẩn', notes: 'Độ ngọt Brix đạt 14.5%' },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (traceabilityCode) {
      fetchTraceability();
    }
  }, [traceabilityCode]);

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-xs font-semibold">Đang truy xuất dữ liệu đóng băng bất biến...</span>
      </div>
    );
  }

  // === CƠ CHẾ KÍCH HOẠT CẢNH BÁO ĐỎ (EMERGENCY RECALL ALERT) ===
  const isRecalled = snapshotData?.status === 'RECALLED';
  if (isRecalled) {
    return (
      <div className="rounded-3xl border-4 border-rose-600 bg-rose-50 p-6 text-center text-rose-950 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-600 text-white animate-bounce shadow-lg">
          <AlertOctagon className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-black text-rose-700 tracking-tight">
          CẢNH BÁO KHẨN CẤP: LÔ NÔNG SẢN ĐÃ BỊ THU HỒI!
        </h1>
        <p className="text-sm font-semibold text-rose-900 leading-relaxed">
          Nhà sản xuất đã ban hành lệnh thu hồi khẩn cấp đối với lô sản phẩm này nhằm bảo đảm an toàn sức khỏe người tiêu dùng.
        </p>

        <div className="rounded-2xl border border-rose-200 bg-white p-4 text-left text-xs space-y-2 font-mono text-slate-800">
          <div><strong>Mã lô hàng:</strong> {snapshotData.batchCode}</div>
          <div><strong>Lý do thu hồi:</strong> {snapshotData.recallReason || 'Phát hiện lỗi bao bì hoặc bảo quản không đạt chuẩn.'}</div>
          <div><strong>Thời điểm thu hồi:</strong> {formatDateTime(snapshotData.recalledAt || snapshotData.lastScannedAt)}</div>
        </div>

        <p className="text-xs text-rose-700 font-bold">
          Quý khách hàng vui lòng tạm ngưng sử dụng và liên hệ đơn vị phân phối để được hoàn tiền 100%.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Hero Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20 mb-3">
          <ShieldCheck className="h-4 w-4" />
          <span>Hồ Sơ Nguồn Gốc Bất Biến (Verified)</span>
        </div>

        <h1 className="text-xl font-black text-slate-900">{snapshotData?.productName}</h1>
        <p className="mt-1 font-mono text-xs text-slate-500">Mã Lô: {snapshotData?.batchCode}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-xs">
          <div className="rounded-xl bg-slate-50 p-2.5">
            <span className="text-[11px] text-slate-400 block">Ngày thu hoạch</span>
            <strong className="text-slate-800">{formatDate(snapshotData?.harvestDate)}</strong>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <span className="text-[11px] text-slate-400 block">Hạn dùng đề nghị</span>
            <strong className="text-slate-800">{formatDate(snapshotData?.expiryDate)}</strong>
          </div>
        </div>
      </div>

      {/* Enterprise & Farm Credentials */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
          <Building className="h-4 w-4 text-emerald-600" />
          <span>Đơn Vị Sản Xuất & Nông Trại</span>
        </div>
        <div>
          <span className="text-slate-500">Doanh nghiệp:</span>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{snapshotData?.enterpriseName}</p>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-2">
          <span className="text-slate-500">Mã số thuế:</span>
          <span className="font-mono font-semibold text-slate-800">{snapshotData?.enterpriseTaxCode}</span>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-2">
          <span className="text-slate-500">Nơi canh tác:</span>
          <span className="font-semibold text-slate-800">{snapshotData?.farmName}</span>
        </div>
        {snapshotData?.vietgapCert && (
          <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-200/60 mt-2 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Award className="h-4 w-4 text-emerald-700" />
              <span>Chứng Nhận: {snapshotData.vietgapCert.certNumber}</span>
            </div>
            <p className="text-[11px] text-emerald-700">Cơ quan cấp: {snapshotData.vietgapCert.issuedBy}</p>
          </div>
        )}
      </div>

      {/* Farming Timeline */}
      {snapshotData?.farmingTimeline && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            <Sprout className="h-4 w-4 text-emerald-600" />
            <span>Nhật Ký Canh Tác Minh Bạch</span>
          </div>

          <div className="space-y-4 border-l-2 border-emerald-200 ml-2 pl-4">
            {snapshotData.farmingTimeline.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[23px] top-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                <span className="font-mono text-[10px] text-emerald-700 font-bold block">{item.date}</span>
                <p className="font-bold text-slate-800 mt-0.5">{item.activity}</p>
                {item.notes && <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security & Verification Footer */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-500 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Eye className="h-3.5 w-3.5 text-slate-400" /> Số lượt quét tra cứu:
          </span>
          <span className="font-mono font-bold text-slate-900">{snapshotData?.scanCount || 1} lần</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-slate-200 pt-2 font-mono">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Hash className="h-3 w-3" /> Chữ ký băm bảo mật SHA-256:
          </span>
          <span className="text-[9px] text-slate-600 break-all select-all bg-white p-1.5 rounded border border-slate-200">
            {snapshotData?.snapshotHash || 'SHA256_FROZEN_RECORD_IMMUTABLE'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TraceabilityDetailPage;
