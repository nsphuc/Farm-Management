package com.farm.saas.modules.masterdata.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.masterdata.dto.request.CreateWarehouseRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateWarehouseRequest;
import com.farm.saas.modules.masterdata.dto.response.WarehouseResponse;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.farm.saas.modules.masterdata.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationEventPublisher eventPublisher;

    private static final Set<String> VALID_WAREHOUSE_TYPES = Set.of(
            "FERTILIZER", "PESTICIDE", "ANIMAL_FEED", "HARVESTED_PRODUCE",
            "COLD_STORAGE", "TOOLS_EQUIPMENT", "GENERAL"
    );

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> getWarehouses(Long farmId, String warehouseType) {
        Farm farm = getFarmOrThrow(farmId);
        List<Warehouse> list;
        if (warehouseType != null && !warehouseType.isBlank()) {
            list = warehouseRepository.findByFarmIdAndWarehouseType(farmId, warehouseType.toUpperCase());
        } else {
            list = warehouseRepository.findByFarmId(farmId);
        }

        return list.stream()
                .filter(w -> !"DELETED".equalsIgnoreCase(w.getStatus()))
                .map(w -> toResponse(w, farm.getName()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouseById(Long farmId, Long warehouseId) {
        Farm farm = getFarmOrThrow(farmId);
        Warehouse warehouse = warehouseRepository.findByFarmIdAndId(farmId, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Kho hàng", warehouseId));
        return toResponse(warehouse, farm.getName());
    }

    @Override
    @Transactional
    public WarehouseResponse createWarehouse(Long farmId, CreateWarehouseRequest request) {
        Farm farm = getFarmOrThrow(farmId);

        String type = request.getWarehouseType().toUpperCase();
        if (!VALID_WAREHOUSE_TYPES.contains(type)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_WAREHOUSE_TYPE",
                    "Loại kho không hợp lệ. Cho phép: " + VALID_WAREHOUSE_TYPES);
        }

        String code = request.getCode().trim().toUpperCase();
        if (warehouseRepository.existsByFarmIdAndCode(farmId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "WAREHOUSE_CODE_ALREADY_EXISTS", "Mã kho đã tồn tại trong trang trại.");
        }

        if (request.getStandardHumidityPct() != null) {
            if (request.getStandardHumidityPct().compareTo(BigDecimal.ZERO) < 0 ||
                    request.getStandardHumidityPct().compareTo(new BigDecimal("100.00")) > 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_HUMIDITY", "Độ ẩm tiêu chuẩn phải từ 0% đến 100%.");
            }
        }

        Warehouse warehouse = Warehouse.builder()
                .tenantId(farm.getTenantId())
                .farmId(farmId)
                .code(code)
                .name(request.getName().trim())
                .warehouseType(type)
                .capacityM3(request.getCapacityM3())
                .floorAreaM2(request.getFloorAreaM2())
                .standardTempC(request.getStandardTempC())
                .standardHumidityPct(request.getStandardHumidityPct())
                .locationDesc(request.getLocationDesc())
                .managerUserId(request.getManagerUserId())
                .status("ACTIVE")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        Warehouse saved = warehouseRepository.save(warehouse);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_WAREHOUSE")
                .module("MASTERDATA")
                .endpoint("/api/v1/farms/" + farmId + "/warehouses")
                .method("POST")
                .newValue("Warehouse: " + saved.getCode())
                .build());

        return toResponse(saved, farm.getName());
    }

    @Override
    @Transactional
    public WarehouseResponse updateWarehouse(Long farmId, Long warehouseId, UpdateWarehouseRequest request) {
        Farm farm = getFarmOrThrow(farmId);
        Warehouse warehouse = warehouseRepository.findByFarmIdAndId(farmId, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Kho hàng", warehouseId));

        if (request.getWarehouseType() != null) {
            String type = request.getWarehouseType().toUpperCase();
            if (!VALID_WAREHOUSE_TYPES.contains(type)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_WAREHOUSE_TYPE", "Loại kho không hợp lệ.");
            }
            warehouse.setWarehouseType(type);
        }

        if (request.getStandardHumidityPct() != null) {
            if (request.getStandardHumidityPct().compareTo(BigDecimal.ZERO) < 0 ||
                    request.getStandardHumidityPct().compareTo(new BigDecimal("100.00")) > 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_HUMIDITY", "Độ ẩm tiêu chuẩn phải từ 0% đến 100%.");
            }
            warehouse.setStandardHumidityPct(request.getStandardHumidityPct());
        }

        warehouse.setName(request.getName().trim());
        if (request.getCapacityM3() != null) warehouse.setCapacityM3(request.getCapacityM3());
        if (request.getFloorAreaM2() != null) warehouse.setFloorAreaM2(request.getFloorAreaM2());
        if (request.getStandardTempC() != null) warehouse.setStandardTempC(request.getStandardTempC());
        if (request.getLocationDesc() != null) warehouse.setLocationDesc(request.getLocationDesc());
        if (request.getManagerUserId() != null) warehouse.setManagerUserId(request.getManagerUserId());
        if (request.getStatus() != null) warehouse.setStatus(request.getStatus().toUpperCase());
        warehouse.setUpdatedAt(Instant.now());
        warehouse.setUpdatedBy(SecurityUtils.getCurrentUserId());

        Warehouse updated = warehouseRepository.save(warehouse);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_WAREHOUSE")
                .module("MASTERDATA")
                .endpoint("/api/v1/farms/" + farmId + "/warehouses/" + warehouseId)
                .method("PUT")
                .newValue("Updated warehouse: " + updated.getCode())
                .build());

        return toResponse(updated, farm.getName());
    }

    private Farm getFarmOrThrow(Long farmId) {
        return farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Trang trại", farmId));
    }

    private WarehouseResponse toResponse(Warehouse w, String farmName) {
        String managerFullName = null;
        if (w.getManagerUserId() != null) {
            Optional<User> uOpt = userRepository.findById(w.getManagerUserId());
            if (uOpt.isPresent()) {
                managerFullName = uOpt.get().getFullName();
            }
        }

        Long lotsCount = 0L;
        try {
            Long c = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM warehouse_inventory WHERE warehouse_id = ? AND quantity_on_hand > 0",
                    Long.class, w.getId());
            if (c != null) lotsCount = c;
        } catch (Exception ignored) {
        }

        return WarehouseResponse.builder()
                .id(w.getId())
                .tenantId(w.getTenantId())
                .farmId(w.getFarmId())
                .farmName(farmName)
                .code(w.getCode())
                .name(w.getName())
                .warehouseType(w.getWarehouseType())
                .capacityM3(w.getCapacityM3())
                .floorAreaM2(w.getFloorAreaM2())
                .standardTempC(w.getStandardTempC())
                .standardHumidityPct(w.getStandardHumidityPct())
                .locationDesc(w.getLocationDesc())
                .managerUserId(w.getManagerUserId())
                .managerFullName(managerFullName)
                .status(w.getStatus())
                .currentInventoryLotsCount(lotsCount)
                .createdAt(w.getCreatedAt())
                .build();
    }
}
