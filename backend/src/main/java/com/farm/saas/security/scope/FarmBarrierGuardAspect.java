package com.farm.saas.security.scope;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.security.authorization.SecurityUtils;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * Aspect chặn và kiểm tra tính hợp lệ của TenantScope & FarmScope trước khi phương thức nghiệp vụ thực thi.
 * Thực hiện rào chắn bảo vệ dữ liệu chéo khách hàng và chéo trang trại (The Farm Barrier Guard).
 */
@Aspect
@Component
public class FarmBarrierGuardAspect {

    private static final Logger log = LoggerFactory.getLogger(FarmBarrierGuardAspect.class);

    @Before("@annotation(barrierGuard) || @within(barrierGuard)")
    public void enforceBarrierGuard(JoinPoint joinPoint, TheFarmBarrierGuard barrierGuard) {
        if (barrierGuard == null) {
            if (joinPoint.getSignature() instanceof MethodSignature signature) {
                Method method = signature.getMethod();
                if (method != null) {
                    barrierGuard = method.getAnnotation(TheFarmBarrierGuard.class);
                }
            }
            if (barrierGuard == null && joinPoint.getTarget() != null) {
                barrierGuard = joinPoint.getTarget().getClass().getAnnotation(TheFarmBarrierGuard.class);
            }
        }

        if (barrierGuard == null) {
            return;
        }

        String[] paramNames = null;
        if (joinPoint.getSignature() instanceof MethodSignature signature) {
            paramNames = signature.getParameterNames();
        }
        Object[] args = joinPoint.getArgs();

        Long extractedTenantId = extractId(args, paramNames, barrierGuard.tenantParam(), "tenantId");
        Long extractedFarmId = extractId(args, paramNames, barrierGuard.farmParam(), "farmId");

        // 1. Kiểm tra Tenant Isolation
        if (extractedTenantId != null) {
            SecurityUtils.validateTenantAccess(extractedTenantId);
        }

        // 2. Kiểm tra Farm Scope
        if (extractedFarmId != null) {
            SecurityUtils.validateFarmAccess(extractedFarmId);
        } else if (barrierGuard.requireFarm()) {
            throw AppException.forbidden("The Farm Barrier Guard: Thao tác này bắt buộc phải xác định trang trại (Farm Scope) cụ thể!");
        }

        log.debug("The Farm Barrier Guard passed: TenantId={}, FarmId={}", extractedTenantId, extractedFarmId);
    }

    private Long extractId(Object[] args, String[] paramNames, String explicitParamName, String defaultParamName) {
        if (args == null || args.length == 0) {
            return null;
        }

        String targetParam = (explicitParamName != null && !explicitParamName.isBlank())
                ? explicitParamName
                : defaultParamName;

        if (targetParam == null || targetParam.isBlank()) {
            return null;
        }

        // 1. Tìm theo tên tham số trực tiếp
        if (paramNames != null) {
            for (int i = 0; i < paramNames.length; i++) {
                if (i < args.length && targetParam.equalsIgnoreCase(paramNames[i]) && args[i] != null) {
                    if (args[i] instanceof Number number) {
                        return number.longValue();
                    }
                    if (args[i] instanceof String str && !str.isBlank()) {
                        try {
                            return Long.parseLong(str.trim());
                        } catch (NumberFormatException ignored) {
                        }
                    }
                }
            }
        }

        // 2. Tìm trong thuộc tính của Request Object (DTO)
        for (Object arg : args) {
            if (arg != null && !isPrimitiveOrWrapper(arg.getClass()) && !(arg instanceof String)) {
                try {
                    String getterName = "get" + Character.toUpperCase(targetParam.charAt(0)) + targetParam.substring(1);
                    Method getter = arg.getClass().getMethod(getterName);
                    Object val = getter.invoke(arg);
                    if (val instanceof Number number) {
                        return number.longValue();
                    }
                    if (val instanceof String str && !str.isBlank()) {
                        try {
                            return Long.parseLong(str.trim());
                        } catch (NumberFormatException ignored) {
                        }
                    }
                } catch (Exception ignored) {
                    // Tiếp tục tìm các đối tượng khác
                }
            }
        }

        return null;
    }

    private boolean isPrimitiveOrWrapper(Class<?> clazz) {
        return clazz.isPrimitive() ||
                clazz.equals(Long.class) ||
                clazz.equals(Integer.class) ||
                clazz.equals(Double.class) ||
                clazz.equals(Float.class) ||
                clazz.equals(Boolean.class);
    }
}
