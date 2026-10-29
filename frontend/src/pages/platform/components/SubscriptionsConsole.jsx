import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { formatDate } from '@/utils/formatters';

export function SubscriptionsConsole({
  tenants = [],
  isLoading = false,
  onRefresh,
  onOpenUpgradeModal,
}) {
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, EXPIRING, EXPIRED, QUOTA_FULL

  const filteredItems = useMemo(() => {
    return tenants.filter((t) => {
      const activeSub = t.activeSubscription;
      const usage = t.currentUsage || { totalFarms: 0, totalUsers: 0 };
      const maxFarms = activeSub?.maxFarms || 1;
      const maxUsers = activeSub?.maxUsers || 5;
      const farmPercent = (usage.totalFarms || 0) / maxFarms;
      const userPercent = (usage.totalUsers || 0) / maxUsers;
      const remaining = activeSub?.remainingDays ?? 999;
      const isExpired = activeSub?.isExpired ?? false;

      // Filter by type
      if (filterType === 'EXPIRING' && (remaining > 30 || isExpired)) return false;
      if (filterType === 'EXPIRED' && !isExpired) return false;
      if (filterType === 'QUOTA_FULL' && farmPercent < 0.8 && userPercent < 0.8) return false;

      // Search keyword
      const q = keyword.trim().toLowerCase();
      if (q) {
        const match =
          t.code?.toLowerCase().includes(q) ||
          t.name?.toLowerCase().includes(q) ||
          t.subscriptionPlan?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [tenants, keyword, filterType]);

  // Statistics
  const stats = useMemo(() => {
    let expiringCount = 0;
    let expiredCount = 0;
    let nearQuotaCount = 0;

    tenants.forEach((t) => {
      const sub = t.activeSubscription;
      const usage = t.currentUsage || {};
      const maxFarms = sub?.maxFarms || 1;
      const maxUsers = sub?.maxUsers || 5;

      if (sub?.isExpired) expiredCount++;
      else if ((sub?.remainingDays ?? 999) <= 30) expiringCount++;

      if ((usage.totalFarms || 0) / maxFarms >= 0.8 || (usage.totalUsers || 0) / maxUsers >= 0.8) {
        nearQuotaCount++;
      }
    });

    return { expiringCount, expiredCount, nearQuotaCount, total: tenants.length };
  }, [tenants]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Quản Trị Hợp Đồng Gói Cước & Hạn Mức SaaS (Subscriptions Hub)
            </h2>
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold border border-emerald-300">
              {filteredItems.length} Hợp đồng
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi kỳ hạn hợp đồng, tỷ lệ sử dụng quota trang trại/người dùng và gia hạn nâng cấp trực tiếp
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={onRefresh}
        >
          Làm mới
        </Button>
      </div>

      {/* FILTER BUTTONS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên doanh nghiệp, mã hoặc gói cước..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất Cả ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('EXPIRING')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filterType === 'EXPIRING'
                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            Sắp Hết Hạn ({stats.expiringCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('EXPIRED')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filterType === 'EXPIRED'
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Đã Hết Hạn ({stats.expiredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('QUOTA_FULL')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filterType === 'QUOTA_FULL'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
            }`}
          >
            Gần Chạm Quota ≥80% ({stats.nearQuotaCount})
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Khách Thuê (Tenant)</th>
              <th className="py-3 px-3.5">Gói Thuê Bao (Plan)</th>
              <th className="py-3 px-3.5">Hạn Mức Trang Trại</th>
              <th className="py-3 px-3.5">Hạn Mức Người Dùng</th>
              <th className="py-3 px-3.5">Ngày Hiệu Lực</th>
              <th className="py-3 px-3.5">Ngày Hết Hạn & Còn Lại</th>
              <th className="py-3 px-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-slate-400 mb-2" />
                  Đang tải hợp đồng gói cước...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  Không tìm thấy hợp đồng nào phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              filteredItems.map((t) => {
                const sub = t.activeSubscription;
                const usage = t.currentUsage || { totalFarms: 0, totalUsers: 0 };
                const maxFarms = sub?.maxFarms || 1;
                const farmPercent = Math.min(100, Math.round(((usage.totalFarms || 0) / maxFarms) * 100));

                const maxUsers = sub?.maxUsers || 5;
                const userPercent = Math.min(100, Math.round(((usage.totalUsers || 0) / maxUsers) * 100));

                const remaining = sub?.remainingDays ?? null;

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">[{t.code}] • {t.subdomain}.nongtrai.vn</div>
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="font-black text-[10px] px-2.5 py-1 rounded-full bg-slate-900 text-white uppercase tracking-wider">
                        {t.subscriptionPlan || sub?.planType || 'STARTER'}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span>{usage.totalFarms || 0}/{maxFarms} Trại</span>
                          <span className={farmPercent >= 100 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                            {farmPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              farmPercent >= 100 ? 'bg-rose-500' : farmPercent >= 80 ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${farmPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span>{usage.totalUsers || 0}/{maxUsers} Users</span>
                          <span className={userPercent >= 100 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                            {userPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              userPercent >= 100 ? 'bg-rose-500' : userPercent >= 80 ? 'bg-amber-500' : 'bg-purple-600'
                            }`}
                            style={{ width: `${userPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-slate-600">
                      {sub?.validFrom ? formatDate(sub.validFrom) : '---'}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800">
                          {sub?.validTo ? formatDate(sub.validTo) : '---'}
                        </div>
                        <div>
                          {sub?.isExpired ? (
                            <span className="font-bold text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              ĐÃ HẾT HẠN
                            </span>
                          ) : remaining !== null && remaining <= 30 ? (
                            <span className="font-bold text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" /> Còn {remaining} ngày
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              Còn {remaining || 0} ngày
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <Button
                        type="button"
                        variant="primary"
                        size="xs"
                        icon={<CreditCard className="h-3.5 w-3.5" />}
                        onClick={() => onOpenUpgradeModal?.(t)}
                        className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                      >
                        Nâng Cấp / Gia Hạn
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

