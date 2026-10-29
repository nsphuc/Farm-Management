import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  QrCode,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import { enterpriseService } from '@/services/modules/enterpriseService';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/common/Can';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { extractApiErrors, VIETNAM_BANKS } from '@/utils/apiHelpers';

const CERTIFICATION_TEMPLATES = [
  { code: 'VIETGAP_CROP', name: 'VietGAP Trồng trọt' },
  { code: 'VIETGAP_LIVESTOCK', name: 'VietGAP Chăn nuôi' },
  { code: 'GLOBALGAP', name: 'GlobalG.A.P' },
  { code: 'ORGANIC_VN', name: 'Nông nghiệp Hữu cơ Việt Nam (TCVN 11041)' },
  { code: 'HACCP', name: 'Hệ thống Phân tích Mối nguy HACCP' },
  { code: 'ISO22000', name: 'Hệ thống Quản lý ATTP ISO 22000' },
];

export function EnterpriseProfileTab() {
  const isOwner = useAuthStore((state) => state.isOwner);
  const isFarmOwner = useAuthStore((state) => state.isFarmOwner);
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin);
  const canEdit = Boolean(isFarmOwner?.() || isOwner?.() || isSuperAdmin?.());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    taxNumber: '',
    legalRepresentative: '',
    headquarterAddress: '',
    establishedDate: '',
    logoUrl: '',
    contactPhone: '',
    contactEmail: '',
    bankBin: '970422',
    bankName: 'MBBank - Ngân hàng Quân Đội',
    bankAccountNo: '',
    bankAccountName: '',
  });

  const [certifications, setCertifications] = useState([]);
  const [newCert, setNewCert] = useState({
    code: 'VIETGAP_CROP',
    name: 'VietGAP Trồng trọt',
    certNumber: '',
    issuedBy: '',
    validFrom: '',
    validTo: '',
  });
  const [showAddCert, setShowAddCert] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setGeneralError('');
      const data = await enterpriseService.getProfile();
      if (data) {
        setFormData({
          taxNumber: data.taxNumber || '',
          legalRepresentative: data.legalRepresentative || '',
          headquarterAddress: data.headquarterAddress || '',
          establishedDate: data.establishedDate || '',
          logoUrl: data.logoUrl || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          bankBin: data.bankBin || '970422',
          bankName: data.bankName || 'MBBank - Ngân hàng Quân Đội',
          bankAccountNo: data.bankAccountNo || '',
          bankAccountName: data.bankAccountName || '',
        });

        if (data.certificationsJson) {
          try {
            const parsed = typeof data.certificationsJson === 'string'
              ? JSON.parse(data.certificationsJson)
              : data.certificationsJson;
            setCertifications(Array.isArray(parsed) ? parsed : []);
          } catch {
            setCertifications([]);
          }
        }
      }
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setGeneralError(errInfo.message || 'Không thể tải thông tin hồ sơ doanh nghiệp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'bankAccountName' ? value.toUpperCase() : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBankChange = (e) => {
    const selectedBin = e.target.value;
    const foundBank = VIETNAM_BANKS.find((b) => b.bin === selectedBin);
    setFormData((prev) => ({
      ...prev,
      bankBin: selectedBin,
      bankName: foundBank ? foundBank.name : prev.bankName,
    }));
  };

  const handleAddCert = () => {
    if (!newCert.name || !newCert.certNumber) {
      alert('Vui lòng nhập Tên chứng chỉ và Số chứng chỉ');
      return;
    }
    setCertifications((prev) => [...prev, { ...newCert }]);
    setNewCert({
      code: 'VIETGAP_CROP',
      name: 'VietGAP Trồng trọt',
      certNumber: '',
      issuedBy: '',
      validFrom: '',
      validTo: '',
    });
    setShowAddCert(false);
  };

  const handleDeleteCert = (idx) => {
    setCertifications((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setGeneralError('');
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        certificationsJson: JSON.stringify(certifications),
      };
      await enterpriseService.updateProfile(payload);
      setSuccessMsg('Hồ sơ doanh nghiệp & Cấu hình VietQR đã được lưu thành công!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setFieldErrors(errInfo.fieldErrors);
      setGeneralError(errInfo.message);
    } finally {
      setSaving(false);
    }
  };

  const previewQrUrl =
    formData.bankBin && formData.bankAccountNo
      ? `https://img.vietqr.io/image/${formData.bankBin}-${formData.bankAccountNo}-compact.png?amount=0&addInfo=${encodeURIComponent(
          'THANH TOAN NONG SAN'
        )}&accountName=${encodeURIComponent(formData.bankAccountName || '')}`
      : null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="ml-2 text-sm text-slate-500 font-medium">Đang nạp hồ sơ pháp nhân...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-200">
      {!canEdit && (
        <div className="flex items-center gap-3 rounded-2xl bg-amber-50/90 border border-amber-200 p-4 text-xs font-medium text-amber-900 shadow-xs">
          <Info className="h-5 w-5 shrink-0 text-amber-600" />
          <p>
            <strong>Lưu ý:</strong> Thông tin pháp nhân doanh nghiệp và tài khoản VietQR tổng do Chủ đầu tư (Farm Owner) quản lý. Giám đốc trang trại có quyền xem để đối chiếu chứng từ &amp; truy xuất nguồn gốc.
          </p>
        </div>
      )}

      {generalError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{generalError}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Thông tin Doanh nghiệp */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Thông Tin Pháp Nhân & Trụ Sở</h3>
              <p className="text-xs text-slate-500">Thông tin xuất hóa đơn và đại diện pháp luật của Tenant</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FormField label="Mã Số Thuế (Tax ID)" error={fieldErrors.taxNumber}>
            <Input
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleChange}
              placeholder="VD: 0102030405"
              disabled={!canEdit}
            />
          </FormField>

          <FormField label="Người Đại Diện Pháp Luật" error={fieldErrors.legalRepresentative}>
            <Input
              name="legalRepresentative"
              value={formData.legalRepresentative}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn An"
              disabled={!canEdit}
            />
          </FormField>

          <FormField label="Ngày Thành Lập" error={fieldErrors.establishedDate}>
            <Input
              type="date"
              name="establishedDate"
              value={formData.establishedDate}
              onChange={handleChange}
              disabled={!canEdit}
            />
          </FormField>

          <FormField label="Số Điện Thoại Liên Hệ" error={fieldErrors.contactPhone}>
            <Input
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="VD: 0912345678"
              disabled={!canEdit}
            />
          </FormField>

          <FormField label="Email Doanh Nghiệp" error={fieldErrors.contactEmail}>
            <Input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="VD: contact@vinagreen.vn"
              disabled={!canEdit}
            />
          </FormField>

          <FormField label="Đường Dẫn Logo (URL)" error={fieldErrors.logoUrl}>
            <Input
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              placeholder="https://..."
              disabled={!canEdit}
            />
          </FormField>

          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <FormField label="Địa Chỉ Trụ Sở Chính" error={fieldErrors.headquarterAddress}>
              <Input
                name="headquarterAddress"
                value={formData.headquarterAddress}
                onChange={handleChange}
                placeholder="VD: Tòa nhà Green Farm, Xã Tân An, TP. Buôn Ma Thuột, Đắk Lắk"
                disabled={!canEdit}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* 2. Cấu hình Ngân Hàng Napas 24/7 & Preview VietQR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tài Khoản Ngân Hàng Thụ Hưởng & VietQR Napas 24/7</h3>
              <p className="text-xs text-slate-500">Mã QR tự động in trên Đơn Bán Hàng và Chứng Từ Thu Tiền</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <FormField label="Ngân Hàng Thụ Hưởng (BIN)" required error={fieldErrors.bankBin}>
              <Select
                name="bankBin"
                value={formData.bankBin}
                onChange={handleBankChange}
                disabled={!canEdit}
                options={VIETNAM_BANKS.map((b) => ({
                  value: b.bin,
                  label: `${b.code} - ${b.name}`,
                }))}
              />
            </FormField>

            <FormField label="Số Tài Khoản Ngân Hàng" required error={fieldErrors.bankAccountNo}>
              <Input
                name="bankAccountNo"
                value={formData.bankAccountNo}
                onChange={handleChange}
                placeholder="VD: 0987654321"
                className="font-mono text-base tracking-wider"
                disabled={!canEdit}
              />
            </FormField>

            <FormField
              label="Tên Chủ Tài Khoản (In hoa không dấu)"
              required
              error={fieldErrors.bankAccountName}
              hint="Tự động chuyển in hoa theo chuẩn Napas"
            >
              <Input
                name="bankAccountName"
                value={formData.bankAccountName}
                onChange={handleChange}
                placeholder="VD: CONG TY CP NONG NGHIEP XANH"
                className="font-mono font-bold tracking-wide"
                disabled={!canEdit}
              />
            </FormField>
          </div>

          {/* Khung Xem Trước VietQR Động */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Khung Xem Trước Mã VietQR
            </div>
            {previewQrUrl ? (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <img
                  src={previewQrUrl}
                  alt="VietQR Preview"
                  className="mx-auto h-48 w-48 object-contain rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="text-left text-[11px] text-slate-600 space-y-0.5 border-t border-slate-100 pt-2 font-mono">
                  <div className="truncate font-semibold text-slate-900">{formData.bankName}</div>
                  <div>STK: <span className="font-bold text-blue-700">{formData.bankAccountNo}</span></div>
                  <div className="truncate font-bold text-slate-800">{formData.bankAccountName}</div>
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 text-xs text-slate-400">
                Nhập Số tài khoản & Tên chủ thẻ để hiển thị mã VietQR động
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Chứng chỉ chất lượng certifications_json */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chứng Chỉ Chất Lượng & Tiêu Chuẩn Nông Nghiệp</h3>
              <p className="text-xs text-slate-500">VietGAP, GlobalGAP, Organic (được tự động nhúng vào mã QR truy xuất nguồn gốc)</p>
            </div>
          </div>
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddCert(!showAddCert)}
              icon={<Plus className="h-4 w-4" />}
            >
              {showAddCert ? 'Đóng form thêm' : '+ Thêm chứng chỉ'}
            </Button>
          )}
        </div>

        {canEdit && showAddCert && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 mb-5 space-y-4">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Thêm Chứng Chỉ Mới</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField label="Mẫu Chứng Chỉ">
                <Select
                  value={newCert.code}
                  onChange={(e) => {
                    const c = CERTIFICATION_TEMPLATES.find((t) => t.code === e.target.value);
                    setNewCert((prev) => ({
                      ...prev,
                      code: e.target.value,
                      name: c ? c.name : prev.name,
                    }));
                  }}
                  options={CERTIFICATION_TEMPLATES.map((t) => ({ value: t.code, label: t.name }))}
                />
              </FormField>

              <FormField label="Tên Chứng Chỉ Hiển Thị" required>
                <Input
                  value={newCert.name}
                  onChange={(e) => setNewCert((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: VietGAP Trồng trọt"
                />
              </FormField>

              <FormField label="Số Giấy Chứng Nhận" required>
                <Input
                  value={newCert.certNumber}
                  onChange={(e) => setNewCert((prev) => ({ ...prev, certNumber: e.target.value }))}
                  placeholder="VD: VG-2026-0891"
                />
              </FormField>

              <FormField label="Cơ Quan Cấp Chứng Nhận">
                <Input
                  value={newCert.issuedBy}
                  onChange={(e) => setNewCert((prev) => ({ ...prev, issuedBy: e.target.value }))}
                  placeholder="VD: Trung tâm Kiểm nghiệm Nông nghiệp"
                />
              </FormField>

              <FormField label="Hiệu Lực Từ Ngày">
                <Input
                  type="date"
                  value={newCert.validFrom}
                  onChange={(e) => setNewCert((prev) => ({ ...prev, validFrom: e.target.value }))}
                />
              </FormField>

              <FormField label="Hiệu Lực Đến Ngày">
                <Input
                  type="date"
                  value={newCert.validTo}
                  onChange={(e) => setNewCert((prev) => ({ ...prev, validTo: e.target.value }))}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCert(false)}>
                Hủy
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleAddCert}>
                Lưu vào danh sách
              </Button>
            </div>
          </div>
        )}

        {certifications.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Chưa có chứng chỉ chất lượng nào. Nhấn "+ Thêm chứng chỉ" để thiết lập.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Mã & Tiêu chuẩn</th>
                  <th className="px-4 py-2.5">Số Chứng Nhận</th>
                  <th className="px-4 py-2.5">Đơn Vị Cấp</th>
                  <th className="px-4 py-2.5">Hiệu Lực</th>
                  {canEdit && <th className="px-4 py-2.5 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certifications.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.code}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-emerald-700">{c.certNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{c.issuedBy || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.validFrom || '—'} &rarr; {c.validTo || '—'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCert(idx)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Xóa chứng chỉ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Bar - Only visible for Farm Owner / Super Admin */}
      {canEdit && (
        <div className="flex justify-end gap-3 sticky bottom-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={saving}
            icon={<Save className="h-4 w-4" />}
          >
            Lưu Toàn Bộ Hồ Sơ Doanh Nghiệp
          </Button>
        </div>
      )}
    </form>
  );
}
export default EnterpriseProfileTab;
