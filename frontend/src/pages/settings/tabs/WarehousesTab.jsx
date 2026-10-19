import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Thermometer,
  Boxes,
} from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { employeeService } from '@/services/modules/employeeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SmartEmptyState } from '@/components/common/SmartEmptyState';
import { Can } from '@/components/common/Can';
import { extractApiErrors } from '@/utils/apiHelpers';

const WAREHOUSE_TYPES = [
  { value: 'FERTILIZER', label: 'FERTILIZER - Kho Phân bón' },
  { value: 'PESTICIDE', label: 'PESTICIDE - Kho Thuốc BVTV' },
  { value: 'ANIMAL_FEED', label: 'ANIMAL_FEED - Kho Thức ăn chăn nuôi' },
  { value: 'HARVESTED_PRODUCE', label: 'HARVESTED_PRODUCE - Kho Nông sản sau thu hoạch' },
  { value: 'COLD_STORAGE', label: 'COLD_STORAGE - Kho Lạnh bảo quản' },
  { value: 'TOOLS_EQUIPMENT', label: 'TOOLS_EQUIPMENT - Kho Công cụ & Thiết bị' },
  { value: 'GENERAL', label: 'GENERAL - Kho Tổng hợp' },
];

const WAREHOUSE_STATUSES = [
  { value: 'ACTIVE', label: 'ACTIVE - Đang hoạt động' },
  { value: 'INACTIVE', label: 'INACTIVE - Tạm dừng' },
  { value: 'FULL', label: 'FULL - Đã đầy kho' },
];

