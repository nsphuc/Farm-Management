import React, { useState, useEffect, useMemo } from 'react';
import {
  BadgeDollarSign,
  Plus,
  RefreshCw,
  QrCode,
  Scale,
  FileText,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { financeService } from '@/services/modules/financeService';
import { barnBatchService } from '@/services/modules/barnBatchService';
import { partnerService } from '@/services/modules/partnerService';
import { settingsService } from '@/services/modules/settingsService';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

export function SalesPage() {
  const { farms, activeFarmId } = useActiveFarmStore();
  const { currentBranchId, dataVersion, triggerRefresh } = useActiveBranchStore();
  const { hasPermission, isOwner } = useAuthStore();
  const currentFarmId = activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : (farms[0]?.id || 1);
  const effectiveBranchId = currentBranchId && currentBranchId !== 'ALL' ? Number(currentBranchId) : undefined;

  const canViewPrice = isOwner() || hasPermission('sales.price') || hasPermission('financial.price.view');
  const canCreate = isOwner() || hasPermission('sales.create') || hasPermission('sales.manage');

  const [salesOrders, setSalesOrders] = useState([]);
  const [activeBarns, setActiveBarns] = useState([]);
  const [partners, setPartners] = useState([]);
  const [bankConfig, setBankConfig] = useState({
    bankBin: '970436',
    bankName: 'Vietcombank',
    bankAccountNo: '1026790945',
    bankAccountName: 'TRAI CHAN NUOI',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Modal Xuất bán trực tiếp
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Xem mã VietQR thanh toán
  const [selectedOrderForQr, setSelectedOrderForQr] = useState(null);

  const [form, setForm] = useState({
    orderCode: '',
    saleDate: new Date().toISOString().split('T')[0],
    livestockGroupId: '',
    partnerId: '',
    traderName: '',
    traderPhone: '',
    vehiclePlate: '',
    unitPricePerKg: 55000,
    paymentMethod: 'VIETQR',
    paidAmount: 0,
    isFinalHarvest: false,
    notes: '',
    scaleRows: [{ id: 1, heads: 0, grossKg: 0, tareKg: 0 }],
  });

  const loadData = async () => {
    if (!currentFarmId) return;
    try {
      setIsLoading(true);
      const [ordersRes, barnsRes, partnersRes, finRes] = await Promise.allSettled([
        financeService.getFarmSales(currentFarmId, { branchId: effectiveBranchId, size: 50 }),
        barnBatchService.getBarns({ farmId: currentFarmId, branchId: effectiveBranchId }),
        partnerService.getPartners({ type: 'CUSTOMER', size: 100 }),
        settingsService.getFinancialSettings(currentFarmId),
      ]);

      if (ordersRes.status === 'fulfilled') {
        const list = ordersRes.value?.content || (Array.isArray(ordersRes.value) ? ordersRes.value : []);
        setSalesOrders(list);
      }
      if (barnsRes.status === 'fulfilled') {
        const list = Array.isArray(barnsRes.value) ? barnsRes.value : (barnsRes.value?.content || []);
        const occupied = list
          .filter((b) => (!effectiveBranchId || !b.branchId || Number(b.branchId) === effectiveBranchId))
          .filter((b) => b.currentBatch && Number(b.currentBatch.currentQuantity || 0) > 0);
        setActiveBarns(occupied);
      }
      if (partnersRes.status === 'fulfilled') {
        const list = partnersRes.value?.content || (Array.isArray(partnersRes.value) ? partnersRes.value : []);
        setPartners(list);
      }
      if (finRes.status === 'fulfilled' && finRes.value) {
        const fin = finRes.value;
        const resolveBankBin = (name, explicitBin) => {
          const n = String(name || '').toLowerCase();
          if (n.includes('mb') || n.includes('quân đội') || n.includes('quan doi')) return '970422';
          if (n.includes('bidv')) return '970418';
          if (n.includes('vietin') || n.includes('ctg')) return '970415';
          if (n.includes('agri')) return '970405';
          if (n.includes('techcom') || n.includes('tcb')) return '970407';
          if (n.includes('acb')) return '970416';
          if (n.includes('vpbank') || n.includes('vpb')) return '970432';
          if (n.includes('sacom') || n.includes('stb')) return '970403';
          if (n.includes('tpbank') || n.includes('tpb')) return '970423';
          if (n.includes('vib')) return '970441';
          if (n.includes('shb')) return '970443';
          if (n.includes('hdbank') || n.includes('hdb')) return '970437';
          if (n.includes('msb')) return '970426';
          if (n.includes('ocb')) return '970448';
          if (n.includes('vietcombank') || n.includes('vcb')) return '970436';
          if (explicitBin && String(explicitBin).trim().length >= 6) return String(explicitBin).trim();
          return '970436'; // Vietcombank mặc định
        };
        setBankConfig({
          bankBin: resolveBankBin(fin.bankName, fin.bankBin),
          bankName: fin.bankName || 'Vietcombank',
          bankAccountNo: fin.bankAccountNo || '1026790945',
          bankAccountName: fin.bankAccountName || fin.bankAccountHolder || 'TRAI CHAN NUOI',
        });
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu bán hàng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFarmId, effectiveBranchId, dataVersion]);

  // Tổng hợp từ bảng nhiều mã cân trừ bì
  const scaleTotals = useMemo(() => {
    let totalHeads = 0;
    let totalGross = 0;
    let totalTare = 0;
    let totalNet = 0;

    (form.scaleRows || []).forEach((row) => {
      const h = Number(row.heads) || 0;
      const g = Number(row.grossKg) || 0;
      const t = Number(row.tareKg) || 0;
      const n = Math.max(0, g - t);
      totalHeads += h;
      totalGross += g;
      totalTare += t;
      totalNet += n;
    });

    const price = Number(form.unitPricePerKg) || 0;
    const totalAmount = Math.round(totalNet * price);
    const avgWeightPerHead = totalHeads > 0 ? (totalNet / totalHeads).toFixed(2) : '0';
    const paid = Number(form.paidAmount) || 0;
    const remainingDebt = Math.max(0, totalAmount - paid);

    return { totalHeads, totalGross, totalTare, totalNet, totalAmount, avgWeightPerHead, remainingDebt };
  }, [form.scaleRows, form.unitPricePerKg, form.paidAmount]);

  const selectedBarn = useMemo(
    () => activeBarns.find((b) => String(b.currentBatch?.id) === String(form.livestockGroupId)) || null,
    [activeBarns, form.livestockGroupId]
  );

  const getVietQrUrl = (amount, desc) => {
    const cleanDesc = encodeURIComponent(desc || 'THANH TOAN XUAT CHUONG');
    const cleanName = encodeURIComponent((bankConfig.bankAccountName || 'TRAI CHAN NUOI').toUpperCase());
    return `https://img.vietqr.io/image/${bankConfig.bankBin}-${bankConfig.bankAccountNo}-compact2.png?amount=${Math.round(amount || 0)}&addInfo=${cleanDesc}&accountName=${cleanName}`;
  };

  const handleOpenModal = () => {
    if (currentBranchId === 'ALL') {
      toast.warning('Vui lòng chọn một chi nhánh cụ thể trên Header trước khi lập phiếu xuất bán!');
      return;
    }
    const firstBarn = activeBarns[0];
    const firstPartner = partners[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const code = `XBAN-${todayStr.replace(/-/g, '').slice(2)}-${String(Date.now()).slice(-4)}`;

    setForm({
      orderCode: code,
      saleDate: todayStr,
      livestockGroupId: firstBarn?.currentBatch?.id ? String(firstBarn.currentBatch.id) : '',
      partnerId: firstPartner?.id ? String(firstPartner.id) : '',
      traderName: firstPartner?.name || '',
      traderPhone: firstPartner?.phone || '',
      vehiclePlate: '',
      unitPricePerKg: 55000,
      paymentMethod: 'VIETQR',
      paidAmount: 0,
      isFinalHarvest: false,
      notes: '',
      scaleRows: [{ id: Date.now(), heads: firstBarn?.currentBatch?.currentQuantity || 0, grossKg: 0, tareKg: 0 }],
    });
    setIsModalOpen(true);
  };

  const handleAddScaleRow = () => {
    setForm((prev) => ({
      ...prev,
      scaleRows: [...prev.scaleRows, { id: Date.now() + Math.random(), heads: 0, grossKg: 0, tareKg: 0 }],
    }));
  };

  const handleRemoveScaleRow = (rowId) => {
    if (form.scaleRows.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      scaleRows: prev.scaleRows.filter((r) => r.id !== rowId),
    }));
  };

  const handleUpdateScaleRow = (rowId, field, value) => {
    setForm((prev) => ({
      ...prev,
      scaleRows: prev.scaleRows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    }));
  };

  const handleSelectPartner = (partnerId) => {
    const p = partners.find((item) => String(item.id) === String(partnerId));
    setForm((prev) => ({
      ...prev,
      partnerId,
      traderName: p?.name || prev.traderName,
      traderPhone: p?.phone || prev.traderPhone,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.livestockGroupId) {
      toast.error('Vui lòng chọn chuồng/lứa xuất bán');
      return;
    }
    if (scaleTotals.totalHeads <= 0 || scaleTotals.totalNet <= 0) {
      toast.error('Vui lòng nhập số con và trọng lượng cân tịnh lớn hơn 0');
      return;
    }
    const selectedBarn = activeBarns.find((b) => String(b.currentBatch?.id) === String(form.livestockGroupId));
    const maxHeads = Number(selectedBarn?.currentBatch?.currentQuantity ?? 0);
    if (maxHeads > 0 && scaleTotals.totalHeads > maxHeads) {
      toast.error(`Số con xuất bán (${scaleTotals.totalHeads} con) vượt quá sĩ số hiện có trong chuồng (${maxHeads} con)`);
      return;
    }
    if (Number(form.unitPricePerKg) < 0 || Number(form.paidAmount) < 0) {
      toast.error('Đơn giá và số tiền thanh toán không được nhỏ hơn 0');
      return;
    }

    try {
      setIsSubmitting(true);
      const scaleSummary = form.scaleRows
        .map((r, idx) => `Mã ${idx + 1}: ${r.heads} con (${r.grossKg}-${r.tareKg}=${Math.max(0, (Number(r.grossKg) || 0) - (Number(r.tareKg) || 0))}kg)`)
        .join('; ');

      const payload = {
        farmId: currentFarmId,
        branchId: effectiveBranchId,
        partnerId: form.partnerId ? Number(form.partnerId) : null,
        orderCode: form.orderCode,
        saleDate: form.saleDate,
        livestockGroupId: Number(form.livestockGroupId),
        headsSold: scaleTotals.totalHeads,
        grossWeightKg: scaleTotals.totalGross,
        tareWeightKg: scaleTotals.totalTare,
        unitPricePerKg: Number(form.unitPricePerKg) || 0,
        traderName: form.traderName || 'Thương lái',
        traderPhone: form.traderPhone || '',
        vehiclePlate: form.vehiclePlate || '',
        paymentMethod: form.paymentMethod,
        paidAmount: Number(form.paidAmount) || 0,
        isFinalHarvest: Boolean(form.isFinalHarvest),
        notes: `${scaleSummary}${form.notes ? ` | ${form.notes}` : ''}`,
      };

      const created = await financeService.createFarmSale(currentFarmId, payload);
      toast.success(
        `Đã chốt xuất bán ${formatNumber(scaleTotals.totalHeads)} con (${formatNumber(scaleTotals.totalNet)} kg tịnh — ${formatCurrency(scaleTotals.totalAmount)})!`
      );
      setIsModalOpen(false);
      await loadData();
      triggerRefresh?.();
      if (created && form.paymentMethod === 'VIETQR') {
        setSelectedOrderForQr(created);
      }
    } catch (err) {
      console.error('Lỗi xuất bán hàng:', err);
      toast.error(err?.response?.data?.message || 'Lỗi khi tạo phiếu xuất bán hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BadgeDollarSign className="h-6 w-6 text-emerald-600" />
            <span>Quản Lý Bán Hàng & Xuất Chuồng Trực Tiếp</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cân nhiều mã trừ bì, sinh mã VietQR động từ tài khoản ngân hàng trang trại, tự động đóng chuồng, tạo Phiếu Thu & Công nợ phải thu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
          >
            Làm Mới
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={handleOpenModal}
            >
              Tạo Phiếu Xuất Bán
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className={`grid grid-cols-1 ${canViewPrice ? 'sm:grid-cols-2 md:grid-cols-4' : 'sm:grid-cols-2'} gap-3`}>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🚛
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Đợt Bán Xuất Trại</div>
            <div className="text-lg font-black text-slate-900">
              {salesOrders.length} <span className="text-xs font-normal text-slate-400">phiếu</span>
            </div>
          </div>
        </div>

        {canViewPrice && (
          <>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                ⚖️
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Tổng Doanh Thu</div>
                <div className="text-sm font-black text-blue-700 font-mono">
                  {formatCurrency(salesOrders.reduce((sum, s) => sum + Number(s.totalAmount ?? s.finalAmount ?? 0), 0))}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                💳
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Đã Thu Thực Tế</div>
                <div className="text-sm font-black text-emerald-700 font-mono">
                  {formatCurrency(salesOrders.reduce((sum, s) => sum + Number(s.paidAmount ?? 0), 0))}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
                📌
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Phải Thu Thương Lái</div>
                <div className="text-sm font-black text-rose-600 font-mono">
                  {formatCurrency(salesOrders.reduce((sum, s) => sum + Number(s.remainingDebt ?? s.debtAmount ?? 0), 0))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bảng danh sách đơn hàng xuất bán */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-slate-500" />
            <span>Lịch Sử Xuất Bán Đàn / Chuồng Cho Thương Lái</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {salesOrders.length} đơn bán
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Mã Phiếu</th>
                <th className="py-2.5 px-3">Ngày Xuất</th>
                <th className="py-2.5 px-3">Thương Lái / Khách</th>
                <th className="py-2.5 px-3">Chi Tiết Cân Tịnh</th>
                {canViewPrice && <th className="py-2.5 px-3 text-right">Tổng Tiền</th>}
                {canViewPrice && <th className="py-2.5 px-3 text-right">Đã Thu / Còn Nợ</th>}
                {canViewPrice && <th className="py-2.5 px-3 text-center">Thanh Toán</th>}
                {canViewPrice && <th className="py-2.5 px-3 text-center">VietQR</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Chưa có phiếu xuất bán nào thuộc chi nhánh này. Bấm "Tạo Phiếu Xuất Bán" để xuất chuồng.
                  </td>
                </tr>
              ) : (
                salesOrders.map((so) => {
                  const total = Number(so.totalAmount ?? so.finalAmount ?? 0);
                  const paid = Number(so.paidAmount ?? 0);
                  const debt = Number(so.remainingDebt ?? so.debtAmount ?? 0);
                  return (
                    <tr key={so.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {so.orderCode || `XBAN-#${so.id}`}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {formatDate(so.orderDate || so.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {so.traderName || so.partnerName || 'Thương lái'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs" title={so.notes}>
                        {so.notes || 'Xuất bán đàn vật nuôi'}
                      </td>
                      {canViewPrice && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(total)}
                        </td>
                      )}
                      {canViewPrice && (
                        <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                          <div className="text-emerald-700 font-bold">{formatCurrency(paid)}</div>
                          {debt > 0 && <div className="text-rose-600 font-bold">Nợ: {formatCurrency(debt)}</div>}
                        </td>
                      )}
                      {canViewPrice && (
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              so.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : so.paymentStatus === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {so.paymentStatus === 'PAID' ? 'Đã thu đủ' : so.paymentStatus === 'PARTIAL' ? 'Thu một phần' : 'Chưa thu'}
                          </span>
                        </td>
                      )}
                      {canViewPrice && (
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            size="xs"
                            variant="outline"
                            icon={<QrCode className="h-3 w-3 text-emerald-600" />}
                            onClick={() => setSelectedOrderForQr(so)}
                          >
                            Xem QR
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lập Phiếu Xuất Bán Nhiều Mã Cân + VietQR Động */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo Phiếu Xuất Bán & Cân Trừ Bì"
        subtitle={`Mã phiếu: ${form.orderCode} • Tài khoản nhận: ${bankConfig.bankName} - ${bankConfig.bankAccountNo}`}
        size="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs max-h-[78vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Ngày Xuất Chuồng *" required>
              <Input
                type="date"
                value={form.saleDate}
                onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Thương Lái / Khách Mua *" required>
              <Select
                value={form.partnerId}
                onChange={(e) => handleSelectPartner(e.target.value)}
                required
              >
                <option value="">-- Chọn thương lái --</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.phone ? `(${p.phone})` : ''}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Chuồng / Lứa Xuất Bán *" required>
              <Select
                value={form.livestockGroupId}
                onChange={(e) => setForm({ ...form, livestockGroupId: e.target.value })}
                required
              >
                {activeBarns.length === 0 ? (
                  <option value="">-- Không có chuồng đang nuôi thuộc chi nhánh --</option>
                ) : (
                  activeBarns.map((b) => (
                    <option key={b.currentBatch.id} value={b.currentBatch.id}>
                      {b.name} — {b.currentBatch.code} ({formatNumber(b.currentBatch.currentQuantity)} con)
                    </option>
                  ))
                )}
              </Select>
            </FormField>
          </div>

          {/* Bảng nhiều mã cân trừ bì */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-blue-600" />
                <span>Chi Tiết Các Mã Cân (Tổng Cân − Trừ Bì = Cân Tịnh)</span>
              </span>
              <Button type="button" variant="outline" size="xs" icon={<Plus className="h-3.5 w-3.5" />} onClick={handleAddScaleRow}>
                Thêm Mã Cân
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 w-16 text-center">Mã Cân</th>
                    <th className="py-2 px-2.5 text-center">Số Con</th>
                    <th className="py-2 px-2.5 text-center">Tổng Cân (kg)</th>
                    <th className="py-2 px-2.5 text-center">Trừ Bì (kg)</th>
                    <th className="py-2 px-2.5 text-right">Cân Tịnh (kg)</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form.scaleRows.map((row, idx) => {
                    const rowNet = Math.max(0, (Number(row.grossKg) || 0) - (Number(row.tareKg) || 0));
                    return (
                      <tr key={row.id}>
                        <td className="py-1.5 px-2.5 text-center font-bold text-slate-600">Mã {idx + 1}</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            min="1"
                            value={row.heads}
                            onChange={(e) => handleUpdateScaleRow(row.id, 'heads', e.target.value)}
                            className="w-full p-1.5 text-center border border-slate-300 rounded font-bold"
                            required
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={row.grossKg}
                            onChange={(e) => handleUpdateScaleRow(row.id, 'grossKg', e.target.value)}
                            className="w-full p-1.5 text-center border border-slate-300 rounded font-mono"
                            required
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={row.tareKg}
                            onChange={(e) => handleUpdateScaleRow(row.id, 'tareKg', e.target.value)}
                            className="w-full p-1.5 text-center border border-slate-300 rounded font-mono"
                            required
                          />
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-black text-emerald-700">
                          {formatNumber(rowNet)} kg
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {form.scaleRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveScaleRow(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tổng hợp cân */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Tổng số con</span>
                <span className="font-mono font-black text-sm text-slate-900">
                  {formatNumber(scaleTotals.totalHeads)} con
                  {selectedBarn?.currentBatch?.currentQuantity ? ` / ${formatNumber(selectedBarn.currentBatch.currentQuantity)}` : ''}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Tổng cân tịnh</span>
                <span className="font-mono font-black text-sm text-emerald-700">{formatNumber(scaleTotals.totalNet)} kg</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Bình quân / con</span>
                <span className="font-mono font-black text-sm text-blue-700">{scaleTotals.avgWeightPerHead} kg/con</span>
              </div>
              {canViewPrice && (
                <div>
                  <label className="text-[10px] text-slate-600 uppercase font-bold block mb-0.5">Đơn giá (VNĐ/kg) *</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={form.unitPricePerKg}
                    onChange={(e) => setForm({ ...form, unitPricePerKg: e.target.value })}
                    className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg font-mono font-black text-right text-sm text-emerald-900"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Hình thức xuất, Thanh toán & Xem trước VietQR động */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-7 space-y-3">
              {/* Hình thức xuất: Bán tỉa / Xuất hết đàn */}
              <div className="grid grid-cols-2 gap-2.5">
                <label
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    !form.isFinalHarvest ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <input
                      type="radio"
                      name="harvestMode"
                      checked={!form.isFinalHarvest}
                      onChange={() => setForm({ ...form, isFinalHarvest: false })}
                    />
                    <span>Bán tỉa (Giữ lứa)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pl-5 mt-0.5">Trừ sĩ số đàn, chuồng tiếp tục nuôi.</p>
                </label>

                <label
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    form.isFinalHarvest ? 'border-amber-600 bg-amber-50/60' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <input
                      type="radio"
                      name="harvestMode"
                      checked={form.isFinalHarvest}
                      onChange={() => setForm({ ...form, isFinalHarvest: true })}
                    />
                    <span>Xuất hết đàn (Đóng lứa)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pl-5 mt-0.5">Đóng lứa & chuyển chuồng sang Trống.</p>
                </label>
              </div>

              {canViewPrice && (
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-900 font-bold">Tổng Tiền Xuất Bán:</span>
                    <span className="font-mono font-black text-lg text-emerald-700">
                      {formatCurrency(scaleTotals.totalAmount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-emerald-200/70">
                    <FormField label="Hình thức thanh toán">
                      <Select
                        value={form.paymentMethod}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      >
                        <option value="VIETQR">Chuyển khoản VietQR</option>
                        <option value="CASH">Tiền mặt tại cân</option>
                        <option value="DEBT">Ghi nợ thương lái</option>
                      </Select>
                    </FormField>

                    <FormField label="Khách thanh toán thực tế (VNĐ)">
                      <Input
                        type="number"
                        min="0"
                        value={form.paidAmount}
                        onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                        className="font-mono font-black text-right"
                      />
                    </FormField>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="font-bold text-rose-700">Còn nợ phải thu thương lái:</span>
                    <span className="font-mono font-black text-rose-600">
                      {formatCurrency(scaleTotals.remainingDebt)}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <FormField label="Biển số xe">
                  <Input
                    value={form.vehiclePlate}
                    onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                    placeholder="VD: 60C-123.45"
                  />
                </FormField>
                <FormField label="Ghi chú">
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Ghi chú đợt xuất..."
                  />
                </FormField>
              </div>
            </div>

            {/* Khối VietQR động trực tiếp trong Modal */}
            {canViewPrice && (
              <div className="md:col-span-5 p-3.5 bg-white rounded-xl border-2 border-emerald-200 text-center space-y-2 shadow-2xs">
                <div className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">
                  Mã VietQR Thanh Toán Động
                </div>
                {scaleTotals.totalAmount > 0 ? (
                  <img
                    src={getVietQrUrl(scaleTotals.totalAmount, `THANH TOAN ${form.orderCode}`)}
                    alt="VietQR Động"
                    className="w-44 h-44 mx-auto object-contain rounded-lg border border-slate-100"
                  />
                ) : (
                  <div className="w-44 h-44 mx-auto flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 text-[11px] px-3">
                    Nhập số cân & đơn giá để sinh mã VietQR
                  </div>
                )}
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div className="font-bold text-slate-900">{bankConfig.bankName}</div>
                  <div className="font-mono font-black text-emerald-700">{bankConfig.bankAccountNo}</div>
                  <div className="uppercase font-semibold">{bankConfig.bankAccountName}</div>
                  <div className="text-[10px] text-slate-400">ND: THANH TOAN {form.orderCode}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Hoàn Tất Xuất Bán'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Hiển Thị Mã VietQR sau khi chốt / xem lại */}
      {selectedOrderForQr && (
        <Modal
          isOpen={Boolean(selectedOrderForQr)}
          onClose={() => setSelectedOrderForQr(null)}
          title="Mã VietQR Thanh Toán Xuất Chuồng"
          subtitle={`Mã phiếu: ${selectedOrderForQr.orderCode || selectedOrderForQr.id} • ${formatCurrency(selectedOrderForQr.totalAmount ?? selectedOrderForQr.finalAmount ?? 0)}`}
          size="sm"
        >
          <div className="text-center p-4 space-y-4">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm inline-block mx-auto">
              <img
                src={getVietQrUrl(
                  selectedOrderForQr.totalAmount ?? selectedOrderForQr.finalAmount ?? 0,
                  `THANH TOAN ${selectedOrderForQr.orderCode || selectedOrderForQr.id}`
                )}
                alt="VietQR Code"
                className="w-56 h-56 mx-auto object-contain rounded-xl"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {bankConfig.bankName} — <strong className="font-mono">{bankConfig.bankAccountNo}</strong> ({bankConfig.bankAccountName})
              </p>
              <div className="font-mono font-black text-lg text-emerald-700 mt-1">
                {formatCurrency(selectedOrderForQr.totalAmount ?? selectedOrderForQr.finalAmount ?? 0)}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSelectedOrderForQr(null)}
            >
              Đóng
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SalesPage;
