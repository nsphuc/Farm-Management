import React, { useState } from 'react';
import { Users, Plus, Trash2, Calendar, ShieldCheck, UserCheck, Info, RefreshCw, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/common/Can';
import { formatDate } from '@/utils/formatters';
import { useAuthStore } from '@/store/useAuthStore';

const ROLE_BADGE_STYLES = {
  FARM_MANAGER: 'bg-purple-100 text-purple-800 border-purple-200',
  ZONE_MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
  TECHNICAL_LEAD: 'bg-amber-100 text-amber-800 border-amber-200',
  ACCOUNTANT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  AGRONOMIST: 'bg-teal-100 text-teal-800 border-teal-200',
  VETERINARIAN: 'bg-rose-100 text-rose-800 border-rose-200',
  WAREHOUSE_KEEPER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  FIELD_WORKER: 'bg-slate-100 text-slate-800 border-slate-200',
};

const ROLE_LABELS = {
  FARM_MANAGER: 'Giám Đốc Trang Trại',
  ZONE_MANAGER: 'Trưởng Phân Khu',
  TECHNICAL_LEAD: 'Trưởng Kỹ Thuật',
  ACCOUNTANT: 'Kế Toán Trang Trại',
  AGRONOMIST: 'Kỹ Sư Trồng Trọt',
  VETERINARIAN: 'Bác Sĩ Thú Y',
  WAREHOUSE_KEEPER: 'Thủ Kho',
  FIELD_WORKER: 'Công Nhân Hiện Trường',
};

export function StaffAssignmentPane({
  assignments = [],
  selectedZoneId = null,
  onOpenAssignModal,
  onDeleteAssignment,
  employees = [],
}) {
  const { isOwner, isFarmManager, isZoneManager, isTechnicalLead, isWarehouseKeeper } = useAuthStore();
  const owner = isOwner();
  const farmManager = isFarmManager();
  const zoneManager = isZoneManager ? isZoneManager() : false;
  const techLead = isTechnicalLead();
  const whKeeper = isWarehouseKeeper();

  // Đếm số lượng công nhân chi tiết
  const totalWorkers = assignments.filter((a) => a.roleInFarm === 'FIELD_WORKER' && a.isActive !== false).length;

  // Lọc phân công:
  // - Lọc bỏ các phân công đã kết thúc (isActive === false)
  // - Nếu là Owner: ẩn bảng phân công công nhân chi tiết (FIELD_WORKER) để giao diện gọn nhẹ, chỉ xem ban quản trị & phụ trách
  // - Nếu chọn zone: chỉ hiển thị cán bộ phân khu đó hoặc cán bộ quản lý
  const filteredAssignments = assignments.filter((a) => {
    if (a.isActive === false) return false;
    if (owner && a.roleInFarm === 'FIELD_WORKER') {
      return false; // Ẩn công nhân chi tiết cho Owner
    }
    if (!selectedZoneId) return true;
    return Number(a.zoneId) === Number(selectedZoneId);
  });

  const paneTitle = owner
    ? 'Ban Quản Trị & Cán Bộ Chủ Chốt Trang Trại'
    : selectedZoneId
    ? 'Danh Sách Cán Bộ & Nhân Sự Phụ Trách Phân Khu'
    : farmManager
    ? 'Phân Công Cấp 1: Phụ Trách Phân Khu / Kho / Kế Toán'
    : zoneManager
    ? 'Danh Sách Tổ Viên Phân Khu Phụ Trách'
    : techLead || whKeeper
    ? 'Danh Sách Nhân Sự Thuộc Khu Vực / Kho'
    : 'Phân Công Nhân Sự Hiện Trường';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            {paneTitle} ({filteredAssignments.length})
          </h3>
        </div>

        <Can permission="PERM_ZONE_MANAGE">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenAssignModal?.(null)}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            {selectedZoneId
              ? '+ Phân Công Nhân Sự Vào Phân Khu'
              : farmManager && !owner
              ? '+ Phân Công Trưởng Phân Khu / Phụ Trách Bộ Phận'
              : '+ Phân Công Nhân Sự'}
          </Button>
        </Can>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">
          {selectedZoneId
            ? 'Chưa có cán bộ hay nhân sự nào được phân công phụ trách phân khu này.'
            : 'Chưa có cán bộ nào được phân công tại phạm vi này.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAssignments.map((a) => {
            const empMatch = employees.find(
              (e) => (a.employeeId && Number(e.id) === Number(a.employeeId)) ||
                     (a.userId && Number(e.userId) === Number(a.userId)) ||
                     (e.employeeCode && e.employeeCode === a.employeeCode)
            );
            const departmentName = a.department || empMatch?.department;
            const empCode = a.employeeCode || empMatch?.employeeCode;
            const fullName = a.userFullName || empMatch?.fullName || a.username || (empCode ? `NV ${empCode}` : `User #${a.userId || a.id}`);
            const badgeClass =
              ROLE_BADGE_STYLES[a.roleInFarm] || 'bg-slate-100 text-slate-800 border-slate-200';
            const roleName = ROLE_LABELS[a.roleInFarm] || a.roleInFarm;

            return (
              <div
                key={`assign-${a.id}-${a.employeeCode || a.userId || a.employeeId || a.id}`}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="font-bold text-xs text-slate-900">
                      {fullName}
                    </span>
                    {empCode && (
                      <span className="font-mono text-[10px] text-slate-400">
                        ({empCode})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
                    >
                      {roleName}
                    </span>
                    {departmentName && (
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-medium">
                        {departmentName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>
                      {formatDate(a.assignedFrom)} &rarr; {a.assignedTo ? formatDate(a.assignedTo) : 'Hiện tại'}
                    </span>
                  </div>

                  {a.zoneName && (
                    <div className="text-[11px] text-blue-700 font-semibold">
                      Phụ trách: {a.zoneName}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                  <div className="text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      ● Đang phụ trách
                    </span>
                  </div>

                  {(owner || (farmManager && a.roleInFarm !== 'FARM_MANAGER')) && (
                    <Can permission="PERM_ZONE_MANAGE">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="text-[11px] border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                          onClick={() => onOpenAssignModal?.(a)}
                          icon={<RefreshCw className="h-3 w-3 text-slate-500" />}
                        >
                          [🔄 Thay Đổi Người Phụ Trách]
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="text-[11px] border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-medium"
                          onClick={() => onDeleteAssignment?.(a.id, a)}
                          icon={<Square className="h-3 w-3 text-rose-500" />}
                        >
                          [⏹️ Kết Thúc Phân Công]
                        </Button>
                      </div>
                    </Can>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {owner && totalWorkers > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
          <Info className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Trang trại hiện có <strong>{totalWorkers} công nhân hiện trường</strong> đang làm việc (đã thu gọn để giao diện Owner tinh gọn, phân công chi tiết do Farm Manager và Trưởng Phân Khu điều hành).
          </span>
        </div>
      )}
    </div>
  );
}
export default StaffAssignmentPane;
