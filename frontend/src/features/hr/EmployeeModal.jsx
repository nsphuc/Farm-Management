import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, FileText, DollarSign, Calendar, Shield } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { toast } from 'sonner';

export const EmployeeModal = ({ isOpen, onClose, farmId, employee, onSaved }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    employeeCode: '',
    phone: '',
    email: '',
    idCardNumber: '',
    department: '',
    position: '',
    contractType: 'FULL_TIME',
    startDate: '',
    endDate: '',
    baseSalary: '',
    allowance: '',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName || '',
        employeeCode: employee.employeeCode || '',
        phone: employee.phone || '',
        email: employee.email || '',
        idCardNumber: employee.idCardNumber || '',
        department: employee.department || '',
        position: employee.position || '',
        contractType: employee.contractType || 'FULL_TIME',
        startDate: employee.startDate ? employee.startDate.split('T')[0] : '',
        endDate: employee.endDate ? employee.endDate.split('T')[0] : '',
        baseSalary: employee.baseSalary || '',
        allowance: employee.allowance || '',
        status: employee.status || 'ACTIVE'
      });
    } else {
      setFormData({
        fullName: '',
        employeeCode: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: '',
        email: '',
        idCardNumber: '',
        department: 'Sản xuất',
        position: 'Nhân viên nông trại',
        contractType: 'FULL_TIME',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        baseSalary: '',
        allowance: '',
        status: 'ACTIVE'
      });
    }
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên nhân viên');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        baseSalary: formData.baseSalary ? Number(formData.baseSalary) : null,
        allowance: formData.allowance ? Number(formData.allowance) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      if (employee?.id) {
        await hrService.updateEmployee(farmId, employee.id, payload);
        toast.success('Cập nhật nhân viên thành công');
      } else {
        await hrService.createEmployee(farmId, payload);
        toast.success('Thêm mới nhân viên thành công');
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nhân viên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {employee ? 'Cập nhật Hồ sơ Nhân viên' : 'Thêm Nhân viên Mới'}
              </h2>
              <p className="text-xs text-gray-500">Quản lý thông tin định danh, hợp đồng & tiền lương</p>
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
              <label className="mb-1 block text-xs font-semibold text-gray-700">Mã nhân viên *</label>
              <input
                type="text"
                required
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="EMP-001"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Họ và tên *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Số điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="0912345678"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="nva@farm.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Số CCCD / CMND</label>
              <input
                type="text"
                value={formData.idCardNumber}
                onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="001200001234"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Phòng ban / Đội nhóm</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Tổ trồng trọt / Kỹ thuật / Kế toán"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Chức vụ</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Kỹ sư nông nghiệp / Công nhân"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Loại hợp đồng</label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="FULL_TIME">Chính thức (Toàn thời gian)</option>
                <option value="PART_TIME">Bán thời gian</option>
                <option value="SEASONAL">Thời vụ / Mùa vụ</option>
                <option value="INTERN">Thực tập sinh</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Ngày bắt đầu</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Ngày hết hạn HĐ</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Lương cơ bản (VNĐ/tháng)</label>
              <input
                type="number"
                min="0"
                step="100000"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="8,000,000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Phụ cấp (VNĐ/tháng)</label>
              <input
                type="number"
                min="0"
                step="50000"
                value={formData.allowance}
                onChange={(e) => setFormData({ ...formData, allowance: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="1,000,000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Trạng thái làm việc</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">Đang làm việc (Active)</option>
                <option value="PROBATION">Đang thử việc (Probation)</option>
                <option value="ON_LEAVE">Nghỉ phép dài hạn (On Leave)</option>
                <option value="TERMINATED">Đã nghỉ việc (Terminated)</option>
              </select>
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
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : employee ? 'Lưu cập nhật' : 'Thêm nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
