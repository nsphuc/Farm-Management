import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit,
  FileSpreadsheet,
  Filter,
  Lock,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { addonsService } from '@/services/modules/addonsService';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export function PayrollKpiPage() {
  const { currentFarmId } = useActiveFarmStore();
  const { currentBranchId, branches, triggerRefresh } = useActiveBranchStore();

  const [periodMonth, setPeriodMonth] = useState('2026-11');
  const [sheets, setSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Sửa công / KPI
  const [editingSheet, setEditingSheet] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    actualWorkDays: 26,
    kpiBonus: 0,
    allowance: 0,
    advanceDeduction: 0,
    notes: '',
  });

  // Modal Chốt lương & Chi trả
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [closeNotes, setCloseNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const fetchPayroll = async () => {
    try {
      setIsLoading(true);
      const data = await addonsService.getPayrollSheets({
        farmId: currentFarmId,
        branchId: currentBranchId !== 'ALL' ? currentBranchId : undefined,
        periodMonth,
      });
      setSheets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load payroll sheets', err);
      toast.error('Lỗi tải dữ liệu bảng lương KPI');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [currentFarmId, currentBranchId, periodMonth]);

  // KPIs
  const summary = useMemo(() => {
    const totalBase = sheets.reduce((sum, s) => sum + (Number(s.baseSalary) || 0), 0);
    const totalKpi = sheets.reduce((sum, s) => sum + (Number(s.kpiBonus) || 0), 0);
    const totalAdvance = sheets.reduce((sum, s) => sum + (Number(s.advanceDeduction) || 0), 0);
    const totalNet = sheets.reduce((sum, s) => sum + (Number(s.netSalary) || 0), 0);
    const unpaidTotalNet = sheets
      .filter((s) => s.status !== 'PAID')
      .reduce((sum, s) => sum + (Number(s.netSalary) || 0), 0);
    const paidCount = sheets.filter((s) => s.status === 'PAID').length;
    return { totalBase, totalKpi, totalAdvance, totalNet, unpaidTotalNet, paidCount, totalEmployees: sheets.length };
  }, [sheets]);

  const handleOpenEdit = (sheet) => {
    if (sheet.status === 'PAID') {
      toast.info('Bảng lương này đã chi trả, không thể chỉnh sửa.');
      return;
    }
    setEditingSheet(sheet);
    setEditForm({
      actualWorkDays: sheet.actualWorkDays,
      kpiBonus: sheet.kpiBonus,
      allowance: sheet.allowance,
      advanceDeduction: sheet.advanceDeduction,
      notes: sheet.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSheet) return;
    try {
      await addonsService.updatePayrollSheet(
        editingSheet.id,
        {
          actualWorkDays: Number(editForm.actualWorkDays),
          kpiBonus: Number(editForm.kpiBonus),
          allowance: Number(editForm.allowance),
          advanceDeduction: Number(editForm.advanceDeduction),
          notes: editForm.notes,
        },
        { farmId: currentFarmId }
      );
      toast.success(`Đã cập nhật ngày công & KPI cho nhân viên ${editingSheet.fullName}!`);
      setIsEditModalOpen(false);
      fetchPayroll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật bảng lương');
    }
  };

  const handleConfirmCloseAndPay = async (e) => {
    e.preventDefault();
    try {
      setIsClosing(true);
      await addonsService.closeAndPayPayroll(
        {
          paymentMethod,
          notes: closeNotes || `Chi trả lương kỳ ${periodMonth}`,
        },
        {
          farmId: currentFarmId,
          branchId: currentBranchId !== 'ALL' ? currentBranchId : undefined,
          periodMonth,
        }
      );
      toast.success(
        `🎉 Đã chốt bảng lương kỳ ${periodMonth} và tự động lập Phiếu Chi ${formatCurrency(
          summary.unpaidTotalNet
        )} trên Sổ quỹ!`
      );
      setIsCloseModalOpen(false);
      triggerRefresh?.();
      fetchPayroll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi chốt chi trả bảng lương');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Calculator className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Bảng Lương & Chấm Công KPI
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  Add-on Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tính lương theo ngày công thực tế, thưởng KPI năng suất (FCR, Tỷ lệ sống) và khấu trừ tạm ứng
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bộ lọc kỳ lương */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="font-semibold text-slate-600">Kỳ lương:</span>
            <select
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="2026-11">Tháng 11/2026</option>
              <option value="2026-10">Tháng 10/2026</option>
              <option value="2026-09">Tháng 09/2026</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayroll}
            disabled={isLoading}
            icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs font-bold"
          >
            Làm mới
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCloseModalOpen(true)}
            disabled={sheets.length === 0 || summary.paidCount === summary.totalEmployees}
            icon={<Lock className="h-4 w-4" />}
            className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 shadow-sm"
          >
            Chốt Bảng Lương & Chi Trả
          </Button>
        </div>
      </div>

      {/* 2. Thẻ KPI Tổng hợp */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Tổng nhân sự tính lương</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.totalEmployees} người</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Đã chi trả: {summary.paidCount}/{summary.totalEmployees}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Tổng thưởng KPI đạt chuẩn</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(summary.totalKpi)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            Thưởng FCR & Tỷ lệ sống xuất sắc
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Đã tạm ứng trong kỳ</span>
            <Wallet className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {formatCurrency(summary.totalAdvance)}
          </div>
          <div className="text-[11px] text-slate-500">
            Tự động khấu trừ vào lương
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
            <span>Tổng thực lĩnh còn lại</span>
            <DollarSign className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            {formatCurrency(summary.totalNet)}
          </div>
          <div className="text-[11px] text-slate-500">
            Sẽ sinh phiếu chi khi chốt lương
          </div>
        </div>
      </div>

      {/* 3. Bảng Chi tiết Tính Lương Nhân viên */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Chi Tiết Bảng Lương Nhân Sự — Kỳ {periodMonth}</span>
          </h2>
          <span className="text-xs text-slate-500">
            Click nút <strong>Sửa</strong> để điều chỉnh ngày công hoặc nhập bổ sung thưởng KPI
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-700 font-bold">
                <th className="py-3 px-4">Mã & Họ tên</th>
                <th className="py-3 px-4 text-right">Lương cơ bản</th>
                <th className="py-3 px-4 text-center">Công thực tế / Chuẩn</th>
                <th className="py-3 px-4 text-right">Thưởng KPI</th>
                <th className="py-3 px-4 text-right">Phụ cấp</th>
                <th className="py-3 px-4 text-right">Đã tạm ứng</th>
                <th className="py-3 px-4 text-right">Thực lĩnh còn lại</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sheets.map((s) => {
                const isPaid = s.status === 'PAID';
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{s.employeeCode}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">
                      {formatCurrency(s.baseSalary)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-900 font-mono">{s.actualWorkDays}</span>
                      <span className="text-slate-400"> / {s.standardWorkDays} ngày</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      +{formatCurrency(s.kpiBonus)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      +{formatCurrency(s.allowance)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-600 font-semibold">
                      -{formatCurrency(s.advanceDeduction)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                      {formatCurrency(s.netSalary)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                          Chưa chốt
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Sửa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sheets.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Chưa có dữ liệu bảng lương cho kỳ {periodMonth}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: SỬA NGÀY CÔNG & THƯỞNG KPI */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Chỉnh Sửa Bảng Lương: ${editingSheet?.fullName || ''}`}
        size="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số ngày công thực tế *" required>
              <Input
                type="number"
                step="0.5"
                value={editForm.actualWorkDays}
                onChange={(e) => setEditForm({ ...editForm, actualWorkDays: e.target.value })}
              />
            </FormField>
            <FormField label="Thưởng KPI năng suất (đ)" hint="Đạt chuẩn tỷ lệ sống, FCR">
              <Input
                type="number"
                value={editForm.kpiBonus}
                onChange={(e) => setEditForm({ ...editForm, kpiBonus: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phụ cấp trách nhiệm / ăn ca (đ)">
              <Input
                type="number"
                value={editForm.allowance}
                onChange={(e) => setEditForm({ ...editForm, allowance: e.target.value })}
              />
            </FormField>
            <FormField label="Đã tạm ứng (đ)" hint="Khấu trừ trực tiếp">
              <Input
                type="number"
                value={editForm.advanceDeduction}
                onChange={(e) => setEditForm({ ...editForm, advanceDeduction: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Ghi chú đánh giá KPI">
            <textarea
              rows={2}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="VD: Thưởng vượt chỉ tiêu FCR lứa heo H10..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-1 focus:ring-emerald-500"
            />
          </FormField>

          {editingSheet && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="font-semibold text-emerald-900">Thực lĩnh dự kiến:</span>
              <span className="font-mono font-black text-base text-emerald-700">
                {formatCurrency(
                  Math.max(
                    0,
                    Math.round(
                      ((Number(editingSheet.baseSalary) || 0) / (Number(editingSheet.standardWorkDays) || 26)) *
                        (Number(editForm.actualWorkDays) || 0) +
                        (Number(editForm.kpiBonus) || 0) +
                        (Number(editForm.allowance) || 0) -
                        (Number(editForm.advanceDeduction) || 0)
                    )
                  )
                )}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Lưu Bảng Lương
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CHỐT BẢNG LƯƠNG & CHI TRẢ TỰ ĐỘNG */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title={`Chốt Bảng Lương & Chi Trả Kỳ ${periodMonth}`}
        size="md"
      >
        <form onSubmit={handleConfirmCloseAndPay} className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>Xác nhận chi trả tổng số tiền: {formatCurrency(summary.unpaidTotalNet)}</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Hệ thống sẽ chuyển toàn bộ bảng lương sang trạng thái <strong>Đã thanh toán</strong>,
              tự động ghi nhận một <strong>Phiếu Chi</strong> trên Sổ quỹ và reset số dư tạm ứng của nhân viên về 0.
            </p>
          </div>

          <FormField label="Phương thức chi trả *" required>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng (VietQR / Internet Banking)' },
                { value: 'CASH', label: 'Tiền mặt tại quỹ trại' },
              ]}
            />
          </FormField>

          <FormField label="Nội dung phiếu chi sổ quỹ">
            <Input
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder={`Chi trả lương nhân công kỳ ${periodMonth}`}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCloseModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isClosing}
              className="font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isClosing ? 'Đang hạch toán...' : 'Xác Nhận Chi Trả & Khóa Sổ'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PayrollKpiPage;
