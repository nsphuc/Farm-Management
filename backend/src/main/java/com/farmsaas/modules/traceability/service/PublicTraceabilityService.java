package com.farmsaas.modules.traceability.service;

import com.farmsaas.modules.traceability.dto.PublicTraceabilityResponse;

public interface PublicTraceabilityService {

    /**
     * Tra cứu công khai hồ sơ truy xuất nguồn gốc nông sản bằng mã QR (Zero-Leakage).
     * Không yêu cầu JWT, không để lộ dữ liệu nội bộ.
     */
    PublicTraceabilityResponse getPublicTraceability(String traceabilityCode);
}
