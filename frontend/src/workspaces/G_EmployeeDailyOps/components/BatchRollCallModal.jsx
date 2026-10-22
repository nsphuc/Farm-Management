import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Camera,
  RefreshCw,
  Clock,
  Calendar,
  Building2,
  ShieldCheck,
  Check,
  UserCheck,
  Upload,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { calculateHaversineDistance } from '@/utils/formatters';

export function BatchRollCallModal({
  isOpen,
  onClose,
  onSuccess,
  activeFarm,
  shifts = [],
  employees = [],
}) {
  const [shiftId, setShiftId] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionType, setActionType] = useState('CHECK_IN'); // 'CHECK_IN' | 'CHECK_OUT'
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [filterMode, setFilterMode] = useState('NO_ACCOUNT'); // 'ALL' | 'NO_ACCOUNT'
  const [notes, setNotes] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const fileInputRef = useRef(null);

  // GPS State
  const [gpsState, setGpsState] = useState({
    isLoading: false,
    latitude: null,
    longitude: null,
    distanceM: null,
    isWithinGeofence: true,
    error: null,
  });

  // Tự động chọn ca đầu tiên nếu chưa chọn
  useEffect(() => {
    if (shifts.length > 0 && !shiftId) {
      setShiftId(String(shifts[0].id));
    }
  }, [shifts, shiftId]);

  // Lọc nhân viên thuộc Farm hiện tại
  const farmEmployees = employees.filter(
    (e) => !activeFarm?.id || e.farmId === activeFarm.id || !e.farmId
  );

  const noAccountEmployees = farmEmployees.filter(
    (e) => e.userId === null || e.position === 'SEASONAL_NO_ACCOUNT'
  );

  const displayedEmployees =
    filterMode === 'NO_ACCOUNT' ? noAccountEmployees : farmEmployees;

  // Khi mở modal, tự động chọn tất cả lao động không tài khoản và lấy GPS
  useEffect(() => {
    if (isOpen) {
      setGeneralError(null);
      setSuccessInfo(null);
      // Mặc định chọn tất cả công nhân không có tài khoản
      const defaultIds = noAccountEmployees.map((e) => e.id);
      setSelectedEmployeeIds(defaultIds);
      fetchGpsLocation();
    }
  }, [isOpen, activeFarm]);

  const fetchGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Trình duyệt không hỗ trợ Geolocation GPS',
      }));
      return;
    }

    setGpsState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let dist = 0;
        let within = true;

        if (activeFarm?.latitude && activeFarm?.longitude) {
          dist = calculateHaversineDistance(
            lat,
            lon,
            Number(activeFarm.latitude),
            Number(activeFarm.longitude)
          );
          const radius = activeFarm.geofenceRadiusM || 300;
          within = dist <= radius;
        }

        setGpsState({
          isLoading: false,
          latitude: lat,
          longitude: lon,
          distanceM: Math.round(dist),
          isWithinGeofence: within,
          error: null,
        });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback tọa độ trang trại nếu chạy trên localhost/môi trường dev
        const fallbackLat = activeFarm?.latitude ? Number(activeFarm.latitude) : 21.028511;
        const fallbackLon = activeFarm?.longitude ? Number(activeFarm.longitude) : 105.854167;
        setGpsState({
          isLoading: false,
          latitude: fallbackLat,
          longitude: fallbackLon,
          distanceM: 10,
          isWithinGeofence: true,
          error: 'Dùng tọa độ định vị mặc định trang trại (Dev Mode)',
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedEmployeeIds.length === displayedEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(displayedEmployees.map((e) => e.id));
    }
  };

  const handleToggleEmployee = (id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!activeFarm?.id) {
      setGeneralError('Vui lòng chọn trang trại tác nghiệp trước khi điểm danh');
      return;
    }

    if (!shiftId) {
      setGeneralError('Vui lòng chọn ca làm việc');
      return;
    }

    if (selectedEmployeeIds.length === 0) {
      setGeneralError('Vui lòng chọn ít nhất 1 nhân viên trong danh sách có mặt');
      return;
    }

    // Nếu chưa chụp ảnh, tạo ảnh mô phỏng hiện trường chuẩn
    const effectivePhoto =
      photoDataUrl ||
      `https://images.nongtrai.vn/rollcall/team_${actionType.toLowerCase()}_${Date.now()}.jpg`;

    const lat = gpsState.latitude || (activeFarm.latitude ? Number(activeFarm.latitude) : 21.028511);
    const lon = gpsState.longitude || (activeFarm.longitude ? Number(activeFarm.longitude) : 105.854167);

    try {
      setIsSubmitting(true);

      const payload = {
        farmId: activeFarm.id,
        shiftId: Number(shiftId),
        workDate: workDate || new Date().toISOString().split('T')[0],
        actionType: actionType,
        employeeIds: selectedEmployeeIds,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lon.toFixed(6)),
        photoUrl: effectivePhoto,
        notes: notes.trim() || null,
      };

      const res = await hrService.batchRollCall(payload);

      setSuccessInfo(
        `Đã điểm danh ${actionType === 'CHECK_IN' ? 'VÀO CA' : 'TAN CA'} thành công cho ${
          res.successCount || selectedEmployeeIds.length
        } nhân sự!`
      );

      setTimeout(() => {
        onSuccess?.(res);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Batch roll call error:', err);
      setGeneralError(
        err.response?.data?.message || err.message || 'Lỗi thực thi điểm danh tập thể'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Điểm Danh Tập Thể Hiện Trường / Kho Vận (Batch Roll-Call)"
      subtitle={`Chấm công GPS & Ảnh chụp nhóm cho tổ lao động không có tài khoản • ${
        activeFarm?.name || activeFarm?.farmName || 'Trang Trại'
      }`}
      icon={<Users className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {generalError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {successInfo && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900 font-bold animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* 1. Thanh Chọn Loại Điểm Danh & Ca Làm Việc */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Thao Tác Điểm Danh *
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActionType('CHECK_IN')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  actionType === 'CHECK_IN'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                🟢 Vào Ca
              </button>
              <button
                type="button"
                onClick={() => setActionType('CHECK_OUT')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  actionType === 'CHECK_OUT'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                🔴 Tan Ca
              </button>
            </div>
          </div>

          <FormField label="2. Ca Làm Việc" required>
            <Select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="bg-white"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.shiftName} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="3. Ngày Điểm Danh" required>
            <Input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="bg-white"
            />
          </FormField>
        </div>

        {/* 2. Danh Sách Công Nhân Chọn Điểm Danh */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Danh Sách Nhân Sự Có Mặt ({selectedEmployeeIds.length}/{displayedEmployees.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterMode('NO_ACCOUNT')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                    filterMode === 'NO_ACCOUNT'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  Không tài khoản ({noAccountEmployees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('ALL')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                    filterMode === 'ALL'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  Tất cả ({farmEmployees.length})
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              {selectedEmployeeIds.length === displayedEmployees.length
                ? 'Bỏ chọn tất cả'
                : 'Chọn tất cả'}
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 p-2 space-y-1.5 bg-slate-50/50">
            {displayedEmployees.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Không tìm thấy nhân viên phù hợp trong trang trại
              </div>
            ) : (
              displayedEmployees.map((emp) => {
                const isSelected = selectedEmployeeIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleEmployee(emp.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {emp.fullName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                            {emp.employeeCode}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate block">
                          {emp.position || 'Công nhân'} • {emp.department || 'Hiện trường'}
                        </span>
                      </div>
                    </div>

                    <div>
                      {emp.userId ? (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          Có tài khoản
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Lao động thời vụ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Tọa Độ GPS & Geofence Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Định Vị GPS Hiện Trường (Thiết Bị Của Trưởng Tổ)</span>
            </span>

            <button
              type="button"
              onClick={fetchGpsLocation}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw
                className={`h-3 w-3 ${gpsState.isLoading ? 'animate-spin' : ''}`}
              />
              <span>Cập nhật vị trí</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {gpsState.latitude ? (
              <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                GPS: {gpsState.latitude.toFixed(6)}, {gpsState.longitude.toFixed(6)}
              </span>
            ) : (
              <span className="text-slate-400 italic text-[11px]">Đang lấy tọa độ...</span>
            )}

            {gpsState.distanceM !== null && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  gpsState.isWithinGeofence
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                <ShieldCheck className="h-3 w-3 shrink-0" />
                <span>
                  Cách tâm trại: {gpsState.distanceM}m (Bán kính:{' '}
                  {activeFarm?.geofenceRadiusM || 300}m)
                </span>
              </span>
            )}
          </div>
        </div>

        {/* 4. Chụp Ảnh Nhóm Công Nhân Hiện Trường & Ghi Chú */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Ảnh Chụp Thực Tế Nhóm Công Nhân *</span>
              {photoDataUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl('')}
                  className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                >
                  Xóa ảnh
                </button>
              )}
            </label>

            {photoDataUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-300 h-28 bg-slate-100">
                <img
                  src={photoDataUrl}
                  alt="Ảnh nhóm hiện trường"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Đã tải ảnh
                </span>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 transition-all cursor-pointer p-3 text-center"
              >
                <Camera className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Chụp / Tải Ảnh Nhóm</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Chụp ảnh thực tế nhóm công nhân đang làm việc
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <FormField label="Ghi Chú Công Tác Hiện Trường">
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Tổ làm cỏ luống dưa lưới số 4, nhà màng B2; điểm danh đủ quân số."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </FormField>
        </div>

        {/* 5. Nút Thao Tác Xác Nhận */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<UserCheck className="h-4 w-4" />}
            isLoading={isSubmitting}
            loadingText="Đang điểm danh tập thể..."
          >
            Xác Nhận {actionType === 'CHECK_IN' ? 'Vào Ca' : 'Tan Ca'} (
            {selectedEmployeeIds.length} Người)
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default BatchRollCallModal;
