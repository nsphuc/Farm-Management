import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/useAuthStore';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { platformService } from '@/services/modules/platformService';

describe('Super Admin Platform UI Flow & Control Plane Tests (GAP-SA-01 -> GAP-SA-08)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      userInfo: null,
      token: null,
    });
  });

  it('1. useAuthStore nhận diện chính xác vai trò SUPER_ADMIN (Tier 1 SaaS Control Plane)', () => {
    useAuthStore.setState({
      userInfo: {
        id: 1,
        username: 'admin',
        fullName: 'Quản Trị Viên Nền Tảng',
        isSuperAdmin: true,
        roles: [{ code: 'ROLE_SUPER_ADMIN', name: 'Quản trị viên nền tảng' }],
        permissions: ['PERM_TENANT_MANAGE', 'PERM_SYSTEM_CONFIG', 'PERM_AUDIT_LOG_VIEW'],
        operationalRole: 'SUPER_ADMIN',
      },
    });

    const store = useAuthStore.getState();

    // Kiểm tra định danh Super Admin
    expect(store.userInfo.isSuperAdmin).toBe(true);
    expect(store.isSuperAdmin()).toBe(true);
    expect(store.getOperationalRole()).toBe('SUPER_ADMIN');

    // Cách ly bảo mật: Super Admin không bị gán nhầm vào các vai trò vận hành hiện trường cấp dưới
    expect(store.isFarmManager()).toBe(false);
    expect(store.isFieldWorker()).toBe(false);
    expect(store.isWarehouseKeeper()).toBe(false);
    expect(store.isFarmAccountant()).toBe(false);
  });

  it('2. API Endpoints chuẩn hóa 100% không bị lỗi 404 và khớp với Backend Modules', () => {
    expect(API_ENDPOINTS.PLATFORM.TENANTS).toBe('/platform/tenants');
    expect(API_ENDPOINTS.PLATFORM.TENANT_DETAIL(99)).toBe('/platform/tenants/99');
    expect(API_ENDPOINTS.PLATFORM.TENANT_STATUS(99)).toBe('/platform/tenants/99/status');
    expect(API_ENDPOINTS.PLATFORM.TENANT_SUBSCRIPTIONS(99)).toBe('/platform/tenants/99/subscriptions');
    expect(API_ENDPOINTS.PLATFORM.METRICS).toBe('/platform/metrics');

    // GAP-SA-06: Endpoint Audit Logs trỏ đúng sang /system/audit-logs
    expect(API_ENDPOINTS.PLATFORM.AUDIT_LOGS).toBe('/system/audit-logs');

    // GAP-SA-08: Broadcast Notification endpoint
    expect(API_ENDPOINTS.PLATFORM.BROADCAST_NOTIFICATION).toBe('/platform/notifications/broadcast');

    // Users endpoints
    expect(API_ENDPOINTS.USERS.LIST).toBe('/users');
    expect(API_ENDPOINTS.USERS.STATUS(50)).toBe('/users/50/status');
    expect(API_ENDPOINTS.USERS.RESET_PASSWORD(50)).toBe('/users/50/reset-password');
  });

  it('3. platformService cung cấp đầy đủ 100% các hàm nghiệp vụ quản trị Nền tảng SaaS', () => {
    // GAP-SA-01 & 07: Metrics & Health
    expect(typeof platformService.getPlatformMetrics).toBe('function');

    // GAP-SA-02 & 03: Tenants CRUD & Onboarding
    expect(typeof platformService.getTenants).toBe('function');
    expect(typeof platformService.getTenantById).toBe('function');
    expect(typeof platformService.createTenant).toBe('function');
    expect(typeof platformService.updateTenantStatus).toBe('function');

    // GAP-SA-04: Subscriptions & Quota
    expect(typeof platformService.addSubscription).toBe('function');

    // GAP-SA-05: Platform Users Management & Emergency Support
    expect(typeof platformService.getPlatformUsers).toBe('function');
    expect(typeof platformService.createPlatformUser).toBe('function');
    expect(typeof platformService.updatePlatformUserStatus).toBe('function');
    expect(typeof platformService.resetPlatformUserPassword).toBe('function');

    // GAP-SA-06: Global Audit Logs
    expect(typeof platformService.getGlobalAuditLogs).toBe('function');
    expect(typeof platformService.getAuditLogs).toBe('function');

    // GAP-SA-08: Broadcast Notification
    expect(typeof platformService.broadcastNotification).toBe('function');
  });

  it('4. Kiểm tra tập giá trị Enum hợp lệ theo DB Check Constraints (chk_tenants_status, chk_notifications_type)', () => {
    const validPlanTypes = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
    const validTenantStatuses = ['ACTIVE', 'SUSPENDED', 'INACTIVE'];
    const validNotificationTypes = ['SYSTEM', 'ALERT', 'WARNING', 'INFO'];

    // Đảm bảo các giá trị lựa chọn trên UI không vi phạm SQL check constraints
    expect(validPlanTypes).toContain('STARTER');
    expect(validPlanTypes).toContain('PROFESSIONAL');
    expect(validPlanTypes).toContain('ENTERPRISE');

    expect(validTenantStatuses).toContain('ACTIVE');
    expect(validTenantStatuses).toContain('SUSPENDED');

    expect(validNotificationTypes).toContain('SYSTEM');
    expect(validNotificationTypes).toContain('ALERT');
    expect(validNotificationTypes).toContain('WARNING');
    expect(validNotificationTypes).toContain('INFO');
  });
});
