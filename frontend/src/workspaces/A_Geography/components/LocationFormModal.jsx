import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, AlertTriangle, Building, Layers, Plus } from 'lucide-react';
import { geographyService } from '@/services/modules/geographyService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea, CodeInput } from '@/components/ui/FormControls';
import { generateEntityCode, CODE_PREFIXES } from '@/utils/codeGenerator';
import { applyServerFieldErrors } from '@/utils/errorHandler';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';

/**
 * Tự động sinh mã vị trí tăng dần theo tiền tố dựa trên danh sách các vị trí hiện có
 */
function generateLocationCode(prefix, existingLocations = []) {
  const cleanPrefix = (prefix || 'LOC-PLOT').replace(/-+$/, '').toUpperCase();
  if (!existingLocations || existingLocations.length === 0) {
    return `${cleanPrefix}-001`;
  }

  let maxNum = 0;
  let padLength = 3;

  existingLocations.forEach((item) => {
    const code = (typeof item === 'string' ? item : item?.code || '').trim().toUpperCase();
    if (!code) return;

    // Khớp chính xác tiền tố này
    if (code.startsWith(cleanPrefix)) {
      const match = code.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
          padLength = Math.max(padLength, match[1].length);
        }
      }
    } else {
      // Hoặc nếu tiền tố có dạng [PREFIX]-[NUM]
      const match = code.match(/^(.*?)(\d+)$/);
      if (match) {
        const itemPfx = match[1].replace(/-+$/, '');
        if (itemPfx === cleanPrefix) {
          const num = parseInt(match[2], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
            padLength = Math.max(padLength, match[2].length);
          }
        }
      }
    }
  });

  const nextNum = maxNum + 1;
  const finalPad = Math.max(padLength, String(nextNum).length);
  return `${cleanPrefix}-${String(nextNum).padStart(finalPad, '0')}`;
}

