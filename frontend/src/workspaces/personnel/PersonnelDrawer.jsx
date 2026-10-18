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
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Can } from '../../permissions/Can';
import { employeeApi } from '../../services/employeeApi';
import { toast } from '../../store/ui/useToastStore';
import {
  DEPARTMENT_LABELS,
  POSITION_LABELS,
  DEPARTMENT_POSITIONS,
} from '../../pages/hr/employees/employeeConstants';

// Helper xác định mặc định bật/tắt cấp tài khoản truy cập hệ thống theo vị trí
const shouldDefaultAccountOn = (pos) => {
  if (!pos) return false;
  const p = String(pos).toUpperCase();
  if (p === 'WORKER') return false;
  return ['FARM_MANAGER', 'ACCOUNTANT', 'HR', 'TECHNICAL_LEAD', 'TECHNICAL_STAFF', 'WAREHOUSE_KEEPER'].includes(p);
};

/**
 * Slide-over Drawer cho Hồ Sơ Nhân Sự 360 Độ (Workspace B).
 * Chia 2 Tabs:
 * - Tab 1: Lý lịch & Hợp đồng lao động (Module 4.1)
 * - Tab 2: Tài khoản SaaS & Phân quyền truy cập hệ thống (Module 7.1)
 */
export const PersonnelDrawer = ({
  isOpen,
  onClose,
  onSuccess,
  employee = null,
  farms = [],
}) => {
  const isEdit = Boolean(employee);
  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE' | 'ACCOUNT'

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
        farmId: farms[0] ? String(farms[0].id) : '',
        createSystemAccount: false,
      });
    }
    setErrors({});
    setActiveTab('PROFILE');
  }, [employee, isOpen, farms]);

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleDepartmentChange = (dept) => {
    const validPositions = DEPARTMENT_POSITIONS[dept] || [];
    const firstPos = validPositions[0] || '';
    const shouldAccount = !isEdit && shouldDefaultAccountOn(firstPos);

    setFormData((prev) => ({
      ...prev,
      department: dept,
      position: firstPos,
      createSystemAccount: isEdit ? prev.createSystemAccount : shouldAccount,
    }));

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.department;
      delete copy.position;
      return copy;
    });
  };

  const handlePositionChange = (pos) => {
    const shouldAccount = !isEdit && shouldDefaultAccountOn(pos);
    setFormData((prev) => ({
      ...prev,
      position: pos,
      createSystemAccount: isEdit ? prev.createSystemAccount : shouldAccount,
    }));

    if (errors.position) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.position;
        return copy;
      });
    }
  };

  // Validation gắt gao theo Master Validation Constraints
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên nhân viên không được để trống';
    } else if (formData.fullName.trim().length < 2 || formData.fullName.trim().length > 100) {
      newErrors.fullName = 'Họ và tên phải từ 2 đến 100 ký tự';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Địa chỉ email không đúng định dạng (VD: example@farm.com)';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else {
      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Số điện thoại Việt Nam không hợp lệ (10 chữ số, đầu số 03, 05, 07, 08, 09)';
      }
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      if (dob > minAgeDate) {
        newErrors.dateOfBirth = 'Nhân viên phải từ đủ 18 tuổi trở lên (Tuân thủ Bộ luật Lao động)';
      }
    }

    if (!formData.department) {
      newErrors.department = 'Vui lòng chọn phòng ban trực thuộc';
    }

    if (!formData.position) {
      newErrors.position = 'Vui lòng chọn vị trí công tác chuyên môn';
    }

    if (!formData.joinedDate) {
      newErrors.joinedDate = 'Ngày vào làm là bắt buộc';
    }

    if (formData.idCardNumber && !/^[0-9]{9,12}$/.test(formData.idCardNumber.trim())) {
      newErrors.idCardNumber = 'Số CMND/CCCD phải chứa từ 9 đến 12 chữ số';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setActiveTab('PROFILE'); // Chuyển về tab lý lịch nếu có lỗi nhập liệu
      toast.error('Vui lòng kiểm tra và sửa các thông tin bị báo đỏ trước khi lưu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim(),
        idCardNumber: formData.idCardNumber.trim() || null,
        dateOfBirth: formData.dateOfBirth,
        department: formData.department,
        position: formData.position,
        joinedDate: formData.joinedDate,
        baseSalary: formData.baseSalary ? Number(formData.baseSalary) : null,
        hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : null,
        contractType: formData.contractType,
        status: formData.status,
        farmId: formData.farmId ? Number(formData.farmId) : null,
        createSystemAccount: Boolean(formData.createSystemAccount),
      };

      if (isEdit) {
        await employeeApi.updateEmployee(employee.id, payload);
        toast.success(`Đã cập nhật hồ sơ nhân viên "${payload.fullName}" thành công`);
      } else {
        await employeeApi.createEmployee(payload);
        const accountMsg = payload.createSystemAccount
          ? ' và tự động cấp tài khoản SaaS thành công!'
          : '!';
        toast.success(`Đã tạo hồ sơ nhân viên "${payload.fullName}"${accountMsg}`);
      }

      onSuccess();
    } catch (err) {
      console.error('Lỗi khi lưu nhân viên:', err);
      const backendMsg = err.response?.data?.message || err.message || 'Lưu nhân viên thất bại.';
      toast.error(backendMsg, 'Lỗi thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
          {/* 1. Header Drawer */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {isEdit ? `Hồ Sơ 360°: ${formData.fullName}` : 'Thêm Mới Hồ Sơ Nhân Sự 360°'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Không gian quản trị hợp nhất Lý lịch lao động & Tài khoản truy cập SaaS
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Drawer Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-6 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('PROFILE')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'PROFILE'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Tab 1: Lý Lịch & Hợp Đồng</span>
              {Object.keys(errors).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ACCOUNT')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'ACCOUNT'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Tab 2: Tài Khoản SaaS & Phân Quyền</span>
              {formData.createSystemAccount && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono">
                  ON
                </span>
              )}
            </button>
          </div>

          {/* 3. Drawer Form Content (Scrollable) */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'PROFILE' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Thông tin định danh */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Thông tin cơ bản
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Họ và tên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleFieldChange('fullName', e.target.value)}
                        placeholder="VD: Nguyễn Văn An"
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                          errors.fullName
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                            : 'border-slate-200 focus:ring-emerald-500'
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="VD: 0912345678"
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                          errors.phone
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                            : 'border-slate-200 focus:ring-emerald-500'
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        placeholder="VD: an.nguyen@farm.com"
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                          errors.email
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                            : 'border-slate-200 focus:ring-emerald-500'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ngày sinh (Từ 18 tuổi) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        max={maxDate18YearsAgo}
                        value={formData.dateOfBirth}
                        onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                          errors.dateOfBirth
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                            : 'border-slate-200 focus:ring-emerald-500'
                        }`}
                      />
                      {errors.dateOfBirth && (
                        <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.dateOfBirth}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Số CCCD / CMND
                      </label>
                      <input
                        type="text"
                        value={formData.idCardNumber}
                        onChange={(e) => handleFieldChange('idCardNumber', e.target.value)}
                        placeholder="VD: 079201001234"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Trang trại công tác (Farm Barrier)
                      </label>
                      <select
                        value={formData.farmId}
                        onChange={(e) => handleFieldChange('farmId', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Thuộc Doanh nghiệp / Toàn hệ thống --</option>
                        {farms.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Phân bổ chuyên môn & Vị trí */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5" /> Chuyên môn & Hợp đồng
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phòng ban <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 ${
                          errors.department
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                            : 'border-slate-200 focus:ring-emerald-500'
                        }`}
                      >
                        <option value="">-- Chọn phòng ban --</option>
                        {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      {errors.department && (
                        <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.department}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vị trí công tác <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.position}
                        disabled={!formData.department}
                        onChange={(e) => handlePositionChange(e.target.value)}
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 ${
                          errors.position
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                            : 'border-slate-200 focus:ring-emerald-500'
                        } ${!formData.department ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                      >
                        <option value="">-- Chọn vị trí --</option>
                        {formData.department &&
                          (DEPARTMENT_POSITIONS[formData.department] || []).map((posKey) => (
                            <option key={posKey} value={posKey}>
                              {POSITION_LABELS[posKey] || posKey}
                            </option>
                          ))}
                      </select>
                      {errors.position && (
                        <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.position}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ngày bắt đầu làm việc <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.joinedDate}
                        onChange={(e) => handleFieldChange('joinedDate', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Loại hợp đồng
                      </label>
                      <select
                        value={formData.contractType}
                        onChange={(e) => handleFieldChange('contractType', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
                        <option value="PART_TIME">Bán thời gian (Part-time)</option>
                        <option value="SEASONAL">Thời vụ nông nghiệp (Seasonal)</option>
                        <option value="INTERN">Thực tập sinh (Intern)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lương cơ bản (VNĐ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100000"
                        value={formData.baseSalary}
                        onChange={(e) => handleFieldChange('baseSalary', e.target.value)}
                        placeholder="VD: 12000000"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Trạng thái hoạt động
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleFieldChange('status', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="ACTIVE">Đang làm việc (Active)</option>
                        <option value="ON_LEAVE">Nghỉ phép (On Leave)</option>
                        <option value="RESIGNED">Đã thôi việc (Resigned)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ACCOUNT' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Switch Cấp tài khoản */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-emerald-200/80 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <label
                          htmlFor="drawerCreateAccountToggle"
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
                          Khởi tạo tài khoản SaaS đồng thời với hồ sơ nhân sự (Module 7.1)
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="drawerCreateAccountToggle"
                        type="checkbox"
                        checked={Boolean(formData.createSystemAccount)}
                        disabled={Boolean(employee?.userId)}
                        onChange={(e) => handleFieldChange('createSystemAccount', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-60 peer-disabled:cursor-not-allowed"></div>
                    </label>
                  </div>

                  {formData.createSystemAccount && (
                    <div className="mt-4 pt-3.5 border-t border-emerald-200/60 space-y-3">
                      <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-xs space-y-2">
                        <div className="flex items-start gap-2.5">
                          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <p className="text-slate-700 leading-relaxed">
                            Tài khoản sẽ được tự động tạo. Tên đăng nhập là <strong className="text-slate-900 font-bold">Số điện thoại</strong>. Mật khẩu mặc định là <strong className="text-slate-900 font-bold">Ngày sinh viết liền (ddMMyyyy)</strong>. Nhân viên sẽ bị ép đổi mật khẩu mạnh ở lần đăng nhập đầu tiên.
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500">Tên đăng nhập: </span>
                            <span className="font-mono font-bold text-emerald-900">
                              {formData.phone?.trim() || '(Nhập SĐT ở Tab 1)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Mật khẩu ban đầu: </span>
                            <span className="font-mono font-bold text-emerald-900">
                              {formData.dateOfBirth
                                ? formData.dateOfBirth.split('-').reverse().join('')
                                : '(Nhập ngày sinh ở Tab 1)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-slate-700 text-xs">
                        <p className="font-semibold text-slate-800">Quyền truy cập hệ thống (RBAC):</p>
                        <p className="text-slate-500 mt-0.5">
                          Tự động gán quyền tương ứng với vị trí: <strong className="text-emerald-700">{formData.position ? (POSITION_LABELS[formData.position] || formData.position) : 'Chưa chọn'}</strong>
                        </p>
                      </div>
                    </div>
                  )}

                  {employee?.userId && (
                    <div className="mt-3 text-xs text-emerald-700 font-medium flex items-center gap-1.5 pt-2 border-t border-emerald-100">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Hồ sơ nhân viên này đã liên kết với tài khoản hệ thống (User ID: {employee.userId}).
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Footer Drawer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy Bỏ
              </Button>
              <Can permission="PERM_HR_EMPLOYEE_MANAGE" role="ROLE_FARM_OWNER">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Toàn Bộ Hồ Sơ'}</span>
                </Button>
              </Can>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonnelDrawer;
