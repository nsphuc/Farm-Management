package com.farmsaas.modules.inventory.service;

import com.farmsaas.modules.inventory.dto.WarehouseRequest;
import com.farmsaas.modules.inventory.dto.WarehouseResponse;

import java.util.List;

public interface WarehouseService {

    WarehouseResponse createWarehouse(Long farmId, WarehouseRequest request);

    WarehouseResponse updateWarehouse(Long farmId, Long warehouseId, WarehouseRequest request);

    WarehouseResponse getWarehouse(Long farmId, Long warehouseId);

    List<WarehouseResponse> getWarehousesByFarm(Long farmId);

    void deleteWarehouse(Long farmId, Long warehouseId);
}
