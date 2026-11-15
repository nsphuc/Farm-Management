package com.farm.saas.modules.masterdata.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.finance.repository.BudgetLineItemRepository;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.hr.repository.ShiftAssignmentRepository;
import com.farm.saas.modules.hr.repository.TimeAttendanceRepository;
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

    private final CropTypeRepository cropTypeRepository;
    private final LivestockBreedRepository livestockBreedRepository;
    private final ConsumptionQuotaRepository consumptionQuotaRepository;
    private final WorkShiftRepository workShiftRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final MaterialRepository materialRepository;
    private final FarmRepository farmRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final TimeAttendanceRepository timeAttendanceRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final BudgetLineItemRepository budgetLineItemRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final Set<String> VALID_SPECIES = Set.of(
            "CATTLE", "SWINE", "POULTRY", "GOAT", "SHEEP"
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
                .imageUrl(StringUtils.hasText(request.getImageUrl()) ? request.getImageUrl().trim() : null)
                .varietyCode(code)
                .growthDaysStandard(request.getGrowthDaysStandard())
                .cropCategory(StringUtils.hasText(request.getCropCategory()) ? request.getCropCategory().trim().toUpperCase() : "ANNUAL")
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
        if (request.getImageUrl() != null) ct.setImageUrl(request.getImageUrl().trim());
        if (request.getVarietyCode() != null) ct.setVarietyCode(request.getVarietyCode().trim().toUpperCase());
        ct.setGrowthDaysStandard(request.getGrowthDaysStandard());
        if (StringUtils.hasText(request.getCropCategory())) {
            ct.setCropCategory(request.getCropCategory().trim().toUpperCase());
        }
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

    @Override
    @Transactional
    public void deleteCropType(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CropType ct = cropTypeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Loại cây trồng", id));

        if (cropSeasonRepository.existsByCropTypeId(id) || consumptionQuotaRepository.existsByCropTypeId(id)) {
            throw new BusinessException("Giống cây trồng này đã được sử dụng trong mùa vụ hoặc định mức kỹ thuật, không thể xóa!");
        }

        cropTypeRepository.delete(ct);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("DELETE_CROP_TYPE")
                .module("MASTERDATA")
                .endpoint("/api/v1/master/crop-types/" + id)
                .method("DELETE")
                .newValue("Deleted crop type: " + ct.getVarietyCode())
                .build());
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

        Long farmId = request.getFarmId();
        String applicableFarms = null;
        if (request.getApplicableFarmIds() != null && !request.getApplicableFarmIds().isEmpty()) {
            applicableFarms = request.getApplicableFarmIds().stream()
                    .filter(Objects::nonNull)
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
            if (farmId == null && !request.getApplicableFarmIds().isEmpty()) {
                farmId = request.getApplicableFarmIds().get(0);
            }
        } else if (farmId != null) {
            applicableFarms = String.valueOf(farmId);
        } else {
            applicableFarms = "ALL";
        }

        WorkShift shift = WorkShift.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .applicableFarms(applicableFarms)
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
        if (request.getApplicableFarmIds() != null) {
            if (request.getApplicableFarmIds().isEmpty()) {
                shift.setFarmId(null);
                shift.setApplicableFarms("ALL");
            } else {
                shift.setApplicableFarms(request.getApplicableFarmIds().stream()
                        .filter(Objects::nonNull)
                        .map(String::valueOf)
                        .collect(Collectors.joining(",")));
                shift.setFarmId(request.getApplicableFarmIds().get(0));
            }
        } else if (request.getFarmId() != null) {
            shift.setFarmId(request.getFarmId());
            shift.setApplicableFarms(String.valueOf(request.getFarmId()));
        }
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

    @Override
    @Transactional
    public void deleteWorkShift(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WorkShift shift = workShiftRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Ca làm việc", id));

        if (shiftAssignmentRepository.existsByShiftId(id) || timeAttendanceRepository.existsByShiftId(id)) {
            throw new BusinessException("Ca làm việc đã được phân công hoặc chấm công, không thể xóa!");
        }

        workShiftRepository.delete(shift);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("DELETE_WORK_SHIFT")
                .module("HR")
                .endpoint("/api/v1/hr/shifts/" + id)
                .method("DELETE")
                .newValue("Deleted shift: " + shift.getShiftCode())
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

        if (farmExpenseRepository.existsByCostCategoryId(id) || budgetLineItemRepository.existsByCostCategoryId(id)) {
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

    private CropTypeResponse toCropTypeResponse(CropType ct) {
        return CropTypeResponse.builder()
                .id(ct.getId())
                .tenantId(ct.getTenantId())
                .name(ct.getName())
                .imageUrl(ct.getImageUrl())
                .varietyCode(ct.getVarietyCode())
                .growthDaysStandard(ct.getGrowthDaysStandard())
                .cropCategory(ct.getCropCategory())
                .waterNeedM3Day(ct.getWaterNeedM3Day())
                .optimalTempMin(ct.getOptimalTempMin())
                .optimalTempMax(ct.getOptimalTempMax())
                .createdAt(ct.getCreatedAt())
                .build();
    }

    private LivestockBreedResponse toBreedResponse(LivestockBreed b) {
        String mgmtType = b.getManagementType();
        if (!StringUtils.hasText(mgmtType)) {
            mgmtType = "POULTRY".equalsIgnoreCase(b.getSpecies()) ? "FLOCK_HERD" : "INDIVIDUAL_TAGGED";
        }
        return LivestockBreedResponse.builder()
                .id(b.getId())
                .tenantId(b.getTenantId())
                .species(b.getSpecies())
                .breedName(b.getBreedName())
                .imageUrl(b.getImageUrl())
                .standardGrowthDays(b.getStandardGrowthDays())
                .targetWeightKg(b.getTargetWeightKg())
                .managementType(mgmtType)
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
        List<Long> farmIds = new ArrayList<>();
        List<String> farmNames = new ArrayList<>();
        String appFarms = s.getApplicableFarms();

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

        return WorkShiftResponse.builder()
                .id(s.getId())
                .tenantId(s.getTenantId())
                .farmId(s.getFarmId())
                .applicableFarms(s.getApplicableFarms())
                .applicableFarmIds(farmIds)
                .applicableFarmNames(farmNames)
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
