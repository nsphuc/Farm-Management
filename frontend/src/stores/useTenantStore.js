import { create } from 'zustand';

const STORAGE_KEY = 'farmsaas_current_tenant_id';

const getInitialTenantId = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  } catch {
    return null;
  }
};

export const useTenantStore = create((set, get) => ({
  currentTenantId: getInitialTenantId(),
  currentTenant: null,
  tenants: [],

  setCurrentTenant: (tenant) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(tenant.id));
    } catch {
      // ignore storage error
    }
    set({
      currentTenant: tenant,
      currentTenantId: tenant.id,
    });
  },

  setCurrentTenantId: (tenantId) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(tenantId));
    } catch {
      // ignore
    }
    const matchingTenant = get().tenants.find((t) => t.id === tenantId) || null;
    set({
      currentTenantId: tenantId,
      currentTenant: matchingTenant,
    });
  },

  setTenants: (tenants) => {
    const currentId = get().currentTenantId;
    let matching = null;
    if (currentId) {
      matching = tenants.find((t) => t.id === currentId) || null;
    }
    // If no current tenant is selected but list is not empty, pick the first
    if (!matching && tenants.length > 0) {
      matching = tenants[0];
      try {
        localStorage.setItem(STORAGE_KEY, String(matching.id));
      } catch {
        // ignore
      }
    }

    set({
      tenants,
      currentTenant: matching,
      currentTenantId: matching ? matching.id : null,
    });
  },

  clearTenant: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({
      currentTenantId: null,
      currentTenant: null,
      tenants: [],
    });
  },
}));
