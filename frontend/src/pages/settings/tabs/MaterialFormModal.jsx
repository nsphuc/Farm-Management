import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Barcode,
  Layers,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { masterDataService } from '@/services/modules/masterDataService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { BarcodeScannerInput } from '@/components/common/BarcodeScannerInput';
import { extractApiErrors } from '@/utils/apiHelpers';

const STANDARD_UNITS = [
  { value: 'KG', label: 'KG - Kilogram' },
  { value: 'GRAM', label: 'GRAM - Gam' },
  { value: 'LITER', label: 'LITER - Lít' },
  { value: 'ML', label: 'ML - Mililit' },
  { value: 'BAG', label: 'BAG - Bao / Túi' },
  { value: 'BOTTLE', label: 'BOTTLE - Chai / Lọ' },
  { value: 'DOSE', label: 'DOSE - Liều (Vaccine)' },
  { value: 'PIECE', label: 'PIECE - Cái / Chiếc / Cây' },
  { value: 'BOX', label: 'BOX - Hộp' },
];

const DISPATCH_STRATEGIES = [
  { value: 'FIFO', label: 'FIFO - Nhập trước Xuất trước' },
  { value: 'FEFO', label: 'FEFO - Hạn dùng gần Xuất trước' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'ACTIVE - Đang kinh doanh/sử dụng' },
  { value: 'INACTIVE', label: 'INACTIVE - Tạm ngưng' },
  { value: 'DISCONTINUED', label: 'DISCONTINUED - Ngừng lưu hành' },
];

