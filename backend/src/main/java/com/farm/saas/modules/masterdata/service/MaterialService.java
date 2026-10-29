package com.farm.saas.modules.masterdata.service;

import com.farm.saas.modules.masterdata.dto.request.CreateMaterialCategoryRequest;
import com.farm.saas.modules.masterdata.dto.request.CreateMaterialRequest;
import com.farm.saas.modules.masterdata.dto.request.CreateUnitConversionRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateMaterialCategoryRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateMaterialRequest;
import com.farm.saas.modules.masterdata.dto.response.BarcodeLookupResponse;
import com.farm.saas.modules.masterdata.dto.response.MaterialCategoryResponse;
import com.farm.saas.modules.masterdata.dto.response.MaterialDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MaterialService {
    // Categories
    List<MaterialCategoryResponse> getCategories();
    MaterialCategoryResponse createCategory(CreateMaterialCategoryRequest request);
    MaterialCategoryResponse updateCategory(Long id, UpdateMaterialCategoryRequest request);
    void deleteCategory(Long id);

    // Materials
    Page<MaterialDetailResponse> getMaterials(Long categoryId, String keyword, Pageable pageable);
    MaterialDetailResponse getMaterialById(Long id);
    MaterialDetailResponse createMaterial(CreateMaterialRequest request);
    MaterialDetailResponse updateMaterial(Long id, UpdateMaterialRequest request);
    MaterialDetailResponse addConversion(Long materialId, CreateUnitConversionRequest request);
    void deleteMaterial(Long id);

    // Scanner
    BarcodeLookupResponse lookupBarcode(Long farmId, String code);
}
