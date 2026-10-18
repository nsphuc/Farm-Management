package com.farm.saas.modules.quality.service;

import com.farm.saas.modules.quality.dto.request.QcInspectionRequest;
import com.farm.saas.modules.quality.dto.response.QcInspectionDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface QcInspectionService {
    QcInspectionDetailResponse createInspection(Long farmId, QcInspectionRequest request);
    Page<QcInspectionDetailResponse> getInspections(Long farmId, Pageable pageable);
    QcInspectionDetailResponse getInspectionById(Long farmId, Long id);
}
