import React, { useState, useEffect } from 'react';
import { X, Tag, HeartPulse, Scale, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import { livestockService } from '../../services/livestockService';
import { farmService } from '../../services/farmService';

const SPECIES_OPTIONS = [
  { value: 'BO', label: 'Bò (Cattle)' },
  { value: 'HEO', label: 'Heo/Lợn (Swine)' },
  { value: 'DE', label: 'Dê (Goat)' },
  { value: 'GA', label: 'Gà (Poultry)' },
  { value: 'VIT', label: 'Vịt (Duck)' },
  { value: 'KHAC', label: 'Khác' },
];

export const CreateIndividualModal = ({ isOpen, onClose, farmId, onSuccess }) => {
  const [zones, setZones] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    zoneId: '',
    species: 'BO',
    groupId: '',
    rfidTagCode: '',
    gender: 'CAI',
    birthDate: '',
    motherTagCode: '',
    fatherTagCode: '',
    currentWeightKg: '',
    healthStatus: 'KHOE_MANH',
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
      const [zonesData, groupsData] = await Promise.all([
        farmService.getZones(farmId),
        livestockService.getGroups(farmId, { size: 100 }),
      ]);
      setZones(zonesData || []);
      setGroups(groupsData?.content || []);

      setFormData({
        zoneId: zonesData?.[0]?.id || '',
        species: 'BO',
        groupId: '',
        rfidTagCode: '',
        gender: 'CAI',
        birthDate: '',
        motherTagCode: '',
        fatherTagCode: '',
        currentWeightKg: '',
        healthStatus: 'KHOE_MANH',
        notes: '',
      });
    } catch {
      toast.error('Không thể tải dữ liệu chuồng trại hoặc đàn nuôi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.zoneId || !formData.species) {
      toast.error('Vui lòng chọn khu vực chuồng trại và loài vật nuôi.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await livestockService.createIndividual(farmId, {
        zoneId: Number(formData.zoneId),
        species: formData.species,
        groupId: formData.groupId ? Number(formData.groupId) : null,
        rfidTagCode: formData.rfidTagCode?.trim() || null,
        gender: formData.gender,
        birthDate: formData.birthDate || null,
        motherTagCode: formData.motherTagCode?.trim() || null,
        fatherTagCode: formData.fatherTagCode?.trim() || null,
        currentWeightKg: formData.currentWeightKg ? parseFloat(formData.currentWeightKg) : null,
        healthStatus: formData.healthStatus,
        notes: formData.notes?.trim() || null,
      });

      toast.success(`Đăng ký cá thể thành công với mã thẻ tai: ${res.rfidTagCode}`);
      onSuccess?.();
      onClose();
    } catch {
      // Handled
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Đăng Ký Cá Thể & Lập Chỉ Mục Thẻ Tai (RFID)
              </h3>
              <p className="text-xs text-slate-500">Tự động sinh mã duy nhất [LOÀI-NĂM-STT]</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Loài vật nuôi <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                required
              >
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Khu vực chuồng trại <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.zoneId}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                required
              >
                <option value="">-- Chọn chuồng --</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã thẻ tai / RFID (Để trống để hệ thống tự động sinh [SPECIES]-[YEAR]-[STT])
            </label>
            <input
              type="text"
              placeholder={`VD: ${formData.species}-${new Date().getFullYear()}-00001`}
              value={formData.rfidTagCode}
              onChange={(e) => setFormData({ ...formData, rfidTagCode: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Thuộc đàn / bầy
              </label>
              <select
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="">-- Cá thể độc lập --</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.groupCode} ({g.breedName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Giới tính
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="CAI">Con Cái</option>
                <option value="DUC">Con Đực</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Trọng lượng hiện tại (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="VD: 345.5"
                value={formData.currentWeightKg}
                onChange={(e) => setFormData({ ...formData, currentWeightKg: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Phả hệ (Mẹ / Cha) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Thông tin phả hệ con giống (Genealogy)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mã thẻ tai Mẹ (Mother Tag)
                </label>
                <input
                  type="text"
                  placeholder="VD: BO-2023-00045"
                  value={formData.motherTagCode}
                  onChange={(e) => setFormData({ ...formData, motherTagCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mã thẻ tai Cha (Father Tag / Tinh giống)
                </label>
                <input
                  type="text"
                  placeholder="VD: BO-2022-00010"
                  value={formData.fatherTagCode}
                  onChange={(e) => setFormData({ ...formData, fatherTagCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày sinh
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Trạng thái sức khỏe
              </label>
              <select
                value={formData.healthStatus}
                onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="KHOE_MANH">Khỏe mạnh</option>
                <option value="BENH">Bị bệnh</option>
                <option value="CACH_LY">Đang cách ly</option>
              </select>
            </div>
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
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang đăng ký...' : 'Đăng ký cá thể'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
