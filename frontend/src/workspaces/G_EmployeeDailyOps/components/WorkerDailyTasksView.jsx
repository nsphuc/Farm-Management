import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Play,
  Camera,
  Clock,
  MapPin,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Filter,
  Search,
  Kanban,
  Check,
  Eye,
  X,
  Package,
  Users,
  GripVertical,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  ListFilter,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CompleteTaskModal } from './CompleteTaskModal';
import { hrService } from '@/services/modules/hrService';
import { formatDateTime, checkTaskOverdue } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

// Cấu hình nhãn loại nhiệm vụ chuẩn của nông trại
const TASK_TYPE_LABELS = {
  PLANTING: { label: 'Tưới nước / Cây trồng', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '🌱' },
  FERTILIZING: { label: 'Bón phân / Dinh dưỡng', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '🌿' },
  HARVESTING: { label: 'Thu hoạch sản phẩm', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: '🌾' },
  FEEDING: { label: 'Cho ăn / Chăm sóc đàn', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: '🐄' },
  MAINTENANCE: { label: 'Bảo trì máy móc / Thiết bị', color: 'bg-slate-200 text-slate-800 border-slate-300', icon: '🔧' },
  SANITATION: { label: 'Dọn cỏ / Quét rác / Vệ sinh', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: '🧹' },
};

