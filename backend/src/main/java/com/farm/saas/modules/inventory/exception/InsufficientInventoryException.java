package com.farm.saas.modules.inventory.exception;

import com.farm.saas.common.exception.AppException;
import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ nghiệp vụ khi số lượng xuất kho vượt quá số lượng tồn kho hiện tại (Insufficient Inventory).
 * Trả về HTTP 400 Bad Request kèm mã lỗi INSUFFICIENT_INVENTORY.
 */
public class InsufficientInventoryException extends AppException {

    public InsufficientInventoryException(String message) {
        super(HttpStatus.BAD_REQUEST, "INSUFFICIENT_INVENTORY", message);
    }

    public InsufficientInventoryException(Long materialId, String batchNumber, Object requestedQty, Object availableQty) {
        super(HttpStatus.BAD_REQUEST, "INSUFFICIENT_INVENTORY",
                String.format("Số lượng xuất kho (%s) vượt quá số lượng tồn kho hiện có (%s) của vật tư [ID: %s, Lô: %s]!",
                        requestedQty, availableQty, materialId, batchNumber));
    }
}
