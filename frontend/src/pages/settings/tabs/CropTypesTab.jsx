import React, { useState, useEffect } from 'react';
import { Sprout, Plus, Search, Edit2, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, CodeInput } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { extractApiErrors } from '@/utils/apiHelpers';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';

export function CropTypesTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    varietyCode: '',
    growthDaysStandard: 90,
    waterNeedM3Day: 0,
    optimalTempMin: 20,
    optimalTempMax: 32,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getCropTypes({
        keyword: search || undefined,
        page,
        size: 15,
      });
      if (res) {
        setData(res.content || res || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || (res.content ? res.content.length : 0));
      }
    } catch (err) {
      console.error('Failed to load crop types', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFieldErrors({});
    setGeneralError('');
    if (item) {
      setFormData({
        name: item.name || '',
        varietyCode: item.varietyCode || '',
        growthDaysStandard: item.growthDaysStandard || 90,
        waterNeedM3Day: item.waterNeedM3Day || 0,
        optimalTempMin: item.optimalTempMin ?? 20,
        optimalTempMax: item.optimalTempMax ?? 32,
      });
    } else {
      setFormData({
        name: '',
        varietyCode: generateEntityCode(CODE_PREFIXES.VARIETY),
        growthDaysStandard: 90,
        waterNeedM3Day: 0,
        optimalTempMin: 20,
        optimalTempMax: 32,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Tên giống cây trồng không được để trống';
    if (!formData.varietyCode.trim()) {
      errors.varietyCode = 'Mã giống cây trồng không được để trống';
    } else if (!/^[A-Z0-9_-]{2,50}$/.test(formData.varietyCode)) {
      errors.varietyCode = 'Mã giống chỉ gồm ký tự A-Z, 0-9, gạch dưới và gạch ngang (2-50 ký tự)';
    }
    if (Number(formData.growthDaysStandard) <= 0) {
      errors.growthDaysStandard = 'Thời gian sinh trưởng chuẩn phải lớn hơn 0';
    }
    if (
      formData.optimalTempMin !== '' &&
      formData.optimalTempMax !== '' &&
      Number(formData.optimalTempMin) > Number(formData.optimalTempMax)
    ) {
      errors.optimalTempMax = 'Nhiệt độ tối đa phải lớn hơn hoặc bằng nhiệt độ tối thiểu';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');
      if (editingItem) {
        await masterDataService.updateCropType(editingItem.id, formData);
      } else {
        await masterDataService.createCropType(formData);
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa giống cây trồng này?')) return;
    try {
      await masterDataService.deleteCropType(id);
      fetchData();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa giống cây trồng đã phát sinh dữ liệu vụ mùa!');
    }
  };

  const columns = [
    {
      key: 'varietyCode',
      title: 'Mã Giống',
      render: (item) => <span className="font-mono font-bold text-emerald-800">{item.varietyCode}</span>,
    },
    {
      key: 'name',
      title: 'Tên Giống Cây Trồng',
      render: (item) => <span className="font-semibold text-slate-900">{item.name}</span>,
    },
    {
      key: 'growthDaysStandard',
      title: 'Chu kỳ chuẩn (Ngày)',
      render: (item) => <span>{item.growthDaysStandard} ngày</span>,
    },
    {
      key: 'waterNeedM3Day',
      title: 'Nhu cầu nước (m³/ngày)',
      render: (item) => <span>{item.waterNeedM3Day || 0}</span>,
    },
    {
      key: 'optimalTemp',
      title: 'Nhiệt độ thích hợp',
      render: (item) => (
        <span>
          {item.optimalTempMin}°C - {item.optimalTempMax}°C
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
              title="Sửa"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Xóa"
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
            placeholder="Tìm theo tên, mã giống..."
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
            + Thêm Giống Cây Trồng
          </Button>
        </Can>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        page={page}
        pageSize={15}
        totalElements={totalElements}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyStateProps={{
          title: 'Chưa có giống cây trồng nào',
          description: 'Tạo giống cây trồng để thiết lập định mức BOM và quản lý mùa vụ trồng trọt.',
          actionLabel: '+ Tạo Giống Cây Trồng',
          onAction: () => handleOpenModal(null),
        }}
      />

      {/* Modal CropTypeForm */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Cập Nhật Giống Cây Trồng' : 'Thêm Mới Giống Cây Trồng'}
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

          <FormField label="Tên Giống Cây Trồng" required error={fieldErrors.name}>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="VD: Cà chua Cherry đỏ F1"
            />
          </FormField>

          <FormField
            label="Mã Giống Cây Trồng (Variety Code)"
            required
            error={fieldErrors.varietyCode}
            hint={editingItem ? 'Mã giống bất biến' : 'Hệ thống tự động sinh mã gợi ý'}
          >
            <CodeInput
              value={formData.varietyCode}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, varietyCode: e.target.value.toUpperCase() }))
              }
              onRegenerate={() =>
                setFormData((prev) => ({ ...prev, varietyCode: generateEntityCode(CODE_PREFIXES.VARIETY) }))
              }
              isEditMode={Boolean(editingItem)}
              error={fieldErrors.varietyCode}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Chu Kỳ Sinh Trưởng Chuẩn (Ngày)" required error={fieldErrors.growthDaysStandard}>
              <Input
                type="number"
                min="1"
                value={formData.growthDaysStandard}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, growthDaysStandard: Number(e.target.value) }))
                }
              />
            </FormField>

            <FormField label="Nhu Cầu Nước (m³/ngày)" error={fieldErrors.waterNeedM3Day}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.waterNeedM3Day}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, waterNeedM3Day: Number(e.target.value) }))
                }
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nhiệt Độ Tối Thiểu (°C)" error={fieldErrors.optimalTempMin}>
              <Input
                type="number"
                step="0.5"
                value={formData.optimalTempMin}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, optimalTempMin: Number(e.target.value) }))
                }
              />
            </FormField>

            <FormField label="Nhiệt Độ Tối Đa (°C)" error={fieldErrors.optimalTempMax}>
              <Input
                type="number"
                step="0.5"
                value={formData.optimalTempMax}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, optimalTempMax: Number(e.target.value) }))
                }
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default CropTypesTab;
