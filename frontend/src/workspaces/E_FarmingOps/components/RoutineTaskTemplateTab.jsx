import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  Trash2,
  Edit,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Apple,
  Users,
  ShieldCheck,
  User,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { farmingService } from '@/services/modules/farmingService';
import { hrService } from '@/services/modules/hrService';
import { formatDate } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { Can } from '@/components/common/Can';

const TASK_TYPE_LABELS = {
  FEEDING: 'Cho ăn / Cung cấp dinh dưỡng',
  PLANTING: 'Chăm sóc / Canh tác cây trồng',
  FERTILIZING: 'Bón phân / Tưới dinh dưỡng',
  SANITATION: 'Vệ sinh chuồng trại / Dọn dẹp',
  MAINTENANCE: 'Bảo trì hệ thống tưới / Thiết bị',
  HARVESTING: 'Thu hoạch / Xuất chuồng',
};

const TASK_TYPE_COLORS = {
  FEEDING: 'bg-amber-50 text-amber-800 border-amber-200',
  PLANTING: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  FERTILIZING: 'bg-teal-50 text-teal-800 border-teal-200',
  SANITATION: 'bg-blue-50 text-blue-800 border-blue-200',
  MAINTENANCE: 'bg-purple-50 text-purple-800 border-purple-200',
  HARVESTING: 'bg-rose-50 text-rose-800 border-rose-200',
};

