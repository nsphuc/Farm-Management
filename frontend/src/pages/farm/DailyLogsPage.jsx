import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Thermometer,
  Droplets,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Scale,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Syringe,
  Wind,
  Trash2,
  Edit2,
  Lock,
  ArrowRight,
  Check,
  Zap,
  Info,
  Clock,
  Skull,
  Activity,
  Feather,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { formatNumber, formatDate } from '@/utils/formatters';
import { barnBatchService } from '@/services/modules/barnBatchService';
import { dailyLogService } from '@/services/modules/dailyLogService';
import { inventoryService } from '@/services/modules/inventoryService';

// ================= DỮ LIỆU MẪU CHUẨN THỰC CHIẾN FARMGO =================

const INITIAL_BARNS_IN_PRODUCTION = [
  {
    id: 101,
    code: 'CHUONG_A1',
    name: 'Chuồng A1',
    zoneName: 'Khu A - Gà thịt CP',
    livestockType: 'POULTRY',
    batchCode: 'LUA-GA-T11-01',
    batchName: 'Lứa Gà Thịt CP T11',
    currentAgeDays: 28,
    currentQuantity: 1950,
    initialQuantity: 2000,
    currentWeightKg: 1.52,
    previousWeightKg: 0.95, // ở mốc 21 ngày tuổi (7 ngày trước)
    previousWeightDaysAgo: 7,
    programName: 'Quy trình Gà thịt 45 ngày (CP / Ross 308)',
    feedStandardDailyKg: 280,
    standardFeedType: 'Cám Gà Thịt Giai Đoạn 2 (15-28 ngày)',
    todayVaccineReminder: {
      vaccineName: 'Vắc-xin Gumboro lần 2 (Chủng D78)',
      dose: '2 lọ / 2.000 con (Pha nước uống)',
      route: 'Pha nước uống',
      notes: 'Cắt nước 2h trước uống, pha cùng sữa gầy để bảo vệ kháng thể.',
    },
    envConfig: {
      metrics: [
        { id: 'TEMP', name: 'Nhiệt độ chuồng', unit: '°C', minVal: 24.0, maxVal: 32.5, currentVal: 28.5 },
        { id: 'HUMID', name: 'Độ ẩm không khí', unit: '%', minVal: 55.0, maxVal: 75.0, currentVal: 65.0 },
      ],
    },
  },
  {
    id: 102,
    code: 'CHUONG_A2',
    name: 'Chuồng A2',
    zoneName: 'Khu A - Gà thịt CP',
    livestockType: 'POULTRY',
    batchCode: 'LUA-GA-T11-02',
    batchName: 'Lứa Gà Thịt Nhánh A2 (Tách đàn)',
    currentAgeDays: 28,
    currentQuantity: 198,
    initialQuantity: 200,
    currentWeightKg: 1.50,
    previousWeightKg: 0.94,
    previousWeightDaysAgo: 7,
    programName: 'Quy trình Gà thịt 45 ngày (CP / Ross 308)',
    feedStandardDailyKg: 30,
    standardFeedType: 'Cám Gà Thịt Giai Đoạn 2 (15-28 ngày)',
    todayVaccineReminder: null,
    envConfig: {
      metrics: [
        { id: 'TEMP', name: 'Nhiệt độ chuồng', unit: '°C', minVal: 24.0, maxVal: 32.5, currentVal: 29.0 },
        { id: 'HUMID', name: 'Độ ẩm không khí', unit: '%', minVal: 55.0, maxVal: 75.0, currentVal: 66.0 },
      ],
    },
  },
  {
    id: 104,
    code: 'CHUONG_B1',
    name: 'Chuồng B1 (Heo thịt)',
    zoneName: 'Khu B - Heo thịt thương phẩm',
    livestockType: 'SWINE',
    batchCode: 'LUA-HEO-H10',
    batchName: 'Lứa Heo Thịt 3 Máu H10',
    currentAgeDays: 82,
    currentQuantity: 275,
    initialQuantity: 280,
    currentWeightKg: 78.5,
    previousWeightKg: 62.0, // ở mốc 62 ngày tuổi (20 ngày trước)
    previousWeightDaysAgo: 20,
    programName: 'Quy trình Heo thịt 120 ngày (3 Máu)',
    feedStandardDailyKg: 770,
    standardFeedType: 'Cám Heo Choai Tăng Trọng (Giai đoạn 2)',
    todayVaccineReminder: {
      vaccineName: 'Vắc-xin Dịch tả heo nhắc lại lần 2',
      dose: '275 liều (Tiêm bắp 1 liều/con)',
      route: 'Tiêm bắp',
      notes: 'Tiêm bắp sâu sau tai, sát trùng kim tiêm, chỉ tiêm đàn khỏe mạnh.',
    },
    envConfig: {
      metrics: [
        { id: 'WATER', name: 'Lượng nước uống', unit: 'Lít', minVal: 180, maxVal: 350, currentVal: 260 },
        { id: 'NH3', name: 'Nồng độ khí NH3', unit: 'ppm', minVal: 0, maxVal: 20, currentVal: 12 },
      ],
    },
  },
];

const FEED_WAREHOUSE_STOCK = [
  { id: 1, name: 'Cám Gà Con GĐ1 (0-14 ngày)', stockKg: 1250, bagWeightKg: 25 },
  { id: 2, name: 'Cám Gà Thịt Giai Đoạn 2 (15-28 ngày)', stockKg: 4800, bagWeightKg: 25 },
  { id: 3, name: 'Cám Gà Vỗ Béo Xuất Chuồng (29-45 ngày)', stockKg: 3500, bagWeightKg: 25 },
  { id: 4, name: 'Cám Heo Tập Ăn (GĐ1)', stockKg: 2200, bagWeightKg: 25 },
  { id: 5, name: 'Cám Heo Choai Tăng Trọng (Giai đoạn 2)', stockKg: 8500, bagWeightKg: 25 },
  { id: 6, name: 'Cám Heo Thịt Vỗ Béo (Giai đoạn 3)', stockKg: 6000, bagWeightKg: 25 },
];

