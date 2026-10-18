import React, { useState } from 'react';
import { CalendarCheck, Camera, MapPin, CheckCircle2, Clock, Calendar, CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SelfieCameraModal } from '@/components/common/SelfieCameraModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

/**
 * Workspace G: Cổng Thông Tin Nhân Viên, Chấm Công GPS/Selfie & Vận Hành Hàng Ngày (Điều 2.7 File 08)
 */
export function EmployeeDailyOpsWorkspace() {
  const { userInfo } = useAuthStore();
  const { activeFarm } = useActiveFarmStore();

  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState('CHECK_IN'); // 'CHECK_IN' | 'CHECK_OUT'
  const [tasks, setTasks] = useState([]);

  const handleOpenSelfie = (type) => {
    setAttendanceType(type);
    setIsSelfieModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-200">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Cổng Nhân Viên Hiện Trường & Chấm Công
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Xin chào, <strong className="text-slate-800">{userInfo?.fullName || 'Nhân viên'}</strong> • Trang trại:{' '}
              <strong className="text-emerald-700">{activeFarm?.farmName || activeFarm?.name || 'Chưa chọn'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Smart Timekeeping Card */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              Chấm Công 2 Đầu Xác Thực GPS & Selfie
            </span>
            <h2 className="text-2xl font-black text-white">Chấm Công Ca Làm Việc</h2>
            <p className="text-xs text-slate-300 max-w-md">
              Bắt buộc chụp ảnh camera trước trực tiếp và định vị GPS trong bán kính trang trại (
              {activeFarm?.geofenceRadiusM || 300}m) để ghi nhận giờ công chuẩn xác.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="success"
              size="lg"
              icon={Camera}
              onClick={() => handleOpenSelfie('CHECK_IN')}
              className="w-full sm:w-auto text-base shadow-lg shadow-emerald-500/20"
            >
              VÀO CA (CHECK-IN)
            </Button>
            <Button
              variant="danger"
              size="lg"
              icon={Camera}
              onClick={() => handleOpenSelfie('CHECK_OUT')}
              className="w-full sm:w-auto text-base shadow-lg shadow-rose-500/20"
            >
              HẾT CA (CHECK-OUT)
            </Button>
          </div>
        </div>
      </div>

      {/* Tasks & Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Tasks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Nhiệm Vụ Được Giao Hôm Nay</h3>
            </div>
            <span className="text-xs text-slate-400">0 việc</span>
          </div>

          <div className="py-8 text-center text-xs text-slate-400">
            Hôm nay bạn chưa có nhiệm vụ nào được phân công.
          </div>
        </div>

        {/* Shift Schedule */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Lịch Ca & Quỹ Phép Năm</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span className="font-medium">Ca làm việc hôm nay:</span>
              <span className="font-bold text-slate-900">Ca Sáng (07:00 - 15:30)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span className="font-medium">Quỹ phép năm còn lại:</span>
              <span className="font-bold text-emerald-700 font-mono">12.0 ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selfie Modal */}
      <SelfieCameraModal
        isOpen={isSelfieModalOpen}
        onClose={() => setIsSelfieModalOpen(false)}
        title={attendanceType === 'CHECK_IN' ? 'Chấm Công Vào Ca (Check-In)' : 'Chấm Công Hết Ca (Check-Out)'}
        onCaptureConfirm={(result) => {
          console.log('Attendance captured:', result);
        }}
      />
    </div>
  );
}

export default EmployeeDailyOpsWorkspace;
