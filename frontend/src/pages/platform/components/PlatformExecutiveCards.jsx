import React from 'react';
import { Building, CreditCard, Users, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

export function PlatformExecutiveCards({ metrics = null, isLoading = false }) {
  if (isLoading && !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  const totalTenants = metrics?.totalTenants ?? 0;
  const activeTenants = metrics?.activeTenants ?? 0;
  const suspendedTenants = metrics?.suspendedTenants ?? 0;

  const totalFarms = metrics?.totalFarms ?? 0;
  const totalUsers = metrics?.totalUsers ?? 0;

  const activeSubs = metrics?.activeSubscriptionsCount ?? 0;
  const expiringSoon = metrics?.expiringSoonCount ?? 0;

  const dbStatus = metrics?.databaseStatus || 'UP';
  const jvmUsed = metrics?.jvmUsedMemoryMb ?? 0;
  const jvmMax = metrics?.jvmMaxMemoryMb ?? 1;
  const jvmPercent = Math.round((jvmUsed / (jvmMax || 1)) * 100);

  const cards = [
    {
      label: 'Tổng Doanh Nghiệp Thuê Bao',
      value: `${totalTenants} Doanh Nghiệp`,
      sub: `${activeTenants} Đang hoạt động • ${suspendedTenants} Tạm khóa`,
      icon: Building,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      label: 'Quy Mô Vận Hành Toàn Hệ Thống',
      value: `${totalFarms} Trang Trại`,
      sub: `${totalUsers} Tài khoản người dùng đã kích hoạt`,
      icon: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      label: 'Gói Cước & Thuê Bao Kích Hoạt',
      value: `${activeSubs} Hợp Đồng`,
      sub: expiringSoon > 0 ? (
        <span className="text-amber-600 font-bold flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> {expiringSoon} gói sắp hết hạn (30 ngày)
        </span>
      ) : (
        '100% hợp đồng trong hạn an toàn'
      ),
      icon: CreditCard,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Sức Khỏe Hạ Tầng & JVM',
      value: `MySQL: ${dbStatus}`,
      sub: `RAM JVM: ${jvmUsed}MB / ${jvmMax}MB (${jvmPercent}%)`,
      icon: Activity,
      color: dbStatus === 'UP' ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-amber-600 bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-medium">{c.label}</span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${c.color}`}>
              <c.icon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight">{c.value}</p>
          <div className="text-[11px] text-slate-500 mt-1 truncate">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

