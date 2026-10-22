import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sliders,
  Plus,
  Edit2,
  Save,
  Droplets,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { geographyService } from '@/services/modules/geographyService';
import { FormField, Input, Select, Switch } from '@/components/ui/FormControls';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SmartEmptyState } from '@/components/common/SmartEmptyState';
import { Can } from '@/components/common/Can';
import { extractApiErrors } from '@/utils/apiHelpers';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { formatDate } from '@/utils/formatters';

export function CyclesAndFarmSettingsTab() {
  const { activeFarmId, activeFarm } = useActiveFarmStore();

  // Cycles state
  const [cycles, setCycles] = useState([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [cycleForm, setCycleForm] = useState({
    name: '',
    fiscalYear: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  });
  const [cycleErrors, setCycleErrors] = useState({});
  const [cycleSaving, setCycleSaving] = useState(false);

  // Settings state (irrigation_threshold_json, work_shift_config_json)
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsErrors, setSettingsErrors] = useState({});
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [irrigation, setIrrigation] = useState({
    minSoilMoisturePercent: 45,
    maxSoilMoisturePercent: 80,
    targetTemperatureCelsius: 26.5,
    maxAirTemperatureCelsius: 38.0,
    autoIrrigationEnabled: true,
    irrigationDurationMinutes: 20,
  });
  const [shiftConfig, setShiftConfig] = useState({
    maxCheckInEarlyMinutes: 30,
    graceLateMinutes: 15,
    minWorkingHoursFullDay: 7.0,
    minWorkingHoursHalfDay: 3.5,
    enableGpsDistanceCheck: true,
    maxAllowedGpsAccuracyMeters: 50,
  });

  // Load Cycles
  const fetchCycles = async () => {
    if (!activeFarmId) return;
    try {
      setCyclesLoading(true);
      const data = await geographyService.getCycles(activeFarmId);
      setCycles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load cycles', err);
    } finally {
      setCyclesLoading(false);
    }
  };

  // Load Settings
  const fetchSettings = async () => {
    if (!activeFarmId) return;
    try {
      setSettingsLoading(true);
      const data = await geographyService.getSettings(activeFarmId);
      if (data) {
        if (data.irrigationThresholdJson) {
          try {
            const parsed = typeof data.irrigationThresholdJson === 'string'
              ? JSON.parse(data.irrigationThresholdJson)
              : data.irrigationThresholdJson;
            setIrrigation((prev) => ({ ...prev, ...parsed }));
          } catch (e) {
            console.error('Parse irrigationThresholdJson error', e);
          }
        }
        if (data.workShiftConfigJson) {
          try {
            const parsed = typeof data.workShiftConfigJson === 'string'
              ? JSON.parse(data.workShiftConfigJson)
              : data.workShiftConfigJson;
            setShiftConfig((prev) => ({ ...prev, ...parsed }));
          } catch (e) {
            console.error('Parse workShiftConfigJson error', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load farm settings', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeFarmId) {
      fetchCycles();
      fetchSettings();
    }
  }, [activeFarmId]);

  // Open modal create/edit cycle
  const handleOpenCycleModal = (cycle = null) => {
    setEditingCycle(cycle);
    setCycleErrors({});
    if (cycle) {
      setCycleForm({
        name: cycle.name || '',
        fiscalYear: cycle.fiscalYear || new Date().getFullYear(),
        startDate: cycle.startDate || '',
        endDate: cycle.endDate || '',
        status: cycle.status || 'ACTIVE',
      });
    } else {
      setCycleForm({
        name: '',
        fiscalYear: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        status: 'ACTIVE',
      });
    }
    setCycleModalOpen(true);
  };

  // Submit Cycle
  const handleSaveCycle = async (e) => {
    e.preventDefault();
    if (!cycleForm.name.trim()) {
      setCycleErrors({ name: 'Tên chu kỳ không được để trống' });
      return;
    }
    if (cycleForm.endDate && cycleForm.startDate && cycleForm.endDate < cycleForm.startDate) {
      setCycleErrors({ endDate: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu' });
      return;
    }

    try {
      setCycleSaving(true);
      setCycleErrors({});
      if (editingCycle) {
        await geographyService.updateCycle(activeFarmId, editingCycle.id, cycleForm);
      } else {
        await geographyService.createCycle(activeFarmId, cycleForm);
      }
      setCycleModalOpen(false);
      fetchCycles();
    } catch (err) {
      applyServerFieldErrors(err, setCycleErrors);
    } finally {
      setCycleSaving(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      setSettingsErrors({});
      setSettingsSuccess('');

      const payload = {
        irrigationThresholdJson: JSON.stringify(irrigation),
        workShiftConfigJson: JSON.stringify(shiftConfig),
      };

      await geographyService.updateSettings(activeFarmId, payload);
      setSettingsSuccess('Đã lưu cấu hình ngưỡng vận hành trang trại thành công!');
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err) {
      applyServerFieldErrors(err, setSettingsErrors);
    } finally {
      setSettingsSaving(false);
    }
  };

  if (!activeFarmId) {
    return (
      <SmartEmptyState
        title="Chưa Chọn Trang Trại Tác Nghiệp"
        description="Vui lòng chọn trang trại hoạt động từ thanh điều hướng trên cùng để quản trị Chu kỳ vận hành & Ngưỡng IoT."
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Chu kỳ vận hành (operational_cycles #16) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Chu Kỳ Vận Hành / Niên Vụ ({activeFarm?.name || `Trang trại #${activeFarmId}`})
              </h3>
              <p className="text-xs text-slate-500">
                Quản lý các chu kỳ canh tác, niên vụ tài chính và ranh giới ghi nhận chi phí
              </p>
            </div>
          </div>
          <Can permission="PERM_FARM_UPDATE">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleOpenCycleModal(null)}
              icon={<Plus className="h-4 w-4" />}
            >
              + Thêm Chu Kỳ
            </Button>
          </Can>
        </div>

        {cyclesLoading ? (
          <div className="flex h-32 items-center justify-center text-xs text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin mr-2 text-emerald-600" />
            Đang tải danh sách chu kỳ...
          </div>
        ) : cycles.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Chưa có chu kỳ vận hành nào cho trang trại này. Nhấn "+ Thêm Chu Kỳ" để tạo mới.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Tên Chu Kỳ / Niên Vụ</th>
                  <th className="px-4 py-2.5">Năm Tài Chính</th>
                  <th className="px-4 py-2.5">Ngày Bắt Đầu</th>
                  <th className="px-4 py-2.5">Ngày Kết Thúc</th>
                  <th className="px-4 py-2.5">Trạng Thái</th>
                  <th className="px-4 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cycles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{c.fiscalYear}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(c.startDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(c.endDate)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Can permission="PERM_FARM_UPDATE">
                        <button
                          type="button"
                          onClick={() => handleOpenCycleModal(c)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="Sửa chu kỳ"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Cấu hình Ngưỡng Trang trại farm_operational_settings #17 */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cấu Hình Ngưỡng Vận Hành Trang Trại (IoT & Chấm Công)
                </h3>
                <p className="text-xs text-slate-500">
                  Khớp JSON Schema Mục 3.4 & 3.5 File 15 cho trang trại {activeFarm?.name}
                </p>
              </div>
            </div>
          </div>

          {settingsSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 mb-6">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Phân khu 1: Ngưỡng Tưới & Khí Hậu (irrigation_threshold_json) */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider border-b border-emerald-200/60 pb-2">
                <Droplets className="h-4 w-4 text-emerald-600" />
                Ngưỡng Cảm Biến Đất & Tự Động Tưới Tiêu
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Độ ẩm đất tối thiểu (%)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={irrigation.minSoilMoisturePercent}
                    onChange={(e) =>
                      setIrrigation((prev) => ({
                        ...prev,
                        minSoilMoisturePercent: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>

                <FormField label="Độ ẩm đất tối đa (%)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={irrigation.maxSoilMoisturePercent}
                    onChange={(e) =>
                      setIrrigation((prev) => ({
                        ...prev,
                        maxSoilMoisturePercent: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>

                <FormField label="Nhiệt độ mục tiêu (°C)">
                  <Input
                    type="number"
                    step="0.5"
                    value={irrigation.targetTemperatureCelsius}
                    onChange={(e) =>
                      setIrrigation((prev) => ({
                        ...prev,
                        targetTemperatureCelsius: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>

                <FormField label="Nhiệt độ không khí trần (°C)">
                  <Input
                    type="number"
                    step="0.5"
                    value={irrigation.maxAirTemperatureCelsius}
                    onChange={(e) =>
                      setIrrigation((prev) => ({
                        ...prev,
                        maxAirTemperatureCelsius: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>

                <FormField label="Thời lượng tưới mỗi lần (Phút)">
                  <Input
                    type="number"
                    min="1"
                    value={irrigation.irrigationDurationMinutes}
                    onChange={(e) =>
                      setIrrigation((prev) => ({
                        ...prev,
                        irrigationDurationMinutes: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>

                <div className="flex items-center pt-5">
                  <Switch
                    checked={irrigation.autoIrrigationEnabled}
                    onChange={(val) =>
                      setIrrigation((prev) => ({ ...prev, autoIrrigationEnabled: val }))
                    }
                    label="Kích hoạt tự động tưới"
                    description="Bật van tưới khi độ ẩm < min"
                  />
                </div>
              </div>
            </div>

            {/* Phân khu 2: Quy Tắc Chấm Công (work_shift_config_json) */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-5 space-y-4">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wider border-b border-blue-200/60 pb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Quy Tắc Ca & Chấm Công Di Động
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Check-in sớm tối đa (Phút)">
                  <Input
                    type="number"
                    min="0"
                    value={shiftConfig.maxCheckInEarlyMinutes}
                    onChange={(e) =>
                      setShiftConfig((prev) => ({
                        ...prev,
                        maxCheckInEarlyMinutes: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>

                <FormField label="Ân hạn đi trễ (Phút)">
                  <Input
                    type="number"
                    min="0"
                    value={shiftConfig.graceLateMinutes}
                    onChange={(e) =>
                      setShiftConfig((prev) => ({
                        ...prev,
                        graceLateMinutes: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>

                <FormField label="Giờ công đủ 1 công chuẩn (Giờ)">
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    value={shiftConfig.minWorkingHoursFullDay}
                    onChange={(e) =>
                      setShiftConfig((prev) => ({
                        ...prev,
                        minWorkingHoursFullDay: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>

                <FormField label="Giờ công đủ nửa công (Giờ)">
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={shiftConfig.minWorkingHoursHalfDay}
                    onChange={(e) =>
                      setShiftConfig((prev) => ({
                        ...prev,
                        minWorkingHoursHalfDay: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>

                <FormField label="Sai số GPS tối đa (Mét)">
                  <Input
                    type="number"
                    min="1"
                    value={shiftConfig.maxAllowedGpsAccuracyMeters}
                    onChange={(e) =>
                      setShiftConfig((prev) => ({
                        ...prev,
                        maxAllowedGpsAccuracyMeters: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>

                <div className="flex items-center pt-5">
                  <Switch
                    checked={shiftConfig.enableGpsDistanceCheck}
                    onChange={(val) =>
                      setShiftConfig((prev) => ({ ...prev, enableGpsDistanceCheck: val }))
                    }
                    label="Kiểm tra Geofence GPS"
                    description="Bắt buộc trong bán kính trang trại"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <Can permission="PERM_FARM_UPDATE">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={settingsSaving}
                icon={<Save className="h-4 w-4" />}
              >
                Lưu Cấu Hình Ngưỡng Vận Hành
              </Button>
            </Can>
          </div>
        </div>
      </form>

      {/* Cycle Modal */}
      <Modal
        isOpen={cycleModalOpen}
        onClose={() => setCycleModalOpen(false)}
        title={editingCycle ? 'Cập Nhật Chu Kỳ Vận Hành' : 'Thêm Mới Chu Kỳ Vận Hành'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCycleModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={cycleSaving}
              onClick={handleSaveCycle}
            >
              {editingCycle ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Tên Chu Kỳ / Niên Vụ" required error={cycleErrors.name}>
            <Input
              value={cycleForm.name}
              onChange={(e) => setCycleForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="VD: Niên Vụ Đông Xuân 2026 - 2027"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Năm Tài Chính" required error={cycleErrors.fiscalYear}>
              <Input
                type="number"
                value={cycleForm.fiscalYear}
                onChange={(e) =>
                  setCycleForm((prev) => ({ ...prev, fiscalYear: Number(e.target.value) }))
                }
              />
            </FormField>

            <FormField label="Trạng Thái" required error={cycleErrors.status}>
              <Select
                value={cycleForm.status}
                onChange={(e) => setCycleForm((prev) => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: 'PLANNING', label: 'PLANNING - Lập kế hoạch' },
                  { value: 'ACTIVE', label: 'ACTIVE - Đang hoạt động' },
                  { value: 'CLOSED', label: 'CLOSED - Đã đóng niên vụ' },
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ngày Bắt Đầu" required error={cycleErrors.startDate}>
              <Input
                type="date"
                value={cycleForm.startDate}
                onChange={(e) => setCycleForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </FormField>

            <FormField label="Ngày Kết Thúc" required error={cycleErrors.endDate}>
              <Input
                type="date"
                value={cycleForm.endDate}
                onChange={(e) => setCycleForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default CyclesAndFarmSettingsTab;
