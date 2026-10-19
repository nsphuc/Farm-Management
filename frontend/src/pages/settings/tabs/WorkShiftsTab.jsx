import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Moon,
  Sun,
} from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Switch } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { extractApiErrors } from '@/utils/apiHelpers';

export function WorkShiftsTab() {
  const { activeFarmId, activeFarm } = useActiveFarmStore();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [scopeType, setScopeType] = useState('ENTERPRISE'); // 'ENTERPRISE' (farmId=null) or 'FARM'
  const [formData, setFormData] = useState({
    shiftCode: '',
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    graceLateMinutes: 15,
    isOvernight: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getWorkShifts({
        farmId: activeFarmId || undefined,
      });
      setShifts(Array.isArray(res) ? res : res?.content || []);
    } catch (err) {
      console.error('Failed to load work shifts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [activeFarmId]);

  // Calculate nominal working hours dynamically
  const calculateNominalHours = (startStr, endStr, breakMin, isOvernight) => {
    if (!startStr || !endStr) return 0;
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    let spanMinutes = 0;
    if (isOvernight) {
      spanMinutes = 24 * 60 - startTotal + endTotal;
    } else {
      spanMinutes = endTotal - startTotal;
    }

    const netMinutes = Math.max(0, spanMinutes - (Number(breakMin) || 0));
    return (netMinutes / 60).toFixed(1);
  };

  const nominalHours = calculateNominalHours(
    formData.startTime,
    formData.endTime,
    formData.breakMinutes,
    formData.isOvernight
  );

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFieldErrors({});
    setGeneralError('');
    if (item) {
      setScopeType(item.farmId ? 'FARM' : 'ENTERPRISE');
      // Ensure HH:mm format
      const start = item.startTime?.substring(0, 5) || '08:00';
      const end = item.endTime?.substring(0, 5) || '17:00';
      setFormData({
        shiftCode: item.shiftCode || '',
        name: item.name || '',
        startTime: start,
        endTime: end,
        breakMinutes: item.breakMinutes ?? 60,
        graceLateMinutes: item.graceLateMinutes ?? 15,
        isOvernight: Boolean(item.isOvernight),
      });
    } else {
      setScopeType('ENTERPRISE');
      setFormData({
        shiftCode: '',
        name: '',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        graceLateMinutes: 15,
        isOvernight: false,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.shiftCode.trim()) errors.shiftCode = 'Mã ca làm việc không được để trống';
    if (!formData.name.trim()) errors.name = 'Tên ca làm việc không được để trống';
    if (!formData.startTime) errors.startTime = 'Giờ bắt đầu không được để trống';
    if (!formData.endTime) errors.endTime = 'Giờ kết thúc không được để trống';

    if (!formData.isOvernight && formData.startTime >= formData.endTime) {
      errors.endTime = 'Nếu không phải ca qua đêm, giờ kết thúc phải sau giờ bắt đầu';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const formatTime = (t) => (t.length === 5 ? `${t}:00` : t);

      const payload = {
        farmId: scopeType === 'FARM' && activeFarmId ? activeFarmId : null,
        shiftCode: formData.shiftCode.toUpperCase().trim(),
        name: formData.name.trim(),
        startTime: formatTime(formData.startTime),
        endTime: formatTime(formData.endTime),
        breakMinutes: Number(formData.breakMinutes),
        graceLateMinutes: Number(formData.graceLateMinutes),
        isOvernight: formData.isOvernight,
      };

      if (editingItem) {
        await masterDataService.updateWorkShift(editingItem.id, payload);
      } else {
        await masterDataService.createWorkShift(payload);
      }

      setModalOpen(false);
      fetchShifts();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setFieldErrors(errInfo.fieldErrors);
      setGeneralError(errInfo.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa ca làm việc này?')) return;
    try {
      await masterDataService.deleteWorkShift(id);
      fetchShifts();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa ca làm việc đã có bảng chấm công!');
    }
  };

  const filteredShifts = shifts.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.shiftCode?.toLowerCase().includes(q);
  });

  const columns = [
    {
      key: 'shiftCode',
      title: 'Mã Ca',
      render: (item) => <span className="font-mono font-bold text-slate-900">{item.shiftCode}</span>,
    },
    {
      key: 'name',
      title: 'Tên Ca Làm Việc',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900">{item.name}</div>
          <div className="text-[11px] text-slate-500">
            {item.farmId ? `Riêng trang trại #${item.farmId}` : 'Dùng chung toàn doanh nghiệp'}
          </div>
        </div>
      ),
    },
    {
      key: 'time',
      title: 'Khung Giờ (Start - End)',
      render: (item) => {
        const start = item.startTime?.substring(0, 5);
        const end = item.endTime?.substring(0, 5);
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {item.isOvernight ? (
              <Moon className="h-3.5 w-3.5 text-indigo-600" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="font-bold text-slate-800">
              {start} - {end}
            </span>
            {item.isOvernight && (
              <span className="rounded bg-indigo-50 px-1 text-[10px] text-indigo-700 font-sans font-bold">
                Qua đêm
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'nominalHours',
      title: 'Giờ Công Danh Định',
      render: (item) => {
        const hours = calculateNominalHours(
          item.startTime?.substring(0, 5),
          item.endTime?.substring(0, 5),
          item.breakMinutes,
          item.isOvernight
        );
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800">
            {hours} giờ
          </span>
        );
      },
    },
    {
      key: 'breakGrace',
      title: 'Nghỉ giữa ca / Ân hạn',
      render: (item) => (
        <span className="text-xs text-slate-600">
          Nghỉ: {item.breakMinutes}p • Trễ: {item.graceLateMinutes}p
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Can permission="PERM_FARM_UPDATE">
            <button
              type="button"
              onClick={() => handleOpenModal(item)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Sửa ca làm việc"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Xóa ca làm việc"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên ca, mã ca..."
            className="pl-9 text-xs"
          />
        </div>

        <Can permission="PERM_FARM_UPDATE">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal(null)}
            icon={<Plus className="h-4 w-4" />}
          >
            + Thêm Ca Làm Việc
          </Button>
        </Can>
      </div>

      <DataTable
        columns={columns}
        data={filteredShifts}
        isLoading={loading}
        emptyStateProps={{
          title: 'Chưa có ca làm việc chuẩn nào',
          description: 'Khởi tạo các ca làm việc (ca sáng, ca chiều, ca gác đêm) để phân ca và chấm công GPS.',
          actionLabel: '+ Thêm Ca Làm Việc',
          onAction: () => handleOpenModal(null),
        }}
      />

      {/* Modal WorkShiftForm */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Cập Nhật Ca Làm Việc' : 'Thêm Mới Ca Làm Việc'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSave}>
              {editingItem ? 'Lưu cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {generalError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Scope radio */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Phạm Vi Áp Dụng Ca</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  scopeType === 'ENTERPRISE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="scopeType"
                  value="ENTERPRISE"
                  checked={scopeType === 'ENTERPRISE'}
                  onChange={() => setScopeType('ENTERPRISE')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Toàn Doanh Nghiệp (Chung)</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  scopeType === 'FARM'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="scopeType"
                  value="FARM"
                  checked={scopeType === 'FARM'}
                  onChange={() => setScopeType('FARM')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Riêng Trang Trại Hiện Tại</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mã Ca Làm Việc" required error={fieldErrors.shiftCode}>
              <Input
                value={formData.shiftCode}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, shiftCode: e.target.value.toUpperCase() }))
                }
                placeholder="VD: CA_SANG, CA_DEM"
                className="font-mono font-bold"
              />
            </FormField>

            <FormField label="Tên Ca Làm Việc" required error={fieldErrors.name}>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Ca Sáng Chuẩn (07:30 - 16:30)"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Giờ Bắt Đầu Ca" required error={fieldErrors.startTime}>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
              />
            </FormField>

            <FormField label="Giờ Kết Thúc Ca" required error={fieldErrors.endTime}>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nghỉ Giữa Ca (Phút)" error={fieldErrors.breakMinutes}>
              <Input
                type="number"
                min="0"
                value={formData.breakMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, breakMinutes: Number(e.target.value) }))
                }
              />
            </FormField>

            <FormField label="Ân Hạn Đi Trễ (Phút)" error={fieldErrors.graceLateMinutes}>
              <Input
                type="number"
                min="0"
                value={formData.graceLateMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, graceLateMinutes: Number(e.target.value) }))
                }
              />
            </FormField>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
            <Switch
              checked={formData.isOvernight}
              onChange={(val) => setFormData((prev) => ({ ...prev, isOvernight: val }))}
              label="Ca Làm Việc Qua Đêm (Qua 00:00)"
              description="Bật khi giờ kết thúc nằm ở ngày hôm sau"
            />

            {/* Read-only Nominal Hours Badge */}
            <div className="text-right">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Tổng Giờ Công Danh Định
              </div>
              <div className="text-base font-black font-mono text-emerald-700">
                {nominalHours} Giờ
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default WorkShiftsTab;
