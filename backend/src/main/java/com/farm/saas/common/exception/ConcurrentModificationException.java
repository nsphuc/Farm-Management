package com.farm.saas.common.exception;

public class ConcurrentModificationException extends BusinessException {

    public ConcurrentModificationException(String message) {
        super("CONCURRENT_MODIFICATION", message);
    }

    public ConcurrentModificationException(String resourceName, Object identifier) {
        super("CONCURRENT_MODIFICATION", String.format("Dữ liệu %s (id: %s) đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại và thử lại.", resourceName, identifier));
    }
}
