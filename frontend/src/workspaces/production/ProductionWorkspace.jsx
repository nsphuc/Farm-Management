import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Wheat,
  Beef,
  UserCheck,
  CheckCircle2,
  Clock,
  History,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Users,
  Compass,
  Edit,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Can } from '../../permissions/Can';
import { farmApi } from '../../services/farmApi';
import { assignmentApi } from '../../services/assignmentApi';
import { employeeApi } from '../../services/employeeApi';
import { FarmFormModal } from '../../pages/organization/farms/FarmFormModal';
import { AssignmentFormModal } from '../../pages/organization/assignments/AssignmentFormModal';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { toast } from '../../store/ui/useToastStore';

/**
 * WORKSPACE A: KHÔNG GIAN SẢN XUẤT & QUẢN LÝ HIỆN TRƯỜNG (Master-Detail UI)
 * Mã Workspace: WS-PRODUCTION-GEOGRAPHY
 * Hợp nhất:
 * - Module 1.2: Quản lý Trang trại & Phân khu (farms, production_zones)
 * - Module 1.4: Phân công Quản lý Hiện trường (farm_assignments)
 * 
 * Kiến trúc Split-Screen:
 * - Cột trái (Master): Cây/Danh sách mặt bằng trang trại & phân khu
 * - Cột phải (Detail): Thông tin chi tiết & Bàn phân công nhân sự tại chỗ theo ngữ cảnh trang trại đang chọn
 */
