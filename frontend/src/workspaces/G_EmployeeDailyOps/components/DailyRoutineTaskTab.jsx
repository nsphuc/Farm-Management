import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  Zap,
  Trash2,
  Users,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Wheat,
  Boxes,
  ShieldAlert,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { hrService } from '@/services/modules/hrService';
import { RoutineTaskModal } from './RoutineTaskModal';

const TECH_PRESETS = [
  {
    title: 'Cho vật nuôi ăn sáng/chiều',
    type: 'FEEDING',
    priority: 'HIGH',
    desc: 'Cấp thức ăn và bổ sung nước uống cho chuồng nuôi',
  },
  {
    title: 'Tưới nước & Chăm sóc cây trồng',
    type: 'PLANTING',
    priority: 'MEDIUM',
    desc: 'Vận hành hệ thống tưới nhỏ giọt và kiểm tra độ ẩm đất',
  },
  {
    title: 'Bón phân & Dinh dưỡng định kỳ',
    type: 'FERTILIZING',
    priority: 'MEDIUM',
    desc: 'Pha dinh dưỡng bón rễ và xịt dưỡng lá theo quy trình',
  },
  {
    title: 'Nhổ cỏ, quét rác & Dọn vệ sinh chuồng trại',
    type: 'SANITATION',
    priority: 'LOW',
    desc: 'Vệ sinh hành lang, thu gom cỏ dại và khử trùng lối đi',
  },
];

const WAREHOUSE_PRESETS = [
  {
    title: 'Sắp xếp kiện hàng & Vệ sinh kho bãi',
    type: 'SANITATION',
    priority: 'MEDIUM',
    desc: 'Quét dọn sàn kho, phân loại pallet và vệ sinh khu vực đóng gói',
  },
  {
    title: 'Kiểm tra nhiệt độ / độ ẩm kho bảo quản',
    type: 'MAINTENANCE',
    priority: 'HIGH',
    desc: 'Ghi chép nhật ký nhiệt kế, kiểm tra buồng lạnh và độ thông thoáng',
  },
  {
    title: 'Bảo trì pallet & Thiết bị xe nâng tay',
    type: 'MAINTENANCE',
    priority: 'LOW',
    desc: 'Tra dầu mỡ xe nâng tay, xếp gọn các pallet gỗ hỏng chờ thanh lý',
  },
];