export function MaterialFormModal({
  isOpen,
  onClose,
  editingItem = null,
  categories = [],
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    categoryId: '',
    skuCode: '',
    barcode: '',
    name: '',
    standardUnit: 'KG',
    dispatchStrategy: 'FIFO',
    expiryAlertDays: 30,
    minStockLevel: 0,
    maxStockLevel: 1000,
    unitPriceStandard: 0,
    manufacturerName: '',
    activeIngredient: '',
    defaultPhiDays: 0,
    shelfLifeDays: 365,
    description: '',
    status: 'ACTIVE',
  });

  const [conversions, setConversions] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setGeneralError('');

    if (editingItem) {
      setFormData({
        categoryId: editingItem.categoryId || (categories[0]?.id || ''),
        skuCode: editingItem.skuCode || '',
        barcode: editingItem.barcode || '',
        name: editingItem.name || '',
        standardUnit: editingItem.standardUnit || 'KG',
        dispatchStrategy: editingItem.dispatchStrategy || 'FIFO',
        expiryAlertDays: editingItem.expiryAlertDays ?? 30,
        minStockLevel: editingItem.minStockLevel ?? 0,
        maxStockLevel: editingItem.maxStockLevel ?? 1000,
        unitPriceStandard: editingItem.unitPriceStandard ?? 0,
        manufacturerName: editingItem.manufacturerName || '',
        activeIngredient: editingItem.activeIngredient || '',
        defaultPhiDays: editingItem.defaultPhiDays ?? 0,
        shelfLifeDays: editingItem.shelfLifeDays ?? 365,
        description: editingItem.description || '',
        status: editingItem.status || 'ACTIVE',
      });
      setConversions(editingItem.conversions || []);
    } else {
      setFormData({
        categoryId: categories[0]?.id || '',
        skuCode: '',
        barcode: '',
        name: '',
        standardUnit: 'KG',
        dispatchStrategy: 'FIFO',
        expiryAlertDays: 30,
        minStockLevel: 0,
        maxStockLevel: 1000,
        unitPriceStandard: 0,
        manufacturerName: '',
        activeIngredient: '',
        defaultPhiDays: 0,
        shelfLifeDays: 365,
        description: '',
        status: 'ACTIVE',
      });
      setConversions([]);
    }
  }, [isOpen, editingItem, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'skuCode' ? value.toUpperCase() : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Conversions handlers
  const handleAddConversion = () => {
    setConversions((prev) => [
      ...prev,
      {
        unitName: '',
        conversionFactor: 1.0,
        unitBarcode: '',
        isPurchaseUnit: true,
        isDispatchUnit: false,
      },
    ]);
  };

  const handleUpdateConversion = (index, field, value) => {
    setConversions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveConversion = (index) => {
    setConversions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.categoryId) errors.categoryId = 'Vui lòng chọn nhóm vật tư';
    if (!formData.name.trim()) errors.name = 'Tên vật tư không được để trống';
    if (!formData.skuCode.trim()) errors.skuCode = 'Mã SKU không được để trống';
    if (Number(formData.maxStockLevel) < Number(formData.minStockLevel)) {
      errors.maxStockLevel = 'Định mức tồn tối đa phải lớn hơn hoặc bằng tồn tối thiểu';
    }

    // Validate conversions
    for (let i = 0; i < conversions.length; i++) {
      const c = conversions[i];
      if (!c.unitName.trim()) {
        errors[`conversion_unit_${i}`] = `Dòng quy đổi #${i + 1} chưa có tên đơn vị`;
      }
      if (c.unitName.trim().toUpperCase() === formData.standardUnit.toUpperCase()) {
        errors[`conversion_unit_${i}`] = `Đơn vị quy đổi #${i + 1} không được trùng với đơn vị chuẩn (${formData.standardUnit})`;
      }
      if (Number(c.conversionFactor) <= 0) {
        errors[`conversion_factor_${i}`] = `Hệ số quy đổi #${i + 1} phải lớn hơn 0`;
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
        categoryId: Number(formData.categoryId),
        minStockLevel: Number(formData.minStockLevel),
        maxStockLevel: Number(formData.maxStockLevel),
        unitPriceStandard: Number(formData.unitPriceStandard),
        expiryAlertDays: Number(formData.expiryAlertDays),
        defaultPhiDays: Number(formData.defaultPhiDays),
        shelfLifeDays: Number(formData.shelfLifeDays),
        conversions: conversions.map((c) => ({
          unitName: c.unitName.trim(),
          conversionFactor: Number(c.conversionFactor),
          unitBarcode: c.unitBarcode?.trim() || null,
          isPurchaseUnit: Boolean(c.isPurchaseUnit),
          isDispatchUnit: Boolean(c.isDispatchUnit),
        })),
      };

      if (editingItem) {
        await masterDataService.updateMaterial(editingItem.id, payload);
      } else {
        await masterDataService.createMaterial(payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      setFieldErrors(errInfo.fieldErrors);
      setGeneralError(errInfo.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Cập Nhật Danh Mục Vật Tư' : 'Thêm Mới Mặt Hàng Vật Tư'}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSubmit}>
            {editingItem ? 'Lưu Thay Đổi' : 'Tạo Vật Tư'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {generalError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* PHẦN A: THÔNG TIN VẬT TƯ (materials #28) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
            <Package className="h-4 w-4 text-emerald-600" />
            Phần A: Thông Tin Vật Tư Cơ Bản
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Nhóm Vật Tư" required error={fieldErrors.categoryId}>
              <Select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                options={categories.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
                placeholder="-- Chọn nhóm --"
              />
            </FormField>

            <FormField
              label="Mã SKU (Tự in hoa)"
              required
              error={fieldErrors.skuCode}
            >
              <Input
                name="skuCode"
                value={formData.skuCode}
                onChange={handleChange}
                placeholder="VD: PHAN-NPK-16168"
                className="font-mono font-bold"
              />
            </FormField>

            <FormField label="Mã Vạch / Barcode" error={fieldErrors.barcode}>
              <BarcodeScannerInput
                value={formData.barcode}
                onChange={(code) => setFormData((prev) => ({ ...prev, barcode: code }))}
                placeholder="Quét hoặc nhập mã vạch..."
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField label="Tên Mặt Hàng Vật Tư" required error={fieldErrors.name}>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="VD: Phân bón NPK Đầu Trâu 16-16-8+TE"
                />
              </FormField>
            </div>

            <FormField label="Đơn Vị Chuẩn (Standard Unit)" required error={fieldErrors.standardUnit}>
              <Select
                name="standardUnit"
                value={formData.standardUnit}
                onChange={handleChange}
                options={STANDARD_UNITS}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Chiến Lược Xuất Kho" error={fieldErrors.dispatchStrategy}>
              <Select
                name="dispatchStrategy"
                value={formData.dispatchStrategy}
                onChange={handleChange}
                options={DISPATCH_STRATEGIES}
              />
            </FormField>

            <FormField label="Cảnh Báo Hết Hạn (Ngày)" error={fieldErrors.expiryAlertDays}>
              <Input
                type="number"
                min="1"
                name="expiryAlertDays"
                value={formData.expiryAlertDays}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Tồn Tối Thiểu" error={fieldErrors.minStockLevel}>
              <Input
                type="number"
                step="0.01"
                min="0"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Tồn Tối Đa" error={fieldErrors.maxStockLevel}>
              <Input
                type="number"
                step="0.01"
                min="0"
                name="maxStockLevel"
                value={formData.maxStockLevel}
                onChange={handleChange}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Đơn Giá Chuẩn (VNĐ)" error={fieldErrors.unitPriceStandard}>
              <Input
                type="number"
                min="0"
                name="unitPriceStandard"
                value={formData.unitPriceStandard}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Nhà Sản Xuất" error={fieldErrors.manufacturerName}>
              <Input
                name="manufacturerName"
                value={formData.manufacturerName}
                onChange={handleChange}
                placeholder="VD: Công ty CP Phân bón Bình Điền"
              />
            </FormField>

            <FormField label="Hoạt Chất Chính" error={fieldErrors.activeIngredient}>
              <Input
                name="activeIngredient"
                value={formData.activeIngredient}
                onChange={handleChange}
                placeholder="VD: N-P-K 16-16-8, TE"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Thời Gian Cách Ly PHI (Ngày)" error={fieldErrors.defaultPhiDays}>
              <Input
                type="number"
                min="0"
                name="defaultPhiDays"
                value={formData.defaultPhiDays}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Hạn Sử Dụng (Ngày)" error={fieldErrors.shelfLifeDays}>
              <Input
                type="number"
                min="1"
                name="shelfLifeDays"
                value={formData.shelfLifeDays}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Trạng Thái Lưu Hành" error={fieldErrors.status}>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={STATUS_OPTIONS}
              />
            </FormField>
          </div>

          <FormField label="Mô Tả / Hướng Dẫn Sử Dụng">
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Ghi chú quy cách đóng gói, nhiệt độ bảo quản yêu cầu..."
            />
          </FormField>
        </div>

        {/* PHẦN B: BẢNG QUY ĐỔI ĐƠN VỊ ĐỘNG (material_unit_conversions #29) */}
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Layers className="h-4 w-4 text-blue-600" />
              Phần B: Quy Cách Bao Bì & Hệ Số Quy Đổi Đơn Vị
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddConversion}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              + Thêm Quy Đổi
            </Button>
          </div>

          <p className="text-[11px] text-slate-500">
            Ví dụ: Đơn vị chuẩn là <strong className="text-emerald-700">{formData.standardUnit}</strong>, nhập đơn vị bao bì là "Bao 50kg" với hệ số <strong>50.0000</strong>.
          </p>

          {conversions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              Chưa có đơn vị quy đổi phụ (chỉ quản lý theo đơn vị chuẩn {formData.standardUnit}). Nhấn "+ Thêm Quy Đổi" để tạo quy cách bao bì.
            </div>
          ) : (
            <div className="space-y-3">
              {conversions.map((conv, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3 animate-in fade-in"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-3">
                      <FormField
                        label="Tên Đơn Vị Quy Đổi"
                        required
                        error={fieldErrors[`conversion_unit_${idx}`]}
                      >
                        <Input
                          value={conv.unitName}
                          onChange={(e) =>
                            handleUpdateConversion(idx, 'unitName', e.target.value)
                          }
                          placeholder="VD: Bao 50kg, Thùng 24 lon"
                        />
                      </FormField>
                    </div>

                    <div className="sm:col-span-3">
                      <FormField
                        label="Hệ Số Quy Đổi"
                        required
                        error={fieldErrors[`conversion_factor_${idx}`]}
                      >
                        <Input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={conv.conversionFactor}
                          onChange={(e) =>
                            handleUpdateConversion(
                              idx,
                              'conversionFactor',
                              Number(e.target.value)
                            )
                          }
                        />
                      </FormField>
                    </div>

                    <div className="sm:col-span-4">
                      <FormField label="Mã Vạch Đơn Vị Phụ">
                        <Input
                          value={conv.unitBarcode || ''}
                          onChange={(e) =>
                            handleUpdateConversion(idx, 'unitBarcode', e.target.value)
                          }
                          placeholder="Mã vạch trên thùng/bao..."
                        />
                      </FormField>
                    </div>

                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveConversion(idx)}
                        className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Xóa quy đổi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dynamic label & Checkboxes */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-200/60 pt-2 font-mono">
                    <div className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                      1 {conv.unitName || '[Đơn vị]'} = {conv.conversionFactor || 0}{' '}
                      {formData.standardUnit}
                    </div>

                    <div className="flex items-center gap-4 text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={conv.isPurchaseUnit}
                          onChange={(e) =>
                            handleUpdateConversion(idx, 'isPurchaseUnit', e.target.checked)
                          }
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Đơn vị Mua hàng</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={conv.isDispatchUnit}
                          onChange={(e) =>
                            handleUpdateConversion(idx, 'isDispatchUnit', e.target.checked)
                          }
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Đơn vị Xuất kho</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
export default MaterialFormModal;
