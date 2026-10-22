import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  Save,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Building2,
  Info,
  Crown,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Switch, CodeInput } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

const CONTRACT_TYPES = [
  { value: 'FULL_TIME', label: 'Toàn thời gian (FULL_TIME)' },
  { value: 'PART_TIME', label: 'Bán thời gian (PART_TIME)' },
  { value: 'SEASONAL', label: 'Thời vụ vụ mùa (SEASONAL)' },
  { value: 'INTERN', label: 'Thực tập sinh (INTERN)' },
];

const EMPLOYEE_STATUSES = [
  { value: 'ACTIVE', label: 'Đang làm việc (ACTIVE)' },
  { value: 'ON_LEAVE', label: 'Đang nghỉ phép (ON_LEAVE)' },
  { value: 'RESIGNED', label: 'Đã thôi việc (RESIGNED)' },
  { value: 'TERMINATED', label: 'Chấm dứt HĐ (TERMINATED)' },
];

/**
 * Danh mục 6 vị trí chuẩn tại trang trại cho Farm Manager tiếp nhận
 */
export const FARM_STAFF_POSITIONS = [
  {
    value: 'ZONE_MANAGER',
    label: '1. ZONE_MANAGER — Trưởng bộ phận kỹ thuật / Trưởng phân khu',
    roleCode: 'ROLE_TECHNICAL_STAFF',
    roleLabel: 'Kỹ sư kỹ thuật (ROLE_TECHNICAL_STAFF)',
    hasAccountOption: true,
  },
  {
    value: 'TECHNICAL_STAFF',
    label: '2. TECHNICAL_STAFF — Kỹ sư trồng trọt / Bác sĩ thú y / KCS',
    roleCode: 'ROLE_TECHNICAL_STAFF',
    roleLabel: 'Kỹ sư kỹ thuật (ROLE_TECHNICAL_STAFF)',
    hasAccountOption: true,
  },
  {
    value: 'WAREHOUSE_STAFF',
    label: '3. WAREHOUSE_STAFF — Thủ kho trang trại',
    roleCode: 'ROLE_WAREHOUSE_STAFF',
    roleLabel: 'Thủ kho (ROLE_WAREHOUSE_STAFF)',
    hasAccountOption: true,
  },
  {
    value: 'ACCOUNTANT',
    label: '4. ACCOUNTANT — Kế toán trang trại (1 người/trại)',
    roleCode: 'ROLE_ACCOUNTANT',
    roleLabel: 'Kế toán trang trại (ROLE_ACCOUNTANT)',
    hasAccountOption: true,
  },
  {
    value: 'FIELD_STAFF_ACCOUNT',
    label: '5. FIELD_STAFF_ACCOUNT — Nhân viên chăm sóc cây trồng, vật nuôi (Có tài khoản)',
    roleCode: 'ROLE_FIELD_STAFF',
    roleLabel: 'Nhân viên hiện trường (ROLE_FIELD_STAFF)',
    hasAccountOption: true,
  },
  {
    value: 'SEASONAL_NO_ACCOUNT',
    label: '6. SEASONAL_NO_ACCOUNT — Lao động phổ thông: Làm cỏ, quét rác, dọn vệ sinh, bốc xếp (Không tài khoản)',
    roleCode: null,
    roleLabel: null,
    hasAccountOption: false,
  },
];

const SAAS_ROLES = [
  { value: 'ROLE_FIELD_STAFF', label: 'Nhân viên hiện trường (ROLE_FIELD_STAFF)' },
  { value: 'ROLE_TECHNICAL_STAFF', label: 'Kỹ sư kỹ thuật (ROLE_TECHNICAL_STAFF)' },
  { value: 'ROLE_WAREHOUSE_STAFF', label: 'Thủ kho (ROLE_WAREHOUSE_STAFF)' },
  { value: 'ROLE_ACCOUNTANT', label: 'Kế toán trang trại (ROLE_ACCOUNTANT)' },
  { value: 'ROLE_FARM_MANAGER', label: 'Quản lý trang trại (ROLE_FARM_MANAGER)' },
];

/**
 * Tính tuổi chính xác giữa 2 ngày (dateOfBirth -> joinedDate)
 */
