package com.farm.saas.common.exception;

public class InsufficientStockException extends BusinessException {

    public InsufficientStockException(String message) {
        super("INSUFFICIENT_STOCK", message);
    }

    public InsufficientStockException(String itemCode, Object requestedQty, Object availableQty) {
        super("INSUFFICIENT_STOCK", String.format("Không đủ tồn kho khả dụng cho vật tư/lô [%s]. Yêu cầu: %s, Khả dụng: %s", itemCode, requestedQty, availableQty));
    }
}
