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
  Eye,
  Ban,
  Unlock,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import { partnerService } from '@/services/modules/partnerService';
import { toast } from '@/store/useToastStore';
import { ApproveCreditLimitModal } from './components/ApproveCreditLimitModal';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { VietQRModal } from '@/components/common/VietQRModal';
import { PartnerFormModal } from './components/PartnerFormModal';
import { PartnerDetailDrawer } from './components/PartnerDetailDrawer';
import { formatCurrency } from '@/utils/formatters';
import { extractApiErrors } from '@/utils/apiHelpers';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

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
  const { isOwner, isFarmManager, isFarmAccountant } = useAuthStore();
  const { activeFarmId, syncTrigger, notifyDataChanged } = useActiveFarmStore();
  const owner = isOwner();
  const farmManager = isFarmManager();
  const accountant = isFarmAccountant();

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

  // Credit Limit approval modal (Đặc quyền Owner)
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditPartner, setCreditPartner] = useState(null);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const queryFarmId = (activeFarmId && activeFarmId !== 'ALL') ? Number(activeFarmId) : undefined;
      const res = await partnerService.getPartners({
        partnerType: partnerTypeTab === 'ALL' ? undefined : partnerTypeTab,
        status: statusFilter || undefined,
        keyword: searchTerm || undefined,
        farmId: queryFarmId,
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
  }, [partnerTypeTab, statusFilter, searchTerm, page, activeFarmId, syncTrigger?.partners]);

  const handleDeletePartner = async (partnerId, e) => {
    e?.stopPropagation();
    if (!owner) {
      alert('Chỉ Chủ đầu tư (Owner) mới có quyền xóa vĩnh viễn hồ sơ đối tác!');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa đối tác này?')) return;
    try {
      await partnerService.deletePartner(partnerId);
      notifyDataChanged?.('partners');
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

  const handleOpenCreditModal = (item, e) => {
    e?.stopPropagation();
    setCreditPartner(item);
    setCreditModalOpen(true);
  };

  const handleToggleBlacklist = async (item, e) => {
    e?.stopPropagation();
    const isBlacklisted = item.status === 'BLACKLISTED';
    const confirmMsg = isBlacklisted
      ? `Xác nhận mở khóa đối tác "${item.name}" sang trạng thái ACTIVE để tiếp tục giao dịch?`
      : `CẢNH BÁO: Xác nhận đưa đối tác "${item.name}" vào DANH SÁCH ĐEN (BLACKLISTED)?\nToàn bộ các trang trại trong chuỗi sẽ bị chặn ngay lập tức, không thể lập phiếu nhập mua hay đơn bán hàng mới với đối tác này!`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await partnerService.updatePartnerStatus(item.id, isBlacklisted ? 'ACTIVE' : 'BLACKLISTED');
      toast.success(
        `Đã chuyển đối tác sang trạng thái ${isBlacklisted ? 'ACTIVE (Đang giao dịch)' : 'BLACKLISTED (Danh sách đen)'}!`
      );
      notifyDataChanged?.('partners');
      fetchPartners();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || 'Không thể cập nhật trạng thái đối tác!');
    }
  };

  // Summary Metrics
  const supplierCount = partners.filter((p) => p.partnerType === 'SUPPLIER').length;
  const buyerCount = partners.filter((p) => p.partnerType === 'BUYER').length;
  const otherCount = partners.filter(
    (p) => p.partnerType === 'LOGISTICS' || p.partnerType === 'AGENT'
  ).length;

  const columns = [
    {
      key: 'name',
      header: 'Tên Doanh Nghiệp / Đối Tác',
      title: 'Tên Doanh Nghiệp / Đối Tác',
      width: '240px',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{item.name}</div>
          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
            {item.code && (
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.2 rounded text-[10px]">
                {item.code}
              </span>
            )}
            <span>{item.taxCode ? `MST: ${item.taxCode}` : 'Chưa có MST'}</span>
            {item.contactPerson ? <span>• NLH: {item.contactPerson}</span> : null}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Số Điện Thoại',
      title: 'Số Điện Thoại',
      width: '130px',
      render: (item) => (
        <span className="font-mono text-xs text-slate-700 flex items-center gap-1">
          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
          <span>{item.phone || '—'}</span>
        </span>
      ),
    },
    {
      key: 'partnerType',
      header: 'Phân Loại',
      title: 'Phân Loại',
      width: '120px',
      render: (item) => <StatusBadge status={item.partnerType} size="sm" />,
    },
    {
      key: 'farmName',
      header: 'Trang Trại',
      title: 'Trang Trại',
      width: '130px',
      render: (item) => {
        const farmName = item.farmName || (item.farmId ? `Trại #${item.farmId}` : null);
        return farmName ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
            <Building className="h-3 w-3 text-emerald-600" />
            <span className="truncate max-w-[120px]">{farmName}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
            Toàn chuỗi
          </span>
        );
      },
    },
    {
      key: 'receivableDebt',
      header: 'Dư Nợ Phải Thu',
      title: 'Dư Nợ Phải Thu',
      align: 'right',
      width: '130px',
      render: (item) => {
        const val = item.currentReceivableDebt || 0;
        return (
          <span className={`font-mono text-xs font-bold ${val > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
            {formatCurrency(val)}
          </span>
        );
      },
    },
    {
      key: 'payableDebt',
      header: 'Nợ Phải Trả',
      title: 'Nợ Phải Trả',
      align: 'right',
      width: '130px',
      render: (item) => {
        const val = item.currentPayableDebt || 0;
        return (
          <span className={`font-mono text-xs font-bold ${val > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
            {formatCurrency(val)}
          </span>
        );
      },
    },
    {
      key: 'credit',
      header: 'Hạn Mức & Hạn Nợ',
      title: 'Hạn Mức & Hạn Nợ',
      width: '140px',
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
      header: 'Tín Nhiệm',
      title: 'Tín Nhiệm',
      align: 'center',
      width: '100px',
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
      header: 'Trạng Thái',
      title: 'Trạng Thái',
      align: 'center',
      width: '110px',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      title: 'Thao Tác',
      align: 'center',
      width: owner ? '230px' : '110px',
      render: (item) => {
        const isBlacklisted = item.status === 'BLACKLISTED';
        if (owner) {
          return (
            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button
                size="xs"
                variant="outline"
                icon={<Eye className="h-3.5 w-3.5" />}
                onClick={() => {
                  setSelectedPartner(item);
                  setDrawerOpen(true);
                }}
                title="Hồ sơ 360°"
              >
                360°
              </Button>

              {/* Đặc quyền Owner: Phê duyệt hạn mức tín dụng */}
              <Button
                size="xs"
                variant="outline"
                icon={<CreditCard className="h-3.5 w-3.5" />}
                onClick={(e) => handleOpenCreditModal(item, e)}
                title="Duyệt hạn mức tín dụng & hạn nợ"
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                Duyệt nợ
              </Button>

              {/* Đặc quyền Owner: Khóa đen hoặc Mở khóa */}
              <Button
                size="xs"
                variant={isBlacklisted ? 'outline' : 'danger'}
                icon={isBlacklisted ? <Unlock className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                onClick={(e) => handleToggleBlacklist(item, e)}
                title={isBlacklisted ? 'Mở khóa đối tác sang ACTIVE' : 'Đưa vào danh sách đen (BLACKLISTED)'}
                className={isBlacklisted ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-50' : ''}
              >
                {isBlacklisted ? 'Mở khóa' : 'Khóa đen'}
              </Button>

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
            </div>
          );
        }

        return (
          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="xs"
              variant="outline"
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => {
                setSelectedPartner(item);
                setDrawerOpen(true);
              }}
              title="Hồ sơ 360°"
            >
              360°
            </Button>

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

            <Can anyPermissions={['PERM_FINANCE_SALES_ORDER', 'PERM_INVENTORY_RECEIPT', 'PERM_FARM_MANAGE', 'PERM_FARM_VIEW']}>
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
            </Can>
          </div>
        );
      },
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {owner
                  ? 'WS-D: Quản Trị Đối Tác & Duyệt Hạn Mức Tín Dụng Toàn Chuỗi'
                  : 'Workspace D: Sổ Danh Bạ Đối Tác & Tài Khoản VietQR'}
              </h1>
              {owner && (
                <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold border border-amber-300">
                  Chủ Đầu Tư
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {owner
                ? 'Đặc quyền Chủ Đầu Tư: Quản trị danh bạ, độc quyền phê duyệt hạn mức tín dụng và khóa đen đối tác'
                : 'Chế độ Vận Hành (Farm Manager & Kế Toán): Tạo lập và quản lý nhà cung cấp, khách hàng, nhà xe'}
            </p>
          </div>
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

      {/* Thanh Tìm Kiếm & Lọc Trạng Thái */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên đối tác, SĐT, mã số thuế, mã đối tác..."
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

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchPartners}
          isLoading={loading}
        >
          Làm Mới
        </Button>
      </div>

      {/* Bảng Dữ Liệu Đối Tác */}
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

      {/* Modal Thêm/Sửa */}
      <PartnerFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        editingItem={editingPartner}
        onSuccess={() => {
          fetchPartners();
          notifyDataChanged?.('partners');
        }}
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
          notifyDataChanged?.('partners');
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

      {/* Modal Phê Duyệt Hạn Mức Tín Dụng (Đặc Quyền Owner) */}
      <ApproveCreditLimitModal
        isOpen={creditModalOpen}
        onClose={() => {
          setCreditModalOpen(false);
          setCreditPartner(null);
        }}
        partner={creditPartner}
        onSuccess={fetchPartners}
      />
    </div>
  );
}

export default PartnersWorkspace;
