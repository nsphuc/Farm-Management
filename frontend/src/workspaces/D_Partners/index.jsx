import React, { useState, useEffect } from 'react';
import {
  Contact,
  Plus,
  Search,
  Filter,
  Building,
  QrCode,
  Edit2,
  Trash2,
  CreditCard,
  Truck,
  ShoppingCart,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { partnerService } from '@/services/modules/partnerService';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { VietQRModal } from '@/components/common/VietQRModal';
import { PartnerFormModal } from './components/PartnerFormModal';
import { PartnerDetailDrawer } from './components/PartnerDetailDrawer';
import { formatCurrency } from '@/utils/formatters';
import { extractApiErrors } from '@/utils/apiHelpers';

const PARTNER_TABS = [
  { id: 'ALL', label: 'Tất Cả Đối Tác', icon: Contact },
  { id: 'SUPPLIER', label: 'Nhà Cung Cấp Vật Tư', icon: Building },
  { id: 'BUYER', label: 'Khách Hàng / Thương Lái', icon: ShoppingCart },
  { id: 'LOGISTICS', label: 'Đơn Vị Vận Chuyển', icon: Truck },
  { id: 'AGENT', label: 'Đại Lý Hai Chiều', icon: Layers },
];

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'ACTIVE - Đang giao dịch' },
  { value: 'INACTIVE', label: 'INACTIVE - Tạm ngừng' },
  { value: 'BLACKLISTED', label: 'BLACKLISTED - Bị chặn / Nợ xấu' },
];

