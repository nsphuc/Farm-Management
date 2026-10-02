package com.farmsaas.modules.enterprise.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.enterprise.dto.EnterpriseRequest;
import com.farmsaas.modules.enterprise.dto.EnterpriseResponse;
import com.farmsaas.modules.enterprise.service.EnterpriseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/enterprises")
@RequiredArgsConstructor
public class EnterpriseController {

    private final EnterpriseService enterpriseService;

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<EnterpriseResponse>> getMyEnterprise() {
        EnterpriseResponse response = enterpriseService.getMyEnterprise();
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin doanh nghiệp/HTX thành công."));
    }

    @PutMapping("/my")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<EnterpriseResponse>> updateMyEnterprise(
            @Valid @RequestBody EnterpriseRequest request
    ) {
        EnterpriseResponse response = enterpriseService.updateMyEnterprise(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật hồ sơ doanh nghiệp thành công."));
    }
}
