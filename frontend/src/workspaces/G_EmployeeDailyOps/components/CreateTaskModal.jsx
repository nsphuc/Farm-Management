import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Save,
  AlertCircle,
  CheckSquare,
  Users,
  ShieldAlert,
  Pencil,
  Calendar,
  Clock,
  AlertTriangle,
  Coffee,
  Warehouse,
  Package,
  Coins,
  Sparkles,
  Check,
  Wrench,
  Flame,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { hrService } from '@/services/modules/hrService';
import { inventoryService } from '@/services/modules/inventoryService';
import { farmingService } from '@/services/modules/farmingService';
import { geographyService } from '@/services/modules/geographyService';
import { masterDataService } from '@/services/modules/masterDataService';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { isShiftCoveringTask } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';

function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const TASK_TYPES = [
  { value: 'MAINTENANCE', label: 'Bảo trì máy móc / Khắc phục sự cố (MAINTENANCE)' },
  { value: 'SANITATION', label: 'Vệ sinh chuồng kho / Cách ly thú y (SANITATION)' },
  { value: 'FEEDING', label: 'Cho ăn bổ sung / Dinh dưỡng tăng cường (FEEDING)' },
  { value: 'FERTILIZING', label: 'Bón phân / Phun thuốc đột xuất (FERTILIZING)' },
  { value: 'PLANTING', label: 'Gieo trồng bổ sung / Dặm cây chết (PLANTING)' },
  { value: 'HARVESTING', label: 'Thu hoạch gấp / Tỉa quả đột xuất (HARVESTING)' },
];

const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Thấp (LOW)' },
  { value: 'MEDIUM', label: 'Bình thường (MEDIUM)' },
  { value: 'HIGH', label: 'Ưu tiên cao (HIGH)' },
  { value: 'URGENT', label: 'Khẩn cấp (URGENT)' },
];

