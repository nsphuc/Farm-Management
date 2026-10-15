package com.farm.saas.security.scope;

import java.lang.annotation.*;

/**
 * Annotation đánh dấu phương thức cần được bảo vệ bởi rào chắn The Farm Barrier Guard.
 * Tự động kiểm tra tính hợp lệ của TenantScope và FarmScope dựa trên Principal hiện tại.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface TheFarmBarrierGuard {

    /**
     * Tên tham số đại diện cho Tenant ID trong method parameters.
     * Mặc định để trống sẽ tự động tìm kiếm param có tên "tenantId" hoặc thuộc tính trong Request DTO.
     */
    String tenantParam() default "";

    /**
     * Tên tham số đại diện cho Farm ID trong method parameters.
     * Mặc định để trống sẽ tự động tìm kiếm param có tên "farmId" hoặc thuộc tính trong Request DTO.
     */
    String farmParam() default "";

    /**
     * Bắt buộc phải có farm scope (true) hay tùy chọn (false).
     */
    boolean requireFarm() default false;
}