export function RoutineTaskTemplateTab({ item, sector, farmId, onDataChanged }) {
  const { notifyDataChanged, syncTrigger } = useActiveFarmStore();

  const [routineTasks, setRoutineTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Thêm / Sửa công việc cố định
  const [isAddRoutineOpen, setIsAddRoutineOpen] = useState(false);
  const [editingRoutineTask, setEditingRoutineTask] = useState(null);
  const [routineForm, setRoutineForm] = useState({
    timeStr: '07:00',
    title: '',
    taskType: sector === 'CROP' ? 'PLANTING' : 'FEEDING',
    priority: 'MEDIUM',
    assignedToEmployeeId: '',
  });

  // Modal Lên lịch thu hoạch / xuất chuồng
  const [isScheduleHarvestOpen, setIsScheduleHarvestOpen] = useState(false);
  const [harvestForm, setHarvestForm] = useState({
    title: '',
    deadlineDate: new Date().toISOString().split('T')[0],
    deadlineTime: '08:00',
    priority: 'HIGH',
    assignedToEmployeeId: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nạp danh sách nhiệm vụ cố định theo Phân khu
  const loadTasks = async () => {
    if (!farmId || !item?.zoneId) return;
    try {
      setIsLoading(true);
      const [tasksRes, empRes] = await Promise.all([
        farmingService.getRoutineTasks(farmId, item.zoneId).catch(() => ({ content: [] })),
        hrService.getEmployees({ farmId, size: 100 }).catch(() => ({ content: [] })),
      ]);

      const tList = tasksRes?.content || (Array.isArray(tasksRes) ? tasksRes : []);
      // Lọc các task active (chưa CANCELLED)
      const activeList = tList.filter((t) => t.status !== 'CANCELLED');
      setRoutineTasks(activeList);

      const eList = empRes?.content || (Array.isArray(empRes) ? empRes : []);
      setEmployees(eList);
    } catch (err) {
      console.error('Lỗi khi tải công việc thường nhật:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [farmId, item?.zoneId, syncTrigger?.tasks]);

  // Mở modal sửa công việc cố định
  const handleOpenEditRoutine = (task) => {
    const rawTitle = task.taskTitle || '';
    const cleanTitle = rawTitle.replace(/^\[CỐ ĐỊNH HÀNG NGÀY\]\s*/i, '');
    const timeMatch = cleanTitle.match(/^(\d{2}:\d{2})\s*(.*)$/);
    const timeStr = timeMatch
      ? timeMatch[1]
      : task.deadline
      ? new Date(task.deadline).toTimeString().slice(0, 5)
      : '07:00';
    const pureTitle = timeMatch ? timeMatch[2] : cleanTitle;

    setRoutineForm({
      timeStr,
      title: pureTitle,
      taskType: task.taskType || (sector === 'CROP' ? 'PLANTING' : 'FEEDING'),
      priority: task.priority || 'MEDIUM',
      assignedToEmployeeId: task.assignedToEmployeeId ? String(task.assignedToEmployeeId) : '',
    });
    setEditingRoutineTask(task);
    setIsAddRoutineOpen(true);
  };

  // Thêm mới hoặc Cập nhật công việc cố định hàng ngày
  const handleSaveRoutineTask = async (e) => {
    e.preventDefault();
    if (!routineForm.title.trim()) {
      toast.warning('Vui lòng nhập tên công việc cố định!');
      return;
    }

    try {
      setIsSubmitting(true);
      const formattedTitle = `[CỐ ĐỊNH HÀNG NGÀY] ${routineForm.timeStr} ${routineForm.title.trim()}`;

      // Deadline là hôm nay lúc timeStr
      const today = new Date();
      const [h, m] = routineForm.timeStr.split(':');
      today.setHours(Number(h) || 8, Number(m) || 0, 0, 0);

      const payload = {
        zoneId: item.zoneId,
        taskTitle: formattedTitle,
        taskType: routineForm.taskType,
        priority: routineForm.priority,
        assignedToEmployeeId: routineForm.assignedToEmployeeId ? Number(routineForm.assignedToEmployeeId) : null,
        deadline: today.toISOString(),
        completionNotes: `Khung việc lặp lại hàng ngày gắn với ${sector === 'CROP' ? 'vụ mùa' : 'đàn nuôi'} ${item.seasonCode || item.groupCode}`,
      };

      if (routineForm.assignedToEmployeeId) {
        payload.assignees = [
          {
            employeeId: Number(routineForm.assignedToEmployeeId),
            roleInTask: 'LEADER',
          },
        ];
      }

      if (editingRoutineTask) {
        await farmingService.updateRoutineTask(farmId, editingRoutineTask.id, payload);
        toast.success(`Đã cập nhật công việc cố định: ${formattedTitle}`);
      } else {
        await farmingService.createRoutineTask(farmId, payload);
        toast.success(`Đã thêm công việc cố định hàng ngày: ${formattedTitle}`);
      }

      notifyDataChanged('tasks');
      setIsAddRoutineOpen(false);
      setEditingRoutineTask(null);
      setRoutineForm({
        timeStr: '07:00',
        title: '',
        taskType: sector === 'CROP' ? 'PLANTING' : 'FEEDING',
        priority: 'MEDIUM',
        assignedToEmployeeId: '',
      });
      loadTasks();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi lưu công việc cố định:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi lưu công việc cố định');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lên lịch thu hoạch / xuất chuồng
  const handleScheduleHarvest = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const isCrop = sector === 'CROP';
      const defaultTitle = isCrop
        ? `[LỆNH THU HOẠCH] Thu hoạch vụ mùa ${item.seasonCode} (${item.cropTypeName || 'Cây trồng'})`
        : `[LỆNH XUẤT CHUỒNG] Xuất bán đàn vật nuôi ${item.groupCode} (${item.breedName || 'Vật nuôi'})`;

      const title = harvestForm.title.trim() || defaultTitle;
      const deadlineDate = new Date(`${harvestForm.deadlineDate}T${harvestForm.deadlineTime}:00`);

      const payload = {
        zoneId: item.zoneId,
        taskTitle: title,
        taskType: 'HARVESTING',
        priority: harvestForm.priority,
        assignedToEmployeeId: harvestForm.assignedToEmployeeId ? Number(harvestForm.assignedToEmployeeId) : null,
        deadline: deadlineDate.toISOString(),
        completionNotes: harvestForm.notes || `Lệnh điều hành thu hoạch/xuất chuồng giao Trưởng khu và Thủ kho chuẩn bị`,
      };

      if (harvestForm.assignedToEmployeeId) {
        payload.assignees = [
          {
            employeeId: Number(harvestForm.assignedToEmployeeId),
            roleInTask: 'LEADER',
          },
        ];
      }

      await farmingService.scheduleHarvestTask(farmId, payload);
      toast.success(`Đã phát lệnh thu hoạch / xuất chuồng thành công: ${title}!`);

      notifyDataChanged('tasks');
      setIsScheduleHarvestOpen(false);
      loadTasks();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi phát lệnh thu hoạch:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi phát lệnh thu hoạch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa / Ngừng công việc cố định
  const handleDeleteRoutineTask = async (taskId, taskTitle) => {
    const confirmed = window.confirm(
      `Xác nhận ngừng / xóa công việc cố định này?\n\n"${taskTitle}"\n\nHệ thống sẽ hủy nhiệm vụ và đồng bộ sang lịch công việc của nhân sự.`
    );
    if (!confirmed) return;

    try {
      await farmingService.deleteRoutineTask(farmId, taskId);
      toast.success('Đã ngừng công việc cố định thành công!');
      notifyDataChanged('tasks');
      loadTasks();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi xóa công việc cố định:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi xóa việc cố định');
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header thanh công cụ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div>
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Repeat className="h-4 w-4 text-emerald-600" />
            <span>Khung Việc Cố Định Lặp Lại Hàng Ngày</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Các công việc thường nhật được tự động sinh mỗi ngày cho công nhân và trưởng phân khu phụ trách
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Lên Lịch Thu Hoạch / Xuất Chuồng */}
          <Can permission={sector === 'CROP' ? 'PERM_CROP_PLAN' : 'PERM_LIVESTOCK_MANAGE'} role={['ROLE_TECHNICAL_STAFF', 'ROLE_FARM_MANAGER']}>
            <Button
              size="sm"
              variant="success"
              icon={<Apple className="h-3.5 w-3.5" />}
              onClick={() => {
                const isCrop = sector === 'CROP';
                setHarvestForm({
                  title: isCrop
                    ? `[LỆNH THU HOẠCH] Thu hoạch vụ mùa ${item.seasonCode}`
                    : `[LỆNH XUẤT CHUỒNG] Xuất bán đàn ${item.groupCode}`,
                  deadlineDate: item.expectedHarvestDate
                    ? String(item.expectedHarvestDate).split('T')[0]
                    : new Date().toISOString().split('T')[0],
                  deadlineTime: '08:00',
                  priority: 'HIGH',
                  assignedToEmployeeId: '',
                  notes: '',
                });
                setIsScheduleHarvestOpen(true);
              }}
            >
              {sector === 'CROP' ? '+ Lên Lịch Thu Hoạch' : '+ Lên Lịch Xuất Chuồng'}
            </Button>
          </Can>

          {/* Nút Thêm Việc Cố Định */}
          <Can permission={sector === 'CROP' ? 'PERM_CROP_PLAN' : 'PERM_LIVESTOCK_MANAGE'} role={['ROLE_TECHNICAL_STAFF', 'ROLE_FARM_MANAGER']}>
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsAddRoutineOpen(true)}
            >
              + Thêm Việc Cố Định
            </Button>
          </Can>
        </div>
      </div>

      {/* Danh sách các công việc cố định đang hoạt động */}
      {routineTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white">
          <Repeat className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <h5 className="font-bold text-slate-800 text-xs">Chưa thiết lập khung việc cố định hàng ngày</h5>
          <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
            Bấm <strong>"+ Thêm Việc Cố Định"</strong> để tạo lịch cho ăn, tưới nước, dọn chuồng lặp lại mỗi sáng/chiều cho phân khu này.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {routineTasks.map((task) => {
            const cleanTitle = task.taskTitle?.replace(/^\[CỐ ĐỊNH HÀNG NGÀY\]\s*/i, '');
            const typeColor = TASK_TYPE_COLORS[task.taskType] || 'bg-slate-100 text-slate-800 border-slate-200';
            const typeLabel = TASK_TYPE_LABELS[task.taskType] || task.taskType;

            return (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeColor}`}>
                      {typeLabel}
                    </span>
                    <div className="flex items-center gap-1">
                      <Can permission="PERM_TASK_ASSIGN" role={['ROLE_TECHNICAL_STAFF', 'ROLE_FARM_MANAGER']}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRoutine(task)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                          title="Sửa công việc cố định này"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoutineTask(task.id, task.taskTitle)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Xóa / Ngừng công việc cố định này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </Can>
                    </div>
                  </div>

                  <h5 className="font-bold text-slate-900 text-xs leading-snug">
                    {cleanTitle}
                  </h5>

                  <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{task.deadline ? formatDate(task.deadline) : 'Hàng ngày'}</span>
                    </span>

                    {task.assignedToEmployeeName && (
                      <span className="flex items-center gap-1 text-slate-700 font-medium truncate">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{task.assignedToEmployeeName}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Lặp lại mỗi ngày
                  </span>
                  <StatusBadge status={task.status} size="xs" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: THÊM / SỬA CÔNG VIỆC CỐ ĐỊNH HÀNG NGÀY        */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAddRoutineOpen}
        onClose={() => {
          setIsAddRoutineOpen(false);
          setEditingRoutineTask(null);
        }}
        title={editingRoutineTask ? 'Sửa Mẫu Công Việc Cố Định Hàng Ngày' : 'Thêm Công Việc Cố Định Hàng Ngày'}
        subtitle={`Gắn với ${sector === 'CROP' ? 'vụ mùa' : 'đàn nuôi'} ${item.seasonCode || item.groupCode} (${item.zoneName || 'Phân khu'})`}
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddRoutineOpen(false);
                setEditingRoutineTask(null);
              }}
            >
              Hủy Bỏ
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRoutineTask} isLoading={isSubmitting}>
              {editingRoutineTask ? 'Lưu Thay Đổi' : 'Lưu Đầu Việc'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveRoutineTask} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Giờ thực hiện *" hint="Định dạng HH:mm">
              <Input
                type="time"
                value={routineForm.timeStr}
                onChange={(e) => setRoutineForm({ ...routineForm, timeStr: e.target.value })}
              />
            </FormField>

            <div className="col-span-2">
              <FormField label="Loại công việc *">
                <Select
                  value={routineForm.taskType}
                  onChange={(e) => setRoutineForm({ ...routineForm, taskType: e.target.value })}
                >
                  <option value="FEEDING">FEEDING - Cho ăn / Cung cấp dinh dưỡng</option>
                  <option value="PLANTING">PLANTING - Chăm sóc cây trồng / Đồng ruộng</option>
                  <option value="FERTILIZING">FERTILIZING - Bón phân / Tưới vi lượng</option>
                  <option value="SANITATION">SANITATION - Vệ sinh / Quét dọn chuồng</option>
                  <option value="MAINTENANCE">MAINTENANCE - Bảo trì hệ thống / Thiết bị</option>
                </Select>
              </FormField>
            </div>
          </div>

          <FormField
            label="Nội dung công việc *"
            hint="Ví dụ: Cho đàn ăn sáng, Tưới nước làm mát nhà màng, Quét dọn khay ăn..."
          >
            <Input
              placeholder="Nhập tên nhiệm vụ lặp lại..."
              value={routineForm.title}
              onChange={(e) => setRoutineForm({ ...routineForm, title: e.target.value })}
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Mức độ ưu tiên">
              <Select
                value={routineForm.priority}
                onChange={(e) => setRoutineForm({ ...routineForm, priority: e.target.value })}
              >
                <option value="LOW">LOW - Thấp</option>
                <option value="MEDIUM">MEDIUM - Trung bình</option>
                <option value="HIGH">HIGH - Cao</option>
                <option value="URGENT">URGENT - Khẩn cấp</option>
              </Select>
            </FormField>

            <FormField label="Giao đích danh nhân viên" hint="Để trống nếu giao Trưởng khu phân công">
              <Select
                value={routineForm.assignedToEmployeeId}
                onChange={(e) => setRoutineForm({ ...routineForm, assignedToEmployeeId: e.target.value })}
              >
                <option value="">-- Trưởng phân khu tự điều phối --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: LÊN LỊCH THU HOẠCH / XUẤT CHUỒNG               */}
      {/* ======================================================== */}
      <Modal
        isOpen={isScheduleHarvestOpen}
        onClose={() => setIsScheduleHarvestOpen(false)}
        title={sector === 'CROP' ? 'Lên Lịch Thu Hoạch Vụ Mùa' : 'Lên Lịch Xuất Chuồng Đàn Nuôi'}
        subtitle={`Phát lệnh công việc HARVESTING cho ${item.seasonCode || item.groupCode}`}
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsScheduleHarvestOpen(false)}>
              Hủy Bỏ
            </Button>
            <Button variant="success" size="sm" onClick={handleScheduleHarvest} isLoading={isSubmitting}>
              Phát Lệnh Thu Hoạch
            </Button>
          </div>
        }
      >
        <form onSubmit={handleScheduleHarvest} className="space-y-3.5 text-xs">
          <FormField label="Tiêu đề lệnh thu hoạch / xuất bán *">
            <Input
              value={harvestForm.title}
              onChange={(e) => setHarvestForm({ ...harvestForm, title: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày thực hiện *">
              <Input
                type="date"
                value={harvestForm.deadlineDate}
                onChange={(e) => setHarvestForm({ ...harvestForm, deadlineDate: e.target.value })}
              />
            </FormField>

            <FormField label="Giờ bắt đầu *">
              <Input
                type="time"
                value={harvestForm.deadlineTime}
                onChange={(e) => setHarvestForm({ ...harvestForm, deadlineTime: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Chỉ huy trưởng thu hoạch" hint="Trưởng phân khu hoặc Kỹ sư phụ trách">
            <Select
              value={harvestForm.assignedToEmployeeId}
              onChange={(e) => setHarvestForm({ ...harvestForm, assignedToEmployeeId: e.target.value })}
            >
              <option value="">-- Trưởng phân khu phụ trách --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Chỉ dẫn thu hoạch & Lưu kho" hint="Dặn dò kỹ thuật cắt hái / cân đo / đóng thùng">
            <Input
              placeholder="Ví dụ: Thu hái sáng sớm, xếp khay 15kg chuyển về Kho lạnh #1..."
              value={harvestForm.notes}
              onChange={(e) => setHarvestForm({ ...harvestForm, notes: e.target.value })}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default RoutineTaskTemplateTab;
