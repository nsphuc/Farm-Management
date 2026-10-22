import React, { useState } from 'react';
import {
  CheckSquare,
  Play,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Users,
  Plus,
  Filter,
  Eye,
  Sparkles,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { CompleteTaskModal } from './CompleteTaskModal';
import { CreateTaskModal } from './CreateTaskModal';
import { ReviewTaskModal } from './ReviewTaskModal';
import { hrService } from '@/services/modules/hrService';
import { formatDateTime } from '@/utils/formatters';

const KANBAN_COLUMNS = [
  { id: 'TODO', label: 'Cần Làm (TODO)', color: 'border-slate-300 bg-slate-50/70', headerColor: 'text-slate-700' },
  { id: 'IN_PROGRESS', label: 'Đang Thực Hiện (IN_PROGRESS)', color: 'border-blue-300 bg-blue-50/40', headerColor: 'text-blue-700' },
  { id: 'PENDING_REVIEW', label: 'Chờ Nghiệm Thu (PENDING_REVIEW)', color: 'border-amber-300 bg-amber-50/40', headerColor: 'text-amber-700' },
  { id: 'DONE', label: 'Hoàn Thành (DONE)', color: 'border-emerald-300 bg-emerald-50/40', headerColor: 'text-emerald-700' },
];

const TASK_TYPE_LABELS = {
  PLANTING: { label: 'Gieo Trồng / Tưới', color: 'bg-emerald-100 text-emerald-800' },
  FERTILIZING: { label: 'Bón Phân', color: 'bg-blue-100 text-blue-800' },
  HARVESTING: { label: 'Thu Hoạch', color: 'bg-amber-100 text-amber-800' },
  FEEDING: { label: 'Cho Ăn', color: 'bg-purple-100 text-purple-800' },
  MAINTENANCE: { label: 'Bảo Trì', color: 'bg-slate-200 text-slate-800' },
  SANITATION: { label: 'Dọn Dẹp / Vệ Sinh', color: 'bg-rose-100 text-rose-800' },
};

const PRIORITY_BADGES = {
  LOW: { label: 'Thấp', color: 'bg-slate-100 text-slate-600' },
  MEDIUM: { label: 'Bình thường', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  HIGH: { label: 'Ưu tiên cao', color: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' },
  URGENT: { label: 'Khẩn cấp', color: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse' },
};

export function PersonalTaskKanban({
  tasks = [],
  farmId,
  zones = [],
  employees = [],
  isTechnicalLead = false,
  isWarehouseKeeper = false,
  canManageTasks = true,
  onRefresh,
}) {
  const [completeTarget, setCompleteTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialTaskData, setInitialTaskData] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, ROUTINE, AD_HOC

  // 1. Chuyển task sang IN_PROGRESS (Dành cho công nhân bắt đầu làm việc)
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
      alert('Không thể nhận việc: ' + (err.response?.data?.message || err.message));
    }
  };

  // 2. Quản lý / Kỹ thuật / Thủ kho: Xác nhận hoàn thành trực tiếp cho nhân viên KHÔNG có tài khoản (Role 6B)
  const handleDirectConfirmDoneNoAccount = async (task) => {
    const cleanTitle = task.taskTitle.replace(/^\[(CỐ ĐỊNH HÀNG NGÀY|PHÁT SINH)\]\s*/i, '');
    if (
      !window.confirm(
        `Xác nhận nhân viên đã làm xong thực tế công việc:\n"${cleanTitle}"?\n(Trạng thái sẽ chuyển thẳng sang DONE mà không cần ảnh báo cáo App).`
      )
    ) {
      return;
    }

    try {
      await hrService.updateTaskStatus(task.id, {
        status: 'DONE',
        completionNotes: task.completionNotes
          ? `${task.completionNotes} [Xác nhận hoàn thành thực địa bởi Quản lý/Thủ kho]`
          : 'Xác nhận hoàn thành thực địa bởi Quản lý/Thủ kho sau kiểm tra trực tiếp',
        photosJson: task.photosJson,
      });
      onRefresh?.();
    } catch (err) {
      console.error('Confirm done error:', err);
      alert('Lỗi xác nhận hoàn thành: ' + (err.response?.data?.message || err.message));
    }
  };

  // 3. Mở modal giao việc phát sinh nhanh theo gợi ý Role
  const handleQuickAdHoc = (title, type, priority, desc) => {
    setInitialTaskData({
      taskTitle: `[PHÁT SINH] ${title}`,
      taskType: type,
      priority: priority,
      completionNotes: desc,
      deadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
      zoneId: zones[0]?.id ? String(zones[0].id) : '',
    });
    setIsCreateModalOpen(true);
  };

  // Lọc nhiệm vụ hiển thị
  const visibleTasks = tasks
    .filter((t) => (showCancelled ? true : t.status !== 'CANCELLED'))
    .filter((t) => {
      if (typeFilter === 'ROUTINE') {
        return t.taskTitle && t.taskTitle.startsWith('[CỐ ĐỊNH HÀNG NGÀY]');
      }
      if (typeFilter === 'AD_HOC') {
        return !t.taskTitle || !t.taskTitle.startsWith('[CỐ ĐỊNH HÀNG NGÀY]');
      }
      return true;
    });

  return (
    <div className="space-y-4">
      {/* Header Bar của Kanban */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">
                Tiến Độ Công Việc Hôm Nay & Giao Việc Phát Sinh
              </h3>
              <p className="text-xs text-slate-500">
                Bảng điều phối Kanban 4 cột • Tích hợp duyệt nghiệm thu hiện trường
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 ml-1">
              {visibleTasks.length} việc
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc loại việc: Tất cả / Cố định / Phát sinh */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  typeFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất Cả
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('ROUTINE')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  typeFilter === 'ROUTINE'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cố Định Hàng Ngày
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('AD_HOC')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  typeFilter === 'AD_HOC'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Việc Phát Sinh
              </button>
            </div>

            {canManageTasks && (
              <Button
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 font-bold"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setInitialTaskData(null);
                  setIsCreateModalOpen(true);
                }}
              >
                + Giao Việc Phát Sinh
              </Button>
            )}
          </div>
        </div>

        {/* Nút Giao Việc Phát Sinh Nhanh Theo Vai Trò (Role 3 vs Role 4) */}
        {canManageTasks && (
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Giao nhanh việc phát sinh:
            </span>

            {/* Role 4: Thủ Kho */}
            {(isWarehouseKeeper || (!isWarehouseKeeper && !isTechnicalLead)) && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickAdHoc(
                      'Bê hàng nhập vào kho',
                      'MAINTENANCE',
                      'HIGH',
                      'Hỗ trợ xe tải dỡ hàng, chuyển vào kho và xếp lên pallet'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors font-medium text-[11px]"
                >
                  📦 Bê hàng nhập vào kho
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickAdHoc(
                      'Soạn hàng & Bốc hàng xuất kho',
                      'MAINTENANCE',
                      'HIGH',
                      'Kiểm đếm kiện hàng theo phiếu xuất và bốc lên xe vận chuyển'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors font-medium text-[11px]"
                >
                  🚚 Soạn & Bốc hàng xuất kho
                </button>
              </>
            )}

            {/* Role 3: Kỹ Thuật */}
            {(isTechnicalLead || (!isWarehouseKeeper && !isTechnicalLead)) && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickAdHoc(
                      'Bón phân bổ sung đợt mới',
                      'FERTILIZING',
                      'HIGH',
                      'Bón thúc phân vi sinh theo chỉ định kỹ sư cho khu vực'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors font-medium text-[11px]"
                >
                  🌿 Bón phân đợt mới
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickAdHoc(
                      'Tiêm vắc-xin / Phòng dịch đàn',
                      'FEEDING',
                      'URGENT',
                      'Tiêm phòng dịch định kỳ theo lịch bác sĩ thú y'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 transition-colors font-medium text-[11px]"
                >
                  💉 Tiêm vắc-xin vật nuôi
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickAdHoc(
                      'Thu hoạch nông sản đợt này',
                      'HARVESTING',
                      'URGENT',
                      'Thu hái, phân loại tại vườn và chuyển về khu vực đóng gói'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 transition-colors font-medium text-[11px]"
                >
                  🌾 Thu hoạch nông sản
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lưới 4 Cột Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = visibleTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.color} p-3.5 flex flex-col min-h-[500px]`}
            >
              {/* Header Cột */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                <span className={`text-xs font-bold uppercase tracking-wider ${col.headerColor}`}>
                  {col.label}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700 shadow-2xs">
                  {colTasks.length}
                </span>
              </div>

              {/* Danh sách Card trong cột */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="py-14 text-center text-xs text-slate-400">
                    Không có nhiệm vụ nào
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isRoutine = task.taskTitle && task.taskTitle.startsWith('[CỐ ĐỊNH HÀNG NGÀY]');
                    const cleanTitle = task.taskTitle
                      ? task.taskTitle.replace(/^\[(CỐ ĐỊNH HÀNG NGÀY|PHÁT SINH)\]\s*/i, '')
                      : 'Nhiệm vụ';

                    const typeBadge = TASK_TYPE_LABELS[task.taskType] || {
                      label: task.taskType,
                      color: 'bg-slate-100 text-slate-700',
                    };
                    const priorityBadge = PRIORITY_BADGES[task.priority] || {
                      label: task.priority,
                      color: 'bg-slate-100 text-slate-700',
                    };

                    // Kiểm tra nhân sự phụ trách: Có người không có tài khoản (Role 6B) không?
                    const assignees = task.assignees || [];
                    const hasNoAccountWorker =
                      task.assignedToHasAccount === false ||
                      assignees.some((a) => a.hasUserAccount === false);

                    return (
                      <div
                        key={task.id}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition-all hover:shadow-xs space-y-2.5"
                      >
                        {/* Nhãn phân loại việc: Cố định vs Phát sinh & Độ ưu tiên */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1">
                            {isRoutine ? (
                              <span className="rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 flex items-center gap-1">
                                <RotateCcw className="h-2.5 w-2.5" />
                                CỐ ĐỊNH
                              </span>
                            ) : (
                              <span className="rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold px-1.5 py-0.5 flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                                PHÁT SINH
                              </span>
                            )}
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${typeBadge.color}`}>
                              {typeBadge.label}
                            </span>
                          </div>

                          <span className={`rounded px-1.5 py-0.5 text-[10px] border ${priorityBadge.color}`}>
                            {priorityBadge.label}
                          </span>
                        </div>

                        {/* Tiêu đề & Phân khu */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {cleanTitle}
                          </h4>
                          {task.zoneName && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{task.zoneName}</span>
                            </div>
                          )}
                        </div>

                        {/* Nhân sự & Nhãn phân biệt Role 6A (Có TK) vs Role 6B (Không TK) */}
                        <div className="space-y-1.5 pt-1.5 border-t border-slate-100 text-[11px]">
                          {task.deadline && (
                            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                              <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                              <span>Hạn: {formatDateTime(task.deadline)}</span>
                            </div>
                          )}

                          {assignees.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <Users className="h-3 w-3 text-slate-400 shrink-0" />
                              {assignees.map((a) => (
                                <span
                                  key={a.employeeId}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    a.hasUserAccount !== false
                                      ? 'bg-blue-50 text-blue-800'
                                      : 'bg-amber-50 text-amber-800 font-bold'
                                  }`}
                                  title={
                                    a.hasUserAccount !== false
                                      ? 'Nhân viên có App (Role 6A)'
                                      : 'Lao động thời vụ không có tài khoản (Role 6B)'
                                  }
                                >
                                  {a.employeeName}
                                  {a.hasUserAccount === false && ' (Không TK)'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">
                              Chưa chỉ định nhân sự
                            </div>
                          )}
                        </div>

                        {/* KHU VỰC THAO TÁC THEO TỪNG CỘT & THEO ROLE */}
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          {/* Cột 1: TODO */}
                          {col.id === 'TODO' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs font-bold text-blue-700 hover:bg-blue-50"
                                icon={<Play className="h-3.5 w-3.5" />}
                                onClick={() => handleStartTask(task.id)}
                              >
                                Bắt Đầu Nhiệm Vụ
                              </Button>

                              {/* Nếu là Quản lý / Kỹ thuật / Thủ kho và việc giao cho người Không có TK (Role 6B): Có thể bấm thẳng Hoàn thành */}
                              {canManageTasks && hasNoAccountWorker && (
                                <button
                                  type="button"
                                  onClick={() => handleDirectConfirmDoneNoAccount(task)}
                                  className="w-full py-1 px-2 rounded-lg text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center justify-center gap-1"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>✅ Xác Nhận Đã Làm Xong (Role 6B)</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* Cột 2: IN_PROGRESS */}
                          {col.id === 'IN_PROGRESS' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700"
                                icon={<Send className="h-3.5 w-3.5" />}
                                onClick={() => {
                                  setCompleteTarget(task);
                                  setIsCompleteModalOpen(true);
                                }}
                              >
                                📸 Báo Cáo & Gửi Nghiệm Thu
                              </Button>

                              {/* Quản lý xác nhận làm xong trực tiếp tại thực địa cho Role 6B */}
                              {canManageTasks && hasNoAccountWorker && (
                                <button
                                  type="button"
                                  onClick={() => handleDirectConfirmDoneNoAccount(task)}
                                  className="w-full py-1 px-2 rounded-lg text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center justify-center gap-1"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>✅ Xác Nhận Đã Làm Xong (Role 6B)</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* Cột 3: PENDING_REVIEW (Chờ nghiệm thu - Role 3 & Role 4 xem ảnh và duyệt) */}
                          {col.id === 'PENDING_REVIEW' && (
                            <div className="space-y-1">
                              <Button
                                variant="success"
                                size="sm"
                                className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                onClick={() => {
                                  setReviewTarget(task);
                                  setIsReviewModalOpen(true);
                                }}
                              >
                                🔍 Xem Ảnh & Duyệt (DONE)
                              </Button>
                            </div>
                          )}

                          {/* Cột 4: DONE */}
                          {col.id === 'DONE' && (
                            <div className="text-center text-[10px] font-bold text-emerald-800 bg-emerald-50 py-1 rounded border border-emerald-200">
                              ✓ ĐÃ HOÀN THÀNH
                            </div>
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

      {/* Modal báo cáo hoàn thành gửi nghiệm thu (Chụp ảnh + Ghi chú) */}
      <CompleteTaskModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onSuccess={onRefresh}
        task={completeTarget}
      />

      {/* Modal xem ảnh báo cáo và duyệt nghiệm thu (Dành cho Role 2, 3, 4) */}
      <ReviewTaskModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewTarget(null);
        }}
        onSuccess={onRefresh}
        task={reviewTarget}
      />

      {/* Modal giao việc mới / việc phát sinh */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setInitialTaskData(null);
        }}
        onSuccess={onRefresh}
        farmId={farmId}
        zones={zones}
        employees={employees}
        initialData={initialTaskData}
      />
    </div>
  );
}

export default PersonalTaskKanban;
