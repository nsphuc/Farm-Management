package com.farm.saas.modules.masterdata.controller;

import com.farm.saas.modules.masterdata.dto.request.CreateLivestockBreedRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateLivestockBreedRequest;
import com.farm.saas.modules.masterdata.dto.response.LivestockBreedResponse;
import com.farm.saas.modules.masterdata.service.MasterCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/master/livestock-breeds")
@RequiredArgsConstructor
public class LivestockBreedController {

    private final MasterCatalogService masterCatalogService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_VIEW')")
    public ResponseEntity<List<LivestockBreedResponse>> getLivestockBreeds(
            @RequestParam(required = false) String species) {
        return ResponseEntity.ok(masterCatalogService.getLivestockBreeds(species));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_VIEW')")
    public ResponseEntity<LivestockBreedResponse> getLivestockBreedById(@PathVariable Long id) {
        return ResponseEntity.ok(masterCatalogService.getLivestockBreedById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_MANAGE')")
    public ResponseEntity<LivestockBreedResponse> createLivestockBreed(@Valid @RequestBody CreateLivestockBreedRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterCatalogService.createLivestockBreed(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_LIVESTOCK_MANAGE')")
    public ResponseEntity<LivestockBreedResponse> updateLivestockBreed(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLivestockBreedRequest request) {
        return ResponseEntity.ok(masterCatalogService.updateLivestockBreed(id, request));
    }
}
