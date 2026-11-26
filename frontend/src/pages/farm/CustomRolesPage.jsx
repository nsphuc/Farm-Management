import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Users,
  CheckSquare,
  Square,
  Lock,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { addonsService } from '@/services/modules/addonsService';
import { toast } from '@/store/useToastStore';

const MODULE_LABELS = {
  DASHBOARD: 'Tổng quan & Báo cáo',
  BARN: 'Chuồng nuôi & Lứa nuôi',
  BARNS: 'Chuồng nuôi & Lứa nuôi',
  LIVESTOCK: 'Quản lý Đàn nuôi',
  DAILY_LOG: 'Ghi nhật ký & Trừ kho',
  DAILY_LOGS: 'Ghi nhật ký & Trừ kho',
  INVENTORY: 'Kho hàng hóa & Vật tư',
  INTERNAL_TRANSFERS: 'Xuất nhập nội bộ & Duyệt phiếu',
  PURCHASE: 'Mua hàng & Hóa đơn nhập',
  SALES: 'Bán hàng & Xuất chuồng',
  FINANCE: 'Sổ quỹ & Báo cáo tài chính',
  CASHBOOK: 'Sổ quỹ & Thu chi',
  CASHFLOW: 'Sổ quỹ & Thu chi',
  WORKFORCE: 'Nhân công & Bảng lương',
  SETTINGS: 'Thiết lập & Quản trị',
  REPORTS: 'Báo cáo quản trị & KPI',
  ADDON_BRANCHES: 'Mở rộng: Đa chi nhánh',
  ADDON_PAYROLL: 'Mở rộng: Lương & Chấm công KPI',
  ADDON_ROLES: 'Mở rộng: Vai trò tùy chỉnh',
  ADDON_BREEDING: 'Mở rộng: Gia súc sinh sản',
  ADDON_HATCHERY: 'Mở rộng: Ấp nở & Trứng giống',
  ADDON_FEED_MILL: 'Mở rộng: Sản xuất cám',
};

