package com.farm.saas.modules.masterdata.service;

import com.farm.saas.modules.masterdata.dto.request.*;
import com.farm.saas.modules.masterdata.dto.response.*;

import java.util.List;

public interface MasterCatalogService {
    // Crop Types
    List<CropTypeResponse> getCropTypes();
    CropTypeResponse getCropTypeById(Long id);
    CropTypeResponse createCropType(CreateCropTypeRequest request);
    CropTypeResponse updateCropType(Long id, UpdateCropTypeRequest request);

    // Livestock Breeds
    List<LivestockBreedResponse> getLivestockBreeds(String species);
    LivestockBreedResponse getLivestockBreedById(Long id);
    LivestockBreedResponse createLivestockBreed(CreateLivestockBreedRequest request);
    LivestockBreedResponse updateLivestockBreed(Long id, UpdateLivestockBreedRequest request);

    // Consumption Quotas
    List<ConsumptionQuotaResponse> getQuotas(Long farmId);
    ConsumptionQuotaResponse createQuota(CreateConsumptionQuotaRequest request);
    ConsumptionQuotaResponse updateQuota(Long id, UpdateConsumptionQuotaRequest request);

    // Work Shifts
    List<WorkShiftResponse> getWorkShifts();
    WorkShiftResponse createWorkShift(CreateWorkShiftRequest request);
    WorkShiftResponse updateWorkShift(Long id, UpdateWorkShiftRequest request);

    // Cost Categories
    List<CostCategoryResponse> getCostCategories();
    CostCategoryResponse createCostCategory(CreateCostCategoryRequest request);
    CostCategoryResponse updateCostCategory(Long id, UpdateCostCategoryRequest request);
}
