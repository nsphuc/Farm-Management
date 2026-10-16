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
        for (org.springframework.validation.ObjectError error : ex.getBindingResult().getGlobalErrors()) {
            details.put(error.getObjectName(), error.getDefaultMessage());
        }

        // Tạo message mô tả lỗi đầu tiên để người dùng dễ nhận biết (VD: "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu")
        String firstErrorMessage = details.values().stream().findFirst().orElse("Dữ liệu đầu vào không hợp lệ");
        String finalMessage = details.size() == 1
                ? firstErrorMessage
                : "Dữ liệu đầu vào không hợp lệ: " + firstErrorMessage;

        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .code("VALIDATION_FAILED")
                .message(finalMessage)
                .details(details)
                .timestamp(Instant.now())
                .correlationId(getCorrelationId(request))
                .build();

        log.warn("Validation failed for URI [{}]: {}", request.getRequestURI(), details);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
            org.springframework.http.converter.HttpMessageNotReadableException ex, HttpServletRequest request) {
        String detailMessage = "Dữ liệu yêu cầu không hợp lệ hoặc định dạng JSON/Enum không đúng chuẩn";
        Map<String, String> details = new HashMap<>();

        Throwable cause = ex.getCause();
        if (cause instanceof com.fasterxml.jackson.databind.exc.InvalidFormatException ife) {
            String fieldPath = ife.getPath().stream()
                    .map(ref -> ref.getFieldName() != null ? ref.getFieldName() : "[" + ref.getIndex() + "]")
                    .collect(java.util.stream.Collectors.joining("."));
            Object invalidValue = ife.getValue();
            Class<?> targetType = ife.getTargetType();

            if (targetType != null && targetType.isEnum()) {
                Object[] enumConstants = targetType.getEnumConstants();
                String allowedValues = java.util.Arrays.toString(enumConstants);
                detailMessage = String.format("Giá trị '%s' không hợp lệ cho trường '%s'. Các giá trị hợp lệ: %s",
                        invalidValue, fieldPath, allowedValues);
                details.put(fieldPath, String.format("Giá trị '%s' không thuộc danh mục hợp lệ: %s", invalidValue, allowedValues));
            } else {
                detailMessage = String.format("Định dạng giá trị '%s' không hợp lệ cho trường '%s' (yêu cầu kiểu: %s)",
                        invalidValue, fieldPath, targetType != null ? targetType.getSimpleName() : "không xác định");
                details.put(fieldPath, "Sai định dạng dữ liệu");
            }
        } else if (cause instanceof com.fasterxml.jackson.core.JsonParseException jpe) {
            detailMessage = "Cú pháp JSON bị lỗi: " + jpe.getOriginalMessage();
        }

        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .code("INVALID_REQUEST_BODY")
                .message(detailMessage)
                .details(details.isEmpty() ? null : details)
                .timestamp(Instant.now())
                .correlationId(getCorrelationId(request))
                .build();

        log.warn("HttpMessageNotReadable on URI [{}]: {}", request.getRequestURI(), detailMessage);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String fieldName = ex.getName();
        Object value = ex.getValue();
        Class<?> requiredType = ex.getRequiredType();
        String message = String.format("Tham số '%s' nhận giá trị '%s' không hợp lệ (yêu cầu kiểu: %s)",
                fieldName, value, requiredType != null ? requiredType.getSimpleName() : "không xác định");

        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .code("TYPE_MISMATCH")
                .message(message)
                .timestamp(Instant.now())
                .correlationId(getCorrelationId(request))
                .build();

        log.warn("Type mismatch on URI [{}]: {}", request.getRequestURI(), message);
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

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .code("INSUFFICIENT_PERMISSIONS")
                .message("Bạn không có quyền thực hiện thao tác này")
                .timestamp(Instant.now())
                .correlationId(getCorrelationId(request))
                .build();

        log.warn("Access denied on URI [{}]: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(org.springframework.security.core.AuthenticationException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .code("UNAUTHORIZED")
                .message("Bạn cần đăng nhập để truy cập tài nguyên này")
                .timestamp(Instant.now())
                .correlationId(getCorrelationId(request))
                .build();

        log.warn("Authentication failed on URI [{}]: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .error(HttpStatus.NOT_FOUND.getReasonPhrase())
                .code("RESOURCE_NOT_FOUND")
                .message("Đường dẫn không tồn tại: " + request.getRequestURI())
                .timestamp(Instant.now())
                .correlationId(getCorrelationId(request))
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.METHOD_NOT_ALLOWED.value())
                .error(HttpStatus.METHOD_NOT_ALLOWED.getReasonPhrase())
                .code("METHOD_NOT_ALLOWED")
                .message("Phương thức " + request.getMethod() + " không được hỗ trợ cho đường dẫn này")
                .timestamp(Instant.now())
                .correlationId(getCorrelationId(request))
                .build();

        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
                .code("INTERNAL_SERVER_ERROR")
                .message("Đã xảy ra lỗi nội bộ hệ thống. Vui lòng thử lại sau.")
                .timestamp(Instant.now())
                .correlationId(getCorrelationId(request))
                .build();

        log.error("Unhandled internal error on URI [{}] with correlationId [{}]:", request.getRequestURI(), getCorrelationId(request), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    private String getCorrelationId() {
        return getCorrelationId(null);
    }

    private String getCorrelationId(HttpServletRequest request) {
        String correlationId = MDC.get("correlationId");
        if (correlationId == null && request != null) {
            correlationId = request.getHeader("X-Correlation-ID");
        }
        return correlationId;
    }
}
