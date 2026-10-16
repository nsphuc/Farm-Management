import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Building2,
  Thermometer,
  Droplets,
  Maximize2,
  Edit,
  PowerOff,
  RefreshCw,
  AlertCircle,
  Snowflake,
  Package,
  Layers,
  MapPin,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Can } from '../../../permissions/Can';
import { warehouseApi } from '../../../services/warehouseApi';
import { farmApi } from '../../../services/farmApi';
import { useTenantStore } from '../../../store/tenant/useTenantStore';
import { WarehouseFormModal } from './WarehouseFormModal';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Trang Quản lý Kho bãi trong Trang trại (Chức năng 3.1 trong Sơ đồ phân cấp).
 * Cung cấp: Xem danh sách, Thêm mới, Cập nhật, Vô hiệu hóa kho bãi theo ngữ cảnh Trang trại (Farm-scoped).
 */
export const WarehouseListPage = () => {
  // Lấy và lưu trang trại ngữ cảnh từ Zustand Store
  const { currentFarm, setFarm } = useTenantStore();

  // State danh sách trang trại để chọn ngữ cảnh
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);

  // State danh sách kho bãi & trạng thái
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // State Modal Form & Dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [warehouseToDeactivate, setWarehouseToDeactivate] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // 1. Tải danh sách trang trại của Tenant để thiết lập ngữ cảnh làm việc
  useEffect(() => {
    const fetchFarmsList = async () => {
      setIsLoadingFarms(true);
      try {
        const res = await farmApi.getAllFarms();
        const farmList = res.data || [];
        setFarms(farmList);

        // Nếu chưa chọn farm hoặc farm không còn trong danh sách -> chọn farm đầu tiên
        if (farmList.length > 0) {
          const currentExists = farmList.find((f) => f.id === currentFarm?.id);
          if (!currentFarm || !currentExists) {
            setSelectedFarmId(farmList[0].id);
            setFarm(farmList[0]);
          } else {
            setSelectedFarmId(currentFarm.id);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách trang trại:', err);
        toast.error('Không thể tải danh sách trang trại để chọn ngữ cảnh', 'Lỗi hệ thống');
      } finally {
        setIsLoadingFarms(false);
      }
    };

    fetchFarmsList();
  }, [currentFarm, setFarm]);

  // 2. Tải danh sách kho bãi khi FarmId thay đổi
  const fetchWarehouses = useCallback(async () => {
    if (!selectedFarmId) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await warehouseApi.getAllWarehousesByFarm(selectedFarmId);
      setWarehouses(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải kho bãi:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể tải danh sách kho bãi của trang trại này.';
      setError(msg);
      toast.error(msg, 'Lỗi tải kho bãi');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Khi người dùng đổi Farm trong Dropdown
  const handleFarmChange = (e) => {
    const newFarmId = Number(e.target.value);
    setSelectedFarmId(newFarmId);
    const farmObj = farms.find((f) => f.id === newFarmId);
    if (farmObj) {
      setFarm(farmObj);
    }
  };

  // Lọc dữ liệu client-side
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      const matchSearch =
        !searchTerm.trim() ||
        w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.address?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'ALL' || w.warehouseType === typeFilter;
      const matchStatus = statusFilter === 'ALL' || w.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [warehouses, searchTerm, typeFilter, statusFilter]);

  // Thống kê nhanh KPI theo Farm hiện tại
  const stats = useMemo(() => {
    const total = warehouses.length;
    const cold = warehouses.filter((w) => w.warehouseType === 'COLD_STORAGE').length;
    const raw = warehouses.filter((w) => w.warehouseType === 'RAW_MATERIAL').length;
    const totalCapacity = warehouses.reduce((sum, w) => sum + (w.capacityM3 || 0), 0);
    return { total, cold, raw, totalCapacity: totalCapacity.toFixed(1) };
  }, [warehouses]);

  // Xử lý mở Modal Form
  const handleOpenCreate = () => {
    setSelectedWarehouse(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsFormOpen(true);
  };

  // Xử lý vô hiệu hóa kho
  const handleOpenDeactivate = (warehouse) => {
    setWarehouseToDeactivate(warehouse);
    setIsDeactivateOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!warehouseToDeactivate || !selectedFarmId) return;
    setIsSubmittingAction(true);
    try {
      await warehouseApi.deleteWarehouse(selectedFarmId, warehouseToDeactivate.id);
      toast.success(`Đã vô hiệu hóa kho "${warehouseToDeactivate.name}"!`);
      setIsDeactivateOpen(false);
      setWarehouseToDeactivate(null);
      fetchWarehouses();
    } catch (err) {
      console.error('Lỗi khi vô hiệu hóa kho:', err);
      toast.error(
        err.response?.data?.message || 'Không thể vô hiệu hóa kho bãi này',
        'Lỗi thao tác'
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Render Badge loại kho
  const renderTypeBadge = (type) => {
    switch (type) {
      case 'COLD_STORAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Snowflake className="w-3 h-3 text-cyan-500" /> Kho lạnh
          </span>
        );
      case 'RAW_MATERIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="w-3 h-3 text-amber-500" /> Kho vật tư thô
          </span>
        );
      case 'FINISHED_GOODS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Boxes className="w-3 h-3 text-emerald-500" /> Kho thành phẩm
          </span>
        );
      case 'GENERAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="w-3 h-3 text-slate-500" /> Kho tổng hợp
          </span>
        );
    }
  };

  const activeFarm = farms.find((f) => f.id === Number(selectedFarmId));

  return (
    <div className="space-y-6">
      {/* 1. Header Trang, Bộ chọn Farm ngữ cảnh & Nút Thêm mới */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              3.1. Quản lý kho bãi & Vị trí lưu trữ
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              {stats.total} kho bãi
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý hệ thống kho bảo quản vật tư nông nghiệp, phân bón, giống và nông sản thành phẩm
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Ngữ cảnh Trang trại: Dropdown chọn Farm */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Trang trại:</span>
            <select
              value={selectedFarmId}
              onChange={handleFarmChange}
              disabled={isLoadingFarms || farms.length === 0}
              className="text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>

          {/* Ẩn nút Thêm kho nếu người dùng không có quyền quản lý kho */}
          <Can
            role={['ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN']}
            permission="PERM_FARM_UPDATE"
            farmId={selectedFarmId}
          >
            <Button onClick={handleOpenCreate} disabled={!selectedFarmId} className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Thêm kho bãi
            </Button>
          </Can>
        </div>
      </div>

      {/* 2. Thẻ KPI Tổng quan theo Farm */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số kho</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <Boxes className="w-5 h-5 text-slate-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kho lạnh</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-cyan-600">{stats.cold}</span>
            <Snowflake className="w-5 h-5 text-cyan-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kho vật tư</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-amber-600">{stats.raw}</span>
            <Package className="w-5 h-5 text-amber-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng sức chứa</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-indigo-600">
              {stats.totalCapacity} <span className="text-sm font-semibold text-slate-500">m³</span>
            </span>
            <Maximize2 className="w-5 h-5 text-indigo-400" />
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
            placeholder="Tìm theo tên kho bãi, mã kho, vị trí trong trang trại..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Lọc theo loại kho */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
          >
            <option value="ALL">Tất cả loại kho</option>
            <option value="RAW_MATERIAL">Kho vật tư thô</option>
            <option value="FINISHED_GOODS">Kho thành phẩm</option>
            <option value="COLD_STORAGE">Kho lạnh bảo quản</option>
            <option value="GENERAL">Kho tổng hợp</option>
          </select>

          {/* Lọc theo trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Vô hiệu hóa</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchWarehouses}
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
          <p className="text-sm font-medium text-slate-600 mt-4">
            Đang tải dữ liệu kho bãi của trang trại "{activeFarm?.name}"...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Không thể tải dữ liệu kho bãi</h3>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchWarehouses} className="mt-4">
            Thử lại
          </Button>
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Chưa có kho bãi nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Không tìm thấy kho bãi nào khớp với bộ lọc tìm kiếm.'
              : `Trang trại "${activeFarm?.name || ''}" hiện chưa được cấu hình kho bãi nào.`}
          </p>
          <Can
            role={['ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN']}
            permission="PERM_FARM_UPDATE"
            farmId={selectedFarmId}
          >
            <Button size="sm" onClick={handleOpenCreate} className="mt-4">
              <Plus className="w-4 h-4 mr-1.5" /> Thêm kho bãi đầu tiên
            </Button>
          </Can>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã & Tên kho bãi</th>
                  <th className="py-3.5 px-4">Phân loại</th>
                  <th className="py-3.5 px-4">Sức chứa & Diện tích</th>
                  <th className="py-3.5 px-4">Nhiệt độ / Độ ẩm</th>
                  <th className="py-3.5 px-4">Vị trí trong trang trại</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWarehouses.map((w) => {
                  const isActive = w.status === 'ACTIVE';

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{w.name}</div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">{w.code}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">{renderTypeBadge(w.warehouseType)}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">
                          {w.capacityM3 ? `${w.capacityM3} m³` : '—'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {w.areaM2 ? `${w.areaM2} m²` : 'Chưa định diện tích'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                          <span>{w.standardTemperature != null ? `${w.standardTemperature}°C` : 'Môi trường'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Droplets className="w-3.5 h-3.5 text-sky-500" />
                          <span>{w.standardHumidity != null ? `${w.standardHumidity}%` : 'Tự nhiên'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-700 truncate" title={w.address}>
                          {w.address ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {w.address}
                            </span>
                          ) : (
                            '—'
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Vô hiệu hóa
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ẩn nút Sửa kho nếu không có quyền */}
                          <Can
                            role={['ROLE_FARM_OWNER', 'ROLE_TENANT_ADMIN']}
                            permission="PERM_FARM_UPDATE"
                            farmId={selectedFarmId}
                          >
                            <button
                              onClick={() => handleOpenEdit(w)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Sửa thông tin kho"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {isActive && (
                              <button
                                onClick={() => handleOpenDeactivate(w)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Vô hiệu hóa kho"
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
      <WarehouseFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        farmId={selectedFarmId}
        farmName={activeFarm?.name}
        warehouse={selectedWarehouse}
        onSuccess={fetchWarehouses}
      />

      {/* Confirm Dialog Vô hiệu hóa kho */}
      <ConfirmDialog
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={handleConfirmDeactivate}
        isLoading={isSubmittingAction}
        title="Xác nhận vô hiệu hóa kho bãi"
        message={`Bạn có chắc chắn muốn vô hiệu hóa kho bãi "${warehouseToDeactivate?.name}" (${warehouseToDeactivate?.code}) không? Trạng thái kho sẽ chuyển thành INACTIVE.`}
        confirmText="Vô hiệu hóa"
        variant="danger"
      />
    </div>
  );
};

export default WarehouseListPage;
