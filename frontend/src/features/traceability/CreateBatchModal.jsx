import React, { useState, useEffect } from 'react';
import { 
  X, 
  PackagePlus, 
  Calendar, 
  Scale, 
  Tag, 
  Award, 
  Layers, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { traceabilityService } from '../../services/traceabilityService';
import { cropService } from '../../services/cropService';
import { toast } from 'sonner';

export const CreateBatchModal = ({
  isOpen,
  onClose,
  farmId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [seasons, setSeasons] = useState([]);

  // Form states
  const [seasonId, setSeasonId] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [productName, setProductName] = useState('');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [unit, setUnit] = useState('KG');
  const [qualityGrade, setQualityGrade] = useState('LOAI_1');

  useEffect(() => {
    if (isOpen && farmId) {
      loadSeasons();
      // Reset form
      setBatchCode('');
      setProductName('');
      setHarvestDate(new Date().toISOString().slice(0, 10));
      setExpiryDate('');
      setInitialQuantity('');
      setUnit('KG');
      setQualityGrade('LOAI_1');
    }
  }, [isOpen, farmId]);

  const loadSeasons = async () => {
    try {
      const data = await cropService.getSeasons(farmId);
      const seasonList = data?.items || (Array.isArray(data) ? data : []);
      setSeasons(seasonList);
      if (seasonList.length > 0) {
        setSeasonId(seasonList[0].id);
        setProductName(seasonList[0].cropName || '');
      }
    } catch (err) {
      console.error(err);
      setSeasons([]);
    }
  };

  const handleSeasonSelect = (e) => {
    const sId = e.target.value;
    setSeasonId(sId);
    const found = seasons.find(s => s.id === Number(sId));
    if (found && found.cropName) {
      setProductName(found.cropName);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast.error('Vui lòng nhập tên nông sản thành phẩm!');
      return;
    }
    if (!initialQuantity || Number(initialQuantity) <= 0) {
      toast.error('Sản lượng đóng gói ban đầu phải lớn hơn 0!');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        seasonId: seasonId ? Number(seasonId) : null,
        batchCode: batchCode.trim() || null,
        productName: productName.trim(),
        harvestDate,
        expiryDate: expiryDate || null,
        initialQuantity: parseFloat(initialQuantity),
        unit: unit.trim().toUpperCase(),
        qualityGrade
      };

      await traceabilityService.createHarvestBatch(farmId, payload);
      toast.success('Khởi tạo Lô thành phẩm thành công! (Trạng thái: PENDING_APPROVAL - Chờ phê duyệt kiểm định an toàn).');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi khi tạo lô thành phẩm');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <PackagePlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Khởi tạo Lô Thành Phẩm Thu Hoạch</h3>
              <p className="text-xs text-emerald-100">
                Đóng gói thành phẩm nông sản & nộp hồ sơ kiểm định an toàn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note về Approval Gate */}
        <div className="p-3.5 bg-amber-50 border-b border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            Lô sau khi tạo sẽ ở trạng thái <strong>PENDING_APPROVAL</strong>. Quyền in tem và sinh mã QR công khai chỉ được kích hoạt sau khi Kỹ thuật viên / Chủ trang trại kiểm định phê duyệt an toàn.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Mùa vụ liên kết */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
              Liên kết Mùa vụ canh tác
            </label>
            <select
              value={seasonId}
              onChange={handleSeasonSelect}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Không liên kết mùa vụ cụ thể --</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.seasonName} ({s.seasonCode}) - {s.cropName}
                </option>
              ))}
            </select>
          </div>

          {/* Tên sản phẩm & Mã lô */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Tên nông sản thành phẩm *
              </label>
              <input
                type="text"
                placeholder="VD: Dưa lưới Huỳnh Long VietGAP"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Mã Lô (Để trống để tự sinh)
              </label>
              <input
                type="text"
                placeholder="LO-20261002-XXXX"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Ngày thu hoạch & Hạn dùng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Ngày thu hoạch *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Hạn sử dụng (Best Before)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sản lượng, Đơn vị & Phân loại chất lượng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Sản lượng đóng gói *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="VD: 500"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Đơn vị tính *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="KG">Kilogram (KG)</option>
                <option value="TAN">Tấn (TẤN)</option>
                <option value="TA">Tạ (TẠ)</option>
                <option value="HOP">Hộp (HỘP)</option>
                <option value="THUNG">Thùng (THÙNG)</option>
                <option value="TRAI">Trái / Quả (TRÁI)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Phân loại phẩm cấp
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="LOAI_1">Loại 1 (Thượng hạng)</option>
                <option value="LOAI_2">Loại 2 (Tiêu chuẩn)</option>
                <option value="XUAT_KHAU">Xuất khẩu (Global Standard)</option>
              </select>
            </div>
          </div>

          {/* Action buttons >= 44px ergonomics */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang khởi tạo lô...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Khởi tạo Lô thành phẩm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateBatchModal;
