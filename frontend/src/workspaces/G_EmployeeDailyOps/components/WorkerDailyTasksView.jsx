import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CompleteTaskModal } from './CompleteTaskModal';
import { hrService } from '@/services/modules/hrService';
import { formatDateTime } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';

const TASK_TYPE_LABELS = {
  PLANTING: { label: 'Tưới nước / Cây trồng', color: 'bg-emerald-100 text-emerald-800' },
  FERTILIZING: { label: 'Bón phân / Dinh dưỡng', color: 'bg-blue-100 text-blue-800' },
  HARVESTING: { label: 'Thu hoạch', color: 'bg-amber-100 text-amber-800' },
  FEEDING: { label: 'Cho ăn / Chăm sóc đàn', color: 'bg-purple-100 text-purple-800' },
  MAINTENANCE: { label: 'Bảo trì máy / Thiết bị', color: 'bg-slate-200 text-slate-800' },
  SANITATION: { label: 'Dọn cỏ / Quét rác / Vệ sinh', color: 'bg-rose-100 text-rose-800' },
};

export function WorkerDailyTasksView({
  tasks = [],
  currentEmployee = null,
  onRefresh,
}) {
  const [completeTarget, setCompleteTarget] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, DONE

  // Lọc chỉ những công việc mà nhân viên này được giao
  const myEmployeeId = currentEmployee?.id;
  const myTasks = tasks.filter((t) => {
    if (!myEmployeeId) return true;
    if (t.assignedToEmployeeId === myEmployeeId) return true;
    if (t.assignees && t.assignees.some((a) => a.employeeId === myEmployeeId)) return true;
    return false;
  });

  const filteredTasks = myTasks.filter((t) => {
    if (filterStatus === 'PENDING') return t.status === 'TODO' || t.status === 'IN_PROGRESS';
    if (filterStatus === 'REVIEW') return t.status === 'PENDING_REVIEW';
    if (filterStatus === 'DONE') return t.status === 'DONE';
    return true;
  });

  // Bước 1: Bắt đầu làm (TODO -> IN_PROGRESS)
  const handleStartTask = async (taskId) => {
    try {
      await hrService.updateTaskStatus(taskId, {
        status: 'IN_PROGRESS',
        completionNotes: null,
        photosJson: null,
      });
      onRefresh?.();
    } catch (err) {
      console.error('Start task error:', err);
      toast.error('Không thể nhận việc: ' + (err.response?.data?.message || err.message));
    }
  };

  const todoCount = myTasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = myTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const reviewCount = myTasks.filter((t) => t.status === 'PENDING_REVIEW').length;
  const doneCount = myTasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="space-y-4">
      {/* Thẻ Header Tóm Tắt Dành Cho Nhân Viên Hiện Trường */}
      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-emerald-700 to-teal-800 p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <span className="rounded-full bg-emerald-500/30 text-emerald-100 text-[11px] font-bold px-2.5 py-0.5 border border-emerald-400/30">
              📱 Giao Diện Công Nhân Hiện Trường (Role 6A)
            </span>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">
              Công Việc Của Tôi Hôm Nay
            </h2>
            <p className="text-xs text-emerald-100/80">
              Nhận việc cố định hàng ngày và việc phát sinh từ Trưởng kỹ thuật & Thủ kho
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="text-right">
              <div className="text-2xl font-black">{doneCount} / {myTasks.length}</div>
              <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Đã hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Thanh đếm nhanh trạng thái */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-emerald-600/40 text-center">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`py-1.5 px-2 rounded-xl transition-all ${
              filterStatus === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <div className="text-xs font-black">{myTasks.length}</div>
            <div className="text-[10px] truncate">Tất cả</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('PENDING')}
            className={`py-1.5 px-2 rounded-xl transition-all ${
              filterStatus === 'PENDING' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <div className="text-xs font-black">{todoCount + inProgressCount}</div>
            <div className="text-[10px] truncate">Cần làm</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('REVIEW')}
            className={`py-1.5 px-2 rounded-xl transition-all ${
              filterStatus === 'REVIEW' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <div className="text-xs font-black text-amber-300">{reviewCount}</div>
            <div className="text-[10px] truncate">Chờ duyệt</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('DONE')}
            className={`py-1.5 px-2 rounded-xl transition-all ${
              filterStatus === 'DONE' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <div className="text-xs font-black text-emerald-300">{doneCount}</div>
            <div className="text-[10px] truncate">Xong</div>
          </button>
        </div>
      </div>

      {/* Danh sách các thẻ nhiệm vụ dạng Mobile-First */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Hiện không có công việc nào cần xử lý</p>
          <p className="text-xs text-slate-400">
            Bạn đã hoàn tất tất cả các công việc được giao hôm nay!
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredTasks.map((task) => {
            const isRoutine = task.taskTitle && task.taskTitle.startsWith('[CỐ ĐỊNH HÀNG NGÀY]');
            const cleanTitle = task.taskTitle
              ? task.taskTitle.replace(/^\[(CỐ ĐỊNH HÀNG NGÀY|PHÁT SINH)\]\s*/i, '')
              : 'Nhiệm vụ';

            const typeBadge = TASK_TYPE_LABELS[task.taskType] || {
              label: task.taskType,
              color: 'bg-slate-100 text-slate-700',
            };

            return (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5 transition-all hover:border-slate-300"
              >
                {/* Header Card: Badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {isRoutine ? (
                      <span className="rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" />
                        CỐ ĐỊNH HÀNG NGÀY
                      </span>
                    ) : (
                      <span className="rounded-md bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-0.5 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        VIỆC PHÁT SINH
                      </span>
                    )}

                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${typeBadge.color}`}>
                      {typeBadge.label}
                    </span>
                  </div>

                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      task.status === 'TODO'
                        ? 'bg-slate-100 text-slate-700'
                        : task.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : task.status === 'PENDING_REVIEW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {task.status === 'TODO'
                      ? 'CẦN LÀM'
                      : task.status === 'IN_PROGRESS'
                      ? 'ĐANG LÀM'
                      : task.status === 'PENDING_REVIEW'
                      ? 'CHỜ DUYỆT'
                      : 'ĐÃ XONG'}
                  </span>
                </div>

                {/* Tiêu đề & Thông tin khu vực */}
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {cleanTitle}
                  </h3>
                  {task.completionNotes && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {task.completionNotes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{task.zoneName || 'Toàn trang trại'}</span>
                  </div>

                  {task.deadline && (
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span>Hạn: {formatDateTime(task.deadline)}</span>
                    </div>
                  )}
                </div>

                {/* KHỐI NÚT HÀNH ĐỘNG 2 BƯỚC (MOBILE-FIRST) */}
                <div className="pt-2">
                  {/* BƯỚC 1: Bắt đầu làm */}
                  {task.status === 'TODO' && (
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="w-full py-3.5 text-sm font-black bg-blue-600 hover:bg-blue-700 shadow-md text-white rounded-xl flex items-center justify-center gap-2"
                      icon={<Play className="h-4 w-4 fill-white" />}
                      onClick={() => handleStartTask(task.id)}
                    >
                      ▶️ BẮT ĐẦU LÀM
                    </Button>
                  )}

                  {/* BƯỚC 2: Khi làm xong -> Chụp ảnh báo cáo */}
                  {task.status === 'IN_PROGRESS' && (
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="w-full py-3.5 text-sm font-black bg-emerald-600 hover:bg-emerald-700 shadow-md text-white rounded-xl flex items-center justify-center gap-2"
                      icon={<Camera className="h-4 w-4" />}
                      onClick={() => {
                        setCompleteTarget(task);
                        setIsCompleteModalOpen(true);
                      }}
                    >
                      📸 CHỤP ẢNH BÁO CÁO HOÀN THÀNH
                    </Button>
                  )}

                  {/* CHỜ DUYỆT */}
                  {task.status === 'PENDING_REVIEW' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-center text-xs font-bold text-amber-900 flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Đã nộp báo cáo • Đang chờ Trưởng khu / Thủ kho nghiệm thu</span>
                    </div>
                  )}

                  {/* HOÀN THÀNH */}
                  {task.status === 'DONE' && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>✓ Đã được Quản lý duyệt nghiệm thu hoàn thành</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Báo Cáo Hoàn Thành (Chụp ảnh + Ghi chú) */}
      <CompleteTaskModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onSuccess={onRefresh}
        task={completeTarget}
      />
    </div>
  );
}

export default WorkerDailyTasksView;
