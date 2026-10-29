package com.farm.saas.modules.masterdata.service;

import com.farm.saas.modules.masterdata.dto.request.CreateWarehouseRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateWarehouseRequest;
import com.farm.saas.modules.masterdata.dto.response.WarehouseResponse;

import java.util.List;

public interface WarehouseService {
    List<WarehouseResponse> getWarehouses(Long farmId, String warehouseType);
    WarehouseResponse getWarehouseById(Long farmId, Long warehouseId);
    WarehouseResponse createWarehouse(Long farmId, CreateWarehouseRequest request);
    WarehouseResponse updateWarehouse(Long farmId, Long warehouseId, UpdateWarehouseRequest request);
    void deleteWarehouse(Long farmId, Long warehouseId);
}
