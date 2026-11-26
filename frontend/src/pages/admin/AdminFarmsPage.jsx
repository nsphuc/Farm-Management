import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  Building2,
  ShieldAlert,
  Calendar,
  Lock,
  Unlock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Phone,
  User,
  X,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { platformAdminService } from '@/services/modules/platformAdminService';
import { toast } from '@/store/useToastStore';

// Mock Data 7 Trang trại trên nền tảng FarmGo
const INITIAL_FARMS = [
  {
    id: 'FARM-001',
    code: 'FARM-001',
    name: 'Trang trại Heo Hòa Bình',
    subdomain: 'hoabinh.farmgo.vn',
    ownerName: 'Nguyễn Văn An',
    ownerPhone: '0988.123.456',
    businessType: 'Cá nhân kinh doanh',
    scale: '2 Chi nhánh / 5 Nhân sự',
    enabledAddons: ['BRANCHES', 'PAYROLL'],
    expiredAt: '2027-12-15',
    status: 'ACTIVE', // ACTIVE, EXPIRING_SOON, LOCKED
    planType: 'Gói Cá nhân Tiêu chuẩn',
  },
  {
    id: 'FARM-002',
    code: 'FARM-042',
    name: 'Trại Gà Đồi Ba Vì',
    subdomain: 'bavi.farmgo.vn',
    ownerName: 'Trần Thị Bích',
    ownerPhone: '0977.234.567',
    businessType: 'Hộ kinh doanh',
    scale: '1 Chi nhánh / 4 Nhân sự',
    enabledAddons: ['BRANCHES'],
    expiredAt: '2027-01-20',
    status: 'ACTIVE',
    planType: 'Gói Cá nhân Tiêu chuẩn',
  },
  {
    id: 'FARM-003',
    code: 'FARM-019',
    name: 'Hợp tác xã Nông nghiệp Sông Đà',
    subdomain: 'songda.farmgo.vn',
    ownerName: 'Lê Hoàng Nam',
    ownerPhone: '0912.345.678',
    businessType: 'Doanh nghiệp chuỗi',
    scale: '3 Chi nhánh / 18 Nhân sự',
    enabledAddons: ['BRANCHES', 'FEED_MILL', 'UNLIMITED_USERS'],
    expiredAt: '2026-12-05',
    status: 'EXPIRING_SOON', // Dưới 30 ngày
    planType: 'Gói Hộ kinh doanh Nâng cao',
  },
  {
    id: 'FARM-004',
    code: 'FARM-033',
    name: 'Trang trại Chăn nuôi Heo Phú Thọ',
    subdomain: 'phutho.farmgo.vn',
    ownerName: 'Phạm Quốc Tuấn',
    ownerPhone: '0903.456.789',
    businessType: 'Cá nhân kinh doanh',
    scale: '1 Chi nhánh / 3 Nhân sự',
    enabledAddons: [],
    expiredAt: '2026-11-10',
    status: 'LOCKED', // Đã quá hạn
    planType: 'Gói Cá nhân Tiêu chuẩn',
  },
  {
    id: 'FARM-005',
    code: 'FARM-105',
    name: 'Nông trại Gà Ri Lạc Thủy',
    subdomain: 'lacthuy.farmgo.vn',
    ownerName: 'Vũ Minh Trí',
    ownerPhone: '0989.567.890',
    businessType: 'Hộ kinh doanh',
    scale: '1 Chi nhánh / 6 Nhân sự',
    enabledAddons: ['POULTRY_HATCHERY'],
    expiredAt: '2027-08-28',
    status: 'ACTIVE',
    planType: 'Gói Hộ kinh doanh Nâng cao',
  },
  {
    id: 'FARM-006',
    code: 'FARM-088',
    name: 'Trang trại Heo Đồng Nai Phát',
    subdomain: 'dongnaiphat.farmgo.vn',
    ownerName: 'Đỗ Hùng Cường',
    ownerPhone: '0938.678.901',
    businessType: 'Doanh nghiệp chuỗi',
    scale: '4 Chi nhánh / 25 Nhân sự',
    enabledAddons: ['BRANCHES', 'BREEDING', 'PAYROLL'],
    expiredAt: '2027-06-30',
    status: 'ACTIVE',
    planType: 'Gói Doanh nghiệp Toàn diện',
  },
  {
    id: 'FARM-007',
    code: 'FARM-071',
    name: 'Trại Heo Rừng Kỳ Sơn',
    subdomain: 'kyson.farmgo.vn',
    ownerName: 'Bùi Văn Hòa',
    ownerPhone: '0966.789.012',
    businessType: 'Cá nhân kinh doanh',
    scale: '1 Chi nhánh / 2 Nhân sự',
    enabledAddons: ['BREEDING'],
    expiredAt: '2027-02-15',
    status: 'ACTIVE',
    planType: 'Gói Cá nhân Tiêu chuẩn',
  },
];

