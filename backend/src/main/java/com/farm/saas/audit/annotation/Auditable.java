package com.farm.saas.audit.annotation;

import java.lang.annotation.*;

/**
 * Annotation đánh dấu phương thức cần tự động ghi nhận Audit Log qua AOP.
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Auditable {

    /**
     * Tên hành động nghiệp vụ (ví dụ: LOGIN, LOGOUT, REFRESH_TOKEN, CREATE_FARM, UPDATE_FARM).
     */
    String action();

    /**
     * Tên phân hệ nghiệp vụ (ví dụ: AUTH, ORGANIZATION, CROP, LIVESTOCK, INVENTORY, FINANCE).
     */
    String module();
}
