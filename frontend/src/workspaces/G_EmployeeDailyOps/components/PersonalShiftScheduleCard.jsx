import React, { useState, useEffect } from 'react';
import { Clock, CalendarOff, CalendarPlus, ChevronRight, User, CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LeaveRequestModal } from './LeaveRequestModal';
import { OvertimeRequestModal } from './OvertimeRequestModal';
import { formatNumber, formatDate } from '@/utils/formatters';
import { hrService } from '@/services/modules/hrService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function PersonalShiftScheduleCard({
  activeFarm,
  employee,
  shifts = [],
  annualLeaveQuota = 12.0,
  onRefresh,
}) {
  const syncTrigger = useActiveFarmStore((state) => state.syncTrigger);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isOtModalOpen, setIsOtModalOpen] = useState(false);
  const [assignedShifts, setAssignedShifts] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPersonalAssignments = async () => {
      if (!activeFarm?.id) return;
      try {
        setIsLoadingAssignments(true);
        const todayStr = new Date().toISOString().split('T')[0];
        const params = {
          workDate: todayStr,
        };
        if (employee?.id) {
          params.employeeId = employee.id;
        } else {
          params.farmId = activeFarm.id;
        }
        const res = await hrService.getShiftAssignments(params);
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.content || [];
          setAssignedShifts(list);
        }
      } catch (err) {
        // Safe logging without crashing UI
        console.warn('Lịch phân ca cá nhân:', err?.response?.data?.message || err?.message);
        if (isMounted) setAssignedShifts([]);
      } finally {
        if (isMounted) setIsLoadingAssignments(false);
      }
    };

    fetchPersonalAssignments();
    return () => {
      isMounted = false;
    };
  }, [
    activeFarm?.id,
    employee?.id,
    syncTrigger?.employees,
    syncTrigger?.attendance,
    syncTrigger?.all,
  ]);

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

        {/* Danh sách ca trực được phân công hôm nay */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
              <CalendarCheck2 className="h-3.5 w-3.5 text-blue-600" />
              Ca làm việc hôm nay:
            </span>
            <span className="text-[11px] text-slate-500">
              {new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>

          {isLoadingAssignments ? (
            <div className="text-xs text-slate-400 py-1 italic">Đang tải lịch phân ca...</div>
          ) : assignedShifts.length > 0 ? (
            <div className="space-y-1.5">
              {assignedShifts.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{a.shiftName || 'Ca Tiêu Chuẩn'}</span>
                    <span className="text-slate-500 text-[11px] ml-2 font-mono">
                      ({a.startTime ? a.startTime.substring(0, 5) : '07:00'} - {a.endTime ? a.endTime.substring(0, 5) : '17:00'})
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    a.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    a.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {a.status === 'SCHEDULED' ? 'Đã xếp ca' : a.status || 'Đã xếp ca'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-dashed border-slate-200 flex items-center justify-between">
              <span>Chế độ ca tiêu chuẩn theo nông trại</span>
              <span className="text-[11px] font-mono text-slate-500">
                {shifts[0]?.startTime?.substring(0, 5) || '07:00'} - {shifts[0]?.endTime?.substring(0, 5) || '17:00'}
              </span>
            </div>
          )}
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
