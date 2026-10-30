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
  Compass,
  MonitorCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SelfieCameraModal } from '@/components/common/SelfieCameraModal';
import { Can } from '@/components/common/Can';
import { hrService } from '@/services/modules/hrService';
import { geographyService } from '@/services/modules/geographyService';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
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
  const { userInfo, isFarmManager, isAccountant, isWarehouseKeeper } = useAuthStore();
  const { activeFarmId: storeFarmId, activeFarm: storeFarm, farms } = useActiveFarmStore();

  // Nhận diện ID trang trại chính xác từ prop activeFarm, store hoặc danh sách accessibleFarms của user
  const effectiveFarmId = Number(
    (activeFarm?.id && activeFarm.id !== 'ALL' ? activeFarm.id : null) ||
    (activeFarm?.farmId && activeFarm.farmId !== 'ALL' ? activeFarm.farmId : null) ||
    (storeFarmId && storeFarmId !== 'ALL' ? storeFarmId : null) ||
    (storeFarm?.id && storeFarm.id !== 'ALL' ? storeFarm.id : null) ||
    (storeFarm?.farmId && storeFarm.farmId !== 'ALL' ? storeFarm.farmId : null) ||
    userInfo?.accessibleFarms?.[0]?.farmId ||
    userInfo?.accessibleFarms?.[0]?.id ||
    0
  );

  const effectiveFarm =
    (activeFarm && activeFarm.id !== 'ALL' && activeFarm.farmId !== 'ALL' ? activeFarm : null) ||
    (storeFarm && storeFarm.id !== 'ALL' && storeFarm.farmId !== 'ALL' ? storeFarm : null) ||
    (farms || []).find((f) => Number(f.id || f.farmId) === effectiveFarmId) ||
    (userInfo?.accessibleFarms || []).find((f) => Number(f.id || f.farmId) === effectiveFarmId) ||
    {};

  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState('CHECK_IN'); // 'CHECK_IN' | 'CHECK_OUT'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalibratingGps, setIsCalibratingGps] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(null);

  // Phân loại khối Văn phòng / Điều hành / Kho bãi (Farm Manager, Kế toán, Thủ kho)
  const isOfficeRole = Boolean(
    isFarmManager?.() ||
    isAccountant?.() ||
    isWarehouseKeeper?.() ||
    userInfo?.operationalRole === 'FARM_MANAGER' ||
    userInfo?.operationalRole === 'FARM_ACCOUNTANT' ||
    userInfo?.operationalRole === 'WAREHOUSE_KEEPER' ||
    userInfo?.roles?.includes('ROLE_FARM_MANAGER') ||
    userInfo?.roles?.includes('ROLE_ACCOUNTANT') ||
    userInfo?.roles?.includes('ROLE_WAREHOUSE_STAFF') ||
    employee?.position?.toUpperCase().includes('MANAGER') ||
    employee?.position?.toUpperCase().includes('GIÁM ĐỐC') ||
    employee?.position?.toUpperCase().includes('QUẢN LÝ') ||
    employee?.position?.toUpperCase().includes('ACCOUNTANT') ||
    employee?.position?.toUpperCase().includes('KẾ TOÁN') ||
    employee?.position?.toUpperCase().includes('THỦ KHO') ||
    employee?.position?.toUpperCase().includes('WAREHOUSE')
  );

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

  // Xử lý chấm công 1 chạm cho Kế toán & Thủ kho (Web Check-in không bắt buộc Selfie & bỏ qua Geofence)
  const handleOfficeWebCheck = async (type) => {
    if (!effectiveFarmId) {
      toast.error('Vui lòng chọn trang trại đang tác nghiệp trước khi chấm công!');
      return;
    }

    try {
      setIsSubmitting(true);

      let currentLat = effectiveFarm.latitude ? Number(effectiveFarm.latitude) : 21.0285;
      let currentLon = effectiveFarm.longitude ? Number(effectiveFarm.longitude) : 105.8542;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 3000,
              maximumAge: 60000,
              enableHighAccuracy: false,
            });
          });
          if (pos?.coords) {
            currentLat = pos.coords.latitude;
            currentLon = pos.coords.longitude;
          }
        } catch {
          // Bỏ qua lỗi định vị ở chế độ văn phòng
        }
      }

      const payload = {
        farmId: effectiveFarmId,
        shiftId: todayShift?.id || 1,
        latitude: Number(currentLat.toFixed(6)),
        longitude: Number(currentLon.toFixed(6)),
        photoUrl: type === 'CHECK_IN' ? 'OFFICE_CHECKIN' : 'OFFICE_CHECKOUT',
        notes: type === 'CHECK_IN' ? 'Chấm công Văn phòng / Kho (Web Check-in)' : 'Tan ca Văn phòng / Kho (Web Check-out)',
        deviceInfo: navigator.userAgent.substring(0, 100),
        ...(employee?.id ? { employeeId: employee.id } : {}),
      };

      if (type === 'CHECK_IN') {
        await hrService.checkIn(payload);
        toast.success('Chấm công vào ca Văn phòng / Kho thành công!');
      } else {
        await hrService.checkOut(payload);
        toast.success('Chấm công ra ca Văn phòng / Kho thành công!');
      }

      const { notifyDataChanged } = useActiveFarmStore.getState();
      if (notifyDataChanged) {
        await notifyDataChanged('employees');
      }

      onAttendanceSuccess?.();
    } catch (err) {
      console.error('Office attendance error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Không thể chấm công';
      toast.error('Chấm công thất bại: ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hiệu chuẩn toạ độ thực tế cho Trang trại phục vụ buổi Demo trên lớp (Chiêu 1 & Chiêu 2)
  const handleCalibrateFarmCoords = async () => {
    if (!effectiveFarmId) {
      toast.error('Chưa xác định được trang trại để hiệu chuẩn toạ độ');
      return;
    }

    try {
      setIsCalibratingGps(true);
      toast.info('Đang dò toạ độ thực tế từ thiết bị...');

      let latitude = null;
      let longitude = null;

      if (navigator.geolocation) {
        try {
          // Thử lấy toạ độ mềm qua mạng/WiFi trong 5s (tránh bị timeout trên PC/Laptop)
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 60000,
            });
          });
          if (pos?.coords) {
            latitude = pos.coords.latitude;
            longitude = pos.coords.longitude;
          }
        } catch (geoErr) {
          console.warn('Lần lấy toạ độ 1 (enableHighAccuracy=false) thất bại:', geoErr);
          // Thử lại lần 2 nếu có chip GPS
          try {
            const pos2 = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
              });
            });
            if (pos2?.coords) {
              latitude = pos2.coords.latitude;
              longitude = pos2.coords.longitude;
            }
          } catch (geoErr2) {
            console.warn('Lần lấy toạ độ 2 (enableHighAccuracy=true) thất bại:', geoErr2);
          }
        }
      }

      // Nếu không lấy được tự động (PC bàn không có WiFi/GPS hoặc trình duyệt chặn quyền)
      if (!latitude || !longitude) {
        const defaultCoords = `${effectiveFarm.latitude || '10.776889'}, ${effectiveFarm.longitude || '106.700806'}`;
        const manualInput = window.prompt(
          'Không thể tự động đọc GPS thiết bị (do máy tính bàn không có WiFi/GPS hoặc quyền vị trí bị chặn).\n\n' +
          'Vui lòng nhập toạ độ phòng học/địa điểm Demo (hoặc dùng toạ độ gợi ý bên dưới):\n' +
          'Định dạng: Vĩ_độ, Kinh_độ',
          defaultCoords
        );

        if (!manualInput) {
          setIsCalibratingGps(false);
          return;
        }

        const parts = manualInput.split(',').map((s) => s.trim());
        if (parts.length >= 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
          latitude = Number(parts[0]);
          longitude = Number(parts[1]);
        } else {
          toast.error('Định dạng toạ độ không hợp lệ! Vui lòng nhập: Vĩ độ, Kinh độ (VD: 10.776889, 106.700806)');
          setIsCalibratingGps(false);
          return;
        }
      }

      const farmName = effectiveFarm.name || effectiveFarm.farmName || `Trang Trại #${effectiveFarmId}`;

      const confirmUpdate = window.confirm(
        `Xác nhận hiệu chuẩn toạ độ thực địa cho buổi Demo:\n` +
        `- Trang trại: ${farmName}\n` +
        `- Vĩ độ mới: ${Number(latitude).toFixed(6)}\n` +
        `- Kinh độ mới: ${Number(longitude).toFixed(6)}\n` +
        `- Bán kính Geofence: 1,000m\n\n` +
        `Bạn có muốn đặt toạ độ này làm Tâm Trang Trại để mọi nhân sự demo đều chấm công GPS thành công không?`
      );

      if (!confirmUpdate) {
        setIsCalibratingGps(false);
        return;
      }

      // Lấy chi tiết trang trại đầy đủ từ server nếu thiếu field
      let farmDetails = effectiveFarm;
      try {
        const remoteDetails = await geographyService.getFarmById(effectiveFarmId);
        if (remoteDetails) {
          farmDetails = { ...effectiveFarm, ...remoteDetails };
        }
      } catch {
        // Sử dụng dữ liệu hiện có
      }

      const updatePayload = {
        name: farmDetails.name || farmDetails.farmName || 'Trang Trại Công Nghệ Cao',
        code: farmDetails.code || farmDetails.farmCode || `FARM-${effectiveFarmId}`,
        farmType: farmDetails.farmType || 'MIXED',
        totalAreaM2: farmDetails.totalAreaM2 || 10000,
        latitude: Number(Number(latitude).toFixed(6)),
        longitude: Number(Number(longitude).toFixed(6)),
        geofenceRadiusM: 1000,
        address: farmDetails.address || 'Địa điểm diễn tập / phòng học Demo',
      };

      await geographyService.updateFarm(effectiveFarmId, updatePayload);
      toast.success('🎯 Đã hiệu chuẩn Tâm Trang Trại thành công! Bán kính Geofence mở rộng: 1,000m.');

      const { notifyDataChanged } = useActiveFarmStore.getState();
      if (notifyDataChanged) {
        await notifyDataChanged('farms');
        await notifyDataChanged('all');
      }

      onAttendanceSuccess?.();
    } catch (err) {
      console.error('Calibration error:', err);
      toast.error('Lỗi hiệu chuẩn toạ độ: ' + (err.message || 'Không thể lưu toạ độ mới'));
    } finally {
      setIsCalibratingGps(false);
    }
  };

  const handleCaptureConfirm = async (captureResult) => {
    if (!effectiveFarmId) {
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
        farmId: effectiveFarmId,
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
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-4 sm:p-8 text-white shadow-xl">
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

            {effectiveFarmId > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  {effectiveFarm.farmName || effectiveFarm.name || `Trang Trại #${effectiveFarmId}`} • Tâm: [
                  {effectiveFarm.latitude ? Number(effectiveFarm.latitude).toFixed(4) : '21.0285'},{' '}
                  {effectiveFarm.longitude ? Number(effectiveFarm.longitude).toFixed(4) : '105.8542'}] •
                  Bán kính: {effectiveFarm.geofenceRadiusM || 300}m
                </span>
              </span>
            )}

            {/* Nút Hiệu Chuẩn Toạ Độ Hiện Tại Cho Buổi Demo (Chiêu 1 & 2) */}
            {effectiveFarmId > 0 && (
              <button
                type="button"
                onClick={handleCalibrateFarmCoords}
                disabled={isCalibratingGps || isSubmitting}
                className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/20 hover:bg-amber-500/35 px-3 py-1 rounded-full border border-amber-400/40 transition-all font-semibold"
                title="Lấy toạ độ GPS máy tính/phòng học hiện tại gán làm tâm trang trại với bán kính 1000m"
              >
                <Compass className={`h-3.5 w-3.5 ${isCalibratingGps ? 'animate-spin text-amber-400' : 'text-amber-300'}`} />
                <span>{isCalibratingGps ? 'Đang định vị...' : '🎯 Đồng Bộ Toạ Độ Demo'}</span>
              </button>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>{isOfficeRole ? 'Chấm Công Khối Văn Phòng & Điều Hành' : 'Chấm Công Định Vị GPS & Selfie'}</span>
              {isOfficeRole && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Web Check-in
                </span>
              )}
            </h2>
            {isOfficeRole && (
              <p className="text-xs text-blue-200/80">
                🏢 Chế độ Văn phòng / Điều hành: Điểm danh vào ca 1 chạm không ép định vị GPS ngoài đồng ruộng.
              </p>
            )}
          </div>

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
          {isOfficeRole ? (
            // ================= GIAO DIỆN CHẤM CÔNG VĂN PHÒNG & KHO (CÁCH A) =================
            !isCheckedIn ? (
              <Button
                variant="primary"
                size="lg"
                icon={<MonitorCheck className="h-5 w-5" />}
                onClick={() => handleOfficeWebCheck('CHECK_IN')}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="w-full min-h-[52px] text-sm sm:text-base font-black bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 tracking-wide rounded-2xl"
              >
                🖥️ Vào Ca (Web Check-in 1 Chạm)
              </Button>
            ) : !isCheckedOut ? (
              <div className="space-y-2">
                <div className="text-center text-[11px] text-blue-300 bg-blue-500/10 py-1 px-2.5 rounded-lg border border-blue-500/20">
                  Đã vào ca văn phòng lúc:{' '}
                  <strong className="font-mono text-white">
                    {new Date(attendanceRecord.checkInTime).toLocaleTimeString('vi-VN')}
                  </strong>
                </div>
                <Button
                  variant="danger"
                  size="lg"
                  icon={<Clock className="h-5 w-5" />}
                  onClick={() => handleOfficeWebCheck('CHECK_OUT')}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  className="w-full min-h-[52px] text-sm sm:text-base font-black shadow-lg shadow-rose-600/30 tracking-wide rounded-2xl"
                >
                  🏁 Tan Ca (Web Check-out)
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/20 p-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-blue-400 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Đã Hoàn Thành Ca Văn Phòng!</span>
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
            )
          ) : (
            // ================= GIAO DIỆN CHẤM CÔNG HIỆN TRƯỜNG (GPS + SELFIE) =================
            <Can
              permission="PERM_HR_ATTENDANCE"
              fallback={
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs text-slate-400">
                  <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                  <span>Tài khoản của bạn chưa được phân quyền chấm công ca làm việc này</span>
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
          )}
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
          effectiveFarm?.latitude && effectiveFarm?.longitude
            ? {
                latitude: Number(effectiveFarm.latitude),
                longitude: Number(effectiveFarm.longitude),
                radiusM: effectiveFarm.geofenceRadiusM || 300,
              }
            : null
        }
        onCaptureConfirm={handleCaptureConfirm}
      />
    </div>
  );
}

export default OneTapTimekeepingCard;
