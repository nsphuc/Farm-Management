package com.farm.saas.modules.geography.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.FarmMember;
import com.farm.saas.modules.auth.repository.FarmMemberRepository;
import com.farm.saas.modules.geography.dto.request.CreateProductionZoneRequest;
import com.farm.saas.modules.geography.dto.request.CreateZoneLocationRequest;
import com.farm.saas.modules.geography.dto.request.UpdateProductionZoneRequest;
import com.farm.saas.modules.geography.dto.request.UpdateZoneLocationRequest;
import com.farm.saas.modules.geography.dto.response.BarnCardResponse;
import com.farm.saas.modules.geography.dto.response.ProductionZoneResponse;
import com.farm.saas.modules.geography.dto.response.ZoneLocationResponse;
import com.farm.saas.modules.geography.entity.Branch;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.entity.ZoneLocation;
import com.farm.saas.modules.geography.repository.BranchRepository;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.geography.service.BarnBatchService;
import com.farm.saas.modules.livestock.dto.request.CreateBatchRequest;
import com.farm.saas.modules.livestock.dto.request.SplitBatchRequest;
import com.farm.saas.modules.livestock.dto.response.BatchDetailResponse;
import com.farm.saas.modules.livestock.entity.*;
import com.farm.saas.modules.livestock.repository.*;
import com.farm.saas.modules.masterdata.entity.ConsumptionQuota;
import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.repository.ConsumptionQuotaRepository;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BarnBatchServiceImpl implements BarnBatchService {

    private final FarmRepository farmRepository;
    private final BranchRepository branchRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final ZoneLocationRepository zoneLocationRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final LivestockBreedRepository livestockBreedRepository;
    private final LivestockEventRepository livestockEventRepository;
    private final LivestockEventSupplyRepository livestockEventSupplyRepository;
    private final LivestockWeightLogRepository livestockWeightLogRepository;
    private final ConsumptionQuotaRepository consumptionQuotaRepository;
    private final MaterialRepository materialRepository;
    private final FarmMemberRepository farmMemberRepository;
    private final ObjectMapper objectMapper;

    // ==========================================
    // 1. ZONES
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<ProductionZoneResponse> getZones(Long farmId, Long branchId) {
        Long targetFarmId = resolveFarmId(farmId);
        Long effectiveBranchId = branchId != null ? branchId : SecurityUtils.getCurrentBranchId();
        List<ProductionZone> zones;
        if (effectiveBranchId != null) {
            zones = productionZoneRepository.findByFarmIdAndBranchId(targetFarmId, effectiveBranchId);
        } else {
            zones = productionZoneRepository.findByFarmId(targetFarmId);
        }

        return zones.stream()
                .filter(z -> !"DELETED".equalsIgnoreCase(z.getStatus()))
                .map(this::toZoneResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductionZoneResponse createZone(Long farmId, CreateProductionZoneRequest request) {
        Long targetFarmId = resolveFarmId(farmId);
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;

        String code = request.getCode();
        if (!StringUtils.hasText(code)) {
            code = "KHU-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        }

        Long branchId = request.getBranchId();
        if (branchId == null) {
            branchId = SecurityUtils.getCurrentBranchId();
        }
        if (branchId == null) {
            branchId = branchRepository.findByFarmIdAndIsDefaultTrue(targetFarmId)
                    .map(com.farm.saas.modules.geography.entity.Branch::getId)
                    .orElseGet(() -> {
                        List<com.farm.saas.modules.geography.entity.Branch> list = branchRepository.findByFarmIdOrderByIsDefaultDescIdAsc(targetFarmId);
                        return list.isEmpty() ? null : list.get(0).getId();
                    });
        }

        String zoneType = request.getZoneType();
        if (!StringUtils.hasText(zoneType) || zoneType.equalsIgnoreCase("POULTRY") || zoneType.equalsIgnoreCase("SWINE") || zoneType.equalsIgnoreCase("CATTLE")) {
            zoneType = "BARN";
        }

        BigDecimal areaM2 = request.getAreaM2() != null ? request.getAreaM2() : BigDecimal.valueOf(1000);

        ProductionZone zone = ProductionZone.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
                .branchId(branchId)
                .code(code)
                .name(request.getName())
                .zoneType(zoneType)
                .areaM2(areaM2)
                .soilType(request.getSoilType())
                .waterSource(request.getWaterSource())
                .status("ACTIVE")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        zone = productionZoneRepository.save(zone);
        return toZoneResponse(zone);
    }

    @Override
    @Transactional
    public ProductionZoneResponse updateZone(Long farmId, Long zoneId, UpdateProductionZoneRequest request) {
        ProductionZone zone = productionZoneRepository.findById(zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Khu nuôi", zoneId));

        if (StringUtils.hasText(request.getName())) zone.setName(request.getName());
        if (StringUtils.hasText(request.getZoneType())) {
            String zType = request.getZoneType();
            if (zType.equalsIgnoreCase("POULTRY") || zType.equalsIgnoreCase("SWINE") || zType.equalsIgnoreCase("CATTLE")) {
                zType = "BARN";
            }
            zone.setZoneType(zType);
        }
        if (request.getAreaM2() != null) {
            List<ZoneLocation> existingBarns = zoneLocationRepository.findByZoneId(zoneId);
            BigDecimal totalBarnsArea = existingBarns.stream()
                    .map(b -> b.getAreaM2() != null ? b.getAreaM2() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (request.getAreaM2().compareTo(totalBarnsArea) < 0) {
                throw new IllegalArgumentException("Diện tích khu nuôi (" + request.getAreaM2() + " m²) không được nhỏ hơn tổng diện tích các chuồng hiện có (" + totalBarnsArea + " m²). Vui lòng điều chỉnh lại diện tích các chuồng trước.");
            }
            zone.setAreaM2(request.getAreaM2());
        }
        if (request.getSoilType() != null) zone.setSoilType(request.getSoilType());
        if (request.getWaterSource() != null) zone.setWaterSource(request.getWaterSource());
        if (StringUtils.hasText(request.getStatus())) zone.setStatus(request.getStatus());
        zone.setUpdatedAt(Instant.now());
        zone.setUpdatedBy(SecurityUtils.getCurrentUserId());

        zone = productionZoneRepository.save(zone);
        return toZoneResponse(zone);
    }

    @Override
    @Transactional
    public void deleteZone(Long farmId, Long zoneId) {
        ProductionZone zone = productionZoneRepository.findById(zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Khu nuôi", zoneId));

        List<ZoneLocation> barnsInZone = zoneLocationRepository.findByZoneId(zoneId);
        if (barnsInZone != null && !barnsInZone.isEmpty()) {
            throw new IllegalArgumentException("Không thể xóa khu nuôi đang có " + barnsInZone.size() + " chuồng trực thuộc. Vui lòng chuyển hoặc xóa các chuồng trước.");
        }

        productionZoneRepository.delete(zone);
    }

    // ==========================================
    // 2. BARNS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<BarnCardResponse> getBarns(Long farmId, Long branchId) {
        Long targetFarmId = resolveFarmId(farmId);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Data Scope for Workers (allBarns check)
        Set<Long> allowedBarnIds = null;
        if (currentUserId != null && !SecurityUtils.isSuperAdmin() && !SecurityUtils.hasRole("ROLE_FARM_OWNER") && !SecurityUtils.hasRole("ROLE_FARM_MANAGER")) {
            FarmMember member = farmMemberRepository.findByFarmIdAndUserId(targetFarmId, currentUserId).orElse(null);
            if (member != null && Boolean.FALSE.equals(member.getAllBarns()) && StringUtils.hasText(member.getBarnIds())) {
                try {
                    List<Long> ids = objectMapper.readValue(member.getBarnIds(), new TypeReference<>() {});
                    allowedBarnIds = new HashSet<>(ids);
                } catch (Exception ex) {
                    log.warn("Failed to parse allowedBarnIds for userId {}: {}", currentUserId, ex.getMessage());
                }
            }
        }

        // 2. Fetch zones for farm / branch
        Long effectiveBranchId = branchId != null ? branchId : SecurityUtils.getCurrentBranchId();
        List<ProductionZone> zones;
        if (effectiveBranchId != null) {
            zones = productionZoneRepository.findByFarmIdAndBranchId(targetFarmId, effectiveBranchId);
        } else {
            zones = productionZoneRepository.findByFarmId(targetFarmId);
        }
        Map<Long, ProductionZone> zoneMap = zones.stream().collect(Collectors.toMap(ProductionZone::getId, z -> z, (a, b) -> a));

        List<ZoneLocation> locations;
        if (effectiveBranchId != null) {
            if (zones.isEmpty()) return Collections.emptyList();
            locations = zoneLocationRepository.findByZoneIdIn(zoneMap.keySet());
        } else {
            locations = zoneLocationRepository.findByFarmId(targetFarmId);
        }

        // Filter by worker barn scope if restricted
        if (allowedBarnIds != null) {
            final Set<Long> scopeSet = allowedBarnIds;
            locations = locations.stream().filter(l -> scopeSet.contains(l.getId())).collect(Collectors.toList());
        }

        // 3. Find active batches in these locations
        List<Long> locationIds = locations.stream().map(ZoneLocation::getId).collect(Collectors.toList());
        Map<Long, LivestockGroup> activeBatchesMap = new HashMap<>();
        if (!locationIds.isEmpty()) {
            List<LivestockGroup> activeGroups = livestockGroupRepository.findByLocationIdInAndStatus(locationIds, "ACTIVE");
            for (LivestockGroup g : activeGroups) {
                if (g.getLocationId() != null) {
                    activeBatchesMap.put(g.getLocationId(), g);
                }
            }
        }

        // Cache breeds
        Map<Long, LivestockBreed> breedMap = livestockBreedRepository.findAll().stream()
                .collect(Collectors.toMap(LivestockBreed::getId, b -> b, (a, b) -> a));

        List<BarnCardResponse> cardList = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (ZoneLocation loc : locations) {
            ProductionZone zone = zoneMap.get(loc.getZoneId());
            if (zone == null) {
                zone = productionZoneRepository.findById(loc.getZoneId()).orElse(null);
            }

            LivestockGroup batch = activeBatchesMap.get(loc.getId());
            BarnCardResponse.BatchSummary batchSummary = null;

            if (batch != null) {
                LivestockBreed breed = breedMap.get(batch.getBreedId());
                int daysOld = (int) Math.max(1, ChronoUnit.DAYS.between(batch.getEntryDate(), today));
                int initialQty = batch.getInitialQuantity() != null ? batch.getInitialQuantity() : 1;
                int currentQty = batch.getCurrentQuantity() != null ? batch.getCurrentQuantity() : 0;
                int deadOrCulled = Math.max(0, initialQty - currentQty);
                BigDecimal mortalityRate = BigDecimal.valueOf(deadOrCulled)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(initialQty), 2, RoundingMode.HALF_UP);

                BigDecimal targetWeight = (breed != null && breed.getTargetWeightKg() != null) ? breed.getTargetWeightKg() : BigDecimal.valueOf(2.8);
                BigDecimal stdFcr = (breed != null && breed.getFcrTarget() != null) ? breed.getFcrTarget() : BigDecimal.valueOf(1.65);

                // Estimated or latest weight
                BigDecimal currentWeight = batch.getAvgInitialWeightKg() != null ? batch.getAvgInitialWeightKg() : BigDecimal.valueOf(0.05);
                var latestWeightLog = livestockWeightLogRepository.findTopByGroupIdOrderByRecordDateDescCreatedAtDesc(batch.getId()).orElse(null);
                if (latestWeightLog != null) {
                    currentWeight = latestWeightLog.getWeightKg();
                } else if (breed != null && breed.getStandardGrowthDays() != null && breed.getStandardGrowthDays() > 0) {
                    double progress = Math.min(1.0, (double) daysOld / breed.getStandardGrowthDays());
                    currentWeight = currentWeight.add(targetWeight.subtract(currentWeight).multiply(BigDecimal.valueOf(progress))).setScale(2, RoundingMode.HALF_UP);
                }

                BigDecimal totalFeedKg = livestockEventRepository.sumFeedAmountByGroupId(batch.getId());
                if (totalFeedKg == null) totalFeedKg = BigDecimal.ZERO;

                BigDecimal weightGain = currentWeight.subtract(batch.getAvgInitialWeightKg() != null ? batch.getAvgInitialWeightKg() : BigDecimal.ZERO)
                        .multiply(BigDecimal.valueOf(currentQty));
                BigDecimal actualFcr = (weightGain.compareTo(BigDecimal.ZERO) > 0 && totalFeedKg.compareTo(BigDecimal.ZERO) > 0)
                        ? totalFeedKg.divide(weightGain, 2, RoundingMode.HALF_UP)
                        : stdFcr;

                boolean isAlert = actualFcr.compareTo(stdFcr.multiply(BigDecimal.valueOf(1.15))) > 0 || mortalityRate.compareTo(BigDecimal.valueOf(5.0)) > 0;

                batchSummary = BarnCardResponse.BatchSummary.builder()
                        .id(batch.getId())
                        .code(batch.getGroupCode())
                        .breedId(batch.getBreedId())
                        .breedName(breed != null ? breed.getBreedName() : "Giống tiêu chuẩn")
                        .species(breed != null ? breed.getSpecies() : "POULTRY")
                        .daysOld(daysOld)
                        .initialQuantity(initialQty)
                        .currentQuantity(currentQty)
                        .avgWeightKg(currentWeight)
                        .targetWeightKg(targetWeight)
                        .fcr(actualFcr)
                        .standardFcr(stdFcr)
                        .mortalityRate(mortalityRate)
                        .feedConsumedTodayKg(BigDecimal.valueOf(25))
                        .isAlert(isAlert)
                        .build();
            }

            String barnStatus;
            if (batchSummary != null) {
                barnStatus = Boolean.TRUE.equals(batchSummary.getIsAlert()) ? "ALERT" : "ACTIVE";
            } else {
                barnStatus = "EMPTY";
            }

            BarnCardResponse card = BarnCardResponse.builder()
                    .id(loc.getId())
                    .code(loc.getCode())
                    .name(loc.getName())
                    .zoneId(loc.getZoneId())
                    .zoneName(zone != null ? zone.getName() : "Khu nuôi")
                    .branchId(zone != null ? zone.getBranchId() : null)
                    .areaM2(loc.getAreaM2())
                    .capacity(loc.getCapacity() != null ? loc.getCapacity() : 1000)
                    .capacityUnit(loc.getCapacityUnit() != null ? loc.getCapacityUnit() : "con")
                    .status(barnStatus)
                    .description(loc.getDescription())
                    .currentBatch(batchSummary)
                    .build();

            cardList.add(card);
        }

        return cardList;
    }

    @Override
    @Transactional
    public ZoneLocationResponse createBarn(Long farmId, CreateZoneLocationRequest request) {
        Long targetFarmId = resolveFarmId(farmId);
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;

        String code = request.getCode();
        if (!StringUtils.hasText(code)) {
            code = "CHUONG-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        }

        BigDecimal areaM2 = request.getAreaM2() != null ? request.getAreaM2() : BigDecimal.valueOf(180);
        Integer capacity = request.getCapacity() != null ? request.getCapacity() : 1000;

        // Kiểm tra tổng diện tích các chuồng không được vượt quá diện tích khu nuôi
        if (request.getZoneId() != null) {
            ProductionZone zone = productionZoneRepository.findById(request.getZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Khu nuôi", request.getZoneId()));
            List<ZoneLocation> existingBarns = zoneLocationRepository.findByZoneId(request.getZoneId());
            BigDecimal currentTotalBarnArea = existingBarns.stream()
                    .map(b -> b.getAreaM2() != null ? b.getAreaM2() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal newTotalArea = currentTotalBarnArea.add(areaM2);
            if (zone.getAreaM2() != null && newTotalArea.compareTo(zone.getAreaM2()) > 0) {
                BigDecimal remainingArea = zone.getAreaM2().subtract(currentTotalBarnArea);
                if (remainingArea.compareTo(BigDecimal.ZERO) < 0) remainingArea = BigDecimal.ZERO;
                throw new IllegalArgumentException("Tổng diện tích các chuồng (" + newTotalArea + " m²) không được lớn hơn diện tích của khu nuôi " + zone.getName() + " (" + zone.getAreaM2() + " m²). Diện tích chuồng còn khả dụng: " + remainingArea + " m².");
            }
        }

        ZoneLocation barn = ZoneLocation.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
                .zoneId(request.getZoneId())
                .warehouseId(request.getWarehouseId())
                .code(code)
                .name(request.getName())
                .description(request.getDescription())
                .status("EMPTY")
                .areaM2(areaM2)
                .capacity(capacity)
                .capacityUnit(request.getCapacityUnit() != null ? request.getCapacityUnit() : "con")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        barn = zoneLocationRepository.save(barn);
        return toLocationResponse(barn);
    }

    @Override
    @Transactional
    public ZoneLocationResponse updateBarn(Long farmId, Long barnId, UpdateZoneLocationRequest request) {
        ZoneLocation barn = zoneLocationRepository.findById(barnId)
                .orElseThrow(() -> new ResourceNotFoundException("Chuồng nuôi", barnId));

        if (StringUtils.hasText(request.getName())) barn.setName(request.getName());

        Long targetZoneId = request.getZoneId() != null ? request.getZoneId() : barn.getZoneId();
        BigDecimal newArea = request.getAreaM2() != null ? request.getAreaM2() : (barn.getAreaM2() != null ? barn.getAreaM2() : BigDecimal.ZERO);

        // Kiểm tra tổng diện tích các chuồng không được vượt quá diện tích khu nuôi
        if (targetZoneId != null && (request.getAreaM2() != null || request.getZoneId() != null)) {
            ProductionZone zone = productionZoneRepository.findById(targetZoneId)
                    .orElseThrow(() -> new ResourceNotFoundException("Khu nuôi", targetZoneId));
            List<ZoneLocation> existingBarns = zoneLocationRepository.findByZoneId(targetZoneId);
            BigDecimal otherBarnsArea = existingBarns.stream()
                    .filter(b -> !b.getId().equals(barnId))
                    .map(b -> b.getAreaM2() != null ? b.getAreaM2() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalWithNewArea = otherBarnsArea.add(newArea);
            if (zone.getAreaM2() != null && totalWithNewArea.compareTo(zone.getAreaM2()) > 0) {
                BigDecimal remainingArea = zone.getAreaM2().subtract(otherBarnsArea);
                if (remainingArea.compareTo(BigDecimal.ZERO) < 0) remainingArea = BigDecimal.ZERO;
                throw new IllegalArgumentException("Tổng diện tích các chuồng (" + totalWithNewArea + " m²) không được lớn hơn diện tích của khu nuôi " + zone.getName() + " (" + zone.getAreaM2() + " m²). Diện tích tối đa có thể đặt cho chuồng này: " + remainingArea + " m².");
            }
        }

        if (request.getZoneId() != null) barn.setZoneId(request.getZoneId());
        if (request.getWarehouseId() != null) barn.setWarehouseId(request.getWarehouseId());
        if (request.getAreaM2() != null) barn.setAreaM2(request.getAreaM2());
        if (request.getCapacity() != null) barn.setCapacity(request.getCapacity());
        if (StringUtils.hasText(request.getCapacityUnit())) barn.setCapacityUnit(request.getCapacityUnit());
        if (request.getDescription() != null) barn.setDescription(request.getDescription());
        if (StringUtils.hasText(request.getStatus())) barn.setStatus(request.getStatus());

        barn.setUpdatedAt(Instant.now());
        barn.setUpdatedBy(SecurityUtils.getCurrentUserId());
        barn = zoneLocationRepository.save(barn);
        return toLocationResponse(barn);
    }

    @Override
    @Transactional
    public void deleteBarn(Long farmId, Long barnId) {
        ZoneLocation barn = zoneLocationRepository.findById(barnId)
                .orElseThrow(() -> new ResourceNotFoundException("Chuồng nuôi", barnId));

        // Kiểm tra nếu chuồng đang có lứa nuôi hoạt động
        List<LivestockGroup> activeBatches = livestockGroupRepository.findByLocationIdAndStatus(barnId, "ACTIVE");
        if (activeBatches != null && !activeBatches.isEmpty()) {
            throw new IllegalArgumentException("Không thể xóa chuồng đang có lứa nuôi hoạt động (" + activeBatches.get(0).getGroupCode() + ")");
        }

        // Kiểm tra nếu chuồng đã có dữ liệu lứa nuôi lịch sử
        List<LivestockGroup> allBatches = livestockGroupRepository.findByLocationId(barnId);
        if (allBatches != null && !allBatches.isEmpty()) {
            throw new IllegalArgumentException("Không thể xóa chuồng đã có dữ liệu lứa nuôi lịch sử. Vui lòng chuyển trạng thái chuồng sang ngưng hoạt động.");
        }

        zoneLocationRepository.delete(barn);
    }

    // ==========================================
    // 3. BATCHES (VÒNG ĐỜI LỨA NUÔI)
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public BatchDetailResponse getBatchById(Long batchId) {
        LivestockGroup group = livestockGroupRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lứa nuôi", batchId));

        LivestockBreed breed = livestockBreedRepository.findById(group.getBreedId()).orElse(null);
        ZoneLocation barn = group.getLocationId() != null ? zoneLocationRepository.findById(group.getLocationId()).orElse(null) : null;
        ProductionZone zone = group.getZoneId() != null ? productionZoneRepository.findById(group.getZoneId()).orElse(null) : null;

        LocalDate today = LocalDate.now();
        int daysOld = (int) Math.max(1, ChronoUnit.DAYS.between(group.getEntryDate(), today));
        int initialQty = group.getInitialQuantity() != null ? group.getInitialQuantity() : 1;
        int currentQty = group.getCurrentQuantity() != null ? group.getCurrentQuantity() : 0;
        int deadOrCulled = Math.max(0, initialQty - currentQty);
        BigDecimal mortalityRate = BigDecimal.valueOf(deadOrCulled)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(initialQty), 2, RoundingMode.HALF_UP);

        BigDecimal targetWeight = (breed != null && breed.getTargetWeightKg() != null) ? breed.getTargetWeightKg() : BigDecimal.valueOf(2.8);
        BigDecimal stdFcr = (breed != null && breed.getFcrTarget() != null) ? breed.getFcrTarget() : BigDecimal.valueOf(1.65);

        BigDecimal currentWeight = group.getAvgInitialWeightKg() != null ? group.getAvgInitialWeightKg() : BigDecimal.valueOf(0.05);
        var latestWeightLog = livestockWeightLogRepository.findTopByGroupIdOrderByRecordDateDescCreatedAtDesc(group.getId()).orElse(null);
        if (latestWeightLog != null) {
            currentWeight = latestWeightLog.getWeightKg();
        } else if (breed != null && breed.getStandardGrowthDays() != null && breed.getStandardGrowthDays() > 0) {
            double progress = Math.min(1.0, (double) daysOld / breed.getStandardGrowthDays());
            currentWeight = currentWeight.add(targetWeight.subtract(currentWeight).multiply(BigDecimal.valueOf(progress))).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal totalFeedKg = livestockEventRepository.sumFeedAmountByGroupId(group.getId());
        if (totalFeedKg == null) totalFeedKg = BigDecimal.ZERO;

        BigDecimal initialWeightTotal = (group.getAvgInitialWeightKg() != null ? group.getAvgInitialWeightKg() : BigDecimal.ZERO)
                .multiply(BigDecimal.valueOf(initialQty));
        BigDecimal currentWeightTotal = currentWeight.multiply(BigDecimal.valueOf(currentQty));
        BigDecimal weightGainTotal = currentWeightTotal.subtract(initialWeightTotal);

        BigDecimal actualFcr = (weightGainTotal.compareTo(BigDecimal.ZERO) > 0 && totalFeedKg.compareTo(BigDecimal.ZERO) > 0)
                ? totalFeedKg.divide(weightGainTotal, 2, RoundingMode.HALF_UP)
                : stdFcr;

        BigDecimal fcrDiff = actualFcr.subtract(stdFcr);
        BigDecimal adgGrams = currentWeight.subtract(group.getAvgInitialWeightKg() != null ? group.getAvgInitialWeightKg() : BigDecimal.ZERO)
                .multiply(BigDecimal.valueOf(1000))
                .divide(BigDecimal.valueOf(daysOld), 1, RoundingMode.HALF_UP);

        boolean isAlert = actualFcr.compareTo(stdFcr.multiply(BigDecimal.valueOf(1.15))) > 0 || mortalityRate.compareTo(BigDecimal.valueOf(5.0)) > 0;

        // Tab 1: Overview
        BatchDetailResponse.OverviewTab overview = BatchDetailResponse.OverviewTab.builder()
                .daysOld(daysOld)
                .currentQuantity(currentQty)
                .initialQuantity(initialQty)
                .currentAvgWeightKg(currentWeight)
                .targetWeightKg(targetWeight)
                .actualFcr(actualFcr)
                .standardFcr(stdFcr)
                .fcrDifference(fcrDiff)
                .adgGrams(adgGrams)
                .totalFeedConsumedKg(totalFeedKg)
                .mortalityRate(mortalityRate)
                .isAlert(isAlert)
                .alertReason(isAlert ? "Tỷ lệ FCR vượt quá 15% định mức chuẩn hoặc hao hụt cao" : null)
                .build();

        // Parse extra data stored in group notes
        Map<String, Object> extraMap = getExtraMap(group);

        // Technical Targets
        BigDecimal fcrTarget = (breed != null && breed.getFcrTarget() != null) ? breed.getFcrTarget() : BigDecimal.valueOf(1.62);
        BigDecimal costPerKgTarget = BigDecimal.valueOf(32500);
        BigDecimal maxMortalityPct = BigDecimal.valueOf(3.5);
        BigDecimal expectedHarvestWeightKg = targetWeight;

        if (extraMap.containsKey("targets")) {
            try {
                Map<String, Object> tMap = (Map<String, Object>) extraMap.get("targets");
                if (tMap.get("fcrTarget") != null) fcrTarget = new BigDecimal(tMap.get("fcrTarget").toString());
                if (tMap.get("costPerKgTarget") != null) costPerKgTarget = new BigDecimal(tMap.get("costPerKgTarget").toString());
                if (tMap.get("maxMortalityPct") != null) maxMortalityPct = new BigDecimal(tMap.get("maxMortalityPct").toString());
                if (tMap.get("expectedHarvestWeightKg") != null) expectedHarvestWeightKg = new BigDecimal(tMap.get("expectedHarvestWeightKg").toString());
            } catch (Exception ignored) {}
        }

        BatchDetailResponse.BatchTargets targets = BatchDetailResponse.BatchTargets.builder()
                .fcrTarget(fcrTarget)
                .costPerKgTarget(costPerKgTarget)
                .maxMortalityPct(maxMortalityPct)
                .expectedHarvestWeightKg(expectedHarvestWeightKg)
                .build();

        // Groups: Danh sách các đợt nhập đàn
        List<BatchDetailResponse.LivestockGroupItem> groupsList = new ArrayList<>();
        int weeksOld = Math.max(1, daysOld / 7);
        groupsList.add(BatchDetailResponse.LivestockGroupItem.builder()
                .id(group.getId())
                .groupCode(group.getGroupCode())
                .breedId(group.getBreedId())
                .breedName(breed != null ? breed.getBreedName() : "Giống tiêu chuẩn")
                .initialQuantity(initialQty)
                .currentQuantity(currentQty)
                .avgInitialWeightKg(group.getAvgInitialWeightKg() != null ? group.getAvgInitialWeightKg() : BigDecimal.valueOf(0.045))
                .gender("MIXED")
                .sourceType("PURCHASE")
                .entryDate(group.getEntryDate())
                .weeksOld(weeksOld)
                .totalCost(group.getTotalCost() != null ? group.getTotalCost() : BigDecimal.valueOf(initialQty * 15000L))
                .build());

        if (extraMap.containsKey("extraGroups")) {
            try {
                List<Map<String, Object>> eGroups = (List<Map<String, Object>>) extraMap.get("extraGroups");
                for (Map<String, Object> eg : eGroups) {
                    groupsList.add(BatchDetailResponse.LivestockGroupItem.builder()
                            .id(Long.parseLong(eg.get("id").toString()))
                            .groupCode(eg.get("groupCode").toString())
                            .breedId(eg.get("breedId") != null ? Long.parseLong(eg.get("breedId").toString()) : group.getBreedId())
                            .breedName(eg.get("breedName") != null ? eg.get("breedName").toString() : (breed != null ? breed.getBreedName() : "Giống bổ sung"))
                            .initialQuantity(Integer.parseInt(eg.get("initialQuantity").toString()))
                            .currentQuantity(Integer.parseInt(eg.get("currentQuantity").toString()))
                            .avgInitialWeightKg(new BigDecimal(eg.get("avgInitialWeightKg").toString()))
                            .gender(eg.get("gender") != null ? eg.get("gender").toString() : "MIXED")
                            .sourceType(eg.get("sourceType") != null ? eg.get("sourceType").toString() : "PURCHASE")
                            .entryDate(LocalDate.parse(eg.get("entryDate").toString()))
                            .weeksOld(Integer.parseInt(eg.get("weeksOld").toString()))
                            .totalCost(new BigDecimal(eg.get("totalCost").toString()))
                            .build());
                }
            } catch (Exception ignored) {}
        }

        // Applied Programs: Các quy trình đang gắn
        List<BatchDetailResponse.AppliedProgramItem> appliedPrograms = new ArrayList<>();
        if (extraMap.containsKey("appliedPrograms")) {
            try {
                List<Map<String, Object>> pList = (List<Map<String, Object>>) extraMap.get("appliedPrograms");
                for (Map<String, Object> p : pList) {
                    appliedPrograms.add(BatchDetailResponse.AppliedProgramItem.builder()
                            .id(Long.parseLong(p.get("id").toString()))
                            .programId(Long.parseLong(p.get("programId").toString()))
                            .programCode(p.get("programCode").toString())
                            .programName(p.get("programName").toString())
                            .programType(p.get("programType").toString())
                            .description(p.get("description") != null ? p.get("description").toString() : "")
                            .milestonesCount(p.get("milestonesCount") != null ? Integer.parseInt(p.get("milestonesCount").toString()) : 10)
                            .appliedDate(p.get("appliedDate") != null ? LocalDate.parse(p.get("appliedDate").toString()) : group.getEntryDate())
                            .build());
                }
            } catch (Exception ignored) {}
        }
        if (appliedPrograms.isEmpty()) {
            boolean isPoultry = breed == null || !"SWINE".equalsIgnoreCase(breed.getSpecies());
            appliedPrograms.add(BatchDetailResponse.AppliedProgramItem.builder()
                    .id(1L)
                    .programId(1L)
                    .programCode(isPoultry ? "CT-CAM-GA-CP" : "CT-CAM-HEO-CP")
                    .programName(isPoultry ? "Quy trình Cám Gà Thịt CP Chuẩn (0-42 ngày)" : "Quy trình Cám Heo Thịt Chuẩn (Cai sữa - Xuất bán)")
                    .programType("FEED")
                    .description("Định mức cám theo từng ngày tuổi bám sát tăng trọng thực tế")
                    .milestonesCount(isPoultry ? 42 : 110)
                    .appliedDate(group.getEntryDate())
                    .build());
            appliedPrograms.add(BatchDetailResponse.AppliedProgramItem.builder()
                    .id(2L)
                    .programId(2L)
                    .programCode(isPoultry ? "VX-GA-45N" : "VX-HEO-CHUAN")
                    .programName(isPoultry ? "Lịch phòng Vắc-xin Gà thịt 45 ngày" : "Lịch tiêm Vắc-xin Heo thịt thương phẩm")
                    .programType("VACCINE")
                    .description("Lịch tiêm chủng và nhỏ thuốc phòng dịch bệnh định kỳ")
                    .milestonesCount(isPoultry ? 6 : 8)
                    .appliedDate(group.getEntryDate())
                    .build());
        }

        // By-products: Phụ thu bán phân, vỏ bao (chỉ hiển thị dữ liệu thật)
        List<BatchDetailResponse.ByProductItem> byProductsList = new ArrayList<>();
        if (extraMap.containsKey("byProducts")) {
            try {
                List<Map<String, Object>> bpList = (List<Map<String, Object>>) extraMap.get("byProducts");
                for (Map<String, Object> bp : bpList) {
                    byProductsList.add(BatchDetailResponse.ByProductItem.builder()
                            .id(Long.parseLong(bp.get("id").toString()))
                            .itemCode(bp.get("itemCode").toString())
                            .itemName(bp.get("itemName").toString())
                            .quantity(new BigDecimal(bp.get("quantity").toString()))
                            .unit(bp.get("unit").toString())
                            .unitPrice(new BigDecimal(bp.get("unitPrice").toString()))
                            .totalAmount(new BigDecimal(bp.get("totalAmount").toString()))
                            .receiptDate(LocalDate.parse(bp.get("receiptDate").toString()))
                            .notes(bp.get("notes") != null ? bp.get("notes").toString() : "")
                            .build());
                }
            } catch (Exception ignored) {}
        }

        // Harvest Records: Thu hoạch / Xuất bán (chỉ hiển thị dữ liệu thật)
        List<BatchDetailResponse.HarvestRecordItem> harvestList = new ArrayList<>();
        if (extraMap.containsKey("harvestRecords")) {
            try {
                List<Map<String, Object>> hList = (List<Map<String, Object>>) extraMap.get("harvestRecords");
                for (Map<String, Object> h : hList) {
                    harvestList.add(BatchDetailResponse.HarvestRecordItem.builder()
                            .id(Long.parseLong(h.get("id").toString()))
                            .orderCode(h.get("orderCode").toString())
                            .groupCode(h.get("groupCode").toString())
                            .quantityHead(Integer.parseInt(h.get("quantityHead").toString()))
                            .totalWeightKg(new BigDecimal(h.get("totalWeightKg").toString()))
                            .unitCost(new BigDecimal(h.get("unitCost").toString()))
                            .salePrice(new BigDecimal(h.get("salePrice").toString()))
                            .totalRevenue(new BigDecimal(h.get("totalRevenue").toString()))
                            .harvestType(h.get("harvestType").toString())
                            .harvestDate(LocalDate.parse(h.get("harvestDate").toString()))
                            .build());
                }
            } catch (Exception ignored) {}
        }
        int totalHarvested = harvestList.stream().mapToInt(BatchDetailResponse.HarvestRecordItem::getQuantityHead).sum();

        // Tab 2: Event logs
        List<LivestockEvent> events = livestockEventRepository.findByLivestockGroupIdOrderByEventDateDesc(group.getId());
        List<BatchDetailResponse.EventLogItem> eventLogs = events.stream().map(e -> {
            Integer dead = 0;
            Integer cull = 0;
            BigDecimal feed = BigDecimal.ZERO;
            BigDecimal sampleWeight = null;
            BigDecimal temp = null;
            BigDecimal hum = null;
            BigDecimal nh3 = null;
            BigDecimal co2 = null;
            String medName = null;
            String route = null;
            String disReason = null;
            String desc = e.getEventType();
            String author = "Kỹ thuật viên";

            if (StringUtils.hasText(e.getDetailsJson())) {
                try {
                    Map<String, Object> map = objectMapper.readValue(e.getDetailsJson(), new TypeReference<>() {});
                    if (map.containsKey("dead_count")) dead = Integer.parseInt(map.get("dead_count").toString());
                    if (map.containsKey("cull_count")) cull = Integer.parseInt(map.get("cull_count").toString());
                    if (map.containsKey("feed_kg")) feed = new BigDecimal(map.get("feed_kg").toString());
                    if (map.containsKey("sample_avg_weight")) sampleWeight = new BigDecimal(map.get("sample_avg_weight").toString());
                    if (map.containsKey("temperature_c")) temp = new BigDecimal(map.get("temperature_c").toString());
                    if (map.containsKey("humidity_pct")) hum = new BigDecimal(map.get("humidity_pct").toString());
                    if (map.containsKey("nh3_ppm")) nh3 = new BigDecimal(map.get("nh3_ppm").toString());
                    if (map.containsKey("co2_ppm")) co2 = new BigDecimal(map.get("co2_ppm").toString());
                    if (map.containsKey("medicine_name")) medName = map.get("medicine_name").toString();
                    if (map.containsKey("admin_route")) route = map.get("admin_route").toString();
                    if (map.containsKey("disease_reason")) disReason = map.get("disease_reason").toString();
                    if (map.containsKey("description")) desc = map.get("description").toString();
                } catch (Exception ignored) {}
            }

            return BatchDetailResponse.EventLogItem.builder()
                    .id(e.getId())
                    .eventType(e.getEventType())
                    .date(e.getEventDate())
                    .description(desc)
                    .deadCount(dead)
                    .cullCount(cull)
                    .feedAmountKg(feed)
                    .standardFeedKg(feed.compareTo(BigDecimal.ZERO) > 0 ? feed.multiply(BigDecimal.valueOf(0.95)) : BigDecimal.ZERO)
                    .sampleWeightKg(sampleWeight)
                    .temperatureC(temp)
                    .humidityPct(hum)
                    .nh3Ppm(nh3)
                    .co2Ppm(co2)
                    .medicineName(medName)
                    .adminRoute(route)
                    .diseaseReason(disReason)
                    .withdrawalDays(e.getWithdrawalDays() != null ? e.getWithdrawalDays() : 0)
                    .authorName(author)
                    .notes(e.getDetailsJson())
                    .isAlert(Boolean.TRUE.equals(e.getIsQuarantined()))
                    .alertReason(Boolean.TRUE.equals(e.getIsQuarantined()) ? "Vượt ngưỡng an toàn kỹ thuật" : null)
                    .build();
        }).collect(Collectors.toList());

        // Tab 3: Consumed materials
        List<LivestockEventSupply> supplies = livestockEventSupplyRepository.findByLivestockEventLivestockGroupId(group.getId());
        Map<Long, List<LivestockEventSupply>> byMaterial = supplies.stream().collect(Collectors.groupingBy(LivestockEventSupply::getMaterialId));
        List<BatchDetailResponse.ConsumedMaterialItem> consumedMaterials = new ArrayList<>();

        for (Map.Entry<Long, List<LivestockEventSupply>> entry : byMaterial.entrySet()) {
            Long matId = entry.getKey();
            List<LivestockEventSupply> list = entry.getValue();
            Material m = materialRepository.findById(matId).orElse(null);

            BigDecimal qty = list.stream().map(LivestockEventSupply::getActualQuantity).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalAmount = list.stream().map(LivestockEventSupply::getTotalPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal unitP = (qty.compareTo(BigDecimal.ZERO) > 0) ? totalAmount.divide(qty, 0, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            consumedMaterials.add(BatchDetailResponse.ConsumedMaterialItem.builder()
                    .materialId(matId)
                    .materialName(m != null ? m.getName() : "Vật tư #" + matId)
                    .category(m != null ? m.getDispatchStrategy() : "Vật tư")
                    .totalQuantity(qty)
                    .unit(list.get(0).getUnit())
                    .unitPrice(unitP)
                    .totalPrice(totalAmount)
                    .build());
        }

        // Tab 4: Financial PnL
        boolean canViewFin = SecurityUtils.hasAuthority("financial.price.view")
                || SecurityUtils.hasAuthority("financial.view_cost")
                || SecurityUtils.hasAuthority("PERM_FINANCE_REPORT")
                || SecurityUtils.hasRole("ROLE_FARM_OWNER")
                || SecurityUtils.hasRole("ROLE_ACCOUNTANT")
                || SecurityUtils.isSuperAdmin();

        BatchDetailResponse.FinancialPnlTab financialPnl = null;
        if (canViewFin) {
            BigDecimal breedCost = group.getTotalCost() != null ? group.getTotalCost() : BigDecimal.ZERO;

            // Tính chi phí thật từ các phiếu tiêu hao vật tư (LivestockEventSupply) theo loại sự kiện
            Map<Long, String> eventTypeById = events.stream()
                    .collect(Collectors.toMap(LivestockEvent::getId, LivestockEvent::getEventType, (a, b) -> a));

            BigDecimal feedCost = BigDecimal.ZERO;
            BigDecimal medCost = BigDecimal.ZERO;
            BigDecimal suppliesCost = BigDecimal.ZERO;
            for (LivestockEventSupply s : supplies) {
                BigDecimal amt = s.getTotalPrice() != null ? s.getTotalPrice() : BigDecimal.ZERO;
                String evType = eventTypeById.getOrDefault(s.getLivestockEventId(), "");
                if ("FEED".equalsIgnoreCase(evType)) {
                    feedCost = feedCost.add(amt);
                } else if ("MEDICINE".equalsIgnoreCase(evType)) {
                    medCost = medCost.add(amt);
                } else {
                    suppliesCost = suppliesCost.add(amt);
                }
            }
            BigDecimal laborCost = BigDecimal.ZERO;
            BigDecimal electricityWaterCost = BigDecimal.ZERO;
            BigDecimal otherCost = BigDecimal.ZERO;

            BigDecimal totalCost = breedCost.add(feedCost).add(medCost).add(suppliesCost).add(laborCost).add(electricityWaterCost).add(otherCost);

            BigDecimal harvestRev = harvestList.stream().map(BatchDetailResponse.HarvestRecordItem::getTotalRevenue).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal byProdRev = byProductsList.stream().map(BatchDetailResponse.ByProductItem::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal liveRemainingKg = currentWeight.multiply(BigDecimal.valueOf(currentQty));
            BigDecimal marketPriceKg = "SWINE".equalsIgnoreCase(group.getManagementType()) ? BigDecimal.valueOf(62000) : BigDecimal.valueOf(38000);
            BigDecimal remainingEstRev = liveRemainingKg.multiply(marketPriceKg).setScale(0, RoundingMode.HALF_UP);
            BigDecimal totalRevenue = harvestRev.add(byProdRev).add(remainingEstRev);
            BigDecimal profit = totalRevenue.subtract(totalCost);

            BigDecimal totalLiveKg = currentWeight.multiply(BigDecimal.valueOf(currentQty));
            BigDecimal unitCostPerKg = (totalLiveKg.compareTo(BigDecimal.ZERO) > 0)
                    ? totalCost.divide(totalLiveKg, 0, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            BigDecimal unitCostPerHead = (currentQty > 0)
                    ? totalCost.divide(BigDecimal.valueOf(currentQty), 0, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            List<BatchDetailResponse.CostItem> costItems = new ArrayList<>();
            long costSeq = 1L;
            if (breedCost.compareTo(BigDecimal.ZERO) > 0) {
                costItems.add(BatchDetailResponse.CostItem.builder()
                        .id(costSeq++).date(group.getEntryDate()).category("BREED").categoryName("Con giống")
                        .title("Nhập " + initialQty + " con giống").amount(breedCost).sourceRef(group.getGroupCode())
                        .notes("Giá vốn con giống thực tế").build());
            }
            if (feedCost.compareTo(BigDecimal.ZERO) > 0) {
                costItems.add(BatchDetailResponse.CostItem.builder()
                        .id(costSeq++).date(today).category("FEED").categoryName("Thức ăn chăn nuôi")
                        .title("Chi phí thức ăn thực tế từ nhật ký cho ăn").amount(feedCost).sourceRef("NK-CAM")
                        .notes("Tự động kết chuyển từ trừ kho FEFO").build());
            }
            if (medCost.compareTo(BigDecimal.ZERO) > 0) {
                costItems.add(BatchDetailResponse.CostItem.builder()
                        .id(costSeq++).date(today).category("MEDICINE").categoryName("Thuốc & Vắc-xin")
                        .title("Chi phí thuốc & vắc-xin thực tế").amount(medCost).sourceRef("NK-DUOC")
                        .notes("Tự động kết chuyển từ nhật ký cấp thuốc").build());
            }
            if (suppliesCost.compareTo(BigDecimal.ZERO) > 0) {
                costItems.add(BatchDetailResponse.CostItem.builder()
                        .id(costSeq++).date(today).category("SUPPLIES").categoryName("Chất xử lý & Vật tư")
                        .title("Chi phí vật tư tiêu hao").amount(suppliesCost).sourceRef("NK-VT")
                        .notes("Vật tư xuất dùng cho lứa nuôi").build());
            }

            financialPnl = BatchDetailResponse.FinancialPnlTab.builder()
                    .canViewFinancials(true)
                    .breedCost(breedCost)
                    .feedCost(feedCost)
                    .medicineCost(medCost)
                    .suppliesCost(suppliesCost)
                    .laborCost(laborCost)
                    .electricityWaterCost(electricityWaterCost)
                    .otherCost(otherCost)
                    .totalCost(totalCost)
                    .revenue(totalRevenue)
                    .profit(profit)
                    .unitCostPerKg(unitCostPerKg)
                    .unitCostPerHead(unitCostPerHead)
                    .costItems(costItems)
                    .build();
        } else {
            financialPnl = BatchDetailResponse.FinancialPnlTab.builder()
                    .canViewFinancials(false)
                    .build();
        }

        return BatchDetailResponse.builder()
                .id(group.getId())
                .code(group.getGroupCode())
                .breedId(group.getBreedId())
                .breedName(breed != null ? breed.getBreedName() : "Giống tiêu chuẩn")
                .species(breed != null ? breed.getSpecies() : "POULTRY")
                .barnId(barn != null ? barn.getId() : null)
                .barnName(barn != null ? barn.getName() : "Chuồng")
                .barnAreaM2(barn != null && barn.getAreaM2() != null ? barn.getAreaM2() : BigDecimal.valueOf(180))
                .barnCapacity(barn != null ? barn.getCapacity() : 2000)
                .barnDescription(barn != null ? barn.getDescription() : "Chuồng lạnh khép kín máng ăn tự động")
                .zoneId(zone != null ? zone.getId() : null)
                .zoneName(zone != null ? zone.getName() : "Khu nuôi")
                .branchId(zone != null ? zone.getBranchId() : null)
                .entryDate(group.getEntryDate())
                .daysOld(daysOld)
                .initialQuantity(initialQty)
                .currentQuantity(currentQty)
                .deadQuantity(deadOrCulled)
                .culledQuantity(0)
                .harvestedQuantity(totalHarvested)
                .mortalityRate(mortalityRate)
                .avgInitialWeightKg(group.getAvgInitialWeightKg())
                .currentAvgWeightKg(currentWeight)
                .targetWeightKg(targetWeight)
                .totalFeedConsumedKg(totalFeedKg)
                .actualFcr(actualFcr)
                .standardFcr(stdFcr)
                .adgGrams(adgGrams)
                .status(group.getStatus())
                .notes(group.getNotes())
                .targets(targets)
                .overview(overview)
                .eventLogs(eventLogs)
                .consumedMaterials(consumedMaterials)
                .financialPnl(financialPnl)
                .groups(groupsList)
                .appliedPrograms(appliedPrograms)
                .harvestRecords(harvestList)
                .byProducts(byProductsList)
                .build();
    }

    @Override
    @Transactional
    public BatchDetailResponse createBatch(Long farmId, CreateBatchRequest request) {
        Long targetFarmId = resolveFarmId(farmId);
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;

        ZoneLocation barn = zoneLocationRepository.findById(request.getBarnId())
                .orElseThrow(() -> new ResourceNotFoundException("Chuồng nuôi", request.getBarnId()));

        ProductionZone zone = productionZoneRepository.findById(barn.getZoneId())
                .orElseThrow(() -> new ResourceNotFoundException("Khu nuôi", barn.getZoneId()));

        // Kiểm tra loại vật nuôi của chương trình / giống có khớp với loại hình chăn nuôi của chi nhánh
        if (request.getBreedId() != null) {
            LivestockBreed breed = livestockBreedRepository.findById(request.getBreedId()).orElse(null);
            if (breed != null && zone.getBranchId() != null) {
                Branch branch = branchRepository.findById(zone.getBranchId()).orElse(null);
                if (branch != null && StringUtils.hasText(branch.getLivestockType())) {
                    String bType = branch.getLivestockType().toUpperCase();
                    String bSpecies = breed.getSpecies() != null ? breed.getSpecies().toUpperCase() : "";
                    String bBreedName = breed.getBreedName() != null ? breed.getBreedName().toUpperCase() : "";
                    boolean isBranchSwine = bType.contains("SWINE") || bType.contains("PIG") || bType.contains("LIVESTOCK") || (branch.getName() != null && branch.getName().toUpperCase().contains("HEO"));
                    boolean isBreedSwine = bSpecies.contains("SWINE") || bSpecies.contains("PIG") || bSpecies.contains("LIVESTOCK") || bBreedName.contains("HEO") || bBreedName.contains("LỢN");
                    if (isBranchSwine && !isBreedSwine) {
                        throw new IllegalArgumentException("Chi nhánh \"" + branch.getName() + "\" là chi nhánh chăn nuôi Gia súc (Heo), không thể áp dụng chương trình / giống nuôi của Gia cầm (" + breed.getBreedName() + ")!");
                    }
                    if (!isBranchSwine && isBreedSwine) {
                        throw new IllegalArgumentException("Chi nhánh \"" + branch.getName() + "\" là chi nhánh chăn nuôi Gia cầm, không thể áp dụng chương trình / giống nuôi của Heo / Gia súc (" + breed.getBreedName() + ")!");
                    }
                }
            }
        }

        String batchCode = request.getCode();
        if (!StringUtils.hasText(batchCode)) {
            batchCode = "LUA-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        }

        BigDecimal unitPrice = request.getUnitPrice() != null ? request.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal totalCost = unitPrice.multiply(BigDecimal.valueOf(request.getInitialQuantity()));

        LivestockGroup group = LivestockGroup.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
                .branchId(zone.getBranchId())
                .zoneId(zone.getId())
                .locationId(barn.getId())
                .breedId(request.getBreedId())
                .partnerId(request.getPartnerId())
                .groupCode(batchCode)
                .initialQuantity(request.getInitialQuantity())
                .currentQuantity(request.getInitialQuantity())
                .unitPrice(unitPrice)
                .totalCost(totalCost)
                .avgInitialWeightKg(request.getAvgInitialWeightKg() != null ? request.getAvgInitialWeightKg() : BigDecimal.valueOf(0.045))
                .entryDate(request.getEntryDate())
                .status("ACTIVE")
                .managementType("GROUP")
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        group = livestockGroupRepository.save(group);

        // Update barn status to ACTIVE
        barn.setStatus("ACTIVE");
        barn.setUpdatedAt(Instant.now());
        zoneLocationRepository.save(barn);

        // Record initial weight log
        if (request.getAvgInitialWeightKg() != null) {
            LivestockWeightLog wLog = LivestockWeightLog.builder()
                    .tenantId(tenantId)
                    .farmId(targetFarmId)
                    .targetType("GROUP")
                    .groupId(group.getId())
                    .recordDate(request.getEntryDate())
                    .weightKg(request.getAvgInitialWeightKg())
                    .recordedByUserId(SecurityUtils.getCurrentUserId())
                    .notes("Trọng lượng ban đầu nhập chuồng")
                    .createdAt(Instant.now())
                    .build();
            livestockWeightLogRepository.save(wLog);
        }

        return getBatchById(group.getId());
    }

    @Override
    @Transactional
    public BatchDetailResponse splitBatch(Long batchId, SplitBatchRequest request) {
        LivestockGroup originalGroup = livestockGroupRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lứa nuôi", batchId));

        if (request.getSplitQuantity() >= originalGroup.getCurrentQuantity()) {
            throw new BusinessException("INVALID_SPLIT_QUANTITY", "Số lượng tách đàn (" + request.getSplitQuantity() + ") phải nhỏ hơn sĩ số hiện tại (" + originalGroup.getCurrentQuantity() + ")");
        }

        ZoneLocation targetBarn = zoneLocationRepository.findById(request.getTargetBarnId())
                .orElseThrow(() -> new ResourceNotFoundException("Chuồng đích", request.getTargetBarnId()));

        ProductionZone targetZone = productionZoneRepository.findById(targetBarn.getZoneId())
                .orElseThrow(() -> new ResourceNotFoundException("Khu nuôi của chuồng đích", targetBarn.getZoneId()));

        int remainingQty = originalGroup.getCurrentQuantity() - request.getSplitQuantity();
        originalGroup.setCurrentQuantity(remainingQty);
        livestockGroupRepository.save(originalGroup);

        // Create new batch at target barn
        String splitCode = originalGroup.getGroupCode() + "-T" + (System.currentTimeMillis() % 1000);
        BigDecimal splitRatio = BigDecimal.valueOf(request.getSplitQuantity()).divide(BigDecimal.valueOf(originalGroup.getInitialQuantity()), 4, RoundingMode.HALF_UP);
        BigDecimal splitCost = originalGroup.getTotalCost() != null ? originalGroup.getTotalCost().multiply(splitRatio) : BigDecimal.ZERO;

        LivestockGroup targetGroup = LivestockGroup.builder()
                .tenantId(originalGroup.getTenantId())
                .farmId(originalGroup.getFarmId())
                .branchId(targetZone.getBranchId())
                .zoneId(targetZone.getId())
                .locationId(targetBarn.getId())
                .breedId(originalGroup.getBreedId())
                .partnerId(originalGroup.getPartnerId())
                .groupCode(splitCode)
                .initialQuantity(request.getSplitQuantity())
                .currentQuantity(request.getSplitQuantity())
                .unitPrice(originalGroup.getUnitPrice())
                .totalCost(splitCost)
                .avgInitialWeightKg(originalGroup.getAvgInitialWeightKg())
                .entryDate(originalGroup.getEntryDate())
                .status("ACTIVE")
                .managementType(originalGroup.getManagementType())
                .notes("Tách từ lứa " + originalGroup.getGroupCode() + ". " + (request.getNotes() != null ? request.getNotes() : ""))
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        targetGroup = livestockGroupRepository.save(targetGroup);

        targetBarn.setStatus("ACTIVE");
        targetBarn.setUpdatedAt(Instant.now());
        zoneLocationRepository.save(targetBarn);

        // Record transfer events
        LivestockEvent splitEvent = LivestockEvent.builder()
                .tenantId(originalGroup.getTenantId())
                .farmId(originalGroup.getFarmId())
                .targetType("GROUP")
                .livestockGroupId(originalGroup.getId())
                .eventType("TRANSFER")
                .eventDate(LocalDate.now())
                .withdrawalDays(0)
                .isQuarantined(false)
                .isInventoryBackflushed(false)
                .detailsJson("{\"description\": \"Tách đàn " + request.getSplitQuantity() + " con sang " + targetBarn.getName() + "\"}")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();
        livestockEventRepository.save(splitEvent);

        return getBatchById(originalGroup.getId());
    }

    @Override
    @Transactional
    public BatchDetailResponse closeBatch(Long batchId) {
        LivestockGroup group = livestockGroupRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lứa nuôi", batchId));

        group.setStatus("SOLD");
        group.setCurrentQuantity(0);
        group.setUpdatedAt(Instant.now());
        group.setUpdatedBy(SecurityUtils.getCurrentUserId());
        livestockGroupRepository.save(group);

        // Reset barn status to EMPTY
        if (group.getLocationId() != null) {
            zoneLocationRepository.findById(group.getLocationId()).ifPresent(barn -> {
                barn.setStatus("EMPTY");
                barn.setUpdatedAt(Instant.now());
                zoneLocationRepository.save(barn);
            });
        }

        return getBatchById(group.getId());
    }

    @Override
    @Transactional
    public BatchDetailResponse updateTargets(Long batchId, com.farm.saas.modules.livestock.dto.request.BatchTargetsRequest request) {
        LivestockGroup group = livestockGroupRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lứa nuôi", batchId));
        Map<String, Object> extraMap = getExtraMap(group);
        Map<String, Object> targetsMap = new HashMap<>();
        if (request.getFcrTarget() != null) targetsMap.put("fcrTarget", request.getFcrTarget());
        if (request.getCostPerKgTarget() != null) targetsMap.put("costPerKgTarget", request.getCostPerKgTarget());
        if (request.getMaxMortalityPct() != null) targetsMap.put("maxMortalityPct", request.getMaxMortalityPct());
        if (request.getExpectedHarvestWeightKg() != null) targetsMap.put("expectedHarvestWeightKg", request.getExpectedHarvestWeightKg());
        extraMap.put("targets", targetsMap);
        saveExtraMap(group, extraMap);
        return getBatchById(batchId);
    }

    @Override
    @Transactional
    public BatchDetailResponse addGroup(Long batchId, com.farm.saas.modules.livestock.dto.request.AddBatchGroupRequest request) {
        LivestockGroup group = livestockGroupRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lứa nuôi", batchId));
        Map<String, Object> extraMap = getExtraMap(group);
        List<Map<String, Object>> extraGroups = (List<Map<String, Object>>) extraMap.computeIfAbsent("extraGroups", k -> new ArrayList<>());

        long newId = System.currentTimeMillis();
        String groupCode = "DAN-" + (group.getLocationId() != null ? "C" + group.getLocationId() + "-" : "") + (extraGroups.size() + 2);
        LivestockBreed breed = request.getBreedId() != null ? livestockBreedRepository.findById(request.getBreedId()).orElse(null) : null;
        String breedName = breed != null ? breed.getBreedName() : "Con giống nhập bổ sung";

        int qty = request.getQuantity() != null ? request.getQuantity() : 100;
        BigDecimal avgW = request.getAvgWeightKg() != null ? request.getAvgWeightKg() : BigDecimal.valueOf(0.045);
        BigDecimal cost = request.getCostPrice() != null ? request.getCostPrice() : BigDecimal.valueOf(qty * 15000L);

        Map<String, Object> newGroupMap = new HashMap<>();
        newGroupMap.put("id", newId);
        newGroupMap.put("groupCode", groupCode);
        newGroupMap.put("breedId", request.getBreedId() != null ? request.getBreedId() : group.getBreedId());
        newGroupMap.put("breedName", breedName);
        newGroupMap.put("initialQuantity", qty);
        newGroupMap.put("currentQuantity", qty);
        newGroupMap.put("avgInitialWeightKg", avgW);
        newGroupMap.put("gender", request.getGender() != null ? request.getGender() : "MIXED");
        newGroupMap.put("sourceType", request.getSourceType() != null ? request.getSourceType() : "PURCHASE");
        newGroupMap.put("entryDate", (request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now()).toString());
        newGroupMap.put("weeksOld", 1);
        newGroupMap.put("totalCost", cost);
        extraGroups.add(newGroupMap);

        // Update main group counts
        group.setInitialQuantity(group.getInitialQuantity() + qty);
        group.setCurrentQuantity(group.getCurrentQuantity() + qty);
        if (group.getTotalCost() != null) {
            group.setTotalCost(group.getTotalCost().add(cost));
        }

        saveExtraMap(group, extraMap);
        return getBatchById(batchId);
    }

    @Override
    @Transactional
    public BatchDetailResponse applyProgram(Long batchId, com.farm.saas.modules.livestock.dto.request.ApplyProgramRequest request) {
        LivestockGroup group = livestockGroupRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lứa nuôi", batchId));
        Map<String, Object> extraMap = getExtraMap(group);
        List<Map<String, Object>> applied = (List<Map<String, Object>>) extraMap.computeIfAbsent("appliedPrograms", k -> new ArrayList<>());

        long newId = System.currentTimeMillis();
        Map<String, Object> pMap = new HashMap<>();
        pMap.put("id", newId);
        pMap.put("programId", request.getProgramId());
        pMap.put("programCode", "CT-QUYTRINH-" + request.getProgramId());
        pMap.put("programName", "Quy trình chăn nuôi #" + request.getProgramId());
        pMap.put("programType", "FEED");
        pMap.put("description", "Áp dụng định mức chuẩn từ thiết lập chăn nuôi");
        pMap.put("milestonesCount", 30);
        pMap.put("appliedDate", (request.getStartDate() != null ? request.getStartDate() : LocalDate.now()).toString());
        applied.add(pMap);

        saveExtraMap(group, extraMap);
        return getBatchById(batchId);
    }

    @Override
    @Transactional
    public BatchDetailResponse removeProgram(Long batchId, Long programId) {
        LivestockGroup group = livestockGroupRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lứa nuôi", batchId));
        Map<String, Object> extraMap = getExtraMap(group);
        if (extraMap.containsKey("appliedPrograms")) {
            List<Map<String, Object>> applied = (List<Map<String, Object>>) extraMap.get("appliedPrograms");
            applied.removeIf(p -> {
                Object pid = p.get("programId");
                Object id = p.get("id");
                return (pid != null && pid.toString().equals(programId.toString())) || (id != null && id.toString().equals(programId.toString()));
            });
        }
        saveExtraMap(group, extraMap);
        return getBatchById(batchId);
    }

    @Override
    @Transactional
    public BatchDetailResponse addByProduct(Long batchId, com.farm.saas.modules.livestock.dto.request.AddByProductRequest request) {
        LivestockGroup group = livestockGroupRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lứa nuôi", batchId));
        Map<String, Object> extraMap = getExtraMap(group);
        List<Map<String, Object>> byProducts = (List<Map<String, Object>>) extraMap.computeIfAbsent("byProducts", k -> new ArrayList<>());

        long newId = System.currentTimeMillis();
        BigDecimal total = request.getQuantity().multiply(request.getUnitPrice());
        Map<String, Object> bp = new HashMap<>();
        bp.put("id", newId);
        bp.put("itemCode", "PT-" + (byProducts.size() + 1));
        bp.put("itemName", request.getItemName().trim());
        bp.put("quantity", request.getQuantity());
        bp.put("unit", request.getUnit().trim());
        bp.put("unitPrice", request.getUnitPrice());
        bp.put("totalAmount", total);
        bp.put("receiptDate", (request.getReceiptDate() != null ? request.getReceiptDate() : LocalDate.now()).toString());
        bp.put("notes", request.getNotes() != null ? request.getNotes() : "");
        byProducts.add(bp);

        saveExtraMap(group, extraMap);
        return getBatchById(batchId);
    }

    private Map<String, Object> getExtraMap(LivestockGroup group) {
        if (StringUtils.hasText(group.getNotes())) {
            try {
                return objectMapper.readValue(group.getNotes(), new TypeReference<>() {});
            } catch (Exception ignored) {}
        }
        return new HashMap<>();
    }

    private void saveExtraMap(LivestockGroup group, Map<String, Object> extraMap) {
        try {
            group.setNotes(objectMapper.writeValueAsString(extraMap));
            group.setUpdatedAt(Instant.now());
            livestockGroupRepository.save(group);
        } catch (Exception ignored) {}
    }

    private Long resolveFarmId(Long farmId) {
        if (farmId != null) return farmId;
        Long current = SecurityUtils.getCurrentFarmId();
        return current != null ? current : 1L;
    }

    private ProductionZoneResponse toZoneResponse(ProductionZone z) {
        return ProductionZoneResponse.builder()
                .id(z.getId())
                .farmId(z.getFarmId())
                .code(z.getCode())
                .name(z.getName())
                .zoneType(z.getZoneType())
                .areaM2(z.getAreaM2())
                .soilType(z.getSoilType())
                .waterSource(z.getWaterSource())
                .status(z.getStatus())
                .createdAt(z.getCreatedAt())
                .build();
    }

    private ZoneLocationResponse toLocationResponse(ZoneLocation l) {
        return ZoneLocationResponse.builder()
                .id(l.getId())
                .zoneId(l.getZoneId())
                .code(l.getCode())
                .name(l.getName())
                .description(l.getDescription())
                .status(l.getStatus())
                .areaM2(l.getAreaM2())
                .capacity(l.getCapacity())
                .capacityUnit(l.getCapacityUnit())
                .createdAt(l.getCreatedAt())
                .build();
    }
}
