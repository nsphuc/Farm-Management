import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Save,
  Sparkles,
  Lock,
  AlertCircle,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { employeeApi } from '../../../services/employeeApi';
import { toast } from '../../../store/ui/useToastStore';
import {
  DEPARTMENT_LABELS,
  POSITION_LABELS,
  DEPARTMENT_POSITIONS,
} from './employeeConstants';

// Helper xác định mặc định bật/tắt cấp tài khoản truy cập hệ thống theo vị trí:
// Mặc định TẮT đối với WORKER, mặc định BẬT đối với FARM_MANAGER, ACCOUNTANT, HR, TECHNICAL_LEAD/STAFF, WAREHOUSE_KEEPER
const shouldDefaultAccountOn = (pos) => {
  if (!pos) return false;
  const p = String(pos).toUpperCase();
  if (p === 'WORKER') return false;
  return ['FARM_MANAGER', 'ACCOUNTANT', 'HR', 'TECHNICAL_LEAD', 'TECHNICAL_STAFF', 'WAREHOUSE_KEEPER'].includes(p);
};

/**
 * Modal thêm mới hoặc chỉnh sửa hồ sơ nhân viên (Nghiệp vụ 4.1. Quản lý nhân viên).
 * Hỗ trợ Dependent Dropdown (Phòng ban -> Vị trí công tác) và tự động sinh mã nhân viên.
 */