export function WarehousesTab() {
  const { activeFarmId, activeFarm } = useActiveFarmStore();

  const [warehouses, setWarehouses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    warehouseType: 'GENERAL',
    capacityM3: 0,
    floorAreaM2: 0,
    standardTempC: '',
    standardHumidityPct: '',
    locationDesc: '',
    managerUserId: '',
    status: 'ACTIVE',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchWarehouses = async () => {
    if (!activeFarmId) return;
    try {
      setLoading(true);
      const res = await masterDataService.getWarehouses(activeFarmId);
      setWarehouses(Array.isArray(res) ? res : res?.content || []);
    } catch (err) {
      console.error('Failed to load warehouses', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await employeeService.getEmployees({ farmId: activeFarmId || undefined, size: 100 });
      setEmployees(res?.content || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load employees for warehouse manager', err);
    }
  };

  useEffect(() => {
    if (activeFarmId) {
      fetchWarehouses();
      fetchEmployees();
    }
  }, [activeFarmId]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFieldErrors({});
    setGeneralError('');
    if (item) {
      setFormData({
        code: item.code || '',
        name: item.name || '',
        warehouseType: item.warehouseType || 'GENERAL',
        capacityM3: item.capacityM3 ?? 0,
        floorAreaM2: item.floorAreaM2 ?? 0,
        standardTempC: item.standardTempC ?? '',
        standardHumidityPct: item.standardHumidityPct ?? '',
        locationDesc: item.locationDesc || '',
        managerUserId: item.managerUserId ? String(item.managerUserId) : '',
        status: item.status || 'ACTIVE',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        warehouseType: 'GENERAL',
        capacityM3: 0,
        floorAreaM2: 0,
        standardTempC: '',
        standardHumidityPct: '',
        locationDesc: '',
        managerUserId: '',
        status: 'ACTIVE',
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Mã kho không được để trống';
    if (!formData.name.trim()) errors.name = 'Tên kho không được để trống';
    if (formData.warehouseType === 'COLD_STORAGE' && (formData.standardTempC === '' || isNaN(Number(formData.standardTempC)))) {
      errors.standardTempC = 'Kho lạnh bắt buộc phải thiết lập nhiệt độ chuẩn (°C)';
    }
    if (formData.standardHumidityPct !== '') {
      const hum = Number(formData.standardHumidityPct);
      if (hum < 0 || hum > 100) {
        errors.standardHumidityPct = 'Độ ẩm chuẩn phải nằm trong khoảng từ 0% đến 100%';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        capacityM3: formData.capacityM3 !== '' ? Number(formData.capacityM3) : null,
        floorAreaM2: formData.floorAreaM2 !== '' ? Number(formData.floorAreaM2) : null,
        standardTempC: formData.standardTempC !== '' ? Number(formData.standardTempC) : null,
        standardHumidityPct: formData.standardHumidityPct !== '' ? Number(formData.standardHumidityPct) : null,
        managerUserId: formData.managerUserId ? Number(formData.managerUserId) : null,
      };

      if (editingItem) {
        await masterDataService.updateWarehouse(activeFarmId, editingItem.id, payload);
      } else {
        await masterDataService.createWarehouse(activeFarmId, payload);
      }
      setModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setFieldErrors(errInfo.fieldErrors);
      setGeneralError(errInfo.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kho bãi này?')) return;
    try {
      await masterDataService.deleteWarehouse(activeFarmId, id);
      fetchWarehouses();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa kho bãi đã phát sinh tồn kho hoặc phiếu kho!');
    }
  };

  if (!activeFarmId) {
    return (
      <SmartEmptyState
        title="Chưa Chọn Trang Trại Tác Nghiệp"
        description="Vui lòng chọn trang trại hoạt động từ thanh điều hướng trên cùng để quản lý hệ thống kho bãi."
      />
    );
  }

  const filteredWarehouses = warehouses.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      w.name?.toLowerCase().includes(q) ||
      w.code?.toLowerCase().includes(q) ||
      w.warehouseType?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: 'code',
      title: 'Mã Kho',
      render: (item) => <span className="font-mono font-bold text-slate-900">{item.code}</span>,
    },
    {
      key: 'name',
      title: 'Tên Kho Bãi',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900">{item.name}</div>
          {item.locationDesc && <div className="text-[11px] text-slate-500">{item.locationDesc}</div>}
        </div>
      ),
    },
    {
      key: 'warehouseType',
      title: 'Phân Loại Kho',
      render: (item) => {
        const found = WAREHOUSE_TYPES.find((t) => t.value === item.warehouseType);
        return (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
            {found ? found.label.split(' - ')[1] : item.warehouseType}
          </span>
        );
      },
    },
    {
      key: 'capacity',
      title: 'Diện Tích / Dung Tích',
      render: (item) => (
        <div className="text-xs">
          <div>{item.floorAreaM2 ? `${item.floorAreaM2} m²` : '—'}</div>
          <div className="text-[10px] text-slate-400">{item.capacityM3 ? `${item.capacityM3} m³` : ''}</div>
        </div>
      ),
    },
    {
      key: 'climate',
      title: 'Nhiệt Độ / Độ Ẩm',
      render: (item) => {
        if (item.standardTempC === null && item.standardHumidityPct === null) return '—';
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {item.standardTempC !== null && (
              <span className="inline-flex items-center text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                <Thermometer className="h-3 w-3 mr-0.5" />
                {item.standardTempC}°C
              </span>
            )}
            {item.standardHumidityPct !== null && (
              <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {item.standardHumidityPct}%
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Can permission="PERM_INVENTORY_RECEIPT">
            <button
              type="button"
              onClick={() => handleOpenModal(item)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Sửa kho"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Xóa kho"
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
            placeholder="Tìm theo tên kho, mã kho..."
            className="pl-9 text-xs"
          />
        </div>

        <Can permission="PERM_INVENTORY_RECEIPT">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal(null)}
            icon={<Plus className="h-4 w-4" />}
          >
            + Thêm Kho Bãi
          </Button>
        </Can>
      </div>

      <DataTable
        columns={columns}
        data={filteredWarehouses}
        isLoading={loading}
        emptyStateProps={{
          title: 'Chưa có kho bãi nào trong trang trại',
          description: 'Khởi tạo các kho vật tư, phân bón hoặc kho bảo quản nông sản để quản lý tồn kho.',
          actionLabel: '+ Thêm Kho Bãi',
          onAction: () => handleOpenModal(null),
        }}
      />

      {/* Warehouse Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Cập Nhật Kho Bãi' : 'Thêm Mới Kho Bãi'}
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

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mã Kho" required error={fieldErrors.code}>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                placeholder="VD: KHO-PB-01"
                className="font-mono font-bold"
              />
            </FormField>

            <FormField label="Tên Kho Bãi" required error={fieldErrors.name}>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Kho Phân Bón Phía Bắc"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phân Loại Kho (7 loại)" required error={fieldErrors.warehouseType}>
              <Select
                value={formData.warehouseType}
                onChange={(e) => setFormData((prev) => ({ ...prev, warehouseType: e.target.value }))}
                options={WAREHOUSE_TYPES}
              />
            </FormField>

            <FormField label="Trạng Thái" required error={fieldErrors.status}>
              <Select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                options={WAREHOUSE_STATUSES}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Diện Tích Sàn (m²)" error={fieldErrors.floorAreaM2}>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={formData.floorAreaM2}
                onChange={(e) => setFormData((prev) => ({ ...prev, floorAreaM2: e.target.value }))}
              />
            </FormField>

            <FormField label="Dung Tích Chứa (m³)" error={fieldErrors.capacityM3}>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={formData.capacityM3}
                onChange={(e) => setFormData((prev) => ({ ...prev, capacityM3: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Nhiệt Độ Chuẩn (°C)"
              required={formData.warehouseType === 'COLD_STORAGE'}
              error={fieldErrors.standardTempC}
              hint={formData.warehouseType === 'COLD_STORAGE' ? 'Bắt buộc với Kho Lạnh' : undefined}
            >
              <Input
                type="number"
                step="0.5"
                value={formData.standardTempC}
                onChange={(e) => setFormData((prev) => ({ ...prev, standardTempC: e.target.value }))}
                placeholder="VD: 4.5"
              />
            </FormField>

            <FormField label="Độ Ẩm Chuẩn (%)" error={fieldErrors.standardHumidityPct}>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.standardHumidityPct}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, standardHumidityPct: e.target.value }))
                }
                placeholder="VD: 75"
              />
            </FormField>
          </div>

          <FormField label="Thủ Kho / Người Phụ Trách">
            <Select
              value={formData.managerUserId}
              onChange={(e) => setFormData((prev) => ({ ...prev, managerUserId: e.target.value }))}
              options={[
                { value: '', label: '-- Chọn nhân viên quản lý --' },
                ...employees.map((emp) => ({
                  value: String(emp.userId || emp.id),
                  label: `${emp.fullName} (${emp.employeeCode || emp.position || 'Nhân viên'})`,
                })),
              ]}
            />
          </FormField>

          <FormField label="Mô Tả Vị Trí Địa Lý Kho">
            <Textarea
              value={formData.locationDesc}
              onChange={(e) => setFormData((prev) => ({ ...prev, locationDesc: e.target.value }))}
              rows={2}
              placeholder="VD: Nằm cạnh cổng số 2, đối diện trạm bơm khu A"
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
export default WarehousesTab;