export function DailyRoutineTaskTab({
  farmId,
  tasks = [],
  zones = [],
  employees = [],
  isTechnicalLead = false,
  isWarehouseKeeper = false,
  isZoneManager = false,
  onRefresh,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [filterZoneId, setFilterZoneId] = useState('ALL');

  // Lọc các công việc có tiền tố [CỐ ĐỊNH HÀNG NGÀY] và chưa bị hủy
  const routineTasks = tasks.filter(
    (t) =>
      t.taskTitle &&
      t.taskTitle.startsWith('[CỐ ĐỊNH HÀNG NGÀY]') &&
      t.status !== 'CANCELLED'
  );

  // Lọc theo phân khu nếu có
  const filteredRoutines =
    filterZoneId === 'ALL'
      ? routineTasks
      : routineTasks.filter((t) => String(t.zoneId) === String(filterZoneId));

  // Kích hoạt sinh danh sách công việc cố định cho ngày hôm nay
  const handleGenerateToday = async () => {
    if (!farmId) return;
    try {
      setIsGenerating(true);
      setActionMessage(null);
      const res = await hrService.generateDailyRoutines(farmId);
      const count = Array.isArray(res) ? res.length : res?.generatedCount || 0;
      setActionMessage({
        type: 'success',
        text: `Đã khởi tạo / làm mới thành công ${count} đầu việc cố định cho ngày hôm nay!`,
      });
      onRefresh?.();
    } catch (err) {
      console.error('Generate routines error:', err);
      setActionMessage({
        type: 'error',
        text: 'Lỗi khi giao việc cố định hôm nay: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Ngừng / Xóa một công việc cố định
  const handleDeleteRoutine = async (taskId, taskTitle) => {
    if (
      !window.confirm(
        `Xác nhận ngừng công việc cố định:\n"${taskTitle}"?\n(Công việc sẽ tự động kết thúc và không còn sinh mỗi ngày).`
      )
    ) {
      return;
    }

    try {
      await hrService.deleteTask(farmId, taskId);
      setActionMessage({
        type: 'success',
        text: `Đã ngừng công việc: "${taskTitle}"`,
      });
      onRefresh?.();
    } catch (err) {
      console.error('Delete routine error:', err);
      setActionMessage({
        type: 'error',
        text: 'Không thể ngừng việc: ' + (err.response?.data?.message || err.message),
      });
    }
  };

  // Chọn mẫu gợi ý nhanh
  const handleSelectPreset = (preset) => {
    setEditingTask({
      taskTitle: `[CỐ ĐỊNH HÀNG NGÀY] ${preset.title}`,
      taskType: preset.type,
      priority: preset.priority,
      completionNotes: preset.desc,
      zoneId: zones[0]?.id ? String(zones[0].id) : '',
      selectedEmployeeIds: [],
    });
    setIsModalOpen(true);
  };

  // Danh mục preset hiển thị theo vai trò
  const availablePresets = isWarehouseKeeper
    ? WAREHOUSE_PRESETS
    : isTechnicalLead || isZoneManager
    ? TECH_PRESETS
    : [...TECH_PRESETS, ...WAREHOUSE_PRESETS];

  return (
    <div className="space-y-5">
      {/* Thông báo thao tác */}
      {actionMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium animate-in fade-in duration-300 ${
            actionMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Điều Hành & Nút Thao Tác Chính */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                  Thiết Lập & Phân Công Công Việc Cố Định Hàng Ngày
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2 py-0.5">
                    {routineTasks.length} việc đang hoạt động
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Thiết lập 1 lần — hệ thống tự động sinh việc mỗi ngày cho nhân sự và tự động ngừng khi xuất chuồng / thu hoạch.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
            >
              + Thêm Việc Cố Định
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-xs"
              icon={<Zap className="h-4 w-4 text-amber-300 fill-amber-300" />}
              onClick={handleGenerateToday}
              isLoading={isGenerating}
              loadingText="Đang giao việc hôm nay..."
            >
              ⚡ Giao Việc Cố Định Cho Hôm Nay
            </Button>
          </div>
        </div>

        {/* Thanh Gợi Ý Nhanh Mẫu Việc Theo Vai Trò */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600 mb-2 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Mẫu công việc thường quy ({isWarehouseKeeper ? 'Thủ kho' : isTechnicalLead ? 'Kỹ thuật trại' : 'Quản lý'}):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availablePresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all flex items-center gap-1.5"
              >
                <span>+</span>
                <span>{p.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bộ lọc phân khu nếu có nhiều phân khu */}
      {zones.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-500 font-medium shrink-0">Lọc theo khu vực:</span>
          <button
            type="button"
            onClick={() => setFilterZoneId('ALL')}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              filterZoneId === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả ({routineTasks.length})
          </button>
          {zones.map((z) => {
            const count = routineTasks.filter((t) => String(t.zoneId) === String(z.id)).length;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setFilterZoneId(z.id)}
                className={`text-xs px-3 py-1 rounded-full border transition-all shrink-0 ${
                  String(filterZoneId) === String(z.id)
                    ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {z.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Bảng Danh Sách Công Việc Cố Định */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredRoutines.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">Chưa có công việc cố định nào</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hãy bấm <strong>"+ Thêm Việc Cố Định"</strong> hoặc chọn một mẫu việc gợi ý ở trên để giao việc lặp lại cho nhân sự.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Đầu Việc Cố Định Hàng Ngày</th>
                  <th className="py-3.5 px-4">Khu Vực Áp Dụng</th>
                  <th className="py-3.5 px-4">Nhân Sự Phụ Trách (`assignees`)</th>
                  <th className="py-3.5 px-4 text-center">Độ Ưu Tiên</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoutines.map((task) => {
                  const assignees = task.assignees || [];
                  const cleanTitle = task.taskTitle.replace(/^\[CỐ ĐỊNH HÀNG NGÀY\]\s*/i, '');

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tiêu đề & Loại việc */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5">
                              CỐ ĐỊNH
                            </span>
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {cleanTitle}
                            </span>
                          </div>
                          {task.completionNotes && (
                            <p className="text-[11px] text-slate-500 truncate max-w-md">
                              {task.completionNotes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Phân khu */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {task.zoneName ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {task.zoneName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Toàn trang trại</span>
                        )}
                      </td>

                      {/* Danh sách người thực hiện: Phân biệt Role 6A vs Role 6B */}
                      <td className="py-3.5 px-4">
                        {assignees.length === 0 ? (
                          <span className="text-amber-600 font-medium text-[11px] flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Chưa phân công ai
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {assignees.map((a) => {
                              const hasAccount = a.hasUserAccount !== false;
                              return (
                                <span
                                  key={a.employeeId}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                    hasAccount
                                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                  title={
                                    hasAccount
                                      ? 'Nhân viên có tài khoản App (Role 6A)'
                                      : 'Lao động thời vụ không có tài khoản (Role 6B)'
                                  }
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      hasAccount ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}
                                  />
                                  <span>{a.employeeName || 'Nhân viên'}</span>
                                  {a.roleInTask === 'LEADER' && (
                                    <span className="font-bold text-[9px] text-emerald-700">★</span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Độ ưu tiên */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            task.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.priority || 'MEDIUM'}
                        </span>
                      </td>

                      {/* Thao tác: Đổi người làm / Chỉnh sửa / Ngừng */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTask(task);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Đổi người làm / Chỉnh sửa việc cố định"
                          >
                            <Users className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRoutine(task.id, cleanTitle)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa / Ngừng công việc cố định này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm Mới / Đổi Người Thực Hiện Việc Cố Định */}
      <RoutineTaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingTask(null);
          onRefresh?.();
        }}
        farmId={farmId}
        zones={zones}
        employees={employees}
        initialData={editingTask}
      />
    </div>
  );
}

export default DailyRoutineTaskTab;
