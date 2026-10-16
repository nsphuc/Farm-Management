import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Boxes,
  Calendar,
  User,
  RefreshCw,
  AlertCircle,
  Eye,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Can } from '../../../permissions/Can';
import { inventoryTransactionApi } from '../../../services/inventoryTransactionApi';
import { warehouseApi } from '../../../services/warehouseApi';
import { farmApi } from '../../../services/farmApi';
import { useTenantStore } from '../../../store/tenant/useTenantStore';
import { IssueDetailModal } from './IssueDetailModal';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Trang Quản lý Phiếu Xuất Kho (Nghiệp vụ: 3.4. Xuất kho trong Sơ đồ phân cấp).
 * Cung cấp: Xem danh sách chứng từ xuất, Lọc theo kho/trạng thái/ngày, Xem chi tiết phiếu & Hủy phiếu xuất.
 */
export const IssueListPage = () => {
  const navigate = useNavigate();
  const { currentFarm, setFarm } = useTenantStore();

  // State trang trại & kho
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('ALL');

  // State bộ lọc
  const [issueTypeFilter, setIssueTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // State danh sách phiếu xuất & phân trang
  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 15,
    totalPages: 0,
    totalElements: 0,
  });

  // State trạng thái giao diện: Loading, Error, Empty
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State Modal xem chi tiết
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 1. Tải danh sách trang trại của Tenant
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await farmApi.getAllFarms();
        const farmList = res.data || [];
        setFarms(farmList);
        if (farmList.length > 0 && !selectedFarmId) {
          setSelectedFarmId(farmList[0].id);
          setFarm(farmList[0]);
        }
      } catch (err) {
        console.error('Lỗi khi tải trang trại:', err);
      }
    };
    fetchFarms();
  }, [selectedFarmId, setFarm]);

  // 2. Tải danh sách kho khi chọn Farm
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!selectedFarmId) return;
      try {
        const res = await warehouseApi.getAllWarehousesByFarm(selectedFarmId);
        setWarehouses(res.data || []);
      } catch (err) {
        console.error('Lỗi khi tải kho bãi:', err);
      }
    };
    fetchWarehouses();
  }, [selectedFarmId]);

  // 3. Tải danh sách phiếu xuất kho
  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        farmId: selectedFarmId || undefined,
        warehouseId: selectedWarehouseId !== 'ALL' ? selectedWarehouseId : undefined,
        page: pagination.page,
        size: pagination.size,
      };

      const res = await inventoryTransactionApi.getIssues(params);
      const pageData = res.data || {};
      setIssues(pageData.content || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: pageData.totalPages || 0,
        totalElements: pageData.totalElements || 0,
      }));
    } catch (err) {
      console.error('Lỗi khi tải phiếu xuất kho:', err);
      setError(err.message || 'Không thể tải danh sách phiếu xuất kho');
      toast.error('Không thể tải danh sách phiếu xuất kho', 'Lỗi hệ thống');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFarmId, selectedWarehouseId, pagination.page, pagination.size]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Filter client-side cho search term & types
  const filteredIssues = issues.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.issueCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.receiverName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = issueTypeFilter === 'ALL' || item.issueType === issueTypeFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'APPROVED':
        return <Badge variant="info">Đã duyệt</Badge>;
      case 'DRAFT':
        return <Badge variant="warning">Bản nháp</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getIssueTypeName = (type) => {
    switch (type) {
      case 'PRODUCTION_BACKFLUSH':
        return 'Xuất cho sản xuất';
      case 'INTERNAL_USE':
        return 'Tiêu dùng nội bộ';
      case 'SALE_FULFILLMENT':
        return 'Xuất bán';
      case 'DAMAGE_DISPOSAL':
        return 'Tiêu hủy / Hỏng hóc';
      case 'TRANSFER':
        return 'Xuất điều chuyển';
      default:
        return type;
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  const handleOpenDetail = async (issueId) => {
    try {
      const res = await inventoryTransactionApi.getIssueById(issueId);
      setSelectedIssue(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      toast.error('Không thể tải chi tiết phiếu xuất kho', 'Lỗi');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề trang & Nút hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100/70 text-amber-800">
              Mục 3.4 Sơ đồ phân cấp
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Giao dịch Kho</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2.5">
            <ArrowUpFromLine className="w-7 h-7 text-amber-600 shrink-0" />
            Xuất Kho Vật Tư Nông Nghiệp
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi, quản lý chứng từ xuất kho cho sản xuất, tiêu dùng nội bộ, bán hàng và hạch toán trừ thẻ kho.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIssues}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          <Can permission={['PERM_INVENTORY_MANAGE', 'PERM_INVENTORY_ISSUE']}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/inventory/issues/new')}
              className="text-xs shadow-sm bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Lập Phiếu Xuất Mới
            </Button>
          </Can>
        </div>
      </div>

      {/* 2. Thanh lọc và Ngữ cảnh Trang trại / Kho */}
      <Card className="p-4 bg-white border border-slate-200/80 shadow-sm rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Lọc Trang trại */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Trang trại ngữ cảnh
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => {
                const fId = e.target.value;
                setSelectedFarmId(fId);
                const selected = farms.find((f) => f.id === Number(fId));
                if (selected) setFarm(selected);
              }}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name} ({farm.code})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Kho bãi */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Kho xuất hàng
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="ALL">-- Tất cả kho bãi --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Loại xuất kho */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Mục đích xuất kho
            </label>
            <select
              value={issueTypeFilter}
              onChange={(e) => setIssueTypeFilter(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="ALL">-- Tất cả mục đích --</option>
              <option value="PRODUCTION_BACKFLUSH">Xuất cho sản xuất</option>
              <option value="INTERNAL_USE">Tiêu dùng nội bộ</option>
              <option value="SALE_FULFILLMENT">Xuất bán</option>
              <option value="DAMAGE_DISPOSAL">Tiêu hủy / Hỏng hóc</option>
              <option value="TRANSFER">Xuất điều chuyển</option>
            </select>
          </div>

          {/* Lọc Trạng thái */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Trạng thái chứng từ
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="COMPLETED">Hoàn thành (Đã trừ thẻ kho)</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Ô tìm kiếm từ khóa */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã phiếu (PXK-...), người nhận, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>
      </Card>

      {/* 3. Bảng dữ liệu chứng từ xuất kho */}
      <Card className="border border-slate-200/80 shadow-sm rounded-xl overflow-hidden bg-white">
        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs font-medium">Đang tải danh sách phiếu xuất kho...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="py-16 flex flex-col items-center justify-center text-rose-500 space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <p className="text-xs font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchIssues}>
              Thử lại
            </Button>
          </div>
        ) : filteredIssues.length === 0 ? (
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="p-4 rounded-full bg-slate-100 text-slate-400">
              <Boxes className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Chưa có phiếu xuất kho nào</p>
            <p className="text-xs text-slate-400 max-w-sm text-center">
              Chưa tìm thấy chứng từ xuất kho phù hợp với điều kiện lọc hiện tại. Bấm nút dưới để tạo phiếu xuất mới.
            </p>
            <Can permission={['PERM_INVENTORY_MANAGE', 'PERM_INVENTORY_ISSUE']}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/inventory/issues/new')}
                className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Lập Phiếu Xuất Mới
              </Button>
            </Can>
          </div>
        ) : (
          /* Table Data */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã chứng từ</th>
                  <th className="py-3 px-4">Ngày xuất</th>
                  <th className="py-3 px-4">Kho xuất hàng</th>
                  <th className="py-3 px-4">Người nhận / Bộ phận</th>
                  <th className="py-3 px-4">Mục đích xuất</th>
                  <th className="py-3 px-4 text-right">Tổng giá trị</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredIssues.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      {item.issueCode}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.issueDate}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{item.warehouseName || '---'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-700">{item.receiverName || 'Chưa ghi nhận'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {getIssueTypeName(item.issueType)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(item.id)}
                        className="text-xs text-slate-600 hover:text-amber-600 hover:bg-amber-50 px-2 py-1"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Xem chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Thanh phân trang */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <div>
              Hiển thị trang <span className="font-bold text-slate-700">{pagination.page + 1}</span> /{' '}
              <span className="font-bold text-slate-700">{pagination.totalPages}</span> ({pagination.totalElements} chứng từ)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 0}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages - 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Sau <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Chi tiết Phiếu Xuất */}
      <IssueDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        issue={selectedIssue}
        onIssueUpdated={fetchIssues}
      />
    </div>
  );
};

export default IssueListPage;
