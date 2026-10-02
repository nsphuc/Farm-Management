package com.farmsaas.modules.farm.service;

import com.farmsaas.modules.farm.dto.*;

import java.util.List;

public interface ZoneService {

    List<ZoneResponse> getZonesByFarmId(Long farmId);

    ZoneResponse getZoneById(Long farmId, Long zoneId);

    ZoneResponse createZone(Long farmId, CreateZoneRequest request);

    ZoneResponse updateZone(Long farmId, Long zoneId, UpdateZoneRequest request);

    ZoneResponse updateZoneStatus(Long farmId, Long zoneId, String status);

    void deleteZone(Long farmId, Long zoneId);

    // Zone Locations
    List<ZoneLocationResponse> getLocationsByZoneId(Long farmId, Long zoneId);

    ZoneLocationResponse createLocation(Long farmId, Long zoneId, CreateZoneLocationRequest request);

    ZoneLocationResponse updateLocation(Long farmId, Long zoneId, Long locId, UpdateZoneLocationRequest request);

    void deleteLocation(Long farmId, Long zoneId, Long locId);
}
