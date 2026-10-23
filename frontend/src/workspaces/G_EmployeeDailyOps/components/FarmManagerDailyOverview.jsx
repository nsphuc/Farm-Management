import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Layers,
  Warehouse,
  Sprout,
  AlertCircle,
  Activity,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  CalendarCheck,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { hrService } from '@/services/modules/hrService';
import { qaService } from '@/services/modules/qaService';
import { inventoryService } from '@/services/modules/inventoryService';
import { geographyService } from '@/services/modules/geographyService';
import { formatNumber } from '@/utils/formatters';

const ZONE_TYPE_LABELS = {
  CROP: 'Trồng Trọt',
  LIVESTOCK: 'Chăn Nuôi',
  PROCESSING: 'Sơ Chế & Chế Biến',
  GREENHOUSE: 'Nhà Màng / Nhà Kính',
  OPEN_FIELD: 'Đồng Ruộng Mở',
};

/**
 * FarmManagerDailyOverview (Mục 2 Khối 2 WS-G)
 * Bảng Tổng Quan Quân Số Đi Làm Hôm Nay & Các Việc Chờ Giám Đốc Trại Duyệt:
 * 1. 4 Thẻ Chỉ Số Nhanh Trong Ngày Của Trại:
 *    - Quân số đã điểm danh hôm nay / Tổng nhân sự trại -> WS-B Tab 3 (Bảng công)
 *    - Đơn xin nghỉ phép & OT đang chờ duyệt -> WS-B Tab 4 (Nghỉ phép & OT)
 *    - Lô thành phẩm đang chờ Giám đốc trại duyệt KCS -> WS-F
 *    - Tiến độ công việc hiện trường hôm nay (Hoàn thành / Tổng số việc)
 * 2. Bảng Tóm Tắt Tiến Độ Theo Từng Phân Khu & Kho Trong Ngày:
 *    - Phân khu: quân số đi làm, Trưởng khu, việc đã xong / đang làm
 *    - Kho bãi: thủ kho phụ trách, quân số đi làm, tình trạng
 */
