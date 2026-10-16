package com.farm.saas.modules.inventory.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.inventory.dto.response.InventoryBalanceResponse;
import com.farm.saas.modules.inventory.entity.InventoryBalance;
import com.farm.saas.modules.inventory.entity.Material;
import com.farm.saas.modules.inventory.entity.MaterialCategory;
import com.farm.saas.modules.inventory.entity.Warehouse;
import com.farm.saas.modules.inventory.repository.InventoryBalanceRepository;
import com.farm.saas.modules.inventory.repository.MaterialCategoryRepository;
import com.farm.saas.modules.inventory.repository.MaterialRepository;
import com.farm.saas.modules.inventory.repository.WarehouseRepository;
import com.farm.saas.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service xử lý nghiệp vụ Theo dõi tồn kho hiện tại (Nghiệp vụ: 3.7. Theo dõi tồn kho hiện tại - Inventory Balance).
 * 
 * QUY TẮC BẤT BIẾN & KIẾN TRÚC:
 * 1. Tenant Isolation & Farm Barrier: Chỉ truy vấn số liệu thuộc đúng tenant_id và farm_id được phân quyền.
 * 2. Hiển thị minh bạch số lượng tồn thực tế (quantity_on_hand), số lượng giữ chỗ (reserved_quantity),
 *    và số lượng khả dụng (availableQuantity = quantity_on_hand - reserved_quantity).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryBalanceService {

    private static final Logger log = LoggerFactory.getLogger(InventoryBalanceService.class);

    private final InventoryBalanceRepository balanceRepository;
    private final WarehouseRepository warehouseRepository;
    private final MaterialRepository materialRepository;
    private final MaterialCategoryRepository categoryRepository;

    /**
     * Lấy danh sách tồn kho có phân trang theo Trang trại và Kho bãi.
     */
    public Page<InventoryBalanceResponse> getBalances(Long farmId, Long warehouseId, Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();

        if (farmId != null) {
            SecurityUtils.validateFarmAccess(farmId);
        }

        Page<InventoryBalance> page;
        if (farmId != null && warehouseId != null) {
            page = balanceRepository.findAllByTenantIdAndFarmIdAndWarehouseId(tenantId, farmId, warehouseId, pageable);
        } else if (farmId != null) {
            page = balanceRepository.findAllByTenantIdAndFarmId(tenantId, farmId, pageable);
        } else {
            page = balanceRepository.findAllByTenantId(tenantId, pageable);
        }

        // Cache thông tin hiển thị (Kho, Vật tư, Nhóm) để tối ưu hiệu năng
        Map<Long, Warehouse> warehouseCache = new HashMap<>();
        Map<Long, Material> materialCache = new HashMap<>();
        Map<Long, MaterialCategory> categoryCache = new HashMap<>();

        return page.map(b -> {
            Warehouse wh = warehouseCache.computeIfAbsent(b.getWarehouseId(),
                    id -> warehouseRepository.findByIdAndTenantId(id, tenantId).orElse(null));

            Material mat = materialCache.computeIfAbsent(b.getMaterialId(),
                    id -> materialRepository.findByIdAndTenantId(id, tenantId).orElse(null));

            MaterialCategory cat = null;
            if (mat != null && mat.getCategoryId() != null) {
                cat = categoryCache.computeIfAbsent(mat.getCategoryId(),
                        id -> categoryRepository.findByIdAndTenantId(id, tenantId).orElse(null));
            }

            return mapToResponse(b, wh != null ? wh.getName() : null, mat, cat != null ? cat.getName() : null);
        });
    }

    /**
     * Lấy chi tiết số dư tồn kho của một lô vật tư cụ thể.
     */
    public InventoryBalanceResponse getBalanceById(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();

        InventoryBalance balance = balanceRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Tồn kho", String.valueOf(id)));

        SecurityUtils.validateFarmAccess(balance.getFarmId());

        Warehouse wh = warehouseRepository.findByIdAndTenantId(balance.getWarehouseId(), tenantId).orElse(null);
        Material mat = materialRepository.findByIdAndTenantId(balance.getMaterialId(), tenantId).orElse(null);
        MaterialCategory cat = null;
        if (mat != null && mat.getCategoryId() != null) {
            cat = categoryRepository.findByIdAndTenantId(mat.getCategoryId(), tenantId).orElse(null);
        }

        return mapToResponse(balance, wh != null ? wh.getName() : null, mat, cat != null ? cat.getName() : null);
    }

    /**
     * Lấy danh sách các lô tồn kho của một mặt hàng trong một kho (hỗ trợ FIFO/FEFO khi xuất kho).
     */
    public List<InventoryBalanceResponse> getAvailableBatches(Long warehouseId, Long materialId, String strategy) {
        Long tenantId = SecurityUtils.getRequiredTenantId();

        Warehouse warehouse = warehouseRepository.findByIdAndTenantId(warehouseId, tenantId)
                .orElseThrow(() -> AppException.notFound("Kho bãi", String.valueOf(warehouseId)));

        SecurityUtils.validateFarmAccess(warehouse.getFarmId());

        Material mat = materialRepository.findByIdAndTenantId(materialId, tenantId)
                .orElseThrow(() -> AppException.notFound("Vật tư", String.valueOf(materialId)));

        List<InventoryBalance> list;
        if ("FEFO".equalsIgnoreCase(strategy)) {
            list = balanceRepository.findAllByWarehouseIdAndMaterialIdOrderByExpiryDateAsc(warehouseId, materialId);
        } else {
            list = balanceRepository.findAllByWarehouseIdAndMaterialIdOrderByInwardDateAsc(warehouseId, materialId);
        }

        return list.stream()
                .filter(b -> b.getQuantityOnHand().compareTo(BigDecimal.ZERO) > 0)
                .map(b -> mapToResponse(b, warehouse.getName(), mat, null))
                .toList();
    }

    private InventoryBalanceResponse mapToResponse(
            InventoryBalance b, String warehouseName, Material m, String categoryName) {
        BigDecimal reserved = b.getReservedQuantity() != null ? b.getReservedQuantity() : BigDecimal.ZERO;
        BigDecimal onHand = b.getQuantityOnHand() != null ? b.getQuantityOnHand() : BigDecimal.ZERO;
        BigDecimal available = onHand.subtract(reserved);
        if (available.compareTo(BigDecimal.ZERO) < 0) {
            available = BigDecimal.ZERO;
        }

        return InventoryBalanceResponse.builder()
                .id(b.getId())
                .tenantId(b.getTenantId())
                .farmId(b.getFarmId())
                .warehouseId(b.getWarehouseId())
                .warehouseName(warehouseName)
                .materialId(b.getMaterialId())
                .materialCode(m != null ? m.getSkuCode() : null)
                .materialName(m != null ? m.getName() : null)
                .standardUnit(m != null ? m.getStandardUnit() : null)
                .categoryName(categoryName)
                .batchNumber(b.getBatchNumber())
                .inwardDate(b.getInwardDate())
                .expiryDate(b.getExpiryDate())
                .unitCost(b.getUnitCost())
                .quantityOnHand(onHand)
                .reservedQuantity(reserved)
                .availableQuantity(available)
                .storageBinCode(b.getStorageBinCode())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
