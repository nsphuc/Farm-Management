package com.farm.saas.modules.masterdata.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
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

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MasterCatalogServiceImpl implements MasterCatalogService {

    private final CropTypeRepository cropTypeRepository;
    private final LivestockBreedRepository livestockBreedRepository;
    private final ConsumptionQuotaRepository consumptionQuotaRepository;
    private final WorkShiftRepository workShiftRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final MaterialRepository materialRepository;
    private final FarmRepository farmRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final Set<String> VALID_SPECIES = Set.of(
            "CATTLE", "SWINE", "POULTRY", "GOAT", "SHEEP", "AQUA"
    );

    private static final Set<String> VALID_COST_TYPES = Set.of(
            "MATERIALS", "DIRECT_LABOR", "MACHINERY_FUEL", "DEPRECIATION", "INDIRECT_OVERHEAD"
    );

    // ==========================================
    // 1. CROP TYPES (#18)
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<CropTypeResponse> getCropTypes() {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<CropType> list = tenantId != null ? cropTypeRepository.findByTenantId(tenantId) : cropTypeRepository.findAll();
        return list.stream().map(this::toCropTypeResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CropTypeResponse getCropTypeById(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CropType ct = cropTypeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Loại cây trồng", id));
        return toCropTypeResponse(ct);
    }

    @Override
    @Transactional
    public CropTypeResponse createCropType(CreateCropTypeRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null && !SecurityUtils.isSuperAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT", "Thiếu định danh khách thuê.");
        }

        String code = request.getVarietyCode().trim().toUpperCase();
        if (cropTypeRepository.existsByTenantIdAndVarietyCode(tenantId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "VARIETY_CODE_ALREADY_EXISTS", "Mã giống cây đã tồn tại.");
        }

        if (request.getOptimalTempMin() != null && request.getOptimalTempMax() != null) {
            if (request.getOptimalTempMin().compareTo(request.getOptimalTempMax()) > 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TEMPERATURE_RANGE",
                        "Nhiệt độ tối thiểu không được lớn hơn nhiệt độ tối đa.");
            }
        }

        CropType ct = CropType.builder()
                .tenantId(tenantId)
                .name(request.getName().trim())
                .varietyCode(code)
                .growthDaysStandard(request.getGrowthDaysStandard())
                .waterNeedM3Day(request.getWaterNeedM3Day())
                .optimalTempMin(request.getOptimalTempMin())
                .optimalTempMax(request.getOptimalTempMax())
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        CropType saved = cropTypeRepository.save(ct);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_CROP_TYPE")
                .module("MASTERDATA")
                .endpoint("/api/v1/master/crop-types")
                .method("POST")
                .newValue("CropType: " + saved.getVarietyCode())
                .build());

        return toCropTypeResponse(saved);
    }

    @Override
    @Transactional
    public CropTypeResponse updateCropType(Long id, UpdateCropTypeRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CropType ct = cropTypeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Loại cây trồng", id));

        if (request.getOptimalTempMin() != null && request.getOptimalTempMax() != null) {
            if (request.getOptimalTempMin().compareTo(request.getOptimalTempMax()) > 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TEMPERATURE_RANGE",
                        "Nhiệt độ tối thiểu không được lớn hơn nhiệt độ tối đa.");
            }
        }

        ct.setName(request.getName().trim());
        if (request.getVarietyCode() != null) ct.setVarietyCode(request.getVarietyCode().trim().toUpperCase());
        ct.setGrowthDaysStandard(request.getGrowthDaysStandard());
        ct.setWaterNeedM3Day(request.getWaterNeedM3Day());
        ct.setOptimalTempMin(request.getOptimalTempMin());
        ct.setOptimalTempMax(request.getOptimalTempMax());
        ct.setUpdatedAt(Instant.now());
        ct.setUpdatedBy(SecurityUtils.getCurrentUserId());

        CropType updated = cropTypeRepository.save(ct);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_CROP_TYPE")
                .module("MASTERDATA")
                .endpoint("/api/v1/master/crop-types/" + id)
                .method("PUT")
                .newValue("Updated crop type: " + updated.getVarietyCode())
                .build());

        return toCropTypeResponse(updated);
    }

    // ==========================================
    // 2. LIVESTOCK BREEDS (#21)
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

        LivestockBreed breed = LivestockBreed.builder()
                .tenantId(tenantId)
                .species(species)
                .breedName(request.getBreedName().trim())
                .standardGrowthDays(request.getStandardGrowthDays())
                .targetWeightKg(request.getTargetWeightKg())
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
        if (request.getStandardGrowthDays() != null) breed.setStandardGrowthDays(request.getStandardGrowthDays());
        if (request.getTargetWeightKg() != null) breed.setTargetWeightKg(request.getTargetWeightKg());
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

        // Cưỡng chế luật XOR: cropTypeId IS NOT NULL XOR livestockBreedId IS NOT NULL
        boolean hasCrop = request.getCropTypeId() != null;
        boolean hasLivestock = request.getLivestockBreedId() != null;
        if ((hasCrop && hasLivestock) || (!hasCrop && !hasLivestock)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUOTA_TARGET",
                    "Định mức kỹ thuật bắt buộc phải liên kết với một loại cây trồng HOẶC một giống vật nuôi (luật XOR).");
        }

        farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Trang trại", request.getFarmId()));

        materialRepository.findById(request.getMaterialId())
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", request.getMaterialId()));

        ConsumptionQuota quota = ConsumptionQuota.builder()
                .tenantId(tenantId)
                .farmId(request.getFarmId())
                .cropTypeId(request.getCropTypeId())
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

        boolean hasCrop = request.getCropTypeId() != null;
        boolean hasLivestock = request.getLivestockBreedId() != null;
        if ((hasCrop && hasLivestock) || (!hasCrop && !hasLivestock)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUOTA_TARGET",
                    "Định mức kỹ thuật bắt buộc phải liên kết với một loại cây trồng HOẶC một giống vật nuôi (luật XOR).");
        }

        quota.setCropTypeId(request.getCropTypeId());
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

    // ==========================================
    // 4. WORK SHIFTS (#52)
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<WorkShiftResponse> getWorkShifts() {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<WorkShift> list = tenantId != null ? workShiftRepository.findByTenantId(tenantId) : workShiftRepository.findAll();
        return list.stream().map(this::toShiftResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WorkShiftResponse createWorkShift(CreateWorkShiftRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null && !SecurityUtils.isSuperAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT", "Thiếu định danh khách thuê.");
        }

        String code = request.getShiftCode().trim().toUpperCase();
        if (workShiftRepository.existsByTenantIdAndShiftCode(tenantId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "SHIFT_CODE_ALREADY_EXISTS", "Mã ca làm việc đã tồn tại.");
        }

        WorkShift shift = WorkShift.builder()
                .tenantId(tenantId)
                .name(request.getName().trim())
                .shiftCode(code)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .breakMinutes(request.getBreakMinutes())
                .graceLateMinutes(request.getGraceLateMinutes())
                .isOvernight(Boolean.TRUE.equals(request.getIsOvernight()))
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        WorkShift saved = workShiftRepository.save(shift);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_WORK_SHIFT")
                .module("HR")
                .endpoint("/api/v1/hr/shifts")
                .method("POST")
                .newValue("Shift: " + saved.getShiftCode())
                .build());

        return toShiftResponse(saved);
    }

    @Override
    @Transactional
    public WorkShiftResponse updateWorkShift(Long id, UpdateWorkShiftRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WorkShift shift = workShiftRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Ca làm việc", id));

        shift.setName(request.getName().trim());
        shift.setStartTime(request.getStartTime());
        shift.setEndTime(request.getEndTime());
        shift.setBreakMinutes(request.getBreakMinutes());
        shift.setGraceLateMinutes(request.getGraceLateMinutes());
        if (request.getIsOvernight() != null) shift.setIsOvernight(request.getIsOvernight());
        shift.setUpdatedAt(Instant.now());
        shift.setUpdatedBy(SecurityUtils.getCurrentUserId());

        WorkShift updated = workShiftRepository.save(shift);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("UPDATE_WORK_SHIFT")
                .module("HR")
                .endpoint("/api/v1/hr/shifts/" + id)
                .method("PUT")
                .newValue("Updated shift: " + updated.getShiftCode())
                .build());

        return toShiftResponse(updated);
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
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

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

    private CropTypeResponse toCropTypeResponse(CropType ct) {
        return CropTypeResponse.builder()
                .id(ct.getId())
                .tenantId(ct.getTenantId())
                .name(ct.getName())
                .varietyCode(ct.getVarietyCode())
                .growthDaysStandard(ct.getGrowthDaysStandard())
                .waterNeedM3Day(ct.getWaterNeedM3Day())
                .optimalTempMin(ct.getOptimalTempMin())
                .optimalTempMax(ct.getOptimalTempMax())
                .createdAt(ct.getCreatedAt())
                .build();
    }

    private LivestockBreedResponse toBreedResponse(LivestockBreed b) {
        return LivestockBreedResponse.builder()
                .id(b.getId())
                .tenantId(b.getTenantId())
                .species(b.getSpecies())
                .breedName(b.getBreedName())
                .standardGrowthDays(b.getStandardGrowthDays())
                .targetWeightKg(b.getTargetWeightKg())
                .createdAt(b.getCreatedAt())
                .build();
    }

    private ConsumptionQuotaResponse toQuotaResponse(ConsumptionQuota q) {
        String farmName = farmRepository.findById(q.getFarmId()).map(Farm::getName).orElse(null);
        String cropName = q.getCropTypeId() != null
                ? cropTypeRepository.findById(q.getCropTypeId()).map(CropType::getName).orElse(null)
                : null;
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
                .cropTypeId(q.getCropTypeId())
                .cropTypeName(cropName)
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

    private WorkShiftResponse toShiftResponse(WorkShift s) {
        return WorkShiftResponse.builder()
                .id(s.getId())
                .tenantId(s.getTenantId())
                .farmId(s.getFarmId())
                .name(s.getName())
                .shiftCode(s.getShiftCode())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .breakMinutes(s.getBreakMinutes())
                .graceLateMinutes(s.getGraceLateMinutes())
                .isOvernight(Boolean.TRUE.equals(s.getIsOvernight()))
                .createdAt(s.getCreatedAt())
                .build();
    }

    private CostCategoryResponse toCostCategoryResponse(CostCategory cc) {
        return CostCategoryResponse.builder()
                .id(cc.getId())
                .tenantId(cc.getTenantId())
                .code(cc.getCode())
                .name(cc.getName())
                .costType(cc.getCostType())
                .createdAt(cc.getCreatedAt())
                .build();
    }
}
