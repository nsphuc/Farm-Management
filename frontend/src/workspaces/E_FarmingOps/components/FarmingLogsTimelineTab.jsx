import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Package,
  Layers,
  ShieldAlert,
  Droplets,
  Activity,
  User,
  Clock,
  Sparkles,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { toast } from '@/store/useToastStore';
import { farmingService } from '@/services/modules/farmingService';
import { formatDate, formatNumber } from '@/utils/formatters';

export function FarmingLogsTimelineTab({ item, sector, farmId, onDataChanged }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Canh tác
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    activityType: 'FERTILIZATION',
    logDate: new Date().toISOString().split('T')[0],
    stage: 'Chăm sóc sinh trưởng',
    phiDays: 0,
    weatherNotes: 'Trời nắng ráo',
  });

  // Modal Thú y
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    eventType: 'VACCINATION',
    eventDate: new Date().toISOString().split('T')[0],
    withdrawalDays: 0,
    isQuarantined: false,
    detailsJson: '',
  });

  const fetchLogs = async () => {
    if (!farmId || !item?.id) return;
    try {
      setIsLoading(true);
      if (sector === 'CROP') {
        const res = await farmingService.getFarmingLogs(farmId, { seasonId: item.id, size: 50 });
        const list = res?.content || (Array.isArray(res) ? res : []);
        setLogs(list);
      } else {
        const res = await farmingService.getLivestockEvents(farmId, { groupId: item.id, size: 50 });
        const list = res?.content || (Array.isArray(res) ? res : []);
        setLogs(list);
      }
    } catch (err) {
      console.error('Lỗi khi tải nhật ký hiện trường:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [farmId, item?.id, sector]);

  const handleCreateCropLog = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await farmingService.createFarmingLog(farmId, {
        seasonId: item.id,
        activityType: logForm.activityType,
        logDate: logForm.logDate,
        stage: logForm.stage,
        phiDays: Number(logForm.phiDays || 0),
        weatherNotes: logForm.weatherNotes,
      });
      toast.success('Đã ghi nhận nhật ký canh tác thành công!');
      setIsAddLogOpen(false);
      fetchLogs();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi ghi nhật ký canh tác:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi ghi nhật ký canh tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLivestockEvent = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await farmingService.createLivestockEvent(farmId, {
        targetType: 'GROUP',
        livestockGroupId: item.id,
        eventType: eventForm.eventType,
        eventDate: eventForm.eventDate,
        withdrawalDays: Number(eventForm.withdrawalDays || 0),
        isQuarantined: eventForm.isQuarantined,
        detailsJson: eventForm.detailsJson,
      });
      toast.success('Đã ghi nhận sự kiện thú y / tiêm phòng thành công!');
      setIsAddEventOpen(false);
      fetchLogs();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi ghi sự kiện thú y:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi ghi sự kiện thú y');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header thanh công cụ */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span>Lịch Sử Nhật Ký Hiện Trường & Trừ Kho Auto-Backflushing ({logs.length})</span>
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Tự động trừ kho theo số lô FEFO</span>
        </div>

        <div>
          {sector === 'CROP' ? (
            <Can permission="PERM_CROP_LOG" role={['ROLE_FIELD_STAFF', 'ROLE_FARM_MANAGER']}>
              <Button
                size="sm"
                variant="primary"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setIsAddLogOpen(true)}
              >
                + Ghi Nhật Ký Canh Tác & Xuất Vật Tư
              </Button>
            </Can>
          ) : (
            <Can permission="PERM_LIVESTOCK_VET" role="ROLE_TECHNICAL_STAFF">
              <Button
                size="sm"
                variant="primary"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setIsAddEventOpen(true)}
              >
                + Ghi Sự Kiện Thú Y / Tiêm Phòng
              </Button>
            </Can>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Đang tải nhật ký hiện trường...</div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <h5 className="font-bold text-slate-800 text-xs">Chưa có nhật ký ghi nhận</h5>
          <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
            {sector === 'CROP'
              ? 'Nhân viên hiện trường (ROLE_FIELD_STAFF) hoặc Quản lý sẽ ghi nhận hoạt động bón phân, phun thuốc tại đây.'
              : 'Bác sĩ thú y / Kỹ thuật (ROLE_TECHNICAL_STAFF) sẽ ghi nhận phác đồ tiêm phòng, kiểm tra dịch bệnh tại đây.'}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {logs.map((log) => {
            const dateStr = log.logDate || log.eventDate;
            const title = log.activityType || log.eventType || 'Hoạt động hiện trường';
            const notes = log.notes || log.description || log.detailsJson;
            const items = log.materialConsumptions || log.materials || [];

            return (
              <div key={log.id} className="relative group">
                <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-600 shadow-xs group-hover:scale-125 transition-transform" />

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5 hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{title}</span>
                      {log.stage && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.2 rounded-full border border-emerald-200">
                          {log.stage}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(dateStr)}</span>
                    </span>
                  </div>

                  {notes && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {notes}
                    </p>
                  )}

                  {items.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Package className="h-3 w-3 text-amber-600" />
                        <span>Vật tư đã trừ kho tự động (Auto-Backflushing):</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {items.map((mat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg text-xs border border-amber-200 font-medium"
                          >
                            <span>{mat.materialName || `Vật tư #${mat.materialId}`}</span>
                            <strong className="font-mono text-amber-950">
                              {formatNumber(mat.quantity)} {mat.unit || ''}
                            </strong>
                            {mat.batchNumber && (
                              <span className="text-[10px] font-mono text-amber-700 bg-white px-1 rounded border border-amber-300">
                                Lô {mat.batchNumber}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ghi Nhật Ký Canh Tác (Crop) */}
      <Modal
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        title="Ghi Nhật Ký Canh Tác Hiện Trường"
        size="md"
      >
        <form onSubmit={handleCreateCropLog} className="space-y-4 text-xs">
          <FormField label="Loại Hoạt Động Canh Tác" required>
            <Select
              value={logForm.activityType}
              onChange={(e) => setLogForm({ ...logForm, activityType: e.target.value })}
            >
              <option value="FERTILIZATION">Bón phân / Dinh dưỡng</option>
              <option value="PESTICIDE_APPLICATION">Phun thuốc BVTV (Cần cách ly PHI)</option>
              <option value="IRRIGATION">Tưới tiêu / Cấp ẩm</option>
              <option value="SOIL_TILLAGE">Làm đất / Chuẩn bị luống</option>
              <option value="PRUNING">Cắt tỉa nhánh / Chồi</option>
              <option value="WEEDING">Làm cỏ / Dọn luống</option>
              <option value="HARVESTING">Thu hoạch nông sản</option>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày Thực Hiện" required>
              <Input
                type="date"
                value={logForm.logDate}
                onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
              />
            </FormField>

            <FormField label="Giai Đoạn Sinh Trưởng">
              <Input
                value={logForm.stage}
                placeholder="VD: Cây con, Ra hoa, Nuôi trái"
                onChange={(e) => setLogForm({ ...logForm, stage: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Số Ngày Cách Ly PHI (Pre-Harvest Interval)">
            <Input
              type="number"
              min="0"
              value={logForm.phiDays}
              onChange={(e) => setLogForm({ ...logForm, phiDays: e.target.value })}
              placeholder="0 (nếu không dùng thuốc bảo vệ thực vật)"
            />
          </FormField>

          <FormField label="Ghi Chú Thời Tiết & Hiện Trường">
            <Input
              value={logForm.weatherNotes}
              placeholder="Nắng, mưa nhẹ, độ ẩm..."
              onChange={(e) => setLogForm({ ...logForm, weatherNotes: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsAddLogOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu Nhật Ký'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ghi Sự Kiện Thú Y (Livestock) */}
      <Modal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        title="Ghi Nhận Sự Kiện Thú Y / Tiêm Phòng"
        size="md"
      >
        <form onSubmit={handleCreateLivestockEvent} className="space-y-4 text-xs">
          <FormField label="Loại Sự Kiện Thú Y" required>
            <Select
              value={eventForm.eventType}
              onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
            >
              <option value="VACCINATION">Tiêm phòng vaccine</option>
              <option value="MEDICAL_TREATMENT">Điều trị bệnh / Sử dụng kháng sinh</option>
              <option value="WEIGHT_CHECK">Kiểm tra sức khỏe / Cân thể trọng</option>
              <option value="BREEDING">Phối giống / Thụ tinh</option>
              <option value="BIRTH">Sinh sản / Đẻ con</option>
              <option value="TRANSFER">Điều chuyển phân khu / chuồng</option>
              <option value="SLAUGHTER">Xuất chuồng / Giết mổ</option>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày Diễn Ra" required>
              <Input
                type="date"
                value={eventForm.eventDate}
                onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
              />
            </FormField>

            <FormField label="Thời Gian Ngừng Thuốc (Ngày - Withdrawal)">
              <Input
                type="number"
                min="0"
                value={eventForm.withdrawalDays}
                onChange={(e) => setEventForm({ ...eventForm, withdrawalDays: e.target.value })}
                placeholder="0"
              />
            </FormField>
          </div>

          <FormField label="Chi Tiết Phác Đồ / Thuốc Sử Dụng">
            <Input
              value={eventForm.detailsJson}
              placeholder="VD: Tiêm ngừa lở mồm long móng liều 2ml/con..."
              onChange={(e) => setEventForm({ ...eventForm, detailsJson: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsAddEventOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu Sự Kiện Thú Y'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default FarmingLogsTimelineTab;
