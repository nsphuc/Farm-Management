package com.farmsaas.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a user attempts to access or mutate resources outside their assigned tenant.
 */
public class TenantAccessDeniedException extends BusinessException {

    public TenantAccessDeniedException(String message) {
        super("TENANT_ACCESS_DENIED", message, HttpStatus.FORBIDDEN);
    }

    public TenantAccessDeniedException() {
        this("Bạn không có quyền truy cập hoặc thực hiện thao tác trên trang trại/doanh nghiệp này.");
    }
}
