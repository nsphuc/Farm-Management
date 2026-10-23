import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Apple,
  Calendar,
  Activity,
  Layers,
  Scale,
  Award,
  Plus,
  PackageCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { toast } from '@/store/useToastStore';
import { farmingService } from '@/services/modules/farmingService';
import { formatDate, formatNumber, formatWeight } from '@/utils/formatters';

export function GrowthAndHarvestTab({ item, sector, farmId, onDataChanged }) {
  const [weightLogs, setWeightLogs] = useState([]);
  const [harvestRecords, setHarvestRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Ghi nhận thu hoạch (Field Staff / Farm Manager)
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [harvestForm, setHarvestForm] = useState({
    harvestDate: new Date().toISOString().split('T')[0],
    actualYieldKg: '',
    qualityGrade: 'GRADE_A',
    notes: '',
  });

  // Modal Tiếp nhận đóng gói Lô thành phẩm (Warehouse Staff / Farm Manager)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState({
    batchCode: `BATCH-${Date.now().toString().slice(-6)}`,
    productName: item?.cropVariety || item?.breed || 'Nông sản thu hoạch',
    initialQuantity: '',
    unit: 'KG',
    qualityGrade: 'GRADE_A',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    harvestDate: new Date().toISOString().split('T')[0],
  });

  // Modal Cân vật nuôi (Field Staff / Technical Staff / Farm Manager)
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [weightForm, setWeightForm] = useState({
    recordDate: new Date().toISOString().split('T')[0],
    weightKg: '',
    notes: 'Cân định kỳ tính ADG',
  });

  const quarantineDate = item?.activePhiEndDate || item?.activeWithdrawalEndDate;
  const isQuarantined = Boolean(
    item?.isInPhiQuarantine ||
    item?.isInWithdrawalQuarantine ||
    item?.status === 'QUARANTINED' ||
    (quarantineDate && new Date(quarantineDate) >= new Date(new Date().toDateString()))
  );

  let daysRemaining = 0;
  if (quarantineDate) {
    const qTime = new Date(quarantineDate).getTime();
    const now = new Date(new Date().toDateString()).getTime();
    if (qTime >= now) {
      daysRemaining = Math.ceil((qTime - now) / (1000 * 60 * 60 * 24));
    }
  }

  const fetchData = async () => {
    if (!farmId || !item?.id) return;
    try {
      setIsLoading(true);
      if (sector === 'LIVESTOCK') {
        const wLogs = await farmingService.getLivestockWeightLogs(farmId, item.id).catch(() => []);
        setWeightLogs(Array.isArray(wLogs) ? wLogs : []);
      } else {
        const hRes = await farmingService.getHarvestRecords(farmId).catch(() => ({ content: [] }));
        const hList = hRes?.content || (Array.isArray(hRes) ? hRes : []);
        const filtered = hList.filter((h) => !h.seasonId || h.seasonId === item.id);
        setHarvestRecords(filtered);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu tăng trưởng/thu hoạch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [farmId, item?.id, sector]);

  // Submit Ghi nhận thu hoạch
  const handleCreateHarvest = async (e) => {
    e.preventDefault();
    if (isQuarantined) {
      toast.error('Vụ mùa đang trong thời gian cách ly PHI, không được phép thu hoạch!');
      return;
    }
    try {
      setIsSubmitting(true);
      await farmingService.createHarvestRecord(farmId, {
        seasonId: item.id,
        harvestDate: harvestForm.harvestDate,
        actualYieldKg: Number(harvestForm.actualYieldKg),
        qualityGrade: harvestForm.qualityGrade,
        notes: harvestForm.notes,
      });
      toast.success('Đã ghi nhận sản lượng thu hoạch tại ruộng thành công!');
      setIsHarvestModalOpen(false);
      fetchData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi ghi nhận thu hoạch:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi ghi nhận thu hoạch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Tiếp nhận & đóng gói Lô thành phẩm
  const handleCreatePackageBatch = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const isCrop = sector === 'CROP';
      await farmingService.createProductBatch(farmId, {
        batchCode: packageForm.batchCode,
        productName: packageForm.productName,
        initialQuantity: Number(packageForm.initialQuantity),
        unit: packageForm.unit,
        qualityGrade: packageForm.qualityGrade,
        harvestDate: packageForm.harvestDate,
        expiryDate: packageForm.expiryDate,
        seasonId: isCrop ? item.id : undefined,
        livestockGroupId: !isCrop ? item.id : undefined,
      });
      toast.success('Đã tiếp nhận và tạo Lô thành phẩm chờ duyệt KCS thành công!');
      setIsPackageModalOpen(false);
      fetchData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi đóng gói lô thành phẩm:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi đóng gói lô thành phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Ghi nhận cân nặng
  const handleRecordWeight = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await farmingService.recordLivestockWeight(farmId, item.id, {
        recordDate: weightForm.recordDate,
        weightKg: Number(weightForm.weightKg),
        notes: weightForm.notes,
      });
      toast.success('Đã ghi nhận cân nặng thành công!');
      setIsWeightModalOpen(false);
      fetchData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi ghi cân nặng:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi ghi cân nặng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      {/* ======================================================== */}
      {/* 1. BANNER CẢNH BÁO AN TOÀN SINH HỌC (PHI / WITHDRAWAL)  */}
      {/* ======================================================== */}
      {isQuarantined ? (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4.5 text-rose-900 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-rose-950 text-sm">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 animate-bounce" />
              <span>CẢNH BÁO AN TOÀN SINH HỌC: ĐANG TRONG THỜI GIAN CÁCH LY THUỐC</span>
            </div>
            <span className="font-mono font-bold bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-xs">
              Còn {daysRemaining} ngày
            </span>
          </div>

          <p className="leading-relaxed text-xs text-rose-800">
            {sector === 'CROP'
              ? `Vụ mùa này đang trong thời gian cách ly hoạt chất thuốc BVTV (Pre-Harvest Interval - PHI). Hạn cách ly an toàn đến ngày `
              : `Đàn vật nuôi này đang trong thời gian ngưng sử dụng kháng sinh/thuốc thú y (Withdrawal Period). Hạn cách ly an toàn đến ngày `}
            <strong>{formatDate(quarantineDate)}</strong>.
          </p>

          <div className="flex items-center gap-2 text-[11px] font-bold text-rose-900 bg-white/70 p-2.5 rounded-xl border border-rose-200">
            <span>⛔ KHÓA CỨNG TOÀN BỘ QUYỀN THU HOẠCH HOẶC XUẤT BÁN CHO ĐẾN HẾT THỜI GIAN CÁCH LY!</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-emerald-950 font-bold">Trạng Thái An Toàn Sinh Học Đạt Chuẩn</strong>
              <span className="text-[11px] text-emerald-700">
                {sector === 'CROP'
                  ? 'Không có hoạt chất thuốc BVTV nào đang trong thời gian cách ly. Sẵn sàng thu hoạch.'
                  : 'Đàn vật nuôi sạch thuốc kháng sinh. Đạt tiêu chuẩn an toàn thực phẩm để xuất chuồng.'}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-emerald-600 text-white px-3 py-1 rounded-full shadow-xs">
            Đạt Chuẩn
          </span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CHĂN NUÔI: BIỂU ĐỒ & BẢNG TĂNG TRƯỞNG CÂN NẶNG ADG   */}
      {/* ======================================================== */}
      {sector === 'LIVESTOCK' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>Lịch Sử Cân Nặng & Tốc Độ Tăng Trọng Bình Quân (ADG)</span>
              </h5>
              <span className="text-[11px] text-slate-400">
                Công thức ADG = (Khối lượng hiện tại - Khối lượng trước) / Số ngày
              </span>
            </div>

            <Can role={['ROLE_FIELD_STAFF', 'ROLE_TECHNICAL_STAFF', 'ROLE_FARM_MANAGER']}>
              <Button
                size="sm"
                variant="primary"
                icon={<Scale className="h-3.5 w-3.5" />}
                onClick={() => setIsWeightModalOpen(true)}
              >
                + Ghi Cân Nặng
              </Button>
            </Can>
          </div>

          {weightLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center bg-slate-50">
              <Scale className="h-6 w-6 text-slate-300 mx-auto mb-1" />
              <p className="text-slate-500 font-medium text-xs">Chưa có dữ liệu ghi nhận cân nặng</p>
              <span className="text-[11px] text-slate-400">Bác sĩ thú y hoặc kỹ thuật trại sẽ ghi cân nặng định kỳ</span>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Ngày Cân</th>
                    <th className="py-2.5 px-3 text-right">Khối Lượng (kg)</th>
                    <th className="py-2.5 px-3 text-right">Tăng Trọng ADG</th>
                    <th className="py-2.5 px-3">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weightLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {formatDate(log.recordDate)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNumber(log.weightKg)} kg
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {log.adgKgPerDay ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            +{formatNumber(log.adgKgPerDay)} kg/ngày
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-xs">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TRỒNG TRỌT: DANH SÁCH ĐỢT THU HOẠCH                   */}
      {/* ======================================================== */}
      {sector === 'CROP' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div>
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Apple className="h-4 w-4 text-emerald-600" />
                <span>Biên Bản Thu Hoạch Nông Sản Đã Ghi Nhận</span>
              </h5>
              <span className="text-[11px] text-slate-400">
                Sản lượng thu hoạch thực tế chuyển giao KCS và kho thành phẩm
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Can permission="PERM_HARVEST_MANAGE" role={['ROLE_FIELD_STAFF', 'ROLE_FARM_MANAGER']}>
                <Button
                  size="sm"
                  variant="success"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setIsHarvestModalOpen(true)}
                  disabled={isQuarantined}
                  title={isQuarantined ? 'Đang trong thời gian cách ly PHI, không thể thu hoạch' : ''}
                >
                  + Ghi Nhận Sản Lượng Thu Hoạch
                </Button>
              </Can>

              <Can permission="PERM_HARVEST_MANAGE" role={['ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER']}>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<PackageCheck className="h-3.5 w-3.5" />}
                  onClick={() => setIsPackageModalOpen(true)}
                >
                  Tiếp Nhận & Đóng Gói Lô Thành Phẩm
                </Button>
              </Can>
            </div>
          </div>

          {harvestRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center bg-slate-50">
              <Apple className="h-6 w-6 text-slate-300 mx-auto mb-1" />
              <p className="text-slate-500 font-medium text-xs">Chưa có đợt thu hoạch nào được ghi nhận</p>
              <span className="text-[11px] text-slate-400">
                Khi đến kỳ thu hoạch, Nhân viên hiện trường (ROLE_FIELD_STAFF) sẽ lập biên bản ghi nhận sản lượng thực tế
              </span>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Ngày Thu Hoạch</th>
                    <th className="py-2.5 px-3">Mã Biên Bản</th>
                    <th className="py-2.5 px-3 text-right">Sản Lượng (kg)</th>
                    <th className="py-2.5 px-3">Phân Loại (Grade)</th>
                    <th className="py-2.5 px-3">Lô Thành Phẩm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {harvestRecords.map((hr) => (
                    <tr key={hr.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {formatDate(hr.harvestDate)}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {hr.harvestCode || `HRV-#${hr.id}`}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatWeight(hr.actualYieldKg)}
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                          <Award className="h-3 w-3" />
                          <span>{hr.qualityGrade || 'Hạng A'}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                        {hr.productBatchCode || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Ghi nhận sản lượng thu hoạch tại ruộng */}
      <Modal
        isOpen={isHarvestModalOpen}
        onClose={() => setIsHarvestModalOpen(false)}
        title="Ghi Nhận Sản Lượng Thu Hoạch Tại Ruộng"
        size="md"
      >
        <form onSubmit={handleCreateHarvest} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày Thu Hoạch" required>
              <Input
                type="date"
                value={harvestForm.harvestDate}
                onChange={(e) => setHarvestForm({ ...harvestForm, harvestDate: e.target.value })}
              />
            </FormField>

            <FormField label="Phân Loại Chất Lượng">
              <Select
                value={harvestForm.qualityGrade}
                onChange={(e) => setHarvestForm({ ...harvestForm, qualityGrade: e.target.value })}
              >
                <option value="GRADE_A">Loại 1 (GRADE_A)</option>
                <option value="GRADE_B">Loại 2 (GRADE_B)</option>
                <option value="EXPORT">Xuất khẩu (EXPORT)</option>
                <option value="STANDARD">Tiêu chuẩn (STANDARD)</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Sản Lượng Thực Thu (kg)" required>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={harvestForm.actualYieldKg}
              onChange={(e) => setHarvestForm({ ...harvestForm, actualYieldKg: e.target.value })}
              placeholder="VD: 1500"
              required
            />
          </FormField>

          <FormField label="Ghi Chú Đợt Thu Hoạch">
            <Input
              value={harvestForm.notes}
              placeholder="Thời tiết khi thu hoạch, tỷ lệ hao hụt..."
              onChange={(e) => setHarvestForm({ ...harvestForm, notes: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsHarvestModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="success" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu Biên Bản Thu Hoạch'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Tiếp nhận & đóng gói Lô thành phẩm (Thủ kho) */}
      <Modal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        title="Tiếp Nhận & Đóng Gói Lô Thành Phẩm Nhập Kho"
        size="md"
      >
        <form onSubmit={handleCreatePackageBatch} className="space-y-4 text-xs">
          <FormField label="Mã Lô Thành Phẩm" required>
            <Input
              value={packageForm.batchCode}
              onChange={(e) => setPackageForm({ ...packageForm, batchCode: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Tên Sản Phẩm Đóng Gói" required>
            <Input
              value={packageForm.productName}
              onChange={(e) => setPackageForm({ ...packageForm, productName: e.target.value })}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số Lượng Đóng Gói" required>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={packageForm.initialQuantity}
                onChange={(e) => setPackageForm({ ...packageForm, initialQuantity: e.target.value })}
                placeholder="VD: 500"
                required
              />
            </FormField>

            <FormField label="Đơn Vị Tính" required>
              <Select
                value={packageForm.unit}
                onChange={(e) => setPackageForm({ ...packageForm, unit: e.target.value })}
              >
                <option value="KG">Kilogram (KG)</option>
                <option value="BOX">Thùng (BOX)</option>
                <option value="BAG">Bao (BAG)</option>
                <option value="BUNCH">Bó (BUNCH)</option>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày Thu Hoạch / Đóng Gói" required>
              <Input
                type="date"
                value={packageForm.harvestDate}
                onChange={(e) => setPackageForm({ ...packageForm, harvestDate: e.target.value })}
              />
            </FormField>

            <FormField label="Hạn Sử Dụng (Best Before)">
              <Input
                type="date"
                value={packageForm.expiryDate}
                onChange={(e) => setPackageForm({ ...packageForm, expiryDate: e.target.value })}
              />
            </FormField>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
            ⚠️ Lô thành phẩm mới tạo sẽ ở trạng thái <strong>PENDING_APPROVAL</strong> (Chờ duyệt KCS). Giám đốc trang trại (Checker) sẽ phê duyệt để sinh mã QR truy xuất.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsPackageModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo Lô Thành Phẩm'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Ghi nhận cân nặng vật nuôi */}
      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Ghi Nhận Thể Trọng Đàn Nuôi"
        size="md"
      >
        <form onSubmit={handleRecordWeight} className="space-y-4 text-xs">
          <FormField label="Ngày Ghi Cân" required>
            <Input
              type="date"
              value={weightForm.recordDate}
              onChange={(e) => setWeightForm({ ...weightForm, recordDate: e.target.value })}
            />
          </FormField>

          <FormField label="Khối Lượng Trung Bình (kg/con)" required>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={weightForm.weightKg}
              onChange={(e) => setWeightForm({ ...weightForm, weightKg: e.target.value })}
              placeholder="VD: 45.5"
              required
            />
          </FormField>

          <FormField label="Ghi Chú Đợt Cân">
            <Input
              value={weightForm.notes}
              onChange={(e) => setWeightForm({ ...weightForm, notes: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsWeightModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu Khối Lượng'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default GrowthAndHarvestTab;
