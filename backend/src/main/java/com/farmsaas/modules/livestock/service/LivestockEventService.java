package com.farmsaas.modules.livestock.service;

import com.farmsaas.modules.livestock.dto.LivestockEventRequest;
import com.farmsaas.modules.livestock.dto.LivestockEventResponse;
import com.farmsaas.modules.livestock.entity.enums.LivestockEventType;
import com.farmsaas.modules.livestock.entity.enums.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface LivestockEventService {

    LivestockEventResponse recordEvent(Long farmId, LivestockEventRequest request);

    LivestockEventResponse getEventById(Long farmId, Long eventId);

    Page<LivestockEventResponse> searchEvents(
            Long farmId,
            TargetType targetType,
            Long targetId,
            LivestockEventType eventType,
            Pageable pageable
    );

    List<LivestockEventResponse> getEventsByTarget(Long farmId, TargetType targetType, Long targetId);

    void deleteEvent(Long farmId, Long eventId);
}