export const EmployeeFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  employee = null, // null nếu là tạo mới, có giá trị nếu đang sửa
  farms = [],
}) => {
  const isEdit = Boolean(employee);

  const today = new Date();
  const maxDate18YearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0];

  const [formData, setFormData] = useState({
    employeeCode: '',
    fullName: '',
    email: '',
    phone: '',
    idCardNumber: '',
    dateOfBirth: '',
    department: '',
    position: '',
    joinedDate: new Date().toISOString().split('T')[0],
    baseSalary: '',
    hourlyRate: '',
    contractType: 'FULL_TIME',
    status: 'ACTIVE',
    farmId: '',
    createSystemAccount: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeCode: employee.employeeCode || '',
        fullName: employee.fullName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        idCardNumber: employee.idCardNumber || '',
        dateOfBirth: employee.dateOfBirth || '',
        department: employee.department || '',
        position: employee.position || '',
        joinedDate: employee.joinedDate || new Date().toISOString().split('T')[0],
        baseSalary: employee.baseSalary !== undefined ? employee.baseSalary : '',
        hourlyRate: employee.hourlyRate !== undefined ? employee.hourlyRate : '',
        contractType: employee.contractType || 'FULL_TIME',
        status: employee.status || 'ACTIVE',
        farmId: employee.farmId ? String(employee.farmId) : '',
        createSystemAccount: Boolean(employee.userId),
      });
    } else {
      setFormData({
        employeeCode: '',
        fullName: '',
        email: '',
        phone: '',
        idCardNumber: '',
        dateOfBirth: '',
        department: '',
        position: '',
        joinedDate: new Date().toISOString().split('T')[0],
        baseSalary: '',
        hourlyRate: '',
        contractType: 'FULL_TIME',
        status: 'ACTIVE',
        farmId: farms[0]?.id ? String(farms[0].id) : '',
        createSystemAccount: false,
      });
    }
    setErrors({});
  }, [employee, isOpen, farms]);

  if (!isOpen) return null;

  // Helper cập nhật field và tự động xóa lỗi đỏ tương ứng
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Xử lý đổi Phòng ban -> BẮT BUỘC reset Vị trí công việc (Cascading Dependent Dropdown)
  const handleDepartmentChange = (newDept) => {
    setFormData((prev) => ({
      ...prev,
      department: newDept,
      position: '', // Reset giá trị vị trí khi đổi phòng ban
      createSystemAccount: false,
    }));
    setErrors((prev) => ({ ...prev, department: null, position: null }));
  };

  // Xử lý đổi Vị trí công việc -> Tự động bật/tắt cờ cấp tài khoản hệ thống SaaS
  const handlePositionChange = (newPos) => {
    const defaultOn = shouldDefaultAccountOn(newPos);
    setFormData((prev) => ({
      ...prev,
      position: newPos,
      createSystemAccount: defaultOn,
    }));
    if (errors.position) {
      setErrors((prev) => ({ ...prev, position: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Họ và tên nhân viên không được để trống';
    } else if (formData.fullName.trim().length < 2 || formData.fullName.trim().length > 150) {
      newErrors.fullName = 'Họ và tên nhân viên phải từ 2 đến 150 ký tự';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Ngày sinh của nhân viên là bắt buộc';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.dateOfBirth = 'Nhân viên phải từ đủ 18 tuổi trở lên theo Luật Lao động';
      }
    }

    if (!formData.department) {
      newErrors.department = 'Vui lòng chọn phòng ban trực thuộc';
    }

    if (!formData.position) {
      newErrors.position = 'Vui lòng chọn vị trí công việc chuyên môn';
    }

    if (formData.email?.trim()) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Email không đúng định dạng chuẩn RFC 5322 (VD: nv@greenfarm.vn)';
      }
    }

    if (formData.phone?.trim()) {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Số điện thoại Việt Nam không hợp lệ (10 chữ số, bắt đầu bằng 0 hoặc +84)';
      }
    }

    if (formData.idCardNumber?.trim()) {
      if (!/^[0-9]{9,12}$/.test(formData.idCardNumber.trim())) {
        newErrors.idCardNumber = 'Số CCCD/CMND phải gồm 9 đến 12 chữ số';
      }
    }

    if (!formData.joinedDate) {
      newErrors.joinedDate = 'Vui lòng chọn ngày vào làm';
    }

    if (formData.baseSalary && Number(formData.baseSalary) < 0) {
      newErrors.baseSalary = 'Lương cơ bản không được âm';
    }

    if (formData.hourlyRate && Number(formData.hourlyRate) < 0) {
      newErrors.hourlyRate = 'Lương theo giờ không được âm';
    }

    // Nếu bật cờ cấp tài khoản hệ thống: Bắt buộc phải có Số điện thoại hoặc Email
    if (formData.createSystemAccount && !employee?.userId) {
      if (!formData.phone?.trim() && !formData.email?.trim()) {
        newErrors.phone = 'Cần nhập Số điện thoại hoặc Email để cấp tài khoản đăng nhập';
        newErrors.email = 'Cần nhập Số điện thoại hoặc Email để cấp tài khoản đăng nhập';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(
        'Vui lòng kiểm tra và sửa các thông tin bị lỗi màu đỏ!',
        'Dữ liệu chưa hợp lệ'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const basePayload = {
        fullName: formData.fullName.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        idCardNumber: formData.idCardNumber?.trim() || null,
        dateOfBirth: formData.dateOfBirth,
        department: formData.department,
        position: formData.position,
        joinedDate: formData.joinedDate,
        baseSalary: formData.baseSalary ? Number(formData.baseSalary) : 0,
        hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : 0,
        contractType: formData.contractType || 'FULL_TIME',
        status: formData.status || 'ACTIVE',
        farmId: formData.farmId ? Number(formData.farmId) : null,
        createSystemAccount: Boolean(formData.createSystemAccount),
      };

      if (isEdit) {
        // Cập nhật thông tin nhân viên
        await employeeApi.updateEmployee(employee.id, basePayload);
        toast.success(`Cập nhật thông tin nhân viên ${basePayload.fullName} thành công!`);
      } else {
        // Tạo mới: Tuyệt đối không gửi employeeCode, Backend tự sinh an toàn đa luồng
        const res = await employeeApi.createEmployee(basePayload);
        const createdCode = res?.data?.employeeCode || '';
        toast.success(
          `Thêm mới nhân viên ${basePayload.fullName} thành công! (Mã NV: ${createdCode})`
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu nhân viên:', err);
      const apiDetails = err.response?.data?.details || err.details;
      if (apiDetails && typeof apiDetails === 'object') {
        setErrors(apiDetails);
      }
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể lưu thông tin nhân viên. Vui lòng kiểm tra lại.';
      toast.error(msg, 'Lỗi thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isEdit ? 'Chỉnh sửa Hồ sơ Nhân viên' : 'Thêm mới Nhân viên'}
              </h3>
              <p className="text-xs text-emerald-100">
                {isEdit
                  ? `Mã nhân viên: ${formData.employeeCode}`
                  : 'Nghiệp vụ 4.1: Quản lý hồ sơ nhân sự, hợp đồng & vị trí'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Nhóm 1: Thông tin cơ bản */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Thông tin định danh cá nhân
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mã nhân viên: Tự động sinh khi tạo mới, khóa khi chỉnh sửa */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã nhân viên
                  </label>
                  {isEdit ? (
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        disabled
                        value={formData.employeeCode}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-semibold text-sm cursor-not-allowed"
                      />
                    </div>
                  ) : (
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 text-emerald-800 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">
                        Mã nhân viên sẽ được hệ thống tự động cấp sau khi lưu
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                    placeholder="VD: Nguyễn Văn An"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.fullName
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                        : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email liên hệ
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="VD: vanan@greenfarm.vn"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.email
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                          : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="VD: 0912345678"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.phone
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                          : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày sinh (Tối thiểu 18 tuổi) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      max={maxDate18YearsAgo}
                      value={formData.dateOfBirth}
                      onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.dateOfBirth
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                          : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số CMND / Căn cước công dân
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.idCardNumber}
                      onChange={(e) => handleFieldChange('idCardNumber', e.target.value)}
                      placeholder="VD: 079201001234"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.idCardNumber
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                          : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.idCardNumber && (
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.idCardNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trang trại công tác (The Farm Barrier Guard)
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={formData.farmId}
                      onChange={(e) => handleFieldChange('farmId', e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="">-- Văn phòng điều hành / Toàn doanh nghiệp --</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Nhóm 2: Vị trí & Công việc (Dependent Cascading Dropdowns) */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" /> Vị trí công việc & Phòng ban (Ma trận nghiệp vụ)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Phòng ban Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phòng ban / Bộ phận <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white ${
                      errors.department
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                        : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                  >
                    <option value="">-- Chọn phòng ban trực thuộc --</option>
                    {Object.entries(DEPARTMENT_LABELS).map(([deptKey, deptLabel]) => (
                      <option key={deptKey} value={deptKey}>
                        {deptLabel}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.department}
                    </p>
                  )}
                </div>

                {/* 2. Vị trí Dropdown (Cascading từ Department) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chức vụ / Vị trí công tác <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.position}
                    disabled={!formData.department}
                    onChange={(e) => handlePositionChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white ${
                      errors.position
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                        : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                    } ${!formData.department ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {formData.department
                        ? '-- Chọn vị trí chuyên môn --'
                        : '-- Vui lòng chọn phòng ban trước --'}
                    </option>
                    {formData.department &&
                      (DEPARTMENT_POSITIONS[formData.department] || []).map((posKey) => (
                        <option key={posKey} value={posKey}>
                          {POSITION_LABELS[posKey] || posKey}
                        </option>
                      ))}
                  </select>
                  {errors.position && (
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.position}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày bắt đầu làm việc <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={formData.joinedDate}
                      onChange={(e) => handleFieldChange('joinedDate', e.target.value)}
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.joinedDate
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                          : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.joinedDate && (
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.joinedDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loại hợp đồng lao động
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => handleFieldChange('contractType', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
                    <option value="PART_TIME">Bán thời gian (Part-time)</option>
                    <option value="SEASONAL">Thời vụ theo vụ mùa (Seasonal)</option>
                    <option value="INTERN">Thực tập sinh (Intern)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Nhóm Cấp tài khoản truy cập hệ thống SaaS (Account Provisioning) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-emerald-200/80 shadow-sm transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <label
                      htmlFor="createSystemAccountToggle"
                      className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2"
                    >
                      Cấp tài khoản truy cập hệ thống
                      {formData.createSystemAccount && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          BẬT (ON)
                        </span>
                      )}
                    </label>
                    <p className="text-xs text-slate-500">
                      Chuẩn SaaS Account Provisioning: Tự động khởi tạo tài khoản đăng nhập (Module 7.1)
                    </p>
                  </div>
                </div>

                {/* Switch / Checkbox Nút gạt */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="createSystemAccountToggle"
                    type="checkbox"
                    checked={Boolean(formData.createSystemAccount)}
                    disabled={Boolean(employee?.userId)}
                    onChange={(e) => handleFieldChange('createSystemAccount', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-60 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>

              {/* Dòng Helper text khi nút gạt được Bật (ON) */}
              {formData.createSystemAccount && (
                <div className="mt-4 pt-3.5 border-t border-emerald-200/60 animate-fadeIn">
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-emerald-950 text-xs shadow-sm space-y-2">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-slate-700 leading-relaxed">
                        Tài khoản sẽ được tự động tạo. Tên đăng nhập là <strong className="text-slate-900 font-bold">Số điện thoại</strong> (hoặc Email). Mật khẩu mặc định là <strong className="text-slate-900 font-bold">Ngày sinh viết liền</strong> (VD: 26/05/2005 -&gt; 26052005). Nhân viên sẽ bị ép đổi mật khẩu mạnh ở lần đăng nhập đầu tiên.
                      </p>
                    </div>

                    {/* Preview thông tin đăng nhập tự động */}
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">Tên đăng nhập tự cấp: </span>
                        <span className="font-mono font-bold text-emerald-900">
                          {formData.phone?.trim() || formData.email?.trim() || '(Nhập SĐT hoặc Email ở trên)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Mật khẩu ban đầu (ddMMyyyy): </span>
                        <span className="font-mono font-bold text-emerald-900">
                          {formData.dateOfBirth
                            ? formData.dateOfBirth.split('-').reverse().join('')
                            : '(Nhập ngày sinh ở trên)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Badge thông báo nếu đã có tài khoản */}
              {employee?.userId && (
                <div className="mt-3 text-xs text-emerald-700 font-medium flex items-center gap-1.5 pt-2 border-t border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Hồ sơ nhân viên này đã được liên kết với tài khoản hệ thống (User ID: {employee.userId}).
                </div>
              )}
            </div>

            {/* Nhóm 3: Chế độ đãi ngộ & Trạng thái */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" /> Chế độ đãi ngộ & Trạng thái hoạt động
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lương cơ bản (VNĐ/tháng)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.baseSalary}
                    onChange={(e) => handleFieldChange('baseSalary', e.target.value)}
                    placeholder="VD: 10000000"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.baseSalary
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                        : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                  />
                  {errors.baseSalary && (
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.baseSalary}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lương theo giờ (VNĐ/giờ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formData.hourlyRate}
                    onChange={(e) => handleFieldChange('hourlyRate', e.target.value)}
                    placeholder="VD: 50000"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.hourlyRate
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                        : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                  />
                  {errors.hourlyRate && (
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.hourlyRate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái nhân sự
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="ACTIVE">Đang làm việc (Active)</option>
                    <option value="ON_LEAVE">Nghỉ phép (On Leave)</option>
                    <option value="RESIGNED">Đã thôi việc (Resigned)</option>
                    <option value="TERMINATED">Chấm dứt hợp đồng (Terminated)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting
                ? 'Đang lưu...'
                : isEdit
                ? 'Cập nhật nhân viên'
                : 'Lưu & Cấp mã nhân viên'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
