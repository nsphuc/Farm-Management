/**
 * RBAC & PERMISSION TYPES DEFINITIONS
 * Strictly adhering to: .antigravity/rules/roles-permissions.md
 * ONLY 6 ALLOWED ROLES IN SYSTEM - NO NEW ROLES ALLOWED
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'FARM_OWNER'
  | 'FIELD_STAFF'
  | 'WAREHOUSE_STAFF'
  | 'TECHNICAL_STAFF'
  | 'ACCOUNTANT';

export type RoleWithPrefix = `ROLE_${UserRole}`;

export type StandardAction =
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'
  | 'IMPORT'
  | 'GENERATE_QR'
  | 'PRINT_LABEL';

export const ALL_ROLES: readonly UserRole[] = [
  'SUPER_ADMIN',
  'FARM_OWNER',
  'FIELD_STAFF',
  'WAREHOUSE_STAFF',
  'TECHNICAL_STAFF',
  'ACCOUNTANT',
] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Quản trị hệ thống (Super Admin)',
  FARM_OWNER: 'Chủ trang trại (Farm Owner)',
  FIELD_STAFF: 'Nhân viên hiện trường (Field Staff)',
  WAREHOUSE_STAFF: 'Thủ kho (Warehouse Staff)',
  TECHNICAL_STAFF: 'Kỹ thuật viên / QC (Technical Staff)',
  ACCOUNTANT: 'Kế toán viên (Accountant)',
};

export interface CurrentUser {
  id: number;
  tenantId?: number;
  username: string;
  email?: string;
  fullName: string;
  status: string;
  role: UserRole;
  roles: string[];
  normalizedRoles?: UserRole[];
  permissions?: string[];
}

export interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  badge?: string;
  badgeColor?: string;
  description?: string;
}
