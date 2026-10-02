package com.farmsaas.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base custom business exception.
 */
@Getter
public class BusinessException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus httpStatus;

    public BusinessException(String message) {
        super(message);
        this.errorCode = "BUSINESS_ERROR";
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }

    public BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }

    public BusinessException(String errorCode, String message, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }
}
