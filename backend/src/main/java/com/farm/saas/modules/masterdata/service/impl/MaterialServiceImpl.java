package com.farm.saas.modules.masterdata.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.masterdata.dto.request.CreateMaterialCategoryRequest;
import com.farm.saas.modules.masterdata.dto.request.CreateMaterialRequest;
import com.farm.saas.modules.masterdata.dto.request.CreateUnitConversionRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateMaterialCategoryRequest;
import com.farm.saas.modules.masterdata.dto.request.UpdateMaterialRequest;
import com.farm.saas.modules.masterdata.dto.response.BarcodeLookupResponse;
import com.farm.saas.modules.masterdata.dto.response.MaterialCategoryResponse;
import com.farm.saas.modules.masterdata.dto.response.MaterialDetailResponse;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.MaterialCategory;
import com.farm.saas.modules.masterdata.entity.MaterialUnitConversion;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.MaterialCategoryRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.MaterialUnitConversionRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.farm.saas.modules.masterdata.service.MaterialService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MaterialServiceImpl implements MaterialService {

    private final MaterialRepository materialRepository;
    private final MaterialCategoryRepository categoryRepository;
    private final MaterialUnitConversionRepository conversionRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseInventoryRepository inventoryRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationEventPublisher eventPublisher;

    // --- Material Categories ---

    @Override
    @Transactional(readOnly = true)
    public List<MaterialCategoryResponse> getCategories() {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<MaterialCategory> categories = tenantId != null
                ? categoryRepository.findByTenantId(tenantId)
                : categoryRepository.findAll();

        return categories.stream().map(this::toCategoryResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MaterialCategoryResponse createCategory(CreateMaterialCategoryRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null && !SecurityUtils.isSuperAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT", "Thiếu định danh khách thuê.");
        }

        String code = request.getCode().trim().toUpperCase();
        if (categoryRepository.existsByTenantIdAndCode(tenantId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "CATEGORY_CODE_ALREADY_EXISTS", "Mã nhóm vật tư đã tồn tại.");
        }

        MaterialCategory category = MaterialCategory.builder()
                .tenantId(tenantId)
                .code(code)
                .name(request.getName().trim())
                .description(request.getDescription())
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        MaterialCategory saved = categoryRepository.save(category);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_MATERIAL_CATEGORY")
                .module("MASTERDATA")
                .endpoint("/api/v1/material-categories")
                .method("POST")
                .newValue("Category: " + saved.getCode())
                .build());

        return toCategoryResponse(saved);
    }

    @Override
    @Transactional
    public MaterialCategoryResponse updateCategory(Long id, UpdateMaterialCategoryRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        MaterialCategory category = categoryRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm vật tư", id));

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setUpdatedAt(Instant.now());
        category.setUpdatedBy(SecurityUtils.getCurrentUserId());

        MaterialCategory updated = categoryRepository.save(category);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_MATERIAL_CATEGORY")
                .module("MASTERDATA")
                .endpoint("/api/v1/material-categories/" + id)
                .method("PUT")
                .newValue("Updated category: " + updated.getCode())
                .build());

        return toCategoryResponse(updated);
    }

    // --- Materials ---

    @Override
    @Transactional(readOnly = true)
    public Page<MaterialDetailResponse> getMaterials(Long categoryId, String keyword, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<Material> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("categoryId"), categoryId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("skuCode")), pattern),
                        cb.like(cb.lower(root.get("barcode")), pattern),
                        cb.like(cb.lower(root.get("name")), pattern)
                ));
            }
            predicates.add(cb.notEqual(root.get("status"), "DELETED"));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Material> page = materialRepository.findAll(spec, pageable);
        List<MaterialDetailResponse> responses = page.getContent().stream()
                .map(this::enrichMaterialDetail)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public MaterialDetailResponse getMaterialById(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Material material = materialRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", id));
        return enrichMaterialDetail(material);
    }

    @Override
    @Transactional
    public MaterialDetailResponse createMaterial(CreateMaterialRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null && !SecurityUtils.isSuperAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT", "Thiếu định danh khách thuê.");
        }

        categoryRepository.findByTenantIdAndId(tenantId, request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm vật tư", request.getCategoryId()));

        String sku = request.getSkuCode().trim().toUpperCase();
        if (materialRepository.existsByTenantIdAndSkuCode(tenantId, sku)) {
            throw new ApiException(HttpStatus.CONFLICT, "SKU_ALREADY_EXISTS", "Mã SKU vật tư đã tồn tại.");
        }

        if (request.getBarcode() != null && !request.getBarcode().isBlank()) {
            if (materialRepository.existsByTenantIdAndBarcode(tenantId, request.getBarcode().trim())) {
                throw new ApiException(HttpStatus.CONFLICT, "BARCODE_ALREADY_EXISTS", "Mã vạch vật tư đã tồn tại.");
            }
        }

        if (request.getMaxStockLevel() != null && request.getMaxStockLevel().compareTo(request.getMinStockLevel()) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STOCK_LEVEL",
                    "Định mức tồn tối đa phải lớn hơn hoặc bằng định mức tồn tối thiểu.");
        }

        Material material = Material.builder()
                .tenantId(tenantId)
                .categoryId(request.getCategoryId())
                .skuCode(sku)
                .barcode(request.getBarcode() != null ? request.getBarcode().trim() : null)
                .name(request.getName().trim())
                .standardUnit(request.getStandardUnit().trim().toUpperCase())
                .dispatchStrategy(request.getDispatchStrategy().toUpperCase())
                .expiryAlertDays(request.getExpiryAlertDays())
                .minStockLevel(request.getMinStockLevel())
                .maxStockLevel(request.getMaxStockLevel())
                .unitPriceStandard(request.getUnitPriceStandard())
                .manufacturerName(request.getManufacturerName())
                .activeIngredient(request.getActiveIngredient())
                .defaultPhiDays(request.getDefaultPhiDays())
                .shelfLifeDays(request.getShelfLifeDays())
                .description(request.getDescription())
                .status("ACTIVE")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        Material saved = materialRepository.save(material);

        // Lưu lồng quy đổi đơn vị trong 1 @Transactional
        if (request.getConversions() != null && !request.getConversions().isEmpty()) {
            for (CreateMaterialRequest.ConversionItemRequest c : request.getConversions()) {
                if (c.getConversionFactor() == null || c.getConversionFactor().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CONVERSION_FACTOR", "Hệ số quy đổi phải lớn hơn 0.");
                }

                MaterialUnitConversion conv = MaterialUnitConversion.builder()
                        .tenantId(tenantId)
                        .materialId(saved.getId())
                        .unitName(c.getUnitName().trim().toUpperCase())
                        .unitBarcode(c.getUnitBarcode() != null ? c.getUnitBarcode().trim() : null)
                        .conversionFactor(c.getConversionFactor())
                        .isPurchaseUnit(Boolean.TRUE.equals(c.getIsPurchaseUnit()))
                        .isDispatchUnit(Boolean.TRUE.equals(c.getIsDispatchUnit()))
                        .createdAt(Instant.now())
                        .build();
                conversionRepository.save(conv);
            }
        }

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_MATERIAL")
                .module("MASTERDATA")
                .endpoint("/api/v1/materials")
                .method("POST")
                .newValue("Material: " + saved.getSkuCode())
                .build());

        return enrichMaterialDetail(saved);
    }

    @Override
    @Transactional
    public MaterialDetailResponse updateMaterial(Long id, UpdateMaterialRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Material material = materialRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", id));

        if (request.getMaxStockLevel() != null && request.getMaxStockLevel().compareTo(request.getMinStockLevel()) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STOCK_LEVEL",
                    "Định mức tồn tối đa phải lớn hơn hoặc bằng định mức tồn tối thiểu.");
        }

        material.setCategoryId(request.getCategoryId());
        material.setBarcode(request.getBarcode());
        material.setName(request.getName().trim());
        material.setStandardUnit(request.getStandardUnit().trim().toUpperCase());
        material.setDispatchStrategy(request.getDispatchStrategy().toUpperCase());
        material.setExpiryAlertDays(request.getExpiryAlertDays());
        material.setMinStockLevel(request.getMinStockLevel());
        material.setMaxStockLevel(request.getMaxStockLevel());
        material.setUnitPriceStandard(request.getUnitPriceStandard());
        material.setManufacturerName(request.getManufacturerName());
        material.setActiveIngredient(request.getActiveIngredient());
        material.setDefaultPhiDays(request.getDefaultPhiDays());
        material.setShelfLifeDays(request.getShelfLifeDays());
        material.setDescription(request.getDescription());
        if (request.getStatus() != null) material.setStatus(request.getStatus().toUpperCase());
        material.setUpdatedAt(Instant.now());
        material.setUpdatedBy(SecurityUtils.getCurrentUserId());

        Material updated = materialRepository.save(material);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_MATERIAL")
                .module("MASTERDATA")
                .endpoint("/api/v1/materials/" + id)
                .method("PUT")
                .newValue("Updated material: " + updated.getSkuCode())
                .build());

        return enrichMaterialDetail(updated);
    }

    @Override
    @Transactional
    public MaterialDetailResponse addConversion(Long materialId, CreateUnitConversionRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Material material = materialRepository.findByTenantIdAndId(tenantId, materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", materialId));

        if (request.getConversionFactor() == null || request.getConversionFactor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CONVERSION_FACTOR", "Hệ số quy đổi phải lớn hơn 0.");
        }

        String unitName = request.getUnitName().trim().toUpperCase();
        if (conversionRepository.findByMaterialIdAndUnitName(materialId, unitName).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_CONVERSION_UNIT", "Đơn vị quy đổi đã tồn tại cho vật tư này.");
        }

        MaterialUnitConversion conv = MaterialUnitConversion.builder()
                .tenantId(tenantId)
                .materialId(materialId)
                .unitName(unitName)
                .unitBarcode(request.getUnitBarcode() != null ? request.getUnitBarcode().trim() : null)
                .conversionFactor(request.getConversionFactor())
                .isPurchaseUnit(Boolean.TRUE.equals(request.getIsPurchaseUnit()))
                .isDispatchUnit(Boolean.TRUE.equals(request.getIsDispatchUnit()))
                .createdAt(Instant.now())
                .build();

        conversionRepository.save(conv);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("ADD_UNIT_CONVERSION")
                .module("MASTERDATA")
                .endpoint("/api/v1/materials/" + materialId + "/conversions")
                .method("POST")
                .newValue("Unit: " + unitName + ", Factor: " + request.getConversionFactor())
                .build());

        return enrichMaterialDetail(material);
    }

    // --- Unified Barcode Scanner ---

    @Override
    @Transactional(readOnly = true)
    public BarcodeLookupResponse lookupBarcode(Long farmId, String rawCode) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (rawCode == null || rawCode.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_BARCODE", "Mã vạch không được để trống.");
        }
        String code = rawCode.trim();

        String matchType;
        Material material;
        String enteredUnit;
        BigDecimal conversionFactor;
        boolean isPurchaseUnit;
        boolean isDispatchUnit;

        // 1. materials.barcode -> matchType = "STANDARD"
        Optional<Material> stdMat = tenantId != null
                ? materialRepository.findByTenantIdAndBarcode(tenantId, code)
                : Optional.empty();

        if (stdMat.isPresent()) {
            matchType = "STANDARD";
            material = stdMat.get();
            enteredUnit = material.getStandardUnit();
            conversionFactor = BigDecimal.ONE.setScale(4);
            isPurchaseUnit = true;
            isDispatchUnit = true;
        } else {
            // 2. material_unit_conversions.unit_barcode -> matchType = "UNIT_CONVERSION"
            Optional<MaterialUnitConversion> convOpt = tenantId != null
                    ? conversionRepository.findByTenantIdAndUnitBarcode(tenantId, code)
                    : Optional.empty();

            if (convOpt.isPresent()) {
                MaterialUnitConversion conv = convOpt.get();
                matchType = "UNIT_CONVERSION";
                material = materialRepository.findById(conv.getMaterialId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vật tư", conv.getMaterialId()));
                enteredUnit = conv.getUnitName();
                conversionFactor = conv.getConversionFactor();
                isPurchaseUnit = Boolean.TRUE.equals(conv.getIsPurchaseUnit());
                isDispatchUnit = Boolean.TRUE.equals(conv.getIsDispatchUnit());
            } else {
                // 3. warehouse_inventory.internal_batch_barcode -> matchType = "INTERNAL_BATCH"
                Optional<WarehouseInventory> invOpt = inventoryRepository.findByFarmIdAndInternalBatchBarcode(farmId, code);
                if (invOpt.isPresent()) {
                    WarehouseInventory inv = invOpt.get();
                    matchType = "INTERNAL_BATCH";
                    material = materialRepository.findById(inv.getMaterialId())
                            .orElseThrow(() -> new ResourceNotFoundException("Vật tư", inv.getMaterialId()));
                    enteredUnit = material.getStandardUnit();
                    conversionFactor = BigDecimal.ONE.setScale(4);
                    isPurchaseUnit = false;
                    isDispatchUnit = true;
                } else {
                    throw new ApiException(HttpStatus.NOT_FOUND, "BARCODE_NOT_FOUND",
                            "Không tìm thấy vật tư hoặc lô hàng nào khớp với mã vạch: " + code);
                }
            }
        }

        // Query suggested lots at farmId with available quantity > 0
        List<WarehouseInventory> lots = inventoryRepository.findByFarmIdAndMaterialId(farmId, material.getId());
        List<WarehouseInventory> availableLots = lots.stream()
                .filter(l -> l.getQuantityOnHand().subtract(l.getReservedQuantity()).compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());

        // Sort strategy: FEFO vs FIFO
        if ("FEFO".equalsIgnoreCase(material.getDispatchStrategy())) {
            availableLots.sort(Comparator
                    .comparing(WarehouseInventory::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(WarehouseInventory::getInwardDate, Comparator.nullsLast(Comparator.naturalOrder())));
        } else { // FIFO
            availableLots.sort(Comparator
                    .comparing(WarehouseInventory::getInwardDate, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(WarehouseInventory::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder())));
        }

        List<BarcodeLookupResponse.SuggestedLotDto> suggestedLotDtos = availableLots.stream().map(lot -> {
            String warehouseName = warehouseRepository.findById(lot.getWarehouseId())
                    .map(Warehouse::getName)
                    .orElse("Kho #" + lot.getWarehouseId());

            return BarcodeLookupResponse.SuggestedLotDto.builder()
                    .batchNumber(lot.getBatchNumber())
                    .warehouseId(lot.getWarehouseId())
                    .warehouseName(warehouseName)
                    .storageBinCode(lot.getStorageBinCode())
                    .availableQuantity(lot.getQuantityOnHand().subtract(lot.getReservedQuantity()))
                    .expiryDate(lot.getExpiryDate())
                    .build();
        }).collect(Collectors.toList());

        return BarcodeLookupResponse.builder()
                .matchType(matchType)
                .materialId(material.getId())
                .skuCode(material.getSkuCode())
                .materialName(material.getName())
                .standardUnit(material.getStandardUnit())
                .enteredUnit(enteredUnit)
                .conversionFactor(conversionFactor)
                .isPurchaseUnit(isPurchaseUnit)
                .isDispatchUnit(isDispatchUnit)
                .defaultPhiDays(material.getDefaultPhiDays())
                .suggestedLots(suggestedLotDtos)
                .build();
    }

    private MaterialCategoryResponse toCategoryResponse(MaterialCategory c) {
        Long materialsCount = 0L;
        try {
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM materials WHERE category_id = ? AND status != 'DELETED'",
                    Long.class, c.getId());
            if (count != null) materialsCount = count;
        } catch (Exception ignored) {
        }

        return MaterialCategoryResponse.builder()
                .id(c.getId())
                .tenantId(c.getTenantId())
                .code(c.getCode())
                .name(c.getName())
                .description(c.getDescription())
                .materialsCount(materialsCount)
                .createdAt(c.getCreatedAt())
                .build();
    }

    private MaterialDetailResponse enrichMaterialDetail(Material m) {
        String categoryName = categoryRepository.findById(m.getCategoryId())
                .map(MaterialCategory::getName)
                .orElse(null);

        List<MaterialUnitConversion> conversions = conversionRepository.findByMaterialId(m.getId());
        List<MaterialDetailResponse.ConversionDto> convDtos = conversions.stream()
                .map(c -> MaterialDetailResponse.ConversionDto.builder()
                        .id(c.getId())
                        .unitName(c.getUnitName())
                        .unitBarcode(c.getUnitBarcode())
                        .conversionFactor(c.getConversionFactor())
                        .isPurchaseUnit(Boolean.TRUE.equals(c.getIsPurchaseUnit()))
                        .isDispatchUnit(Boolean.TRUE.equals(c.getIsDispatchUnit()))
                        .build())
                .collect(Collectors.toList());

        BigDecimal totalStock = BigDecimal.ZERO;
        try {
            BigDecimal sum = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(quantity_on_hand - reserved_quantity), 0) FROM warehouse_inventory WHERE material_id = ?",
                    BigDecimal.class, m.getId());
            if (sum != null) totalStock = sum;
        } catch (Exception ignored) {
        }

        return MaterialDetailResponse.builder()
                .id(m.getId())
                .tenantId(m.getTenantId())
                .skuCode(m.getSkuCode())
                .barcode(m.getBarcode())
                .name(m.getName())
                .categoryId(m.getCategoryId())
                .categoryName(categoryName)
                .standardUnit(m.getStandardUnit())
                .dispatchStrategy(m.getDispatchStrategy())
                .expiryAlertDays(m.getExpiryAlertDays())
                .minStockLevel(m.getMinStockLevel())
                .maxStockLevel(m.getMaxStockLevel())
                .unitPriceStandard(m.getUnitPriceStandard())
                .manufacturerName(m.getManufacturerName())
                .activeIngredient(m.getActiveIngredient())
                .defaultPhiDays(m.getDefaultPhiDays())
                .shelfLifeDays(m.getShelfLifeDays())
                .description(m.getDescription())
                .status(m.getStatus())
                .conversions(convDtos)
                .totalAvailableStock(totalStock)
                .createdAt(m.getCreatedAt())
                .build();
    }
}
