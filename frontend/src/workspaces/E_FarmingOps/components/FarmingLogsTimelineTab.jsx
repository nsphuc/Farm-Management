import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Package,
  Layers,
  ShieldAlert,
  Droplets,
  Activity,
  User,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  Syringe,
  Pill,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { farmingService } from '@/services/modules/farmingService';
import { masterDataService } from '@/services/modules/masterDataService';
import { inventoryService } from '@/services/modules/inventoryService';
import { formatDate, formatNumber } from '@/utils/formatters';

export function FarmingLogsTimelineTab({ item, sector, farmId, onDataChanged }) {
  const { notifyDataChanged } = useActiveFarmStore();

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Canh tác (Crop)
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [cropQuotas, setCropQuotas] = useState([]);
  const [logForm, setLogForm] = useState({
    activityType: 'FERTILIZATION',
    logDate: new Date().toISOString().split('T')[0],
    stage: 'Chăm sóc sinh trưởng',
    phiDays: 0,
    weatherNotes: 'Trời nắng ráo',
    supplies: [],
  });

  // Modal Thú y & Tiêm phòng (Livestock)
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [groupIndividuals, setGroupIndividuals] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryBatches, setInventoryBatches] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoadingSupplies, setIsLoadingSupplies] = useState(false);

  const [eventForm, setEventForm] = useState({
    targetType: 'GROUP',
    individualId: '',
    eventType: 'VACCINATION',
    eventDate: new Date().toISOString().split('T')[0],
    headCountAffected: '',
    withdrawalDays: 0,
    withdrawalEndDate: '',
    totalCost: '',
    detailsJson: '',
    supplies: [],
  });

  // Tải danh sách nhật ký hiện trường
  const fetchLogs = async () => {
    if (!farmId || !item?.id) return;
    try {
      setIsLoading(true);
      if (sector === 'CROP') {
        const res = await farmingService.getFarmingLogs(farmId, { seasonId: item.id, size: 50 });
        const list = res?.content || (Array.isArray(res) ? res : []);
        setLogs(list);
      } else {
        const [res, indRes] = await Promise.all([
          farmingService.getLivestockEvents(farmId, { groupId: item.id, size: 50 }),
          farmingService.getLivestockIndividuals(farmId, { groupId: item.id }).catch(() => ({ content: [] })),
        ]);
        const list = res?.content || (Array.isArray(res) ? res : []);
        setLogs(list);
        setGroupIndividuals(indRes?.content || (Array.isArray(indRes) ? indRes : []));
      }
    } catch (err) {
      console.error('Lỗi khi tải nhật ký hiện trường:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [farmId, item?.id, sector]);

  // Nạp dữ liệu Kho, Tồn kho khả dụng & Định mức BOM khi mở Modal Canh tác hoặc Thú Y
  useEffect(() => {
    if ((isAddEventOpen || isAddLogOpen) && farmId) {
      setIsLoadingSupplies(true);
      Promise.all([
        masterDataService.getWarehouses(farmId).catch(() => []),
        inventoryService.getInventory({ farmId, size: 300 }).catch(() => ({ content: [] })),
        masterDataService.getMaterials({ farmId, size: 300 }).catch(() => ({ content: [] })),
        masterDataService.getQuotas({ farmId, cropTypeId: item?.cropTypeId }).catch(() => ({ content: [] })),
      ])
        .then(([whRes, invRes, matRes, quotaRes]) => {
          const rawWh = Array.isArray(whRes) ? whRes : (whRes?.content || []);
          const activeWh = rawWh.filter((w) => w.status === 'ACTIVE');
          setWarehouses(activeWh);

          const rawInv = invRes?.content || (Array.isArray(invRes) ? invRes : []);
          // Lọc các lô còn tồn khả dụng > 0
          const availableBatches = rawInv.filter(
            (b) => (b.availableQuantity ?? (b.quantityOnHand - (b.reservedQuantity || 0))) > 0
          );
          setInventoryBatches(availableBatches);

          const rawMat = matRes?.content || (Array.isArray(matRes) ? matRes : []);
          setMaterials(rawMat);

          const rawQuotas = quotaRes?.content || (Array.isArray(quotaRes) ? quotaRes : []);
          const filteredQuotas = item?.cropTypeId
            ? rawQuotas.filter((q) => !q.cropTypeId || String(q.cropTypeId) === String(item.cropTypeId))
            : rawQuotas;
          setCropQuotas(filteredQuotas);
        })
        .catch((err) => {
          console.error('Lỗi nạp tồn kho & định mức:', err);
        })
        .finally(() => {
          setIsLoadingSupplies(false);
        });

      if (isAddEventOpen) {
        // Reset form với giá trị gợi ý theo item đàn
        const defaultCount = item?.currentQuantity || item?.headCount || 1;
        setEventForm({
          targetType: 'GROUP',
          individualId: '',
          eventType: 'VACCINATION',
          eventDate: new Date().toISOString().split('T')[0],
          headCountAffected: defaultCount,
          withdrawalDays: 0,
          withdrawalEndDate: '',
          totalCost: '',
          detailsJson: '',
          supplies: [],
        });
      }
    }
  }, [isAddEventOpen, isAddLogOpen, farmId, item]);

  // Xử lý thay đổi ngày sự kiện hoặc số ngày cách ly
  const handleEventDateChange = (newDate) => {
    setEventForm((prev) => {
      let endDate = prev.withdrawalEndDate;
      if (prev.withdrawalDays && Number(prev.withdrawalDays) > 0 && newDate) {
        const d = new Date(newDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + Number(prev.withdrawalDays));
          endDate = d.toISOString().split('T')[0];
        }
      }
      return { ...prev, eventDate: newDate, withdrawalEndDate: endDate };
    });
  };

  const handleWithdrawalDaysChange = (daysVal) => {
    const daysNum = Math.max(0, parseInt(daysVal, 10) || 0);
    setEventForm((prev) => {
      let endDate = '';
      if (daysNum > 0 && prev.eventDate) {
        const d = new Date(prev.eventDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + daysNum);
          endDate = d.toISOString().split('T')[0];
        }
      }
      return { ...prev, withdrawalDays: daysNum, withdrawalEndDate: endDate };
    });
  };

  const handleWithdrawalEndDateChange = (endDateVal) => {
    setEventForm((prev) => {
      let days = 0;
      if (endDateVal && prev.eventDate) {
        const start = new Date(prev.eventDate);
        const end = new Date(endDateVal);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
          days = Math.round((end - start) / (1000 * 60 * 60 * 24));
        }
      }
      return { ...prev, withdrawalEndDate: endDateVal, withdrawalDays: days };
    });
  };

  // Quản lý danh sách vật tư/thuốc xuất kho (Auto-Backflushing)
  const handleAddSupplyRow = () => {
    const defaultWhId = warehouses?.[0]?.id ? String(warehouses[0].id) : '';
    setEventForm((prev) => ({
      ...prev,
      supplies: [
        ...prev.supplies,
        {
          warehouseId: defaultWhId,
          materialId: '',
          batchNumber: '',
          actualQuantity: '',
          unit: '',
          availableQuantity: 0,
          expiryDate: '',
          notes: '',
        },
      ],
    }));
  };

  const handleRemoveSupplyRow = (index) => {
    setEventForm((prev) => ({
      ...prev,
      supplies: prev.supplies.filter((_, idx) => idx !== index),
    }));
  };

  const handleSupplyChange = (index, field, value) => {
    setEventForm((prev) => {
      const nextSupplies = [...prev.supplies];
      const row = { ...nextSupplies[index] };

      if (field === 'warehouseId') {
        row.warehouseId = value;
        row.materialId = '';
        row.batchNumber = '';
        row.actualQuantity = '';
        row.unit = '';
        row.availableQuantity = 0;
        row.expiryDate = '';
      } else if (field === 'materialId') {
        row.materialId = value;
        row.batchNumber = '';
        row.actualQuantity = '';

        // Tìm các lô của vật tư này trong kho đã chọn, sắp xếp FEFO (hạn sử dụng sớm nhất lên trước)
        const matchedBatches = inventoryBatches
          .filter(
            (b) =>
              String(b.warehouseId) === String(row.warehouseId) &&
              String(b.materialId) === String(value)
          )
          .sort((a, b) => new Date(a.expiryDate || '9999-12-31') - new Date(b.expiryDate || '9999-12-31'));

        const mat = materials.find((m) => String(m.id) === String(value));
        const firstBatch = matchedBatches[0];

        if (firstBatch) {
          row.batchNumber = firstBatch.batchNumber;
          row.availableQuantity =
            firstBatch.availableQuantity ??
            firstBatch.quantityOnHand - (firstBatch.reservedQuantity || 0);
          row.expiryDate = firstBatch.expiryDate;
          row.unit = firstBatch.standardUnit || mat?.standardUnit || 'Liều';
        } else {
          row.unit = mat?.standardUnit || 'Liều';
          row.availableQuantity = 0;
          row.expiryDate = '';
        }

        // Tự động gợi ý thời gian cách ly nếu vật tư có cấu hình defaultPhiDays / withdrawalPeriodDays
        const matPhi = mat?.defaultPhiDays || mat?.withdrawalPeriodDays || 0;
        if (matPhi > 0 && Number(prev.withdrawalDays || 0) < matPhi) {
          toast.info(
            `Gợi ý: Thuốc "${mat.name}" có thời gian ngừng thuốc tối thiểu ${matPhi} ngày. Đã tự động cập nhật ngày cách ly!`,
            { duration: 4500 }
          );
          let newEndDate = '';
          if (prev.eventDate) {
            const d = new Date(prev.eventDate);
            if (!isNaN(d.getTime())) {
              d.setDate(d.getDate() + matPhi);
              newEndDate = d.toISOString().split('T')[0];
            }
          }
          return {
            ...prev,
            withdrawalDays: matPhi,
            withdrawalEndDate: newEndDate,
            supplies: nextSupplies.map((s, idx) => (idx === index ? row : s)),
          };
        }
      } else if (field === 'batchNumber') {
        row.batchNumber = value;
        const batch = inventoryBatches.find(
          (b) =>
            String(b.warehouseId) === String(row.warehouseId) &&
            String(b.materialId) === String(row.materialId) &&
            b.batchNumber === value
        );
        if (batch) {
          row.availableQuantity =
            batch.availableQuantity ??
            batch.quantityOnHand - (batch.reservedQuantity || 0);
          row.expiryDate = batch.expiryDate;
          if (batch.standardUnit) row.unit = batch.standardUnit;
        }
      } else if (field === 'actualQuantity') {
        row.actualQuantity = value;
      } else if (field === 'unit') {
        row.unit = value;
      } else if (field === 'notes') {
        row.notes = value;
      }

      nextSupplies[index] = row;
      return { ...prev, supplies: nextSupplies };
    });
  };

  // Quản lý danh sách vật tư / phân bón / thuốc BVTV xuất kho (Crop Auto-Backflushing)
  const handleAddCropSupplyRow = () => {
    const defaultWhId = warehouses?.[0]?.id ? String(warehouses[0].id) : '';
    setLogForm((prev) => ({
      ...prev,
      supplies: [
        ...prev.supplies,
        {
          warehouseId: defaultWhId,
          materialId: '',
          batchNumber: '',
          actualQuantity: '',
          suggestedQuantity: 0,
          quotaId: null,
          varianceReason: '',
          unit: '',
          availableQuantity: 0,
          expiryDate: '',
          notes: '',
        },
      ],
    }));
  };

  const handleRemoveCropSupplyRow = (index) => {
    setLogForm((prev) => {
      const nextSupplies = prev.supplies.filter((_, idx) => idx !== index);
      // Tính lại phiDays lớn nhất từ các vật tư còn lại
      let maxPhi = 0;
      nextSupplies.forEach((s) => {
        const m = materials.find((mat) => String(mat.id) === String(s.materialId));
        if (m?.defaultPhiDays && m.defaultPhiDays > maxPhi) {
          maxPhi = m.defaultPhiDays;
        }
      });
      return { ...prev, supplies: nextSupplies, phiDays: maxPhi };
    });
  };

  const handleCropSupplyChange = (index, field, value) => {
    setLogForm((prev) => {
      const nextSupplies = [...prev.supplies];
      const row = { ...nextSupplies[index] };

      if (field === 'warehouseId') {
        row.warehouseId = value;
        row.materialId = '';
        row.batchNumber = '';
        row.actualQuantity = '';
        row.suggestedQuantity = 0;
        row.quotaId = null;
        row.varianceReason = '';
        row.unit = '';
        row.availableQuantity = 0;
        row.expiryDate = '';
      } else if (field === 'materialId') {
        row.materialId = value;
        row.batchNumber = '';
        row.actualQuantity = '';
        row.varianceReason = '';

        // Tìm các lô của vật tư này trong kho đã chọn, FEFO (hạn sử dụng sớm nhất)
        const matchedBatches = inventoryBatches
          .filter(
            (b) =>
              String(b.warehouseId) === String(row.warehouseId) &&
              String(b.materialId) === String(value)
          )
          .sort((a, b) => new Date(a.expiryDate || '9999-12-31') - new Date(b.expiryDate || '9999-12-31'));

        const mat = materials.find((m) => String(m.id) === String(value));
        const firstBatch = matchedBatches[0];

        if (firstBatch) {
          row.batchNumber = firstBatch.batchNumber;
          row.availableQuantity =
            firstBatch.availableQuantity ??
            firstBatch.quantityOnHand - (firstBatch.reservedQuantity || 0);
          row.expiryDate = firstBatch.expiryDate;
          row.unit = firstBatch.standardUnit || mat?.standardUnit || 'Kg';
        } else {
          row.unit = mat?.standardUnit || 'Kg';
          row.availableQuantity = 0;
          row.expiryDate = '';
        }

        // Đối chiếu định mức BOM nếu có quota khớp với vật tư này
        const matchedQuota = cropQuotas.find(
          (q) => String(q.materialId) === String(value) && (!q.stage || q.stage === prev.stage)
        ) || cropQuotas.find((q) => String(q.materialId) === String(value));

        if (matchedQuota) {
          const areaFactor = Number(item?.plantedAreaM2 || 1000) / 1000;
          const calculatedQty = Number((Number(matchedQuota.standardQuantity) * areaFactor).toFixed(2));
          row.suggestedQuantity = calculatedQty;
          row.quotaId = matchedQuota.id;
          if (!row.actualQuantity) {
            row.actualQuantity = calculatedQty;
          }
        } else {
          row.suggestedQuantity = 0;
          row.quotaId = null;
        }

        // Tự động cập nhật PHI nếu vật tư có cấu hình defaultPhiDays
        const matPhi = mat?.defaultPhiDays || 0;
        let nextPhi = Number(prev.phiDays || 0);
        if (matPhi > nextPhi) {
          nextPhi = matPhi;
          toast.info(
            `Gợi ý: Thuốc BVTV "${mat.name}" có thời gian cách ly tối thiểu ${matPhi} ngày. Đã tự động cập nhật thời gian cách ly PHI!`,
            { duration: 4000 }
          );
        }

        nextSupplies[index] = row;
        return {
          ...prev,
          phiDays: nextPhi,
          supplies: nextSupplies,
        };
      } else if (field === 'batchNumber') {
        row.batchNumber = value;
        const batch = inventoryBatches.find(
          (b) =>
            String(b.warehouseId) === String(row.warehouseId) &&
            String(b.materialId) === String(row.materialId) &&
            b.batchNumber === value
        );
        if (batch) {
          row.availableQuantity =
            batch.availableQuantity ??
            batch.quantityOnHand - (batch.reservedQuantity || 0);
          row.expiryDate = batch.expiryDate;
          if (batch.standardUnit) row.unit = batch.standardUnit;
        }
      } else if (field === 'actualQuantity') {
        row.actualQuantity = value;
      } else if (field === 'varianceReason') {
        row.varianceReason = value;
      } else if (field === 'unit') {
        row.unit = value;
      } else if (field === 'notes') {
        row.notes = value;
      }

      nextSupplies[index] = row;
      return { ...prev, supplies: nextSupplies };
    });
  };

  const handleApplyCropBOMQuota = () => {
    if (!cropQuotas || cropQuotas.length === 0) {
      toast.warning('Chưa có cấu hình định mức kỹ thuật BOM cho loại cây trồng này!');
      return;
    }

    const defaultWhId = warehouses?.[0]?.id ? String(warehouses[0].id) : '';
    if (!defaultWhId) {
      toast.warning('Chưa có kho khả dụng để xuất vật tư!');
      return;
    }

    const areaFactor = Number(item?.plantedAreaM2 || 1000) / 1000;
    const newSupplies = [];
    let maxPhi = Number(logForm.phiDays || 0);

    for (const q of cropQuotas) {
      const mat = materials.find((m) => String(m.id) === String(q.materialId));
      const matchedBatches = inventoryBatches
        .filter((b) => String(b.materialId) === String(q.materialId))
        .sort((a, b) => new Date(a.expiryDate || '9999-12-31') - new Date(b.expiryDate || '9999-12-31'));

      const firstBatch = matchedBatches[0];
      const suggestedQty = Number((Number(q.standardQuantity) * areaFactor).toFixed(2));

      newSupplies.push({
        warehouseId: firstBatch ? String(firstBatch.warehouseId) : defaultWhId,
        materialId: String(q.materialId),
        batchNumber: firstBatch ? firstBatch.batchNumber : '',
        actualQuantity: suggestedQty,
        suggestedQuantity: suggestedQty,
        quotaId: q.id,
        varianceReason: '',
        unit: q.unitOfMeasure || mat?.standardUnit || 'Kg',
        availableQuantity: firstBatch
          ? (firstBatch.availableQuantity ?? (firstBatch.quantityOnHand - (firstBatch.reservedQuantity || 0)))
          : 0,
        expiryDate: firstBatch?.expiryDate || '',
        notes: `Theo định mức BOM #${q.id}`,
      });

      if (mat?.defaultPhiDays && mat.defaultPhiDays > maxPhi) {
        maxPhi = mat.defaultPhiDays;
      }
    }

    setLogForm((prev) => ({
      ...prev,
      phiDays: maxPhi,
      supplies: newSupplies,
    }));

    toast.success(`Đã tự động áp dụng ${newSupplies.length} loại vật tư theo định mức BOM!`);
  };

  // Ghi nhận nhật ký canh tác (Crop) & Kích hoạt Auto-backflushing
  const handleCreateCropLog = async (e) => {
    e.preventDefault();

    // Kiểm tra tính hợp lệ của từng dòng vật tư xuất kho
    for (const [idx, s] of logForm.supplies.entries()) {
      if (!s.warehouseId) {
        toast.warning(`Dòng ${idx + 1}: Vui lòng chọn kho xuất vật tư!`);
        return;
      }
      if (!s.materialId) {
        toast.warning(`Dòng ${idx + 1}: Vui lòng chọn loại phân bón / thuốc BVTV!`);
        return;
      }
      if (!s.batchNumber) {
        toast.warning(`Dòng ${idx + 1}: Vui lòng chọn số lô xuất kho!`);
        return;
      }
      const qtyNum = Number(s.actualQuantity);
      if (!qtyNum || qtyNum <= 0) {
        toast.warning(`Dòng ${idx + 1}: Số lượng thực xuất phải lớn hơn 0!`);
        return;
      }
      if (qtyNum > Number(s.availableQuantity || 0)) {
        toast.error(
          `Dòng ${idx + 1}: Số lượng xuất (${qtyNum}) vượt quá tồn khả dụng (${s.availableQuantity}) của lô ${s.batchNumber}!`
        );
        return;
      }
      if (s.suggestedQuantity > 0 && qtyNum > s.suggestedQuantity * 1.1 && !s.varianceReason?.trim()) {
        toast.warning(
          `Dòng ${idx + 1}: Lượng dùng (${qtyNum}) vượt định mức BOM (${s.suggestedQuantity}). Vui lòng nhập lý do chênh lệch!`
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        seasonId: item.id,
        activityType: logForm.activityType,
        logDate: logForm.logDate,
        stage: logForm.stage,
        phiDays: Number(logForm.phiDays || 0),
        weatherNotes: logForm.weatherNotes,
        supplies: logForm.supplies.map((s) => ({
          warehouseId: Number(s.warehouseId),
          materialId: Number(s.materialId),
          batchNumber: s.batchNumber,
          actualQuantity: Number(s.actualQuantity),
          suggestedQuantity: Number(s.suggestedQuantity || 0),
          quotaId: s.quotaId ? Number(s.quotaId) : null,
          varianceReason: s.varianceReason?.trim() || null,
          unit: s.unit || undefined,
          notes: s.varianceReason?.trim() || s.notes || null,
        })),
      };

      await farmingService.createFarmingLog(farmId, payload);
      toast.success('Đã ghi nhận nhật ký canh tác & xuất kho tự động (Auto-Backflushing) thành công!');
      setIsAddLogOpen(false);
      fetchLogs();
      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('inventory');
      store.notifyDataChanged?.('expenses');
      store.notifyDataChanged?.('seasons');
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi ghi nhật ký canh tác:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi ghi nhật ký canh tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ghi nhận sự kiện thú y & Kích hoạt Auto-backflushing (Livestock)
  const handleCreateLivestockEvent = async (e) => {
    e.preventDefault();

    if (eventForm.targetType === 'INDIVIDUAL' && !eventForm.individualId) {
      toast.warning('Vui lòng chọn một cá thể RFID để ghi nhận sự kiện thú y!');
      return;
    }

    // Kiểm tra tính hợp lệ của từng dòng thuốc xuất kho
    for (const [idx, s] of eventForm.supplies.entries()) {
      if (!s.warehouseId || !s.materialId || !s.batchNumber) {
        toast.warning(`Dòng thuốc #${idx + 1}: Vui lòng chọn đầy đủ Kho xuất, Loại thuốc và Số lô!`);
        return;
      }
      if (!s.actualQuantity || Number(s.actualQuantity) <= 0) {
        toast.warning(`Dòng thuốc #${idx + 1}: Số lượng xuất dùng phải lớn hơn 0!`);
        return;
      }
      if (s.availableQuantity && Number(s.actualQuantity) > Number(s.availableQuantity)) {
        toast.error(
          `Dòng thuốc #${idx + 1}: Số lượng xuất (${s.actualQuantity}) vượt quá tồn khả dụng (${s.availableQuantity}) trong lô ${s.batchNumber}!`
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const isIndiv = eventForm.targetType === 'INDIVIDUAL';

      const cleanedSupplies = eventForm.supplies.map((s) => ({
        warehouseId: Number(s.warehouseId),
        materialId: Number(s.materialId),
        batchNumber: s.batchNumber,
        actualQuantity: Number(s.actualQuantity),
        quantity: Number(s.actualQuantity),
        unit: s.unit || 'Liều',
        notes: s.notes || '',
      }));

      const payload = {
        targetType: eventForm.targetType,
        groupId: isIndiv ? null : item.id,
        livestockGroupId: isIndiv ? null : item.id,
        individualId: isIndiv ? Number(eventForm.individualId) : null,
        livestockIndividualId: isIndiv ? Number(eventForm.individualId) : null,
        eventType: eventForm.eventType,
        eventDate: eventForm.eventDate,
        headCountAffected: Number(
          eventForm.headCountAffected || (isIndiv ? 1 : (item?.currentQuantity || 1))
        ),
        withdrawalDays: Number(eventForm.withdrawalDays || 0),
        withdrawalEndDate: eventForm.withdrawalEndDate || null,
        totalCost: eventForm.totalCost ? Number(eventForm.totalCost) : null,
        detailsJson: eventForm.detailsJson || '',
        supplies: cleanedSupplies,
      };

      await farmingService.createLivestockEvent(farmId, payload);

      toast.success(
        cleanedSupplies.length > 0
          ? `Đã ghi nhận sự kiện thú y & tự động trừ kho ${cleanedSupplies.length} loại thuốc (Auto-Backflushing)!`
          : 'Đã ghi nhận sự kiện thú y thành công!'
      );

      // Đồng bộ liên Workspace tức thời (WS-E, WS-C, WS-H1)
      if (notifyDataChanged) {
        notifyDataChanged('all');
        notifyDataChanged('inventory');
        notifyDataChanged('expenses');
        notifyDataChanged('groups');
      }

      setIsAddEventOpen(false);
      fetchLogs();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi ghi sự kiện thú y:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi ghi sự kiện thú y');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header thanh công cụ */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span>Lịch Sử Nhật Ký Hiện Trường & Trừ Kho Auto-Backflushing ({logs.length})</span>
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Tự động xuất kho theo chuẩn FEFO & hạch toán giá thành chăn nuôi / trồng trọt
          </span>
        </div>

        <div>
          {sector === 'CROP' ? (
            <Can permission="PERM_CROP_LOG" role={['ROLE_FIELD_STAFF', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF']}>
              <Button
                size="sm"
                variant="primary"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setIsAddLogOpen(true)}
              >
                + Ghi Nhật Ký Canh Tác & Xuất Vật Tư
              </Button>
            </Can>
          ) : (
            <Can permission="PERM_LIVESTOCK_VET" role={['ROLE_TECHNICAL_STAFF', 'ROLE_FARM_MANAGER', 'ROLE_ENTERPRISE_ADMIN']}>
              <Button
                size="sm"
                variant="primary"
                icon={<Syringe className="h-3.5 w-3.5" />}
                onClick={() => setIsAddEventOpen(true)}
              >
                + Ghi Sự Kiện Thú Y & Kê Đơn Thuốc
              </Button>
            </Can>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Đang tải nhật ký hiện trường...</div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <h5 className="font-bold text-slate-800 text-xs">Chưa có nhật ký ghi nhận</h5>
          <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
            {sector === 'CROP'
              ? 'Nhân viên hiện trường (ROLE_FIELD_STAFF) hoặc Quản lý sẽ ghi nhận hoạt động bón phân, phun thuốc tại đây.'
              : 'Bác sĩ thú y / Kỹ thuật (ROLE_TECHNICAL_STAFF) sẽ ghi nhận phác đồ tiêm phòng, kiểm tra dịch bệnh và tự động xuất kho thuốc tại đây.'}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {logs.map((log) => {
            const dateStr = log.logDate || log.eventDate;
            const title = log.activityType || log.eventType || 'Hoạt động hiện trường';
            const notes = log.notes || log.description || log.detailsJson;
            const items = log.supplies || log.materials || log.materialConsumptions || [];

            // Kiểm tra trạng thái cách ly ngưng thuốc (Withdrawal)
            const isWithdrawalActive =
              log.withdrawalEndDate && new Date(log.withdrawalEndDate) >= new Date();

            return (
              <div key={log.id} className="relative group">
                <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-600 shadow-xs group-hover:scale-125 transition-transform" />

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5 hover:border-slate-300 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">{title}</span>
                      {log.stage && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          {log.stage}
                        </span>
                      )}
                      {log.targetType && (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          {log.targetType === 'INDIVIDUAL' ? 'Cá thể RFID' : 'Cả đàn'}
                        </span>
                      )}
                      {log.headCountAffected > 0 && (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                          {log.headCountAffected} con tác động
                        </span>
                      )}
                      {isWithdrawalActive && (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <ShieldAlert className="h-3 w-3 text-rose-600" />
                          <span>Cách ly ngưng thuốc đến {formatDate(log.withdrawalEndDate)}</span>
                        </span>
                      )}
                      {log.phiDays > 0 && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3 text-amber-600" />
                          <span>Cách ly PHI: {log.phiDays} ngày {log.phiEndDate ? `(đến ${formatDate(log.phiEndDate)})` : ''}</span>
                        </span>
                      )}
                      {log.totalCost > 0 && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>Dịch vụ: {formatNumber(log.totalCost)} đ</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(dateStr)}</span>
                    </span>
                  </div>

                  {notes && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {notes}
                    </p>
                  )}

                  {items.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Package className="h-3 w-3 text-amber-600" />
                        <span>Vật tư / Thuốc trừ kho tự động (Auto-Backflushing):</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {items.map((mat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg text-xs border border-amber-200 font-medium flex-wrap"
                          >
                            <Pill className="h-3 w-3 text-amber-700" />
                            <span>{mat.materialName || `Vật tư #${mat.materialId}`}</span>
                            <strong className="font-mono text-amber-950">
                              {formatNumber(mat.actualQuantity ?? mat.quantity)} {mat.unit || ''}
                            </strong>
                            {mat.batchNumber && (
                              <span className="text-[10px] font-mono text-amber-800 bg-white px-1.5 py-0.2 rounded border border-amber-300">
                                Lô {mat.batchNumber}
                              </span>
                            )}
                            {mat.totalPrice > 0 && (
                              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {formatNumber(mat.totalPrice)} đ
                              </span>
                            )}
                            {mat.varianceReason && (
                              <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-normal">
                                Lý do vượt: {mat.varianceReason}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ghi Nhật Ký Canh Tác (Crop) */}
      <Modal
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        title="Ghi Nhật Ký Canh Tác Hiện Trường & Xuất Vật Tư Tự Động"
        subtitle="Hệ thống tự động kiểm tra tồn kho FEFO, trừ kho (WS-C), hạch toán chi phí (WS-H1) và khóa cách ly thu hoạch PHI"
        size="xl"
      >
        <form onSubmit={handleCreateCropLog} className="space-y-4 text-xs">
          <FormField label="Loại Hoạt Động Canh Tác" required>
            <Select
              value={logForm.activityType}
              onChange={(e) => setLogForm({ ...logForm, activityType: e.target.value })}
            >
              <option value="FERTILIZATION">Bón phân / Dinh dưỡng</option>
              <option value="PESTICIDE_APPLICATION">Phun thuốc BVTV (Cần cách ly PHI)</option>
              <option value="IRRIGATION">Tưới tiêu / Cấp ẩm</option>
              <option value="SOIL_TILLAGE">Làm đất / Chuẩn bị luống</option>
              <option value="PRUNING">Cắt tỉa nhánh / Chồi</option>
              <option value="WEEDING">Làm cỏ / Dọn luống</option>
              <option value="HARVESTING">Thu hoạch nông sản</option>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày Thực Hiện" required>
              <Input
                type="date"
                value={logForm.logDate}
                onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
              />
            </FormField>

            <FormField label="Giai Đoạn Sinh Trưởng">
              <Input
                value={logForm.stage}
                placeholder="VD: Cây con, Ra hoa, Nuôi trái"
                onChange={(e) => setLogForm({ ...logForm, stage: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Số Ngày Cách Ly PHI (Pre-Harvest Interval)" hint="Thời gian cách ly an toàn trước khi được phép thu hoạch">
            <Input
              type="number"
              min="0"
              value={logForm.phiDays}
              onChange={(e) => setLogForm({ ...logForm, phiDays: e.target.value })}
              placeholder="0"
            />
          </FormField>

          {/* Cảnh báo cách ly PHI */}
          {Number(logForm.phiDays) > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold animate-pulse">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span>⚠️ CẢNH BÁO AN TOÀN SINH HỌC & CÁCH LY THUỐC BVTV (PHI): </span>
                <span className="font-bold underline">
                  Vụ mùa sẽ tự động khóa thu hoạch đến hết ngày {formatDate(
                    new Date(new Date(logForm.logDate).getTime() + Number(logForm.phiDays) * 86400000).toISOString().split('T')[0]
                  )} ({logForm.phiDays} ngày)
                </span>
                <span className="block text-[11px] font-normal text-amber-700 mt-0.5">
                  (Căn cứ thời gian cách ly nông dược theo tiêu chuẩn VietGAP / GlobalGAP để ngăn chặn tồn dư thuốc)
                </span>
              </div>
            </div>
          )}

          <FormField label="Ghi Chú Thời Tiết & Diễn Biến Cây Trồng">
            <Input
              value={logForm.weatherNotes}
              placeholder="VD: Trời nắng ráo, độ ẩm đất 70%..."
              onChange={(e) => setLogForm({ ...logForm, weatherNotes: e.target.value })}
            />
          </FormField>

          {/* BẢNG VẬT TƯ / PHÂN BÓN / THUỐC BVTV XUẤT KHO TỰ ĐỘNG (AUTO-BACKFLUSHING) */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <span>Vật Tư / Phân Bón / Thuốc BVTV Xuất Kho Tự Động (Auto-Backflushing)</span>
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Tự động ưu tiên xuất lô cận hạn nhất (FEFO) & sinh phiếu xuất kho sang WS-C, hạch toán chi phí sang WS-H1
                </span>
              </div>

              <div className="flex items-center gap-2">
                {cropQuotas.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                    onClick={handleApplyCropBOMQuota}
                    className="text-amber-800 bg-amber-50/60 border-amber-300 hover:bg-amber-100"
                  >
                    ✨ Áp Dụng Gợi Ý Định Mức BOM
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={handleAddCropSupplyRow}
                  disabled={isLoadingSupplies}
                >
                  + Thêm Vật Tư Xuất Kho
                </Button>
              </div>
            </div>

            {logForm.supplies.length === 0 ? (
              <div className="text-center py-4 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
                Chưa chọn loại vật tư nào. Nhấn <strong>[+ Thêm Vật Tư Xuất Kho]</strong> hoặc <strong>[✨ Áp Dụng Gợi Ý Định Mức BOM]</strong> nếu hoạt động này có sử dụng phân bón, thuốc BVTV từ kho.
              </div>
            ) : (
              <div className="space-y-3">
                {logForm.supplies.map((row, index) => {
                  const availableMaterialsInWh = materials.filter((m) =>
                    inventoryBatches.some(
                      (b) =>
                        String(b.warehouseId) === String(row.warehouseId) &&
                        String(b.materialId) === String(m.id)
                    )
                  );

                  const batchesForMat = inventoryBatches
                    .filter(
                      (b) =>
                        String(b.warehouseId) === String(row.warehouseId) &&
                        String(b.materialId) === String(row.materialId)
                    )
                    .sort((a, b) => new Date(a.expiryDate || '9999-12-31') - new Date(b.expiryDate || '9999-12-31'));

                  const isOverQuota =
                    row.suggestedQuantity > 0 &&
                    Number(row.actualQuantity || 0) > row.suggestedQuantity * 1.1;

                  return (
                    <div
                      key={index}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <span>Dòng vật tư #{index + 1}</span>
                          {row.suggestedQuantity > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Định mức BOM: {formatNumber(row.suggestedQuantity, 2)} {row.unit}
                            </span>
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveCropSupplyRow(index)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        {/* 1. Kho xuất */}
                        <FormField label="Kho Xuất *" required>
                          <Select
                            value={row.warehouseId}
                            onChange={(e) => handleCropSupplyChange(index, 'warehouseId', e.target.value)}
                            required
                          >
                            <option value="">-- Chọn kho --</option>
                            {warehouses.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({w.code})
                              </option>
                            ))}
                          </Select>
                        </FormField>

                        {/* 2. Loại vật tư */}
                        <FormField label="Phân Bón / Thuốc BVTV *" required>
                          <Select
                            value={row.materialId}
                            onChange={(e) => handleCropSupplyChange(index, 'materialId', e.target.value)}
                            disabled={!row.warehouseId}
                            required
                          >
                            <option value="">
                              {!row.warehouseId
                                ? '-- Chọn kho trước --'
                                : availableMaterialsInWh.length === 0
                                ? '-- Kho chưa có tồn khả dụng --'
                                : `-- Chọn vật tư (${availableMaterialsInWh.length}) --`}
                            </option>
                            {availableMaterialsInWh.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.skuCode}) {m.defaultPhiDays ? `[Cách ly: ${m.defaultPhiDays}d]` : ''}
                              </option>
                            ))}
                          </Select>
                        </FormField>

                        {/* 3. Lô xuất (FEFO) */}
                        <FormField label="Số Lô Xuất (FEFO) *" required>
                          <Select
                            value={row.batchNumber}
                            onChange={(e) => handleCropSupplyChange(index, 'batchNumber', e.target.value)}
                            disabled={!row.materialId}
                            required
                          >
                            <option value="">-- Chọn lô --</option>
                            {batchesForMat.map((b) => (
                              <option key={b.batchNumber} value={b.batchNumber}>
                                Lô: {b.batchNumber} (Tồn: {formatNumber(b.availableQuantity ?? (b.quantityOnHand - (b.reservedQuantity || 0)))} | HSD: {b.expiryDate ? formatDate(b.expiryDate) : 'N/A'})
                              </option>
                            ))}
                          </Select>
                        </FormField>

                        {/* 4. Số lượng thực xuất */}
                        <FormField
                          label={`Số Lượng Thực Xuất (${row.unit || 'Kg'}) *`}
                          hint={row.availableQuantity > 0 ? `Khả dụng: ${formatNumber(row.availableQuantity)} ${row.unit || ''}` : ''}
                          required
                        >
                          <Input
                            type="number"
                            step="any"
                            min="0.01"
                            max={row.availableQuantity || undefined}
                            value={row.actualQuantity}
                            onChange={(e) => handleCropSupplyChange(index, 'actualQuantity', e.target.value)}
                            placeholder="Nhập số lượng"
                            required
                          />
                        </FormField>
                      </div>

                      {/* Cảnh báo vượt định mức BOM & nhập lý do */}
                      {isOverQuota && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5 animate-fadeIn">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>
                              Cảnh báo: Lượng sử dụng ({row.actualQuantity} {row.unit}) vượt định mức kỹ thuật BOM ({row.suggestedQuantity} {row.unit}) trên 10%!
                            </span>
                          </div>
                          <Input
                            value={row.varianceReason}
                            onChange={(e) => handleCropSupplyChange(index, 'varianceReason', e.target.value)}
                            placeholder="Nhập lý do chênh lệch vượt định mức (VD: Sâu bệnh bùng phát mạnh cần tăng liều)... *"
                            className="bg-white border-rose-300 text-xs"
                            required
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsAddLogOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu & Trừ kho...' : 'Lưu Nhật Ký & Kích Hoạt Auto-Backflushing'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Sự Kiện Thú Y & Kê Đơn Thuốc Auto-Backflushing (Livestock) */}
      <Modal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        title="Ghi Nhận Sự Kiện Thú Y & Xuất Kho Thuốc / Vắc-xin"
        subtitle="Hệ thống tự động kích hoạt Auto-backflushing trừ kho (FEFO) và tính giá thành chăn nuôi"
        size="xl"
      >
        <form onSubmit={handleCreateLivestockEvent} className="space-y-4 text-xs">
          {/* Đối tượng áp dụng (Cả Đàn vs Cá thể RFID) */}
          <FormField label="Đối Tượng Áp Dụng *" required>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  eventForm.targetType === 'GROUP'
                    ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="eventTargetType"
                  value="GROUP"
                  checked={eventForm.targetType === 'GROUP'}
                  onChange={() =>
                    setEventForm({
                      ...eventForm,
                      targetType: 'GROUP',
                      individualId: '',
                      headCountAffected: item?.currentQuantity || item?.headCount || 1,
                    })
                  }
                  className="accent-emerald-600"
                />
                <span>Cả Đàn Nuôi (GROUP)</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  eventForm.targetType === 'INDIVIDUAL'
                    ? 'bg-purple-50 border-purple-300 font-bold text-purple-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="eventTargetType"
                  value="INDIVIDUAL"
                  checked={eventForm.targetType === 'INDIVIDUAL'}
                  onChange={() =>
                    setEventForm({
                      ...eventForm,
                      targetType: 'INDIVIDUAL',
                      headCountAffected: 1,
                    })
                  }
                  className="accent-purple-600"
                />
                <span>Cá Thể Thẻ Tai RFID (INDIVIDUAL)</span>
              </label>
            </div>
          </FormField>

          {/* Chọn cá thể RFID nếu chọn INDIVIDUAL */}
          {eventForm.targetType === 'INDIVIDUAL' && (
            <FormField label="Chọn Cá Thể Đeo Thẻ RFID *" hint="Danh sách cá thể thuộc đàn này" required>
              <Select
                value={eventForm.individualId}
                onChange={(e) => setEventForm({ ...eventForm, individualId: e.target.value })}
                required
              >
                <option value="">-- Chọn cá thể RFID ({groupIndividuals.length} con) --</option>
                {groupIndividuals.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.rfidTagCode} - {ind.gender === 'MALE' ? 'Đực ♂' : ind.gender === 'FEMALE' ? 'Cái ♀' : 'Đã thiến ⚲'} (Sức khỏe: {ind.healthStatus})
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {/* Loại sự kiện & Số cá thể tác động */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Loại Sự Kiện Thú Y *" required>
              <Select
                value={eventForm.eventType}
                onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                required
              >
                <option value="VACCINATION">💉 Tiêm phòng vắc-xin định kỳ</option>
                <option value="DISEASE_TREATMENT">💊 Điều trị bệnh / Kháng sinh</option>
                <option value="BIRTH">🐣 Sinh sản / Đẻ con tăng đàn</option>
                <option value="MORTALITY">💀 Chết / Hao hụt dịch bệnh</option>
                <option value="CULLING">⚡ Loại thải / Tách đàn kém phát triển</option>
                <option value="SOLD">🚚 Xuất bán thương phẩm</option>
                <option value="WEIGHT_CHECK">⚖️ Kiểm tra thể trọng định kỳ</option>
                <option value="BREEDING">🧬 Phối giống / Thụ tinh nhân tạo</option>
              </Select>
            </FormField>

            <FormField
              label="Số Lượng Cá Thể Tác Động (Con) *"
              hint={eventForm.targetType === 'INDIVIDUAL' ? 'Cố định 1 con' : `Tổng đàn hiện tại: ${item?.currentQuantity || item?.headCount || 1} con`}
              required
            >
              <Input
                type="number"
                min="1"
                value={eventForm.headCountAffected}
                onChange={(e) => setEventForm({ ...eventForm, headCountAffected: e.target.value })}
                disabled={eventForm.targetType === 'INDIVIDUAL'}
                required
              />
            </FormField>
          </div>

          {/* Ngày diễn ra, Ngày cách ly ngưng thuốc (Withdrawal) & Chi phí ngoài */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Ngày Diễn Ra *" required>
              <Input
                type="date"
                value={eventForm.eventDate}
                onChange={(e) => handleEventDateChange(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Số Ngày Ngưng Thuốc (Withdrawal)" hint="Số ngày cách ly trước khi giết mổ">
              <Input
                type="number"
                min="0"
                value={eventForm.withdrawalDays}
                onChange={(e) => handleWithdrawalDaysChange(e.target.value)}
                placeholder="0"
              />
            </FormField>

            <FormField label="Ngày Kết Thúc Cách Ly" hint="Tự động tính hoặc chọn trực tiếp">
              <Input
                type="date"
                value={eventForm.withdrawalEndDate}
                onChange={(e) => handleWithdrawalEndDateChange(e.target.value)}
              />
            </FormField>
          </div>

          {/* Badge Cảnh Báo Ngưng Thuốc (Withdrawal Period Badge) */}
          {eventForm.withdrawalEndDate && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold animate-pulse">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span>⛔ KHÓA XUẤT BÁN / GIẾT MỔ: </span>
                <span className="font-bold underline">
                  Đàn nuôi bị hạn chế xuất bán đến hết ngày {formatDate(eventForm.withdrawalEndDate)}
                </span>
                <span className="block text-[11px] font-normal text-amber-700 mt-0.5">
                  (Căn cứ thời gian ngưng sử dụng kháng sinh/vắc-xin để đảm bảo an toàn sinh học và tồn dư thuốc)
                </span>
              </div>
            </div>
          )}

          {/* Chi phí dịch vụ thuê ngoài & Phác đồ điều trị */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Chi Phí Dịch Vụ Thú Y Thuê Ngoài (VNĐ)" hint="Khám/tiêm thuê ngoài (ngoài tiền thuốc xuất kho)">
              <Input
                type="number"
                min="0"
                value={eventForm.totalCost}
                onChange={(e) => setEventForm({ ...eventForm, totalCost: e.target.value })}
                placeholder="0 (nếu tự làm)"
              />
            </FormField>

            <FormField label="Chi Tiết Phác Đồ / Ghi Chú Thú Y">
              <Input
                value={eventForm.detailsJson}
                placeholder="VD: Tiêm vắc-xin Dịch tả liều 2ml/con, sát trùng chuồng..."
                onChange={(e) => setEventForm({ ...eventForm, detailsJson: e.target.value })}
              />
            </FormField>
          </div>

          {/* BẢNG KÊ ĐƠN THUỐC / VẮC-XIN XUẤT KHO TỰ ĐỘNG (AUTO-BACKFLUSHING) */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Pill className="h-4 w-4 text-emerald-600" />
                  <span>Kê Đơn Thuốc / Vắc-xin Xuất Kho Tự Động (Auto-Backflushing)</span>
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Ưu tiên xuất theo hạn dùng gần nhất (FEFO) & tự động tạo phiếu xuất kho liên thông sang WS-C
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={handleAddSupplyRow}
                disabled={isLoadingSupplies}
              >
                + Thêm Thuốc / Vắc-xin Xuất Kho
              </Button>
            </div>

            {eventForm.supplies.length === 0 ? (
              <div className="text-center py-4 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
                Chưa chọn loại thuốc/vắc-xin nào. Nhấn <strong>[+ Thêm Thuốc / Vắc-xin Xuất Kho]</strong> nếu sự kiện này có tiêu hao vật tư từ kho.
              </div>
            ) : (
              <div className="space-y-2.5">
                {eventForm.supplies.map((row, index) => {
                  // Lọc vật tư có tồn khả dụng trong kho đã chọn
                  const availableMaterialsInWh = materials.filter((m) =>
                    inventoryBatches.some(
                      (b) =>
                        String(b.warehouseId) === String(row.warehouseId) &&
                        String(b.materialId) === String(m.id)
                    )
                  );

                  // Lọc danh sách lô khả dụng cho vật tư này, sắp xếp FEFO (hạn dùng gần nhất)
                  const availableBatches = inventoryBatches
                    .filter(
                      (b) =>
                        String(b.warehouseId) === String(row.warehouseId) &&
                        String(b.materialId) === String(row.materialId)
                    )
                    .sort((a, b) => new Date(a.expiryDate || '9999-12-31') - new Date(b.expiryDate || '9999-12-31'));

                  const isExceeded =
                    row.actualQuantity &&
                    row.availableQuantity > 0 &&
                    Number(row.actualQuantity) > Number(row.availableQuantity);

                  return (
                    <div
                      key={index}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="font-bold text-slate-700">Dòng thuốc #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSupplyRow(index)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        {/* 1. Chọn Kho xuất */}
                        <FormField label="Kho xuất *" required>
                          <Select
                            value={row.warehouseId}
                            onChange={(e) => handleSupplyChange(index, 'warehouseId', e.target.value)}
                            required
                          >
                            <option value="">-- Chọn kho xuất --</option>
                            {warehouses.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({w.code})
                              </option>
                            ))}
                          </Select>
                        </FormField>

                        {/* 2. Chọn Thuốc / Vắc-xin */}
                        <FormField label="Thuốc / Vắc-xin *" required>
                          <Select
                            value={row.materialId}
                            onChange={(e) => handleSupplyChange(index, 'materialId', e.target.value)}
                            disabled={!row.warehouseId}
                            required
                          >
                            <option value="">-- Chọn thuốc có tồn kho --</option>
                            {availableMaterialsInWh.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.skuCode})
                              </option>
                            ))}
                          </Select>
                        </FormField>

                        {/* 3. Chọn Lô thuốc (FEFO) */}
                        <FormField
                          label="Lô thuốc (FEFO) *"
                          hint={
                            row.expiryDate
                              ? `Hạn dùng: ${formatDate(row.expiryDate)} (Khả dụng: ${row.availableQuantity} ${row.unit || ''})`
                              : 'Ưu tiên lô cận hạn'
                          }
                          required
                        >
                          <Select
                            value={row.batchNumber}
                            onChange={(e) => handleSupplyChange(index, 'batchNumber', e.target.value)}
                            disabled={!row.materialId}
                            required
                          >
                            <option value="">-- Chọn số lô --</option>
                            {availableBatches.map((b) => (
                              <option key={b.batchNumber} value={b.batchNumber}>
                                Lô: {b.batchNumber} [Tồn: {b.availableQuantity} {b.standardUnit}] (HSD: {formatDate(b.expiryDate)})
                              </option>
                            ))}
                          </Select>
                        </FormField>

                        {/* 4. Số lượng thực dùng & Đơn vị */}
                        <FormField
                          label="Số lượng xuất *"
                          error={isExceeded ? `Vượt quá tồn khả dụng (${row.availableQuantity})` : null}
                          required
                        >
                          <div className="flex gap-1.5">
                            <Input
                              type="number"
                              step="any"
                              min="0.01"
                              value={row.actualQuantity}
                              onChange={(e) => handleSupplyChange(index, 'actualQuantity', e.target.value)}
                              placeholder={`Tối đa ${row.availableQuantity || 0}`}
                              className={isExceeded ? 'border-rose-500 bg-rose-50' : ''}
                              required
                            />
                            <div className="w-20 shrink-0">
                              <Input
                                value={row.unit}
                                onChange={(e) => handleSupplyChange(index, 'unit', e.target.value)}
                                placeholder="Liều"
                              />
                            </div>
                          </div>
                        </FormField>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsAddEventOpen(false)} disabled={isSubmitting}>
              Hủy Bỏ
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang kích hoạt Auto-backflushing...' : 'Lưu Sự Kiện Thú Y & Trừ Kho'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default FarmingLogsTimelineTab;
