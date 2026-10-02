import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Calendar,
  Scale,
  Heart,
  Activity,
  GitBranch,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Plus,
  RefreshCw,
  Syringe,
  Stethoscope,
  LogOut,
  Baby,
  HeartHandshake
} from 'lucide-react';
import { livestockService } from '../../services/livestockService';
import { toast } from 'sonner';

const HEALTH_STATUS_CONFIG = {
  KHOE_MANH: { label: 'Khỏe mạnh', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck },
  BENH: { label: 'Bị bệnh', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertTriangle },
  DIEU_TRI: { label: 'Đang điều trị', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Activity },
  CACH_LY: { label: 'Cách ly y tế', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: AlertTriangle },
};

const EVENT_ICONS = {
  TIEM_PHONG: { icon: Syringe, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Tiêm phòng' },
  DO_TRONG_LUONG: { icon: Scale, color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Cân trọng lượng' },
  DIEU_TRI_BENH: { icon: Stethoscope, color: 'text-rose-600 bg-rose-50 border-rose-200', label: 'Điều trị bệnh' },
  PHOI_GIONG: { icon: HeartHandshake, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Phối giống' },
  DE_CON: { icon: Baby, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Đẻ con' },
  XUAT_CHUONG: { icon: LogOut, color: 'text-slate-600 bg-slate-50 border-slate-200', label: 'Xuất chuồng' },
};

export const IndividualDetailDrawer = ({
  isOpen,
  onClose,
  individualId,
  farmId,
  onOpenEventModal,
  onIndividualUpdated
}) => {
  const [individual, setIndividual] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingHealth, setUpdatingHealth] = useState(false);

  useEffect(() => {
    if (isOpen && individualId && farmId) {
      loadData();
    }
  }, [isOpen, individualId, farmId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [indData, evData] = await Promise.all([
        livestockService.getIndividualById(farmId, individualId),
        livestockService.getEventsByTarget(farmId, 'INDIVIDUAL', individualId).catch(() => [])
      ]);
      setIndividual(indData);
      setEvents(evData || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải hồ sơ lý lịch cá thể!');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHealth = async (newStatus) => {
    if (!individual) return;
    try {
      setUpdatingHealth(true);
      const updated = await livestockService.updateIndividualHealth(farmId, individual.id, newStatus, `Cập nhật nhanh từ Drawer lý lịch`);
      setIndividual(updated);
      toast.success(`Đã cập nhật trạng thái sức khỏe: ${HEALTH_STATUS_CONFIG[newStatus]?.label || newStatus}`);
      onIndividualUpdated?.();
      // Reload events timeline
      const evData = await livestockService.getEventsByTarget(farmId, 'INDIVIDUAL', individual.id).catch(() => []);
      setEvents(evData || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật trạng thái sức khỏe');
    } finally {
      setUpdatingHealth(false);
    }
  };

  if (!isOpen) return null;

  const currentHealth = individual?.healthStatus || 'KHOE_MANH';
  const healthConfig = HEALTH_STATUS_CONFIG[currentHealth] || HEALTH_STATUS_CONFIG.KHOE_MANH;
  const HealthIcon = healthConfig.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-300 ease-out">
        {/* Drawer Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Tag className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-mono tracking-wider">
                  {individual?.rfidTagCode || 'Đang tải...'}
                </h3>
              </div>
              <p className="text-xs text-emerald-200 font-medium">
                Lý lịch điện tử cá thể & Nhật ký biến động
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-sm font-medium">Đang tải hồ sơ cá thể...</span>
          </div>
        ) : individual ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Profile Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Giống / Loài
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    {individual.breedName || individual.species || 'Chưa phân loại'}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Giới tính
                  </span>
                  <div className="text-sm font-bold text-slate-800">
                    {individual.gender === 'DUC' ? '♂ Đực' : individual.gender === 'CAI' ? '♀ Cái' : 'Không xác định'}
                  </div>
                </div>
              </div>

              {/* Grid thông tin phụ */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày sinh
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {individual.birthDate ? new Date(individual.birthDate).toLocaleDateString('vi-VN') : '—'}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Scale className="w-3.5 h-3.5 text-slate-400" /> Trọng lượng
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {individual.weightKg ? `${individual.weightKg} kg` : '—'}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Trạng thái
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {individual.status === 'DANG_NUOI' ? 'Đang nuôi' : individual.status}
                  </p>
                </div>
              </div>

              {/* Phả hệ cha mẹ */}
              {(individual.motherTagCode || individual.fatherTagCode) && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5 text-emerald-600" /> Phả hệ nguồn gốc
                  </span>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                    <div>Mẹ: <span className="font-mono font-semibold text-emerald-700">{individual.motherTagCode || 'Không rõ'}</span></div>
                    <div>Cha: <span className="font-mono font-semibold text-teal-700">{individual.fatherTagCode || 'Không rõ'}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Trạng thái Sức khỏe & Cập nhật nhanh */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tình trạng Sức khỏe
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${healthConfig.color}`}>
                  <HealthIcon className="w-3.5 h-3.5" />
                  {healthConfig.label}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Chuyển nhanh trạng thái:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(HEALTH_STATUS_CONFIG).map(([key, config]) => {
                    const isSelected = currentHealth === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={updatingHealth || isSelected}
                        onClick={() => handleUpdateHealth(key)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition text-center min-h-[44px] flex items-center justify-center ${
                          isSelected
                            ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-800/20'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timeline Sự kiện chăn nuôi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Nhật ký & Biến động cá thể ({events.length})
                </h4>
                <button
                  type="button"
                  onClick={() => onOpenEventModal?.(individual)}
                  className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Ghi sự kiện mới
                </button>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                  Chưa ghi nhận sự kiện tiêm chủng hay đo lường nào cho cá thể này.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {events.map((ev) => {
                    const typeCfg = EVENT_ICONS[ev.eventType] || {
                      icon: Activity,
                      color: 'text-slate-600 bg-slate-50 border-slate-200',
                      label: ev.eventType
                    };
                    const Icon = typeCfg.icon;

                    let details = null;
                    if (ev.detailsJson) {
                      try {
                        details = typeof ev.detailsJson === 'string' ? JSON.parse(ev.detailsJson) : ev.detailsJson;
                      } catch {
                        details = null;
                      }
                    }

                    return (
                      <div key={ev.id} className="relative group">
                        {/* Dot icon */}
                        <div className={`absolute -left-6 top-1 p-1 rounded-full border bg-white shadow-xs ${typeCfg.color}`}>
                          <Icon className="w-3 h-3" />
                        </div>

                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              {typeCfg.label}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {new Date(ev.eventDate).toLocaleString('vi-VN')}
                            </span>
                          </div>

                          {/* Details render */}
                          {details && (
                            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5">
                              {details.vaccineName && (
                                <div><strong className="text-slate-700">Vắc-xin:</strong> {details.vaccineName}</div>
                              )}
                              {details.weightKg && (
                                <div><strong className="text-slate-700">Trọng lượng:</strong> {details.weightKg} kg</div>
                              )}
                              {details.diagnosis && (
                                <div><strong className="text-slate-700">Chẩn đoán:</strong> {details.diagnosis}</div>
                              )}
                              {details.protocol && (
                                <div><strong className="text-slate-700">Phác đồ:</strong> {details.protocol}</div>
                              )}
                            </div>
                          )}

                          {ev.notes && (
                            <p className="text-xs text-slate-500 italic">
                              "{ev.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Không tìm thấy thông tin cá thể
          </div>
        )}
      </div>
    </div>
  );
};
export default IndividualDetailDrawer;
