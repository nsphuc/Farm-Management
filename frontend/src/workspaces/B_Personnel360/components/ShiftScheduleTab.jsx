import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Settings,
  Users,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SmartEmptyState } from '@/components/common/SmartEmptyState';
import { Can } from '@/components/common/Can';
import { ShiftScheduleModal } from './ShiftScheduleModal';
import { hrService } from '@/services/modules/hrService';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/store/useToastStore';
import { extractApiErrors } from '@/utils/apiHelpers';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

/**
 * Lấy danh sách 7 ngày trong tuần từ một ngày mốc (Thứ 2 -> Chủ Nhật)
 */
function getDaysOfWeek(baseDate) {
  const date = new Date(baseDate);
  const day = date.getDay();
  // Điều chỉnh để Thứ 2 là ngày đầu tuần (0 là Chủ nhật)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));

  const days = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    days.push({
      dateStr: nextDate.toISOString().split('T')[0],
      dayName: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'][i],
      formattedDate: `${nextDate.getDate()}/${nextDate.getMonth() + 1}`,
      isToday: nextDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
    });
  }
  return days;
}

export function ShiftScheduleTab({ farmId, employees = [], shifts = [] }) {
  const navigate = useNavigate();
  const { notifyDataChanged } = useActiveFarmStore();
  const [currentBaseDate, setCurrentBaseDate] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [localShifts, setLocalShifts] = useState(shifts || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const daysOfWeek = getDaysOfWeek(currentBaseDate);
  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');

  // Nạp danh sách ca làm việc nếu prop truyền vào trống
  useEffect(() => {
    if (shifts && shifts.length > 0) {
      setLocalShifts(shifts);
    } else {
      hrService.getWorkShifts()
        .then((data) => setLocalShifts(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Fetch shifts error:', err));
    }
  }, [shifts]);

  const fetchAssignments = async () => {
    if (!farmId) return;
    try {
      setIsLoading(true);
      // Fetch assignments for the week
      const promises = daysOfWeek.map((d) =>
        hrService.getShiftAssignments({ farmId, workDate: d.dateStr })
      );
      const results = await Promise.all(promises);
      const combined = results.flat().filter(Boolean);
      setAssignments(combined);
    } catch (err) {
      console.error('Fetch assignments error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [farmId, currentBaseDate]);

  const handlePrevWeek = () => {
    const d = new Date(currentBaseDate);
    d.setDate(d.getDate() - 7);
    setCurrentBaseDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentBaseDate);
    d.setDate(d.getDate() + 7);
    setCurrentBaseDate(d);
  };

  const handleToday = () => {
    setCurrentBaseDate(new Date());
  };

  // Hủy ca làm việc chưa diễn ra (SCHEDULED -> CANCELLED)
  const handleCancelAssignment = async (assign, emp, day) => {
    if (
      !window.confirm(
        `Xác nhận hủy ca làm việc "${assign.shiftName}" của nhân viên "${emp.fullName}" ngày ${day.formattedDate}?\n\nTrạng thái ca sẽ được chuyển sang Đã Hủy (CANCELLED).`
      )
    ) {
      return;
    }

    try {
      await hrService.cancelShiftAssignment(assign.id);
      toast.success(`Đã hủy ca "${assign.shiftName}" của "${emp.fullName}" thành công!`);
      notifyDataChanged?.('employees');
      await fetchAssignments();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || 'Không thể hủy ca làm việc!');
    }
  };

  if (!localShifts || localShifts.length === 0) {
    return (
      <SmartEmptyState
        icon={Clock}
        title="Chưa cấu hình Ca làm việc chuẩn"
        description="Để phân ca cho nhân viên, bạn cần tạo ít nhất một ca làm việc chuẩn (VD: Ca Sáng, Ca Chiều) trong Cài đặt hệ thống."
        actionLabel="Đến Cài Đặt Ca Làm Việc"
        onAction={() => navigate('/app/settings?tab=shifts')}
        permission="PERM_TENANT_MANAGE"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Thanh điều hướng tuần & Nút phân ca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek} title="Tuần trước">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Tuần Này
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek} title="Tuần kế tiếp">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-xs font-bold text-slate-800 ml-2">
            Từ {daysOfWeek[0].formattedDate} đến {daysOfWeek[6].formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={fetchAssignments}
            isLoading={isLoading}
          >
            Làm Mới
          </Button>

          <Can permission="PERM_HR_EMPLOYEE_MANAGE">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              + Phân Ca Làm Việc
            </Button>
          </Can>
        </div>
      </div>

      {/* Bảng ma trận: Nhân viên x 7 ngày */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3.5 min-w-[200px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                Nhân Viên Trại ({activeEmployees.length})
              </th>
              {daysOfWeek.map((day) => (
                <th
                  key={day.dateStr}
                  className={`px-3 py-3.5 text-center min-w-[140px] border-r border-slate-100 last:border-0 ${
                    day.isToday ? 'bg-emerald-50/80 text-emerald-900 font-black' : ''
                  }`}
                >
                  <div>{day.dayName}</div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5 font-mono">
                    {day.formattedDate}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Chưa có nhân viên hoạt động nào trong trang trại này.
                </td>
              </tr>
            ) : (
              activeEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium sticky left-0 bg-white z-10 border-r border-slate-200 shadow-xs">
                    <div className="font-bold text-slate-900 truncate">{emp.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {emp.employeeCode} • {emp.position || 'Nhân sự'}{' '}
                      {emp.assignedZoneName ? `(Khu: ${emp.assignedZoneName})` : ''}
                    </div>
                  </td>

                  {daysOfWeek.map((day) => {
                    const assign = assignments.find(
                      (a) => a.employeeId === emp.id && a.workDate === day.dateStr
                    );

                    return (
                      <td
                        key={day.dateStr}
                        className={`p-2 text-center border-r border-slate-100 last:border-0 ${
                          day.isToday ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        {assign ? (
                          <div
                            className={`rounded-xl border p-2 text-left shadow-2xs space-y-1 transition-all ${
                              assign.status === 'CANCELLED'
                                ? 'border-slate-200 bg-slate-50 opacity-60'
                                : 'border-emerald-200 bg-emerald-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span
                                className={`font-bold block truncate text-[11px] ${
                                  assign.status === 'CANCELLED'
                                    ? 'text-slate-500 line-through'
                                    : 'text-emerald-900'
                                }`}
                              >
                                {assign.shiftName}
                              </span>

                              {/* Nút Hủy Ca (CANCELLED) cho ca chưa diễn ra */}
                              {assign.status === 'SCHEDULED' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelAssignment(assign, emp, day)}
                                  title="Hủy ca làm việc này (CANCELLED)"
                                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-0.5 transition-colors cursor-pointer shrink-0"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-mono">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>
                                {assign.startTime ? assign.startTime.substring(0, 5) : '—'} -{' '}
                                {assign.endTime ? assign.endTime.substring(0, 5) : '—'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-0.5">
                              <StatusBadge status={assign.status || 'SCHEDULED'} size="sm" />
                              {assign.status === 'SCHEDULED' && (
                                <span className="text-[9px] text-slate-400 italic">Chưa vào ca</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-[11px]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ShiftScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchAssignments();
          notifyDataChanged?.('employees');
        }}
        employees={activeEmployees}
        shifts={localShifts}
        farmId={farmId}
      />
    </div>
  );
}

export default ShiftScheduleTab;
