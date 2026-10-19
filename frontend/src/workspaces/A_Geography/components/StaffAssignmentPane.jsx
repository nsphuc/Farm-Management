import React, { useState } from 'react';
import { Users, Plus, Trash2, Calendar, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/common/Can';
import { formatDate } from '@/utils/formatters';

const ROLE_BADGE_STYLES = {
  FARM_MANAGER: 'bg-purple-100 text-purple-800 border-purple-200',
  ZONE_MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
  TECHNICAL_LEAD: 'bg-amber-100 text-amber-800 border-amber-200',
  AGRONOMIST: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  VETERINARIAN: 'bg-rose-100 text-rose-800 border-rose-200',
  WAREHOUSE_KEEPER: 'bg-slate-100 text-slate-800 border-slate-200',
  FIELD_WORKER: 'bg-teal-100 text-teal-800 border-teal-200',
};

const ROLE_LABELS = {
  FARM_MANAGER: 'Giám Đốc Trang Trại',
  ZONE_MANAGER: 'Trưởng Phân Khu',
  TECHNICAL_LEAD: 'Trưởng Kỹ Thuật',
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
}) {
  // Lọc phân công: nếu đang chọn zone thì hiển thị phân công của zone đó + farm manager chung
  const filteredAssignments = assignments.filter((a) => {
    if (!selectedZoneId) return true;
    return a.zoneId === selectedZoneId || !a.zoneId;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Phân Công Nhân Sự Hiện Trường ({filteredAssignments.length})
          </h3>
        </div>

        <Can permission="PERM_ZONE_MANAGE">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenAssignModal}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            + Phân Công Nhân Sự
          </Button>
        </Can>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">
          Chưa có cán bộ nào được phân công tại phạm vi này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAssignments.map((a) => {
            const badgeClass =
              ROLE_BADGE_STYLES[a.roleInFarm] || 'bg-slate-100 text-slate-800 border-slate-200';
            const roleName = ROLE_LABELS[a.roleInFarm] || a.roleInFarm;

            return (
              <div
                key={a.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-slate-500" />
                    <span className="font-bold text-xs text-slate-900">
                      {a.userFullName || a.username || `User #${a.userId}`}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
                    >
                      {roleName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                    <Calendar className="h-3 w-3" />
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

                <Can permission="PERM_ZONE_MANAGE">
                  <button
                    type="button"
                    onClick={() => onDeleteAssignment?.(a.id)}
                    className="p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                    title="Xóa phân công"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Can>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default StaffAssignmentPane;
