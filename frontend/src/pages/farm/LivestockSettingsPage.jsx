import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Syringe,
  Layers,
  Sparkles,
  Calendar,
  AlertTriangle,
  Activity,
  Trash2,
  Edit2,
  Pencil,
  Save,
  Zap,
  Info,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  CheckSquare,
  Square,
  Thermometer,
  Droplets,
  Wind,
  Target,
  Skull,
  TrendingUp,
  DollarSign,
  Scale,
  Feather,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { toast } from '@/store/useToastStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { livestockSettingsService } from '@/services/modules/livestockSettingsService';
import { masterDataService } from '@/services/modules/masterDataService';
import { barnBatchService } from '@/services/modules/barnBatchService';

// ================= DỮ LIỆU MẪU CHUẨN THỰC CHIẾN FARMGO =================

const INITIAL_PROGRAMS = [
  {
    id: 1,
    name: 'Quy trình Gà thịt Ross 308 (45 ngày)',
    livestockType: 'POULTRY',
    livestockTypeName: 'Gia cầm thịt',
    breedName: 'Gà trắng công nghiệp Ross 308 / CP',
    totalDays: 45,
    targetWeightKg: 2.8,
    fcrTarget: 1.65,
    adgTarget: 62,
    description: 'Quy trình nuôi công nghiệp chuồng lạnh khép kín, kiểm soát tối ưu nhiệt độ, ẩm độ và dinh dưỡng tăng trọng nhanh.',
    feedStandards: [
      { id: 1, dayAge: 1, stage: 'Úm', feedType: 'Cám Gà Con Giai Đoạn 1 (0-14 ngày)', feedAmount: 15, unit: 'g/con', standardWeight: 0.045 },
      { id: 2, dayAge: 2, stage: 'Úm', feedType: 'Cám Gà Con Giai Đoạn 1 (0-14 ngày)', feedAmount: 18, unit: 'g/con', standardWeight: 0.055 },
      { id: 3, dayAge: 3, stage: 'Úm', feedType: 'Cám Gà Con Giai Đoạn 1 (0-14 ngày)', feedAmount: 22, unit: 'g/con', standardWeight: 0.070 },
      { id: 4, dayAge: 7, stage: 'Úm', feedType: 'Cám Gà Con Giai Đoạn 1 (0-14 ngày)', feedAmount: 35, unit: 'g/con', standardWeight: 0.180 },
      { id: 5, dayAge: 14, stage: 'Úm', feedType: 'Cám Gà Con Giai Đoạn 1 (0-14 ngày)', feedAmount: 65, unit: 'g/con', standardWeight: 0.450 },
      { id: 6, dayAge: 21, stage: 'Tăng trưởng', feedType: 'Cám Gà Thịt Giai Đoạn 2 (15-28 ngày)', feedAmount: 105, unit: 'g/con', standardWeight: 0.920 },
      { id: 7, dayAge: 28, stage: 'Tăng trưởng', feedType: 'Cám Gà Thịt Giai Đoạn 2 (15-28 ngày)', feedAmount: 145, unit: 'g/con', standardWeight: 1.520 },
      { id: 8, dayAge: 35, stage: 'Vỗ béo', feedType: 'Cám Vỗ Béo Xuất Chuồng (29-45 ngày)', feedAmount: 180, unit: 'g/con', standardWeight: 2.150 },
      { id: 9, dayAge: 42, stage: 'Vỗ béo', feedType: 'Cám Vỗ Béo Xuất Chuồng (29-45 ngày)', feedAmount: 205, unit: 'g/con', standardWeight: 2.650 },
      { id: 10, dayAge: 45, stage: 'Vỗ béo', feedType: 'Cám Vỗ Béo Xuất Chuồng (29-45 ngày)', feedAmount: 215, unit: 'g/con', standardWeight: 2.800 },
    ],
    vaccineTimeline: [
      { id: 1, dayAge: 1, vaccineName: 'Vắc-xin Marek (Đông khô)', dose: '1 liều/con (0.2ml)', route: 'Tiêm dưới da cổ', notes: 'Tiêm phòng tại lò ấp ngay khi nở, sát trùng kim tiêm' },
      { id: 2, dayAge: 4, vaccineName: 'ND - IB lần 1 (Clon 30 + H120)', dose: '1 liều/con', route: 'Nhỏ mắt / Nhỏ mũi', notes: 'Mỗi con 1 giọt vào mắt hoặc mũi, chờ nhấp nháy mắt mới thả' },
      { id: 3, dayAge: 10, vaccineName: 'Gumboro lần 1 (Chủng D78)', dose: '1 liều/con', route: 'Pha nước uống', notes: 'Cắt nước 1.5 - 2h trước khi uống, pha cùng sữa gầy bảo vệ' },
      { id: 4, dayAge: 14, vaccineName: 'Đậu gà (Fowl Pox Vaccine)', dose: '1 liều/con', route: 'Châm cánh', notes: 'Dùng kim đôi châm xuyên màng cánh, tránh chạm mạch máu' },
      { id: 5, dayAge: 21, vaccineName: 'ND - IB lần 2 (Lasota tái chủng)', dose: '1 liều/con', route: 'Pha nước uống', notes: 'Cho uống trong vòng 2 giờ, tránh ánh nắng trực tiếp' },
      { id: 6, dayAge: 28, vaccineName: 'Gumboro lần 2', dose: '1 liều/con', route: 'Pha nước uống', notes: 'Tái chủng nhắc lại để củng cố miễn dịch bảo hộ đàn' },
      { id: 7, dayAge: 35, vaccineName: 'Cúm gia cầm H5N1 / H5N6', dose: '0.5 ml/con', route: 'Tiêm bắp ức', notes: 'Tiêm bắp ức hoặc dưới da gáy, ngừng thuốc trước xuất chuồng 14 ngày' },
    ],
  },
  {
    id: 2,
    name: 'Quy trình Heo thịt 120 ngày (Duroc x Landrace x Yorkshire)',
    livestockType: 'SWINE',
    livestockTypeName: 'Gia súc thịt',
    breedName: 'Heo ngoại 3 máu thương phẩm',
    totalDays: 120,
    targetWeightKg: 115,
    fcrTarget: 2.40,
    adgTarget: 780,
    description: 'Quy trình heo thịt nuôi từ cai sữa (28 ngày tuổi / 7kg) đến xuất chuồng đạt 115kg nạc cao.',
    feedStandards: [
      { id: 11, dayAge: 1, stage: 'Úm', feedType: 'Cám Heo Tập Ăn Tập Bú (Giai đoạn 1)', feedAmount: 0.35, unit: 'kg/con', standardWeight: 7.5 },
      { id: 12, dayAge: 15, stage: 'Úm', feedType: 'Cám Heo Con Sau Cai Sữa', feedAmount: 0.85, unit: 'kg/con', standardWeight: 14.0 },
      { id: 13, dayAge: 30, stage: 'Tăng trưởng', feedType: 'Cám Heo Choai Tăng Trọng (15-30kg)', feedAmount: 1.40, unit: 'kg/con', standardWeight: 28.0 },
      { id: 14, dayAge: 60, stage: 'Tăng trưởng', feedType: 'Cám Heo Thịt Giai Đoạn Phát Triển', feedAmount: 2.10, unit: 'kg/con', standardWeight: 55.0 },
      { id: 15, dayAge: 90, stage: 'Vỗ béo', feedType: 'Cám Heo Thịt Vỗ Béo Nạc Cao', feedAmount: 2.80, unit: 'kg/con', standardWeight: 85.0 },
      { id: 16, dayAge: 120, stage: 'Vỗ béo', feedType: 'Cám Heo Thịt Vỗ Béo Nạc Cao', feedAmount: 3.20, unit: 'kg/con', standardWeight: 115.0 },
    ],
    vaccineTimeline: [
      { id: 8, dayAge: 7, vaccineName: 'Mycoplasma Hyopneumoniae (Suyễn heo)', dose: '2.0 ml/con', route: 'Tiêm bắp', notes: 'Tiêm bắp cổ sau gốc tai, phòng bệnh suyễn kẽ phổi' },
      { id: 9, dayAge: 14, vaccineName: 'PRRS Tai xanh (Chủng nhược độc)', dose: '1 liều/con', route: 'Tiêm bắp', notes: 'Kiểm tra thân nhiệt trước tiêm, chỉ tiêm cho đàn khỏe mạnh' },
      { id: 10, dayAge: 21, vaccineName: 'Dịch tả heo cổ điển (CSF)', dose: '1 liều/con', route: 'Tiêm bắp', notes: 'Kháng thể mẹ truyền giảm dần, tiêm mũi 1 định kỳ' },
      { id: 11, dayAge: 35, vaccineName: 'Lở mồm long móng (FMD nhị giá O+A)', dose: '2.0 ml/con', route: 'Tiêm bắp', notes: 'Tiêm bắp sâu, lắc kỹ lọ vắc-xin trước khi sử dụng' },
      { id: 12, dayAge: 60, vaccineName: 'Dịch tả heo nhắc lại lần 2', dose: '1 liều/con', route: 'Tiêm bắp', notes: 'Tái chủng củng cố miễn dịch cho giai đoạn tăng trọng vỗ béo' },
    ],
  },
  {
    id: 3,
    name: 'Quy trình Vịt siêu thịt Cherry Valley (48 ngày)',
    livestockType: 'POULTRY',
    livestockTypeName: 'Gia cầm thịt',
    breedName: 'Vịt siêu thịt Cherry Valley',
    totalDays: 48,
    targetWeightKg: 3.4,
    fcrTarget: 2.15,
    adgTarget: 70,
    description: 'Quy trình nuôi vịt thịt cao sản chuồng sàn lạnh khép kín, thịt chắc nạc, lớn nhanh.',
    feedStandards: [
      { id: 17, dayAge: 1, stage: 'Úm', feedType: 'Cám Vịt Con Úm 0-14 Ngày', feedAmount: 25, unit: 'g/con', standardWeight: 0.055 },
      { id: 18, dayAge: 14, stage: 'Úm', feedType: 'Cám Vịt Con Úm 0-14 Ngày', feedAmount: 85, unit: 'g/con', standardWeight: 0.750 },
      { id: 19, dayAge: 28, stage: 'Tăng trưởng', feedType: 'Cám Vịt Thịt Giai Đoạn Phát Triển', feedAmount: 180, unit: 'g/con', standardWeight: 1.950 },
      { id: 20, dayAge: 48, stage: 'Vỗ béo', feedType: 'Cám Vịt Vỗ Béo Xuất Thịt', feedAmount: 260, unit: 'g/con', standardWeight: 3.400 },
    ],
    vaccineTimeline: [
      { id: 13, dayAge: 1, vaccineName: 'Viêm gan virus vịt (Duck Hepatitis)', dose: '0.5 ml/con', route: 'Tiêm dưới da cổ', notes: 'Tiêm ngay ngày đầu tiên khi vịt mới nở' },
      { id: 14, dayAge: 12, vaccineName: 'Dịch tả vịt (Duck Plague)', dose: '1 liều/con', route: 'Tiêm bắp', notes: 'Tiêm bắp đùi hoặc ức, kiểm tra kim định kỳ' },
      { id: 15, dayAge: 25, vaccineName: 'Cúm gia cầm H5N1 trên thủy cầm', dose: '0.5 ml/con', route: 'Tiêm dưới da cổ', notes: 'Phòng bệnh cúm độc lực cao' },
    ],
  },
];

