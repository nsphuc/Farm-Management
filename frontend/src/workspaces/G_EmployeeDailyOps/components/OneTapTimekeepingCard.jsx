import React, { useState, useEffect } from 'react';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SelfieCameraModal } from '@/components/common/SelfieCameraModal';
import { Can } from '@/components/common/Can';
import { hrService } from '@/services/modules/hrService';
import { formatNumber, formatDateTime } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';

/**
 * Thẻ Chấm Công Thông Minh 2 Đầu (Mục 1 Khối 1 Workspace G & Điều 2.7 File 08)
 * Nút bấm lớn Mobile-First (>= 48x48px)
 * Hỗ trợ lưu trữ offline queue khi mất mạng ngoài đồng (Tiêu chí 3 File 10)
 */
export function OneTapTimekeepingCard({
  activeFarm,
  employee,
  todayShift,
  attendanceRecord,
  onAttendanceSuccess,
  annualLeaveQuota = 12.0,
}) {
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState('CHECK_IN'); // 'CHECK_IN' | 'CHECK_OUT'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(null);

  // Xác định trạng thái ca làm việc hiện tại
  // 1. Chưa Check-in
  // 2. Đang trong ca (đã checkInTime, chưa checkOutTime)
  // 3. Đã kết thúc ca (đã có cả checkInTime và checkOutTime)
  const isCheckedIn = Boolean(attendanceRecord?.checkInTime);
  const isCheckedOut = Boolean(attendanceRecord?.checkOutTime);

  let shiftStatusBadge = 'CHƯA VÀO CA';
  if (isCheckedIn && !isCheckedOut) {
    shiftStatusBadge = 'ĐANG TRONG CA';
  } else if (isCheckedIn && isCheckedOut) {
    shiftStatusBadge = 'ĐÃ KẾT THÚC CA';
  }

  const handleOpenTimekeeping = (type) => {
    setAttendanceType(type);
    setIsSelfieModalOpen(true);
  };

  const handleCaptureConfirm = async (captureResult) => {
    if (!activeFarm?.id) {
      toast.error('Vui lòng chọn trang trại đang tác nghiệp trước khi chấm công!');
      return;
    }

    try {
      setIsSubmitting(true);

      const effectivePhoto = captureResult?.dataUrl || captureResult?.photoDataUrl || '';
      const effectiveLat = captureResult?.location?.latitude ?? captureResult?.latitude ?? 0;
      const effectiveLon = captureResult?.location?.longitude ?? captureResult?.longitude ?? 0;
      const effectiveNotes = captureResult?.notes || null;

      const payload = {
        farmId: activeFarm.id,
        shiftId: todayShift?.id || 1, // Fallback ca mặc định nếu chưa gán
        latitude: Number(effectiveLat.toFixed(6)),
        longitude: Number(effectiveLon.toFixed(6)),
        photoUrl: effectivePhoto, // Đính kèm ảnh Base64 / URL
        notes: effectiveNotes,
        deviceInfo: navigator.userAgent.substring(0, 100),
        ...(employee?.id ? { employeeId: employee.id } : {}),
      };

      // Kiểm tra mạng Online / Offline (Tiêu chí 3 File 10)
      if (!navigator.onLine) {
        // Lưu tạm vào IndexedDB / localStorage queue
        const offlineQueue = JSON.parse(localStorage.getItem('offline_attendance_queue') || '[]');
        offlineQueue.push({ type: attendanceType, payload, savedAt: new Date().toISOString() });
        localStorage.setItem('offline_attendance_queue', JSON.stringify(offlineQueue));

        setOfflineNotice(
          'Mất kết nối mạng! Dữ liệu chấm công đã được lưu an toàn trên máy và sẽ tự động đồng bộ khi có sóng.'
        );
        setIsSelfieModalOpen(false);
        return;
      }

      if (attendanceType === 'CHECK_IN') {
        await hrService.checkIn(payload);
      } else {
        await hrService.checkOut(payload);
      }

      // Thông báo cập nhật liên workspace đến WS-B
      const { notifyDataChanged } = useActiveFarmStore.getState();
      if (notifyDataChanged) {
        await notifyDataChanged('employees');
      }

      onAttendanceSuccess?.();
      setIsSelfieModalOpen(false);
    } catch (err) {
      console.error('Attendance error:', err);
      toast.error('Chấm công thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-6 sm:p-8 text-white shadow-xl">
      {/* Decorative Blur Background */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {offlineNotice && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/20 p-3 text-xs text-amber-200 animate-in fade-in">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
          <span>{offlineNotice}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        {/* Left: Thông tin định danh & Ca hôm nay */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black tracking-wide border ${
                shiftStatusBadge === 'ĐANG TRONG CA'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : shiftStatusBadge === 'ĐÃ KẾT THÚC CA'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              ● {shiftStatusBadge}
            </span>

            {activeFarm && (
              <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  {activeFarm.farmName || activeFarm.name} • Tâm: [
                  {activeFarm.latitude ? Number(activeFarm.latitude).toFixed(4) : '21.0285'},{' '}
                  {activeFarm.longitude ? Number(activeFarm.longitude).toFixed(4) : '105.8542'}] •
                  Bán kính GPS: {activeFarm.geofenceRadiusM || 300}m
                </span>
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Chấm Công Định Vị GPS & Selfie
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs text-slate-300">
            <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Ca làm việc hôm nay
              </span>
              <span className="font-bold text-white text-sm">
                {todayShift?.shiftName || 'Ca Sáng Tiêu Chuẩn'}
              </span>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {todayShift?.startTime || '07:00'} - {todayShift?.endTime || '15:30'}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Nghỉ giữa ca / Ân hạn
              </span>
              <span className="font-bold text-white text-sm">
                {todayShift?.breakMinutes || 60}p nghỉ
              </span>
              <div className="text-[11px] text-emerald-400 mt-0.5">
                Ân hạn: +{todayShift?.graceLateMinutes || 15} phút
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl bg-white/5 p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Quỹ phép năm còn lại
              </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {formatNumber(annualLeaveQuota, 1)} ngày
              </span>
              <div className="text-[11px] text-slate-400 mt-0.5">Hạn mức năm 2026</div>
            </div>
          </div>
        </div>

        {/* Right: Nút hành động lớn Mobile-First (>= 48x48px) */}
        <div className="flex flex-col gap-3 shrink-0 sm:min-w-[260px]">
          <Can
            permission="PERM_HR_ATTENDANCE"
            fallback={
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs text-slate-400">
                <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                <span>Tài khoản văn phòng / thủ kho không áp dụng chấm công hiện trường</span>
              </div>
            }
          >
            {!isCheckedIn ? (
              // 1. CHƯA VÀO CA -> NÚT XANH CHECK-IN
              <Button
                variant="success"
                size="lg"
                icon={<Camera className="h-5 w-5" />}
                onClick={() => handleOpenTimekeeping('CHECK_IN')}
                className="w-full min-h-[52px] text-sm sm:text-base font-black shadow-lg shadow-emerald-600/30 tracking-wide rounded-2xl"
              >
                📸 Chấm Công Vào Ca (GPS + Selfie)
              </Button>
            ) : !isCheckedOut ? (
              // 2. ĐANG TRONG CA -> NÚT ĐỎ CHECK-OUT
              <div className="space-y-2">
                <div className="text-center text-[11px] text-emerald-300 bg-emerald-500/10 py-1 px-2.5 rounded-lg border border-emerald-500/20">
                  Đã vào ca lúc:{' '}
                  <strong className="font-mono text-white">
                    {new Date(attendanceRecord.checkInTime).toLocaleTimeString('vi-VN')}
                  </strong>
                </div>
                <Button
                  variant="danger"
                  size="lg"
                  icon={<Camera className="h-5 w-5" />}
                  onClick={() => handleOpenTimekeeping('CHECK_OUT')}
                  className="w-full min-h-[52px] text-sm sm:text-base font-black shadow-lg shadow-rose-600/30 tracking-wide rounded-2xl"
                >
                  🏁 Chấm Công Ra Ca (GPS + Selfie)
                </Button>
              </div>
            ) : (
              // 3. ĐÃ HOÀN TẤT CA
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/20 p-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Đã Hoàn Thành Ca Làm Việc!</span>
                </div>
                <p className="text-xs text-slate-300">
                  Tổng giờ công thực tế:{' '}
                  <strong className="text-white font-mono text-sm">
                    {formatNumber(attendanceRecord.workingHours || 8.0, 1)} giờ
                  </strong>
                </p>
                {attendanceRecord.lateMinutes > 0 && (
                  <span className="text-[11px] text-amber-300 block">
                    (Đi muộn: {attendanceRecord.lateMinutes} phút)
                  </span>
                )}
              </div>
            )}
          </Can>
        </div>
      </div>

      {/* Selfie Modal Component */}
      <SelfieCameraModal
        isOpen={isSelfieModalOpen}
        onClose={() => setIsSelfieModalOpen(false)}
        title={
          attendanceType === 'CHECK_IN'
            ? 'Chấm Công Vào Ca (GPS + Selfie)'
            : 'Chấm Công Hết Ca (GPS + Selfie)'
        }
        targetFarmCoords={
          activeFarm?.latitude && activeFarm?.longitude
            ? {
                latitude: Number(activeFarm.latitude),
                longitude: Number(activeFarm.longitude),
                radiusM: activeFarm.geofenceRadiusM || 300,
              }
            : null
        }
        onCaptureConfirm={handleCaptureConfirm}
      />
    </div>
  );
}

export default OneTapTimekeepingCard;
