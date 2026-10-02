package com.farmsaas.modules.inventory.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.inventory.dto.*;
import com.farmsaas.modules.inventory.entity.Material;
import com.farmsaas.modules.inventory.entity.MaterialCategory;
import com.farmsaas.modules.inventory.repository.MaterialCategoryRepository;
import com.farmsaas.modules.inventory.repository.MaterialRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MaterialServiceImpl implements MaterialService {

    private final MaterialCategoryRepository categoryRepository;
    private final MaterialRepository materialRepository;

    @Override
    @Transactional
    public MaterialCategoryResponse createCategory(MaterialCategoryRequest request) {
        Long tenantId = getRequiredTenantId();
        String code = request.getCode().trim().toUpperCase();

        if (categoryRepository.existsByTenantIdAndCode(tenantId, code)) {
            throw new BusinessException("Mã nhóm vật tư '" + code + "' đã tồn tại.");
        }

        MaterialCategory category = MaterialCategory.builder()
                .code(code)
                .name(request.getName().trim())
                .description(request.getDescription())
                .build();
        category.setTenantId(tenantId);

        MaterialCategory saved = categoryRepository.save(category);
        log.info("Created material category '{}' (ID: {}) for Tenant ID: {}", saved.getName(), saved.getId(), tenantId);
        return MaterialCategoryResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public MaterialCategoryResponse updateCategory(Long categoryId, MaterialCategoryRequest request) {
        Long tenantId = getRequiredTenantId();
        MaterialCategory category = categoryRepository.findByIdAndTenantId(categoryId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhóm vật tư ID: " + categoryId));

        String code = request.getCode().trim().toUpperCase();
        if (!category.getCode().equalsIgnoreCase(code) && categoryRepository.existsByTenantIdAndCode(tenantId, code)) {
            throw new BusinessException("Mã nhóm vật tư '" + code + "' đã tồn tại.");
        }

        category.setCode(code);
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());

        MaterialCategory updated = categoryRepository.save(category);
        return MaterialCategoryResponse.fromEntity(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaterialCategoryResponse> getCategories() {
        Long tenantId = getRequiredTenantId();
        return categoryRepository.findByTenantId(tenantId).stream()
                .map(MaterialCategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteCategory(Long categoryId) {
        Long tenantId = getRequiredTenantId();
        MaterialCategory category = categoryRepository.findByIdAndTenantId(categoryId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhóm vật tư ID: " + categoryId));
        categoryRepository.delete(category);
    }

    @Override
    @Transactional
    public MaterialResponse createMaterial(MaterialRequest request) {
        Long tenantId = getRequiredTenantId();
        String sku = request.getSkuCode().trim().toUpperCase();

        if (materialRepository.existsByTenantIdAndSkuCode(tenantId, sku)) {
            throw new BusinessException("Mã SKU '" + sku + "' đã tồn tại trong tổ chức.");
        }

        if (!categoryRepository.existsById(request.getCategoryId())) {
            throw new EntityNotFoundException("Không tìm thấy nhóm vật tư ID: " + request.getCategoryId());
        }

        Material material = Material.builder()
                .categoryId(request.getCategoryId())
                .skuCode(sku)
                .name(request.getName().trim())
                .standardUnit(request.getStandardUnit())
                .expiryAlertDays(request.getExpiryAlertDays() != null ? request.getExpiryAlertDays() : 30)
                .minStockLevel(request.getMinStockLevel())
                .maxStockLevel(request.getMaxStockLevel())
                .unitPriceStandard(request.getUnitPriceStandard())
                .activeIngredient(request.getActiveIngredient())
                .isolationDays(request.getIsolationDays() != null ? request.getIsolationDays() : 0)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();
        material.setTenantId(tenantId);

        Material saved = materialRepository.save(material);
        log.info("Created material '{}' (ID: {}) for Tenant ID: {}", saved.getName(), saved.getId(), tenantId);
        return MaterialResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public MaterialResponse updateMaterial(Long materialId, MaterialRequest request) {
        Long tenantId = getRequiredTenantId();
        Material material = materialRepository.findByIdAndTenantId(materialId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vật tư ID: " + materialId));

        String sku = request.getSkuCode().trim().toUpperCase();
        if (!material.getSkuCode().equalsIgnoreCase(sku) && materialRepository.existsByTenantIdAndSkuCode(tenantId, sku)) {
            throw new BusinessException("Mã SKU '" + sku + "' đã tồn tại trong tổ chức.");
        }

        material.setCategoryId(request.getCategoryId());
        material.setSkuCode(sku);
        material.setName(request.getName().trim());
        material.setStandardUnit(request.getStandardUnit());
        if (request.getExpiryAlertDays() != null) material.setExpiryAlertDays(request.getExpiryAlertDays());
        if (request.getMinStockLevel() != null) material.setMinStockLevel(request.getMinStockLevel());
        material.setMaxStockLevel(request.getMaxStockLevel());
        if (request.getUnitPriceStandard() != null) material.setUnitPriceStandard(request.getUnitPriceStandard());
        material.setActiveIngredient(request.getActiveIngredient());
        if (request.getIsolationDays() != null) material.setIsolationDays(request.getIsolationDays());
        if (request.getStatus() != null) material.setStatus(request.getStatus());

        Material updated = materialRepository.save(material);
        return MaterialResponse.fromEntity(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public MaterialResponse getMaterial(Long materialId) {
        Long tenantId = getRequiredTenantId();
        Material material = materialRepository.findByIdAndTenantId(materialId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vật tư ID: " + materialId));
        return MaterialResponse.fromEntity(material);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MaterialResponse> searchMaterials(Long categoryId, String status, String keyword, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        return materialRepository.searchMaterials(tenantId, categoryId, status, keyword, pageable)
                .map(MaterialResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deleteMaterial(Long materialId) {
        Long tenantId = getRequiredTenantId();
        Material material = materialRepository.findByIdAndTenantId(materialId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vật tư ID: " + materialId));
        materialRepository.delete(material);
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