const INITIAL_ENV_METRICS = [
  {
    id: 'ENV_TEMP',
    name: 'Nhiệt độ chuồng',
    code: 'TEMP',
    unit: '°C',
    minVal: 24.0,
    maxVal: 32.5,
    frequency: '3 lần / ngày (Sáng, Trưa, Tối)',
    description: 'Nhiệt độ môi trường bên trong chuồng nuôi, ảnh hưởng trực tiếp đến sức ăn và hô hấp.',
    iconType: 'temp',
    alertColor: 'text-amber-600 bg-amber-50',
  },
  {
    id: 'ENV_HUMID',
    name: 'Độ ẩm không khí',
    code: 'HUMID',
    unit: '%',
    minVal: 55.0,
    maxVal: 75.0,
    frequency: '3 lần / ngày',
    description: 'Độ ẩm chuồng nuôi, độ ẩm cao kết hợp nhiệt độ cao sinh mầm bệnh vi khuẩn đường ruột.',
    iconType: 'humid',
    alertColor: 'text-sky-600 bg-sky-50',
  },
  {
    id: 'ENV_NH3',
    name: 'Nồng độ khí NH3 (Amoniac)',
    code: 'NH3',
    unit: 'ppm',
    minVal: 0.0,
    maxVal: 20.0,
    frequency: '1 lần / ngày',
    description: 'Khí thải từ phân ủ mục, vượt 20ppm gây cay mắt, rụng lông và hen khẹc đường thở.',
    iconType: 'wind',
    alertColor: 'text-rose-600 bg-rose-50',
  },
  {
    id: 'ENV_WATER',
    name: 'Lượng nước uống hằng ngày',
    code: 'WATER',
    unit: 'Lít / 1.000 con',
    minVal: 180,
    maxVal: 350,
    frequency: 'Đo đồng hồ tổng cuối ngày',
    description: 'Chỉ số cảnh báo sớm: đàn vật nuôi giảm uống nước là dấu hiệu sốt hoặc stress nhiệt.',
    iconType: 'humid',
    alertColor: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'ENV_WIND',
    name: 'Tốc độ gió / Áp suất âm',
    code: 'WIND',
    unit: 'm/s',
    minVal: 1.5,
    maxVal: 3.5,
    frequency: '2 lần / ngày',
    description: 'Tốc độ gió làm mát chuồng hầm quạt hút, đảm bảo trao đổi khí tươi liên tục.',
    iconType: 'wind',
    alertColor: 'text-teal-600 bg-teal-50',
  },
  {
    id: 'ENV_LIGHT',
    name: 'Cường độ ánh sáng',
    code: 'LIGHT',
    unit: 'Lux',
    minVal: 10,
    maxVal: 40,
    frequency: 'Kiểm tra giai đoạn úm/vỗ béo',
    description: 'Kích thích ăn đêm, điều hòa nhịp sinh học và hạn chế gà cắn mổ lông nhau.',
    iconType: 'temp',
    alertColor: 'text-yellow-600 bg-yellow-50',
  },
];

const INITIAL_ZONES = [
  { id: 'ZONE_A', name: 'Khu A - Chuồng Gà Úm', type: 'Gia cầm' },
  { id: 'ZONE_B', name: 'Khu B - Chuồng Gà Thịt 1', type: 'Gia cầm' },
  { id: 'ZONE_C', name: 'Khu C - Chuồng Gà Thịt 2', type: 'Gia cầm' },
  { id: 'ZONE_D', name: 'Khu D - Chuồng Heo Hầm Lạnh A', type: 'Gia súc' },
  { id: 'ZONE_E', name: 'Khu E - Chuồng Heo Hầm Lạnh B', type: 'Gia súc' },
];

const INITIAL_ZONE_METRIC_MATRIX = {
  ZONE_A: ['ENV_TEMP', 'ENV_HUMID', 'ENV_LIGHT', 'ENV_WATER'],
  ZONE_B: ['ENV_TEMP', 'ENV_HUMID', 'ENV_NH3', 'ENV_WATER', 'ENV_WIND'],
  ZONE_C: ['ENV_TEMP', 'ENV_HUMID', 'ENV_NH3', 'ENV_WATER', 'ENV_WIND'],
  ZONE_D: ['ENV_TEMP', 'ENV_NH3', 'ENV_WATER', 'ENV_WIND'],
  ZONE_E: ['ENV_TEMP', 'ENV_NH3', 'ENV_WATER', 'ENV_WIND'],
};

const INITIAL_KPI_SETTINGS = {
  POULTRY: {
    fcrTarget: 1.65,
    maxMortalityRatePct: 3.0,
    adgTargetGram: 62.0,
    targetCostVndPerKg: 38500,
    targetHarvestWeightKg: 2.8,
    standardDays: 45,
  },
  SWINE: {
    fcrTarget: 2.40,
    maxMortalityRatePct: 2.5,
    adgTargetGram: 780.0,
    targetCostVndPerKg: 52000,
    targetHarvestWeightKg: 115.0,
    standardDays: 120,
  },
};

const INITIAL_MORTALITY_REASONS = [
  {
    id: 1,
    code: 'HH-01',
    name: 'Tiêu chảy / Viêm ruột hoại tử / E.coli',
    category: 'Bệnh tiêu hóa',
    severity: 'CẦN CÁCH LY',
    appliesTo: 'Tất cả',
    description: 'Phân sệt vàng hoặc trắng, gầy tóp bụng, mất nước nhanh.',
  },
  {
    id: 2,
    code: 'HH-02',
    name: 'Hô hấp / Hen khẹc (CRD / Suyễn)',
    category: 'Bệnh hô hấp',
    severity: 'CẦN CÁCH LY',
    appliesTo: 'Tất cả',
    description: 'Thở dốc, vảy mỏ, khò khè đêm, sưng mắt và rụng lông.',
  },
  {
    id: 3,
    code: 'HH-03',
    name: 'Còi cọc kém ăn / Loại thải định kỳ',
    category: 'Còi cọc loại thải',
    severity: 'BÌNH THƯỜNG',
    appliesTo: 'Tất cả',
    description: 'Trọng lượng dưới 50% chuẩn đàn, không tăng trưởng, chủ động lọc bỏ.',
  },
  {
    id: 4,
    code: 'HH-04',
    name: 'Đè / Dẫm đạp / Cắn mổ nhau',
    category: 'Chấn thương cơ học',
    severity: 'CẦN XỬ LÝ',
    appliesTo: 'Tất cả',
    description: 'Mật độ quá dày, hoảng loạn tiếng động hoặc thiếu muối khoáng.',
  },
  {
    id: 5,
    code: 'HH-05',
    name: 'Sốc nhiệt / Đột tử chuồng kín',
    category: 'Môi trường chuồng',
    severity: 'NGUY HIỂM CAO',
    appliesTo: 'Tất cả',
    description: 'Nhiệt độ tăng vọt khi mất điện hoặc dàn mát gặp sự cố.',
  },
  {
    id: 6,
    code: 'HH-06',
    name: 'Bại liệt / Viêm khớp / Gãy chân',
    category: 'Chấn thương cơ học',
    severity: 'BÌNH THƯỜNG',
    appliesTo: 'Tất cả',
    description: 'Không đứng dậy được đến máng ăn nước uống, suy kiệt dần.',
  },
  {
    id: 7,
    code: 'HH-07',
    name: 'Nghi ngờ Dịch tả (ASF / Newcastle / Cúm)',
    category: 'Dịch bệnh truyền nhiễm',
    severity: 'CẤP BÁO THÚ Y NGAY',
    appliesTo: 'Tất cả',
    description: 'Xuất huyết da, chết nhanh hàng loạt không rõ nguyên nhân, báo gấp thú y.',
  },
];

