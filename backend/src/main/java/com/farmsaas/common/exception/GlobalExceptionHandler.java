package com.farmsaas.common.exception;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.common.dto.ValidationError;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Bắt lỗi Bean Validation (@Valid trên DTO)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        List<ValidationError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> new ValidationError(err.getField(), err.getRejectedValue(), err.getDefaultMessage()))
                .toList();

        return ResponseEntity.badRequest().body(
                ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "Dữ liệu nhập vào không hợp lệ.", errors));
    }

    // 1b. Bắt lỗi định dạng JSON hoặc mã hóa body yêu cầu (HttpMessageNotReadableException)
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.warn("Lỗi đọc payload yêu cầu: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "Dữ liệu yêu cầu không đúng định dạng JSON hoặc mã hóa UTF-8."));
    }

    // 2. Bắt lỗi không tìm thấy tài nguyên (EntityNotFoundException)
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleEntityNotFound(EntityNotFoundException ex) {
        log.warn("Không tìm thấy thực thể: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ApiResponse.error(HttpStatus.NOT_FOUND.value(), ex.getMessage()));
    }

    // 3. Bắt lỗi vi phạm ranh giới Tenant (TenantAccessDeniedException)
    @ExceptionHandler(TenantAccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleTenantAccessDenied(TenantAccessDeniedException ex) {
        log.error("CẢNH BÁO XÂM PHẠM TENANT: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ApiResponse.error(HttpStatus.FORBIDDEN.value(), ex.getMessage()));
    }

    // 4. Bắt lỗi Nghiệp vụ tổng quát (BusinessException)
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException ex) {
        log.warn("Lỗi nghiệp vụ [Code: {}]: {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus()).body(
                ApiResponse.error(ex.getHttpStatus().value(), ex.getMessage()));
    }

    // 3. Bắt lỗi Sai tài khoản / Mật khẩu Spring Security
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Tên đăng nhập hoặc mật khẩu không chính xác."));
    }

    // 4. Bắt lỗi Chưa xác thực (AuthenticationException)
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Bạn cần đăng nhập để truy cập tài nguyên này."));
    }

    // 5. Bắt lỗi Không có quyền (AccessDeniedException)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ApiResponse.error(HttpStatus.FORBIDDEN.value(), "Bạn không có quyền thực hiện thao tác này."));
    }

    // 6. Bắt tất cả các lỗi chưa lường trước (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Lỗi hệ thống nội bộ (Uncaught Exception): ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "Hệ thống đang gặp sự cố. Vui lòng thử lại sau."));
    }
}
