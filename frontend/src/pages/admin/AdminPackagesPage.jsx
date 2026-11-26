import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Layers,
  PackageCheck,
  CheckCircle2,
  Edit3,
  DollarSign,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Building2,
  Calculator,
  Users,
  Activity,
  Egg,
  Factory,
  Save,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { platformAdminService } from '@/services/modules/platformAdminService';
import { toast } from '@/store/useToastStore';

// Cấu hình ban đầu của Gói cơ bản
const INITIAL_CORE_PACKAGE = {
  name: 'Gói Cá nhân Tiêu chuẩn (Starter)',
  yearlyPrice: 500000,
  maxUsers: 3,
  maxBranches: 1,
  dataRetentionYears: 2,
  description:
    'Gói nền tảng mặc định dành cho trang trại chăn nuôi gia súc/gia cầm độc lập. Mở sẵn 10 chức năng cốt lõi: Khu nuôi, Nhật ký Mobile, Kho FEFO, Bán hàng VietQR, Sổ quỹ.',
  isActive: true,
};

// Cấu hình ban đầu của 6 Dịch vụ mở rộng (Add-ons)
const INITIAL_ADDONS = [
  {
    id: 'BRANCHES',
    name: 'Quản lý Đa chi nhánh (Multi-branch)',
    icon: Building2,
    badge: 'Chuỗi trại',
    price6Months: 650000,
    price1Year: 1200000,
    activeSubscribers: 48,
    isAvailable: true,
    description:
      'Chuyển đổi linh hoạt giữa nhiều cơ sở (Trại Heo Hòa Bình, Trại Gà Ba Vì...). So sánh chéo hệ số FCR và hiệu quả kinh tế chuỗi trại.',
  },
  {
    id: 'PAYROLL',
    name: 'Bảng lương & Chấm công KPI',
    icon: Calculator,
    badge: 'Nhân sự nâng cao',
    price6Months: 450000,
    price1Year: 800000,
    activeSubscribers: 32,
    isAvailable: true,
    description:
      'Tính lương chuyên cần, thưởng chỉ số FCR xuất chuồng đạt chuẩn, tự động khấu trừ các khoản tạm ứng khi xuất bán toàn lứa.',
  },
  {
    id: 'CUSTOM_ROLES',
    name: 'Mở rộng Vai trò & Phân quyền tùy chỉnh',
    icon: Users,
    badge: 'Phân quyền nâng cao',
    price6Months: 550000,
    price1Year: 1000000,
    activeSubscribers: 19,
    isAvailable: true,
    description:
      'Tạo không giới hạn vai trò tùy chỉnh theo ma trận quyền chi tiết cho từng phòng ban và gán linh hoạt cho nhân sự trang trại.',
  },
  {
    id: 'BREEDING',
    name: 'Gia súc Sinh sản & Quản lý Thẻ tai',
    icon: Activity,
    badge: 'Heo nái & Thẻ tai',
    price6Months: 850000,
    price1Year: 1500000,
    activeSubscribers: 27,
    isAvailable: true,
    description:
      'Quản lý phả hệ nái/đực giống, chu kỳ phối giống, siêu âm mang thai, lịch đẻ và quản lý số tai điện tử cá thể RFID/QR.',
  },
  {
    id: 'POULTRY_HATCHERY',
    name: 'Gia cầm Đẻ trứng & Ấp nở',
    icon: Egg,
    badge: 'Lò ấp & Trứng',
    price6Months: 750000,
    price1Year: 1300000,
    activeSubscribers: 15,
    isAvailable: true,
    description:
      'Theo dõi tỷ lệ đẻ trứng hàng ngày, tỷ lệ trứng có cồ, giám sát nhiệt độ máy ấp nở tự động và xuất bán con giống 01 ngày tuổi.',
  },
  {
    id: 'FEED_MILL',
    name: 'Sản xuất phối trộn cám (Feed Mill)',
    icon: Factory,
    badge: 'Cám phối trộn',
    price6Months: 900000,
    price1Year: 1600000,
    activeSubscribers: 21,
    isAvailable: true,
    description:
      'Quản lý công thức phối trộn thức ăn chăn nuôi (ngô, đỗ tương, cám gạo, khoáng vi lượng), hạch toán giá thành 1 kg cám tự chế.',
  },
];

