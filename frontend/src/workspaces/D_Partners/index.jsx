import React, { useState } from 'react';
import { Contact, Plus, Building, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { formatCurrency } from '@/utils/formatters';

/**
 * Workspace D: Sổ Danh Bạ Đối Tác & Tài Khoản VietQR (Điều 2.4 File 08)
 */
export function PartnersWorkspace() {
  const [partnerFilter, setPartnerFilter] = useState('ALL');
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const columns = [
    { key: 'code', header: 'Mã đối tác', width: '120px', sortable: true },
    { key: 'name', header: 'Tên đối tác', sortable: true },
    { key: 'partnerType', header: 'Phân loại', render: (row) => <StatusBadge status={row.partnerType} /> },
    { key: 'taxCode', header: 'Mã số thuế' },
    { key: 'phone', header: 'Điện thoại' },
    { key: 'creditLimit', header: 'Hạn mức nợ', align: 'right', render: (row) => formatCurrency(row.creditLimit) },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
            <Contact className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Sổ Danh Bạ Đối Tác & Tài Khoản VietQR
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhà cung cấp vật tư, Khách hàng B2B thu mua, Đơn vị vận chuyển và Đại lý hai chiều
            </p>
          </div>
        </div>

        <Can permission="PERM_FINANCE_SALES_ORDER">
          <Button variant="primary" size="sm" icon={Plus}>
            Thêm Đối Tác Mới
          </Button>
        </Can>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: 'ALL', label: 'Tất Cả' },
          { id: 'SUPPLIER', label: 'Nhà Cung Cấp' },
          { id: 'BUYER', label: 'Khách Hàng / Thương Lái' },
          { id: 'LOGISTICS', label: 'Đơn Vị Vận Chuyển' },
          { id: 'AGENT', label: 'Đại Lý Hai Chiều' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPartnerFilter(tab.id)}
            className={`border-b-2 px-4 py-2.5 transition-colors ${
              partnerFilter === tab.id
                ? 'border-emerald-600 text-emerald-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={partners}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có đối tác nào trong danh bạ',
          description: 'Khai báo thông tin pháp lý, hạn mức công nợ và số tài khoản ngân hàng Napas247.',
          actionLabel: 'Thêm Đối Tác Mới',
          permission: 'PERM_FINANCE_SALES_ORDER',
          onAction: () => {},
        }}
      />
    </div>
  );
}

export default PartnersWorkspace;
