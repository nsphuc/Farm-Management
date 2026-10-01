package com.farmsaas.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Exception thrown when an entity is not found.
 */
@Getter
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(
            "RESOURCE_NOT_FOUND",
            String.format("Không tìm thấy %s với %s: '%s'", resourceName, fieldName, fieldValue),
            HttpStatus.NOT_FOUND
        );
    }
}
