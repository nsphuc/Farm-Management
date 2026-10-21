import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  CalendarCheck,
  RefreshCw,
  Users,
  RotateCcw,
  Kanban,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OneTapTimekeepingCard } from './components/OneTapTimekeepingCard';
import { TeamRollCallPanel } from './components/TeamRollCallPanel';
import { PersonalTaskKanban } from './components/PersonalTaskKanban';
import { DailyRoutineTaskTab } from './components/DailyRoutineTaskTab';
import { WorkerDailyTasksView } from './components/WorkerDailyTasksView';
import { PersonalShiftScheduleCard } from './components/PersonalShiftScheduleCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { hrService } from '@/services/modules/hrService';
import { geographyService } from '@/services/modules/geographyService';

/**
 * WORKSPACE G (/app/my-dashboard): CỔNG NHÂN VIÊN & CHẤM CÔNG HIỆN TRƯỜNG
 * 1. Chặn Owner (Role 1): Chuyển hướng sang /app/geography
 * 2. Khối 1: Chấm Công Cá Nhân 1 Chạm (GPS + Selfie Vào Ca / Ra Ca) cho Role 2, 3, 4, 5, 6A
 * 3. Khối 2: Bảng Điểm Danh & Chấm Công Tổ Hộ Nhân Viên Không Có Tài Khoản (TeamRollCallPanel) cho Role 2, 3, 4
 * 4. Khối 3: Quản lý Công việc theo 2 Tab (Role 2, 3, 4) HOẶC "Công Việc Của Tôi Hôm Nay" (Role 6A - isFieldWorker)
 * 5. Khối 4: Lịch Ca Cá Nhân & Nghỉ Phép / OT
 */
