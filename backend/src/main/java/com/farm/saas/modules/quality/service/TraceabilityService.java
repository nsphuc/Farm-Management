package com.farm.saas.modules.quality.service;

import com.farm.saas.modules.quality.dto.response.PublicTraceabilityResponse;

/**
 * Giao diện dịch vụ nghiệp vụ truy xuất nguồn gốc sản phẩm công khai (Public Traceability).
 */
public interface TraceabilityService {

    /**
     * Tra cứu thông tin truy xuất nguồn gốc công khai dựa trên mã tem QR.
     *
     * @param traceabilityCode Mã chuỗi định danh duy nhất của tem QR truy xuất nguồn gốc
     * @return Thông tin truy xuất nguồn gốc công khai phục vụ người tiêu dùng
     */
    PublicTraceabilityResponse getPublicTraceability(String traceabilityCode);
}
