import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/useAuthStore';
import { getSidebarMenuConfig } from '@/shells/TenantAppShell/menuConfig';

describe('Zone Manager Role Unit & Flow Tests (TASK 1 / 2)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      userInfo: null,
      token: null,
    });
  });

  it('1. useAuthStore nhận diện chính xác vai trò ZONE_MANAGER và không bị rơi vào FIELD_WORKER hay TECHNICAL_LEAD', () => {
    useAuthStore.setState({
      userInfo: {
        id: 99,
        username: 'zone_manager',
        roles: [{ code: 'ROLE_FIELD_STAFF', name: 'Nhân viên hiện trường' }],
        permissions: ['PERM_FARM_VIEW', 'PERM_CROP_VIEW', 'PERM_CROP_LOG', 'PERM_HARVEST_MANAGE', 'PERM_HR_ATTENDANCE', 'PERM_TASK_ASSIGN'],
        farmAssignments: [
          {
            id: 10,
            farmId: 1,
            zoneId: 1,
            roleInFarm: 'ZONE_MANAGER',
            isActive: true,
          },
        ],
        accessibleFarms: [
          {
            farmId: 1,
            assignedRole: 'ZONE_MANAGER',
            isManager: false,
          },
        ],
        operationalRole: 'ZONE_MANAGER',
      },
    });

    const store = useAuthStore.getState();

    expect(store.isZoneManager()).toBe(true);
    expect(store.hasFarmRole('ZONE_MANAGER')).toBe(true);
    expect(store.hasFarmRole('ZONE_MANAGER', 1)).toBe(true);
    expect(store.hasFarmRole('ZONE_MANAGER', 999)).toBe(false);

    // Đảm bảo không bị nhận diện nhầm là Technical Lead hay Field Worker
    expect(store.isTechnicalLead()).toBe(false);
    expect(store.isFieldWorker()).toBe(false);
    expect(store.isOwner()).toBe(false);
    expect(store.isFarmManager()).toBe(false);

    // Operational role
    expect(store.getOperationalRole()).toBe('ZONE_MANAGER');

    // Operational role info
    const roleInfo = store.getOperationalRoleInfo();
    expect(roleInfo.code).toBe('ZONE_MANAGER');
    expect(roleInfo.title).toBe('Trưởng Phân Khu / Tổ Trưởng Hiện Trường');
    expect(roleInfo.shortTitle).toBe('Trưởng Phân Khu');
    expect(roleInfo.canProxyAttendance).toBe(true);
    expect(roleInfo.canSkipAttendance).toBe(false);
    expect(roleInfo.isFarmLocked).toBe(true);
  });

  it('2. getSidebarMenuConfig("ZONE_MANAGER") trả về đúng 3 Workspaces cốt lõi (WS-G, WS-A, WS-E) và không có independentModules', () => {
    const config = getSidebarMenuConfig('ZONE_MANAGER');

    expect(config.sectionTitle).toBe('Bàn Chỉ Huy Phân Khu & Tổ Trưởng');
    expect(config.workspaces).toHaveLength(3);

    const workspaceIds = config.workspaces.map((w) => w.id);
    expect(workspaceIds).toContain('G_EmployeeDailyOps');
    expect(workspaceIds).toContain('A_Geography');
    expect(workspaceIds).toContain('E_FarmingOps');

    // Không chứa WS-C hay WS-F của Kỹ sư kỹ thuật/KCS
    expect(workspaceIds).not.toContain('C_InventoryHub');
    expect(workspaceIds).not.toContain('F_QaTraceability');

    // Không có independent modules
    expect(config.independentModules).toEqual([]);

    // Kiểm tra nhãn và badge đúng chuẩn
    const wsG = config.workspaces.find((w) => w.id === 'G_EmployeeDailyOps');
    expect(wsG.label).toBe('WS-G: Điểm Danh Tổ & Điều Phối Việc');
    expect(wsG.badge).toBe('Tổ trưởng');

    const wsA = config.workspaces.find((w) => w.id === 'A_Geography');
    expect(wsA.label).toBe('WS-A: Sơ Đồ Phân Khu & Nhân Sự Tổ');
    expect(wsA.badge).toBe('Phân khu');

    const wsE = config.workspaces.find((w) => w.id === 'E_FarmingOps');
    expect(wsE.label).toBe('WS-E: Nhật Ký Canh Tác & Thu Hoạch Khu');
    expect(wsE.badge).toBe('Sản xuất');
  });

  it('3. Khi không có farm_assignments ZONE_MANAGER, tài khoản ROLE_FIELD_STAFF vẫn là FIELD_WORKER', () => {
    useAuthStore.setState({
      userInfo: {
        id: 3,
        username: 'staff',
        roles: [{ code: 'ROLE_FIELD_STAFF', name: 'Nhân viên hiện trường' }],
        permissions: ['PERM_FARM_VIEW', 'PERM_CROP_VIEW', 'PERM_CROP_LOG', 'PERM_HARVEST_MANAGE', 'PERM_HR_ATTENDANCE'],
        farmAssignments: [
          {
            id: 11,
            farmId: 1,
            zoneId: 1,
            roleInFarm: 'FIELD_WORKER',
            isActive: true,
          },
        ],
        accessibleFarms: [
          {
            farmId: 1,
            assignedRole: 'FIELD_WORKER',
            isManager: false,
          },
        ],
        operationalRole: 'FIELD_WORKER',
      },
    });

    const store = useAuthStore.getState();
    expect(store.isZoneManager()).toBe(false);
    expect(store.isFieldWorker()).toBe(true);
    expect(store.getOperationalRole()).toBe('FIELD_WORKER');
  });
});

