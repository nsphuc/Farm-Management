import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CreditCard,
  Lock,
  Unlock,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormControls';
import { formatDate } from '@/utils/formatters';
import { platformService } from '@/services/modules/platformService';
import { toast } from '@/store/useToastStore';

export function TenantsConsole({
  tenants = [],
  isLoading = false,
  onRefresh,
  onOpenCreateModal,
  onOpenUpgradeModal,
  onSelectTenant,
}) {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, SUSPENDED

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const q = keyword.trim().toLowerCase();
      const matchKeyword =
        !q ||
        t.code?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q) ||
        t.subdomain?.toLowerCase().includes(q) ||
        t.ownerFullName?.toLowerCase().includes(q) ||
        t.ownerEmail?.toLowerCase().includes(q);

      return matchStatus && matchKeyword;
    });
  }, [tenants, keyword, statusFilter]);

  const handleToggleStatus = async (tenant) => {
    const isSuspended = tenant.status === 'SUSPENDED';
    const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
    const actionLabel = isSuspended ? 'MỞ KHÓA HOẠT ĐỘNG' : 'TẠM KHÓA';

    const confirmMsg = isSuspended
      ? `Xác nhận MỞ KHÓA cho doanh nghiệp "${tenant.name}" (${tenant.code})? Người dùng sẽ có thể đăng nhập bình thường.`
      : `CẢNH BÁO: TẠM KHÓA doanh nghiệp "${tenant.name}" (${tenant.code}) sẽ THU HỒI NGAY LẬP TỨC toàn bộ phiên đăng nhập của tất cả nhân sự thuộc doanh nghiệp này. Bạn có chắc chắn muốn khóa?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await platformService.updateTenantStatus(tenant.id, { status: newStatus });
      toast.success(`Đã ${actionLabel.toLowerCase()} doanh nghiệp "${tenant.name}" thành công!`);
      onRefresh?.();
    } catch (err) {
      console.error('Toggle tenant status error:', err);
      toast.error(err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái doanh nghiệp');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Bàn Quản Trị Khách Thuê Doanh Nghiệp (Tenants Console)
            </h2>
            <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-bold border border-slate-200">
              {filteredTenants.length} Doanh nghiệp
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát hạn mức tài nguyên trang trại, tình trạng hợp đồng và quản lý trạng thái hoạt động khách thuê
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={onRefresh}
            title="Tải lại danh sách khách thuê"
          >
            Làm mới
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={onOpenCreateModal}
            className="bg-rose-600 hover:bg-rose-700 font-bold"
          >
            + Khởi Tạo Khách Thuê Mới
          </Button>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã, tên, subdomain hoặc chủ đầu tư..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Trạng thái:</span>
          {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                statusFilter === st
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'Tất Cả' : st === 'ACTIVE' ? 'Đang Hoạt Động' : 'Tạm Khóa'}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Mã & Doanh Nghiệp</th>
              <th className="py-3 px-3.5">Chủ Đầu Tư</th>
              <th className="py-3 px-3.5">Gói Thuê Bao & Thời Hạn</th>
              <th className="py-3 px-3.5">Hạn Mức Trang Trại</th>
              <th className="py-3 px-3.5">Hạn Mức Người Dùng</th>
              <th className="py-3 px-3.5 text-center">Trạng Thái</th>
              <th className="py-3 px-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-slate-400 mb-2" />
                  Đang tải danh sách khách thuê...
                </td>
              </tr>
            ) : filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  Không tìm thấy doanh nghiệp nào phù hợp với điều kiện tìm kiếm.
                </td>
              </tr>
            ) : (
              filteredTenants.map((t) => {
                const activeSub = t.activeSubscription;
                const usage = t.currentUsage || { totalFarms: 0, totalUsers: 0 };
                const maxFarms = activeSub?.maxFarms || 1;
                const farmPercent = Math.min(100, Math.round(((usage.totalFarms || 0) / maxFarms) * 100));

                const maxUsers = activeSub?.maxUsers || 5;
                const userPercent = Math.min(100, Math.round(((usage.totalUsers || 0) / maxUsers) * 100));

                const isSuspended = t.status === 'SUSPENDED';
                const remaining = activeSub?.remainingDays ?? null;

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Cột 1: Mã & Doanh Nghiệp */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                          {t.code?.slice(0, 2) || 'TN'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{t.name}</span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {t.code}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                            {t.subdomain}.nongtrai.vn
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Chủ Đầu Tư */}
                    <td className="py-3 px-3.5">
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">{t.ownerFullName || t.owner?.fullName || '---'}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                          {t.ownerEmail || t.owner?.email || '---'}
                        </div>
                      </div>
                    </td>

                    {/* Cột 3: Gói Thuê Bao & Thời Hạn */}
                    <td className="py-3 px-3.5">
                      <div className="space-y-1">
                        <span className="font-black text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                          {t.subscriptionPlan || activeSub?.planType || 'STARTER'}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {activeSub?.validTo ? (
                            <span
                              className={`font-semibold ${
                                activeSub.isExpired
                                  ? 'text-rose-600 font-bold'
                                  : remaining !== null && remaining <= 30
                                  ? 'text-amber-600 font-bold'
                                  : 'text-slate-600'
                              }`}
                            >
                              Hết hạn: {formatDate(activeSub.validTo)}{' '}
                              {remaining !== null && `(${remaining} ngày)`}
                            </span>
                          ) : (
                            'Chưa thiết lập'
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cột 4: Hạn Mức Trang Trại */}
                    <td className="py-3 px-3.5 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">Trang trại:</span>
                          <span className={farmPercent >= 100 ? 'text-rose-600 font-black' : 'text-slate-900'}>
                            {usage.totalFarms || 0}/{maxFarms}
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

                    {/* Cột 5: Hạn Mức Người Dùng */}
                    <td className="py-3 px-3.5 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">Nhân sự:</span>
                          <span className={userPercent >= 100 ? 'text-rose-600 font-black' : 'text-slate-900'}>
                            {usage.totalUsers || 0}/{maxUsers}
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

                    {/* Cột 6: Trạng Thái */}
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isSuspended
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <XCircle className="h-3 w-3 text-rose-500" /> Tạm Khóa
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Hoạt Động
                          </>
                        )}
                      </span>
                    </td>

                    {/* Cột 7: Thao Tác */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          icon={<CreditCard className="h-3.5 w-3.5 text-emerald-600" />}
                          onClick={() => onOpenUpgradeModal?.(t)}
                          title="Gia hạn hoặc nâng cấp gói cước"
                          className="text-emerald-700 hover:bg-emerald-50 font-bold"
                        >
                          Gói Cước
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          icon={isSuspended ? <Unlock className="h-3.5 w-3.5 text-emerald-600" /> : <Lock className="h-3.5 w-3.5 text-rose-600" />}
                          onClick={() => handleToggleStatus(t)}
                          title={isSuspended ? 'Mở khóa doanh nghiệp' : 'Tạm khóa doanh nghiệp'}
                          className={isSuspended ? 'text-emerald-700 hover:bg-emerald-50' : 'text-rose-700 hover:bg-rose-50'}
                        >
                          {isSuspended ? 'Mở Khóa' : 'Khóa'}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          icon={<Eye className="h-3.5 w-3.5 text-slate-600" />}
                          onClick={() => onSelectTenant?.(t)}
                          title="Xem chi tiết doanh nghiệp"
                        >
                          Chi Tiết
                        </Button>
                      </div>
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