// Mapping tên Addon Code sang nhãn hiển thị
const ADDON_NAMES = {
  BRANCHES: 'Đa chi nhánh',
  PAYROLL: 'Bảng lương KPI',
  CUSTOM_ROLES: 'Mở rộng vai trò',
  UNLIMITED_USERS: 'Không giới hạn NS',
  BREEDING: 'Thẻ tai & Nái',
  POULTRY_HATCHERY: 'Ấp nở & Trứng',
  FEED_MILL: 'Phối trộn cám',
};

export function AdminFarmsPage() {
  const [farms, setFarms] = useState(INITIAL_FARMS);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewMonths, setRenewMonths] = useState(6);
  const [renewReason, setRenewReason] = useState('Hỗ trợ kỹ thuật / Tri ân khách hàng');

  const fetchTenants = async () => {
    try {
      const data = await platformAdminService.getTenants();
      if (Array.isArray(data)) {
        const normalized = data.map((f) => ({
          ...f,
          status: String(f.status || 'ACTIVE').trim().toUpperCase(),
          enabledAddons: Array.isArray(f.enabledAddons) ? f.enabledAddons : [],
          subdomain: f.subdomain || `${(f.code || 'farm').toLowerCase().replace('-', '')}.farmgo.vn`,
          businessType: f.businessType || f.type || 'Cá nhân kinh doanh',
          scale: f.scale || `1 Chi nhánh / ${f.barnsCount || 1} Chuồng`,
          ownerPhone: f.ownerPhone || f.phone || '0912 888 999',
          planType: f.planType || f.tier || 'Gói Cá nhân Tiêu chuẩn',
          expiredAt: f.expiredAt || (f.expiresAt ? String(f.expiresAt).substring(0, 10) : '2027-12-31'),
        }));
        setFarms(normalized);
      }
    } catch (err) {
      console.warn('Could not load tenants from API', err);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // Lọc danh sách trang trại
  const filteredFarms = farms.filter((f) => {
    const matchKeyword =
      (f.name || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (f.code || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (f.ownerName || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (f.ownerPhone || f.phone || '').includes(searchKeyword);

    const matchType = filterType === 'ALL' || (f.businessType || f.type) === filterType;
    const matchStatus = filterStatus === 'ALL' || String(f.status || '').trim().toUpperCase() === filterStatus;

    return matchKeyword && matchType && matchStatus;
  });

  // Xử lý Khóa / Mở khóa
  const handleToggleLock = async (farmId) => {
    const target = farms.find((f) => f.id === farmId);
    if (!target) return;
    const nextStatus = target.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    try {
      await platformAdminService.updateTenantStatus(farmId, nextStatus, 'Thay đổi bởi Super Admin');
      setFarms((prev) =>
        prev.map((f) => (f.id === farmId ? { ...f, status: nextStatus } : f))
      );
      toast.success(
        nextStatus === 'LOCKED'
          ? `Đã khóa hoạt động của trang trại "${target.name}"`
          : `Đã mở khóa hoạt động cho trang trại "${target.name}"`
      );
    } catch (err) {
      toast.error('Lỗi cập nhật trạng thái trang trại');
    }
  };

  // Xử lý Gia hạn thủ công
  const handleConfirmRenew = async () => {
    if (!selectedFarm) return;
    try {
      const res = await platformAdminService.renewTenant(selectedFarm.id, renewMonths, renewReason);
      toast.success(`Đã gia hạn thành công thêm ${renewMonths} tháng cho trang trại "${selectedFarm.name}"!`);
      setIsRenewModalOpen(false);
      fetchTenants();
    } catch (err) {
      toast.error('Lỗi gia hạn trang trại');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Cảnh báo bảo mật */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Quản lý Danh sách Cơ sở Chăn nuôi</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {filteredFarms.length} / {farms.length} trang trại
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Quản trị thông tin hành chính, theo dõi hạn dùng gói cước và phân quyền dịch vụ mở rộng của từng trang trại.
          </p>
        </div>
      </div>

      {/* ========================================================
          BANNER NGUYÊN TẮC BẢO MẬT DỮ LIỆU
         ======================================================== */}
      <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 flex items-start gap-3.5 shadow-sm">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">Nguyên tắc Bảo mật & Quyền riêng tư khách hàng:</span>{' '}
          Super Admin chỉ quản lý hồ sơ gói cước và thông tin hành chính. Phần mềm <strong>tuyệt đối không cung cấp nút truy cập vào Sổ quỹ thu chi, Hóa đơn mua bán hay Nhật ký chuồng trại nội bộ</strong> của khách hàng để bảo vệ dữ liệu sản xuất kinh doanh theo chuẩn bảo mật SaaS.
        </div>
      </div>

      {/* ========================================================
          THANH TÌM KIẾM & BỘ LỌC
         ======================================================== */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Input Tìm kiếm */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Tên trang trại, Mã trại, SĐT chủ trại..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc Loại hình */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Loại hình:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Tất cả loại hình</option>
              <option value="Cá nhân kinh doanh">Cá nhân kinh doanh</option>
              <option value="Hộ kinh doanh">Hộ kinh doanh</option>
              <option value="Doanh nghiệp chuỗi">Doanh nghiệp chuỗi</option>
            </select>
          </div>

          {/* Lọc Trạng thái */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="EXPIRING_SOON">Sắp hết hạn (&lt; 30 ngày)</option>
              <option value="LOCKED">Tạm khóa / Hết hạn</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================
          BẢNG DANH SÁCH CƠ SỞ CHĂN NUÔI (TENANTS TABLE)
         ======================================================== */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700/80">
              <tr>
                <th className="py-3.5 px-4">Mã &amp; Tên Trang trại</th>
                <th className="py-3.5 px-4">Chủ sở hữu &amp; SĐT</th>
                <th className="py-3.5 px-4">Loại hình &amp; Quy mô</th>
                <th className="py-3.5 px-4">Dịch vụ mở rộng</th>
                <th className="py-3.5 px-4">Hạn dùng &amp; Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredFarms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">
                    Không tìm thấy trang trại nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredFarms.map((farm) => (
                  <tr key={farm.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* Cột 1: Mã & Tên trại */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{farm.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {farm.code} • {farm.subdomain}
                      </div>
                    </td>

                    {/* Cột 2: Chủ sở hữu & SĐT */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-200">{farm.ownerName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{farm.ownerPhone}</span>
                      </div>
                    </td>

                    {/* Cột 3: Loại hình & Quy mô */}
                    <td className="py-4 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {farm.businessType}
                      </span>
                      <div className="text-xs text-slate-400 mt-1">
                        {farm.scale}
                      </div>
                    </td>

                    {/* Cột 4: Dịch vụ mở rộng đang bật */}
                    <td className="py-4 px-4">
                      {(!farm.enabledAddons || farm.enabledAddons.length === 0) ? (
                        <span className="text-xs text-slate-500 italic">Chưa bật add-on</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(farm.enabledAddons || []).map((addon) => (
                            <span
                              key={addon}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            >
                              {ADDON_NAMES[addon] || addon}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Cột 5: Ngày hết hạn & Trạng thái */}
                    <td className="py-4 px-4">
                      <div className="text-xs font-mono text-slate-300">
                        HSD: {farm.expiredAt}
                      </div>
                      <div className="mt-1">
                        {farm.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Hoạt động</span>
                          </span>
                        )}
                        {farm.status === 'EXPIRING_SOON' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Sắp hết hạn</span>
                          </span>
                        )}
                        {farm.status === 'LOCKED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            <span>Tạm khóa</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cột 6: Thao tác */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Xem hồ sơ gói cước */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFarm(farm);
                            setIsViewModalOpen(true);
                          }}
                          title="Xem hồ sơ gói cước & dịch vụ"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Gia hạn thủ công */}
                        <button
                          onClick={() => {
                            setSelectedFarm(farm);
                            setIsRenewModalOpen(true);
                          }}
                          title="Gia hạn thủ công (Hỗ trợ kỹ thuật)"
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>

                        {/* Khóa / Mở khóa */}
                        <button
                          onClick={() => handleToggleLock(farm.id)}
                          title={farm.status === 'LOCKED' ? 'Mở khóa trang trại' : 'Tạm khóa trang trại'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            farm.status === 'LOCKED'
                              ? 'text-amber-400 hover:bg-amber-500/10'
                              : 'text-rose-400 hover:bg-rose-500/10'
                          }`}
                        >
                          {farm.status === 'LOCKED' ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL 1: XEM HỒ SƠ GÓI CƯỚC & DỊCH VỤ TRANG TRẠI
         ======================================================== */}
      {isViewModalOpen && selectedFarm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Hồ sơ Gói cước &amp; Dịch vụ
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedFarm.name} ({selectedFarm.code})
                </p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Gói cước cơ sở:</span>
                  <span className="font-semibold text-emerald-400">{selectedFarm.planType}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Hạn sử dụng hiện tại:</span>
                  <span className="font-mono text-white">{selectedFarm.expiredAt}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Tên miền phụ:</span>
                  <span className="font-mono text-indigo-400">{selectedFarm.subdomain}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Dịch vụ mở rộng đã kích hoạt ({((selectedFarm && selectedFarm.enabledAddons) || []).length}/6):
                </div>
                {((selectedFarm && selectedFarm.enabledAddons) || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Trang trại đang dùng các tính năng cốt lõi cơ bản.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {((selectedFarm && selectedFarm.enabledAddons) || []).map((addon) => (
                      <div
                        key={addon}
                        className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium">{ADDON_NAMES[addon] || addon}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300">
                💡 Khách hàng thanh toán gia hạn tự động qua VNPAY hoặc chuyển khoản VietQR được ghi nhận tức thì vào Sổ đối soát.
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL 2: GIA HẠN THỦ CÔNG (HỖ TRỢ KỸ THUẬT)
         ======================================================== */}
      {isRenewModalOpen && selectedFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Gia hạn dịch vụ thủ công
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedFarm.name} ({selectedFarm.code})
                </p>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Thời gian cộng thêm:
                </label>
                <select
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value={1}>+1 Tháng (Dùng thử / Hỗ trợ)</option>
                  <option value={3}>+3 Tháng (Hỗ trợ chuyển đổi)</option>
                  <option value={6}>+6 Tháng (Nửa năm)</option>
                  <option value={12}>+12 Tháng (1 năm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lý do gia hạn thủ công:
                </label>
                <input
                  type="text"
                  value={renewReason}
                  onChange={(e) => setRenewReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                Thao tác này sẽ cập nhật ngay ngày hết hạn của trang trại lên hệ thống và chuyển trạng thái về <strong>Hoạt động</strong>.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRenew}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                Xác nhận Gia hạn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFarmsPage;