// Các kịch bản việc phát sinh thường gặp tại trang trại
const QUICK_INCIDENTS = [
  {
    label: '🔧 Sửa ống tưới vỡ',
    title: 'Khắc phục sự cố rò rỉ / vỡ đường ống cấp nước tưới',
    type: 'MAINTENANCE',
    priority: 'HIGH',
    notes: 'Kiểm tra khớp nối, thay gioăng cao su hoặc đoạn ống bị nứt vỡ, xả cặn trước khi cấp nước lại.',
  },
  {
    label: '🌀 Sửa quạt thông gió',
    title: 'Khắc phục quạt thông gió nhà màng / chuồng trại ngưng chạy',
    type: 'MAINTENANCE',
    priority: 'URGENT',
    notes: 'Kiểm tra aptomat, dây nguồn và bạc đạn của quạt thông gió. Vận hành thử nghiệm trước khi bàn giao.',
  },
  {
    label: '💉 Tiêm thú y khẩn cấp',
    title: 'Cách ly & tiêm thuốc thú y khẩn cấp cho cá thể vật nuôi ốm',
    type: 'SANITATION',
    priority: 'URGENT',
    notes: 'Chuyển cá thể có biểu hiện sốt/bỏ ăn sang ô cách ly tạm thời, đo thân nhiệt và tiêm theo phác đồ thú y.',
  },
  {
    label: '🚚 Bốc dỡ hàng xe tải',
    title: 'Hỗ trợ bốc dỡ vật tư / phân bón / thức ăn từ xe tải về kho',
    type: 'MAINTENANCE',
    priority: 'MEDIUM',
    notes: 'Sắp xếp hàng hóa lên pallet đúng quy cách phân lô kho bãi, kiểm đếm số bao/kiện thực nhập.',
  },
  {
    label: '🌧 Khơi thông rãnh thoát',
    title: 'Khơi thông mương rãnh thoát nước chống ngập úng cục bộ',
    type: 'MAINTENANCE',
    priority: 'HIGH',
    notes: 'Vét bùn rác tại các hố ga và mương thoát nước quanh luống/chuồng để bảo đảm tiêu thoát nhanh.',
  },
  {
    label: '🐛 Phun thuốc trừ sâu khẩn cấp',
    title: 'Phun thuốc phòng trừ sâu bệnh phát sinh khẩn cấp tại hiện trường',
    type: 'FERTILIZING',
    priority: 'HIGH',
    notes: 'Trang bị đồ bảo hộ đầy đủ (khẩu trang than hoạt tính, găng tay cao su), tuân thủ nồng độ pha trên nhãn.',
  },
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

export function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  zones = [],
  employees = [],
  assignments = [],
  initialData = null,
  editingTask = null,
}) {
  const isEditing = Boolean(editingTask);
  const targetFarmId = farmId || editingTask?.farmId;
  const { activeFarmType, farms } = useActiveFarmStore();
  const { userInfo, isOwner, isFarmManager, getManagedZoneIds } = useAuthStore();

  const currentFarmType =
    (targetFarmId ? farms.find((f) => Number(f.id || f.farmId) === Number(targetFarmId))?.farmType : null) ||
    activeFarmType ||
    'MIXED';

  // 1. Phân quyền: Toàn trại hay Giới hạn theo phân khu (Zone Manager / Tech Lead)
  const isManagerOrOwner = isOwner() || isFarmManager(targetFarmId);
  const rawManagedZoneIds = getManagedZoneIds ? getManagedZoneIds(targetFarmId) : null;
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

  // 2. Danh sách phân khu được phép chọn
  const availableZones = useMemo(() => {
    if (!isZoneRestricted) return zones;
    return zones.filter((z) => managedZoneIds.includes(Number(z.id)));
  }, [zones, isZoneRestricted, managedZoneIds]);

  const availableTaskTypes = useMemo(() => {
    if (currentFarmType === 'CROP') {
      return TASK_TYPES.filter((t) => t.value !== 'FEEDING');
    }
    if (currentFarmType === 'LIVESTOCK') {
      return TASK_TYPES.filter((t) => t.value !== 'PLANTING' && t.value !== 'FERTILIZING');
    }
    return TASK_TYPES;
  }, [currentFarmType]);

  const defaultTaskType = 'MAINTENANCE';

  // Form State
  const [formData, setFormData] = useState({
    zoneId: '',
    locationId: '',
    taskTitle: '',
    taskType: defaultTaskType,
    priority: 'HIGH',
    shiftId: '',
    startTime: '',
    endTime: '',
    deadline: '',
    completionNotes: '',
    hasMaterial: false,
    warehouseId: '',
    materialId: '',
    standardQuantity: '',
    operationalCycleId: '',
    cropSeasonId: '',
    livestockGroupId: '',
    selectedEmployeeIds: [],
    leaderEmployeeId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [filterBySelectedZone, setFilterBySelectedZone] = useState(true);
  const [filterByOnDutyOnly, setFilterByOnDutyOnly] = useState(false);
  const [filterByShift, setFilterByShift] = useState(false);

  // Danh mục ngoài
  const [workShifts, setWorkShifts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [cropSeasons, setCropSeasons] = useState([]);
  const [livestockGroups, setLivestockGroups] = useState([]);
  const [operationalCycles, setOperationalCycles] = useState([]);
  const [shiftAssignments, setShiftAssignments] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [zoneLocations, setZoneLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Lấy ngày làm việc từ hạn chót deadline (YYYY-MM-DD)
  const taskDate = useMemo(() => {
    if (!formData.deadline) return formatLocalDate(new Date());
    try {
      if (typeof formData.deadline === 'string' && formData.deadline.includes('T')) {
        return formData.deadline.split('T')[0];
      }
      const d = new Date(formData.deadline);
      if (Number.isNaN(d.getTime())) return formatLocalDate(new Date());
      return formatLocalDate(d);
    } catch {
      return formatLocalDate(new Date());
    }
  }, [formData.deadline]);

  // Tải danh mục hỗ trợ khi mở Modal
  useEffect(() => {
    if (!isOpen || !targetFarmId || targetFarmId === 'ALL' || Number.isNaN(Number(targetFarmId))) {
      return;
    }
    let isMounted = true;

    // 1. Ca làm việc
    hrService
      .getWorkShifts()
      .then((data) => {
        if (isMounted) setWorkShifts(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.warn('Lỗi tải danh mục ca làm việc:', err));

    // 2. Kho hàng
    inventoryService
      .getWarehouses(targetFarmId)
      .then((data) => {
        if (isMounted) setWarehouses(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.warn('Lỗi tải danh mục kho:', err));

    // 3. Vật tư Master Data
    masterDataService
      .getMaterials()
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.content || [];
          setMaterials(list);
        }
      })
      .catch((err) => console.warn('Lỗi tải danh mục vật tư:', err));

    // 4. Vụ mùa cây trồng
    farmingService
      .getCropSeasons(targetFarmId)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.content || [];
          setCropSeasons(list.filter((s) => s.status !== 'CLOSED' && s.status !== 'CANCELLED'));
        }
      })
      .catch((err) => console.warn('Lỗi tải danh mục vụ mùa:', err));

    // 5. Đàn vật nuôi
    farmingService
      .getLivestockGroups(targetFarmId)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.content || [];
          setLivestockGroups(list.filter((g) => g.status !== 'SOLD' && g.status !== 'CLOSED' && g.status !== 'CULLED'));
        }
      })
      .catch((err) => console.warn('Lỗi tải danh mục đàn vật nuôi:', err));

    // 6. Niên vụ sản xuất
    geographyService
      .getCycles(targetFarmId)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.content || [];
          setOperationalCycles(list);
        }
      })
      .catch((err) => console.warn('Lỗi tải danh mục niên vụ:', err));

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetFarmId]);

  // Tải thông tin Lịch ca và Đơn nghỉ phép theo ngày giao task
  useEffect(() => {
    if (!isOpen || !targetFarmId || targetFarmId === 'ALL' || Number.isNaN(Number(targetFarmId))) {
      return;
    }
    let isMounted = true;
    const loadScheduleData = async () => {
      try {
        setIsLoadingSchedules(true);
        const [shiftRes, leaveRes] = await Promise.all([
          hrService.getShiftAssignments({ farmId: targetFarmId, workDate: taskDate }).catch(() => []),
          hrService.getLeaveRequests({ farmId: targetFarmId, size: 100 }).catch(() => ({ content: [] })),
        ]);
        if (!isMounted) return;
        setShiftAssignments(Array.isArray(shiftRes) ? shiftRes : shiftRes?.content || []);
        setLeaveRequests(Array.isArray(leaveRes) ? leaveRes : leaveRes?.content || []);
      } catch (err) {
        console.warn('Lỗi khi tải lịch ca / nghỉ phép cho nhân sự:', err);
      } finally {
        if (isMounted) setIsLoadingSchedules(false);
      }
    };

    loadScheduleData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, targetFarmId, taskDate]);

  // Tải danh sách các lô của phân khu đang chọn
  useEffect(() => {
    if (!targetFarmId || !formData.zoneId) {
      setZoneLocations([]);
      return;
    }
    let isMounted = true;
    setIsLoadingLocations(true);
    geographyService
      .getLocations(targetFarmId, formData.zoneId)
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.content || [];
        setZoneLocations(list);
      })
      .catch((err) => {
        console.warn('Lỗi khi tải danh sách lô của phân khu:', err);
        if (isMounted) setZoneLocations([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLocations(false);
      });
    return () => {
      isMounted = false;
    };
  }, [targetFarmId, formData.zoneId]);

  // Tải danh sách vật tư đã nhập và còn tồn trong kho đã chọn
  useEffect(() => {
    if (!isOpen || !targetFarmId || !formData.warehouseId) {
      setWarehouseStock([]);
      return;
    }
    let isMounted = true;
    setIsLoadingStock(true);
    inventoryService
      .getInventory({
        farmId: targetFarmId,
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
  }, [isOpen, targetFarmId, formData.warehouseId]);

  // Helper: Xác định trạng thái lịch trực của nhân viên vào ngày taskDate
  const getEmployeeScheduleStatus = useCallback(
    (empId) => {
      // 1. Kiểm tra có đơn xin nghỉ phép đã duyệt không
      const approvedLeave = leaveRequests.find((l) => {
        if (Number(l.employeeId) !== Number(empId)) return false;
        if (l.status !== 'APPROVED') return false;
        return taskDate >= l.startDate && taskDate <= l.endDate;
      });
      if (approvedLeave) {
        return {
          type: 'LEAVE',
          label: `Nghỉ phép (${approvedLeave.leaveType || 'Có phép'})`,
          isLeave: true,
          canAssign: false,
        };
      }

      // 2. Kiểm tra có ca trực phân công hợp lệ trong ngày không
      const shift = shiftAssignments.find((s) => {
        if (Number(s.employeeId) !== Number(empId)) return false;
        if (s.status === 'CANCELLED') return false;
        return String(s.workDate) === String(taskDate);
      });
      if (shift) {
        const isShiftMatch = Boolean(formData.shiftId && String(shift.shiftId) === String(formData.shiftId));
        let isTimeMatch = isShiftMatch;
        if (formData.startTime && formData.endTime && shift.startTime && shift.endTime) {
          isTimeMatch = isShiftCoveringTask(shift.startTime, shift.endTime, formData.startTime, formData.endTime);
        }
        const timeStr =
          shift.startTime && shift.endTime ? ` (${shift.startTime.slice(0, 5)} - ${shift.endTime.slice(0, 5)})` : '';
        return {
          type: 'ON_DUTY',
          label: `${shift.shiftName || 'Ca làm việc'}${timeStr}`,
          shiftAssignment: shift,
          isShiftMatch,
          isTimeMatch,
          canAssign: true,
        };
      }

      // 3. Không có ca trực trong ngày (Nghỉ ca / Ngoài giờ)
      return {
        type: 'OFF_DUTY',
        label: 'Nghỉ ca / Chưa xếp ca',
        canAssign: true,
        isOffDuty: true,
      };
    },
    [leaveRequests, shiftAssignments, taskDate, formData.shiftId, formData.startTime, formData.endTime]
  );

  // Helper: Kiểm tra nhân sự có thuộc phân khu targetZoneId không
  const isEmployeeInZone = useCallback(
    (emp, targetZoneId) => {
      if (!targetZoneId) return true;
      const tid = Number(targetZoneId);

      // a) Khớp assignedZoneId hoặc zoneId trên hồ sơ nhân viên
      if (emp.assignedZoneId && Number(emp.assignedZoneId) === tid) return true;
      if (emp.zoneId && Number(emp.zoneId) === tid) return true;

      // b) Khớp trong danh sách phân công farm_assignments
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

      // c) Khớp qua phòng ban (department) của nhân viên
      const targetZoneObj = zones.find((z) => Number(z.id) === tid);
      if (targetZoneObj && emp.department) {
        const dept = emp.department.trim().toLowerCase();
        const zName = targetZoneObj.name.trim().toLowerCase();
        if (dept.includes(zName) || zName.includes(dept)) return true;
      }

      // d) Bản thân Zone Manager phụ trách tạo nhiệm vụ
      if (userInfo?.id && emp.userId && Number(emp.userId) === Number(userInfo.id)) {
        return true;
      }

      return false;
    },
    [assignments, zones, userInfo?.id]
  );

  // Danh sách nhân sự được phép phân công
  const assignableEmployees = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
    const effectiveZoneId = formData.zoneId;

    let list = activeEmployees;
    if (isZoneRestricted) {
      if (!effectiveZoneId) return [];
      list = activeEmployees.filter((emp) => isEmployeeInZone(emp, effectiveZoneId));
    } else if (filterBySelectedZone && effectiveZoneId) {
      list = activeEmployees.filter((emp) => isEmployeeInZone(emp, effectiveZoneId));
    }

    // Gắn thông tin lịch ca và sắp xếp
    const enriched = list.map((emp) => {
      const sched = getEmployeeScheduleStatus(emp.id);
      return {
        ...emp,
        scheduleStatus: sched,
        isShiftMatch: sched.isShiftMatch,
      };
    });

    enriched.sort((a, b) => {
      const aScore = (a.scheduleStatus?.isTimeMatch ? 2 : 0) + (a.isShiftMatch ? 1 : 0);
      const bScore = (b.scheduleStatus?.isTimeMatch ? 2 : 0) + (b.isShiftMatch ? 1 : 0);
      if (aScore !== bScore) return bScore - aScore;
      if (a.scheduleStatus.type === 'ON_DUTY' && b.scheduleStatus.type !== 'ON_DUTY') return -1;
      if (a.scheduleStatus.type !== 'ON_DUTY' && b.scheduleStatus.type === 'ON_DUTY') return 1;
      return 0;
    });

    let filtered = enriched;
    if (filterByOnDutyOnly) {
      filtered = filtered.filter((emp) => emp.scheduleStatus.type === 'ON_DUTY');
    }
    if (filterByShift) {
      if (formData.startTime && formData.endTime) {
        const timeMatched = filtered.filter((emp) => emp.scheduleStatus?.isTimeMatch);
        if (timeMatched.length > 0) return timeMatched;
      } else if (formData.shiftId) {
        const shiftMatched = filtered.filter((emp) => emp.isShiftMatch);
        if (shiftMatched.length > 0) return shiftMatched;
      }
    }

    return filtered;
  }, [
    employees,
    formData.zoneId,
    formData.shiftId,
    formData.startTime,
    formData.endTime,
    isZoneRestricted,
    filterBySelectedZone,
    filterByOnDutyOnly,
    filterByShift,
    isEmployeeInZone,
    getEmployeeScheduleStatus,
  ]);

  // Khởi tạo Form khi mở Modal
  useEffect(() => {
    if (isOpen) {
      let defaultZone = '';
      if (isZoneRestricted) {
        if (availableZones.length > 0) {
          defaultZone = String(availableZones[0].id);
        }
      } else {
        defaultZone = zones[0]?.id ? String(zones[0].id) : '';
      }

      const activeCycle = operationalCycles.find((c) => c.status === 'ACTIVE') || operationalCycles[0];
      const defaultCycleId = activeCycle ? String(activeCycle.id) : '';

      if (editingTask) {
        const assignedIds =
          editingTask.assignees && editingTask.assignees.length > 0
            ? editingTask.assignees.map((a) => a.employeeId)
            : editingTask.assignedToEmployeeId
            ? [editingTask.assignedToEmployeeId]
            : [];
        const leaderId = editingTask.assignedToEmployeeId
          ? String(editingTask.assignedToEmployeeId)
          : editingTask.assignees?.find((a) => a.roleInTask === 'LEADER')?.employeeId
          ? String(editingTask.assignees.find((a) => a.roleInTask === 'LEADER').employeeId)
          : assignedIds[0]
          ? String(assignedIds[0])
          : '';

        let deadlineFormatted = '';
        if (editingTask.deadline) {
          try {
            deadlineFormatted = new Date(editingTask.deadline).toISOString().slice(0, 16);
          } catch {
            deadlineFormatted = '';
          }
        }

        const taskZoneId = editingTask.zoneId ? String(editingTask.zoneId) : defaultZone;
        const rawTitle = editingTask.taskTitle || '';
        const cleanTitle = rawTitle.replace(/^\[PHÁT SINH\]\s*/i, '');

        const hasMat = Boolean(editingTask.warehouseId || editingTask.materialId);

        setFormData({
          zoneId: isZoneRestricted && !availableZones.some((z) => String(z.id) === taskZoneId) ? defaultZone : taskZoneId,
          locationId: editingTask.locationId ? String(editingTask.locationId) : '',
          taskTitle: cleanTitle,
          taskType: editingTask.taskType || defaultTaskType,
          priority: editingTask.priority || 'HIGH',
          shiftId: editingTask.shiftId ? String(editingTask.shiftId) : '',
          startTime: editingTask.startTime ? editingTask.startTime.slice(0, 5) : '',
          endTime: editingTask.endTime ? editingTask.endTime.slice(0, 5) : '',
          deadline: deadlineFormatted || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
          completionNotes: editingTask.completionNotes || '',
          hasMaterial: hasMat,
          warehouseId: editingTask.warehouseId ? String(editingTask.warehouseId) : '',
          materialId: editingTask.materialId ? String(editingTask.materialId) : '',
          standardQuantity: editingTask.standardQuantity ? String(editingTask.standardQuantity) : '',
          operationalCycleId: defaultCycleId,
          cropSeasonId: editingTask.cropSeasonId ? String(editingTask.cropSeasonId) : '',
          livestockGroupId: editingTask.livestockGroupId ? String(editingTask.livestockGroupId) : '',
          selectedEmployeeIds: assignedIds,
          leaderEmployeeId: leaderId,
        });
      } else if (initialData) {
        const initZoneId = initialData.zoneId ? String(initialData.zoneId) : defaultZone;
        const validZoneId =
          isZoneRestricted && !availableZones.some((z) => String(z.id) === initZoneId) ? defaultZone : initZoneId;
        const initialZoneStaff = employees.filter((e) => e.status === 'ACTIVE' && isEmployeeInZone(e, validZoneId));

        const rawTitle = initialData.taskTitle || '';
        const cleanTitle = rawTitle.replace(/^\[PHÁT SINH\]\s*/i, '');

        setFormData({
          zoneId: validZoneId,
          locationId: initialData.locationId ? String(initialData.locationId) : '',
          taskTitle: cleanTitle,
          taskType: initialData.taskType || defaultTaskType,
          priority: initialData.priority || 'HIGH',
          shiftId: initialData.shiftId ? String(initialData.shiftId) : '',
          startTime: initialData.startTime ? initialData.startTime.slice(0, 5) : '',
          endTime: initialData.endTime ? initialData.endTime.slice(0, 5) : '',
          deadline: initialData.deadline || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
          completionNotes: initialData.completionNotes || '',
          hasMaterial: Boolean(initialData.warehouseId || initialData.materialId),
          warehouseId: initialData.warehouseId ? String(initialData.warehouseId) : '',
          materialId: initialData.materialId ? String(initialData.materialId) : '',
          standardQuantity: initialData.standardQuantity ? String(initialData.standardQuantity) : '',
          operationalCycleId: defaultCycleId,
          cropSeasonId: initialData.cropSeasonId ? String(initialData.cropSeasonId) : '',
          livestockGroupId: initialData.livestockGroupId ? String(initialData.livestockGroupId) : '',
          selectedEmployeeIds:
            initialData.selectedEmployeeIds || (initialZoneStaff[0]?.id ? [initialZoneStaff[0].id] : []),
          leaderEmployeeId:
            initialData.leaderEmployeeId || (initialZoneStaff[0]?.id ? String(initialZoneStaff[0].id) : ''),
        });
      } else {
        const initialZoneStaff = employees.filter((e) => e.status === 'ACTIVE' && isEmployeeInZone(e, defaultZone));

        setFormData({
          zoneId: defaultZone,
          locationId: '',
          taskTitle: '',
          taskType: defaultTaskType,
          priority: 'HIGH',
          shiftId: '',
          startTime: '',
          endTime: '',
          deadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
          completionNotes: '',
          hasMaterial: false,
          warehouseId: '',
          materialId: '',
          standardQuantity: '',
          operationalCycleId: defaultCycleId,
          cropSeasonId: '',
          livestockGroupId: '',
          selectedEmployeeIds: initialZoneStaff[0]?.id ? [initialZoneStaff[0].id] : [],
          leaderEmployeeId: initialZoneStaff[0]?.id ? String(initialZoneStaff[0].id) : '',
        });
      }

      setErrors({});
      if (isZoneRestricted && availableZones.length === 0) {
        setGeneralError(
          'Bạn chưa được phân công phụ trách phân khu nào tại trang trại này. Vui lòng liên hệ Quản lý trang trại để được bổ nhiệm.'
        );
      } else {
        setGeneralError(null);
      }
    }
  }, [isOpen, editingTask, initialData, zones, availableZones, employees, defaultTaskType, isZoneRestricted, isEmployeeInZone, operationalCycles]);

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
        updated.selectedEmployeeIds = retainedIds.length > 0 ? retainedIds : validStaff[0]?.id ? [validStaff[0].id] : [];
        updated.leaderEmployeeId = updated.selectedEmployeeIds.length > 0 ? String(updated.selectedEmployeeIds[0]) : '';
      }
      return updated;
    });
  };

  // Xử lý đổi lô đất / ô chuồng
  const handleLocationChange = (locId) => {
    setFormData((prev) => ({
      ...prev,
      locationId: locId,
      cropSeasonId: '',
      livestockGroupId: '',
    }));
  };

  // Xử lý đổi kho xuất vật tư
  const handleWarehouseChange = (whId) => {
    setFormData((prev) => ({
      ...prev,
      warehouseId: whId,
      materialId: '',
      standardQuantity: '',
    }));
  };

  // Áp dụng kịch bản xử lý sự cố nhanh (Quick Incident Preset)
  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      taskTitle: preset.title,
      taskType: preset.type,
      priority: preset.priority,
      completionNotes: preset.notes,
    }));
  };

  // Toggle chọn nhân viên
  const handleToggleEmployee = (empId) => {
    const sched = getEmployeeScheduleStatus(empId);
    if (sched.isLeave && !formData.selectedEmployeeIds.includes(empId)) {
      toast.error('Nhân sự này đã có đơn nghỉ phép được duyệt vào ngày này. Vui lòng không phân công!');
      return;
    }
    if (sched.isOffDuty && !formData.selectedEmployeeIds.includes(empId)) {
      toast.warning('Lưu ý: Nhân sự này không có ca trực trong ngày (Hệ thống sẽ ghi nhận làm thêm giờ/OT).');
    }

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

  const selectedZoneObj = zones.find((z) => Number(z.id) === Number(formData.zoneId));
  const selectedLocationObj = zoneLocations.find((l) => String(l.id) === String(formData.locationId));

  // Phân loại phân khu: CROP, LIVESTOCK, hay GENERAL
  const zoneCategory = useMemo(() => {
    if (!formData.zoneId) return 'GENERAL';
    const z = zones.find((item) => Number(item.id) === Number(formData.zoneId));
    if (!z) return 'GENERAL';
    if (z.zoneType === 'BARN') return 'LIVESTOCK';
    if (z.zoneType === 'OPEN_FIELD' || z.zoneType === 'GREENHOUSE') return 'CROP';
    if (z.zoneType === 'STORAGE' || z.zoneType === 'ISOLATION') return 'GENERAL';
    const hasCrop = cropSeasons.some((s) => Number(s.zoneId) === Number(formData.zoneId));
    const hasLivestock = livestockGroups.some((g) => Number(g.zoneId) === Number(formData.zoneId));
    if (hasCrop && !hasLivestock) return 'CROP';
    if (hasLivestock && !hasCrop) return 'LIVESTOCK';
    if (hasCrop && hasLivestock) return 'MIXED';
    return 'GENERAL';
  }, [formData.zoneId, zones, cropSeasons, livestockGroups]);

  // Lọc Vụ mùa theo Phân khu, Niên vụ, và Lô đất cụ thể
  const filteredCropSeasons = useMemo(() => {
    const list = cropSeasons.filter((s) => {
      const matchZone = formData.zoneId ? Number(s.zoneId) === Number(formData.zoneId) : true;
      const matchCycle = formData.operationalCycleId ? Number(s.operationalCycleId) === Number(formData.operationalCycleId) : true;
      return matchZone && matchCycle;
    });

    if (selectedLocationObj) {
      return list.filter((s) => doesLocationMatchCropSeason(selectedLocationObj, s));
    }
    return list;
  }, [cropSeasons, formData.zoneId, formData.operationalCycleId, selectedLocationObj]);

  // Lọc Đàn vật nuôi theo Phân khu, Niên vụ, và Ô chuồng cụ thể
  const filteredLivestockGroups = useMemo(() => {
    const list = livestockGroups.filter((g) => {
      const matchZone = formData.zoneId ? Number(g.zoneId) === Number(formData.zoneId) : true;
      const matchCycle = formData.operationalCycleId ? Number(g.operationalCycleId) === Number(formData.operationalCycleId) : true;
      return matchZone && matchCycle;
    });

    if (selectedLocationObj) {
      return list.filter((g) => doesLocationMatchLivestockGroup(selectedLocationObj, g));
    }
    return list;
  }, [livestockGroups, formData.zoneId, formData.operationalCycleId, selectedLocationObj]);

  // Lấy đơn vị và thông tin của vật tư đang chọn
  const selectedMaterialObj =
    warehouseStock.find((m) => String(m.materialId) === String(formData.materialId)) ||
    materials.find((m) => String(m.id) === String(formData.materialId));

  // Tự động gán vụ mùa hoặc đàn nuôi nếu tại ô/lô chỉ có duy nhất 1 đối tượng
  useEffect(() => {
    if (zoneCategory === 'CROP' && filteredCropSeasons.length === 1 && !formData.cropSeasonId) {
      setFormData((prev) => ({ ...prev, cropSeasonId: String(filteredCropSeasons[0].id) }));
    }
    if (zoneCategory === 'LIVESTOCK' && filteredLivestockGroups.length === 1 && !formData.livestockGroupId) {
      setFormData((prev) => ({ ...prev, livestockGroupId: String(filteredLivestockGroups[0].id) }));
    }
  }, [zoneCategory, filteredCropSeasons, filteredLivestockGroups, formData.cropSeasonId, formData.livestockGroupId]);

  const validate = () => {
    const errs = {};
    if (!formData.taskTitle?.trim()) {
      errs.taskTitle = 'Tiêu đề nhiệm vụ không được để trống';
    }
    if (isZoneRestricted && !formData.zoneId) {
      errs.zoneId = 'Bắt buộc chọn phân khu phụ trách';
    }
    if (formData.selectedEmployeeIds.length === 0) {
      errs.assignees = 'Cần phân công ít nhất 1 nhân viên thực hiện';
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
    if (!targetFarmId || targetFarmId === 'ALL' || Number.isNaN(Number(targetFarmId))) {
      setGeneralError('Vui lòng chọn trang trại cụ thể để thực hiện giao việc');
      return;
    }

    try {
      setIsSubmitting(true);
      setGeneralError(null);

      const cleanTitle = formData.taskTitle.trim().replace(/^\[PHÁT SINH\]\s*/i, '');
      const fullTitle = `[PHÁT SINH] ${cleanTitle}`;

      // Tính hạn chót deadline
      let deadlineDate = new Date();
      if (formData.deadline) {
        deadlineDate = new Date(formData.deadline);
      } else if (formData.endTime) {
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

      const assigneesPayload = formData.selectedEmployeeIds.map((empId) => ({
        employeeId: empId,
        roleInTask: String(empId) === String(formData.leaderEmployeeId) ? 'LEADER' : 'MEMBER',
      }));

      const payload = {
        zoneId: formData.zoneId ? Number(formData.zoneId) : null,
        locationId: formData.locationId ? Number(formData.locationId) : null,
        taskTitle: fullTitle,
        taskType: formData.taskType,
        priority: formData.priority,
        shiftId: formData.shiftId ? Number(formData.shiftId) : null,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        deadline: deadlineDate.toISOString(),
        warehouseId: formData.hasMaterial && formData.warehouseId ? Number(formData.warehouseId) : null,
        materialId: formData.hasMaterial && formData.materialId ? Number(formData.materialId) : null,
        standardQuantity:
          formData.hasMaterial && formData.standardQuantity ? Number(formData.standardQuantity) : null,
        cropSeasonId: formData.cropSeasonId ? Number(formData.cropSeasonId) : null,
        livestockGroupId: formData.livestockGroupId ? Number(formData.livestockGroupId) : null,
        assignedToEmployeeId: formData.leaderEmployeeId ? Number(formData.leaderEmployeeId) : null,
        completionNotes: formData.completionNotes?.trim() || null,
        assignees: assigneesPayload,
      };

      if (isEditing) {
        await hrService.updateTask(targetFarmId, editingTask.id, payload);
        toast.success('Đã cập nhật nhiệm vụ phát sinh thành công!');
      } else {
        await hrService.createTask(targetFarmId, payload);
        toast.success('Đã giao nhiệm vụ phát sinh thành công!');
      }

      const { notifyDataChanged } = useActiveFarmStore.getState();
      notifyDataChanged?.('tasks');
      notifyDataChanged?.('inventory');
      notifyDataChanged?.('attendance');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Save ad-hoc task error:', err);
      const msg = applyServerFieldErrors(err, setErrors);
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={isEditing ? 'Chỉnh Sửa Công Việc Phát Sinh' : 'Giao Việc Phát Sinh Đột Xuất'}
      subtitle={
        isEditing
          ? 'Cập nhật nội dung công việc, ca trực, vật tư hoặc đối tượng hạch toán chi phí'
          : 'Xử lý sự cố, công việc ngoài kế hoạch định kỳ & liên kết trừ kho, hạch toán chi phí'
      }
      icon={
        isEditing ? (
          <Pencil className="h-5 w-5 text-amber-600" />
        ) : (
          <Flame className="h-5 w-5 text-amber-600" />
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {generalError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Tiền tố & Thông báo phân loại phát sinh */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
          <span className="font-mono font-bold bg-amber-600 text-white px-2 py-0.5 rounded text-[10px]">
            [PHÁT SINH]
          </span>
          <span>
            Nhiệm vụ đột xuất ngoài kế hoạch định kỳ. Hệ thống sẽ tự động gắn tiền tố [PHÁT SINH] để đối soát với việc cố định hàng ngày.
          </span>
        </div>

        {/* Kịch bản phát sinh nhanh (Quick Incident Presets) */}
        {!isEditing && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5 text-[11px]">
                <Wrench className="h-3.5 w-3.5 text-amber-600" />
                Kịch bản phát sinh nhanh (Bấm để điền mẫu):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_INCIDENTS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-slate-700 font-medium transition-all shadow-2xs"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 1. THÔNG TIN CƠ BẢN */}
        <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>1. Thông Tin Công Việc & Vị Trí Thực Hiện</span>
          </div>

          <FormField label="Tiêu Đề Nhiệm Vụ Phát Sinh" required error={errors.taskTitle}>
            <Input
              value={formData.taskTitle}
              onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
              placeholder="VD: Sửa chữa đường ống tưới bị rò rỉ tại Lô 001, Khắc phục quạt thông gió..."
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
              label={isZoneRestricted ? 'Phân Khu Phụ Trách *' : 'Phân Khu Thực Hiện'}
              error={errors.zoneId}
            >
              <Select
                value={formData.zoneId}
                onChange={(e) => handleZoneChange(e.target.value)}
                placeholder={isZoneRestricted ? '-- Chọn phân khu --' : '-- Toàn trang trại --'}
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
              <span>2. Thời Gian & Ca Làm Việc</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Ngày làm: <strong>{taskDate}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Thuộc Ca Làm Việc Nào?" hint="Hỗ trợ đối soát lịch trực ca của nhân sự">
              <Select
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
              >
                <option value="">-- Không chỉ định ca cụ thể --</option>
                {workShifts.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.startTime?.substring(0, 5)} - {ws.endTime?.substring(0, 5)})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Hạn Chót Hoàn Thành (Deadline)" required error={errors.deadline}>
              <Input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </FormField>
          </div>

          {/* Khung giờ cụ thể trong ngày */}
          <div className="pt-2.5 border-t border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Khung Giờ Thực Hiện Cụ Thể (Nếu cần khống chế mốc giờ chuẩn xác)
              </span>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, startTime: '06:30', endTime: '08:00' }))}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium"
                >
                  🌾 06:30 - 08:00 (Sáng)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, startTime: '15:30', endTime: '17:00' }))}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-medium"
                >
                  🥩 15:30 - 17:00 (Chiều)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, startTime: '16:00', endTime: '17:30' }))}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium"
                >
                  🍃 16:00 - 17:30 (Chiều mát)
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
              <FormField label="Từ giờ (Bắt đầu)" hint="VD: 07:00">
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </FormField>
              <FormField label="Đến giờ (Hạn chót)" hint="VD: 10:30">
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </FormField>
            </div>
            {(formData.startTime || formData.endTime) && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                ✓ Thẻ nhiệm vụ sẽ hiển thị mốc giờ: <strong>{formData.startTime || '--:--'} - {formData.endTime || '--:--'}</strong> để công nhân hoàn thành kịp thời.
              </p>
            )}
          </div>
        </div>

        {/* 3. PHÂN CÔNG NHÂN SỰ */}
        <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Users className="h-4 w-4 text-purple-600" />
              <span>3. Phân Công Nhân Sự Thực Hiện</span>
              <span className="text-rose-500 font-bold">*</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <label className="flex items-center gap-1 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={filterByOnDutyOnly}
                  onChange={(e) => setFilterByOnDutyOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>Chỉ hiện có ca ({taskDate})</span>
              </label>

              {formData.shiftId && (
                <label className="flex items-center gap-1 cursor-pointer select-none text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={filterByShift}
                    onChange={(e) => setFilterByShift(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Lọc đúng ca trực</span>
                </label>
              )}

              <span className="text-slate-500">
                Đã chọn: <strong className="text-emerald-700">{formData.selectedEmployeeIds.length}</strong> người
              </span>
            </div>
          </div>

          {/* Ghi chú phạm vi phân công */}
          {isZoneRestricted && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50/80 border border-blue-200 p-2 text-xs text-blue-800">
              <ShieldAlert className="h-4 w-4 shrink-0 text-blue-600" />
              <span>
                Giới hạn quyền hạn: Bạn chỉ được phân công cho nhân sự thuộc phân khu phụ trách{' '}
                <strong>
                  {availableZones.find((z) => String(z.id) === String(formData.zoneId))?.name || 'đã chọn'}
                </strong>.
              </span>
            </div>
          )}

          {errors.assignees && <p className="text-xs font-medium text-rose-600">{errors.assignees}</p>}

          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white p-1">
            {isLoadingSchedules ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Đang đối soát lịch trực ca và đơn nghỉ phép...</span>
              </div>
            ) : assignableEmployees.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {filterByOnDutyOnly
                  ? `Không có nhân sự nào có ca trực vào ngày ${taskDate}. Bạn có thể tắt bộ lọc "Chỉ hiện có ca" để giao việc làm thêm (OT).`
                  : formData.zoneId
                  ? 'Phân khu này chưa có nhân sự nào được phân công trực thuộc. Hãy báo Giám đốc trang trại để phân công công nhân vào phân khu này.'
                  : 'Vui lòng chọn phân khu để hiển thị danh sách nhân sự phụ trách.'}
              </div>
            ) : (
              assignableEmployees.map((emp) => {
                const isSelected = formData.selectedEmployeeIds.includes(emp.id);
                const isLeader = String(emp.id) === String(formData.leaderEmployeeId);
                const sched = emp.scheduleStatus || getEmployeeScheduleStatus(emp.id);
                const hasAccount = Boolean(emp.userId);

                return (
                  <div
                    key={emp.id}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                      sched.isLeave
                        ? 'bg-rose-50/40 opacity-70'
                        : isSelected
                        ? 'bg-emerald-50/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <label
                      className={`flex items-center gap-2.5 flex-1 min-w-0 ${
                        sched.isLeave ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={sched.isLeave}
                        onChange={() => handleToggleEmployee(emp.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`font-bold block truncate ${
                              sched.isLeave ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}
                          >
                            {emp.fullName}
                          </span>

                          <span
                            className={`rounded text-[9px] font-bold px-1.5 py-0.2 ${
                              hasAccount ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {hasAccount ? 'App' : 'Thời vụ'}
                          </span>

                          {/* Badge Lịch ca / Nghỉ phép */}
                          {sched.isLeave ? (
                            <span className="rounded bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 border border-rose-300 flex items-center gap-1">
                              <Coffee className="h-3 w-3" />
                              {sched.label}
                            </span>
                          ) : emp.isShiftMatch ? (
                            <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 border border-emerald-300 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Trực ca này ({sched.label})
                            </span>
                          ) : sched.type === 'ON_DUTY' ? (
                            <span className="rounded bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 border border-slate-200 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-500" />
                              {sched.label}
                            </span>
                          ) : (
                            <span className="rounded bg-slate-50 text-slate-400 text-[10px] font-medium px-1.5 py-0.5 border border-slate-200">
                              {sched.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {emp.employeeCode} • {emp.position || 'Nhân viên'} {emp.department ? `(${emp.department})` : ''}
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
                        {isLeader ? '★ TRƯỞNG NHÓM (LEADER)' : 'Đặt làm Trưởng nhóm'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
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
                  label={`Định Mức / Lượng Xuất ${selectedMaterialObj?.standardUnit ? `(${selectedMaterialObj.standardUnit})` : ''} *`}
                  error={errors.standardQuantity}
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.standardQuantity}
                    onChange={(e) => setFormData({ ...formData, standardQuantity: e.target.value })}
                    placeholder="VD: 50 hoặc 2.5"
                  />
                </FormField>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic">
              Công việc này không tiêu hao vật tư từ kho (Ví dụ: tuần tra hiện trường, sửa chữa cơ điện, dọn dẹp mặt bằng).
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
            {/* Niên vụ sản xuất */}
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

            {/* Đối tượng hạch toán thích ứng */}
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
                  value={
                    formData.cropSeasonId
                      ? `CROP_${formData.cropSeasonId}`
                      : formData.livestockGroupId
                      ? `LIVE_${formData.livestockGroupId}`
                      : ''
                  }
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

        {/* 6. CHỈ TIÊU KỸ THUẬT & HƯỚNG DẪN */}
        <FormField label="Chỉ Tiêu Kỹ Thuật / Hướng Dẫn Thực Hiện Cho Công Nhân" error={errors.completionNotes}>
          <Textarea
            rows={2}
            value={formData.completionNotes}
            onChange={(e) => setFormData({ ...formData, completionNotes: e.target.value })}
            placeholder="Mô tả quy chuẩn kỹ thuật, lưu ý an toàn lao động, hướng dẫn xử lý sự cố tại hiện trường..."
          />
        </FormField>

        {/* NÚT THAO TÁC */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Can
            permission="PERM_TASK_ASSIGN"
            role={['ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF']}
            farmRole={['FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD', 'WAREHOUSE_KEEPER']}
          >
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Save className="h-4 w-4" />}
              isLoading={isSubmitting}
              loadingText={isEditing ? 'Đang lưu thay đổi...' : 'Đang giao việc...'}
            >
              {isEditing ? 'Lưu Thay Đổi Nhiệm Vụ' : 'Xác Nhận Giao Nhiệm Vụ'}
            </Button>
          </Can>
        </div>
      </form>
    </Modal>
  );
}

export default CreateTaskModal;
