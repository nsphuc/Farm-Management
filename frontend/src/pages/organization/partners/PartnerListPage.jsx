import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  ShoppingBag,
  Truck,
  Briefcase,
  Edit,
  PowerOff,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Can } from '../../../permissions/Can';
import { partnerApi } from '../../../services/partnerApi';
import { PartnerFormModal } from './PartnerFormModal';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Trang Quản lý Đối tác (Chức năng 1.6 trong Sơ đồ phân cấp).
 * Hỗ trợ quản lý Nhà cung cấp (1.6.1), Khách hàng/đối tác tiêu thụ (1.6.2) và Thông tin liên hệ (1.6.3).
 */
export const PartnerListPage = () => {
  // State dữ liệu & trạng thái tải
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // State Modal Form & Confirm Dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [partnerToDeactivate, setPartnerToDeactivate] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Fetch dữ liệu từ API Backend thực tế (KHÔNG mock data)
  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await partnerApi.getAllPartners();
      setPartners(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đối tác:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
      setError(msg);
      toast.error(msg, 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Bộ lọc dữ liệu phía client
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchSearch =
        !searchTerm.trim() ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm.trim()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'ALL' || p.partnerType === typeFilter;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [partners, searchTerm, typeFilter, statusFilter]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = partners.length;
    const suppliers = partners.filter((p) => p.partnerType === 'SUPPLIER').length;
    const buyers = partners.filter((p) => p.partnerType === 'BUYER').length;
    const active = partners.filter((p) => p.status === 'ACTIVE').length;
    return { total, suppliers, buyers, active };
  }, [partners]);

  // Xử lý mở Modal thêm mới
  const handleOpenCreate = () => {
    setSelectedPartner(null);
    setIsFormOpen(true);
  };

  // Xử lý mở Modal cập nhật
  const handleOpenEdit = (partner) => {
    setSelectedPartner(partner);
    setIsFormOpen(true);
  };

  // Xử lý mở xác nhận ngừng hợp tác
  const handleOpenDeactivate = (partner) => {
    setPartnerToDeactivate(partner);
    setIsDeactivateOpen(true);
  };

  // Gọi API ngừng hợp tác
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
      console.error('Lỗi khi ngừng hợp tác:', err);
      toast.error(
        err.response?.data?.message || 'Không thể cập nhật trạng thái đối tác',
        'Lỗi thao tác'
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Render Badge phân loại đối tác
  const renderTypeBadge = (type) => {
    switch (type) {
      case 'SUPPLIER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShoppingBag className="w-3 h-3" /> Nhà cung cấp
          </span>
        );
      case 'BUYER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Users className="w-3 h-3" /> Khách hàng
          </span>
        );
      case 'LOGISTICS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3 h-3" /> Logistics / Vận chuyển
          </span>
        );
      case 'AGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Briefcase className="w-3 h-3" /> Đại lý / Phân phối
          </span>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Trang & Nút Thêm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              1.6. Quản lý đối tác
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              {stats.total} đối tác
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách nhà cung cấp vật tư, giống và khách hàng tiêu thụ nông sản
          </p>
        </div>

        {/* Ẩn nút Thêm đối tác nếu người dùng không có quyền quản lý */}
        <Can
          role="ROLE_FARM_OWNER"
          permission="PERM_FARM_UPDATE"
        >
          <Button onClick={handleOpenCreate} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Thêm đối tác mới
          </Button>
        </Can>
      </div>

      {/* 2. Thẻ KPI Tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng đối tác</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nhà cung cấp</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">{stats.suppliers}</span>
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Khách tiêu thụ</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-sky-600">{stats.buyers}</span>
            <Users className="w-5 h-5 text-sky-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang hợp tác</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-indigo-600">{stats.active}</span>
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          </div>
        </Card>
      </div>

      {/* 3. Thanh tìm kiếm & Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên đối tác, mã đối tác, người liên hệ, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Lọc theo loại đối tác */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
          >
            <option value="ALL">Tất cả loại đối tác</option>
            <option value="SUPPLIER">Nhà cung cấp</option>
            <option value="BUYER">Khách hàng tiêu thụ</option>
            <option value="LOGISTICS">Vận chuyển / Logistics</option>
            <option value="AGENT">Đại lý phân phối</option>
          </select>

          {/* Lọc theo trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hợp tác</option>
            <option value="INACTIVE">Ngừng hợp tác</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchPartners}
            disabled={isLoading}
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 4. Trạng thái Loading, Error, Empty và Bảng dữ liệu */}
      {isLoading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600 mt-4">Đang tải danh mục đối tác từ máy chủ...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Không thể tải dữ liệu đối tác</h3>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchPartners} className="mt-4">
            Thử lại
          </Button>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy đối tác nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Không có đối tác nào khớp với tiêu chí tìm kiếm hiện tại.'
              : 'Chưa có đối tác nào được đăng ký trong hệ thống.'}
          </p>
          <Can role="ROLE_FARM_OWNER" permission="PERM_FARM_UPDATE">
            <Button size="sm" onClick={handleOpenCreate} className="mt-4">
              <Plus className="w-4 h-4 mr-1.5" /> Thêm đối tác ngay
            </Button>
          </Can>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã & Đối tác</th>
                  <th className="py-3.5 px-4">Phân loại</th>
                  <th className="py-3.5 px-4">Người liên hệ & SĐT</th>
                  <th className="py-3.5 px-4">Địa chỉ / MST</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.map((p) => {
                  const isActive = p.status === 'ACTIVE';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">{p.code}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">{renderTypeBadge(p.partnerType)}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{p.contactName || '—'}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {p.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {p.phone}
                            </span>
                          )}
                          {p.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" /> {p.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-700 truncate" title={p.address}>
                          {p.address || '—'}
                        </div>
                        {p.taxCode && (
                          <div className="text-xs text-slate-500 mt-0.5">MST: {p.taxCode}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang hợp tác
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Ngừng hợp tác
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ẩn nút Sửa đối tác nếu không có quyền quản lý */}
                          <Can
                            role="ROLE_FARM_OWNER"
                            permission="PERM_FARM_UPDATE"
                          >
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Sửa thông tin đối tác"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {isActive && (
                              <button
                                onClick={() => handleOpenDeactivate(p)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Ngừng hợp tác"
                              >
                                <PowerOff className="w-4 h-4" />
                              </button>
                            )}
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Thêm mới / Cập nhật */}
      <PartnerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        partner={selectedPartner}
        onSuccess={fetchPartners}
      />

      {/* Confirm Dialog Ngừng hợp tác */}
      <ConfirmDialog
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={handleConfirmDeactivate}
        isLoading={isSubmittingAction}
        title="Xác nhận ngừng hợp tác"
        message={`Bạn có chắc chắn muốn ngừng hợp tác với đối tác "${partnerToDeactivate?.name}" (${partnerToDeactivate?.code}) không? Trạng thái đối tác sẽ chuyển thành INACTIVE.`}
        confirmText="Ngừng hợp tác"
        variant="danger"
      />
    </div>
  );
};

export default PartnerListPage;