function calculateAge(birthDateStr, joinedDateStr) {
  if (!birthDateStr || !joinedDateStr) return null;
  const birth = new Date(birthDateStr);
  const joined = new Date(joinedDateStr);
  if (isNaN(birth.getTime()) || isNaN(joined.getTime())) return null;

  let age = joined.getFullYear() - birth.getFullYear();
  const m = joined.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && joined.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function EmployeeFormModal({
  isOpen,
  onClose,
  onSuccess,
  employee = null,
  farms = [],
  defaultPosition = null,
}) {
  const isEditing = Boolean(employee?.id);
  const { isOwner, isFarmManager } = useAuthStore();
  const { activeFarmId, farms: storeFarms, fetchFarms, notifyDataChanged } = useActiveFarmStore();
  const owner = isOwner();
  const farmManager = isFarmManager();

  // Nạp danh sách đầy đủ trang trại nếu store trống
  const effectiveFarms = storeFarms && storeFarms.length > 0 ? storeFarms : farms;

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && owner && (!storeFarms || storeFarms.length === 0)) {
      fetchFarms?.();
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    employeeCode: '',
    fullName: '',
    dateOfBirth: '2000-01-01',
    idCardNumber: '',
    phone: '',
    email: '',
    joinedDate: new Date().toISOString().split('T')[0],
    farmId: '',
    position: '',
    contractType: 'FULL_TIME',
    baseSalary: '7500000',
    hourlyRate: '38000',
    annualLeaveQuota: '12.0',
    status: 'ACTIVE',
    // Single-Window Provisioning Options
    enableProvisioning: false,
    username: '',
    initialPassword: 'Password@123',
    selectedRole: 'ROLE_FIELD_STAFF',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }

    // Chỉ khởi tạo 1 lần duy nhất khi mở modal (hoặc khi đổi employee cần sửa)
    if (hasInitializedRef.current && !employee) {
      return;
    }
    hasInitializedRef.current = true;

    if (employee) {
      // Chế độ chỉnh sửa hồ sơ
      setFormData({
        employeeCode: employee.employeeCode || '',
        fullName: employee.fullName || '',
        dateOfBirth: employee.dateOfBirth || '',
        idCardNumber: employee.idCardNumber || '',
        phone: employee.phone || '',
        email: employee.email || '',
        joinedDate: employee.joinedDate || new Date().toISOString().split('T')[0],
        farmId: employee.farmId !== null && employee.farmId !== undefined ? String(employee.farmId) : '',
        position: employee.position || '',
        contractType: employee.contractType || 'FULL_TIME',
        baseSalary: employee.baseSalary ? String(employee.baseSalary) : '0',
        hourlyRate: employee.hourlyRate ? String(employee.hourlyRate) : '0',
        annualLeaveQuota: employee.annualLeaveQuota ? String(employee.annualLeaveQuota) : '12.0',
        status: employee.status || 'ACTIVE',
        enableProvisioning: false,
        username: '',
        initialPassword: 'Password@123',
        selectedRole: employee.position === 'FARM_MANAGER' ? 'ROLE_FARM_MANAGER' : 'ROLE_FIELD_STAFF',
      });
    } else {
      // ========================================================
      // Chế độ Thêm Mới: Phân nhánh thông minh theo Role
      // ========================================================
      let defaultFarmId = '';
      if (activeFarmId) {
        defaultFarmId = String(activeFarmId);
      } else if (effectiveFarms.length > 0) {
        defaultFarmId = String(effectiveFarms[0]?.id || '');
      }

      const initialCode = generateEntityCode(CODE_PREFIXES.EMPLOYEE);
      if (owner) {
        // TRƯỜNG HỢP A: Chủ đầu tư (Owner) -> Bổ nhiệm FARM_MANAGER
        setFormData({
          employeeCode: initialCode,
          fullName: '',
          dateOfBirth: '1990-01-01',
          idCardNumber: '',
          phone: '',
          email: '',
          joinedDate: new Date().toISOString().split('T')[0],
          farmId: defaultFarmId,
          position: 'FARM_MANAGER', // Khóa cứng FARM_MANAGER
          contractType: 'FULL_TIME',
          baseSalary: '15000000',
          hourlyRate: '75000',
          annualLeaveQuota: '12.0',
          status: 'ACTIVE',
          enableProvisioning: true, // Mở sẵn khối cấp tài khoản cho Farm Manager
          username: '',
          initialPassword: 'Password@123',
          selectedRole: 'ROLE_FARM_MANAGER',
        });
      } else {
        // TRƯỜNG HỢP B: Quản lý trại (Farm Manager) -> Tiếp nhận nhân sự nội bộ trại
        const initialFarmId = activeFarmId ? String(activeFarmId) : defaultFarmId;
        const initialPos = defaultPosition || 'ZONE_MANAGER';
        const staffConfig = FARM_STAFF_POSITIONS.find((p) => p.value === initialPos) || FARM_STAFF_POSITIONS[0];

        setFormData({
          employeeCode: initialCode,
          fullName: '',
          dateOfBirth: '2000-01-01',
          idCardNumber: '',
          phone: '',
          email: '',
          joinedDate: new Date().toISOString().split('T')[0],
          farmId: initialFarmId,
          position: initialPos,
          contractType: 'FULL_TIME',
          baseSalary: '7500000',
          hourlyRate: '38000',
          annualLeaveQuota: '12.0',
          status: 'ACTIVE',
          enableProvisioning: staffConfig.hasAccountOption,
          username: '',
          initialPassword: 'Password@123',
          selectedRole: staffConfig.roleCode || 'ROLE_FIELD_STAFF',
        });
      }
    }
    setErrors({});
    setGeneralError(null);
  }, [isOpen, employee]);

  // Tự động gán farm đầu tiên khi danh sách trang trại tải xong mà KHÔNG reset các trường người dùng đang nhập
  useEffect(() => {
    if (isOpen && effectiveFarms.length > 0) {
      setFormData((prev) => {
        if (prev.farmId) return prev;
        return { ...prev, farmId: String(effectiveFarms[0]?.id || '') };
      });
    }
  }, [isOpen, effectiveFarms]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Xử lý thay đổi chức vụ (đối với Farm Manager)
      if (field === 'position') {
        const staffConfig = FARM_STAFF_POSITIONS.find((p) => p.value === value);
        if (staffConfig) {
          if (!staffConfig.hasAccountOption) {
            // Vị trí số 6: SEASONAL_NO_ACCOUNT -> Ẩn hoàn toàn phần cấp tài khoản Web
            next.enableProvisioning = false;
            next.username = '';
            next.selectedRole = '';
          } else {
            // Vị trí 1 -> 5: Tự động gắn Role tương ứng
            next.enableProvisioning = true;
            next.selectedRole = staffConfig.roleCode;
            if (!next.username && next.phone) {
              next.username = next.phone.replace(/[^0-9]/g, '');
            } else if (!next.username && next.employeeCode) {
              next.username = next.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '');
            }
          }
        }
      }

      // Auto-suggest username từ phone hoặc email
      if (field === 'phone' && value) {
        const phoneClean = value.replace(/[^0-9]/g, '');
        if (!prev.username || prev.username === prev.phone?.replace(/[^0-9]/g, '')) {
          next.username = phoneClean;
        }
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleGenerateInternalEmail = () => {
    const codeClean = formData.employeeCode
      ? formData.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '')
      : Math.random().toString(36).substring(2, 7);
    handleChange('email', `nv_${codeClean}@nongtrai.vn`);
  };

  const validate = () => {
    const errs = {};

    if (!formData.employeeCode?.trim()) {
      errs.employeeCode = 'Mã nhân viên không được để trống';
    }

    if (!formData.fullName?.trim()) {
      errs.fullName = 'Họ và tên nhân viên không được để trống';
    }

    // 1. Validation Bắt Buộc Đủ 18 Tuổi
    if (!formData.dateOfBirth) {
      errs.dateOfBirth = 'Ngày sinh không được để trống';
    } else if (formData.joinedDate) {
      const age = calculateAge(formData.dateOfBirth, formData.joinedDate);
      if (age !== null && age < 18) {
        errs.dateOfBirth = `Nhân viên phải đủ 18 tuổi tính đến ngày gia nhập (Hiện tại: ${age} tuổi)`;
      }
    }

    // 2. Validation CCCD (9 hoặc 12 số)
    if (!formData.idCardNumber?.trim()) {
      errs.idCardNumber = 'Số CMND/CCCD không được để trống';
    } else if (!/^([0-9]{9}|[0-9]{12})$/.test(formData.idCardNumber.trim())) {
      errs.idCardNumber = 'Số CMND phải gồm 9 số hoặc CCCD gồm 12 chữ số';
    }

    // 3. Validation SĐT Việt Nam
    if (!formData.phone?.trim()) {
      errs.phone = 'Số điện thoại không được để trống';
    } else if (!/^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(formData.phone.trim())) {
      errs.phone = 'Số điện thoại di động Việt Nam không hợp lệ';
    }

    // 4. Validation Email
    if (!formData.email?.trim()) {
      errs.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Địa chỉ email không đúng định dạng';
    }

    // 5. Validation Trang Trại & Chức vụ
    if (owner && !formData.farmId) {
      errs.farmId = 'Vui lòng chọn trang trại cụ thể để bổ nhiệm Giám đốc / Quản lý';
    } else if (!owner && !formData.farmId) {
      errs.farmId = 'Nhân sự phải được gắn vào trang trại bạn đang phụ trách';
    }

    if (!formData.position?.trim()) {
      errs.position = 'Chức vụ không được để trống';
    } else if (!owner && formData.position.trim().toUpperCase() === 'FARM_MANAGER') {
      errs.position = 'Chỉ Chủ đầu tư (Owner) mới có thẩm quyền bổ nhiệm Quản lý trang trại';
    }

    if (!formData.joinedDate) {
      errs.joinedDate = 'Ngày gia nhập không được để trống';
    }

    if (Number(formData.baseSalary) < 0) {
      errs.baseSalary = 'Lương cơ bản không được âm';
    }

    if (Number(formData.hourlyRate) < 0) {
      errs.hourlyRate = 'Lương giờ không được âm';
    }

    if (Number(formData.annualLeaveQuota) < 0) {
      errs.annualLeaveQuota = 'Quỹ phép năm không được âm';
    }

    // Validation cấp tài khoản Web (khi có mở khối cấp tài khoản)
    if (formData.enableProvisioning && !isEditing) {
      if (!formData.username?.trim()) {
        errs.username = 'Tên đăng nhập không được để trống khi cấp tài khoản';
      } else if (formData.username.length < 4) {
        errs.username = 'Tên đăng nhập phải có ít nhất 4 ký tự';
      }

      if (!formData.initialPassword || formData.initialPassword.length < 6) {
        errs.initialPassword = 'Mật khẩu khởi tạo phải từ 6 ký tự trở lên';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setGeneralError(null);

      const isSeasonalWorker = formData.position === 'SEASONAL_NO_ACCOUNT';
      const shouldCreateAccount = !isSeasonalWorker && Boolean(formData.enableProvisioning);

      const payload = {
        farmId: formData.farmId ? Number(formData.farmId) : null,
        employeeCode: formData.employeeCode.trim().toUpperCase(),
        fullName: formData.fullName.trim(),
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        idCardNumber: formData.idCardNumber?.trim() || null,
        dateOfBirth: formData.dateOfBirth,
        position: formData.position?.trim() || null,
        joinedDate: formData.joinedDate,
        baseSalary: Number(formData.baseSalary) || 0,
        hourlyRate: Number(formData.hourlyRate) || 0,
        contractType: formData.contractType,
        annualLeaveQuota: Number(formData.annualLeaveQuota) || 12.0,
        // One-step Provisioning fields
        createAccount: shouldCreateAccount,
        enableProvisioning: shouldCreateAccount,
        username: shouldCreateAccount ? formData.username?.trim() : undefined,
        initialPassword: shouldCreateAccount ? formData.initialPassword : undefined,
        roleCode: shouldCreateAccount ? formData.selectedRole : undefined,
      };

      let result;
      if (isEditing) {
        result = await hrService.updateEmployee(employee.id, {
          ...payload,
          status: formData.status,
        });
      } else {
        result = await hrService.createEmployee(payload);
      }

      notifyDataChanged?.('employees');
      if (formData.position === 'FARM_MANAGER' || isEditing) {
        notifyDataChanged?.('farms');
      }

      onSuccess?.(result);
      onClose();
    } catch (err) {
      console.error('Submit employee error:', err);
      const errMsg = applyServerFieldErrors(err, setErrors);
      setGeneralError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSeasonalSelected = formData.position === 'SEASONAL_NO_ACCOUNT';
  const currentStaffConfig = FARM_STAFF_POSITIONS.find((p) => p.value === formData.position);

  // Thiết lập tiêu đề và phụ đề modal chuẩn xác
  let modalTitle = 'Tiếp Nhận Nhân Sự Trang Trại';
  let modalSubtitle = 'Hồ sơ nhân sự 360°, hợp đồng lao động & cấp quyền hệ thống';
  if (isEditing) {
    modalTitle = `Cập Nhật Hồ Sơ: ${employee?.fullName}`;
    modalSubtitle = `Mã: ${employee?.employeeCode} • ${employee?.position || 'Nhân sự'}`;
  } else if (owner) {
    modalTitle = 'Bổ Nhiệm Giám Đốc / Quản Lý Trang Trại (FARM_MANAGER)';
    modalSubtitle = 'Bổ nhiệm cán bộ điều hành cấp cơ sở & cấp tài khoản quản trị trang trại trong 1 bước';
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={
        owner && !isEditing ? (
          <Crown className="h-5 w-5 text-amber-600" />
        ) : (
          <UserPlus className="h-5 w-5 text-emerald-600" />
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {generalError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Banner bổ nhiệm FARM_MANAGER cho Owner */}
        {owner && !isEditing && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950 animate-in fade-in">
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block font-bold text-amber-950">
                Quy Trình 1-Bước: Bổ Nhiệm Quản Lý Trang Trại (FARM_MANAGER)
              </strong>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Hệ thống sẽ đồng thời tạo hồ sơ nhân sự, cấp tài khoản SaaS với quyền Quản lý cơ sở (ROLE_FARM_MANAGER), cập nhật người quản lý tại bảng trang trại và ghi nhận phân công điều hành trong 1 giao dịch.
              </p>
            </div>
          </div>
        )}

        {/* Khối 1: Thông tin nhân thân */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-3.5 flex items-center gap-2">
            <span>1. Thông Tin Cá Nhân & Nhận Diện</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <FormField
              label="Mã Nhân Viên"
              required
              error={errors.employeeCode}
              hint={isEditing ? 'Mã hồ sơ bất biến' : 'Mã tự sinh theo chuẩn hệ thống'}
            >
              <CodeInput
                value={formData.employeeCode}
                onChange={(e) => handleChange('employeeCode', e.target.value.toUpperCase())}
                onRegenerate={() => handleChange('employeeCode', generateEntityCode(CODE_PREFIXES.EMPLOYEE))}
                isEditMode={isEditing}
                error={errors.employeeCode}
              />
            </FormField>

            <FormField label="Họ và Tên" required error={errors.fullName}>
              <Input
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="VD: Nguyễn Văn An"
              />
            </FormField>

            <FormField label="Ngày Sinh (Đủ 18T)" required error={errors.dateOfBirth}>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />
            </FormField>

            <FormField label="Số CCCD / CMND" required error={errors.idCardNumber}>
              <Input
                value={formData.idCardNumber}
                onChange={(e) => handleChange('idCardNumber', e.target.value)}
                placeholder="001200001234 (9 hoặc 12 số)"
              />
            </FormField>

            <FormField label="Số Điện Thoại" required error={errors.phone}>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="0912345678"
              />
            </FormField>

            <FormField
              label={
                <div className="flex items-center justify-between w-full">
                  <span>Email Liên Hệ</span>
                  <button
                    type="button"
                    onClick={handleGenerateInternalEmail}
                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                    title="Điền email nội bộ dạng nv_xxxx@nongtrai.vn"
                  >
                    + Tạo email nội bộ
                  </button>
                </div>
              }
              required
              error={errors.email}
            >
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="nhanvien@nongtrai.vn"
              />
            </FormField>
          </div>
        </div>

        {/* Khối 2: Biên chế & Nơi làm việc (ĐÃ BỎ Ô PHÒNG BAN) */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-3.5 flex items-center gap-2">
            <span>2. Biên Chế Nơi Làm Việc & Chức Vụ</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Ô Trang Trại Trực Thuộc */}
            {owner && !isEditing ? (
              <FormField
                label="Trang Trại Trực Thuộc"
                required
                error={errors.farmId}
                hint="Chủ đầu tư chọn trang trại để bổ nhiệm Giám đốc"
              >
                <Select
                  value={formData.farmId}
                  onChange={(e) => handleChange('farmId', e.target.value)}
                  placeholder="-- Chọn trang trại tiếp nhận Giám đốc --"
                >
                  {effectiveFarms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || f.farmName} ({f.code || `F-${f.id}`})
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : (
              <FormField
                label="Trang Trại Trực Thuộc"
                required
                error={errors.farmId}
                hint={
                  !owner
                    ? 'Khóa cứng theo trang trại bạn đang phụ trách điều hành'
                    : 'Trang trại trực thuộc'
                }
              >
                <Select
                  value={formData.farmId}
                  onChange={(e) => handleChange('farmId', e.target.value)}
                  disabled={!owner}
                  placeholder="-- Chọn trang trại --"
                >
                  {effectiveFarms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || f.farmName} ({f.code || `F-${f.id}`})
                    </option>
                  ))}
                </Select>
              </FormField>
            )}

            {/* Ô Chức Vụ / Vị Trí */}
            {owner && !isEditing ? (
              <FormField
                label="Chức Vụ / Vị Trí"
                required
                error={errors.position}
                hint="Chủ đầu tư phân quyền bổ nhiệm Quản lý cơ sở"
              >
                <Input
                  value="FARM_MANAGER - Giám đốc / Quản lý trang trại"
                  readOnly
                  disabled
                  className="bg-slate-100 font-bold text-amber-900 border-amber-200 cursor-not-allowed"
                />
              </FormField>
            ) : isEditing ? (
              <FormField
                label="Chức Vụ / Vị Trí"
                required
                error={errors.position}
                hint="Hệ thống tự động suy diễn Phòng Ban tương ứng"
              >
                <Input
                  value={formData.position}
                  readOnly
                  disabled
                  className="bg-slate-100 font-semibold text-slate-700 cursor-not-allowed"
                />
              </FormField>
            ) : (
              <FormField
                label="Chức Vụ / Vị Trí"
                required
                error={errors.position}
                hint="Hệ thống tự động suy diễn Phòng Ban tương ứng"
              >
                <Select
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="-- Chọn chức vụ công tác --"
                >
                  {FARM_STAFF_POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}

            <FormField label="Loại Hợp Đồng" required error={errors.contractType}>
              <Select
                value={formData.contractType}
                onChange={(e) => handleChange('contractType', e.target.value)}
                options={CONTRACT_TYPES}
              />
            </FormField>

            <FormField label="Ngày Vào Làm (Joined Date)" required error={errors.joinedDate}>
              <Input
                type="date"
                value={formData.joinedDate}
                onChange={(e) => handleChange('joinedDate', e.target.value)}
              />
            </FormField>

            {isEditing && (
              <FormField label="Trạng Thái Lao Động" required>
                <Select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  options={EMPLOYEE_STATUSES}
                />
              </FormField>
            )}
          </div>
        </div>

        {/* Khối 3: Lương & Quỹ Phép */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-3.5 flex items-center gap-2">
            <span>3. Chế Độ Lương & Quỹ Phép Năm</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <FormField label="Mức Lương Cơ Bản (VNĐ)" error={errors.baseSalary}>
              <Input
                type="number"
                min="0"
                step="100000"
                value={formData.baseSalary}
                onChange={(e) => handleChange('baseSalary', e.target.value)}
              />
            </FormField>

            <FormField label="Đơn Giá Giờ Công (VNĐ/h)" error={errors.hourlyRate}>
              <Input
                type="number"
                min="0"
                step="1000"
                value={formData.hourlyRate}
                onChange={(e) => handleChange('hourlyRate', e.target.value)}
              />
            </FormField>

            <FormField label="Quỹ Phép Năm (Ngày)" error={errors.annualLeaveQuota}>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.annualLeaveQuota}
                onChange={(e) => handleChange('annualLeaveQuota', e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Khối 4: Cấp tài khoản SaaS ngay lúc tạo nhân viên (One-step Provisioning) */}
        {!isEditing && (
          <div>
            {owner ? (
              // Khối cấp tài khoản cho Owner bổ nhiệm FARM_MANAGER (hiển thị sẵn bắt buộc)
              <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4 space-y-3.5 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-700" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Cấp Tài Khoản Đăng Nhập Quản Lý Trang Trại (ROLE_FARM_MANAGER)
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Tự động cấp quyền quản trị cơ sở để Giám đốc đăng nhập điều hành phân khu, duyệt công & chấm công
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200">
                  <FormField label="Tên Đăng Nhập (Username)" required error={errors.username}>
                    <Input
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      placeholder="Gợi ý: SĐT hoặc mã NV"
                    />
                  </FormField>

                  <FormField label="Mật Khẩu Khởi Tạo" required error={errors.initialPassword}>
                    <Input
                      value={formData.initialPassword}
                      onChange={(e) => handleChange('initialPassword', e.target.value)}
                      placeholder="Password@123"
                    />
                  </FormField>

                  <FormField label="Vai Trò SaaS (Role)" required>
                    <Input
                      value="ROLE_FARM_MANAGER (Quản lý trang trại)"
                      readOnly
                      disabled
                      className="bg-slate-100 font-semibold text-slate-700 cursor-not-allowed text-xs"
                    />
                  </FormField>
                </div>
              </div>
            ) : isSeasonalSelected ? (
              // Ghi chú cho vị trí số 6: SEASONAL_NO_ACCOUNT
              <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 text-xs text-emerald-900 animate-in fade-in">
                <Info className="h-5 w-5 shrink-0 text-emerald-700 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold text-emerald-950">
                    Lao Động Phổ Thông / Thời Vụ Hiện Trường (Không Dùng Tài Khoản Web)
                  </strong>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Nhân sự này không sử dụng tài khoản Web; sẽ được Trưởng phân khu hoặc Thủ kho trực tiếp điểm danh chấm công và giao việc.
                  </p>
                </div>
              </div>
            ) : (
              // Tùy chọn cấp tài khoản cho vị trí 1 -> 5 của Farm Manager
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Cấp Tài Khoản Đăng Nhập Web Cho Nhân Sự
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {currentStaffConfig?.roleLabel
                          ? `Gán quyền truy cập: ${currentStaffConfig.roleLabel}`
                          : 'Cấp quyền truy cập hệ thống theo vị trí công tác'}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={formData.enableProvisioning}
                    onChange={(checked) => handleChange('enableProvisioning', checked)}
                  />
                </div>

                {formData.enableProvisioning && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-200/60 animate-in fade-in duration-150">
                    <FormField label="Tên Đăng Nhập (Username)" required error={errors.username}>
                      <Input
                        value={formData.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        placeholder="Gợi ý: SĐT hoặc mã NV"
                      />
                    </FormField>

                    <FormField label="Mật Khẩu Khởi Tạo" required error={errors.initialPassword}>
                      <Input
                        value={formData.initialPassword}
                        onChange={(e) => handleChange('initialPassword', e.target.value)}
                        placeholder="Password@123"
                      />
                    </FormField>

                    <FormField label="Vai Trò SaaS (Role)" required>
                      <Select
                        value={formData.selectedRole}
                        onChange={(e) => handleChange('selectedRole', e.target.value)}
                        options={SAAS_ROLES.filter((r) => r.value !== 'ROLE_FARM_MANAGER')}
                      />
                    </FormField>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Save className="h-4 w-4" />}
            isLoading={isSubmitting}
            loadingText={
              isEditing
                ? 'Đang lưu...'
                : owner
                ? 'Đang bổ nhiệm...'
                : 'Đang tiếp nhận...'
            }
          >
            {isEditing
              ? 'Lưu Thay Đổi'
              : owner
              ? 'Xác Nhận Bổ Nhiệm'
              : 'Xác Nhận Tiếp Nhận'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EmployeeFormModal;
