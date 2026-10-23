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
    LivestockGroupDetailResponse closeGroup(Long farmId, Long id);
    void deleteGroup(Long farmId, Long id);

    // Livestock Individuals
    Page<LivestockIndividualDetailResponse> getIndividuals(Long farmId, Long groupId, String healthStatus, Pageable pageable);
    LivestockIndividualDetailResponse getIndividualById(Long farmId, Long id);
    LivestockIndividualDetailResponse createIndividual(Long farmId, CreateLivestockIndividualRequest request);
    LivestockIndividualDetailResponse updateIndividual(Long farmId, Long id, UpdateLivestockIndividualRequest request);
    void deleteIndividual(Long farmId, Long id);

    // Weight logs & ADG
    WeightLogDetailResponse recordWeighIn(Long farmId, WeighInRequest request);
    java.util.List<WeightLogDetailResponse> getGroupWeightLogs(Long farmId, Long groupId);

    // Livestock Events & Veterinary Auto-Backflushing
    Page<LivestockEventDetailResponse> getEvents(Long farmId, Long groupId, Long individualId, Pageable pageable);
    LivestockEventDetailResponse createEvent(Long farmId, CreateLivestockEventRequest request);
}
