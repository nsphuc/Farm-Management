import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, CreditCard, FileText } from 'lucide-react';
import { financeService } from '../../services/financeService';
import { cropService } from '../../services/cropService';
import { livestockService } from '../../services/livestockService';
import { toast } from 'sonner';

export const ExpenseModal = ({ isOpen, onClose, farmId, onSaved }) => {
  const [categories, setCategories] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [herds, setHerds] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    receiptNumber: '',
    cropSeasonId: '',
    livestockGroupId: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen && farmId) {
      loadReferenceData();
    }
  }, [isOpen, farmId]);

  const loadReferenceData = async () => {
    try {
      const [catRes, seasonRes, herdRes] = await Promise.all([
        financeService.getCostCategories(farmId),
        cropService.getSeasons(farmId).catch(() => []),
        livestockService.getLivestockGroups(farmId).catch(() => [])
      ]);

      const catList = Array.isArray(catRes) ? catRes : catRes?.items || [];
      setCategories(catList);
      if (catList.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: catList[0].id }));
      }
      setSeasons(Array.isArray(seasonRes) ? seasonRes : seasonRes?.items || []);
      setHerds(Array.isArray(herdRes) ? herdRes : herdRes?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount || !formData.categoryId) {
      toast.error('Vui lòng điền đủ các thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        categoryId: Number(formData.categoryId),
        amount: Number(formData.amount),
        cropSeasonId: formData.cropSeasonId ? Number(formData.cropSeasonId) : null,
        livestockGroupId: formData.livestockGroupId ? Number(formData.livestockGroupId) : null,
      };

      await financeService.createExpense(farmId, payload);
      toast.success('Ghi nhận chi phí thành công');
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu chi phí');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Ghi Nhận Chi Phí Phát Sinh</h2>
              <p className="text-xs text-gray-500">Hạch toán chi phí vật tư, nhân công, dịch vụ và vận hành nông trại</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Danh mục chi phí *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName} ({c.costType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Số tiền (VNĐ) *</label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                placeholder="VD: 5,000,000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none font-bold text-purple-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tên khoản chi phí / Diễn giải *</label>
            <input
              type="text"
              required
              placeholder="VD: Mua hạt giống bắp cải vụ Đông Xuân, Thuê máy cày đất..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày phát sinh *</label>
              <input
                type="date"
                required
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hình thức thanh toán</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="CASH">Tiền mặt</option>
                <option value="DEBT">Ghi nợ (Chưa trả)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Số HĐ / Chứng từ</label>
              <input
                type="text"
                placeholder="VD: HD-00123"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100 space-y-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Gán Chi Phí Trực Tiếp Cho Đối Tượng
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mùa vụ cây trồng (Nếu có)</label>
                <select
                  value={formData.cropSeasonId}
                  onChange={(e) => setFormData({ ...formData, cropSeasonId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-purple-500 focus:outline-none bg-white"
                >
                  <option value="">-- Chi phí chung / Không gắn vụ --</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.seasonName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Đàn vật nuôi (Nếu có)</label>
                <select
                  value={formData.livestockGroupId}
                  onChange={(e) => setFormData({ ...formData, livestockGroupId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-purple-500 focus:outline-none bg-white"
                >
                  <option value="">-- Chi phí chung / Không gắn đàn --</option>
                  {herds.map((h) => (
                    <option key={h.id} value={h.id}>{h.groupCode || h.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú bổ sung</label>
            <textarea
              rows="2"
              placeholder="Chi tiết nhà cung cấp, thông số kỹ thuật..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Đang hạch toán...' : 'Lưu khoản chi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
