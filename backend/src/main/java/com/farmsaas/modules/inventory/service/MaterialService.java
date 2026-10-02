package com.farmsaas.modules.inventory.service;

import com.farmsaas.modules.inventory.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MaterialService {

    MaterialCategoryResponse createCategory(MaterialCategoryRequest request);

    MaterialCategoryResponse updateCategory(Long categoryId, MaterialCategoryRequest request);

    List<MaterialCategoryResponse> getCategories();

    void deleteCategory(Long categoryId);

    MaterialResponse createMaterial(MaterialRequest request);

    MaterialResponse updateMaterial(Long materialId, MaterialRequest request);

    MaterialResponse getMaterial(Long materialId);

    Page<MaterialResponse> searchMaterials(Long categoryId, String status, String keyword, Pageable pageable);

    void deleteMaterial(Long materialId);
}
