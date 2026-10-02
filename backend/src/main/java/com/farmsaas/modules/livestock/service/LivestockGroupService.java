package com.farmsaas.modules.livestock.service;

import com.farmsaas.modules.livestock.dto.LivestockGroupRequest;
import com.farmsaas.modules.livestock.dto.LivestockGroupResponse;
import com.farmsaas.modules.livestock.entity.enums.LivestockGroupStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LivestockGroupService {

    LivestockGroupResponse createGroup(Long farmId, LivestockGroupRequest request);

    LivestockGroupResponse updateGroup(Long farmId, Long groupId, LivestockGroupRequest request);

    LivestockGroupResponse getGroupById(Long farmId, Long groupId);

    Page<LivestockGroupResponse> searchGroups(Long farmId, Long zoneId, Long breedId, LivestockGroupStatus status, Pageable pageable);

    LivestockGroupResponse updateStatus(Long farmId, Long groupId, LivestockGroupStatus status);

    LivestockGroupResponse adjustQuantity(Long farmId, Long groupId, Integer quantityChange, String reason);

    void deleteGroup(Long farmId, Long groupId);
}