export const ProductionWorkspace = () => {
  const navigate = useNavigate();

  // ==========================================
  // STATE MASTER PANE (TRANG TRẠI - MODULE 1.2)
  // ==========================================
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);
  const [farmError, setFarmError] = useState(null);

  // Bộ lọc trang trại
  const [farmSearch, setFarmSearch] = useState('');
  const [farmTypeFilter, setFarmTypeFilter] = useState('ALL');
  const [farmStatusFilter, setFarmStatusFilter] = useState('ALL');

  // Modal Thêm/Sửa Trang trại
  const [isFarmFormOpen, setIsFarmFormOpen] = useState(false);
  const [farmToEdit, setFarmToEdit] = useState(null);

  // Modal Xóa Trang trại
  const [isDeleteFarmOpen, setIsDeleteFarmOpen] = useState(false);
  const [farmToDelete, setFarmToDelete] = useState(null);
  const [isDeletingFarm, setIsDeletingFarm] = useState(false);

  // ==========================================
  // STATE DETAIL PANE (PHÂN CÔNG - MODULE 1.4)
  // ==========================================
  const [assignmentTab, setAssignmentTab] = useState('FARM'); // 'FARM' | 'ZONE' | 'HISTORY'
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [assignmentError, setAssignmentError] = useState(null);
  const [assignmentSearch, setAssignmentSearch] = useState('');

  // Modal Phân công nhân sự
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [isCancelAssignmentOpen, setIsCancelAssignmentOpen] = useState(false);
  const [assignmentToCancel, setAssignmentToCancel] = useState(null);
  const [isCancellingAssignment, setIsCancellingAssignment] = useState(false);

  // ==========================================
  // FETCH DỮ LIỆU
  // ==========================================
  const fetchFarms = useCallback(async () => {
    setIsLoadingFarms(true);
    setFarmError(null);
    try {
      const res = await farmApi.getAllFarms();
      const farmList = res.data || [];
      setFarms(farmList);

      // Tự động chọn trang trại đầu tiên nếu chưa có trang trại nào được chọn
      setSelectedFarm((prev) => {
        if (!prev && farmList.length > 0) return farmList[0];
        if (prev) {
          const updated = farmList.find((f) => f.id === prev.id);
          return updated || farmList[0] || null;
        }
        return null;
      });
    } catch (err) {
      console.error('Lỗi khi tải danh sách trang trại:', err);
      setFarmError(err.response?.data?.message || 'Không thể tải danh sách trang trại.');
    } finally {
      setIsLoadingFarms(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeeApi.getEmployees({ size: 100 });
      const data = res.data?.content ? res.data.content : (Array.isArray(res.data) ? res.data : []);
      setEmployees(data);
    } catch (err) {
      console.warn('Lỗi khi tải nhân viên:', err);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    setIsLoadingAssignments(true);
    setAssignmentError(null);
    try {
      let data = [];
      if (selectedFarm?.id) {
        if (assignmentTab === 'HISTORY') {
          const res = await assignmentApi.getAssignmentHistory(selectedFarm.id);
          data = res.data || [];
        } else {
          const res = await assignmentApi.getActiveAssignments(selectedFarm.id);
          data = res.data || [];
        }
      } else {
        // Nếu chưa chọn farm cụ thể, lấy toàn bộ
        const res = await assignmentApi.getAllAssignments({ size: 100 });
        data = res.data?.content ? res.data.content : (Array.isArray(res.data) ? res.data : []);
      }
      setAssignments(data);
    } catch (err) {
      console.error('Lỗi khi tải phân công:', err);
      setAssignmentError(err.response?.data?.message || 'Không thể tải dữ liệu phân công.');
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [selectedFarm, assignmentTab]);

  useEffect(() => {
    fetchFarms();
    fetchEmployees();
  }, [fetchFarms, fetchEmployees]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Lọc Trang trại
  const filteredFarms = useMemo(() => {
    return farms.filter((f) => {
      const matchSearch =
        !farmSearch.trim() ||
        f.name?.toLowerCase().includes(farmSearch.toLowerCase()) ||
        f.code?.toLowerCase().includes(farmSearch.toLowerCase()) ||
        f.address?.toLowerCase().includes(farmSearch.toLowerCase());
      const matchType = farmTypeFilter === 'ALL' || f.farmType === farmTypeFilter;
      const matchStatus = farmStatusFilter === 'ALL' || f.status === farmStatusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [farms, farmSearch, farmTypeFilter, farmStatusFilter]);

  // Lọc Phân công theo Tab & Search
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // 1. Phân loại theo tab
      if (assignmentTab === 'FARM') {
        if (item.zoneId || !item.isActive) return false;
      } else if (assignmentTab === 'ZONE') {
        if (!item.zoneId || !item.isActive) return false;
      } else if (assignmentTab === 'HISTORY') {
        if (item.isActive) return false;
      }

      // 2. Tìm kiếm
      if (assignmentSearch.trim()) {
        const q = assignmentSearch.toLowerCase();
        const matchName = item.employeeName?.toLowerCase().includes(q);
        const matchCode = item.employeeCode?.toLowerCase().includes(q);
        const matchRole = item.role?.toLowerCase().includes(q);
        const matchZone = item.zoneName?.toLowerCase().includes(q);
        return matchName || matchCode || matchRole || matchZone;
      }
      return true;
    });
  }, [assignments, assignmentTab, assignmentSearch]);

  // Xóa / Vô hiệu hóa Trang trại
  const handleConfirmDeleteFarm = async () => {
    if (!farmToDelete) return;
    setIsDeletingFarm(true);
    try {
      await farmApi.deleteFarm(farmToDelete.id);
      toast.success(`Đã vô hiệu hóa trang trại "${farmToDelete.name}" thành công`);
      setIsDeleteFarmOpen(false);
      setFarmToDelete(null);
      fetchFarms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vô hiệu hóa trang trại thất bại');
    } finally {
      setIsDeletingFarm(false);
    }
  };

  // Hủy Phân công nhân sự
  const handleConfirmCancelAssignment = async () => {
    if (!assignmentToCancel) return;
    setIsCancellingAssignment(true);
    try {
      await assignmentApi.cancelAssignment(assignmentToCancel.id);
      toast.success('Đã hủy phân công công tác thành công');
      setIsCancelAssignmentOpen(false);
      setAssignmentToCancel(null);
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hủy phân công thất bại');
    } finally {
      setIsCancellingAssignment(false);
    }
  };

  // Helper render Badge loại hình
  const renderTypeBadge = (type) => {
    switch (type) {
      case 'CROP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Wheat className="w-3 h-3" /> Trồng trọt
          </span>
        );
      case 'LIVESTOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Beef className="w-3 h-3" /> Chăn nuôi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Hỗn hợp
          </span>
        );
    }
  };

  // Helper render Role Phân công
  const renderRoleBadge = (role) => {
    const roleMap = {
      FARM_MANAGER: { label: 'Giám đốc Trang trại', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      DEPUTY_MANAGER: { label: 'Phó giám đốc', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      CONSULTANT: { label: 'Cố vấn Kỹ thuật', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      ZONE_MANAGER: { label: 'Trưởng Phân khu', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      TECHNICAL_LEAD: { label: 'Kỹ thuật viên trưởng', color: 'bg-teal-50 text-teal-700 border-teal-200' },
      FIELD_WORKER: { label: 'Công nhân hiện trường', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    };
    const conf = roleMap[role] || { label: role, color: 'bg-slate-100 text-slate-600 border-slate-200' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${conf.color}`}>
        {conf.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề Workspace & Thao tác chính */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              WORKSPACE A
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Không Gian Sản Xuất & Bố Trí Hiện Trường
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Giao diện Master-Detail hợp nhất Quản trị Mặt bằng (1.2) và Phân công Quản lý Hiện trường (1.4).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchFarms();
              fetchAssignments();
            }}
            disabled={isLoadingFarms || isLoadingAssignments}
            className="gap-1.5 bg-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${(isLoadingFarms || isLoadingAssignments) ? 'animate-spin' : ''}`} />
            <span>Đồng bộ</span>
          </Button>

          <Can permission="PERM_FARM_CREATE">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFarmToEdit(null);
                setIsFarmFormOpen(true);
              }}
              className="gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Trang Trại</span>
            </Button>
          </Can>
        </div>
      </div>

      {/* 2. BỐ CỤC MASTER-DETAIL (SPLIT-SCREEN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ============================================================== */}
        {/* CỘT TRÁI (MASTER PANE): CÂY & DANH SÁCH MẶT BẰNG TRANG TRẠI    */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-slate-800 text-sm">Danh Mục Trang Trại</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {farms.length}
                </span>
              </div>
            </div>

            {/* Tìm kiếm & Lọc nhanh */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, mã, địa chỉ..."
                  value={farmSearch}
                  onChange={(e) => setFarmSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={farmTypeFilter}
                  onChange={(e) => setFarmTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Tất cả loại hình</option>
                  <option value="CROP">Trồng trọt</option>
                  <option value="LIVESTOCK">Chăn nuôi</option>
                  <option value="MIXED">Hỗn hợp</option>
                </select>

                <select
                  value={farmStatusFilter}
                  onChange={(e) => setFarmStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danh sách các card Trang trại */}
          <div className="divide-y divide-slate-100 max-h-[calc(100vh-22rem)] overflow-y-auto p-2 space-y-2">
            {isLoadingFarms && (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                Đang tải dữ liệu mặt bằng...
              </div>
            )}

            {!isLoadingFarms && farmError && (
              <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl m-2 border border-rose-200">
                {farmError}
              </div>
            )}

            {!isLoadingFarms && !farmError && filteredFarms.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Không tìm thấy trang trại phù hợp.
              </div>
            )}

            {!isLoadingFarms && !farmError && filteredFarms.map((farm) => {
              const isSelected = selectedFarm?.id === farm.id;
              return (
                <div
                  key={farm.id}
                  onClick={() => setSelectedFarm(farm)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{farm.code}</span>
                        {renderTypeBadge(farm.farmType)}
                        {farm.status === 'ACTIVE' ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        )}
                      </div>
                      <h3 className={`text-sm font-bold truncate mt-1 ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {farm.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        {farm.address || 'Chưa cập nhật địa chỉ'}
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-emerald-600 translate-x-0.5' : 'text-slate-300'}`} />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      Diện tích: <span className="font-semibold text-slate-700">{Number(farm.totalAreaM2 || 0).toLocaleString()} m²</span>
                    </div>

                    {/* Quick actions trên từng card */}
                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                      <button
                        title="Xem chi tiết phân khu"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/farms/${farm.id}`);
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <Can permission="PERM_FARM_UPDATE">
                        <button
                          title="Sửa trang trại"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFarmToEdit(farm);
                            setIsFarmFormOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-amber-700 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </Can>
                      <Can permission="PERM_FARM_UPDATE">
                        <button
                          title="Vô hiệu hóa trang trại"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFarmToDelete(farm);
                            setIsDeleteFarmOpen(true);
                          }}
                          className="p-1 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Can>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CỘT PHẢI (DETAIL PANE): PHÂN CÔNG QUẢN LÝ TẠI CHỖ (MODULE 1.4) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Header Bàn phân công */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-bold text-slate-800 text-sm">Phân Công Quản Lý Hiện Trường</h2>
                </div>
                {selectedFarm ? (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đang chọn: <strong className="text-slate-800">{selectedFarm.name}</strong> ({selectedFarm.code}) — {Number(selectedFarm.totalAreaM2 || 0).toLocaleString()} m²
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">Hiển thị toàn bộ phân công của doanh nghiệp</p>
                )}
              </div>

              <Can permission={['PERM_HR_EMPLOYEE_MANAGE', 'PERM_FARM_VIEW']}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAssignmentFormOpen(true)}
                  className="gap-2 shadow-sm text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gán Quản Lý</span>
                </Button>
              </Can>
            </div>

            {/* Tab chuyển đổi phân công */}
            <div className="flex items-center gap-2 mt-4 border-b border-slate-200 -mb-4 pb-2">
              <button
                onClick={() => setAssignmentTab('FARM')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  assignmentTab === 'FARM'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                1.4.1. Gán Trang Trại
              </button>
              <button
                onClick={() => setAssignmentTab('ZONE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  assignmentTab === 'ZONE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                1.4.2. Gán Phân Khu
              </button>
              <button
                onClick={() => setAssignmentTab('HISTORY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  assignmentTab === 'HISTORY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                1.4.5. Lịch Sử Phân Công
              </button>
            </div>
          </div>

          {/* Thanh tìm kiếm phân công */}
          <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm nhân sự, mã nhân viên, chức danh..."
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              {filteredAssignments.length} nhân sự
            </span>
          </div>

          {/* Bảng Danh sách Phân công */}
          <div className="overflow-x-auto min-h-[300px]">
            {isLoadingAssignments ? (
              <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                Đang tải dữ liệu phân công...
              </div>
            ) : assignmentError ? (
              <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 m-4 rounded-xl border border-rose-200">
                {assignmentError}
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Chưa có nhân sự nào được phân công trong mục này.</p>
                <Can permission={['PERM_HR_EMPLOYEE_MANAGE', 'PERM_FARM_VIEW']}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAssignmentFormOpen(true)}
                    className="mt-2 text-xs"
                  >
                    Thực hiện phân công ngay
                  </Button>
                </Can>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Nhân Sự</th>
                    <th className="py-2.5 px-3">Vai Trò Đảm Nhiệm</th>
                    {assignmentTab === 'ZONE' && <th className="py-2.5 px-3">Phân Khu</th>}
                    <th className="py-2.5 px-3">Thời Gian Công Tác</th>
                    <th className="py-2.5 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAssignments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.employeeName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.employeeCode}</div>
                      </td>
                      <td className="py-3 px-3">
                        {renderRoleBadge(item.role)}
                      </td>
                      {assignmentTab === 'ZONE' && (
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800">{item.zoneName || 'Lô hiện trường'}</span>
                        </td>
                      )}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[11px] text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.assignedFrom || 'Bắt đầu'}</span>
                          <span>→</span>
                          <span>{item.assignedTo || 'Hiện tại'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {item.isActive && (
                          <Can permission={['PERM_HR_EMPLOYEE_MANAGE', 'PERM_FARM_VIEW']}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAssignmentToCancel(item);
                                setIsCancelAssignmentOpen(true);
                              }}
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-[11px] py-1 px-2"
                            >
                              Hủy gán
                            </Button>
                          </Can>
                        )}
                        {!item.isActive && (
                          <span className="text-[11px] text-slate-400 font-medium">Đã kết thúc</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* MODAL THÊM / SỬA TRANG TRẠI */}
      <FarmFormModal
        isOpen={isFarmFormOpen}
        farm={farmToEdit}
        onClose={() => {
          setIsFarmFormOpen(false);
          setFarmToEdit(null);
        }}
        onSuccess={() => {
          setIsFarmFormOpen(false);
          setFarmToEdit(null);
          fetchFarms();
        }}
      />

      {/* CONFIRM DIALOG XÓA TRANG TRẠI */}
      <ConfirmDialog
        isOpen={isDeleteFarmOpen}
        title="Vô hiệu hóa trang trại"
        message={`Bạn có chắc chắn muốn ngừng hoạt động trang trại "${farmToDelete?.name}"? Các phân khu và dữ liệu vận hành liên quan sẽ bị chuyển trạng thái tạm khóa.`}
        confirmText="Xác nhận vô hiệu hóa"
        confirmVariant="danger"
        isLoading={isDeletingFarm}
        onClose={() => {
          setIsDeleteFarmOpen(false);
          setFarmToDelete(null);
        }}
        onConfirm={handleConfirmDeleteFarm}
      />

      {/* MODAL PHÂN CÔNG NHÂN SỰ */}
      <AssignmentFormModal
        isOpen={isAssignmentFormOpen}
        onClose={() => setIsAssignmentFormOpen(false)}
        onSuccess={() => {
          setIsAssignmentFormOpen(false);
          fetchAssignments();
        }}
        farms={farms}
        employees={employees}
        defaultType={assignmentTab === 'ZONE' ? 'ZONE' : 'FARM'}
        initialFarmId={selectedFarm?.id ? String(selectedFarm.id) : ''}
      />

      {/* CONFIRM DIALOG HỦY PHÂN CÔNG */}
      <ConfirmDialog
        isOpen={isCancelAssignmentOpen}
        title="Xác nhận hủy phân công"
        message={`Bạn có chắc chắn muốn kết thúc quyền quản lý của nhân viên "${assignmentToCancel?.employeeName}"?`}
        confirmText="Hủy phân công"
        confirmVariant="danger"
        isLoading={isCancellingAssignment}
        onClose={() => {
          setIsCancelAssignmentOpen(false);
          setAssignmentToCancel(null);
        }}
        onConfirm={handleConfirmCancelAssignment}
      />
    </div>
  );
};

export default ProductionWorkspace;
