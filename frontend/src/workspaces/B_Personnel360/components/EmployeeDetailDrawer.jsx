import React, { useState, useEffect } from 'react';
import {
  FileText,
  KeyRound,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Building2,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Edit2,
  UserCheck,
  Hourglass,
  CalendarCheck,
  RotateCcw,
} from 'lucide-react';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import { hrService } from '@/services/modules/hrService';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';

// Danh mục 4 Role Cấp 4 (Maker / Chuyên môn) dành cho Giám đốc trang trại bổ nhiệm
const TIER4_ROLES = [
  { value: 'ROLE_FIELD_STAFF', label: 'Nhân viên hiện trường (ROLE_FIELD_STAFF)' },
  { value: 'ROLE_TECHNICAL_STAFF', label: 'Kỹ sư kỹ thuật / Thú y / KCS (ROLE_TECHNICAL_STAFF)' },
  { value: 'ROLE_WAREHOUSE_STAFF', label: 'Thủ kho vật tư & hàng hóa (ROLE_WAREHOUSE_STAFF)' },
  { value: 'ROLE_ACCOUNTANT', label: 'Kế toán trang trại (ROLE_ACCOUNTANT)' },
];

// Danh mục Role dành cho Chủ đầu tư (ROLE_FARM_OWNER) bổ nhiệm
const OWNER_AVAILABLE_ROLES = [
  { value: 'ROLE_FARM_MANAGER', label: 'Giám đốc / Quản lý trang trại (ROLE_FARM_MANAGER)' },
  ...TIER4_ROLES,
];

