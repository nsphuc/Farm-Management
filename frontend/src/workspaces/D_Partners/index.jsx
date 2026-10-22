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
  Lock,
  Globe,
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
  { id: 'SUPPLIER', label: 'Nhà Cung Cấp Vật Tư (SUPPLIER)', icon: Building },
  { id: 'BUYER', label: 'Khách Hàng / Thương Lái (BUYER)', icon: ShoppingCart },
  { id: 'LOGISTICS', label: 'Đơn Vị Vận Chuyển (LOGISTICS)', icon: Truck },
  { id: 'AGENT', label: 'Đại Lý Hai Chiều (AGENT)', icon: Layers },
];

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'ACTIVE - Đang giao dịch' },
  { value: 'INACTIVE', label: 'INACTIVE - Tạm ngừng' },
  { value: 'BLACKLISTED', label: 'BLACKLISTED - Bị chặn / Nợ xấu' },
];

export function PartnersWorkspace() {
  const { isOwner, isFarmManager, isFarmAccountant } = useAuthStore();
  const { activeFarmId, activeFarm, syncTrigger, notifyDataChanged } = useActiveFarmStore();
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

  const handleRowClick = (item) => {
    setSelectedPartner(item);
    setDrawerOpen(true);
  };

  const handleQuickQr = (item, e) => {
    e?.stopPropagation();
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
  const logisticsCount = partners.filter((p) => p.partnerType === 'LOGISTICS').length;
  const agentCount = partners.filter((p) => p.partnerType === 'AGENT').length;

  const columns = [
    {
      key: 'name',
      header: 'Mã & Tên Đối Tác',
      title: 'Mã & Tên Đối Tác',
      width: '230px',
      render: (item) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{item.name}</div>
          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
            {item.code && (
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                {item.code}
              </span>
            )}
            <span>{item.taxCode ? `MST: ${item.taxCode}` : 'Chưa có MST'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'partnerType',
      header: 'Loại Đối Tác',
      title: 'Loại Đối Tác',
      width: '120px',
      render: (item) => <StatusBadge status={item.partnerType} size="sm" />,
    },
    {
      key: 'scope',
      header: 'Phạm Vi',
      title: 'Phạm Vi',
      width: '160px',
      render: (item) => {
        const isFarmSpecific = Boolean(item.farmId);
        return isFarmSpecific ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
            <Building className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>Đối tác Trại hiện tại</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
            <Globe className="h-3 w-3 text-blue-600 shrink-0" />
            <span>Đối tác Chung toàn chuỗi</span>
          </span>
        );
      },
    },
    {
      key: 'contactPerson',
      header: 'Người Liên Hệ',
      title: 'Người Liên Hệ',
      width: '140px',
      render: (item) => (
        <span className="text-xs text-slate-800 font-medium">
          {item.contactPerson || '—'}
        </span>
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
      key: 'taxCode',
      header: 'Mã Số Thuế',
      title: 'Mã Số Thuế',
      width: '120px',
      render: (item) => (
        <span className="font-mono text-xs text-slate-600">
          {item.taxCode || '—'}
        </span>
      ),
    },
    {
      key: 'bankInfo',
      header: 'Ngân Hàng Napas247',
      title: 'Ngân Hàng Napas247',
      width: '180px',
      render: (item) => {
        if (!item.bankAccountNo) {
          return <span className="text-xs text-slate-400 italic">Chưa liên kết</span>;
        }
        return (
          <div className="text-xs">
            <div className="font-mono font-bold text-slate-800">
              {item.bankAccountNo}
            </div>
            <div className="text-[10px] text-slate-500 truncate max-w-[170px]">
              {item.bankName?.split(' - ')[0] || item.bankBin} • {item.bankAccountName}
            </div>
          </div>
        );
      },
    },
    {
      key: 'credit',
      header: 'Hạn Mức & Hạn Nợ',
      title: 'Hạn Mức & Hạn Nợ',
      width: '150px',
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
      width: owner ? '230px' : '150px',
      render: (item) => {
        const isBlacklisted = item.status === 'BLACKLISTED';
        const isEditableByFarm = item.farmId && Number(item.farmId) === Number(activeFarmId);

        // THAO TÁC DÀNH CHO OWNER
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

              <Button
                size="xs"
                variant={isBlacklisted ? 'outline' : 'danger'}
                icon={isBlacklisted ? <Unlock className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                onClick={(e) => handleToggleBlacklist(item, e)}
                title={isBlacklisted ? 'Mở khóa đối tác sang ACTIVE' : 'Đưa vào danh sách đen (BLACKLISTED)'}
                className={isBlacklisted ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-50' : ''}
              >
                {isBlacklisted ? 'Mở' : 'Khóa'}
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

        // THAO TÁC DÀNH CHO FARM_MANAGER & KẾ TOÁN TRẠI:
        // Tuyệt đối KHÔNG có nút Duyệt hạn mức hay Khóa đen của Owner!
        return (
          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Nút 360 độ */}
            <Button
              size="xs"
              variant="outline"
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => {
                setSelectedPartner(item);
                setDrawerOpen(true);
              }}
              title="Hồ sơ đối tác 360°"
            >
              360°
            </Button>

            {/* Nút Xem Mã VietQR Thanh Toán Cho NCC */}
            <Button
              size="xs"
              variant="outline"
              icon={<QrCode className="h-3.5 w-3.5 text-blue-600" />}
              onClick={(e) => handleQuickQr(item, e)}
              title="Xem mã VietQR Napas247 thanh toán"
              className="text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              QR
            </Button>

            {/* Nút Sửa Thông Tin Liên Hệ & Ngân Hàng: Chỉ cho phép sửa đối tác thuộc farmId == activeFarmId */}
            {isEditableByFarm ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPartner(item);
                  setFormModalOpen(true);
                }}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Sửa thông tin liên hệ & ngân hàng"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            ) : (
              <span
                className="p-1.5 text-slate-300 cursor-not-allowed"
                title="Đối tác dùng chung toàn chuỗi do Chủ đầu tư (Owner) quản lý"
              >
                <Lock className="h-4 w-4" />
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
            <Contact className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {owner
                  ? 'WS-D: Quản Trị Đối Tác & Duyệt Hạn Mức Tín Dụng Toàn Chuỗi'
                  : 'WS-D: Quản Lý Đối Tác Trang Trại'}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                  owner
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {owner ? 'Chủ Đầu Tư' : activeFarm?.name || 'Trang Trại Phụ Trách'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {owner
                ? 'Đặc quyền Chủ Đầu Tư: Quản trị danh bạ, độc quyền phê duyệt hạn mức tín dụng và khóa đen đối tác'
                : 'Quản lý danh bạ nhà cung cấp vật tư, thương lái thu mua và đơn vị vận chuyển của trang trại'}
            </p>
          </div>
        </div>

        {/* Nút Thêm Mới Đối Tác */}
        <Button
          variant="primary"
          size="md"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingPartner(null);
            setFormModalOpen(true);
          }}
        >
          {owner ? '+ Thêm Đối Tác Toàn Chuỗi' : '+ Thêm Đối Tác Cho Trang Trại'}
        </Button>
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
            Nhà Cung Cấp (SUPPLIER)
          </span>
          <div className="text-2xl font-black font-mono text-blue-700 mt-1">{supplierCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Vật tư, cây con giống</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Khách Hàng (BUYER)
          </span>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">{buyerCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Thu mua nông sản</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Vận Chuyển & Đại Lý
          </span>
          <div className="text-2xl font-black font-mono text-indigo-700 mt-1">
            {logisticsCount + agentCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Hậu cần & Hai chiều</div>
        </div>
      </div>

      {/* 5 Tabs Phân Loại Nghiệp Vụ */}
      <div className="flex space-x-1 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-px">
        {PARTNER_TABS.map((tab) => {
          const isSelected = partnerTypeTab === tab.id;
          const displayLabel =
            tab.id === 'ALL'
              ? owner
                ? 'Tất Cả Đối Tác'
                : 'Tất Cả Đối Tác Trại'
              : tab.label;

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
              <span>{displayLabel}</span>
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
          description: farmManager
            ? 'Khai báo các nhà cung cấp giống/phân bón, thương lái thu mua nông sản hoặc nhà xe vận chuyển của trang trại.'
            : 'Khai báo thông tin pháp lý, hạn mức công nợ và số tài khoản ngân hàng Napas247.',
          actionLabel: farmManager ? '+ Thêm Đối Tác Cho Trang Trại' : '+ Thêm Đối Tác Mới',
          onAction: () => {
            setEditingPartner(null);
            setFormModalOpen(true);
          },
        }}
      />

      {/* Modal Thêm/Sửa Đối Tác */}
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
