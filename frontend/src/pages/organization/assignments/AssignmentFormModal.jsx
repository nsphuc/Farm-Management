import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { X, Building2, Layers, User, Calendar, ShieldCheck, Save, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Can } from '../../../permissions/Can';
import { assignmentApi } from '../../../services/assignmentApi';
import { farmApi } from '../../../services/farmApi';
import { employeeApi } from '../../../services/employeeApi';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Modal Tạo phân công quản lý (Nghiệp vụ 1.4: 1.4.1 Gán quản lý trang trại & 1.4.2 Gán quản lý phân khu).
 * Tuân thủ tuyệt đối Điều 3 (Geographic Hierarchy) và Master Business Constraints:
 * 1. Ràng buộc Lọc theo Địa lý (Farm-Bound Filtering):
 *    - Chỉ render nhân sự có farmId trùng khớp chính xác với Farm đang chọn.
 *    - TUYỆT ĐỐI KHÔNG render nhân viên thuộc Farm khác hoặc chưa được gán Farm.
 * 2. Phân công Trang trại (FARM):
 *    - Trang trại -> Nhân sự -> Vai trò.
 *    - Nhân sự Kế toán/HR thuộc Farm nếu chọn sẽ bị báo đỏ + Khóa nút Submit.
 * 3. Phân công Phân khu (ZONE):
 *    - Trang trại -> Phân khu -> Nhân sự -> Vai trò.
 *    - Đổi Farm -> reset Zone, Employee, Role; Đổi Zone -> reset Employee, Role.
 *    - Ô Nhân sự bị disabled nếu chưa chọn Phân khu.
 *    - Ẩn 100% Kế toán, HR và Thủ kho; CHỈ hiển thị Kỹ thuật viên (TECHNICAL_STAFF) và Công nhân (WORKER).
 */
