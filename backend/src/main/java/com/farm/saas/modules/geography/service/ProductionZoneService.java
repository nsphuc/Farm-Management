package com.farm.saas.modules.geography.service;

import com.farm.saas.modules.geography.dto.request.CreateProductionZoneRequest;
import com.farm.saas.modules.geography.dto.request.CreateZoneLocationRequest;
import com.farm.saas.modules.geography.dto.request.UpdateProductionZoneRequest;
import com.farm.saas.modules.geography.dto.request.UpdateZoneLocationRequest;
import com.farm.saas.modules.geography.dto.response.ProductionZoneResponse;
import com.farm.saas.modules.geography.dto.response.ZoneLocationResponse;

import java.util.List;

public interface ProductionZoneService {
    List<ProductionZoneResponse> getZones(Long farmId);
    ProductionZoneResponse getZoneById(Long farmId, Long zoneId);
    ProductionZoneResponse createZone(Long farmId, CreateProductionZoneRequest request);
    ProductionZoneResponse updateZone(Long farmId, Long zoneId, UpdateProductionZoneRequest request);

    List<ZoneLocationResponse> getLocations(Long farmId, Long zoneId);
    ZoneLocationResponse createLocation(Long farmId, Long zoneId, CreateZoneLocationRequest request);
    ZoneLocationResponse updateLocation(Long farmId, Long zoneId, Long locationId, UpdateZoneLocationRequest request);
    void deleteLocation(Long farmId, Long zoneId, Long locationId);
}
