package com.farmsaas.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Detailed validation error item for request DTO validation.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ValidationError {
    private String field;
    private Object rejectedValue;
    private String message;
}
