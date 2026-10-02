import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sprout,
  Plus,
  Search,
  Filter,
  MapPin,
  Layers,
  UserCheck,
  ArrowRight,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { farmService } from '../services/farmService';
import { useAuthStore } from '../stores/useAuthStore';
import { useFarmStore } from '../stores/useFarmStore';
import { toast } from 'sonner';

const farmSchema = z.object({
  code: z.string().min(2, 'Mã trang trại tối thiểu 2 ký tự').max(50),
  name: z.string().min(2, 'Tên trang trại tối thiểu 2 ký tự').max(255),
  farmType: z.enum(['TRONG_TROT', 'CHAN_NUOI', 'HON_HOP']),
  totalAreaM2: z.coerce.number().positive('Diện tích phải lớn hơn 0'),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  address: z.string().min(3, 'Địa chỉ tối thiểu 3 ký tự').max(500),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
});

export const FarmsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);
  const canManage = hasAnyRole(['ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER']);
  const isSuperAdmin = hasAnyRole(['ROLE_SUPER_ADMIN']);

  const currentFarm = useFarmStore((state) => state.currentFarm);
  const setCurrentFarm = useFarmStore((state) => state.setCurrentFarm);

  // Filters State
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [farmTypeFilter, setFarmTypeFilter] = useState('');
  const [page, setPage] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      code: '',
      name: '',
      farmType: 'TRONG_TROT',
      totalAreaM2: 10000,
      latitude: 20.8527,
      longitude: 104.6369,
      address: '',
      status: 'ACTIVE',
    },
  });

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['farms-list', keyword, statusFilter, farmTypeFilter, page],
    queryFn: () =>
      farmService.getFarms({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        farmType: farmTypeFilter || undefined,
        page,
        size: 9,
      }),
  });

  const farms = pageData?.items || [];

  const createMutation = useMutation({
    mutationFn: farmService.createFarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-accessible-farms'] });
      toast.success('Tạo mới trang trại thành công!');
      closeModal();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi tạo trang trại.';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => farmService.updateFarm(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['farms-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-accessible-farms'] });
      if (currentFarm?.id === updated.id) {
        setCurrentFarm(updated);
      }
      toast.success('Cập nhật trang trại thành công!');
      closeModal();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trang trại.';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: farmService.deleteFarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-accessible-farms'] });
      toast.success('Đã xóa trang trại.');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi xóa trang trại.';
      toast.error(msg);
    },
  });

  const openCreateModal = () => {
    setEditingFarm(null);
    reset({
      code: '',
      name: '',
      farmType: 'TRONG_TROT',
      totalAreaM2: 10000,
      latitude: 20.8527,
      longitude: 104.6369,
      address: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (farm, e) => {
    e.stopPropagation();
    setEditingFarm(farm);
    reset({
      code: farm.code,
      name: farm.name,
      farmType: farm.farmType,
      totalAreaM2: Number(farm.totalAreaM2),
      latitude: farm.latitude ? Number(farm.latitude) : null,
      longitude: farm.longitude ? Number(farm.longitude) : null,
      address: farm.address,
      status: farm.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFarm(null);
  };

  const onSubmit = (data) => {
    if (editingFarm) {
      updateMutation.mutate({ id: editingFarm.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (farm, e) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa trang trại "${farm.name}"? Dữ liệu phân khu liên quan sẽ bị ảnh hưởng.`)) {
      deleteMutation.mutate(farm.id);
    }
  };

  const handleSelectAsActive = (farm, e) => {
    e.stopPropagation();
    setCurrentFarm(farm);
    toast.success(`Đã kích hoạt trang trại làm việc: ${farm.name}`);
  };

  const getFarmTypeInfo = (type) => {
    switch (type) {
      case 'TRONG_TROT':
        return {
          label: 'Trồng trọt',
          color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800',
        };
      case 'CHAN_NUOI':
        return {
          label: 'Chăn nuôi',
          color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800',
        };
      default:
        return {
          label: 'Hỗn hợp',
          color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/80 dark:border-blue-800',
        };
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Đang hoạt động', badge: 'bg-emerald-500' };
      case 'MAINTENANCE':
        return { label: 'Đang bảo trì/cải tạo', badge: 'bg-amber-500' };
      default:
        return { label: 'Tạm ngưng', badge: 'bg-slate-400' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sprout className="w-6 h-6 text-primary-600" />
            <span>Quản lý Cơ sở Trang trại</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cấu hình danh mục cơ sở, phân loại loại hình sản xuất, diện tích và tọa độ định vị GPS.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold shadow-sm shadow-primary-600/20 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Trang trại</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên hoặc mã trang trại..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-xs transition-all min-h-[44px]"
          />
        </div>

        {/* Filter Farm Type */}
        <div className="w-full md:w-48">
          <select
            value={farmTypeFilter}
            onChange={(e) => setFarmTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 text-xs outline-none min-h-[44px]"
          >
            <option value="">Tất cả loại hình</option>
            <option value="TRONG_TROT">Trồng trọt</option>
            <option value="CHAN_NUOI">Chăn nuôi</option>
            <option value="HON_HOP">Hỗn hợp</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 text-xs outline-none min-h-[44px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="MAINTENANCE">Đang bảo trì</option>
            <option value="INACTIVE">Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Farm Card Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : farms.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <Sprout className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Không tìm thấy trang trại nào
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Chưa có cơ sở nào phù hợp với bộ lọc hoặc tổ chức chưa được cấu hình trang trại.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {farms.map((farm) => {
            const isCurrent = currentFarm?.id === farm.id;
            const typeInfo = getFarmTypeInfo(farm.farmType);
            const statusInfo = getStatusInfo(farm.status);

            return (
              <div
                key={farm.id}
                onClick={() => navigate(`/farms/${farm.id}`)}
                className={`group relative rounded-3xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-lg ${
                  isCurrent
                    ? 'bg-gradient-to-b from-primary-50/40 to-white dark:from-primary-950/20 dark:to-slate-900 border-primary-500/50 shadow-md ring-1 ring-primary-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Header Card */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Sprout className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-primary-600 dark:text-primary-400">
                            {farm.code}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${statusInfo.badge}`} title={statusInfo.label} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                          {farm.name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeInfo.color}`}
                    >
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* Body Specs */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Phân khu sản xuất:</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {farm.zoneCount} khu vực
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Tổng diện tích:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {Number(farm.totalAreaM2).toLocaleString('vi-VN')} m²
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({(Number(farm.totalAreaM2) / 10000).toFixed(2)} ha)
                        </span>
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="truncate line-clamp-1">{farm.address}</span>
                    </div>

                    {farm.managerName && (
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Trưởng trại: <strong className="text-slate-700 dark:text-slate-300">{farm.managerName}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đang hoạt động</span>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleSelectAsActive(farm, e)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-300 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Chọn làm việc
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {canManage && (
                      <button
                        onClick={(e) => openEditModal(farm, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Chỉnh sửa trang trại"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button
                        onClick={(e) => handleDelete(farm, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Xóa trang trại"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className="text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 flex items-center gap-0.5 text-xs font-semibold pl-1">
                      <span>Xem</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={!pageData.hasPrevious}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40"
          >
            Trang trước
          </button>
          <span className="text-xs text-slate-500">
            Trang {pageData.page} / {pageData.totalPages}
          </span>
          <button
            disabled={!pageData.hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40"
          >
            Trang sau
          </button>
        </div>
      )}

      {/* Modal Tạo Mới / Chỉnh Sửa Trang Trại */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sprout className="w-5 h-5 text-primary-600" />
                <span>{editingFarm ? 'Chỉnh sửa Trang trại' : 'Thêm Trang trại Mới'}</span>
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mã trang trại */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã trang trại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!!editingFarm}
                    {...register('code')}
                    placeholder="VD: FARM-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono uppercase"
                  />
                  {errors.code && <p className="text-red-500 mt-1">{errors.code.message}</p>}
                </div>

                {/* Tên trang trại */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên trang trại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="VD: Trang trại Dưa lưới Mộc Châu 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                  {errors.name && <p className="text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                {/* Loại hình */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Loại hình sản xuất <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('farmType')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  >
                    <option value="TRONG_TROT">Trồng trọt</option>
                    <option value="CHAN_NUOI">Chăn nuôi</option>
                    <option value="HON_HOP">Hỗn hợp (Trồng trọt & Chăn nuôi)</option>
                  </select>
                </div>

                {/* Tổng diện tích */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tổng diện tích (m²) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('totalAreaM2')}
                    placeholder="VD: 25000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono"
                  />
                  {errors.totalAreaM2 && (
                    <p className="text-red-500 mt-1">{errors.totalAreaM2.message}</p>
                  )}
                </div>

                {/* Tọa độ Vĩ độ GPS */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vĩ độ GPS (Latitude)
                  </label>
                  <input
                    type="number"
                    step="0.0000001"
                    {...register('latitude')}
                    placeholder="VD: 20.8527123"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono"
                  />
                </div>

                {/* Tọa độ Kinh độ GPS */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kinh độ GPS (Longitude)
                  </label>
                  <input
                    type="number"
                    step="0.0000001"
                    {...register('longitude')}
                    placeholder="VD: 104.6369123"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono"
                  />
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trạng thái hoạt động
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  >
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="MAINTENANCE">Đang bảo trì/cải tạo</option>
                    <option value="INACTIVE">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ thực địa của trang trại <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  {...register('address')}
                  placeholder="VD: Tiểu khu Bản Ôn, Xã Vân Hồ, Huyện Vân Hồ, Sơn La"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none resize-none"
                />
                {errors.address && <p className="text-red-500 mt-1">{errors.address.message}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold shadow-sm shadow-primary-600/20 min-h-[44px]"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Đang xử lý...'
                    : editingFarm
                    ? 'Cập nhật trang trại'
                    : 'Tạo trang trại mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
