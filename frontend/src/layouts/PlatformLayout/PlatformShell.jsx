import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Building,
  Shield,
  CreditCard,
  Activity,
  FileText,
  LogOut,
  Users,
  Server,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { authService } from '../../services/auth/authService';

/**
 * PlatformShell: Khung làm việc độc lập chuyên biệt cho ROLE_SUPER_ADMIN (SYSTEM Scope).
 * Quyết định kiến trúc D-01:
 * - Ẩn hoàn toàn toàn bộ Sidebar tác nghiệp của trang trại (Kho, Nhật ký canh tác, Đàn vật nuôi...).
 * - Chỉ tập trung vào Quản trị Khách hàng thuê (Tenants), Gói thuê bao (Subscriptions), Sức khỏe dịch vụ và Audit hệ thống.
 * - Quyền hạn cấp phép duy nhất: PERM_TENANT_MANAGE.
 */
export const PlatformShell = () => {
  const { user, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('tenants');
  const [searchTerm, setSearchTerm] = useState('');

  // Nếu không phải Super Admin thì từ chối và đẩy về giao diện AppShell thông thường
  if (!user?.roles?.includes('ROLE_SUPER_ADMIN')) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      window.location.href = '/login';
    }
  };

  // Mock dữ liệu Tenants để hiển thị trên Platform Console
  const tenants = [
    {
      id: 1,
      code: 'TNT_GREENFARM',
      name: 'Hợp Tác Xã Nông Trại Xanh',
      subdomain: 'greenfarm.saas.local',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      farmsCount: 4,
      usersCount: 28,
      createdAt: '2026-01-15',
    },
    {
      id: 2,
      code: 'TNT_MEKONGAGRI',
      name: 'Tập đoàn Nông nghiệp Mekong Organic',
      subdomain: 'mekong.saas.local',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      farmsCount: 12,
      usersCount: 145,
      createdAt: '2026-02-01',
    },
    {
      id: 3,
      code: 'TNT_HIGHLANDTEA',
      name: 'HTX Chè & Cà Phê Cao Nguyên',
      subdomain: 'highlandtea.saas.local',
      plan: 'PRO',
      status: 'ACTIVE',
      farmsCount: 2,
      usersCount: 16,
      createdAt: '2026-03-10',
    },
  ];

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-wide text-white">Farm SaaS Platform</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-700 font-semibold">
                SYSTEM SCOPE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Bảng điều khiển Quản trị Toàn Nền tảng (Platform Console)</p>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{user?.fullName || 'Super Administrator'}</p>
            <p className="text-[10px] text-indigo-400 font-mono">ROLE_SUPER_ADMIN • PERM_TENANT_MANAGE</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 hover:border-rose-800/80 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Platform Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-4 space-y-6 shrink-0 hidden md:block">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-3 px-3">
              Quản trị Nền tảng SaaS
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('tenants')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'tenants'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Khách hàng Thuê (Tenants)</span>
              </button>

              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'subscriptions'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Gói Dịch Vụ (Subscriptions)</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'audit'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Nhật ký Kiểm toán (Audit Logs)</span>
              </button>

              <button
                onClick={() => setActiveTab('health')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'health'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Sức khỏe Hệ thống (Health)</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Nền tảng Hoạt động</span>
              </div>
              <p className="text-[11px] text-slate-400">
                MySQL 8.x • Flyway V1.5 • Spring Boot 3.3.4
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                <span>DB Engine:</span>
                <span className="text-slate-200">InnoDB utf8mb4</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Tổng Doanh nghiệp (Tenants)</span>
                <Building className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span>100% Hoạt động bình thường</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Tổng Trang trại (Farms)</span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">18</p>
              <p className="text-[11px] text-slate-400">Trên toàn hệ thống</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Tổng Tài khoản Hoạt động</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">189</p>
              <p className="text-[11px] text-slate-400">Được cấp phát qua RBAC</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Tình trạng Nền tảng</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">HEALTHY</p>
              <p className="text-[11px] text-slate-400">Uptime: 99.98%</p>
            </div>
          </div>

          {/* Tenants Section */}
          {activeTab === 'tenants' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Danh sách Khách hàng Thuê (Tenants)</h2>
                  <p className="text-xs text-slate-400">
                    Quản lý danh sách các Hợp tác xã, Doanh nghiệp sử dụng phần mềm (Yêu cầu PERM_TENANT_MANAGE)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm doanh nghiệp..."
                      className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer">
                    <Plus className="w-4 h-4" />
                    <span>Cấp mới Doanh nghiệp</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">Mã Tenant</th>
                        <th className="py-3 px-4">Tên Doanh nghiệp</th>
                        <th className="py-3 px-4">Subdomain</th>
                        <th className="py-3 px-4">Gói Dịch vụ</th>
                        <th className="py-3 px-4">Quy mô Trang trại</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredTenants.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-indigo-300">
                            {t.code}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-100">{t.name}</span>
                            <p className="text-[10px] text-slate-500">Khởi tạo: {t.createdAt}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">{t.subdomain}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                              {t.plan}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {t.farmsCount} Trang trại • {t.usersCount} Tài khoản
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
                              Chi tiết
                            </button>
                            <button className="px-2.5 py-1 rounded-lg text-[11px] bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800">
                              Cấu hình Gói
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Quản lý Gói Dịch vụ SaaS (Subscription Tiers)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="font-bold text-base text-slate-100">STARTER</h3>
                  <p className="text-2xl font-bold text-white">1.500.000 <span className="text-xs text-slate-400 font-normal">VNĐ / tháng</span></p>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li>• Tối đa 1 Trang trại</li>
                    <li>• Tối đa 10 Tài khoản nhân sự</li>
                    <li>• Phân hệ Canh tác & Kho bãi cơ bản</li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/50 space-y-4 shadow-lg shadow-indigo-500/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-indigo-300">PRO (Phổ biến)</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-700 font-bold">HOT</span>
                  </div>
                  <p className="text-2xl font-bold text-white">4.500.000 <span className="text-xs text-slate-400 font-normal">VNĐ / tháng</span></p>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li>• Tối đa 5 Trang trại</li>
                    <li>• Tối đa 50 Tài khoản nhân sự</li>
                    <li>• Kho bãi FIFO/FEFO + QR Truy xuất</li>
                    <li>• Kế toán chi phí & Công nợ</li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="font-bold text-base text-purple-300">ENTERPRISE</h3>
                  <p className="text-2xl font-bold text-white">9.900.000 <span className="text-xs text-slate-400 font-normal">VNĐ / tháng</span></p>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li>• Không giới hạn Trang trại</li>
                    <li>• Không giới hạn Tài khoản</li>
                    <li>• Toàn bộ 6 Workspaces hợp nhất</li>
                    <li>• Hỗ trợ kỹ thuật 24/7 SLA 99.9%</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Nhật ký Kiểm toán Toàn hệ thống (Platform Audit Trail)</h2>
              <p className="text-xs text-slate-400">
                Lưu vết 100% mọi sự kiện đăng nhập, cấp tài khoản, đổi quyền và thay đổi cấu hình đa khách hàng.
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                <p className="text-emerald-400">[2026-10-17 19:40:12] [AUTH_LOGIN] User 'admin' logged in from IP 127.0.0.1 (ROLE_SUPER_ADMIN)</p>
                <p className="text-indigo-400">[2026-10-17 19:35:45] [TENANT_PROVISION] Tenant 'TNT_GREENFARM' updated subscription plan to ENTERPRISE</p>
                <p className="text-slate-400">[2026-10-17 19:22:10] [RBAC_AUDIT] Role ROLE_TECHNICAL_STAFF verified without PERM_QC_APPROVE (DEC-02)</p>
              </div>
            </div>
          )}

          {/* System Health Tab */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Sức khỏe Dịch vụ & Cơ sở Hạ tầng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <p className="font-bold text-slate-200">Backend API Services</p>
                  <div className="flex justify-between text-slate-400">
                    <span>Spring Boot Framework:</span>
                    <span className="text-emerald-400 font-semibold">3.3.4 (UP)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>REST Security:</span>
                    <span className="text-emerald-400 font-semibold">JWT Bearer Stateless</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Session Mechanism:</span>
                    <span className="text-slate-200">HttpOnly Refresh Token Cookie</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <p className="font-bold text-slate-200">Database Engine</p>
                  <div className="flex justify-between text-slate-400">
                    <span>MySQL Server:</span>
                    <span className="text-emerald-400 font-semibold">8.x InnoDB (UP)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Flyway Migration Version:</span>
                    <span className="text-slate-200 font-mono">V1_5 (Password Force Change)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tenant Isolation:</span>
                    <span className="text-emerald-400 font-semibold">ACTIVE (The Farm Barrier Guard)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PlatformShell;
