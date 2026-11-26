import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  Bell, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Package, 
  DollarSign, 
  Users, 
  Building2, 
  ClipboardEdit, 
  ShoppingCart, 
  CreditCard,
  Sparkles,
  Info,
  LogOut
} from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/FormControls';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { userInfo, setAuth, accessToken: token, logout } = useAuthStore();
  const { setActiveFarmId, setAccessibleFarms } = useActiveFarmStore();

  // Mode: 'WELCOME' (Ảnh 1) | 'WIZARD' (Ảnh 2, 3, 4, Thanh toán)
  const [viewMode, setViewMode] = useState('WELCOME');
  const [currentStep, setCurrentStep] = useState(1); // 1: Đăng ký, 2: Chọn dịch vụ, 3: Thanh toán

  // Search facilities modal (Ảnh 1 - Box 2)
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  // Modal xem hóa đơn / danh sách dịch vụ (Ảnh 5)
  const [showServiceListModal, setShowServiceListModal] = useState(false);

  // Step 1 Form State (Ảnh 2 & 3)
  const [formData, setFormData] = useState({
    province: 'Đồng Nai',
    ward: 'Phường Long Bình',
    facilityType: 'Cá nhân kinh doanh', // Tập trung vào Cá nhân kinh doanh
    businessName: '',
    taxCode: '',
    domainSlug: '',
    livestockSector: 'Gia súc', // 'Gia súc' | 'Gia cầm'
    livestockType: 'Heo thịt',  // 'Heo thịt' | 'Gia cầm thịt'
  });

  // Step 2 Form State (Ảnh 4)
  const [pricingPlan, setPricingPlan] = useState('STANDARD'); // 'STANDARD' | 'CUSTOM'
  const [managerAccountsCount, setManagerAccountsCount] = useState(1);
  const [subscriptionYears, setSubscriptionYears] = useState(1);

  // Step 3 Form State (Thanh toán)
  const [paymentMethod, setPaymentMethod] = useState('DEMO'); // 'TRANSFER' | 'VNPAY' | 'DEMO'
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  // Danh sách tỉnh thành & xã phường mẫu phổ biến chăn nuôi
  const provinces = [
    'Đồng Nai',
    'Bình Dương',
    'Bình Phước',
    'Long An',
    'Hà Nội',
    'Bắc Giang',
    'Thái Bình',
    'Thanh Hóa',
    'Nghệ An',
    'Lâm Đồng',
    'Đắk Lắk',
  ];

  const wardsByProvince = {
    'Đồng Nai': ['Xã Cẩm Đường', 'Xã Gia Tân', 'Phường Long Bình', 'Xã Hố Nai 3', 'Xã Xuân Tây'],
    'Bình Phước': ['Xã Tân Lập', 'Xã Đồng Tâm', 'Phường Tân Phú', 'Xã Minh Hưng'],
    'Bình Dương': ['Xã An Lập', 'Phường Chánh Mỹ', 'Xã Minh Hòa', 'Xã Tân Hiệp'],
    'Long An': ['Xã Mỹ Hạnh Bắc', 'Xã Đức Hòa Đông', 'Thị trấn Bến Lức'],
    'Hà Nội': ['Xã Ba Trại', 'Xã Thụy An', 'Xã Cổ Đông', 'Xã Kim Lũ'],
  };

  const currentWards = wardsByProvince[formData.province] || ['Xã Trung Tâm', 'Phường 1', 'Xã Nông Nghiệp'];

  // Tính toán báo giá tự động
  const calculatePrice = () => {
    // 2.650.000đ cho 1 tài khoản/1 năm tiêu chuẩn; giảm 10% khi chọn từ 2 năm trở lên
    const basePricePerYear = 2650000;
    const additionalAccountFee = (managerAccountsCount - 1) * 500000;
    const discountRate = subscriptionYears >= 2 ? 0.9 : 1;
    const total = Math.round((basePricePerYear + additionalAccountFee) * subscriptionYears * discountRate);
    return total.toLocaleString('vi-VN') + 'đ';
  };

  // Cập nhật lĩnh vực & loại vật nuôi
  const handleSectorChange = (sector) => {
    setFormData((prev) => ({
      ...prev,
      livestockSector: sector,
      livestockType: sector === 'Gia súc' ? 'Heo thịt' : 'Gia cầm thịt',
    }));
  };

  // Tìm kiếm cơ sở chăn nuôi
  const handleSearch = async () => {
    try {
      setSearching(true);
      const res = await axios.get('/api/v1/user/livestock-facilities/search', {
        params: { query: searchQuery.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data || []);
    } catch (err) {
      toast.error('Lỗi khi tìm kiếm cơ sở chăn nuôi');
    } finally {
      setSearching(false);
    }
  };

  // Gửi yêu cầu tham gia
  const handleJoin = async (farmId) => {
    try {
      setJoiningId(farmId);
      await axios.post(
        `/api/v1/user/livestock-facilities/join?farmId=${farmId}&notes=Xin tham gia làm việc`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã gửi yêu cầu tham gia đến Chủ cơ sở thành công!');
      setShowSearchModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi yêu cầu');
    } finally {
      setJoiningId(null);
    }
  };

  // Bước 3: Tạo cơ sở chăn nuôi & kích hoạt Demo (Nhiệm vụ 7)
  const handleActivateDemo = async () => {
    if (!formData.businessName.trim()) {
      toast.error('Vui lòng nhập tên cơ sở chăn nuôi');
      setCurrentStep(1);
      return;
    }

    try {
      setIsCreatingDemo(true);

      const payload = {
        province: formData.province,
        ward: formData.ward,
        facilityType: formData.facilityType === 'Doanh nghiệp' ? 'BUSINESS' : 'INDIVIDUAL',
        businessName: formData.businessName.trim(),
        taxCode: formData.facilityType === 'Cá nhân kinh doanh' ? null : formData.taxCode,
        managementDomain: formData.domainSlug ? `https://id.farmgo.vn/${formData.domainSlug}` : null,
        livestockSector: formData.livestockSector === 'Gia súc' ? 'LIVESTOCK' : 'POULTRY',
        livestockType: formData.livestockType === 'Heo thịt' ? 'PIG_MEAT' : 'POULTRY_MEAT',
        subscriptionTier: pricingPlan,
        managerAccountsCount: Number(managerAccountsCount),
        subscriptionDurationYears: Number(subscriptionYears),
        isDemo: true,
      };

      const res = await axios.post('/api/v1/user/livestock-facilities/demo', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newFacility = res.data;
      toast.success(`Khởi tạo thành công cơ sở chăn nuôi demo: ${newFacility.name}!`);

      // Cập nhật store active farm
      setActiveFarmId(newFacility.id);
      setAccessibleFarms([newFacility]);

      // Điều hướng thẳng vào dashboard quản lý chăn nuôi
      setTimeout(() => {
        navigate('/app', { replace: true });
      }, 500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Khởi tạo cơ sở chăn nuôi demo thất bại';
      toast.error(msg);
    } finally {
      setIsCreatingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Top Header (Khớp Ảnh 1) */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-2xs gap-2">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <span className="font-bold text-teal-700 text-xs sm:text-sm border-b-2 border-teal-600 pb-1 cursor-pointer whitespace-nowrap">
            Danh sách cơ sở
          </span>
          <span className="text-slate-500 text-xs sm:text-sm hover:text-slate-700 cursor-pointer whitespace-nowrap">
            Hóa đơn dịch vụ
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Notification Icon */}
          <div className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 cursor-pointer">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
              1
            </span>
          </div>

          {/* User Account Info */}
          <div className="flex items-center gap-2 pl-1">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 font-bold text-xs shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {userInfo?.fullName || 'Tài khoản'}
              </span>
              <span className="text-[10px] text-slate-500">Tài Khoản</span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout?.();
              navigate('/login', { replace: true });
            }}
            title="Đăng xuất"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8">
        {viewMode === 'WELCOME' ? (
          /* ========================================================================= */
          /* MÀN HÌNH 1: BẠN ĐANG KHÔNG CÓ TRANG TRẠI ĐỂ HOẠT ĐỘNG (KHỚP CHUẨN ẢNH 1)   */
          /* ========================================================================= */
          <div className="space-y-6 pt-4 animate-in fade-in duration-200">
            {/* Banner Thông Báo */}
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs sm:text-sm font-semibold text-blue-800 shadow-2xs">
              <Info className="h-5 w-5 shrink-0 text-blue-600" />
              <span>Bạn đang không có trang trại để hoạt động!</span>
            </div>

            {/* Ô 1: Tạo cơ sở chăn nuôi của riêng bạn */}
            <div
              onClick={() => {
                setViewMode('WIZARD');
                setCurrentStep(1);
              }}
              className="cursor-pointer group rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center transition-all hover:border-teal-600 hover:bg-teal-50/30 hover:shadow-md"
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-teal-700 flex items-center gap-2">
                  <span className="text-xl">➕</span> Tạo một cơ sở chăn nuôi của riêng bạn
                </span>
                <p className="text-xs text-slate-500">
                  <strong>Lưu ý:</strong> Mỗi tài khoản chỉ được tạo 1 cơ sở chăn nuôi.
                </p>
              </div>
            </div>

            {/* Divider "Hoặc" */}
            <div className="text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Hoặc
              </span>
            </div>

            {/* Ô 2: Tìm cơ sở chăn nuôi để tham gia */}
            <div
              onClick={() => {
                setShowSearchModal(true);
                handleSearch();
              }}
              className="cursor-pointer group rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 hover:shadow-md"
            >
              <div className="flex items-center justify-center space-y-2">
                <span className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-blue-700 flex items-center gap-2">
                  <span className="text-xl">🔍</span> Tìm cơ sở chăn nuôi để tham gia.
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MÀN HÌNH WIZARD 3 BƯỚC: TẠO CƠ SỞ CHĂN NUÔI (KHỚP CHUẨN ẢNH 2, 3, 4, 5)     */
          /* ========================================================================= */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
            {/* Top Navigation Back Link */}
            <button
              type="button"
              onClick={() => setViewMode('WELCOME')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Danh sách cơ sở</span>
            </button>

            {/* 3-Step Wizard Stepper (Khớp Ảnh 2, 3, 4) */}
            <div className="flex items-center justify-center max-w-md mx-auto">
              {/* Step 1: Đăng ký */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep > 1
                      ? 'bg-teal-600 text-white'
                      : currentStep === 1
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentStep > 1 ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <span className={`text-[11px] font-bold mt-1.5 ${currentStep === 1 ? 'text-teal-700' : 'text-slate-500'}`}>
                  Đăng ký
                </span>
              </div>

              {/* Connecting Line 1-2 */}
              <div className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors ${currentStep >= 2 ? 'bg-teal-600' : 'bg-slate-200'}`} />

              {/* Step 2: Chọn dịch vụ */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep > 2
                      ? 'bg-teal-600 text-white'
                      : currentStep === 2
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentStep > 2 ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <span className={`text-[11px] font-bold mt-1.5 ${currentStep === 2 ? 'text-teal-700' : 'text-slate-500'}`}>
                  Chọn dịch vụ
                </span>
              </div>

              {/* Connecting Line 2-3 */}
              <div className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors ${currentStep >= 3 ? 'bg-teal-600' : 'bg-slate-200'}`} />

              {/* Step 3: Thanh toán */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep === 3
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  3
                </div>
                <span className={`text-[11px] font-bold mt-1.5 ${currentStep === 3 ? 'text-teal-700' : 'text-slate-500'}`}>
                  Thanh toán
                </span>
              </div>
            </div>

            {/* BƯỚC 1: ĐĂNG KÝ CƠ SỞ CHĂN NUÔI (KHỚP ẢNH 2 & ẢNH 3) */}
            {currentStep === 1 && (
              <div className="space-y-6 pt-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Tỉnh thành phố */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tỉnh thành phố *
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          province: e.target.value,
                          ward: (wardsByProvince[e.target.value] || ['Xã Trung Tâm'])[0],
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      {provinces.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Xã phường */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Xã phường *
                    </label>
                    <select
                      value={formData.ward}
                      onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      {currentWards.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Loại hình */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Loại hình *
                    </label>
                    <select
                      value={formData.facilityType}
                      onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="Cá nhân kinh doanh">Cá nhân kinh doanh (Được khuyến nghị)</option>
                      <option value="Hộ kinh doanh">Hộ kinh doanh</option>
                      <option value="Doanh nghiệp">Doanh nghiệp</option>
                      <option value="Hợp tác xã">Hợp tác xã</option>
                    </select>
                  </div>

                  {/* Tên theo loại hình (Đổi động: Tên Cá nhân kinh doanh * hoặc Tên Cơ sở *) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {formData.facilityType === 'Cá nhân kinh doanh'
                        ? 'Tên Cá nhân kinh doanh *'
                        : 'Tên Cơ sở *'}
                    </label>
                    <Input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder={
                        formData.facilityType === 'Cá nhân kinh doanh'
                          ? 'Ví dụ: Trại Heo Thịt Sĩ Phúc'
                          : 'Ví dụ: Công ty TNHH Chăn Nuôi Phú Sơn'
                      }
                      className="text-xs"
                    />
                  </div>

                  {/* Mã số thuế: ẨN NẾU LÀ CÁ NHÂN KINH DOANH (KHỚP ẢNH 3) */}
                  {formData.facilityType !== 'Cá nhân kinh doanh' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mã số thuế *
                      </label>
                      <Input
                        type="text"
                        value={formData.taxCode}
                        onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                        placeholder="Nhập 10 hoặc 13 số MST"
                        className="text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* Domain quản lý */}
                  <div className={formData.facilityType === 'Cá nhân kinh doanh' ? 'sm:col-span-1' : ''}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Domain quản lý *
                    </label>
                    <div className="flex rounded-lg border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                      <span className="inline-flex items-center px-3 bg-slate-100 text-slate-500 text-xs border-r border-slate-300">
                        https://id.farmgo.vn/
                      </span>
                      <input
                        type="text"
                        value={formData.domainSlug}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            domainSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                          })
                        }
                        placeholder="traiheosiphuc"
                        className="flex-1 px-3 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Lĩnh vực chăn nuôi (Radio options: Gia súc, Gia cầm) */}
                  <div className="sm:col-span-2 pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Lĩnh vực chăn nuôi *
                    </label>
                    <div className="flex flex-wrap gap-5 text-xs font-medium text-slate-700">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="livestockSector"
                          checked={formData.livestockSector === 'Gia súc'}
                          onChange={() => handleSectorChange('Gia súc')}
                          className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                        />
                        <span>Gia súc</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="livestockSector"
                          checked={formData.livestockSector === 'Gia cầm'}
                          onChange={() => handleSectorChange('Gia cầm')}
                          className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                        />
                        <span>Gia cầm</span>
                      </label>
                    </div>
                  </div>

                  {/* Loại vật nuôi (Lọc động theo lĩnh vực) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Loại vật nuôi *
                    </label>
                    <select
                      value={formData.livestockType}
                      onChange={(e) => setFormData({ ...formData, livestockType: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      {formData.livestockSector === 'Gia súc' ? (
                        <>
                          <option value="Heo thịt">Heo thịt</option>
                          <option value="Bò thịt">Bò thịt</option>
                        </>
                      ) : (
                        <>
                          <option value="Gia cầm thịt">Gia cầm thịt (Gà thịt, Vịt thịt)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Nút Tiếp theo */}
                <div className="pt-6 flex justify-end">
                  <Button
                    onClick={() => {
                      if (!formData.businessName.trim()) {
                        toast.error('Vui lòng nhập tên cơ sở chăn nuôi');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg"
                  >
                    Tiếp theo ➔
                  </Button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: CHỌN DỊCH VỤ (KHỚP ẢNH 4 & ẢNH 5) */}
            {currentStep === 2 && (
              <div className="space-y-6 pt-2 animate-in fade-in duration-150">
                <div className="space-y-4">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Chọn Bảng Giá
                  </label>

                  {/* Card Tiêu Chuẩn (Khớp Ảnh 4) */}
                  <div
                    onClick={() => setPricingPlan('STANDARD')}
                    className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                      pricingPlan === 'STANDARD'
                        ? 'border-teal-600 bg-teal-50/20 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="pricingPlan"
                          checked={pricingPlan === 'STANDARD'}
                          onChange={() => setPricingPlan('STANDARD')}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm font-bold text-slate-900">Tiêu chuẩn</span>
                      </div>

                      {/* Link Xem Hóa Đơn (Mở Popup Ảnh 5) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowServiceListModal(true);
                        }}
                        className="text-xs font-bold text-teal-700 hover:text-teal-800 underline"
                      >
                        Xem hóa đơn
                      </button>
                    </div>

                    <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>Các tính năng <strong>phổ biến</strong>.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>Dành cho mô hình chăn nuôi - trang trại.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>Dễ dàng nâng cấp các tính năng khi có nhu cầu.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Card Tùy Chỉnh */}
                  <div
                    onClick={() => setPricingPlan('CUSTOM')}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                      pricingPlan === 'CUSTOM'
                        ? 'border-teal-600 bg-teal-50/20 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="pricingPlan"
                        checked={pricingPlan === 'CUSTOM'}
                        onChange={() => setPricingPlan('CUSTOM')}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm font-bold text-slate-700">Tùy chỉnh</span>
                    </div>
                  </div>
                </div>

                {/* Form Số tài khoản & Thời hạn (Khớp Ảnh 4) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số tài khoản quản lý
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={managerAccountsCount}
                      onChange={(e) => setManagerAccountsCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-xs"
                    />
                    <p className="mt-1 text-[11px] text-slate-400 italic">
                      Hãy lựa chọn số người tham gia quản lý trang trại của bạn trên phần mềm.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chọn thời hạn
                    </label>
                    <select
                      value={subscriptionYears}
                      onChange={(e) => setSubscriptionYears(parseInt(e.target.value) || 1)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value={1}>1 Năm</option>
                      <option value={2}>2 Năm (Tiết kiệm 10%)</option>
                      <option value={3}>3 Năm (Tiết kiệm 20%)</option>
                    </select>
                  </div>
                </div>

                {/* Báo giá hiển thị màu đỏ (Khớp Ảnh 4) */}
                <div className="pt-2 text-right">
                  <span className="text-base sm:text-lg font-black text-rose-600">
                    Báo giá: {calculatePrice()}
                  </span>
                </div>

                {/* Nút Hành Động Bước 2 */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-semibold text-slate-700"
                  >
                    ⮌ Quay lại
                  </Button>

                  <Button
                    onClick={() => setCurrentStep(3)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg"
                  >
                    Tiếp theo (chưa thanh toán) ➔
                  </Button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: THANH TOÁN & TRẢI NGHIỆM DEMO (NHIỆM VỤ 7) */}
            {currentStep === 3 && (
              <div className="space-y-6 pt-2 animate-in fade-in duration-150">
                <div className="space-y-4">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Phương Thức Thanh Toán
                  </label>

                  {/* Option 1: Chuyển khoản (Disabled) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 opacity-60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="radio" disabled className="h-4 w-4 text-slate-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Chuyển khoản ngân hàng</span>
                        <span className="text-[10px] text-slate-400">Đang nâng cấp hệ thống đối soát</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold">Tạm dừng</span>
                  </div>

                  {/* Option 2: VNPay (Disabled) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 opacity-60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="radio" disabled className="h-4 w-4 text-slate-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Cổng thanh toán VNPay</span>
                        <span className="text-[10px] text-slate-400">Thanh toán qua ví điện tử / Thẻ ATM</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold">Sắp ra mắt</span>
                  </div>

                  {/* Option 3: Yêu cầu được trải nghiệm demo trước (Option chính) */}
                  <div
                    onClick={() => setPaymentMethod('DEMO')}
                    className="rounded-2xl border-2 border-teal-600 bg-teal-50/30 p-5 cursor-pointer shadow-xs ring-2 ring-teal-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'DEMO'}
                          onChange={() => setPaymentMethod('DEMO')}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            Yêu cầu được trải nghiệm demo trước
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                              Miễn phí 30 ngày
                            </span>
                          </span>
                          <span className="text-xs text-slate-500 mt-0.5">
                            Kích hoạt ngay trang trại mẫu với đầy đủ đàn vật nuôi, chuồng trại và kho cám.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nút Trải nghiệm Demo nổi bật (Nhiệm vụ 7) */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-200 text-center space-y-4">
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-teal-950">
                      Sẵn Sàng Trải Nghiệm Nền Tảng Chăn Nuôi FarmGo
                    </h4>
                    <p className="text-xs text-slate-600">
                      Cơ sở <strong>{formData.businessName || 'Trang Trại Của Bạn'}</strong> sẽ được tự động kích hoạt.
                    </p>
                  </div>

                  <Button
                    size="lg"
                    isLoading={isCreatingDemo}
                    onClick={handleActivateDemo}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm px-8 py-3 rounded-xl shadow-md shadow-teal-600/30"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Trải Nghiệm Demo Ngay
                  </Button>
                </div>

                {/* Nút Quay lại Bước 2 */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-semibold text-slate-700"
                  >
                    ⮌ Quay lại
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: DANH SÁCH DỊCH VỤ (KHỚP 100% ẢNH 5)                                */}
      {/* ========================================================================= */}
      {showServiceListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Danh sách dịch vụ
              </h3>
              <button
                type="button"
                onClick={() => setShowServiceListModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Grid 8 Thẻ Dịch Vụ (Khớp 100% Ảnh 5) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* 1. Khu nuôi */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex gap-3.5 items-start">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Khu nuôi</span>
                  <span className="text-[11px] font-bold text-teal-600">Miễn phí</span>
                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    Thiết lập hạ tầng nuôi the...
                  </span>
                </div>
              </div>

              {/* 2. Ghi nhật ký */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex gap-3.5 items-start">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <ClipboardEdit className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Ghi nhật ký</span>
                  <span className="text-[11px] font-bold text-blue-600">430.000đ</span>
                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    Nhật ký chăn nuôi và giao...
                  </span>
                </div>
              </div>

              {/* 3. Quản lý tồn kho */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex gap-3.5 items-start">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Quản lý tồn kho</span>
                  <span className="text-[11px] font-bold text-teal-600">Miễn phí</span>
                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    Quản lý hàng hóa tồn kho.
                  </span>
                </div>
              </div>

              {/* 4. Tài khoản nhân công */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex gap-3.5 items-start">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-lime-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Tài khoản nhân công</span>
                  <span className="text-[11px] font-bold text-blue-600">500.000đ/Tài khoản/Năm</span>
                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    Quản lý nhân công.
                  </span>
                </div>
              </div>

              {/* 5. Xuất nhập nội bộ */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex gap-3.5 items-start">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Xuất nhập nội bộ</span>
                  <span className="text-[11px] font-bold text-blue-600">430.000đ/Năm</span>
                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    Luân chuyển, xuất nhập h...
                  </span>
                </div>
              </div>

              {/* 6. Quản lý sổ quỹ */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex gap-3.5 items-start">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Quản lý sổ quỹ</span>
                  <span className="text-[11px] font-bold text-blue-600">430.000đ/Năm</span>
                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    Sổ quỹ và các phiếu thu chi.
                  </span>
                </div>
              </div>

              {/* 7. Quản lý nhập hàng */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex gap-3.5 items-start">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Quản lý nhập hàng</span>
                  <span className="text-[11px] font-bold text-blue-600">430.000đ/Năm</span>
                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    Quản lý các hóa đơn nhập...
                  </span>
                </div>
              </div>

              {/* 8. Quản lý bán hàng */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex gap-3.5 items-start">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Quản lý bán hàng</span>
                  <span className="text-[11px] font-bold text-blue-600">430.000đ/Năm</span>
                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    Quản lý bán hàng và thu h...
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowServiceListModal(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2 rounded-lg border-0"
              >
                Đóng lại
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TÌM CƠ SỞ CHĂN NUÔI ĐỂ THAM GIA (ẢNH 1 - Ô 2)                     */}
      {/* ========================================================================= */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Search className="h-4 w-4 text-teal-600" />
                Tìm Cơ Sở Chăn Nuôi Để Tham Gia
              </h3>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nhập tên trang trại hoặc tỉnh thành..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="text-xs"
              />
              <Button
                onClick={handleSearch}
                isLoading={searching}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0"
              >
                Tìm kiếm
              </Button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  {searching ? 'Đang tìm kiếm...' : 'Không tìm thấy trang trại nào phù hợp.'}
                </p>
              ) : (
                searchResults.map((farm) => (
                  <div key={farm.id} className="pt-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{farm.name}</h4>
                      <p className="text-[11px] text-slate-500">{farm.address || farm.province || 'Việt Nam'}</p>
                    </div>
                    <Button
                      size="sm"
                      isLoading={joiningId === farm.id}
                      onClick={() => handleJoin(farm.id)}
                      className="text-[11px] bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                    >
                      Xin tham gia
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OnboardingPage;
