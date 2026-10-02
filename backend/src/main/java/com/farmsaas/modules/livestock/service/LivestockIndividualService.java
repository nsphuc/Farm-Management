package com.farmsaas.modules.livestock.service;

import com.farmsaas.modules.livestock.dto.LivestockIndividualRequest;
import com.farmsaas.modules.livestock.dto.LivestockIndividualResponse;
import com.farmsaas.modules.livestock.entity.enums.Gender;
import com.farmsaas.modules.livestock.entity.enums.HealthStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LivestockIndividualService {

    LivestockIndividualResponse createIndividual(Long farmId, LivestockIndividualRequest request);

    LivestockIndividualResponse updateIndividual(Long farmId, Long individualId, LivestockIndividualRequest request);

    LivestockIndividualResponse updateHealthStatus(Long farmId, Long individualId, HealthStatus healthStatus, String notes);

    LivestockIndividualResponse getIndividualById(Long farmId, Long individualId);

    LivestockIndividualResponse getIndividualByRfid(String rfidTagCode);

    Page<LivestockIndividualResponse> searchIndividuals(
            Long farmId,
            Long zoneId,
            Long groupId,
            HealthStatus healthStatus,
            Gender gender,
            String keyword,
            Pageable pageable
    );

    void deleteIndividual(Long farmId, Long individualId);
}