const LOCATION_STATUSES = [
  { value: 'EMPTY', label: 'EMPTY - Còn trống (chưa gieo trồng / thả đàn)' },
  { value: 'ACTIVE', label: 'ACTIVE - Sẵn sàng sản xuất / canh tác' },
  { value: 'OCCUPIED', label: 'OCCUPIED - Đang có cây trồng / đàn vật nuôi' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE - Đang khử trùng / bảo dưỡng kỹ thuật' },
];

export function LocationFormModal({
  isOpen,
  onClose,
  farms = [],
  initialFarmId = null,
  initialZoneId = null,
  initialWarehouseId = null,
  editingItem = null,
  onOpenZoneModal,
  onSuccess,
}) {
  const { activeFarmId } = useActiveFarmStore();

  // Danh sách trang trại active
  const activeFarms = useMemo(() => {
    return (farms || []).filter((f) => f.status !== 'INACTIVE');
  }, [farms]);

  // Ngữ cảnh farm & zone được chọn trong form
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');

  // Đối tượng Farm hiện tại
  const currentFarm = useMemo(() => {
    return (farms || []).find((f) => Number(f.id) === Number(selectedFarmId)) || activeFarms[0] || null;
  }, [farms, activeFarms, selectedFarmId]);

  // Danh sách phân khu ACTIVE trực thuộc Farm được chọn
  const activeZones = useMemo(() => {
    return (currentFarm?.zones || []).filter((z) => z.status === 'ACTIVE');
  }, [currentFarm]);

  // Đối tượng Zone hiện tại
  const currentZone = useMemo(() => {
    return (currentFarm?.zones || []).find((z) => Number(z.id) === Number(selectedZoneId)) || activeZones[0] || null;
  }, [currentFarm, activeZones, selectedZoneId]);

  const zoneType = (currentZone?.zoneType || 'GREENHOUSE').toUpperCase();

  // Xác định xem ngữ cảnh có bị khóa cứng hay cho phép chọn cascading
  const isLockedContext = Boolean(editingItem || (initialFarmId && initialZoneId));

  // Nhãn động theo loại phân khu
  const dynamicConfig = useMemo(() => {
    if (zoneType === 'BARN') {
      return {
        titleCreate: 'Thêm Ô Chuồng / Dãy Chuồng Chăn Nuôi',
        titleEdit: 'Chỉnh Sửa Ô Chuồng / Dãy Chuồng Chăn Nuôi',
        codePrefix: 'LOC-BARN',
        nameLabel: 'Tên Ô Chuồng / Dãy Chuồng',
        namePlaceholder: 'VD: Ô chuồng số 01, Dãy chuồng heo thịt B1',
        descLabel: 'Mô Tả Quy Cách Ô Chuồng',
        descPlaceholder: 'VD: Sàn đan bê tông, máng ăn tự động, thông gió áp lực âm',
        areaLabel: 'Diện Tích Ô Chuồng',
        areaPlaceholder: 'VD: 30',
        areaHint: 'Diện tích mặt sàn ô chuồng / ngăn nuôi',
        capacityLabel: 'Sức Chứa Vật Nuôi',
        capacityUnit: 'con',
        unitOptions: ['con', 'đàn', 'lứa', 'cá thể', 'kg', 'tấn'],
        capacityPlaceholder: 'VD: 20',
        capacityHint: 'Quy mô sức chứa tối đa cho ô chuồng này (con, đàn, tấn...)',
        btnSubmit: 'Tạo Ô Chuồng Mới',
      };
    }
    if (zoneType === 'GREENHOUSE') {
      return {
        titleCreate: 'Thêm Luống / Lô Đất Canh Tác',
        titleEdit: 'Chỉnh Sửa Luống / Lô Đất Canh Tác',
        codePrefix: 'LOC-PLOT',
        nameLabel: 'Tên Luống / Lô Canh Tác',
        namePlaceholder: 'VD: Luống Dưa Lưới 01, Luống Rau 02',
        descLabel: 'Mô Tả Luống / Ô Đất',
        descPlaceholder: 'VD: Chiều dài 30m, rộng 1.2m, màng phủ nông nghiệp kèm tưới nhỏ giọt',
        areaLabel: 'Diện Tích Canh Tác',
        areaPlaceholder: 'VD: 50.5',
        areaHint: 'Diện tích canh tác thực tế của luống / giàn trồng',
        capacityLabel: 'Sức Chứa / Quy Mô Canh Tác',
        capacityUnit: 'cây/gốc',
        unitOptions: ['cây/gốc', 'cây', 'khay/bầu', 'chậu', 'luống', 'giàn', 'kg', 'tấn'],
        capacityPlaceholder: 'VD: 200',
        capacityHint: 'Số lượng cây hoặc bầu giá thể tối đa trên luống',
        btnSubmit: 'Tạo Luống Mới',
      };
    }
    if (zoneType === 'OPEN_FIELD') {
      return {
        titleCreate: 'Thêm Lô Đất / Luống Canh Tác Ngoài Trời',
        titleEdit: 'Chỉnh Sửa Lô Đất / Luống Canh Tác',
        codePrefix: 'LOC-PLOT',
        nameLabel: 'Tên Lô Đất / Thửa Đất',
        namePlaceholder: 'VD: Lô Đất Ngô B1, Thửa Rau Cải A1',
        descLabel: 'Mô Tả Lô Đất',
        descPlaceholder: 'VD: Đất phù sa tơi xốp, hệ thống tưới phun tự động',
        areaLabel: 'Diện Tích Lô Đất',
        areaPlaceholder: 'VD: 500',
        areaHint: 'Diện tích canh tác thực tế của thửa đất',
        capacityLabel: 'Sức Chứa / Sản Lượng Dự Kiến',
        capacityUnit: 'cây/gốc',
        unitOptions: ['cây/gốc', 'cây', 'gốc', 'tấn', 'tạ', 'kg', 'luống', 'sào', 'ha', 'bầu/khay'],
        capacityPlaceholder: 'VD: 1000',
        capacityHint: 'Số lượng cây trồng, mật độ hoặc sản lượng dự kiến (tấn, kg, cây...)',
        btnSubmit: 'Tạo Lô Đất Mới',
      };
    }
    if (zoneType === 'STORAGE') {
      return {
        titleCreate: 'Thêm Kệ / Vị Trí Kho Lưu Trữ',
        titleEdit: 'Chỉnh Sửa Kệ / Vị Trí Kho Lưu Trữ',
        codePrefix: 'LOC-STR',
        nameLabel: 'Tên Kệ / Vị Trí Lưu Trữ',
        namePlaceholder: 'VD: Dãy Kệ K01, Bàn Sơ Chế & Đóng Gói',
        descLabel: 'Mô Tả Vị Trí Kho',
        descPlaceholder: 'VD: Tải trọng tối đa 1.000 kg, thoáng mát, đạt chuẩn GSP',
        areaLabel: 'Diện Tích Kệ / Mặt Sàn',
        areaPlaceholder: 'VD: 200',
        areaHint: 'Diện tích chiếm dụng hoặc mặt bằng khu vực kệ/bàn',
        capacityLabel: 'Sức Chứa Lưu Trữ',
        capacityUnit: 'tấn',
        unitOptions: [
          'tấn',
          'pallet',
          'thùng',
          'kiện',
          'bao',
          'hộp',
          'máy',
          'cái/chiếc',
          'can/phuy',
          'bộ',
          'cuộn',
          'sọt/giỏ',
          'kg',
          'tạ',
        ],
        capacityPlaceholder: 'VD: 20',
        capacityHint: 'Số lượng tối đa tấn, pallet, thùng, máy, can hoặc đơn vị lưu trữ',
        btnSubmit: 'Tạo Vị Trí Kho Mới',
      };
    }
    if (zoneType === 'ISOLATION') {
      return {
        titleCreate: 'Thêm Ô / Khu Vực Cách Ly Kiểm Dịch',
        titleEdit: 'Chỉnh Sửa Ô / Khu Vực Cách Ly Kiểm Dịch',
        codePrefix: 'LOC-ISO',
        nameLabel: 'Tên Ô Cách Ly Kiểm Dịch',
        namePlaceholder: 'VD: Ô cách ly thú y số 01, Khu kiểm dịch K1',
        descLabel: 'Mô Tả Quy Cách Ô Cách Ly',
        descPlaceholder: 'VD: Hàng rào lưới ngăn cách hoàn toàn, có hố sát trùng trước cửa',
        areaLabel: 'Diện Tích Ô Cách Ly',
        areaPlaceholder: 'VD: 20',
        areaHint: 'Diện tích mặt sàn ô kiểm dịch / cách ly',
        capacityLabel: 'Sức Chứa Cách Ly',
        capacityUnit: 'con',
        unitOptions: ['con', 'cá thể', 'đàn', 'cây', 'lứa', 'chậu'],
        capacityPlaceholder: 'VD: 5',
        capacityHint: 'Số lượng cá thể cách ly tối đa',
        btnSubmit: 'Tạo Ô Cách Ly Mới',
      };
    }
    return {
      titleCreate: 'Thêm Mới Vị Trí / Ô / Chuồng',
      titleEdit: 'Chỉnh Sửa Vị Trí / Ô / Chuồng',
      codePrefix: 'LOC',
      nameLabel: 'Tên Vị Trí / Luống / Chuồng',
      namePlaceholder: 'VD: Vị trí 01',
      descLabel: 'Mô Tả Chi Tiết Vị Trí',
      descPlaceholder: 'VD: Kích thước, quy cách, thiết bị đi kèm...',
      areaLabel: 'Diện Tích Vị Trí',
      areaPlaceholder: 'VD: 50',
      areaHint: 'Diện tích thực tế của vị trí canh tác / lưu trữ',
      capacityLabel: 'Sức Chứa Quy Đổi',
      capacityUnit: 'đơn vị',
      unitOptions: [
        'đơn vị',
        'tấn',
        'tạ',
        'kg',
        'pallet',
        'thùng',
        'kiện',
        'bao',
        'hộp',
        'cây/gốc',
        'con',
        'máy',
        'cái/chiếc',
        'can/phuy',
      ],
      capacityPlaceholder: 'VD: 30',
      capacityHint: 'Quy mô sức chứa tối đa của vị trí',
      btnSubmit: 'Tạo Vị Trí Mới',
    };
  }, [zoneType]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'EMPTY',
    areaM2: '',
    capacity: '',
    capacityUnit: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetchedLocations, setFetchedLocations] = useState([]);
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const isCodeDirtyRef = useRef(false);

  // Tự động tải danh sách vị trí hiện có của Zone được chọn để đảm bảo mã tự tăng chính xác 100%
  useEffect(() => {
    if (!isOpen || !selectedFarmId || !selectedZoneId) {
      setFetchedLocations([]);
      return;
    }
    let isMounted = true;
    geographyService.getLocations(selectedFarmId, selectedZoneId)
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.content || [];
        setFetchedLocations(list);
      })
      .catch((err) => {
        console.warn('Could not fetch locations for zone', err);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedFarmId, selectedZoneId]);

  // Tập hợp toàn bộ vị trí hiện có (từ API + từ cây phân cấp props) để tính mã kế tiếp
  const allExistingLocations = useMemo(() => {
    const map = new Map();
    (fetchedLocations || []).forEach((l) => {
      if (l && l.code) map.set(l.code.toUpperCase(), l);
    });
    (currentZone?.locations || []).forEach((l) => {
      if (l && l.code) map.set(l.code.toUpperCase(), l);
    });
    (currentFarm?.zones || []).forEach((z) => {
      (z.locations || []).forEach((l) => {
        if (l && l.code) map.set(l.code.toUpperCase(), l);
      });
    });
    return Array.from(map.values());
  }, [fetchedLocations, currentZone, currentFarm]);

  // Khởi tạo ngữ cảnh khi Modal mở
  useEffect(() => {
    if (!isOpen) return;
    isCodeDirtyRef.current = false;
    setFieldErrors({});
    setGeneralError('');

    // Xác định Farm ID ban đầu
    let targetFarm = null;
    if (editingItem?.farmId) {
      targetFarm = editingItem.farmId;
    } else if (initialFarmId) {
      targetFarm = initialFarmId;
    } else if (activeFarmId && activeFarmId !== 'ALL') {
      targetFarm = Number(activeFarmId);
    } else if (activeFarms.length > 0) {
      targetFarm = activeFarms[0].id;
    }
    const resolvedFarmIdStr = targetFarm ? String(targetFarm) : '';
    setSelectedFarmId(resolvedFarmIdStr);

    // Xác định Zone ID ban đầu
    const matchedFarm = (farms || []).find((f) => Number(f.id) === Number(targetFarm));
    const farmActiveZones = (matchedFarm?.zones || []).filter((z) => z.status === 'ACTIVE');

    let targetZone = null;
    if (editingItem?.zoneId) {
      targetZone = editingItem.zoneId;
    } else if (initialZoneId) {
      targetZone = initialZoneId;
    } else if (farmActiveZones.length > 0) {
      targetZone = farmActiveZones[0].id;
    }
    const resolvedZoneIdStr = targetZone ? String(targetZone) : '';
    setSelectedZoneId(resolvedZoneIdStr);

    // Xác định prefix theo zone
    const matchedZone = (matchedFarm?.zones || []).find((z) => Number(z.id) === Number(targetZone));
    const matchedZoneType = (matchedZone?.zoneType || 'GREENHOUSE').toUpperCase();
    const prefix = matchedZoneType === 'BARN' ? 'LOC-BARN' : matchedZoneType === 'STORAGE' ? 'LOC-STR' : matchedZoneType === 'ISOLATION' ? 'LOC-ISO' : 'LOC-PLOT';

    if (editingItem) {
      const isKnown = dynamicConfig.unitOptions.includes(editingItem.capacityUnit);
      setIsCustomUnit(!isKnown && Boolean(editingItem.capacityUnit));
      setFormData({
        code: editingItem.code || '',
        name: editingItem.name || '',
        description: editingItem.description || '',
        warehouseId: editingItem.warehouseId ? String(editingItem.warehouseId) : '',
        status: editingItem.status || 'EMPTY',
        areaM2: editingItem.areaM2 != null ? String(editingItem.areaM2) : '',
        capacity: editingItem.capacity != null ? String(editingItem.capacity) : '',
        capacityUnit: editingItem.capacityUnit || dynamicConfig.capacityUnit,
      });
    } else {
      setIsCustomUnit(false);
      const initialLocations = (matchedZone?.locations && matchedZone.locations.length > 0)
        ? matchedZone.locations
        : (matchedFarm?.zones || []).flatMap((z) => z.locations || []);

      setFormData({
        code: generateLocationCode(prefix, initialLocations),
        name: '',
        description: '',
        warehouseId: initialWarehouseId ? String(initialWarehouseId) : '',
        status: 'EMPTY',
        areaM2: '',
        capacity: '',
        capacityUnit: dynamicConfig.capacityUnit,
      });
    }
  }, [isOpen, editingItem, initialFarmId, initialZoneId, initialWarehouseId, activeFarmId, activeFarms, farms]);

  // Tự động đồng bộ mã gợi ý tăng dần khi nạp xong danh sách vị trí mới nhất
  useEffect(() => {
    if (!isOpen || editingItem) return;
    if (isCodeDirtyRef.current) return;

    const pfx = dynamicConfig.codePrefix;
    const nextCode = generateLocationCode(pfx, allExistingLocations);
    setFormData((prev) => {
      if (prev.code !== nextCode) {
        return { ...prev, code: nextCode };
      }
      return prev;
    });
  }, [isOpen, editingItem, allExistingLocations, dynamicConfig.codePrefix]);

  // Khi người dùng đổi Farm trong dropdown Cascading
  const handleFarmChange = (e) => {
    isCodeDirtyRef.current = false;
    const newFarmId = e.target.value;
    setSelectedFarmId(newFarmId);

    // Tự động chọn zone đầu tiên của farm mới
    const newFarm = (farms || []).find((f) => Number(f.id) === Number(newFarmId));
    const newActiveZones = (newFarm?.zones || []).filter((z) => z.status === 'ACTIVE');
    const newZoneId = newActiveZones.length > 0 ? String(newActiveZones[0].id) : '';
    setSelectedZoneId(newZoneId);

    // Tự động đổi mã code gợi ý theo loại zone mới
    if (!editingItem && newActiveZones.length > 0) {
      const zType = (newActiveZones[0].zoneType || 'GREENHOUSE').toUpperCase();
      const pfx = zType === 'BARN' ? 'LOC-BARN' : zType === 'STORAGE' ? 'LOC-STR' : zType === 'ISOLATION' ? 'LOC-ISO' : 'LOC-PLOT';
      const locs = (newActiveZones[0].locations && newActiveZones[0].locations.length > 0)
        ? newActiveZones[0].locations
        : (newFarm?.zones || []).flatMap((z) => z.locations || []);
      setFormData((prev) => ({ ...prev, code: generateLocationCode(pfx, locs) }));
    }

    if (fieldErrors.farmId) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.farmId;
        return next;
      });
    }
  };

  // Khi người dùng đổi Zone trong dropdown Cascading
  const handleZoneChange = (e) => {
    isCodeDirtyRef.current = false;
    const newZoneId = e.target.value;
    setSelectedZoneId(newZoneId);

    // Tự động sinh mã mới nếu chưa nhập tên hoặc là tạo mới
    if (!editingItem) {
      const newZone = activeZones.find((z) => String(z.id) === String(newZoneId));
      if (newZone) {
        const zType = (newZone.zoneType || 'GREENHOUSE').toUpperCase();
        const pfx = zType === 'BARN' ? 'LOC-BARN' : zType === 'STORAGE' ? 'LOC-STR' : zType === 'ISOLATION' ? 'LOC-ISO' : 'LOC-PLOT';
        const locs = (newZone.locations && newZone.locations.length > 0)
          ? newZone.locations
          : allExistingLocations;
        setFormData((prev) => ({ ...prev, code: generateLocationCode(pfx, locs) }));
      }
    }

    if (fieldErrors.zoneId) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.zoneId;
        return next;
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!selectedFarmId) {
      errors.farmId = 'Vui lòng chọn Trang trại trực thuộc';
    }
    if (!selectedZoneId) {
      errors.zoneId = 'Vui lòng chọn Phân khu canh tác';
    }
    if (!formData.code.trim()) {
      errors.code = 'Mã vị trí / luống không được để trống';
    }
    if (!formData.name.trim()) {
      errors.name = `${dynamicConfig.nameLabel} không được để trống`;
    }

    if (formData.areaM2 !== '' && formData.areaM2 != null) {
      const val = Number(formData.areaM2);
      if (isNaN(val) || val < 0) {
        errors.areaM2 = 'Diện tích phải là số dương hoặc bằng 0';
      }
    }

    if (formData.capacity !== '' && formData.capacity != null) {
      const val = Number(formData.capacity);
      if (isNaN(val) || val < 0 || !Number.isInteger(val)) {
        errors.capacity = `Sức chứa phải là số nguyên dương hoặc bằng 0 (${dynamicConfig.capacityUnit})`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      setGeneralError('');

      const targetFarmIdNumber = Number(selectedFarmId);
      const targetZoneIdNumber = Number(selectedZoneId);

      const payload = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        warehouseId: formData.warehouseId ? Number(formData.warehouseId) : null,
        status: formData.status,
        areaM2: formData.areaM2 !== '' && formData.areaM2 != null ? Number(formData.areaM2) : null,
        capacity: formData.capacity !== '' && formData.capacity != null ? parseInt(formData.capacity, 10) : null,
        capacityUnit: (formData.capacityUnit || dynamicConfig.capacityUnit).trim(),
      };

      let result;
      if (editingItem) {
        result = await geographyService.updateLocation(targetFarmIdNumber, targetZoneIdNumber, editingItem.id, payload);
        toast.success(`Cập nhật "${payload.name}" thành công!`);
      } else {
        result = await geographyService.createLocation(targetFarmIdNumber, targetZoneIdNumber, payload);
        toast.success(`Tạo mới "${payload.name}" thành công!`);
      }

      onSuccess?.(result || payload, targetFarmIdNumber, targetZoneIdNumber);
      onClose();
    } catch (err) {
      const errMsg = applyServerFieldErrors(err, setFieldErrors);
      setGeneralError(errMsg || 'Đã xảy ra lỗi khi lưu vị trí. Vui lòng kiểm tra lại!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? dynamicConfig.titleEdit : dynamicConfig.titleCreate}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={saving}
            disabled={!selectedZoneId || activeZones.length === 0}
            onClick={handleSubmit}
          >
            {editingItem ? 'Lưu Thay Đổi' : dynamicConfig.btnSubmit}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* 1. Ngữ cảnh Trang trại -> Phân khu (Cascading Selector) */}
        {isLockedContext && currentFarm && currentZone ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-purple-200 bg-purple-50/80 p-3 text-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">
                Vị Trí Trực Thuộc Phân Khu
              </div>
              <div className="flex items-center gap-1.5 flex-wrap font-bold text-slate-900 mt-0.5 truncate">
                <span className="truncate">{currentFarm.name}</span>
                <span className="text-slate-400 font-normal">&rarr;</span>
                <span className="text-purple-900 font-bold truncate">{currentZone.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 font-mono text-[10px] font-bold shrink-0">
                  {currentZone.zoneType}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-500" />
              Chọn Phân Cấp Mặt Bằng (Trang Trại &rarr; Phân Khu)
            </div>

            {/* Bước 1: Chọn Trang Trại */}
            <FormField label="1. Trang Trại" required error={fieldErrors.farmId}>
              <Select
                name="farmId"
                value={selectedFarmId}
                onChange={handleFarmChange}
                options={activeFarms.map((f) => ({
                  value: String(f.id),
                  label: `${f.name} (${f.code} • ${f.farmType})`,
                }))}
              />
            </FormField>

            {/* Bước 2: Chọn Phân Khu hoặc Hiển thị Smart Empty State */}
            {activeZones.length === 0 ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2 text-xs animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Trang trại "{currentFarm?.name}" chưa có phân khu ACTIVE nào!</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Cần có ít nhất một phân khu ở trạng thái hoạt động (ACTIVE) trước khi thêm các luống đất hoặc ô chuồng chi tiết.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="xs"
                  onClick={() => onOpenZoneModal?.(currentFarm?.id)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold w-full justify-center shadow-xs"
                  icon={<Plus className="h-3.5 w-3.5" />}
                >
                  [+ Tạo Phân Khu Cho Trang Trại Này Ngay]
                </Button>
              </div>
            ) : (
              <FormField label="2. Phân Khu Canh Tác" required error={fieldErrors.zoneId}>
                <Select
                  name="zoneId"
                  value={selectedZoneId}
                  onChange={handleZoneChange}
                  options={activeZones.map((z) => ({
                    value: String(z.id),
                    label: `${z.name} (${z.code} • ${z.zoneType})`,
                  }))}
                />
              </FormField>
            )}
          </div>
        )}

        {/* Kho Bãi Trực Thuộc nếu là phân khu STORAGE hoặc có kho bãi */}
        {(zoneType === 'STORAGE' || (currentZone?.warehouses && currentZone.warehouses.length > 0)) && (
          <FormField
            label="Kho Bãi Trực Thuộc"
            error={fieldErrors.warehouseId}
            hint="Chỉ định chính xác kệ này nằm trong kho nào"
          >
            <Select
              name="warehouseId"
              value={formData.warehouseId}
              onChange={handleChange}
              options={[
                { value: '', label: '-- Chọn kho bãi trực thuộc --' },
                ...(currentZone?.warehouses || []).map((w) => ({
                  value: String(w.id),
                  label: `${w.name} (${w.code})`,
                })),
              ]}
            />
          </FormField>
        )}

        {/* 2. Mã vị trí */}
        <FormField
          label="Mã Vị Trí / Ô Đất / Chuồng"
          required
          error={fieldErrors.code}
          hint={editingItem ? 'Mã vị trí bất biến không thể sửa' : `Hệ thống tự động sinh mã gợi ý ${dynamicConfig.codePrefix}-...`}
        >
          <CodeInput
            value={formData.code}
            onChange={(e) => {
              isCodeDirtyRef.current = true;
              setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
            }}
            onRegenerate={() => {
              isCodeDirtyRef.current = false;
              setFormData((prev) => ({
                ...prev,
                code: generateLocationCode(dynamicConfig.codePrefix, allExistingLocations),
              }));
            }}
            isEditMode={Boolean(editingItem)}
            error={fieldErrors.code}
          />
        </FormField>

        {/* 3. Tên vị trí (Thích ứng theo zoneType) */}
        <FormField label={dynamicConfig.nameLabel} required error={fieldErrors.name}>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={dynamicConfig.namePlaceholder}
          />
        </FormField>

        {/* 4. Quy mô vị trí: Diện tích (m²) & Sức chứa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label={`${dynamicConfig.areaLabel} (m²)`}
            error={fieldErrors.areaM2}
          >
            <div className="relative">
              <Input
                name="areaM2"
                type="number"
                step="0.01"
                min="0"
                value={formData.areaM2}
                onChange={handleChange}
                placeholder={dynamicConfig.areaPlaceholder}
                className="pr-10 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                m²
              </span>
            </div>
          </FormField>

          <FormField
            label="Sức Chứa & Đơn Vị"
            error={fieldErrors.capacity}
          >
            <div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 shadow-xs overflow-hidden h-[38px]">
              <input
                name="capacity"
                type="number"
                step="1"
                min="0"
                value={formData.capacity}
                onChange={handleChange}
                placeholder={dynamicConfig.capacityPlaceholder || 'VD: 20'}
                className="flex-1 min-w-0 px-3 py-2 text-xs font-mono text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
              />
              {!isCustomUnit ? (
                <select
                  name="capacityUnit"
                  value={formData.capacityUnit || dynamicConfig.capacityUnit}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCustomUnit(true);
                      setFormData((prev) => ({ ...prev, capacityUnit: '' }));
                    } else {
                      handleChange(e);
                    }
                  }}
                  className="shrink-0 border-l border-slate-200 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer max-w-[100px] h-full"
                  title="Chọn đơn vị tính"
                >
                  {dynamicConfig.unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                  <option value="__CUSTOM__" className="text-emerald-700 font-bold">
                    + Khác...
                  </option>
                </select>
              ) : (
                <div className="flex items-center border-l border-slate-200 bg-emerald-50/70 px-2 h-full shrink-0">
                  <input
                    name="capacityUnit"
                    type="text"
                    value={formData.capacityUnit}
                    onChange={handleChange}
                    placeholder="Đơn vị..."
                    className="w-16 text-xs font-bold text-emerald-900 bg-transparent focus:outline-none placeholder:font-normal placeholder:text-slate-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomUnit(false);
                      setFormData((prev) => ({ ...prev, capacityUnit: dynamicConfig.capacityUnit }));
                    }}
                    className="ml-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Chọn từ danh sách"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* 4. Trạng thái vận hành */}
        <FormField label="Trạng Thái Vận Hành" required error={fieldErrors.status}>
          <Select
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={LOCATION_STATUSES}
          />
        </FormField>

        {/* 5. Mô tả quy cách */}
        <FormField label={dynamicConfig.descLabel}>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            placeholder={dynamicConfig.descPlaceholder}
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default LocationFormModal;