export function PartnersWorkspace() {
  const [partnerTypeTab, setPartnerTypeTab] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Selected partner for 360 Drawer
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modal create/edit
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  // Quick VietQR modal
  const [quickVietQrPartner, setQuickVietQrPartner] = useState(null);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await partnerService.getPartners({
        partnerType: partnerTypeTab === 'ALL' ? undefined : partnerTypeTab,
        status: statusFilter || undefined,
        keyword: searchTerm || undefined,
        page,
        size: 15,
      });

      if (res) {
        setPartners(res.content || res || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || (res.content ? res.content.length : 0));
      }
    } catch (err) {
      console.error('Failed to load partners', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [partnerTypeTab, statusFilter, searchTerm, page]);

  const handleDeletePartner = async (partnerId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa đối tác này?')) return;
    try {
      await partnerService.deletePartner(partnerId);
      fetchPartners();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa đối tác đã có phát sinh đơn hàng hoặc công nợ!');
    }
  };

  const handleRowClick = (item) => {
    setSelectedPartner(item);
    setDrawerOpen(true);
  };

  const handleQuickQr = (item, e) => {
    e.stopPropagation();
    setQuickVietQrPartner(item);
  };

  // Summary Metrics
  const supplierCount = partners.filter((p) => p.partnerType === 'SUPPLIER').length;
  const buyerCount = partners.filter((p) => p.partnerType === 'BUYER').length;
  const otherCount = partners.filter(
    (p) => p.partnerType === 'LOGISTICS' || p.partnerType === 'AGENT'
  ).length;

  const columns = [
    {
      key: 'code',
      title: 'Mã Đối Tác',
      render: (item) => <span className="font-mono font-bold text-slate-900">{item.code}</span>,
    },
    {
      key: 'name',
      title: 'Tên Doanh Nghiệp / Đối Tác',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900">{item.name}</div>
          <div className="text-[11px] text-slate-500">
            {item.taxCode ? `MST: ${item.taxCode}` : 'Chưa có MST'}
            {item.contactPerson ? ` • Người liên hệ: ${item.contactPerson}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'partnerType',
      title: 'Phân Loại',
      render: (item) => <StatusBadge status={item.partnerType} size="sm" />,
    },
    {
      key: 'phone',
      title: 'Điện Thoại',
      render: (item) => (
        <span className="font-mono text-xs text-slate-700">{item.phone || '—'}</span>
      ),
    },
    {
      key: 'credit',
      title: 'Hạn Mức & Hạn Nợ',
      render: (item) => (
        <div className="text-xs">
          <div className="font-mono font-bold text-emerald-800">
            {formatCurrency(item.creditLimit)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Hạn: {item.paymentTermDays ?? 0} ngày
          </div>
        </div>
      ),
    },
    {
      key: 'creditRating',
      title: 'Tín Nhiệm',
      render: (item) => {
        const rating = item.creditRating || 'UNRATED';
        const colors = {
          A: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          B: 'bg-blue-50 text-blue-800 border-blue-200',
          C: 'bg-amber-50 text-amber-800 border-amber-200',
          UNRATED: 'bg-slate-100 text-slate-600 border-slate-200',
        };
        return (
          <span
            className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold ${
              colors[rating] || colors.UNRATED
            }`}
          >
            Hạng {rating}
          </span>
        );
      },
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {item.bankAccountNo && (
            <button
              type="button"
              onClick={(e) => handleQuickQr(item, e)}
              className="rounded-lg p-1 text-blue-600 hover:bg-blue-50 transition-colors"
              title="Mã VietQR thanh toán"
            >
              <QrCode className="h-4 w-4" />
            </button>
          )}

          <Can permission="PERM_FINANCE_SALES_ORDER">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingPartner(item);
                setFormModalOpen(true);
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Sửa hồ sơ"
            >
              <Edit2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => handleDeletePartner(item.id, e)}
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Xóa đối tác"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20">
            <Contact className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Workspace D: Sổ Danh Bạ Đối Tác & Tài Khoản VietQR
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý Nhà cung cấp vật tư, Khách hàng B2B thu mua nông sản, Đơn vị vận chuyển và Tài khoản thụ hưởng Napas247
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={fetchPartners}
          >
            Làm mới
          </Button>

          <Can permission="PERM_FINANCE_SALES_ORDER">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingPartner(null);
                setFormModalOpen(true);
              }}
            >
              + Thêm Đối Tác
            </Button>
          </Can>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tổng Đối Tác
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">{totalElements}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Đã đăng ký danh bạ</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Nhà Cung Cấp
          </span>
          <div className="text-2xl font-black font-mono text-blue-700 mt-1">{supplierCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Vật tư, cây con giống</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Khách Hàng / Thương Lái
          </span>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">{buyerCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Thu mua nông sản</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Vận Chuyển & Đại Lý
          </span>
          <div className="text-2xl font-black font-mono text-indigo-700 mt-1">{otherCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Hậu cần & Hai chiều</div>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-px">
        {PARTNER_TABS.map((tab) => {
          const isSelected = partnerTypeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setPartnerTypeTab(tab.id);
                setPage(0);
              }}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-all whitespace-nowrap ${
                isSelected
                  ? 'border-emerald-600 text-emerald-900 font-bold bg-emerald-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon
                className={`h-4 w-4 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã, tên, SĐT, mã số thuế..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={partners}
          isLoading={loading}
          page={page}
          pageSize={15}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={handleRowClick}
          emptyStateProps={{
            title: 'Chưa có đối tác nào trong danh mục',
            description: 'Khai báo thông tin pháp lý, hạn mức công nợ và số tài khoản ngân hàng Napas247.',
            actionLabel: '+ Thêm Đối Tác Mới',
            onAction: () => {
              setEditingPartner(null);
              setFormModalOpen(true);
            },
          }}
        />
      </div>

      {/* Modal Thêm/Sửa */}
      <PartnerFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        editingItem={editingPartner}
        onSuccess={() => fetchPartners()}
      />

      {/* Drawer Chi Tiết 360 Độ */}
      <PartnerDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        partner={selectedPartner}
        onEdit={(p) => {
          setDrawerOpen(false);
          setEditingPartner(p);
          setFormModalOpen(true);
        }}
        onStatusChanged={() => {
          fetchPartners();
          setDrawerOpen(false);
        }}
      />

      {/* Quick VietQR Modal */}
      {quickVietQrPartner && (
        <VietQRModal
          isOpen={Boolean(quickVietQrPartner)}
          onClose={() => setQuickVietQrPartner(null)}
          bankBin={quickVietQrPartner.bankBin}
          bankName={quickVietQrPartner.bankName}
          accountNo={quickVietQrPartner.bankAccountNo}
          accountName={quickVietQrPartner.bankAccountName}
          amount={0}
          orderCode={quickVietQrPartner.code}
          transferContent={`THANH TOAN ${quickVietQrPartner.code}`}
        />
      )}
    </div>
  );
}

export default PartnersWorkspace;
