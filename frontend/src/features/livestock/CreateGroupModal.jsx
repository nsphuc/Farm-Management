import React, { useState, useEffect } from 'react';
import { X, Users, MapPin, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { livestockService } from '../../services/livestockService';
import { farmService } from '../../services/farmService';

export const CreateGroupModal = ({ isOpen, onClose, farmId, onSuccess }) => {
  const [zones, setZones] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    zoneId: '',
    breedId: '',
    groupCode: '',
    initialQuantity: '',
    entryDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (isOpen && farmId) {
      loadDependencies();
    }
  }, [isOpen, farmId]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const [zonesData, breedsData] = await Promise.all([
        farmService.getZones(farmId),
        livestockService.getBreeds(),
      ]);
      setZones(zonesData || []);
      setBreeds(breedsData || []);

      setFormData({
        zoneId: zonesData?.[0]?.id || '',
        breedId: breedsData?.[0]?.id || '',
        groupCode: '',
        initialQuantity: '',
        entryDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch {
      toast.error('Không thể tải danh sách phân khu chuồng trại hoặc giống vật nuôi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.zoneId || !formData.breedId || !formData.initialQuantity || !formData.entryDate) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    try {
      setSubmitting(true);
      await livestockService.createGroup(farmId, {
        zoneId: Number(formData.zoneId),
        breedId: Number(formData.breedId),
        groupCode: formData.groupCode?.trim() || null,
        initialQuantity: parseInt(formData.initialQuantity, 10),
        entryDate: formData.entryDate,
        notes: formData.notes?.trim() || null,
      });

      toast.success('Khởi tạo đàn/bầy vật nuôi thành công!');
      onSuccess?.();
      onClose();
    } catch {
      // Handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-sky-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Khởi Tạo Đàn/Bầy Vật Nuôi Mới
              </h3>
              <p className="text-xs text-slate-500">Quản lý lứa gia súc, gia cầm tập trung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Khu vực chuồng nuôi <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.zoneId}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                required
              >
                <option value="">-- Chọn chuồng nuôi --</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Giống vật nuôi <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.breedId}
                onChange={(e) => setFormData({ ...formData, breedId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                required
              >
                <option value="">-- Chọn giống vật nuôi --</option>
                {breeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.species}] {b.breedName} ({b.standardGrowthDays} ngày)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã đàn (Để trống hệ thống tự sinh định dạng DAN-YYYYMMDD-XXXX)
            </label>
            <input
              type="text"
              placeholder="VD: DAN-HEO-2026-01"
              value={formData.groupCode}
              onChange={(e) => setFormData({ ...formData, groupCode: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Số lượng cá thể ban đầu <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="VD: 50"
                value={formData.initialQuantity}
                onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày nhập đàn <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi chú thêm
            </label>
            <textarea
              rows={2}
              placeholder="VD: Đàn heo thịt nhập từ trại giống cấp 1, tiêm đủ mũi vaccine sơ sinh..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm shadow-sky-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang khởi tạo...' : 'Tạo đàn vật nuôi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
