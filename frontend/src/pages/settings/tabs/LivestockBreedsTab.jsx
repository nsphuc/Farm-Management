import React, { useState, useEffect } from 'react';
import { PawPrint, Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { extractApiErrors } from '@/utils/apiHelpers';

const SPECIES_OPTIONS = [
  { value: 'CATTLE', label: 'CATTLE - Bò / Trâu' },
  { value: 'SWINE', label: 'SWINE - Heo / Lợn' },
  { value: 'POULTRY', label: 'POULTRY - Gia cầm (Gà, Vịt, Cút)' },
  { value: 'GOAT', label: 'GOAT - Dê' },
  { value: 'SHEEP', label: 'SHEEP - Cừu' },
  { value: 'AQUA', label: 'AQUA - Thủy sản (Tôm, Cá)' },
];

export function LivestockBreedsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    species: 'POULTRY',
    breedName: '',
    standardGrowthDays: 60,
    targetWeightKg: 2.5,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getLivestockBreeds({
        species: selectedSpecies || undefined,
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
      console.error('Failed to load livestock breeds', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, selectedSpecies]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFieldErrors({});
    setGeneralError('');
    if (item) {
      setFormData({
        species: item.species || 'POULTRY',
        breedName: item.breedName || '',
        standardGrowthDays: item.standardGrowthDays || 60,
        targetWeightKg: item.targetWeightKg || 2.5,
      });
    } else {
      setFormData({
        species: selectedSpecies || 'POULTRY',
        breedName: '',
        standardGrowthDays: 60,
        targetWeightKg: 2.5,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.breedName.trim()) errors.breedName = 'Tên giống vật nuôi không được để trống';
    if (Number(formData.standardGrowthDays) <= 0) {
      errors.standardGrowthDays = 'Thời gian nuôi chuẩn phải lớn hơn 0 ngày';
    }
    if (Number(formData.targetWeightKg) <= 0) {
      errors.targetWeightKg = 'Trọng lượng xuất chuồng mục tiêu phải lớn hơn 0 kg';
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
        await masterDataService.updateLivestockBreed(editingItem.id, formData);
      } else {
        await masterDataService.createLivestockBreed(formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setFieldErrors(errInfo.fieldErrors);
      setGeneralError(errInfo.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giống vật nuôi này?')) return;
    try {
      await masterDataService.deleteLivestockBreed(id);
      fetchData();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa giống vật nuôi đã phát sinh lứa nuôi!');
    }
  };

  const columns = [
    {
      key: 'species',
      title: 'Loài Vật Nuôi',
      render: (item) => {
        const found = SPECIES_OPTIONS.find((s) => s.value === item.species);
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
            {found ? found.label.split(' - ')[0] : item.species}
          </span>
        );
      },
    },
    {
      key: 'breedName',
      title: 'Tên Giống Vật Nuôi',
      render: (item) => <span className="font-semibold text-slate-900">{item.breedName}</span>,
    },
    {
      key: 'standardGrowthDays',
      title: 'Chu kỳ nuôi chuẩn (Ngày)',
      render: (item) => <span>{item.standardGrowthDays} ngày</span>,
    },
    {
      key: 'targetWeightKg',
      title: 'Trọng lượng xuất (kg)',
      render: (item) => <span className="font-bold text-emerald-700">{item.targetWeightKg} kg</span>,
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
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên giống..."
              className="pl-9 text-xs"
            />
          </div>
          <div className="w-48">
            <Select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              options={[{ value: '', label: 'Tất cả loài' }, ...SPECIES_OPTIONS]}
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
            + Thêm Giống Vật Nuôi
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
          title: 'Chưa có giống vật nuôi nào',
          description: 'Thêm giống vật nuôi để quản lý lứa nuôi, tiêm phòng và định mức tiêu hao thức ăn.',
          actionLabel: '+ Thêm Giống Vật Nuôi',
          onAction: () => handleOpenModal(null),
        }}
      />

      {/* Modal LivestockBreedForm */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Cập Nhật Giống Vật Nuôi' : 'Thêm Mới Giống Vật Nuôi'}
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

          <FormField label="Loài Vật Nuôi (Species)" required error={fieldErrors.species}>
            <Select
              value={formData.species}
              onChange={(e) => setFormData((prev) => ({ ...prev, species: e.target.value }))}
              options={SPECIES_OPTIONS}
            />
          </FormField>

          <FormField label="Tên Giống Vật Nuôi" required error={fieldErrors.breedName}>
            <Input
              value={formData.breedName}
              onChange={(e) => setFormData((prev) => ({ ...prev, breedName: e.target.value }))}
              placeholder="VD: Gà Ri lai Lương Phượng F1"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Chu Kỳ Nuôi Chuẩn (Ngày)" required error={fieldErrors.standardGrowthDays}>
              <Input
                type="number"
                min="1"
                value={formData.standardGrowthDays}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, standardGrowthDays: Number(e.target.value) }))
                }
              />
            </FormField>

            <FormField label="Trọng Lượng Xuất Mục Tiêu (kg)" required error={fieldErrors.targetWeightKg}>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.targetWeightKg}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, targetWeightKg: Number(e.target.value) }))
                }
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default LivestockBreedsTab;
