import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Edit,
  UserX,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Can } from '../../permissions/Can';
import { employeeApi } from '../../services/employeeApi';
import { farmApi } from '../../services/farmApi';
import { PersonnelDrawer } from './PersonnelDrawer';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { toast } from '../../store/ui/useToastStore';
import { DEPARTMENT_LABELS, POSITION_LABELS } from '../../pages/hr/employees/employeeConstants';

/**
 * WORKSPACE B: HỒ SƠ NHÂN SỰ 360 ĐỘ (Unified Workspace)
 * Mã Workspace: WS-HR-PERSONNEL-360
 * Hợp nhất:
 * - Module 4.1: Hồ sơ Nhân viên & Lao động (employees)
 * - Module 7.1: Quản trị Tài khoản SaaS & Phân quyền RBAC (users, user_roles)
 * 
 * Kiến trúc:
 * - Bảng điều khiển danh sách nhân sự toàn diện kèm bộ lọc địa lý (Farm-Bound)
 * - Nút Thêm/Sửa mở Slide-over Drawer 2 Tab (Lý lịch + Cấp tài khoản SaaS)
 */
export const PersonnelWorkspace = () => {
  const [employees, setEmployees] = useState([]);
  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [farmFilter, setFarmFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Drawer & Confirm Dialog
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tải danh sách trang trại
  const fetchFarms = useCallback(async () => {
    try {
      const res = await farmApi.getAllFarms();
      setFarms(res.data || []);
    } catch (err) {
      console.warn('Không thể tải danh sách trang trại:', err);
    }
  }, []);

  // Tải danh sách nhân viên thực tế
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await employeeApi.getEmployees({ size: 100 });
      const data = res.data?.content ? res.data.content : (Array.isArray(res.data) ? res.data : []);
      setEmployees(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách nhân viên:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể tải danh sách nhân viên từ máy chủ.';
      setError(msg);
      toast.error(msg, 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
    fetchEmployees();
  }, [fetchFarms, fetchEmployees]);

  // Bộ lọc dữ liệu phía client
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const positionText = POSITION_LABELS[emp.position] || emp.position || '';
      const departmentText = DEPARTMENT_LABELS[emp.department] || emp.department || '';

      const matchSearch =
        !searchTerm.trim() ||
        emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone?.includes(searchTerm.trim()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        positionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        departmentText.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFarm =
        farmFilter === 'ALL' ||
        (farmFilter === 'NONE' ? !emp.farmId : String(emp.farmId) === String(farmFilter));

      const matchStatus = statusFilter === 'ALL' || emp.status === statusFilter;

      return matchSearch && matchFarm && matchStatus;
    });
  }, [employees, searchTerm, farmFilter, statusFilter]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === 'ACTIVE').length;
    const withAccount = employees.filter((e) => Boolean(e.userId)).length;
    return { total, active, withAccount };
  }, [employees]);

  // Xử lý mở Drawer Sửa
  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setIsDrawerOpen(true);
  };

  // Xử lý mở Dialog Thôi việc (Soft-delete)
  const handleDeletePrompt = (emp) => {
    setEmployeeToDelete(emp);
    setIsDeleteOpen(true);
  };

  // Xác nhận thôi việc nhân viên
  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await employeeApi.deleteEmployee(employeeToDelete.id);
      toast.success(`Đã cập nhật trạng thái thôi việc cho nhân viên "${employeeToDelete.fullName}"`);
      setIsDeleteOpen(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Thao tác thất bại';
      toast.error(errMsg, 'Lỗi cập nhật');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper render Badge trạng thái làm việc
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đang làm việc
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Nghỉ phép
          </span>
        );
      case 'RESIGNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <UserX className="w-3.5 h-3.5 text-slate-500" /> Đã thôi việc
          </span>
        );
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Workspace */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
              WORKSPACE B
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hồ Sơ Nhân Sự 360 Độ
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Không gian hợp nhất Quản lý Nhân sự (4.1) và Cấp tài khoản truy cập hệ thống SaaS (7.1).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmployees}
            disabled={isLoading}
            className="gap-1.5 bg-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Can permission="PERM_HR_EMPLOYEE_MANAGE">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedEmployee(null);
                setIsDrawerOpen(true);
              }}
              className="gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Nhân Viên</span>
            </Button>
          </Can>
        </div>
      </div>

      {/* 2. Thẻ KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng nhân sự</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang công tác</p>
            <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tài khoản SaaS đã cấp</p>
            <p className="text-2xl font-bold text-slate-900">{stats.withAccount}</p>
          </div>
        </div>
      </div>

      {/* 3. Bộ lọc & Tìm kiếm */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã NV, SĐT, email, vị trí..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={farmFilter}
              onChange={(e) => setFarmFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">Tất cả trang trại</option>
              <option value="NONE">Chưa gán trang trại</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang làm việc</option>
            <option value="ON_LEAVE">Nghỉ phép</option>
            <option value="RESIGNED">Đã thôi việc</option>
          </select>
        </div>
      </div>

      {/* 4. Bảng Danh sách Nhân sự */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
            Đang tải hồ sơ nhân sự...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600 bg-rose-50 m-6 rounded-xl border border-rose-200">
            {error}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p>Không tìm thấy nhân viên nào phù hợp với tiêu chí lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nhân Viên</th>
                  <th className="py-3.5 px-4">Chuyên Môn & Vị Trí</th>
                  <th className="py-3.5 px-4">Trang Trại Trực Thuộc</th>
                  <th className="py-3.5 px-4">Liên Hệ</th>
                  <th className="py-3.5 px-4">Tài Khoản SaaS</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.map((emp) => {
                  const farm = farms.find((f) => String(f.id) === String(emp.farmId));
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {emp.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{emp.fullName}</div>
                            <div className="text-xs font-mono text-slate-400">{emp.employeeCode}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {POSITION_LABELS[emp.position] || emp.position}
                        </div>
                        <div className="text-xs text-slate-500">
                          {DEPARTMENT_LABELS[emp.department] || emp.department}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {farm ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{farm.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Toàn hệ thống</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{emp.phone}</span>
                        </div>
                        {emp.email && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{emp.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {emp.userId ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Đã cấp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            Chưa cấp
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {renderStatusBadge(emp.status)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Can permission="PERM_HR_EMPLOYEE_MANAGE">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(emp)}
                              className="text-xs py-1 px-2.5 gap-1 border-slate-200 hover:bg-slate-100"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-500" />
                              <span>Sửa</span>
                            </Button>
                          </Can>

                          <Can permission="PERM_HR_EMPLOYEE_MANAGE">
                            {emp.status !== 'RESIGNED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePrompt(emp)}
                                className="text-xs py-1 px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                              >
                                Thôi việc
                              </Button>
                            )}
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SLIDE-OVER DRAWER HỒ SƠ 360 ĐỘ */}
      <PersonnelDrawer
        isOpen={isDrawerOpen}
        employee={selectedEmployee}
        farms={farms}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedEmployee(null);
        }}
        onSuccess={() => {
          setIsDrawerOpen(false);
          setSelectedEmployee(null);
          fetchEmployees();
        }}
      />

      {/* CONFIRM DIALOG THÔI VIỆC NHÂN VIÊN */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Xác nhận thôi việc nhân viên"
        message={`Bạn có chắc chắn muốn chuyển trạng thái thôi việc cho nhân viên "${employeeToDelete?.fullName}"? Quyền truy cập hệ thống và các phân công công tác của nhân sự này sẽ được tạm khóa.`}
        confirmText="Xác nhận thôi việc"
        confirmVariant="danger"
        isLoading={isDeleting}
        onClose={() => {
          setIsDeleteOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default PersonnelWorkspace;
