package com.farm.saas.modules.inventory.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.inventory.dto.request.MaterialCreateRequest;
import com.farm.saas.modules.inventory.dto.request.MaterialUpdateRequest;
import com.farm.saas.modules.inventory.dto.response.MaterialResponse;
import com.farm.saas.modules.inventory.entity.Material;
import com.farm.saas.modules.inventory.entity.MaterialCategory;
import com.farm.saas.modules.inventory.mapper.MaterialMapper;
import com.farm.saas.modules.inventory.repository.MaterialCategoryRepository;
import com.farm.saas.modules.inventory.repository.MaterialRepository;
import com.farm.saas.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ quản lý Mặt hàng / Vật tư nông nghiệp (Materials).
 * Áp dụng Tenant Isolation: Vật tư cô lập theo Tenant sở hữu.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaterialService {

    private static final Logger log = LoggerFactory.getLogger(MaterialService.class);

    private final MaterialRepository materialRepository;
    private final MaterialCategoryRepository categoryRepository;

    /**
     * Lấy danh sách mặt hàng vật tư có phân trang theo Tenant.
     */
    public Page<MaterialResponse> getMaterials(Long categoryId, Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy danh sách vật tư cho TenantId: {}, CategoryId: {}", tenantId, categoryId);

        Page<Material> page;
        if (categoryId != null) {
            page = materialRepository.findAllByTenantIdAndCategoryId(tenantId, categoryId, pageable);
        } else {
            page = materialRepository.findAllByTenantId(tenantId, pageable);
        }

        // Cache category mapping để giảm số lượng query
        Map<Long, MaterialCategory> categoryMap = categoryRepository.findAllByTenantId(tenantId)
                .stream()
                .collect(Collectors.toMap(MaterialCategory::getId, Function.identity()));

        return page.map(material -> MaterialMapper.toResponse(material, categoryMap.get(material.getCategoryId())));
    }

    /**
     * Lấy toàn bộ danh sách vật tư của Tenant (dành cho Dropdown khi lập phiếu nhập/xuất kho).
     */
    public List<MaterialResponse> getAllMaterials(Long categoryId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy dropdown vật tư cho TenantId: {}, CategoryId: {}", tenantId, categoryId);

        List<Material> list;
        if (categoryId != null) {
            list = materialRepository.findAllByTenantIdAndCategoryId(tenantId, categoryId);
        } else {
            list = materialRepository.findAllByTenantId(tenantId);
        }

        Map<Long, MaterialCategory> categoryMap = categoryRepository.findAllByTenantId(tenantId)
                .stream()
                .collect(Collectors.toMap(MaterialCategory::getId, Function.identity()));

        return list.stream()
                .map(material -> MaterialMapper.toResponse(material, categoryMap.get(material.getCategoryId())))
                .toList();
    }

    /**
     * Lấy thông tin chi tiết một mặt hàng vật tư theo ID.
     */
    public MaterialResponse getMaterialById(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Xem chi tiết vật tư ID: {} cho TenantId: {}", id, tenantId);

        Material material = materialRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Vật tư", String.valueOf(id)));

        MaterialCategory category = categoryRepository.findByIdAndTenantId(material.getCategoryId(), tenantId)
                .orElse(null);

        return MaterialMapper.toResponse(material, category);
    }

    /**
     * Tạo mới mặt hàng vật tư nông nghiệp.
     * Validate ràng buộc:
     * - categoryId phải thuộc về Tenant của người dùng.
     * - skuCode duy nhất trong Tenant.
     * - maxStockLevel >= minStockLevel nếu được chỉ định.
     */
    @Transactional
    public MaterialResponse createMaterial(MaterialCreateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        // Validate nhóm vật tư thuộc cùng Tenant
        MaterialCategory category = categoryRepository.findByIdAndTenantId(request.getCategoryId(), tenantId)
                .orElseThrow(() -> AppException.notFound("Nhóm vật tư", String.valueOf(request.getCategoryId())));

        // Validate ràng buộc tồn kho tối đa >= tồn kho tối thiểu
        validateStockLevels(request.getMinStockLevel(), request.getMaxStockLevel());

        String normalizedSku = request.getSkuCode().trim().toUpperCase();
        log.info("Tạo mới vật tư: SKU={}, TenantId={}", normalizedSku, tenantId);

        // Kiểm tra tính duy nhất của mã SKU trong cùng Tenant
        if (materialRepository.existsByTenantIdAndSkuCode(tenantId, normalizedSku)) {
            throw AppException.conflict("Mã SKU '" + normalizedSku + "' đã tồn tại trong danh mục vật tư!");
        }

        Material material = MaterialMapper.toEntity(request, tenantId, currentUserId);
        Material saved = materialRepository.save(material);
        log.info("Tạo vật tư thành công: ID={}, SKU={}", saved.getId(), saved.getSkuCode());

        return MaterialMapper.toResponse(saved, category);
    }

    /**
     * Cập nhật thông tin mặt hàng vật tư.
     */
    @Transactional
    public MaterialResponse updateMaterial(Long id, MaterialUpdateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        Material material = materialRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Vật tư", String.valueOf(id)));

        // Validate nhóm vật tư mới thuộc cùng Tenant
        MaterialCategory category = categoryRepository.findByIdAndTenantId(request.getCategoryId(), tenantId)
                .orElseThrow(() -> AppException.notFound("Nhóm vật tư", String.valueOf(request.getCategoryId())));

        // Validate ràng buộc tồn kho tối đa >= tồn kho tối thiểu
        validateStockLevels(request.getMinStockLevel(), request.getMaxStockLevel());

        MaterialMapper.updateEntity(material, request, currentUserId);
        Material updated = materialRepository.save(material);
        log.info("Cập nhật thành công vật tư ID: {}", id);

        return MaterialMapper.toResponse(updated, category);
    }

    /**
     * Xóa mặt hàng vật tư.
     */
    @Transactional
    public void deleteMaterial(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.info("Xóa mặt hàng vật tư ID: {}, TenantId: {}", id, tenantId);

        Material material = materialRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Vật tư", String.valueOf(id)));

        materialRepository.delete(material);
        log.info("Đã xóa thành công mặt hàng vật tư ID: {}", id);
    }

    private void validateStockLevels(BigDecimal minStock, BigDecimal maxStock) {
        if (minStock != null && maxStock != null && maxStock.compareTo(minStock) < 0) {
            throw AppException.badRequest("INVALID_STOCK_RANGE", "Mức tồn kho tối đa phải lớn hơn hoặc bằng mức tồn kho tối thiểu!");
        }
    }
}
