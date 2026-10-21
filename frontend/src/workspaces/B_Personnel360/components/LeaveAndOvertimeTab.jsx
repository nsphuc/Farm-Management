import React, { useState, useEffect } from 'react';
import {
  CalendarOff,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { Modal } from '@/components/ui/Modal';
import { FormField, Textarea } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { formatDate, formatNumber } from '@/utils/formatters';

const LEAVE_TYPE_LABELS = {
  ANNUAL_LEAVE: 'Phép năm (ANNUAL)',
  SICK_LEAVE: 'Nghỉ ốm đau (SICK)',
  UNPAID_LEAVE: 'Nghỉ không lương (UNPAID)',
  MATERNITY_LEAVE: 'Thai sản (MATERNITY)',
  BEREAVEMENT_LEAVE: 'Nghỉ hiếu hỷ (BEREAVEMENT)',
};

export function LeaveAndOvertimeTab({ farmId, employees = [] }) {
  const [subTab, setSubTab] = useState('LEAVES'); // 'LEAVES' | 'OVERTIME'
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Approval Modal State
  const [approvalTarget, setApprovalTarget] = useState(null); // { id, type: 'LEAVE'|'OT', action: 'APPROVE'|'REJECT', item }
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      const res = await hrService.getLeaveRequests({ farmId });
      setLeaves(res?.content || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Fetch leaves error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOvertimes = async () => {
    try {
      setIsLoading(true);
      const res = await hrService.getOvertimeRequests({ farmId });
      setOvertimes(res?.content || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Fetch overtimes error:', err);
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
  }, [subTab, farmId]);

  const handleApprove = async () => {
    if (!approvalTarget) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const status = approvalTarget.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

      if (approvalTarget.type === 'LEAVE') {
        // Kiểm tra quỹ phép nếu là ANNUAL_LEAVE
        if (
          status === 'APPROVED' &&
          approvalTarget.item.leaveType === 'ANNUAL_LEAVE'
        ) {
          const emp = employees.find((e) => e.id === approvalTarget.item.employeeId);
          if (emp && Number(approvalTarget.item.totalDays) > Number(emp.annualLeaveQuota || 0)) {
            setError(`Nhân viên chỉ còn ${emp.annualLeaveQuota || 0} ngày phép, không đủ để duyệt đơn ${approvalTarget.item.totalDays} ngày!`);
            setIsSubmitting(false);
            return;
          }
        }

        await hrService.approveLeaveRequest(approvalTarget.id, {
          status,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        });
        fetchLeaves();
      } else {
        await hrService.approveOvertimeRequest(approvalTarget.id, {
          status,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        });
        fetchOvertimes();
      }

      setApprovalTarget(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Process approval error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi xử lý phê duyệt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const leaveColumns = [
    {
      key: 'employeeName',
      header: 'Nhân Viên',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.employeeName || `NV #${row.employeeId}`}</div>
          <div className="text-[10px] text-slate-500 font-mono">{row.employeeCode}</div>
        </div>
      ),
    },
    {
      key: 'leaveType',
      header: 'Loại Nghỉ Phép',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          {LEAVE_TYPE_LABELS[row.leaveType] || row.leaveType}
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Thời Gian Nghỉ',
      render: (row) => (
        <div className="text-xs font-mono">
          <span className="text-slate-800">{formatDate(row.startDate)}</span>
          <span className="text-slate-400 mx-1">→</span>
          <span className="text-slate-800">{formatDate(row.endDate)}</span>
        </div>
      ),
    },
    {
      key: 'totalDays',
      header: 'Số Ngày',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-blue-700 text-xs">
          {formatNumber(row.totalDays, 1)} ngày
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Lý Do Xin Nghỉ',
      render: (row) => <span className="text-xs text-slate-600 line-clamp-1">{row.reason || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      render: (row) => <StatusBadge status={row.status || 'PENDING'} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Phê Duyệt',
      align: 'center',
      render: (row) =>
        row.status === 'PENDING' ? (
          <Can permission="PERM_HR_EMPLOYEE_MANAGE">
            <div className="flex items-center justify-center gap-1.5">
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => setApprovalTarget({ id: row.id, type: 'LEAVE', action: 'APPROVE', item: row })}
              >
                Duyệt
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="h-3.5 w-3.5" />}
                onClick={() => setApprovalTarget({ id: row.id, type: 'LEAVE', action: 'REJECT', item: row })}
              >
                Từ Chối
              </Button>
            </div>
          </Can>
        ) : (
          <span className="text-[11px] text-slate-400">
            {row.approverName ? `Bởi: ${row.approverName}` : 'Đã xử lý'}
          </span>
        ),
    },
  ];

  const overtimeColumns = [
    {
      key: 'employeeName',
      header: 'Nhân Viên',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.employeeName || `NV #${row.employeeId}`}</div>
          <div className="text-[10px] text-slate-500 font-mono">{row.employeeCode}</div>
        </div>
      ),
    },
    {
      key: 'otDate',
      header: 'Ngày Tăng Ca',
      render: (row) => <span className="font-mono font-medium text-slate-800 text-xs">{formatDate(row.otDate)}</span>,
    },
    {
      key: 'time',
      header: 'Khung Giờ',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.startTime?.substring(0, 5)} - {row.endTime?.substring(0, 5)}
        </span>
      ),
    },
    {
      key: 'totalHours',
      header: 'Số Giờ OT',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-indigo-700 text-xs">
          {formatNumber(row.totalHours, 2)}h
        </span>
      ),
    },
    {
      key: 'otMultiplier',
      header: 'Hệ Số',
      align: 'center',
      render: (row) => (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-800">
          x{row.otMultiplier || '1.50'}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Lý Do Tăng Ca',
      render: (row) => <span className="text-xs text-slate-600 line-clamp-1">{row.reason || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      render: (row) => <StatusBadge status={row.status || 'PENDING'} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Phê Duyệt',
      align: 'center',
      render: (row) =>
        row.status === 'PENDING' ? (
          <Can permission="PERM_HR_EMPLOYEE_MANAGE">
            <div className="flex items-center justify-center gap-1.5">
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => setApprovalTarget({ id: row.id, type: 'OT', action: 'APPROVE', item: row })}
              >
                Duyệt OT
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="h-3.5 w-3.5" />}
                onClick={() => setApprovalTarget({ id: row.id, type: 'OT', action: 'REJECT', item: row })}
              >
                Từ Chối
              </Button>
            </div>
          </Can>
        ) : (
          <span className="text-[11px] text-slate-400">
            {row.approverName ? `Bởi: ${row.approverName}` : 'Đã xử lý'}
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Segment Switcher: Đơn Nghỉ Phép vs Đơn Làm Thêm Giờ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSubTab('LEAVES')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              subTab === 'LEAVES'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarOff className="h-4 w-4" />
            <span>Đơn Xin Nghỉ Phép</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('OVERTIME')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              subTab === 'OVERTIME'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Đơn Làm Thêm Giờ (OT)</span>
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={subTab === 'LEAVES' ? fetchLeaves : fetchOvertimes}
          isLoading={isLoading}
        >
          Làm Mới
        </Button>
      </div>

      {subTab === 'LEAVES' ? (
        <DataTable
          columns={leaveColumns}
          data={leaves}
          isLoading={isLoading}
          emptyStateProps={{
            title: 'Chưa có đơn xin nghỉ phép nào',
            description: 'Hiện chưa có nhân viên nào gửi đơn xin nghỉ phép tại trang trại này.',
          }}
        />
      ) : (
        <DataTable
          columns={overtimeColumns}
          data={overtimes}
          isLoading={isLoading}
          emptyStateProps={{
            title: 'Chưa có đơn làm thêm giờ nào',
            description: 'Hiện chưa có nhân viên nào đăng ký làm thêm giờ (OT) tại trang trại này.',
          }}
        />
      )}

      {/* Modal xác nhận Phê Duyệt / Từ Chối */}
      {approvalTarget && (
        <Modal
          isOpen={Boolean(approvalTarget)}
          onClose={() => {
            setApprovalTarget(null);
            setError(null);
            setRejectionReason('');
          }}
          size="md"
          title={
            approvalTarget.action === 'APPROVE'
              ? `Phê Duyệt ${approvalTarget.type === 'LEAVE' ? 'Đơn Nghỉ Phép' : 'Đơn Tăng Ca OT'}`
              : `Từ Chối ${approvalTarget.type === 'LEAVE' ? 'Đơn Nghỉ Phép' : 'Đơn Tăng Ca OT'}`
          }
          icon={
            approvalTarget.action === 'APPROVE' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600" />
            )
          }
        >
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nhân viên:</span>
                <span className="font-bold text-slate-900">
                  {approvalTarget.item.employeeName || `ID: ${approvalTarget.item.employeeId}`}
                </span>
              </div>
              {approvalTarget.type === 'LEAVE' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loại phép:</span>
                    <span className="font-semibold text-slate-800">
                      {LEAVE_TYPE_LABELS[approvalTarget.item.leaveType] || approvalTarget.item.leaveType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số ngày xin nghỉ:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {approvalTarget.item.totalDays} ngày ({formatDate(approvalTarget.item.startDate)} → {formatDate(approvalTarget.item.endDate)})
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày tăng ca:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatDate(approvalTarget.item.otDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số giờ làm thêm:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {approvalTarget.item.totalHours} giờ (Hệ số x{approvalTarget.item.otMultiplier || '1.50'})
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Lý do:</span>
                <span className="italic text-slate-700 max-w-xs text-right">
                  {approvalTarget.item.reason || '—'}
                </span>
              </div>
            </div>

            {approvalTarget.action === 'REJECT' && (
              <FormField label="Lý Do Từ Chối (Tùy chọn)">
                <Textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nêu lý do không duyệt đơn..."
                />
              </FormField>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="md"
                onClick={() => setApprovalTarget(null)}
                disabled={isSubmitting}
              >
                Hủy Bỏ
              </Button>
              <Button
                variant={approvalTarget.action === 'APPROVE' ? 'success' : 'danger'}
                size="md"
                onClick={handleApprove}
                isLoading={isSubmitting}
                loadingText="Đang xử lý..."
              >
                {approvalTarget.action === 'APPROVE' ? 'Xác Nhận Phê Duyệt' : 'Xác Nhận Từ Chối'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default LeaveAndOvertimeTab;
