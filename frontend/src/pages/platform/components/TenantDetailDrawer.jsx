import React from 'react';
import {
  X,
  Building,
  User,
  CreditCard,
  Layers,
  Calendar,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';

export function TenantDetailDrawer({
  isOpen,
  onClose,
  tenant,
  onOpenUpgradeModal,
  onToggleStatus,
}) {
  if (!isOpen || !tenant) return null;

  const activeSub = tenant.activeSubscription;
  const currentUsage = tenant.currentUsage || { totalFarms: 0, totalUsers: 0 };
  const owner = tenant.owner;

  const maxFarms = activeSub?.maxFarms || 1;
  const totalFarms = currentUsage.totalFarms || 0;
  const farmPercent = Math.min(100, Math.round((totalFarms / maxFarms) * 100));

  const maxUsers = activeSub?.maxUsers || 5;
  const totalUsers = currentUsage.totalUsers || 0;
  const userPercent = Math.min(100, Math.round((totalUsers / maxUsers) * 100));

  const isSuspended = tenant.status === 'SUSPENDED';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-white shadow-2xl transition-all flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  [{tenant.code}] {tenant.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-slate-500">{tenant.subdomain}.nongtrai.vn</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isSuspended
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isSuspended ? 'TẠM KHÓA' : 'HOẠT ĐỘNG'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* THÔNG TIN CHỦ ĐẦU TƯ */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <User className="h-4 w-4 text-purple-600" />
                <span>Chủ Đầu Tư Đại Diện (ROLE_FARM_OWNER)</span>
              </div>

              {owner ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Họ và tên:</span>
                    <span className="font-bold text-slate-900">{owner.fullName || tenant.ownerFullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Tên đăng nhập:</span>
                    <span className="font-mono font-semibold text-slate-800">{owner.username}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Email:</span>
                    <span className="font-semibold text-blue-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {owner.email || tenant.ownerEmail}
                    </span>
                  </div>
                  {owner.phone && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Số điện thoại:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {owner.phone || tenant.ownerPhone}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Trạng thái tài khoản:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                      {owner.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic py-2">
                  Chưa có thông tin chủ đầu tư liên kết hoặc tài khoản chưa kích hoạt.
                </div>
              )}
            </div>

            {/* GÓI CƯỚC & THỜI HẠN */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span>Hợp Đồng Gói Cước SaaS</span>
                </div>
                <span className="font-black text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                  {tenant.subscriptionPlan || activeSub?.planType || 'STARTER'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Ngày bắt đầu hiệu lực:</span>
                  <span className="font-semibold text-slate-800">{activeSub?.validFrom ? formatDate(activeSub.validFrom) : '---'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Ngày hết hạn hợp đồng:</span>
                  <span className="font-semibold text-slate-800">{activeSub?.validTo ? formatDate(activeSub.validTo) : '---'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Thời hạn còn lại:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      activeSub?.isExpired
                        ? 'bg-rose-100 text-rose-800 font-black'
                        : (activeSub?.remainingDays || 0) <= 30
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {activeSub?.isExpired ? 'ĐÃ HẾT HẠN' : `${activeSub?.remainingDays || 0} ngày`}
                  </span>
                </div>
              </div>
            </div>

            {/* TIẾN TRÌNH HẠN MỨC (QUOTA METRICS) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>Tiến Trình Sử Dụng Hạn Mức Quota</span>
              </div>

              {/* Trang trại */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Quy mô Trang trại:</span>
                  <span className={farmPercent >= 100 ? 'text-rose-600 font-black' : 'text-slate-900'}>
                    {totalFarms} / {maxFarms} Trại ({farmPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      farmPercent >= 100 ? 'bg-rose-500' : farmPercent >= 80 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${farmPercent}%` }}
                  />
                </div>
                {farmPercent >= 100 && (
                  <p className="text-[10px] text-rose-600 font-medium">Đã chạm trần quota! Chủ đầu tư không thể tạo thêm trang trại.</p>
                )}
              </div>

              {/* Người dùng */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Tài khoản Người dùng:</span>
                  <span className={userPercent >= 100 ? 'text-rose-600 font-black' : 'text-slate-900'}>
                    {totalUsers} / {maxUsers} Users ({userPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      userPercent >= 100 ? 'bg-rose-500' : userPercent >= 80 ? 'bg-amber-500' : 'bg-purple-600'
                    }`}
                    style={{ width: `${userPercent}%` }}
                  />
                </div>
                {userPercent >= 100 && (
                  <p className="text-[10px] text-rose-600 font-medium">Đã chạm trần quota! Cần nâng cấp gói để tạo thêm nhân viên.</p>
                )}
              </div>
            </div>

            {/* DẤU VẾT THỜI GIAN */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500 space-y-1">
              <div>Ngày khởi tạo hệ thống: {tenant.createdAt ? formatDate(tenant.createdAt) : '---'}</div>
              <div>Cập nhật gần nhất: {tenant.updatedAt ? formatDate(tenant.updatedAt) : '---'}</div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 font-bold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
              icon={<CreditCard className="h-4 w-4 text-emerald-600" />}
              onClick={() => {
                onClose();
                onOpenUpgradeModal?.(tenant);
              }}
            >
              Nâng Cấp Gói
            </Button>

            <Button
              type="button"
              variant={isSuspended ? 'success' : 'danger'}
              size="sm"
              className="flex-1 font-bold"
              icon={isSuspended ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              onClick={() => {
                onToggleStatus?.(tenant);
              }}
            >
              {isSuspended ? 'Mở Khóa Doanh Nghiệp' : 'Tạm Khóa Doanh Nghiệp'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

