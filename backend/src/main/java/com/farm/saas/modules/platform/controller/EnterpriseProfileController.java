package com.farm.saas.modules.platform.controller;

import com.farm.saas.modules.platform.dto.request.UpdateEnterpriseProfileRequest;
import com.farm.saas.modules.platform.dto.response.EnterpriseProfileResponse;
import com.farm.saas.modules.platform.service.EnterpriseProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/enterprise/profile")
@RequiredArgsConstructor
public class EnterpriseProfileController {

    private final EnterpriseProfileService enterpriseProfileService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
    public ResponseEntity<EnterpriseProfileResponse> getProfile() {
        EnterpriseProfileResponse response = enterpriseProfileService.getProfile();
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasAuthority('PERM_FARM_UPDATE')")
    public ResponseEntity<EnterpriseProfileResponse> updateProfile(@Valid @RequestBody UpdateEnterpriseProfileRequest request) {
        EnterpriseProfileResponse response = enterpriseProfileService.updateProfile(request);
        return ResponseEntity.ok(response);
    }
}
