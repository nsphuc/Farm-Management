import React, { useState, useEffect } from 'react';
import { Sprout, AlertCircle, Info, Calendar, MapPin, Layers } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, CodeInput } from '@/components/ui/FormControls';
import { farmingService } from '@/services/modules/farmingService';
import { masterDataService } from '@/services/modules/masterDataService';
import { geographyService } from '@/services/modules/geographyService';
import { inventoryService } from '@/services/modules/inventoryService';
import { generateEntityCode, commitSequentialCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { formatArea } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function CropSeasonModal({
  isOpen,
  onClose,
  farmId,
  editingSeason = null,
  seasons = [],
  onSuccess,
}) {
  const { notifyDataChanged } = useActiveFarmStore();

  const [formData, setFormData] = useState({
    seasonCode: '',
    zoneId: '',
    locationId: '',
    operationalCycleId: '',
    cropTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
    plantedAreaM2: '',
    seedQuantity: '',
    seedUnit: 'gói',
    estimatedYieldValue: '',
    estimatedYieldUnit: 'kg',
    estimatedYieldKg: '',
  });

  const [zones, setZones] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [cycles, setCycles] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [seedMaterials, setSeedMaterials] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [inventoryStock, setInventoryStock] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCropTypeInfo, setSelectedCropTypeInfo] = useState(null);



  // Nạp dữ liệu danh mục khi mở Modal
  useEffect(() => {
    if (!isOpen || !farmId) return;

    const loadMetadata = async () => {
      try {
        const [zonesRes, cyclesRes, cropTypesRes, assignmentsRes, matsRes, stockRes, seasonsRes] = await Promise.all([
          geographyService.getZones(farmId).catch(() => []),
          geographyService.getCycles(farmId).catch(() => []),
          masterDataService.getCropTypes().catch(() => []),
          geographyService.getAssignments(farmId).catch(() => []),
          masterDataService.getMaterials().catch(() => []),
          inventoryService.getInventory({ farmId, size: 500 }).catch(() => ({ content: [] })),
          farmingService.getCropSeasons(farmId, { size: 500 }).catch(() => ({ content: [] })),
        ]);

        const rawZones = Array.isArray(zonesRes) ? zonesRes : (zonesRes?.content || []);
        const activeZones = rawZones.filter((z) => z.status === 'ACTIVE');
        setZones(activeZones);

        const rawCycles = Array.isArray(cyclesRes) ? cyclesRes : (cyclesRes?.content || []);
        const validCycles = rawCycles.filter(
          (c) => c.status === 'ACTIVE' || c.status === 'PLANNING'
        );
        setCycles(validCycles);

        const rawCrops = Array.isArray(cropTypesRes) ? cropTypesRes : (cropTypesRes?.content || []);
        setCropTypes(rawCrops);

        const rawAssign = Array.isArray(assignmentsRes) ? assignmentsRes : (assignmentsRes?.content || []);
        setAssignments(rawAssign);

        const rawMats = Array.isArray(matsRes) ? matsRes : (matsRes?.content || []);
        setAllMaterials(rawMats);
        const seeds = rawMats.filter((m) => 
          (m.name && (m.name.toLowerCase().includes('giống') || m.name.toLowerCase().includes('hạt'))) ||
          (m.categoryCode && m.categoryCode.includes('SEED')) ||
          (m.categoryName && m.categoryName.toLowerCase().includes('giống'))
        );
        setSeedMaterials(seeds);

        const rawStock = stockRes?.content || (Array.isArray(stockRes) ? stockRes : []);
        setInventoryStock(rawStock);

        const rawSeasons = seasonsRes?.content || (Array.isArray(seasonsRes) ? seasonsRes : (seasons || []));
        if (!editingSeason) {
          const nextSeasonCode = generateEntityCode(CODE_PREFIXES.SEASON, rawSeasons);
          setFormData((prev) => ({ ...prev, seasonCode: nextSeasonCode }));
        }
      } catch (err) {
        console.error('Lỗi khi nạp dữ liệu danh mục mùa vụ:', err);
      }
    };

    loadMetadata();
  }, [isOpen, farmId]);

  // Tải danh sách Ô/Luống/Vị trí thuộc phân khu
  const loadLocationsForZone = async (zId) => {
    if (!zId || !farmId) {
      setLocations([]);
      return;
    }
    try {
      setIsLoadingLocations(true);
      const res = await geographyService.getLocations(farmId, zId);
      const list = Array.isArray(res) ? res : (res?.content || []);
      setLocations(list);
    } catch (err) {
      console.error('Lỗi khi nạp vị trí phân khu:', err);
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Thiết lập form khi mở hoặc chuyển chế độ Thêm / Sửa
  useEffect(() => {
    if (!isOpen) return;

    if (editingSeason) {
      const isPerennial = editingSeason.cropCategory === 'PERENNIAL';
      const estUnit = editingSeason.estimatedYieldUnit || (isPerennial ? 'tấn' : 'kg');
      const estVal = editingSeason.estimatedYieldKg 
        ? (estUnit === 'tấn' ? String(Number(editingSeason.estimatedYieldKg) / 1000) : String(editingSeason.estimatedYieldKg))
        : '';

      setFormData({
        seasonCode: editingSeason.seasonCode || '',
        zoneId: editingSeason.zoneId ? String(editingSeason.zoneId) : '',
        locationId: editingSeason.locationId ? String(editingSeason.locationId) : '',
        operationalCycleId: editingSeason.operationalCycleId ? String(editingSeason.operationalCycleId) : '',
        cropTypeId: editingSeason.cropTypeId ? String(editingSeason.cropTypeId) : '',
        startDate: editingSeason.startDate ? String(editingSeason.startDate).split('T')[0] : '',
        expectedHarvestDate: editingSeason.expectedHarvestDate ? String(editingSeason.expectedHarvestDate).split('T')[0] : '',
        plantedAreaM2: editingSeason.plantedAreaM2 ? String(editingSeason.plantedAreaM2) : '',
        seedQuantity: editingSeason.seedQuantity ? String(editingSeason.seedQuantity) : '',
        seedUnit: editingSeason.seedUnit || (isPerennial ? 'gốc' : 'gói'),
        status: editingSeason.status || 'SOIL_PREPARATION',
        estimatedYieldValue: estVal,
        estimatedYieldUnit: estUnit,
        estimatedYieldKg: editingSeason.estimatedYieldKg ? String(editingSeason.estimatedYieldKg) : '',
      });
      if (editingSeason.zoneId) {
        loadLocationsForZone(editingSeason.zoneId);
      }
    } else {
      setFormData({
        seasonCode: generateEntityCode(CODE_PREFIXES.SEASON, seasons),
        zoneId: '',
        locationId: '',
        operationalCycleId: '',
        cropTypeId: '',
        startDate: new Date().toISOString().split('T')[0],
        expectedHarvestDate: '',
        plantedAreaM2: '',
        seedQuantity: '',
        seedUnit: 'gói',
        estimatedYieldValue: '',
        estimatedYieldUnit: 'kg',
        estimatedYieldKg: '',
      });
      setLocations([]);
      setSelectedCropTypeInfo(null);
    }
    setErrors({});
  }, [isOpen, editingSeason, farmId]);

  // Tìm Trưởng phân khu phụ trách cho từng zone
  const getZoneManagerName = (zoneId) => {
    if (!zoneId) return 'Chưa có trưởng khu';
    const numId = Number(zoneId);
    const assign = assignments.find(
      (a) => Number(a.zoneId) === numId && a.roleInFarm === 'ZONE_MANAGER' && a.isActive !== false
    );
    if (!assign) return 'Chưa có trưởng khu';
    return assign.userFullName || assign.username || 'Trưởng khu';
  };

  /**
   * Kiểm tra giống cây trồng có sẵn trong kho hay không
   * - Cây thân gỗ (PERENNIAL): Vườn cây lâu năm đã trồng sẵn ở lô đất, luôn cho phép chọn.
   * - Cây ngắn ngày (ANNUAL): Bắt buộc phải có vật tư hạt giống tương ứng đang có tồn kho > 0.
   */
  const getCropTypeStockStatus = (cropType) => {
    if (!cropType) return { isAvailable: false, label: '' };
    const isPerennial = cropType.cropCategory === 'PERENNIAL';
    if (isPerennial) {
      return {
        isAvailable: true,
        isPerennial: true,
        label: '🌳 Cây thân gỗ lâu năm (Theo số gốc trên lô đất)',
      };
    }

    // Tìm các vật tư hạt giống thuộc giống cây này
    const matchedMaterials = allMaterials.filter((mat) => {
      const matName = (mat.name || '').toLowerCase();
      
      // 1. Loại trừ triệt để các vật tư bao bì, đóng gói, phân bón, thức ăn (tránh nhầm lẫn như Hộp nhựa Dâu tây)
      const isPackingOrNonSeed = 
        mat.categoryId === 5 || // MCT-005: Bao bì đóng gói & Vật tư tiêu hao
        mat.categoryCode === 'MCT-005' ||
        (mat.categoryName && mat.categoryName.toLowerCase().includes('bao bì')) ||
        matName.includes('hộp nhựa') ||
        matName.includes('thùng carton') ||
        matName.includes('bao bì') ||
        matName.includes('lưới bọc') ||
        matName.includes('pet 500g');
      if (isPackingOrNonSeed) return false;

      // 2. Nếu có liên kết trực tiếp qua cropTypeId mà người dùng cấu hình
      if (mat.cropTypeId && String(mat.cropTypeId) === String(cropType.id)) return true;

      // 3. Phải thuộc nhóm Hạt giống & Cây giống HOẶC tên vật tư có từ khóa 'hạt giống', 'cây giống'
      const isSeedCategory = 
        mat.categoryId === 6 || // MCT-006: Hạt giống & Cây giống
        mat.categoryCode === 'MCT-006' ||
        mat.categoryCode === 'SEED' ||
        (mat.categoryName && mat.categoryName.toLowerCase().includes('giống'));

      const isSeedName = 
        matName.includes('hạt giống') || 
        matName.includes('cây giống') || 
        matName.includes('hạt ') || 
        matName.includes('bầu giống') || 
        matName.includes('khay giống');

      if (!isSeedCategory && !isSeedName) return false;

      // 4. Khớp tên hoặc từ khóa với giống cây trồng
      const cropName = (cropType.name || '').toLowerCase();
      if (matName.includes(cropName) || cropName.includes(matName)) return true;
      const keywords = ['dưa lưới', 'dâu tây', 'cà chua', 'xà lách', 'bắp ngô', 'ngô sinh khối'];
      for (const kw of keywords) {
        if (cropName.includes(kw) && matName.includes(kw)) return true;
      }
      return false;
    });

    const matchedMaterialIds = new Set(matchedMaterials.map((m) => Number(m.id)));
    const matchingStock = inventoryStock.filter((stk) =>
      matchedMaterialIds.has(Number(stk.materialId))
    );

    const totalStock = matchingStock.reduce((acc, cur) => {
      const avail = Number(cur.quantityOnHand || 0) - Number(cur.reservedQuantity || 0);
      return acc + (avail > 0 ? avail : 0);
    }, 0);

    const firstMat = matchedMaterials[0];
    const unitLabel = firstMat?.standardUnit || 'gói';

    if (totalStock > 0) {
      return {
        isAvailable: true,
        isPerennial: false,
        totalStock,
        unitLabel,
        label: `✅ Đã có hạt giống trong kho (Tồn: ${totalStock.toLocaleString('vi-VN')} ${unitLabel})`,
      };
    }

    return {
      isAvailable: false,
      isPerennial: false,
      totalStock: 0,
      label: '❌ Chưa nhập hạt giống vào kho (Vui lòng nhập kho tại WS-C trước)',
    };
  };

  // Khi chọn Giống cây trồng: tự động tính ngày thu hoạch dự kiến & điều chỉnh đơn vị
  const handleCropTypeChange = (cropTypeIdStr) => {
    const selected = cropTypes.find((c) => String(c.id) === cropTypeIdStr);
    setSelectedCropTypeInfo(selected || null);

    setFormData((prev) => {
      let expectedDate = prev.expectedHarvestDate;
      if (selected && selected.growthDaysStandard && prev.startDate) {
        const start = new Date(prev.startDate);
        if (!isNaN(start.getTime())) {
          start.setDate(start.getDate() + Number(selected.growthDaysStandard));
          expectedDate = start.toISOString().split('T')[0];
        }
      }

      const isPerennial = selected?.cropCategory === 'PERENNIAL';
      const newSeedUnit = isPerennial ? 'gốc' : (prev.seedUnit === 'gốc' || prev.seedUnit === 'cây' ? 'gói' : prev.seedUnit || 'gói');
      const newYieldUnit = isPerennial ? 'tấn' : (prev.estimatedYieldUnit || 'kg');

      // Gợi ý số lượng cây nếu đã chọn vị trí có capacity
      let newSeedQty = prev.seedQuantity;
      if (isPerennial && prev.locationId) {
        const loc = locations.find((l) => String(l.id) === prev.locationId);
        if (loc?.capacity) {
          newSeedQty = String(loc.capacity);
        }
      }

      return {
        ...prev,
        cropTypeId: cropTypeIdStr,
        expectedHarvestDate: expectedDate,
        seedUnit: newSeedUnit,
        estimatedYieldUnit: newYieldUnit,
        seedQuantity: newSeedQty,
      };
    });
  };

  // Khi chọn Ngày gieo trồng: cập nhật lại ngày thu hoạch dự kiến nếu đã chọn giống
  const handleStartDateChange = (startDateStr) => {
    setFormData((prev) => {
      let expectedDate = prev.expectedHarvestDate;
      if (selectedCropTypeInfo && selectedCropTypeInfo.growthDaysStandard && startDateStr) {
        const start = new Date(startDateStr);
        if (!isNaN(start.getTime())) {
          start.setDate(start.getDate() + Number(selectedCropTypeInfo.growthDaysStandard));
          expectedDate = start.toISOString().split('T')[0];
        }
      }
      return {
        ...prev,
        startDate: startDateStr,
        expectedHarvestDate: expectedDate,
      };
    });
  };

  // Lấy thông tin phân khu đang chọn
  const selectedZone = zones.find((z) => String(z.id) === String(formData.zoneId));
  const isPerennial = selectedCropTypeInfo?.cropCategory === 'PERENNIAL';

  // Kiểm tra diện tích gieo trồng có vượt phân khu không
  const isAreaExceeded = Boolean(
    selectedZone &&
    formData.plantedAreaM2 &&
    Number(formData.plantedAreaM2) > Number(selectedZone.areaM2)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.seasonCode.trim()) {
      newErrors.seasonCode = 'Mã mùa vụ không được để trống';
    }
    if (!formData.zoneId) {
      newErrors.zoneId = 'Vui lòng chọn phân khu canh tác';
    }
    if (!formData.cropTypeId) {
      newErrors.cropTypeId = 'Vui lòng chọn giống cây trồng';
    } else {
      const selectedCrop = cropTypes.find((c) => String(c.id) === String(formData.cropTypeId));
      if (selectedCrop && selectedCrop.cropCategory !== 'PERENNIAL') {
        const stockStatus = getCropTypeStockStatus(selectedCrop);
        if (!stockStatus.isAvailable) {
          newErrors.cropTypeId = 'Giống cây này chưa có hạt giống trong kho. Vui lòng nhập kho hạt giống (WS-C) trước khi mở vụ.';
        }
      }
    }
    if (!formData.startDate) {
      newErrors.startDate = isPerennial ? 'Vui lòng chọn ngày bắt đầu vụ' : 'Vui lòng chọn ngày bắt đầu gieo trồng';
    }
    if (!formData.plantedAreaM2 || Number(formData.plantedAreaM2) <= 0) {
      newErrors.plantedAreaM2 = isPerennial ? 'Diện tích canh tác phải lớn hơn 0 m²' : 'Diện tích gieo trồng phải lớn hơn 0 m²';
    } else if (isAreaExceeded) {
      newErrors.plantedAreaM2 = `Diện tích canh tác không được vượt quá diện tích phân khu (${formatArea(selectedZone.areaM2)})`;
    }
    if (!formData.seedQuantity || Number(formData.seedQuantity) <= 0) {
      newErrors.seedQuantity = isPerennial ? 'Vui lòng nhập số lượng cây mang trái' : 'Vui lòng nhập lượng giống gieo ban đầu';
    }
    if (!formData.estimatedYieldValue || Number(formData.estimatedYieldValue) <= 0) {
      newErrors.estimatedYieldKg = 'Vui lòng nhập sản lượng ước tính';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      let normalizedYieldKg = Number(formData.estimatedYieldValue || 0);
      if (formData.estimatedYieldUnit === 'tấn') {
        normalizedYieldKg = normalizedYieldKg * 1000;
      }

      const payload = {
        zoneId: Number(formData.zoneId),
        locationId: formData.locationId ? Number(formData.locationId) : null,
        operationalCycleId: formData.operationalCycleId ? Number(formData.operationalCycleId) : null,
        seasonCode: formData.seasonCode.trim(),
        cropTypeId: Number(formData.cropTypeId),
        startDate: formData.startDate,
        expectedHarvestDate: formData.expectedHarvestDate || null,
        plantedAreaM2: Number(formData.plantedAreaM2),
        seedQuantity: formData.seedQuantity ? Number(formData.seedQuantity) : null,
        seedUnit: formData.seedUnit || (selectedCropTypeInfo?.cropCategory === 'PERENNIAL' ? 'gốc' : 'gói'),
        estimatedYieldKg: normalizedYieldKg > 0 ? normalizedYieldKg : null,
        estimatedYieldUnit: formData.estimatedYieldUnit || 'kg',
      };

      if (editingSeason) {
        await farmingService.updateCropSeason(farmId, editingSeason.id, {
          locationId: payload.locationId,
          expectedHarvestDate: payload.expectedHarvestDate,
          actualHarvestDate: editingSeason.actualHarvestDate,
          actualYieldKg: editingSeason.actualYieldKg,
          status: formData.status || editingSeason.status,
        });
        toast.success(`Cập nhật kế hoạch mùa vụ ${payload.seasonCode} thành công!`);
      } else {
        await farmingService.createCropSeason(farmId, payload);
        commitSequentialCode(CODE_PREFIXES.SEASON, payload.seasonCode);
        toast.success(`Khởi tạo mùa vụ ${payload.seasonCode} thành công! Dữ liệu đã chuyển sang bàn làm việc của Trưởng phân khu.`);
      }

      // Thông báo đồng bộ dữ liệu liên Workspace (WS-E <-> WS-A)
      notifyDataChanged('all');
      notifyDataChanged('zones');
      notifyDataChanged('locations');
      notifyDataChanged('seasons');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu kế hoạch mùa vụ:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu kế hoạch mùa vụ';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSeason ? `Sửa Kế Hoạch Mùa Vụ: ${editingSeason.seasonCode}` : 'Mở Kế Hoạch Mùa Vụ Trồng Trọt Mới'}
      subtitle="Thiết lập mùa vụ canh tác, liên kết phân khu nhà màng và chu kỳ vận hành"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isAreaExceeded}
          >
            {editingSeason ? 'Lưu Thay Đổi' : 'Khởi Tạo Mùa Vụ'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errors.form && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-rose-800 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Mã mùa vụ tự động tăng dần (Chỉ đọc) */}
        <div>
          <FormField
            label="Mã mùa vụ *"
            error={errors.seasonCode}
            hint="Mã định danh tự động tăng dần do hệ thống cấp (Chỉ đọc)"
          >
            <CodeInput
              value={formData.seasonCode}
              placeholder="SSN-001"
              error={errors.seasonCode}
            />
          </FormField>
        </div>

        {/* Phân khu canh tác */}
        <div>
          <FormField
            label="Phân khu canh tác *"
            error={errors.zoneId}
            hint={
              selectedZone
                ? `Diện tích tối đa: ${formatArea(selectedZone.areaM2)} • Trưởng khu: ${getZoneManagerName(selectedZone.id)}`
                : 'Chỉ hiển thị các phân khu đang Hoạt động (ACTIVE)'
            }
          >
            <Select
              name="zoneId"
              value={formData.zoneId}
              onChange={(e) => {
                const zId = e.target.value;
                const zoneObj = zones.find((z) => String(z.id) === zId);
                setFormData((prev) => ({
                  ...prev,
                  zoneId: zId,
                  locationId: '',
                  // Gợi ý luôn diện tích phân khu làm diện tích gieo trồng ban đầu
                  plantedAreaM2: prev.plantedAreaM2 || (zoneObj ? String(zoneObj.areaM2) : ''),
                }));
                if (zId) {
                  loadLocationsForZone(zId);
                } else {
                  setLocations([]);
                }
              }}
              disabled={Boolean(editingSeason)}
            >
              <option value="">-- Chọn phân khu nhà màng / đồng ruộng --</option>
              {zones.map((zone) => {
                const mgr = getZoneManagerName(zone.id);
                return (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.code}) - {formatArea(zone.areaM2)} [Trưởng khu: {mgr}]
                  </option>
                );
              })}
            </Select>
          </FormField>
        </div>

        {/* Vị trí / Ô / Luống cụ thể (locationId) */}
        <div>
          <FormField
            label="Vị trí / Luống / Ô cụ thể (locationId - Tùy chọn)"
            hint={
              isLoadingLocations
                ? 'Đang nạp danh sách vị trí...'
                : locations.length > 0
                ? 'Tự động đồng bộ trạng thái OCCUPIED sang Sơ đồ vị trí (WS-A)'
                : 'Phân khu này chưa tạo các vị trí/luống chi tiết'
            }
          >
            <Select
              name="locationId"
              value={formData.locationId}
              onChange={(e) => {
                const locId = e.target.value;
                const locObj = locations.find((l) => String(l.id) === locId);
                setFormData((prev) => {
                  let newQty = prev.seedQuantity;
                  if (selectedCropTypeInfo?.cropCategory === 'PERENNIAL' && locObj?.capacity) {
                    newQty = String(locObj.capacity);
                  }
                  return {
                    ...prev,
                    locationId: locId,
                    seedQuantity: newQty,
                  };
                });
              }}
              disabled={!formData.zoneId || isLoadingLocations}
            >
              <option value="">-- Toàn bộ phân khu (hoặc chưa chọn ô cụ thể) --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code}) - {loc.status === 'OCCUPIED' ? '⚠️ Đang sử dụng (OCCUPIED)' : '✅ Còn trống (EMPTY)'}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Chu kỳ vận hành & Giống cây trồng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Chu kỳ vận hành"
            hint="Chu kỳ đang 'ACTIVE' hoặc 'PLANNING'"
          >
            <Select
              name="operationalCycleId"
              value={formData.operationalCycleId}
              onChange={(e) => setFormData({ ...formData, operationalCycleId: e.target.value })}
            >
              <option value="">-- Chọn chu kỳ kế toán / mùa vụ --</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.fiscalYear}) [{c.status}]
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Giống cây trồng *"
            error={errors.cropTypeId}
            hint={
              selectedCropTypeInfo
                ? `${selectedCropTypeInfo.cropCategory === 'PERENNIAL' ? '🌳 Cây thân gỗ lâu năm' : '🌱 Cây ngắn ngày'} • Chu kỳ sinh trưởng: ${selectedCropTypeInfo.growthDaysStandard || 0} ngày`
                : 'Lưu ý: Chỉ chọn được giống ngắn ngày đã có hạt giống trong kho hoặc cây thân gỗ'
            }
          >
            <Select
              name="cropTypeId"
              value={formData.cropTypeId}
              onChange={(e) => handleCropTypeChange(e.target.value)}
              disabled={Boolean(editingSeason)}
            >
              <option value="">-- Chọn giống cây trồng --</option>
              {cropTypes.map((c) => {
                const status = getCropTypeStockStatus(c);
                return (
                  <option 
                    key={c.id} 
                    value={c.id}
                    disabled={!status.isAvailable}
                    className={!status.isAvailable ? 'text-slate-400 bg-slate-50' : ''}
                  >
                    {c.name} ({c.varietyCode}) - {status.label}
                  </option>
                );
              })}
            </Select>
          </FormField>
        </div>

        {/* Trạng thái vụ mùa (Khi chỉnh sửa) */}
        {editingSeason && (
          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
            <FormField label="Trạng Thái Vụ Mùa (Điều chỉnh thủ công)" hint="Hệ thống tự động đồng bộ theo tiến độ nhiệm vụ gieo trồng, hoặc Giám đốc có thể chọn nhanh tại đây">
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="SOIL_PREPARATION">Làm đất (SOIL_PREPARATION)</option>
                <option value="SOWING">Đang gieo trồng (SOWING)</option>
                <option value="GROWING">Đang sinh trưởng / Chăm sóc (GROWING)</option>
                <option value="HARVESTING">Đang thu hoạch (HARVESTING)</option>
                <option value="CLOSED">Đã kết thúc / Đóng vụ (CLOSED)</option>
              </Select>
            </FormField>
          </div>
        )}

        {/* Ngày bắt đầu & Ngày thu hoạch dự kiến */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={isPerennial ? "Ngày bắt đầu niên vụ *" : "Ngày bắt đầu gieo trồng *"} error={errors.startDate}>
            <Input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </FormField>

          <FormField
            label="Ngày thu hoạch dự kiến"
            hint={isPerennial ? "Tự động tính = Ngày bắt đầu + Chu kỳ sinh trưởng chuẩn" : "Tự động tính = Ngày gieo + Số ngày sinh trưởng chuẩn"}
          >
            <Input
              type="date"
              name="expectedHarvestDate"
              value={formData.expectedHarvestDate}
              onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
            />
          </FormField>
        </div>

        {/* Diện tích canh tác & Cảnh báo vượt diện tích */}
        <div>
          <FormField
            label={isPerennial ? "Diện tích canh tác (m²) *" : "Diện tích gieo trồng (m²) *"}
            error={errors.plantedAreaM2}
            hint={selectedZone ? `Tối đa ${formatArea(selectedZone.areaM2)}` : ''}
          >
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ví dụ: 2500"
              name="plantedAreaM2"
              value={formData.plantedAreaM2}
              onChange={(e) => setFormData({ ...formData, plantedAreaM2: e.target.value })}
            />
          </FormField>

          {isAreaExceeded && (
            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 mt-1.5 font-semibold text-[11px]">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>
                Cảnh báo: Diện tích {isPerennial ? 'canh tác' : 'gieo trồng'} ({formatArea(formData.plantedAreaM2)}) vượt quá diện tích phân khu ({formatArea(selectedZone.areaM2)})!
              </span>
            </div>
          )}
        </div>



        {/* Lượng giống / Số lượng cây & Sản lượng dự kiến */}
        {selectedCropTypeInfo?.cropCategory === 'PERENNIAL' ? (
          /* Khối cho Cây Thân Gỗ Lâu Năm */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/40 p-3 rounded-2xl border border-amber-200">
            <FormField
              label="Số lượng cây mang trái *"
              error={errors.seedQuantity}
              hint={
                formData.locationId && locations.find((l) => String(l.id) === formData.locationId)?.capacity
                  ? `Đã tự động lấy theo sức chứa vị trí: ${locations.find((l) => String(l.id) === formData.locationId).capacity} cây/gốc`
                  : 'Tổng số gốc cây trưởng thành đang mang trái trên lô đất'
              }
            >
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Ví dụ: 300"
                  name="seedQuantity"
                  value={formData.seedQuantity}
                  onChange={(e) => setFormData({ ...formData, seedQuantity: e.target.value })}
                  className="flex-1"
                />
                <select
                  className="w-24 text-xs rounded-xl border border-amber-300 px-2 py-2 bg-white font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={formData.seedUnit || 'gốc'}
                  onChange={(e) => setFormData({ ...formData, seedUnit: e.target.value })}
                >
                  <option value="gốc">gốc</option>
                  <option value="cây">cây</option>
                </select>
              </div>
            </FormField>

            <FormField
              label="Sản lượng dự kiến *"
              error={errors.estimatedYieldKg}
              hint={
                formData.seedQuantity && Number(formData.seedQuantity) > 0
                  ? `Gợi ý: ~${(Number(formData.seedQuantity) * 0.1).toFixed(1)} tấn (${(Number(formData.seedQuantity) * 100).toLocaleString('vi-VN')} kg)`
                  : 'Kế hoạch sản lượng ước tính khi thu hoạch'
              }
            >
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ví dụ: 30"
                  value={formData.estimatedYieldValue}
                  onChange={(e) => setFormData({ ...formData, estimatedYieldValue: e.target.value })}
                  className="flex-1"
                />
                <select
                  className="w-24 text-xs rounded-xl border border-amber-300 px-2 py-2 bg-white font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={formData.estimatedYieldUnit || 'tấn'}
                  onChange={(e) => setFormData({ ...formData, estimatedYieldUnit: e.target.value })}
                >
                  <option value="tấn">tấn</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </FormField>
          </div>
        ) : (
          /* Khối cho Cây Ngắn Ngày / Hoa Màu */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/40 p-3 rounded-2xl border border-emerald-200">
            <FormField
              label="Lượng giống gieo ban đầu *"
              error={errors.seedQuantity}
              hint="Số gói hoặc số kg hạt giống (sẽ lập phiếu xuất kho WS-C để trừ kho khi gieo)"
            >
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ví dụ: 10"
                  name="seedQuantity"
                  value={formData.seedQuantity}
                  onChange={(e) => setFormData({ ...formData, seedQuantity: e.target.value })}
                  className="flex-1"
                />
                <select
                  className="w-24 text-xs rounded-xl border border-emerald-300 px-2 py-2 bg-white font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.seedUnit || 'gói'}
                  onChange={(e) => setFormData({ ...formData, seedUnit: e.target.value })}
                >
                  <option value="gói">gói</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </FormField>

            <FormField
              label="Sản lượng dự kiến *"
              error={errors.estimatedYieldKg}
              hint="Kế hoạch sản lượng ước tính khi thu hoạch vụ"
            >
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ví dụ: 4500"
                  value={formData.estimatedYieldValue}
                  onChange={(e) => setFormData({ ...formData, estimatedYieldValue: e.target.value })}
                  className="flex-1"
                />
                <select
                  className="w-24 text-xs rounded-xl border border-emerald-300 px-2 py-2 bg-white font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.estimatedYieldUnit || 'kg'}
                  onChange={(e) => setFormData({ ...formData, estimatedYieldUnit: e.target.value })}
                >
                  <option value="kg">kg</option>
                  <option value="tấn">tấn</option>
                </select>
              </div>
            </FormField>
          </div>
        )}

        {/* Thông tin chuyển tiếp cho Role 3 */}
        <div className="flex items-start gap-2.5 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
          <Info className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <strong>Quy trình phân cấp:</strong> Ngay sau khi Giám đốc trại bấm Khởi tạo, mùa vụ sẽ xuất hiện trên màn hình của <strong>Trưởng phân khu ({selectedZone ? getZoneManagerName(selectedZone.id) : 'Role 3'})</strong> để họ tiến hành điều phối kỹ sư, công nhân chăm sóc và ghi nhật ký hiện trường.
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default CropSeasonModal;
