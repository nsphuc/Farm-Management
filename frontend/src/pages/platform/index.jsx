import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building,
  CreditCard,
  Activity,
  Plus,
  RefreshCw,
  ShieldAlert,
  Layers,
  Sparkles,
  FileSearch,
  Users,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { platformService } from '@/services/modules/platformService';
import { PlatformExecutiveCards } from './components/PlatformExecutiveCards';
import { TenantsConsole } from './components/TenantsConsole';
import { SubscriptionsConsole } from './components/SubscriptionsConsole';
import { PlatformUsersConsole } from './components/PlatformUsersConsole';
import { PlatformHealthConsole } from './components/PlatformHealthConsole';
import { PlatformAuditLogsConsole } from './components/PlatformAuditLogsConsole';
import { CreateTenantModal } from './components/CreateTenantModal';
import { UpgradeSubscriptionModal } from './components/UpgradeSubscriptionModal';
import { TenantDetailDrawer } from './components/TenantDetailDrawer';
import { BroadcastNotificationModal } from './components/BroadcastNotificationModal';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

/**
 * Platform Dashboard & SaaS Control Plane - Dành riêng ROLE_SUPER_ADMIN (Cấp 1)
 */
export function PlatformDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Xác định tab hiện tại dựa trên route hoặc state
  const getTabFromPath = () => {
    const p = location.pathname;
    if (p.includes('/subscriptions')) return 'subscriptions';
    if (p.includes('/users')) return 'users';
    if (p.includes('/health')) return 'health';
    if (p.includes('/audit-logs')) return 'audit';
    return 'tenants';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [metrics, setMetrics] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { syncTrigger, notifyDataChanged } = useActiveFarmStore();

  // Modals & Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [upgradeTargetTenant, setUpgradeTargetTenant] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedDrawerTenant, setSelectedDrawerTenant] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // Cập nhật tab khi đổi route URL
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'subscriptions') navigate('/platform/subscriptions');
    else if (tabId === 'users') navigate('/platform/users');
    else if (tabId === 'health') navigate('/platform/health');
    else if (tabId === 'audit') navigate('/platform/audit-logs');
    else navigate('/platform/tenants');
  };

  // Fetch metrics & tenants list
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [metricsRes, tenantsRes] = await Promise.all([
        platformService.getPlatformMetrics().catch((err) => {
          console.warn('Failed to load platform metrics:', err);
          return null;
        }),
        platformService.getTenants({ size: 100 }).catch((err) => {
          console.warn('Failed to load tenants list:', err);
          return { content: [] };
        }),
      ]);

      if (metricsRes) setMetrics(metricsRes);
      const tenantList = Array.isArray(tenantsRes?.content)
        ? tenantsRes.content
        : Array.isArray(tenantsRes)
        ? tenantsRes
        : [];
      setTenants(tenantList);
    } catch (err) {
      console.error('Fetch platform data error:', err);
      toast.error('Không thể tải dữ liệu quản trị nền tảng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, syncTrigger?.all]);

  // Handler mở modal nâng cấp
  const handleOpenUpgradeModal = (tenant) => {
    setUpgradeTargetTenant(tenant);
    setIsUpgradeModalOpen(true);
  };

  // Handler xem chi tiết drawer
  const handleSelectTenant = (tenant) => {
    setSelectedDrawerTenant(tenant);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Quản Trị Nền Tảng SaaS (Platform Control Plane)
            </h1>
            <span className="rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2.5 py-0.5 border border-rose-300">
              Tier 1 • Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Không gian độc quyền của ROLE_SUPER_ADMIN. Cách ly 100% dữ liệu nông nghiệp nội bộ của các Tenant.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={<Radio className="h-4 w-4 text-rose-600 animate-pulse" />}
            onClick={() => setIsBroadcastModalOpen(true)}
            className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold"
          >
            Phát Thông Báo
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchData}
            title="Đồng bộ lại toàn bộ số liệu nền tảng"
          >
            Đồng Bộ
          </Button>

          <Button
            type="button"
            variant="danger"
            size="md"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 font-bold shadow-md shadow-rose-600/20"
          >
            + Khởi Tạo Khách Thuê Mới
          </Button>
        </div>
      </div>

      {/* EXECUTIVE KPI CARDS */}
      <PlatformExecutiveCards metrics={metrics} isLoading={isLoading} />

      {/* TAB NAVIGATION PILLS */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'tenants', label: '1. Khách Thuê Doanh Nghiệp (Tenants)', icon: Building },
          { id: 'subscriptions', label: '2. Gói Dịch Vụ & Hạn Mức (Subscriptions)', icon: CreditCard },
          { id: 'users', label: '3. Tài Khoản & Chủ Đầu Tư (Users)', icon: Users },
          { id: 'health', label: '4. Giám Sát Hạ Tầng & Máy Chủ (Health)', icon: Activity },
          { id: 'audit', label: '5. Sổ Cái Kiểm Toán Toàn Cầu (Audit Logs)', icon: FileSearch },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-rose-600 text-rose-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CONSOLE VIEW TƯƠNG ỨNG */}
      {activeTab === 'tenants' && (
        <TenantsConsole
          tenants={tenants}
          isLoading={isLoading}
          onRefresh={fetchData}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenUpgradeModal={handleOpenUpgradeModal}
          onSelectTenant={handleSelectTenant}
        />
      )}

      {activeTab === 'subscriptions' && (
        <SubscriptionsConsole
          tenants={tenants}
          isLoading={isLoading}
          onRefresh={fetchData}
          onOpenUpgradeModal={handleOpenUpgradeModal}
        />
      )}

      {activeTab === 'users' && (
        <PlatformUsersConsole
          tenants={tenants}
        />
      )}

      {activeTab === 'health' && (
        <PlatformHealthConsole
          metrics={metrics}
          isLoading={isLoading}
          onRefresh={fetchData}
        />
      )}

      {activeTab === 'audit' && (
        <PlatformAuditLogsConsole />
      )}

      {/* MODAL 1: KHỞI TẠO KHÁCH THUÊ MỚI + OWNER ACCOUNT */}
      <CreateTenantModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* MODAL 2: NÂNG CẤP & GIA HẠN GÓI CƯỚC */}
      <UpgradeSubscriptionModal
        isOpen={isUpgradeModalOpen}
        onClose={() => {
          setIsUpgradeModalOpen(false);
          setUpgradeTargetTenant(null);
        }}
        tenant={upgradeTargetTenant}
        onSuccess={fetchData}
      />

      {/* DRAWER: CHI TIẾT DOANH NGHIỆP */}
      <TenantDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDrawerTenant(null);
        }}
        tenant={selectedDrawerTenant}
        onOpenUpgradeModal={handleOpenUpgradeModal}
        onToggleStatus={async (tenant) => {
          const isSuspended = tenant.status === 'SUSPENDED';
          const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
          try {
            await platformService.updateTenantStatus(tenant.id, { status: newStatus });
            toast.success(`Đã cập nhật trạng thái doanh nghiệp thành công!`);
            setIsDrawerOpen(false);
            fetchData();
          } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái');
          }
        }}
      />
      {/* MODAL 3: PHÁT THÔNG BÁO DIỆN RỘNG */}
      <BroadcastNotificationModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        tenants={tenants}
        onSuccess={fetchData}
      />
    </div>
  );
}

export default PlatformDashboardPage;