export function AdminPackagesPage() {
  const [corePackage, setCorePackage] = useState(INITIAL_CORE_PACKAGE);
  const [addons, setAddons] = useState(INITIAL_ADDONS);

  // Modal Sửa Gói Cơ bản
  const [isCoreModalOpen, setIsCoreModalOpen] = useState(false);
  const [editingCore, setEditingCore] = useState({ ...corePackage });

  // Modal Sửa Add-on
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);

  const formatVnd = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const fetchPackages = async () => {
    try {
      const data = await platformAdminService.getPackages();
      if (Array.isArray(data) && data.length > 0) {
        const core = data.find((p) => p.packageCode === 'CORE');
        if (core) {
          setCorePackage((prev) => ({
            ...prev,
            name: core.name,
            yearlyPrice: Number(core.yearlyPrice),
            halfYearPrice: Number(core.halfYearPrice),
            description: core.description,
            isActive: core.isActive,
          }));
        }

        const addonItems = data.filter((p) => p.packageCode !== 'CORE');
        if (addonItems.length > 0) {
          setAddons((prev) =>
            prev.map((ad) => {
              const matched = addonItems.find(
                (p) => String(p.packageCode || '').toUpperCase() === String(ad.id || '').toUpperCase()
              );
              if (matched) {
                const p6 = Number(matched.halfYearPrice ?? ad.price6Months);
                const p12 = Number(matched.yearlyPrice ?? ad.price1Year);
                return {
                  ...ad,
                  name: matched.name || ad.name,
                  category: matched.category || ad.category,
                  price6Months: p6,
                  price1Year: p12,
                  halfYearPrice: p6,
                  yearlyPrice: p12,
                  description: matched.description || ad.description,
                  isAvailable: matched.isActive ?? ad.isAvailable,
                };
              }
              return ad;
            })
          );
        }
      }
    } catch (err) {
      console.warn('Could not load packages from API', err);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Toggle Bật/Tắt Kinh doanh Add-on
  const handleToggleAddon = async (id) => {
    const target = addons.find((a) => a.id === id);
    if (!target) return;
    const nextAvailable = !target.isAvailable;
    try {
      await platformAdminService.updatePackage(id, { isActive: nextAvailable });
      setAddons((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isAvailable: nextAvailable } : item))
      );
      toast.success(`Đã ${nextAvailable ? 'mở bán' : 'tạm dừng kinh doanh'} Add-on "${target.name}"`);
    } catch (err) {
      toast.error('Lỗi cập nhật trạng thái Add-on');
    }
  };

  // Lưu Gói cơ bản
  const handleSaveCore = async (e) => {
    e.preventDefault();
    try {
      await platformAdminService.updatePackage('CORE', {
        name: editingCore.name,
        yearlyPrice: editingCore.yearlyPrice,
        halfYearPrice: editingCore.halfYearPrice || 300000,
        description: editingCore.description,
        isActive: editingCore.isActive,
      });
      setCorePackage({ ...editingCore });
      setIsCoreModalOpen(false);
      toast.success('Đã cập nhật bảng giá Gói Tiêu chuẩn thành công!');
    } catch (err) {
      toast.error('Lỗi lưu bảng giá Gói Tiêu chuẩn');
    }
  };

  // Lưu Chỉnh sửa Add-on
  const handleSaveAddon = async (e) => {
    e.preventDefault();
    if (!editingAddon) return;
    try {
      const p6 = Number(editingAddon.price6Months) || 0;
      const p12 = Number(editingAddon.price1Year) || 0;
      await platformAdminService.updatePackage(editingAddon.id, {
        name: editingAddon.name,
        yearlyPrice: p12,
        halfYearPrice: p6,
        description: editingAddon.description,
        isActive: editingAddon.isAvailable,
      });
      setAddons((prev) =>
        prev.map((item) =>
          item.id === editingAddon.id
            ? { ...editingAddon, price6Months: p6, price1Year: p12, halfYearPrice: p6, yearlyPrice: p12 }
            : item
        )
      );
      setIsAddonModalOpen(false);
      toast.success(`Đã cập nhật bảng giá Add-on "${editingAddon.name}" thành công!`);
    } catch (err) {
      toast.error('Lỗi lưu bảng giá Add-on');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Quản lý Bảng giá Gói cước &amp; Add-ons</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              VNPAY Integrated
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cấu hình bảng giá niêm yết, chu kỳ dịch vụ và trạng thái kinh doanh hiển thị tại Tab Kho ứng dụng của các Chủ trang trại.
          </p>
        </div>
      </div>

      {/* ========================================================
          KHỐI A: GÓI NỀN TẢNG CƠ BẢN
         ======================================================== */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{corePackage.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Gói mặc định kích hoạt
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mở sẵn 10 phân hệ nghiệp vụ cốt lõi không tính thêm phí
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400">Giá niêm yết:</div>
              <div className="text-xl font-black text-emerald-400">
                {formatVnd(corePackage.yearlyPrice)}{' '}
                <span className="text-xs font-normal text-slate-400">/ năm</span>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingCore({ ...corePackage });
                setIsCoreModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa gói cơ bản</span>
            </button>
          </div>
        </div>

        {/* Thông số giới hạn & Danh sách mở sẵn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Giới hạn tài khoản:</span>
            <span className="text-sm font-semibold text-white">
              Tối đa {corePackage.maxUsers} nhân sự
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Số cơ sở chăn nuôi:</span>
            <span className="text-sm font-semibold text-white">
              {corePackage.maxBranches} cơ sở độc lập
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Thời gian lưu trữ dữ liệu:</span>
            <span className="text-sm font-semibold text-white">
              {corePackage.dataRetentionYears} năm liên tục
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="font-semibold text-slate-300">Mô tả tính năng:</span>{' '}
          {corePackage.description}
        </p>
      </div>

      {/* ========================================================
          KHỐI B: BẢNG CẤU HÌNH 6 DỊCH VỤ MỞ RỘNG (ADD-ONS)
         ======================================================== */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Bảng Cấu hình 6 Dịch vụ Mở rộng (Add-ons App Store)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Quản lý mức giá 6 tháng / 1 năm và gạt công tắc mở bán dịch vụ cho toàn bộ khách hàng
            </p>
          </div>
        </div>

        {/* Lưới 6 Add-ons Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((addon) => {
            const Icon = addon.icon;
            return (
              <div
                key={addon.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  addon.isAvailable
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/60 border-slate-900 opacity-60'
                }`}
              >
                <div>
                  {/* Top Card: Icon, Badge & Switch */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {addon.badge}
                      </span>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleAddon(addon.id)}
                      title={addon.isAvailable ? 'Đang mở bán (Click để dừng bán)' : 'Đang tạm dừng (Click để mở bán)'}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {addon.isAvailable ? (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <span>Mở bán</span>
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <span>Tạm dừng</span>
                          <ToggleLeft className="w-6 h-6 text-slate-600" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Name & Desc */}
                  <div className="mt-3">
                    <h3 className="font-bold text-white text-sm">{addon.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {addon.description}
                    </p>
                  </div>

                  {/* Pricing Display */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Gói 6 tháng:</span>
                      <span className="font-bold text-slate-200">
                        {formatVnd(addon.price6Months)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Gói 1 năm (Tiết kiệm):</span>
                      <span className="font-bold text-emerald-400">
                        {formatVnd(addon.price1Year)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Stats & Edit Button */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Đang kích hoạt:{' '}
                    <strong className="text-white">{addon.activeSubscribers} trại</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddon({ ...addon });
                      setIsAddonModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:text-white hover:bg-indigo-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa giá</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          MODAL 1: SỬA GÓI CƠ BẢN
         ======================================================== */}
      {isCoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveCore}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Chỉnh sửa Gói Nền tảng Cơ bản</h3>
              <button
                type="button"
                onClick={() => setIsCoreModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tên gói:</label>
                <input
                  type="text"
                  value={editingCore.name}
                  onChange={(e) => setEditingCore({ ...editingCore, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Giá niêm yết 1 năm (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={editingCore.yearlyPrice}
                    onChange={(e) =>
                      setEditingCore({ ...editingCore, yearlyPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Giới hạn nhân sự tối đa:
                  </label>
                  <input
                    type="number"
                    value={editingCore.maxUsers}
                    onChange={(e) =>
                      setEditingCore({ ...editingCore, maxUsers: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mô tả gói:</label>
                <textarea
                  rows={3}
                  value={editingCore.description}
                  onChange={(e) =>
                    setEditingCore({ ...editingCore, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCoreModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL 2: SỬA ĐƠN GIÁ & MÔ TẢ ADD-ON
         ======================================================== */}
      {isAddonModalOpen && editingAddon && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleSaveAddon}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                Chỉnh sửa Dịch vụ Mở rộng
              </h3>
              <button
                type="button"
                onClick={() => setIsAddonModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tên dịch vụ:</label>
                <input
                  type="text"
                  value={editingAddon.name || ''}
                  onChange={(e) => setEditingAddon({ ...editingAddon, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Đơn giá 6 tháng (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={editingAddon.price6Months ?? 0}
                    onChange={(e) =>
                      setEditingAddon({
                        ...editingAddon,
                        price6Months: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Đơn giá 1 năm (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={editingAddon.price1Year ?? 0}
                    onChange={(e) =>
                      setEditingAddon({
                        ...editingAddon,
                        price1Year: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mô tả tính năng:</label>
                <textarea
                  rows={3}
                  value={editingAddon.description || ''}
                  onChange={(e) =>
                    setEditingAddon({ ...editingAddon, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddonModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Cập nhật bảng giá</span>
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminPackagesPage;
