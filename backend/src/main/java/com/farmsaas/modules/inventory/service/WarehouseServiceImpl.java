package com.farmsaas.modules.inventory.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.inventory.dto.WarehouseRequest;
import com.farmsaas.modules.inventory.dto.WarehouseResponse;
import com.farmsaas.modules.inventory.entity.Warehouse;
import com.farmsaas.modules.inventory.repository.WarehouseRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional
    public WarehouseResponse createWarehouse(Long farmId, WarehouseRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        if (warehouseRepository.existsByTenantIdAndFarmIdAndCode(tenantId, farmId, request.getCode())) {
            throw new BusinessException("Mã kho '" + request.getCode() + "' đã tồn tại trong trang trại này.");
        }

        Warehouse warehouse = Warehouse.builder()
                .farmId(farmId)
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .warehouseType(request.getWarehouseType())
                .locationDesc(request.getLocationDesc())
                .managerUserId(request.getManagerUserId())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();
        warehouse.setTenantId(tenantId);

        Warehouse saved = warehouseRepository.save(warehouse);
        log.info("Created warehouse '{}' (ID: {}) for Farm ID: {} by Tenant ID: {}", saved.getName(), saved.getId(), farmId, tenantId);
        return WarehouseResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public WarehouseResponse updateWarehouse(Long farmId, Long warehouseId, WarehouseRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Warehouse warehouse = warehouseRepository.findByIdAndTenantIdAndFarmId(warehouseId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin kho hàng với ID: " + warehouseId));

        if (!warehouse.getCode().equalsIgnoreCase(request.getCode()) &&
                warehouseRepository.existsByTenantIdAndFarmIdAndCode(tenantId, farmId, request.getCode())) {
            throw new BusinessException("Mã kho '" + request.getCode() + "' đã tồn tại trong trang trại này.");
        }

        warehouse.setCode(request.getCode().trim().toUpperCase());
        warehouse.setName(request.getName().trim());
        warehouse.setWarehouseType(request.getWarehouseType());
        warehouse.setLocationDesc(request.getLocationDesc());
        warehouse.setManagerUserId(request.getManagerUserId());
        if (request.getStatus() != null) {
            warehouse.setStatus(request.getStatus());
        }

        Warehouse updated = warehouseRepository.save(warehouse);
        log.info("Updated warehouse ID: {} for Farm ID: {}", warehouseId, farmId);
        return WarehouseResponse.fromEntity(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouse(Long farmId, Long warehouseId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Warehouse warehouse = warehouseRepository.findByIdAndTenantIdAndFarmId(warehouseId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kho hàng ID: " + warehouseId));
        return WarehouseResponse.fromEntity(warehouse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> getWarehousesByFarm(Long farmId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return warehouseRepository.findByTenantIdAndFarmId(tenantId, farmId).stream()
                .map(WarehouseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteWarehouse(Long farmId, Long warehouseId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Warehouse warehouse = warehouseRepository.findByIdAndTenantIdAndFarmId(warehouseId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kho hàng ID: " + warehouseId));

        warehouseRepository.delete(warehouse);
        log.info("Deleted warehouse ID: {} from Farm ID: {}", warehouseId, farmId);
    }

    private void validateFarmAccess(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức.");
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
