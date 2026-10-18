import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Building2,
  Clock,
  CheckCircle2,
  Lock,
  Edit,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Can } from '../../../permissions/Can';
import { operationalCycleApi } from '../../../services/operationalCycleApi';
import { farmApi } from '../../../services/farmApi';
import { useTenantStore } from '../../../store/tenant/useTenantStore';
import { OperationalCycleFormModal } from './OperationalCycleFormModal';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Trang Quản lý Cấu hình & Chu kỳ vận hành (Chức năng 1.5 trong Sơ đồ phân cấp).
 * Cung cấp: Quản lý mùa vụ trồng trọt (1.5.1), Quản lý lứa/đợt nuôi (1.5.2), Thiết lập năm tài chính (1.5.3).
 */
export const OperationalCyclePage = () => {
  // Lấy và lưu trang trại ngữ cảnh từ Zustand Store
  const { currentFarm, setFarm } = useTenantStore();

  // State danh sách trang trại để chọn ngữ cảnh
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);

  // State danh sách chu kỳ & trạng thái
  const [cycles, setCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // State Modal Form & Dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [cycleToClose, setCycleToClose] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // 1. Tải danh sách trang trại để thiết lập ngữ cảnh làm việc
  useEffect(() => {
    const fetchFarmsList = async () => {
      setIsLoadingFarms(true);
      try {
        const res = await farmApi.getAllFarms();
        const farmList = res.data || [];
        setFarms(farmList);

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
        toast.error('Không thể tải danh sách trang trại', 'Lỗi hệ thống');
      } finally {
        setIsLoadingFarms(false);
      }
    };

    fetchFarmsList();
  }, [currentFarm, setFarm]);

  // 2. Tải danh sách chu kỳ vận hành khi FarmId thay đổi
  const fetchCycles = useCallback(async () => {
    if (!selectedFarmId) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await operationalCycleApi.getAllCyclesByFarm(selectedFarmId);
      setCycles(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải chu kỳ vận hành:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể tải danh sách chu kỳ của trang trại này.';
      setError(msg);
      toast.error(msg, 'Lỗi tải chu kỳ');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  // Khi đổi Farm trong Dropdown
  const handleFarmChange = (e) => {
    const newFarmId = Number(e.target.value);
    setSelectedFarmId(newFarmId);
    const farmObj = farms.find((f) => f.id === newFarmId);
    if (farmObj) {
      setFarm(farmObj);
    }
  };

  // Lọc dữ liệu client-side
  const filteredCycles = useMemo(() => {
    return cycles.filter((c) => {
      const matchSearch =
        !searchTerm.trim() ||
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(c.fiscalYear).includes(searchTerm.trim());

      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [cycles, searchTerm, statusFilter]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = cycles.length;
    const planning = cycles.filter((c) => c.status === 'PLANNING').length;
    const active = cycles.filter((c) => c.status === 'ACTIVE').length;
    const closed = cycles.filter((c) => c.status === 'CLOSED').length;
    return { total, planning, active, closed };
  }, [cycles]);

  // Xử lý mở Modal Form
  const handleOpenCreate = () => {
    setSelectedCycle(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cycle) => {
    if (cycle.status === 'CLOSED') {
      toast.warning('Chu kỳ vận hành này đã đóng (CLOSED), không thể chỉnh sửa dữ liệu!', 'Đã khóa');
      return;
    }
    setSelectedCycle(cycle);
    setIsFormOpen(true);
  };

  // Xử lý đóng chu kỳ
  const handleOpenCloseCycle = (cycle) => {
    setCycleToClose(cycle);
    setIsCloseDialogOpen(true);
  };

  const handleConfirmCloseCycle = async () => {
    if (!cycleToClose || !selectedFarmId) return;
    setIsSubmittingAction(true);
    try {
      await operationalCycleApi.closeCycle(selectedFarmId, cycleToClose.id);
      toast.success(`Đã đóng chu kỳ vận hành "${cycleToClose.name}" (Khóa kỳ thành công)!`);
      setIsCloseDialogOpen(false);
      setCycleToClose(null);
      fetchCycles();
    } catch (err) {
      console.error('Lỗi khi đóng chu kỳ:', err);
      toast.error(
        err.response?.data?.message || 'Không thể đóng chu kỳ vận hành này',
        'Lỗi thao tác'
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Định dạng ngày hiển thị DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  };

  // Tính số ngày
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  };

  const activeFarm = farms.find((f) => f.id === Number(selectedFarmId));

  return (
    <div className="space-y-6">
      {/* 1. Header Trang & Bộ chọn Farm */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              1.5. Cấu hình & Chu kỳ vận hành
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              {stats.total} chu kỳ
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý mùa vụ canh tác trồng trọt, lứa đợt nuôi và thiết lập kỳ năm tài chính theo trang trại
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

          {/* Ẩn nút Thêm chu kỳ nếu không có quyền quản lý trang trại */}
          <Can
            role="ROLE_FARM_OWNER"
            permission="PERM_FARM_UPDATE"
            farmId={selectedFarmId}
          >
            <Button onClick={handleOpenCreate} disabled={!selectedFarmId} className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Tạo chu kỳ mới
            </Button>
          </Can>
        </div>
      </div>

      {/* 2. Thẻ KPI Tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng chu kỳ</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lên kế hoạch</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-amber-600">{stats.planning}</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Giai đoạn chuẩn bị (PLANNING)</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang canh tác / Nuôi</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">{stats.active}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đang hoạt động (ACTIVE)</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã kết thúc / Đóng kỳ</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-600">{stats.closed}</span>
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Khóa dữ liệu (CLOSED)</p>
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
            placeholder="Tìm theo tên vụ mùa, chu kỳ, năm tài chính..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Lọc theo trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PLANNING">Lên kế hoạch (PLANNING)</option>
            <option value="ACTIVE">Đang diễn ra (ACTIVE)</option>
            <option value="CLOSED">Đã đóng vụ (CLOSED)</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchCycles}
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
            Đang tải danh sách chu kỳ của trang trại "{activeFarm?.name}"...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Không thể tải dữ liệu chu kỳ</h3>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchCycles} className="mt-4">
            Thử lại
          </Button>
        </div>
      ) : filteredCycles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Chưa có chu kỳ vận hành nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Không tìm thấy chu kỳ vận hành nào khớp với tiêu chí tìm kiếm.'
              : `Trang trại "${activeFarm?.name || ''}" hiện chưa có vụ mùa hoặc chu kỳ vận hành nào.`}
          </p>
          <Can
            role="ROLE_FARM_OWNER"
            permission="PERM_FARM_UPDATE"
            farmId={selectedFarmId}
          >
            <Button size="sm" onClick={handleOpenCreate} className="mt-4">
              <Plus className="w-4 h-4 mr-1.5" /> Tạo chu kỳ đầu tiên
            </Button>
          </Can>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Năm tài chính & Tên chu kỳ</th>
                  <th className="py-3.5 px-4">Ngày bắt đầu</th>
                  <th className="py-3.5 px-4">Ngày kết thúc</th>
                  <th className="py-3.5 px-4">Thời lượng</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCycles.map((c) => {
                  const isClosed = c.status === 'CLOSED';
                  const isActive = c.status === 'ACTIVE';
                  const isPlanning = c.status === 'PLANNING';
                  const duration = calculateDays(c.startDate, c.endDate);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-xs font-mono text-emerald-700 font-semibold mt-0.5">
                          Năm tài chính: {c.fiscalYear}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {formatDate(c.startDate)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {formatDate(c.endDate)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {duration} ngày
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang canh tác (ACTIVE)
                          </span>
                        ) : isPlanning ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Lên kế hoạch (PLANNING)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            <Lock className="w-3 h-3 text-slate-400" /> Đã đóng (CLOSED)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ẩn nút Sửa / Đóng nếu không có quyền quản lý trang trại */}
                          <Can
                            role="ROLE_FARM_OWNER"
                            permission="PERM_FARM_UPDATE"
                            farmId={selectedFarmId}
                          >
                            <button
                              onClick={() => handleOpenEdit(c)}
                              disabled={isClosed}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isClosed
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={isClosed ? 'Chu kỳ đã đóng không thể chỉnh sửa' : 'Sửa chu kỳ vận hành'}
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {!isClosed && (
                              <button
                                onClick={() => handleOpenCloseCycle(c)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Đóng chu kỳ / Khóa sổ số liệu"
                              >
                                <Lock className="w-4 h-4" />
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

      {/* Modal Thêm mới / Cập nhật Chu kỳ */}
      <OperationalCycleFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        farmId={selectedFarmId}
        farmName={activeFarm?.name}
        cycle={selectedCycle}
        onSuccess={fetchCycles}
      />

      {/* Confirm Dialog Đóng chu kỳ */}
      <ConfirmDialog
        isOpen={isCloseDialogOpen}
        onClose={() => setIsCloseDialogOpen(false)}
        onConfirm={handleConfirmCloseCycle}
        isLoading={isSubmittingAction}
        title="Xác nhận Đóng chu kỳ vận hành"
        message={`Bạn có chắc chắn muốn đóng chu kỳ "${cycleToClose?.name}" không? Khi đã đóng, số liệu mùa vụ sẽ được khóa và không thể chỉnh sửa lại.`}
        confirmText="Đóng chu kỳ"
        variant="warning"
      />
    </div>
  );
};

export default OperationalCyclePage;
