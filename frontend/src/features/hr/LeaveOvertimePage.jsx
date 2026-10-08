import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  Calendar, 
  Check, 
  X, 
  Plus, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Briefcase
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { hrService } from '../../services/hrService';
import { toast } from 'sonner';

export const LeaveOvertimePage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [activeTab, setActiveTab] = useState('LEAVE'); // 'LEAVE' | 'OVERTIME'
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal tạo đơn nghỉ phép
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    totalDays: 1,
    reason: ''
  });

  // Modal tạo đơn tăng ca
  const [isOtModalOpen, setIsOtModalOpen] = useState(false);
  const [otForm, setOtForm] = useState({
    employeeId: '',
    overtimeDate: '',
    startTime: '17:30:00',
    endTime: '20:30:00',
    totalHours: 3.0,
    reason: ''
  });

  useEffect(() => {
    if (farmId) {
      loadEmployees();
      loadRequests();
    }
  }, [farmId]);

  const loadEmployees = async () => {
    try {
      const res = await hrService.getEmployees(farmId);
      const items = res?.items || (Array.isArray(res) ? res : []);
      setEmployees(items);
      if (items.length > 0) {
        setLeaveForm(prev => ({ ...prev, employeeId: items[0].id }));
        setOtForm(prev => ({ ...prev, employeeId: items[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [leaves, ots] = await Promise.all([
        hrService.getLeaveRequests(farmId),
        hrService.getOvertimeRequests(farmId)
      ]);
      setLeaveRequests(leaves?.items || (Array.isArray(leaves) ? leaves : []));
      setOvertimeRequests(ots?.items || (Array.isArray(ots) ? ots : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    try {
      await hrService.createLeaveRequest(farmId, {
        ...leaveForm,
        employeeId: Number(leaveForm.employeeId),
        totalDays: Number(leaveForm.totalDays)
      });
      toast.success('Gửi đơn xin nghỉ phép thành công');
      setIsLeaveModalOpen(false);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn nghỉ phép');
    }
  };

  const handleCreateOt = async (e) => {
    e.preventDefault();
    try {
      await hrService.createOvertimeRequest(farmId, {
        ...otForm,
        employeeId: Number(otForm.employeeId),
        totalHours: Number(otForm.totalHours)
      });
      toast.success('Gửi đăng ký tăng ca thành công');
      setIsOtModalOpen(false);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký tăng ca');
    }
  };

  const handleReviewLeave = async (id, status) => {
    const reviewNote = window.prompt(`Nhập lý do hoặc nhận xét duyệt (${status === 'APPROVED' ? 'Đồng ý' : 'Từ chối'}):`);
    if (reviewNote === null) return;

    try {
      await hrService.reviewLeaveRequest(farmId, id, {
        status,
        reviewNote
      });
      toast.success(`Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} đơn nghỉ phép`);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleReviewOt = async (id, status) => {
    const reviewNote = window.prompt(`Nhập lý do hoặc nhận xét duyệt (${status === 'APPROVED' ? 'Đồng ý' : 'Từ chối'}):`);
    if (reviewNote === null) return;

    try {
      await hrService.reviewOvertimeRequest(farmId, id, {
        status,
        reviewNote
      });
      toast.success(`Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} đơn tăng ca`);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200"><CheckCircle2 className="h-3.5 w-3.5" /> Đã duyệt</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200"><XCircle className="h-3.5 w-3.5" /> Bị từ chối</span>;
      case 'PENDING':
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><Clock className="h-3.5 w-3.5" /> Chờ duyệt</span>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản Lý Nghỉ Phép & Tăng Ca</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tiếp nhận đơn xin phép nghỉ việc, chấm công làm thêm giờ và phê duyệt trực tuyến
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <Plus className="h-4 w-4 text-emerald-600" />
            Tạo Đơn Nghỉ Phép
          </button>

          <button
            onClick={() => setIsOtModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition"
          >
            <Clock className="h-4 w-4" />
            Đăng Ký Tăng Ca (OT)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('LEAVE')}
          className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-bold transition ${
            activeTab === 'LEAVE'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          Đơn Xin Nghỉ Phép ({leaveRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('OVERTIME')}
          className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-bold transition ${
            activeTab === 'OVERTIME'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          Đăng Ký Tăng Ca ({overtimeRequests.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {activeTab === 'LEAVE' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Nhân viên</th>
                  <th className="px-5 py-3.5">Loại phép</th>
                  <th className="px-5 py-3.5">Thời gian nghỉ</th>
                  <th className="px-5 py-3.5">Lý do</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Phê duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-sm text-gray-400">
                      Chưa có đơn xin nghỉ phép nào
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((item) => {
                    const emp = employees.find(e => e.id === item.employeeId);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3.5 font-semibold text-gray-900">
                          <div>{emp?.fullName || `ID: ${item.employeeId}`}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{emp?.employeeCode}</div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-medium text-gray-700">
                          {item.leaveType === 'ANNUAL' ? 'Phép năm' :
                           item.leaveType === 'SICK' ? 'Nghỉ ốm' :
                           item.leaveType === 'MATERNITY' ? 'Thai sản' :
                           item.leaveType === 'UNPAID' ? 'Không lương' : 'Khác'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">
                          <div>{item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : ''} đến {item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : ''}</div>
                          <div className="text-[11px] font-bold text-emerald-700">{item.totalDays} ngày</div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 max-w-xs truncate">
                          {item.reason || '—'}
                          {item.reviewNote && (
                            <div className="text-[11px] text-gray-400 italic">Nhận xét: {item.reviewNote}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {item.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleReviewLeave(item.id, 'APPROVED')}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                <Check className="h-3.5 w-3.5" /> Duyệt
                              </button>
                              <button
                                onClick={() => handleReviewLeave(item.id, 'REJECTED')}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                              >
                                <X className="h-3.5 w-3.5" /> Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Đã xong</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Nhân viên</th>
                  <th className="px-5 py-3.5">Ngày tăng ca</th>
                  <th className="px-5 py-3.5">Khung giờ</th>
                  <th className="px-5 py-3.5">Tổng số giờ</th>
                  <th className="px-5 py-3.5">Lý do / Công việc</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Phê duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overtimeRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-sm text-gray-400">
                      Chưa có đơn xin tăng ca nào
                    </td>
                  </tr>
                ) : (
                  overtimeRequests.map((item) => {
                    const emp = employees.find(e => e.id === item.employeeId);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3.5 font-semibold text-gray-900">
                          <div>{emp?.fullName || `ID: ${item.employeeId}`}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{emp?.employeeCode}</div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-medium text-gray-800">
                          {item.overtimeDate ? new Date(item.overtimeDate).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">
                          {item.startTime?.substring(0, 5)} - {item.endTime?.substring(0, 5)}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-purple-700">
                          {item.totalHours} giờ
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 max-w-xs truncate">
                          {item.reason || '—'}
                          {item.reviewNote && (
                            <div className="text-[11px] text-gray-400 italic">Nhận xét: {item.reviewNote}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {item.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleReviewOt(item.id, 'APPROVED')}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                <Check className="h-3.5 w-3.5" /> Duyệt
                              </button>
                              <button
                                onClick={() => handleReviewOt(item.id, 'REJECTED')}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                              >
                                <X className="h-3.5 w-3.5" /> Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Đã xong</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tạo Đơn Nghỉ Phép */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">Tạo Đơn Xin Nghỉ Phép</h2>
            <form onSubmit={handleCreateLeave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nhân viên xin nghỉ *</label>
                <select
                  required
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Loại phép *</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="ANNUAL">Nghỉ phép năm</option>
                    <option value="SICK">Nghỉ ốm / Khám bệnh</option>
                    <option value="MATERNITY">Nghỉ thai sản</option>
                    <option value="UNPAID">Nghỉ việc riêng không lương</option>
                    <option value="OTHER">Lý do khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tổng số ngày *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={leaveForm.totalDays}
                    onChange={(e) => setLeaveForm({ ...leaveForm, totalDays: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Từ ngày *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Đến ngày *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lý do xin nghỉ *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Nêu rõ lý do để quản lý phê duyệt..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow"
                >
                  Gửi đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đăng Ký Tăng Ca */}
      {isOtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">Đăng Ký Làm Thêm Giờ (Overtime)</h2>
            <form onSubmit={handleCreateOt} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nhân viên tăng ca *</label>
                <select
                  required
                  value={otForm.employeeId}
                  onChange={(e) => setOtForm({ ...otForm, employeeId: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày làm thêm *</label>
                  <input
                    type="date"
                    required
                    value={otForm.overtimeDate}
                    onChange={(e) => setOtForm({ ...otForm, overtimeDate: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số giờ đăng ký *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={otForm.totalHours}
                    onChange={(e) => setOtForm({ ...otForm, totalHours: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={otForm.startTime}
                    onChange={(e) => setOtForm({ ...otForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giờ kết thúc *</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={otForm.endTime}
                    onChange={(e) => setOtForm({ ...otForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nhiệm vụ cụ thể / Lý do tăng ca *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="VD: Cần đóng gói gấp đơn rau xuất khẩu sáng mai..."
                  value={otForm.reason}
                  onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsOtModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 shadow"
                >
                  Gửi đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
