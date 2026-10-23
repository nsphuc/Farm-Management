package com.farm.saas.modules.geography.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.geography.dto.request.CreateProductionZoneRequest;
import com.farm.saas.modules.geography.dto.request.CreateZoneLocationRequest;
import com.farm.saas.modules.geography.dto.request.UpdateProductionZoneRequest;
import com.farm.saas.modules.geography.dto.request.UpdateZoneLocationRequest;
import com.farm.saas.modules.geography.dto.response.ProductionZoneResponse;
import com.farm.saas.modules.geography.dto.response.ZoneLocationResponse;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.entity.ZoneLocation;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.geography.service.ProductionZoneService;
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
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductionZoneServiceImpl implements ProductionZoneService {

    private final FarmRepository farmRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final ZoneLocationRepository zoneLocationRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationEventPublisher eventPublisher;
    private final com.farm.saas.modules.notification.service.NotificationService notificationService;

    private static final Set<String> VALID_ZONE_TYPES = Set.of(
            "GREENHOUSE", "OPEN_FIELD", "BARN", "POND", "STORAGE", "ISOLATION"
    );

    private static final Set<String> VALID_ZONE_STATUSES = Set.of(
            "ACTIVE", "FALLOW", "QUARANTINE", "MAINTENANCE"
    );

    private static final Set<String> VALID_LOCATION_STATUSES = Set.of(
            "ACTIVE", "OCCUPIED", "EMPTY", "MAINTENANCE"
    );

    @Override
    @Transactional(readOnly = true)
    public List<ProductionZoneResponse> getZones(Long farmId) {
        Farm farm = getFarmOrThrow(farmId);
        List<ProductionZone> zones = productionZoneRepository.findByFarmId(farmId);
        return zones.stream()
                .filter(z -> !"DELETED".equalsIgnoreCase(z.getStatus()))
                .map(z -> toZoneResponse(z, farm.getName()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductionZoneResponse getZoneById(Long farmId, Long zoneId) {
        Farm farm = getFarmOrThrow(farmId);
        ProductionZone zone = productionZoneRepository.findByFarmIdAndId(farmId, zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Phân khu", zoneId));
        return toZoneResponse(zone, farm.getName());
    }

    @Override
    @Transactional
    public ProductionZoneResponse createZone(Long farmId, CreateProductionZoneRequest request) {
        Farm farm = getFarmOrThrow(farmId);

        String type = request.getZoneType().toUpperCase();
        if (!VALID_ZONE_TYPES.contains(type)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ZONE_TYPE",
                    "Loại phân khu không hợp lệ. Cho phép: " + VALID_ZONE_TYPES);
        }

        if (productionZoneRepository.existsByFarmIdAndCode(farmId, request.getCode().trim().toUpperCase())) {
            throw new ApiException(HttpStatus.CONFLICT, "ZONE_CODE_ALREADY_EXISTS", "Mã phân khu đã tồn tại trong trang trại.");
        }

        // Kiểm tra tổng area_m2 không vượt quá farms.total_area_m2
        BigDecimal currentTotal = productionZoneRepository.sumAreaByFarmIdExcluding(farmId, null);
        BigDecimal newTotal = currentTotal.add(request.getAreaM2());
        if (farm.getTotalAreaM2() != null && newTotal.compareTo(farm.getTotalAreaM2()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_AREA_SIZE",
                    String.format("Tổng diện tích các phân khu (%s m2) vượt quá tổng diện tích trang trại (%s m2).",
                            newTotal, farm.getTotalAreaM2()));
        }

        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        boolean isOwnerOrAdmin = currentUser != null && (currentUser.isSuperAdmin() || currentUser.hasRole("ROLE_FARM_OWNER"));

        String initialStatus = "ACTIVE";
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            String candidate = request.getStatus().trim().toUpperCase();
            if (VALID_ZONE_STATUSES.contains(candidate)) {
                initialStatus = candidate;
            }
        } else if (!isOwnerOrAdmin) {
            // FARM_MANAGER hoặc nhân sự cấp cơ sở tạo phân khu -> Trạng thái MAINTENANCE (Chờ Owner phê duyệt)
            initialStatus = "MAINTENANCE";
        }

        ProductionZone zone = ProductionZone.builder()
                .tenantId(farm.getTenantId())
                .farmId(farmId)
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .zoneType(type)
                .areaM2(request.getAreaM2())
                .soilType(request.getSoilType())
                .waterSource(request.getWaterSource())
                .mapLayoutJson(request.getMapLayoutJson())
                .status(initialStatus)
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        ProductionZone saved = productionZoneRepository.save(zone);

        // Nếu trạng thái là MAINTENANCE (Đề xuất chờ duyệt), gửi thông báo thông tri cho Owner
        if ("MAINTENANCE".equals(initialStatus)) {
            try {
                List<Long> ownerUserIds = jdbcTemplate.query(
                        "SELECT u.id FROM users u " +
                                "JOIN user_roles ur ON u.id = ur.user_id " +
                                "JOIN roles r ON ur.role_id = r.id " +
                                "WHERE u.tenant_id = ? AND r.code = 'ROLE_FARM_OWNER' AND u.status = 'ACTIVE'",
                        (rs, rowNum) -> rs.getLong("id"),
                        farm.getTenantId()
                );
                for (Long ownerId : ownerUserIds) {
                    notificationService.sendNotification(
                            farm.getTenantId(),
                            ownerId,
                            "Đề xuất mở phân khu mới: " + zone.getName(),
                            "Giám đốc trang trại " + farm.getName() + " vừa gửi đề xuất mở phân khu " + zone.getName() + " (" + zone.getCode() + ") diện tích " + zone.getAreaM2() + " m2 đang chờ phê duyệt.",
                            "INFO",
                            "SYSTEM",
                            zone.getId(),
                            "/app/geography?farmId=" + farmId + "&zoneId=" + zone.getId()
                    );
                }
            } catch (Exception ex) {
                log.warn("Could not dispatch notification to Farm Owner for zone proposal: {}", ex.getMessage());
            }
        }

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_ZONE")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/zones")
                .method("POST")
                .newValue("Zone: " + saved.getCode())
                .build());

        return toZoneResponse(saved, farm.getName());
    }

    @Override
    @Transactional
    public ProductionZoneResponse updateZone(Long farmId, Long zoneId, UpdateProductionZoneRequest request) {
        Farm farm = getFarmOrThrow(farmId);
        ProductionZone zone = productionZoneRepository.findByFarmIdAndId(farmId, zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Phân khu", zoneId));

        if (request.getZoneType() != null) {
            String type = request.getZoneType().toUpperCase();
            if (!VALID_ZONE_TYPES.contains(type)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ZONE_TYPE", "Loại phân khu không hợp lệ.");
            }
            zone.setZoneType(type);
        }

        if (request.getStatus() != null) {
            String status = request.getStatus().toUpperCase();
            if (!VALID_ZONE_STATUSES.contains(status)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ZONE_STATUS", "Trạng thái phân khu không hợp lệ.");
            }
            zone.setStatus(status);
        }

        // Kiểm tra tổng diện tích
        BigDecimal otherTotal = productionZoneRepository.sumAreaByFarmIdExcluding(farmId, zoneId);
        BigDecimal newTotal = otherTotal.add(request.getAreaM2());
        if (farm.getTotalAreaM2() != null && newTotal.compareTo(farm.getTotalAreaM2()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_AREA_SIZE",
                    String.format("Tổng diện tích các phân khu (%s m2) vượt quá tổng diện tích trang trại (%s m2).",
                            newTotal, farm.getTotalAreaM2()));
        }

        zone.setName(request.getName().trim());
        zone.setAreaM2(request.getAreaM2());
        zone.setSoilType(request.getSoilType());
        zone.setWaterSource(request.getWaterSource());
        zone.setMapLayoutJson(request.getMapLayoutJson());
        zone.setUpdatedAt(Instant.now());
        zone.setUpdatedBy(SecurityUtils.getCurrentUserId());

        ProductionZone updated = productionZoneRepository.save(zone);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_ZONE")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/zones/" + zoneId)
                .method("PUT")
                .newValue("Updated zone: " + updated.getCode())
                .build());

        return toZoneResponse(updated, farm.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ZoneLocationResponse> getLocations(Long farmId, Long zoneId) {
        getFarmOrThrow(farmId);
        ProductionZone zone = productionZoneRepository.findByFarmIdAndId(farmId, zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Phân khu", zoneId));

        List<ZoneLocation> locations = zoneLocationRepository.findByZoneId(zoneId);
        return locations.stream()
                .filter(loc -> !"DELETED".equalsIgnoreCase(loc.getStatus()))
                .map(loc -> toLocationResponse(loc, zone.getName()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ZoneLocationResponse createLocation(Long farmId, Long zoneId, CreateZoneLocationRequest request) {
        Farm farm = getFarmOrThrow(farmId);
        ProductionZone zone = productionZoneRepository.findByFarmIdAndId(farmId, zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Phân khu", zoneId));

        String code = request.getCode().trim().toUpperCase();
        if (zoneLocationRepository.existsByZoneIdAndCode(zoneId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "LOCATION_CODE_ALREADY_EXISTS", "Mã vị trí đã tồn tại trong phân khu.");
        }

        String status = request.getStatus() != null ? request.getStatus().toUpperCase() : "EMPTY";
        if (!VALID_LOCATION_STATUSES.contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_LOCATION_STATUS", "Trạng thái vị trí không hợp lệ.");
        }

        ZoneLocation location = ZoneLocation.builder()
                .tenantId(farm.getTenantId())
                .farmId(farmId)
                .zoneId(zoneId)
                .code(code)
                .name(request.getName().trim())
                .description(request.getDescription())
                .status(status)
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        ZoneLocation saved = zoneLocationRepository.save(location);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_LOCATION")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/zones/" + zoneId + "/locations")
                .method("POST")
                .newValue("Location: " + saved.getCode())
                .build());

        return toLocationResponse(saved, zone.getName());
    }

    @Override
    @Transactional
    public ZoneLocationResponse updateLocation(Long farmId, Long zoneId, Long locationId, UpdateZoneLocationRequest request) {
        Farm farm = getFarmOrThrow(farmId);
        ProductionZone zone = productionZoneRepository.findByFarmIdAndId(farmId, zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Phân khu", zoneId));

        ZoneLocation location = zoneLocationRepository.findByZoneIdAndId(zoneId, locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Vị trí / Lô", locationId));

        location.setName(request.getName().trim());
        location.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            String status = request.getStatus().toUpperCase();
            if (!VALID_LOCATION_STATUSES.contains(status)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_LOCATION_STATUS", "Trạng thái vị trí không hợp lệ.");
            }
            location.setStatus(status);
        }
        location.setUpdatedAt(Instant.now());
        location.setUpdatedBy(SecurityUtils.getCurrentUserId());

        ZoneLocation updated = zoneLocationRepository.save(location);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_LOCATION")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/zones/" + zoneId + "/locations/" + locationId)
                .method("PUT")
                .newValue("Updated location: " + updated.getCode())
                .build());

        return toLocationResponse(updated, zone.getName());
    }

    @Override
    @Transactional
    public void deleteLocation(Long farmId, Long zoneId, Long locationId) {
        Farm farm = getFarmOrThrow(farmId);
        ZoneLocation location = zoneLocationRepository.findByZoneIdAndId(zoneId, locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Vị trí / Lô", locationId));

        location.setStatus("DELETED");
        location.setUpdatedAt(Instant.now());
        location.setUpdatedBy(SecurityUtils.getCurrentUserId());
        zoneLocationRepository.save(location);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(farm.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("DELETE_LOCATION")
                .module("GEOGRAPHY")
                .endpoint("/api/v1/farms/" + farmId + "/zones/" + zoneId + "/locations/" + locationId)
                .method("DELETE")
                .newValue("Deleted location: " + location.getCode())
                .build());
    }

    private Farm getFarmOrThrow(Long farmId) {
        return farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Trang trại", farmId));
    }

    private ProductionZoneResponse toZoneResponse(ProductionZone z, String farmName) {
        Long activeLocations = 0L;
        try {
            Long c = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM zone_locations WHERE zone_id = ? AND status != 'DELETED'",
                    Long.class, z.getId());
            if (c != null) activeLocations = c;
        } catch (Exception ignored) {
        }

        return ProductionZoneResponse.builder()
                .id(z.getId())
                .tenantId(z.getTenantId())
                .farmId(z.getFarmId())
                .farmName(farmName)
                .code(z.getCode())
                .name(z.getName())
                .zoneType(z.getZoneType())
                .areaM2(z.getAreaM2())
                .soilType(z.getSoilType())
                .waterSource(z.getWaterSource())
                .mapLayoutJson(z.getMapLayoutJson())
                .status(z.getStatus())
                .activeLocationsCount(activeLocations)
                .createdAt(z.getCreatedAt())
                .build();
    }

    private ZoneLocationResponse toLocationResponse(ZoneLocation loc, String zoneName) {
        return ZoneLocationResponse.builder()
                .id(loc.getId())
                .tenantId(loc.getTenantId())
                .farmId(loc.getFarmId())
                .zoneId(loc.getZoneId())
                .zoneName(zoneName)
                .code(loc.getCode())
                .name(loc.getName())
                .description(loc.getDescription())
                .status(loc.getStatus())
                .createdAt(loc.getCreatedAt())
                .build();
    }
}
