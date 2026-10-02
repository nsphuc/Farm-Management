package com.farmsaas.modules.crop.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.crop.dto.FarmingLogRequest;
import com.farmsaas.modules.crop.dto.FarmingLogResponse;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.crop.entity.FarmingLog;
import com.farmsaas.modules.crop.repository.CropSeasonRepository;
import com.farmsaas.modules.crop.repository.FarmingLogRepository;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.inventory.dto.InventoryBackflushRequest;
import com.farmsaas.modules.inventory.service.InventoryService;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmingLogServiceImpl implements FarmingLogService {

    private final FarmingLogRepository farmingLogRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final FarmRepository farmRepository;
    private final InventoryService inventoryService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public FarmingLogResponse createLog(Long farmId, Long seasonId, FarmingLogRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        CropSeason season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(seasonId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + seasonId));

        String suppliesJson = null;
        if (request.getSuppliesUsed() != null && !request.getSuppliesUsed().isEmpty()) {
            try {
                suppliesJson = objectMapper.writeValueAsString(request.getSuppliesUsed());
            } catch (JsonProcessingException e) {
                log.error("Error serializing suppliesUsed", e);
                throw new BusinessException("Lỗi cấu trúc dữ liệu vật tư sử dụng: " + e.getMessage());
            }
        }

        String imagesJson = null;
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            try {
                imagesJson = objectMapper.writeValueAsString(request.getImageUrls());
            } catch (JsonProcessingException e) {
                log.error("Error serializing imageUrls", e);
                throw new BusinessException("Lỗi cấu trúc danh sách ảnh đính kèm: " + e.getMessage());
            }
        }

        Long userId = SecurityUtils.getCurrentUserId();

        FarmingLog logEntity = FarmingLog.builder()
                .farmId(farmId)
                .seasonId(season.getId())
                .logDate(request.getLogDate() != null ? request.getLogDate() : Instant.now())
                .stage(request.getStage())
                .activityType(request.getActivityType())
                .suppliesUsedJson(suppliesJson)
                .weatherNotes(request.getWeatherNotes())
                .notes(request.getNotes())
                .performedByUserId(userId)
                .imageUrlsJson(imagesJson)
                .build();
        logEntity.setTenantId(tenantId);

        FarmingLog savedLog = farmingLogRepository.save(logEntity);

        // Kích hoạt Inventory Backflushing nếu có vật tư được sử dụng trong nhật ký canh tác
        if (request.getSuppliesUsed() != null && !request.getSuppliesUsed().isEmpty()) {
            if (request.getWarehouseId() == null) {
                throw new BusinessException("Vui lòng chọn kho vật tư xuất dùng (warehouseId) để thực hiện trừ kho tự động (Inventory Backflushing).");
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
                    season.getId(),
                    null,
                    savedLog.getId(),
                    backflushRequests
            );
            log.info("Triggered Inventory Backflushing for FarmingLog ID: {}, Season ID: {}, Warehouse ID: {}",
                    savedLog.getId(), season.getId(), request.getWarehouseId());
        }

        log.info("Recorded farming log ID: {} for Season ID: {}, Farm ID: {}", savedLog.getId(), season.getId(), farmId);
        return FarmingLogResponse.fromEntity(savedLog);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmingLogResponse getLogById(Long farmId, Long seasonId, Long logId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        FarmingLog logEntity = farmingLogRepository.findByIdAndTenantId(logId, tenantId)
                .filter(l -> l.getFarmId().equals(farmId) && l.getSeasonId().equals(seasonId))
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhật ký canh tác ID: " + logId));

        return FarmingLogResponse.fromEntity(logEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FarmingLogResponse> getLogsBySeason(Long farmId, Long seasonId, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        // Validate season belongs to farm & tenant
        if (!cropSeasonRepository.findByIdAndTenantIdAndFarmId(seasonId, tenantId, farmId).isPresent()) {
            throw new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + seasonId);
        }

        Page<FarmingLog> page = farmingLogRepository.findBySeasonIdPaged(tenantId, seasonId, pageable);
        return page.map(FarmingLogResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deleteLog(Long farmId, Long seasonId, Long logId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        FarmingLog logEntity = farmingLogRepository.findByIdAndTenantId(logId, tenantId)
                .filter(l -> l.getFarmId().equals(farmId) && l.getSeasonId().equals(seasonId))
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhật ký canh tác ID: " + logId));

        farmingLogRepository.delete(logEntity);
        log.info("Deleted farming log ID: {} from Season ID: {}", logId, seasonId);
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
