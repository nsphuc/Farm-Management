import React, { useState } from 'react';
import { Building, ShieldCheck, User, Calendar, CreditCard, Sparkles, Key, AlertCircle } from 'lucide-react';
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

export function CreateTenantModal({ isOpen, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    subdomain: '',
    planType: 'STARTER',
    maxFarms: 2,
    maxUsers: 5,
    validFrom: today,
    validTo: nextYear,
    adminFullName: '',
    adminEmail: '',
    adminPassword: 'Password@2026',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePlanChange = (newPlan) => {
    const preset = PLAN_PRESETS[newPlan] || PLAN_PRESETS.STARTER;
    setFormData((prev) => ({
      ...prev,
      planType: newPlan,
      maxFarms: preset.maxFarms,
      maxUsers: preset.maxUsers,
    }));
  };

  const handleAutoFillSubdomain = (codeVal) => {
    const cleanSub = codeVal
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 30);
    setFormData((prev) => ({
      ...prev,
      code: codeVal.toUpperCase(),
      subdomain: prev.subdomain ? prev.subdomain : cleanSub,
    }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Farm@';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, adminPassword: pwd }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.code.trim()) {
      setErrorMessage('Vui lòng nhập Mã doanh nghiệp.');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMessage('Vui lòng nhập Tên doanh nghiệp.');
      return;
    }
    if (!formData.subdomain.trim()) {
      setErrorMessage('Vui lòng nhập Subdomain định danh.');
      return;
    }
    if (!formData.adminEmail.trim()) {
      setErrorMessage('Vui lòng nhập Email Chủ đầu tư.');
      return;
    }
    if (!formData.adminFullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ tên Chủ đầu tư.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        subdomain: formData.subdomain.trim().toLowerCase(),
        planType: formData.planType,
        maxFarms: Number(formData.maxFarms),
        maxUsers: Number(formData.maxUsers),
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        adminFullName: formData.adminFullName.trim(),
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminPassword: formData.adminPassword || 'Password@2026',
      };

      await platformService.createTenant(payload);
      toast.success(`Đã khởi tạo thành công doanh nghiệp "${payload.name}" và tài khoản Chủ đầu tư!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Create tenant error:', err);
      const errInfo = extractApiErrors(err);
      setErrorMessage(errInfo.message || 'Lỗi khi khởi tạo doanh nghiệp thuê bao');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Đăng Ký Doanh Nghiệp Thuê Bao Mới (Onboarding Tenant)"
      subtitle="Khởi tạo đồng thời: Khách thuê + Hợp đồng gói cước + Tài khoản Chủ đầu tư (ROLE_FARM_OWNER)"
      icon={<Building className="h-5 w-5 text-rose-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PHẦN 1: THÔNG TIN DOANH NGHIỆP */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Building className="h-4 w-4 text-blue-600" />
            <span>1. Thông Tin Doanh Nghiệp Thuê Bao</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Mã Khách Thuê *" hint="VD: GREENFARM">
              <Input
                value={formData.code}
                onChange={(e) => handleAutoFillSubdomain(e.target.value)}
                placeholder="MÃ DOANH NGHIỆP"
                className="font-mono uppercase font-bold"
                required
              />
            </FormField>

            <FormField label="Tên Doanh Nghiệp / HTX *" hint="Tên pháp nhân đầy đủ" className="sm:col-span-2">
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Công ty CP Nông Nghiệp Xanh Việt Nam"
                required
              />
            </FormField>
          </div>

          <FormField label="Subdomain Định Danh *" hint="Chỉ chữ thường, số và dấu gạch ngang (VD: greenfarm)">
            <div className="flex items-center">
              <Input
                value={formData.subdomain}
                onChange={(e) => setFormData((prev) => ({ ...prev, subdomain: e.target.value.toLowerCase() }))}
                placeholder="subdomain"
                className="font-mono rounded-r-none"
                required
              />
              <span className="inline-flex items-center px-3 py-2 border border-l-0 border-slate-200 bg-slate-100 text-xs text-slate-500 font-mono rounded-r-xl">
                .nongtrai.vn
              </span>
            </div>
          </FormField>
        </div>

        {/* PHẦN 2: CẤU HÌNH GÓI CƯỚC SAAS */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <span>2. Gói Cước Dịch Vụ & Hạn Mức Quota</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Gói Thuê Bao (Plan) *">
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

            <FormField label="Hạn Mức Trang Trại (maxFarms) *">
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

            <FormField label="Hạn Mức Người Dùng (maxUsers) *">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Ngày Bắt Đầu *">
              <Input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData((prev) => ({ ...prev, validFrom: e.target.value }))}
                required
              />
            </FormField>
            <FormField label="Ngày Hết Hạn *">
              <Input
                type="date"
                value={formData.validTo}
                onChange={(e) => setFormData((prev) => ({ ...prev, validTo: e.target.value }))}
                required
              />
            </FormField>
          </div>
        </div>

        {/* PHẦN 3: TÀI KHOẢN CHỦ ĐẦU TƯ (ROLE_FARM_OWNER) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <User className="h-4 w-4 text-purple-600" />
              <span>3. Tài Khoản Chủ Đầu Tư Ban Đầu (ROLE_FARM_OWNER)</span>
            </div>
            <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-bold">
              Tự động cấp quyền Cấp 2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Họ và Tên Chủ Đầu Tư *" hint="Đại diện pháp luật hoặc chủ trang trại">
              <Input
                value={formData.adminFullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, adminFullName: e.target.value }))}
                placeholder="VD: Trần Văn Chủ"
                required
              />
            </FormField>

            <FormField label="Email Đăng Nhập (Username) *" hint="Đồng thời là email nhận thông báo">
              <Input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, adminEmail: e.target.value }))}
                placeholder="owner@greenfarm.vn"
                required
              />
            </FormField>
          </div>

          <FormField label="Mật Khẩu Khởi Tạo Ban Đầu *" hint="Người dùng sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={formData.adminPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, adminPassword: e.target.value }))}
                className="font-mono font-bold"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                onClick={generateRandomPassword}
                title="Tạo mật khẩu ngẫu nhiên an toàn"
              >
                Sinh Ngẫu Nhiên
              </Button>
            </div>
          </FormField>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isSubmitting}
            icon={<ShieldCheck className="h-4 w-4" />}
            className="bg-rose-600 hover:bg-rose-700 font-bold"
          >
            Xác Nhận Khởi Tạo Trọn Gói
          </Button>
        </div>
      </form>
    </Modal>
  );
}

