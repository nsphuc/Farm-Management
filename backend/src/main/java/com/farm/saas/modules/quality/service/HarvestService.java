package com.farm.saas.modules.quality.service;

import com.farm.saas.modules.quality.dto.request.CreateHarvestRecordRequest;
import com.farm.saas.modules.quality.dto.response.HarvestRecordDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface HarvestService {
    HarvestRecordDetailResponse createHarvestRecord(Long farmId, CreateHarvestRecordRequest request);
    Page<HarvestRecordDetailResponse> getHarvestRecords(Long farmId, Pageable pageable);
    HarvestRecordDetailResponse getHarvestRecordById(Long farmId, Long id);
}
