import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Calendar,
  Clock,
  CalendarOff,
  Search,
  RefreshCw,
  Building2,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  Crown,
  Calculator,
  Wrench,
  Package,
  Phone,
  CreditCard,
  Edit2,
  Lock,
  Eye,
  HardHat,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { Input, Select } from '@/components/ui/FormControls';
import { HrMetricBar } from './components/HrMetricBar';
import { EmployeeFormModal } from './components/EmployeeFormModal';
import { EmployeeDetailDrawer } from './components/EmployeeDetailDrawer';
import { ShiftScheduleTab } from './components/ShiftScheduleTab';
import { AttendanceAdjustTab } from './components/AttendanceAdjustTab';
import { LeaveAndOvertimeTab } from './components/LeaveAndOvertimeTab';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { hrService } from '@/services/modules/hrService';
import { geographyService } from '@/services/modules/geographyService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { extractApiErrors } from '@/utils/apiHelpers';

const CONTRACT_TYPE_BADGES = {
  FULL_TIME: { label: 'Toàn thời gian', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PART_TIME: { label: 'Bán thời gian', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  SEASONAL: { label: 'Thời vụ', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  INTERN: { label: 'Thực tập sinh', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

/**
 * WORKSPACE B: Hồ Sơ Nhân Sự 360°, Phân Ca, Chấm Công & Quản Lý Đa Vai Trò
 * Thiết kế phân tầng giao diện tách biệt 100%:
 * 1. Owner: 1 Bảng giám sát duy nhất toàn bộ trại + Nút bổ nhiệm FARM_MANAGER
 * 2. Farm Manager: Đầy đủ 4 Tab điều hành cơ sở
 * 3. Kế Toán Trại: 2 Tab (Danh bạ & Bảng công tính lương)
 * 4. Kỹ Sư Trưởng / Thủ Kho: Danh bạ bộ phận Read-only
 */
export function Personnel360Workspace() {
  const { activeFarmId, activeFarm, syncTrigger, notifyDataChanged } = useActiveFarmStore();
  const {
    isOwner,
    isFarmManager,
    isTechnicalLead,
    isWarehouseKeeper,
    isFarmAccountant,
  } = useAuthStore();

  const owner = isOwner();
  const farmManager = isFarmManager();
  const technicalLead = isTechnicalLead();
  const warehouseKeeper = isWarehouseKeeper();
  const farmAccountant = isFarmAccountant();

  // Tab điều hướng: 'DIRECTORY' | 'SCHEDULE' | 'ATTENDANCE' | 'LEAVE_OT'
  const [activeSegment, setActiveSegment] = useState('DIRECTORY');
  const [employees, setEmployees] = useState([]);
  const [farms, setFarms] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchParams] = useSearchParams();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState('');

  // Modals & Drawers state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formDefaultPosition, setFormDefaultPosition] = useState(null);

  // Lắng nghe URL params từ WS-A (?action=appoint&farmId=...)
  useEffect(() => {
    const action = searchParams.get('action');
    const farmIdParam = searchParams.get('farmId');
    if (action === 'appoint') {
      if (farmIdParam) {
        setSelectedFarmId(String(farmIdParam));
      }
      setEditingEmployee(null);
      setFormDefaultPosition('FARM_MANAGER');
      setIsFormModalOpen(true);
    }
  }, [searchParams]);

  // Đồng bộ selectedFarmId khi activeFarmId thay đổi từ TopBar
  useEffect(() => {
    setSelectedFarmId(activeFarmId === 'ALL' ? '' : (activeFarmId ? String(activeFarmId) : ''));
  }, [activeFarmId]);

  // 1. Fetch Farms list
  const fetchFarms = async () => {
    try {
      const data = await geographyService.getFarms();
      setFarms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch farms error:', err);
    }
  };

  // 2. Fetch Master Work Shifts
  const fetchShifts = async () => {
    try {
      const data = await hrService.getWorkShifts();
      setShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch shifts error:', err);
    }
  };

  // 3. Fetch Employees: Cô lập theo phân quyền
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      // Cô lập dữ liệu theo bộ lọc activeFarmId trên thanh TopBar
      const queryFarmId = activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : undefined;

      const res = await hrService.getEmployees({
        farmId: queryFarmId,
        status: filterStatus || undefined,
        search: searchTerm || undefined,
      });
      const list = res?.content || (Array.isArray(res) ? res : []);
      setEmployees(list);
    } catch (err) {
      console.error('Fetch employees error:', err);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
    if (farmManager || farmAccountant) {
      fetchShifts();
    }
  }, [farmManager, farmAccountant, syncTrigger?.farms]);

  useEffect(() => {
    fetchEmployees();
  }, [activeFarmId, selectedFarmId, filterStatus, syncTrigger?.employees]);

  // Cho Giám đốc trang trại thôi việc (RESIGNED) và khóa tài khoản
  const handleResignFarmManager = async (emp) => {
    if (!window.confirm(`Xác nhận cho Giám đốc "${emp.fullName}" thôi việc (RESIGNED)? Tài khoản người dùng sẽ bị khóa và vị trí Quản lý tại trang trại sẽ được giải phóng.`)) {
      return;
    }
    try {
      await hrService.updateEmployee(emp.id, {
        fullName: emp.fullName,
        dateOfBirth: emp.dateOfBirth,
        joinedDate: emp.joinedDate,
        phone: emp.phone,
        email: emp.email,
        idCardNumber: emp.idCardNumber,
        farmId: emp.farmId,
        position: emp.position,
        contractType: emp.contractType,
        baseSalary: emp.baseSalary,
        hourlyRate: emp.hourlyRate,
        annualLeaveQuota: emp.annualLeaveQuota,
        status: 'RESIGNED',
      });
      toast.success(`Đã cho Giám đốc "${emp.fullName}" thôi việc (RESIGNED) và khóa tài khoản thành công!`);
      notifyDataChanged?.('employees');
      notifyDataChanged?.('farms');
      await fetchEmployees();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || 'Không thể cập nhật thôi việc cho nhân sự!');
    }
  };

  // Đồng bộ tức thì sau khi thêm mới / cập nhật nhân sự
  const handleSuccess = async () => {
    await fetchEmployees();
    notifyDataChanged?.('employees');
    notifyDataChanged?.('farms');
  };

  // Client-side search bổ trợ
  const filteredEmployees = employees.filter((emp) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      emp.employeeCode?.toLowerCase().includes(q) ||
      emp.fullName?.toLowerCase().includes(q) ||
      emp.phone?.includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.idCardNumber?.includes(q)
    );
  });

  // Calculate HR Metrics for Standard Roles
  const metrics = {
    totalEmployees: employees.length,
    fieldStaff: employees.filter((e) => e.farmId != null).length,
    officeStaff: employees.filter((e) => e.farmId == null).length,
    onLeaveToday: employees.filter((e) => e.status === 'ON_LEAVE').length,
    monthlyTotalHours: employees.length * 176,
  };

  // 5 Thẻ KPI Thống Kê Nhanh Cho Chủ Đầu Tư (Owner) Theo Bộ Lọc Đang Chọn
  const ownerStats = {
    total: filteredEmployees.length,
    farmManagers: filteredEmployees.filter((e) => e.position === 'FARM_MANAGER').length,
    technicalAndOffice: filteredEmployees.filter(
      (e) =>
        ['ZONE_MANAGER', 'TECHNICAL_STAFF', 'WAREHOUSE_STAFF', 'ACCOUNTANT'].includes(e.position) ||
        (e.position &&
          (e.position.includes('Kỹ Thuật') ||
            e.position.includes('Kỹ Sư') ||
            e.position.includes('Thủ Kho') ||
            e.position.includes('Kế Toán')))
    ).length,
    fieldWorkers: filteredEmployees.filter(
      (e) =>
        e.position !== 'FARM_MANAGER' &&
        !['ZONE_MANAGER', 'TECHNICAL_STAFF', 'WAREHOUSE_STAFF', 'ACCOUNTANT'].includes(e.position) &&
        !(
          e.position &&
          (e.position.includes('Kỹ Thuật') ||
            e.position.includes('Kỹ Sư') ||
            e.position.includes('Thủ Kho') ||
            e.position.includes('Kế Toán'))
        )
    ).length,
    totalSalary: filteredEmployees.reduce((sum, e) => sum + (Number(e.baseSalary) || 0), 0),
  };

  // Bảng Cột Nhân Sự Chuẩn Hóa (Không hiển thị cột mã và không hiển thị cột trang trại trực thuộc)
  const directoryColumns = [
    {
      key: 'fullName',
      header: 'Họ và Tên',
      width: '190px',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
            {row.fullName?.charAt(0) || 'NV'}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-900 block truncate text-xs">{row.fullName}</span>
            <span className="text-[10px] text-slate-400 font-mono block">{row.email || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Chức Vụ / Vị Trí',
      width: '200px',
      render: (row) => {
        const isFm = row.position === 'FARM_MANAGER';
        return (
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              {isFm ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold border border-amber-300 shadow-2xs">
                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                  <span>Quản Lý Trang Trại</span>
                </span>
              ) : (
                <span>{row.position || '—'}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Số Điện Thoại',
      width: '120px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700 flex items-center gap-1">
          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
          <span>{row.phone || '—'}</span>
        </span>
      ),
    },
    {
      key: 'idCardNumber',
      header: 'Số CCCD / CMND',
      width: '140px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 flex items-center gap-1">
          <CreditCard className="h-3 w-3 text-slate-400 shrink-0" />
          <span>{row.idCardNumber || '—'}</span>
        </span>
      ),
    },
    {
      key: 'contractType',
      header: 'Loại Hợp Đồng',
      width: '120px',
      render: (row) => {
        const badge = CONTRACT_TYPE_BADGES[row.contractType] || {
          label: row.contractType,
          color: 'bg-slate-100 text-slate-700',
        };
        return (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${badge.color}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'baseSalary',
      header: 'Mức Lương',
      align: 'right',
      width: '125px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatCurrency(row.baseSalary)}
        </span>
      ),
    },
    {
      key: 'userId',
      header: 'Trạng Thái Tài Khoản',
      width: '135px',
      render: (row) =>
        row.userId ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <KeyRound className="h-3 w-3 text-emerald-600" />
            <span>Đã cấp TK</span>
          </span>
        ) : farmManager ? (
          <Can permission="PERM_HR_EMPLOYEE_MANAGE">
            <button
              type="button"
              onClick={() => {
                setSelectedEmployee(row);
                setIsDetailDrawerOpen(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 transition-colors"
            >
              <span>+ Cấp TK</span>
            </button>
          </Can>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Chưa cấp</span>
        ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      width: '110px',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      width: owner ? '230px' : '110px',
      render: (row) => {
        if (owner) {
          const isFm = row.position === 'FARM_MANAGER';
          const isResigned = row.status === 'RESIGNED' || row.status === 'TERMINATED';
          return (
            <div className="flex items-center justify-center gap-1.5">
              <Button
                size="xs"
                variant="outline"
                icon={<Eye className="h-3.5 w-3.5" />}
                onClick={() => {
                  setSelectedEmployee(row);
                  setIsDetailDrawerOpen(true);
                }}
                title="Xem Chi Tiết 360°"
              >
                360°
              </Button>
              {isFm && (
                <>
                  <Button
                    size="xs"
                    variant="outline"
                    icon={<Edit2 className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setEditingEmployee(row);
                      setFormDefaultPosition('FARM_MANAGER');
                      setIsFormModalOpen(true);
                    }}
                    title="Sửa Thông Tin / Đổi Trang Trại"
                    className="text-amber-800 border-amber-300 hover:bg-amber-50"
                  >
                    Sửa
                  </Button>
                  {!isResigned && (
                    <Button
                      size="xs"
                      variant="danger"
                      icon={<Lock className="h-3.5 w-3.5" />}
                      onClick={() => handleResignFarmManager(row)}
                      title="Khóa Tài Khoản / Cho Thôi Việc (RESIGNED)"
                    >
                      Thôi việc
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        }
        return (
          <Button
            size="sm"
            variant="outline"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={() => {
              setSelectedEmployee(row);
              setIsDetailDrawerOpen(true);
            }}
          >
            Hồ sơ 360°
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. HEADER BANNER PHÂN TÁCH THEO ROLE                   */}
      {/* ======================================================== */}
      {owner ? (
        // BANNER CHO CHỦ ĐẦU TƯ (OWNER)
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white ring-4 ring-amber-100 shadow-md shadow-amber-500/20">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  WS-B: Giám Sát Nhân Sự Các Trang Trại
                </h1>
                <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold border border-amber-300">
                  Chủ Đầu Tư
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Giám sát toàn bộ nhân sự do các Quản lý cơ sở tuyển dụng & thực hiện bổ nhiệm Giám đốc / Quản lý trang trại
              </p>
            </div>
          </div>

          <Can permission="PERM_HR_EMPLOYEE_MANAGE">
            <Button
              variant="primary"
              size="md"
              icon={<ShieldCheck className="h-4 w-4" />}
              onClick={() => {
                setEditingEmployee(null);
                setFormDefaultPosition('FARM_MANAGER');
                setIsFormModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm"
            >
              + Bổ Nhiệm Giám Đốc Trại (FARM_MANAGER)
            </Button>
          </Can>
        </div>
      ) : farmManager ? (
        // BANNER CHO QUẢN LÝ TRANG TRẠI (FARM MANAGER)
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  WS-B: Quản Lý Nhân Sự & Phân Ca
                </h1>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                  {activeFarm?.name || 'Trang Trại'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Điều hành nhân sự, xếp ca làm việc tuần, chấm công GPS và duyệt nghỉ phép tại cơ sở của bạn
              </p>
            </div>
          </div>

          <Can permission="PERM_HR_EMPLOYEE_MANAGE">
            <Button
              variant="primary"
              size="md"
              icon={<UserPlus className="h-4 w-4" />}
              onClick={() => {
                setEditingEmployee(null);
                setFormDefaultPosition(null);
                setIsFormModalOpen(true);
              }}
            >
              + Tiếp Nhận Nhân Sự Mới
            </Button>
          </Can>
        </div>
      ) : farmAccountant ? (
        // BANNER CHO KẾ TOÁN TRẠI (FARM ACCOUNTANT)
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-blue-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-200">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  WS-B: Nhân Sự & Bảng Tổng Hợp Công
                </h1>
                <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold">
                  Kế Toán Trại • {activeFarm?.name || 'Trang Trại'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi danh bạ nhân sự và bảng tổng hợp giờ công phục vụ căn cứ tính lương cuối kỳ (Chế độ Xem & Đối Soát)
              </p>
            </div>
          </div>
        </div>
      ) : (
        // BANNER CHO KỸ SƯ TRƯỞNG / THỦ KHO (READ-ONLY)
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
              {technicalLead ? <Wrench className="h-6 w-6" /> : <Package className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  WS-B: Danh Bạ Nhân Sự Bộ Phận
                </h1>
                <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold border border-slate-200">
                  {technicalLead ? 'Trưởng Kỹ Thuật' : warehouseKeeper ? 'Thủ Kho' : 'Nhân Sự'} •{' '}
                  {activeFarm?.name || 'Trang Trại'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem danh sách nhân sự phụ trách tại cơ sở (Chế độ giám sát Read-Only)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. THỐNG KÊ KPI CHO OWNER */}
      {owner ? (
        <div className="space-y-4">
          {/* 5 Thẻ Thống Kê Nhanh Của Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Tổng Quân Số */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Quân Số</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{ownerStats.total}</span>
                <span className="text-xs text-slate-500 font-medium">nhân sự</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {selectedFarmId ? 'Tại trang trại đã chọn' : 'Toàn bộ hệ thống chuỗi'}
              </p>
            </div>

            {/* Card 2: Số Giám Đốc Trại */}
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Giám Đốc Trại</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <Crown className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-900 tracking-tight">{ownerStats.farmManagers}</span>
                <span className="text-xs text-amber-700 font-medium">cán bộ</span>
              </div>
              <p className="mt-1 text-[11px] text-amber-700/80">
                FARM_MANAGER điều hành cơ sở
              </p>
            </div>

            {/* Card 3: Số Kỹ Thuật / Thủ Kho / Kế Toán */}
            <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/40 to-white p-4 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Kỹ Thuật / Kho / KT</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white shadow-xs">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-900 tracking-tight">{ownerStats.technicalAndOffice}</span>
                <span className="text-xs text-blue-700 font-medium">nhân sự</span>
              </div>
              <p className="mt-1 text-[11px] text-blue-700/80">
                Kỹ sư, KCS, Thủ kho, Kế toán trại
              </p>
            </div>

            {/* Card 4: Số Công Nhân Hiện Trường */}
            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white p-4 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Công Nhân Hiện Trường</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <HardHat className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-900 tracking-tight">{ownerStats.fieldWorkers}</span>
                <span className="text-xs text-emerald-700 font-medium">lao động</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-700/80">
                Lao động canh tác & thời vụ
              </p>
            </div>

            {/* Card 5: Tổng Quỹ Lương Cơ Bản */}
            <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/40 to-white p-4 shadow-xs hover:border-violet-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-800 uppercase tracking-wider">Tổng Quỹ Lương</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-xs">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-lg font-black text-violet-950 tracking-tight">
                  {formatCurrency(ownerStats.totalSalary)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-violet-700/80">
                Quỹ lương cơ bản theo bộ lọc
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* HR Metric Bar thông thường cho Farm Manager & Kế toán */
        <HrMetricBar metrics={metrics} />
      )}

      {/* ======================================================== */}
      {/* 3. ĐIỀU HƯỚNG TAB TÙY THEO VAI TRÒ                       */}
      {/* - Owner / Tech Lead / Warehouse Keeper: ẨN HOÀN TOÀN TABS */}
      {/* - Kế Toán Trại: Hiển thị 2 Tab (Danh bạ & Bảng công)     */}
      {/* - Farm Manager: Hiển thị đầy đủ 4 Tab                   */}
      {/* ======================================================== */}
      {!owner && !technicalLead && !warehouseKeeper && (
        <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
          <button
            type="button"
            onClick={() => setActiveSegment('DIRECTORY')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
              activeSegment === 'DIRECTORY'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>1. Danh Bạ Nhân Sự Trại ({employees.length})</span>
          </button>

          {/* Tab 2: Lưới Phân Ca (Ẩn với Kế toán) */}
          {farmManager && (
            <button
              type="button"
              onClick={() => setActiveSegment('SCHEDULE')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
                activeSegment === 'SCHEDULE'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>2. Lưới Phân Ca Tuần</span>
            </button>
          )}

          {/* Tab 3: Bảng Công & Điều Chỉnh Giờ Công (Hiển thị cho Farm Manager và Kế Toán) */}
          <button
            type="button"
            onClick={() => setActiveSegment('ATTENDANCE')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
              activeSegment === 'ATTENDANCE'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>
              {farmAccountant ? '2. Bảng Tổng Hợp Công (Tính Lương)' : '3. Bảng Công & Điều Chỉnh Giờ Công'}
            </span>
          </button>

          {/* Tab 4: Duyệt Nghỉ Phép & OT (Ẩn với Kế toán) */}
          {farmManager && (
            <button
              type="button"
              onClick={() => setActiveSegment('LEAVE_OT')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
                activeSegment === 'LEAVE_OT'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarOff className="h-4 w-4" />
              <span>4. Duyệt Nghỉ Phép & OT</span>
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TAB 1: DUY NHẤT 1 BẢNG DANH SÁCH NHÂN SỰ              */}
      {/* ======================================================== */}
      {(owner || technicalLead || warehouseKeeper || activeSegment === 'DIRECTORY') && (
        <div className="space-y-4">
          {/* Thanh Tìm Kiếm & Lọc Trạng Thái */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {!owner && (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold">
                  <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{activeFarm?.name || `Trang trại #${activeFarmId}`}</span>
                </div>
              )}

              <div className="relative min-w-[260px]">
                <Input
                  prefixIcon={<Search className="h-4 w-4 text-slate-400" />}
                  placeholder="Tìm mã NV, họ tên, SĐT, CCCD..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-auto"
              >
                <option value="">-- Tất cả trạng thái --</option>
                <option value="ACTIVE">Đang làm việc (ACTIVE)</option>
                <option value="ON_LEAVE">Nghỉ phép (ON_LEAVE)</option>
                <option value="RESIGNED">Đã thôi việc (RESIGNED)</option>
                <option value="TERMINATED">Chấm dứt HĐ (TERMINATED)</option>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={fetchEmployees}
              isLoading={isLoading}
            >
              Làm Mới
            </Button>
          </div>

          {/* Bảng Dữ Liệu Nhân Sự */}
          <DataTable
            columns={directoryColumns}
            data={filteredEmployees}
            isLoading={isLoading}
            emptyStateProps={{
              title: 'Chưa có nhân viên nào trong danh bạ',
              description: owner
                ? 'Bấm nút "Bổ Nhiệm Giám Đốc Trại" để phân công nhân sự điều hành cơ sở.'
                : 'Tiếp nhận nhân sự mới để thực hiện phân ca làm việc, chấm công GPS và cấp tài khoản SaaS.',
              actionLabel: owner ? '+ Bổ Nhiệm Giám Đốc Trại' : 'Tiếp Nhận Nhân Viên Mới',
              permission: 'PERM_HR_EMPLOYEE_MANAGE',
              onAction: () => {
                setEditingEmployee(null);
                setFormDefaultPosition(owner ? 'FARM_MANAGER' : null);
                setIsFormModalOpen(true);
              },
            }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAB 2: LƯỚI PHÂN CA TUẦN (FARM MANAGER ONLY)          */}
      {/* ======================================================== */}
      {farmManager && activeSegment === 'SCHEDULE' && (
        <ShiftScheduleTab
          farmId={activeFarmId || farms[0]?.id}
          employees={employees}
          shifts={shifts}
        />
      )}

      {/* ======================================================== */}
      {/* 6. TAB 3: BẢNG TỔNG HỢP CÔNG (FARM MANAGER & KẾ TOÁN)    */}
      {/* ======================================================== */}
      {(farmManager || farmAccountant) && activeSegment === 'ATTENDANCE' && (
        <AttendanceAdjustTab
          farmId={activeFarmId || farms[0]?.id}
          geofenceRadiusM={activeFarm?.geofenceRadiusM || 300}
        />
      )}

      {/* ======================================================== */}
      {/* 7. TAB 4: DUYỆT NGHỈ PHÉP & OT (FARM MANAGER ONLY)       */}
      {/* ======================================================== */}
      {farmManager && activeSegment === 'LEAVE_OT' && (
        <LeaveAndOvertimeTab
          farmId={activeFarmId || farms[0]?.id}
          employees={employees}
        />
      )}

      {/* Modal Tiếp nhận / Bổ nhiệm / Chỉnh sửa nhân sự */}
      <EmployeeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setFormDefaultPosition(null);
        }}
        onSuccess={handleSuccess}
        employee={editingEmployee}
        farms={farms}
        defaultPosition={formDefaultPosition}
      />

      {/* Slide-Over Drawer Hồ sơ Nhân sự 360° */}
      <EmployeeDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        employee={selectedEmployee}
        onEdit={(emp) => {
          setIsDetailDrawerOpen(false);
          setEditingEmployee(emp);
          setFormDefaultPosition(null);
          setIsFormModalOpen(true);
        }}
        onRefresh={handleSuccess}
      />
    </div>
  );
}

export default Personnel360Workspace;
