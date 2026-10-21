import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  FolderTree,
  AlertTriangle,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Textarea, CodeInput } from '@/components/ui/FormControls';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { MaterialFormModal } from './MaterialFormModal';
import { extractApiErrors } from '@/utils/apiHelpers';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { CODE_PREFIXES, generateEntityCode } from '@/utils/codeGenerator';
import { formatCurrency } from '@/utils/formatters';

export function MaterialsTab() {
  // Categories state
  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ code: '', name: '', description: '' });
  const [catErrors, setCatErrors] = useState({});
  const [catSaving, setCatSaving] = useState(false);

  // Materials state
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Material Modal
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await masterDataService.getMaterialCategories();
      const list = Array.isArray(res) ? res : res?.content || [];
      setCategories(list);
    } catch (err) {
      console.error('Failed to load material categories', err);
    }
  };

  // Fetch Materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getMaterials({
        categoryId: selectedCatId || undefined,
        keyword: search || undefined,
        page,
        size: 15,
      });
      if (res) {
        setMaterials(res.content || res || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || (res.content ? res.content.length : 0));
      }
    } catch (err) {
      console.error('Failed to load materials', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [page, search, selectedCatId]);

  // Handle Category Save
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      setCatErrors({ name: 'Tên nhóm vật tư không được để trống' });
      return;
    }
    if (!catForm.code.trim()) {
      setCatErrors({ code: 'Mã nhóm vật tư không được để trống' });
      return;
    }

    try {
      setCatSaving(true);
      setCatErrors({});
      if (editingCat) {
        await masterDataService.updateMaterialCategory(editingCat.id, catForm);
      } else {
        await masterDataService.createMaterialCategory(catForm);
      }
      setCatModalOpen(false);
      fetchCategories();
    } catch (err) {
      applyServerFieldErrors(err, setCatErrors);
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhóm vật tư này?')) return;
    try {
      await masterDataService.deleteMaterialCategory(id);
      if (selectedCatId === id) setSelectedCatId(null);
      fetchCategories();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa nhóm vật tư đã có sản phẩm!');
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mặt hàng vật tư này?')) return;
    try {
      await masterDataService.deleteMaterial(id);
      fetchMaterials();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa mặt hàng đã phát sinh phiếu kho hoặc tồn kho!');
    }
  };

  const columns = [
    {
      key: 'skuCode',
      title: 'Mã SKU / Barcode',
      render: (item) => (
        <div>
          <div className="font-mono font-bold text-slate-900">{item.skuCode}</div>
          {item.barcode && <div className="text-[10px] text-slate-400 font-mono">{item.barcode}</div>}
        </div>
      ),
    },
    {
      key: 'name',
      title: 'Tên Mặt Hàng Vật Tư',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900">{item.name}</div>
          <div className="text-[11px] text-slate-500">
            {item.categoryName ? `Nhóm: ${item.categoryName}` : ''}
            {item.activeIngredient ? ` • Hoạt chất: ${item.activeIngredient}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'standardUnit',
      title: 'Đơn Vị Chuẩn',
      render: (item) => (
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
          {item.standardUnit}
        </span>
      ),
    },
    {
      key: 'conversions',
      title: 'Quy Cách Quy Đổi',
      render: (item) => {
        const convList = item.conversions || [];
        if (convList.length === 0) return <span className="text-slate-400 text-xs">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {convList.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono text-blue-700 font-semibold"
                title={`1 ${c.unitName} = ${c.conversionFactor} ${item.standardUnit}`}
              >
                1 {c.unitName} = {c.conversionFactor} {item.standardUnit}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'unitPriceStandard',
      title: 'Đơn Giá Chuẩn',
      render: (item) => <span className="font-mono">{formatCurrency(item.unitPriceStandard)}</span>,
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
              onClick={() => {
                setEditingMaterial(item);
                setMaterialModalOpen(true);
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Sửa vật tư & đơn vị quy đổi"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteMaterial(item.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Xóa vật tư"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-200">
      {/* CỘT TRÁI: QUẢN LÝ NHÓM VẬT TƯ (material_categories #27) */}
      <div className="w-full lg:w-72 shrink-0 space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Nhóm Vật Tư ({categories.length})
            </span>
          </div>
          <Can permission="PERM_INVENTORY_RECEIPT">
            <button
              type="button"
              onClick={() => {
                setEditingCat(null);
                setCatForm({
                  code: generateEntityCode(CODE_PREFIXES.MATERIAL_CATEGORY),
                  name: '',
                  description: '',
                });
                setCatErrors({});
                setCatModalOpen(true);
              }}
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-50 transition-colors"
              title="+ Thêm Nhóm Vật Tư"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </Can>
        </div>

        <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xs max-h-[600px] overflow-y-auto">
          <button
            type="button"
            onClick={() => setSelectedCatId(null)}
            className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-all ${
              selectedCatId === null
                ? 'bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-600/20'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>[ Tất Cả Vật Tư ]</span>
            <span className="text-[11px] text-slate-400 font-mono font-normal">
              {totalElements}
            </span>
          </button>

          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer transition-all ${
                selectedCatId === cat.id
                  ? 'bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="truncate flex-1 pr-2">
                <div>{cat.name}</div>
                <div className="text-[10px] text-slate-400 font-mono font-normal">{cat.code}</div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Can permission="PERM_INVENTORY_RECEIPT">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCat(cat);
                      setCatForm({
                        code: cat.code || '',
                        name: cat.name || '',
                        description: cat.description || '',
                      });
                      setCatErrors({});
                      setCatModalOpen(true);
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-700"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCategory(cat.id, e)}
                    className="p-0.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: BẢNG VẬT TƯ (materials #28) */}
      <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo SKU, tên vật tư, hoạt chất..."
              className="pl-9 text-xs"
            />
          </div>

          <Can permission="PERM_INVENTORY_RECEIPT">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingMaterial(null);
                setMaterialModalOpen(true);
              }}
              icon={<Plus className="h-4 w-4" />}
            >
              + Thêm Mặt Hàng Vật Tư
            </Button>
          </Can>
        </div>

        <DataTable
          columns={columns}
          data={materials}
          isLoading={loading}
          page={page}
          pageSize={15}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyStateProps={{
            title: 'Chưa có mặt hàng vật tư nào',
            description: 'Tạo mặt hàng vật tư mới kèm quy cách bao bì để phục vụ nhập xuất kho và dự trù mùa vụ.',
            actionLabel: '+ Tạo Mặt Hàng Vật Tư',
            onAction: () => {
              setEditingMaterial(null);
              setMaterialModalOpen(true);
            },
          }}
        />
      </div>

      {/* Modal Thêm/Sửa Nhóm Vật Tư */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? 'Cập Nhật Nhóm Vật Tư' : 'Thêm Nhóm Vật Tư Mới'}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCatModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={catSaving}
              onClick={handleSaveCategory}
            >
              {editingCat ? 'Lưu' : 'Tạo mới'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <FormField label="Mã Nhóm Vật Tư" required error={catErrors.code}>
            <CodeInput
              value={catForm.code}
              onChange={(e) =>
                setCatForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
              }
              onRegenerate={() =>
                setCatForm((prev) => ({
                  ...prev,
                  code: generateEntityCode(CODE_PREFIXES.MATERIAL_CATEGORY),
                }))
              }
              isEditMode={Boolean(editingCat)}
              prefix="MCT"
              placeholder="VD: MCT-2610-0001"
            />
          </FormField>

          <FormField label="Tên Nhóm Vật Tư" required error={catErrors.name}>
            <Input
              value={catForm.name}
              onChange={(e) => setCatForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="VD: Phân bón vô cơ & vi sinh"
            />
          </FormField>

          <FormField label="Mô Tả Nhóm">
            <Textarea
              value={catForm.description}
              onChange={(e) => setCatForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </FormField>
        </form>
      </Modal>

      {/* Modal Hợp Nhất Vật Tư + Quy Đổi */}
      <MaterialFormModal
        isOpen={materialModalOpen}
        onClose={() => setMaterialModalOpen(false)}
        editingItem={editingMaterial}
        categories={categories}
        onSuccess={() => fetchMaterials()}
      />
    </div>
  );
}
export default MaterialsTab;