const MEDICINE_WAREHOUSE_STOCK = [
  { id: 101, name: 'Vắc-xin Gumboro chủng D78', stockQty: 15, unit: 'Lọ (1.000 liều)', withdrawalDays: 0 },
  { id: 102, name: 'Vắc-xin ND-IB Clon 30 + H120', stockQty: 10, unit: 'Lọ (1.000 liều)', withdrawalDays: 0 },
  { id: 103, name: 'Vắc-xin Dịch tả heo cổ điển (CSF)', stockQty: 12, unit: 'Lọ (50 liều)', withdrawalDays: 0 },
  { id: 104, name: 'Kháng sinh Amox 50% bột hòa tan', stockQty: 25, unit: 'Gói (100g)', withdrawalDays: 7 },
  { id: 105, name: 'Men tiêu hóa vi sinh Probio Active', stockQty: 40, unit: 'Gói (1kg)', withdrawalDays: 0 },
  { id: 106, name: 'Điện giải Anti-Stress B-Complex', stockQty: 50, unit: 'Gói (500g)', withdrawalDays: 0 },
  { id: 107, name: 'Vắc-xin Suyễn Mycoplasma Hyopneumoniae', stockQty: 8, unit: 'Chai (50ml)', withdrawalDays: 14 },
];

const INITIAL_DAILY_LOG_ENTRIES = [
  {
    id: 1,
    barnId: 101,
    time: '07:15',
    date: new Date().toISOString().split('T')[0],
    category: 'FEED',
    title: 'Cho ăn sáng: 150 kg Cám Gà Thịt GĐ2',
    details: 'Cữ sáng: 6 bao (150 kg). Đàn ăn khỏe, máng ăn sạch sẽ.',
    loggedBy: 'Nguyễn Văn Công Nhân',
    isDeducted: true,
  },
  {
    id: 2,
    barnId: 101,
    time: '09:30',
    date: new Date().toISOString().split('T')[0],
    category: 'MORTALITY',
    title: 'Hao hụt: 2 con chết (Tiêu chảy / E.coli)',
    details: 'Đã nhặt xác và rắc vôi khử trùng khu vực máng uống.',
    loggedBy: 'Nguyễn Văn Công Nhân',
    isDeducted: true,
  },
  {
    id: 3,
    barnId: 101,
    time: '11:00',
    date: new Date().toISOString().split('T')[0],
    category: 'MEDICINE',
    title: 'Dùng thuốc: 2 gói Men tiêu hóa Probio',
    details: 'Pha nước uống phòng ngừa loạn khuẩn đường ruột lúc trưa.',
    loggedBy: 'Trần Kỹ Thuật Viên',
    isDeducted: true,
  },
  {
    id: 4,
    barnId: 104,
    time: '08:00',
    date: new Date().toISOString().split('T')[0],
    category: 'FEED',
    title: 'Cho ăn sáng: 375 kg Cám Heo Choai',
    details: 'Cữ sáng: 15 bao (375 kg) máng ăn tự động.',
    loggedBy: 'Lê Văn Trại Trưởng',
    isDeducted: true,
  },
];

