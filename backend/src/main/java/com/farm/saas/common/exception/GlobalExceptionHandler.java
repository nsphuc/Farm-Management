package com.farm.saas.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> details = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            details.put(error.getField(), error.getDefaultMessage());
        }

        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .code("VALIDATION_FAILED")
                .message("Dữ liệu đầu vào không hợp lệ")
                .details(details)
                .timestamp(Instant.now())
                .correlationId(getCorrelationId())
                .build();

        log.warn("Validation failed for URI [{}]: {}", request.getRequestURI(), details);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        Map<String, String> details = new HashMap<>();
        ex.getConstraintViolations().forEach(violation -> {
            String property = violation.getPropertyPath().toString();
            details.put(property, violation.getMessage());
        });

        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .code("CONSTRAINT_VIOLATION")
                .message("Ràng buộc dữ liệu không thỏa mãn")
                .details(details)
                .timestamp(Instant.now())
                .correlationId(getCorrelationId())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(ex.getStatus().value())
                .error(ex.getStatus().getReasonPhrase())
                .code(ex.getCode())
                .message(ex.getMessage())
                .timestamp(Instant.now())
                .correlationId(getCorrelationId())
                .build();

        log.warn("Business exception [{}] on URI [{}]: {}", ex.getCode(), request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(ex.getStatus()).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
                .code("INTERNAL_SERVER_ERROR")
                .message("Đã xảy ra lỗi nội bộ hệ thống. Vui lòng thử lại sau.")
                .timestamp(Instant.now())
                .correlationId(getCorrelationId())
                .build();

        log.error("Unhandled internal error on URI [{}] with correlationId [{}]:", request.getRequestURI(), getCorrelationId(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    private String getCorrelationId() {
        return MDC.get("correlationId");
    }
}
