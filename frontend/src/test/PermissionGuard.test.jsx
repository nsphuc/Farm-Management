import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PermissionGuard } from '@/app/guards/PermissionGuard';
import { useAuthStore } from '@/store/useAuthStore';

describe('PermissionGuard (RBAC + Add-on Feature Gating)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('blocks staff without required permission (RBAC-01)', () => {
    useAuthStore.getState().setAuth('tok', {
      id: 6,
      roles: [{ code: 'ROLE_BARN_WORKER' }],
      permissions: ['dashboard.view', 'barns.view'],
      farmAddOnSubscriptions: [],
    });

    render(
      <MemoryRouter>
        <PermissionGuard permission="cashbook.view">
          <div>Secret Cashbook</div>
        </PermissionGuard>
      </MemoryRouter>
    );

    expect(screen.queryByText('Secret Cashbook')).not.toBeInTheDocument();
    expect(screen.getByText('Không có quyền truy cập')).toBeInTheDocument();
  });

  it('blocks Owner when Add-on is not subscribed (SAAS-03)', () => {
    useAuthStore.getState().setAuth('tok', {
      id: 11,
      roles: [{ code: 'ROLE_FARM_OWNER' }],
      permissions: [],
      farmAddOnSubscriptions: [{ addonCode: 'BREEDING', status: 'ACTIVE', isEnabled: true }],
    });

    render(
      <MemoryRouter>
        <PermissionGuard permission="payroll.view" addonCode="PAYROLL">
          <div>Payroll Module</div>
        </PermissionGuard>
      </MemoryRouter>
    );

    expect(screen.queryByText('Payroll Module')).not.toBeInTheDocument();
    expect(screen.getByText('Gói dịch vụ mở rộng chưa kích hoạt')).toBeInTheDocument();
  });

  it('allows Owner when Add-on is ACTIVE', () => {
    useAuthStore.getState().setAuth('tok', {
      id: 11,
      roles: [{ code: 'ROLE_FARM_OWNER' }],
      permissions: [],
      farmAddOnSubscriptions: [{ addonCode: 'BREEDING', status: 'ACTIVE', isEnabled: true }],
    });

    render(
      <MemoryRouter>
        <PermissionGuard permission="breeding.view" addonCode="BREEDING">
          <div>Breeding Module</div>
        </PermissionGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Breeding Module')).toBeInTheDocument();
  });
});
