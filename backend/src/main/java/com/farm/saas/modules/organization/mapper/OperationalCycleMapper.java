package com.farm.saas.modules.organization.mapper;

import com.farm.saas.modules.organization.dto.request.OperationalCycleCreateRequest;
import com.farm.saas.modules.organization.dto.request.OperationalCycleUpdateRequest;
import com.farm.saas.modules.organization.dto.response.OperationalCycleResponse;
import com.farm.saas.modules.organization.entity.OperationalCycle;
import com.farm.saas.modules.organization.entity.OperationalCycleStatus;

/**
 * Mapper chuyển đổi giữa OperationalCycle Entity và Request/Response DTO.
 */
public final class OperationalCycleMapper {

    private OperationalCycleMapper() {
    }

    public static OperationalCycle toEntity(OperationalCycleCreateRequest request, Long tenantId, Long farmId, Long currentUserId) {
        if (request == null) {
            return null;
        }

        return OperationalCycle.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .name(request.getName().trim())
                .fiscalYear(request.getFiscalYear())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(OperationalCycleStatus.PLANNING)
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();
    }

    public static void updateEntity(OperationalCycle entity, OperationalCycleUpdateRequest request, Long currentUserId) {
        if (entity == null || request == null) {
            return;
        }

        entity.setName(request.getName().trim());
        entity.setFiscalYear(request.getFiscalYear());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        entity.setUpdatedBy(currentUserId);
    }

    public static OperationalCycleResponse toResponse(OperationalCycle entity) {
        if (entity == null) {
            return null;
        }

        return OperationalCycleResponse.builder()
                .id(entity.getId())
                .farmId(entity.getFarmId())
                .name(entity.getName())
                .fiscalYear(entity.getFiscalYear())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
