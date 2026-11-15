import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Save,
  AlertCircle,
  Users,
  Clock,
  Calendar,
  Package,
  ArrowRight,
  Check,
  Sparkles,
  Layers,
  RefreshCw,
  Wheat,
  Sliders,
  Coins,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { geographyService } from '@/services/modules/geographyService';
import { masterDataService } from '@/services/modules/masterDataService';
import { inventoryService } from '@/services/modules/inventoryService';
import { farmingService } from '@/services/modules/farmingService';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { isShiftCoveringTask } from '@/utils/formatters';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';

const TASK_TYPES = [
  { value: 'FEEDING', label: 'Cho ăn / Chăm sóc đàn (FEEDING)' },
  { value: 'PLANTING', label: 'Tưới nước & Chăm sóc cây (PLANTING)' },
  { value: 'FERTILIZING', label: 'Bón phân & Dinh dưỡng (FERTILIZING)' },
  { value: 'SANITATION', label: 'Dọn cỏ / Quét rác / Vệ sinh chuồng kho (SANITATION)' },
  { value: 'MAINTENANCE', label: 'Bảo trì máy móc / Kho bãi (MAINTENANCE)' },
  { value: 'HARVESTING', label: 'Thu hoạch định kỳ (HARVESTING)' },
];

const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Thấp (LOW)' },
  { value: 'MEDIUM', label: 'Bình thường (MEDIUM)' },
  { value: 'HIGH', label: 'Ưu tiên cao (HIGH)' },
  { value: 'URGENT', label: 'Khẩn cấp (URGENT)' },
];

const DAYS_OF_WEEK = [
  { key: 'MON', label: 'T2', name: 'Thứ 2' },
  { key: 'TUE', label: 'T3', name: 'Thứ 3' },
  { key: 'WED', label: 'T4', name: 'Thứ 4' },
  { key: 'THU', label: 'T5', name: 'Thứ 5' },
  { key: 'FRI', label: 'T6', name: 'Thứ 6' },
  { key: 'SAT', label: 'T7', name: 'Thứ 7' },
  { key: 'SUN', label: 'CN', name: 'Chủ Nhật' },
];

