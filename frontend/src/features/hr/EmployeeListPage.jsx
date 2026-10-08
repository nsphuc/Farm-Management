import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  BadgeCheck, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { hrService } from '../../services/hrService';
import { EmployeeModal } from './EmployeeModal';
import { toast } from 'sonner';
import { isRestrictedFinancialRole } from '../../utils/ColumnFilter.util';

export const EmployeeListPage = () => {
  const { currentFarm } = useFarmStore();
  const currentUser = useAuthStore((state) => state.currentUser || state.user);
  const hideFinancial = isRestrictedFinancialRole(currentUser?.role);
  const farmId = currentFarm?.id;

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    if (farmId) {
      loadEmployees();
    }
  }, [farmId]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await hrService.getEmployees(farmId);
      // Xử lý dữ liệu PageResponse hoặc Array
      const items = res?.items || (Array.isArray(res) ? res : []);
      setEmployees(items);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhân viên ${name}?`)) return;
    try {
      await hrService.deleteEmployee(farmId, id);
      toast.success('Đã xóa nhân viên thành công');
      loadEmployees();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể xóa nhân viên');
    }
  };

  // Lọc dữ liệu
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.includes(searchTerm);
    const matchesStatus = statusFilter ? emp.status === statusFilter : true;
    const matchesDept = departmentFilter ? emp.department === departmentFilter : true;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  // Thống kê nhanh
  const totalEmployees = employees.length;
  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
  const probationCount = employees.filter(e => e.status === 'PROBATION').length;
  const totalBaseSalary = employees.reduce((sum, e) => sum + (Number(e.baseSalary) || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200"><BadgeCheck className="h-3.5 w-3.5" /> Đang làm việc</span>;
      case 'PROBATION':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200"><Clock className="h-3.5 w-3.5" /> Thử việc</span>;
      case 'ON_LEAVE':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200"><Clock className="h-3.5 w-3.5" /> Nghỉ phép</span>;
      case 'TERMINATED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-200"><AlertCircle className="h-3.5 w-3.5" /> Nghỉ việc</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hồ Sơ Nhân Sự & Lao Động</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý đội ngũ nhân viên, hợp đồng lao động, mức lương và thông tin định danh
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedEmployee(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <UserPlus className="h-4 w-4" />
          Thêm Nhân Viên
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng nhân sự</span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-gray-900">{totalEmployees}</span>
            <span className="ml-2 text-xs text-emerald-600 font-medium">Nhân viên</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Đang hoạt động</span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <BadgeCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-blue-600">{activeCount}</span>
            <span className="ml-2 text-xs text-gray-500 font-medium">Nhân sự chính thức</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Đang thử việc</span>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-600">{probationCount}</span>
            <span className="ml-2 text-xs text-gray-500 font-medium">Cần theo dõi</span>
          </div>
        </div>

        {!hideFinancial && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quỹ lương cơ bản</span>
              <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-gray-900">
                {new Intl.NumberFormat('vi-VN').format(totalBaseSalary)}
              </span>
              <span className="ml-1 text-xs text-gray-500 font-medium">VNĐ/tháng</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã NV hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang làm việc</option>
            <option value="PROBATION">Đang thử việc</option>
            <option value="ON_LEAVE">Nghỉ phép</option>
            <option value="TERMINATED">Đã nghỉ việc</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Chức vụ & Đơn vị</th>
                <th className="px-6 py-4">Hợp đồng</th>
                {!hideFinancial && <th className="px-6 py-4">Lương cơ bản</th>}
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={hideFinancial ? 5 : 6} className="py-12 text-center text-sm text-gray-500">
                    Đang tải danh sách nhân sự...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={hideFinancial ? 5 : 6} className="py-12 text-center text-sm text-gray-500">
                    Không tìm thấy nhân sự nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                          {emp.fullName?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{emp.fullName}</div>
                          <div className="text-xs text-gray-400 font-mono">{emp.employeeCode}</div>
                          {emp.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Phone className="h-3 w-3" /> {emp.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{emp.position || 'Chưa phân công'}</div>
                      <div className="text-xs text-gray-500">{emp.department || 'N/A'}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-gray-700">
                        {emp.contractType === 'FULL_TIME' ? 'Chính thức' :
                         emp.contractType === 'SEASONAL' ? 'Thời vụ' :
                         emp.contractType === 'PART_TIME' ? 'Bán thời gian' : 'Thực tập sinh'}
                      </div>
                      {emp.startDate && (
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Từ {new Date(emp.startDate).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </td>

                    {!hideFinancial && (
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {emp.baseSalary ? `${new Intl.NumberFormat('vi-VN').format(emp.baseSalary)} đ` : 'Chưa thiết lập'}
                        </div>
                        {emp.allowance > 0 && (
                          <div className="text-[11px] text-gray-400">
                            + Phụ cấp: {new Intl.NumberFormat('vi-VN').format(emp.allowance)} đ
                          </div>
                        )}
                      </td>
                    )}

                    <td className="px-6 py-4">
                      {getStatusBadge(emp.status)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-emerald-600 transition"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.fullName)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Xóa nhân viên"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Cập nhật */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        farmId={farmId}
        employee={selectedEmployee}
        onSaved={loadEmployees}
      />
    </div>
  );
};
