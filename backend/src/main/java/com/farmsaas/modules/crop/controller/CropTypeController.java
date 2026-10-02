package com.farmsaas.modules.crop.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.crop.dto.CropTypeRequest;
import com.farmsaas.modules.crop.dto.CropTypeResponse;
import com.farmsaas.modules.crop.service.CropTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/crop-types")
@RequiredArgsConstructor
public class CropTypeController {

    private final CropTypeService cropTypeService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CropTypeResponse>>> getAllCropTypes() {
        List<CropTypeResponse> response = cropTypeService.getAllCropTypes();
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách giống cây trồng thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CropTypeResponse>> getCropTypeById(@PathVariable Long id) {
        CropTypeResponse response = cropTypeService.getCropTypeById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết giống cây trồng thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<CropTypeResponse>> createCropType(
            @Valid @RequestBody CropTypeRequest request
    ) {
        CropTypeResponse response = cropTypeService.createCropType(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo giống cây trồng mới thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<CropTypeResponse>> updateCropType(
            @PathVariable Long id,
            @Valid @RequestBody CropTypeRequest request
    ) {
        CropTypeResponse response = cropTypeService.updateCropType(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật giống cây trồng thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteCropType(@PathVariable Long id) {
        cropTypeService.deleteCropType(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa giống cây trồng thành công."));
    }
}
