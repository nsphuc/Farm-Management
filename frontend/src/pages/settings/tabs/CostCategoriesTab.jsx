import React, { useState, useEffect } from 'react';
import {
  Coins,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select, Textarea, CodeInput } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { extractApiErrors } from '@/utils/apiHelpers';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';

const COST_TYPES = [
  { value: 'MATERIALS', label: 'MATERIALS - Chi phí Vật tư trực tiếp (621)' },
  { value: 'DIRECT_LABOR', label: 'DIRECT_LABOR - Chi phí Nhân công trực tiếp (622)' },
  { value: 'MACHINERY_FUEL', label: 'MACHINERY_FUEL - Chi phí Máy móc & Nhiên liệu' },
  { value: 'DEPRECIATION', label: 'DEPRECIATION - Chi phí Khấu hao tài sản/nhà kính' },
  { value: 'INDIRECT_OVERHEAD', label: 'INDIRECT_OVERHEAD - Chi phí Sản xuất chung & Gián tiếp (627)' },
];

export function CostCategoriesTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCostType, setSelectedCostType] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    costType: 'MATERIALS',
    description: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getCostCategories({
        costType: selectedCostType || undefined,
      });
      setData(Array.isArray(res) ? res : res?.content || []);
    } catch (err) {
      console.error('Failed to load cost categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCostType]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFieldErrors({});
    setGeneralError('');
    if (item) {
      setFormData({
        code: item.code || '',
        name: item.name || '',
        costType: item.costType || 'MATERIALS',
        description: item.description || '',
      });
    } else {
      setFormData({
        code: generateEntityCode(CODE_PREFIXES.COST_CATEGORY),
        name: '',
        costType: selectedCostType || 'MATERIALS',
        description: '',
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Mã khoản mục chi phí không được để trống';
    if (!formData.name.trim()) errors.name = 'Tên khoản mục chi phí không được để trống';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const payload = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        costType: formData.costType,
        description: formData.description?.trim() || null,
      };

      if (editingItem) {
        await masterDataService.updateCostCategory(editingItem.id, payload);
      } else {
        await masterDataService.createCostCategory(payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      const errMsg = applyServerFieldErrors(err, setFieldErrors);
      setGeneralError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhóm chi phí này?')) return;
    try {
      await masterDataService.deleteCostCategory(id);
      fetchData();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa nhóm chi phí đã có phát sinh chi phí thực tế!');
    }
  };

  const filteredData = data.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.name?.toLowerCase().includes(q) || item.code?.toLowerCase().includes(q);
  });

  const columns = [
    {
      key: 'code',
      title: 'Mã Khoản Mục',
      render: (item) => <span className="font-mono font-bold text-slate-900">{item.code}</span>,
    },
    {
      key: 'name',
      title: 'Tên Khoản Mục Chi Phí',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900">{item.name}</div>
          {item.description && <div className="text-[11px] text-slate-500">{item.description}</div>}
        </div>
      ),
    },
    {
      key: 'costType',
      title: 'Nhóm Yếu Tố Chi Phí (5 loại)',
      render: (item) => {
        const found = COST_TYPES.find((c) => c.value === item.costType);
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {found ? found.label.split(' - ')[1] : item.costType}
          </span>
        );
      },
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
              title="Sửa nhóm chi phí"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Xóa nhóm chi phí"
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
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã khoản mục..."
              className="pl-9 text-xs"
            />
          </div>
          <div className="w-56">
            <Select
              value={selectedCostType}
              onChange={(e) => setSelectedCostType(e.target.value)}
              options={[{ value: '', label: 'Tất cả loại chi phí' }, ...COST_TYPES]}
            />
          </div>
        </div>

        <Can permission="PERM_FARM_UPDATE">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal(null)}
            icon={<Plus className="h-4 w-4" />}
          >
            + Thêm Nhóm Chi Phí
          </Button>
        </Can>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={loading}
        emptyStateProps={{
          title: 'Chưa có khoản mục chi phí nào',
          description: 'Thiết lập các nhóm chi phí kế toán để tính giá thành vụ mùa và phân bổ gián tiếp.',
          actionLabel: '+ Thêm Nhóm Chi Phí',
          onAction: () => handleOpenModal(null),
        }}
      />

      {/* Modal CostCategoryForm */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Cập Nhật Nhóm Chi Phí' : 'Thêm Mới Nhóm Chi Phí'}
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

          <FormField label="Phân Loại Yếu Tố Chi Phí" required error={fieldErrors.costType}>
            <Select
              value={formData.costType}
              onChange={(e) => setFormData((prev) => ({ ...prev, costType: e.target.value }))}
              options={COST_TYPES}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mã Khoản Mục" required error={fieldErrors.code} hint={editingItem ? 'Mã khoản mục chi phí bất biến' : 'Hệ thống tự động sinh mã gợi ý'}>
              <CodeInput
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                onRegenerate={() =>
                  setFormData((prev) => ({ ...prev, code: generateEntityCode(CODE_PREFIXES.COST_CATEGORY) }))
                }
                isEditMode={Boolean(editingItem)}
                error={fieldErrors.code}
              />
            </FormField>

            <FormField label="Tên Khoản Mục Chi Phí" required error={fieldErrors.name}>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Chi phí phân bón NPK"
              />
            </FormField>
          </div>

          <FormField label="Mô Tả / Diễn Giải Hạch Toán">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="VD: Định khoản vào TK 621, phân bổ theo diện tích luống canh tác..."
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
export default CostCategoriesTab;
