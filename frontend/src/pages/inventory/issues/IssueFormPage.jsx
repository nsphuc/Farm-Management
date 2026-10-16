import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileText,
  Boxes,
  User,
  Calendar,
  AlertCircle,
  Package,
  Layers,
  ArrowUpFromLine,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { inventoryTransactionApi } from '../../../services/inventoryTransactionApi';
import { warehouseApi } from '../../../services/warehouseApi';
import { materialApi } from '../../../services/materialApi';
import { farmApi } from '../../../services/farmApi';
import { useTenantStore } from '../../../store/tenant/useTenantStore';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Trang Lập Phiếu Xuất Kho (Form Master-Detail phức tạp).
 * Nghiệp vụ: 3.4. Xuất kho - Lập phiếu xuất (Sơ đồ phân cấp).
 * 
 * QUY TẮC CRITICAL:
 * Bắt lỗi Logic Nghiệp vụ 400 Bad Request (InsufficientInventoryException):
 * Khi gọi API Xuất kho, nếu backend trả về lỗi 400 (do xuất vượt tồn kho khả dụng),
 * Frontend BẮT BUỘC phải bắt được lỗi này, hiển thị Toast đỏ cảnh báo chi tiết, và KHÔNG được làm sập trang.
 */
export const IssueFormPage = () => {
  const navigate = useNavigate();
  const { currentFarm } = useTenantStore();

  // State danh mục nền tảng (Master Data)
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  // Cache danh sách các lô hàng khả dụng theo kho và vật tư: { `${warehouseId}_${materialId}`: [batches] }
  const [batchesCache, setBatchesCache] = useState({});

  // State Form Header (Master Info)
  const [formData, setFormData] = useState({
    warehouseId: '',
    issueCode: '',
    issueType: 'INTERNAL_USE',
    receiverName: '',
    issueDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // State Form Detail (Dynamic Table: Dòng chi tiết vật tư xuất)
  const [items, setItems] = useState([
    {
      id: Date.now(),
      materialId: '',
      batchNumber: '',
      quantity: 1,
      unitPrice: '',
      totalPrice: 0,
      availableQty: null, // Số lượng tồn kho hiện tại để cảnh báo
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // 1. Tải danh sách Trang trại & Vật tư
  useEffect(() => {
    const fetchInitData = async () => {
      setIsLoadingMaster(true);
      try {
        const [farmsRes, materialsRes] = await Promise.all([
          farmApi.getAllFarms(),
          materialApi.getAllMaterials(),
        ]);

        const farmList = farmsRes.data || [];
        setFarms(farmList);
        if (farmList.length > 0 && !selectedFarmId) {
          setSelectedFarmId(farmList[0].id);
        }

        setMaterials(materialsRes.data || []);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu ban đầu:', err);
        toast.error('Không thể tải danh mục vật tư hoặc trang trại', 'Lỗi hệ thống');
      } finally {
        setIsLoadingMaster(false);
      }
    };

    fetchInitData();
  }, [selectedFarmId]);

  // 2. Tải danh sách kho theo Farm đã chọn
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!selectedFarmId) return;
      try {
        const res = await warehouseApi.getAllWarehousesByFarm(selectedFarmId);
        const whList = res.data || [];
        setWarehouses(whList);
        if (whList.length > 0) {
          setFormData((prev) => ({ ...prev, warehouseId: whList[0].id }));
        } else {
          setFormData((prev) => ({ ...prev, warehouseId: '' }));
        }
      } catch (err) {
        console.error('Lỗi khi tải kho bãi:', err);
      }
    };

    fetchWarehouses();
  }, [selectedFarmId]);

  // 3. Tải danh sách các lô còn hàng của vật tư trong kho được chọn (FIFO / FEFO)
  const fetchBatchesForMaterial = async (warehouseId, materialId) => {
    if (!warehouseId || !materialId) return [];

    const cacheKey = `${warehouseId}_${materialId}`;
    if (batchesCache[cacheKey]) {
      return batchesCache[cacheKey];
    }

    try {
      const res = await inventoryTransactionApi.getAvailableBatches(warehouseId, materialId, 'FIFO');
      const batchList = res.data || [];
      setBatchesCache((prev) => ({ ...prev, [cacheKey]: batchList }));
      return batchList;
    } catch (err) {
      console.error('Lỗi tải danh sách lô tồn kho:', err);
      return [];
    }
  };

  // Thêm một dòng chi tiết mới
  const handleAddRow = () => {
    const newRow = {
      id: Date.now() + Math.random(),
      materialId: '',
      batchNumber: '',
      quantity: 1,
      unitPrice: '',
      totalPrice: 0,
      availableQty: null,
    };
    setItems((prev) => [...prev, newRow]);
  };

  // Xóa một dòng chi tiết
  const handleRemoveRow = (rowId) => {
    if (items.length <= 1) {
      toast.warning('Phiếu xuất kho phải có ít nhất 1 dòng chi tiết', 'Thông báo');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== rowId));
  };

  // Cập nhật giá trị của một dòng
  const handleItemChange = async (rowId, field, value) => {
    // Xóa lỗi server cảnh báo trước đó khi người dùng bắt đầu chỉnh sửa lại
    if (serverError) setServerError(null);

    // Cập nhật giá trị tức thời
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;

        const updated = { ...item, [field]: value };

        // Nếu thay đổi Vật tư
        if (field === 'materialId') {
          updated.batchNumber = '';
          updated.availableQty = null;
        }

        // Nếu thay đổi Lô hàng -> Gán tồn kho khả dụng & đơn giá vốn
        if (field === 'batchNumber' && item.materialId && formData.warehouseId) {
          const cacheKey = `${formData.warehouseId}_${item.materialId}`;
          const currentBatches = batchesCache[cacheKey] || [];
          const selectedBatch = currentBatches.find((b) => b.batchNumber === value);
          if (selectedBatch) {
            updated.availableQty = Number(selectedBatch.availableQuantity || selectedBatch.quantityOnHand || 0);
            if (!updated.unitPrice) {
              updated.unitPrice = Number(selectedBatch.unitCost || 0);
            }
          }
        }

        // Tính lại thành tiền
        const qty = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
        const price = field === 'unitPrice' ? Number(value) || 0 : Number(item.unitPrice) || 0;
        updated.totalPrice = qty * price;

        return updated;
      })
    );

    // Nếu vừa đổi vật tư -> gọi fetch batches nền
    if (field === 'materialId' && value && formData.warehouseId) {
      const batchList = await fetchBatchesForMaterial(formData.warehouseId, value);
      // Tự động chọn lô đầu tiên (FIFO) nếu có
      if (batchList.length > 0) {
        const firstBatch = batchList[0];
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== rowId) return item;
            const price = item.unitPrice || Number(firstBatch.unitCost || 0);
            const qty = Number(item.quantity) || 1;
            return {
              ...item,
              batchNumber: firstBatch.batchNumber,
              availableQty: Number(firstBatch.availableQuantity || firstBatch.quantityOnHand || 0),
              unitPrice: price,
              totalPrice: qty * price,
            };
          })
        );
      }
    }
  };

  // Tính tổng tiền và tổng số lượng xuất
  const summary = useMemo(() => {
    let totalQty = 0;
    let totalAmount = 0;

    items.forEach((item) => {
      totalQty += Number(item.quantity) || 0;
      totalAmount += Number(item.totalPrice) || 0;
    });

    return { totalQty, totalAmount };
  }, [items]);

  // Client Validation: Kiểm tra cơ bản
  const isFormValid = useMemo(() => {
    if (!formData.warehouseId) return false;
    if (!formData.issueDate) return false;
    if (items.length === 0) return false;

    for (const item of items) {
      if (!item.materialId) return false;
      if (!item.batchNumber || !item.batchNumber.trim()) return false;
      if (!item.quantity || Number(item.quantity) <= 0) return false;
    }

    return true;
  }, [formData, items]);

  // Xử lý gửi Form tạo phiếu xuất kho
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.warning('Vui lòng điền đầy đủ kho xuất, vật tư, số lô và số lượng > 0', 'Thiếu dữ liệu');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        warehouseId: Number(formData.warehouseId),
        issueCode: formData.issueCode?.trim() || null,
        issueType: formData.issueType,
        receiverName: formData.receiverName?.trim() || null,
        issueDate: formData.issueDate,
        notes: formData.notes?.trim() || null,
        items: items.map((item) => ({
          materialId: Number(item.materialId),
          batchNumber: item.batchNumber.trim(),
          quantity: Number(item.quantity),
          unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        })),
      };

      const res = await inventoryTransactionApi.createIssue(payload);
      toast.success(
        `Đã lập thành công phiếu xuất kho ${res.data?.issueCode || ''}`,
        'Xuất kho thành công'
      );
      navigate('/inventory/issues');
    } catch (err) {
      console.error('Lỗi khi lập phiếu xuất kho:', err);

      // CRITICAL: Bắt lỗi 400 Bad Request do xuất vượt tồn kho (InsufficientInventoryException)
      // Hiển thị Toast Đỏ cảnh báo rõ ràng nội dung lỗi từ Backend, KHÔNG làm sập trang.
      const errorMessage =
        err.message ||
        (err.code === 'INSUFFICIENT_INVENTORY'
          ? 'Số lượng xuất kho vượt quá số lượng tồn kho hiện tại!'
          : 'Không thể tạo phiếu xuất kho');

      setServerError(errorMessage);
      toast.error(errorMessage, 'Lỗi xuất kho vượt tồn kho (400 Bad Request)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* 1. Header Trang & Nút Hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inventory/issues')}
            className="p-2 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Lập chứng từ 3.4
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Xuất kho vật tư</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Lập Phiếu Xuất Kho Vật Tư
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/inventory/issues')}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!isFormValid || isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
          >
            <Save className={`w-4 h-4 mr-1.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            {isSubmitting ? 'Đang xuất kho...' : 'Lưu & Xuất Kho'}
          </Button>
        </div>
      </div>

      {/* Cảnh báo lỗi Nghiệp vụ từ Backend nếu có */}
      {serverError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Lỗi nghiệp vụ xuất kho (HTTP 400 Bad Request)
            </h4>
            <p className="text-xs font-medium text-rose-700 mt-0.5">{serverError}</p>
            <p className="text-[11px] text-rose-500 mt-1">
              Gợi ý: Vui lòng kiểm tra lại số lượng xuất và số lô hàng trong bảng chi tiết dưới đây để không vượt quá tồn kho thực tế.
            </p>
          </div>
        </div>
      )}

      {/* 2. Thông tin Chung (Master Details Header) */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-sm rounded-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-600" />
          1. Thông tin chung chứng từ xuất kho
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Trang trại */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trang trại áp dụng <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>

          {/* Kho xuất hàng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kho xuất hàng <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              required
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="">-- Chọn kho bãi xuất --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          {/* Loại xuất kho */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mục đích xuất kho <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.issueType}
              onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="INTERNAL_USE">Tiêu dùng nội bộ / Thường ngày</option>
              <option value="PRODUCTION_BACKFLUSH">Xuất cho sản xuất (Canh tác / Nuôi trồng)</option>
              <option value="SALE_FULFILLMENT">Xuất bán hàng thương mại</option>
              <option value="DAMAGE_DISPOSAL">Tiêu hủy / Hỏng hóc hết hạn</option>
              <option value="TRANSFER">Xuất điều chuyển sang kho khác</option>
            </select>
          </div>

          {/* Người nhận / Bộ phận */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Người nhận / Bộ phận nhận
            </label>
            <input
              type="text"
              placeholder="VD: Nguyễn Văn A - Đội SX 1"
              value={formData.receiverName}
              onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Ngày xuất kho */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày hạch toán xuất kho <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              required
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Mã phiếu xuất (Tùy chọn) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã chứng từ <span className="text-slate-400 font-normal">(Hệ thống tự sinh nếu để trống)</span>
            </label>
            <input
              type="text"
              placeholder="VD: PXK-20261017-001"
              value={formData.issueCode}
              onChange={(e) => setFormData({ ...formData, issueCode: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase font-mono"
            />
          </div>

          {/* Ghi chú */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú chứng từ
            </label>
            <input
              type="text"
              placeholder="Nhập ghi chú hoặc diễn giải lý do xuất kho..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>
      </Card>

      {/* 3. Bảng Động Chi tiết Vật tư Xuất Kho (Dynamic Items Table) */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-sm rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              2. Danh sách vật tư & số lô xuất kho ({items.length} mặt hàng)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hệ thống hỗ trợ gợi ý các lô còn hàng trong kho theo chiến lược FIFO / FEFO.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Thêm dòng xuất
          </Button>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[220px]">
                  Mặt hàng vật tư <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 min-w-[200px]">
                  Số lô xuất <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 w-32 text-right">
                  Số lượng xuất <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 w-32 text-right">
                  Đơn giá vốn xuất (đ)
                </th>
                <th className="py-2.5 px-3 w-36 text-right">Thành tiền (đ)</th>
                <th className="py-2.5 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const selectedMaterial = materials.find((m) => m.id === Number(item.materialId));
                const cacheKey = `${formData.warehouseId}_${item.materialId}`;
                const availableBatches = batchesCache[cacheKey] || [];

                const isOverStock =
                  item.availableQty !== null && Number(item.quantity) > Number(item.availableQty);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                      {index + 1}
                    </td>

                    {/* Chọn vật tư */}
                    <td className="py-2.5 px-3">
                      <select
                        value={item.materialId}
                        onChange={(e) => handleItemChange(item.id, 'materialId', e.target.value)}
                        required
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                      >
                        <option value="">-- Chọn mặt hàng --</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.skuCode}) [{m.standardUnit}]
                          </option>
                        ))}
                      </select>
                      {selectedMaterial && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          ĐVT: {selectedMaterial.standardUnit}
                        </p>
                      )}
                    </td>

                    {/* Chọn hoặc nhập số lô */}
                    <td className="py-2.5 px-3">
                      {availableBatches.length > 0 ? (
                        <div>
                          <select
                            value={item.batchNumber}
                            onChange={(e) => handleItemChange(item.id, 'batchNumber', e.target.value)}
                            required
                            className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          >
                            <option value="">-- Chọn lô còn hàng --</option>
                            {availableBatches.map((b) => (
                              <option key={b.id || b.batchNumber} value={b.batchNumber}>
                                Lô: {b.batchNumber} (Tồn: {Number(b.availableQuantity || b.quantityOnHand).toLocaleString('vi-VN')})
                              </option>
                            ))}
                          </select>
                          {item.availableQty !== null && (
                            <p className={`text-[10px] mt-0.5 font-medium ${isOverStock ? 'text-rose-600 font-bold' : 'text-emerald-600'}`}>
                              Tồn khả dụng: {item.availableQty.toLocaleString('vi-VN')}
                              {isOverStock && ' • Cảnh báo: Vượt tồn kho!'}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            placeholder="Nhập số lô cần xuất..."
                            value={item.batchNumber}
                            onChange={(e) => handleItemChange(item.id, 'batchNumber', e.target.value)}
                            required
                            className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Chưa tìm thấy gợi ý lô trong kho này
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Số lượng xuất */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        required
                        className={`w-full text-xs text-right font-bold border rounded-lg p-2 focus:outline-none focus:ring-2 ${
                          isOverStock
                            ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500/20 focus:border-rose-500'
                            : 'border-slate-200 bg-white text-slate-800 focus:ring-amber-500/20 focus:border-amber-500'
                        }`}
                      />
                    </td>

                    {/* Đơn giá vốn xuất */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="Tự động"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                        className="w-full text-xs text-right border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </td>

                    {/* Thành tiền */}
                    <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                      {formatCurrency(item.totalPrice)}
                    </td>

                    {/* Nút xóa dòng */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Xóa dòng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Tổng kết giá trị phiếu xuất */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500">
            Tổng cộng: <span className="font-bold text-slate-800">{items.length}</span> mặt hàng • Tổng số lượng:{' '}
            <span className="font-bold text-slate-800">{summary.totalQty.toLocaleString('vi-VN')}</span> đơn vị
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Tổng giá trị xuất kho:
            </span>
            <span className="text-base font-extrabold text-amber-600">
              {formatCurrency(summary.totalAmount)}
            </span>
          </div>
        </div>
      </Card>
    </form>
  );
};

export default IssueFormPage;
