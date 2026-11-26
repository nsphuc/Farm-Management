package com.farm.saas.modules.addons.service;

import com.farm.saas.modules.addons.dto.AddonsDto.*;
import com.farm.saas.modules.addons.entity.*;
import com.farm.saas.modules.auth.dto.request.CreateCustomRoleRequest;
import com.farm.saas.modules.auth.dto.request.UpdateCustomRoleRequest;
import com.farm.saas.modules.auth.dto.response.RoleMatrixResponse;

import java.util.List;

public interface AddonsOperationsService {

    // 1. Payroll
    List<PayrollSheet> getPayrollSheets(Long farmId, Long branchId, String periodMonth);
    PayrollSheet updatePayrollSheet(Long farmId, Long id, UpdatePayrollRequest request);
    void closeAndPayPayroll(Long farmId, Long branchId, String periodMonth, ClosePayrollRequest request);

    // 2. Custom Roles
    List<RoleMatrixResponse> getCustomRoles(Long farmId);
    List<RoleMatrixResponse.PermissionDto> getAllPermissions(Long farmId);
    RoleMatrixResponse createCustomRole(Long farmId, CreateCustomRoleRequest request);
    RoleMatrixResponse updateCustomRole(Long farmId, Long roleId, UpdateCustomRoleRequest request);
    void deleteCustomRole(Long farmId, Long roleId);

    // 3. Breeding Animals
    BreedingSummaryResponse getBreedingSummary(Long farmId, Long branchId);
    List<BreedingAnimal> getBreedingAnimals(Long farmId, Long branchId, String status, String keyword);
    BreedingAnimal createBreedingAnimal(Long farmId, BreedingAnimalRequest request);
    BreedingAnimal updateBreedingAnimal(Long farmId, Long id, BreedingAnimalRequest request);
    BreedingAnimal recordBreedingEvent(Long farmId, Long id, BreedingEventRequest request);
    void deleteBreedingAnimal(Long farmId, Long id);

    // 4. Hatchery Batches
    HatcherySummaryResponse getHatcherySummary(Long farmId);
    List<HatcheryBatch> getHatcheryBatches(Long farmId, Long branchId, String status, String eggType);
    HatcheryBatch createHatcheryBatch(Long farmId, CreateHatcheryBatchRequest request);
    HatcheryBatch updateCandling(Long farmId, Long id, Integer fertileEggs);
    HatcheryBatch finalizeHatch(Long farmId, Long id, FinalizeHatchRequest request);
    void deleteHatcheryBatch(Long farmId, Long id);

    // 5. Feed Production
    List<FeedProductionBom> getBoms(Long farmId);
    FeedProductionBom createBom(Long farmId, CreateFeedBomRequest request);
    FeedProductionBom updateBom(Long farmId, Long id, CreateFeedBomRequest request);
    void deleteBom(Long farmId, Long id);
    List<FeedProductionOrder> getFeedOrders(Long farmId, Long branchId);
    FeedProductionOrder executeFeedOrder(Long farmId, ExecuteFeedOrderRequest request);
}
