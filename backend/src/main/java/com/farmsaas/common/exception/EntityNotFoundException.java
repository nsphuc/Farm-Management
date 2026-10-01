package com.farmsaas.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Standard exception thrown when an entity is not found by ID or criteria.
 */
public class EntityNotFoundException extends BusinessException {

    public EntityNotFoundException(String entityName, Object id) {
        super(
            "ENTITY_NOT_FOUND",
            String.format("Không tìm thấy %s với mã: %s", entityName, id),
            HttpStatus.NOT_FOUND
        );
    }

    public EntityNotFoundException(String message) {
        super("ENTITY_NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }
}