export function FarmManagerDailyOverview({
  farmId,
  activeFarm,
  employees = [],
  todayAttendances = [],
  tasks = [],
  zones = [],
  assignments = [],
  onRefresh,
}) {
  const navigate = useNavigate();
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [pendingOtCount, setPendingOtCount] = useState(0);
  const [pendingBatchesCount, setPendingBatchesCount] = useState(0);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // 1. Tải số lượng đơn nghỉ phép, OT và lô KCS đang chờ duyệt
  useEffect(() => {
    let isMounted = true;

    async function loadPendingApprovals() {
      if (!farmId || farmId === 'ALL') return;
      setIsLoadingStats(true);
      try {
        const [leavesRes, otRes, batchesRes] = await Promise.allSettled([
          hrService.getLeaveRequests({ farmId, status: 'PENDING' }),
          hrService.getOvertimeRequests({ farmId, status: 'PENDING' }),
          qaService.getProductBatches({ farmId, status: 'PENDING_APPROVAL' }),
        ]);

        if (isMounted) {
          if (leavesRes.status === 'fulfilled') {
            const leaves = leavesRes.value?.content || (Array.isArray(leavesRes.value) ? leavesRes.value : []);
            setPendingLeaveCount(leaves.length);
          }
          if (otRes.status === 'fulfilled') {
            const ots = otRes.value?.content || (Array.isArray(otRes.value) ? otRes.value : []);
            setPendingOtCount(ots.length);
          }
          if (batchesRes.status === 'fulfilled') {
            const batches = batchesRes.value?.content || (Array.isArray(batchesRes.value) ? batchesRes.value : []);
            setPendingBatchesCount(batches.length);
          }
        }
      } catch (err) {
        console.error('Failed to load pending approvals in FarmManagerDailyOverview', err);
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    }

    loadPendingApprovals();
    return () => {
      isMounted = false;
    };
  }, [farmId]);

  // 2. Tính toán các chỉ số thống kê
  const totalEmployees = employees.length;
  // Đếm số nhân sự duy nhất đã check-in hôm nay
  const attendedEmployeeIds = new Set(
    todayAttendances
      .filter((a) => a.checkInTime)
      .map((a) => a.employeeId)
  );
  const checkedInCount = attendedEmployeeIds.size;
  const attendanceRate = totalEmployees > 0 ? Math.round((checkedInCount / totalEmployees) * 100) : 0;

  const totalPendingForms = pendingLeaveCount + pendingOtCount;

  // Công việc hiện trường hôm nay
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE' || t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const taskProgressRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Lấy thủ kho trang trại
  const warehouseKeeperAssignment = assignments.find((a) => a.roleInFarm === 'WAREHOUSE_KEEPER');
  const warehouseKeeperEmployee = employees.find(
    (e) => e.position === 'WAREHOUSE_KEEPER' || e.id === warehouseKeeperAssignment?.employeeId
  );

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. 4 THẺ CHỈ SỐ NHANH TRONG NGÀY CỦA TRANG TRẠI          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Quân Số Đã Điểm Danh Hôm Nay */}
        <div
          onClick={() => navigate('/app/hr?tab=attendance')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-white p-4 sm:p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Quân Số Đi Làm Hôm Nay
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {checkedInCount}
            </span>
            <span className="text-sm font-bold text-slate-400">/ {totalEmployees} nhân sự</span>
            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              {attendanceRate}%
            </span>
          </div>

          {/* Thanh Tiến Độ Tỷ Lệ Điểm Danh */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-700 font-semibold group-hover:underline">
            <span>Bảng công & điều chỉnh giờ công</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Thẻ 2: Đơn Xin Nghỉ Phép & OT Chờ Duyệt */}
        <div
          onClick={() => navigate('/app/hr?tab=leave_ot')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-white p-4 sm:p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Đơn Nghỉ Phép & OT Chờ Duyệt
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalPendingForms}
            </span>
            <span className="text-xs font-bold text-slate-500">đơn cần duyệt</span>
            {totalPendingForms > 0 && (
              <span className="ml-auto rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                Cần duyệt gấp
              </span>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-600 line-clamp-1">
            <strong className="text-amber-700 font-bold">{pendingLeaveCount}</strong> nghỉ phép •{' '}
            <strong className="text-orange-700 font-bold">{pendingOtCount}</strong> làm thêm giờ (OT)
          </p>

          <div className="mt-3 flex items-center justify-between text-[11px] text-amber-700 font-semibold group-hover:underline">
            <span>Duyệt đơn tại WS-B Tab 4</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Thẻ 3: Lô Thành Phẩm Chờ Duyệt KCS */}
        <div
          onClick={() => navigate('/app/qa-traceability')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-white p-4 sm:p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Lô Chờ Duyệt KCS & QR
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {pendingBatchesCount}
            </span>
            <span className="text-xs font-bold text-slate-500">lô thành phẩm</span>
            {pendingBatchesCount > 0 ? (
              <span className="ml-auto rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                Chờ duyệt
              </span>
            ) : (
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                Đã sạch hàng
              </span>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-600 truncate">
            Phê duyệt đạt chuẩn KCS & kích hoạt mã QR
          </p>

          <div className="mt-3 flex items-center justify-between text-[11px] text-blue-700 font-semibold group-hover:underline">
            <span>Mở đường ống QA & QR (WS-F)</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Thẻ 4: Tiến Độ Công Việc Hôm Nay */}
        <div className="group relative overflow-hidden rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-white p-4 sm:p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              Tiến Độ Công Việc Hôm Nay
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {completedTasks}
            </span>
            <span className="text-sm font-bold text-slate-400">/ {totalTasks} việc</span>
            <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
              {taskProgressRate}%
            </span>
          </div>

          {/* Thanh Tiến Độ Công Việc */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
              style={{ width: `${taskProgressRate}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>
              <strong className="text-indigo-700">{inProgressTasks}</strong> đang làm •{' '}
              <strong className="text-slate-700">{totalTasks - completedTasks - inProgressTasks}</strong> chờ
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BẢNG TÓM TẮT TIẾN ĐỘ THEO TỪNG PHÂN KHU & KHO        */}
      {/* ======================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Tiến Độ Hoạt Động Theo Từng Phân Khu & Kho Bãi Trong Ngày
              </h2>
              <p className="text-xs text-slate-500">
                Theo dõi trực quan quân số có mặt thực tế, trưởng bộ phận phụ trách và tỷ lệ hoàn thành công việc
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<MapPin className="h-3.5 w-3.5" />}
              onClick={() => navigate('/app/geography')}
            >
              Mặt Bằng & Phân Khu (WS-A)
            </Button>
          </div>
        </div>

        {/* Danh Sách Các Phân Khu Sản Xuất */}
        {zones.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
            <Sprout className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Chưa có phân khu sản xuất nào được thiết lập</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Trang trại này chưa được cấu hình phân khu. Bạn có thể đề xuất mở phân khu mới tại WS-A.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-2"
              onClick={() => navigate('/app/geography')}
            >
              Đến WS-A: Thiết Lập Phân Khu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => {
              // Tìm Trưởng phân khu
              const zoneLeadAssignment = assignments.find(
                (a) =>
                  a.zoneId === zone.id &&
                  ['ZONE_MANAGER', 'TECHNICAL_LEAD', 'AGRONOMIST', 'VETERINARIAN'].includes(a.roleInFarm)
              );
              const zoneLeadName =
                zoneLeadAssignment?.employeeFullName ||
                zone.managerFullName ||
                employees.find((e) => e.userId === zone.managerUserId)?.fullName ||
                'Chưa phân công';

              // Đếm số nhân viên thuộc phân khu
              const zoneEmployees = employees.filter(
                (e) => e.zoneId === zone.id || assignments.some((a) => a.zoneId === zone.id && a.employeeId === e.id)
              );
              const zoneAttendedCount = zoneEmployees.filter((e) => attendedEmployeeIds.has(e.id)).length;

              // Đếm công việc của phân khu
              const zoneTasks = tasks.filter((t) => t.zoneId === zone.id);
              const zoneDoneTasks = zoneTasks.filter((t) => t.status === 'DONE' || t.status === 'COMPLETED').length;
              const zoneInProgressTasks = zoneTasks.filter((t) => t.status === 'IN_PROGRESS').length;
              const zoneRate = zoneTasks.length > 0 ? Math.round((zoneDoneTasks / zoneTasks.length) * 100) : 100;

              return (
                <div
                  key={zone.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-3"
                >
                  {/* Header Phân Khu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800">
                          {ZONE_TYPE_LABELS[zone.zoneType] || zone.zoneType || 'Phân Khu'}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-400">
                          {zone.code}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm mt-1 truncate">
                        {zone.name}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        zoneRate === 100 && zoneTasks.length > 0
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : zoneTasks.length === 0
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {zoneTasks.length === 0 ? 'Chưa giao việc' : `${zoneRate}%`}
                    </span>
                  </div>

                  {/* Thông tin Trưởng khu & Nhân sự */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="rounded-xl bg-white p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Trưởng Phân Khu</span>
                      <span className="font-bold text-slate-800 truncate block mt-0.5" title={zoneLeadName}>
                        {zoneLeadName}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Quân Số Có Mặt</span>
                      <span className="font-bold text-emerald-700 block mt-0.5">
                        {zoneAttendedCount} / {zoneEmployees.length} đi làm
                      </span>
                    </div>
                  </div>

                  {/* Tiến độ công việc */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Việc phân khu:</span>
                      <span className="font-bold text-slate-800">
                        {zoneDoneTasks}/{zoneTasks.length} xong {zoneInProgressTasks > 0 ? `(${zoneInProgressTasks} đang làm)` : ''}
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                        style={{ width: `${zoneRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Khối Kho Bãi Của Trang Trại */}
        <div className="rounded-2xl border border-cyan-200/80 bg-gradient-to-r from-cyan-50/40 via-white to-blue-50/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-xs shrink-0">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Khu Vực Kho Bãi & Vật Tư Trang Trại
                </h4>
                <span className="rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 px-2 py-0.2 text-[9px] font-bold">
                  Chế độ Giám sát
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Thủ kho phụ trách:{' '}
                <strong className="text-slate-900">
                  {warehouseKeeperEmployee?.fullName || warehouseKeeperAssignment?.employeeFullName || 'Lê Thị Thủ Kho'}
                </strong>{' '}
                • Theo dõi tồn kho vật tư, phân bón, thuốc BVTV và thành phẩm
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Warehouse className="h-3.5 w-3.5 text-cyan-600" />}
            onClick={() => navigate('/app/inventory')}
            className="shrink-0 border-cyan-300 text-cyan-800 hover:bg-cyan-50"
          >
            Theo Dõi Kho Bãi (WS-C)
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FarmManagerDailyOverview;
