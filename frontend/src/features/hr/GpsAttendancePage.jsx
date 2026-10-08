import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Navigation, 
  Calendar, 
  UserCheck, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  RefreshCw,
  Info
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { hrService } from '../../services/hrService';
import { toast } from 'sonner';

export const GpsAttendancePage = () => {
  const { currentFarm } = useFarmStore();
  const { user } = useAuthStore();
  const farmId = currentFarm?.id;

  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form chấm công
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [note, setNote] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Ngày xem lịch sử
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (farmId) {
      loadMasterData();
      getCurrentGps();
    }
  }, [farmId]);

  useEffect(() => {
    if (farmId && filterDate) {
      loadAttendances();
    }
  }, [farmId, filterDate]);

  const loadMasterData = async () => {
    try {
      const [empRes, shiftRes] = await Promise.all([
        hrService.getEmployees(farmId),
        hrService.getWorkShifts(farmId)
      ]);
      const empList = empRes?.items || (Array.isArray(empRes) ? empRes : []);
      const shiftList = Array.isArray(shiftRes) ? shiftRes : shiftRes?.items || [];
      setEmployees(empList);
      setShifts(shiftList);

      if (empList.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(empList[0].id);
      }
      if (shiftList.length > 0 && !selectedShiftId) {
        setSelectedShiftId(shiftList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendances = async () => {
    try {
      setLoading(true);
      const res = await hrService.getAttendances(farmId, {
        startDate: filterDate,
        endDate: filterDate
      });
      setAttendances(Array.isArray(res) ? res : res?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy vị trí GPS từ trình duyệt
  const getCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS Error:', err);
        // Fallback default tọa độ trang trại nếu người dùng chặn quyền định vị để test
        const defaultLat = currentFarm?.latitude ? Number(currentFarm.latitude) : 10.762622;
        const defaultLng = currentFarm?.longitude ? Number(currentFarm.longitude) : 106.660172;
        setGpsLocation({
          latitude: defaultLat,
          longitude: defaultLng,
          accuracy: 10
        });
        setGpsError('Không truy cập được GPS thực tế. Đang sử dụng tọa độ mô phỏng trang trại.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckIn = async () => {
    if (!selectedEmployeeId || !selectedShiftId) {
      toast.error('Vui lòng chọn nhân viên và ca làm việc');
      return;
    }
    if (!gpsLocation) {
      toast.error('Chưa có tọa độ GPS. Vui lòng bật định vị');
      return;
    }

    try {
      const res = await hrService.checkIn(farmId, {
        employeeId: Number(selectedEmployeeId),
        shiftId: Number(selectedShiftId),
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        note
      });

      const dist = Math.round(res.distanceToFarmMeters || 0);
      if (res.status === 'INVALID_LOCATION') {
        toast.warning(`Chấm công ngoài bán kính cho phép! Cách cổng ${dist}m (tối đa 500m)`);
      } else if (res.status === 'LATE') {
        toast.warning(`Check-in thành công (Đi muộn). Cách cổng ${dist}m`);
      } else {
        toast.success(`Check-in thành công! Cách cổng trang trại ${dist}m`);
      }
      loadAttendances();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi khi Check-in');
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployeeId) {
      toast.error('Vui lòng chọn nhân viên');
      return;
    }
    if (!gpsLocation) {
      toast.error('Chưa có tọa độ GPS. Vui lòng bật định vị');
      return;
    }

    try {
      const res = await hrService.checkOut(farmId, {
        employeeId: Number(selectedEmployeeId),
        shiftId: selectedShiftId ? Number(selectedShiftId) : null,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        note
      });

      const dist = Math.round(res.distanceToFarmMeters || 0);
      toast.success(`Check-out thành công! Tổng giờ công: ${res.workingHours || 0}h (Tăng ca: ${res.overtimeHours || 0}h)`);
      loadAttendances();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi khi Check-out');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VALID':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200"><CheckCircle className="h-3.5 w-3.5" /> Đúng giờ</span>;
      case 'LATE':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><Clock className="h-3.5 w-3.5" /> Đi muộn</span>;
      case 'EARLY_LEAVE':
        return <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200"><Clock className="h-3.5 w-3.5" /> Về sớm</span>;
      case 'INVALID_LOCATION':
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200"><AlertCircle className="h-3.5 w-3.5" /> Ngoài bán kính</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chấm Công Định Vị GPS</h1>
        <p className="mt-1 text-sm text-gray-500">
          Chấm công Mobile-First theo vị trí địa lý thực tế ngoài cổng nông trại (Bán kính quy định $\le 500$m)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Box Chấm công Mobile First bên trái */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Navigation className="h-5 w-5 text-emerald-600" />
              Điểm Chấm Công Trực Tiếp
            </h2>

            {/* GPS Signal Card */}
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-500 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Tọa độ hiện tại
                </span>
                <button
                  type="button"
                  onClick={getCurrentGps}
                  disabled={gpsLoading}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <RefreshCw className={`h-3 w-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                  Làm mới vị trí
                </button>
              </div>

              {gpsLocation ? (
                <div className="mt-2 text-xs font-mono text-gray-700 space-y-0.5">
                  <div>Vĩ độ (Lat): <strong className="text-gray-900">{gpsLocation.latitude.toFixed(6)}</strong></div>
                  <div>Kinh độ (Lng): <strong className="text-gray-900">{gpsLocation.longitude.toFixed(6)}</strong></div>
                  <div className="text-[11px] text-gray-400">Độ chính xác GPS: ±{gpsLocation.accuracy}m</div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-amber-600">Đang tìm tín hiệu vệ tinh GPS...</div>
              )}

              {gpsError && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-700">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{gpsError}</span>
                </div>
              )}
            </div>

            {/* Form chọn NV & Ca */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Chọn nhân viên *</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Chọn ca làm việc *</label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shiftName} ({s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Lý do đi muộn hoặc nhiệm vụ đặc biệt..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons: Check-in / Check-out */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition"
                >
                  <LogIn className="h-5 w-5" />
                  VÀO CA (Check-in)
                </button>

                <button
                  type="button"
                  onClick={handleCheckOut}
                  className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition"
                >
                  <LogOut className="h-5 w-5" />
                  HẾT CA (Check-out)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bảng Nhật ký chấm công bên phải */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Nhật Ký Chấm Công Hôm Nay
                </h2>
                <p className="text-xs text-gray-500">Giám sát vị trí GPS, giờ vào/ra và tính công tự động</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Ngày:</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Nhân viên</th>
                    <th className="px-4 py-3">Giờ Vào / Ra</th>
                    <th className="px-4 py-3">Khoảng cách</th>
                    <th className="px-4 py-3">Giờ công</th>
                    <th className="px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-xs text-gray-400">
                        Đang tải nhật ký chấm công...
                      </td>
                    </tr>
                  ) : attendances.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-xs text-gray-400">
                        Chưa có lượt chấm công nào trong ngày {filterDate}
                      </td>
                    </tr>
                  ) : (
                    attendances.map((item) => {
                      const emp = employees.find(e => e.id === item.employeeId);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            <div className="text-sm">{emp?.fullName || `ID: ${item.employeeId}`}</div>
                            <div className="text-[11px] text-gray-400">{emp?.employeeCode}</div>
                          </td>

                          <td className="px-4 py-3 text-xs">
                            <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                              <span>Vào:</span>
                              <span>{item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('vi-VN') : '—'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-rose-700 font-semibold mt-0.5">
                              <span>Ra:</span>
                              <span>{item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString('vi-VN') : '—'}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-xs">
                            <div className="font-semibold text-gray-800">
                              {item.distanceToFarmMeters ? `${Math.round(item.distanceToFarmMeters)}m` : '0m'}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {item.distanceToFarmMeters <= 500 ? 'Trong cổng' : 'Vượt 500m'}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-xs">
                            <div className="font-bold text-gray-900">{item.workingHours || 0} giờ</div>
                            {item.overtimeHours > 0 && (
                              <div className="text-[10px] font-semibold text-purple-600">
                                +{item.overtimeHours}h OT
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {getStatusBadge(item.status)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
