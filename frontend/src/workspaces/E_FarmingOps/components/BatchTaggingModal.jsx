import React, { useState, useEffect, useRef } from 'react';
import {
  Tag,
  Hash,
  FileSpreadsheet,
  Scan,
  Download,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { farmingService } from '@/services/modules/farmingService';
import { inventoryService } from '@/services/modules/inventoryService';
import { geographyService } from '@/services/modules/geographyService';
import { toast } from '@/store/useToastStore';

export function BatchTaggingModal({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  group,
  zoneId,
}) {
  const [activeTab, setActiveTab] = useState('RANGE'); // 'RANGE' | 'EXCEL' | 'SCANNER'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // -------------------------------------------------------------
  // TAB 1: RANGE CONFIG
  // -------------------------------------------------------------
  const [rangeConfig, setRangeConfig] = useState({
    prefix: '',
    startNumber: 1,
    count: 20,
    digits: 4,
    defaultGender: 'FEMALE', // 'MALE', 'FEMALE', 'MIXED'
    defaultWeightKg: '',
    defaultHealthStatus: 'HEALTHY',
  });

  // -------------------------------------------------------------
  // TAB 2: EXCEL / CSV IMPORT
  // -------------------------------------------------------------
  const [excelIndividuals, setExcelIndividuals] = useState([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelErrors, setExcelErrors] = useState([]);
  const fileInputRef = useRef(null);

  // -------------------------------------------------------------
  // TAB 3: CONTINUOUS SCANNER
  // -------------------------------------------------------------
  const [scannedInput, setScannedInput] = useState('');
  const [scannedList, setScannedList] = useState([]);
  const [scannerGender, setScannerGender] = useState('FEMALE');
  const [scannerWeight, setScannerWeight] = useState('');
  const scannerInputRef = useRef(null);

  // -------------------------------------------------------------
  // TAB 4 / COMMON: AUTO-BACKFLUSH WAREHOUSE & EXPENSE
  // -------------------------------------------------------------
  const [autoDeductInventory, setAutoDeductInventory] = useState(true);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedStorageBin, setSelectedStorageBin] = useState('');
  const [tagUnitPrice, setTagUnitPrice] = useState('15000');
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [warehouseLocations, setWarehouseLocations] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  useEffect(() => {
    if (isOpen && farmId) {
      setIsLoadingInventory(true);
      Promise.all([
        inventoryService.getWarehouses(farmId).catch(() => []),
        inventoryService.getInventory({ farmId, size: 200 }).catch(() => ({ content: [] })),
      ])
        .then(([whRes, invRes]) => {
          const whList = Array.isArray(whRes) ? whRes : (whRes?.content || []);
          const invList = Array.isArray(invRes) ? invRes : (invRes?.content || []);
          setWarehouses(whList);
          setInventoryList(invList);

          // Lọc các lô thẻ tai
          const tagInv = invList.filter((inv) =>
            inv.skuCode === 'MAT_RFID_TAG' ||
            inv.materialName?.toLowerCase().includes('rfid') ||
            inv.materialName?.toLowerCase().includes('thẻ tai')
          );

          // Tìm kho đang có sẵn tồn kho thẻ tai > 0
          const whWithStock = whList.find((w) => {
            const stock = tagInv
              .filter((i) => Number(i.warehouseId) === Number(w.id))
              .reduce((sum, i) => sum + (Number(i.quantityOnHand) || 0), 0);
            return stock > 0;
          });

          const defaultWh = whWithStock || whList[0];
          if (defaultWh) {
            setSelectedWarehouseId(String(defaultWh.id));
          }
        })
        .catch(() => {
          setWarehouses([]);
          setInventoryList([]);
        })
        .finally(() => setIsLoadingInventory(false));
    }
  }, [isOpen, farmId]);

  // Danh sách các lô thẻ tai trong kho đang chọn
  const tagStockInSelectedWarehouse = React.useMemo(() => {
    if (!selectedWarehouseId) return [];
    return inventoryList.filter(
      (inv) =>
        Number(inv.warehouseId) === Number(selectedWarehouseId) &&
        (inv.skuCode === 'MAT_RFID_TAG' ||
          inv.materialName?.toLowerCase().includes('rfid') ||
          inv.materialName?.toLowerCase().includes('thẻ tai'))
    );
  }, [selectedWarehouseId, inventoryList]);

  // Tổng số lượng thẻ tai tồn kho của kho đang chọn
  const currentWhAvailableStock = React.useMemo(() => {
    return tagStockInSelectedWarehouse.reduce((sum, i) => sum + (Number(i.quantityOnHand) || 0), 0);
  }, [tagStockInSelectedWarehouse]);

  // Khi đổi kho, tự động cập nhật đơn giá vốn và vị trí kệ
  useEffect(() => {
    if (tagStockInSelectedWarehouse.length > 0) {
      const firstItem = tagStockInSelectedWarehouse[0];
      if (firstItem.unitCost && Number(firstItem.unitCost) > 0) {
        setTagUnitPrice(String(firstItem.unitCost));
      }
      if (firstItem.storageBinCode) {
        setSelectedStorageBin(firstItem.storageBinCode);
      }
    } else {
      setSelectedStorageBin('');
    }
  }, [tagStockInSelectedWarehouse]);

  // Tải danh sách vị trí kệ của phân khu trực thuộc kho
  useEffect(() => {
    if (!selectedWarehouseId || !farmId) {
      setWarehouseLocations([]);
      return;
    }
    const currentWh = warehouses.find((w) => Number(w.id) === Number(selectedWarehouseId));
    if (currentWh?.zoneId) {
      geographyService.getLocations(farmId, currentWh.zoneId)
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.content || []);
          // Chỉ lấy các kệ thuộc đúng kho đang chọn
          const whLocations = list.filter((loc) => Number(loc.warehouseId) === Number(selectedWarehouseId));
          setWarehouseLocations(whLocations);
        })
        .catch(() => setWarehouseLocations([]));
    } else {
      setWarehouseLocations([]);
    }
  }, [selectedWarehouseId, warehouses, farmId]);

  // Reset or initialize state when opening
  useEffect(() => {
    if (isOpen && group) {
      const suggestedCount = Math.max(
        1,
        (group.currentQuantity || group.initialQuantity || 10) - (group.taggedIndividualCount || 0)
      );
      const cleanCode = (group.groupCode || 'TAG').replace(/[^a-zA-Z0-9]/g, '');
      const prefix = `${cleanCode}-`;

      setRangeConfig({
        prefix,
        startNumber: 1,
        count: suggestedCount,
        digits: 4,
        defaultGender: 'FEMALE',
        defaultWeightKg: group.avgInitialWeightKg ? String(group.avgInitialWeightKg) : '',
        defaultHealthStatus: 'HEALTHY',
      });

      setExcelIndividuals([]);
      setExcelFileName('');
      setExcelErrors([]);
      setScannedList([]);
      setScannedInput('');
      setScannerWeight(group.avgInitialWeightKg ? String(group.avgInitialWeightKg) : '');
      setErrorMsg('');
    }
  }, [isOpen, group]);

  // Keep scanner input focused when on SCANNER tab
  useEffect(() => {
    if (isOpen && activeTab === 'SCANNER') {
      setTimeout(() => scannerInputRef.current?.focus(), 150);
    }
  }, [isOpen, activeTab]);

  // -------------------------------------------------------------
  // RANGE GENERATOR PREVIEW
  // -------------------------------------------------------------
  const generateRangePreview = () => {
    const list = [];
    const count = Math.min(Number(rangeConfig.count) || 0, 500);
    const start = Number(rangeConfig.startNumber) || 1;
    const digits = Number(rangeConfig.digits) || 4;
    const prefix = rangeConfig.prefix || '';

    for (let i = 0; i < count; i++) {
      const num = start + i;
      const paddedNum = String(num).padStart(digits, '0');
      list.push(`${prefix}${paddedNum}`);
    }
    return list;
  };

  const rangePreviewList = generateRangePreview();

  // -------------------------------------------------------------
  // CSV FILE PARSING
  // -------------------------------------------------------------
  const handleDownloadSampleCsv = () => {
    const csvContent =
      'Mã thẻ tai,Giới tính (MALE/FEMALE),Cân nặng (kg),Mã mẹ,Mã bố\n' +
      'TAG-0001,FEMALE,25.5,,\n' +
      'TAG-0002,MALE,26.0,TAG-M01,TAG-F01\n' +
      'TAG-0003,FEMALE,24.8,,\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mau_Gan_The_Tai_${group?.groupCode || 'Group'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast.warning('File không có dữ liệu hoặc chỉ chứa tiêu đề!');
        return;
      }

      const parsed = [];
      const errs = [];
      const seenTags = new Set();

      // Skip header line 0
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Split by comma or semicolon or tab
        const cols = line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
        const rfidTagCode = cols[0];
        if (!rfidTagCode) continue;

        if (seenTags.has(rfidTagCode.toUpperCase())) {
          errs.push(`Dòng ${i + 1}: Mã thẻ [${rfidTagCode}] bị trùng lặp trong file.`);
        } else {
          seenTags.add(rfidTagCode.toUpperCase());
        }

        let gender = (cols[1] || 'FEMALE').toUpperCase();
        if (gender !== 'MALE' && gender !== 'FEMALE' && gender !== 'CASTRATED') {
          gender = 'FEMALE';
        }

        const currentWeightKg = cols[2] && !isNaN(cols[2]) ? Number(cols[2]) : null;
        const motherTagCode = cols[3] || null;
        const fatherTagCode = cols[4] || null;

        parsed.push({
          rfidTagCode,
          gender,
          currentWeightKg,
          motherTagCode,
          fatherTagCode,
          healthStatus: 'HEALTHY',
        });
      }

      setExcelIndividuals(parsed);
      setExcelErrors(errs);
      if (parsed.length > 0) {
        toast.success(`Đã đọc thành công ${parsed.length} cá thể từ file ${file.name}!`);
      }
    };

    reader.readAsText(file);
  };

  // -------------------------------------------------------------
  // CONTINUOUS SCANNER HANDLER
  // -------------------------------------------------------------
  const handleScannerKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scannedInput.trim().toUpperCase();
      if (!code) return;

      if (scannedList.some((item) => item.rfidTagCode === code)) {
        toast.warning(`Mã thẻ [${code}] đã có trong danh sách vừa quét!`);
        setScannedInput('');
        return;
      }

      const newItem = {
        rfidTagCode: code,
        gender: scannerGender,
        currentWeightKg: scannerWeight ? Number(scannerWeight) : null,
        healthStatus: 'HEALTHY',
        scannedAt: new Date().toLocaleTimeString('vi-VN'),
      };

      setScannedList((prev) => [newItem, ...prev]);
      setScannedInput('');
      toast.success(`+ Đã quét: ${code}`);
    }
  };

  const removeScannedItem = (index) => {
    setScannedList((prev) => prev.filter((_, i) => i !== index));
  };

  // -------------------------------------------------------------
  // SUBMISSION
  // -------------------------------------------------------------
  const handleSubmit = async () => {
    setErrorMsg('');
    if (!farmId || !group?.id) {
      toast.error('Thiếu thông tin đàn nuôi!');
      return;
    }

    let payload = {
      groupId: group.id,
      zoneId: zoneId || group.zoneId,
      locationId: group.locationId || null,
      mode: activeTab,
    };

    if (activeTab === 'RANGE') {
      const count = Number(rangeConfig.count);
      if (!count || count <= 0) {
        setErrorMsg('Số lượng con cần tạo phải lớn hơn 0');
        return;
      }
      if (count > 500) {
        setErrorMsg('Một lần sinh dải số tối đa 500 con để đảm bảo hiệu năng');
        return;
      }

      payload = {
        ...payload,
        prefix: rangeConfig.prefix?.trim() || '',
        startNumber: Number(rangeConfig.startNumber) || 1,
        count: count,
        digits: Number(rangeConfig.digits) || 4,
        defaultGender: rangeConfig.defaultGender,
        defaultWeightKg: rangeConfig.defaultWeightKg ? Number(rangeConfig.defaultWeightKg) : null,
        defaultHealthStatus: rangeConfig.defaultHealthStatus,
      };
    } else if (activeTab === 'EXCEL') {
      if (excelIndividuals.length === 0) {
        setErrorMsg('Chưa có dữ liệu cá thể từ file. Vui lòng tải lên file CSV!');
        return;
      }
      payload = {
        ...payload,
        mode: 'LIST',
        individuals: excelIndividuals,
      };
    } else if (activeTab === 'SCANNER') {
      if (scannedList.length === 0) {
        setErrorMsg('Chưa quét được mã thẻ nào. Vui lòng quét hoặc nhập mã thẻ vào ô bên dưới!');
        return;
      }
      payload = {
        ...payload,
        mode: 'LIST',
        individuals: scannedList.map(({ scannedAt, ...rest }) => rest),
      };
    }

    const countNeeded = activeTab === 'RANGE'
      ? (Number(rangeConfig.count) || 0)
      : activeTab === 'EXCEL'
      ? excelIndividuals.length
      : scannedList.length;

    if (autoDeductInventory) {
      if (!selectedWarehouseId) {
        setErrorMsg('Vui lòng chọn kho xuất vật tư thẻ tai!');
        return;
      }
      if (currentWhAvailableStock < countNeeded) {
        const whName = warehouses.find((w) => String(w.id) === String(selectedWarehouseId))?.name || 'Kho đã chọn';
        setErrorMsg(
          `Kho '${whName}' không đủ tồn kho Thẻ tai RFID (Hiện còn: ${currentWhAvailableStock} cái, Cần xuất: ${countNeeded} cái). Vui lòng nhập kho thẻ tai trước khi gắn thẻ, chọn kho khác có tồn kho, hoặc bỏ chọn "Tự động xuất kho" để chỉ sinh mã định danh!`
        );
        return;
      }
    }

    payload.autoDeductTagInventory = autoDeductInventory;
    payload.warehouseId = autoDeductInventory && selectedWarehouseId ? Number(selectedWarehouseId) : null;
    payload.storageBinCode = autoDeductInventory && selectedStorageBin ? selectedStorageBin : null;
    payload.tagUnitPrice = autoDeductInventory && tagUnitPrice ? Number(tagUnitPrice) : null;

    try {
      setIsSubmitting(true);
      const res = await farmingService.batchCreateLivestockIndividuals(farmId, payload);

      const total = res?.totalCreated || 0;
      const skipped = res?.skippedTagCodes || [];

      if (res?.inventoryDeducted) {
        toast.success(
          `Đã gán ${total} thẻ tai! Đã tự động xuất kho (Phiếu: ${res.issueCode || 'ISS-TAG'}) và hạch toán ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(res.totalTagCost || 0)} vào chi phí đàn.`
        );
      } else if (skipped.length > 0) {
        toast.info(
          `Gán thành công ${total} thẻ tai. Đã bỏ qua ${skipped.length} mã đã tồn tại: ${skipped.slice(0, 3).join(', ')}${skipped.length > 3 ? '...' : ''}`
        );
      } else {
        toast.success(`Đã khởi tạo thành công ${total} cá thể đeo thẻ tai cho đàn ${group.groupCode}!`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi gán thẻ hàng loạt:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi gán thẻ tai hàng loạt';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gán Thẻ Tai Hàng Loạt (Bulk RFID Tagging)"
      subtitle={`Đàn: ${group?.groupCode || '—'} | Tổng đàn: ${group?.currentQuantity || group?.initialQuantity || '—'} con | Giống: ${group?.breedName || '—'}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              {activeTab === 'RANGE' && `Sẵn sàng tạo: ${rangeConfig.count || 0} con`}
              {activeTab === 'EXCEL' && `Sẵn sàng nạp: ${excelIndividuals.length} con`}
              {activeTab === 'SCANNER' && `Đã quét: ${scannedList.length} con`}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              {activeTab === 'RANGE' && `Khởi Tạo ${rangeConfig.count || 0} Thẻ Tai`}
              {activeTab === 'EXCEL' && `Nạp ${excelIndividuals.length} Thẻ Từ File`}
              {activeTab === 'SCANNER' && `Lưu ${scannedList.length} Thẻ Đã Quét`}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-rose-800 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB BUTTONS */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('RANGE')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold transition-all text-xs ${
              activeTab === 'RANGE'
                ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hash className="h-4 w-4" />
            <span>1. Sinh Dải Số Tự Động</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EXCEL')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold transition-all text-xs ${
              activeTab === 'EXCEL'
                ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>2. Nhập Từ File Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SCANNER')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold transition-all text-xs ${
              activeTab === 'SCANNER'
                ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scan className="h-4 w-4" />
            <span>3. Quét RFID Liên Tục</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: RANGE AUTO-GENERATION                              */}
        {/* ========================================================= */}
        {activeTab === 'RANGE' && (
          <div className="space-y-4">
            <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 text-purple-900 text-[11px] leading-relaxed flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong>Tối ưu hóa gán thẻ quy mô lớn:</strong> Hệ thống tự động sinh dải số thẻ tai theo mẫu cố định (Ví dụ: <code>BO-0001</code> đến <code>BO-0050</code>). Tự động kiểm tra và bỏ qua các mã đã trùng lặp.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <FormField label="Tiền tố thẻ (Prefix)" hint="VD: BO-26-, HEO-...">
                <Input
                  value={rangeConfig.prefix}
                  onChange={(e) => setRangeConfig({ ...rangeConfig, prefix: e.target.value })}
                  placeholder="BO-26-"
                  className="font-mono font-bold"
                />
              </FormField>

              <FormField label="Số bắt đầu" hint="VD: 1">
                <Input
                  type="number"
                  min="1"
                  value={rangeConfig.startNumber}
                  onChange={(e) => setRangeConfig({ ...rangeConfig, startNumber: e.target.value })}
                  className="font-mono"
                />
              </FormField>

              <FormField label="Số lượng con cần tạo *" hint="Tối đa 500 con/lần">
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={rangeConfig.count}
                  onChange={(e) => setRangeConfig({ ...rangeConfig, count: e.target.value })}
                  className="font-mono font-bold text-purple-700"
                />
              </FormField>

              <FormField label="Độ dài chữ số (Padding)" hint="4 số -> 0001">
                <Select
                  value={rangeConfig.digits}
                  onChange={(e) => setRangeConfig({ ...rangeConfig, digits: Number(e.target.value) })}
                  className="font-mono"
                >
                  <option value={3}>3 số (VD: 001)</option>
                  <option value={4}>4 số (VD: 0001)</option>
                  <option value={5}>5 số (VD: 00001)</option>
                  <option value={6}>6 số (VD: 000001)</option>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Giới tính mặc định">
                <Select
                  value={rangeConfig.defaultGender}
                  onChange={(e) => setRangeConfig({ ...rangeConfig, defaultGender: e.target.value })}
                >
                  <option value="FEMALE">Cái (FEMALE ♀)</option>
                  <option value="MALE">Đực (MALE ♂)</option>
                  <option value="MIXED">Xen kẽ 50/50 (1 Đực, 1 Cái)</option>
                </Select>
              </FormField>

              <FormField label="Cân nặng ban đầu (kg/con)" hint="Để trống nếu chưa cân">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="VD: 25.5"
                  value={rangeConfig.defaultWeightKg}
                  onChange={(e) => setRangeConfig({ ...rangeConfig, defaultWeightKg: e.target.value })}
                />
              </FormField>

              <FormField label="Tình trạng sức khỏe">
                <Select
                  value={rangeConfig.defaultHealthStatus}
                  onChange={(e) => setRangeConfig({ ...rangeConfig, defaultHealthStatus: e.target.value })}
                >
                  <option value="HEALTHY">HEALTHY - Khỏe mạnh bình thường</option>
                  <option value="QUARANTINED">QUARANTINED - Đang cách ly thú y</option>
                </Select>
              </FormField>
            </div>

            {/* PREVIEW BOX */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold text-[11px] flex items-center gap-1.5">
                  <span>👁️</span> Danh sách xem trước mã thẻ tai ({rangePreviewList.length} con):
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {rangePreviewList[0]} ➔ {rangePreviewList[rangePreviewList.length - 1]}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                {rangePreviewList.slice(0, 30).map((tag, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-semibold"
                  >
                    {tag}
                  </span>
                ))}
                {rangePreviewList.length > 30 && (
                  <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 self-center">
                    ... và thêm {rangePreviewList.length - 30} cá thể nữa
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: EXCEL / CSV BULK IMPORT                            */}
        {/* ========================================================= */}
        {activeTab === 'EXCEL' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Nhập từ danh sách Excel:</strong> Dành cho đàn gia súc nhập từ trang trại giống có sẵn danh sách RFID, cân nặng và phả hệ mẹ/bố.
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={handleDownloadSampleCsv}
                className="whitespace-nowrap shrink-0 border-amber-300 hover:bg-amber-100 text-amber-900"
              >
                Tải File Mẫu (.csv)
              </Button>
            </div>

            {/* UPLOAD DROPZONE */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50/30 rounded-2xl p-6 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, text/csv, text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
              <UploadCloud className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-bold text-slate-800">
                {excelFileName ? `Đã chọn: ${excelFileName}` : 'Bấm vào đây để chọn file (.csv)'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Định dạng chuẩn: Mã thẻ tai, Giới tính, Cân nặng, Mã mẹ, Mã bố
              </div>
            </div>

            {excelErrors.length > 0 && (
              <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                <span className="font-bold">Cảnh báo trùng lặp trong file:</span>
                {excelErrors.slice(0, 5).map((e, idx) => (
                  <div key={idx}>• {e}</div>
                ))}
              </div>
            )}

            {/* PREVIEW TABLE */}
            {excelIndividuals.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 flex items-center justify-between font-bold text-slate-700 text-[11px]">
                  <span>Xem trước danh sách ({excelIndividuals.length} con):</span>
                  <button
                    type="button"
                    onClick={() => {
                      setExcelIndividuals([]);
                      setExcelFileName('');
                      setExcelErrors([]);
                    }}
                    className="text-rose-600 hover:underline text-[10px]"
                  >
                    Xóa bỏ file này
                  </button>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                      <tr>
                        <th className="px-3 py-1.5">#</th>
                        <th className="px-3 py-1.5">Mã Thẻ Tai</th>
                        <th className="px-3 py-1.5">Giới Tính</th>
                        <th className="px-3 py-1.5 text-right">Cân Nặng</th>
                        <th className="px-3 py-1.5">Mã Mẹ</th>
                        <th className="px-3 py-1.5">Mã Bố</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelIndividuals.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-1 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-3 py-1 font-mono font-bold text-purple-700">{row.rfidTagCode}</td>
                          <td className="px-3 py-1">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 border border-slate-200">
                              {row.gender}
                            </span>
                          </td>
                          <td className="px-3 py-1 text-right font-mono font-medium">
                            {row.currentWeightKg != null ? `${row.currentWeightKg} kg` : '—'}
                          </td>
                          <td className="px-3 py-1 font-mono text-slate-500">{row.motherTagCode || '—'}</td>
                          <td className="px-3 py-1 font-mono text-slate-500">{row.fatherTagCode || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STREAM SCANNER (BARCODE / RFID SCANNER GUN)       */}
        {/* ========================================================= */}
        {activeTab === 'SCANNER' && (
          <div className="space-y-4">
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
              <Scan className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Chế độ Quét mã vạch / Đầu đọc RFID cầm tay:</strong> Cắm súng quét mã USB/Bluetooth. Đưa thẻ tai lại gần đầu đọc, hệ thống sẽ tự động bắt mã và thêm vào danh sách liên tục mà không cần click chuột.
              </div>
            </div>

            {/* SCANNER CONFIG & RAPID INPUT */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-purple-900 mb-1">
                  ⚡ Quét mã thẻ hoặc nhập và gõ Enter:
                </label>
                <div className="relative">
                  <Input
                    ref={scannerInputRef}
                    value={scannedInput}
                    onChange={(e) => setScannedInput(e.target.value)}
                    onKeyDown={handleScannerKeyDown}
                    placeholder="Quét mã RFID tại đây..."
                    className="font-mono text-sm font-bold border-purple-400 focus:ring-purple-500 bg-white"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                    Auto-Focus
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Giới tính mặc định:</label>
                <Select
                  value={scannerGender}
                  onChange={(e) => setScannerGender(e.target.value)}
                  className="text-xs"
                >
                  <option value="FEMALE">Cái (FEMALE ♀)</option>
                  <option value="MALE">Đực (MALE ♂)</option>
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Cân nặng (kg):</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="VD: 25.5"
                  value={scannerWeight}
                  onChange={(e) => setScannerWeight(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* SCANNED ITEMS LIST */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 flex items-center justify-between font-bold text-slate-700 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đã quét: <strong className="text-purple-700 font-mono text-xs">{scannedList.length}</strong> con
                </span>
                {scannedList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScannedList([])}
                    className="text-rose-600 hover:underline text-[10px]"
                  >
                    Xóa danh sách vừa quét
                  </button>
                )}
              </div>

              {scannedList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chưa có thẻ tai nào được quét. Vui lòng bắt đầu quét!
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                      <tr>
                        <th className="px-3 py-1.5">#</th>
                        <th className="px-3 py-1.5">Mã Thẻ Tai</th>
                        <th className="px-3 py-1.5">Giới Tính</th>
                        <th className="px-3 py-1.5 text-right">Cân Nặng</th>
                        <th className="px-3 py-1.5">Thời Gian</th>
                        <th className="px-3 py-1.5 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scannedList.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-1 text-slate-400 font-mono">{scannedList.length - idx}</td>
                          <td className="px-3 py-1 font-mono font-bold text-purple-700">{row.rfidTagCode}</td>
                          <td className="px-3 py-1">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 border border-slate-200">
                              {row.gender}
                            </span>
                          </td>
                          <td className="px-3 py-1 text-right font-mono font-medium">
                            {row.currentWeightKg != null ? `${row.currentWeightKg} kg` : '—'}
                          </td>
                          <td className="px-3 py-1 text-slate-400 text-[10px]">{row.scannedAt}</td>
                          <td className="px-3 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => removeScannedItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Xóa mã này"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TỰ ĐỘNG XUẤT KHO VẬT TƯ THẺ TAI & HẠCH TOÁN KẾ TOÁN       */}
        {/* ========================================================= */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 space-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-emerald-950">
            <input
              type="checkbox"
              checked={autoDeductInventory}
              onChange={(e) => setAutoDeductInventory(e.target.checked)}
              className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span>📦 Tự Động Xuất Kho Thẻ Tai RFID & Hạch Toán Vào Chi Phí Đàn (Auto-Backflushing)</span>
          </label>

          {autoDeductInventory && (
            <div className="space-y-3 pt-1 border-t border-emerald-200/60">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField
                  label="Kho xuất vật tư thẻ tai *"
                  hint={isLoadingInventory ? 'Đang kiểm tra tồn kho...' : `Tồn kho: ${currentWhAvailableStock} cái`}
                >
                  <Select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  >
                    <option value="">-- Chọn kho xuất vật tư --</option>
                    {warehouses.map((w) => {
                      const tagInv = inventoryList.filter(
                        (inv) =>
                          Number(inv.warehouseId) === Number(w.id) &&
                          (inv.skuCode === 'MAT_RFID_TAG' ||
                            inv.materialName?.toLowerCase().includes('rfid') ||
                            inv.materialName?.toLowerCase().includes('thẻ tai'))
                      );
                      const stock = tagInv.reduce((sum, i) => sum + (Number(i.quantityOnHand) || 0), 0);
                      return (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code}) {stock > 0 ? `— [Tồn: ${stock} cái]` : '— [Tồn: 0 cái]'}
                        </option>
                      );
                    })}
                  </Select>
                </FormField>

                <FormField
                  label="Vị trí kệ / Ô lưu trữ"
                  hint={selectedStorageBin ? `Đang chọn: ${selectedStorageBin}` : 'Mặc định toàn kho'}
                >
                  <Select
                    value={selectedStorageBin}
                    onChange={(e) => setSelectedStorageBin(e.target.value)}
                  >
                    <option value="">-- Tất cả kệ / Lấy theo FEFO --</option>
                    {/* Danh sách các vị trí kệ thuộc kho đang chọn */}
                    {warehouseLocations.map((loc) => {
                      const matchingStock = tagStockInSelectedWarehouse.filter(
                        (inv) => inv.storageBinCode === loc.code || inv.storageBinCode === loc.name
                      );
                      const stockQty = matchingStock.reduce((sum, i) => sum + (Number(i.quantityOnHand) || 0), 0);
                      const batchStr = matchingStock.map((i) => i.batchNumber).filter(Boolean).join(', ');
                      return (
                        <option key={`loc-${loc.id}`} value={loc.code || loc.name}>
                          {loc.name} ({loc.code}){stockQty > 0 ? ` — [Còn: ${stockQty} cái${batchStr ? ` | Lô: ${batchStr}` : ''}]` : ' — [Trống]'}
                        </option>
                      );
                    })}
                    {/* Bổ sung các ô có tồn kho thực tế nếu mã ô không nằm trong danh sách kệ của kho */}
                    {tagStockInSelectedWarehouse
                      .filter(
                        (inv) =>
                          inv.storageBinCode &&
                          !warehouseLocations.some((l) => l.code === inv.storageBinCode || l.name === inv.storageBinCode)
                      )
                      .map((inv) => (
                        <option key={`inv-${inv.id}`} value={inv.storageBinCode}>
                          {inv.storageBinCode} (Lô: {inv.batchNumber} — Còn: {inv.quantityOnHand} cái)
                        </option>
                      ))}
                  </Select>
                </FormField>

                <FormField label="Đơn giá thẻ tai (đ/cái) *" hint="Tự động từ giá vốn / có thể sửa">
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    value={tagUnitPrice}
                    onChange={(e) => setTagUnitPrice(e.target.value)}
                    className="font-mono text-right font-bold text-emerald-900 bg-white"
                  />
                </FormField>
              </div>

              {/* Cảnh báo nếu kho không có tồn kho thẻ tai */}
              {selectedWarehouseId && currentWhAvailableStock === 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-rose-800 border border-rose-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <div>
                    <strong>Lưu ý quan trọng:</strong> Kho đã chọn hiện <u>không có tồn kho</u> Thẻ tai RFID (Tồn kho: 0 cái).
                    <p className="mt-0.5 text-[11px] text-rose-700">
                      Vui lòng nhập kho thẻ tai trước, chọn kho khác có sẵn thẻ tai (VD: <em>Kho Vật Tư Tiêu Hao WHS-007</em>), hoặc <strong>bỏ chọn checkbox</strong> ở trên nếu chỉ muốn sinh mã định danh cá thể mà không xuất kho.
                    </p>
                  </div>
                </div>
              )}

              {/* Thông báo số lượng tồn kho khả dụng */}
              {selectedWarehouseId && currentWhAvailableStock > 0 && (
                <div className="flex items-center justify-between text-[11px] bg-emerald-100/70 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Tồn kho khả dụng: <strong>{currentWhAvailableStock} cái</strong> thẻ tai RFID
                  </span>
                  <span className="font-mono text-[10px] text-emerald-800">
                    Thành tiền dự kiến: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      (activeTab === 'RANGE' ? (Number(rangeConfig.count) || 0) : activeTab === 'EXCEL' ? excelIndividuals.length : scannedList.length) * (Number(tagUnitPrice) || 0)
                    )}
                  </span>
                </div>
              )}

              <p className="text-[10px] text-emerald-800 leading-snug">
                ℹ️ Hệ thống sẽ tự động tạo Phiếu xuất kho <strong>(WarehouseIssue)</strong> trừ số lượng thẻ theo lô cận hạn nhất (FEFO) và hạch toán khoản chi phí <strong>(FarmExpense)</strong> gắn trực tiếp với đàn nuôi {group?.groupCode} để phục vụ tính giá thành.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default BatchTaggingModal;

