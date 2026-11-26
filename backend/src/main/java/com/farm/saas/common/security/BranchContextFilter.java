package com.farm.saas.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter tự động trích xuất Header `X-Branch-Id` (hoặc Query Parameter `branchId`)
 * và nạp vào BranchContextHolder để toàn bộ tầng Service/Repository có thể lọc dữ liệu.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class BranchContextFilter extends OncePerRequestFilter {

    public static final String HEADER_BRANCH_ID = "X-Branch-Id";
    public static final String PARAM_BRANCH_ID = "branchId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String branchVal = request.getHeader(HEADER_BRANCH_ID);
        if (!StringUtils.hasText(branchVal)) {
            branchVal = request.getParameter(PARAM_BRANCH_ID);
        }

        if (StringUtils.hasText(branchVal)) {
            BranchContextHolder.setBranch(branchVal.trim());
        } else {
            BranchContextHolder.clear();
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            BranchContextHolder.clear();
        }
    }
}
