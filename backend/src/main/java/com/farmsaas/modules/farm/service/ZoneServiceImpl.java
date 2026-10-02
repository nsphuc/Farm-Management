package com.farmsaas.modules.farm.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.dto.*;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.farm.entity.ProductionZone;
import com.farmsaas.modules.farm.entity.ZoneLocation;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.farm.repository.ProductionZoneRepository;
import com.farmsaas.modules.farm.repository.ZoneLocationRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ZoneServiceImpl implements ZoneService {

    private final FarmRepository farmRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final ZoneLocationRepository zoneLocationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ZoneResponse> getZonesByFarmId(Long farmId) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        List<ProductionZone> zones = productionZoneRepository.findByFarmIdAndTenantId(farmId, tenantId);
        return zones.stream()
                .map(zone -> {
                    long locCount = zoneLocationRepository.countByZoneIdAndTenantId(zone.getId(), tenantId);
                    return ZoneResponse.fromEntity(zone, locCount);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ZoneResponse getZoneById(Long farmId, Long zoneId) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Phân khu", zoneId));

        long locCount = zoneLocationRepository.countByZoneIdAndTenantId(zone.getId(), tenantId);
        return ZoneResponse.fromEntity(zone, locCount);
    }

    @Override
    @Transactional
    public ZoneResponse createZone(Long farmId, CreateZoneRequest request) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        String code = request.getCode().trim().toUpperCase();
        if (productionZoneRepository.existsByFarmIdAndCode(farmId, code)) {
            throw new BusinessException("Mã phân khu '" + code + "' đã tồn tại trong trang trại này.");
        }

        ProductionZone zone = ProductionZone.builder()
                .farmId(farmId)
                .code(code)
                .name(request.getName().trim())
                .zoneType(request.getZoneType())
                .areaM2(request.getAreaM2())
                .soilType(request.getSoilType())
                .waterSource(request.getWaterSource())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .notes(request.getNotes())
                .build();
        zone.setTenantId(tenantId);

        ProductionZone saved = productionZoneRepository.save(zone);
        log.info("Created ProductionZone: {} for farmId: {}", saved.getName(), farmId);
        return ZoneResponse.fromEntity(saved, 0L);
    }

    @Override
    @Transactional
    public ZoneResponse updateZone(Long farmId, Long zoneId, UpdateZoneRequest request) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Phân khu", zoneId));

        zone.setName(request.getName().trim());
        zone.setZoneType(request.getZoneType());
        zone.setAreaM2(request.getAreaM2());
        zone.setSoilType(request.getSoilType());
        zone.setWaterSource(request.getWaterSource());
        if (request.getStatus() != null) {
            zone.setStatus(request.getStatus());
        }
        zone.setNotes(request.getNotes());

        ProductionZone saved = productionZoneRepository.save(zone);
        long locCount = zoneLocationRepository.countByZoneIdAndTenantId(saved.getId(), tenantId);
        return ZoneResponse.fromEntity(saved, locCount);
    }

    @Override
    @Transactional
    public ZoneResponse updateZoneStatus(Long farmId, Long zoneId, String status) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Phân khu", zoneId));

        zone.setStatus(status);
        ProductionZone saved = productionZoneRepository.save(zone);
        long locCount = zoneLocationRepository.countByZoneIdAndTenantId(saved.getId(), tenantId);
        log.info("Updated status of Zone {} to {}", zoneId, status);
        return ZoneResponse.fromEntity(saved, locCount);
    }

    @Override
    @Transactional
    public void deleteZone(Long farmId, Long zoneId) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Phân khu", zoneId));

        productionZoneRepository.delete(zone);
        log.info("Deleted ProductionZone: {} (ID: {})", zone.getName(), zoneId);
    }

    // Zone Locations Implementation
    @Override
    @Transactional(readOnly = true)
    public List<ZoneLocationResponse> getLocationsByZoneId(Long farmId, Long zoneId) {
        Long tenantId = getRequiredTenantId();
        verifyZoneExists(farmId, zoneId, tenantId);

        List<ZoneLocation> locations = zoneLocationRepository.findByZoneIdAndTenantId(zoneId, tenantId);
        return locations.stream()
                .map(ZoneLocationResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public ZoneLocationResponse createLocation(Long farmId, Long zoneId, CreateZoneLocationRequest request) {
        Long tenantId = getRequiredTenantId();
        verifyZoneExists(farmId, zoneId, tenantId);

        String code = request.getCode().trim().toUpperCase();
        if (zoneLocationRepository.existsByZoneIdAndCode(zoneId, code)) {
            throw new BusinessException("Mã vị trí '" + code + "' đã tồn tại trong phân khu này.");
        }

        ZoneLocation location = ZoneLocation.builder()
                .zoneId(zoneId)
                .code(code)
                .name(request.getName().trim())
                .locationType(request.getLocationType())
                .areaM2(request.getAreaM2())
                .capacity(request.getCapacity())
                .status(request.getStatus() != null ? request.getStatus() : "EMPTY")
                .build();
        location.setTenantId(tenantId);

        ZoneLocation saved = zoneLocationRepository.save(location);
        log.info("Created ZoneLocation: {} in zoneId: {}", saved.getName(), zoneId);
        return ZoneLocationResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ZoneLocationResponse updateLocation(Long farmId, Long zoneId, Long locId, UpdateZoneLocationRequest request) {
        Long tenantId = getRequiredTenantId();
        verifyZoneExists(farmId, zoneId, tenantId);

        ZoneLocation location = zoneLocationRepository.findByIdAndZoneIdAndTenantId(locId, zoneId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Vị trí/ô", locId));

        location.setName(request.getName().trim());
        location.setLocationType(request.getLocationType());
        location.setAreaM2(request.getAreaM2());
        location.setCapacity(request.getCapacity());
        if (request.getStatus() != null) {
            location.setStatus(request.getStatus());
        }

        ZoneLocation saved = zoneLocationRepository.save(location);
        return ZoneLocationResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteLocation(Long farmId, Long zoneId, Long locId) {
        Long tenantId = getRequiredTenantId();
        verifyZoneExists(farmId, zoneId, tenantId);

        ZoneLocation location = zoneLocationRepository.findByIdAndZoneIdAndTenantId(locId, zoneId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Vị trí/ô", locId));

        zoneLocationRepository.delete(location);
        log.info("Deleted ZoneLocation: {} (ID: {})", location.getName(), locId);
    }

    private void verifyFarmExists(Long farmId, Long tenantId) {
        if (!farmRepository.existsById(farmId)) {
            throw new EntityNotFoundException("Trang trại", farmId);
        }
    }

    private void verifyZoneExists(Long farmId, Long zoneId, Long tenantId) {
        if (!productionZoneRepository.existsById(zoneId)) {
            throw new EntityNotFoundException("Phân khu", zoneId);
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
