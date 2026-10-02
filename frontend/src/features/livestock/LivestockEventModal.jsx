import React, { useState, useEffect } from 'react';
import { 
  X, 
  Syringe, 
  Scale, 
  HeartHandshake, 
  Baby, 
  Stethoscope, 
  LogOut, 
  Plus, 
  Trash2, 
  Package, 
  AlertCircle,
  Calendar,
  FileText
} from 'lucide-react';
import { livestockService } from '../../services/livestockService';
import { inventoryService } from '../../services/inventoryService';
import { toast } from 'sonner';

const EVENT_TYPE_OPTIONS = [
  { value: 'TIEM_PHONG', label: 'Tiêm phòng Vắc-xin', icon: Syringe, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'DO_TRONG_LUONG', label: 'Cân đo trọng lượng', icon: Scale, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'DIEU_TRI_BENH', label: 'Khám & Điều trị bệnh', icon: Stethoscope, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { value: 'PHOI_GIONG', label: 'Phối giống', icon: HeartHandshake, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'DE_CON', label: 'Sinh sản / Đẻ con', icon: Baby, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'XUAT_CHUONG', label: 'Xuất chuồng / Bán', icon: LogOut, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

export const LivestockEventModal = ({
  isOpen,
  onClose,
  farmId,
  targetType = 'INDIVIDUAL', // 'INDIVIDUAL' or 'GROUP'
  targetId,
  targetLabel = '',
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('TIEM_PHONG');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  
  // Chi tiết đặc thù
  const [weightKg, setWeightKg] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [diseaseDiagnosis, setDiseaseDiagnosis] = useState('');
  const [treatmentProtocol, setTreatmentProtocol] = useState('');

  // Vật tư tiêu hao (Inventory Backflushing)
  const [enableBackflush, setEnableBackflush] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [suppliesUsed, setSuppliesUsed] = useState([]);

  useEffect(() => {
    if (isOpen && farmId) {
      loadWarehouses();
      loadMaterials();
      // Reset form
      setEventType('TIEM_PHONG');
      setEventDate(new Date().toISOString().slice(0, 16));
      setNotes('');
      setWeightKg('');
      setVaccineName('');
      setDiseaseDiagnosis('');
      setTreatmentProtocol('');
      setEnableBackflush(false);
      setSuppliesUsed([]);
    }
  }, [isOpen, farmId]);

  const loadWarehouses = async () => {
    try {
      const data = await inventoryService.getWarehouses(farmId);
      setWarehouses(data || []);
      if (data && data.length > 0) {
        setSelectedWarehouseId(data[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải kho vật tư:', err);
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await inventoryService.getMaterials();
      const list = data?.items || data?.content || (Array.isArray(data) ? data : []);
      setMaterials(list);
    } catch (err) {
      console.error('Lỗi tải danh mục vật tư:', err);
      setMaterials([]);
    }
  };

  const handleAddSupply = () => {
    const safeMats = Array.isArray(materials) ? materials : [];
    if (safeMats.length === 0) {
      toast.error('Không tìm thấy danh mục vật tư nào trong hệ thống!');
      return;
    }
    setSuppliesUsed([
      ...suppliesUsed,
      {
        materialId: safeMats[0].id,
        quantity: 1,
        unit: safeMats[0].standardUnit || safeMats[0].unit || 'liều',
      }
    ]);
  };

  const handleRemoveSupply = (index) => {
    setSuppliesUsed(suppliesUsed.filter((_, i) => i !== index));
  };

  const handleSupplyChange = (index, field, value) => {
    const next = [...suppliesUsed];
    next[index][field] = value;
    if (field === 'materialId') {
      const mat = materials.find(m => m.id === Number(value));
      if (mat) {
        next[index].unit = mat.unit;
      }
    }
    setSuppliesUsed(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetId) {
      toast.error('Chưa xác định đối tượng cần ghi nhận sự kiện!');
      return;
    }

    // Build details JSON
    const detailsObj = {};
    if (eventType === 'DO_TRONG_LUONG' && weightKg) {
      detailsObj.weightKg = parseFloat(weightKg);
    } else if (weightKg) {
      detailsObj.weightKg = parseFloat(weightKg);
    }
    if (eventType === 'TIEM_PHONG' && vaccineName) {
      detailsObj.vaccineName = vaccineName;
    }
    if (eventType === 'DIEU_TRI_BENH') {
      if (diseaseDiagnosis) detailsObj.diagnosis = diseaseDiagnosis;
      if (treatmentProtocol) detailsObj.protocol = treatmentProtocol;
    }

    if (enableBackflush && (!selectedWarehouseId || suppliesUsed.length === 0)) {
      toast.error('Vui lòng chọn kho và ít nhất 1 vật tư nếu đã kích hoạt trừ kho!');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        targetType,
        targetId: Number(targetId),
        eventType,
        eventDate: new Date(eventDate).toISOString(),
        detailsJson: Object.keys(detailsObj).length > 0 ? JSON.stringify(detailsObj) : null,
        notes: notes.trim() || null,
        warehouseId: enableBackflush ? Number(selectedWarehouseId) : null,
        suppliesUsed: enableBackflush
          ? suppliesUsed.map(s => ({
              materialId: Number(s.materialId),
              quantity: parseFloat(s.quantity),
              unit: s.unit
            }))
          : null
      };

      await livestockService.recordEvent(farmId, payload);
      toast.success('Ghi nhận sự kiện chăn nuôi thành công!' + (enableBackflush ? ' (Đã kích hoạt trừ kho ngầm)' : ''));
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Không thể ghi nhận sự kiện chăn nuôi');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Ghi nhận Sự kiện Chăn nuôi</h2>
              <p className="text-xs text-emerald-100 font-medium">
                {targetType === 'INDIVIDUAL' ? 'Cá thể: ' : 'Đàn / Bầy: '}
                <span className="font-semibold text-white">{targetLabel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Loại sự kiện selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Loại sự kiện <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {EVENT_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = eventType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEventType(opt.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left font-medium text-sm transition-all duration-200 min-h-[50px] ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border ${opt.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="line-clamp-2 leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ngày giờ thực hiện */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Thời gian thực hiện <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Chi tiết theo loại sự kiện */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chi tiết nghiệp vụ
            </h4>

            {eventType === 'DO_TRONG_LUONG' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trọng lượng cân được (kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="VD: 45.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
                  />
                </div>
              </div>
            )}

            {eventType === 'TIEM_PHONG' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tên vắc-xin / Thuốc phòng ngừa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Vắc-xin Lở mồm long móng (FMD) Type O & A"
                    value={vaccineName}
                    onChange={(e) => setVaccineName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
                  />
                </div>
              </div>
            )}

            {eventType === 'DIEU_TRI_BENH' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Chẩn đoán bệnh lý
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Viêm phổi, rối loạn tiêu hóa..."
                    value={diseaseDiagnosis}
                    onChange={(e) => setDiseaseDiagnosis(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phác đồ điều trị
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tiêm kháng sinh 3 liều, cách nhau 48h..."
                    value={treatmentProtocol}
                    onChange={(e) => setTreatmentProtocol(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ghi chú thêm
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú phản ứng sau tiêm, triệu chứng, người phụ trách..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm resize-none"
              />
            </div>
          </div>

          {/* Cấu hình trừ kho ngầm (Backflushing) */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Trừ kho vật tư tự động (Backflushing)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tự động tạo phiếu xuất kho thuốc thú y/vắc-xin khi lưu sự kiện
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBackflush}
                  onChange={(e) => setEnableBackflush(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {enableBackflush && (
              <div className="pt-3 border-t border-emerald-200/60 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chọn kho xuất thuốc / vật tư <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code}) - {wh.type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Danh sách vật tư tiêu hao */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Danh mục thuốc thú y / vật tư sử dụng
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSupply}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 py-1 px-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm thuốc/vật tư
                    </button>
                  </div>

                  {suppliesUsed.length === 0 ? (
                    <div className="text-center py-4 bg-white/70 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                      Chưa có vật tư nào được chọn. Nhấn "Thêm thuốc/vật tư" để kê đơn/thuốc tiêm.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {suppliesUsed.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                          <select
                            value={item.materialId}
                            onChange={(e) => handleSupplyChange(idx, 'materialId', e.target.value)}
                            className="flex-1 px-2.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          >
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.code})
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            placeholder="Số lượng"
                            value={item.quantity}
                            onChange={(e) => handleSupplyChange(idx, 'quantity', e.target.value)}
                            className="w-24 px-2.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-right"
                          />
                          <span className="text-xs font-semibold text-slate-500 min-w-[40px]">
                            {item.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSupply(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons >= 44px ergonomics */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu sự kiện</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default LivestockEventModal;
