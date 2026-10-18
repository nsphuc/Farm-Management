package com.farm.saas.modules.quality.service;

import com.farm.saas.modules.quality.dto.response.PublicTraceabilityResponse;

public interface TraceabilityService {
    PublicTraceabilityResponse getPublicTraceability(String traceabilityCode);
}
