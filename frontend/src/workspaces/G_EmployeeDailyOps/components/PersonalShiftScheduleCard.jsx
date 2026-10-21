import React, { useState } from 'react';
import { Clock, CalendarOff, CalendarPlus, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LeaveRequestModal } from './LeaveRequestModal';
import { OvertimeRequestModal } from './OvertimeRequestModal';
import { formatNumber, formatDate } from '@/utils/formatters';

export function PersonalShiftScheduleCard({
  activeFarm,
  employee,
  shifts = [],
  annualLeaveQuota = 12.0,
  onRefresh,
}) {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isOtModalOpen, setIsOtModalOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-900">Lịch Phân Ca & Quỹ Nghỉ Phép</h3>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Phép còn: {formatNumber(annualLeaveQuota, 1)} ngày
        </span>
      </div>

      <div className="space-y-3 text-xs text-slate-700">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <span className="font-medium text-slate-500 block text-[11px]">Chế độ làm việc:</span>
            <span className="font-bold text-slate-900">
              {employee?.contractType === 'FULL_TIME'
                ? 'Toàn thời gian (8h/ngày)'
                : employee?.contractType || 'Theo phân ca'}
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
            {employee?.position || 'Nhân sự hiện trường'}
          </span>
        </div>

        {/* 2 Nút gửi đơn chế độ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Button
            variant="outline"
            size="md"
            icon={<CalendarOff className="h-4 w-4 text-emerald-600" />}
            onClick={() => setIsLeaveModalOpen(true)}
            className="w-full justify-start text-xs font-bold"
          >
            + Gửi Đơn Xin Nghỉ Phép
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<CalendarPlus className="h-4 w-4 text-indigo-600" />}
            onClick={() => setIsOtModalOpen(true)}
            className="w-full justify-start text-xs font-bold"
          >
            + Đăng Ký Làm Thêm Giờ (OT)
          </Button>
        </div>
      </div>

      {/* Modal Nghỉ Phép */}
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSuccess={onRefresh}
        farmId={activeFarm?.id}
        employeeId={employee?.id}
        annualLeaveQuota={annualLeaveQuota}
      />

      {/* Modal Tăng Ca (OT) */}
      <OvertimeRequestModal
        isOpen={isOtModalOpen}
        onClose={() => setIsOtModalOpen(false)}
        onSuccess={onRefresh}
        farmId={activeFarm?.id}
        employeeId={employee?.id}
        shifts={shifts}
      />
    </div>
  );
}

export default PersonalShiftScheduleCard;
