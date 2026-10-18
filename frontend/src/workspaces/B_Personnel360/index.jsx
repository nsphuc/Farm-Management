import React, { useState } from 'react';
import { Users, UserPlus, KeyRound, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Can } from '@/components/common/Can';
import { formatCurrency, formatDate } from '@/utils/formatters';

/**
 * Workspace B: Hồ Sơ Nhân Sự 360° & Tài Khoản SaaS (Điều 2.2 File 08)
 */
export function Personnel360Workspace() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const columns = [
    { key: 'employeeCode', header: 'Mã NV', width: '120px', sortable: true },
    { key: 'fullName', header: 'Họ và tên', sortable: true },
    { key: 'position', header: 'Vị trí công việc' },
    { key: 'department', header: 'Bộ phận' },
    { key: 'phone', header: 'Số điện thoại' },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'center',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedEmp(row);
            setIsDrawerOpen(true);
          }}
        >
          Hồ sơ 360°
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-200">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Hồ Sơ Nhân Sự 360° & Tài Khoản SaaS
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản trị biên chế, cấp phát tài khoản RBAC, hợp đồng và đối soát công lương
            </p>
          </div>
        </div>

        <Can permission="PERM_HR_EMPLOYEE_MANAGE">
          <Button variant="primary" size="sm" icon={UserPlus}>
            Thêm Nhân Viên
          </Button>
        </Can>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có nhân viên nào trong danh bạ',
          description: 'Thêm mới nhân sự để phân công hiện trường, chấm công GPS và cấp tài khoản SaaS.',
          actionLabel: 'Thêm Nhân Viên Mới',
          permission: 'PERM_HR_EMPLOYEE_MANAGE',
          onAction: () => {},
        }}
      />

      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedEmp ? `Hồ Sơ: ${selectedEmp.fullName}` : 'Hồ Sơ Nhân Sự 360°'}
        subtitle={`Mã: ${selectedEmp?.employeeCode || '—'}`}
        tabs={[
          { id: 'profile', label: 'Lý Lịch & HĐ', icon: FileText },
          { id: 'saas', label: 'Tài Khoản SaaS', icon: KeyRound },
          { id: 'ledger', label: 'Công & Phép', icon: Clock },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div className="p-4 text-xs text-slate-600">
          Chi tiết hồ sơ nhân sự 360 độ (Thông tin lý lịch, hợp đồng lao động, cấp quyền RBAC).
        </div>
      </SlideOverDrawer>
    </div>
  );
}

export default Personnel360Workspace;
