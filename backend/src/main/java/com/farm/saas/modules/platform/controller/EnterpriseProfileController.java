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
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT', 'ROLE_SUPER_ADMIN') or hasAnyRole('FARM_OWNER', 'FARM_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN') or hasAuthority('PERM_FARM_VIEW')")
    public ResponseEntity<EnterpriseProfileResponse> getProfile() {
        EnterpriseProfileResponse response = enterpriseProfileService.getProfile();
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ROLE_FARM_OWNER', 'FARM_OWNER', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<EnterpriseProfileResponse> updateProfile(@Valid @RequestBody UpdateEnterpriseProfileRequest request) {
        EnterpriseProfileResponse response = enterpriseProfileService.updateProfile(request);
        return ResponseEntity.ok(response);
    }
}
