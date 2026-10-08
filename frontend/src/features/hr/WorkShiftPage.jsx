import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Users, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  ArrowRight,
  Filter,
  Layers
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { hrService } from '../../services/hrService';
import { ShiftAssignmentModal } from './ShiftAssignmentModal';
import { toast } from 'sonner';

export const WorkShiftPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter ngày xem phân ca
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal ca làm việc
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    shiftName: '',
    startTime: '07:00:00',
    endTime: '11:30:00',
    breakMinutes: 0,
    wageMultiplier: 1.0,
    status: 'ACTIVE'
  });

  // Modal phân ca
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  useEffect(() => {
    if (farmId) {
      loadInitialData();
    }
  }, [farmId]);

  useEffect(() => {
    if (farmId && selectedDate) {
      loadAssignments();
    }
  }, [farmId, selectedDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [shiftsRes, empRes] = await Promise.all([
        hrService.getWorkShifts(farmId),
        hrService.getEmployees(farmId)
      ]);
      setShifts(Array.isArray(shiftsRes) ? shiftsRes : shiftsRes?.items || []);
      setEmployees(empRes?.items || (Array.isArray(empRes) ? empRes : []));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await hrService.getShiftAssignments(farmId, { shiftDate: selectedDate });
      setAssignments(Array.isArray(res) ? res : res?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    if (!shiftForm.shiftName.trim()) {
      toast.error('Vui lòng nhập tên ca làm việc');
      return;
    }

    try {
      const payload = {
        ...shiftForm,
        breakMinutes: Number(shiftForm.breakMinutes) || 0,
        wageMultiplier: Number(shiftForm.wageMultiplier) || 1.0
      };

      if (editingShift?.id) {
        await hrService.updateWorkShift(farmId, editingShift.id, payload);
        toast.success('Cập nhật ca làm việc thành công');
      } else {
        await hrService.createWorkShift(farmId, payload);
        toast.success('Tạo ca làm việc mới thành công');
      }
      setIsShiftModalOpen(false);
      setEditingShift(null);
      loadInitialData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu ca');
    }
  };

  const handleDeleteShift = async (id, name) => {
    if (!window.confirm(`Xóa ca "${name}"?`)) return;
    try {
      await hrService.deleteWorkShift(farmId, id);
      toast.success('Đã xóa ca');
      loadInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa ca');
    }
  };

  const handleDeleteAssignment = async (id) => {
    try {
      await hrService.deleteShiftAssignment(farmId, id);
      toast.success('Đã xóa phân ca');
      loadAssignments();
    } catch (err) {
      toast.error('Không thể xóa phân ca');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ca Làm Việc & Phân Ca</h1>
          <p className="mt-1 text-sm text-gray-500">
            Định nghĩa khung giờ ca kíp và điều phối lịch trực cho nhân sự nông trại
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingShift(null);
              setShiftForm({
                shiftName: '',
                startTime: '07:00:00',
                endTime: '11:30:00',
                breakMinutes: 0,
                wageMultiplier: 1.0,
                status: 'ACTIVE'
              });
              setIsShiftModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <Clock className="h-4 w-4" />
            Thêm Ca Mới
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Phân Ca Cho Nhân Viên
          </button>
        </div>
      </div>

      {/* Grid Danh sách các Ca làm việc hiện có */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-600" />
          Danh mục Ca làm việc cấu hình sẵn
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shifts.map((s) => (
            <div key={s.id} className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{s.shiftName}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span className="font-semibold text-gray-700">
                      {s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingShift(s);
                      setShiftForm({
                        shiftName: s.shiftName,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        breakMinutes: s.breakMinutes || 0,
                        wageMultiplier: s.wageMultiplier || 1.0,
                        status: s.status || 'ACTIVE'
                      });
                      setIsShiftModalOpen(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Sửa ca"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteShift(s.id, s.shiftName)}
                    className="p-1 text-gray-400 hover:text-rose-600"
                    title="Xóa ca"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3 text-xs text-gray-500">
                <span>Nghỉ giữa ca: <strong className="text-gray-800">{s.breakMinutes || 0}p</strong></span>
                <span>Hệ số lương: <strong className="text-emerald-600">x{s.wageMultiplier || 1.0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lịch Phân Ca Làm Việc Theo Ngày */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Lịch Phân Ca Ngày: {new Date(selectedDate).toLocaleDateString('vi-VN')}
            </h2>
            <p className="text-xs text-gray-500">Xem danh sách nhân sự được phân công làm việc theo từng ca</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Chọn ngày:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bảng phân ca chi tiết */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Nhân viên</th>
                <th className="px-5 py-3">Ca làm việc</th>
                <th className="px-5 py-3">Khung giờ</th>
                <th className="px-5 py-3">Ghi chú</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-sm text-gray-400">
                    Chưa có nhân sự nào được phân ca trong ngày {selectedDate}
                  </td>
                </tr>
              ) : (
                assignments.map((item) => {
                  const emp = employees.find(e => e.id === item.employeeId);
                  const shift = shifts.find(s => s.id === item.shiftId);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                            {emp?.fullName?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <div>{emp?.fullName || `ID: ${item.employeeId}`}</div>
                            <div className="text-[11px] text-gray-400">{emp?.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium text-gray-800">{shift?.shiftName || `Ca #${item.shiftId}`}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {shift ? `${shift.startTime?.substring(0, 5)} - ${shift.endTime?.substring(0, 5)}` : 'N/A'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 italic">
                        {item.note || '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDeleteAssignment(item.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 transition"
                          title="Hủy phân ca"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa Ca làm việc */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">
              {editingShift ? 'Cập nhật Ca làm việc' : 'Tạo Ca làm việc mới'}
            </h2>
            <form onSubmit={handleSaveShift} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên ca làm việc *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Ca sáng, Ca chiều, Ca đêm..."
                  value={shiftForm.shiftName}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giờ kết thúc *</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nghỉ giữa ca (phút)</label>
                  <input
                    type="number"
                    min="0"
                    value={shiftForm.breakMinutes}
                    onChange={(e) => setShiftForm({ ...shiftForm, breakMinutes: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Hệ số lương</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={shiftForm.wageMultiplier}
                    onChange={(e) => setShiftForm({ ...shiftForm, wageMultiplier: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow"
                >
                  Lưu Ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Phân Ca */}
      <ShiftAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        farmId={farmId}
        shifts={shifts}
        employees={employees}
        onSaved={loadAssignments}
      />
    </div>
  );
};