export function CustomRolesPage() {
  const { currentFarmId } = useActiveFarmStore();
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  // Modal tạo / sửa vai trò
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissionIds: [],
  });

  const permissionsByModule = useMemo(() => {
    const map = new Map();
    allPermissions.forEach((p) => {
      const mod = (p.module || 'OTHER').toUpperCase();
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod).push(p);
    });
    return Array.from(map.entries()).map(([moduleKey, perms]) => ({
      moduleKey,
      label: MODULE_LABELS[moduleKey] || moduleKey,
      perms,
    }));
  }, [allPermissions]);

  const fetchRoles = async (keepRoleId = null) => {
    try {
      setIsLoading(true);
      const [rolesData, permsData] = await Promise.all([
        addonsService.getCustomRoles({ farmId: currentFarmId }),
        addonsService.getCustomRolePermissions({ farmId: currentFarmId }).catch(() => []),
      ]);
      if (Array.isArray(permsData)) {
        setAllPermissions(permsData);
      }
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
        const targetId = keepRoleId || selectedRole?.id;
        const found = targetId ? rolesData.find((r) => r.id === targetId) : null;
        const nextSelected = found || rolesData[0] || null;
        setSelectedRole(nextSelected);
        setSelectedPermIds(
          nextSelected?.permissions ? nextSelected.permissions.map((p) => p.id) : []
        );
      }
    } catch (err) {
      console.warn('Could not load custom roles', err);
      toast.error('Lỗi tải danh sách vai trò tùy chỉnh');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [currentFarmId]);

  const handleSelectRole = (r) => {
    setSelectedRole(r);
    setSelectedPermIds(r?.permissions ? r.permissions.map((p) => p.id) : []);
  };

  const toggleMatrixPermission = (permId) => {
    if (!selectedRole || selectedRole.isSystem || selectedRole.code === 'ROLE_FARM_OWNER') return;
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSaveMatrix = async () => {
    if (!selectedRole || selectedRole.isSystem) return;
    try {
      setIsSavingMatrix(true);
      await addonsService.updateCustomRole(
        selectedRole.id,
        {
          name: selectedRole.name,
          description: selectedRole.description || '',
          permissionIds: selectedPermIds,
        },
        { farmId: currentFarmId }
      );
      toast.success(`Đã lưu ${selectedPermIds.length} quyền cho vai trò "${selectedRole.name}"!`);
      await fetchRoles(selectedRole.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu ma trận quyền');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', permissionIds: [] });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (r) => {
    if (r.isSystem || r.code === 'ROLE_FARM_OWNER') {
      toast.info('Không thể sửa đổi vai trò hệ thống mặc định');
      return;
    }
    setEditingRole(r);
    setRoleForm({
      name: r.name,
      description: r.description || '',
      permissionIds: r.permissions ? r.permissions.map((p) => p.id) : [],
    });
    setIsRoleModalOpen(true);
  };

  const toggleModalPermission = (permId) => {
    setRoleForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      toast.error('Vui lòng nhập tên vai trò');
      return;
    }
    try {
      if (editingRole) {
        const updated = await addonsService.updateCustomRole(
          editingRole.id,
          {
            name: roleForm.name.trim(),
            description: roleForm.description,
            permissionIds: roleForm.permissionIds,
          },
          { farmId: currentFarmId }
        );
        toast.success(`Đã cập nhật vai trò "${roleForm.name}"!`);
        setIsRoleModalOpen(false);
        await fetchRoles(updated?.id || editingRole.id);
      } else {
        const created = await addonsService.createCustomRole(
          {
            name: roleForm.name.trim(),
            description: roleForm.description,
            permissionIds: roleForm.permissionIds,
          },
          { farmId: currentFarmId }
        );
        toast.success(`Đã tạo vai trò mới "${roleForm.name}"!`);
        setIsRoleModalOpen(false);
        await fetchRoles(created?.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu vai trò');
    }
  };

  const handleDeleteRole = async (r) => {
    if (r.isSystem || r.code === 'ROLE_FARM_OWNER') {
      toast.error('Không thể xóa vai trò mặc định của hệ thống');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vai trò "${r.name}"?`)) return;
    try {
      await addonsService.deleteCustomRole(r.id, { farmId: currentFarmId });
      toast.success(`Đã xóa vai trò "${r.name}"!`);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa vai trò');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Mở Rộng Vai Trò (Custom Roles)
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-purple-100 text-purple-800 uppercase">
                Add-on Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập các vai trò chuyên môn tùy chỉnh và phân quyền chi tiết tới từng hành động trên toàn trang trại
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRoles}
            disabled={isLoading}
            icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs font-bold"
          >
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateRole}
            icon={<Plus className="h-4 w-4" />}
            className="text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-sm"
          >
            + Tạo Vai Trò Tùy Chỉnh
          </Button>
        </div>
      </div>

      {/* 2. Layout 2 Cột: Cột Trái Danh sách Vai trò, Cột Phải Ma trận Quyền Chi tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Danh sách vai trò */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Danh Sách Vai Trò ({roles.length})
            </h2>
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = selectedRole?.id === r.id;
              const isSys = r.isSystem || r.code === 'ROLE_FARM_OWNER';
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-600'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{r.name}</span>
                      {isSys && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          Hệ thống
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {r.description || 'Không có mô tả'}
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{r.userCount ?? 0} nhân sự gán vai trò này</span>
                    </div>
                  </div>

                  {!isSys && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditRole(r);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-purple-700 hover:bg-purple-100 transition-colors"
                        title="Sửa tên vai trò"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(r);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa vai trò"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột Phải: Ma trận phân quyền chi tiết */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <span>Ma Trận Quyền Hạn: {selectedRole?.name || 'Chưa chọn'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {selectedRole?.isSystem
                  ? '🔒 Vai trò hệ thống có quyền hạn bảo mật cố định.'
                  : 'Tích chọn để cấp hoặc thu hồi quyền truy cập theo từng hành động.'}
              </p>
            </div>
            {selectedRole && !selectedRole.isSystem && (
              <Button
                variant="primary"
                size="sm"
                disabled={isSavingMatrix}
                onClick={handleSaveMatrix}
                className="text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white"
              >
                {isSavingMatrix ? 'Đang lưu...' : `Lưu Thay Đổi (${selectedPermIds.length} quyền)`}
              </Button>
            )}
          </div>

          <div className="p-4 space-y-4 max-h-[580px] overflow-y-auto">
            {permissionsByModule.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Đang tải danh sách quyền hạn từ hệ thống...
              </div>
            ) : (
              permissionsByModule.map((group) => {
                const isOwnerRole =
                  selectedRole?.code === 'ROLE_FARM_OWNER' ||
                  selectedRole?.code === 'ROLE_SUPER_ADMIN';
                const isReadOnly = selectedRole?.isSystem || isOwnerRole;
                return (
                  <div key={group.moduleKey} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{group.label}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {isOwnerRole
                          ? `${group.perms.length}/${group.perms.length}`
                          : `${group.perms.filter((p) => selectedPermIds.includes(p.id)).length}/${group.perms.length}`}
                      </span>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.perms.map((perm) => {
                        const isChecked = isOwnerRole || selectedPermIds.includes(perm.id);
                        return (
                          <button
                            key={perm.id}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => toggleMatrixPermission(perm.id)}
                            className={`flex items-start gap-2 p-2 rounded-lg border text-left transition-all ${
                              isChecked
                                ? 'border-purple-300 bg-purple-50/70 text-purple-950'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            } disabled:opacity-60`}
                          >
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-semibold leading-tight truncate">
                                {perm.name || perm.code}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">
                                {perm.code}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL: TẠO / SỬA VAI TRÒ TÙY CHỈNH */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRole ? `Sửa Vai Trò: ${editingRole.name}` : 'Tạo Vai Trò Tùy Chỉnh Mới'}
        size="lg"
      >
        <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
          <FormField label="Tên vai trò chuyên môn *" required hint="VD: Kế toán trưởng toàn chuỗi, Thủ kho cám">
            <Input
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              placeholder="Nhập tên vai trò..."
            />
          </FormField>

          <FormField label="Mô tả phạm vi trách nhiệm">
            <textarea
              rows={2}
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Mô tả nhiệm vụ phụ trách của vai trò này..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-1 focus:ring-purple-500"
            />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Chọn quyền hạn áp dụng ({roleForm.permissionIds.length} quyền đã chọn)
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {permissionsByModule.map((group) => (
                <div key={group.moduleKey} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {group.perms.map((perm) => {
                      const checked = roleForm.permissionIds.includes(perm.id);
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => toggleModalPermission(perm.id)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left text-[11px] transition-colors ${
                            checked
                              ? 'border-purple-400 bg-purple-50 text-purple-900 font-semibold'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {checked ? (
                            <CheckSquare className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className="truncate">{perm.name || perm.code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRoleModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold bg-purple-700 hover:bg-purple-800 text-white">
              {editingRole ? 'Lưu Thay Đổi' : 'Tạo Vai Trò'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CustomRolesPage;
