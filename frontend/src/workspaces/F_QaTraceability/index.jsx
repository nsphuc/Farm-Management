import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  QrCode,
  Search,
  Filter,
  Eye,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Package,
  Layers,
  Award,
  AlertTriangle,
  UserCheck,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { toast } from '@/store/useToastStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { qaService } from '@/services/modules/qaService';
import { EmergencyRecallModal } from './components/EmergencyRecallModal';
import { BatchRejectionModal } from './components/BatchRejectionModal';
import { TraceabilityDetailDrawer } from './components/TraceabilityDetailDrawer';
import { formatWeight, formatDate, formatDateTime } from '@/utils/formatters';

const OWNER_QA_TABS = [
  { id: 'MARKET_ACTIVE', label: 'Đang Lưu Hành Trên Thị Trường (PRINTED / SELLING)', countKey: 'marketActive' },
  { id: 'REJECTED', label: 'Lô Bị Đánh Trượt KCS Tại Trại (REJECTED)', countKey: 'rejected' },
  { id: 'RECALLED', label: 'Lô Đã Bị Thu Hồi Khẩn Cấp (RECALLED)', countKey: 'recalled' },
  { id: 'ALL', label: 'Tất Cả Lô Thành Phẩm', countKey: 'all' },
];

const KANBAN_COLUMNS = [
  { id: 'PENDING_APPROVAL', title: 'Chờ Duyệt KCS', color: 'border-amber-400 bg-amber-50/50' },
  { id: 'READY_TO_PRINT', title: 'Sẵn Sàng In Tem', color: 'border-blue-400 bg-blue-50/50' },
  { id: 'PRINTED', title: 'Đã In Tem Nhãn', color: 'border-indigo-400 bg-indigo-50/50' },
  { id: 'SELLING', title: 'Đang Xuất Bán', color: 'border-emerald-400 bg-emerald-50/50' },
  { id: 'REJECTED', title: 'Từ Chối KCS', color: 'border-slate-400 bg-slate-50/50' },
  { id: 'RECALLED', title: 'Thu Hồi Khẩn Cấp', color: 'border-rose-400 bg-rose-50/50' },
];

