package com.farm.saas.modules.livestock.service;

import com.farm.saas.modules.livestock.dto.request.*;
import com.farm.saas.modules.livestock.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LivestockService {
    // Livestock Groups
    Page<LivestockGroupDetailResponse> getGroups(Long farmId, String status, Pageable pageable);
    LivestockGroupDetailResponse getGroupById(Long farmId, Long id);
    LivestockGroupDetailResponse createGroup(Long farmId, CreateLivestockGroupRequest request);
    LivestockGroupDetailResponse updateGroup(Long farmId, Long id, UpdateLivestockGroupRequest request);

    // Livestock Individuals
    Page<LivestockIndividualDetailResponse> getIndividuals(Long farmId, Long groupId, String healthStatus, Pageable pageable);
    LivestockIndividualDetailResponse getIndividualById(Long farmId, Long id);
    LivestockIndividualDetailResponse createIndividual(Long farmId, CreateLivestockIndividualRequest request);
    LivestockIndividualDetailResponse updateIndividual(Long farmId, Long id, UpdateLivestockIndividualRequest request);

    // Weight logs & ADG
    WeightLogDetailResponse recordWeighIn(Long farmId, WeighInRequest request);

    // Livestock Events & Veterinary Auto-Backflushing
    Page<LivestockEventDetailResponse> getEvents(Long farmId, Long groupId, Long individualId, Pageable pageable);
    LivestockEventDetailResponse createEvent(Long farmId, CreateLivestockEventRequest request);
}
