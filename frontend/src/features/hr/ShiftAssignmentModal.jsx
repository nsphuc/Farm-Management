import React, { useState } from 'react';
import { X, Calendar, Clock, User, CheckCircle } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { toast } from 'sonner';

export const ShiftAssignmentModal = ({ isOpen, onClose, farmId, shifts, employees, onSaved }) => {
  const [shiftId, setShiftId] = useState('');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleToggleEmployee = (id) => {
    setSelectedEmployees((prev) => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(e => e.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shiftId) {
      toast.error('Vui lòng chọn ca làm việc');
      return;
    }
    if (selectedEmployees.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nhân viên');
      return;
    }

    try {
      setLoading(true);
      await hrService.bulkAssignShifts(farmId, {
        shiftId: Number(shiftId),
        shiftDate,
        employeeIds: selectedEmployees,
        note
      });
      toast.success(`Đã phân ca thành công cho ${selectedEmployees.length} nhân viên`);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi phân ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Phân Ca Làm Việc</h2>
              <p className="text-xs text-gray-500">Gán ca kíp làm việc cho các nhân viên trong ngày</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Chọn Ca làm việc *</label>
              <select
                required
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn ca làm việc --</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shiftName} ({s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Ngày áp dụng *</label>
              <input
                type="date"
                required
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">
                Chọn nhân viên ({selectedEmployees.length}/{employees.length})
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {selectedEmployees.length === employees.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 p-2 space-y-1">
              {employees.map((emp) => {
                const isSelected = selectedEmployees.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleEmployee(emp.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                      isSelected ? 'bg-blue-50 text-blue-900 font-medium' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle className="h-3 w-3" />}
                      </div>
                      <div>
                        <div className="text-sm">{emp.fullName}</div>
                        <div className="text-xs text-gray-400">{emp.employeeCode} - {emp.department}</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{emp.position}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Ghi chú phân ca</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Trực thu hoạch sáng sớm, chuẩn bị dụng cụ..."
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang phân ca...' : 'Xác nhận phân ca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
