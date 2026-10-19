import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Lock,
  Unlock,
  AlertTriangle,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { partnerService } from '@/services/modules/partnerService';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { VietQRModal } from '@/components/common/VietQRModal';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { extractApiErrors } from '@/utils/apiHelpers';

export function PartnerDetailDrawer({
  isOpen,
  onClose,
  partner = null,
  onEdit,
  onStatusChanged,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [statusLoading, setStatusLoading] = useState(false);
  const [vietQrOpen, setVietQrOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  if (!partner) return null;

  const handleToggleStatus = async (newStatus) => {
    try {
      setStatusLoading(true);
      await partnerService.updatePartnerStatus(partner.id, newStatus);
      onStatusChanged?.();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể thay đổi trạng thái đối tác!');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCopyAccount = async () => {
    if (!partner.bankAccountNo) return;
    try {
      await navigator.clipboard.writeText(partner.bankAccountNo);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {
      // Fallback
    }
  };

  const drawerTabs = [
    { id: 'overview', label: '1. Pháp Lý & Liên Hệ' },
    { id: 'credit', label: '2. Hạn Mức & Công Nợ' },
    { id: 'banking', label: '3. Tài Khoản VietQR' },
  ];

  const hasBankingInfo = Boolean(partner.bankBin && partner.bankAccountNo);

  const footer = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {partner.status === 'ACTIVE' ? (
          <Can permission="PERM_FINANCE_SALES_ORDER">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={statusLoading}
              onClick={() => handleToggleStatus('BLACKLISTED')}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              icon={<Lock className="h-3.5 w-3.5" />}
            >
              Khóa Giao Dịch
            </Button>
          </Can>
        ) : (
          <Can permission="PERM_FINANCE_SALES_ORDER">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={statusLoading}
              onClick={() => handleToggleStatus('ACTIVE')}
              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              icon={<Unlock className="h-3.5 w-3.5" />}
            >
              Mở Khóa Giao Dịch
            </Button>
          </Can>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Can permission="PERM_FINANCE_SALES_ORDER">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onEdit?.(partner)}
            icon={<Edit2 className="h-3.5 w-3.5" />}
          >
            Chỉnh Sửa Hồ Sơ
          </Button>
        </Can>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <SlideOverDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={partner.name}
        subtitle={`Mã đối tác: ${partner.code} • Tạo ngày: ${formatDate(partner.createdAt)}`}
        tabs={drawerTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        width="max-w-xl"
        footer={footer}
      >
        <div className="space-y-6">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={partner.partnerType} size="sm" />
            <StatusBadge status={partner.status} size="sm" />
            <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-800 ring-1 ring-purple-600/20">
              Tín nhiệm: Hạng {partner.creditRating || 'A'}
            </span>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Thông Tin Pháp Lý & Thuế
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Mã Số Thuế:</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">
                      {partner.taxCode || '— (Chưa đăng ký MST)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Người Liên Hệ:</span>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {partner.contactPerson || '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kênh Liên Lạc & Địa Điểm
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{partner.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{partner.email || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{partner.address || 'Chưa thiết lập địa chỉ chi tiết'}</span>
                  </div>
                </div>
              </div>

              {partner.notes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1 text-xs">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Ghi Chú Nghiệp Vụ
                  </div>
                  <p className="text-slate-600 leading-relaxed">{partner.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREDIT & DEBT */}
          {activeTab === 'credit' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">
                    Hạn Mức Tín Dụng
                  </span>
                  <div className="text-base font-black font-mono text-emerald-700 mt-1">
                    {formatCurrency(partner.creditLimit)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Giới hạn công nợ tối đa</div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">
                    Thời Hạn Thanh Toán
                  </span>
                  <div className="text-base font-black font-mono text-slate-900 mt-1">
                    {partner.paymentTermDays ?? 0} Ngày
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Tính từ ngày giao hàng</div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Dư Nợ Hiện Tại:</span>
                  <span className="font-mono font-bold text-base text-rose-700">
                    {formatCurrency(partner.currentDebt || 0)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        partner.creditLimit > 0
                          ? ((partner.currentDebt || 0) / partner.creditLimit) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0 ₫</span>
                  <span>{formatCurrency(partner.creditLimit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BANKING & VIETQR */}
          {activeTab === 'banking' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {hasBankingInfo ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-900">
                        Tài Khoản Napas 24/7 Thụ Hưởng
                      </div>
                      <span className="font-mono text-xs text-blue-700 font-bold">
                        BIN: {partner.bankBin}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-500">Ngân hàng:</span>
                        <div className="font-semibold text-slate-900">{partner.bankName}</div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-slate-500">Số tài khoản:</span>
                          <div className="font-mono font-bold text-sm text-blue-800">
                            {partner.bankAccountNo}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                          {copiedAccount ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Sao chép STK</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-500">Chủ tài khoản:</span>
                        <div className="font-mono font-bold text-xs text-slate-900 uppercase">
                          {partner.bankAccountName || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nút Xem Mã VietQR Nhanh */}
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    onClick={() => setVietQrOpen(true)}
                    icon={<QrCode className="h-4 w-4" />}
                  >
                    Xem Mã VietQR Thanh Toán Cho Đối Tác
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 space-y-2">
                  <QrCode className="h-8 w-8 mx-auto text-slate-300 stroke-1" />
                  <div>Đối tác này chưa cấu hình tài khoản ngân hàng Napas 24/7.</div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(partner)}
                  >
                    + Cập Nhật Tài Khoản Ngân Hàng
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SlideOverDrawer>

      {/* VietQR Modal */}
      {hasBankingInfo && (
        <VietQRModal
          isOpen={vietQrOpen}
          onClose={() => setVietQrOpen(false)}
          bankBin={partner.bankBin}
          bankName={partner.bankName}
          accountNo={partner.bankAccountNo}
          accountName={partner.bankAccountName}
          amount={0}
          orderCode={partner.code}
          transferContent={`THANH TOAN TIEN HANG ${partner.code}`}
        />
      )}
    </>
  );
}
export default PartnerDetailDrawer;
