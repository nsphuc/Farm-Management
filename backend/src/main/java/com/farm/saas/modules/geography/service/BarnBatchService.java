package com.farm.saas.modules.geography.service;

import com.farm.saas.modules.geography.dto.request.*;
import com.farm.saas.modules.geography.dto.response.*;
import com.farm.saas.modules.livestock.dto.request.CreateBatchRequest;
import com.farm.saas.modules.livestock.dto.request.SplitBatchRequest;
import com.farm.saas.modules.livestock.dto.response.BatchDetailResponse;

import java.util.List;

public interface BarnBatchService {

    // Zones
    List<ProductionZoneResponse> getZones(Long farmId, Long branchId);
    ProductionZoneResponse createZone(Long farmId, CreateProductionZoneRequest request);
    ProductionZoneResponse updateZone(Long farmId, Long zoneId, UpdateProductionZoneRequest request);
    void deleteZone(Long farmId, Long zoneId);

    // Barns
    List<BarnCardResponse> getBarns(Long farmId, Long branchId);
    ZoneLocationResponse createBarn(Long farmId, CreateZoneLocationRequest request);
    ZoneLocationResponse updateBarn(Long farmId, Long barnId, UpdateZoneLocationRequest request);
    void deleteBarn(Long farmId, Long barnId);

    // Batches
    BatchDetailResponse getBatchById(Long batchId);
    BatchDetailResponse createBatch(Long farmId, CreateBatchRequest request);
    BatchDetailResponse splitBatch(Long batchId, SplitBatchRequest request);
    BatchDetailResponse closeBatch(Long batchId);
    BatchDetailResponse updateTargets(Long batchId, com.farm.saas.modules.livestock.dto.request.BatchTargetsRequest request);
    BatchDetailResponse addGroup(Long batchId, com.farm.saas.modules.livestock.dto.request.AddBatchGroupRequest request);
    BatchDetailResponse applyProgram(Long batchId, com.farm.saas.modules.livestock.dto.request.ApplyProgramRequest request);
    BatchDetailResponse removeProgram(Long batchId, Long programId);
    BatchDetailResponse addByProduct(Long batchId, com.farm.saas.modules.livestock.dto.request.AddByProductRequest request);
}
