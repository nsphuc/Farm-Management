package com.farm.saas.modules.geography.controller;

import com.farm.saas.modules.geography.dto.request.CreateProductionZoneRequest;
import com.farm.saas.modules.geography.dto.request.CreateZoneLocationRequest;
import com.farm.saas.modules.geography.dto.request.UpdateProductionZoneRequest;
import com.farm.saas.modules.geography.dto.request.UpdateZoneLocationRequest;
import com.farm.saas.modules.geography.dto.response.ProductionZoneResponse;
import com.farm.saas.modules.geography.dto.response.ZoneLocationResponse;
import com.farm.saas.modules.geography.service.ProductionZoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/zones")
@RequiredArgsConstructor
public class ProductionZoneController {

    private final ProductionZoneService productionZoneService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<List<ProductionZoneResponse>> getZones(@PathVariable Long farmId) {
        return ResponseEntity.ok(productionZoneService.getZones(farmId));
    }

    @GetMapping("/{zoneId}")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ProductionZoneResponse> getZoneById(
            @PathVariable Long farmId,
            @PathVariable Long zoneId) {
        return ResponseEntity.ok(productionZoneService.getZoneById(farmId, zoneId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ProductionZoneResponse> createZone(
            @PathVariable Long farmId,
            @Valid @RequestBody CreateProductionZoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productionZoneService.createZone(farmId, request));
    }

    @PutMapping("/{zoneId}")
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ProductionZoneResponse> updateZone(
            @PathVariable Long farmId,
            @PathVariable Long zoneId,
            @Valid @RequestBody UpdateProductionZoneRequest request) {
        return ResponseEntity.ok(productionZoneService.updateZone(farmId, zoneId, request));
    }

    @GetMapping("/{zoneId}/locations")
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<List<ZoneLocationResponse>> getLocations(
            @PathVariable Long farmId,
            @PathVariable Long zoneId) {
        return ResponseEntity.ok(productionZoneService.getLocations(farmId, zoneId));
    }

    @PostMapping("/{zoneId}/locations")
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ZoneLocationResponse> createLocation(
            @PathVariable Long farmId,
            @PathVariable Long zoneId,
            @Valid @RequestBody CreateZoneLocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productionZoneService.createLocation(farmId, zoneId, request));
    }

    @PutMapping("/{zoneId}/locations/{locationId}")
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<ZoneLocationResponse> updateLocation(
            @PathVariable Long farmId,
            @PathVariable Long zoneId,
            @PathVariable Long locationId,
            @Valid @RequestBody UpdateZoneLocationRequest request) {
        return ResponseEntity.ok(productionZoneService.updateLocation(farmId, zoneId, locationId, request));
    }

    @DeleteMapping("/{zoneId}/locations/{locationId}")
    @PreAuthorize("hasAuthority('PERM_ZONE_MANAGE') and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<Void> deleteLocation(
            @PathVariable Long farmId,
            @PathVariable Long zoneId,
            @PathVariable Long locationId) {
        productionZoneService.deleteLocation(farmId, zoneId, locationId);
        return ResponseEntity.noContent().build();
    }
}