export function LivestockSettingsPage() {
  const { userInfo, hasPermission, isOwner, isSuperAdmin } = useAuthStore();
  const { farms, activeFarmId, activeBranch } = useActiveFarmStore();
  const farmId = activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : Number(farms?.[0]?.id || 1);

  // Kiểm tra quyền hạn người dùng (SCRUD)
  // Nếu chỉ có quyền R (Read-Only) -> canEdit = false
  const canEdit = useMemo(() => {
    if (isSuperAdmin?.() || isOwner?.()) return true;
    if (typeof hasPermission === 'function') {
      return (
        hasPermission('livestock_settings.manage') ||
        hasPermission('livestock_settings.edit') ||
        hasPermission('livestock.manage')
      );
    }
    return true;
  }, [hasPermission, isOwner, isSuperAdmin]);

  const dataVersion = useActiveBranchStore((s) => s.dataVersion);
  const triggerRefresh = useActiveBranchStore((s) => s.triggerRefresh);
  const currentBranchId = useActiveBranchStore((s) => s.currentBranchId);

  // Danh sách vật tư thức ăn chăn nuôi từ Kho hàng hóa (Category FEED)
  const [feedMaterials, setFeedMaterials] = useState([
    { id: 1, name: 'Cám Heo Con Starter C280 (15 - 30kg)', skuCode: 'CAM-HEO-C280', standardUnit: 'bao' },
    { id: 2, name: 'Cám Heo Thịt Grower C380 (30 - 60kg)', skuCode: 'CAM-HEO-C380', standardUnit: 'bao' },
    { id: 3, name: 'Cám Gà Thịt Giai Đoạn Vỗ Béo (22 ngày - xuất)', skuCode: 'CAM-GA-G101', standardUnit: 'bao' },
  ]);

  // Load real settings from backend on mount and upon dataVersion change
  React.useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        // 1. Chương trình nuôi
        const progData = await livestockSettingsService.getPrograms(farmId);
        if (isMounted && Array.isArray(progData) && progData.length > 0) {
          setPrograms(progData);
          if (!selectedProgramId || !progData.some((p) => p.id === selectedProgramId)) {
            setSelectedProgramId(progData[0].id);
          }
        }

        // 2. Danh mục Thức ăn chăn nuôi từ kho (Category 1 / FEED)
        try {
          const matRes = await masterDataService.getMaterials({ categoryId: 1, size: 100 });
          const list = Array.isArray(matRes) ? matRes : (matRes?.content || []);
          if (isMounted && list.length > 0) {
            setFeedMaterials(list);
          }
        } catch (e) {
          console.warn('Could not load feed materials', e);
        }

        // 3. Chỉ số Môi trường & Ma trận phân bổ khu nuôi từ farm_data_rules
        const envData = await livestockSettingsService.getEnvMetrics(farmId);
        if (isMounted && envData) {
          try {
            const parsed = typeof envData === 'string' ? JSON.parse(envData) : envData;
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEnvMetrics(parsed);
            } else if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.metrics) && parsed.metrics.length > 0) {
                setEnvMetrics(parsed.metrics);
              }
              if (parsed.zoneMetricMatrix && typeof parsed.zoneMetricMatrix === 'object') {
                setZoneMetricMatrix(parsed.zoneMetricMatrix);
              }
            }
          } catch (e) {
            console.warn('Lỗi đọc chỉ số môi trường', e);
          }
        }

        // 4. Mục tiêu KPI & Danh mục lý do loại thải từ farm_data_rules
        const kpiData = await livestockSettingsService.getKpis(farmId);
        if (isMounted && kpiData) {
          try {
            const parsed = typeof kpiData === 'string' ? JSON.parse(kpiData) : kpiData;
            if (parsed.cullingReasons && Array.isArray(parsed.cullingReasons)) {
              setMortalityReasons(
                parsed.cullingReasons.map((name, idx) => ({
                  id: idx + 1,
                  code: `HH-${String(idx + 1).padStart(2, '0')}`,
                  name,
                  category: 'Bệnh lý & Loại thải',
                  severity: 'BÌNH THƯỜNG',
                  appliesTo: 'Tất cả',
                }))
              );
            }
            if (parsed.kpiSettings && typeof parsed.kpiSettings === 'object') {
              setKpiSettings((prev) => ({
                ...prev,
                ...parsed.kpiSettings,
              }));
            } else if (parsed.targetFcr || parsed.maxMortalityRate) {
              setKpiSettings((prev) => ({
                ...prev,
                POULTRY: {
                  ...prev.POULTRY,
                  fcrTarget: parsed.targetFcr || prev.POULTRY.fcrTarget,
                  maxMortalityRatePct: parsed.maxMortalityRate || prev.POULTRY.maxMortalityRatePct,
                  adgTargetGram: parsed.adgTargetGram || prev.POULTRY.adgTargetGram,
                  targetCostVndPerKg: parsed.targetCostVndPerKg || prev.POULTRY.targetCostVndPerKg,
                  targetHarvestWeightKg: parsed.targetHarvestWeightKg || prev.POULTRY.targetHarvestWeightKg,
                  standardDays: parsed.standardDays || prev.POULTRY.standardDays,
                },
              }));
            }
          } catch (e) {
            console.warn('Lỗi đọc KPI', e);
          }
        }
      } catch (err) {
        console.warn('Could not fetch livestock settings, using defaults', err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [farmId, dataVersion]);

  // Load danh sách khu nuôi thật lọc theo Chi nhánh đang chọn (currentBranchId)
  React.useEffect(() => {
    let isMounted = true;
    const fetchZones = async () => {
      try {
        const effectiveBranchId = currentBranchId === 'ALL' ? undefined : (currentBranchId || 1);
        const zonesRes = await barnBatchService.getZones({
          farmId,
          branchId: effectiveBranchId,
        });
        if (isMounted && Array.isArray(zonesRes)) {
          setZones(zonesRes);
        }
      } catch (err) {
        console.warn('Could not load real zones for settings', err);
      }
    };
    fetchZones();
    return () => {
      isMounted = false;
    };
  }, [farmId, currentBranchId, dataVersion]);

  // Tab chính: 1. PROGRAMS, 2. ENVIRONMENT, 3. KPI_MORTALITY
  const [activeTab, setActiveTab] = useState('PROGRAMS');

  // ================= TAB 1: CHƯƠNG TRÌNH NUÔI =================
  const [programs, setPrograms] = useState(INITIAL_PROGRAMS);
  const [selectedProgramId, setSelectedProgramId] = useState(1);
  const [programSubTab, setProgramSubTab] = useState('FEED'); // FEED hoặc VACCINE
  const [searchProgramText, setSearchProgramText] = useState('');
  const [filterLivestockType, setFilterLivestockType] = useState('ALL');

  // Tự động đồng bộ bộ lọc theo loại vật nuôi của chi nhánh đang chọn trên Topbar
  React.useEffect(() => {
    if (!activeBranch || activeBranch.id === 'ALL') {
      setFilterLivestockType('ALL');
      return;
    }
    const bType = String(activeBranch.livestockType || '').toUpperCase();
    if (bType.includes('POULTRY')) {
      setFilterLivestockType('POULTRY');
    } else if (bType.includes('LIVESTOCK') || bType.includes('SWINE') || bType.includes('MEAT')) {
      setFilterLivestockType('SWINE');
    } else {
      setFilterLivestockType('ALL');
    }
  }, [activeBranch?.id, activeBranch?.livestockType, currentBranchId]);

  // Modals Tab 1
  const [isNewProgramModalOpen, setIsNewProgramModalOpen] = useState(false);
  const [newProgramForm, setNewProgramForm] = useState({
    name: '',
    livestockType: 'POULTRY',
    breedName: '',
    totalDays: 45,
    targetWeightKg: 2.5,
    fcrTarget: 1.65,
    description: '',
  });

  const [isEditProgramModalOpen, setIsEditProgramModalOpen] = useState(false);
  const [editProgramForm, setEditProgramForm] = useState({
    id: null,
    name: '',
    livestockType: 'POULTRY',
    breedName: '',
    totalDays: 45,
    targetWeightKg: 2.5,
    fcrTarget: 1.65,
    adgTarget: 60,
    description: '',
  });

  const [isBatchDaysModalOpen, setIsBatchDaysModalOpen] = useState(false);
  const [batchDaysForm, setBatchDaysForm] = useState({
    fromDay: 1,
    toDay: 7,
    stepDays: 1,
    stage: 'Úm',
    materialId: 1,
    feedType: 'Cám Heo Con Starter C280 (15 - 30kg)',
    feedAmount: 20,
    unit: 'g/con',
    standardWeight: 0.15,
  });

  const [isFeedDayModalOpen, setIsFeedDayModalOpen] = useState(false);
  const [feedDayForm, setFeedDayForm] = useState({
    dayAge: 1,
    stage: 'Úm',
    materialId: 1,
    feedType: 'Cám Heo Con Starter C280 (15 - 30kg)',
    feedAmount: '',
    unit: 'g/con',
    standardWeight: '',
  });

  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
  const [vaccineForm, setVaccineForm] = useState({
    dayAge: 1,
    vaccineName: '',
    dose: '',
    route: 'Nhỏ mắt / Nhỏ mũi',
    notes: '',
  });

  // ================= TAB 2: CHỈ SỐ MÔI TRƯỜNG =================
  const [envMetrics, setEnvMetrics] = useState(INITIAL_ENV_METRICS);
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [zoneMetricMatrix, setZoneMetricMatrix] = useState(INITIAL_ZONE_METRIC_MATRIX);

  const [isEnvMetricModalOpen, setIsEnvMetricModalOpen] = useState(false);
  const [editingEnvMetric, setEditingEnvMetric] = useState(null);
  const [envMetricForm, setEnvMetricForm] = useState({
    name: '',
    code: '',
    unit: '°C',
    minVal: '',
    maxVal: '',
    frequency: '3 lần / ngày',
    description: '',
  });

  // ================= TAB 3: KPI & LÝ DO HAO HỤT =================
  const [kpiLivestockType, setKpiLivestockType] = useState('POULTRY'); // POULTRY hoặc SWINE
  const [kpiSettings, setKpiSettings] = useState(INITIAL_KPI_SETTINGS);
  const [mortalityReasons, setMortalityReasons] = useState(INITIAL_MORTALITY_REASONS);

  const [isMortalityModalOpen, setIsMortalityModalOpen] = useState(false);
  const [editingMortalityReason, setEditingMortalityReason] = useState(null);
  const [mortalityForm, setMortalityForm] = useState({
    code: '',
    name: '',
    category: 'Bệnh tiêu hóa',
    severity: 'BÌNH THƯỜNG',
    appliesTo: 'Tất cả',
    description: '',
  });

  // Chương trình nuôi đang chọn
  const currentProgram = useMemo(() => {
    return programs.find((p) => p.id === selectedProgramId) || programs[0];
  }, [programs, selectedProgramId]);

  // Lọc chương trình nuôi bên cột trái
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchProgramText.toLowerCase()) ||
        p.breedName.toLowerCase().includes(searchProgramText.toLowerCase());
      const matchType = filterLivestockType === 'ALL' || p.livestockType === filterLivestockType;
      return matchSearch && matchType;
    });
  }, [programs, searchProgramText, filterLivestockType]);

  // Tự động chọn quy trình đầu tiên phù hợp khi bộ lọc thay đổi
  React.useEffect(() => {
    if (filteredPrograms.length > 0 && !filteredPrograms.some((p) => p.id === selectedProgramId)) {
      setSelectedProgramId(filteredPrograms[0].id);
    }
  }, [filteredPrograms, selectedProgramId]);

  // ================= HANDLERS: TAB 1 =================
  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!newProgramForm.name.trim()) {
      toast.error('Vui lòng nhập tên chương trình nuôi');
      return;
    }
    try {
      const payload = {
        name: newProgramForm.name,
        species: newProgramForm.livestockType,
        livestockTypeName: newProgramForm.livestockType === 'POULTRY' ? 'Gia cầm thịt' : 'Gia súc thịt',
        breedName: newProgramForm.breedName || 'Giống vật nuôi chuẩn',
        totalDays: Number(newProgramForm.totalDays) || 45,
        targetWeightKg: Number(newProgramForm.targetWeightKg) || 2.5,
        fcrTarget: Number(newProgramForm.fcrTarget) || 1.65,
        adgTarget: 60,
        description: newProgramForm.description,
      };
      const res = await livestockSettingsService.createProgram(farmId, payload);
      triggerRefresh();
      setIsNewProgramModalOpen(false);
      setSelectedProgramId(res.id);
      toast.success(`Đã tạo chương trình nuôi "${res.name}" thành công!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo chương trình nuôi');
    }
  };

  const handleOpenEditProgram = (program) => {
    if (!program) return;
    setEditProgramForm({
      id: program.id,
      name: program.name,
      livestockType: program.livestockType || 'POULTRY',
      breedName: program.breedName || '',
      totalDays: program.totalDays || 45,
      targetWeightKg: program.targetWeightKg || 2.5,
      fcrTarget: program.fcrTarget || 1.65,
      adgTarget: program.adgTarget || 60,
      description: program.description || '',
    });
    setIsEditProgramModalOpen(true);
  };

  const handleUpdateProgram = async (e) => {
    e.preventDefault();
    if (!editProgramForm.name.trim()) {
      toast.error('Vui lòng nhập tên quy trình');
      return;
    }
    try {
      await livestockSettingsService.updateProgram(editProgramForm.id, {
        name: editProgramForm.name.trim(),
        species: editProgramForm.livestockType,
        livestockTypeName: editProgramForm.livestockType === 'POULTRY' ? 'Gia cầm thịt' : 'Gia súc thịt',
        breedName: editProgramForm.breedName || editProgramForm.name.trim(),
        totalDays: Number(editProgramForm.totalDays) || 45,
        targetWeightKg: Number(editProgramForm.targetWeightKg) || 2.5,
        fcrTarget: Number(editProgramForm.fcrTarget) || 1.65,
        adgTarget: Number(editProgramForm.adgTarget) || 60,
        description: editProgramForm.description,
      });

      triggerRefresh();
      setIsEditProgramModalOpen(false);
      toast.success(`Đã cập nhật quy trình "${editProgramForm.name}" thành công!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật quy trình');
    }
  };

  const handleDeleteProgram = async (programId) => {
    const prog = programs.find((p) => p.id === programId);
    if (!window.confirm(`Bạn có chắc chắn muốn xóa quy trình "${prog?.name || ''}"? Toàn bộ mốc định mức cám và lịch vắc-xin đi kèm sẽ bị xóa.`)) {
      return;
    }
    try {
      await livestockSettingsService.deleteProgram(programId);
      triggerRefresh();
      const remaining = programs.filter((p) => p.id !== programId);
      if (remaining.length > 0) {
        setSelectedProgramId(remaining[0].id);
      }
      toast.success('Đã xóa quy trình nuôi thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa quy trình nuôi');
    }
  };

  const handleApplyBatchDays = async (e) => {
    e.preventDefault();
    const from = Math.max(1, Number(batchDaysForm.fromDay));
    const to = Math.max(from, Number(batchDaysForm.toDay));
    const step = Math.max(1, Number(batchDaysForm.stepDays) || 1);
    try {
      await livestockSettingsService.batchRangeFeed(currentProgram.id, {
        fromDay: from,
        toDay: to,
        stepDays: step,
        stage: batchDaysForm.stage,
        materialId: Number(batchDaysForm.materialId) || undefined,
        feedType: batchDaysForm.feedType,
        startFeedAmount: Number(batchDaysForm.feedAmount),
        endFeedAmount: Number(batchDaysForm.feedAmount) * 1.5,
        unit: batchDaysForm.unit,
        startWeightKg: Number(batchDaysForm.standardWeight),
        endWeightKg: Number(batchDaysForm.standardWeight) * 1.6,
      });
      triggerRefresh();
      setIsBatchDaysModalOpen(false);
      toast.success(`Đã tự động tạo định mức cám từ Ngày ${from} đến Ngày ${to} (bước nhảy ${step} ngày)!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo định mức cám nhanh');
    }
  };

  const handleSaveFeedDay = async (e) => {
    e.preventDefault();
    const day = Number(feedDayForm.dayAge);
    try {
      await livestockSettingsService.addFeedQuota(currentProgram.id, {
        dayAgeFrom: day,
        dayAgeTo: day,
        stage: feedDayForm.stage,
        materialId: Number(feedDayForm.materialId) || undefined,
        feedType: feedDayForm.feedType || 'Cám hỗn hợp chuẩn',
        feedAmount: Number(feedDayForm.feedAmount) || 20,
        unit: feedDayForm.unit,
        standardWeight: Number(feedDayForm.standardWeight) || 0.1,
      });
      triggerRefresh();
      setIsFeedDayModalOpen(false);
      toast.success(`Đã lưu định mức cám Ngày tuổi ${day}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu định mức cám');
    }
  };

  const handleDeleteFeedDay = async (dayAge, quotaId) => {
    if (!canEdit) return;
    try {
      if (quotaId) {
        await livestockSettingsService.deleteFeedQuota(currentProgram.id, quotaId);
      }
      triggerRefresh();
      toast.info(`Đã xóa định mức Ngày tuổi ${dayAge}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa định mức');
    }
  };

  const handleSaveVaccine = async (e) => {
    e.preventDefault();
    if (!vaccineForm.vaccineName.trim()) {
      toast.error('Vui lòng nhập tên vắc-xin / thuốc');
      return;
    }
    const day = Number(vaccineForm.dayAge);
    try {
      await livestockSettingsService.addVaccine(currentProgram.id, {
        dayAge: day,
        vaccineName: vaccineForm.vaccineName,
        dose: vaccineForm.dose || '1 liều/con',
        route: vaccineForm.route,
        notes: vaccineForm.notes,
      });
      triggerRefresh();
      setIsVaccineModalOpen(false);
      toast.success(`Đã thêm lịch vắc-xin "${vaccineForm.vaccineName}" Ngày ${day}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu lịch vắc-xin');
    }
  };

  const handleDeleteVaccine = async (id) => {
    if (!canEdit) return;
    try {
      await livestockSettingsService.deleteVaccine(currentProgram.id, id);
      triggerRefresh();
      toast.info('Đã xóa lịch vắc-xin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa lịch vắc-xin');
    }
  };

  // ================= HANDLERS: TAB 2 =================
  const handleToggleZoneMetric = async (zoneId, metricId) => {
    if (!canEdit) return;
    const currentList = zoneMetricMatrix[zoneId] || [];
    const isChecked = currentList.includes(metricId);
    const updated = isChecked ? currentList.filter((m) => m !== metricId) : [...currentList, metricId];
    const newMatrix = { ...zoneMetricMatrix, [zoneId]: updated };
    setZoneMetricMatrix(newMatrix);
    try {
      await livestockSettingsService.updateEnvMetrics(farmId, {
        metrics: envMetrics,
        zoneMetricMatrix: newMatrix,
      });
      toast.success('Đã cập nhật ma trận chỉ số môi trường');
    } catch (err) {
      toast.error('Không thể lưu cập nhật chỉ số');
    }
  };

  const handleSaveEnvMetric = async (e) => {
    e.preventDefault();
    if (!envMetricForm.name.trim()) {
      toast.error('Vui lòng nhập tên chỉ số');
      return;
    }
    let updated;
    if (editingEnvMetric) {
      updated = envMetrics.map((m) =>
        m.id === editingEnvMetric.id
          ? {
              ...m,
              ...envMetricForm,
              minVal: Number(envMetricForm.minVal),
              maxVal: Number(envMetricForm.maxVal),
            }
          : m
      );
    } else {
      const newM = {
        id: `ENV_${Date.now()}`,
        ...envMetricForm,
        code: envMetricForm.code || `METRIC_${Date.now()}`,
        minVal: Number(envMetricForm.minVal) || 0,
        maxVal: Number(envMetricForm.maxVal) || 100,
        alertColor: 'text-emerald-700 bg-emerald-50',
      };
      updated = [...envMetrics, newM];
    }
    setEnvMetrics(updated);
    try {
      await livestockSettingsService.updateEnvMetrics(farmId, {
        metrics: updated,
        zoneMetricMatrix,
      });
      triggerRefresh();
      toast.success(`Đã lưu chỉ số môi trường "${envMetricForm.name}"!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu chỉ số môi trường');
    }
    setIsEnvMetricModalOpen(false);
    setEditingEnvMetric(null);
  };

  const handleDeleteEnvMetric = async (metricId) => {
    if (!canEdit) return;
    const updated = envMetrics.filter((m) => m.id !== metricId);
    setEnvMetrics(updated);
    try {
      await livestockSettingsService.updateEnvMetrics(farmId, {
        metrics: updated,
        zoneMetricMatrix,
      });
      triggerRefresh();
      toast.info('Đã xóa chỉ số môi trường');
    } catch (err) {
      toast.error('Lỗi khi xóa chỉ số');
    }
  };

  const handleSaveAllEnvConfig = async () => {
    if (!canEdit) return;
    try {
      await livestockSettingsService.updateEnvMetrics(farmId, {
        metrics: envMetrics,
        zoneMetricMatrix,
      });
      triggerRefresh();
      toast.success('Đã lưu cấu hình môi trường và ma trận khu nuôi thành công!');
    } catch (err) {
      toast.error('Lỗi khi lưu cấu hình môi trường');
    }
  };

  // ================= HANDLERS: TAB 3 =================
  const handleSaveKpiSettings = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    try {
      const currentKpi = kpiSettings[kpiLivestockType] || {};
      const payload = {
        targetFcr: currentKpi.fcrTarget || 1.65,
        maxMortalityRate: currentKpi.maxMortalityRatePct || 3.5,
        adgTargetGram: currentKpi.adgTargetGram || 60,
        targetCostVndPerKg: currentKpi.targetCostVndPerKg || 38000,
        targetHarvestWeightKg: currentKpi.targetHarvestWeightKg || 2.5,
        standardDays: currentKpi.standardDays || 45,
        kpiSettings: kpiSettings,
        cullingReasons: mortalityReasons.map((r) => r.name),
      };
      await livestockSettingsService.updateKpis(farmId, payload);
      triggerRefresh();
      toast.success(`Đã lưu cấu hình KPI mục tiêu cho ${kpiLivestockType === 'POULTRY' ? 'Gia cầm thịt' : 'Gia súc thịt'}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu cấu hình KPI');
    }
  };

  const handleSaveMortalityReason = async (e) => {
    e.preventDefault();
    if (!mortalityForm.name.trim()) {
      toast.error('Vui lòng nhập tên nguyên nhân hao hụt');
      return;
    }
    let updated;
    if (editingMortalityReason) {
      updated = mortalityReasons.map((r) => (r.id === editingMortalityReason.id ? { ...r, ...mortalityForm } : r));
    } else {
      const newR = {
        id: Date.now(),
        code: mortalityForm.code || `HH-${String(mortalityReasons.length + 1).padStart(2, '0')}`,
        ...mortalityForm,
      };
      updated = [...mortalityReasons, newR];
    }
    setMortalityReasons(updated);
    try {
      const currentKpi = kpiSettings[kpiLivestockType] || {};
      const payload = {
        targetFcr: currentKpi.fcrTarget || 1.65,
        maxMortalityRate: currentKpi.maxMortalityRatePct || 3.5,
        adgTargetGram: currentKpi.adgTargetGram || 60,
        targetCostVndPerKg: currentKpi.targetCostVndPerKg || 38000,
        targetHarvestWeightKg: currentKpi.targetHarvestWeightKg || 2.5,
        standardDays: currentKpi.standardDays || 45,
        kpiSettings: kpiSettings,
        cullingReasons: updated.map((r) => r.name),
      };
      await livestockSettingsService.updateKpis(farmId, payload);
      triggerRefresh();
      toast.success('Đã lưu lý do hao hụt lên hệ thống!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu lý do hao hụt');
    }
    setIsMortalityModalOpen(false);
    setEditingMortalityReason(null);
  };

  const handleDeleteMortalityReason = async (id) => {
    if (!canEdit) return;
    const updated = mortalityReasons.filter((r) => r.id !== id);
    setMortalityReasons(updated);
    try {
      const currentKpi = kpiSettings[kpiLivestockType] || {};
      const payload = {
        targetFcr: currentKpi.fcrTarget || 1.65,
        maxMortalityRate: currentKpi.maxMortalityRatePct || 3.5,
        adgTargetGram: currentKpi.adgTargetGram || 60,
        targetCostVndPerKg: currentKpi.targetCostVndPerKg || 38000,
        targetHarvestWeightKg: currentKpi.targetHarvestWeightKg || 2.5,
        standardDays: currentKpi.standardDays || 45,
        kpiSettings: kpiSettings,
        cullingReasons: updated.map((r) => r.name),
      };
      await livestockSettingsService.updateKpis(farmId, payload);
      triggerRefresh();
      toast.info('Đã xóa lý do hao hụt');
    } catch (err) {
      toast.error('Lỗi khi xóa lý do hao hụt');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* THÔNG BÁO CHẾ ĐỘ XEM TỔNG HỢP TOÀN CHUỖI */}
      {currentBranchId === 'ALL' && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs shadow-2xs">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Chế độ xem Toàn chuỗi:</strong> Đang áp dụng quy trình nuôi và mục tiêu KPI chung toàn hệ thống. Hãy chọn chi nhánh cụ thể trên Header nếu muốn thiết lập ma trận chỉ số môi trường riêng biệt theo từng phân khu nuôi.
          </span>
        </div>
      )}

      {/* 1. HEADER CHÍNH CỦA TRANG */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <Sliders className="h-4 w-4" />
            <span>Quy Trình Chuẩn & Dinh Dưỡng Thực Chiến</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Thiết Lập Chăn Nuôi</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Gia Súc & Gia Cầm Thịt
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Cấu hình chương trình nuôi chuẩn theo ngày tuổi (định mức cám & lịch vắc-xin), tùy biến chỉ số môi trường theo khu chuồng và thiết lập chỉ số KPI / lý do hao hụt.
          </p>
        </div>

        {/* Thông tin Chi nhánh & Chế độ xem */}
        <div className="flex items-center gap-3">
          {activeBranch && (
            <div className="hidden sm:flex flex-col items-end text-right p-2 px-3 bg-white border border-slate-200 rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Chi Nhánh Vận Hành</span>
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                {activeBranch.name}
              </span>
            </div>
          )}

          {!canEdit && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-bold">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Chế độ chỉ xem (R)</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. HỆ THỐNG 3 HORIZONTAL TABS */}
      <div className="flex border-b border-slate-200 text-xs overflow-x-auto gap-1 bg-white p-1 rounded-xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('PROGRAMS')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'PROGRAMS'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/70 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>1. Chương Trình Nuôi ({programs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ENVIRONMENT')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'ENVIRONMENT'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/70 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>2. Chỉ Số Môi Trường ({envMetrics.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('KPI_MORTALITY')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'KPI_MORTALITY'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/70 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>3. Mục Tiêu KPI & Danh Mục Hao Hụt</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. NỘI DUNG TAB 1: CHƯƠNG TRÌNH NUÔI (MASTER - DETAIL 30% / 70%)           */}
      {/* ========================================================================= */}
      {activeTab === 'PROGRAMS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (30% - 4 COLS): DANH SÁCH CHƯƠNG TRÌNH NUÔI */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">Quy Trình Mẫu</h2>
                <p className="text-[11px] text-slate-400">Chọn quy trình để cấu hình chi tiết</p>
              </div>
              {canEdit && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setNewProgramForm({
                      name: '',
                      livestockType: 'POULTRY',
                      breedName: '',
                      totalDays: 45,
                      targetWeightKg: 2.5,
                      fcrTarget: 1.65,
                      description: '',
                    });
                    setIsNewProgramModalOpen(true);
                  }}
                  className="text-xs"
                >
                  Tạo Mới
                </Button>
              )}
            </div>

            {/* Tìm kiếm & Lọc loại hình */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên quy trình, giống..."
                  value={searchProgramText}
                  onChange={(e) => setSearchProgramText(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setFilterLivestockType('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterLivestockType === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setFilterLivestockType('POULTRY')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterLivestockType === 'POULTRY'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  🐔 Gia cầm
                </button>
                <button
                  type="button"
                  onClick={() => setFilterLivestockType('SWINE')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterLivestockType === 'SWINE'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  🐷 Gia súc
                </button>
              </div>
            </div>

            {/* Danh sách thẻ chương trình */}
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredPrograms.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                  Không tìm thấy chương trình nuôi phù hợp
                </div>
              ) : (
                filteredPrograms.map((p) => {
                  const isSelected = p.id === currentProgram?.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProgramId(p.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              p.livestockType === 'POULTRY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.livestockTypeName}
                          </span>
                          <h3 className="text-xs font-black text-slate-900 leading-snug">{p.name}</h3>
                          <p className="text-[11px] text-slate-500 font-medium">Giống: {p.breedName}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Thời gian: <strong className="text-slate-800 font-bold">{p.totalDays} ngày</strong>
                        </span>
                        <span className="text-slate-500">
                          FCR mục tiêu: <strong className="text-emerald-700 font-bold font-mono">{p.fcrTarget}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI (70% - 8 COLS): CHI TIẾT LỘ TRÌNH THEO NGÀY TUỔI */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            {/* Header chi tiết chương trình */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    {currentProgram.name}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {currentProgram.totalDays} ngày nuôi
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{currentProgram.description || 'Quy trình nuôi tiêu chuẩn'}</p>
              </div>

              {/* Action buttons: Sửa quy trình & Xóa quy trình */}
              {canEdit && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Pencil className="h-3.5 w-3.5 text-blue-600" />}
                    onClick={() => handleOpenEditProgram(currentProgram)}
                    className="text-xs font-bold border-slate-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Sửa Quy Trình
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 className="h-3.5 w-3.5 text-rose-600" />}
                    onClick={() => handleDeleteProgram(currentProgram.id)}
                    className="text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Xóa Quy Trình
                  </Button>
                </div>
              )}
            </div>

            {/* Sub-tab A/B Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setProgramSubTab('FEED')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    programSubTab === 'FEED'
                      ? 'bg-white text-emerald-800 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>A. Định Mức Cám & Tăng Trọng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProgramSubTab('VACCINE')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    programSubTab === 'VACCINE'
                      ? 'bg-white text-emerald-800 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Syringe className="h-3.5 w-3.5" />
                  <span>B. Lịch Vắc-Xin & Thuốc</span>
                </button>
              </div>

            {/* SUB-TAB A: ĐỊNH MỨC CÁM & TĂNG TRỌNG */}
            {programSubTab === 'FEED' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    Lộ trình chuẩn từ <strong>Ngày 1 đến Ngày {currentProgram.totalDays}</strong> ({currentProgram.feedStandards.length} mốc theo dõi)
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Zap className="h-3.5 w-3.5 text-amber-500" />}
                        onClick={() => {
                          if (feedMaterials.length > 0 && !batchDaysForm.materialId) {
                            setBatchDaysForm((prev) => ({
                              ...prev,
                              materialId: feedMaterials[0].id,
                              feedType: feedMaterials[0].name,
                            }));
                          }
                          setIsBatchDaysModalOpen(true);
                        }}
                        className="text-xs border-amber-300 text-amber-900 hover:bg-amber-50"
                      >
                        Tạo Nhanh Theo Khoảng Ngày
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-3.5 w-3.5" />}
                        onClick={() => {
                          const defaultFeed = feedMaterials[0] || {};
                          setFeedDayForm({
                            dayAge: (currentProgram.feedStandards[currentProgram.feedStandards.length - 1]?.dayAge || 0) + 1,
                            stage: 'Tăng trưởng',
                            materialId: defaultFeed.id || 1,
                            feedType: defaultFeed.name || 'Cám hỗn hợp chuẩn',
                            feedAmount: 100,
                            unit: 'g/con',
                            standardWeight: 1.0,
                          });
                          setIsFeedDayModalOpen(true);
                        }}
                        className="text-xs"
                      >
                        Thêm Dòng Ngày
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bảng định mức */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-20 text-center">Ngày Tuổi</th>
                          <th className="py-2.5 px-3 w-28">Giai Đoạn</th>
                          <th className="py-2.5 px-4">Loại Cám Áp Dụng (Kho Hàng)</th>
                          <th className="py-2.5 px-3 text-right">Định Mức Ăn / Con</th>
                          <th className="py-2.5 px-3 text-right">TL Chuẩn / Con</th>
                          {canEdit && <th className="py-2.5 px-3 text-center w-20">Thao Tác</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {currentProgram.feedStandards.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3 text-center">
                              <span className="inline-block px-2 py-0.5 font-mono font-black text-xs rounded bg-slate-100 text-slate-800">
                                Ngày {item.dayAge}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.stage === 'Úm'
                                    ? 'bg-amber-100 text-amber-800'
                                    : item.stage === 'Tăng trưởng'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {item.stage}
                              </span>
                            </td>
                            <td className="py-2 px-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{item.feedType}</span>
                                {item.materialId ? (
                                  <span
                                    className="text-[10px] bg-emerald-50 text-emerald-700 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-200"
                                    title={`Liên kết vật tư kho: #${item.materialId}`}
                                  >
                                    Kho #{item.materialId}
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-slate-100 text-slate-400 font-mono px-1 py-0.5 rounded">
                                    Chưa gán kho
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {item.feedAmount} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">
                              {item.standardWeight} kg
                            </td>
                            {canEdit && (
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFeedDay(item.dayAge, item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                                  title="Xóa dòng này"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB B: LỊCH VẮC-XIN & THUỐC PHÒNG BỆNH */}
            {programSubTab === 'VACCINE' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    Lộ trình tiêm phòng dịch tễ tự động bắn thông báo nhắc việc cho nhân sự chuồng ({currentProgram.vaccineTimeline.length} đợt)
                  </div>

                  {canEdit && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setVaccineForm({
                          dayAge: 1,
                          vaccineName: '',
                          dose: '1 liều/con',
                          route: 'Pha nước uống',
                          notes: '',
                        });
                        setIsVaccineModalOpen(true);
                      }}
                      className="text-xs"
                    >
                      Thêm Lịch Vắc-Xin
                    </Button>
                  )}
                </div>

                {/* Danh sách Timeline theo ngày tuổi */}
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
                  {currentProgram.vaccineTimeline.map((item) => (
                    <div
                      key={item.id}
                      className="relative pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      {/* Node tròn mốc ngày tuổi */}
                      <div className="absolute left-2.5 top-3.5 -translate-x-1/2 w-7 h-7 rounded-full bg-emerald-600 text-white font-mono font-black text-[11px] flex items-center justify-center shadow-xs ring-4 ring-white">
                        {item.dayAge}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{item.vaccineName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.route.includes('Tiêm')
                                ? 'bg-rose-100 text-rose-800'
                                : item.route.includes('Nhỏ')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.route}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Liều lượng: <strong className="text-slate-800">{item.dose}</strong>
                        </p>
                        {item.notes && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded-md mt-1 border border-slate-100">
                            💡 {item.notes}
                          </p>
                        )}
                      </div>

                      {canEdit && (
                        <div className="shrink-0 flex items-center gap-1 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteVaccine(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="Xóa đợt này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NỘI DUNG TAB 2: CHỈ SỐ MÔI TRƯỜNG                                      */}
      {/* ========================================================================= */}
      {activeTab === 'ENVIRONMENT' && (
        <div className="space-y-6">
          {/* PHẦN TRÊN: DANH MỤC CHỈ SỐ THEO DÕI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <span>Phần 1: Danh Mục Chỉ Số Môi Trường & Ngưỡng An Toàn</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập các thông số khí hậu chuồng nuôi và khoảng giá trị Min - Max cho phép. Vượt ngưỡng hệ thống sẽ tự động tô đỏ cảnh báo.
                </p>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Save className="h-3.5 w-3.5 text-emerald-600" />}
                    onClick={handleSaveAllEnvConfig}
                    className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold"
                  >
                    Lưu Cấu Hình Môi Trường
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setEditingEnvMetric(null);
                      setEnvMetricForm({
                        name: '',
                        code: '',
                        unit: '°C',
                        minVal: '',
                        maxVal: '',
                        frequency: '3 lần / ngày',
                        description: '',
                      });
                      setIsEnvMetricModalOpen(true);
                    }}
                    className="text-xs shrink-0"
                  >
                    Thêm Chỉ Số Mới
                  </Button>
                </div>
              )}
            </div>

            {/* Bảng danh sách chỉ số */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Tên Chỉ Số Môi Trường</th>
                      <th className="py-2.5 px-3 w-24 text-center">Đơn Vị Đo</th>
                      <th className="py-2.5 px-4 text-center">Ngưỡng An Toàn (Min - Max)</th>
                      <th className="py-2.5 px-4">Tần Suất Đo Khuyến Nghị</th>
                      <th className="py-2.5 px-4">Diễn Giải Nghiệp Vụ</th>
                      {canEdit && <th className="py-2.5 px-3 text-center w-24">Thao Tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {envMetrics.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                              {m.code}
                            </span>
                            <span>{m.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-slate-800">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {m.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span>{m.minVal}</span>
                            <span className="text-slate-400">→</span>
                            <span>{m.maxVal} {m.unit}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{m.frequency}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">{m.description}</td>
                        {canEdit && (
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEnvMetric(m);
                                  setEnvMetricForm({
                                    name: m.name,
                                    code: m.code,
                                    unit: m.unit,
                                    minVal: m.minVal,
                                    maxVal: m.maxVal,
                                    frequency: m.frequency,
                                    description: m.description,
                                  });
                                  setIsEnvMetricModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100"
                                title="Sửa chỉ số"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEnvMetric(m.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                title="Xóa chỉ số"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PHẦN DƯỚI: MA TRẬN ÁP DỤNG CHO TỪNG KHU NUÔI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                  <span>Phần 2: Ma Trận Phân Bổ Chỉ Số Áp Dụng Cho Khu Nuôi</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tích chọn chỉ số môi trường sẽ hiển thị trên phiếu <strong>Ghi nhật ký môi trường</strong> hằng ngày của công nhân theo từng khu chuồng.
                </p>
              </div>

              <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                Tự động lưu khi tích chọn
              </div>
            </div>

            {/* Bảng ma trận 2 chiều */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-64 bg-slate-100/70 border-r border-slate-200">
                        Chỉ Số Môi Trường \ Khu Nuôi
                      </th>
                      {zones.map((zone) => {
                        const activeCount = (zoneMetricMatrix[zone.id] || []).length;
                        return (
                          <th key={zone.id} className="py-3 px-3 text-center min-w-[140px] border-r border-slate-100 last:border-r-0">
                            <div className="font-black text-slate-900">{zone.name}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              ({activeCount} / {envMetrics.length} chỉ số bật)
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {envMetrics.map((metric) => (
                      <tr key={metric.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/40 border-r border-slate-200">
                          <div className="flex items-center justify-between gap-2">
                            <span>{metric.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">({metric.unit})</span>
                          </div>
                        </td>

                        {zones.map((zone) => {
                          const isChecked = (zoneMetricMatrix[zone.id] || []).includes(metric.id);
                          return (
                            <td
                              key={`${zone.id}_${metric.id}`}
                              className="py-3 px-3 text-center border-r border-slate-100 last:border-r-0"
                            >
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => handleToggleZoneMetric(zone.id, metric.id)}
                                className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all ${
                                  isChecked
                                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                } ${!canEdit ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                title={isChecked ? 'Đang bật - Bấm để tắt' : 'Đang tắt - Bấm để bật'}
                              >
                                {isChecked ? <CheckCircle2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. NỘI DUNG TAB 3: MỤC TIÊU KPI & DANH MỤC LÝ DO HAO HỤT                   */}
      {/* ========================================================================= */}
      {activeTab === 'KPI_MORTALITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KHỐI 1 (5 COLS): CẤU HÌNH NGƯỠNG MỤC TIÊU KPI CHUẨN */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <span>Khối 1: Ngưỡng Mục Tiêu KPI Chuẩn</span>
                </h2>
                <p className="text-[11px] text-slate-400">Thước đo đánh giá hiệu quả báo cáo kết lứa</p>
              </div>

              {/* Switch loại hình: Gia cầm vs Gia súc */}
              <div className="flex items-center p-1 bg-slate-100 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setKpiLivestockType('POULTRY')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    kpiLivestockType === 'POULTRY'
                      ? 'bg-white text-emerald-800 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🐔 Gia Cầm
                </button>
                <button
                  type="button"
                  onClick={() => setKpiLivestockType('SWINE')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    kpiLivestockType === 'SWINE'
                      ? 'bg-white text-emerald-800 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🐷 Gia Súc
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveKpiSettings} className="space-y-4">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Đang xem chỉ tiêu chuẩn cho:{' '}
                  <strong>{kpiLivestockType === 'POULTRY' ? 'Gia cầm thịt (Gà/Vịt)' : 'Gia súc thịt (Heo)'}</strong>
                </span>
              </div>

              {/* 1. Hệ số FCR */}
              <FormField
                label="1. Hệ số tiêu tốn thức ăn (FCR) mục tiêu"
                hint="Tổng kg thức ăn ăn vào / 1kg tăng khối lượng cơ thể (VD: 1.65 cho gà, 2.40 cho heo)"
              >
                <Input
                  type="number"
                  step="0.01"
                  disabled={!canEdit}
                  value={kpiSettings[kpiLivestockType].fcrTarget}
                  onChange={(e) =>
                    setKpiSettings((prev) => ({
                      ...prev,
                      [kpiLivestockType]: {
                        ...prev[kpiLivestockType],
                        fcrTarget: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  prefixIcon={<TrendingUp className="h-4 w-4" />}
                />
              </FormField>

              {/* 2. Tỷ lệ hao hụt tối đa */}
              <FormField
                label="2. Tỷ lệ hao hụt / chết tối đa cho phép (%)"
                hint="Vượt quá ngưỡng này báo cáo lứa nuôi sẽ cảnh báo đỏ (VD: <= 3.0%)"
              >
                <Input
                  type="number"
                  step="0.1"
                  disabled={!canEdit}
                  value={kpiSettings[kpiLivestockType].maxMortalityRatePct}
                  onChange={(e) =>
                    setKpiSettings((prev) => ({
                      ...prev,
                      [kpiLivestockType]: {
                        ...prev[kpiLivestockType],
                        maxMortalityRatePct: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  prefixIcon={<AlertTriangle className="h-4 w-4" />}
                />
              </FormField>

              {/* 3. ADG Tăng trọng ngày */}
              <FormField
                label="3. Tăng trọng trung bình ngày (ADG) mục tiêu (gram/con/ngày)"
                hint="Tốc độ tăng trưởng ngày (VD: 62g/ngày cho gà, 780g/ngày cho heo thịt)"
              >
                <Input
                  type="number"
                  disabled={!canEdit}
                  value={kpiSettings[kpiLivestockType].adgTargetGram}
                  onChange={(e) =>
                    setKpiSettings((prev) => ({
                      ...prev,
                      [kpiLivestockType]: {
                        ...prev[kpiLivestockType],
                        adgTargetGram: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  prefixIcon={<Scale className="h-4 w-4" />}
                />
              </FormField>

              {/* 4. Giá thành mục tiêu */}
              <FormField
                label="4. Chi phí giá thành mục tiêu (VNĐ / kg thịt hơi)"
                hint="Ngưỡng chi phí hòa vốn và có lãi dự kiến (VD: 38.500 VNĐ cho gà, 52.000 VNĐ cho heo)"
              >
                <Input
                  type="number"
                  step="500"
                  disabled={!canEdit}
                  value={kpiSettings[kpiLivestockType].targetCostVndPerKg}
                  onChange={(e) =>
                    setKpiSettings((prev) => ({
                      ...prev,
                      [kpiLivestockType]: {
                        ...prev[kpiLivestockType],
                        targetCostVndPerKg: parseInt(e.target.value, 10) || 0,
                      },
                    }))
                  }
                  prefixIcon={<DollarSign className="h-4 w-4" />}
                />
              </FormField>

              {/* 5. Khối lượng xuất chuồng & Số ngày nuôi */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="TL xuất chuẩn (kg/con)">
                  <Input
                    type="number"
                    step="0.1"
                    disabled={!canEdit}
                    value={kpiSettings[kpiLivestockType].targetHarvestWeightKg}
                    onChange={(e) =>
                      setKpiSettings((prev) => ({
                        ...prev,
                        [kpiLivestockType]: {
                          ...prev[kpiLivestockType],
                          targetHarvestWeightKg: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </FormField>

                <FormField label="Số ngày nuôi chuẩn">
                  <Input
                    type="number"
                    disabled={!canEdit}
                    value={kpiSettings[kpiLivestockType].standardDays}
                    onChange={(e) =>
                      setKpiSettings((prev) => ({
                        ...prev,
                        [kpiLivestockType]: {
                          ...prev[kpiLivestockType],
                          standardDays: parseInt(e.target.value, 10) || 0,
                        },
                      }))
                    }
                  />
                </FormField>
              </div>

              {canEdit && (
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<Save className="h-4 w-4" />}
                    className="w-full text-xs font-bold"
                  >
                    Lưu Cấu Hình KPI Mục Tiêu
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* KHỐI 2 (7 COLS): DANH MỤC LÝ DO HAO HỤT / LOẠI THẢI */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Skull className="h-4 w-4 text-rose-600" />
                  <span>Khối 2: Danh Mục Lý Do Hao Hụt & Loại Thải ({mortalityReasons.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đổ dữ liệu ra menu chọn nhanh cho công nhân khi báo chết hoặc loại thải ở mục <strong>Ghi nhật ký hằng ngày</strong>.
                </p>
              </div>

              {canEdit && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setEditingMortalityReason(null);
                    setMortalityForm({
                      code: `HH-${String(mortalityReasons.length + 1).padStart(2, '0')}`,
                      name: '',
                      category: 'Bệnh tiêu hóa',
                      severity: 'BÌNH THƯỜNG',
                      appliesTo: 'Tất cả',
                      description: '',
                    });
                    setIsMortalityModalOpen(true);
                  }}
                  className="text-xs shrink-0"
                >
                  Thêm Lý Do
                </Button>
              )}
            </div>

            {/* Bảng danh mục lý do */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-16 text-center">Mã</th>
                      <th className="py-2.5 px-4">Tên Nguyên Nhân Tử Vong / Loại Thải</th>
                      <th className="py-2.5 px-3">Phân Nhóm</th>
                      <th className="py-2.5 px-3">Mức Độ Cảnh Báo</th>
                      {canEdit && <th className="py-2.5 px-3 text-center w-20">Thao Tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {mortalityReasons.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {r.code}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          <div>{r.name}</div>
                          {r.description && <p className="text-[10px] text-slate-400 font-normal italic">{r.description}</p>}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {r.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.severity.includes('NGUY HIỂM') || r.severity.includes('CẤP BÁO')
                                ? 'bg-rose-100 text-rose-800'
                                : r.severity.includes('CẦN CÁCH LY')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {r.severity}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMortalityReason(r);
                                  setMortalityForm({
                                    code: r.code,
                                    name: r.name,
                                    category: r.category,
                                    severity: r.severity,
                                    appliesTo: r.appliesTo,
                                    description: r.description,
                                  });
                                  setIsMortalityModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100"
                                title="Sửa lý do"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMortalityReason(r.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                title="Xóa lý do"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. HỆ THỐNG CÁC MODALS NGHIỆP VỤ                                          */}
      {/* ========================================================================= */}

      {/* MODAL 1: TẠO CHƯƠNG TRÌNH NUÔI MỚI */}
      <Modal
        isOpen={isNewProgramModalOpen}
        onClose={() => setIsNewProgramModalOpen(false)}
        title="Tạo Chương Trình Nuôi Mới"
        subtitle="Thiết lập quy trình mẫu chuẩn cho giống gia súc hoặc gia cầm thịt"
        icon={<Layers className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleCreateProgram} className="space-y-4">
          <FormField label="Tên chương trình nuôi" required>
            <Input
              placeholder="VD: Quy trình Gà thịt CP 45 ngày, Heo thịt 120 ngày..."
              value={newProgramForm.name}
              onChange={(e) => setNewProgramForm({ ...newProgramForm, name: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Loại vật nuôi" required>
              <Select
                value={newProgramForm.livestockType}
                onChange={(e) => setNewProgramForm({ ...newProgramForm, livestockType: e.target.value })}
                options={[
                  { value: 'POULTRY', label: '🐔 Gia cầm thịt (Gà, Vịt, Ngan)' },
                  { value: 'SWINE', label: '🐷 Gia súc thịt (Heo thịt)' },
                ]}
              />
            </FormField>

            <FormField label="Tên giống vật nuôi" required>
              <Input
                placeholder="VD: Ross 308, Duroc x Yorkshire..."
                value={newProgramForm.breedName}
                onChange={(e) => setNewProgramForm({ ...newProgramForm, breedName: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Tổng số ngày nuôi">
              <Input
                type="number"
                value={newProgramForm.totalDays}
                onChange={(e) => setNewProgramForm({ ...newProgramForm, totalDays: e.target.value })}
              />
            </FormField>

            <FormField label="TL xuất chuẩn (kg)">
              <Input
                type="number"
                step="0.1"
                value={newProgramForm.targetWeightKg}
                onChange={(e) => setNewProgramForm({ ...newProgramForm, targetWeightKg: e.target.value })}
              />
            </FormField>

            <FormField label="FCR mục tiêu">
              <Input
                type="number"
                step="0.01"
                value={newProgramForm.fcrTarget}
                onChange={(e) => setNewProgramForm({ ...newProgramForm, fcrTarget: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Mô tả / Ghi chú quy trình">
            <textarea
              rows={3}
              placeholder="Ghi chú điều kiện chuồng trại, thời vụ áp dụng..."
              value={newProgramForm.description}
              onChange={(e) => setNewProgramForm({ ...newProgramForm, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsNewProgramModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Tạo Quy Trình
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: TẠO NHANH ĐỊNH MỨC THEO KHOẢNG NGÀY */}
      <Modal
        isOpen={isBatchDaysModalOpen}
        onClose={() => setIsBatchDaysModalOpen(false)}
        title="⚡ Tạo Nhanh Theo Khoảng Ngày Tuổi"
        subtitle="Tự động điền hàng loạt định mức cám cho nhiều ngày cùng một lúc"
        icon={<Zap className="h-5 w-5 text-amber-500" />}
      >
        <form onSubmit={handleApplyBatchDays} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Từ ngày tuổi" required>
              <Input
                type="number"
                min="1"
                value={batchDaysForm.fromDay}
                onChange={(e) => setBatchDaysForm({ ...batchDaysForm, fromDay: e.target.value })}
              />
            </FormField>

            <FormField label="Đến ngày tuổi" required>
              <Input
                type="number"
                min="1"
                value={batchDaysForm.toDay}
                onChange={(e) => setBatchDaysForm({ ...batchDaysForm, toDay: e.target.value })}
              />
            </FormField>

            <FormField label="Bước nhảy (ngày)">
              <Input
                type="number"
                min="1"
                value={batchDaysForm.stepDays || 1}
                onChange={(e) => setBatchDaysForm({ ...batchDaysForm, stepDays: Math.max(1, Number(e.target.value) || 1) })}
              />
            </FormField>
          </div>

          <FormField label="Giai đoạn phát triển">
            <Select
              value={batchDaysForm.stage}
              onChange={(e) => setBatchDaysForm({ ...batchDaysForm, stage: e.target.value })}
              options={[
                { value: 'Úm', label: 'Giai đoạn Úm (Con non)' },
                { value: 'Tăng trưởng', label: 'Giai đoạn Tăng trưởng' },
                { value: 'Vỗ béo', label: 'Giai đoạn Vỗ béo / Xuất chuồng' },
              ]}
            />
          </FormField>

          <FormField label="Loại cám áp dụng (Từ kho hàng hóa)" required>
            <Select
              value={batchDaysForm.materialId ? String(batchDaysForm.materialId) : ''}
              onChange={(e) => {
                const selectedId = Number(e.target.value);
                const mat = feedMaterials.find((m) => m.id === selectedId);
                setBatchDaysForm({
                  ...batchDaysForm,
                  materialId: selectedId,
                  feedType: mat ? mat.name : batchDaysForm.feedType,
                });
              }}
              options={
                feedMaterials.length > 0
                  ? feedMaterials.map((m) => ({
                      value: String(m.id),
                      label: `${m.name} (${m.skuCode || 'Mã #' + m.id})${m.standardUnit ? ` - ĐVT: ${m.standardUnit}` : ''}`,
                    }))
                  : [{ value: '1', label: 'Cám hỗn hợp hoàn chỉnh (Kho mặc định)' }]
              }
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Định mức ăn/con" required>
              <Input
                type="number"
                step="0.1"
                value={batchDaysForm.feedAmount}
                onChange={(e) => setBatchDaysForm({ ...batchDaysForm, feedAmount: e.target.value })}
              />
            </FormField>

            <FormField label="Đơn vị">
              <Select
                value={batchDaysForm.unit}
                onChange={(e) => setBatchDaysForm({ ...batchDaysForm, unit: e.target.value })}
                options={[
                  { value: 'g/con', label: 'gram / con / ngày' },
                  { value: 'kg/con', label: 'kg / con / ngày' },
                ]}
              />
            </FormField>

            <FormField label="TL chuẩn (kg)">
              <Input
                type="number"
                step="0.01"
                value={batchDaysForm.standardWeight}
                onChange={(e) => setBatchDaysForm({ ...batchDaysForm, standardWeight: e.target.value })}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsBatchDaysModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Áp Dụng Hàng Loạt
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: THÊM DÒNG ĐỊNH MỨC CÁM NGÀY TUỔI */}
      <Modal
        isOpen={isFeedDayModalOpen}
        onClose={() => setIsFeedDayModalOpen(false)}
        title="Thêm / Sửa Định Mức Ngày Tuổi"
        subtitle="Cấu hình khẩu phần ăn và trọng lượng tăng chuẩn cho một ngày cụ thể"
        icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleSaveFeedDay} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày tuổi" required>
              <Input
                type="number"
                min="1"
                value={feedDayForm.dayAge}
                onChange={(e) => setFeedDayForm({ ...feedDayForm, dayAge: e.target.value })}
              />
            </FormField>

            <FormField label="Giai đoạn">
              <Select
                value={feedDayForm.stage}
                onChange={(e) => setFeedDayForm({ ...feedDayForm, stage: e.target.value })}
                options={[
                  { value: 'Úm', label: 'Úm' },
                  { value: 'Tăng trưởng', label: 'Tăng trưởng' },
                  { value: 'Vỗ béo', label: 'Vỗ béo' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Loại cám áp dụng (Từ kho hàng hóa)" required>
            <Select
              value={feedDayForm.materialId ? String(feedDayForm.materialId) : ''}
              onChange={(e) => {
                const selectedId = Number(e.target.value);
                const mat = feedMaterials.find((m) => m.id === selectedId);
                setFeedDayForm({
                  ...feedDayForm,
                  materialId: selectedId,
                  feedType: mat ? mat.name : feedDayForm.feedType,
                });
              }}
              options={
                feedMaterials.length > 0
                  ? feedMaterials.map((m) => ({
                      value: String(m.id),
                      label: `${m.name} (${m.skuCode || 'Mã #' + m.id})${m.standardUnit ? ` - ĐVT: ${m.standardUnit}` : ''}`,
                    }))
                  : [{ value: '1', label: 'Cám hỗn hợp hoàn chỉnh (Kho mặc định)' }]
              }
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Định mức ăn" required>
              <Input
                type="number"
                step="0.1"
                value={feedDayForm.feedAmount}
                onChange={(e) => setFeedDayForm({ ...feedDayForm, feedAmount: e.target.value })}
              />
            </FormField>

            <FormField label="Đơn vị">
              <Select
                value={feedDayForm.unit}
                onChange={(e) => setFeedDayForm({ ...feedDayForm, unit: e.target.value })}
                options={[
                  { value: 'g/con', label: 'gram / con' },
                  { value: 'kg/con', label: 'kg / con' },
                ]}
              />
            </FormField>

            <FormField label="TL chuẩn (kg)">
              <Input
                type="number"
                step="0.01"
                value={feedDayForm.standardWeight}
                onChange={(e) => setFeedDayForm({ ...feedDayForm, standardWeight: e.target.value })}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsFeedDayModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu Định Mức
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: THÊM LỊCH VẮC-XIN / THUỐC PHÒNG */}
      <Modal
        isOpen={isVaccineModalOpen}
        onClose={() => setIsVaccineModalOpen(false)}
        title="Thêm Lịch Vắc-Xin & Thuốc Phòng Bệnh"
        subtitle="Hệ thống sẽ dựa vào ngày tuổi để tự động gửi thông báo nhắc việc"
        icon={<Syringe className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleSaveVaccine} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày tuổi thực hiện" required>
              <Input
                type="number"
                min="1"
                value={vaccineForm.dayAge}
                onChange={(e) => setVaccineForm({ ...vaccineForm, dayAge: e.target.value })}
              />
            </FormField>

            <FormField label="Đường dùng thuốc / vắc-xin" required>
              <Select
                value={vaccineForm.route}
                onChange={(e) => setVaccineForm({ ...vaccineForm, route: e.target.value })}
                options={[
                  { value: 'Pha nước uống', label: 'Pha nước uống' },
                  { value: 'Nhỏ mắt / Nhỏ mũi', label: 'Nhỏ mắt / Nhỏ mũi' },
                  { value: 'Tiêm bắp', label: 'Tiêm bắp (ức / đùi)' },
                  { value: 'Tiêm dưới da cổ', label: 'Tiêm dưới da cổ' },
                  { value: 'Trộn cám', label: 'Trộn cám ăn' },
                  { value: 'Châm cánh', label: 'Châm cánh (Đậu gà)' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Tên Vắc-xin / Thuốc phòng" required>
            <Input
              placeholder="VD: ND-IB lần 1, Gumboro chủng D78, Mycoplasma..."
              value={vaccineForm.vaccineName}
              onChange={(e) => setVaccineForm({ ...vaccineForm, vaccineName: e.target.value })}
            />
          </FormField>

          <FormField label="Liều lượng / con" required>
            <Input
              placeholder="VD: 1 liều/con, 0.5 ml/con, 1g/10 con..."
              value={vaccineForm.dose}
              onChange={(e) => setVaccineForm({ ...vaccineForm, dose: e.target.value })}
            />
          </FormField>

          <FormField label="Ghi chú kỹ thuật & hướng dẫn nhắc việc">
            <textarea
              rows={3}
              placeholder="VD: Cắt nước 2h trước uống, pha với sữa gầy, chỉ tiêm cho đàn khỏe mạnh..."
              value={vaccineForm.notes}
              onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsVaccineModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu Lịch Vắc-Xin
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: THÊM / SỬA CHỈ SỐ MÔI TRƯỜNG */}
      <Modal
        isOpen={isEnvMetricModalOpen}
        onClose={() => setIsEnvMetricModalOpen(false)}
        title={editingEnvMetric ? 'Chỉnh Sửa Chỉ Số Môi Trường' : 'Thêm Chỉ Số Môi Trường Mới'}
        subtitle="Cấu hình thông số và khoảng Min - Max cảnh báo vượt ngưỡng"
        icon={<Activity className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleSaveEnvMetric} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tên chỉ số" required>
              <Input
                placeholder="VD: Nhiệt độ chuồng, Nồng độ NH3..."
                value={envMetricForm.name}
                onChange={(e) => setEnvMetricForm({ ...envMetricForm, name: e.target.value })}
              />
            </FormField>

            <FormField label="Mã viết tắt / Ký hiệu">
              <Input
                placeholder="VD: TEMP, HUMID, NH3..."
                value={envMetricForm.code}
                onChange={(e) => setEnvMetricForm({ ...envMetricForm, code: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Đơn vị đo" required>
              <Input
                placeholder="VD: °C, %, ppm, Lít..."
                value={envMetricForm.unit}
                onChange={(e) => setEnvMetricForm({ ...envMetricForm, unit: e.target.value })}
              />
            </FormField>

            <FormField label="Ngưỡng Min an toàn" required>
              <Input
                type="number"
                step="0.1"
                placeholder="VD: 24.0"
                value={envMetricForm.minVal}
                onChange={(e) => setEnvMetricForm({ ...envMetricForm, minVal: e.target.value })}
              />
            </FormField>

            <FormField label="Ngưỡng Max an toàn" required>
              <Input
                type="number"
                step="0.1"
                placeholder="VD: 32.5"
                value={envMetricForm.maxVal}
                onChange={(e) => setEnvMetricForm({ ...envMetricForm, maxVal: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Tần suất đo khuyến nghị">
            <Input
              placeholder="VD: 3 lần / ngày (Sáng, Trưa, Tối), Đo liên tục..."
              value={envMetricForm.frequency}
              onChange={(e) => setEnvMetricForm({ ...envMetricForm, frequency: e.target.value })}
            />
          </FormField>

          <FormField label="Diễn giải & hướng dẫn xử lý khi vượt ngưỡng">
            <textarea
              rows={2}
              placeholder="VD: Vượt 32°C cần bật thêm dàn lạnh và quạt hút..."
              value={envMetricForm.description}
              onChange={(e) => setEnvMetricForm({ ...envMetricForm, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEnvMetricModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingEnvMetric ? 'Cập Nhật' : 'Thêm Chỉ Số'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: THÊM / SỬA LÝ DO HAO HỤT / LOẠI THẢI */}
      <Modal
        isOpen={isMortalityModalOpen}
        onClose={() => setIsMortalityModalOpen(false)}
        title={editingMortalityReason ? 'Chỉnh Sửa Lý Do Hao Hụt' : 'Thêm Lý Do Hao Hụt / Loại Thải Mới'}
        subtitle="Chuẩn hóa nguyên nhân để công nhân chọn nhanh khi ghi nhật ký"
        icon={<Skull className="h-5 w-5 text-rose-600" />}
      >
        <form onSubmit={handleSaveMortalityReason} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Mã nguyên nhân" required>
              <Input
                placeholder="VD: HH-01, HH-02..."
                value={mortalityForm.code}
                onChange={(e) => setMortalityForm({ ...mortalityForm, code: e.target.value })}
              />
            </FormField>

            <FormField label="Phân nhóm nguyên nhân" required>
              <Select
                value={mortalityForm.category}
                onChange={(e) => setMortalityForm({ ...mortalityForm, category: e.target.value })}
                options={[
                  { value: 'Bệnh tiêu hóa', label: 'Bệnh tiêu hóa (Tiêu chảy, E.coli...)' },
                  { value: 'Bệnh hô hấp', label: 'Bệnh hô hấp (Hen khẹc, CRD, Suyễn...)' },
                  { value: 'Dịch bệnh truyền nhiễm', label: 'Dịch bệnh truyền nhiễm nguy hiểm' },
                  { value: 'Chấn thương cơ học', label: 'Chấn thương cơ học (Đè, cắn nhau...)' },
                  { value: 'Môi trường chuồng', label: 'Môi trường chuồng (Sốc nhiệt, ngạt khí...)' },
                  { value: 'Còi cọc loại thải', label: 'Còi cọc kém ăn (Chủ động loại)' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Tên nguyên nhân tử vong / loại thải" required>
            <Input
              placeholder="VD: Tiêu chảy E.coli, Hen khẹc CRD, Đè dẫm đạp..."
              value={mortalityForm.name}
              onChange={(e) => setMortalityForm({ ...mortalityForm, name: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Mức độ cảnh báo" required>
              <Select
                value={mortalityForm.severity}
                onChange={(e) => setMortalityForm({ ...mortalityForm, severity: e.target.value })}
                options={[
                  { value: 'BÌNH THƯỜNG', label: 'BÌNH THƯỜNG' },
                  { value: 'CẦN XỬ LÝ', label: 'CẦN XỬ LÝ' },
                  { value: 'CẦN CÁCH LY', label: 'CẦN CÁCH LY' },
                  { value: 'NGUY HIỂM CAO', label: 'NGUY HIỂM CAO' },
                  { value: 'CẤP BÁO THÚ Y NGAY', label: 'CẤP BÁO THÚ Y NGAY' },
                ]}
              />
            </FormField>

            <FormField label="Áp dụng cho">
              <Select
                value={mortalityForm.appliesTo}
                onChange={(e) => setMortalityForm({ ...mortalityForm, appliesTo: e.target.value })}
                options={[
                  { value: 'Tất cả', label: 'Tất cả vật nuôi' },
                  { value: 'Gia cầm', label: 'Chỉ gia cầm thịt' },
                  { value: 'Gia súc', label: 'Chỉ gia súc thịt' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Mô tả triệu chứng nhận biết">
            <textarea
              rows={2}
              placeholder="Mô tả phân, màu da, hành vi để công nhân đối chiếu..."
              value={mortalityForm.description}
              onChange={(e) => setMortalityForm({ ...mortalityForm, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsMortalityModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingMortalityReason ? 'Cập Nhật' : 'Lưu Lý Do'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL SỬA QUY TRÌNH NUÔI */}
      <Modal
        isOpen={isEditProgramModalOpen}
        onClose={() => setIsEditProgramModalOpen(false)}
        title="Chỉnh Sửa Quy Trình Nuôi"
        subtitle="Cập nhật thông số kỹ thuật, giống và mục tiêu tăng trọng"
        icon={<Pencil className="h-5 w-5 text-blue-600" />}
      >
        <form onSubmit={handleUpdateProgram} className="space-y-4">
          <FormField label="Tên quy trình nuôi" required>
            <Input
              value={editProgramForm.name}
              onChange={(e) => setEditProgramForm({ ...editProgramForm, name: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Loại hình vật nuôi" required>
              <Select
                value={editProgramForm.livestockType}
                onChange={(e) => setEditProgramForm({ ...editProgramForm, livestockType: e.target.value })}
                options={[
                  { value: 'POULTRY', label: '🐔 Gia cầm thịt (Gà, Vịt...)' },
                  { value: 'SWINE', label: '🐷 Gia súc thịt (Heo)' },
                  { value: 'CATTLE', label: '🐂 Bò thịt / Khác' },
                ]}
              />
            </FormField>

            <FormField label="Tên giống chuẩn">
              <Input
                value={editProgramForm.breedName}
                onChange={(e) => setEditProgramForm({ ...editProgramForm, breedName: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Tổng ngày nuôi" required>
              <Input
                type="number"
                value={editProgramForm.totalDays}
                onChange={(e) => setEditProgramForm({ ...editProgramForm, totalDays: e.target.value })}
              />
            </FormField>

            <FormField label="TL xuất bán (kg)">
              <Input
                type="number"
                step="0.01"
                value={editProgramForm.targetWeightKg}
                onChange={(e) => setEditProgramForm({ ...editProgramForm, targetWeightKg: e.target.value })}
              />
            </FormField>

            <FormField label="FCR mục tiêu">
              <Input
                type="number"
                step="0.01"
                value={editProgramForm.fcrTarget}
                onChange={(e) => setEditProgramForm({ ...editProgramForm, fcrTarget: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Mô tả quy trình kỹ thuật">
            <textarea
              rows={2}
              value={editProgramForm.description}
              onChange={(e) => setEditProgramForm({ ...editProgramForm, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditProgramModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu Thay Đổi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LivestockSettingsPage;
