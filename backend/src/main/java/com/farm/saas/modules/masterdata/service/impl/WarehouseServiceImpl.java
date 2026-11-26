package com.farm.saas.modules.masterdata.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseIssueRepository;
import com.farm.saas.modules.inventory.repository.WarehouseReceiptRepository;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
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
    private final ProductionZoneRepository productionZoneRepository;
    private final UserRepository userRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseReceiptRepository warehouseReceiptRepository;
    private final WarehouseIssueRepository warehouseIssueRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationEventPublisher eventPublisher;

    private static final Set<String> VALID_WAREHOUSE_TYPES = Set.of(
            "FERTILIZER", "PESTICIDE", "ANIMAL_FEED", "HARVESTED_PRODUCE",
            "COLD_STORAGE", "TOOLS_EQUIPMENT", "GENERAL", "FEED", "MEDICINE", "VACCINE", "CHEMICAL", "SUPPLIES"
    );

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> getWarehouses(Long farmId, String warehouseType) {
        return getWarehouses(farmId, warehouseType, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> getWarehouses(Long farmId, String warehouseType, Long branchId) {
        Farm farm = getFarmOrThrow(farmId);
        Long effectiveBranchId = branchId != null ? branchId : SecurityUtils.getCurrentBranchId();

        List<Warehouse> list;
        if (effectiveBranchId != null) {
            if (warehouseType != null && !warehouseType.isBlank()) {
                list = warehouseRepository.findByFarmIdAndBranchIdAndWarehouseType(farmId, effectiveBranchId, warehouseType.toUpperCase());
            } else {
                list = warehouseRepository.findByFarmIdAndBranchId(farmId, effectiveBranchId);
            }
        } else {
            if (warehouseType != null && !warehouseType.isBlank()) {
                list = warehouseRepository.findByFarmIdAndWarehouseType(farmId, warehouseType.toUpperCase());
            } else {
                list = warehouseRepository.findByFarmId(farmId);
            }
        }

        // Warehouse Role Scope: Nếu người dùng bị giới hạn phạm vi kho, chỉ trả về các kho được phân công
        Long currentUserId = SecurityUtils.getCurrentUserId();
        boolean hasBroadAccess = SecurityUtils.isSuperAdmin()
                || SecurityUtils.hasRole("ROLE_SUPER_ADMIN")
                || SecurityUtils.hasRole("ROLE_FARM_OWNER")
                || SecurityUtils.hasRole("ROLE_FARM_MANAGER")
                || SecurityUtils.hasRole("ROLE_ACCOUNTANT")
                || SecurityUtils.hasAuthority("inventory.manage")
                || SecurityUtils.hasAuthority("inventory.view_all");

        if (!hasBroadAccess && currentUserId != null) {
            boolean hasSpecificAssignment = list.stream().anyMatch(w -> currentUserId.equals(w.getManagerUserId()));
            if (hasSpecificAssignment) {
                list = list.stream()
                        .filter(w -> currentUserId.equals(w.getManagerUserId()))
                        .collect(Collectors.toList());
            }
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

        Long effectiveBranchId = request.getBranchId();
        if (request.getZoneId() != null) {
            ProductionZone zone = productionZoneRepository.findByFarmIdAndId(farmId, request.getZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Phân khu", request.getZoneId()));
            if (effectiveBranchId == null) {
                effectiveBranchId = zone.getBranchId();
            }
        }
        if (effectiveBranchId == null) {
            effectiveBranchId = SecurityUtils.getCurrentBranchId();
        }

        Warehouse warehouse = Warehouse.builder()
                .tenantId(farm.getTenantId())
                .farmId(farmId)
                .branchId(effectiveBranchId)
                .zoneId(request.getZoneId())
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
        if (request.getZoneId() != null) {
            productionZoneRepository.findByFarmIdAndId(farmId, request.getZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Phân khu", request.getZoneId()));
            warehouse.setZoneId(request.getZoneId());
        }
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

    @Override
    @Transactional
    public void deleteWarehouse(Long farmId, Long warehouseId) {
        Farm farm = getFarmOrThrow(farmId);
        Warehouse warehouse = warehouseRepository.findByFarmIdAndId(farmId, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Kho bãi", warehouseId));

        BigDecimal totalStock = warehouseInventoryRepository.sumQuantityOnHandByWarehouseId(warehouseId);
        if (totalStock != null && totalStock.compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException("Kho đang còn hàng tồn, không thể xóa hoặc đóng kho!");
        }

        boolean hasReceipts = warehouseReceiptRepository.existsByWarehouseId(warehouseId);
        boolean hasIssues = warehouseIssueRepository.existsByWarehouseId(warehouseId);
        boolean hasInventory = warehouseInventoryRepository.existsByWarehouseId(warehouseId);

        if (hasReceipts || hasIssues || hasInventory) {
            // Soft delete / Vô hiệu hóa
            warehouse.setStatus("INACTIVE");
            warehouse.setUpdatedAt(Instant.now());
            warehouse.setUpdatedBy(SecurityUtils.getCurrentUserId());
            warehouseRepository.save(warehouse);

            eventPublisher.publishEvent(AuditTrailEvent.builder()
                    .tenantId(farm.getTenantId())
                    .userId(SecurityUtils.getCurrentUserId())
                    .action("SOFT_DELETE_WAREHOUSE")
                    .module("MASTERDATA")
                    .endpoint("/api/v1/farms/" + farmId + "/warehouses/" + warehouseId)
                    .method("DELETE")
                    .newValue("Warehouse deactivated: " + warehouse.getCode())
                    .build());
        } else {
            warehouseRepository.delete(warehouse);

            eventPublisher.publishEvent(AuditTrailEvent.builder()
                    .tenantId(farm.getTenantId())
                    .userId(SecurityUtils.getCurrentUserId())
                    .action("DELETE_WAREHOUSE")
                    .module("MASTERDATA")
                    .endpoint("/api/v1/farms/" + farmId + "/warehouses/" + warehouseId)
                    .method("DELETE")
                    .newValue("Physically deleted warehouse: " + warehouse.getCode())
                    .build());
        }
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

        String zoneName = null;
        if (w.getZoneId() != null) {
            zoneName = productionZoneRepository.findById(w.getZoneId())
                    .map(ProductionZone::getName)
                    .orElse(null);
        }

        Long lotsCount = 0L;
        Long itemsCount = 0L;
        try {
            Long c = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM warehouse_inventory WHERE warehouse_id = ? AND quantity_on_hand > 0",
                    Long.class, w.getId());
            if (c != null) lotsCount = c;
            Long itc = jdbcTemplate.queryForObject(
                    "SELECT COUNT(DISTINCT material_id) FROM warehouse_inventory WHERE warehouse_id = ? AND quantity_on_hand > 0",
                    Long.class, w.getId());
            if (itc != null) itemsCount = itc;
        } catch (Exception ignored) {
        }

        return WarehouseResponse.builder()
                .id(w.getId())
                .tenantId(w.getTenantId())
                .farmId(w.getFarmId())
                .farmName(farmName)
                .branchId(w.getBranchId())
                .zoneId(w.getZoneId())
                .zoneName(zoneName)
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
                .itemsCount(itemsCount)
                .createdAt(w.getCreatedAt())
                .build();
    }
}
