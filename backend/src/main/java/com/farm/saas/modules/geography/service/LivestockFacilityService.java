package com.farm.saas.modules.geography.service;

import com.farm.saas.modules.geography.dto.request.CreateLivestockFacilityRequest;
import com.farm.saas.modules.geography.dto.response.LivestockFacilityResponse;

import java.util.List;

public interface LivestockFacilityService {
    List<LivestockFacilityResponse> getMyFacilities();
    List<LivestockFacilityResponse> searchFacilities(String query);
    void joinFacility(Long farmId, String notes);
    LivestockFacilityResponse createDemoFacility(CreateLivestockFacilityRequest request);
}
