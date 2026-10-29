import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  KeyRound,
  Lock,
  Unlock,
  UserPlus,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { platformService } from '@/services/modules/platformService';
import { toast } from '@/store/useToastStore';

/**
 * PlatformUsersConsole - Quản trị Người dùng & Chủ Đầu Tư Toàn Nền Tảng (GAP-SA-05)
 * Dành riêng cho ROLE_SUPER_ADMIN thực hiện hỗ trợ kỹ thuật và cứu hộ khẩn cấp
 */
export function PlatformUsersConsole({ tenants = [] }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [keyword, setKeyword] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [statusTargetUser, setStatusTargetUser] = useState(null);

  // Form states for Create User
  const [createUserForm, setCreateUserForm] = useState({
    tenantId: '',
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Form states for Reset Password
  const [tempPasswordInput, setTempPasswordInput] = useState('');
  const [resetResult, setResetResult] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        size: 100,
      };
      if (selectedTenantId) params.tenantId = selectedTenantId;
      if (selectedStatus && selectedStatus !== 'ALL') params.status = selectedStatus;
      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await platformService.getPlatformUsers(params);
      const userList = Array.isArray(res?.content)
        ? res.content
        : Array.isArray(res)
        ? res
        : [];
      setUsers(userList);
    } catch (err) {
      console.error('Fetch platform users error:', err);
      toast.error('Không thể tải danh sách tài khoản người dùng');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTenantId, selectedStatus, keyword]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handler Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createUserForm.tenantId) {
      toast.error('Vui lòng chọn Doanh nghiệp (Tenant)');
      return;
    }
    if (!createUserForm.username || !createUserForm.fullName || !createUserForm.email) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    try {
      setIsCreating(true);
      const payload = {
        tenantId: Number(createUserForm.tenantId),
        username: createUserForm.username.trim(),
        fullName: createUserForm.fullName.trim(),
        email: createUserForm.email.trim(),
        phone: createUserForm.phone?.trim() || null,
        password: createUserForm.password?.trim() || 'Farm@123456',
      };

      await platformService.createPlatformUser(payload);
      toast.success('Khởi tạo tài khoản Chủ đầu tư cho Doanh nghiệp thành công!');
      setIsCreateModalOpen(false);
      setCreateUserForm({
        tenantId: '',
        username: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
      });
      fetchUsers();
    } catch (err) {
      console.error('Create user error:', err);
      toast.error(err?.response?.data?.message || 'Lỗi khi khởi tạo tài khoản');
    } finally {
      setIsCreating(false);
    }
  };

  // Handler Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTargetUser) return;

    try {
      setIsResetting(true);
      const payload = tempPasswordInput.trim()
        ? { newPassword: tempPasswordInput.trim() }
        : {};

      const res = await platformService.resetPlatformUserPassword(resetTargetUser.id, payload);
      setResetResult(res);
      toast.success('Đặt lại mật khẩu khẩn cấp thành công!');
      fetchUsers();
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error(err?.response?.data?.message || 'Lỗi khi đặt lại mật khẩu');
    } finally {
      setIsResetting(false);
    }
  };

  // Handler Update Status (Lock/Unlock)
  const handleToggleStatus = async () => {
    if (!statusTargetUser) return;
    const newStatus = statusTargetUser.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';

    try {
      await platformService.updatePlatformUserStatus(statusTargetUser.id, {
        status: newStatus,
      });
      toast.success(
        newStatus === 'LOCKED'
          ? `Đã khóa tài khoản [${statusTargetUser.username}] và thu hồi phiên làm việc!`
          : `Đã mở khóa tài khoản [${statusTargetUser.username}] thành công!`
      );
      setStatusTargetUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Update user status error:', err);
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo username, họ tên, email, SĐT..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9.5 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Filter Tenant */}
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-slate-400" />
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-rose-500 focus:bg-white focus:outline-none"
            >
              <option value="">-- Tất cả Doanh nghiệp --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-rose-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="LOCKED">Đang khóa (LOCKED)</option>
              <option value="INACTIVE">Ngưng hoạt động (INACTIVE)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchUsers}
            title="Làm mới danh sách người dùng"
          >
            Làm Mới
          </Button>

          <Button
            type="button"
            variant="danger"
            size="md"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 font-bold shadow-md shadow-rose-600/20"
          >
            + Cấp Bổ Sung Tài Khoản
          </Button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Người Dùng / Họ Tên</th>
                <th className="px-5 py-3.5">Email & Điện Thoại</th>
                <th className="px-5 py-3.5">Doanh Nghiệp (Tenant)</th>
                <th className="px-5 py-3.5">Vai Trò Hệ Thống</th>
                <th className="px-5 py-3.5 text-center">Trạng Thái</th>
                <th className="px-5 py-3.5 text-right">Hỗ Trợ Kỹ Thuật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    Không tìm thấy tài khoản người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isLocked = u.status === 'LOCKED';
                  const isSuper = u.operationalRole === 'SUPER_ADMIN';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono text-slate-400">#{u.id}</td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-slate-500">@{u.username}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-slate-800 font-medium">{u.email}</div>
                        <div className="text-slate-400 text-[11px]">{u.phone || '—'}</div>
                      </td>

                      <td className="px-5 py-4">
                        {u.tenantName ? (
                          <div>
                            <span className="font-bold text-slate-800">{u.tenantName}</span>
                            <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                              {u.tenantCode}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <ShieldCheck className="h-3 w-3" /> Nền Tảng Toàn Cầu
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r) => (
                            <span
                              key={r.id || r.code}
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                r.code === 'ROLE_SUPER_ADMIN'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : r.code === 'ROLE_FARM_OWNER'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : r.code === 'ROLE_FARM_MANAGER'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r.name || r.code}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isLocked
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Hoạt động' : isLocked ? 'Đang khóa' : u.status}
                        </span>
                        {u.mustChangePassword && (
                          <div className="text-[10px] font-semibold text-amber-600 mt-1">
                            Yêu cầu đổi MK
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {!isSuper && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              icon={<KeyRound className="h-3.5 w-3.5 text-amber-600" />}
                              onClick={() => {
                                setResetTargetUser(u);
                                setTempPasswordInput('');
                                setResetResult(null);
                              }}
                              title="Đặt lại mật khẩu khẩn cấp"
                            >
                              Reset MK
                            </Button>

                            <Button
                              type="button"
                              variant={isLocked ? 'primary' : 'outline'}
                              size="xs"
                              icon={
                                isLocked ? (
                                  <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Lock className="h-3.5 w-3.5 text-rose-600" />
                                )
                              }
                              onClick={() => setStatusTargetUser(u)}
                              title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản khẩn cấp'}
                            >
                              {isLocked ? 'Mở Khóa' : 'Khóa'}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CẤP BỔ SUNG TÀI KHOẢN CHO TENANT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Cấp Bổ Sung Tài Khoản Cho Khách Thuê
                </h3>
                <p className="text-xs text-slate-500">
                  Khởi tạo thêm tài khoản Chủ đầu tư (ROLE_FARM_OWNER) cho doanh nghiệp thuê bao
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Doanh Nghiệp Thuê Bao (Tenant) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={createUserForm.tenantId}
                  onChange={(e) =>
                    setCreateUserForm((prev) => ({ ...prev, tenantId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-rose-500 focus:bg-white focus:outline-none"
                >
                  <option value="">-- Chọn Doanh nghiệp áp dụng --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Đăng Nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: owner_sub2"
                    value={createUserForm.username}
                    onChange={(e) =>
                      setCreateUserForm((prev) => ({ ...prev, username: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ Và Tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={createUserForm.fullName}
                    onChange={(e) =>
                      setCreateUserForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Đăng Nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@domain.vn"
                    value={createUserForm.email}
                    onChange={(e) =>
                      setCreateUserForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={createUserForm.phone}
                    onChange={(e) =>
                      setCreateUserForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật Khẩu Khởi Tạo (Để trống = Farm@123456)
                </label>
                <input
                  type="text"
                  placeholder="Farm@123456"
                  value={createUserForm.password}
                  onChange={(e) =>
                    setCreateUserForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-xs font-medium focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800 border border-amber-200">
                Tài khoản sẽ được tự động kích hoạt vai trò <strong>ROLE_FARM_OWNER</strong> và yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="md"
                  disabled={isCreating}
                  className="bg-rose-600 hover:bg-rose-700 font-bold"
                >
                  {isCreating ? 'Đang Khởi Tạo...' : 'Tạo Tài Khoản'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET MẬT KHẨU KHẨN CẤP */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setResetTargetUser(null);
                setResetResult(null);
              }}
              className="absolute right-4 top-4 rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Đặt Lại Mật Khẩu Khẩn Cấp
                </h3>
                <p className="text-xs text-slate-500">
                  Tài khoản: <strong>@{resetTargetUser.username}</strong> ({resetTargetUser.fullName})
                </p>
              </div>
            </div>

            {resetResult ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" /> Đặt lại mật khẩu thành công!
                  </div>
                  <div className="mt-3">
                    <span className="text-slate-600">Mật khẩu tạm thời mới:</span>
                    <div className="mt-1 flex items-center justify-between rounded-lg bg-white p-2.5 font-mono text-sm font-bold text-rose-600 border border-slate-200">
                      <span>{resetResult.tempPassword}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        icon={<Copy className="h-3.5 w-3.5" />}
                        onClick={() => {
                          navigator.clipboard.writeText(resetResult.tempPassword);
                          toast.success('Đã sao chép mật khẩu!');
                        }}
                      >
                        Sao Chép
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Hãy gửi mật khẩu này cho người dùng. Họ sẽ bắt buộc phải đổi mật khẩu khi đăng nhập lại.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setResetTargetUser(null);
                      setResetResult(null);
                    }}
                  >
                    Hoàn Tất & Đóng
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật Khẩu Tạm Mới (Để trống = Mặc định hệ thống Farm@123456)
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập mật khẩu tạm thời hoặc để trống..."
                    value={tempPasswordInput}
                    onChange={(e) => setTempPasswordInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-xs font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-xl bg-rose-50 p-3 text-[11px] text-rose-800 border border-rose-200">
                  Thao tác này sẽ tự động <strong>thu hồi toàn bộ phiên đăng nhập (Refresh Tokens)</strong> của tài khoản này trên tất cả thiết bị để bảo đảm an toàn thông tin!
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setResetTargetUser(null)}
                  >
                    Hủy Bỏ
                  </Button>
                  <Button
                    type="submit"
                    variant="warning"
                    size="md"
                    disabled={isResetting}
                    className="bg-amber-600 hover:bg-amber-700 font-bold text-white"
                  >
                    {isResetting ? 'Đang Đặt Lại...' : 'Xác Nhận Đặt Lại'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN KHÓA / MỞ KHÓA TÀI KHOẢN */}
      {statusTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  statusTargetUser.status === 'LOCKED'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {statusTargetUser.status === 'LOCKED' ? (
                  <Unlock className="h-6 w-6" />
                ) : (
                  <Lock className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {statusTargetUser.status === 'LOCKED'
                    ? 'Mở Khóa Tài Khoản?'
                    : 'Khóa Tài Khoản Khẩn Cấp?'}
                </h3>
                <p className="text-xs text-slate-500">
                  @{statusTargetUser.username} — {statusTargetUser.fullName}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-600 leading-relaxed">
              {statusTargetUser.status === 'LOCKED'
                ? 'Tài khoản sẽ được mở khóa và người dùng có thể đăng nhập bình thường vào hệ thống.'
                : 'Khi khóa, người dùng sẽ bị từ chối đăng nhập và toàn bộ phiên làm việc (Refresh Tokens) sẽ bị thu hồi ngay lập tức.'}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStatusTargetUser(null)}
              >
                Hủy Bỏ
              </Button>
              <Button
                type="button"
                variant={statusTargetUser.status === 'LOCKED' ? 'primary' : 'danger'}
                size="md"
                onClick={handleToggleStatus}
                className="font-bold"
              >
                {statusTargetUser.status === 'LOCKED' ? 'Mở Khóa Ngay' : 'Xác Nhận Khóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlatformUsersConsole;

