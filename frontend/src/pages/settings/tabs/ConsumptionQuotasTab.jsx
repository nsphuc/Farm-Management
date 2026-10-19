import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { SmartEmptyState } from '@/components/common/SmartEmptyState';
import { Can } from '@/components/common/Can';
import { extractApiErrors } from '@/utils/apiHelpers';

const UNIT_OF_MEASURE_OPTIONS = [
  { value: 'PER_HECTARE', label: 'PER_HECTARE - Cho 1 Hecta (ha)' },
  { value: 'PER_HEAD', label: 'PER_HEAD - Cho 1 Con / Đầu vật nuôi' },
  { value: 'PER_DAY', label: 'PER_DAY - Cho 1 Ngày canh tác' },
];

export function ConsumptionQuotasTab({ onNavigateTab }) {
  const [quotas, setQuotas] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [livestockBreeds, setLivestockBreeds] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [targetType, setTargetType] = useState('CROP'); // 'CROP' or 'LIVESTOCK' (XOR)
  const [formData, setFormData] = useState({
    cropTypeId: '',
    livestockBreedId: '',
    materialId: '',
    standardQuantity: 1,
    unitOfMeasure: 'PER_HECTARE',
    stage: 'Bón lót',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDependencies = async () => {
    try {
      const [cropsRes, breedsRes, matsRes] = await Promise.all([
        masterDataService.getCropTypes({ size: 100 }),
        masterDataService.getLivestockBreeds({ size: 100 }),
        masterDataService.getMaterials({ size: 200 }),
      ]);
      setCropTypes(cropsRes?.content || (Array.isArray(cropsRes) ? cropsRes : []));
      setLivestockBreeds(breedsRes?.content || (Array.isArray(breedsRes) ? breedsRes : []));
      const matsList = matsRes?.content || (Array.isArray(matsRes) ? matsRes : []);
      // Chỉ nạp vật tư ACTIVE
      setMaterials(matsList.filter((m) => m.status === 'ACTIVE' || !m.status));
    } catch (err) {
      console.error('Failed to load quota dependencies', err);
    }
  };

  const fetchQuotas = async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getQuotas({
        page,
        size: 15,
      });
      if (res) {
        setQuotas(res.content || res || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || (res.content ? res.content.length : 0));
      }
    } catch (err) {
      console.error('Failed to load quotas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchQuotas();
  }, [page]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFieldErrors({});
    setGeneralError('');
    if (item) {
      const isLivestock = Boolean(item.livestockBreedId);
      setTargetType(isLivestock ? 'LIVESTOCK' : 'CROP');
      setFormData({
        cropTypeId: item.cropTypeId ? String(item.cropTypeId) : '',
        livestockBreedId: item.livestockBreedId ? String(item.livestockBreedId) : '',
        materialId: item.materialId ? String(item.materialId) : '',
        standardQuantity: item.standardQuantity ?? 1,
        unitOfMeasure: item.unitOfMeasure || 'PER_HECTARE',
        stage: item.stage || '',
        notes: item.notes || '',
      });
    } else {
      setTargetType('CROP');
      setFormData({
        cropTypeId: cropTypes[0]?.id ? String(cropTypes[0]?.id) : '',
        livestockBreedId: '',
        materialId: materials[0]?.id ? String(materials[0]?.id) : '',
        standardQuantity: 10,
        unitOfMeasure: 'PER_HECTARE',
        stage: 'Bón lót',
        notes: '',
      });
    }
    setModalOpen(true);
  };

  // Switch XOR radio
  const handleTargetTypeChange = (type) => {
    setTargetType(type);
    if (type === 'CROP') {
      setFormData((prev) => ({
        ...prev,
        cropTypeId: cropTypes[0]?.id ? String(cropTypes[0]?.id) : '',
        livestockBreedId: '',
        unitOfMeasure: 'PER_HECTARE',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        cropTypeId: '',
        livestockBreedId: livestockBreeds[0]?.id ? String(livestockBreeds[0]?.id) : '',
        unitOfMeasure: 'PER_HEAD',
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (targetType === 'CROP' && !formData.cropTypeId) {
      errors.cropTypeId = 'Vui lòng chọn giống cây trồng';
    }
    if (targetType === 'LIVESTOCK' && !formData.livestockBreedId) {
      errors.livestockBreedId = 'Vui lòng chọn giống vật nuôi';
    }
    if (!formData.materialId) {
      errors.materialId = 'Vui lòng chọn vật tư';
    }
    if (Number(formData.standardQuantity) <= 0) {
      errors.standardQuantity = 'Số lượng tiêu hao định mức phải lớn hơn 0';
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
        cropTypeId: targetType === 'CROP' && formData.cropTypeId ? Number(formData.cropTypeId) : null,
        livestockBreedId:
          targetType === 'LIVESTOCK' && formData.livestockBreedId
            ? Number(formData.livestockBreedId)
            : null,
        materialId: Number(formData.materialId),
        standardQuantity: Number(formData.standardQuantity),
        unitOfMeasure: formData.unitOfMeasure,
        stage: formData.stage?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      if (editingItem) {
        await masterDataService.updateQuota(editingItem.id, payload);
      } else {
        await masterDataService.createQuota(payload);
      }

      setModalOpen(false);
      fetchQuotas();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setFieldErrors(errInfo.fieldErrors);
      setGeneralError(errInfo.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa dòng định mức tiêu hao này?')) return;
    try {
      await masterDataService.deleteQuota(id);
      fetchQuotas();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa định mức BOM!');
    }
  };

  // If missing crop types or materials, show SmartEmptyState
  if (cropTypes.length === 0 && livestockBreeds.length === 0) {
    return (
      <SmartEmptyState
        title="Chưa Có Danh Mục Giống Nông Nghiệp"
        description="Để lập định mức tiêu hao kỹ thuật (BOM), bạn cần tạo Giống cây trồng hoặc Giống vật nuôi trước."
        actionLabel="Chuyển sang Tab Giống Cây Trồng &rarr;"
        onAction={() => onNavigateTab?.('crop-types')}
      />
    );
  }

  if (materials.length === 0) {
    return (
      <SmartEmptyState
        title="Chưa Có Mặt Hàng Vật Tư Nào"
        description="Hệ thống cần danh sách phân bón, thuốc BVTV hoặc thức ăn chăn nuôi để gán định mức kỹ thuật."
        actionLabel="Chuyển sang Tab Danh Mục Vật Tư &rarr;"
        onAction={() => onNavigateTab?.('materials')}
      />
    );
  }

  const columns = [
    {
      key: 'target',
      title: 'Đối Tượng Áp Dụng (Cây / Con)',
      render: (item) => {
        if (item.cropTypeName || item.cropTypeId) {
          return (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                Cây trồng
              </span>
              <span className="font-semibold text-slate-900">
                {item.cropTypeName || `Giống #${item.cropTypeId}`}
              </span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
              Vật nuôi
            </span>
            <span className="font-semibold text-slate-900">
              {item.livestockBreedName || `Giống #${item.livestockBreedId}`}
            </span>
          </div>
        );
      },
    },
    {
      key: 'material',
      title: 'Vật Tư Tiêu Hao',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900">{item.materialName || `Vật tư #${item.materialId}`}</div>
          {item.materialSku && <div className="text-[10px] text-slate-400 font-mono">{item.materialSku}</div>}
        </div>
      ),
    },
    {
      key: 'quota',
      title: 'Định Mức Tiêu Chuẩn',
      render: (item) => {
        const uom = UNIT_OF_MEASURE_OPTIONS.find((u) => u.value === item.unitOfMeasure);
        return (
          <div className="font-mono text-xs">
            <span className="font-bold text-emerald-700">{item.standardQuantity}</span>{' '}
            <span className="text-slate-500 font-normal">
              {item.materialStandardUnit || ''} / {uom ? uom.label.split(' - ')[1] : item.unitOfMeasure}
            </span>
          </div>
        );
      },
    },
    {
      key: 'stage',
      title: 'Giai Đoạn Áp Dụng',
      render: (item) => <span className="text-xs text-slate-700">{item.stage || 'Toàn chu kỳ'}</span>,
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
              title="Sửa định mức"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Xóa định mức"
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
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Định Mức Tiêu Hao Kỹ Thuật (Bill of Materials - BOM)
          </h3>
          <p className="text-xs text-slate-500">
            Tự động tính toán lượng phân bón, thuốc hoặc thức ăn cần xuất kho theo diện tích hoặc quy mô đàn
          </p>
        </div>

        <Can permission="PERM_FARM_UPDATE">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal(null)}
            icon={<Plus className="h-4 w-4" />}
          >
            + Thêm Định Mức BOM
          </Button>
        </Can>
      </div>

      <DataTable
        columns={columns}
        data={quotas}
        isLoading={loading}
        page={page}
        pageSize={15}
        totalElements={totalElements}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyStateProps={{
          title: 'Chưa có định mức tiêu hao nào',
          description: 'Tạo định mức BOM để hệ thống tự động sinh kế hoạch cấp phát vật tư cho mùa vụ.',
          actionLabel: '+ Thêm Định Mức BOM',
          onAction: () => handleOpenModal(null),
        }}
      />

      {/* Modal ConsumptionQuotaForm */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Cập Nhật Định Mức Tiêu Hao BOM' : 'Thêm Mới Định Mức Tiêu Hao BOM'}
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
        <form onSubmit={handleSave} className="space-y-5">
          {generalError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Radio XOR Cây Trồng vs Vật Nuôi */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              1. Chọn Loại Đối Tượng Canh Tác (XOR)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  targetType === 'CROP'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="targetType"
                  value="CROP"
                  checked={targetType === 'CROP'}
                  onChange={() => handleTargetTypeChange('CROP')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Cây Trồng (Crop Type)</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  targetType === 'LIVESTOCK'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="targetType"
                  value="LIVESTOCK"
                  checked={targetType === 'LIVESTOCK'}
                  onChange={() => handleTargetTypeChange('LIVESTOCK')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span>Vật Nuôi (Livestock Breed)</span>
              </label>
            </div>
          </div>

          {/* Dropdown Giống Cây Trồng or Vật Nuôi */}
          {targetType === 'CROP' ? (
            <FormField label="Giống Cây Trồng Áp Dụng" required error={fieldErrors.cropTypeId}>
              <Select
                value={formData.cropTypeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, cropTypeId: e.target.value }))}
                options={cropTypes.map((c) => ({
                  value: String(c.id),
                  label: `${c.varietyCode} - ${c.name}`,
                }))}
              />
            </FormField>
          ) : (
            <FormField label="Giống Vật Nuôi Áp Dụng" required error={fieldErrors.livestockBreedId}>
              <Select
                value={formData.livestockBreedId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, livestockBreedId: e.target.value }))
                }
                options={livestockBreeds.map((b) => ({
                  value: String(b.id),
                  label: `[${b.species}] ${b.breedName}`,
                }))}
              />
            </FormField>
          )}

          {/* Vật tư tiêu hao (Chỉ ACTIVE) */}
          <FormField label="Mặt Hàng Vật Tư Tiêu Hao" required error={fieldErrors.materialId}>
            <Select
              value={formData.materialId}
              onChange={(e) => setFormData((prev) => ({ ...prev, materialId: e.target.value }))}
              options={materials.map((m) => ({
                value: String(m.id),
                label: `[${m.skuCode}] ${m.name} (${m.standardUnit})`,
              }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Định Mức Tiêu Hao Chuẩn" required error={fieldErrors.standardQuantity}>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.standardQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, standardQuantity: Number(e.target.value) }))
                }
              />
            </FormField>

            <FormField label="Đơn Vị Định Mức" required error={fieldErrors.unitOfMeasure}>
              <Select
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData((prev) => ({ ...prev, unitOfMeasure: e.target.value }))}
                options={UNIT_OF_MEASURE_OPTIONS}
              />
            </FormField>
          </div>

          <FormField label="Giai Đoạn Canh Tác / Nuôi Áp Dụng" error={fieldErrors.stage}>
            <Input
              value={formData.stage}
              onChange={(e) => setFormData((prev) => ({ ...prev, stage: e.target.value }))}
              placeholder="VD: Bón lót trước khi gieo, Tuần tuổi 1-4, Nuôi vỗ béo..."
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
export default ConsumptionQuotasTab;
