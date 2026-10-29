import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarOff,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  User,
  Search,
  Filter,
  Lock,
  Calendar,
  Sparkles,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { Modal } from '@/components/ui/Modal';
import { FormField, Textarea, Input, Select } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';
import { formatDate, formatNumber } from '@/utils/formatters';

const LEAVE_TYPE_LABELS = {
  ANNUAL_LEAVE: 'Phép năm (ANNUAL)',
  SICK_LEAVE: 'Nghỉ ốm đau (SICK)',
  UNPAID_LEAVE: 'Nghỉ không lương (UNPAID)',
  MATERNITY_LEAVE: 'Thai sản (MATERNITY)',
  BEREAVEMENT_LEAVE: 'Nghỉ hiếu hỷ (BEREAVEMENT)',
};

const OT_MULTIPLIER_INFO = {
  '1.50': { label: 'x1.50 (Ngày thường)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  '1.5': { label: 'x1.50 (Ngày thường)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  '2.00': { label: 'x2.00 (Cuối tuần)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  '2.0': { label: 'x2.00 (Cuối tuần)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  '2': { label: 'x2.00 (Cuối tuần)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  '3.00': { label: 'x3.00 (Lễ / Tết)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  '3.0': { label: 'x3.00 (Lễ / Tết)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  '3': { label: 'x3.00 (Lễ / Tết)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export function LeaveAndOvertimeTab({ farmId, employees = [] }) {
  const { notifyDataChanged, syncTrigger } = useActiveFarmStore();

  const [subTab, setSubTab] = useState('LEAVES'); // 'LEAVES' | 'OVERTIME'
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  // Modal State for Approve/Reject Actions
  // target: { id, type: 'LEAVE' | 'OT', action: 'APPROVE' | 'REJECT', item: Object }
  const [modalTarget, setModalTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchLeaves = async () => {
    if (!farmId) return;
    try {
      setIsLoading(true);
      const res = await hrService.getLeaveRequests({ farmId });
      setLeaves(res?.content || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Fetch leaves error:', err);
      setLeaves([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOvertimes = async () => {
    if (!farmId) return;
    try {
      setIsLoading(true);
      const res = await hrService.getOvertimeRequests({ farmId });
      setOvertimes(res?.content || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Fetch overtimes error:', err);
      setOvertimes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'LEAVES') {
      fetchLeaves();
    } else {
      fetchOvertimes();
    }
  }, [
    subTab,
    farmId,
    syncTrigger?.employees,
    syncTrigger?.tasks,
    syncTrigger?.attendance,
    syncTrigger?.all,
  ]);

  // Helper: Lấy thông tin nhân viên & Quỹ phép năm
  const getEmployeeQuota = (employeeId, fallbackQuota) => {
    const emp = employees.find((e) => Number(e.id) === Number(employeeId));
    if (fallbackQuota != null) return Number(fallbackQuota);
    if (emp?.annualLeaveQuota != null) return Number(emp.annualLeaveQuota);
    return 0;
  };

  // Đếm số lượng PENDING cho từng tab
  const pendingLeavesCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'PENDING').length;
  }, [leaves]);

  const pendingOvertimesCount = useMemo(() => {
    return overtimes.filter((o) => o.status === 'PENDING').length;
  }, [overtimes]);

  // Xử lý Phê duyệt / Từ chối đơn
  const handleSubmitDecision = async () => {
    if (!modalTarget) return;

    const { id, type, action, item } = modalTarget;
    setModalError(null);

    // Kiểm tra lý do từ chối nếu là REJECT
    if (action === 'REJECT' && (!rejectionReason || rejectionReason.trim().length < 3)) {
      setModalError('Vui lòng nhập lý do từ chối cụ thể (tối thiểu 3 ký tự).');
      return;
    }

    try {
      setIsSubmitting(true);
      const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

      if (type === 'LEAVE') {
        // Kiểm tra quỹ phép nếu là ANNUAL_LEAVE
        if (action === 'APPROVE' && item.leaveType === 'ANNUAL_LEAVE') {
          const quota = getEmployeeQuota(item.employeeId, item.annualLeaveQuota);
          const reqDays = Number(item.totalDays || 0);
          if (reqDays > quota) {
            setModalError(
              `Quỹ phép năm của nhân viên không đủ (Còn: ${quota} ngày, Yêu cầu: ${reqDays} ngày). Không thể duyệt!`
            );
            setIsSubmitting(false);
            return;
          }
        }

        await hrService.approveLeaveRequest(id, {
          status,
          rejectionReason: action === 'REJECT' ? rejectionReason.trim() : null,
        });

        if (action === 'APPROVE') {
          toast.success(
            `Đã phê duyệt đơn nghỉ phép của ${item.employeeName || 'nhân viên'}. Trừ ${item.totalDays} ngày phép & cập nhật trạng thái nhân viên.`
          );
        } else {
          toast.info(`Đã từ chối đơn nghỉ phép của ${item.employeeName || 'nhân viên'}.`);
        }

        // Tự động kích hoạt đồng bộ liên Workspace
        await notifyDataChanged('employees');
        await fetchLeaves();
      } else {
        // OVERTIME
        await hrService.approveOvertimeRequest(id, {
          status,
          rejectionReason: action === 'REJECT' ? rejectionReason.trim() : null,
        });

        if (action === 'APPROVE') {
          toast.success(
            `Đã duyệt tăng ca OT cho ${item.employeeName || 'nhân viên'}. Tự động đồng bộ sang bảng tổng hợp công của Kế toán trại!`
          );
        } else {
          toast.info(`Đã từ chối đơn đăng ký tăng ca OT của ${item.employeeName || 'nhân viên'}.`);
        }

        // Tự động kích hoạt đồng bộ liên Workspace cho Kế toán trại
        await notifyDataChanged('employees');
        await fetchOvertimes();
      }

      setModalTarget(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Submit decision error:', err);
      const apiMsg = err.response?.data?.message || err.message || 'Lỗi khi xử lý đơn!';
      setModalError(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc dữ liệu Đơn Xin Nghỉ Phép
  const filteredLeaves = useMemo(() => {
    return leaves.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        row.employeeName?.toLowerCase().includes(q) ||
        row.employeeCode?.toLowerCase().includes(q) ||
        row.reason?.toLowerCase().includes(q) ||
        row.leaveType?.toLowerCase().includes(q)
      );
    });
  }, [leaves, statusFilter, searchTerm]);

  // Lọc dữ liệu Đơn Tăng Ca OT
  const filteredOvertimes = useMemo(() => {
    return overtimes.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        row.employeeName?.toLowerCase().includes(q) ||
        row.employeeCode?.toLowerCase().includes(q) ||
        row.reason?.toLowerCase().includes(q) ||
        row.shiftName?.toLowerCase().includes(q)
      );
    });
  }, [overtimes, statusFilter, searchTerm]);

  // ==========================================
  // CỘT CHO BẢNG ĐƠN XIN NGHỈ PHÉP
  // ==========================================
  const leaveColumns = [
    {
      key: 'employeeName',
      header: 'Nhân Viên',
      width: '180px',
      render: (row) => {
        const emp = employees.find((e) => Number(e.id) === Number(row.employeeId));
        return (
          <div>
            <div className="font-bold text-slate-900 text-xs">
              {row.employeeName || emp?.fullName || `NV #${row.employeeId}`}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {row.employeeCode || emp?.employeeCode} • {emp?.position || 'Nhân sự trại'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'leaveType',
      header: 'Loại Nghỉ Phép',
      width: '160px',
      render: (row) => {
        const isAnnual = row.leaveType === 'ANNUAL_LEAVE';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${
              isAnnual
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {LEAVE_TYPE_LABELS[row.leaveType] || row.leaveType}
          </span>
        );
      },
    },
    {
      key: 'period',
      header: 'Thời Gian Nghỉ',
      width: '170px',
      render: (row) => (
        <div className="text-xs font-mono">
          <div className="text-slate-800 font-semibold">{formatDate(row.startDate)}</div>
          <div className="text-[10px] text-slate-400">đến {formatDate(row.endDate)}</div>
        </div>
      ),
    },
    {
      key: 'totalDays',
      header: 'Số Ngày & Quỹ Phép',
      width: '180px',
      render: (row) => {
        const isAnnual = row.leaveType === 'ANNUAL_LEAVE';
        const quota = getEmployeeQuota(row.employeeId, row.annualLeaveQuota);
        const reqDays = Number(row.totalDays || 0);
        const isExceeded = isAnnual && reqDays > quota;

        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-900 text-xs">
                {formatNumber(reqDays, 1)} ngày
              </span>
              {isAnnual && (
                <span className="text-[10px] text-slate-500 font-medium">
                  (Quỹ: {quota} ngày)
                </span>
              )}
            </div>

            {/* Cảnh báo đỏ nếu VƯỢT QUỸ PHÉP NĂM */}
            {isExceeded && (
              <div className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600" />
                <span>Vượt quỹ phép năm!</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'reason',
      header: 'Lý Do Xin Nghỉ',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-700 line-clamp-2">{row.reason || '—'}</span>
          {row.status === 'REJECTED' && row.rejectionReason && (
            <div className="mt-1 text-[11px] text-rose-600 bg-rose-50/70 p-1.5 rounded border border-rose-200">
              <span className="font-bold">Lý do từ chối:</span> {row.rejectionReason}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      width: '120px',
      align: 'center',
      render: (row) => <StatusBadge status={row.status || 'PENDING'} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Thao Tác Duyệt',
      width: '210px',
      align: 'center',
      render: (row) => {
        if (row.status !== 'PENDING') {
          return (
            <div className="text-[11px] text-slate-500">
              {row.approverName ? (
                <>
                  <span className="font-semibold">{row.status === 'APPROVED' ? 'Đã duyệt bởi' : 'Từ chối bởi'}:</span>
                  <div>{row.approverName}</div>
                </>
              ) : (
                <span className="text-slate-400">Đã hoàn tất</span>
              )}
            </div>
          );
        }

        // Kiểm tra điều kiện khóa nút duyệt nếu vượt quỹ phép năm
        const isAnnual = row.leaveType === 'ANNUAL_LEAVE';
        const quota = getEmployeeQuota(row.employeeId, row.annualLeaveQuota);
        const reqDays = Number(row.totalDays || 0);
        const isExceeded = isAnnual && reqDays > quota;

        return (
          <Can permission="PERM_HR_EMPLOYEE_MANAGE" role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>
            <div className="flex items-center justify-center gap-1.5">
              {/* Nút Phê Duyệt: Nếu vượt quỹ phép thì KHÓA NÚT và BÁO ĐỎ */}
              <Button
                variant={isExceeded ? 'outline' : 'success'}
                size="sm"
                disabled={isExceeded}
                className={
                  isExceeded
                    ? 'border-rose-300 bg-rose-50 text-rose-400 cursor-not-allowed hover:bg-rose-50'
                    : ''
                }
                icon={isExceeded ? <Lock className="h-3.5 w-3.5 text-rose-500" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                title={
                  isExceeded
                    ? `Khóa nút duyệt: Nhân viên chỉ còn ${quota} ngày phép năm, không đủ cho đơn ${reqDays} ngày!`
                    : 'Phê duyệt đơn xin nghỉ phép này'
                }
                onClick={() =>
                  setModalTarget({
                    id: row.id,
                    type: 'LEAVE',
                    action: 'APPROVE',
                    item: row,
                  })
                }
              >
                {isExceeded ? 'Khóa Duyệt' : 'Phê Duyệt'}
              </Button>

              {/* Nút Từ Chối */}
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="h-3.5 w-3.5" />}
                onClick={() => {
                  setRejectionReason(
                    isExceeded ? `Quỹ phép năm không đủ (còn ${quota} ngày, xin ${reqDays} ngày).` : ''
                  );
                  setModalTarget({
                    id: row.id,
                    type: 'LEAVE',
                    action: 'REJECT',
                    item: row,
                  });
                }}
              >
                Từ Chối
              </Button>
            </div>
          </Can>
        );
      },
    },
  ];

  // ==========================================
  // CỘT CHO BẢNG ĐƠN ĐĂNG KÝ TĂNG CA OT
  // ==========================================
  const overtimeColumns = [
    {
      key: 'employeeName',
      header: 'Nhân Viên',
      width: '180px',
      render: (row) => {
        const emp = employees.find((e) => Number(e.id) === Number(row.employeeId));
        return (
          <div>
            <div className="font-bold text-slate-900 text-xs">
              {row.employeeName || emp?.fullName || `NV #${row.employeeId}`}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {row.employeeCode || emp?.employeeCode} • {emp?.position || 'Nhân sự trại'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'otDate',
      header: 'Ngày OT',
      width: '120px',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-800 text-xs">
          {formatDate(row.otDate)}
        </span>
      ),
    },
    {
      key: 'shiftName',
      header: 'Ca Làm Việc',
      width: '130px',
      render: (row) => (
        <span className="font-medium text-xs text-slate-700">
          {row.shiftName || 'Ngoài ca chuẩn'}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Từ Giờ - Đến Giờ',
      width: '140px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {row.startTime?.substring(0, 5)} → {row.endTime?.substring(0, 5)}
        </span>
      ),
    },
    {
      key: 'totalHours',
      header: 'Tổng Giờ OT',
      width: '110px',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-black text-indigo-700 text-xs">
          {formatNumber(row.totalHours, 2)}h
        </span>
      ),
    },
    {
      key: 'otMultiplier',
      header: 'Hệ Số Lương OT',
      width: '140px',
      align: 'center',
      render: (row) => {
        const multKey = String(row.otMultiplier || '1.50');
        const info = OT_MULTIPLIER_INFO[multKey] || {
          label: `x${multKey}`,
          color: 'bg-slate-100 text-slate-800 border-slate-200',
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${info.color}`}
          >
            {info.label}
          </span>
        );
      },
    },
    {
      key: 'reason',
      header: 'Lý Do Tăng Ca',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-700 line-clamp-2">{row.reason || '—'}</span>
          {row.status === 'REJECTED' && row.rejectionReason && (
            <div className="mt-1 text-[11px] text-rose-600 bg-rose-50/70 p-1.5 rounded border border-rose-200">
              <span className="font-bold">Lý do từ chối:</span> {row.rejectionReason}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      width: '120px',
      align: 'center',
      render: (row) => <StatusBadge status={row.status || 'PENDING'} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Thao Tác Duyệt',
      width: '210px',
      align: 'center',
      render: (row) => {
        if (row.status !== 'PENDING') {
          return (
            <div className="text-[11px] text-slate-500">
              {row.approverName ? (
                <>
                  <span className="font-semibold">{row.status === 'APPROVED' ? 'Đã duyệt bởi' : 'Từ chối bởi'}:</span>
                  <div>{row.approverName}</div>
                </>
              ) : (
                <span className="text-slate-400">Đã hoàn tất</span>
              )}
            </div>
          );
        }

        return (
          <Can permission="PERM_HR_EMPLOYEE_MANAGE" role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>
            <div className="flex items-center justify-center gap-1.5">
              {/* Nút Duyệt Tăng Ca OT */}
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() =>
                  setModalTarget({
                    id: row.id,
                    type: 'OT',
                    action: 'APPROVE',
                    item: row,
                  })
                }
              >
                Duyệt OT
              </Button>

              {/* Nút Từ Chối OT */}
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="h-3.5 w-3.5" />}
                onClick={() => {
                  setRejectionReason('');
                  setModalTarget({
                    id: row.id,
                    type: 'OT',
                    action: 'REJECT',
                    item: row,
                  });
                }}
              >
                Từ Chối OT
              </Button>
            </div>
          </Can>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Thanh Điều Hướng Sub-Tabs & Bộ Lọc Nhanh */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Switcher: Đơn Nghỉ Phép vs Đơn Làm Thêm Giờ OT */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSubTab('LEAVES');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              subTab === 'LEAVES'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <CalendarOff className="h-4 w-4" />
            <span>1. Đơn Xin Nghỉ Phép</span>
            {pendingLeavesCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  subTab === 'LEAVES' ? 'bg-emerald-900 text-emerald-100' : 'bg-rose-500 text-white'
                }`}
              >
                {pendingLeavesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('OVERTIME');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              subTab === 'OVERTIME'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>2. Đăng Ký Tăng Ca OT</span>
            {pendingOvertimesCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  subTab === 'OVERTIME' ? 'bg-emerald-900 text-emerald-100' : 'bg-rose-500 text-white'
                }`}
              >
                {pendingOvertimesCount}
              </span>
            )}
          </button>
        </div>

        {/* Bộ Lọc Tìm Kiếm & Trạng Thái */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Input
              prefixIcon={<Search className="h-4 w-4 text-slate-400" />}
              placeholder="Tìm mã NV, tên, lý do..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          <div className="w-[160px]">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'PENDING', label: '⏳ Chờ phê duyệt' },
                { value: 'APPROVED', label: '✅ Đã phê duyệt' },
                { value: 'REJECTED', label: '❌ Đã từ chối' },
              ]}
              className="text-xs py-1.5"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={subTab === 'LEAVES' ? fetchLeaves : fetchOvertimes}
            isLoading={isLoading}
            title="Tải lại danh sách"
          >
            Làm Mới
          </Button>
        </div>
      </div>

      {/* Hiển thị Bảng Dữ Liệu Tương Ứng */}
      {subTab === 'LEAVES' ? (
        <DataTable
          columns={leaveColumns}
          data={filteredLeaves}
          isLoading={isLoading}
          emptyStateProps={{
            title: 'Không có đơn xin nghỉ phép nào',
            description:
              statusFilter !== 'ALL' || searchTerm
                ? 'Không tìm thấy đơn nghỉ phép phù hợp với bộ lọc hiện tại.'
                : 'Hiện chưa có nhân viên nào gửi đơn xin nghỉ phép tại trang trại này.',
          }}
        />
      ) : (
        <DataTable
          columns={overtimeColumns}
          data={filteredOvertimes}
          isLoading={isLoading}
          emptyStateProps={{
            title: 'Không có đơn làm thêm giờ (OT) nào',
            description:
              statusFilter !== 'ALL' || searchTerm
                ? 'Không tìm thấy đơn tăng ca phù hợp với bộ lọc hiện tại.'
                : 'Hiện chưa có nhân viên nào đăng ký tăng ca OT tại trang trại này.',
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL PHÊ DUYỆT / TỪ CHỐI ĐƠN                            */}
      {/* ======================================================== */}
      {modalTarget && (
        <Modal
          isOpen={Boolean(modalTarget)}
          onClose={() => {
            if (!isSubmitting) {
              setModalTarget(null);
              setModalError(null);
              setRejectionReason('');
            }
          }}
          size="md"
          title={
            modalTarget.action === 'APPROVE'
              ? `Phê Duyệt ${modalTarget.type === 'LEAVE' ? 'Đơn Nghỉ Phép' : 'Đơn Tăng Ca OT'}`
              : `Từ Chối ${modalTarget.type === 'LEAVE' ? 'Đơn Nghỉ Phép' : 'Đơn Tăng Ca OT'}`
          }
          icon={
            modalTarget.action === 'APPROVE' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600" />
            )
          }
        >
          <div className="space-y-4">
            {modalError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Chi tiết đơn tóm tắt */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Nhân viên:</span>
                <span className="font-bold text-slate-900">
                  {modalTarget.item.employeeName || `NV #${modalTarget.item.employeeId}`} (
                  {modalTarget.item.employeeCode})
                </span>
              </div>

              {modalTarget.type === 'LEAVE' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loại nghỉ phép:</span>
                    <span className="font-semibold text-slate-800">
                      {LEAVE_TYPE_LABELS[modalTarget.item.leaveType] || modalTarget.item.leaveType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời gian nghỉ:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatDate(modalTarget.item.startDate)} → {formatDate(modalTarget.item.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số ngày xin nghỉ:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {formatNumber(modalTarget.item.totalDays, 1)} ngày
                    </span>
                  </div>

                  {modalTarget.item.leaveType === 'ANNUAL_LEAVE' && (
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-500">Quỹ phép năm hiện có:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {getEmployeeQuota(modalTarget.item.employeeId, modalTarget.item.annualLeaveQuota)} ngày
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày tăng ca (OT):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatDate(modalTarget.item.otDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khung giờ làm thêm:</span>
                    <span className="font-mono text-slate-800">
                      {modalTarget.item.startTime?.substring(0, 5)} → {modalTarget.item.endTime?.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tổng giờ OT:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {formatNumber(modalTarget.item.totalHours, 2)} giờ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hệ số lương OT:</span>
                    <span className="font-mono font-bold text-amber-700">
                      x{modalTarget.item.otMultiplier || '1.50'} (
                      {formatNumber(
                        Number(modalTarget.item.totalHours || 0) *
                          Number(modalTarget.item.otMultiplier || 1.5),
                        2
                      )}{' '}
                      giờ công quy đổi)
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Lý do xin:</span>
                <span className="italic text-slate-700 max-w-xs text-right">
                  {modalTarget.item.reason || '—'}
                </span>
              </div>
            </div>

            {/* Lưu ý tự động đồng bộ khi phê duyệt */}
            {modalTarget.action === 'APPROVE' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Cơ chế tự động khi phê duyệt:</span>
                </div>
                {modalTarget.type === 'LEAVE' ? (
                  <ul className="list-disc list-inside text-[11px] text-emerald-700 space-y-0.5">
                    {modalTarget.item.leaveType === 'ANNUAL_LEAVE' && (
                      <li>Tự động trừ {modalTarget.item.totalDays} ngày vào quỹ phép năm của nhân viên.</li>
                    )}
                    <li>Cập nhật trạng thái nhân viên sang Nghỉ phép nếu ngày nghỉ bao gồm hôm nay.</li>
                    <li>Đồng bộ tức thì lên hệ thống quản trị toàn chuỗi.</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside text-[11px] text-emerald-700 space-y-0.5">
                    <li>Tự động ghi nhận giờ làm thêm vào bảng tổng hợp công tháng.</li>
                    <li>Đồng bộ tức thì sang Bảng tổng hợp công của Kế toán trại để tính lương.</li>
                  </ul>
                )}
              </div>
            )}

            {/* Nhập lý do từ chối nếu là REJECT */}
            {modalTarget.action === 'REJECT' && (
              <FormField label="Lý Do Từ Chối (Bắt buộc)*">
                <Textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể không duyệt đơn..."
                  className="text-xs"
                />
              </FormField>
            )}

            {/* Nút hành động trong Modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="md"
                onClick={() => setModalTarget(null)}
                disabled={isSubmitting}
              >
                Hủy Bỏ
              </Button>
              <Button
                variant={modalTarget.action === 'APPROVE' ? 'success' : 'danger'}
                size="md"
                onClick={handleSubmitDecision}
                isLoading={isSubmitting}
                loadingText="Đang xử lý..."
              >
                {modalTarget.action === 'APPROVE' ? 'Xác Nhận Phê Duyệt' : 'Xác Nhận Từ Chối'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default LeaveAndOvertimeTab;