export function EmployeeDailyOpsWorkspace() {
  const {
    userInfo,
    isOwner,
    isFarmManager,
    isTechnicalLead,
    isWarehouseKeeper,
    isFarmAccountant,
    isFieldWorker,
  } = useAuthStore();
  const { activeFarmId, activeFarm } = useActiveFarmStore();

  // 1. Chặn Chủ Đầu Tư (Owner - Role 1): Người trả lương không cần chấm công
  if (isOwner()) {
    return <Navigate to="/app/geography" replace />;
  }

  const farmManager = isFarmManager();
  const technicalLead = isTechnicalLead();
  const warehouseKeeper = isWarehouseKeeper();
  const fieldWorker = isFieldWorker();
  const canRollCallTeam = farmManager || technicalLead || warehouseKeeper;
  const canSuperviseTasks = farmManager || technicalLead || warehouseKeeper;

  const [activeTaskTab, setActiveTaskTab] = useState('ROUTINES'); // 'ROUTINES' | 'KANBAN'
  const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [zones, setZones] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [todayAttendances, setTodayAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Tải danh mục phân khu của Farm
  const fetchZones = async () => {
    if (!activeFarmId) return;
    try {
      const data = await geographyService.getZones(activeFarmId);
      setZones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch zones error:', err);
    }
  };

  // 2. Tải danh sách ca làm việc chuẩn
  const fetchShifts = async () => {
    try {
      const data = await hrService.getWorkShifts();
      setShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch shifts error:', err);
    }
  };

  // 3. Tải danh sách nhân viên
  const fetchEmployees = async () => {
    try {
      const res = await hrService.getEmployees({ farmId: activeFarmId || undefined });
      const list = res?.content || (Array.isArray(res) ? res : []);
      setEmployees(list);

      // Tìm hồ sơ nhân viên khớp với user đang đăng nhập
      if (userInfo?.id) {
        const matched = list.find((e) => e.userId === userInfo.id);
        if (matched) {
          setEmployee(matched);
        } else if (list.length > 0) {
          setEmployee(list[0]);
        }
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
    }
  };

  // 4. Tải các nhiệm vụ được giao
  const fetchTasks = async () => {
    if (!activeFarmId) return;
    try {
      const res = await hrService.getTasks(activeFarmId);
      const list = res?.content || (Array.isArray(res) ? res : []);
      setTasks(list);
    } catch (err) {
      console.error('Fetch tasks error:', err);
    }
  };

  // 5. Tải dữ liệu chấm công hôm nay
  const fetchTodayAttendance = async () => {
    if (!activeFarmId) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const data = await hrService.getAttendances({ farmId: activeFarmId, workDate: todayStr });
      const list = Array.isArray(data) ? data : data?.content || [];
      setTodayAttendances(list);

      if (list.length > 0) {
        const myRecord = employee ? list.find((a) => a.employeeId === employee.id) : list[0];
        setTodayAttendance(myRecord || null);
      } else {
        setTodayAttendance(null);
      }
    } catch (err) {
      console.error('Fetch today attendance error:', err);
    }
  };

  const handleRefreshAll = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchZones(),
      fetchShifts(),
      fetchEmployees(),
      fetchTasks(),
      fetchTodayAttendance(),
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    handleRefreshAll();
  }, [activeFarmId]);

  useEffect(() => {
    if (employee && activeFarmId) {
      fetchTodayAttendance();
    }
  }, [employee]);

  // Ca làm việc hôm nay: Gợi ý ca đầu tiên hoặc ca gán
  const todayShift = shifts[0] || {
    id: 1,
    shiftName: 'Ca Sáng Nông Nghiệp',
    startTime: '07:00:00',
    endTime: '15:30:00',
    breakMinutes: 60,
    graceLateMinutes: 15,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header Chào Mừng */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-200 shrink-0">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                WS-G: Cổng Nhân Viên & Chấm Công Hiện Trường
              </h1>
              <span className="rounded-full bg-purple-100 text-purple-800 px-2 py-0.5 text-[10px] font-bold">
                Mobile-First
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Xin chào,{' '}
              <strong className="text-slate-900 font-bold">
                {employee?.fullName || userInfo?.fullName || 'Cán bộ nông nghiệp'}
              </strong>{' '}
              {employee?.position ? `(${employee.position})` : ''} • Trang trại tác nghiệp:{' '}
              <strong className="text-emerald-700 font-bold">
                {activeFarm?.farmName || activeFarm?.name || 'Văn phòng Tổng'}
              </strong>
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={handleRefreshAll}
          isLoading={isLoading}
        >
          Làm Mới
        </Button>
      </div>

      {/* KHỐI 1: Thẻ Định Danh Cá Nhân & Chấm Công Thông Minh 2 Đầu GPS + Selfie (Role 2, 3, 4, 5, 6A) */}
      <OneTapTimekeepingCard
        activeFarm={activeFarm}
        todayShift={todayShift}
        attendanceRecord={todayAttendance}
        annualLeaveQuota={employee?.annualLeaveQuota || 12.0}
        onAttendanceSuccess={handleRefreshAll}
      />

      {/* KHỐI 2: Bảng Điểm Danh & Chấm Công Tổ Hộ Lao Động Không Có Tài Khoản (Chỉ Role 2, Role 3, Role 4) */}
      {canRollCallTeam && (
        <TeamRollCallPanel
          activeFarm={activeFarm}
          shifts={shifts}
          employees={employees}
          todayAttendances={todayAttendances}
          onRefresh={handleRefreshAll}
        />
      )}

      {/* KHỐI 3: QUẢN LÝ CÔNG VIỆC HIỆN TRƯỜNG */}
      {fieldWorker ? (
        // GIAO DIỆN DÀNH CHO NHÂN VIÊN HIỆN TRƯỜNG CÓ TÀI KHOẢN (ROLE 6A)
        <WorkerDailyTasksView
          tasks={tasks}
          currentEmployee={employee}
          onRefresh={fetchTasks}
        />
      ) : canSuperviseTasks ? (
        // GIAO DIỆN DÀNH CHO FARM MANAGER (ROLE 2), TRƯỞNG KỸ THUẬT (ROLE 3) & THỦ KHO (ROLE 4): 2 TABS RÕ RỆT
        <div className="space-y-4">
          {/* Thanh chuyển đổi 2 Tab */}
          <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTaskTab('ROUTINES')}
              className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all ${
                activeTaskTab === 'ROUTINES'
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <RotateCcw className="h-4 w-4 text-emerald-600" />
              <span>🔁 Công Việc Cố Định Hàng Ngày (Thiết Lập & Phân Công)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTaskTab('KANBAN')}
              className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all ${
                activeTaskTab === 'KANBAN'
                  ? 'border-blue-600 text-blue-800 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Kanban className="h-4 w-4 text-blue-600" />
              <span>📌 Bảng Tiến Độ Việc Hôm Nay & Giao Việc Phát Sinh (Kanban 4 Cột)</span>
            </button>
          </div>

          {/* Nội dung Tab 1: Công Việc Cố Định Hàng Ngày */}
          {activeTaskTab === 'ROUTINES' && (
            <DailyRoutineTaskTab
              farmId={activeFarmId}
              tasks={tasks}
              zones={zones}
              employees={employees}
              isTechnicalLead={technicalLead}
              isWarehouseKeeper={warehouseKeeper}
              onRefresh={fetchTasks}
            />
          )}

          {/* Nội dung Tab 2: Bảng Kanban & Giao Việc Phát Sinh */}
          {activeTaskTab === 'KANBAN' && (
            <PersonalTaskKanban
              tasks={tasks}
              farmId={activeFarmId}
              zones={zones}
              employees={employees}
              isTechnicalLead={technicalLead}
              isWarehouseKeeper={warehouseKeeper}
              canManageTasks={true}
              onRefresh={fetchTasks}
            />
          )}
        </div>
      ) : (
        // GIAO DIỆN DÀNH CHO CÁC VAI TRÒ KHÁC (Role 5 - Kế toán, v.v.): Chỉ xem Kanban
        <PersonalTaskKanban
          tasks={tasks}
          farmId={activeFarmId}
          zones={zones}
          employees={employees}
          canManageTasks={false}
          onRefresh={fetchTasks}
        />
      )}

      {/* KHỐI 4: Lịch Ca Cá Nhân & Drawer Đăng Ký Nghỉ Phép / OT */}
      <PersonalShiftScheduleCard
        activeFarm={activeFarm}
        employee={employee}
        shifts={shifts}
        annualLeaveQuota={employee?.annualLeaveQuota || 12.0}
        onRefresh={handleRefreshAll}
      />
    </div>
  );
}

export default EmployeeDailyOpsWorkspace;
