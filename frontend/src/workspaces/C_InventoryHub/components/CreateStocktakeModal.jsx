import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  AlertCircle,
  Save,
  Warehouse,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { inventoryService } from '@/services/modules/inventoryService';
import { toast } from '@/store/useToastStore';

export function CreateStocktakeModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  defaultWarehouseId = '',
  warehouses = [],
}) {
  const [formData, setFormData] = useState({
    warehouseId: '',
    stocktakeCode: '',
    stocktakeDate: new Date().toISOString().split('T')[0],
    notes: 'Kiểm kê định kỳ cuối tháng',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
      const rand = Math.floor(10 + Math.random() * 90);

      setFormData({
        warehouseId: defaultWarehouseId ? String(defaultWarehouseId) : (warehouses?.[0]?.id ? String(warehouses[0].id) : ''),
        stocktakeCode: `STK-${dateStr}-${rand}`,
        stocktakeDate: new Date().toISOString().split('T')[0],
        notes: 'Kiểm kê định kỳ số dư kho bãi',
      });
      setErrors({});
    }
  }, [isOpen, defaultWarehouseId, farmId]);

  const validate = () => {
    const errs = {};
    if (!formData.warehouseId) {
      errs.warehouseId = 'Vui lòng chọn kho cần kiểm kê';
    }
    if (!formData.stocktakeDate) {
      errs.stocktakeDate = 'Ngày kiểm kê không được để trống';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!farmId) {
      toast.error('Không tìm thấy ID trang trại!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const payload = {
        warehouseId: Number(formData.warehouseId),
        stocktakeCode: formData.stocktakeCode?.trim() || null,
        stocktakeDate: formData.stocktakeDate,
        notes: formData.notes?.trim() || null,
      };

      const result = await inventoryService.createStocktake(farmId, payload);
      toast.success(`Khởi tạo đợt kiểm kê kho ${result.stocktakeCode || payload.stocktakeCode} thành công!`);
      onSuccess?.(result);
      onClose();
    } catch (err) {
      console.error('Lỗi khởi tạo đợt kiểm kê:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi mở đợt kiểm kê';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Mở Đợt Kiểm Kê Kho"
      subtitle="Thiết lập phiên kiểm đếm tồn kho thực tế, đối chiếu tồn sổ sách và cân chỉnh tự động"
      icon={<ClipboardCheck className="h-5 w-5 text-purple-600" />}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} icon={<Save className="h-4 w-4" />}>
            Mở Đợt Kiểm Kê (DRAFT)
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errors.form && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errors.form}</span>
          </div>
        )}

        <FormField label="Kho Bãi Cần Kiểm Kê *" error={errors.warehouseId}>
          <Select
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            required
          >
            <option value="">-- Chọn kho kiểm kê --</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.warehouseName || w.name} ({w.warehouseCode || `#${w.id}`})
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Mã Đợt Kiểm Kê" hint="Tự động sinh hoặc nhập mã tùy chỉnh">
            <Input
              value={formData.stocktakeCode}
              onChange={(e) => setFormData({ ...formData, stocktakeCode: e.target.value.toUpperCase() })}
              placeholder="STK-YYMMDD-01"
              className="font-mono font-bold"
            />
          </FormField>

          <FormField label="Ngày Kiểm Kê *" error={errors.stocktakeDate}>
            <Input
              type="date"
              value={formData.stocktakeDate}
              onChange={(e) => setFormData({ ...formData, stocktakeDate: e.target.value })}
              required
            />
          </FormField>
        </div>

        <FormField label="Ghi Chú Đợt Kiểm Kê" hint="Mục đích hoặc thành phần ban kiểm kê">
          <Input
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="VD: Kiểm kê định kỳ cuối tháng, kiểm đột xuất..."
          />
        </FormField>

        <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-purple-950 text-[11px] leading-relaxed flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
          <span>
            Sau khi mở đợt kiểm kê ở trạng thái <strong>DRAFT</strong>, thủ kho hoặc quản lý trại có thể nhập số liệu kiểm đếm thực tế của từng lô hàng. Giám đốc trại sẽ tiến hành phê duyệt và cân chỉnh tự động.
          </span>
        </div>
      </form>
    </Modal>
  );
}

export default CreateStocktakeModal;
