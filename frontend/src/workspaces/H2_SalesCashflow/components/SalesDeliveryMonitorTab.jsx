import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Camera,
  Calendar,
  Building,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  AlertCircle,
  Package,
  Layers,
  X,
  XCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { financeService } from '@/services/modules/financeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatDate, formatDateTime, formatWeight } from '@/utils/formatters';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Chờ bốc xếp / Chờ xuất bến' },
  { value: 'DISPATCHED', label: 'Xe đang giao / Đã xuất bến' },
  { value: 'DELIVERED', label: 'Đã giao hàng & Có POD' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export function SalesDeliveryMonitorTab({ farmId, onOpenCreateDelivery }) {
  const { syncTrigger, notifyDataChanged } = useActiveFarmStore();

  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal POD state
  const [selectedDeliveryForPod, setSelectedDeliveryForPod] = useState(null);
  const [podFormData, setPodFormData] = useState({
    proofOfDeliveryUrl: '',
    receiverName: '',
    notes: '',
  });
  const [isSubmittingPod, setIsSubmittingPod] = useState(false);

  // Modal Detail state
  const [selectedDeliveryForDetail, setSelectedDeliveryForDetail] = useState(null);

  // Modal Image Preview state
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const loadDeliveries = async () => {
    setIsLoading(true);
    try {
      const targetFarmId = farmId && farmId !== 'ALL' ? Number(farmId) : 1;
      const data = await financeService.getSalesDeliveries(targetFarmId, { size: 100 });
      const items = data?.content || (Array.isArray(data) ? data : []);
      setDeliveries(items);
    } catch (err) {
      console.error('Failed to load sales deliveries:', err);
      // Fallback if specific farm returns empty
      setDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, [farmId, syncTrigger?.finance, syncTrigger?.partners, syncTrigger?.all]);

  // Handle Dispatch (Điều xe xuất bến)
  const handleDispatch = async (delivery) => {
    const confirmMsg = `Xác nhận điều xe xuất bến cho chuyến giao hàng [${delivery.deliveryCode}]? Chuyến hàng sẽ chuyển sang trạng thái Xe đang giao.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await financeService.dispatchSalesDelivery(delivery.farmId, delivery.id);
      toast.success(`Chuyến hàng ${delivery.deliveryCode} đã xuất bến thành công!`);
      notifyDataChanged?.('finance');
      notifyDataChanged?.('partners');
      notifyDataChanged?.('all');
      loadDeliveries();
    } catch (err) {
      console.error('Lỗi khi điều xe xuất bến:', err);
      toast.error('Không thể xuất bến: ' + (err.response?.data?.message || err.message));
    }
  };

  // GAP-SYNC-08: Hủy chuyến xuất giao hàng và hoàn nhập kho ProductBatch
  const handleCancelDelivery = async (delivery) => {
    const reason = window.prompt(
      `Nhập lý do hủy chuyến giao hàng [${delivery.deliveryCode}] (Số lượng xuất kho sẽ được hoàn nhập tự động về lô thành phẩm):`,
      'Đối tác đổi lịch nhận hàng / sự cố phương tiện'
    );
    if (reason === null) return;

    try {
      await financeService.cancelSalesDelivery(delivery.farmId, delivery.id, { reason });
      toast.success(`Đã hủy chuyến giao hàng ${delivery.deliveryCode} và hoàn nhập tồn kho thành công!`);
      notifyDataChanged?.('inventory');
      notifyDataChanged?.('batches');
      notifyDataChanged?.('finance');
      notifyDataChanged?.('partners');
      notifyDataChanged?.('all');
      loadDeliveries();
    } catch (err) {
      console.error('Lỗi khi hủy chuyến giao hàng:', err);
      toast.error('Không thể hủy chuyến giao hàng: ' + (err.response?.data?.message || err.message));
    }
  };

  // Open POD update modal
  const handleOpenPodModal = (delivery) => {
    setSelectedDeliveryForPod(delivery);
    setPodFormData({
      proofOfDeliveryUrl: delivery.proofOfDeliveryUrl || '',
      receiverName: delivery.receiverName || '',
      notes: delivery.notes || '',
    });
  };

  // Quick fill sample POD
  const handleFillSamplePod = () => {
    const sampleUrls = [
      'https://cdn.greenfarm.vn/pod/signed-receipt-b2b-coopmart.jpg',
      'https://cdn.greenfarm.vn/pod/signed-delivery-order-winmart.jpg',
      'https://cdn.greenfarm.vn/pod/biên-bản-bàn-giao-nông-sản-vietgap.jpg',
    ];
    const picked = sampleUrls[Math.floor(Math.random() * sampleUrls.length)];
    setPodFormData((prev) => ({
      ...prev,
      proofOfDeliveryUrl: picked,
      receiverName: prev.receiverName || 'Trần Văn Nhận - Đại diện Kho B2B',
      notes: 'Đã nhận đủ số lượng, bao bì nguyên vẹn, đối soát chữ ký khớp hợp đồng.',
    }));
    toast.info('Đã điền link ảnh biên bản POD mẫu!');
  };

  // Submit POD update
  const handleSubmitPod = async (e) => {
    e.preventDefault();
    if (!podFormData.proofOfDeliveryUrl?.trim()) {
      toast.error('Vui lòng nhập đường dẫn URL ảnh biên bản giao nhận POD!');
      return;
    }

    try {
      setIsSubmittingPod(true);
      await financeService.updateDeliveryPod(selectedDeliveryForPod.farmId, selectedDeliveryForPod.id, {
        proofOfDeliveryUrl: podFormData.proofOfDeliveryUrl.trim(),
        receiverName: podFormData.receiverName?.trim() || null,
        notes: podFormData.notes?.trim() || null,
      });

      toast.success(`Cập nhật chứng từ POD thành công cho chuyến hàng ${selectedDeliveryForPod.deliveryCode}!`);
      setSelectedDeliveryForPod(null);
      notifyDataChanged?.('finance');
      notifyDataChanged?.('partners');
      notifyDataChanged?.('all');
      loadDeliveries();
    } catch (err) {
      console.error('Lỗi cập nhật POD:', err);
      toast.error('Lỗi cập nhật POD: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingPod(false);
    }
  };

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((item) => {
    if (statusFilter) {
      if (statusFilter === 'DRAFT' && item.status !== 'DRAFT' && item.status !== 'PENDING') return false;
      if (statusFilter === 'DISPATCHED' && item.status !== 'DISPATCHED' && item.status !== 'IN_TRANSIT') return false;
      if (statusFilter === 'DELIVERED' && item.status !== 'DELIVERED') return false;
      if (statusFilter === 'CANCELLED' && item.status !== 'CANCELLED') return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.deliveryCode?.toLowerCase().includes(term) ||
      item.orderCode?.toLowerCase().includes(term) ||
      item.receiverName?.toLowerCase().includes(term) ||
      item.driverName?.toLowerCase().includes(term) ||
      item.vehiclePlate?.toLowerCase().includes(term) ||
      item.partnerName?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
            <Clock className="h-3 w-3" />
            <span>Chờ bốc xếp / Chờ xuất bến</span>
          </span>
        );
      case 'DISPATCHED':
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-300 animate-pulse">
            <Truck className="h-3 w-3 text-blue-600" />
            <span>Xe đang giao hàng</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Đã giao & Có POD</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-300">
            <X className="h-3 w-3" />
            <span>Đã hủy chuyến</span>
          </span>
        );
      default:
        return <StatusBadge status={status} />;
    }
  };

  const columns = [
    {
      key: 'deliveryCode',
      header: 'Mã Phiếu Giao',
      width: '140px',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block">{row.deliveryCode}</span>
          <span className="text-[10px] text-slate-500">{formatDate(row.deliveryDate)}</span>
        </div>
      ),
    },
    {
      key: 'orderCode',
      header: 'Đơn Bán Sỉ Gốc',
      width: '130px',
      render: (row) => (
        <div>
          <span className="font-mono font-semibold text-emerald-700 block">
            {row.orderCode || `Đơn #${row.salesOrderId}`}
          </span>
          <span className="text-[11px] text-slate-600 truncate max-w-[130px] block">
            {row.partnerName || 'Khách B2B'}
          </span>
        </div>
      ),
    },
    {
      key: 'logistics',
      header: 'Vận Chuyển & Tài Xế',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1 font-semibold text-slate-800">
            <Truck className="h-3 w-3 text-slate-500 shrink-0" />
            <span>{row.vehiclePlate || 'Chưa gán xe'}</span>
            {row.driverName && <span className="text-slate-500 font-normal">• {row.driverName}</span>}
          </div>
          {row.logisticsPartnerName && (
            <div className="text-[11px] text-slate-500">
              ĐVVC: {row.logisticsPartnerName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'receiver',
      header: 'Người Nhận & Địa Điểm',
      render: (row) => (
        <div className="space-y-0.5 text-xs max-w-xs">
          <div className="flex items-center gap-1 font-medium text-slate-800">
            <User className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{row.receiverName || 'Khách hàng B2B'}</span>
          </div>
          {row.shippingAddress && (
            <div className="flex items-start gap-1 text-[11px] text-slate-500 truncate" title={row.shippingAddress}>
              <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
              <span className="truncate">{row.shippingAddress}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'totalShippedAmount',
      header: 'Giá Trị Xuất Giao',
      render: (row) => (
        <div>
          <div className="font-black text-slate-900 font-mono text-xs">
            {formatCurrency(row.totalShippedAmount || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {row.items?.length || 0} mặt hàng
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'pod',
      header: 'Chứng Từ POD',
      render: (row) => (
        <div>
          {row.proofOfDeliveryUrl ? (
            <button
              type="button"
              onClick={() => setPreviewImageUrl(row.proofOfDeliveryUrl)}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition-colors"
              title="Xem ảnh biên bản giao nhận có chữ ký"
            >
              <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Xem POD</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Chưa có ảnh</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Nút Xem Chi Tiết */}
          <button
            type="button"
            onClick={() => setSelectedDeliveryForDetail(row)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Xem chi tiết các mặt hàng xuất giao"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Phân quyền điều phối xuất bến & POD */}
          <Can anyPermissions={['PERM_DELIVERY_MANAGE', 'PERM_INVENTORY_ISSUE', 'PERM_FINANCE_SALES_ORDER']} role={['ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER']}>
            {/* Khi đang PENDING hoặc DRAFT: Hiển thị Điều xe xuất bến */}
            {(row.status === 'PENDING' || row.status === 'DRAFT') && (
              <Button
                variant="primary"
                size="xs"
                icon={<Truck className="h-3.5 w-3.5" />}
                onClick={() => handleDispatch(row)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-2xs text-[11px]"
              >
                Điều Xe Xuất Bến
              </Button>
            )}

            {/* Khi đang DISPATCHED, IN_TRANSIT hoặc cần bổ sung POD: Hiển thị Cập nhật POD */}
            {(row.status === 'DISPATCHED' || row.status === 'IN_TRANSIT' || row.status === 'PENDING' || row.status === 'DRAFT') && (
              <Button
                variant="outline"
                size="xs"
                icon={<Camera className="h-3.5 w-3.5 text-emerald-600" />}
                onClick={() => handleOpenPodModal(row)}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-[11px]"
              >
                Cập Nhật POD
              </Button>
            )}

            {/* GAP-SYNC-08: Hủy chuyến giao hàng khi chưa hoàn tất DELIVERED */}
            {(row.status === 'PENDING' || row.status === 'DRAFT' || row.status === 'DISPATCHED' || row.status === 'IN_TRANSIT') && (
              <Button
                variant="outline"
                size="xs"
                icon={<XCircle className="h-3.5 w-3.5 text-rose-600" />}
                onClick={() => handleCancelDelivery(row)}
                className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-[11px]"
                title="Hủy chuyến xuất giao hàng và hoàn nhập kho"
              >
                Hủy Chuyến
              </Button>
            )}
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar: Bộ lọc, tìm kiếm và nút lập phiếu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã phiếu, đơn hàng, khách hàng, biển số xe..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {(searchTerm || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadDeliveries}
          >
            Làm mới
          </Button>

          <Can anyPermissions={['PERM_DELIVERY_MANAGE', 'PERM_INVENTORY_ISSUE', 'PERM_FINANCE_SALES_ORDER']} role={['ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER']}>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={onOpenCreateDelivery}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              + Lập Phiếu Giao Hàng Mới
            </Button>
          </Can>
        </div>
      </div>

      {/* 2. Banner Hướng dẫn Quy Trình Giao Vận (Flow 6 - WS-H2) */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
        <Truck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-blue-950 uppercase tracking-wider text-[11px]">
            Bảng Điều Phối Xuất Xe Giao Vận B2B & Biên Bản POD (Role Warehouse Staff & Farm Manager)
          </div>
          <p className="text-blue-800 leading-relaxed">
            Quy trình khép kín: (1) Chọn đơn sỉ đã duyệt và lập đợt xuất giao &rarr; (2) Trừ tồn kho lô thành phẩm và giải phóng giữ chỗ &rarr; (3) Bấm <strong>Điều Xe Xuất Bến</strong> khi xe lăn bánh rời kho &rarr; (4) Sau khi khách hàng ký biên bản, chụp ảnh và bấm <strong>Cập Nhật POD</strong> để hoàn tất giao hàng và ghi nhận công nợ đối soát kế toán!
          </p>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Chuyến Giao Hàng */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredDeliveries}
          isLoading={isLoading}
          emptyMessage="Chưa có chuyến giao hàng nào phù hợp với bộ lọc."
        />
      </div>

      {/* ======================================================== */}
      {/* 4. MODAL CẬP NHẬT BIÊN BẢN GIAO NHẬN POD                  */}
      {/* ======================================================== */}
      {selectedDeliveryForPod && (
        <Modal
          isOpen={Boolean(selectedDeliveryForPod)}
          onClose={() => setSelectedDeliveryForPod(null)}
          title={`Cập Nhật Biên Bản POD: ${selectedDeliveryForPod.deliveryCode}`}
          subtitle="Đính kèm ảnh chứng từ Proof of Delivery có chữ ký và hoàn tất bàn giao"
          icon={<Camera className="h-5 w-5 text-emerald-600" />}
          size="md"
        >
          <form onSubmit={handleSubmitPod} className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1 text-slate-700 font-mono text-[11px]">
              <div>Đơn hàng gốc: <strong className="text-slate-900">{selectedDeliveryForPod.orderCode || selectedDeliveryForPod.salesOrderId}</strong></div>
              <div>Người nhận dự kiến: <strong className="text-slate-900">{selectedDeliveryForPod.receiverName || 'Khách hàng B2B'}</strong></div>
              <div>Địa chỉ giao: <strong className="text-slate-900">{selectedDeliveryForPod.shippingAddress || 'N/A'}</strong></div>
            </div>

            <FormField label="URL Ảnh Biên Bản Giao Nhận Có Chữ Ký (POD) *" required>
              <div className="space-y-2">
                <Input
                  value={podFormData.proofOfDeliveryUrl}
                  onChange={(e) => setPodFormData({ ...podFormData, proofOfDeliveryUrl: e.target.value })}
                  placeholder="https://cdn.greenfarm.vn/pod/signed-receipt.jpg"
                  required
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Đính kèm ảnh chụp rõ chữ ký và dấu mộc của bên nhận</span>
                  <button
                    type="button"
                    onClick={handleFillSamplePod}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    Điền link ảnh mẫu nhanh
                  </button>
                </div>
              </div>
            </FormField>

            <FormField label="Tên Người Ký Nhận Hàng">
              <Input
                value={podFormData.receiverName}
                onChange={(e) => setPodFormData({ ...podFormData, receiverName: e.target.value })}
                placeholder="VD: Nguyễn Văn Đại Diện - Thủ kho đối tác"
              />
            </FormField>

            <FormField label="Ghi Chú Bàn Giao / Tình Trạng Nông Sản">
              <Input
                value={podFormData.notes}
                onChange={(e) => setPodFormData({ ...podFormData, notes: e.target.value })}
                placeholder="VD: Hàng giao đủ số lượng, nhiệt độ bảo quản xe lạnh đạt chuẩn..."
              />
            </FormField>

            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Khi cập nhật POD, trạng thái chuyến hàng sẽ chuyển thành <strong>DELIVERED</strong> và hệ thống tự động bắn Notification tới Kế toán và Giám đốc trại để theo dõi công nợ B2B.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setSelectedDeliveryForPod(null)}
                disabled={isSubmittingPod}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmittingPod}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isSubmittingPod ? 'Đang lưu POD...' : 'Hoàn Tất & Lưu POD'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL XEM CHI TIẾT ĐỢT XUẤT GIAO HÀNG                  */}
      {/* ======================================================== */}
      {selectedDeliveryForDetail && (
        <Modal
          isOpen={Boolean(selectedDeliveryForDetail)}
          onClose={() => setSelectedDeliveryForDetail(null)}
          title={`Chi Tiết Đợt Giao Hàng: ${selectedDeliveryForDetail.deliveryCode}`}
          subtitle={`Xuất hàng cho đơn ${selectedDeliveryForDetail.orderCode || selectedDeliveryForDetail.salesOrderId}`}
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 block">Ngày giao:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedDeliveryForDetail.deliveryDate)}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Khách hàng:</span>
                <span className="font-bold text-slate-800">{selectedDeliveryForDetail.partnerName || 'Khách hàng B2B'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Trạng thái:</span>
                {getStatusBadge(selectedDeliveryForDetail.status)}
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Xe & Tài xế:</span>
                <span className="font-bold text-slate-800">
                  {selectedDeliveryForDetail.vehiclePlate || 'N/A'} {selectedDeliveryForDetail.driverName ? `(${selectedDeliveryForDetail.driverName})` : ''}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Người nhận:</span>
                <span className="font-bold text-slate-800">{selectedDeliveryForDetail.receiverName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Tổng tiền hàng xuất:</span>
                <span className="font-black text-emerald-700 font-mono text-sm">
                  {formatCurrency(selectedDeliveryForDetail.totalShippedAmount || 0)}
                </span>
              </div>
            </div>

            {selectedDeliveryForDetail.shippingAddress && (
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Địa chỉ giao hàng: <strong>{selectedDeliveryForDetail.shippingAddress}</strong></span>
              </div>
            )}

            {/* Bảng Mặt Hàng Xuất Giao */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Package className="h-4 w-4 text-blue-600" />
                <span>Danh Sách Mặt Hàng Xuất Kho ({selectedDeliveryForDetail.items?.length || 0})</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Tên Nông Sản</th>
                      <th className="py-2 px-3">Mã Lô Thành Phẩm</th>
                      <th className="py-2 px-3 text-right">Số Lượng Giao</th>
                      <th className="py-2 px-3 text-right">Đơn Giá</th>
                      <th className="py-2 px-3 text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedDeliveryForDetail.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{it.itemName || `Mặt hàng #${it.salesOrderItemId}`}</td>
                        <td className="py-2 px-3 font-mono text-blue-700 font-semibold">{it.batchCode || `Lô #${it.productBatchId}`}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatWeight(it.quantity)}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">{formatCurrency(it.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">{formatCurrency(it.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedDeliveryForDetail.proofOfDeliveryUrl && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-emerald-900 text-xs">Biên bản bàn giao POD có chữ ký</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(selectedDeliveryForDetail.proofOfDeliveryUrl)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Xem ảnh chứng từ
                </button>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setSelectedDeliveryForDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL XEM TRƯỚC ẢNH CHỨNG TỪ POD                      */}
      {/* ======================================================== */}
      {previewImageUrl && (
        <Modal
          isOpen={Boolean(previewImageUrl)}
          onClose={() => setPreviewImageUrl(null)}
          title="Chứng Từ Bàn Giao POD (Proof of Delivery)"
          size="lg"
        >
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center p-2 min-h-[300px]">
              <img
                src={previewImageUrl}
                alt="Proof of Delivery Receipt"
                className="max-h-[500px] w-auto object-contain rounded-lg shadow-sm"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400/e2e8f0/475569?text=POD+Image+Sample';
                }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Mở trong tab mới</span>
              </a>
              <Button variant="ghost" onClick={() => setPreviewImageUrl(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SalesDeliveryMonitorTab;
