package com.farmsaas.modules.livestock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.inventory.dto.InventoryBackflushRequest;
import com.farmsaas.modules.inventory.service.InventoryService;
import com.farmsaas.modules.livestock.dto.LivestockEventRequest;
import com.farmsaas.modules.livestock.dto.LivestockEventResponse;
import com.farmsaas.modules.livestock.entity.LivestockEvent;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.livestock.entity.LivestockIndividual;
import com.farmsaas.modules.livestock.entity.enums.HealthStatus;
import com.farmsaas.modules.livestock.entity.enums.LivestockEventType;
import com.farmsaas.modules.livestock.entity.enums.TargetType;
import com.farmsaas.modules.livestock.repository.LivestockEventRepository;
import com.farmsaas.modules.livestock.repository.LivestockGroupRepository;
import com.farmsaas.modules.livestock.repository.LivestockIndividualRepository;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LivestockEventServiceImpl implements LivestockEventService {

    private final LivestockEventRepository eventRepository;
    private final LivestockGroupRepository groupRepository;
    private final LivestockIndividualRepository individualRepository;
    private final FarmRepository farmRepository;
    private final InventoryService inventoryService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public LivestockEventResponse recordEvent(Long farmId, LivestockEventRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Long groupIdForBackflush = null;
        LivestockIndividual individual = null;
        LivestockGroup group = null;

        if (request.getTargetType() == TargetType.GROUP) {
            group = groupRepository.findByIdAndTenantIdAndFarmId(request.getTargetId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đàn ID: " + request.getTargetId() + " trong trang trại này."));
            groupIdForBackflush = group.getId();
        } else {
            individual = individualRepository.findByIdAndTenantIdAndFarmId(request.getTargetId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cá thể ID: " + request.getTargetId() + " trong trang trại này."));
            groupIdForBackflush = individual.getGroupId();
        }

        Long vetUserId = request.getVeterinarianUserId() != null
                ? request.getVeterinarianUserId()
                : SecurityUtils.getCurrentUserId();

        LivestockEvent event = LivestockEvent.builder()
                .farmId(farmId)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .eventType(request.getEventType())
                .eventDate(request.getEventDate() != null ? request.getEventDate() : Instant.now())
                .detailsJson(request.getDetailsJson())
                .veterinarianUserId(vetUserId)
                .notes(request.getNotes())
                .build();
        event.setTenantId(tenantId);

        LivestockEvent savedEvent = eventRepository.save(event);

        // Cập nhật trạng thái cá thể nếu có sự kiện đo trọng lượng hoặc điều trị bệnh
        if (individual != null && request.getDetailsJson() != null && !request.getDetailsJson().isBlank()) {
            try {
                JsonNode json = objectMapper.readTree(request.getDetailsJson());
                if (request.getEventType() == LivestockEventType.DO_TRONG_LUONG && json.has("weightKg")) {
                    BigDecimal weight = new BigDecimal(json.get("weightKg").asText());
                    individual.setCurrentWeightKg(weight);
                    individualRepository.save(individual);
                    log.info("Updated weight for individual RFID: {} to {} kg", individual.getRfidTagCode(), weight);
                } else if (request.getEventType() == LivestockEventType.DIEU_TRI_BENH && json.has("healthStatus")) {
                    String statusStr = json.get("healthStatus").asText();
                    individual.setHealthStatus(HealthStatus.valueOf(statusStr));
                    individualRepository.save(individual);
                }
            } catch (Exception e) {
                log.warn("Could not parse detailsJson for livestock event: {}", e.getMessage());
            }
        }

        // Kích hoạt Inventory Backflushing nếu có thuốc thú y, vắc-xin hoặc thức ăn tiêu hao
        if (request.getSuppliesUsed() != null && !request.getSuppliesUsed().isEmpty()) {
            if (request.getWarehouseId() == null) {
                throw new BusinessException("Vui lòng chọn kho vật tư xuất dùng (warehouseId) để tự động trừ kho vắc-xin/thuốc thú y.");
            }

            List<InventoryBackflushRequest> backflushRequests = request.getSuppliesUsed().stream()
                    .map(item -> InventoryBackflushRequest.builder()
                            .materialId(item.getMaterialId())
                            .batchNumber(item.getBatchNumber())
                            .quantity(item.getQuantity())
                            .unit(item.getUnit())
                            .build())
                    .collect(Collectors.toList());

            inventoryService.backflushConsumption(
                    farmId,
                    request.getWarehouseId(),
                    null,
                    groupIdForBackflush,
                    savedEvent.getId(),
                    backflushRequests
            );
            log.info("Triggered Inventory Backflushing for LivestockEvent ID: {}, Farm ID: {}, Warehouse ID: {}",
                    savedEvent.getId(), farmId, request.getWarehouseId());
        }

        log.info("Recorded livestock event ID: {} ({}) for {} ID: {}",
                savedEvent.getId(), request.getEventType(), request.getTargetType(), request.getTargetId());
        return LivestockEventResponse.fromEntity(savedEvent);
    }

    @Override
    @Transactional(readOnly = true)
    public LivestockEventResponse getEventById(Long farmId, Long eventId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockEvent event = eventRepository.findByIdAndTenantIdAndFarmId(eventId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sự kiện chăn nuôi ID: " + eventId));
        return LivestockEventResponse.fromEntity(event);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LivestockEventResponse> searchEvents(
            Long farmId,
            TargetType targetType,
            Long targetId,
            LivestockEventType eventType,
            Pageable pageable
    ) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Page<LivestockEvent> page = eventRepository.searchEvents(tenantId, farmId, targetType, targetId, eventType, pageable);
        return page.map(LivestockEventResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LivestockEventResponse> getEventsByTarget(Long farmId, TargetType targetType, Long targetId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return eventRepository.findByTenantIdAndFarmIdAndTargetTypeAndTargetIdOrderByEventDateDesc(
                tenantId, farmId, targetType, targetId
        ).stream()
                .map(LivestockEventResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteEvent(Long farmId, Long eventId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockEvent event = eventRepository.findByIdAndTenantIdAndFarmId(eventId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sự kiện chăn nuôi ID: " + eventId));

        eventRepository.delete(event);
        log.info("Deleted livestock event ID: {} from Farm ID: {}", eventId, farmId);
    }

    private void validateFarmAccess(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức.");
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