// Helper chuẩn hóa tiếng Việt để so khớp chính xác Lô đất với Vụ Mùa / Đàn Nuôi
const normalizeText = (text) => {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const doesLocationMatchCropSeason = (loc, season) => {
  if (!loc || !season) return true;
  if (season.locationId != null) {
    return Number(season.locationId) === Number(loc.id);
  }

  const locNorm = ` ${normalizeText(loc.name + ' ' + (loc.code || ''))} `;
  const seasonNorm = ` ${normalizeText((season.cropTypeName || '') + ' ' + (season.seasonCode || ''))} `;

  const keywordGroups = [
    ['sau rieng', 'ri6'],
    ['sau rieng', 'musang'],
    ['sau rieng'],
    ['buoi da xanh'],
    ['buoi'],
    ['dua luoi'],
    ['dau tay'],
    ['ca chua'],
    ['xa lach'],
    ['bap ngo', ' ngo '],
    ['co voi', 'pakchong'],
  ];

  for (const group of keywordGroups) {
    const locHas = group.every((kw) => locNorm.includes(kw.trim()));
    const seasonHas = group.every((kw) => seasonNorm.includes(kw.trim()));
    if (locHas && seasonHas) return true;
  }
  return false;
};

const doesLocationMatchLivestockGroup = (loc, group) => {
  if (!loc || !group) return true;
  if (group.locationId != null) {
    return Number(group.locationId) === Number(loc.id);
  }

  const locNorm = ` ${normalizeText(loc.name + ' ' + (loc.code || ''))} `;
  const groupNorm = ` ${normalizeText((group.breedName || '') + ' ' + (group.groupCode || '') + ' ' + (group.species || ''))} `;

  const pairs = [
    { locKws: [' bo ', 'beo b1', 'chuong bo'], groupKws: [' bo ', 'bbb', 'cattle'] },
    { locKws: [' de ', 'boer', 'chuong de', 'de d1'], groupKws: [' de ', 'goat', 'boer'] },
    { locKws: [' ga ', 'tha', 'san chan tha', 'tan cay', 'vuon'], groupKws: [' ga ', 'poultry', 'luong phuong', 'tha vuon'] },
    { locKws: [' vit '], groupKws: [' vit ', 'pekin', 'duck'] },
    { locKws: [' heo ', ' lon '], groupKws: [' heo ', ' lon ', 'swine'] },
  ];

  for (const p of pairs) {
    const locMatch = p.locKws.some((k) => locNorm.includes(k));
    const groupMatch = p.groupKws.some((k) => groupNorm.includes(k));
    if (locMatch && groupMatch) return true;
  }
  return false;
};

export function RoutineTaskModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  zones = [],
  employees = [],
  assignments = [],
  initialData = null,
}) {
  const { activeFarmType, farms } = useActiveFarmStore();
  const { userInfo, isOwner, isFarmManager, getManagedZoneIds } = useAuthStore();
  const currentFarmType =
    (farmId ? farms.find((f) => Number(f.id || f.farmId) === Number(farmId))?.farmType : null) ||
    activeFarmType ||
    'MIXED';

  // Phân quyền
  const isManagerOrOwner = isOwner() || isFarmManager(farmId);
  const rawManagedZoneIds = getManagedZoneIds ? getManagedZoneIds(farmId) : null;
  const userAssignments = (assignments || []).filter(
    (a) =>
      a.isActive !== false &&
      Number(a.userId) === Number(userInfo?.id) &&
      ['ZONE_MANAGER', 'TECHNICAL_LEAD'].includes(a.roleInFarm) &&
      a.zoneId
  );
  const extraZoneIds = userAssignments.map((a) => Number(a.zoneId));
  const managedZoneIds = isManagerOrOwner
    ? null
    : Array.from(new Set([...(rawManagedZoneIds || []), ...extraZoneIds]));
  const isZoneRestricted = managedZoneIds !== null;

  const availableZones = React.useMemo(() => {
    if (!isZoneRestricted) return zones;
    return zones.filter((z) => managedZoneIds.includes(Number(z.id)));
  }, [zones, isZoneRestricted, managedZoneIds]);

  const availableTaskTypes = React.useMemo(() => {
    if (currentFarmType === 'CROP') {
      return TASK_TYPES.filter((t) => t.value !== 'FEEDING');
    }
    if (currentFarmType === 'LIVESTOCK') {
      return TASK_TYPES.filter((t) => t.value !== 'PLANTING' && t.value !== 'FERTILIZING');
    }
    return TASK_TYPES;
  }, [currentFarmType]);

  const defaultTaskType = currentFarmType === 'CROP' ? 'PLANTING' : 'FEEDING';

  // State danh mục bên ngoài
  const [workShifts, setWorkShifts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [cropSeasons, setCropSeasons] = useState([]);
  const [livestockGroups, setLivestockGroups] = useState([]);
  const [operationalCycles, setOperationalCycles] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [shiftAssignments, setShiftAssignments] = useState([]);
  const [filterByShift, setFilterByShift] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    titleText: '',
    taskType: defaultTaskType,
    priority: 'MEDIUM',
    zoneId: '',
    locationId: '',
    shiftId: '',
    startTime: '',
    endTime: '',
    recurrenceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    assignmentMode: 'DYNAMIC_BY_SHIFT', // 'DYNAMIC_BY_SHIFT' | 'FIXED'
    hasMaterial: false,
    warehouseId: '',
    materialId: '',
    standardQuantity: '',
    operationalCycleId: '',
    cropSeasonId: '',
    livestockGroupId: '',
    completionNotes: '',
    selectedEmployeeIds: [],
    leaderEmployeeId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [filterBySelectedZone, setFilterBySelectedZone] = useState(true);
  const [zoneLocations, setZoneLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Tải danh mục hỗ trợ khi mở Modal
  useEffect(() => {
    if (!isOpen || !farmId) return;

    // 1. Ca làm việc
    hrService.getWorkShifts()
      .then((data) => setWorkShifts(Array.isArray(data) ? data : []))
      .catch((err) => console.warn('Lỗi tải danh mục ca làm việc:', err));

    // 2. Kho hàng
    inventoryService.getWarehouses(farmId)
      .then((data) => setWarehouses(Array.isArray(data) ? data : []))
      .catch((err) => console.warn('Lỗi tải danh mục kho:', err));

    // 3. Vật tư master data
    masterDataService.getMaterials()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.content || []);
        setMaterials(list);
      })
      .catch((err) => console.warn('Lỗi tải danh mục vật tư:', err));

    // 4. Vụ mùa cây trồng
    farmingService.getCropSeasons(farmId)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.content || []);
        setCropSeasons(list.filter((s) => s.status !== 'CLOSED' && s.status !== 'CANCELLED'));
      })
      .catch((err) => console.warn('Lỗi tải danh mục vụ mùa:', err));

    // 5. Đàn vật nuôi
    farmingService.getLivestockGroups(farmId)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.content || []);
        setLivestockGroups(list.filter((g) => g.status !== 'SOLD' && g.status !== 'CLOSED' && g.status !== 'CULLED'));
      })
      .catch((err) => console.warn('Lỗi tải danh mục đàn vật nuôi:', err));

    // 6. Niên vụ sản xuất (Operational Cycles)
    geographyService.getCycles(farmId)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.content || []);
        setOperationalCycles(list);
      })
      .catch((err) => console.warn('Lỗi tải danh mục niên vụ:', err));

    // 7. Lịch trực phân ca của nhân sự hôm nay
    const todayStr = new Date().toISOString().split('T')[0];
    hrService.getShiftAssignments({ farmId, workDate: todayStr })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.content || []);
        setShiftAssignments(list);
      })
      .catch((err) => console.warn('Lỗi tải danh mục phân ca hôm nay:', err));
  }, [isOpen, farmId]);

  // Helper kiểm tra nhân viên theo phân khu
  const isEmployeeInZone = React.useCallback(
    (emp, targetZoneId) => {
      if (!targetZoneId) return true;
      const tid = Number(targetZoneId);

      if (emp.assignedZoneId && Number(emp.assignedZoneId) === tid) return true;
      if (emp.zoneId && Number(emp.zoneId) === tid) return true;

      if (assignments && assignments.length > 0) {
        const hasZoneAssign = assignments.some((a) => {
          if (a.isActive === false || Number(a.zoneId) !== tid) return false;
          return (
            (a.employeeId && Number(a.employeeId) === Number(emp.id)) ||
            (emp.userId && a.userId && Number(a.userId) === Number(emp.userId)) ||
            (emp.employeeCode && a.employeeCode === emp.employeeCode)
          );
        });
        if (hasZoneAssign) return true;
      }

      const targetZoneObj = zones.find((z) => Number(z.id) === tid);
      if (targetZoneObj && emp.department) {
        const dept = emp.department.trim().toLowerCase();
        const zName = targetZoneObj.name.trim().toLowerCase();
        if (dept.includes(zName) || zName.includes(dept)) return true;
      }

      if (userInfo?.id && emp.userId && Number(emp.userId) === Number(userInfo.id)) {
        return true;
      }

      return false;
    },
    [assignments, zones, userInfo?.id]
  );

  const assignableEmployees = React.useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
    const effectiveZoneId = formData.zoneId;

    let baseList = activeEmployees;
    if (isZoneRestricted) {
      if (!effectiveZoneId) return [];
      baseList = activeEmployees.filter((emp) => isEmployeeInZone(emp, effectiveZoneId));
    } else if (filterBySelectedZone && effectiveZoneId) {
      baseList = activeEmployees.filter((emp) => isEmployeeInZone(emp, effectiveZoneId));
    }

    // Gắn thông tin ca làm việc hôm nay cho từng nhân sự & So khớp khung giờ
    const enriched = baseList.map((emp) => {
      const sa = shiftAssignments.find(
        (a) => Number(a.employeeId) === Number(emp.id) && a.status !== 'CANCELLED'
      );

      let isTimeMatch = false;
      if (formData.startTime && formData.endTime && sa?.startTime && sa?.endTime) {
        // Cải tiến 1: Khung giờ ca trực của nhân viên phải bao trọn khung giờ của task
        isTimeMatch = isShiftCoveringTask(sa.startTime, sa.endTime, formData.startTime, formData.endTime);
      } else if (formData.shiftId && sa && String(sa.shiftId) === String(formData.shiftId)) {
        isTimeMatch = true;
      }

      const isShiftMatch = Boolean(
        formData.shiftId && sa && String(sa.shiftId) === String(formData.shiftId)
      );

      return {
        ...emp,
        shiftAssignment: sa,
        isShiftMatch,
        isTimeMatch,
      };
    });

    // Sắp xếp: Ưu tiên người đúng khung giờ / ca trực lên đầu
    enriched.sort((a, b) => {
      const aScore = (a.isTimeMatch ? 2 : 0) + (a.isShiftMatch ? 1 : 0);
      const bScore = (b.isTimeMatch ? 2 : 0) + (b.isShiftMatch ? 1 : 0);
      return bScore - aScore;
    });

    // Nếu người dùng bật bộ lọc theo ca và đã có cấu hình ca / giờ
    if (filterByShift) {
      if (formData.startTime && formData.endTime) {
        const timeMatchedList = enriched.filter((e) => e.isTimeMatch);
        if (timeMatchedList.length > 0) return timeMatchedList;
      } else if (formData.shiftId) {
        const matchedList = enriched.filter((e) => e.isShiftMatch);
        if (matchedList.length > 0) return matchedList;
      }
    }

    return enriched;
  }, [employees, formData.zoneId, formData.shiftId, formData.startTime, formData.endTime, isZoneRestricted, filterBySelectedZone, filterByShift, isEmployeeInZone, shiftAssignments]);

  // Tải danh sách lô
  useEffect(() => {
    if (!farmId || !formData.zoneId) {
      setZoneLocations([]);
      return;
    }
    let isMounted = true;
    setIsLoadingLocations(true);
    geographyService.getLocations(farmId, formData.zoneId)
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : (res?.content || []);
        setZoneLocations(list);
      })
      .catch((err) => {
        console.warn('Lỗi khi tải danh sách lô của phân khu:', err);
        if (isMounted) setZoneLocations([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLocations(false);
      });
    return () => { isMounted = false; };
  }, [farmId, formData.zoneId]);

  // Tải danh sách vật tư đã nhập và còn tồn trong kho đã chọn
  useEffect(() => {
    if (!isOpen || !farmId || !formData.warehouseId) {
      setWarehouseStock([]);
      return;
    }
    let isMounted = true;
    setIsLoadingStock(true);
    inventoryService
      .getInventory({
        farmId,
        warehouseId: Number(formData.warehouseId),
        size: 300,
      })
      .then((res) => {
        if (!isMounted) return;
        const list = res?.content || (Array.isArray(res) ? res : []);
        // Gom nhóm theo materialId để tính tổng tồn khả dụng trong kho này
        const map = new Map();
        list.forEach((it) => {
          const mid = Number(it.materialId);
          const qty = Number(it.availableQuantity ?? it.quantityOnHand ?? 0);
          if (!map.has(mid)) {
            map.set(mid, {
              materialId: mid,
              materialName: it.materialName,
              skuCode: it.skuCode,
              standardUnit: it.standardUnit,
              totalStock: qty,
            });
          } else {
            map.get(mid).totalStock += qty;
          }
        });
        const stockList = Array.from(map.values()).filter((item) => item.totalStock > 0);
        setWarehouseStock(stockList);
      })
      .catch((err) => {
        console.warn('Lỗi khi tải tồn kho của kho đã chọn:', err);
        if (isMounted) setWarehouseStock([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingStock(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, farmId, formData.warehouseId]);

  // Khởi tạo form khi mở Modal
  useEffect(() => {
    if (isOpen) {
      let defaultZone = '';
      if (isZoneRestricted) {
        if (availableZones.length > 0) defaultZone = String(availableZones[0].id);
      } else {
        defaultZone = zones[0]?.id ? String(zones[0].id) : '';
      }

      const activeCycle = operationalCycles.find((c) => c.status === 'ACTIVE') || operationalCycles[0];
      const defaultCycleId = activeCycle ? String(activeCycle.id) : '';

      if (initialData) {
        const rawTitle = initialData.taskTitle || '';
        const cleanTitle = rawTitle.replace(/^\[CỐ ĐỊNH HÀNG NGÀY\]\s*/i, '');
        const currentAssigneeIds = (initialData.assignees || []).map((a) => a.employeeId);
        const leader = (initialData.assignees || []).find((a) => a.roleInTask === 'LEADER');
        const taskZoneId = initialData.zoneId ? String(initialData.zoneId) : defaultZone;
        const validZoneId = isZoneRestricted && !availableZones.some((z) => String(z.id) === taskZoneId) ? defaultZone : taskZoneId;

        const initialZoneStaff = employees.filter((e) => e.status === 'ACTIVE' && isEmployeeInZone(e, validZoneId));

        let recDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        if (initialData.recurrenceDays && initialData.recurrenceDays !== 'ALL') {
          recDays = initialData.recurrenceDays.split(',').map((s) => s.trim().toUpperCase());
        }

        let initCycleId = '';
        if (initialData.cropSeasonId) {
          const matchSeason = cropSeasons.find((s) => String(s.id) === String(initialData.cropSeasonId));
          if (matchSeason?.operationalCycleId) initCycleId = String(matchSeason.operationalCycleId);
        } else if (initialData.livestockGroupId) {
          const matchGroup = livestockGroups.find((g) => String(g.id) === String(initialData.livestockGroupId));
          if (matchGroup?.operationalCycleId) initCycleId = String(matchGroup.operationalCycleId);
        }
        if (!initCycleId) initCycleId = defaultCycleId;

        setFormData({
          titleText: cleanTitle,
          taskType: initialData.taskType || defaultTaskType,
          priority: initialData.priority || 'MEDIUM',
          zoneId: validZoneId,
          locationId: initialData.locationId ? String(initialData.locationId) : '',
          shiftId: initialData.shiftId ? String(initialData.shiftId) : '',
          startTime: initialData.startTime ? (typeof initialData.startTime === 'string' ? initialData.startTime.substring(0, 5) : initialData.startTime) : '',
          endTime: initialData.endTime ? (typeof initialData.endTime === 'string' ? initialData.endTime.substring(0, 5) : initialData.endTime) : '',
          recurrenceDays: recDays,
          assignmentMode: initialData.assignmentMode || 'DYNAMIC_BY_SHIFT',
          hasMaterial: Boolean(initialData.materialId && initialData.warehouseId),
          warehouseId: initialData.warehouseId ? String(initialData.warehouseId) : '',
          materialId: initialData.materialId ? String(initialData.materialId) : '',
          standardQuantity: initialData.standardQuantity ? String(initialData.standardQuantity) : '',
          operationalCycleId: initCycleId,
          cropSeasonId: initialData.cropSeasonId ? String(initialData.cropSeasonId) : '',
          livestockGroupId: initialData.livestockGroupId ? String(initialData.livestockGroupId) : '',
          completionNotes: initialData.completionNotes || '',
          selectedEmployeeIds: currentAssigneeIds.length > 0 ? currentAssigneeIds : (initialZoneStaff[0]?.id ? [initialZoneStaff[0].id] : []),
          leaderEmployeeId: leader?.employeeId
            ? String(leader.employeeId)
            : (currentAssigneeIds[0] ? String(currentAssigneeIds[0]) : (initialZoneStaff[0]?.id ? String(initialZoneStaff[0].id) : '')),
        });
      } else {
        const initialZoneStaff = employees.filter((e) => e.status === 'ACTIVE' && isEmployeeInZone(e, defaultZone));

        setFormData({
          titleText: '',
          taskType: defaultTaskType,
          priority: 'MEDIUM',
          zoneId: defaultZone,
          locationId: '',
          shiftId: workShifts[0]?.id ? String(workShifts[0].id) : '',
          startTime: '',
          endTime: '',
          recurrenceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          assignmentMode: 'DYNAMIC_BY_SHIFT',
          hasMaterial: false,
          warehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
          materialId: '',
          standardQuantity: '',
          operationalCycleId: defaultCycleId,
          cropSeasonId: '',
          livestockGroupId: '',
          completionNotes: '',
          selectedEmployeeIds: initialZoneStaff[0]?.id ? [initialZoneStaff[0].id] : [],
          leaderEmployeeId: initialZoneStaff[0]?.id ? String(initialZoneStaff[0].id) : '',
        });
      }

      setErrors({});
      if (isZoneRestricted && availableZones.length === 0) {
        setGeneralError('Bạn chưa được phân công phụ trách phân khu nào tại trang trại này để thiết lập việc cố định.');
      } else {
        setGeneralError(null);
      }
    }
  }, [isOpen, initialData, zones, availableZones, employees, defaultTaskType, isZoneRestricted, isEmployeeInZone, workShifts, warehouses, operationalCycles, cropSeasons, livestockGroups]);

  // Tự động gán Niên vụ đang Hoạt Động (ACTIVE) nếu chưa được chọn sau khi API trả về
  useEffect(() => {
    if (!formData.operationalCycleId && operationalCycles.length > 0) {
      const activeCycle = operationalCycles.find((c) => c.status === 'ACTIVE') || operationalCycles[0];
      if (activeCycle) {
        setFormData((prev) => ({ ...prev, operationalCycleId: String(activeCycle.id) }));
      }
    }
  }, [operationalCycles, formData.operationalCycleId]);

  // Xử lý đổi phân khu
  const handleZoneChange = (newZoneId) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        zoneId: newZoneId,
        locationId: '',
        cropSeasonId: '',
        livestockGroupId: '',
      };
      if (isZoneRestricted) {
        const validStaff = employees.filter((e) => e.status === 'ACTIVE' && isEmployeeInZone(e, newZoneId));
        const retainedIds = prev.selectedEmployeeIds.filter((id) => validStaff.some((s) => s.id === id));
        updated.selectedEmployeeIds = retainedIds.length > 0 ? retainedIds : (validStaff[0]?.id ? [validStaff[0].id] : []);
        updated.leaderEmployeeId = updated.selectedEmployeeIds.length > 0 ? String(updated.selectedEmployeeIds[0]) : '';
      }
      return updated;
    });
  };

  // Xử lý đổi Lô đất / Vị trí cụ thể (tự động lọc và đồng bộ mùa vụ / đàn vật nuôi tương ứng)
  const handleLocationChange = (newLocationId) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        locationId: newLocationId,
        cropSeasonId: '',
        livestockGroupId: '',
      };

      if (newLocationId) {
        const locObj = zoneLocations.find((l) => String(l.id) === String(newLocationId));
        if (locObj) {
          // 1. Kiểm tra Vụ mùa cây trồng tương ứng với lô này
          const matchedSeasons = cropSeasons.filter((s) => {
            const matchZone = prev.zoneId ? Number(s.zoneId) === Number(prev.zoneId) : true;
            const matchCycle = prev.operationalCycleId ? Number(s.operationalCycleId) === Number(prev.operationalCycleId) : true;
            return matchZone && matchCycle && doesLocationMatchCropSeason(locObj, s);
          });
          if (matchedSeasons.length === 1) {
            updated.cropSeasonId = String(matchedSeasons[0].id);
            updated.livestockGroupId = '';
          }

          // 2. Kiểm tra Đàn vật nuôi tương ứng với ô chuồng này
          const matchedGroups = livestockGroups.filter((g) => {
            const matchZone = prev.zoneId ? Number(g.zoneId) === Number(prev.zoneId) : true;
            const matchCycle = prev.operationalCycleId ? Number(g.operationalCycleId) === Number(prev.operationalCycleId) : true;
            return matchZone && matchCycle && doesLocationMatchLivestockGroup(locObj, g);
          });
          if (matchedGroups.length === 1) {
            updated.livestockGroupId = String(matchedGroups[0].id);
            updated.cropSeasonId = '';
          }
        }
      }
      return updated;
    });
  };

  // Xử lý đổi kho xuất vật tư (tự động reset vật tư đã chọn)
  const handleWarehouseChange = (whId) => {
    setFormData((prev) => ({
      ...prev,
      warehouseId: whId,
      materialId: '',
      standardQuantity: '',
    }));
  };

  const handleToggleDay = (dayKey) => {
    setFormData((prev) => {
      const exists = prev.recurrenceDays.includes(dayKey);
      let updated;
      if (exists) {
        updated = prev.recurrenceDays.filter((d) => d !== dayKey);
      } else {
        updated = [...prev.recurrenceDays, dayKey];
      }
      return { ...prev, recurrenceDays: updated };
    });
  };

  const handleSetQuickDays = (mode) => {
    if (mode === 'ALL') {
      setFormData((prev) => ({ ...prev, recurrenceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] }));
    } else if (mode === 'WEEKDAYS') {
      setFormData((prev) => ({ ...prev, recurrenceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }));
    } else if (mode === 'WEEKEND') {
      setFormData((prev) => ({ ...prev, recurrenceDays: ['SAT', 'SUN'] }));
    }
  };

  const handleToggleEmployee = (empId) => {
    setFormData((prev) => {
      const exists = prev.selectedEmployeeIds.includes(empId);
      let updated;
      if (exists) {
        updated = prev.selectedEmployeeIds.filter((id) => id !== empId);
      } else {
        updated = [...prev.selectedEmployeeIds, empId];
      }

      let leader = prev.leaderEmployeeId;
      if (exists && String(empId) === prev.leaderEmployeeId) {
        leader = updated.length > 0 ? String(updated[0]) : '';
      } else if (!prev.leaderEmployeeId && updated.length > 0) {
        leader = String(updated[0]);
      }

      return {
        ...prev,
        selectedEmployeeIds: updated,
        leaderEmployeeId: leader,
      };
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.titleText?.trim()) {
      errs.titleText = 'Tiêu đề công việc không được để trống';
    }
    if (isZoneRestricted && !formData.zoneId) {
      errs.zoneId = 'Bắt buộc chọn phân khu phụ trách';
    }
    if (formData.recurrenceDays.length === 0) {
      errs.recurrenceDays = 'Cần chọn ít nhất 1 ngày lặp lại trong tuần';
    }
    if (formData.assignmentMode === 'FIXED' && formData.selectedEmployeeIds.length === 0) {
      errs.assignees = 'Cần phân công ít nhất 1 nhân viên thực hiện việc cố định này';
    }
    if (formData.hasMaterial) {
      if (!formData.warehouseId) {
        errs.warehouseId = 'Vui lòng chọn kho xuất vật tư';
      }
      if (!formData.materialId) {
        errs.materialId = 'Vui lòng chọn vật tư xuất kho';
      }
      if (!formData.standardQuantity || Number(formData.standardQuantity) <= 0) {
        errs.standardQuantity = 'Định mức tiêu hao phải lớn hơn 0';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!farmId) {
      setGeneralError('Vui lòng chọn trang trại');
      return;
    }

    try {
      setIsSubmitting(true);
      setGeneralError(null);

      const fullTitle = `[CỐ ĐỊNH HÀNG NGÀY] ${formData.titleText.trim()}`;
      const assigneesPayload = formData.selectedEmployeeIds.map((empId) => ({
        employeeId: empId,
        roleInTask: String(empId) === String(formData.leaderEmployeeId) ? 'LEADER' : 'MEMBER',
      }));

      // Deadline theo khung giờ cụ thể hoặc theo ca làm việc (nếu có)
      const today = new Date();
      let deadlineDate = new Date();
      deadlineDate.setHours(18, 0, 0, 0);

      if (formData.endTime) {
        const [h, m] = formData.endTime.split(':').map(Number);
        deadlineDate.setHours(h || 18, m || 0, 0, 0);
      } else if (formData.shiftId) {
        const selectedShift = workShifts.find((s) => String(s.id) === String(formData.shiftId));
        if (selectedShift && selectedShift.endTime) {
          const [h, m] = selectedShift.endTime.split(':').map(Number);
          deadlineDate.setHours(h || 18, m || 0, 0, 0);
          if (selectedShift.isOvernight) {
            deadlineDate.setDate(deadlineDate.getDate() + 1);
          }
        }
      }

      const recStr = formData.recurrenceDays.length === 7 ? 'ALL' : formData.recurrenceDays.join(',');

      const payload = {
        zoneId: formData.zoneId ? Number(formData.zoneId) : null,
        locationId: formData.locationId ? Number(formData.locationId) : null,
        taskTitle: fullTitle,
        taskType: formData.taskType,
        priority: formData.priority,
        shiftId: formData.shiftId ? Number(formData.shiftId) : null,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        recurrenceDays: recStr,
        assignmentMode: formData.assignmentMode,
        warehouseId: formData.hasMaterial && formData.warehouseId ? Number(formData.warehouseId) : null,
        materialId: formData.hasMaterial && formData.materialId ? Number(formData.materialId) : null,
        standardQuantity: formData.hasMaterial && formData.standardQuantity ? Number(formData.standardQuantity) : null,
        cropSeasonId: formData.cropSeasonId ? Number(formData.cropSeasonId) : null,
        livestockGroupId: formData.livestockGroupId ? Number(formData.livestockGroupId) : null,
        deadline: deadlineDate.toISOString(),
        completionNotes: formData.completionNotes?.trim() || null,
        assignedToEmployeeId: formData.leaderEmployeeId ? Number(formData.leaderEmployeeId) : null,
        assignees: assigneesPayload,
      };

      if (initialData?.id) {
        await hrService.updateTask(farmId, initialData.id, payload);
      } else {
        await hrService.createTask(farmId, payload);
      }

      onSuccess?.();
    } catch (err) {
      console.error('Save routine task error:', err);
      const msg = applyServerFieldErrors(err, setErrors);
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(initialData?.id);

  const selectedZoneObj = zones.find((z) => Number(z.id) === Number(formData.zoneId));
  const selectedLocationObj = zoneLocations.find((l) => String(l.id) === String(formData.locationId));

  // Phân loại phân khu: Trồng trọt (CROP), Chăn nuôi (LIVESTOCK), hay Chung/Kho bãi (GENERAL)
  const zoneCategory = React.useMemo(() => {
    if (!formData.zoneId) return 'GENERAL';
    const z = zones.find((item) => Number(item.id) === Number(formData.zoneId));
    if (!z) return 'GENERAL';
    if (z.zoneType === 'BARN') return 'LIVESTOCK';
    if (z.zoneType === 'OPEN_FIELD' || z.zoneType === 'GREENHOUSE') return 'CROP';
    if (z.zoneType === 'STORAGE' || z.zoneType === 'ISOLATION') return 'GENERAL';
    // Fallback theo dữ liệu thực tế tại phân khu
    const hasCrop = cropSeasons.some((s) => Number(s.zoneId) === Number(formData.zoneId));
    const hasLivestock = livestockGroups.some((g) => Number(g.zoneId) === Number(formData.zoneId));
    if (hasCrop && !hasLivestock) return 'CROP';
    if (hasLivestock && !hasCrop) return 'LIVESTOCK';
    if (hasCrop && hasLivestock) return 'MIXED';
    return 'GENERAL';
  }, [formData.zoneId, zones, cropSeasons, livestockGroups]);

  // Lọc Vụ mùa theo Phân khu đang chọn, Niên vụ đang chọn, VÀ Lô đất cụ thể (nếu có)
  const filteredCropSeasons = React.useMemo(() => {
    const list = cropSeasons.filter((s) => {
      const matchZone = formData.zoneId ? Number(s.zoneId) === Number(formData.zoneId) : true;
      const matchCycle = formData.operationalCycleId ? Number(s.operationalCycleId) === Number(formData.operationalCycleId) : true;
      return matchZone && matchCycle;
    });

    if (selectedLocationObj) {
      // Khi đã chọn lô đất cụ thể, chỉ hiển thị đúng vụ mùa tại lô đó (nếu chưa có thì trả về mảng rỗng)
      return list.filter((s) => doesLocationMatchCropSeason(selectedLocationObj, s));
    }
    return list;
  }, [cropSeasons, formData.zoneId, formData.operationalCycleId, selectedLocationObj]);

  // Lọc Đàn vật nuôi theo Phân khu đang chọn, Niên vụ đang chọn, VÀ Ô chuồng cụ thể (nếu có)
  const filteredLivestockGroups = React.useMemo(() => {
    const list = livestockGroups.filter((g) => {
      const matchZone = formData.zoneId ? Number(g.zoneId) === Number(formData.zoneId) : true;
      const matchCycle = formData.operationalCycleId ? Number(g.operationalCycleId) === Number(formData.operationalCycleId) : true;
      return matchZone && matchCycle;
    });

    if (selectedLocationObj) {
      // Khi đã chọn ô chuồng cụ thể, chỉ hiển thị đúng đàn nuôi tại chuồng đó (nếu chưa có thì trả về mảng rỗng)
      return list.filter((g) => doesLocationMatchLivestockGroup(selectedLocationObj, g));
    }
    return list;
  }, [livestockGroups, formData.zoneId, formData.operationalCycleId, selectedLocationObj]);

  // Lấy đơn vị và thông tin của vật tư đang chọn (ưu tiên từ tồn kho thực tế hoặc master data)
  const selectedMaterialObj =
    warehouseStock.find((m) => String(m.materialId) === String(formData.materialId)) ||
    materials.find((m) => String(m.id) === String(formData.materialId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={isEditing ? 'Chỉnh Sửa Việc Cố Định Hàng Ngày' : 'Thiết Lập Công Việc Cố Định Hàng Ngày'}
      subtitle="Tự động phân ca, sinh việc hàng ngày & liên kết trừ kho, hạch toán chi phí"
      icon={<RotateCcw className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {generalError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Tiền tố cố định */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
          <span className="font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px]">
            [CỐ ĐỊNH HÀNG NGÀY]
          </span>
          <span>Tiêu đề công việc sẽ tự động gắn tiền tố cố định để phân biệt với việc phát sinh ngoài kế hoạch.</span>
        </div>

        {/* 1. THÔNG TIN CƠ BẢN */}
        <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>1. Thông Tin Công Việc & Vị Trí Thực Hiện</span>
          </div>

          <FormField label="Tên Công Việc Lặp Lại" required error={errors.titleText}>
            <Input
              value={formData.titleText}
              onChange={(e) => setFormData({ ...formData, titleText: e.target.value })}
              placeholder="VD: Cho bò BBB & gà ri ăn cữ sáng, Vận hành tưới vườn sầu riêng Ri6..."
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FormField label="Loại Công Việc" required>
              <Select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                options={availableTaskTypes}
              />
            </FormField>

            <FormField label="Mức Độ Ưu Tiên" required>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={TASK_PRIORITIES}
              />
            </FormField>

            <FormField
              label={isZoneRestricted ? 'Phân Khu Phụ Trách *' : 'Khu Vực Áp Dụng (Zone)'}
              error={errors.zoneId}
            >
              <Select
                value={formData.zoneId}
                onChange={(e) => handleZoneChange(e.target.value)}
                placeholder={isZoneRestricted ? '-- Chọn phân khu phụ trách --' : '-- Toàn trang trại --'}
              >
                {!isZoneRestricted && <option value="">-- Toàn trang trại --</option>}
                {availableZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Lô Đất / Vị Trí Cụ Thể"
              hint={
                !formData.zoneId
                  ? 'Chọn phân khu trước'
                  : isLoadingLocations
                  ? 'Đang tải...'
                  : zoneLocations.length > 0
                  ? `${zoneLocations.length} lô/ô`
                  : 'Chưa chia lô'
              }
            >
              <Select
                value={formData.locationId}
                onChange={(e) => handleLocationChange(e.target.value)}
                disabled={!formData.zoneId || zoneLocations.length === 0}
              >
                <option value="">-- Toàn bộ phân khu --</option>
                {zoneLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>

        {/* 2. THỜI GIAN & CA LÀM VIỆC */}
        <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="font-bold text-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>2. Ca Làm Việc & Tần Suất Lặp Lại</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetQuickDays('ALL')}
                className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
              >
                Cả tuần
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDays('WEEKDAYS')}
                className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
              >
                Thứ 2 - Thứ 6
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Thuộc Ca Làm Việc Nào?" hint="Hệ thống tự động canh giờ bắt đầu & hạn chót theo ca">
              <Select
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
              >
                <option value="">-- Không chỉ định ca (Mặc định hạn 18:00) --</option>
                {workShifts.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.startTime?.substring(0, 5)} - {ws.endTime?.substring(0, 5)})
                  </option>
                ))}
              </Select>
            </FormField>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Các Ngày Trong Tuần Thực Hiện Việc Này <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const isChecked = formData.recurrenceDays.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => handleToggleDay(d.key)}
                      title={d.name}
                      className={`h-8 flex-1 rounded-lg text-xs font-bold transition-all border ${
                        isChecked
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500/50'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              {errors.recurrenceDays && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.recurrenceDays}</p>
              )}
            </div>
          </div>

          {/* 2.1 Khung Giờ Cụ Thể Trong Ngày */}
          <div className="pt-2.5 border-t border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Khung Giờ Thực Hiện Cụ Thể Trong Ngày (Nếu cần định giờ chuẩn xác)
              </span>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, startTime: '06:30', endTime: '08:00' }))}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium"
                >
                  🌾 06:30 - 08:00 (Cho ăn / Tưới sáng)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, startTime: '15:30', endTime: '17:00' }))}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-medium"
                >
                  🥩 15:30 - 17:00 (Cho ăn chiều)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, startTime: '16:00', endTime: '17:30' }))}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium"
                >
                  🍃 16:00 - 17:30 (Phun thuốc / Chiều mát)
                </button>
                {(formData.startTime || formData.endTime) && (
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, startTime: '', endTime: '' }))}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                  >
                    ✖ Xóa giờ
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <FormField label="Từ giờ (Bắt đầu)" hint="VD: 06:30 sáng">
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </FormField>
              <FormField label="Đến giờ (Hạn chót)" hint="VD: 08:00">
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </FormField>
            </div>
            {(formData.startTime || formData.endTime) && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                ✓ Thẻ nhiệm vụ hàng ngày sẽ hiển thị mốc giờ: <strong>{formData.startTime || '--:--'} - {formData.endTime || '--:--'}</strong> để công nhân thực hiện đúng cữ sinh học.
              </p>
            )}
          </div>
        </div>

        {/* 3. CƠ CHẾ PHÂN CÔNG NHÂN SỰ */}
        <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="font-bold text-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-purple-600" />
              <span>3. Cơ Chế Phân Công Nhân Sự</span>
            </div>

            {/* Toggle chế độ phân công */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignmentMode: 'DYNAMIC_BY_SHIFT' })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  formData.assignmentMode === 'DYNAMIC_BY_SHIFT'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ Tự động theo Ca trực hôm đó
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignmentMode: 'FIXED' })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  formData.assignmentMode === 'FIXED'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gán danh sách cố định
              </button>
            </div>
          </div>

          {formData.assignmentMode === 'DYNAMIC_BY_SHIFT' ? (
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Chế độ tự động thông minh theo Lịch Phân Ca Tuần:</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Mỗi ngày khi hệ thống sinh việc, nhân sự nào được phân trực ca <strong>{workShifts.find((s) => String(s.id) === String(formData.shiftId))?.name || 'đã chọn'}</strong> trong ngày hôm đó sẽ tự động được gán vào nhiệm vụ này. Bạn chỉ cần chọn thêm 1 <strong>Trưởng nhóm (Leader)</strong> giám sát chung bên dưới nếu cần.
              </p>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 text-[11px]">
              Chế độ cố định: Nhiệm vụ mỗi ngày sẽ luôn giao cho đúng các nhân viên bạn đã tích chọn bên dưới, bất kể họ đi ca nào.
            </div>
          )}

          {/* Danh sách chọn Trưởng nhóm và Nhân viên */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-600">
              <span className="font-semibold">
                {formData.assignmentMode === 'DYNAMIC_BY_SHIFT'
                  ? 'Chọn Trưởng nhóm (Leader) & Nhân sự dự phòng:'
                  : 'Chọn nhân sự thực hiện cố định:'}
              </span>
              <div className="flex items-center gap-2">
                {formData.shiftId && (
                  <label className="flex items-center gap-1 cursor-pointer text-emerald-800 font-medium select-none bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <input
                      type="checkbox"
                      checked={filterByShift}
                      onChange={(e) => setFilterByShift(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-3 w-3"
                    />
                    <span>Lọc đúng ca trực</span>
                  </label>
                )}
                <span>Đã chọn: <strong className="text-emerald-700">{formData.selectedEmployeeIds.length}</strong> người</span>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white p-1">
              {assignableEmployees.length === 0 ? (
                <div className="p-3 text-center text-slate-400 text-xs italic">
                  Không tìm thấy nhân sự phù hợp với phân khu hoặc ca làm việc đã chọn.
                </div>
              ) : (
                assignableEmployees.map((emp) => {
                  const isSelected = formData.selectedEmployeeIds.includes(emp.id);
                  const isLeader = String(emp.id) === String(formData.leaderEmployeeId);
                  const hasAccount = Boolean(emp.userId);

                  return (
                    <div
                      key={emp.id}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                        isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleEmployee(emp.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 truncate">{emp.fullName}</span>
                            <span
                              className={`rounded text-[9px] font-bold px-1.5 py-0.2 ${
                                hasAccount ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {hasAccount ? 'App' : 'Thời vụ'}
                            </span>
                            {emp.isTimeMatch ? (
                              <span className="rounded text-[9px] font-black px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ Khớp khung giờ ({emp.shiftAssignment.startTime?.substring(0, 5)} - {emp.shiftAssignment.endTime?.substring(0, 5)})
                              </span>
                            ) : emp.isShiftMatch ? (
                              <span className="rounded text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 border border-blue-300">
                                ✓ Trực ca này ({emp.shiftAssignment.startTime?.substring(0, 5)} - {emp.shiftAssignment.endTime?.substring(0, 5)})
                              </span>
                            ) : emp.shiftAssignment ? (
                              <span className="rounded text-[9px] px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200">
                                ⚠️ Khác giờ: {emp.shiftAssignment.shiftName?.substring(0, 10)} ({emp.shiftAssignment.startTime?.substring(0, 5)} - {emp.shiftAssignment.endTime?.substring(0, 5)})
                              </span>
                            ) : (
                              <span className="rounded text-[9px] px-1.5 py-0.2 bg-slate-50 text-slate-400 border border-slate-200">
                                Chưa xếp ca
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {emp.employeeCode} • {emp.position || 'Nhân viên'}
                          </span>
                        </div>
                      </label>

                      {isSelected && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, leaderEmployeeId: String(emp.id) })}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all shrink-0 ml-2 ${
                            isLeader
                              ? 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400/40'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isLeader ? '★ LEADER' : 'Chọn Leader'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {errors.assignees && <p className="text-xs font-medium text-rose-600">{errors.assignees}</p>}
          </div>
        </div>

        {/* 4. TIÊU HAO VẬT TƯ TỪ KHO */}
        <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Package className="h-4 w-4 text-amber-600" />
              <span>4. Tiêu Hao Vật Tư Từ Kho</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-semibold text-slate-700">Có xuất kho vật tư không?</span>
              <input
                type="checkbox"
                checked={formData.hasMaterial}
                onChange={(e) => setFormData({ ...formData, hasMaterial: e.target.checked })}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>

          {formData.hasMaterial ? (
            <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Kho Xuất Vật Tư *" error={errors.warehouseId}>
                  <Select
                    value={formData.warehouseId}
                    onChange={(e) => handleWarehouseChange(e.target.value)}
                  >
                    <option value="">-- Chọn kho xuất --</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Mặt Hàng / Vật Tư Xuất *" error={errors.materialId}>
                  <Select
                    value={formData.materialId}
                    onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                    disabled={!formData.warehouseId || isLoadingStock}
                  >
                    {!formData.warehouseId ? (
                      <option value="">-- Vui lòng chọn kho xuất trước --</option>
                    ) : isLoadingStock ? (
                      <option value="">-- Đang kiểm tra tồn kho... --</option>
                    ) : warehouseStock.length === 0 ? (
                      <option value="">-- Kho này chưa có vật tư nào nhập kho --</option>
                    ) : (
                      <>
                        <option value="">-- Chọn vật tư đã nhập kho ({warehouseStock.length} loại) --</option>
                        {warehouseStock.map((m) => (
                          <option key={m.materialId} value={m.materialId}>
                            {m.materialName} ({m.skuCode}) [Tồn: {m.totalStock.toLocaleString('vi-VN')} {m.standardUnit || ''}]
                          </option>
                        ))}
                      </>
                    )}
                  </Select>
                  {selectedMaterialObj && selectedMaterialObj.totalStock !== undefined && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-medium">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>
                        Tồn khả dụng trong kho: <strong>{selectedMaterialObj.totalStock.toLocaleString('vi-VN')} {selectedMaterialObj.standardUnit}</strong>
                      </span>
                    </div>
                  )}
                  {formData.warehouseId && !isLoadingStock && warehouseStock.length === 0 && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      Kho này hiện chưa có mặt hàng nào được nhập kho hoặc đã hết tồn kho.
                    </p>
                  )}
                </FormField>

                <FormField
                  label={`Định Mức / Lần ${selectedMaterialObj?.standardUnit ? `(${selectedMaterialObj.standardUnit})` : ''} *`}
                  error={errors.standardQuantity}
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.standardQuantity}
                    onChange={(e) => setFormData({ ...formData, standardQuantity: e.target.value })}
                    placeholder="VD: 40 hoặc 2.5"
                  />
                </FormField>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic">
              Công việc này không trừ kho vật tư (Ví dụ: quét dọn vệ sinh, tuần tra, cắt tỉa cành, đo kiểm chỉ số kỹ thuật).
            </p>
          )}
        </div>

        {/* 5. ĐỐI TƯỢNG HẠCH TOÁN CHI PHÍ */}
        <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Coins className="h-4 w-4 text-emerald-600" />
              <span>5. Đối Tượng Hạch Toán Chi Phí (Tự động đưa vào Sổ Chi Phí WS-H1)</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedZoneObj && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedZoneObj.name} ({zoneCategory === 'CROP' ? 'Trồng trọt' : zoneCategory === 'LIVESTOCK' ? 'Chăn nuôi' : 'Kho bãi / Chung'})
                </span>
              )}
              {selectedLocationObj && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  📍 {selectedLocationObj.name}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            {/* 1. Chọn Niên Vụ (Operational Cycle) */}
            <FormField label="Niên Vụ Sản Xuất *">
              <Select
                value={formData.operationalCycleId}
                onChange={(e) => {
                  const newCycleId = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    operationalCycleId: newCycleId,
                    cropSeasonId: '',
                    livestockGroupId: '',
                  }));
                }}
              >
                <option value="">-- Tất cả niên vụ --</option>
                {operationalCycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.fiscalYear ? `(${c.fiscalYear})` : ''} {c.status === 'ACTIVE' ? '★ Đang diễn ra' : ''}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* 2. Đối tượng hạch toán thích ứng theo Phân khu */}
            {zoneCategory === 'CROP' && (
              <FormField
                label={`Vụ Mùa Cây Trồng Tiếp Nhận Chi Phí ${selectedLocationObj ? `(Lọc theo lô)` : ''}`}
                error={errors.cropSeasonId}
              >
                <Select
                  value={formData.cropSeasonId}
                  onChange={(e) => setFormData({ ...formData, cropSeasonId: e.target.value, livestockGroupId: '' })}
                  disabled={Boolean(selectedLocationObj && filteredCropSeasons.length === 0)}
                >
                  {filteredCropSeasons.length === 0 ? (
                    <option value="">-- Lô này hiện chưa có vụ mùa nào --</option>
                  ) : (
                    <>
                      <option value="">-- Không gán vụ cụ thể / Chi phí phân khu chung --</option>
                      {filteredCropSeasons.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.seasonCode}] {s.cropTypeName ? `${s.cropTypeName} • ` : ''}{s.status}
                        </option>
                      ))}
                    </>
                  )}
                </Select>
                {filteredCropSeasons.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    {selectedLocationObj
                      ? `Lô "${selectedLocationObj.name}" chưa có Vụ Mùa nào trong niên vụ này.`
                      : 'Phân khu này chưa có Vụ Mùa nào trong niên vụ đã chọn.'}
                  </p>
                )}
              </FormField>
            )}

            {zoneCategory === 'LIVESTOCK' && (
              <FormField
                label={`Đàn Vật Nuôi Tiếp Nhận Chi Phí ${selectedLocationObj ? `(Lọc theo ô chuồng)` : ''}`}
                error={errors.livestockGroupId}
              >
                <Select
                  value={formData.livestockGroupId}
                  onChange={(e) => setFormData({ ...formData, livestockGroupId: e.target.value, cropSeasonId: '' })}
                  disabled={Boolean(selectedLocationObj && filteredLivestockGroups.length === 0)}
                >
                  {filteredLivestockGroups.length === 0 ? (
                    <option value="">-- Ô chuồng này hiện chưa có đàn nuôi nào --</option>
                  ) : (
                    <>
                      <option value="">-- Không gán đàn cụ thể / Chi phí chuồng chung --</option>
                      {filteredLivestockGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          [{g.groupCode}] {g.breedName ? `${g.breedName} • ` : ''}(Số lượng: {g.currentQuantity ?? g.initialQuantity})
                        </option>
                      ))}
                    </>
                  )}
                </Select>
                {filteredLivestockGroups.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    {selectedLocationObj
                      ? `Ô chuồng "${selectedLocationObj.name}" chưa có Đàn Vật Nuôi nào trong niên vụ này.`
                      : 'Phân khu này chưa có Đàn Vật Nuôi nào trong niên vụ đã chọn.'}
                  </p>
                )}
              </FormField>
            )}

            {zoneCategory === 'GENERAL' && (
              <div className="flex flex-col justify-center p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                <div className="font-semibold text-slate-700">Chi phí phân bổ chung trang trại</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {formData.zoneId
                    ? 'Vị trí kho bãi / hậu cần: Chi phí được ghi nhận vào chi phí quản lý vận hành chung của phân khu.'
                    : 'Toàn trang trại: Chi phí sẽ được tự động phân bổ chung theo diện tích / quy mô.'}
                </div>
              </div>
            )}

            {zoneCategory === 'MIXED' && (
              <FormField label="Đối Tượng Tiếp Nhận (Vụ Mùa hoặc Đàn Nuôi)">
                <Select
                  value={formData.cropSeasonId ? `CROP_${formData.cropSeasonId}` : (formData.livestockGroupId ? `LIVE_${formData.livestockGroupId}` : '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('CROP_')) {
                      setFormData({ ...formData, cropSeasonId: val.replace('CROP_', ''), livestockGroupId: '' });
                    } else if (val.startsWith('LIVE_')) {
                      setFormData({ ...formData, livestockGroupId: val.replace('LIVE_', ''), cropSeasonId: '' });
                    } else {
                      setFormData({ ...formData, cropSeasonId: '', livestockGroupId: '' });
                    }
                  }}
                >
                  <option value="">-- Chi phí chung / Không gán đích danh --</option>
                  {filteredCropSeasons.length > 0 && (
                    <optgroup label="🌱 Vụ Mùa Cây Trồng">
                      {filteredCropSeasons.map((s) => (
                        <option key={`crop_${s.id}`} value={`CROP_${s.id}`}>
                          [{s.seasonCode}] {s.cropTypeName || ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {filteredLivestockGroups.length > 0 && (
                    <optgroup label="🐄 Đàn Vật Nuôi">
                      {filteredLivestockGroups.map((g) => (
                        <option key={`live_${g.id}`} value={`LIVE_${g.id}`}>
                          [{g.groupCode}] {g.breedName || ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </Select>
              </FormField>
            )}
          </div>
        </div>

        {/* 6. GHI CHÚ QUY TRÌNH */}
        <FormField label="Mô Tả Quy Trình / Ghi Chú Kỹ Thuật Cho Công Nhân">
          <Textarea
            rows={2}
            value={formData.completionNotes}
            onChange={(e) => setFormData({ ...formData, completionNotes: e.target.value })}
            placeholder="Quy chuẩn định lượng, công thức pha dinh dưỡng, lưu ý an toàn lao động..."
          />
        </FormField>

        {/* NÚT THAO TÁC */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Save className="h-4 w-4" />}
            isLoading={isSubmitting}
            loadingText="Đang lưu việc cố định..."
          >
            {isEditing ? 'Lưu Cập Nhật Việc Cố Định' : 'Xác Nhận Thiết Lập Việc Cố Định'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default RoutineTaskModal;
