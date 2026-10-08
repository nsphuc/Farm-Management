package com.farmsaas.modules.finance.service;

import com.farmsaas.modules.finance.dto.CostCategoryRequest;
import com.farmsaas.modules.finance.dto.CostCategoryResponse;
import com.farmsaas.modules.finance.entity.enums.CostType;

import java.util.List;

public interface CostCategoryService {

    CostCategoryResponse createCategory(CostCategoryRequest request);

    CostCategoryResponse updateCategory(Long id, CostCategoryRequest request);

    CostCategoryResponse getCategoryById(Long id);

    List<CostCategoryResponse> getAllCategories(CostType costType);

    void initDefaultCategories();

    void deleteCategory(Long id);
}
