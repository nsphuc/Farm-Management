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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { Can } from '@/components/common/Can';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { geographyService } from '@/services/modules/geographyService';
import { qaService } from '@/services/modules/qaService';
import { EmergencyRecallModal } from './components/EmergencyRecallModal';
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
  const { isOwner, userInfo } = useAuthStore();
  const { activeFarmId, setActiveFarmId, syncTrigger, notifyDataChanged } = useActiveFarmStore();
  const owner = isOwner();

  const [activeTab, setActiveTab] = useState('MARKET_ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Drawer & Recall modal states
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [recallBatchTarget, setRecallBatchTarget] = useState(null);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);

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
        size: 15,
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

  const handleOpenDrawer = (batch) => {
    setSelectedBatch(batch);
    setIsDrawerOpen(true);
  };

  const handleOpenRecallModal = (batch, e) => {
    e?.stopPropagation();
    setRecallBatchTarget(batch);
    setIsRecallModalOpen(true);
  };

  // Columns for Owner Supervision Table (Không hiển thị cột mã riêng biệt)
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

            {/* Đặc quyền Owner: Phát lệnh thu hồi khẩn cấp toàn cục */}
            {canRecall && (
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
                  : 'Đường Ống Quản Trị Chất Lượng & Truy Xuất Nguồn Gốc'}
              </h1>
              {owner && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-300">
                  Owner Exclusive
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {owner
                ? 'Theo dõi sản phẩm bán ra thị trường, kiểm tra lượt quét QR người tiêu dùng và nắm quyền phát lệnh thu hồi khẩn cấp'
                : 'Kanban 6 cột kiểm định KCS, đóng băng bản chụp JSON SHA-256 và in tem nhãn nhiệt ESC/POS'}
            </p>
          </div>
        </div>

        {/* Nút thao tác góc phải: ẨN hoàn toàn nút cấp trại với Owner */}
        <div className="flex items-center gap-2">
          {!owner && (
            <Can permission="PERM_LABEL_PRINT">
              <Button variant="outline" size="sm" icon={<Printer className="h-4 w-4" />}>
                In Tem Hàng Loạt
              </Button>
            </Can>
          )}

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

      {/* 2. Tab Trạng Thái Cốt Lõi (Dành riêng cho Owner) */}
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
        /* Giao diện Kanban cấp trại cho Farm Manager / Technical Staff */
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
                        {(batch.farmName || activeFarmId === 'ALL') && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <Building className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{batch.farmName || `Trại #${batch.farmId}`}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
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

      {/* Drawer xem chi tiết hồ sơ KCS 360 & 5 khối đóng băng */}
      <TraceabilityDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        batch={selectedBatch}
        onOpenRecall={(b) => handleOpenRecallModal(b)}
        isOwner={owner}
      />

      {/* Modal Phát Lệnh Thu Hồi Khẩn Cấp Toàn Cục */}
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
    </div>
  );
}

export default QaTraceabilityWorkspace;
