package com.farm.saas.modules.masterdata.service;

import com.farm.saas.modules.masterdata.dto.request.*;
import com.farm.saas.modules.masterdata.dto.response.*;

import java.util.List;

public interface MasterCatalogService {
    // Livestock Breeds
    List<LivestockBreedResponse> getLivestockBreeds(String species);
    LivestockBreedResponse getLivestockBreedById(Long id);
    LivestockBreedResponse createLivestockBreed(CreateLivestockBreedRequest request);
    LivestockBreedResponse updateLivestockBreed(Long id, UpdateLivestockBreedRequest request);
    void deleteLivestockBreed(Long id);

    // Consumption Quotas
    List<ConsumptionQuotaResponse> getQuotas(Long farmId);
    ConsumptionQuotaResponse createQuota(CreateConsumptionQuotaRequest request);
    ConsumptionQuotaResponse updateQuota(Long id, UpdateConsumptionQuotaRequest request);
    void deleteQuota(Long id);

    // Cost Categories
    List<CostCategoryResponse> getCostCategories();
    CostCategoryResponse createCostCategory(CreateCostCategoryRequest request);
    CostCategoryResponse updateCostCategory(Long id, UpdateCostCategoryRequest request);
    void deleteCostCategory(Long id);
}
