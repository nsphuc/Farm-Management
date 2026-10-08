import React, { useState, useEffect } from 'react';
import { 
  Kanban, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar, 
  Flag, 
  Trash2, 
  MoreHorizontal, 
  Layers, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { taskService } from '../../services/taskService';
import { CreateTaskModal } from './CreateTaskModal';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'TODO', title: 'Chờ Thực Hiện', color: 'border-slate-300 bg-slate-50/50', badgeColor: 'bg-slate-200 text-slate-700' },
  { id: 'IN_PROGRESS', title: 'Đang Thực Hiện', color: 'border-blue-300 bg-blue-50/30', badgeColor: 'bg-blue-100 text-blue-700' },
  { id: 'PENDING_REVIEW', title: 'Chờ Nghiệm Thu', color: 'border-amber-300 bg-amber-50/30', badgeColor: 'bg-amber-100 text-amber-700' },
  { id: 'DONE', title: 'Đã Hoàn Thành', color: 'border-emerald-300 bg-emerald-50/30', badgeColor: 'bg-emerald-100 text-emerald-700' },
  { id: 'CANCELLED', title: 'Đã Hủy Bỏ', color: 'border-rose-300 bg-rose-50/30', badgeColor: 'bg-rose-100 text-rose-700' },
];

export const TaskKanbanBoardPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [boardData, setBoardData] = useState({
    TODO: [],
    IN_PROGRESS: [],
    PENDING_REVIEW: [],
    DONE: [],
    CANCELLED: []
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  useEffect(() => {
    if (farmId) {
      loadKanban();
    }
  }, [farmId]);

  const loadKanban = async () => {
    try {
      setLoading(true);
      const res = await taskService.getKanbanBoard(farmId);
      setBoardData({
        TODO: res?.TODO || [],
        IN_PROGRESS: res?.IN_PROGRESS || [],
        PENDING_REVIEW: res?.PENDING_REVIEW || [],
        DONE: res?.DONE || [],
        CANCELLED: res?.CANCELLED || []
      });
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải bảng việc Kanban');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Tìm xem task đang ở đâu
    let currentTask = null;
    let fromStatus = null;
    for (const [status, list] of Object.entries(boardData)) {
      const found = list.find(t => String(t.id) === String(taskId));
      if (found) {
        currentTask = found;
        fromStatus = status;
        break;
      }
    }

    if (!currentTask || fromStatus === targetStatus) return;

    // Optimistic UI update
    setBoardData(prev => {
      const newFrom = prev[fromStatus].filter(t => String(t.id) !== String(taskId));
      const updatedTask = { ...currentTask, status: targetStatus };
      const newTo = [updatedTask, ...prev[targetStatus]];
      return {
        ...prev,
        [fromStatus]: newFrom,
        [targetStatus]: newTo
      };
    });

    try {
      await taskService.updateTaskStatus(farmId, taskId, { status: targetStatus });
      toast.success(`Đã chuyển việc sang "${COLUMNS.find(c => c.id === targetStatus)?.title}"`);
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái');
      loadKanban(); // Revert
    } finally {
      setDraggedTaskId(null);
    }
  };

  const handleQuickStatus = async (taskId, targetStatus) => {
    try {
      await taskService.updateTaskStatus(farmId, taskId, { status: targetStatus });
      loadKanban();
    } catch (err) {
      toast.error('Lỗi chuyển trạng thái');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xóa công việc "${title}"?`)) return;
    try {
      await taskService.deleteTask(farmId, id);
      toast.success('Đã xóa công việc');
      loadKanban();
    } catch (err) {
      toast.error('Không thể xóa công việc');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">Khẩn cấp</span>;
      case 'HIGH':
        return <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">Cao</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">Trung bình</span>;
      case 'LOW':
      default:
        return <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">Thấp</span>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bảng Việc Kanban & Điều Phối</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kéo thả phân luồng công việc hiện trường theo thời gian thực (Kỹ thuật canh tác & Chăm sóc vật nuôi)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Giao Việc Mới
        </button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5 min-h-[70vh]">
        {COLUMNS.map((col) => {
          const tasks = boardData[col.id] || [];
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border ${col.color} p-3.5 transition-colors`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/60 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {col.title}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badgeColor}`}>
                  {tasks.length}
                </span>
              </div>

              {/* Task Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[75vh] pr-0.5">
                {tasks.length === 0 ? (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                    Kéo thả việc vào đây
                  </div>
                ) : (
                  tasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && col.id !== 'DONE' && col.id !== 'CANCELLED';
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="group relative rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-2">
                            {task.title}
                          </h4>
                          <button
                            onClick={() => handleDelete(task.id, task.title)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition"
                            title="Xóa việc"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-50 pt-2.5">
                          {getPriorityBadge(task.priority)}

                          {task.assignedToName && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">
                              <User className="h-3 w-3 text-gray-400" />
                              {task.assignedToName}
                            </span>
                          )}

                          {task.dueDate && (
                            <span className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                              isOverdue ? 'bg-rose-50 text-rose-600 font-bold' : 'text-gray-500 bg-gray-50'
                            }`}>
                              <Calendar className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>

                        {/* Nút chuyển trạng thái nhanh */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-2 text-[11px]">
                          <span className="text-gray-400">Chuyển:</span>
                          <div className="flex items-center gap-1">
                            {col.id !== 'TODO' && (
                              <button
                                onClick={() => handleQuickStatus(task.id, 'TODO')}
                                className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                              >
                                Todo
                              </button>
                            )}
                            {col.id !== 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleQuickStatus(task.id, 'IN_PROGRESS')}
                                className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium"
                              >
                                Đang làm
                              </button>
                            )}
                            {col.id !== 'PENDING_REVIEW' && (
                              <button
                                onClick={() => handleQuickStatus(task.id, 'PENDING_REVIEW')}
                                className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 hover:bg-amber-100 font-medium"
                              >
                                Nghiệm thu
                              </button>
                            )}
                            {col.id !== 'DONE' && (
                              <button
                                onClick={() => handleQuickStatus(task.id, 'DONE')}
                                className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold"
                              >
                                Hoàn thành
                              </button>
                            )}
                          </div>
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

      {/* Modal Giao việc */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        farmId={farmId}
        onSaved={loadKanban}
      />
    </div>
  );
};
