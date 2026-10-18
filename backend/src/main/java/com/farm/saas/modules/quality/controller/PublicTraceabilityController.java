package com.farm.saas.modules.quality.controller;

import com.farm.saas.modules.quality.dto.response.PublicTraceabilityResponse;
import com.farm.saas.modules.quality.service.TraceabilityService;
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

    private final TraceabilityService traceabilityService;

    @GetMapping("/{traceabilityCode}")
    public ResponseEntity<PublicTraceabilityResponse> getPublicTraceability(@PathVariable String traceabilityCode) {
        return ResponseEntity.ok(traceabilityService.getPublicTraceability(traceabilityCode));
    }
}
