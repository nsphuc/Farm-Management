import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Calendar,
  Layers,
  FileText,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { financeService } from '@/services/modules/financeService';
import { farmingService } from '@/services/modules/farmingService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { formatCurrency } from '@/utils/formatters';

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng (BANK_TRANSFER)' },
  { value: 'CASH', label: 'Tiền mặt (CASH)' },
  { value: 'TRADE_CREDIT', label: 'Công nợ đối tác (TRADE_CREDIT)' },
];

const EXPENSE_SOURCES = [
  { value: 'MANUAL', label: 'Hóa đơn chi phí trực tiếp / ngoài (MANUAL)' },
  { value: 'UTILITY_BILL', label: 'Hóa đơn tiền điện, nước, nhiên liệu (UTILITY_BILL)' },
];

export function CreateExpenseModal({ isOpen, onClose, onSuccess, initialFarmId }) {
  const { farms, activeFarmId } = useActiveFarmStore();
  const { isFarmManager, hasRole, isFarmAccountant, isOwner, isSuperAdmin } = useAuthStore();

  const isManagerOrAdmin = isFarmManager() || isOwner() || isSuperAdmin() || hasRole('ROLE_FARM_MANAGER');
  const isManager = isManagerOrAdmin;

  // Khóa cố định Trang trại đối với ROLE_FARM_MANAGER & ROLE_ACCOUNTANT khi activeFarmId !== 'ALL'
  const isFarmLocked = (isFarmManager() || isFarmAccountant() || hasRole('ROLE_FARM_MANAGER') || hasRole('ROLE_ACCOUNTANT'))
    && !isOwner() && !isSuperAdmin()
    && activeFarmId !== 'ALL' && Boolean(activeFarmId);

  const currentFarmId = (initialFarmId && initialFarmId !== 'ALL') ? initialFarmId : (activeFarmId !== 'ALL' ? activeFarmId : '');

  const [formData, setFormData] = useState({
    farmId: currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : ''),
    costCategoryId: '',
    expenseCode: '',
    expenseSource: 'MANUAL',
    expenseDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    seasonId: '',
    livestockGroupId: '',
    unitCostEligible: true,
    recipientName: '',
    receiptPhotoUrl: '',
    notes: '',
  });

  const [costCategories, setCostCategories] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [livestockGroups, setLivestockGroups] = useState([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedFarm = farms.find((f) => String(f.id) === String(formData.farmId));
  const farmType = selectedFarm?.farmType || 'MIXED';

  // Auto-generate code
  const generateExpenseCode = () => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(10 + Math.random() * 90);
    return `EXP-${yy}${mm}${dd}-${random}`;
  };

  // Chỉ khởi tạo form khi Modal được mở lên (isOpen thay đổi sang true)
  useEffect(() => {
    if (isOpen) {
      const defaultFarm = currentFarmId ? String(currentFarmId) : (farms[0]?.id ? String(farms[0].id) : '');
      setFormData({
        farmId: defaultFarm,
        costCategoryId: '',
        expenseCode: generateExpenseCode(),
        expenseSource: 'MANUAL',
        expenseDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'BANK_TRANSFER',
        seasonId: '',
        livestockGroupId: '',
        unitCostEligible: true,
        recipientName: '',
        receiptPhotoUrl: '',
        notes: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  // Load cost categories
  useEffect(() => {
    if (!isOpen) return;
    const loadCategories = async () => {
      try {
        const res = await financeService.getCostCategories();
        const list = Array.isArray(res) ? res : res?.content || [];
        setCostCategories(list);
        setFormData((prev) => {
          if (!prev.costCategoryId && list.length > 0) {
            return { ...prev, costCategoryId: String(list[0].id) };
          }
          return prev;
        });
      } catch (err) {
        console.error('Failed to load cost categories:', err);
      }
    };
    loadCategories();
  }, [isOpen]);

  // Load seasons and livestock groups for selected farm
  useEffect(() => {
    if (!isOpen || !formData.farmId) {
      setSeasons([]);
      setLivestockGroups([]);
      return;
    }

    const loadFarmContext = async () => {
      try {
        setIsLoadingMeta(true);
        const [seasonRes, groupRes] = await Promise.all([
          farmingService.getCropSeasons(formData.farmId, { size: 100 }).catch(() => []),
          farmingService.getLivestockGroups(formData.farmId, { size: 100 }).catch(() => []),
        ]);
        setSeasons(seasonRes?.content || (Array.isArray(seasonRes) ? seasonRes : []));
        setLivestockGroups(groupRes?.content || (Array.isArray(groupRes) ? groupRes : []));
      } catch (err) {
        console.error('Failed to load farm context:', err);
      } finally {
        setIsLoadingMeta(false);
      }
    };
    loadFarmContext();
  }, [isOpen, formData.farmId]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'farmId') {
        const nextFarm = farms.find((f) => String(f.id) === String(value));
        const nextType = nextFarm?.farmType;
        if (nextType === 'CROP') next.livestockGroupId = '';
        if (nextType === 'LIVESTOCK') next.seasonId = '';
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.farmId) errs.farmId = 'Vui lòng chọn trang trại';
    if (!formData.costCategoryId) errs.costCategoryId = 'Vui lòng chọn khoản mục chi phí';
    if (!formData.expenseDate) errs.expenseDate = 'Vui lòng chọn ngày phát sinh';
    const numAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Số tiền chi phí phải lớn hơn 0 VNĐ';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        costCategoryId: Number(formData.costCategoryId),
        expenseCode: formData.expenseCode?.trim() || generateExpenseCode(),
        expenseSource: formData.expenseSource,
        expenseDate: formData.expenseDate,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        seasonId: formData.seasonId ? Number(formData.seasonId) : null,
        livestockGroupId: formData.livestockGroupId ? Number(formData.livestockGroupId) : null,
        unitCostEligible: Boolean(formData.unitCostEligible),
        recipientName: formData.recipientName?.trim() || null,
        receiptPhotoUrl: formData.receiptPhotoUrl?.trim() || null,
        notes: formData.notes?.trim() || null,
        status: isManager ? 'CONFIRMED' : 'DRAFT',
      };

      await financeService.createExpense(Number(formData.farmId), payload);
      if (isManager) {
        toast.success('Khai báo và phê duyệt chi phí thành công!');
      } else {
        toast.success('Khai báo chứng từ chi phí mới (DRAFT) thành công! Giám đốc trại sẽ kiểm tra và phê duyệt.');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Lỗi khi khai báo chi phí:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tạo chi phí';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButtonText = isManager ? 'Lưu & Phê Duyệt Ngay' : 'Gửi Trình Duyệt (DRAFT)';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Khai Báo Chứng Từ Chi Phí Vận Hành"
      subtitle="Ghi nhận hóa đơn chi phí ngoài / tiện ích phục vụ tính giá thành và hạch toán ngân sách"
      icon={<DollarSign className="h-5 w-5 text-amber-600" />}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-mono">
            {formData.amount && !isNaN(Number(formData.amount)) ? (
              <span>Số tiền: <strong className="text-amber-700">{formatCurrency(formData.amount)}</strong></span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy Bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={handleSubmit}
              icon={<CheckCircle2 className="h-4 w-4" />}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {submitButtonText}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Trang Trại (*)" error={errors.farmId}>
            <Select
              value={formData.farmId}
              disabled={isFarmLocked}
              onChange={(e) => handleChange('farmId', e.target.value)}
              className="w-full text-xs font-semibold"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (#{f.id})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Mã Chứng Từ Chi Phí">
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                value={formData.expenseCode}
                onChange={(e) => handleChange('expenseCode', e.target.value)}
                placeholder="EXP-YYMMDD-XX"
                className="w-full text-xs font-mono font-bold text-amber-900"
              />
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleChange('expenseCode', generateExpenseCode())}
                title="Tạo mã mới"
                className="whitespace-nowrap shrink-0 px-3"
              >
                Gợi Ý
              </Button>
            </div>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Ngày Ghi Nhận (*)" error={errors.expenseDate}>
            <Input
              type="date"
              value={formData.expenseDate}
              onChange={(e) => handleChange('expenseDate', e.target.value)}
              className="w-full text-xs"
            />
          </FormField>

          <FormField label="Khoản Mục Chi Phí (*)" error={errors.costCategoryId}>
            <Select
              value={formData.costCategoryId}
              onChange={(e) => handleChange('costCategoryId', e.target.value)}
              className="w-full text-xs"
            >
              <option value="">-- Chọn Khoản Mục --</option>
              {costCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.costType})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Nguồn Nghiệp Vụ">
            <Select
              value={formData.expenseSource}
              onChange={(e) => handleChange('expenseSource', e.target.value)}
              className="w-full text-xs"
            >
              {EXPENSE_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Số Tiền Chi Phí (VNĐ) (*)" error={errors.amount}>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="VD: 5,000,000"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full text-xs font-mono font-bold text-slate-900"
            />
          </FormField>

          <FormField label="Hình Thức Thanh Toán">
            <Select
              value={formData.paymentMethod}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
              className="w-full text-xs"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Đối tượng liên kết trực tiếp theo farmType */}
        {(farmType === 'CROP' || farmType === 'LIVESTOCK' || farmType === 'MIXED') && (
          <div className={`grid gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 ${
            farmType === 'MIXED' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
          }`}>
            {(farmType === 'CROP' || farmType === 'MIXED') && (
              <FormField label="Gán Vào Mùa Vụ Trồng Trọt (Tùy chọn)">
                <Select
                  value={formData.seasonId}
                  disabled={farmType === 'MIXED' && Boolean(formData.livestockGroupId)}
                  onChange={(e) => {
                    handleChange('seasonId', e.target.value);
                    if (e.target.value) handleChange('livestockGroupId', '');
                  }}
                  className="w-full text-xs"
                >
                  <option value="">-- Không gắn mùa vụ --</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.seasonCode || `Mùa #${s.id}`})
                    </option>
                  ))}
                </Select>
              </FormField>
            )}

            {(farmType === 'LIVESTOCK' || farmType === 'MIXED') && (
              <FormField label="Gán Vào Đàn Chăn Nuôi (Tùy chọn)">
                <Select
                  value={formData.livestockGroupId}
                  disabled={farmType === 'MIXED' && Boolean(formData.seasonId)}
                  onChange={(e) => {
                    handleChange('livestockGroupId', e.target.value);
                    if (e.target.value) handleChange('seasonId', '');
                  }}
                  className="w-full text-xs"
                >
                  <option value="">-- Không gắn đàn nuôi --</option>
                  {livestockGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.code || `Đàn #${g.id}`})
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Người Nhận Tiền / Đơn Vị Thụ Hưởng">
            <Input
              type="text"
              placeholder="VD: Công ty Điện Lực Đà Lạt, Đại lý vật tư..."
              value={formData.recipientName}
              onChange={(e) => handleChange('recipientName', e.target.value)}
              className="w-full text-xs"
            />
          </FormField>

          <FormField label="URL Ảnh Chụp Hóa Đơn / Biên Lai">
            <Input
              type="text"
              placeholder="https://... hoặc tải ảnh lên Cloud"
              value={formData.receiptPhotoUrl}
              onChange={(e) => handleChange('receiptPhotoUrl', e.target.value)}
              className="w-full text-xs"
            />
          </FormField>
        </div>

        {/* Checkbox tính giá thành */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="unitCostEligible"
            checked={formData.unitCostEligible}
            onChange={(e) => handleChange('unitCostEligible', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="unitCostEligible" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
            Hợp lệ tính vào Giá thành đơn vị sản phẩm (Unit Cost Eligible - KCS & Lô sản xuất)
          </label>
        </div>

        <FormField label="Ghi Chú Hóa Đơn / Lý Do Chi">
          <textarea
            rows="2"
            placeholder="Ghi chú chi tiết về khoản chi tiêu này..."
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default CreateExpenseModal;