// Cấu hình mức độ ưu tiên
const PRIORITY_CONFIG = {
  URGENT: { label: 'Khẩn cấp', color: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse', icon: '🚨' },
  HIGH: { label: 'Ưu tiên cao', color: 'bg-amber-100 text-amber-900 border-amber-300 font-bold', icon: '⚡' },
  MEDIUM: { label: 'Bình thường', color: 'bg-blue-50 text-blue-700 border-blue-200 font-medium', icon: '🔹' },
  LOW: { label: 'Thấp', color: 'bg-slate-100 text-slate-600 border-slate-200 font-normal', icon: '▫️' },
};

// 4 Cột Điều Phối Kanban dành cho Công Nhân Hiện Trường
const KANBAN_STAGES = [
  {
    id: 'TODO',
    title: 'Chờ Tiếp Nhận / Cần Làm',
    shortTitle: 'Cần Làm',
    description: 'Nhiệm vụ mới giao, cần nhận việc để bắt đầu',
    color: 'border-slate-300 bg-slate-50/70',
    headerBadge: 'bg-slate-200 text-slate-800',
    accentText: 'text-slate-800',
    stepNumber: '1',
  },
  {
    id: 'IN_PROGRESS',
    title: 'Đang Thực Hiện',
    shortTitle: 'Đang Làm',
    description: 'Đang trực tiếp triển khai tại thực địa',
    color: 'border-blue-300 bg-blue-50/40',
    headerBadge: 'bg-blue-200 text-blue-900',
    accentText: 'text-blue-800',
    stepNumber: '2',
  },
  {
    id: 'PENDING_REVIEW',
    title: 'Chờ Nghiệm Thu',
    shortTitle: 'Chờ Duyệt',
    description: 'Đã nộp ảnh báo cáo, chờ quản lý duyệt',
    color: 'border-amber-300 bg-amber-50/40',
    headerBadge: 'bg-amber-200 text-amber-900',
    accentText: 'text-amber-800',
    stepNumber: '3',
  },
  {
    id: 'DONE',
    title: 'Đã Hoàn Thành',
    shortTitle: 'Đã Xong',
    description: 'Đã được nghiệm thu đạt chuẩn',
    color: 'border-emerald-300 bg-emerald-50/40',
    headerBadge: 'bg-emerald-200 text-emerald-900',
    accentText: 'text-emerald-800',
    stepNumber: '4',
  },
];

export function WorkerDailyTasksView({
  tasks = [],
  currentEmployee = null,
  onRefresh,
  zones = [],
  shifts = [],
}) {
  const [completeTarget, setCompleteTarget] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null);

  // Kéo thả Kanban state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Bộ lọc & Tìm kiếm điều phối
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, PLANTING, FERTILIZING, HARVESTING, FEEDING, MAINTENANCE, SANITATION
  const [sourceFilter, setSourceFilter] = useState('ALL'); // ALL, ROUTINE, AD_HOC
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // ALL, URGENT, HIGH, MEDIUM, LOW
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false); // Lọc chỉ việc trễ hạn
  const [scopeFilter, setScopeFilter] = useState('MY_TASKS'); // MY_TASKS, ALL_VISIBLE
  const [activeMobileCol, setActiveMobileCol] = useState('ALL'); // ALL hoặc stage ID ('TODO', 'IN_PROGRESS', 'PENDING_REVIEW', 'DONE')
  const [viewMode, setViewMode] = useState('KANBAN'); // 'KANBAN' (bảng đa cột) hoặc 'MOBILE_FOCUS' (1 cột tập trung)

  // 1. Phân loại công việc được giao cho nhân viên hiện tại
  const myEmployeeId = currentEmployee?.id;
  const workerTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (scopeFilter === 'ALL_VISIBLE') return true;
      if (!myEmployeeId) return true;
      if (t.assignedToEmployeeId === myEmployeeId) return true;
      if (t.assignees && t.assignees.some((a) => a.employeeId === myEmployeeId)) return true;
      return false;
    });
  }, [tasks, myEmployeeId, scopeFilter]);

  // 2. Lọc theo tìm kiếm và bộ lọc đa chiều
  const filteredTasks = useMemo(() => {
    return workerTasks.filter((t) => {
      // Lọc việc quá hạn
      if (filterOverdueOnly && !checkTaskOverdue(t).isOverdue) {
        return false;
      }

      // Lọc theo tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = t.taskTitle?.toLowerCase().includes(query);
        const zoneMatch = t.zoneName?.toLowerCase().includes(query);
        const locMatch = t.locationName?.toLowerCase().includes(query);
        const notesMatch = t.completionNotes?.toLowerCase().includes(query);
        const materialMatch = t.materialName?.toLowerCase().includes(query);
        if (!titleMatch && !zoneMatch && !locMatch && !notesMatch && !materialMatch) {
          return false;
        }
      }

      // Lọc theo loại công việc
      if (typeFilter !== 'ALL' && t.taskType !== typeFilter) {
        return false;
      }

      // Lọc theo nguồn gốc: Cố định hàng ngày vs Phát sinh
      if (sourceFilter === 'ROUTINE') {
        const isRoutine = t.taskTitle && t.taskTitle.startsWith('[CỐ ĐỊNH HÀNG NGÀY]');
        if (!isRoutine) return false;
      } else if (sourceFilter === 'AD_HOC') {
        const isRoutine = t.taskTitle && t.taskTitle.startsWith('[CỐ ĐỊNH HÀNG NGÀY]');
        if (isRoutine) return false;
      }

      // Lọc theo mức ưu tiên
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [workerTasks, searchQuery, typeFilter, sourceFilter, priorityFilter, filterOverdueOnly]);

  // Thống kê nhanh tiến độ điều phối
  const todoCount = useMemo(() => workerTasks.filter((t) => t.status === 'TODO').length, [workerTasks]);
  const inProgressCount = useMemo(() => workerTasks.filter((t) => t.status === 'IN_PROGRESS').length, [workerTasks]);
  const reviewCount = useMemo(() => workerTasks.filter((t) => t.status === 'PENDING_REVIEW').length, [workerTasks]);
  const doneCount = useMemo(() => workerTasks.filter((t) => t.status === 'DONE').length, [workerTasks]);
  const overdueCount = useMemo(() => workerTasks.filter((t) => checkTaskOverdue(t).isOverdue).length, [workerTasks]);
  const totalCount = workerTasks.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Hành động 1: Tiếp nhận và bắt đầu làm (TODO -> IN_PROGRESS)
  const handleStartTask = async (taskOrId) => {
    try {
      const targetTask = typeof taskOrId === 'object' ? taskOrId : workerTasks.find((t) => t.id === taskOrId);
      const taskId = targetTask?.id || taskOrId;

      await hrService.updateTaskStatus(taskId, {
        status: 'IN_PROGRESS',
        completionNotes: targetTask?.completionNotes || null,
        photosJson: targetTask?.photosJson || null,
      });

      if (targetTask?.materialId && targetTask?.standardQuantity) {
        toast.success('Đã tiếp nhận việc! Hệ thống đã tạo Phiếu xuất kho FEFO và gửi tới Thủ kho để chuẩn bị vật tư.');
      } else {
        toast.success('Đã tiếp nhận việc và chuyển sang trạng thái ĐANG THỰC HIỆN!');
      }

      const { notifyDataChanged } = useActiveFarmStore.getState();
      notifyDataChanged?.('tasks');
      notifyDataChanged?.('inventory');
      onRefresh?.();
    } catch (err) {
      console.error('Start task error:', err);
      toast.error('Lỗi khi tiếp nhận nhiệm vụ: ' + (err.response?.data?.message || err.message));
    }
  };

  // Hành động 2: Kéo thả giữa các cột Kanban
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', String(task.id));
    setDraggedTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== stageId) {
      setDragOverCol(stageId);
    }
  };

  const handleDrop = async (e, targetStageId) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskIdStr = e.dataTransfer.getData('text/plain') || String(draggedTaskId);
    const taskId = Number(taskIdStr);
    const task = workerTasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === targetStageId) {
      return; // Cùng cột, không làm gì
    }

    // Luồng 1: Từ TODO kéo sang IN_PROGRESS -> Bắt đầu việc
    if (task.status === 'TODO' && targetStageId === 'IN_PROGRESS') {
      await handleStartTask(task);
      return;
    }

    // Luồng 2: Từ IN_PROGRESS kéo sang PENDING_REVIEW -> Mở modal chụp ảnh & nộp báo cáo
    if (task.status === 'IN_PROGRESS' && targetStageId === 'PENDING_REVIEW') {
      setCompleteTarget(task);
      setIsCompleteModalOpen(true);
      return;
    }

    // Luồng 3: Từ TODO nhảy cóc sang PENDING_REVIEW hoặc DONE -> Nhắc nhở quy trình
    if (task.status === 'TODO' && (targetStageId === 'PENDING_REVIEW' || targetStageId === 'DONE')) {
      toast.warning('Vui lòng tiếp nhận việc ("Đang làm") và thực hiện tại hiện trường trước khi gửi nghiệm thu!');
      return;
    }

    // Luồng 4: Từ IN_PROGRESS kéo thẳng sang DONE -> Bị chặn vì công nhân không được tự duyệt nghiệm thu
    if (task.status === 'IN_PROGRESS' && targetStageId === 'DONE') {
      toast.warning('Nhiệm vụ cần nộp ảnh hiện trường sang "Chờ nghiệm thu" để Quản lý / Kỹ sư kiểm tra trước khi hoàn thành!');
      return;
    }

    // Luồng 5: Kéo ngược từ IN_PROGRESS về TODO
    if (task.status === 'IN_PROGRESS' && targetStageId === 'TODO') {
      if (window.confirm(`Bạn có chắc muốn trả lại công việc "${task.taskTitle}" về trạng thái Chưa Nhận Việc?`)) {
        try {
          await hrService.updateTaskStatus(task.id, {
            status: 'TODO',
            completionNotes: task.completionNotes,
            photosJson: task.photosJson,
          });
          toast.info('Đã hoàn trả công việc về danh sách Chờ Tiếp Nhận');
          onRefresh?.();
        } catch (err) {
          toast.error('Không thể hoàn tác nhiệm vụ: ' + (err.response?.data?.message || err.message));
        }
      }
      return;
    }

    toast.info('Thao tác kéo thả không khả dụng cho bước chuyển trạng thái này.');
  };

  // Mở modal xem chi tiết nhiệm vụ
  const handleOpenDetail = (task) => {
    setDetailTarget(task);
    setIsDetailModalOpen(true);
  };

  // Giải mã photosJson của nhiệm vụ để hiển thị
  const getTaskPhotos = (task) => {
    if (!task?.photosJson) return [];
    try {
      const parsed = typeof task.photosJson === 'string' ? JSON.parse(task.photosJson) : task.photosJson;
      return Array.isArray(parsed) ? parsed : [task.photosJson];
    } catch (e) {
      return [task.photosJson];
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. HEADER BÀN ĐIỀU PHỐI KANBAN HIỆN TRƯỜNG - TỐI ƯU ÁNH SÁNG & TƯƠNG PHẢN CAO */}
      <div className="rounded-2xl border border-emerald-900/30 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-5 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300 border border-emerald-400/30 tracking-wide uppercase">
              <Kanban className="h-3.5 w-3.5 text-emerald-400" />
              <span>Bảng Điều Phối Kanban Hiện Trường</span>
              <span className="text-emerald-400/60">•</span>
              <span className="text-emerald-200">Quy Trình 4 Giai Đoạn</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Tiếp Nhận & Điều Phối Công Việc Của Tôi
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed font-medium max-w-2xl">
              Nhận việc trực tiếp từ Ban quản lý • Kéo thả hoặc bấm nút để chuyển trạng thái • Báo cáo ảnh thực tế & chờ nghiệm thu
            </p>
          </div>

          {/* Khối Đo Tiến Độ Hoàn Thành Trong Ngày */}
          <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3.5 border border-white/10 shrink-0">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{doneCount}</span>
                <span className="text-xs text-slate-300 font-bold">/ {totalCount} việc</span>
                <span className="text-xs font-black text-emerald-400 ml-1">({progressPct}%)</span>
              </div>
              <div className="w-36 bg-slate-800 rounded-full h-2 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Thẻ 4 Giai Đoạn & Đếm Nhanh (Click để lọc nhanh trên Mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/15">
          {KANBAN_STAGES.map((stage) => {
            let count = 0;
            if (stage.id === 'TODO') count = todoCount;
            else if (stage.id === 'IN_PROGRESS') count = inProgressCount;
            else if (stage.id === 'PENDING_REVIEW') count = reviewCount;
            else if (stage.id === 'DONE') count = doneCount;

            const isCurrentActive = activeMobileCol === stage.id;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => {
                  if (activeMobileCol === stage.id) {
                    setActiveMobileCol('ALL');
                  } else {
                    setActiveMobileCol(stage.id);
                  }
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all border text-left ${
                  isCurrentActive
                    ? 'bg-white text-slate-900 border-white shadow-lg ring-2 ring-emerald-400 scale-[1.02]'
                    : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
                }`}
              >
                <div className="min-w-0 pr-1">
                  <div className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                    isCurrentActive ? 'text-slate-600' : 'text-emerald-300'
                  }`}>
                    Giai đoạn {stage.stepNumber}
                  </div>
                  <div className="text-xs font-black truncate">{stage.shortTitle}</div>
                </div>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shrink-0 ${
                  isCurrentActive ? 'bg-slate-900 text-white' : 'bg-black/30 text-white'
                }`}>
                  {count}
                </div>
              </button>
            );
          })}
        </div>

        {/* CẢNH BÁO TIẾN ĐỘ THỜI GIAN THỰC KHI CÓ VIỆC QUÁ HẠN */}
        {overdueCount > 0 && (
          <div className="mt-4 p-3.5 bg-rose-500/25 border border-rose-400/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-100 animate-pulse shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white shrink-0 shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <div className="text-white font-black text-sm tracking-tight flex items-center gap-1.5">
                  <span>🚨 CẢNH BÁO TIẾN ĐỘ: CÓ {overdueCount} NHIỆM VỤ ĐÃ QUÁ HẠN!</span>
                </div>
                <p className="text-rose-200 text-[11px] mt-0.5">
                  Đã quá giờ quy định mà chưa hoàn thành. Vui lòng khẩn trương tiếp nhận và chụp ảnh báo cáo nghiệm thu ngay.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilterOverdueOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all shadow-sm ${
                filterOverdueOnly
                  ? 'bg-white text-rose-900 ring-2 ring-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {filterOverdueOnly ? '✕ Bỏ Lọc Quá Hạn' : '🚨 Xem Việc Quá Hạn Ngay'}
            </button>
          </div>
        )}
      </div>

      {/* 2. THANH CÔNG CỤ ĐIỀU PHỐI, TÌM KIẾM & BỘ LỌC ĐA NĂNG */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên việc, phân khu, vị trí, vật tư..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Các bộ lọc điều phối */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc loại việc: Cố định vs Phát sinh */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSourceFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  sourceFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất Cả Việc
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('ROUTINE')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  sourceFilter === 'ROUTINE'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RotateCcw className="h-3 w-3" />
                <span>Cố Định</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('AD_HOC')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  sourceFilter === 'AD_HOC'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Phát Sinh</span>
              </button>
            </div>

            {/* Lọc loại công việc (Tưới, Bón phân, Thu hoạch...) */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">Mọi Loại Công Việc</option>
              <option value="PLANTING">🌱 Tưới Nước / Cây Trồng</option>
              <option value="FERTILIZING">🌿 Bón Phân / Dinh Dưỡng</option>
              <option value="HARVESTING">🌾 Thu Hoạch Nông Sản</option>
              <option value="FEEDING">🐄 Cho Ăn / Chăm Sóc Đàn</option>
              <option value="MAINTENANCE">🔧 Bảo Trì Thiết Bị</option>
              <option value="SANITATION">🧹 Vệ Sinh / Dọn Cỏ</option>
            </select>

            {/* Lọc độ ưu tiên */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">Mọi Độ Ưu Tiên</option>
              <option value="URGENT">🚨 Khẩn Cấp</option>
              <option value="HIGH">⚡ Ưu Tiên Cao</option>
              <option value="MEDIUM">🔹 Bình Thường</option>
              <option value="LOW">▫️ Thấp</option>
            </select>

            {/* Nút lọc việc quá hạn */}
            <button
              type="button"
              onClick={() => setFilterOverdueOnly((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 ${
                filterOverdueOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-400'
                  : overdueCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 animate-pulse'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
              title="Lọc các nhiệm vụ đã quá thời hạn"
            >
              <AlertTriangle className={`h-3.5 w-3.5 ${filterOverdueOnly ? 'text-white' : overdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Quá Hạn ({overdueCount})</span>
            </button>

            {/* Chế độ xem: Bảng Kanban 4 Cột vs Chế độ Tập Trung */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('KANBAN')}
                className={`p-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'KANBAN'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Hiển thị bảng 4 cột song song"
              >
                <Kanban className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('MOBILE_FOCUS')}
                className={`p-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'MOBILE_FOCUS'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Hiển thị tập trung 1 cột (tối ưu điện thoại)"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Thanh chuyển cột nhanh khi chọn chế độ Tập Trung hoặc trên màn hình nhỏ */}
        {(viewMode === 'MOBILE_FOCUS' || activeMobileCol !== 'ALL') && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">Hiển thị cột:</span>
            <button
              type="button"
              onClick={() => setActiveMobileCol('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors ${
                activeMobileCol === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Toàn Bộ 4 Cột ({workerTasks.length})
            </button>
            {KANBAN_STAGES.map((s) => {
              const count = workerTasks.filter((t) => t.status === s.id).length;
              const isActive = activeMobileCol === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveMobileCol(s.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{s.shortTitle}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. BẢNG ĐIỀU PHỐI KANBAN (LƯỚI CÁC CỘT) */}
      <div
        className={`grid gap-4 ${
          viewMode === 'MOBILE_FOCUS' || activeMobileCol !== 'ALL'
            ? 'grid-cols-1'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {KANBAN_STAGES.filter((stage) => {
          if (activeMobileCol === 'ALL') return true;
          return stage.id === activeMobileCol;
        }).map((stage) => {
          const colTasks = filteredTasks.filter((t) => t.status === stage.id);
          const isDragOver = dragOverCol === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`rounded-2xl border ${stage.color} p-3.5 flex flex-col transition-all min-h-[520px] ${
                isDragOver ? 'ring-2 ring-emerald-500 bg-emerald-50/70 border-emerald-400 scale-[1.01]' : ''
              }`}
            >
              {/* Header Cột */}
              <div className="pb-3 mb-3 border-b border-slate-200/80">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-black">
                      {stage.stepNumber}
                    </span>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${stage.accentText}`}>
                      {stage.title}
                    </h3>
                  </div>
                  <span className={`flex h-6 px-2 items-center justify-center rounded-full text-xs font-black shadow-2xs ${stage.headerBadge}`}>
                    {colTasks.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight font-medium">
                  {stage.description}
                </p>
              </div>

              {/* Danh sách nhiệm vụ trong Cột */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-1.5">
                    <CheckCircle2 className="h-6 w-6 text-slate-300" />
                    <p className="text-xs font-bold text-slate-500">Chưa có nhiệm vụ</p>
                    <p className="text-[11px] text-slate-400">
                      {stage.id === 'TODO' && 'Hiện tại không có việc mới chờ tiếp nhận'}
                      {stage.id === 'IN_PROGRESS' && 'Kéo việc từ "Cần làm" sang đây để bắt đầu'}
                      {stage.id === 'PENDING_REVIEW' && 'Nộp báo cáo ảnh từ việc đang làm để gửi nghiệm thu'}
                      {stage.id === 'DONE' && 'Các công việc hoàn thành đạt chuẩn sẽ xuất hiện ở đây'}
                    </p>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isRoutine = task.taskTitle && task.taskTitle.startsWith('[CỐ ĐỊNH HÀNG NGÀY]');
                    const cleanTitle = task.taskTitle
                      ? task.taskTitle.replace(/^\[(CỐ ĐỊNH HÀNG NGÀY|PHÁT SINH)\]\s*/i, '')
                      : 'Nhiệm vụ nông nghiệp';

                    const typeBadge = TASK_TYPE_LABELS[task.taskType] || {
                      label: task.taskType || 'Nhiệm vụ',
                      color: 'bg-slate-100 text-slate-800 border-slate-200',
                      icon: '📋',
                    };

                    const priorityBadge = PRIORITY_CONFIG[task.priority] || {
                      label: task.priority || 'Bình thường',
                      color: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
                      icon: '▫️',
                    };

                    const isBeingDragged = draggedTaskId === task.id;
                    const assignees = task.assignees || [];
                    const photos = getTaskPhotos(task);
                    const { isOverdue, overdueText } = checkTaskOverdue(task);

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        className={`rounded-2xl border p-3.5 shadow-2xs space-y-3 transition-all cursor-grab active:cursor-grabbing ${
                          isOverdue
                            ? 'border-rose-400 bg-rose-50/25 ring-1 ring-rose-400 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                        } ${isBeingDragged ? 'opacity-40 scale-95 border-emerald-400' : ''}`}
                      >
                        {/* THÔNG BÁO QUÁ HẠN KHẨN CẤP */}
                        {isOverdue && (
                          <div className="w-full rounded-xl bg-rose-600 text-white px-2.5 py-1 text-[11px] font-black flex items-center justify-between gap-1.5 shadow-xs animate-pulse">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>🚨 ĐÃ QUÁ HẠN ({overdueText})</span>
                            </span>
                            <span className="text-[9px] font-semibold bg-rose-800 px-1.5 py-0.2 rounded">Ưu tiên xử lý</span>
                          </div>
                        )}

                        {/* Hàng 1: Phân loại việc & Độ ưu tiên + Nút xem chi tiết */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300 hover:text-slate-500 cursor-grab" title="Kéo thả thẻ nhiệm vụ">
                              <GripVertical className="h-3.5 w-3.5" />
                            </span>

                            {isRoutine ? (
                              <span className="rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black px-1.5 py-0.5 flex items-center gap-1">
                                <RotateCcw className="h-2.5 w-2.5" />
                                CỐ ĐỊNH
                              </span>
                            ) : (
                              <span className="rounded-md bg-blue-100 text-blue-900 border border-blue-300 text-[9px] font-black px-1.5 py-0.5 flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                                PHÁT SINH
                              </span>
                            )}

                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${typeBadge.color}`}>
                              <span>{typeBadge.icon}</span> {typeBadge.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] border ${priorityBadge.color}`}>
                              <span>{priorityBadge.icon}</span> {priorityBadge.label}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(task);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Xem chi tiết nhiệm vụ"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Hàng 2: Tiêu đề công việc */}
                        <div>
                          <h4
                            onClick={() => handleOpenDetail(task)}
                            className="text-xs sm:text-sm font-black text-slate-900 leading-snug hover:text-emerald-700 cursor-pointer transition-colors"
                          >
                            {cleanTitle}
                          </h4>
                          {task.completionNotes && (
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                              {task.completionNotes}
                            </p>
                          )}
                        </div>

                        {/* Hàng 3: Vị trí & Khung giờ */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800 truncate">
                              {task.zoneName || 'Toàn trang trại'}
                              {task.locationName && (
                                <span className="text-emerald-700 font-bold"> • {task.locationName}</span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            {(task.startTime || task.endTime) && (
                              <div className="flex items-center gap-1 font-mono text-[11px] text-amber-900 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                                <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                                <span>{task.startTime?.substring(0, 5) || '--:--'} - {task.endTime?.substring(0, 5) || '--:--'}</span>
                              </div>
                            )}

                            {task.deadline && (
                              <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                                <span>Hạn: {formatDateTime(task.deadline)}</span>
                              </div>
                            )}
                          </div>

                          {/* Vật tư xuất kho kèm theo (nếu có) */}
                          {(task.materialName || (task.standardQuantity && task.materialId)) && (
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-1 rounded-xl">
                              <Package className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">
                                Vật tư: {task.materialName || 'Vật tư định mức'}{' '}
                                <strong>({task.standardQuantity || ''} {task.unit || ''})</strong>
                              </span>
                            </div>
                          )}

                          {/* Đồng đội cùng làm việc (nếu có tổ công tác) */}
                          {assignees.length > 1 && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                              <Users className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="font-medium">
                                Tổ {assignees.length} người: {assignees.map((a) => a.employeeName).join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Preview ảnh hiện trường nếu đã nộp (ở cột PENDING_REVIEW hoặc DONE) */}
                          {photos.length > 0 && (
                            <div className="pt-1.5 flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <Camera className="h-3 w-3 text-emerald-600" />
                                {photos.length} ảnh báo cáo:
                              </span>
                              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                                {photos.map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt={`Ảnh báo cáo ${idx + 1}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setZoomPhotoUrl(url);
                                    }}
                                    className="h-8 w-8 rounded-lg object-cover border border-slate-200 cursor-zoom-in hover:scale-105 transition-transform"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Hàng 4: KHỐI NÚT HÀNH ĐỘNG ĐIỀU PHỐI (TOUCH-FRIENDLY > 44px) */}
                        <div className="pt-2 border-t border-slate-100">
                          {/* 1. NÚT TIẾP NHẬN & BẮT ĐẦU CHO CỘT TODO */}
                          {stage.id === 'TODO' && (
                            <Button
                              type="button"
                              variant={isOverdue ? 'danger' : 'primary'}
                              size="md"
                              className={`w-full py-3 text-xs sm:text-sm font-black shadow-md text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98 ${
                                isOverdue
                                  ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                              icon={isOverdue ? <AlertTriangle className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                              onClick={() => handleStartTask(task)}
                            >
                              {isOverdue ? '🚨 TIẾP NHẬN NGAY (QUÁ HẠN)' : '▶ TIẾP NHẬN & BẮT ĐẦU'}
                            </Button>
                          )}

                          {/* 2. NÚT CHỤP ẢNH BÁO CÁO CHO CỘT IN_PROGRESS */}
                          {stage.id === 'IN_PROGRESS' && (
                            <Button
                              type="button"
                              variant={isOverdue ? 'danger' : 'primary'}
                              size="md"
                              className={`w-full py-3 text-xs sm:text-sm font-black shadow-md text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98 ${
                                isOverdue
                                  ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                              icon={isOverdue ? <AlertTriangle className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                              onClick={() => {
                                setCompleteTarget(task);
                                setIsCompleteModalOpen(true);
                              }}
                            >
                              {isOverdue ? '🚨 BÁO CÁO NGAY (QUÁ HẠN)' : '📸 CHỤP ẢNH & BÁO CÁO XONG'}
                            </Button>
                          )}

                          {/* 3. TRẠNG THÁI CHỜ DUYỆT NGHIỆM THU CHO CỘT PENDING_REVIEW */}
                          {stage.id === 'PENDING_REVIEW' && (
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(task)}
                              className="w-full py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors text-center text-xs font-bold text-amber-900 flex items-center justify-center gap-2"
                            >
                              <Clock className="h-4 w-4 text-amber-600 shrink-0 animate-spin" />
                              <span>Đã nộp • Chờ Quản lý nghiệm thu</span>
                            </button>
                          )}

                          {/* 4. TRẠNG THÁI ĐÃ HOÀN THÀNH CHO CỘT DONE */}
                          {stage.id === 'DONE' && (
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(task)}
                              className="w-full py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>✓ Đã nghiệm thu đạt chuẩn</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MODAL BÁO CÁO HOÀN THÀNH (CAMERA + TẢI ẢNH HIỆN TRƯỜNG + GHI CHÚ) */}
      <CompleteTaskModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onSuccess={() => {
          setIsCompleteModalOpen(false);
          setCompleteTarget(null);
          onRefresh?.();
        }}
        task={completeTarget}
      />

      {/* 5. MODAL XEM CHI TIẾT NHIỆM VỤ ĐIỀU PHỐI (TASK DETAIL MODAL) */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailTarget(null);
        }}
        title="Chi Tiết Nhiệm Vụ Hiện Trường"
        subtitle={detailTarget?.taskTitle || ''}
        size="lg"
      >
        {detailTarget && (
          <div className="space-y-4 text-xs">
            {/* Header tóm tắt */}
            <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                  TASK_TYPE_LABELS[detailTarget.taskType]?.color || 'bg-slate-100'
                }`}>
                  {TASK_TYPE_LABELS[detailTarget.taskType]?.label || detailTarget.taskType}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  PRIORITY_CONFIG[detailTarget.priority]?.color || 'bg-slate-100'
                }`}>
                  {PRIORITY_CONFIG[detailTarget.priority]?.label || detailTarget.priority}
                </span>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                detailTarget.status === 'TODO'
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : detailTarget.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : detailTarget.status === 'PENDING_REVIEW'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                {detailTarget.status === 'TODO' && 'CẦN LÀM'}
                {detailTarget.status === 'IN_PROGRESS' && 'ĐANG THỰC HIỆN'}
                {detailTarget.status === 'PENDING_REVIEW' && 'CHỜ NGHIỆM THU'}
                {detailTarget.status === 'DONE' && 'ĐÃ HOÀN THÀNH'}
              </span>
            </div>

            {/* Chi tiết nội dung công việc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  📍 Địa Điểm & Phân Khu
                </div>
                <div className="text-sm font-black text-slate-900">
                  {detailTarget.zoneName || 'Toàn trang trại'}
                </div>
                {detailTarget.locationName && (
                  <div className="text-xs text-emerald-700 font-bold">
                    Vị trí chi tiết: {detailTarget.locationName}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ⏰ Thời Gian Thực Hiện
                </div>
                <div className="font-mono text-xs text-slate-800">
                  Khung giờ: {detailTarget.startTime?.substring(0, 5) || '--:--'} - {detailTarget.endTime?.substring(0, 5) || '--:--'}
                </div>
                {detailTarget.deadline && (
                  <div className="font-mono text-xs text-amber-700 font-bold">
                    Hạn chót: {formatDateTime(detailTarget.deadline)}
                  </div>
                )}
              </div>
            </div>

            {/* Hướng dẫn kỹ thuật & Ghi chú */}
            {detailTarget.completionNotes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  📝 Hướng Dẫn & Ghi Chú Công Việc
                </div>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {detailTarget.completionNotes}
                </p>
              </div>
            )}

            {/* Vật tư cần chuẩn bị */}
            {(detailTarget.materialName || detailTarget.standardQuantity) && (
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1 text-blue-900">
                <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-blue-600" />
                  <span>Vật Tư Nông Nghiệp Đi Kèm</span>
                </div>
                <div className="text-xs font-semibold">
                  Tên vật tư: <strong>{detailTarget.materialName || 'Theo định mức'}</strong> • Số lượng định mức:{' '}
                  <strong>{detailTarget.standardQuantity || '--'} {detailTarget.unit || ''}</strong>
                </div>
              </div>
            )}

            {/* Báo cáo ảnh thực tế đã nộp */}
            {getTaskPhotos(detailTarget).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Hình Ảnh Hiện Trường Đã Nộp ({getTaskPhotos(detailTarget).length} ảnh)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {getTaskPhotos(detailTarget).map((photoUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-square cursor-zoom-in"
                      onClick={() => setZoomPhotoUrl(photoUrl)}
                    >
                      <img
                        src={photoUrl}
                        alt={`Ảnh báo cáo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="h-5 w-5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chân Modal: Nút hành động */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setDetailTarget(null);
                }}
              >
                Đóng
              </Button>

              <div className="flex items-center gap-2">
                {detailTarget.status === 'TODO' && (
                  <Button
                    variant="primary"
                    className="bg-blue-600 hover:bg-blue-700 font-bold"
                    icon={<Play className="h-4 w-4" />}
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleStartTask(detailTarget);
                    }}
                  >
                    Tiếp Nhận Nhiệm Vụ
                  </Button>
                )}

                {detailTarget.status === 'IN_PROGRESS' && (
                  <Button
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                    icon={<Camera className="h-4 w-4" />}
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setCompleteTarget(detailTarget);
                      setIsCompleteModalOpen(true);
                    }}
                  >
                    Chụp Ảnh Báo Cáo
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. LIGHTBOX PHÓNG TO ẢNH BÁO CÁO HIỆN TRƯỜNG */}
      {zoomPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setZoomPhotoUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomPhotoUrl}
              alt="Ảnh hiện trường phóng to"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2 text-sm font-bold flex items-center gap-1"
            >
              <X className="h-5 w-5" /> Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkerDailyTasksView;
