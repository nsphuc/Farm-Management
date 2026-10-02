import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import {
  Building2,
  FileCheck2,
  Save,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Award,
  ExternalLink,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { enterpriseService } from '../services/enterpriseService';
import { useAuthStore } from '../stores/useAuthStore';
import { toast } from 'sonner';

const enterpriseSchema = z.object({
  name: z.string().min(2, 'Tên doanh nghiệp/HTX tối thiểu 2 ký tự').max(255),
  taxNumber: z.string().min(5, 'Mã số thuế tối thiểu 5 ký tự').max(50),
  legalRepresentative: z.string().min(2, 'Tên người đại diện tối thiểu 2 ký tự').max(100),
  headquarterAddress: z.string().min(5, 'Địa chỉ trụ sở không được để trống').max(500),
  phone: z.string().optional(),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  website: z.string().url('Website phải là URL hợp lệ (http:// hoặc https://)').optional().or(z.literal('')),
  logoUrl: z.string().url('Logo URL không hợp lệ').optional().or(z.literal('')),
  establishedDate: z.string().optional().or(z.literal('')),
});

export const EnterpriseManagementPage = () => {
  const queryClient = useQueryClient();
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);
  const canEdit = hasAnyRole(['ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER']);

  // Certifications List State (VietGAP, GlobalGAP)
  const [certifications, setCertifications] = useState([]);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [newCert, setNewCert] = useState({
    name: 'VietGAP Trồng trọt',
    certNumber: '',
    issuedBy: '',
    issuedDate: '',
    expiryDate: '',
    imageUrl: '',
  });

  const { data: enterprise, isLoading } = useQuery({
    queryKey: ['enterprise-profile'],
    queryFn: enterpriseService.getMyEnterprise,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(enterpriseSchema),
    defaultValues: {
      name: '',
      taxNumber: '',
      legalRepresentative: '',
      headquarterAddress: '',
      phone: '',
      email: '',
      website: '',
      logoUrl: '',
      establishedDate: '',
    },
  });

  useEffect(() => {
    if (enterprise) {
      reset({
        name: enterprise.name || '',
        taxNumber: enterprise.taxNumber || '',
        legalRepresentative: enterprise.legalRepresentative || '',
        headquarterAddress: enterprise.headquarterAddress || '',
        phone: enterprise.phone || '',
        email: enterprise.email || '',
        website: enterprise.website || '',
        logoUrl: enterprise.logoUrl || '',
        establishedDate: enterprise.establishedDate || '',
      });

      if (enterprise.certificationsJson) {
        try {
          const parsed = JSON.parse(enterprise.certificationsJson);
          setCertifications(Array.isArray(parsed) ? parsed : []);
        } catch {
          setCertifications([]);
        }
      }
    }
  }, [enterprise, reset]);

  const updateMutation = useMutation({
    mutationFn: enterpriseService.updateMyEnterprise,
    onSuccess: (updated) => {
      queryClient.setQueryData(['enterprise-profile'], updated);
      toast.success('Hồ sơ doanh nghiệp/HTX đã được cập nhật thành công!');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.';
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      certificationsJson: JSON.stringify(certifications),
    };
    updateMutation.mutate(payload);
  };

  const handleAddCertification = () => {
    if (!newCert.certNumber || !newCert.issuedBy) {
      toast.error('Vui lòng điền mã chứng nhận và đơn vị cấp.');
      return;
    }

    const updated = [...certifications, { ...newCert, id: Date.now() }];
    setCertifications(updated);
    setShowAddCertModal(false);
    setNewCert({
      name: 'VietGAP Trồng trọt',
      certNumber: '',
      issuedBy: '',
      issuedDate: '',
      expiryDate: '',
      imageUrl: '',
    });
    toast.info('Đã thêm chứng nhận. Nhấn "Lưu hồ sơ" để hoàn tất cập nhật.');
  };

  const handleRemoveCertification = (index) => {
    const updated = certifications.filter((_, idx) => idx !== index);
    setCertifications(updated);
    toast.info('Đã xóa chứng nhận. Nhấn "Lưu hồ sơ" để lưu lại.');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-primary-600" />
            <span>Hồ sơ Doanh nghiệp & Hợp tác xã</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Quản lý thông tin pháp lý, cơ quan đại diện và các chứng nhận chất lượng (VietGAP, GlobalGAP).
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold shadow-sm shadow-primary-600/20 transition-all min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>{updateMutation.isPending ? 'Đang lưu...' : 'Lưu hồ sơ'}</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Thông tin pháp lý & Liên hệ */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Thông tin cơ bản & Pháp lý
              </h2>
              <p className="text-xs text-slate-400">
                Các thông tin đăng ký kinh doanh chính thức của tổ chức.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tên Doanh nghiệp */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên Doanh nghiệp / Hợp tác xã <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!canEdit}
                {...register('name')}
                placeholder="VD: Hợp tác xã Nông nghiệp Công nghệ cao Mộc Châu"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Mã số thuế */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mã số thuế / Giấy phép ĐKKD <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!canEdit}
                {...register('taxNumber')}
                placeholder="VD: 0102938475"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all font-mono"
              />
              {errors.taxNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.taxNumber.message}</p>
              )}
            </div>

            {/* Đại diện pháp luật */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Người đại diện pháp luật <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!canEdit}
                {...register('legalRepresentative')}
                placeholder="VD: Nguyễn Văn Giám Đốc"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
              />
              {errors.legalRepresentative && (
                <p className="mt-1 text-xs text-red-500">{errors.legalRepresentative.message}</p>
              )}
            </div>

            {/* Trụ sở chính */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Địa chỉ trụ sở chính <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  disabled={!canEdit}
                  {...register('headquarterAddress')}
                  placeholder="VD: Tiểu khu 14, Thị trấn Nông trường Mộc Châu, Sơn La"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
                />
              </div>
              {errors.headquarterAddress && (
                <p className="mt-1 text-xs text-red-500">{errors.headquarterAddress.message}</p>
              )}
            </div>

            {/* Điện thoại */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  disabled={!canEdit}
                  {...register('phone')}
                  placeholder="VD: 024 3829 4829"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email doanh nghiệp
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled={!canEdit}
                  {...register('email')}
                  placeholder="VD: contact@mocchaufarm.vn"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  disabled={!canEdit}
                  {...register('website')}
                  placeholder="https://mocchaufarm.vn"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
                />
              </div>
              {errors.website && (
                <p className="mt-1 text-xs text-red-500">{errors.website.message}</p>
              )}
            </div>

            {/* Ngày thành lập */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày thành lập
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  disabled={!canEdit}
                  {...register('establishedDate')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
                />
              </div>
            </div>

            {/* Logo URL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Logo URL (Hình ảnh nhận diện thương hiệu)
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  disabled={!canEdit}
                  {...register('logoUrl')}
                  placeholder="https://example.com/logo.png"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Chứng nhận VietGAP / GlobalGAP */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Chứng nhận Nông nghiệp An toàn (VietGAP / GlobalGAP)
                </h2>
                <p className="text-xs text-slate-400">
                  Dữ liệu chứng nhận sẽ được đóng gói tự động vào hồ sơ truy xuất nguồn gốc QR của lô thành phẩm.
                </p>
              </div>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => setShowAddCertModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 text-xs font-semibold transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm chứng nhận</span>
              </button>
            )}
          </div>

          {certifications.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800">
              <Award className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium text-slate-500">Chưa có chứng nhận an toàn nào được khai báo.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nhấn nút "Thêm chứng nhận" để bổ sung chứng nhận VietGAP hoặc GlobalGAP của tổ chức.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert, index) => (
                <div
                  key={cert.id || index}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {cert.name}
                        </h4>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          Số: {cert.certNumber}
                        </span>
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(index)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Xóa chứng nhận"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Tổ chức cấp: </span>
                      {cert.issuedBy}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Hiệu lực: </span>
                      {cert.issuedDate || '---'} đến {cert.expiryDate || '---'}
                    </div>
                  </div>

                  {cert.imageUrl && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      {/* Safe preview with DOMPurify */}
                      <a
                        href={DOMPurify.sanitize(cert.imageUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary-600 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xem bản scan chứng chỉ</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* Modal Thêm Chứng Nhận Mới */}
      {showAddCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Khai báo Chứng nhận Mới</span>
              </h3>
              <button
                onClick={() => setShowAddCertModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Loại chứng nhận
                </label>
                <select
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                >
                  <option value="VietGAP Trồng trọt">VietGAP Trồng trọt</option>
                  <option value="VietGAP Chăn nuôi">VietGAP Chăn nuôi</option>
                  <option value="GlobalGAP">GlobalGAP Nông nghiệp</option>
                  <option value="Hữu cơ Việt Nam (Organic)">Hữu cơ Việt Nam (Organic)</option>
                  <option value="OCOP 4 Sao">Chứng nhận OCOP</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã số chứng nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCert.certNumber}
                  onChange={(e) => setNewCert({ ...newCert, certNumber: e.target.value })}
                  placeholder="VD: VIETGAP-TT-2026-0098"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cơ quan / Tổ chức cấp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCert.issuedBy}
                  onChange={(e) => setNewCert({ ...newCert, issuedBy: e.target.value })}
                  placeholder="VD: Trung tâm Kiểm nghiệm & Chứng nhận Chất lượng TQC"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày cấp
                  </label>
                  <input
                    type="date"
                    value={newCert.issuedDate}
                    onChange={(e) => setNewCert({ ...newCert, issuedDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày hết hạn
                  </label>
                  <input
                    type="date"
                    value={newCert.expiryDate}
                    onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL ảnh bản scan chứng chỉ
                </label>
                <input
                  type="text"
                  value={newCert.imageUrl}
                  onChange={(e) => setNewCert({ ...newCert, imageUrl: e.target.value })}
                  placeholder="https://storage.example.com/certs/vietgap-2026.jpg"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddCertModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddCertification}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
              >
                Thêm vào danh sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