export function QaTraceabilityWorkspace() {
  const { isOwner, isFarmManager, userInfo } = useAuthStore();
  const { activeFarmId, setActiveFarmId, syncTrigger, notifyDataChanged } = useActiveFarmStore();
  const owner = isOwner();
  const manager = isFarmManager();

  const [activeTab, setActiveTab] = useState('MARKET_ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Drawer & Modals states
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [recallBatchTarget, setRecallBatchTarget] = useState(null);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [rejectBatchTarget, setRejectBatchTarget] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Create batch modal (ROLE_WAREHOUSE_STAFF / ROLE_FARM_MANAGER)
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  const [createBatchForm, setCreateBatchForm] = useState({
    batchCode: `BATCH-${Date.now().toString().slice(-6)}`,
    productName: '',
    initialQuantity: '',
    unit: 'KG',
    qualityGrade: 'GRADE_A',
    harvestDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Create QC inspection modal (ROLE_TECHNICAL_STAFF)
  const [isCreateInspectionOpen, setIsCreateInspectionOpen] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    productBatchId: '',
    inspectionCode: `QC-${Date.now().toString().slice(-6)}`,
    inspectionDate: new Date().toISOString().split('T')[0],
    sampleSize: '5.0',
    sampleUnit: 'KG',
    overallResult: 'PASSED',
    notes: 'Kiểm tra cảm quan & dư lượng đạt chuẩn',
    parameterName: 'Dư lượng BVTV',
    standardThreshold: '< 0.01 mg/kg',
    actualValue: '0.002 mg/kg',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    const targetFarmId = activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : batches[0]?.farmId;
    if (!targetFarmId) {
      toast.error('Vui lòng chọn trang trại cụ thể trên thanh điều hướng trước khi tạo lô thành phẩm!');
      return;
    }
    try {
      setIsSubmitting(true);
      await qaService.createProductBatch(targetFarmId, {
        batchCode: createBatchForm.batchCode,
        productName: createBatchForm.productName,
        initialQuantity: Number(createBatchForm.initialQuantity),
        unit: createBatchForm.unit,
        qualityGrade: createBatchForm.qualityGrade,
        harvestDate: createBatchForm.harvestDate,
        expiryDate: createBatchForm.expiryDate,
      });
      toast.success(`Đã tạo lô thành phẩm đóng gói thành công: ${createBatchForm.batchCode}!`);
      setIsCreateBatchOpen(false);
      fetchBatches();
      notifyDataChanged?.('batches');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi tạo lô thành phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateInspection = async (e) => {
    e.preventDefault();
    if (!inspectionForm.productBatchId) {
      toast.error('Vui lòng chọn lô thành phẩm cần kiểm định!');
      return;
    }
    const targetBatch = batches.find((b) => Number(b.id) === Number(inspectionForm.productBatchId));
    const targetFarmId = targetBatch?.farmId || (activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : null);
    if (!targetFarmId) {
      toast.error('Không tìm thấy thông tin trang trại!');
      return;
    }
    try {
      setIsSubmitting(true);
      await qaService.createQcInspection(targetFarmId, {
        productBatchId: Number(inspectionForm.productBatchId),
        inspectionCode: inspectionForm.inspectionCode,
        inspectionDate: inspectionForm.inspectionDate,
        sampleSize: Number(inspectionForm.sampleSize),
        sampleUnit: inspectionForm.sampleUnit,
        overallResult: inspectionForm.overallResult,
        notes: inspectionForm.notes,
        items: [
          {
            parameterName: inspectionForm.parameterName,
            standardThreshold: inspectionForm.standardThreshold,
            actualValue: inspectionForm.actualValue,
            passed: inspectionForm.overallResult !== 'REJECTED',
          },
        ],
      });
      toast.success(`Đã lập biên bản kiểm định KCS thành công: ${inspectionForm.inspectionCode}!`);
      setIsCreateInspectionOpen(false);
      fetchBatches();
      notifyDataChanged?.('batches');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi lập biên bản KCS');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch batches
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const queryFarmId = activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : undefined;
      const res = await qaService.getProductBatches({
        farmId: queryFarmId,
        status: owner ? activeTab : undefined,
        keyword: searchTerm || undefined,
        page,
        size: 20,
      });

      if (res) {
        setBatches(res.content || res || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || (res.content ? res.content.length : 0));
      }
    } catch (err) {
      console.error('Failed to load product batches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [activeTab, activeFarmId, searchTerm, page, syncTrigger?.batches]);

  const handleOpenDrawer = async (batch) => {
    setSelectedBatch(batch);
    setIsDrawerOpen(true);
    try {
      // Async refresh with full details (metrics, snapshot, etc.)
      const fullDetail = await qaService.getProductBatchById(batch.farmId, batch.id);
      if (fullDetail) {
        setSelectedBatch(fullDetail);
      }
    } catch (err) {
      console.warn('Could not fetch full batch detail', err);
    }
  };

  const handleOpenRecallModal = (batch, e) => {
    e?.stopPropagation();
    setRecallBatchTarget(batch);
    setIsRecallModalOpen(true);
  };

  const handleOpenRejectModal = (batch, e) => {
    e?.stopPropagation();
    setRejectBatchTarget(batch);
    setIsRejectModalOpen(true);
  };

  // Columns for Owner Supervision Table
  const ownerColumns = [
    {
      key: 'productName',
      header: 'Tên Nông Sản & Phẩm Cấp',
      title: 'Tên Nông Sản & Phẩm Cấp',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{item.productName}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <StatusBadge status={item.qualityGrade} size="sm" />
            <span className="text-[10px] text-slate-400 font-mono">
              {item.batchCode ? `${item.batchCode} • ` : ''}Thu hoạch: {formatDate(item.harvestDate)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'farmName',
      header: 'Trang Trại Sản Xuất',
      title: 'Trang Trại Sản Xuất',
      render: (item) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
          <Building className="h-3 w-3 text-emerald-600 shrink-0" />
          <span className="truncate max-w-[130px]">{item.farmName || `Trại #${item.farmId}`}</span>
        </span>
      ),
    },
    {
      key: 'quantities',
      header: 'Sản Lượng (Ban Đầu / Đã Bán / Tồn)',
      title: 'Sản Lượng (Ban Đầu / Đã Bán / Tồn)',
      render: (item) => {
        const initial = Number(item.initialQuantity) || 0;
        const sold = Number(item.soldQuantity) || 0;
        const remaining = Number(item.remainingQuantity) || 0;
        return (
          <div className="font-mono text-xs space-y-0.5">
            <div className="text-slate-600">
              <span className="text-slate-400 text-[10px]">Đầu vụ: </span>
              <strong>{formatWeight(initial)} {item.unit}</strong>
            </div>
            <div className="text-blue-700 font-semibold">
              <span className="text-slate-400 text-[10px]">Đã bán: </span>
              {formatWeight(sold)} {item.unit}
            </div>
            <div className="text-emerald-700 font-bold">
              <span className="text-slate-400 text-[10px]">Còn tồn: </span>
              {formatWeight(remaining)} {item.unit}
            </div>
          </div>
        );
      },
    },
    {
      key: 'kcsStaff',
      header: 'Kiểm Định & Phê Duyệt',
      title: 'Kiểm Định & Phê Duyệt',
      render: (item) => (
        <div className="text-xs space-y-1">
          <div>
            <span className="text-[10px] text-slate-400 block">Kỹ thuật kiểm định:</span>
            <span className="font-medium text-slate-800">
              {item.inspectorFullName || 'Chưa phân công'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Giám đốc duyệt:</span>
            <span className="font-medium text-slate-800">
              {item.approverFullName || 'Chưa phê duyệt'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'traceability',
      header: 'Tra Cứu QR & Lượt Quét',
      title: 'Tra Cứu QR & Lượt Quét',
      render: (item) => (
        <div className="text-xs space-y-1 font-mono">
          <div className="flex items-center gap-1 text-slate-700">
            <QrCode className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="font-bold text-[11px] truncate max-w-[120px]">
              {item.traceabilityCode ? item.traceabilityCode.substring(0, 12) + '...' : 'Chưa cấp QR'}
            </span>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              <Eye className="h-3 w-3 text-emerald-600" />
              <span>{item.scanCount ?? 0} lượt quét</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      title: 'Trạng Thái',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      title: 'Thao Tác',
      className: 'text-right',
      render: (item) => {
        const canRecall = ['READY_TO_PRINT', 'PRINTED', 'SELLING'].includes(item.status);
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              size="xs"
              variant="outline"
              icon={<Eye className="h-3.5 w-3.5 text-slate-600" />}
              onClick={() => handleOpenDrawer(item)}
              title="Xem hồ sơ truy xuất QR & biên bản KCS 360°"
            >
              Xem QR & KCS
            </Button>

            {canRecall && (
              <Can permission="PERM_QC_RECALL" role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>
                <Button
                  size="xs"
                  variant="danger"
                  icon={<AlertOctagon className="h-3.5 w-3.5" />}
                  onClick={(e) => handleOpenRecallModal(item, e)}
                  title="Phát lệnh thu hồi khẩn cấp toàn cục"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-2xs"
                >
                  Thu Hồi Khẩn Cấp
                </Button>
              </Can>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-1 ring-teal-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {owner
                  ? 'Giám Sát Thành Phẩm Thị Trường & Thu Hồi Khẩn Cấp'
                  : 'Đường Ống Quản Trị Chất Lượng & Phê Duyệt KCS'}
              </h1>
              {owner && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-300">
                  Owner Exclusive
                </span>
              )}
              {manager && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-800 border border-blue-300">
                  Farm Manager
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {owner
                ? 'Theo dõi sản phẩm bán ra thị trường, kiểm tra lượt quét QR người tiêu dùng và nắm quyền phát lệnh thu hồi khẩn cấp'
                : 'Kanban 6 cột kiểm định KCS, đóng băng bản chụp JSON SHA-256 và phê duyệt xuất xưởng thành phẩm'}
            </p>
          </div>
        </div>

        {/* Nút thao tác góc phải */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút Tạo Lô Thành Phẩm Đóng Gói (ROLE_WAREHOUSE_STAFF / ROLE_FARM_MANAGER) */}
          <Can permission="PERM_HARVEST_MANAGE" role={['ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER']}>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateBatchOpen(true)}
            >
              + Tạo Lô Thành Phẩm Đóng Gói
            </Button>
          </Can>

          {/* Nút Maker: Lập Biên Bản Kiểm Định KCS (ROLE_TECHNICAL_STAFF) */}
          <Can permission="PERM_QC_INSPECT" role="ROLE_TECHNICAL_STAFF">
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="h-4 w-4 text-emerald-600" />}
              onClick={() => {
                const pendingBatch = batches.find((b) => b.status === 'PENDING_APPROVAL');
                setInspectionForm((prev) => ({
                  ...prev,
                  productBatchId: pendingBatch ? String(pendingBatch.id) : '',
                  inspectionCode: `QC-${Date.now().toString().slice(-6)}`,
                }));
                setIsCreateInspectionOpen(true);
              }}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              + Lập Biên Bản KCS
            </Button>
          </Can>

          {/* Nút In Tem Hàng Loạt (ROLE_WAREHOUSE_STAFF) */}
          <Can permission="PERM_LABEL_PRINT" role="ROLE_WAREHOUSE_STAFF">
            <Button variant="outline" size="sm" icon={<Printer className="h-4 w-4" />}>
              In Tem Hàng Loạt
            </Button>
          </Can>

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchBatches}
          >
            Làm Mới
          </Button>
        </div>
      </div>

      {/* 2. Banner Thông Điệp Phân Quyền dành cho Owner */}
      {owner && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 text-xs text-teal-900 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-teal-950 uppercase tracking-wider text-[11px]">
              Chế Độ Giám Sát Cấp Chủ Đầu Tư (Chain Product Quality Supervision)
            </div>
            <p className="text-teal-800 leading-relaxed">
              Theo quy chuẩn phân cấp: Việc lấy mẫu do Kỹ thuật viên phụ trách, việc duyệt KCS hàng ngày do Giám đốc từng trại đảm nhận.
              Chủ đầu tư (Owner) chỉ giám sát sản lượng bán ra, số lượt tra cứu QR của khách hàng, các lô trượt KCS/bị từ chối và nắm <strong>độc quyền phát lệnh thu hồi khẩn cấp toàn cục</strong> để bảo vệ thương hiệu!
            </p>
          </div>
        </div>
      )}

      {/* 3. Banner Thông Điệp Phân Quyền dành cho Farm Manager */}
      {manager && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-blue-950 uppercase tracking-wider text-[11px]">
              Quyền Hạn Phê Duyệt Xuất Xưởng & Thu Hồi Khẩn Cấp Của Giám Đốc Trại
            </div>
            <p className="text-blue-800 leading-relaxed">
              Bạn chịu trách nhiệm thẩm định biên bản KCS do Kỹ thuật viên gửi lên và trực tiếp bấm <strong>Phê Duyệt Lô Thành Phẩm</strong> để cấp mã QR bất biến hoặc <strong>Từ Chối Lô Hàng</strong>. Khi phát hiện sự cố, bạn có quyền phát lệnh <strong>Thu Hồi Khẩn Cấp</strong> ngay lập tức.
              <span className="block mt-0.5 font-semibold text-blue-950">
                Lưu ý Maker-Checker: Người trực tiếp lấy mẫu kiểm tra không được tự phê duyệt lô hàng của chính mình!
              </span>
            </p>
          </div>
        </div>
      )}

      {/* 4. Tab Trạng Thái Cốt Lõi (Dành riêng cho Owner) */}
      {owner ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            {OWNER_QA_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(0);
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? tab.id === 'RECALLED'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : tab.id === 'REJECTED'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-emerald-700 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm mã lô, tên nông sản, mã truy xuất QR..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Table danh sách lô thành phẩm giám sát */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <DataTable
              columns={ownerColumns}
              data={batches}
              isLoading={loading}
              onRowClick={handleOpenDrawer}
              pagination={{
                page,
                totalPages,
                totalElements,
                onPageChange: (newPage) => setPage(newPage),
              }}
            />
          </div>
        </div>
      ) : (
        /* Giao diện Kanban 6 Cột cấp trại cho Farm Manager / Technical Staff */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {KANBAN_COLUMNS.map((col) => {
            const colBatches = batches.filter((b) => b.status === col.id);

            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-2xl border-t-4 bg-white p-3 shadow-xs min-h-[450px] ${col.color}`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-800">{col.title}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {colBatches.length}
                  </span>
                </div>

                <div className="flex-1 py-3 space-y-2.5 overflow-y-auto">
                  {colBatches.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      Không có lô hàng
                    </div>
                  ) : (
                    colBatches.map((batch) => (
                      <div
                        key={batch.id}
                        onClick={() => handleOpenDrawer(batch)}
                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-emerald-500 cursor-pointer transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 font-mono">
                            {batch.batchCode}
                          </span>
                          <StatusBadge status={batch.qualityGrade} size="sm" />
                        </div>
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {batch.productName}
                        </p>

                        {/* Thông tin trang trại */}
                        {(batch.farmName || activeFarmId === 'ALL') && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <Building className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{batch.farmName || `Trại #${batch.farmId}`}</span>
                          </div>
                        )}

                        {/* Trạng thái KCS đặc biệt trong cột Chờ Phê Duyệt */}
                        {col.id === 'PENDING_APPROVAL' && (
                          <div className="pt-0.5">
                            {batch.qcInspectionCode ? (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-100/70 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 border border-amber-200">
                                <CheckCircle2 className="h-2.5 w-2.5 text-amber-700" />
                                <span>KCS: {batch.qcOverallResult || 'Đã kiểm nghiệm'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                                <Clock className="h-2.5 w-2.5 text-slate-400" />
                                <span>Chờ KCS lấy mẫu</span>
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                          <span>SL: {formatWeight(batch.remainingQuantity)}</span>
                          <span>{formatDate(batch.harvestDate)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer xem chi tiết hồ sơ KCS 360 & Phê duyệt / Thu hồi */}
      <TraceabilityDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        batch={selectedBatch}
        onOpenRecall={(b) => handleOpenRecallModal(b)}
        onOpenReject={(b) => handleOpenRejectModal(b)}
        onApproveSuccess={() => {
          fetchBatches();
        }}
        isOwner={owner}
      />

      {/* Modal Phát Lệnh Thu Hồi Khẩn Cấp */}
      <EmergencyRecallModal
        isOpen={isRecallModalOpen}
        onClose={() => setIsRecallModalOpen(false)}
        batch={recallBatchTarget}
        onSuccess={() => {
          fetchBatches();
          if (selectedBatch && selectedBatch.id === recallBatchTarget?.id) {
            setIsDrawerOpen(false);
          }
        }}
      />

      {/* Modal Từ Chối Lô Hàng Dành Cho Farm Manager */}
      <BatchRejectionModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        batch={rejectBatchTarget}
        onSuccess={() => {
          fetchBatches();
          if (selectedBatch && selectedBatch.id === rejectBatchTarget?.id) {
            setIsDrawerOpen(false);
          }
        }}
      />

      {/* Modal 1: Tạo Lô Thành Phẩm Đóng Gói (ROLE_WAREHOUSE_STAFF / ROLE_FARM_MANAGER) */}
      <Modal
        isOpen={isCreateBatchOpen}
        onClose={() => setIsCreateBatchOpen(false)}
        title="Tạo Lô Thành Phẩm Đóng Gói Nhập Kho"
        size="md"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
          <FormField label="Mã Lô Thành Phẩm" required>
            <Input
              value={createBatchForm.batchCode}
              onChange={(e) => setCreateBatchForm({ ...createBatchForm, batchCode: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Tên Sản Phẩm Đóng Gói" required>
            <Input
              value={createBatchForm.productName}
              placeholder="VD: Cà chua Cherry VietGAP, Gạo ST25..."
              onChange={(e) => setCreateBatchForm({ ...createBatchForm, productName: e.target.value })}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số Lượng Ban Đầu" required>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={createBatchForm.initialQuantity}
                onChange={(e) => setCreateBatchForm({ ...createBatchForm, initialQuantity: e.target.value })}
                placeholder="VD: 500"
                required
              />
            </FormField>

            <FormField label="Đơn Vị Tính" required>
              <Select
                value={createBatchForm.unit}
                onChange={(e) => setCreateBatchForm({ ...createBatchForm, unit: e.target.value })}
              >
                <option value="KG">Kilogram (KG)</option>
                <option value="BOX">Thùng (BOX)</option>
                <option value="BAG">Bao (BAG)</option>
                <option value="BUNCH">Bó (BUNCH)</option>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày Thu Hoạch / Đóng Gói" required>
              <Input
                type="date"
                value={createBatchForm.harvestDate}
                onChange={(e) => setCreateBatchForm({ ...createBatchForm, harvestDate: e.target.value })}
              />
            </FormField>

            <FormField label="Hạn Sử Dụng">
              <Input
                type="date"
                value={createBatchForm.expiryDate}
                onChange={(e) => setCreateBatchForm({ ...createBatchForm, expiryDate: e.target.value })}
              />
            </FormField>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
            ⚠️ Lô mới sẽ có trạng thái <strong>PENDING_APPROVAL</strong>. Kỹ thuật viên KCS sẽ lấy mẫu kiểm nghiệm và Giám đốc trại sẽ phê duyệt cấp mã QR.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsCreateBatchOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo Lô Thành Phẩm'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Maker Lập Biên Bản KCS (ROLE_TECHNICAL_STAFF) */}
      <Modal
        isOpen={isCreateInspectionOpen}
        onClose={() => setIsCreateInspectionOpen(false)}
        title="Lập Biên Bản Kiểm Định KCS (Maker)"
        size="md"
      >
        <form onSubmit={handleCreateInspection} className="space-y-4 text-xs">
          <FormField label="Chọn Lô Thành Phẩm Kiểm Định" required>
            <Select
              value={inspectionForm.productBatchId}
              onChange={(e) => setInspectionForm({ ...inspectionForm, productBatchId: e.target.value })}
              required
            >
              <option value="">-- Chọn lô cần kiểm định --</option>
              {batches
                .filter((b) => b.status === 'PENDING_APPROVAL')
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode} - {b.productName} ({formatWeight(b.remainingQuantity)})
                  </option>
                ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Mã Biên Bản KCS" required>
              <Input
                value={inspectionForm.inspectionCode}
                onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionCode: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Ngày Kiểm Định" required>
              <Input
                type="date"
                value={inspectionForm.inspectionDate}
                onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionDate: e.target.value })}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cỡ Mẫu Kiểm Tra" required>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={inspectionForm.sampleSize}
                onChange={(e) => setInspectionForm({ ...inspectionForm, sampleSize: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Đơn Vị Mẫu" required>
              <Select
                value={inspectionForm.sampleUnit}
                onChange={(e) => setInspectionForm({ ...inspectionForm, sampleUnit: e.target.value })}
              >
                <option value="KG">Kilogram (KG)</option>
                <option value="BOX">Thùng (BOX)</option>
                <option value="SAMPLE">Mẫu thử (SAMPLE)</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Kết Luận Kiểm Nghiệm (KCS Verdict)" required>
            <Select
              value={inspectionForm.overallResult}
              onChange={(e) => setInspectionForm({ ...inspectionForm, overallResult: e.target.value })}
            >
              <option value="PASSED">ĐẠT CHUẨN (PASSED - Cho phép phê duyệt)</option>
              <option value="CONDITIONAL">CÓ ĐIỀU KIỆN (CONDITIONAL)</option>
              <option value="REJECTED">TRƯỢT KCS (REJECTED - Bắt buộc từ chối)</option>
            </Select>
          </FormField>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <span className="font-bold text-slate-800 block text-[11px]">Chỉ Tiêu Đo Lường</span>
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={inspectionForm.parameterName}
                placeholder="Tên chỉ tiêu"
                onChange={(e) => setInspectionForm({ ...inspectionForm, parameterName: e.target.value })}
              />
              <Input
                value={inspectionForm.standardThreshold}
                placeholder="Ngưỡng chuẩn"
                onChange={(e) => setInspectionForm({ ...inspectionForm, standardThreshold: e.target.value })}
              />
              <Input
                value={inspectionForm.actualValue}
                placeholder="Giá trị đo"
                onChange={(e) => setInspectionForm({ ...inspectionForm, actualValue: e.target.value })}
              />
            </div>
          </div>

          <FormField label="Ghi Chú KCS">
            <Input
              value={inspectionForm.notes}
              onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsCreateInspectionOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Lưu Biên Bản KCS'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default QaTraceabilityWorkspace;
