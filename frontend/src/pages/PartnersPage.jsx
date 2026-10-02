import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Handshake,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Building,
  Truck,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { partnerService } from '../services/partnerService';
import { useAuthStore } from '../stores/useAuthStore';
import { toast } from 'sonner';

const partnerSchema = z.object({
  code: z.string().min(2, 'Mã đối tác tối thiểu 2 ký tự').max(50),
  name: z.string().min(2, 'Tên đối tác tối thiểu 2 ký tự').max(255),
  partnerType: z.enum(['SUPPLIER', 'DISTRIBUTOR', 'TRANSPORTER']),
  taxCode: z.string().optional().or(z.literal('')),
  contactPerson: z.string().optional().or(z.literal('')),
  phone: z.string().min(8, 'Số điện thoại tối thiểu 8 ký tự').max(20),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  bankAccountInfo: z.string().optional().or(z.literal('')),
  creditRating: z.enum(['A', 'B', 'C', 'D']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  notes: z.string().optional().or(z.literal('')),
});

export const PartnersPage = () => {
  const queryClient = useQueryClient();
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);
  const canManage = hasAnyRole(['ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER']);

  // Filters State
  const [keyword, setKeyword] = useState('');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('');
  const [creditRatingFilter, setCreditRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      code: '',
      name: '',
      partnerType: 'SUPPLIER',
      taxCode: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      bankAccountInfo: '',
      creditRating: 'A',
      status: 'ACTIVE',
      notes: '',
    },
  });

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['partners-list', keyword, partnerTypeFilter, creditRatingFilter, statusFilter, page],
    queryFn: () =>
      partnerService.getPartners({
        keyword: keyword || undefined,
        partnerType: partnerTypeFilter || undefined,
        creditRating: creditRatingFilter || undefined,
        status: statusFilter || undefined,
        page,
        size: 10,
      }),
  });

  const partners = pageData?.items || [];

  const createMutation = useMutation({
    mutationFn: partnerService.createPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners-list'] });
      toast.success('Thêm đối tác thành công!');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => partnerService.updatePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners-list'] });
      toast.success('Cập nhật đối tác thành công!');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra.'),
  });

  const deleteMutation = useMutation({
    mutationFn: partnerService.deletePartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners-list'] });
      toast.success('Đã xóa đối tác.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra.'),
  });

  const openCreateModal = () => {
    setEditingPartner(null);
    reset({
      code: '',
      name: '',
      partnerType: 'SUPPLIER',
      taxCode: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      bankAccountInfo: '',
      creditRating: 'A',
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    reset({
      code: partner.code,
      name: partner.name,
      partnerType: partner.partnerType,
      taxCode: partner.taxCode || '',
      contactPerson: partner.contactPerson || '',
      phone: partner.phone,
      email: partner.email || '',
      address: partner.address || '',
      bankAccountInfo: partner.bankAccountInfo || '',
      creditRating: partner.creditRating,
      status: partner.status,
      notes: partner.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
  };

  const onSubmit = (data) => {
    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getPartnerTypeInfo = (type) => {
    switch (type) {
      case 'SUPPLIER':
        return {
          label: 'Nhà cung cấp',
          icon: ShoppingCart,
          color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200',
        };
      case 'DISTRIBUTOR':
        return {
          label: 'Đại lý thu mua',
          icon: Building,
          color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200',
        };
      default:
        return {
          label: 'Vận chuyển',
          icon: Truck,
          color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200',
        };
    }
  };

  const getCreditBadge = (rating) => {
    switch (rating) {
      case 'A':
        return { label: 'Hạng A (Rất uy tín)', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' };
      case 'B':
        return { label: 'Hạng B (Tốt)', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' };
      case 'C':
        return { label: 'Hạng C (Trung bình)', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' };
      default:
        return { label: 'Hạng D (Rủi ro)', color: 'text-red-600 bg-red-50 dark:bg-red-950/40' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Handshake className="w-6 h-6 text-primary-600" />
            <span>Quản lý Đối tác & Chuỗi Cung Ứng</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Danh bạ nhà cung cấp giống/vật tư, đại lý phân phối thu mua và đơn vị logistics vận chuyển.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm shadow-primary-600/20 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Đối tác</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, mã hoặc số điện thoại đối tác..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs outline-none min-h-[44px]"
          />
        </div>

        <div className="w-full md:w-44">
          <select
            value={partnerTypeFilter}
            onChange={(e) => setPartnerTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs outline-none min-h-[44px]"
          >
            <option value="">Tất cả phân loại</option>
            <option value="SUPPLIER">Nhà cung cấp</option>
            <option value="DISTRIBUTOR">Đại lý thu mua</option>
            <option value="TRANSPORTER">Đơn vị vận chuyển</option>
          </select>
        </div>

        <div className="w-full md:w-40">
          <select
            value={creditRatingFilter}
            onChange={(e) => setCreditRatingFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs outline-none min-h-[44px]"
          >
            <option value="">Tất cả xếp hạng</option>
            <option value="A">Hạng A (Rất uy tín)</option>
            <option value="B">Hạng B (Tốt)</option>
            <option value="C">Hạng C (Trung bình)</option>
            <option value="D">Hạng D (Rủi ro)</option>
          </select>
        </div>

        <div className="w-full md:w-36">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs outline-none min-h-[44px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hợp tác</option>
            <option value="INACTIVE">Tạm dừng</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : partners.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Không tìm thấy đối tác nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Đối tác</th>
                  <th className="py-3.5 px-4">Phân loại</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Địa chỉ / Mã số thuế</th>
                  <th className="py-3.5 px-4">Xếp hạng uy tín</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {partners.map((partner) => {
                  const typeInfo = getPartnerTypeInfo(partner.partnerType);
                  const TypeIcon = typeInfo.icon;
                  const credit = getCreditBadge(partner.creditRating);

                  return (
                    <tr
                      key={partner.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {partner.name}
                            </div>
                            <div className="font-mono text-[10px] text-primary-600">
                              {partner.code}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{partner.phone}</span>
                        </div>
                        {partner.contactPerson && (
                          <div className="text-[11px] text-slate-400">
                            Người LH: {partner.contactPerson}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 space-y-0.5">
                        {partner.address && (
                          <div className="truncate max-w-[200px]" title={partner.address}>
                            {partner.address}
                          </div>
                        )}
                        {partner.taxCode && (
                          <div className="font-mono text-[10px] text-slate-400">
                            MST: {partner.taxCode}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${credit.color}`}>
                          {credit.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {partner.status === 'ACTIVE' ? (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            Đang hợp tác
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            Tạm dừng
                          </span>
                        )}
                      </td>

                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(partner)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Xóa đối tác "${partner.name}"?`)) {
                                  deleteMutation.mutate(partner.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pageData && pageData.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
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
      </div>

      {/* Modal Thêm Mới / Sửa Đối Tác */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Handshake className="w-4 h-4 text-primary-600" />
                <span>{editingPartner ? 'Chỉnh sửa Đối tác' : 'Thêm Đối tác Mới'}</span>
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã đối tác <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('code')}
                    placeholder="VD: NCC-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono uppercase"
                  />
                  {errors.code && <p className="text-red-500 mt-1">{errors.code.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên đối tác / Công ty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="VD: Công ty Cổ phần Giống cây trồng TW"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                  {errors.name && <p className="text-red-500 mt-1">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phân loại đối tác
                  </label>
                  <select
                    {...register('partnerType')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  >
                    <option value="SUPPLIER">Nhà cung cấp giống / vật tư</option>
                    <option value="DISTRIBUTOR">Đại lý thu mua / Chuỗi siêu thị</option>
                    <option value="TRANSPORTER">Đơn vị vận chuyển logistics</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã số thuế
                  </label>
                  <input
                    type="text"
                    {...register('taxCode')}
                    placeholder="0109283748"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('phone')}
                    placeholder="0988 123 456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                  {errors.phone && <p className="text-red-500 mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Người liên hệ
                  </label>
                  <input
                    type="text"
                    {...register('contactPerson')}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="contact@supplier.vn"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Xếp hạng tín dụng / Uy tín
                  </label>
                  <select
                    {...register('creditRating')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  >
                    <option value="A">Hạng A - Rất uy tín (Ưu tiên)</option>
                    <option value="B">Hạng B - Uy tín tốt</option>
                    <option value="C">Hạng C - Trung bình</option>
                    <option value="D">Hạng D - Cần giám sát chặt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="Khu Công nghiệp VSIP..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thông tin tài khoản ngân hàng
                </label>
                <input
                  type="text"
                  {...register('bankAccountInfo')}
                  placeholder="19038294829 - Techcombank CN Hà Nội"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs min-h-[44px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
                >
                  {editingPartner ? 'Cập nhật đối tác' : 'Thêm mới đối tác'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
