import React, { useState, useEffect } from 'react';
import { X, Sprout, Calendar, MapPin, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { cropService } from '../../services/cropService';
import { farmService } from '../../services/farmService';

export const CreateSeasonModal = ({ isOpen, onClose, farmId, onSuccess }) => {
  const [zones, setZones] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    zoneId: '',
    cropTypeId: '',
    seasonCode: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
    plantedAreaM2: '',
    seedQuantity: '',
    estimatedYieldKg: '',
  });

  useEffect(() => {
    if (isOpen && farmId) {
      loadDependencies();
    }
  }, [isOpen, farmId]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const [zonesData, cropsData] = await Promise.all([
        farmService.getZones(farmId),
        cropService.getCropTypes(),
      ]);
      setZones(zonesData || []);
      setCropTypes(cropsData || []);

      // Reset form
      setFormData({
        zoneId: zonesData?.[0]?.id || '',
        cropTypeId: cropsData?.[0]?.id || '',
        seasonCode: '',
        startDate: new Date().toISOString().split('T')[0],
        expectedHarvestDate: '',
        plantedAreaM2: '',
        seedQuantity: '',
        estimatedYieldKg: '',
      });
    } catch (err) {
      toast.error('Không thể tải danh sách phân khu hoặc giống cây trồng.');
    } finally {
      setLoading(false);
    }
  };

  const handleCropTypeChange = (e) => {
    const cropId = e.target.value;
    const selectedCrop = cropTypes.find((c) => String(c.id) === String(cropId));
    let nextExpectedDate = formData.expectedHarvestDate;

    if (selectedCrop && selectedCrop.growthDaysStandard && formData.startDate) {
      const d = new Date(formData.startDate);
      d.setDate(d.getDate() + selectedCrop.growthDaysStandard);
      nextExpectedDate = d.toISOString().split('T')[0];
    }

    setFormData((prev) => ({
      ...prev,
      cropTypeId: cropId,
      expectedHarvestDate: nextExpectedDate,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.zoneId || !formData.cropTypeId || !formData.startDate || !formData.expectedHarvestDate || !formData.plantedAreaM2) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    try {
      setSubmitting(true);
      await cropService.createSeason(farmId, {
        zoneId: Number(formData.zoneId),
        cropTypeId: Number(formData.cropTypeId),
        seasonCode: formData.seasonCode?.trim() || null,
        startDate: formData.startDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        plantedAreaM2: Number(formData.plantedAreaM2),
        seedQuantity: formData.seedQuantity ? Number(formData.seedQuantity) : null,
        estimatedYieldKg: formData.estimatedYieldKg ? Number(formData.estimatedYieldKg) : null,
      });

      toast.success('Khởi tạo vụ mùa mới thành công!');
      onSuccess?.();
      onClose();
    } catch (err) {
      // Toast displayed by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Khởi tạo Vụ Mùa Canh Tác Mới
              </h3>
              <p className="text-xs text-slate-500">Thiết lập chu kỳ gieo trồng chuẩn VietGAP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phân khu */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phân khu sản xuất <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.zoneId}
                  onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">-- Chọn phân khu --</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.code}) - {z.areaM2} m²
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Giống cây trồng */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Giống cây trồng <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.cropTypeId}
                onChange={handleCropTypeChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                <option value="">-- Chọn giống cây --</option>
                {cropTypes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.varietyCode}) - Chu kỳ {c.growthDaysStandard} ngày
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mã vụ mùa */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã vụ mùa (Để trống hệ thống tự sinh định dạng VU-YYYYMMDD-XXXX)
            </label>
            <input
              type="text"
              placeholder="VD: VU-2026-DUALUOI-A1"
              value={formData.seasonCode}
              onChange={(e) => setFormData({ ...formData, seasonCode: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ngày gieo trồng */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày bắt đầu gieo trồng <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Ngày dự kiến thu hoạch */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày dự kiến thu hoạch <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expectedHarvestDate}
                onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Diện tích */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Diện tích gieo (m²) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="VD: 1500"
                value={formData.plantedAreaM2}
                onChange={(e) => setFormData({ ...formData, plantedAreaM2: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            {/* Số lượng hạt/cây giống */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Số lượng giống (cây/hạt)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="VD: 3000"
                value={formData.seedQuantity}
                onChange={(e) => setFormData({ ...formData, seedQuantity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Sản lượng dự kiến */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sản lượng dự kiến (kg)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="VD: 4500"
                value={formData.estimatedYieldKg}
                onChange={(e) => setFormData({ ...formData, estimatedYieldKg: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang khởi tạo...' : 'Tạo vụ mùa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
