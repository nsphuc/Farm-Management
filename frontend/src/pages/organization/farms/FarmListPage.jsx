import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  MapPin,
  Maximize2,
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
  Sprout,
  Beef,
  Wheat,
  Fish,
  AlertTriangle,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Can } from '../../../permissions/Can';
import { farmApi } from '../../../services/farmApi';
import { FarmFormModal } from './FarmFormModal';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Trang Danh sách Trang trại (Chức năng 1.2 trong Sơ đồ phân cấp).
 * Cung cấp: Xem danh sách (1.2.2), Thêm mới (1.2.1), Cập nhật (1.2.4), Ngừng hoạt động (1.2.5).
 */
export const FarmListPage = () => {
  const navigate = useNavigate();

  // State dữ liệu & trạng thái tải
  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State bộ lọc và hiển thị
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // State Modal Form & Confirm Dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [farmToDelete, setFarmToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch dữ liệu từ API Backend
  const fetchFarms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Gọi API GET /farms/all để lấy toàn bộ dữ liệu trang trại của Tenant
      const res = await farmApi.getAllFarms();
      setFarms(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách trang trại:', err);
      setError(
        err.response?.data?.message ||
          'Không thể tải danh sách trang trại. Vui lòng thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  // Lọc dữ liệu client-side cho danh sách
  const filteredFarms = useMemo(() => {
    return farms.filter((f) => {
      const matchSearch =
        !searchTerm.trim() ||
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.address?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'ALL' || f.farmType === typeFilter;
      const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [farms, searchTerm, typeFilter, statusFilter]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = farms.length;
    const active = farms.filter((f) => f.status === 'ACTIVE').length;
    const totalArea = farms.reduce(
      (sum, f) => sum + (Number(f.totalAreaM2) || 0),
      0
    );
    return { total, active, totalArea };
  }, [farms]);

  // Xử lý mở Modal Sửa
  const handleEdit = (farm, e) => {
    e?.stopPropagation();
    setSelectedFarm(farm);
    setIsFormOpen(true);
  };

  // Xử lý mở Dialog Xóa (Soft-delete)
  const handleDeletePrompt = (farm, e) => {
    e?.stopPropagation();
    setFarmToDelete(farm);
    setIsDeleteOpen(true);
  };

  // Xác nhận vô hiệu hóa trang trại
  const handleConfirmDelete = async () => {
    if (!farmToDelete) return;
    setIsDeleting(true);
    try {
      await farmApi.deleteFarm(farmToDelete.id);
      toast.success(
        `Đã vô hiệu hóa trang trại "${farmToDelete.name}" thành công`
      );
      setIsDeleteOpen(false);
      setFarmToDelete(null);
      fetchFarms();
    } catch (err) {
      const errMsg =
        err.response?.data?.message || 'Vô hiệu hóa trang trại thất bại';
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper render Badge loại hình trang trại
  const renderTypeBadge = (type) => {
    switch (type) {
      case 'CROP':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Wheat className="w-3.5 h-3.5" /> Trồng trọt
          </span>
        );
      case 'LIVESTOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Beef className="w-3.5 h-3.5" /> Chăn nuôi
          </span>
        );
      case 'MIXED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <Sprout className="w-3.5 h-3.5" /> Hỗn hợp
          </span>
        );
      case 'AQUACULTURE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Fish className="w-3.5 h-3.5" /> Thủy sản
          </span>
        );
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  // Helper render Badge trạng thái
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" className="gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Đang hoạt động
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge variant="default" className="text-slate-500 bg-slate-100">
            Ngừng hoạt động
          </Badge>
        );
      case 'MAINTENANCE':
        return <Badge variant="warning">Bảo trì</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Trang & Nút Hành Động */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <span>1. Quản lý Tổ chức & Trang trại</span>
            <span>/</span>
            <span>1.2. Danh mục trang trại</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Danh Sách Cơ Sở & Trang Trại
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản trị không gian sản xuất, phân vùng canh tác và định vị GPS các
            trang trại
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFarms}
            disabled={isLoading}
            className="gap-1.5 bg-white shadow-sm"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>

          {/* Dùng component Can để ẩn nút Tạo Trang trại nếu user không có quyền PERM_FARM_CREATE */}
          <Can permission="PERM_FARM_CREATE">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedFarm(null);
                setIsFormOpen(true);
              }}
              className="gap-2 shadow-emerald-600/20 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm trang trại mới</span>
            </Button>
          </Can>
        </div>
      </div>

      {/* 2. Thẻ Thống Kê Tổng Quan (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tổng số trang trại
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.total}{' '}
              <span className="text-xs font-normal text-slate-400">cơ sở</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Maximize2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              1.2.7. Tổng diện tích mặt bằng
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {Number(stats.totalArea).toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-normal text-slate-400">m²</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Đang hoạt động (Active)
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.active} / {stats.total}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Thanh Công Cụ Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Tìm kiếm */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, mã hoặc địa chỉ..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Các bộ lọc dropdown */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Lọc loại hình */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="ALL">Mọi loại hình</option>
            <option value="CROP">Trồng trọt (Crop)</option>
            <option value="LIVESTOCK">Chăn nuôi (Livestock)</option>
            <option value="MIXED">Hỗn hợp (Mixed)</option>
            <option value="AQUACULTURE">Thủy sản (Aquaculture)</option>
          </select>

          {/* Lọc trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
            <option value="MAINTENANCE">Bảo trì</option>
          </select>

          {/* Toggle View Mode (Bảng / Lưới thẻ) */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 ml-auto md:ml-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Xem dạng bảng"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Nội Dung Chính: Xử lý 3 Trạng thái Loading / Error / Empty / Data */}

      {/* 4.1 TRẠNG THÁI LOADING (Skeleton) */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
          <div className="inline-block animate-spin text-emerald-600 mb-3">
            <RefreshCw className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            Đang tải danh mục trang trại từ hệ thống...
          </p>
        </div>
      )}

      {/* 4.2 TRẠNG THÁI LỖI (Error State) */}
      {!isLoading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-800">
          <AlertTriangle className="w-10 h-10 mx-auto text-rose-500 mb-2" />
          <h3 className="text-base font-bold">Không thể tải dữ liệu trang trại</h3>
          <p className="text-sm text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFarms}
            className="mt-4 border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* 4.3 TRẠNG THÁI RỖNG (Empty State) */}
      {!isLoading && !error && filteredFarms.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Không tìm thấy trang trại phù hợp'
              : 'Chưa có trang trại nào được khởi tạo'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc'
              : 'Hãy bắt đầu thiết lập trang trại đầu tiên để phân bổ các phân khu sản xuất'}
          </p>
          <Can permission="PERM_FARM_CREATE">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedFarm(null);
                setIsFormOpen(true);
              }}
              className="mt-5 gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo trang trại đầu tiên</span>
            </Button>
          </Can>
        </div>
      )}

      {/* 4.4 TRẠNG THÁI CÓ DỮ LIỆU - DẠNG BẢNG (Table View) */}
      {!isLoading && !error && filteredFarms.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã Trang Trại</th>
                  <th className="py-3.5 px-4">Tên Cơ Sở</th>
                  <th className="py-3.5 px-4">Loại Hình</th>
                  <th className="py-3.5 px-4 text-right">Tổng Diện Tích</th>
                  <th className="py-3.5 px-4">Địa Chỉ & GPS</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredFarms.map((farm) => (
                  <tr
                    key={farm.id}
                    onClick={() => navigate(`/farms/${farm.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {farm.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {farm.name}
                    </td>
                    <td className="py-3.5 px-4">{renderTypeBadge(farm.farmType)}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      {Number(farm.totalAreaM2).toLocaleString('vi-VN')} m²
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{farm.address || '—'}</span>
                      </div>
                      {farm.latitude && farm.longitude && (
                        <span className="text-[11px] font-mono text-slate-400 block ml-5">
                          {Number(farm.latitude).toFixed(4)}, {Number(farm.longitude).toFixed(4)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{renderStatusBadge(farm.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className="inline-flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Nút Xem chi tiết */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/farms/${farm.id}`)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600"
                          title="Xem chi tiết phân khu"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>

                        {/* Nút Sửa: Chỉ hiện nếu có quyền PERM_FARM_UPDATE */}
                        <Can permission="PERM_FARM_UPDATE">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEdit(farm, e)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600"
                            title="Cập nhật thông tin"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Can>

                        {/* Nút Ngừng hoạt động (Soft-delete): Chỉ hiện nếu có quyền PERM_FARM_UPDATE */}
                        <Can permission="PERM_FARM_UPDATE">
                          {farm.status !== 'INACTIVE' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeletePrompt(farm, e)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                              title="Ngừng hoạt động trang trại"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>Hiển thị {filteredFarms.length} / {farms.length} trang trại</span>
            <span>Mặc định lọc theo quyền hạn Tenant của phiên đăng nhập</span>
          </div>
        </div>
      )}

      {/* 4.5 TRẠNG THÁI CÓ DỮ LIỆU - DẠNG THẺ (Card Grid View) */}
      {!isLoading && !error && filteredFarms.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFarms.map((farm) => (
            <div
              key={farm.id}
              onClick={() => navigate(`/farms/${farm.id}`)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                      {farm.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mt-2">
                      {farm.name}
                    </h3>
                  </div>
                  {renderStatusBadge(farm.status)}
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-600">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Loại hình sản xuất:</span>
                    <div>{renderTypeBadge(farm.farmType)}</div>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">1.2.7. Tổng diện tích:</span>
                    <span className="font-semibold text-slate-800">
                      {Number(farm.totalAreaM2).toLocaleString('vi-VN')} m²
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-1">Địa chỉ hành chính:</span>
                    <p className="text-slate-700 line-clamp-2">{farm.address || 'Chưa cập nhật địa chỉ'}</p>
                  </div>
                </div>
              </div>

              <div
                className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => navigate(`/farms/${farm.id}`)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>1.2.3. Xem phân khu</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  <Can permission="PERM_FARM_UPDATE">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEdit(farm, e)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Can>
                  <Can permission="PERM_FARM_UPDATE">
                    {farm.status !== 'INACTIVE' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeletePrompt(farm, e)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </Can>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Modal Tạo / Sửa Farm */}
      <FarmFormModal
        isOpen={isFormOpen}
        farm={selectedFarm}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchFarms}
      />

      {/* 6. Dialog Xác nhận Vô hiệu hóa */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="1.2.5. Xác nhận ngừng hoạt động trang trại"
        message={`Bạn có chắc chắn muốn ngừng hoạt động trang trại "${farmToDelete?.name}"? Hệ thống sẽ cập nhật trạng thái sang INACTIVE và bảo lưu toàn bộ nhật ký canh tác.`}
        confirmLabel="Ngừng hoạt động"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsDeleteOpen(false);
          setFarmToDelete(null);
        }}
      />
    </div>
  );
};

export default FarmListPage;
