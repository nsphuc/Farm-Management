import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, User, Flag, MapPin, Tag } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { hrService } from '../../services/hrService';
import { cropService } from '../../services/cropService';
import { livestockService } from '../../services/livestockService';
import { farmService } from '../../services/farmService';
import { toast } from 'sonner';

export const CreateTaskModal = ({ isOpen, onClose, farmId, onSaved }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    assignedToId: '',
    supervisorId: '',
    cropSeasonId: '',
    fieldPlotId: '',
    livestockGroupId: ''
  });

  const [employees, setEmployees] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [plots, setPlots] = useState([]);
  const [herds, setHerds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && farmId) {
      loadReferenceData();
    }
  }, [isOpen, farmId]);

  const loadReferenceData = async () => {
    try {
      const [empRes, seasonRes, plotsRes, herdsRes] = await Promise.all([
        hrService.getEmployees(farmId),
        cropService.getSeasons(farmId).catch(() => []),
        farmService.getPlots(farmId).catch(() => []),
        livestockService.getLivestockGroups(farmId).catch(() => [])
      ]);

      const empList = empRes?.items || (Array.isArray(empRes) ? empRes : []);
      setEmployees(empList);
      setSeasons(Array.isArray(seasonRes) ? seasonRes : seasonRes?.items || []);
      setPlots(Array.isArray(plotsRes) ? plotsRes : plotsRes?.items || []);
      setHerds(Array.isArray(herdsRes) ? herdsRes : herdsRes?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề công việc');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        assignedToId: formData.assignedToId ? Number(formData.assignedToId) : null,
        supervisorId: formData.supervisorId ? Number(formData.supervisorId) : null,
        cropSeasonId: formData.cropSeasonId ? Number(formData.cropSeasonId) : null,
        fieldPlotId: formData.fieldPlotId ? Number(formData.fieldPlotId) : null,
        livestockGroupId: formData.livestockGroupId ? Number(formData.livestockGroupId) : null,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
      };

      await taskService.createTask(farmId, payload);
      toast.success('Giao việc thành công');
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo công việc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Giao Việc & Phân Công Nhiệm Vụ</h2>
              <p className="text-xs text-gray-500">Điều phối công việc hiện trường theo mùa vụ, lô đất hoặc đàn vật nuôi</p>
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
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tiêu đề công việc *</label>
            <input
              type="text"
              required
              placeholder="VD: Phun thuốc phòng trừ sâu tơ Lô A1, Dọn chuồng heo đợt 2..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả chi tiết / Hướng dẫn thực hiện</label>
            <textarea
              rows="3"
              placeholder="Ghi rõ yêu cầu quy trình, định lượng phân thuốc hoặc biện pháp an toàn..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="LOW">Thấp (Low)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HIGH">Cao (High)</option>
                <option value="URGENT">Khẩn cấp (Urgent)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hạn hoàn thành (Deadline)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Người thực hiện chính</label>
              <select
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn nhân viên phụ trách --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Người giám sát / Kiểm tra</label>
              <select
                value={formData.supervisorId}
                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn người giám sát --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName} ({e.position || 'Quản lý'})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100 space-y-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Liên kết Khu Vực & Mùa Vụ
            </span>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mùa vụ canh tác</label>
                <select
                  value={formData.cropSeasonId}
                  onChange={(e) => setFormData({ ...formData, cropSeasonId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Trồng trọt: Không --</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.seasonName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Lô đất canh tác</label>
                <select
                  value={formData.fieldPlotId}
                  onChange={(e) => setFormData({ ...formData, fieldPlotId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Lô đất: Không --</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>{p.plotName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Đàn vật nuôi</label>
                <select
                  value={formData.livestockGroupId}
                  onChange={(e) => setFormData({ ...formData, livestockGroupId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Chăn nuôi: Không --</option>
                  {herds.map((h) => (
                    <option key={h.id} value={h.id}>{h.groupCode || h.name}</option>
                  ))}
                </select>
              </div>
            </div>
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
              {loading ? 'Đang giao việc...' : 'Giao việc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
