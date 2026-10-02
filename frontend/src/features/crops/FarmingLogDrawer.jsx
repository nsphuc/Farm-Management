import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Calendar,
  Clock,
  User,
  Package,
  CloudSun,
  Droplets,
  Sprout,
  ShieldAlert,
  Scissors,
  Layers,
  Sparkles,
  FileText,
} from 'lucide-react';
import { cropService } from '../../services/cropService';

const ACTIVITY_META = {
  TUOI_NUOC: { label: 'Tưới nước', icon: Droplets, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/50 border-sky-200' },
  BON_PHAN: { label: 'Bón phân', icon: Sprout, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200' },
  PHUN_THUOC_BVTV: { label: 'Phun thuốc BVTV', icon: ShieldAlert, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200' },
  TIA_CANH: { label: 'Tỉa cành/lá', icon: Scissors, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50 border-purple-200' },
  LAM_CO: { label: 'Làm cỏ / Vệ sinh', icon: Layers, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/50 border-teal-200' },
  THU_HOACH: { label: 'Thu hái', icon: Sparkles, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200' },
  LAM_DAT: { label: 'Làm đất', icon: Layers, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/50 border-orange-200' },
  GIEO_TRONG: { label: 'Gieo hạt/trồng', icon: Sprout, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200' },
  KHAC: { label: 'Hoạt động khác', icon: FileText, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200' },
};

export const FarmingLogDrawer = ({ isOpen, onClose, farmId, season, onOpenCreateLog }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && farmId && season?.id) {
      loadLogs();
    }
  }, [isOpen, farmId, season?.id]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await cropService.getFarmingLogs(farmId, season.id, { size: 50 });
      setLogs(data?.content || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !season) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                  {season.seasonCode}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{season.zoneName}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                Nhật Ký Canh Tác Điện Tử VietGAP
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Button */}
          <div className="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/10 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Tổng cộng {logs.length} lượt ghi nhật ký
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenCreateLog?.(season);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Ghi nhật ký nhanh
            </button>
          </div>

          {/* Timeline List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Đang tải nhật ký canh tác...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm">Chưa có nhật ký canh tác nào được ghi nhận cho vụ mùa này.</p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreateLog?.(season);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Ghi nhật ký đầu tiên
                </button>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
                {logs.map((log) => {
                  const meta = ACTIVITY_META[log.activityType] || ACTIVITY_META.KHAC;
                  const Icon = meta.icon;
                  let supplies = [];
                  if (log.suppliesUsedJson) {
                    try {
                      supplies = JSON.parse(log.suppliesUsedJson);
                    } catch {
                      // Ignored
                    }
                  }

                  const formattedDate = new Date(log.logDate).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline Dot with Icon */}
                      <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm bg-white dark:bg-slate-800">
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formattedDate}
                          </span>
                        </div>

                        {log.stage && (
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Giai đoạn: <span className="font-normal text-slate-600 dark:text-slate-400">{log.stage}</span>
                          </p>
                        )}

                        {log.weatherNotes && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 bg-white dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                            <CloudSun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span>{log.weatherNotes}</span>
                          </div>
                        )}

                        {log.notes && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/40 p-2.5 rounded-lg">
                            {log.notes}
                          </p>
                        )}

                        {/* Supplies Used (Backflushing result) */}
                        {supplies.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Vật tư tiêu hao (Đã trừ kho):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {supplies.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/80"
                                >
                                  {s.quantity} {s.unit} {s.batchNumber ? `(Lô: ${s.batchNumber})` : '(FIFO)'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {log.performedByUserName && (
                          <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" /> Người thực hiện: {log.performedByUserName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
