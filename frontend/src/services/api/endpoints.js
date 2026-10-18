/**
 * Centralized API endpoints registry for Agri-ERP
 * Khớp 100% với Hợp đồng REST API & DTO (07-master-api-dto-contracts.md)
 */
export const API_ENDPOINTS = {
  // 1. Auth & Profile
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/auth/me',
    MY_PERMISSIONS: '/auth/me/permissions',
  },

  // 2. Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },

  // 3. Platform (Super Admin)
  PLATFORM: {
    TENANTS: '/platform/tenants',
    TENANT_DETAIL: (id) => `/platform/tenants/${id}`,
    SUBSCRIPTIONS: '/platform/subscriptions',
    METRICS: '/platform/metrics',
    AUDIT_LOGS: '/platform/audit-logs',
  },

  // 4. Geography (Farm, Zone, Location, Assignment, Cycle)
  GEOGRAPHY: {
    FARMS: '/farms',
    FARM_DETAIL: (farmId) => `/farms/${farmId}`,
    ZONES: (farmId) => `/farms/${farmId}/zones`,
    ZONE_DETAIL: (farmId, zoneId) => `/farms/${farmId}/zones/${zoneId}`,
    ZONE_LOCATIONS: (farmId, zoneId) => `/farms/${farmId}/zones/${zoneId}/locations`,
    LOCATION_DETAIL: (farmId, zoneId, locationId) => `/farms/${farmId}/zones/${zoneId}/locations/${locationId}`,
    ASSIGNMENTS: (farmId) => `/farms/${farmId}/assignments`,
    CYCLES: (farmId) => `/farms/${farmId}/cycles`,
    SETTINGS: (farmId) => `/farms/${farmId}/settings`,
  },

  // 5. Master Data
  MASTER_DATA: {
    ENTERPRISES: '/master-data/enterprises',
    CROP_TYPES: '/master-data/crop-types',
    LIVESTOCK_BREEDS: '/master-data/livestock-breeds',
    MATERIALS: '/master-data/materials',
    MATERIAL_CONVERSIONS: (materialId) => `/master-data/materials/${materialId}/conversions`,
    MATERIAL_LOOKUP_BARCODE: (farmId, code) => `/farms/${farmId}/materials/lookup-barcode?code=${encodeURIComponent(code)}`,
    COST_CATEGORIES: '/master-data/cost-categories',
  },

  // 6. HR & Attendance
  HR: {
    EMPLOYEES: '/hr/employees',
    EMPLOYEE_DETAIL: (id) => `/hr/employees/${id}`,
    PROVISION_ACCOUNT: (id) => `/hr/employees/${id}/provision-account`,
    WORK_SHIFTS: '/hr/shifts',
    SHIFT_ASSIGNMENTS: '/hr/shift-assignments',
    ATTENDANCE: '/hr/attendance',
    CHECK_IN: '/hr/attendance/check-in',
    CHECK_OUT: '/hr/attendance/check-out',
    ADJUST_ATTENDANCE: (id) => `/hr/attendance/${id}/adjust`,
    LEAVE_REQUESTS: '/hr/leaves',
    OVERTIME_REQUESTS: '/hr/overtime',
    TASKS: (farmId) => `/farms/${farmId}/tasks`,
  },

  // 7. Inventory
  INVENTORY: {
    WAREHOUSES: (farmId) => `/farms/${farmId}/warehouses`,
    STOCK: (farmId) => `/farms/${farmId}/inventory/stock`,
    RECEIPTS: (farmId) => `/farms/${farmId}/inventory/receipts`,
    RECEIPT_COMPLETE: (farmId, id) => `/farms/${farmId}/inventory/receipts/${id}/complete`,
    RECEIPT_CANCEL: (farmId, id) => `/farms/${farmId}/inventory/receipts/${id}/cancel`,
    ISSUES: (farmId) => `/farms/${farmId}/inventory/issues`,
    TRANSFERS: (farmId) => `/farms/${farmId}/inventory/transfers`,
    STOCKTAKES: (farmId) => `/farms/${farmId}/inventory/stocktakes`,
    TRANSACTIONS: (farmId) => `/farms/${farmId}/inventory/transactions`,
  },

  // 8. Crop & Livestock Operations
  OPERATIONS: {
    CROP_SEASONS: (farmId) => `/farms/${farmId}/crop-seasons`,
    CROP_SEASON_CLOSE: (farmId, id) => `/farms/${farmId}/crop-seasons/${id}/close`,
    FARMING_LOGS: (farmId) => `/farms/${farmId}/farming-logs`,
    LIVESTOCK_GROUPS: (farmId) => `/farms/${farmId}/livestock-groups`,
    LIVESTOCK_INDIVIDUALS: (farmId) => `/farms/${farmId}/livestock-individuals`,
    LIVESTOCK_WEIGHT_LOGS: (farmId) => `/farms/${farmId}/livestock-weight-logs`,
    LIVESTOCK_EVENTS: (farmId) => `/farms/${farmId}/livestock-events`,
    HARVEST_RECORDS: (farmId) => `/farms/${farmId}/harvest-records`,
  },

  // 9. QA & Traceability
  QA: {
    BATCHES: (farmId) => `/farms/${farmId}/product-batches`,
    BATCH_APPROVE: (farmId, id) => `/farms/${farmId}/product-batches/${id}/approve`,
    BATCH_REJECT: (farmId, id) => `/farms/${farmId}/product-batches/${id}/reject`,
    BATCH_RECALL: (farmId, id) => `/farms/${farmId}/product-batches/${id}/recall`,
    QC_INSPECTIONS: (farmId) => `/farms/${farmId}/qc-inspections`,
    LABEL_PRINT_LOGS: (farmId) => `/farms/${farmId}/label-print-logs`,
    SNAPSHOT: (farmId, batchId) => `/farms/${farmId}/product-batches/${batchId}/snapshot`,
  },

  // 10. Finance & Commercial
  FINANCE: {
    PARTNERS: '/finance/partners',
    EXPENSES: (farmId) => `/farms/${farmId}/expenses`,
    COST_ALLOCATIONS: (farmId) => `/farms/${farmId}/cost-allocations`,
    UNIT_COSTS: (farmId) => `/farms/${farmId}/unit-costs`,
    BUDGETS: (farmId) => `/farms/${farmId}/budgets`,
    SALES_ORDERS: (farmId) => `/farms/${farmId}/sales-orders`,
    SALES_ORDER_CONFIRM: (farmId, id) => `/farms/${farmId}/sales-orders/${id}/confirm`,
    SALES_ORDER_CANCEL: (farmId, id) => `/farms/${farmId}/sales-orders/${id}/cancel`,
    DELIVERIES: (farmId) => `/farms/${farmId}/sales-deliveries`,
    DELIVERY_DISPATCH: (farmId, id) => `/farms/${farmId}/sales-deliveries/${id}/dispatch`,
    DEBTS: (farmId) => `/farms/${farmId}/debts`,
    PAYMENTS: (farmId) => `/farms/${farmId}/payments`,
    PAYMENT_CONFIRM: (farmId, id) => `/farms/${farmId}/payments/${id}/confirm`,
    PAYMENT_ALLOCATE: (farmId, id) => `/farms/${farmId}/payments/${id}/allocate`,
  },

  // 11. Reports & System
  REPORTS: {
    EXECUTIVE_DASHBOARD: (farmId) => `/farms/${farmId}/reports/dashboard`,
    PRODUCTION_REPORT: (farmId) => `/farms/${farmId}/reports/production`,
    INVENTORY_REPORT: (farmId) => `/farms/${farmId}/reports/inventory`,
    COST_REPORT: (farmId) => `/farms/${farmId}/reports/costs`,
    SALES_REPORT: (farmId) => `/farms/${farmId}/reports/sales`,
  },

  SYSTEM: {
    ROLES: '/system/roles',
    PERMISSIONS: '/system/permissions',
    AUDIT_LOGS: '/system/audit-logs',
  },

  // 12. Public Traceability (Unauthenticated)
  PUBLIC: {
    TRACEABILITY: (code) => `/public/traceability/${encodeURIComponent(code)}`,
  },
};
