package com.farm.saas.modules.masterdata.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.dto.request.*;
import com.farm.saas.modules.masterdata.dto.response.*;
import com.farm.saas.modules.masterdata.entity.*;
import com.farm.saas.modules.masterdata.repository.*;
import com.farm.saas.modules.masterdata.service.MasterCatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MasterCatalogServiceImpl implements MasterCatalogService {

    private final LivestockBreedRepository livestockBreedRepository;
    private final ConsumptionQuotaRepository consumptionQuotaRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final MaterialRepository materialRepository;
    private final FarmRepository farmRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final Set<String> VALID_SPECIES = Set.of(
            "CATTLE", "SWINE", "POULTRY", "GOAT", "SHEEP"
    );

    private static final Set<String> VALID_COST_TYPES = Set.of(
            "MATERIALS", "DIRECT_LABOR", "MACHINERY_FUEL", "DEPRECIATION", "INDIRECT_OVERHEAD"
    );

    // ==========================================
    // 1. LIVESTOCK BREEDS (#21)
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<LivestockBreedResponse> getLivestockBreeds(String species) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<LivestockBreed> list;
        if (species != null && !species.isBlank()) {
            list = livestockBreedRepository.findByTenantIdAndSpecies(tenantId, species.toUpperCase());
        } else {
            list = livestockBreedRepository.findByTenantId(tenantId);
        }
        return list.stream().map(this::toBreedResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LivestockBreedResponse getLivestockBreedById(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        LivestockBreed b = livestockBreedRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Giống vật nuôi", id));
        return toBreedResponse(b);
    }

    @Override
    @Transactional
    public LivestockBreedResponse createLivestockBreed(CreateLivestockBreedRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null && !SecurityUtils.isSuperAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT", "Thiếu định danh khách thuê.");
        }

        String species = request.getSpecies().trim().toUpperCase();
        if (!VALID_SPECIES.contains(species)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SPECIES",
                    "Loài vật nuôi không hợp lệ. Cho phép: " + VALID_SPECIES);
        }

        String mgmtType = request.getManagementType();
        if (!StringUtils.hasText(mgmtType)) {
            mgmtType = "POULTRY".equalsIgnoreCase(species) ? "FLOCK_HERD" : "INDIVIDUAL_TAGGED";
        }

        LivestockBreed breed = LivestockBreed.builder()
                .tenantId(tenantId)
                .species(species)
                .breedName(request.getBreedName().trim())
                .imageUrl(StringUtils.hasText(request.getImageUrl()) ? request.getImageUrl().trim() : null)
                .standardGrowthDays(request.getStandardGrowthDays())
                .targetWeightKg(request.getTargetWeightKg())
                .managementType(mgmtType)
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        LivestockBreed saved = livestockBreedRepository.save(breed);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_LIVESTOCK_BREED")
                .module("MASTERDATA")
                .endpoint("/api/v1/master/livestock-breeds")
                .method("POST")
                .newValue("Breed: " + saved.getBreedName())
                .build());

        return toBreedResponse(saved);
    }

    @Override
    @Transactional
    public LivestockBreedResponse updateLivestockBreed(Long id, UpdateLivestockBreedRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        LivestockBreed breed = livestockBreedRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Giống vật nuôi", id));

        if (request.getSpecies() != null) {
            String species = request.getSpecies().trim().toUpperCase();
            if (!VALID_SPECIES.contains(species)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SPECIES", "Loài không hợp lệ.");
            }
            breed.setSpecies(species);
        }

        breed.setBreedName(request.getBreedName().trim());
        if (request.getImageUrl() != null) breed.setImageUrl(request.getImageUrl().trim());
        if (request.getStandardGrowthDays() != null) breed.setStandardGrowthDays(request.getStandardGrowthDays());
        if (request.getTargetWeightKg() != null) breed.setTargetWeightKg(request.getTargetWeightKg());
        if (StringUtils.hasText(request.getManagementType())) breed.setManagementType(request.getManagementType());
        breed.setUpdatedAt(Instant.now());
        breed.setUpdatedBy(SecurityUtils.getCurrentUserId());

        LivestockBreed updated = livestockBreedRepository.save(breed);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_LIVESTOCK_BREED")
                .module("MASTERDATA")
                .endpoint("/api/v1/master/livestock-breeds/" + id)
                .method("PUT")
                .newValue("Updated breed: " + updated.getBreedName())
                .build());

        return toBreedResponse(updated);
    }

    @Override
    @Transactional
    public void deleteLivestockBreed(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        LivestockBreed breed = livestockBreedRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Giống vật nuôi", id));

        if (livestockGroupRepository.existsByBreedId(id) || consumptionQuotaRepository.existsByLivestockBreedId(id)) {
            throw new BusinessException("Giống vật nuôi này đã được sử dụng trong đàn nuôi hoặc định mức, không thể xóa!");
        }

        livestockBreedRepository.delete(breed);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("DELETE_LIVESTOCK_BREED")
                .module("MASTERDATA")
                .endpoint("/api/v1/master/livestock-breeds/" + id)
                .method("DELETE")
                .newValue("Deleted livestock breed: " + breed.getBreedName())
                .build());
    }

    // ==========================================
    // 3. CONSUMPTION QUOTAS (#30 - BOM)
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<ConsumptionQuotaResponse> getQuotas(Long farmId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<ConsumptionQuota> list = farmId != null
                ? consumptionQuotaRepository.findByFarmId(farmId)
                : consumptionQuotaRepository.findByTenantId(tenantId);

        return list.stream().map(this::toQuotaResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ConsumptionQuotaResponse createQuota(CreateConsumptionQuotaRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null && !SecurityUtils.isSuperAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT", "Thiếu định danh khách thuê.");
        }

        if (request.getLivestockBreedId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_BREED",
                    "Định mức kỹ thuật chăn nuôi bắt buộc phải liên kết với một giống vật nuôi.");
        }

        farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Trang trại", request.getFarmId()));

        materialRepository.findById(request.getMaterialId())
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", request.getMaterialId()));

        ConsumptionQuota quota = ConsumptionQuota.builder()
                .tenantId(tenantId)
                .farmId(request.getFarmId())
                .livestockBreedId(request.getLivestockBreedId())
                .materialId(request.getMaterialId())
                .standardQuantity(request.getStandardQuantity())
                .unitOfMeasure(request.getUnitOfMeasure().trim().toUpperCase())
                .stage(request.getStage())
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        ConsumptionQuota saved = consumptionQuotaRepository.save(quota);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_CONSUMPTION_QUOTA")
                .module("MASTERDATA")
                .endpoint("/api/v1/quotas")
                .method("POST")
                .newValue("Quota: Material " + saved.getMaterialId() + ", Qty: " + saved.getStandardQuantity())
                .build());

        return toQuotaResponse(saved);
    }

    @Override
    @Transactional
    public ConsumptionQuotaResponse updateQuota(Long id, UpdateConsumptionQuotaRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        ConsumptionQuota quota = consumptionQuotaRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Định mức", id));

        if (request.getLivestockBreedId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_BREED",
                    "Định mức kỹ thuật chăn nuôi bắt buộc phải liên kết với một giống vật nuôi.");
        }

        quota.setLivestockBreedId(request.getLivestockBreedId());
        quota.setMaterialId(request.getMaterialId());
        quota.setStandardQuantity(request.getStandardQuantity());
        quota.setUnitOfMeasure(request.getUnitOfMeasure().trim().toUpperCase());
        quota.setStage(request.getStage());
        quota.setUpdatedAt(Instant.now());
        quota.setUpdatedBy(SecurityUtils.getCurrentUserId());

        ConsumptionQuota updated = consumptionQuotaRepository.save(quota);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_CONSUMPTION_QUOTA")
                .module("MASTERDATA")
                .endpoint("/api/v1/quotas/" + id)
                .method("PUT")
                .newValue("Updated quota: " + id)
                .build());

        return toQuotaResponse(updated);
    }

    @Override
    @Transactional
    public void deleteQuota(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        ConsumptionQuota quota = consumptionQuotaRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Định mức", id));

        consumptionQuotaRepository.delete(quota);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("DELETE_CONSUMPTION_QUOTA")
                .module("MASTERDATA")
                .endpoint("/api/v1/quotas/" + id)
                .method("DELETE")
                .newValue("Deleted quota ID: " + id)
                .build());
    }

    // ==========================================
    // 5. COST CATEGORIES (#59)
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<CostCategoryResponse> getCostCategories() {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<CostCategory> list = tenantId != null ? costCategoryRepository.findByTenantId(tenantId) : costCategoryRepository.findAll();
        return list.stream().map(this::toCostCategoryResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CostCategoryResponse createCostCategory(CreateCostCategoryRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null && !SecurityUtils.isSuperAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT", "Thiếu định danh khách thuê.");
        }

        String costType = request.getCostType().trim().toUpperCase();
        if (!VALID_COST_TYPES.contains(costType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_COST_TYPE",
                    "Loại chi phí không hợp lệ. Cho phép: " + VALID_COST_TYPES);
        }

        String code = request.getCode().trim().toUpperCase();
        if (costCategoryRepository.existsByTenantIdAndCode(tenantId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "COST_CODE_ALREADY_EXISTS", "Mã nhóm chi phí đã tồn tại.");
        }

        CostCategory cc = CostCategory.builder()
                .tenantId(tenantId)
                .code(code)
                .name(request.getName().trim())
                .costType(costType)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        if (request.getApplicableFarmIds() != null && !request.getApplicableFarmIds().isEmpty()) {
            cc.setApplicableFarms(request.getApplicableFarmIds().stream().map(String::valueOf).collect(Collectors.joining(",")));
            cc.setFarmId(request.getApplicableFarmIds().get(0));
        } else if (request.getFarmId() != null) {
            cc.setApplicableFarms(String.valueOf(request.getFarmId()));
            cc.setFarmId(request.getFarmId());
        } else {
            cc.setApplicableFarms("ALL");
            cc.setFarmId(null);
        }

        CostCategory saved = costCategoryRepository.save(cc);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_COST_CATEGORY")
                .module("FINANCE")
                .endpoint("/api/v1/cost-categories")
                .method("POST")
                .newValue("CostCategory: " + saved.getCode())
                .build());

        return toCostCategoryResponse(saved);
    }

    @Override
    @Transactional
    public CostCategoryResponse updateCostCategory(Long id, UpdateCostCategoryRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CostCategory cc = costCategoryRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm chi phí", id));

        String costType = request.getCostType().trim().toUpperCase();
        if (!VALID_COST_TYPES.contains(costType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_COST_TYPE",
                    "Loại chi phí không hợp lệ. Cho phép: " + VALID_COST_TYPES);
        }

        cc.setName(request.getName().trim());
        cc.setCostType(costType);
        cc.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        if (request.getApplicableFarmIds() != null && !request.getApplicableFarmIds().isEmpty()) {
            cc.setApplicableFarms(request.getApplicableFarmIds().stream().map(String::valueOf).collect(Collectors.joining(",")));
            cc.setFarmId(request.getApplicableFarmIds().get(0));
        } else if (request.getFarmId() != null) {
            cc.setApplicableFarms(String.valueOf(request.getFarmId()));
            cc.setFarmId(request.getFarmId());
        } else {
            cc.setApplicableFarms("ALL");
            cc.setFarmId(null);
        }
        cc.setUpdatedAt(Instant.now());
        cc.setUpdatedBy(SecurityUtils.getCurrentUserId());

        CostCategory updated = costCategoryRepository.save(cc);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_COST_CATEGORY")
                .module("FINANCE")
                .endpoint("/api/v1/cost-categories/" + id)
                .method("PUT")
                .newValue("Updated cost category: " + updated.getCode())
                .build());

        return toCostCategoryResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCostCategory(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CostCategory cc = costCategoryRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục chi phí", id));

        if (farmExpenseRepository.existsByCostCategoryId(id) ) {
            throw new BusinessException("Nhóm chi phí đã phát sinh chứng từ chi phí hoặc ngân sách, không thể xóa!");
        }

        costCategoryRepository.delete(cc);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("DELETE_COST_CATEGORY")
                .module("FINANCE")
                .endpoint("/api/v1/cost-categories/" + id)
                .method("DELETE")
                .newValue("Deleted cost category: " + cc.getCode())
                .build());
    }

    private ConsumptionQuotaResponse toQuotaResponse(ConsumptionQuota q) {
        String farmName = farmRepository.findById(q.getFarmId()).map(Farm::getName).orElse(null);
        String breedName = q.getLivestockBreedId() != null
                ? livestockBreedRepository.findById(q.getLivestockBreedId()).map(LivestockBreed::getBreedName).orElse(null)
                : null;

        Optional<Material> matOpt = materialRepository.findById(q.getMaterialId());
        String materialName = matOpt.map(Material::getName).orElse(null);
        String materialUnit = matOpt.map(Material::getStandardUnit).orElse(null);

        return ConsumptionQuotaResponse.builder()
                .id(q.getId())
                .tenantId(q.getTenantId())
                .farmId(q.getFarmId())
                .farmName(farmName)
                .cropTypeId(null)
                .cropTypeName(null)
                .livestockBreedId(q.getLivestockBreedId())
                .livestockBreedName(breedName)
                .materialId(q.getMaterialId())
                .materialName(materialName)
                .materialStandardUnit(materialUnit)
                .standardQuantity(q.getStandardQuantity())
                .unitOfMeasure(q.getUnitOfMeasure())
                .stage(q.getStage())
                .createdAt(q.getCreatedAt())
                .build();
    }

    private LivestockBreedResponse toBreedResponse(LivestockBreed b) {
        return LivestockBreedResponse.builder()
                .id(b.getId())
                .tenantId(b.getTenantId())
                .species(b.getSpecies())
                .breedName(b.getBreedName())
                .imageUrl(b.getImageUrl())
                .standardGrowthDays(b.getStandardGrowthDays())
                .targetWeightKg(b.getTargetWeightKg())
                .managementType(b.getManagementType())
                .createdAt(b.getCreatedAt())
                .build();
    }

    

    private CostCategoryResponse toCostCategoryResponse(CostCategory cc) {
        List<Long> farmIds = new ArrayList<>();
        List<String> farmNames = new ArrayList<>();
        String appFarms = cc.getApplicableFarms();

        if (appFarms == null || appFarms.isBlank() || "ALL".equalsIgnoreCase(appFarms)) {
            farmNames.add("Toàn bộ trang trại");
        } else {
            String[] parts = appFarms.split(",");
            for (String p : parts) {
                try {
                    Long fId = Long.parseLong(p.trim());
                    farmIds.add(fId);
                    farmRepository.findById(fId).ifPresent(f -> farmNames.add(f.getName()));
                } catch (NumberFormatException ignored) {}
            }
        }

        return CostCategoryResponse.builder()
                .id(cc.getId())
                .tenantId(cc.getTenantId())
                .farmId(cc.getFarmId())
                .applicableFarms(cc.getApplicableFarms())
                .applicableFarmIds(farmIds)
                .applicableFarmNames(farmNames)
                .code(cc.getCode())
                .name(cc.getName())
                .costType(cc.getCostType())
                .description(cc.getDescription())
                .createdAt(cc.getCreatedAt())
                .build();
    }
}
