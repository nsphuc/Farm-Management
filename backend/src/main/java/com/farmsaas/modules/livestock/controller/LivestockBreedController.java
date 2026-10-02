package com.farmsaas.modules.livestock.controller;

import com.farmsaas.common.dto.ApiResponse;
import com.farmsaas.modules.livestock.dto.LivestockBreedRequest;
import com.farmsaas.modules.livestock.dto.LivestockBreedResponse;
import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;
import com.farmsaas.modules.livestock.service.LivestockBreedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/livestock-breeds")
@RequiredArgsConstructor
public class LivestockBreedController {

    private final LivestockBreedService breedService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<LivestockBreedResponse>>> getAllBreeds(
            @RequestParam(required = false) LivestockSpecies species
    ) {
        List<LivestockBreedResponse> response = breedService.getAllBreeds(species);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh mục giống vật nuôi thành công."));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LivestockBreedResponse>> getBreedById(@PathVariable Long id) {
        LivestockBreedResponse response = breedService.getBreedById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết giống vật nuôi thành công."));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<LivestockBreedResponse>> createBreed(
            @Valid @RequestBody LivestockBreedRequest request
    ) {
        LivestockBreedResponse response = breedService.createBreed(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo giống vật nuôi mới thành công."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_TECHNICAL_STAFF')")
    public ResponseEntity<ApiResponse<LivestockBreedResponse>> updateBreed(
            @PathVariable Long id,
            @Valid @RequestBody LivestockBreedRequest request
    ) {
        LivestockBreedResponse response = breedService.updateBreed(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật giống vật nuôi thành công."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteBreed(@PathVariable Long id) {
        breedService.deleteBreed(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa giống vật nuôi thành công."));
    }
}
