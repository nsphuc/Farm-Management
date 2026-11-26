package com.farm.saas.modules.geography.controller;

import com.farm.saas.modules.geography.dto.request.CreateLivestockFacilityRequest;
import com.farm.saas.modules.geography.dto.response.LivestockFacilityResponse;
import com.farm.saas.modules.geography.service.LivestockFacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user/livestock-facilities")
@RequiredArgsConstructor
public class LivestockFacilityController {

    private final LivestockFacilityService livestockFacilityService;

    @GetMapping
    public ResponseEntity<List<LivestockFacilityResponse>> getMyFacilities() {
        return ResponseEntity.ok(livestockFacilityService.getMyFacilities());
    }

    @GetMapping("/search")
    public ResponseEntity<List<LivestockFacilityResponse>> searchFacilities(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(livestockFacilityService.searchFacilities(query));
    }

    @PostMapping("/join")
    public ResponseEntity<Map<String, String>> joinFacility(@RequestParam Long farmId, @RequestParam(required = false) String notes) {
        livestockFacilityService.joinFacility(farmId, notes);
        return ResponseEntity.ok(Map.of("message", "Yêu cầu tham gia cơ sở đã được gửi đến chủ trại."));
    }

    @PostMapping("/demo")
    public ResponseEntity<LivestockFacilityResponse> createDemoFacility(@Valid @RequestBody CreateLivestockFacilityRequest request) {
        return ResponseEntity.ok(livestockFacilityService.createDemoFacility(request));
    }
}
