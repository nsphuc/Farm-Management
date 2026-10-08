package com.farmsaas.modules.finance.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.finance.dto.CostCategoryRequest;
import com.farmsaas.modules.finance.dto.CostCategoryResponse;
import com.farmsaas.modules.finance.entity.enums.CostType;
import com.farmsaas.modules.finance.service.CostCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/farms/{farmId}/cost-categories", "/api/v1/farms/{farmId}/finance/cost-categories"})
@RequiredArgsConstructor
public class CostCategoryController {

    private final CostCategoryService costCategoryService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CostCategoryResponse>>> getAllCategories(
            @PathVariable Long farmId,
            @RequestParam(required = false) CostType costType
    ) {
        List<CostCategoryResponse> list = costCategoryService.getAllCategories(costType);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh mục chi phí thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CostCategoryResponse>> getCategoryById(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        CostCategoryResponse response = costCategoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết danh mục chi phí thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<CostCategoryResponse>> createCategory(
            @PathVariable Long farmId,
            @Valid @RequestBody CostCategoryRequest request
    ) {
        CostCategoryResponse response = costCategoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo danh mục chi phí thành công."));
    }

    @PostMapping("/init-defaults")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Void>> initDefaultCategories(@PathVariable Long farmId) {
        costCategoryService.initDefaultCategories();
        return ResponseEntity.ok(ApiResponse.success(null, "Khởi tạo danh mục chi phí mặc định thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<CostCategoryResponse>> updateCategory(
            @PathVariable Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody CostCategoryRequest request
    ) {
        CostCategoryResponse response = costCategoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật danh mục chi phí thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Long farmId,
            @PathVariable Long id
    ) {
        costCategoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa danh mục chi phí thành công."));
    }
}
