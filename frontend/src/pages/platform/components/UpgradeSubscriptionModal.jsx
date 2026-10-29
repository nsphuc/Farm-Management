import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, CheckCircle2, AlertCircle, TrendingUp, Layers } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { platformService } from '@/services/modules/platformService';
import { toast } from '@/store/useToastStore';
import { extractApiErrors } from '@/utils/apiHelpers';

const PLAN_PRESETS = {
  FREE: { maxFarms: 1, maxUsers: 2, label: 'FREE (Dùng thử miễn phí)' },
  STARTER: { maxFarms: 2, maxUsers: 5, label: 'STARTER (Trang trại khởi nghiệp)' },
  PROFESSIONAL: { maxFarms: 5, maxUsers: 20, label: 'PROFESSIONAL (Chuỗi trang trại vừa & lớn)' },
  ENTERPRISE: { maxFarms: 20, maxUsers: 100, label: 'ENTERPRISE (Tập đoàn nông nghiệp đa vùng)' },
};

export function UpgradeSubscriptionModal({ isOpen, onClose, tenant = null, onSuccess }) {
  const [formData, setFormData] = useState({
    planType: 'STARTER',
    maxFarms: 2,
    maxUsers: 5,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (tenant) {
      const activeSub = tenant.activeSubscription;
      const currentPlan = activeSub?.planType || tenant.subscriptionPlan || 'STARTER';
      const preset = PLAN_PRESETS[currentPlan] || PLAN_PRESETS.STARTER;

      setFormData({
        planType: currentPlan,
        maxFarms: activeSub?.maxFarms ?? preset.maxFarms,
        maxUsers: activeSub?.maxUsers ?? preset.maxUsers,
        validFrom: activeSub?.validFrom || new Date().toISOString().split('T')[0],
        validTo: activeSub?.validTo || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setErrorMessage('');
    }
  }, [tenant]);

  if (!tenant) return null;

  const handlePlanChange = (newPlan) => {
    const preset = PLAN_PRESETS[newPlan] || PLAN_PRESETS.STARTER;
    setFormData((prev) => ({
      ...prev,
      planType: newPlan,
      maxFarms: preset.maxFarms,
      maxUsers: preset.maxUsers,
    }));
  };

  const handleExtendDuration = (months) => {
    const fromDate = formData.validFrom ? new Date(formData.validFrom) : new Date();
    const newTo = new Date(fromDate);
    newTo.setMonth(newTo.getMonth() + months);
    setFormData((prev) => ({
      ...prev,
      validTo: newTo.toISOString().split('T')[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (new Date(formData.validTo) < new Date(formData.validFrom)) {
      setErrorMessage('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        planType: formData.planType,
        maxFarms: Number(formData.maxFarms),
        maxUsers: Number(formData.maxUsers),
        validFrom: formData.validFrom,
        validTo: formData.validTo,
      };

      await platformService.addSubscription(tenant.id, payload);
      toast.success(`Đã nâng cấp/gia hạn gói cước thành công cho doanh nghiệp "${tenant.name}"!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Upgrade subscription error:', err);
      const errInfo = extractApiErrors(err);
      setErrorMessage(errInfo.message || 'Lỗi khi nâng cấp gói cước thuê bao');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`Nâng Cấp & Gia Hạn Gói Cước SaaS`}
      subtitle={`Doanh nghiệp: [${tenant.code}] ${tenant.name}`}
      icon={<CreditCard className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Thông tin hiện tại */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Gói cước hiện hành:</span>
            <span className="ml-2 font-black text-slate-800 uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200">
              {tenant.subscriptionPlan || 'STARTER'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Đang sử dụng:</span>
            <span className="ml-2 font-bold text-slate-700">
              {tenant.currentUsage?.totalFarms || 0} Trại • {tenant.currentUsage?.totalUsers || 0} Người dùng
            </span>
          </div>
        </div>

        {/* Cấu hình Gói cước mới */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Gói Thuê Bao Mới *">
            <Select
              value={formData.planType}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="font-bold text-xs"
            >
              {Object.entries(PLAN_PRESETS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Hạn Mức Trang Trại (maxFarms) *" hint="Số lượng trang trại tối đa">
            <Input
              type="number"
              min="1"
              max="500"
              value={formData.maxFarms}
              onChange={(e) => setFormData((prev) => ({ ...prev, maxFarms: e.target.value }))}
              className="font-bold"
              required
            />
          </FormField>

          <FormField label="Hạn Mức Người Dùng (maxUsers) *" hint="Số lượng user tối đa">
            <Input
              type="number"
              min="1"
              max="5000"
              value={formData.maxUsers}
              onChange={(e) => setFormData((prev) => ({ ...prev, maxUsers: e.target.value }))}
              className="font-bold"
              required
            />
          </FormField>
        </div>

        {/* Thời hạn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Ngày Bắt Đầu Hiệu Lực *">
            <Input
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData((prev) => ({ ...prev, validFrom: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Ngày Hết Hạn Gói Cước *">
            <Input
              type="date"
              value={formData.validTo}
              onChange={(e) => setFormData((prev) => ({ ...prev, validTo: e.target.value }))}
              required
            />
          </FormField>
        </div>

        {/* Phím tắt gia hạn nhanh */}
        <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
          <span>Gia hạn nhanh:</span>
          <button
            type="button"
            onClick={() => handleExtendDuration(3)}
            className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-[11px]"
          >
            +3 Tháng
          </button>
          <button
            type="button"
            onClick={() => handleExtendDuration(6)}
            className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-[11px]"
          >
            +6 Tháng
          </button>
          <button
            type="button"
            onClick={() => handleExtendDuration(12)}
            className="px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px]"
          >
            +1 Năm (12 Tháng)
          </button>
          <button
            type="button"
            onClick={() => handleExtendDuration(24)}
            className="px-2 py-0.5 rounded-md border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold text-[11px]"
          >
            +2 Năm
          </button>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<CheckCircle2 className="h-4 w-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 font-bold"
          >
            Cập Nhật Gói Cước & Hạn Mức Tức Thì
          </Button>
        </div>
      </form>
    </Modal>
  );
}