export const AssignmentFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  farms = [],
  employees = [],
  defaultType = 'FARM', // 'FARM' hoặc 'ZONE'
  initialFarmId = '',
}) => {
  const [assignmentType, setAssignmentType] = useState(defaultType); // 'FARM' | 'ZONE'
  const [farmEmployees, setFarmEmployees] = useState([]);
  const [zones, setZones] = useState([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Khởi tạo React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      farmId: initialFarmId || '',
      zoneId: '',
      employeeId: '',
      role: '',
      assignedFrom: new Date().toISOString().split('T')[0],
      assignedTo: '',
    },
    mode: 'onChange',
  });

  // Watch các trường khóa phụ thuộc
  const watchedFarmId = watch('farmId');
  const watchedZoneId = watch('zoneId');
  const watchedEmployeeId = watch('employeeId');
  const watchedRole = watch('role');

  // Hàm tải dữ liệu phụ thuộc của Farm (Phân khu & Nhân viên theo ?farmId=...)
  const loadFarmData = React.useCallback(
    async (farmId) => {
      if (!farmId) {
        setZones([]);
        setFarmEmployees([]);
        return;
      }

      setIsLoadingZones(true);
      setIsLoadingEmployees(true);

      // 1. Tải danh sách phân khu thuộc Farm
      try {
        const zoneRes = await farmApi.getZonesByFarm(farmId);
        setZones(zoneRes.data || []);
      } catch (err) {
        console.warn('Lỗi khi tải danh sách phân khu của trang trại:', err);
        setZones([]);
      } finally {
        setIsLoadingZones(false);
      }

      // 2. Tải danh sách nhân sự thuộc Farm đó (Cách 1: Gọi API ?farmId=...)
      try {
        const empRes = await employeeApi.getEmployees({
          farmId: farmId,
          size: 100,
        });
        const fetchedList =
          empRes.data?.content || (Array.isArray(empRes.data) ? empRes.data : []);

        // Lọc nghiêm ngặt: CHỈ LẤY nhân sự có farmId trùng khớp chính xác với farmId
        const strictlyFarmBound = fetchedList.filter(
          (e) => e.farmId != null && String(e.farmId) === String(farmId)
        );
        setFarmEmployees(strictlyFarmBound);
      } catch (err) {
        console.warn('Lỗi khi fetch nhân viên theo farmId, chuyển sang lọc từ props employees:', err);
        // Cách 2: Lọc nghiêm ngặt từ danh sách props employees:
        const strictlyFarmBound = (employees || []).filter(
          (e) => e.farmId != null && String(e.farmId) === String(farmId)
        );
        setFarmEmployees(strictlyFarmBound);
      } finally {
        setIsLoadingEmployees(false);
      }
    },
    [employees]
  );

  // Reset form & tải dữ liệu khi Modal được mở
  useEffect(() => {
    if (isOpen) {
      const targetFarm = initialFarmId || '';
      setAssignmentType(defaultType);
      reset({
        farmId: targetFarm,
        zoneId: '',
        employeeId: '',
        role: '',
        assignedFrom: new Date().toISOString().split('T')[0],
        assignedTo: '',
      });
      clearErrors();
      if (targetFarm) {
        loadFarmData(targetFarm);
      } else {
        setZones([]);
        setFarmEmployees([]);
      }
    }
  }, [isOpen, defaultType, initialFarmId, reset, clearErrors, loadFarmData]);

  // LUỒNG 1: Ràng buộc Lọc theo Địa lý (Farm-Bound Filtering)
  // Khi `watchedFarmId` thay đổi:
  // - BẮT BUỘC reset Zone, Employee, Role
  // - Gọi API lấy danh sách nhân viên theo `?farmId=${selectedFarmId}`
  // - TUYỆT ĐỐI KHÔNG render những nhân viên thuộc Farm khác hoặc chưa được gán Farm
  useEffect(() => {
    if (!isOpen) return;
    if (watchedFarmId) {
      loadFarmData(watchedFarmId);
    } else {
      setZones([]);
      setFarmEmployees([]);
    }
  }, [watchedFarmId, isOpen, loadFarmData]);

  // LUỒNG 2: Ràng buộc Phân khu -> Nhân sự (Dành riêng cho Tab 1.4.2 Phân công Phân khu)
  // Khi user thay đổi `Zone`:
  // - BẮT BUỘC reset ô Nhân sự (`setValue('employeeId', '')`)
  // - BẮT BUỘC reset ô Vai trò (`setValue('role', '')`)
  useEffect(() => {
    if (assignmentType === 'ZONE') {
      setValue('employeeId', '');
      setValue('role', '');
      clearErrors(['employeeId', 'role']);
    }
  }, [watchedZoneId, assignmentType, setValue, clearErrors]);

  // LUỒNG 3: Ràng buộc Nhân sự -> Vai trò phân công
  // Khi `employeeId` thay đổi:
  // - BẮT BUỘC reset giá trị vai trò (`setValue('role', '')`)
  useEffect(() => {
    setValue('role', '');
    clearErrors('role');
  }, [watchedEmployeeId, setValue, clearErrors]);

  // Xác định Phân khu đang chọn và FarmId đích tương ứng
  const activeZone = useMemo(() => {
    if (!watchedZoneId) return null;
    return zones.find((z) => String(z.id) === String(watchedZoneId)) || null;
  }, [watchedZoneId, zones]);

  // FarmId đích để lọc nhân sự theo địa lý:
  // - Tab FARM: watchedFarmId
  // - Tab ZONE: activeZone?.farmId || watchedFarmId
  const targetFarmId = useMemo(() => {
    if (assignmentType === 'ZONE') {
      return activeZone?.farmId ? String(activeZone.farmId) : String(watchedFarmId || '');
    }
    return String(watchedFarmId || '');
  }, [assignmentType, activeZone, watchedFarmId]);

  // BỘ LỌC NHÂN SỰ NGHIÊM NGẶT (STRICT PERSONNEL & GEOGRAPHIC FILTER)
  // Kết hợp lọc địa lý theo targetFarmId và lọc chuyên môn theo Tab (FARM vs ZONE)
  const eligibleEmployees = useMemo(() => {
    // 1. Chưa chọn Trang trại thì không có nhân sự nào
    if (!targetFarmId) return [];

    // 2. Ở tab Phân khu (ZONE), bắt buộc phải chọn Zone trước mới sinh ra danh sách nhân sự
    if (assignmentType === 'ZONE' && !watchedZoneId) {
      return [];
    }

    // Nguồn dữ liệu: Ưu tiên farmEmployees đã fetch theo farmId từ API
    // Nếu farmEmployees rỗng (do đang tải hoặc lỗi mạng), fallback sang props employees
    const sourceList = farmEmployees.length > 0 ? farmEmployees : (employees || []);

    return sourceList.filter((emp) => {
      // 1. Chỉ lấy nhân sự đang hoạt động
      if (emp.status !== 'ACTIVE') return false;

      // 2. RÀNG BUỘC ĐỊA LÝ TUYỆT ĐỐI (Farm-Bound Filtering):
      // Nhân viên BẮT BUỘC phải có farmId và trùng khớp chính xác với targetFarmId
      // TUYỆT ĐỐI KHÔNG render những nhân viên thuộc Farm khác hoặc chưa được gán Farm (farmId null/undefined)
      if (emp.farmId == null || String(emp.farmId) !== String(targetFarmId)) {
        return false;
      }

      const pos = (emp.position || '').toUpperCase();
      const dept = (emp.department || '').toUpperCase();

      // 3. Tab Phân khu (ZONE):
      // - Vị trí của họ CHỈ ĐƯỢC LÀ: TECHNICAL_STAFF (Kỹ thuật) hoặc WORKER (Công nhân)
      // - TUYỆT ĐỐI CHẶN/ẨN (Không render option): ACCOUNTANT, HR VÀ WAREHOUSE_KEEPER
      if (assignmentType === 'ZONE') {
        const isOffice =
          pos === 'ACCOUNTANT' ||
          pos === 'HR' ||
          dept === 'ACCOUNTING' ||
          dept === 'HR_ADMIN';
        const isWarehouse = pos === 'WAREHOUSE_KEEPER';
        if (isOffice || isWarehouse) return false;
        return pos === 'TECHNICAL_STAFF' || pos === 'WORKER';
      }

      // 4. Tab Trang trại (FARM):
      // Cho phép hiển thị nhân viên thuộc Farm đó (kể cả Kế toán/HR để phục vụ logic cảnh báo đỏ/khóa Submit nếu chọn)
      return true;
    });
  }, [targetFarmId, watchedZoneId, farmEmployees, employees, assignmentType]);

  // Tìm đối tượng nhân viên đang được chọn trong danh sách hợp lệ
  const selectedEmployee = useMemo(() => {
    if (!watchedEmployeeId) return null;
    return eligibleEmployees.find((e) => String(e.id) === String(watchedEmployeeId)) || null;
  }, [watchedEmployeeId, eligibleEmployees]);

  // Vị trí công việc (PositionEnum) của nhân viên đã chọn
  const employeePosition = selectedEmployee?.position || null;

  // Kiểm tra vi phạm vai trò khối văn phòng (Hiến pháp nghiệp vụ Điều 4.1)
  const isOfficeRole = useMemo(() => {
    if (!employeePosition) return false;
    const pos = employeePosition.toUpperCase();
    const dept = (selectedEmployee?.department || '').toUpperCase();
    return pos === 'ACCOUNTANT' || pos === 'HR' || dept === 'ACCOUNTING' || dept === 'HR_ADMIN';
  }, [employeePosition, selectedEmployee]);

  // Cảnh báo Toast và báo lỗi nếu user cố tình chọn Kế toán / HR ở Tab Trang trại
  useEffect(() => {
    if (isOfficeRole) {
      const posLabel = employeePosition === 'ACCOUNTANT' ? 'Kế toán (ACCOUNTANT)' : 'Nhân sự (HR)';
      toast.error(
        `Chính sách phân công: Vị trí ${posLabel} thuộc khối văn phòng, không được phép gán quản lý hiện trường trang trại hoặc phân khu!`,
        'Vi phạm chính sách phân công'
      );
      setError('employeeId', {
        type: 'manual',
        message: `Vị trí ${posLabel} không được phép quản lý hiện trường!`,
      });
    } else if (watchedEmployeeId) {
      clearErrors('employeeId');
    }
  }, [watchedEmployeeId, isOfficeRole, employeePosition, setError, clearErrors]);

  // MA TRẬN ĐỘNG: Vị trí (Position) -> Tùy chọn Vai trò (Role Options)
  const availableRoleOptions = useMemo(() => {
    if (!employeePosition || isOfficeRole) return [];

    if (assignmentType === 'ZONE') {
      if (employeePosition === 'TECHNICAL_STAFF') {
        return [
          { value: 'ZONE_MANAGER', label: 'Quản lý Phân khu sản xuất (ZONE_MANAGER)' },
        ];
      }
      if (employeePosition === 'WORKER') {
        return [
          { value: 'FIELD_WORKER', label: 'Nhân viên Nông vụ Phân khu (FIELD_WORKER)' },
        ];
      }
      return [];
    }

    // assignmentType === 'FARM'
    switch (employeePosition) {
      case 'WAREHOUSE_KEEPER':
        return [
          {
            value: 'WAREHOUSE_KEEPER',
            label: 'Thủ kho Vật tư & Nông sản (WAREHOUSE_KEEPER)',
          },
        ];
      case 'TECHNICAL_STAFF':
        return [
          { value: 'FARM_MANAGER', label: 'Giám đốc / Quản lý Trang trại (FARM_MANAGER)' },
          { value: 'TECHNICAL_LEAD', label: 'Trưởng nhóm Kỹ thuật (TECHNICAL_LEAD)' },
          { value: 'AGRONOMIST', label: 'Kỹ sư Trồng trọt / Nông học (AGRONOMIST)' },
          { value: 'VETERINARIAN', label: 'Bác sĩ Thú y / Chăn nuôi (VETERINARIAN)' },
        ];
      case 'WORKER':
        return [
          {
            value: 'FIELD_WORKER',
            label: 'Nhân viên Nông vụ / Hiện trường (FIELD_WORKER)',
          },
        ];
      default:
        return [];
    }
  }, [employeePosition, isOfficeRole, assignmentType]);

  // Nếu chỉ có duy nhất 1 vai trò hợp lệ, tự động chọn
  useEffect(() => {
    if (availableRoleOptions.length === 1 && !watchedRole) {
      setValue('role', availableRoleOptions[0].value, { shouldValidate: true });
    }
  }, [availableRoleOptions, watchedRole, setValue]);

  // Xử lý chuyển đổi loại phân công (FARM <-> ZONE)
  const handleSwitchType = (type) => {
    setAssignmentType(type);
    setValue('role', '');
    setValue('employeeId', '');
    setValue('zoneId', '');
    clearErrors();
  };

  // Submit form
  const onSubmit = async (data) => {
    if (isOfficeRole) {
      toast.error('Không thể phân công nhân sự thuộc khối văn phòng (Kế toán/HR) vào hiện trường!');
      return;
    }

    if (assignmentType === 'ZONE' && !data.zoneId) {
      setError('zoneId', { type: 'manual', message: 'Vui lòng chọn phân khu sản xuất' });
      return;
    }

    if (!data.employeeId) {
      setError('employeeId', { type: 'manual', message: 'Vui lòng chọn nhân sự đảm nhiệm' });
      return;
    }

    if (!data.role) {
      setError('role', { type: 'manual', message: 'Vui lòng chọn vai trò phân công' });
      return;
    }

    if (data.assignedTo && data.assignedFrom && data.assignedTo < data.assignedFrom) {
      setError('assignedTo', {
        type: 'manual',
        message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
      });
      return;
    }

    try {
      const selectedEmp = eligibleEmployees.find((e) => String(e.id) === String(data.employeeId));

      const payload = {
        employeeId: Number(data.employeeId),
        userId: selectedEmp?.userId ? Number(selectedEmp.userId) : null,
        assignedFrom: data.assignedFrom,
        assignedTo: data.assignedTo || null,
      };

      if (assignmentType === 'FARM') {
        payload.roleInFarm = data.role;
        await assignmentApi.assignFarm(data.farmId, payload);
        toast.success(`Phân công nhân sự vào trang trại thành công!`);
      } else {
        await assignmentApi.assignZone(data.farmId, data.zoneId, payload);
        toast.success(`Gán nhân viên quản lý phân khu thành công!`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi thực hiện phân công:', err);
      const apiDetails = err.response?.data?.details || err.details;
      if (apiDetails && typeof apiDetails === 'object') {
        Object.entries(apiDetails).forEach(([field, msg]) => {
          setError(field, { type: 'server', message: msg });
        });
      }
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể thực hiện phân công. Vui lòng kiểm tra lại.';
      toast.error(msg, 'Lỗi phân công');
    }
  };

  if (!isOpen) return null;

  // Điều kiện vô hiệu hóa ô Nhân sự (Sequential Disable):
  // - Tab Phân khu (ZONE): BẮT BUỘC disabled nếu chưa chọn Phân khu (!watchedZoneId)
  // - Tab Trang trại (FARM): BẮT BUỘC disabled nếu chưa chọn Trang trại (!watchedFarmId)
  const isEmployeeDisabled =
    assignmentType === 'ZONE'
      ? !watchedZoneId || isLoadingEmployees
      : !watchedFarmId || isLoadingEmployees;

  // Trạng thái khóa nút Submit
  const isSubmitDisabled =
    isSubmitting ||
    !watchedFarmId ||
    (assignmentType === 'ZONE' && !watchedZoneId) ||
    !watchedEmployeeId ||
    !watchedRole ||
    isOfficeRole ||
    Boolean(errors.employeeId) ||
    Boolean(errors.farmId) ||
    Boolean(errors.zoneId) ||
    Boolean(errors.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {assignmentType === 'ZONE'
                  ? '1.4.2. Phân công Quản lý Phân khu'
                  : '1.4.1. Phân công Nhân sự Trang trại'}
              </h3>
              <p className="text-xs text-emerald-100">
                Nghiệp vụ 1.4: Phân công nhân sự theo chuẩn Geographic Hierarchy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab chuyển đổi loại phân công */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => handleSwitchType('FARM')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              assignmentType === 'FARM'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            1.4.1. Phân công Trang trại
          </button>

          <button
            type="button"
            onClick={() => handleSwitchType('ZONE')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              assignmentType === 'ZONE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            1.4.2. Phân công Phân khu
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            {/* 1. Chọn Trang trại (Bắt buộc) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn Trang trại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  {...register('farmId', {
                    required: 'Vui lòng chọn trang trại tiếp nhận phân công',
                    onChange: (e) => {
                      const newFarmId = e.target.value;
                      setValue('zoneId', '');
                      setValue('employeeId', '');
                      setValue('role', '');
                      clearErrors();
                      if (newFarmId) {
                        loadFarmData(newFarmId);
                      } else {
                        setZones([]);
                        setFarmEmployees([]);
                      }
                    },
                  })}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white ${
                    errors.farmId
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                  }`}
                >
                  <option value="">-- Chọn trang trại tiếp nhận phân công --</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code}) {f.status !== 'ACTIVE' ? `[${f.status}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {errors.farmId && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.farmId.message}
                </p>
              )}
            </div>

            {/* 2. Chọn Phân khu (Chỉ hiện nếu là phân công Phân khu - Cascading bắt buộc Farm trước) */}
            {assignmentType === 'ZONE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn Phân khu sản xuất <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    {...register('zoneId', {
                      required: assignmentType === 'ZONE' ? 'Vui lòng chọn phân khu sản xuất' : false,
                      onChange: () => {
                        setValue('employeeId', '');
                        setValue('role', '');
                        clearErrors(['employeeId', 'role']);
                      },
                    })}
                    disabled={!watchedFarmId || isLoadingZones}
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white ${
                      errors.zoneId
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                        : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                    } ${!watchedFarmId || isLoadingZones ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                  >
                    {!watchedFarmId ? (
                      <option value="">-- Vui lòng chọn trang trại trước --</option>
                    ) : isLoadingZones ? (
                      <option value="">Đang tải danh sách phân khu...</option>
                    ) : zones.length === 0 ? (
                      <option value="">-- Trang trại này chưa có phân khu nào --</option>
                    ) : (
                      <>
                        <option value="">-- Chọn phân khu sản xuất --</option>
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name} ({z.code}) - Loại: {z.zoneType}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                {errors.zoneId && (
                  <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.zoneId.message}
                  </p>
                )}
              </div>
            )}

            {/* 3. Chọn Nhân viên (Ràng buộc Địa lý Farm-Bound Filtering & Vô hiệu hóa tuần tự) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn Nhân sự đảm nhiệm <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  {...register('employeeId', {
                    required: 'Vui lòng chọn nhân sự đảm nhiệm',
                    onChange: () => {
                      setValue('role', '');
                      clearErrors('role');
                    },
                  })}
                  disabled={isEmployeeDisabled}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white ${
                    errors.employeeId
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                  } ${isEmployeeDisabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                >
                  {assignmentType === 'ZONE' && !watchedFarmId ? (
                    <option value="">-- Vui lòng chọn Trang trại trước --</option>
                  ) : assignmentType === 'ZONE' && !watchedZoneId ? (
                    <option value="">-- Vui lòng chọn Phân khu trước --</option>
                  ) : !watchedFarmId ? (
                    <option value="">-- Vui lòng chọn Trang trại trước --</option>
                  ) : isLoadingEmployees ? (
                    <option value="">Đang tải danh sách nhân sự của trang trại...</option>
                  ) : eligibleEmployees.length === 0 ? (
                    <option value="">
                      {assignmentType === 'ZONE'
                        ? '-- Trang trại của phân khu này chưa có Kỹ sư / Công nhân nào --'
                        : '-- Trang trại này hiện chưa có nhân sự trực thuộc nào --'}
                    </option>
                  ) : (
                    <>
                      <option value="">-- Chọn nhân sự từ danh sách hồ sơ --</option>
                      {eligibleEmployees.map((emp) => {
                        const isOffice =
                          emp.position === 'ACCOUNTANT' ||
                          emp.position === 'HR' ||
                          emp.department === 'ACCOUNTING' ||
                          emp.department === 'HR_ADMIN';
                        return (
                          <option key={emp.id} value={emp.id}>
                            [{emp.employeeCode}] {emp.fullName} - Vị trí: {emp.position || 'Nhân viên'} (
                            {emp.department || 'Ban nông vụ'})
                            {isOffice ? ' ⚠️ [Khối văn phòng - Không thể phân công]' : ''}
                          </option>
                        );
                      })}
                    </>
                  )}
                </select>
              </div>

              {/* Ghi chú lọc theo địa lý và chuyên môn */}
              {targetFarmId && (
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  * Lọc địa lý: Chỉ hiển thị nhân sự thuộc biên chế của trang trại này ({eligibleEmployees.length} nhân sự phù hợp).
                  {assignmentType === 'ZONE' && ' Ẩn hoàn toàn Kế toán, HR và Thủ kho.'}
                </p>
              )}

              {errors.employeeId && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.employeeId.message}
                </p>
              )}
            </div>

            {/* 4. Chọn Vai trò phân công (Ràng buộc Nhân sự -> Vai trò: disabled={!watch('employeeId')}) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vai trò phân công {assignmentType === 'ZONE' ? 'tại Phân khu' : 'tại Trang trại'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('role', {
                  required: 'Vui lòng chọn vai trò phân công phù hợp',
                })}
                disabled={!watchedEmployeeId || availableRoleOptions.length === 0}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white ${
                  errors.role
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                    : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                } ${
                  !watchedEmployeeId || availableRoleOptions.length === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : ''
                }`}
              >
                {!watchedEmployeeId ? (
                  <option value="">-- Vui lòng chọn Nhân sự trước --</option>
                ) : availableRoleOptions.length === 0 ? (
                  <option value="">
                    {isOfficeRole
                      ? '-- Vị trí văn phòng (Kế toán/HR) không có vai trò hiện trường --'
                      : '-- Vị trí nhân sự này không có vai trò khả dụng --'}
                  </option>
                ) : (
                  <>
                    <option value="">-- Chọn vai trò phân công phù hợp --</option>
                    {availableRoleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </>
                )}
              </select>

              {/* Thông tin ma trận lọc tự động */}
              {watchedEmployeeId && selectedEmployee && !isOfficeRole && (
                <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1.5 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Chức danh: <strong>{selectedEmployee.position}</strong> — Tùy chọn vai trò đã
                    được lọc tự động theo Ma trận Nghiệp vụ.
                  </span>
                </p>
              )}

              {watchedRole === 'FARM_MANAGER' && (
                <p className="text-[11px] text-amber-700 mt-1">
                  * Khi chọn vai trò FARM_MANAGER, hệ thống sẽ tự động cập nhật người quản lý chính của Trang trại.
                </p>
              )}

              {errors.role && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.role.message}
                </p>
              )}
            </div>

            {/* 5. Khoảng thời gian phân công */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày bắt đầu hiệu lực <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    {...register('assignedFrom', {
                      required: 'Vui lòng chọn ngày bắt đầu hiệu lực',
                    })}
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      errors.assignedFrom
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                        : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {errors.assignedFrom && (
                  <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.assignedFrom.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày kết thúc (Tùy chọn)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    {...register('assignedTo')}
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      errors.assignedTo
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                        : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {errors.assignedTo && (
                  <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.assignedTo.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>

            <Can permission="PERM_HR_EMPLOYEE_MANAGE" role="ROLE_FARM_OWNER">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitDisabled}
                className={`gap-2 ${
                  isOfficeRole
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-not-allowed opacity-90'
                    : isSubmitDisabled
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                }`}
              >
                <Save className="w-4 h-4" />
                {isOfficeRole
                  ? 'Đã khóa: Vi phạm vai trò (Kế toán/HR)'
                  : !watchedFarmId
                  ? 'Chưa chọn trang trại'
                  : assignmentType === 'ZONE' && !watchedZoneId
                  ? 'Chưa chọn phân khu'
                  : !watchedEmployeeId
                  ? 'Chưa chọn nhân sự'
                  : !watchedRole
                  ? 'Chưa chọn vai trò'
                  : 'Xác nhận phân công'}
              </Button>
            </Can>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentFormModal;