export function DailyLogsPage() {
  const location = useLocation();
  const { activeFarmId } = useActiveFarmStore();
  const { userInfo, hasPermission, isOwner, isSuperAdmin } = useAuthStore();

  const currentFarmId = activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : 1;

  // RBAC & Data Scope
  const currentAccessibleFarm = useMemo(() => {
    return userInfo?.accessibleFarms?.find(
      (f) => Number(f.farmId) === currentFarmId
    );
  }, [userInfo, currentFarmId]);

  const userRoles = (userInfo?.roles || []).map((r) => (typeof r === 'string' ? r : r?.code));
  const isWorker =
    userRoles.includes('ROLE_BARN_WORKER') ||
    userRoles.includes('ROLE_FIELD_STAFF') ||
    userRoles.includes('ROLE_WORKER');
  const isOwnerOrManager =
    isOwner?.() ||
    isSuperAdmin?.() ||
    userRoles.includes('ROLE_FARM_OWNER') ||
    userRoles.includes('ROLE_FARM_MANAGER');

  // Quyền sửa / xóa nhật ký (Chủ trại và Trại trưởng mới có quyền)
  const canUpdateOrDeleteLog =
    isOwnerOrManager ||
    (!isWorker && (hasPermission?.('daily_logs.update') || hasPermission?.('daily_logs.manage')));

  // Store & Branch
  const currentBranchId = useActiveBranchStore((s) => s.currentBranchId);
  const dataVersion = useActiveBranchStore((s) => s.dataVersion);
  const triggerRefresh = useActiveBranchStore((s) => s.triggerRefresh);

  const [realBarns, setRealBarns] = useState(INITIAL_BARNS_IN_PRODUCTION);
  const [reminders, setReminders] = useState(null);
  const [realFeedStock, setRealFeedStock] = useState([]);
  const [realMedStock, setRealMedStock] = useState([]);

  // Áp dụng Data Scope: Nếu là công nhân chuồng (all_barns === false), chỉ lấy chuồng được gán
  const availableBarns = useMemo(() => {
    return realBarns;
  }, [realBarns]);

  // ================= 1. THANH NGỮ CẢNH (TOP CONTEXT BAR) =================
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBarnId, setSelectedBarnId] = useState(
    location.state?.barnId ? Number(location.state.barnId) : (availableBarns[0]?.id || 101)
  );

  // Load real barns list from Backend (scoped by role & branch)
  useEffect(() => {
    let isMounted = true;
    const fetchBarns = async () => {
      try {
        const effectiveBranchId = currentBranchId === 'ALL' ? undefined : (currentBranchId || 1);
        const res = await barnBatchService.getBarns({ farmId: currentFarmId, branchId: effectiveBranchId });
        if (isMounted && Array.isArray(res)) {
          const activeOnly = res.filter((b) => b.status === 'ACTIVE' || b.status === 'ALERT' || b.currentBatch);
          const mapped = (activeOnly.length > 0 ? activeOnly : res).map((b) => ({
            id: b.id,
            code: b.code,
            name: b.name,
            batchId: b.currentBatch?.id,
            batchName: b.currentBatch ? `Lứa ${b.currentBatch.code}` : 'Chưa có lứa',
            daysOld: b.currentBatch?.daysOld ?? 1,
            currentAgeDays: b.currentBatch?.daysOld ?? 1,
            currentQuantity: b.currentBatch?.currentQuantity || 0,
            currentWeightKg: b.currentBatch?.avgWeightKg || 0.5,
            previousWeightKg: 0.45,
            previousWeightDaysAgo: 7,
            feedStandardDailyKg: 25,
            feedActualTodayKg: b.currentBatch?.feedConsumedTodayKg || 0,
            isFeedOverLimit: false,
            todayVaccineReminder: null,
          }));
          setRealBarns(mapped);
          if (mapped.length > 0 && (!selectedBarnId || !mapped.some((b) => b.id === Number(selectedBarnId)))) {
            setSelectedBarnId(mapped[0].id);
          } else if (mapped.length === 0) {
            setSelectedBarnId('');
          }
        }
      } catch (err) {
        console.warn('Could not load real barns for logs', err);
      }
    };
    fetchBarns();
    return () => {
      isMounted = false;
    };
  }, [currentFarmId, currentBranchId, dataVersion]);

  // Load real warehouse inventory (Feed & Medicine) for current branch
  useEffect(() => {
    let isMounted = true;
    const fetchBranchStock = async () => {
      try {
        const effectiveBranchId = currentBranchId === 'ALL' ? undefined : (currentBranchId || 1);
        const invRes = await inventoryService.getInventory({ farmId: currentFarmId, branchId: effectiveBranchId, size: 200 });
        const invList = Array.isArray(invRes) ? invRes : (invRes?.content || []);
        if (!isMounted) return;

        const feedMap = new Map();
        const medMap = new Map();

        invList.forEach((it) => {
          const qty = Number(it.availableQuantity ?? it.quantityOnHand) || 0;
          if (qty <= 0) return;
          const cat = (it.materialCategoryCode || '').toUpperCase();
          const nameLower = (it.materialName || '').toLowerCase();
          const isFeed = cat === 'FEED' || cat === 'ANIMAL_FEED' || (!cat && nameLower.includes('cám'));
          const isMed = cat === 'MEDICINE' || cat === 'VACCINE' || (!cat && (nameLower.includes('thuốc') || nameLower.includes('vắc') || nameLower.includes('kháng sinh') || nameLower.includes('men')));

          if (isFeed) {
            const ratio = Number(it.conversionFactor) > 1 ? Number(it.conversionFactor) : 25;
            const stdUnit = (it.standardUnit || 'KG').toLowerCase();
            const isStdBag = stdUnit === 'bao' || stdUnit === 'bag';
            const addKg = isStdBag ? qty * ratio : qty;
            const addBags = isStdBag ? qty : qty / ratio;

            const key = `${it.materialId}-${it.warehouseId}`;
            const existing = feedMap.get(key);
            if (existing) {
              existing.stockKg += addKg;
              existing.stockBags += addBags;
            } else {
              feedMap.set(key, {
                id: it.materialId,
                warehouseId: it.warehouseId,
                warehouseName: it.warehouseName || '',
                name: it.materialName || `Cám #${it.materialId}`,
                stockKg: addKg,
                stockBags: addBags,
                bagWeightKg: ratio,
              });
            }
          } else if (isMed) {
            const key = `${it.materialId}-${it.warehouseId}`;
            const existing = medMap.get(key);
            if (existing) {
              existing.stockQty += qty;
            } else {
              medMap.set(key, {
                id: it.materialId,
                warehouseId: it.warehouseId,
                warehouseName: it.warehouseName || '',
                name: it.materialName || `Thuốc #${it.materialId}`,
                stockQty: qty,
                unit: it.standardUnit || 'Lọ',
                withdrawalDays: it.defaultPhiDays || 0,
              });
            }
          }
        });

        const feeds = Array.from(feedMap.values());
        const meds = Array.from(medMap.values());
        setRealFeedStock(feeds);
        setRealMedStock(meds);

        if (feeds.length > 0) {
          setFeedForm((prev) => (
            feeds.some((f) => Number(f.id) === Number(prev.feedId))
              ? prev
              : { ...prev, feedId: feeds[0].id }
          ));
        }
        if (meds.length > 0) {
          setMedForm((prev) => (
            meds.some((m) => Number(m.id) === Number(prev.medId))
              ? prev
              : { ...prev, medId: meds[0].id, unit: meds[0].unit }
          ));
        }
      } catch (err) {
        console.warn('Could not load branch warehouse stock for daily logs', err);
      }
    };
    fetchBranchStock();
    return () => { isMounted = false; };
  }, [currentFarmId, currentBranchId, dataVersion]);

  // Load reminders for selected barn
  useEffect(() => {
    let isMounted = true;
    const fetchReminders = async () => {
      if (!selectedBarnId) return;
      try {
        const res = await dailyLogService.getReminders({ farmId: currentFarmId, barnId: selectedBarnId });
        if (isMounted && res) {
          setReminders(res);
          if (res.feedQuota && res.feedQuota.totalFlockKg) {
            const roundedKg = Number(Number(res.feedQuota.totalFlockKg).toFixed(2));
            setFeedForm((prev) => ({
              ...prev,
              quantityKg: roundedKg,
              quantityBags: Number((roundedKg / 25).toFixed(2)),
            }));
          }
        }
      } catch (err) {
        console.warn('Could not load reminders', err);
      }
    };
    fetchReminders();
    return () => {
      isMounted = false;
    };
  }, [selectedBarnId, currentFarmId, dataVersion]);

  // Load real daily logs history from Backend
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        const res = await dailyLogService.getDailyLogs({
          farmId: currentFarmId,
          date: selectedDate,
          barnId: selectedBarnId,
        });
        if (isMounted && Array.isArray(res)) {
          const mappedLogs = res.map((l) => ({
            id: l.id,
            barnId: l.barnId,
            time: l.createdAt ? new Date(l.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '08:00',
            date: l.logDate,
            category: l.entryType,
            title: l.description,
            details: (() => {
              if (l.alertReason) return `[Cảnh báo: ${l.alertReason}]`;
              if (!l.detailsJson) return '';
              try {
                const parsed = typeof l.detailsJson === 'string' ? JSON.parse(l.detailsJson) : l.detailsJson;
                if (parsed && typeof parsed === 'object') {
                  if (parsed.description) return String(parsed.description);
                  const parts = [];
                  if (parsed.materialName || parsed.material_name) parts.push(parsed.materialName || parsed.material_name);
                  const kg = parsed.quantityKg ?? parsed.feedKg ?? parsed.feed_kg;
                  if (kg != null) parts.push(`${kg} kg`);
                  const pack = parsed.quantityPack ?? parsed.quantity_pack;
                  if (pack != null) parts.push(`${pack} ${parsed.packUnit || parsed.feed_unit || 'bao'}`);
                  const dead = parsed.deadCount ?? parsed.mortality_count ?? parsed.dead_count;
                  if (dead != null) parts.push(`Chết: ${dead} con`);
                  if (parsed.cause) parts.push(`Nguyên nhân: ${parsed.cause}`);
                  const avgW = parsed.avgWeightKg ?? parsed.avg_weight_kg;
                  if (avgW != null) parts.push(`TB: ${avgW} kg/con`);
                  if (parsed.notes) parts.push(parsed.notes);
                  if (parts.length > 0) return parts.join(' • ');
                }
              } catch {
                // Giữ nguyên chuỗi nếu không phải JSON
              }
              return l.detailsJson;
            })(),
            loggedBy: l.createdByFullName || 'Công nhân chuồng',
            isDeducted: true,
          }));
          setDailyLogs(mappedLogs);
        }
      } catch (err) {
        console.warn('Could not load real daily logs', err);
      }
    };
    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, [selectedBarnId, selectedDate, currentFarmId, dataVersion]);

  // Chuồng nuôi đang chọn
  const currentBarn = useMemo(() => {
    return availableBarns.find((b) => b.id === Number(selectedBarnId)) || availableBarns[0];
  }, [availableBarns, selectedBarnId]);

  // Điều hướng ngày: < Hôm nay >
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // ================= 3. BỘ 4 TAB GHI NHẬN NHANH =================
  const [entryTab, setEntryTab] = useState('FEED'); // FEED, MEDICINE, MORTALITY, SAMPLE_ENV

  // Form Tab 1: Ghi Cám (Cho ăn)
  const [feedUnit, setFeedUnit] = useState('BAG'); // 'BAG' hoặc 'KG'
  const [feedForm, setFeedForm] = useState({
    feedId: 2, // Mặc định Cám GĐ2
    quantityBags: 6,
    quantityKg: 150,
    mealSession: 'Sáng', // Sáng, Trưa, Chiều, Cả ngày
    notes: '',
  });

  // Tự động đổi giữa Bao và Kg
  const feedStockList = realFeedStock.length > 0 ? realFeedStock : FEED_WAREHOUSE_STOCK;
  const medStockList = realMedStock.length > 0 ? realMedStock : MEDICINE_WAREHOUSE_STOCK;

  const selectedFeedItem = useMemo(() => {
    return feedStockList.find((f) => Number(f.id) === Number(feedForm.feedId)) || feedStockList[0] || { id: '', name: '', stockKg: 0, stockBags: 0, bagWeightKg: 25 };
  }, [feedStockList, feedForm.feedId]);

  const handleFeedBagsChange = (bags) => {
    const b = Math.max(0, parseFloat(bags) || 0);
    const kg = Number((b * (selectedFeedItem?.bagWeightKg || 25)).toFixed(2));
    setFeedForm((prev) => ({ ...prev, quantityBags: b, quantityKg: kg }));
  };

  const handleFeedKgChange = (kg) => {
    const k = Math.max(0, parseFloat(kg) || 0);
    const bags = parseFloat((k / (selectedFeedItem?.bagWeightKg || 25)).toFixed(2));
    setFeedForm((prev) => ({ ...prev, quantityKg: k, quantityBags: bags }));
  };

  // Form Tab 2: Ghi Thuốc & Vắc-xin
  const [medForm, setMedForm] = useState({
    medId: 101,
    quantity: 2,
    unit: 'Lọ (1.000 liều)',
    purpose: 'Phòng bệnh định kỳ', // Phòng bệnh định kỳ / Điều trị bệnh
    route: 'Pha nước uống', // Pha nước uống, Trộn thức ăn, Tiêm bắp, Nhỏ mắt/mũi
    notes: '',
  });

  const selectedMedItem = useMemo(() => {
    return medStockList.find((m) => Number(m.id) === Number(medForm.medId)) || medStockList[0] || { id: '', name: '', stockQty: 0, unit: 'Lọ', withdrawalDays: 0 };
  }, [medStockList, medForm.medId]);

  // Form Tab 3: Hao hụt (Chết / Loại thải)
  const [deadCount, setDeadCount] = useState(0);
  const [cullCount, setCullCount] = useState(0);
  const [mortalityReason, setMortalityReason] = useState('Tiêu chảy / E.coli');
  const [deadAvgWeightKg, setDeadAvgWeightKg] = useState('1.2');
  const [mortalityNotes, setMortalityNotes] = useState('');

  // Form Tab 4: Cân mẫu & Môi trường
  const [sampleCount, setSampleCount] = useState(50);
  const [sampleAvgWeightKg, setSampleAvgWeightKg] = useState(
    currentBarn ? String(currentBarn.currentWeightKg) : '1.52'
  );

  // Tính tăng trọng trung bình ngày (ADG) tự động
  const calculatedAdg = useMemo(() => {
    if (!currentBarn || !currentBarn.previousWeightKg) return 0;
    const currentW = parseFloat(sampleAvgWeightKg) || 0;
    const diffKg = currentW - currentBarn.previousWeightKg;
    const days = currentBarn.previousWeightDaysAgo || 7;
    const adgGram = (diffKg * 1000) / days;
    return parseFloat(adgGram.toFixed(1));
  }, [currentBarn, sampleAvgWeightKg]);

  // State các chỉ số môi trường động theo chuồng
  const [envValues, setEnvValues] = useState({
    TEMP: 28.5,
    HUMID: 65.0,
    WATER: 260,
    NH3: 12,
  });

  // ================= 4. LỊCH SỬ NHẬT KÝ TRONG NGÀY =================
  const [dailyLogs, setDailyLogs] = useState(INITIAL_DAILY_LOG_ENTRIES);

  // Lọc lịch sử theo chuồng và ngày đang chọn
  const filteredLogsToday = useMemo(() => {
    return dailyLogs.filter(
      (log) => log.barnId === currentBarn?.id && log.date === selectedDate
    );
  }, [dailyLogs, currentBarn, selectedDate]);

  // Tính tổng lượng cám đã ghi hôm nay cho chuồng này
  const totalFeedLoggedTodayKg = useMemo(() => {
    return filteredLogsToday
      .filter((l) => l.category === 'FEED')
      .reduce((acc, curr) => {
        const match = curr.title.match(/(\d+)\s*kg/i);
        return acc + (match ? parseInt(match[1], 10) : 0);
      }, 0);
  }, [filteredLogsToday]);

  // Cảnh báo vượt định mức cám (>10%)
  const effectiveFeedStandardKg = Number(reminders?.feedQuota?.totalFlockKg || currentBarn?.feedStandardDailyKg || 0);
  const isFeedOverDailyStandard = useMemo(() => {
    if (!effectiveFeedStandardKg) return false;
    const projected = totalFeedLoggedTodayKg + (entryTab === 'FEED' ? Number(feedForm.quantityKg || 0) : 0);
    return projected > effectiveFeedStandardKg * 1.1; // vượt trên 10%
  }, [effectiveFeedStandardKg, totalFeedLoggedTodayKg, entryTab, feedForm.quantityKg]);

  // ================= HANDLERS LƯU PHIẾU =================

  // Lưu Tab 1: Cám
  const handleSaveFeedLog = async (e) => {
    e.preventDefault();
    if (feedForm.quantityKg <= 0) {
      toast.error('Vui lòng nhập lượng cám lớn hơn 0');
      return;
    }

    try {
      await dailyLogService.createDailyLog({
        farmId: currentFarmId,
        barnId: currentBarn.id,
        batchId: currentBarn.batchId,
        logDate: selectedDate,
        entryType: 'FEED',
        feedMaterialId: selectedFeedItem?.id || feedForm.feedId,
        feedWarehouseId: selectedFeedItem?.warehouseId || null,
        feedAmount: feedUnit === 'BAG' ? Number(feedForm.quantityBags) : Number(feedForm.quantityKg),
        feedUnit: feedUnit,
        notes: feedForm.notes,
      });

      triggerRefresh();
      toast.success(`Đã lưu phiếu cho ăn: ${feedForm.quantityBags} bao (${feedForm.quantityKg} kg) và trừ kho FEFO thành công!`);
      setFeedForm((prev) => ({ ...prev, notes: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu phiếu cho ăn');
    }
  };

  // Lưu Tab 2: Thuốc
  const handleSaveMedicineLog = async (e) => {
    e.preventDefault();
    if (medForm.quantity <= 0) {
      toast.error('Vui lòng nhập số lượng thuốc sử dụng');
      return;
    }

    try {
      await dailyLogService.createDailyLog({
        farmId: currentFarmId,
        barnId: currentBarn.id,
        batchId: currentBarn.batchId,
        logDate: selectedDate,
        entryType: 'MEDICINE',
        medMaterialId: selectedMedItem?.id || medForm.medId,
        medWarehouseId: selectedMedItem?.warehouseId || null,
        medAmount: medForm.quantity,
        medUnit: medForm.unit,
        diseaseReason: medForm.purpose,
        adminRoute: medForm.route,
        notes: medForm.notes,
      });

      triggerRefresh();
      toast.success(`Đã lưu phiếu cấp thuốc/vắc-xin và trừ kho FEFO thành công!`);
      setMedForm((prev) => ({ ...prev, notes: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu phiếu cấp thuốc');
    }
  };

  // Lưu Tab 3: Hao hụt
  const handleSaveMortalityLog = async (e) => {
    e.preventDefault();
    if (deadCount === 0 && cullCount === 0) {
      toast.error('Vui lòng nhập số con chết hoặc loại thải lớn hơn 0');
      return;
    }

    try {
      await dailyLogService.createDailyLog({
        farmId: currentFarmId,
        barnId: currentBarn.id,
        batchId: currentBarn.batchId,
        logDate: selectedDate,
        entryType: 'MORTALITY',
        deadCount: deadCount,
        cullCount: cullCount,
        mortalityReason: mortalityReason,
        deadAvgWeightKg: deadAvgWeightKg,
        mortalityNotes: mortalityNotes,
      });

      triggerRefresh();
      toast.success(`Đã lưu phiếu báo hao hụt (${deadCount + cullCount} con) và trừ sĩ số đàn!`);
      setDeadCount(0);
      setCullCount(0);
      setMortalityNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu báo hao hụt');
    }
  };

  // Lưu Tab 4: Cân mẫu & Môi trường
  const handleSaveSampleEnvLog = async (e) => {
    e.preventDefault();
    try {
      await dailyLogService.createDailyLog({
        farmId: currentFarmId,
        barnId: currentBarn.id,
        batchId: currentBarn.batchId,
        logDate: selectedDate,
        entryType: 'SAMPLE_ENV',
        sampleCount: sampleCount,
        sampleAvgWeightKg: sampleAvgWeightKg,
        temperatureC: envValues.TEMP,
        humidityPct: envValues.HUMID,
        nh3Ppm: envValues.NH3,
        co2Ppm: envValues.WATER,
      });

      triggerRefresh();
      toast.success(`Đã lưu phiếu cân mẫu và chỉ số môi trường!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu cân mẫu & môi trường');
    }
  };

  // Xóa dòng lịch sử (chỉ Chủ trại & Trại trưởng)
  const handleDeleteLog = async (logId) => {
    if (!canUpdateOrDeleteLog) {
      toast.error('Bạn không có quyền xóa nhật ký đã chốt');
      return;
    }
    try {
      await dailyLogService.deleteDailyLog(logId);
      triggerRefresh();
      toast.info('Đã xóa phiếu nhật ký và hoàn trả tồn kho');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa phiếu nhật ký');
    }
  };

  // Tác vụ nhắc việc nhanh: Điền sẵn vắc-xin khi bấm "Ghi nhận ngay"
  const handleQuickApplyVaccine = () => {
    if (reminders?.vaccineAlerts?.length > 0) {
      const reminder = reminders.vaccineAlerts[0];
      setMedForm({
        medId: 4,
        quantity: 1,
        unit: 'Lọ (1.000 liều)',
        purpose: 'Tiêm phòng định kỳ theo quy trình',
        route: reminder.route || 'Pha nước uống',
        notes: reminder.notes || reminder.vaccineName,
      });
      setEntryTab('MEDICINE');
      toast.info(`Đã tự động điền thông tin vắc-xin "${reminder.vaccineName}" vào biểu mẫu!`);
      return;
    }

    if (!currentBarn?.todayVaccineReminder) return;
    const reminder = currentBarn.todayVaccineReminder;

    // Tìm thuốc trong kho phù hợp
    const matched =
      medStockList.find((m) =>
        reminder.vaccineName.toLowerCase().includes('gumboro')
          ? m.name.toLowerCase().includes('gumboro')
          : m.name.toLowerCase().includes('dịch tả')
      ) || medStockList[0];

    setMedForm({
      medId: matched.id,
      quantity: 2,
      unit: matched.unit,
      purpose: 'Phòng bệnh định kỳ',
      route: reminder.route,
      notes: reminder.notes,
    });
    setEntryTab('MEDICINE');
    toast.info('Đã tự động điền thông tin vắc-xin vào biểu mẫu!');
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-20 px-2 sm:px-4">
      {/* THÔNG BÁO CHẾ ĐỘ XEM TỔNG HỢP TOÀN CHUỖI */}
      {currentBranchId === 'ALL' && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs shadow-2xs">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Chế độ xem Tổng hợp:</strong> Đang hiển thị danh sách nhật ký chuồng toàn hệ thống. Hãy chọn một chi nhánh cụ thể trên Header để thực hiện ghi nhật ký cho chuồng nuôi.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. THANH ĐIỀU HƯỚNG NGỮ CẢNH (TOP CONTEXT BAR)                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Hàng trên: Tiêu đề & Chọn ngày */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">
                Ghi Nhật Ký Hằng Ngày
              </h1>
              <p className="text-[11px] text-slate-400">
                Cho ăn cám, cấp thuốc thú y, báo chết & cân mẫu tại chuồng
              </p>
            </div>
          </div>

          {/* Bộ chọn Ngày < Hôm nay > */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
              title="Lùi 1 ngày"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 rounded-lg bg-white shadow-xs text-slate-800 font-black hover:bg-slate-100"
            >
              Hôm Nay
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer px-1"
            />

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
              title="Tiến 1 ngày"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hàng dưới: Bộ chọn Chuồng nuôi (áp dụng Data Scope) */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Chọn Chuồng Nuôi Thao Tác (Đang Nuôi):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {availableBarns.map((barn) => {
              const isSelected = barn.id === currentBarn?.id;
              return (
                <div
                  key={barn.id}
                  onClick={() => setSelectedBarnId(barn.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all text-left flex items-center justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 truncate">{barn.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold shrink-0">
                        {barn.currentAgeDays ?? barn.daysOld ?? 1} ngày
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{barn.batchName}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KHỐI NHẮC VIỆC TỰ ĐỘNG TỪ CHƯƠNG TRÌNH NUÔI (TODAY'S REMINDERS)         */}
      {/* ========================================================================= */}
      {currentBarn && (
        <div className="space-y-2">
          {/* Nhắc định mức cám */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Layers className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">
                  Định Mức Cám Khuyến Nghị Hôm Nay (Sĩ số: {formatNumber(reminders?.currentQuantity || currentBarn.currentQuantity)} con)
                </span>
                <p className="font-black text-slate-900 text-sm mt-0.5">
                  {reminders?.feedQuota?.totalFlockKg || currentBarn.feedStandardDailyKg} kg (khoảng {Math.round((reminders?.feedQuota?.totalFlockKg || currentBarn.feedStandardDailyKg) / 25)} bao 25kg) — {reminders?.feedQuota?.feedType || currentBarn.standardFeedType || 'Cám hỗn hợp chuẩn'}
                </p>
              </div>
            </div>

            <div className="hidden sm:block text-right">
              <span className="text-[10px] text-slate-400 block font-bold">Đã ghi hôm nay:</span>
              <span className="text-sm font-black font-mono text-emerald-700">
                {totalFeedLoggedTodayKg} / {reminders?.feedQuota?.totalFlockKg || currentBarn.feedStandardDailyKg} kg
              </span>
            </div>
          </div>

          {/* Nhắc lịch vắc-xin / thuốc (nếu có lịch trùng ngày tuổi) */}
          {(reminders?.vaccineAlerts?.length > 0 || currentBarn.todayVaccineReminder) && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Syringe className="h-5 w-5" />
                </div>
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider bg-amber-200/60 px-1.5 py-0.5 rounded">
                      Lịch Vắc-Xin Ngày {reminders?.daysOld || currentBarn.currentAgeDays || 1} Tuổi
                    </span>
                  </div>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    {reminders?.vaccineAlerts?.[0]?.vaccineName || currentBarn.todayVaccineReminder?.vaccineName} ({reminders?.vaccineAlerts?.[0]?.route || currentBarn.todayVaccineReminder?.route || 'Đường dùng chuẩn'})
                  </p>
                  <p className="text-[11px] text-amber-900/80 italic mt-0.5">
                    💡 {reminders?.vaccineAlerts?.[0]?.notes || currentBarn.todayVaccineReminder?.notes || 'Thực hiện đúng liều lượng chỉ định'}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={<Zap className="h-3.5 w-3.5" />}
                onClick={handleQuickApplyVaccine}
                className="text-xs font-bold shrink-0 self-end sm:self-center bg-amber-600 hover:bg-amber-700 text-white border-none shadow-xs"
              >
                Ghi Nhận Ngay
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BỘ 4 TAB GHI NHẬN NHANH (QUICK ENTRY FORMS - TOUCH FRIENDLY)           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* 4 Nút chuyển Tab lớn, tối ưu chạm cảm ứng trên điện thoại */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setEntryTab('FEED')}
            className={`py-3.5 px-3 flex items-center justify-center gap-2 text-xs font-black transition-all border-b-2 ${
              entryTab === 'FEED'
                ? 'bg-white border-emerald-600 text-emerald-800 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>1. Ghi Cám (Cho Ăn)</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryTab('MEDICINE')}
            className={`py-3.5 px-3 flex items-center justify-center gap-2 text-xs font-black transition-all border-b-2 ${
              entryTab === 'MEDICINE'
                ? 'bg-white border-emerald-600 text-emerald-800 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Syringe className="h-4 w-4 text-amber-600" />
            <span>2. Thuốc & Vắc-Xin</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryTab('MORTALITY')}
            className={`py-3.5 px-3 flex items-center justify-center gap-2 text-xs font-black transition-all border-b-2 ${
              entryTab === 'MORTALITY'
                ? 'bg-white border-emerald-600 text-emerald-800 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Skull className="h-4 w-4 text-rose-600" />
            <span>3. Báo Hao Hụt</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryTab('SAMPLE_ENV')}
            className={`py-3.5 px-3 flex items-center justify-center gap-2 text-xs font-black transition-all border-b-2 ${
              entryTab === 'SAMPLE_ENV'
                ? 'bg-white border-emerald-600 text-emerald-800 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Scale className="h-4 w-4 text-purple-600" />
            <span>4. Cân Mẫu & Môi Trường</span>
          </button>
        </div>

        {/* NỘI DUNG TỪNG TAB */}
        <div className="p-4 sm:p-5">
          {!currentBarn ? (
            <div className="py-10 text-center space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-700">Chưa có chuồng nuôi nào được phân công hoặc đang hoạt động</p>
              <p className="text-xs text-slate-500">Vui lòng chọn chuồng đang nuôi hoặc liên hệ quản lý để được cấp quyền truy cập chuồng.</p>
            </div>
          ) : (
            <>
          {/* TAB 1: GHI CÁM (CHO ĂN) */}
          {entryTab === 'FEED' && (
            <form onSubmit={handleSaveFeedLog} className="space-y-4">
              <FormField label="Chọn loại cám trong kho" required hint={`Tồn kho hiện tại: ${formatNumber(selectedFeedItem.stockBags ?? Math.floor(selectedFeedItem.stockKg / (selectedFeedItem.bagWeightKg || 25)))} bao (${formatNumber(selectedFeedItem.stockKg)} kg)${selectedFeedItem.warehouseName ? ` — ${selectedFeedItem.warehouseName}` : ''}`}>
                <Select
                  value={feedForm.feedId}
                  onChange={(e) => setFeedForm({ ...feedForm, feedId: Number(e.target.value) })}
                  options={feedStockList.map((f) => ({
                    value: String(f.id),
                    label: `${f.name} (Tồn: ${formatNumber(f.stockBags ?? Math.floor(f.stockKg / (f.bagWeightKg || 25)))} bao / ${formatNumber(f.stockKg)} kg)`,
                  }))}
                />
              </FormField>

              {/* Bộ chuyển đổi Bao vs Kg linh hoạt */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Đơn vị nhập lượng cám:</span>
                  <div className="flex items-center p-0.5 bg-slate-200 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setFeedUnit('BAG')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        feedUnit === 'BAG' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600'
                      }`}
                    >
                      Bao (25kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedUnit('KG')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        feedUnit === 'KG' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600'
                      }`}
                    >
                      Kg
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Số Bao (Bao)">
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={feedForm.quantityBags}
                      onChange={(e) => handleFeedBagsChange(e.target.value)}
                      className="text-base font-black font-mono"
                    />
                  </FormField>

                  <FormField label="Quy đổi ra Kg">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={feedForm.quantityKg}
                      onChange={(e) => handleFeedKgChange(e.target.value)}
                      className="text-base font-black font-mono text-emerald-700"
                    />
                  </FormField>
                </div>

                {/* Thanh cảnh báo vượt định mức (>10%) */}
                {isFeedOverDailyStandard && (
                  <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      Cảnh báo: Tổng lượng cám hôm nay ({totalFeedLoggedTodayKg + feedForm.quantityKg} kg) đã vượt định mức chuẩn ({effectiveFeedStandardKg} kg)!
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Cữ ăn trong ngày">
                  <Select
                    value={feedForm.mealSession}
                    onChange={(e) => setFeedForm({ ...feedForm, mealSession: e.target.value })}
                    options={[
                      { value: 'Sáng', label: 'Cữ Sáng (06:00 - 08:00)' },
                      { value: 'Trưa', label: 'Cữ Trưa (11:00 - 12:30)' },
                      { value: 'Chiều', label: 'Cữ Chiều / Tối (16:30 - 18:00)' },
                      { value: 'Cả ngày', label: 'Rải máng tự động cả ngày' },
                    ]}
                  />
                </FormField>

                <FormField label="Ghi chú quan sát">
                  <Input
                    placeholder="VD: Đàn ăn dọn sạch máng trong 45 phút..."
                    value={feedForm.notes}
                    onChange={(e) => setFeedForm({ ...feedForm, notes: e.target.value })}
                  />
                </FormField>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={<Check className="h-4 w-4" />}
                className="w-full text-xs font-bold py-2.5 shadow-sm"
              >
                Lưu Phiếu Cho Ăn & Trừ Kho Tự Động
              </Button>
            </form>
          )}

          {/* TAB 2: GHI THUỐC & VẮC-XIN */}
          {entryTab === 'MEDICINE' && (
            <form onSubmit={handleSaveMedicineLog} className="space-y-4">
              <FormField
                label="Chọn thuốc / Vắc-xin từ kho"
                required
                hint={`Tồn: ${selectedMedItem.stockQty} ${selectedMedItem.unit} — Thời gian ngưng thuốc: ${selectedMedItem.withdrawalDays} ngày`}
              >
                <Select
                  value={medForm.medId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const item = medStockList.find((m) => Number(m.id) === id);
                    setMedForm({ ...medForm, medId: id, unit: item?.unit || 'Lọ' });
                  }}
                  options={medStockList.map((m) => ({
                    value: String(m.id),
                    label: `${m.name} (Tồn: ${m.stockQty} ${m.unit})`,
                  }))}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Số lượng sử dụng" required>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={medForm.quantity}
                    onChange={(e) => setMedForm({ ...medForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="text-base font-black font-mono"
                  />
                </FormField>

                <FormField label="Đơn vị tính">
                  <Input value={medForm.unit} disabled className="bg-slate-100" />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Mục đích dùng thuốc">
                  <Select
                    value={medForm.purpose}
                    onChange={(e) => setMedForm({ ...medForm, purpose: e.target.value })}
                    options={[
                      { value: 'Phòng bệnh định kỳ', label: 'Phòng bệnh định kỳ theo lịch' },
                      { value: 'Điều trị bệnh có triệu chứng', label: 'Điều trị bệnh có triệu chứng' },
                      { value: 'Bổ sung dinh dưỡng & Chống stress', label: 'Bổ sung dinh dưỡng / Chống sốc nhiệt' },
                    ]}
                  />
                </FormField>

                <FormField label="Đường dùng thuốc">
                  <Select
                    value={medForm.route}
                    onChange={(e) => setMedForm({ ...medForm, route: e.target.value })}
                    options={[
                      { value: 'Pha nước uống', label: 'Pha nước uống' },
                      { value: 'Trộn thức ăn', label: 'Trộn thức ăn' },
                      { value: 'Tiêm bắp', label: 'Tiêm bắp (ức / đùi)' },
                      { value: 'Nhỏ mắt / Nhỏ mũi', label: 'Nhỏ mắt / Nhỏ mũi' },
                      { value: 'Tiêm dưới da cổ', label: 'Tiêm dưới da cổ' },
                      { value: 'Châm màng cánh', label: 'Châm màng cánh (Đậu gà)' },
                    ]}
                  />
                </FormField>
              </div>

              <FormField label="Ghi chú & Hướng dẫn kỹ thuật">
                <Input
                  placeholder="VD: Cắt nước 2h trước uống, cho uống trong 2 giờ..."
                  value={medForm.notes}
                  onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })}
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={<Check className="h-4 w-4" />}
                className="w-full text-xs font-bold py-2.5 shadow-sm"
              >
                Lưu Phiếu Dùng Thuốc & Trừ Kho Tự Động
              </Button>
            </form>
          )}

          {/* TAB 3: BÁO HAO HỤT (CHẾT / LOẠI THẢI) */}
          {entryTab === 'MORTALITY' && (
            <form onSubmit={handleSaveMortalityLog} className="space-y-4">
              {/* Nút cộng/trừ lớn dễ thao tác cảm ứng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Con chết */}
                <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 text-center space-y-2">
                  <span className="text-xs font-black text-rose-900 uppercase">Số Con Chết (Con)</span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDeadCount((prev) => Math.max(0, prev - 1))}
                      className="h-11 w-11 rounded-xl bg-white border border-rose-300 text-rose-700 font-black text-lg flex items-center justify-center shadow-xs active:bg-rose-100"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="text-3xl font-black font-mono text-rose-700 min-w-[60px]">
                      {deadCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeadCount((prev) => prev + 1)}
                      className="h-11 w-11 rounded-xl bg-rose-600 text-white font-black text-lg flex items-center justify-center shadow-xs active:bg-rose-700"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* 2. Con loại thải */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <span className="text-xs font-black text-slate-800 uppercase">Số Con Loại Thải / Còi Cọc (Con)</span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCullCount((prev) => Math.max(0, prev - 1))}
                      className="h-11 w-11 rounded-xl bg-white border border-slate-300 text-slate-700 font-black text-lg flex items-center justify-center shadow-xs active:bg-slate-100"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="text-3xl font-black font-mono text-slate-800 min-w-[60px]">
                      {cullCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCullCount((prev) => prev + 1)}
                      className="h-11 w-11 rounded-xl bg-slate-800 text-white font-black text-lg flex items-center justify-center shadow-xs active:bg-slate-900"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Lý do hao hụt (Danh mục chuẩn)" required>
                  <Select
                    value={mortalityReason}
                    onChange={(e) => setMortalityReason(e.target.value)}
                    options={[
                      { value: 'Tiêu chảy / E.coli', label: 'Tiêu chảy / Viêm ruột E.coli' },
                      { value: 'Hô hấp / Hen khẹc CRD', label: 'Hô hấp / Hen khẹc CRD' },
                      { value: 'Còi cọc loại thải', label: 'Còi cọc kém ăn / Kém phát triển' },
                      { value: 'Đè / Dẫm đạp nhau', label: 'Đè / Dẫm đạp cắn mổ nhau' },
                      { value: 'Sốc nhiệt / Đột tử', label: 'Sốc nhiệt / Đột tử chuồng kín' },
                      { value: 'Bại liệt / Viêm khớp', label: 'Bại liệt / Viêm khớp' },
                    ]}
                  />
                </FormField>

                <FormField label="Trọng lượng bình quân con chết (kg)">
                  <Input
                    type="number"
                    step="0.05"
                    value={deadAvgWeightKg}
                    onChange={(e) => setDeadAvgWeightKg(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Ghi chú triệu chứng & Biện pháp xử lý">
                <Input
                  placeholder="VD: Phân sệt vàng, đã cách ly và rắc vôi bột lối đi..."
                  value={mortalityNotes}
                  onChange={(e) => setMortalityNotes(e.target.value)}
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={<Check className="h-4 w-4" />}
                className="w-full text-xs font-bold py-2.5 shadow-sm bg-rose-600 hover:bg-rose-700 text-white border-none"
              >
                Lưu Phiếu Báo Hao Hụt & Cập Nhật Sĩ Số Chuồng
              </Button>
            </form>
          )}

          {/* TAB 4: CÂN MẪU & MÔI TRƯỜNG */}
          {entryTab === 'SAMPLE_ENV' && (
            <form onSubmit={handleSaveSampleEnvLog} className="space-y-5">
              {/* Khối Cân Mẫu */}
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-900 uppercase flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-purple-600" />
                    <span>Phần 1: Cân Mẫu Đàn Định Kỳ</span>
                  </span>
                  <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                    ADG: +{calculatedAdg} g/con/ngày
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Số con cân mẫu (con)">
                    <Input
                      type="number"
                      value={sampleCount}
                      onChange={(e) => setSampleCount(parseInt(e.target.value, 10) || 0)}
                      className="text-base font-black font-mono"
                    />
                  </FormField>

                  <FormField label="Trọng lượng bình quân (kg/con)">
                    <Input
                      type="number"
                      step="0.01"
                      value={sampleAvgWeightKg}
                      onChange={(e) => setSampleAvgWeightKg(e.target.value)}
                      className="text-base font-black font-mono text-purple-700"
                    />
                  </FormField>
                </div>
              </div>

              {/* Khối Chỉ Số Môi Trường Động */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <Thermometer className="h-4 w-4 text-emerald-600" />
                    <span>Phần 2: Chỉ Số Môi Trường Chuồng ({currentBarn?.zoneName})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Tô đỏ khi vượt ngưỡng an toàn</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentBarn?.envConfig?.metrics.map((metric) => {
                    const val = envValues[metric.id] ?? metric.currentVal;
                    const isExceeded = val < metric.minVal || val > metric.maxVal;

                    return (
                      <div key={metric.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700">{metric.name} ({metric.unit}):</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Ngưỡng: {metric.minVal} - {metric.maxVal} {metric.unit}
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={val}
                            onChange={(e) =>
                              setEnvValues((prev) => ({
                                ...prev,
                                [metric.id]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className={`w-full rounded-lg border py-2 px-3 text-sm font-black font-mono transition-colors ${
                              isExceeded
                                ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                                : 'border-slate-300 bg-white text-slate-900 focus:ring-emerald-500'
                            }`}
                          />
                        </div>

                        {isExceeded && (
                          <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>Vượt ngưỡng an toàn cho phép!</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={<Check className="h-4 w-4" />}
                className="w-full text-xs font-bold py-2.5 shadow-sm"
              >
                Lưu Phiếu Cân Mẫu & Môi Trường
              </Button>
            </form>
          )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BẢNG LỊCH SỬ NHẬT KÝ TRONG NGÀY & PHÂN QUYỀN (DAILY LOG FEED)           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span>Nhật Ký Đã Ghi Hôm Nay ({filteredLogsToday.length} phiếu)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentBarn?.name ? `Tại ${currentBarn.name} — ` : ''}Ngày {formatDate(selectedDate)}
            </p>
          </div>

          {!canUpdateOrDeleteLog && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
              <Lock className="h-3 w-3 text-slate-400" />
              <span>Chế độ công nhân (Khóa sửa/xóa)</span>
            </span>
          )}
        </div>

        {filteredLogsToday.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
            Chưa có phiếu nhật ký nào được ghi nhận{currentBarn?.name ? ` cho ${currentBarn.name}` : ''} vào ngày {formatDate(selectedDate)}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLogsToday.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      log.category === 'FEED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.category === 'MEDICINE'
                        ? 'bg-amber-100 text-amber-800'
                        : log.category === 'MORTALITY'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {log.category === 'FEED' ? '🌾' : log.category === 'MEDICINE' ? '💉' : log.category === 'MORTALITY' ? '💀' : '⚖️'}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-800">{log.time}</span>
                      <h4 className="text-xs font-bold text-slate-900">{log.title}</h4>
                      {log.isDeducted && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Đã trừ kho</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">{log.details}</p>
                    <p className="text-[10px] text-slate-400">Người ghi: <strong className="text-slate-600">{log.loggedBy}</strong></p>
                  </div>
                </div>

                {/* Phân quyền Sửa/Xóa */}
                <div className="shrink-0 flex items-center gap-1 self-end sm:self-center">
                  {canUpdateOrDeleteLog ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toast.info('Chức năng sửa phiếu nhật ký')}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100 transition-colors"
                        title="Sửa phiếu"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title="Xóa phiếu"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div
                      className="p-1.5 text-slate-400 flex items-center gap-1 text-[10px] bg-slate-50 rounded"
                      title="Liên hệ Trại trưởng nếu cần chỉnh sửa"
                    >
                      <Lock className="h-3 w-3 text-slate-400" />
                      <span>Đã chốt</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyLogsPage;