export function EmployeeDetailDrawer({
  isOpen,
  onClose,
  employee,
  onEdit,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const { isOwner, isFarmManager } = useAuthStore();
  const { activeFarmId, syncTrigger } = useActiveFarmStore();
  const owner = isOwner();
  const farmManager = isFarmManager();

  // Role options hiển thị theo cấp bậc phân quyền
  const availableRoles = owner ? OWNER_AVAILABLE_ROLES : TIER4_ROLES;

  // Provisioning Form state
  const [username, setUsername] = useState('');
  const [initialPassword, setInitialPassword] = useState('Password@123');
  const [selectedRole, setSelectedRole] = useState(
    owner ? 'ROLE_FARM_MANAGER' : 'ROLE_FIELD_STAFF'
  );
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState(null);
  const [provisionSuccess, setProvisionSuccess] = useState(false);

  // Quản trị tài khoản SaaS (Lock/Unlock, Role, Reset Password)
  const [targetRole, setTargetRole] = useState('ROLE_FIELD_STAFF');
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('Farm@123456');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Ledger stats state
  const [ledgerStats, setLedgerStats] = useState({
    totalWorkDays: 22,
    totalWorkingHours: 176.0,
    totalLateMinutes: 15,
    totalEarlyLeaveMinutes: 0,
    approvedOtHours: 8.0,
    remainingLeaveDays: employee?.annualLeaveQuota || 12.0,
  });

  useEffect(() => {
    if (employee) {
      setUsername(employee.phone?.replace(/[^0-9]/g, '') || employee.employeeCode?.toLowerCase() || '');
      setProvisionError(null);
      setProvisionSuccess(false);
      const currentRole = employee.userRole || employee.userRoles?.[0];
      setTargetRole(currentRole || (owner ? 'ROLE_FARM_MANAGER' : 'ROLE_FIELD_STAFF'));
    }
  }, [employee, owner]);

  // GAP-SYNC-05: Lắng nghe syncTrigger để tự động làm mới hồ sơ nhân sự đang mở
  useEffect(() => {
    if (isOpen && employee?.id) {
      onRefresh?.();
    }
  }, [isOpen, employee?.id, syncTrigger?.employees, syncTrigger?.attendance, syncTrigger?.all]);

  const handleProvisionAccount = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setProvisionError('Tên đăng nhập không được để trống');
      return;
    }

    try {
      setIsProvisioning(true);
      setProvisionError(null);
      await hrService.provisionAccount(employee.id, {
        username: username.trim(),
        initialPassword: initialPassword || 'Password@123',
        email: employee.email || null,
        roles: [selectedRole],
      });
      setProvisionSuccess(true);
      onRefresh?.();
    } catch (err) {
      console.error('Provision account error:', err);
      setProvisionError(err.response?.data?.message || err.message || 'Lỗi cấp tài khoản');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleToggleUserStatus = async (newStatus) => {
    if (!employee?.userId) return;
    try {
      setIsTogglingStatus(true);
      await hrService.updateUserStatus(employee.userId, newStatus);
      toast.success(newStatus === 'ACTIVE' ? 'Đã mở khóa tài khoản nhân viên thành công!' : 'Đã khóa tài khoản nhân viên (đã thu hồi phiên đăng nhập)!');
      onRefresh?.();
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleSaveUserRole = async () => {
    if (!employee?.userId) return;
    try {
      setIsUpdatingRole(true);
      await hrService.updateUserRoles(employee.userId, {
        roles: [targetRole],
        assignedFarmIds: employee.farmId ? [employee.farmId] : [],
      });
      toast.success('Đã cập nhật vai trò người dùng thành công!');
      onRefresh?.();
    } catch (err) {
      console.error('Update role error:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi cập nhật vai trò');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!employee?.userId) return;
    const passwordToSet = tempPassword.trim() || 'Farm@123456';
    try {
      setIsResettingPassword(true);
      const res = await hrService.resetUserPassword(employee.userId, passwordToSet);
      const finalPass = res?.temporaryPassword || passwordToSet;
      toast.success(`Đã reset mật khẩu thành công! Mật khẩu tạm: ${finalPass}`);
      setIsResetPasswordModalOpen(false);
      setTempPassword('Farm@123456');
      onRefresh?.();
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi đặt lại mật khẩu');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const isTargetFm = employee?.position === 'FARM_MANAGER' || employee?.userRole === 'ROLE_FARM_MANAGER';
  const canEditProfile = owner || (farmManager && !isTargetFm);
  const canManageThisUser = owner || (farmManager && !isTargetFm);

  if (!employee) return null;

  return (
    <>
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={employee.fullName}
      subtitle={`Mã nhân viên: ${employee.employeeCode} • ${employee.farmName || (employee.farmId ? `Trang trại #${employee.farmId}` : 'Toàn Chuỗi')}`}
      icon={<User className="h-5 w-5 text-emerald-600" />}
      tabs={[
        { id: 'profile', label: '1. Lý Lịch & Hợp Đồng', icon: FileText },
        {
          id: 'saas',
          label: '2. Tài Khoản SaaS',
          icon: KeyRound,
          badge: employee.userId ? 'Đã Cấp' : 'Chưa Cấp',
        },
        { id: 'ledger', label: '3. Công & Lương Cá Nhân', icon: Clock },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">
            Ngày tạo: {formatDate(employee.createdAt)}
          </span>
          <div className="flex items-center gap-2">
            {canEditProfile && (
              <Button
                variant="outline"
                size="sm"
                icon={<Edit2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  onEdit?.(employee);
                }}
              >
                Chỉnh Sửa Hồ Sơ
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Đóng Khay
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ==================================================== */}
        {/* TAB 1: LÝ LỊCH & HỢP ĐỒNG                            */}
        {/* ==================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Thẻ tóm tắt thông tin */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white text-xl font-bold shadow-md shadow-emerald-600/20">
                {employee.fullName?.charAt(0) || 'NV'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {employee.fullName}
                  </h3>
                  <StatusBadge status={employee.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chức vụ: <strong className="text-slate-800">{employee.position || '—'}</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Trực thuộc:{' '}
                  <span className="font-semibold text-emerald-700">
                    {employee.farmName || 'Văn phòng Tổng công ty'}
                  </span>
                </p>
              </div>
            </div>

            {/* Chi tiết lý lịch */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="h-4 w-4 text-slate-400" />
                <span>Thông Tin Nhận Diện & Liên Hệ</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Mã nhân viên:</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {employee.employeeCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Ngày sinh:</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(employee.dateOfBirth) || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Số CCCD / CMND:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {employee.idCardNumber || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Số điện thoại:</span>
                  <span className="font-mono font-medium text-slate-800 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {employee.phone || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Email liên hệ:</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {employee.email || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Trang trại trực thuộc:</span>
                  <span className="font-semibold text-emerald-800 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                    {employee.farmName || (employee.farmId ? `Trang trại #${employee.farmId}` : 'Văn phòng Tổng')}
                  </span>
                </div>
              </div>
            </div>

            {/* Hợp đồng & Chế độ đãi ngộ */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>Hợp Đồng Lao Động & Chế Độ Lương Thưởng</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Loại hợp đồng:</span>
                  <span className="font-semibold text-slate-800">
                    {employee.contractType === 'FULL_TIME'
                      ? 'Toàn thời gian (FULL_TIME)'
                      : employee.contractType === 'PART_TIME'
                      ? 'Bán thời gian (PART_TIME)'
                      : employee.contractType === 'SEASONAL'
                      ? 'Thời vụ mùa vụ (SEASONAL)'
                      : 'Thực tập sinh (INTERN)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Ngày gia nhập:</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(employee.joinedDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Mức lương cơ bản:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatCurrency(employee.baseSalary)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Đơn giá giờ công:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(employee.hourlyRate)} / giờ
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Quỹ phép năm:</span>
                  <span className="font-bold text-blue-700">
                    {employee.annualLeaveQuota || 12.0} ngày / năm
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: CẤP TÀI KHOẢN SAAS & PHÂN QUYỀN RBAC          */}
        {/* ==================================================== */}
        {activeTab === 'saas' && (
          <div className="space-y-6">
            {employee.userId ? (
              // ĐÃ CẤP TÀI KHOẢN SAAS
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">
                        Tài Khoản SaaS Đang Hoạt Động
                      </h4>
                      <p className="text-xs text-emerald-700">
                        Nhân viên đã được cấp quyền truy cập hệ thống Farm Management
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={employee.userStatus || 'ACTIVE'} size="sm" />
                </div>

                <div className="rounded-xl bg-white p-4 border border-emerald-100 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Mã User ID:</span>
                    <span className="font-mono font-bold text-slate-900">{employee.userId}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Tên đăng nhập (Username):</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                      {employee.username || employee.phone || employee.employeeCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Vai trò hiện tại (Role):</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                      {employee.userRole || (employee.userRoles?.length > 0 ? employee.userRoles.join(', ') : 'ROLE_FIELD_STAFF')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Trạng thái tài khoản:</span>
                    <StatusBadge status={employee.userStatus || 'ACTIVE'} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Chính sách bảo mật:</span>
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Yêu cầu đổi MK khi reset (mustChangePassword)
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Phạm vi trang trại được gán (user_farm_access):
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      {employee.farmName || 'Toàn bộ trang trại trong Tenant'}
                    </span>
                  </div>
                </div>

                {/* KHỐI QUẢN TRỊ TÀI KHOẢN CẤP 4 / CẤP DƯỚI */}
                <Can permission="PERM_HR_EMPLOYEE_MANAGE" role={["ROLE_FARM_OWNER", "ROLE_FARM_MANAGER"]}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2 pb-2 border-b border-slate-100">
                      <KeyRound className="h-4 w-4 text-emerald-600" />
                      <span>Quản Trị Tài Khoản & Phân Quyền</span>
                    </h5>

                    {!canManageThisUser ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Chỉ Chủ sở hữu (Owner) mới có quyền quản lý tài khoản của Giám đốc / Quản lý trang trại.</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* 1. Nút Khóa / Mở Khóa */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              Trạng thái kích hoạt tài khoản
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {employee.userStatus === 'ACTIVE'
                                ? 'Khóa tài khoản sẽ thu hồi phiên đăng nhập ngay lập tức'
                                : 'Mở khóa tài khoản để cho phép người dùng đăng nhập lại'}
                            </div>
                          </div>
                          {canManageThisUser ? (
                            employee.userStatus === 'ACTIVE' ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-rose-600 border-rose-300 hover:bg-rose-50 font-bold"
                                icon={<Lock className="h-3.5 w-3.5" />}
                                isLoading={isTogglingStatus}
                                onClick={() => handleToggleUserStatus('LOCKED')}
                              >
                                [🔒 Khóa Tài Khoản]
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
                                icon={<Unlock className="h-3.5 w-3.5" />}
                                isLoading={isTogglingStatus}
                                onClick={() => handleToggleUserStatus('ACTIVE')}
                              >
                                [🔓 Mở Khóa Tài Khoản]
                              </Button>
                            )
                          ) : (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              employee.userStatus === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {employee.userStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Đang bị khóa'}
                            </span>
                          )}
                        </div>

                        {/* 2. Khối Đổi Vai Trò */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                          <label className="text-xs font-bold text-slate-800 block">
                            Điều chỉnh vai trò (Role):
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Select
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                options={availableRoles}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              isLoading={isUpdatingRole}
                              onClick={handleSaveUserRole}
                              icon={<UserCheck className="h-3.5 w-3.5" />}
                            >
                              Lưu Vai Trò
                            </Button>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {farmManager && !owner
                              ? 'Giám đốc trại được quyền chuyển đổi giữa 4 vai trò Cấp 4 của trang trại.'
                              : 'Chủ sở hữu có thể phân bổ vai trò Giám đốc hoặc chuyên môn.'}
                          </p>
                        </div>

                        {/* 3. Nút Reset Mật Khẩu */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              Đặt lại mật khẩu cho nhân viên
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Khởi tạo mật khẩu tạm, bật cờ bắt buộc đổi mật khẩu ở lần đăng nhập tới
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<RotateCcw className="h-3.5 w-3.5 text-blue-600" />}
                            onClick={() => setIsResetPasswordModalOpen(true)}
                          >
                            [🔑 Reset Mật Khẩu]
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Can>
              </div>
            ) : (
              // CHƯA CẤP TÀI KHOẢN SAAS -> FORM CẤP MỚI
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">
                      Cấp Tài Khoản Truy Cập Hệ Thống SaaS
                    </h4>
                    <p className="text-xs text-blue-700">
                      Kích hoạt tài khoản để nhân viên chấm công GPS/Selfie và nhận việc trên Mobile
                    </p>
                  </div>
                </div>

                {provisionSuccess && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Đã cấp tài khoản SaaS thành công cho nhân viên này!</span>
                  </div>
                )}

                {provisionError && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{provisionError}</span>
                  </div>
                )}

                <form onSubmit={handleProvisionAccount} className="space-y-4 pt-2">
                  <FormField label="Tên Đăng Nhập (Username)" required>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="VD: 0912345678 hoặc emp001"
                    />
                  </FormField>

                  <FormField
                    label="Mật Khẩu Khởi Tạo Tạm Thời"
                    required
                    hint="Hệ thống tự động bật cờ mustChangePassword=true để buộc đổi mật khẩu khi đăng nhập lần đầu"
                  >
                    <Input
                      value={initialPassword}
                      onChange={(e) => setInitialPassword(e.target.value)}
                      placeholder="Password@123"
                    />
                  </FormField>

                  <FormField
                    label="Vai Trò Cấp Quyền (SaaS Role)"
                    required
                    hint={
                      farmManager
                        ? 'Giám đốc trại chỉ được phân quyền 4 vai trò Maker cấp trại'
                        : 'Chủ đầu tư phân quyền Giám đốc hoặc nhân sự cấp trại'
                    }
                  >
                    <Select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      options={availableRoles}
                    />
                  </FormField>

                  <Can permission="PERM_HR_EMPLOYEE_MANAGE">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full mt-2"
                      icon={<ShieldCheck className="h-4 w-4" />}
                      isLoading={isProvisioning}
                      loadingText="Đang kích hoạt tài khoản..."
                    >
                      Xác Nhận Kích Hoạt Tài Khoản SaaS
                    </Button>
                  </Can>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: TỔNG HỢP CÔNG & LƯƠNG CÁ NHÂN                 */}
        {/* ==================================================== */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            {/* Lưới 4 chỉ số thống kê công */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Tổng Ngày Công Chuẩn
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {ledgerStats.totalWorkDays}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">ngày</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Tổng Giờ Làm Việc
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-emerald-700 font-mono">
                    {formatNumber(ledgerStats.totalWorkingHours, 1)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">giờ</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Giờ Tăng Ca (OT) Đã Duyệt
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-indigo-700 font-mono">
                    {formatNumber(ledgerStats.approvedOtHours, 1)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">giờ</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Quỹ Phép Còn Lại
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-blue-700 font-mono">
                    {formatNumber(ledgerStats.remainingLeaveDays, 1)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">ngày</span>
                </div>
              </div>
            </div>

            {/* Chi tiết vi phạm kỷ luật công */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Hourglass className="h-4 w-4 text-amber-500" />
                <span>Kỷ Luật Giờ Công (Đi Muộn / Về Sớm)</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
                  <span className="text-slate-500 block mb-1">Số phút đi muộn tích lũy:</span>
                  <span className="text-lg font-bold text-amber-800 font-mono">
                    {ledgerStats.totalLateMinutes} phút
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Số phút về sớm:</span>
                  <span className="text-lg font-bold text-slate-800 font-mono">
                    {ledgerStats.totalEarlyLeaveMinutes} phút
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SlideOverDrawer>

    {/* Modal Reset Mật Khẩu */}
    <Modal
      isOpen={isResetPasswordModalOpen}
      onClose={() => setIsResetPasswordModalOpen(false)}
      title="Đặt Lại Mật Khẩu Tài Khoản"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsResetPasswordModalOpen(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isResettingPassword}
            onClick={handleConfirmResetPassword}
          >
            Xác Nhận Đặt Lại
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600">
          Đặt lại mật khẩu cho tài khoản <strong>{employee.username || employee.employeeCode}</strong> ({employee.fullName}).
        </p>
        <FormField
          label="Mật Khẩu Tạm Thời Mới"
          required
          hint="Mặc định: Farm@123456 hoặc tự chỉ định mật khẩu mới"
        >
          <Input
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            placeholder="Farm@123456"
          />
        </FormField>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            Hệ thống sẽ tự động bật cờ <strong>mustChangePassword</strong> và thu hồi toàn bộ phiên đăng nhập cũ. Nhân viên bắt buộc phải đổi mật khẩu ở lần đăng nhập tiếp theo.
          </div>
        </div>
      </div>
    </Modal>
    </>
  );
}

export default EmployeeDetailDrawer;
