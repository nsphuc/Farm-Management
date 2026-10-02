package com.farmsaas.modules.traceability.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.traceability.dto.PublicTraceabilityResponse;
import com.farmsaas.modules.traceability.service.PublicTraceabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/traceability")
@RequiredArgsConstructor
public class PublicTraceabilityController {

    private final PublicTraceabilityService publicTraceabilityService;

    @GetMapping("/{traceabilityCode}")
    public ResponseEntity<ApiResponse<PublicTraceabilityResponse>> getPublicTraceability(
            @PathVariable String traceabilityCode
    ) {
        PublicTraceabilityResponse response = publicTraceabilityService.getPublicTraceability(traceabilityCode);
        return ResponseEntity.ok(ApiResponse.success(response, "Tra cứu nguồn gốc nông sản thành công."));
    }
}
