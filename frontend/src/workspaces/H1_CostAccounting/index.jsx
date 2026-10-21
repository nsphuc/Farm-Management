import React, { useState, useEffect } from 'react';
import { Calculator, Plus, PieChart, Coins, TrendingUp, Building } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Workspace H1: Quản Trị Giá Thành & Phân Bổ Chi Phí Sản Xuất (Điều 2.8 File 08)
 */
export function CostAccountingWorkspace() {
  const { activeFarmId, syncTrigger, notifyDataChanged } = useActiveFarmStore();
  const { isOwner } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Tự động tải/lọc chi phí theo activeFarmId (khi chọn ALL thì tải toàn bộ chuỗi)
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [activeFarmId, syncTrigger?.finance]);

  const columns = [
    { key: 'expenseCode', header: 'Mã chi phí', width: '130px', sortable: true },
    {
      key: 'farmName',
      header: 'Trang Trại',
      render: (row) => {
        const name = row.farmName || (row.farmId ? `Trại #${row.farmId}` : null);
        return name ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
            <Building className="h-3 w-3 text-emerald-600" />
            <span>{name}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
            Toàn chuỗi
          </span>
        );
      },
    },
    { key: 'expenseDate', header: 'Ngày phát sinh', render: (row) => formatDate(row.expenseDate) },
    { key: 'expenseSource', header: 'Nguồn phát sinh', render: (row) => <StatusBadge status={row.expenseSource} /> },
    { key: 'categoryName', header: 'Khoản mục chi phí' },
    { key: 'amount', header: 'Số tiền (VNĐ)', align: 'right', render: (row) => formatCurrency(row.amount) },
    {
      key: 'isAllocated',
      header: 'Phân bổ',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            row.isAllocated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {row.isAllocated ? 'Đã phân bổ' : 'Chưa phân bổ'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'center',
      render: (row) => (
        <Can permission="PERM_FINANCE_EXPENSE">
          <Button
            size="sm"
            variant="outline"
            disabled={row.isAllocated}
            title={row.isAllocated ? 'Bút toán này đã được phân bổ vào giá thành!' : 'Phân bổ chi phí cho vụ mùa / lô'}
            onClick={() => alert(`Phân bổ chi phí ${row.expenseCode}`)}
          >
            Phân Bổ
          </Button>
        </Can>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Quản Trị Giá Thành & Phân Bổ Chi Phí
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tập hợp 4 nguồn chi phí, phân bổ đa đối tượng và tính giá thành đơn vị (VNĐ/kg)
            </p>
          </div>
        </div>

        <Can permission="PERM_FINANCE_EXPENSE">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => alert('Thêm mới bút toán chi phí')}
          >
            + Thêm Bút Toán Chi Phí
          </Button>
        </Can>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500">Tổng Chi Phí Kỳ Này</span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500">Chi Phí Đã Phân Bổ</span>
          <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500">Giá Thành Bình Quân / Kg</span>
          <p className="text-xl font-black text-blue-700 mt-1">{formatCurrency(0)}/kg</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có bút toán chi phí nào',
          description: 'Hệ thống tự động kết chuyển vật tư tiêu hao (Auto-Backflush) hoặc nhập thủ công chi phí ngoài.',
          actionLabel: 'Thêm Chi Phí Mới',
          permission: 'PERM_FINANCE_EXPENSE',
          onAction: () => {},
        }}
      />
    </div>
  );
}

export default CostAccountingWorkspace;
