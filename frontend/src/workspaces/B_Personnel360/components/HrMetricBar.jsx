import React from 'react';
import { Users, HardHat, Building2, CalendarOff, Clock } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';

/**
 * HR Metric Bar Component (Điều 2.2 File 08 & Mục 4.5 File 09)
 * Hiển thị 5 thẻ KPI nhân sự chuẩn mực:
 * 1. Tổng nhân sự
 * 2. Nhân sự hiện trường (farmId != null)
 * 3. Nhân sự văn phòng (farmId == null)
 * 4. Đang nghỉ phép hôm nay
 * 5. Tổng giờ công trong tháng
 */
export function HrMetricBar({ metrics = {}, className }) {
  const {
    totalEmployees = 0,
    fieldStaff = 0,
    officeStaff = 0,
    onLeaveToday = 0,
    monthlyTotalHours = 0,
  } = metrics;

  const CARDS = [
    {
      id: 'total',
      label: 'Tổng Nhân Sự',
      value: totalEmployees,
      unit: 'người',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-200 ring-blue-500/20',
    },
    {
      id: 'field',
      label: 'Nhân Sự Hiện Trường',
      value: fieldStaff,
      unit: 'người',
      icon: HardHat,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200 ring-emerald-500/20',
    },
    {
      id: 'office',
      label: 'Nhân Sự Văn Phòng',
      value: officeStaff,
      unit: 'người',
      icon: Building2,
      color: 'text-purple-600 bg-purple-50 border-purple-200 ring-purple-500/20',
    },
    {
      id: 'leave',
      label: 'Nghỉ Phép Hôm Nay',
      value: onLeaveToday,
      unit: 'người',
      icon: CalendarOff,
      color: 'text-amber-600 bg-amber-50 border-amber-200 ring-amber-500/20',
    },
    {
      id: 'hours',
      label: 'Tổng Giờ Công Tháng',
      value: formatNumber(monthlyTotalHours, 1),
      unit: 'giờ',
      icon: Clock,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200 ring-indigo-500/20',
    },
  ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 ${className || ''}`}>
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:shadow-xs hover:border-slate-300"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ring-1 ${card.color}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-500 truncate">{card.label}</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-slate-900 tracking-tight font-mono">
                  {card.value}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">{card.unit}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default HrMetricBar;
