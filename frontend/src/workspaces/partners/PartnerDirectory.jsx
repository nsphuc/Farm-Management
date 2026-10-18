import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  ShoppingBag,
  Truck,
  Edit,
  PowerOff,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  FileText,
  Building,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Can } from '../../permissions/Can';
import { partnerApi } from '../../services/partnerApi';
import { PartnerFormModal } from '../../pages/organization/partners/PartnerFormModal';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { toast } from '../../store/ui/useToastStore';

/**
 * Workspace D: Sổ Danh bạ Đối tác Thương mại Hợp nhất (RULE-UI-001 Section 2.4)
 * Hợp nhất Nhà cung cấp (1.6.1), Khách hàng / Đại lý thu mua (1.6.2) và Vận chuyển.
 */
export const PartnerDirectory = () => {
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'SUPPLIER' | 'BUYER' | 'LOGISTICS'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [partnerToDeactivate, setPartnerToDeactivate] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Fetch partners from API
  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await partnerApi.getAllPartners();
      setPartners(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh bạ đối tác:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể tải danh sách đối tác.';
      toast.error(msg, 'Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Statistics
  const stats = useMemo(() => {
    const total = partners.length;
    const suppliers = partners.filter(
      (p) => p.isSupplier || p.partnerType === 'SUPPLIER' || p.partnerType === 'AGENT'
    ).length;
    const buyers = partners.filter(
      (p) => p.isBuyer || p.partnerType === 'BUYER' || p.partnerType === 'AGENT'
    ).length;
    const logistics = partners.filter((p) => p.partnerType === 'LOGISTICS').length;
    const active = partners.filter((p) => p.status === 'ACTIVE').length;

    return { total, suppliers, buyers, logistics, active };
  }, [partners]);

  // Filtered partners based on tab, search, status
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      // Tab matching
      let matchTab = true;
      if (activeTab === 'SUPPLIER') {
        matchTab = Boolean(p.isSupplier || p.partnerType === 'SUPPLIER' || p.partnerType === 'AGENT');
      } else if (activeTab === 'BUYER') {
        matchTab = Boolean(p.isBuyer || p.partnerType === 'BUYER' || p.partnerType === 'AGENT');
      } else if (activeTab === 'LOGISTICS') {
        matchTab = p.partnerType === 'LOGISTICS';
      }

      // Status matching
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      // Search matching
      const search = searchTerm.trim().toLowerCase();
      const matchSearch =
        !search ||
        p.name?.toLowerCase().includes(search) ||
        p.code?.toLowerCase().includes(search) ||
        p.contactPerson?.toLowerCase().includes(search) ||
        p.phone?.includes(search) ||
        p.taxCode?.toLowerCase().includes(search) ||
        p.email?.toLowerCase().includes(search);

      return matchTab && matchStatus && matchSearch;
    });
  }, [partners, activeTab, statusFilter, searchTerm]);

  // Deactivate handler
  const handleConfirmDeactivate = async () => {
    if (!partnerToDeactivate) return;
    setIsSubmittingAction(true);
    try {
      await partnerApi.deactivatePartner(partnerToDeactivate.id);
      toast.success(`Đã ngừng hợp tác với đối tác "${partnerToDeactivate.name}"!`);
      setIsDeactivateOpen(false);
      setPartnerToDeactivate(null);
      fetchPartners();
    } catch (err) {
      console.error('Lỗi khi vô hiệu hóa đối tác:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái đối tác.';
      toast.error(msg, 'Lỗi thao tác');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getPartnerTypeBadge = (partner) => {
    const isSup = partner.isSupplier || partner.partnerType === 'SUPPLIER' || partner.partnerType === 'AGENT';
    const isBuy = partner.isBuyer || partner.partnerType === 'BUYER' || partner.partnerType === 'AGENT';

    if (isSup && isBuy) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Sparkles className="w-3 h-3 text-purple-500" /> Cả hai (NCC & Khách)
        </span>
      );
    }
    if (isSup) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShoppingBag className="w-3 h-3 text-emerald-600" /> Nhà cung cấp
        </span>
      );
    }
    if (isBuy) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Building2 className="w-3 h-3 text-blue-600" /> Khách hàng thu mua
        </span>
      );
    }
    if (partner.partnerType === 'LOGISTICS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Truck className="w-3 h-3 text-amber-600" /> Đơn vị vận chuyển
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        Đối tác khác
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Sổ Danh Bạ Đối Tác Thương Mại
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Workspace D
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Quản lý Nhà cung cấp vật tư, Khách hàng bao tiêu nông sản và Đơn vị vận chuyển (Rule 1.6)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchPartners} disabled={isLoading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          <Can permission={['PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT']}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedPartner(null);
                setIsFormOpen(true);
              }}
              className="gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Thêm Đối Tác Mới
            </Button>
          </Can>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tất cả đối tác</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">{stats.active} đang hoạt động</div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Nhà cung cấp</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{stats.suppliers}</div>
          <div className="text-xs text-slate-400 mt-1">Cung cấp giống, phân, thuốc</div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Khách hàng / Đại lý</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">{stats.buyers}</div>
          <div className="text-xs text-slate-400 mt-1">Thu mua nông sản xuất xưởng</div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Vận chuyển / Logistics</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{stats.logistics}</div>
          <div className="text-xs text-slate-400 mt-1">Giao nhận kho vận</div>
        </Card>
      </div>

      {/* Tab Navigation & Search Filter Console */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-200 px-6 pt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Tất Cả</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('SUPPLIER')}
              className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'SUPPLIER'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Nhà Cung Cấp</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                {stats.suppliers}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('BUYER')}
              className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'BUYER'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Khách Hàng / Thương Lái</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                {stats.buyers}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('LOGISTICS')}
              className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'LOGISTICS'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Vận Chuyển</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                {stats.logistics}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hợp tác (ACTIVE)</option>
              <option value="INACTIVE">Ngừng hợp tác (INACTIVE)</option>
            </select>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm đối tác theo tên, mã NCC/KH, SĐT, Email, mã số thuế..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
            />
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-sm">Đang tải danh bạ đối tác...</p>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">Không tìm thấy đối tác nào</h3>
            <p className="text-xs text-slate-400 mt-1">
              Thử thay đổi bộ lọc tìm kiếm hoặc tạo đối tác mới với nút bên trên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã đối tác</th>
                  <th className="py-3 px-4">Tên đối tác / Pháp nhân</th>
                  <th className="py-3 px-4">Nhóm phân loại</th>
                  <th className="py-3 px-4">Người liên hệ</th>
                  <th className="py-3 px-4">Thông tin liên lạc</th>
                  <th className="py-3 px-4">Mã số thuế</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">{p.code}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      {p.address && <div className="text-xs text-slate-400 truncate max-w-xs">{p.address}</div>}
                    </td>
                    <td className="py-3.5 px-4">{getPartnerTypeBadge(p)}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {p.contactPerson || p.contactName || <span className="text-slate-300 italic">—</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.phone}</span>
                        </div>
                      )}
                      {p.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.email}</span>
                        </div>
                      )}
                      {!p.phone && !p.email && <span className="text-slate-300 italic text-xs">—</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {p.taxCode ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {p.taxCode}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === 'ACTIVE' ? (
                        <Badge variant="success" className="gap-1 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Đang hợp tác
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="gap-1 font-semibold text-[11px]">
                          <XCircle className="w-3 h-3" /> Ngừng hợp tác
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Can permission={['PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT']}>
                          <button
                            onClick={() => {
                              setSelectedPartner(p);
                              setIsFormOpen(true);
                            }}
                            title="Chỉnh sửa đối tác"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Can>

                        {p.status === 'ACTIVE' && (
                          <Can permission={['PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT']}>
                            <button
                              onClick={() => {
                                setPartnerToDeactivate(p);
                                setIsDeactivateOpen(true);
                              }}
                              title="Ngừng hợp tác"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          </Can>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <PartnerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPartner(null);
        }}
        partner={selectedPartner}
        onSuccess={fetchPartners}
      />

      {/* Confirm Deactivate Dialog */}
      <ConfirmDialog
        isOpen={isDeactivateOpen}
        onClose={() => {
          setIsDeactivateOpen(false);
          setPartnerToDeactivate(null);
        }}
        onConfirm={handleConfirmDeactivate}
        isLoading={isSubmittingAction}
        title="Ngừng hợp tác với đối tác"
        message={
          partnerToDeactivate
            ? `Bạn có chắc chắn muốn ngừng hợp tác với "${partnerToDeactivate.name}" (Mã: ${partnerToDeactivate.code})? Hành động này sẽ chuyển trạng thái sang INACTIVE và giữ nguyên toàn bộ lịch sử chứng từ mua bán.`
            : ''
        }
        confirmText="Ngừng hợp tác"
        confirmVariant="danger"
      />
    </div>
  );
};

export default PartnerDirectory;
