import React, { useState } from 'react';
import { X, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cropService } from '../../services/cropService';

export const HarvestSeasonModal = ({ isOpen, onClose, farmId, season, onSuccess }) => {
  const [actualHarvestDate, setActualHarvestDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [actualYieldKg, setActualYieldKg] = useState('');
  const [closeSeason, setCloseSeason] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !season) return null;

  const yieldValue = parseFloat(actualYieldKg) || 0;
  const estimatedYield = parseFloat(season.estimatedYieldKg) || 0;
  const areaM2 = parseFloat(season.plantedAreaM2) || 0;

  const achievementRate =
    estimatedYield > 0 ? ((yieldValue / estimatedYield) * 100).toFixed(1) : 0;
  const yieldPerM2 = areaM2 > 0 ? (yieldValue / areaM2).toFixed(2) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actualHarvestDate || !actualYieldKg) {
      toast.error('Vui lòng nhập ngày thu hoạch và sản lượng thực tế.');
      return;
    }

    try {
      setSubmitting(true);
      await cropService.harvestSeason(farmId, season.id, {
        actualHarvestDate,
        actualYieldKg: parseFloat(actualYieldKg),
        closeSeason,
      });

      toast.success(
        closeSeason
          ? 'Đã ghi nhận thu hoạch và hoàn tất đóng vụ mùa!'
          : 'Đã ghi nhận thu hoạch thành công!'
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      // Toast displayed by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Ghi Nhận Thu Hoạch Vụ Mùa
              </h3>
              <p className="text-xs text-slate-500">Mã vụ: {season.seasonCode}</p>
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
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Giống cây:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {season.cropTypeName} ({season.varietyCode})
              </p>
            </div>
            <div>
              <span className="text-slate-400">Phân khu:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{season.zoneName}</p>
            </div>
            <div>
              <span className="text-slate-400">Diện tích gieo trồng:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{season.plantedAreaM2} m²</p>
            </div>
            <div>
              <span className="text-slate-400">Sản lượng dự kiến:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{season.estimatedYieldKg || 0} kg</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày thu hoạch thực tế <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={actualHarvestDate}
              onChange={(e) => setActualHarvestDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sản lượng thu hoạch thực tế (kg) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="VD: 4350"
              value={actualYieldKg}
              onChange={(e) => setActualYieldKg(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              required
            />
          </div>

          {/* Real-time KPI Preview */}
          {yieldValue > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Năng suất thực tế:
                </span>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {yieldPerM2} <span className="text-xs font-normal">kg/m²</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Tỷ lệ đạt kế hoạch:
                </span>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {achievementRate}%
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="closeSeasonCheckbox"
              checked={closeSeason}
              onChange={(e) => setCloseSeason(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <label
              htmlFor="closeSeasonCheckbox"
              className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Đóng và kết thúc vụ mùa này sau khi thu hoạch (chuyển sang trạng thái ĐÓNG_VỤ)
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-sm shadow-amber-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Xác nhận thu hoạch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
