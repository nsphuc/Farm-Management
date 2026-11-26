package com.farm.saas.modules.livestock.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.InsufficientStockException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.FarmDataRule;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.entity.ZoneLocation;
import com.farm.saas.modules.geography.repository.FarmDataRuleRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryTransactionRepository;
import com.farm.saas.modules.livestock.dto.request.CreateDailyLogRequest;
import com.farm.saas.modules.livestock.dto.response.DailyLogRemindersResponse;
import com.farm.saas.modules.livestock.dto.response.DailyLogResponse;
import com.farm.saas.modules.livestock.entity.LivestockEvent;
import com.farm.saas.modules.livestock.entity.LivestockEventSupply;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.entity.LivestockWeightLog;
import com.farm.saas.modules.livestock.repository.LivestockEventRepository;
import com.farm.saas.modules.livestock.repository.LivestockEventSupplyRepository;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.livestock.repository.LivestockWeightLogRepository;
import com.farm.saas.modules.livestock.service.DailyLogService;
import com.farm.saas.modules.masterdata.entity.ConsumptionQuota;
import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.MaterialUnitConversion;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.ConsumptionQuotaRepository;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.MaterialUnitConversionRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
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
public class DailyLogServiceImpl implements DailyLogService {

    private final LivestockEventRepository livestockEventRepository;
    private final LivestockEventSupplyRepository livestockEventSupplyRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final LivestockBreedRepository livestockBreedRepository;
    private final LivestockWeightLogRepository livestockWeightLogRepository;
    private final ConsumptionQuotaRepository consumptionQuotaRepository;
    private final ZoneLocationRepository zoneLocationRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final MaterialRepository materialRepository;
    private final MaterialUnitConversionRepository materialUnitConversionRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseInventoryTransactionRepository warehouseInventoryTransactionRepository;
    private final FarmDataRuleRepository farmDataRuleRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public DailyLogRemindersResponse getReminders(Long farmId, Long barnId, Long batchId) {
        Long targetFarmId = resolveFarmId(farmId);
        LivestockGroup group = null;

        if (batchId != null) {
            group = livestockGroupRepository.findById(batchId).orElse(null);
        } else if (barnId != null) {
            var activeGroups = livestockGroupRepository.findByLocationIdAndStatus(barnId, "ACTIVE");
            if (!activeGroups.isEmpty()) group = activeGroups.get(0);
        }

        if (group == null) {
            return DailyLogRemindersResponse.builder()
                    .barnId(barnId)
                    .batchId(null)
                    .daysOld(0)
                    .currentQuantity(0)
                    .vaccineAlerts(Collections.emptyList())
                    .build();
        }

        ZoneLocation barn = group.getLocationId() != null ? zoneLocationRepository.findById(group.getLocationId()).orElse(null) : null;
        LivestockBreed breed = livestockBreedRepository.findById(group.getBreedId()).orElse(null);

        LocalDate today = LocalDate.now();
        int daysOld = (int) Math.max(1, ChronoUnit.DAYS.between(group.getEntryDate(), today));
        int currentQty = group.getCurrentQuantity() != null ? group.getCurrentQuantity() : 0;

        // Fetch quotas for breed
        List<ConsumptionQuota> allQuotas = group.getBreedId() != null
                ? consumptionQuotaRepository.findByLivestockBreedId(group.getBreedId())
                : Collections.emptyList();
        if (allQuotas.isEmpty()) {
            allQuotas = consumptionQuotaRepository.findAll();
        }

        // 1. Recommended feed quota - matches exact day or closest stage
        ConsumptionQuota matchedFeed = findMatchingFeedQuota(allQuotas, daysOld);

        DailyLogRemindersResponse.RecommendedFeedQuota feedQuota;
        if (matchedFeed != null) {
            BigDecimal perHeadG = matchedFeed.getFeedAmountG() != null ? matchedFeed.getFeedAmountG() : matchedFeed.getStandardQuantity();
            if (perHeadG == null || perHeadG.compareTo(BigDecimal.ZERO) <= 0) {
                perHeadG = BigDecimal.valueOf(50);
            } else if (perHeadG.compareTo(BigDecimal.ONE) < 0) {
                // Nếu định mức lưu theo đơn vị kg/con (VD: 0.015 hoặc 0.15 kg/con) thì quy đổi về gram/con
                perHeadG = perHeadG.multiply(BigDecimal.valueOf(1000));
            }
            BigDecimal totalKg = perHeadG.multiply(BigDecimal.valueOf(currentQty)).divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
            feedQuota = DailyLogRemindersResponse.RecommendedFeedQuota.builder()
                    .stage(matchedFeed.getStage() != null ? matchedFeed.getStage() : "Giai đoạn Ngày " + daysOld)
                    .feedType(matchedFeed.getFeedType() != null ? matchedFeed.getFeedType() : "Cám tiêu chuẩn giai đoạn " + daysOld + " ngày tuổi")
                    .perHeadGrams(perHeadG)
                    .totalFlockKg(totalKg)
                    .standardWeightKg(matchedFeed.getStandardWeightKg() != null ? matchedFeed.getStandardWeightKg() : BigDecimal.valueOf(0.5))
                    .build();
        } else {
            BigDecimal perHeadG;
            BigDecimal defaultWeight;
            if (daysOld <= 7) {
                perHeadG = BigDecimal.valueOf(20 + daysOld * 2L);
                defaultWeight = BigDecimal.valueOf(0.1 + daysOld * 0.02);
            } else if (daysOld <= 21) {
                perHeadG = BigDecimal.valueOf(35 + (daysOld - 7) * 3L);
                defaultWeight = BigDecimal.valueOf(0.25 + (daysOld - 7) * 0.05);
            } else if (daysOld <= 45) {
                perHeadG = BigDecimal.valueOf(75 + (daysOld - 21) * 3L);
                defaultWeight = BigDecimal.valueOf(0.9 + (daysOld - 21) * 0.06);
            } else {
                perHeadG = BigDecimal.valueOf(150);
                defaultWeight = BigDecimal.valueOf(2.5);
            }
            BigDecimal totalKg = perHeadG.multiply(BigDecimal.valueOf(currentQty)).divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);

            String stage = daysOld <= 14 ? "Úm" : (daysOld <= 35 ? "Tăng trưởng" : "Vỗ béo / Xuất chuồng");
            String feedType = daysOld <= 14 ? "Cám giai đoạn Úm (0-14 ngày)" : (daysOld <= 35 ? "Cám hỗn hợp tăng trưởng" : "Cám vỗ béo xuất chuồng");

            feedQuota = DailyLogRemindersResponse.RecommendedFeedQuota.builder()
                    .stage(stage)
                    .feedType(feedType)
                    .perHeadGrams(perHeadG)
                    .totalFlockKg(totalKg)
                    .standardWeightKg(defaultWeight.setScale(2, RoundingMode.HALF_UP))
                    .build();
        }

        // 2. Vaccine alerts
        List<DailyLogRemindersResponse.VaccineReminderItem> vaccineAlerts = allQuotas.stream()
                .filter(q -> "VACCINE".equalsIgnoreCase(q.getQuotaType()) || StringUtils.hasText(q.getVaccineName()))
                .filter(q -> q.getDayAgeFrom() != null && Math.abs(q.getDayAgeFrom() - daysOld) <= 2)
                .map(q -> DailyLogRemindersResponse.VaccineReminderItem.builder()
                        .quotaId(q.getId())
                        .dayAge(q.getDayAgeFrom())
                        .vaccineName(q.getVaccineName())
                        .dose(q.getDose())
                        .route(q.getRoute())
                        .notes(q.getNotes())
                        .isToday(Objects.equals(q.getDayAgeFrom(), daysOld))
                        .build())
                .collect(Collectors.toList());

        return DailyLogRemindersResponse.builder()
                .batchId(group.getId())
                .batchCode(group.getGroupCode())
                .barnId(barn != null ? barn.getId() : null)
                .barnName(barn != null ? barn.getName() : "Chuồng")
                .breedId(group.getBreedId())
                .breedName(breed != null ? breed.getBreedName() : "Giống tiêu chuẩn")
                .daysOld(daysOld)
                .currentQuantity(currentQty)
                .feedQuota(feedQuota)
                .vaccineAlerts(vaccineAlerts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyLogResponse> getDailyLogs(Long farmId, LocalDate date, Long barnId, Long batchId) {
        Long targetFarmId = resolveFarmId(farmId);
        LocalDate targetDate = date != null ? date : LocalDate.now();

        List<LivestockEvent> events;
        if (batchId != null) {
            events = livestockEventRepository.findByLivestockGroupId(batchId).stream()
                    .filter(e -> targetDate.equals(e.getEventDate()))
                    .collect(Collectors.toList());
        } else {
            events = livestockEventRepository.findByFarmIdAndEventDate(targetFarmId, targetDate);
        }

        Map<Long, String> userNames = new HashMap<>();
        Map<Long, LivestockGroup> groupMap = new HashMap<>();
        Map<Long, ZoneLocation> barnMap = new HashMap<>();

        Long currentBranchId = SecurityUtils.getCurrentBranchId();
        List<DailyLogResponse> responses = new ArrayList<>();
        for (LivestockEvent e : events) {
            LivestockGroup group = null;
            if (e.getLivestockGroupId() != null) {
                group = groupMap.computeIfAbsent(e.getLivestockGroupId(), id -> livestockGroupRepository.findById(id).orElse(null));
            }

            // Cô lập nhật ký theo chi nhánh
            if (batchId == null && currentBranchId != null) {
                if (group != null && group.getBranchId() != null && !currentBranchId.equals(group.getBranchId())) {
                    continue;
                }
            }

            ZoneLocation barn = null;
            if (group != null && group.getLocationId() != null) {
                barn = barnMap.computeIfAbsent(group.getLocationId(), id -> zoneLocationRepository.findById(id).orElse(null));
            }

            if (barnId != null && (barn == null || !barnId.equals(barn.getId()))) {
                continue;
            }

            String authorName = "Nhân viên";
            if (e.getCreatedBy() != null) {
                authorName = userNames.computeIfAbsent(e.getCreatedBy(), id -> userRepository.findById(id).map(User::getFullName).orElse("Nhân viên"));
            }

            String desc = e.getEventType();
            boolean isAlert = Boolean.TRUE.equals(e.getIsQuarantined());
            String alertReason = null;

            if (StringUtils.hasText(e.getDetailsJson())) {
                try {
                    Map<String, Object> details = objectMapper.readValue(e.getDetailsJson(), new TypeReference<>() {});
                    if (details.containsKey("description")) desc = details.get("description").toString();
                    if (details.containsKey("isAlert")) isAlert = Boolean.TRUE.equals(details.get("isAlert"));
                    if (details.containsKey("alertReason")) alertReason = details.get("alertReason").toString();
                } catch (Exception ignored) {}
            }

            responses.add(DailyLogResponse.builder()
                    .id(e.getId())
                    .farmId(e.getFarmId())
                    .barnId(barn != null ? barn.getId() : null)
                    .barnName(barn != null ? barn.getName() : "Chuồng")
                    .batchId(group != null ? group.getId() : null)
                    .batchCode(group != null ? group.getGroupCode() : null)
                    .logDate(e.getEventDate())
                    .entryType(e.getEventType())
                    .description(desc)
                    .detailsJson(e.getDetailsJson())
                    .isAlert(isAlert)
                    .alertReason(alertReason)
                    .createdAt(e.getCreatedAt())
                    .createdByFullName(authorName)
                    .build());
        }

        return responses;
    }

    @Override
    @Transactional
    public DailyLogResponse createDailyLog(CreateDailyLogRequest request) {
        Long targetFarmId = resolveFarmId(request.getFarmId());
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Find target batch
        LivestockGroup group = null;
        if (request.getBatchId() != null) {
            group = livestockGroupRepository.findById(request.getBatchId()).orElse(null);
        } else if (request.getBarnId() != null) {
            var activeGroups = livestockGroupRepository.findByLocationIdAndStatus(request.getBarnId(), "ACTIVE");
            if (!activeGroups.isEmpty()) group = activeGroups.get(0);
        }

        if (group == null) {
            throw new BusinessException("BATCH_NOT_FOUND", "Không tìm thấy lứa nuôi đang hoạt động tại chuồng #" + request.getBarnId());
        }

        ZoneLocation barn = group.getLocationId() != null ? zoneLocationRepository.findById(group.getLocationId()).orElse(null) : null;
        LivestockBreed breed = livestockBreedRepository.findById(group.getBreedId()).orElse(null);

        Map<String, Object> detailsMap = new HashMap<>();
        boolean isAlert = false;
        String alertReason = null;
        String description = "";

        // 2. Handle Entry Types
        String entryType = request.getEntryType();
        List<LivestockEventSupply> consumedSupplies = new ArrayList<>();

        if ("FEED".equalsIgnoreCase(entryType)) {
            BigDecimal feedAmount = request.getFeedAmount() != null ? request.getFeedAmount() : BigDecimal.ZERO;
            if (feedAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("INVALID_FEED_AMOUNT", "Số lượng cám cho ăn phải lớn hơn 0");
            }
            String unit = StringUtils.hasText(request.getFeedUnit()) ? request.getFeedUnit().trim().toUpperCase() : "BAG";

            Material material = materialRepository.findById(request.getFeedMaterialId() != null ? request.getFeedMaterialId() : 1L)
                    .orElseThrow(() -> new ResourceNotFoundException("Vật tư cám", request.getFeedMaterialId()));

            // Xác định trọng lượng 1 bao (kg/bao) từ bảng quy đổi nếu có, mặc định 25 kg/bao
            BigDecimal kgPerBag = materialUnitConversionRepository.findByMaterialId(material.getId()).stream()
                    .filter(c -> c.getConversionFactor() != null && c.getConversionFactor().compareTo(BigDecimal.ONE) > 0)
                    .map(MaterialUnitConversion::getConversionFactor)
                    .findFirst()
                    .orElse(BigDecimal.valueOf(25));

            boolean isInputBag = "BAG".equalsIgnoreCase(unit) || "BAO".equalsIgnoreCase(unit);
            BigDecimal feedKg = isInputBag ? feedAmount.multiply(kgPerBag) : feedAmount;

            // Quy đổi số lượng cần trừ theo đúng standardUnit lưu trong warehouse_inventory (Bao hoặc Kg)
            String stdUnit = material.getStandardUnit() != null ? material.getStandardUnit().trim().toUpperCase() : "KG";
            boolean isStdBag = "BAG".equalsIgnoreCase(stdUnit) || "BAO".equalsIgnoreCase(stdUnit);
            BigDecimal qtyToDeduct;
            if (isStdBag) {
                qtyToDeduct = isInputBag ? feedAmount : feedAmount.divide(kgPerBag, 2, RoundingMode.HALF_UP);
            } else {
                qtyToDeduct = feedKg;
            }

            // Auto-resolve feed warehouse by zone (Kho Cám theo Khu nuôi) if not specified
            Long feedWhId = request.getFeedWarehouseId();
            if (feedWhId == null) {
                if (barn != null && barn.getZoneId() != null) {
                    Optional<Warehouse> zoneFeedWh = warehouseRepository.findFirstByFarmIdAndZoneIdAndWarehouseType(targetFarmId, barn.getZoneId(), "FEED");
                    if (zoneFeedWh.isPresent()) {
                        feedWhId = zoneFeedWh.get().getId();
                    }
                }
                if (feedWhId == null && group.getBranchId() != null) {
                    List<Warehouse> branchFeedWhs = warehouseRepository.findByFarmIdAndBranchIdAndWarehouseType(targetFarmId, group.getBranchId(), "FEED");
                    if (!branchFeedWhs.isEmpty()) {
                        feedWhId = branchFeedWhs.get(0).getId();
                    }
                }
            }

            // Deduct stock using FEFO
            consumedSupplies.addAll(deductInventoryFefo(tenantId, targetFarmId, currentUserId, material, feedWhId, qtyToDeduct));

            description = "Cho ăn " + feedAmount.stripTrailingZeros().toPlainString() + " " + (isInputBag ? "bao" : "kg")
                    + " (" + feedKg.stripTrailingZeros().toPlainString() + " kg - " + material.getName() + ")";
            detailsMap.put("feed_amount", feedAmount);
            detailsMap.put("feed_unit", unit);
            detailsMap.put("feed_kg", feedKg);
            detailsMap.put("material_id", material.getId());
            detailsMap.put("material_name", material.getName());

            // Check feed quota alert (> 10% standard)
            int daysOld = (int) Math.max(1, ChronoUnit.DAYS.between(group.getEntryDate(), request.getLogDate()));
            int currentQty = Math.max(1, group.getCurrentQuantity() != null ? group.getCurrentQuantity() : 1);
            BigDecimal perHeadG = feedKg.multiply(BigDecimal.valueOf(1000)).divide(BigDecimal.valueOf(currentQty), 1, RoundingMode.HALF_UP);

            List<ConsumptionQuota> allQuotas = group.getBreedId() != null
                    ? consumptionQuotaRepository.findByLivestockBreedId(group.getBreedId())
                    : Collections.emptyList();
            if (allQuotas.isEmpty()) {
                allQuotas = consumptionQuotaRepository.findAll();
            }
            ConsumptionQuota quota = findMatchingFeedQuota(allQuotas, daysOld);

            if (quota != null && quota.getFeedAmountG() != null && quota.getFeedAmountG().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal upperLimit = quota.getFeedAmountG().multiply(BigDecimal.valueOf(1.10));
                if (perHeadG.compareTo(upperLimit) > 0) {
                    isAlert = true;
                    alertReason = String.format("Lượng cám ăn thực tế (%.1f g/con) vượt quá 10%% so với định mức chuẩn (%.1f g/con)", perHeadG, quota.getFeedAmountG());
                }
            }

        } else if ("MEDICINE".equalsIgnoreCase(entryType)) {
            BigDecimal medAmount = request.getMedAmount() != null ? request.getMedAmount() : BigDecimal.ONE;
            if (medAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("INVALID_MED_AMOUNT", "Số lượng thuốc/vắc-xin sử dụng phải lớn hơn 0");
            }
            Material material = materialRepository.findById(request.getMedMaterialId() != null ? request.getMedMaterialId() : 4L)
                    .orElseThrow(() -> new ResourceNotFoundException("Thuốc / Vắc-xin", request.getMedMaterialId()));

            // Auto-resolve shared medicine/vaccine warehouse if not specified
            Long medWhId = request.getMedWarehouseId();
            if (medWhId == null && group.getBranchId() != null) {
                List<Warehouse> branchMedWhs = warehouseRepository.findByFarmIdAndBranchIdAndWarehouseType(targetFarmId, group.getBranchId(), "MEDICINE");
                if (branchMedWhs.isEmpty()) {
                    branchMedWhs = warehouseRepository.findByFarmIdAndBranchIdAndWarehouseType(targetFarmId, group.getBranchId(), "VACCINE");
                }
                if (!branchMedWhs.isEmpty()) {
                    medWhId = branchMedWhs.get(0).getId();
                }
            }

            // Deduct stock using FEFO
            consumedSupplies.addAll(deductInventoryFefo(tenantId, targetFarmId, currentUserId, material, medWhId, medAmount));

            description = "Dùng thuốc/vắc-xin: " + material.getName() + " (" + medAmount + " " + request.getMedUnit() + ") - " + request.getAdminRoute();
            detailsMap.put("medicine_name", material.getName());
            detailsMap.put("amount", medAmount);
            detailsMap.put("unit", request.getMedUnit());
            detailsMap.put("disease_reason", request.getDiseaseReason());
            detailsMap.put("admin_route", request.getAdminRoute());

        } else if ("MORTALITY".equalsIgnoreCase(entryType)) {
            int dead = request.getDeadCount() != null ? request.getDeadCount() : 0;
            int cull = request.getCullCount() != null ? request.getCullCount() : 0;
            if (dead < 0 || cull < 0 || (dead + cull) <= 0) {
                throw new BusinessException("INVALID_MORTALITY_COUNT", "Số lượng con chết và loại thải phải lớn hơn 0");
            }
            int totalOut = dead + cull;
            int curQty = group.getCurrentQuantity() != null ? group.getCurrentQuantity() : 0;
            if (totalOut > curQty) {
                throw new BusinessException("MORTALITY_EXCEEDS_STOCK",
                        String.format("Tổng số con chết & loại thải (%d con) vượt quá sĩ số hiện tại của chuồng (%d con)", totalOut, curQty));
            }

            group.setCurrentQuantity(curQty - totalOut);
            livestockGroupRepository.save(group);

            description = "Báo chết: " + dead + " con, loại thải: " + cull + " con (" + request.getMortalityReason() + ")";
            detailsMap.put("dead_count", dead);
            detailsMap.put("cull_count", cull);
            detailsMap.put("mortality_reason", request.getMortalityReason());
            detailsMap.put("dead_avg_weight_kg", request.getDeadAvgWeightKg());
            detailsMap.put("mortality_notes", request.getMortalityNotes());

            if (dead >= 10 || cull >= 15) {
                isAlert = true;
                alertReason = "Tỷ lệ chết/loại thải trong ngày bất thường (" + totalOut + " con - " + request.getMortalityReason() + ")";
            }

        } else if ("SAMPLE_ENV".equalsIgnoreCase(entryType)) {
            description = "Cân mẫu " + request.getSampleCount() + " con (BQ: " + request.getSampleAvgWeightKg() + " kg/con)";
            if (request.getTemperatureC() != null) {
                description += " | Nhiệt độ: " + request.getTemperatureC() + "°C, Độ ẩm: " + request.getHumidityPct() + "%";
            }

            detailsMap.put("sample_count", request.getSampleCount());
            detailsMap.put("sample_avg_weight", request.getSampleAvgWeightKg());
            detailsMap.put("temperature_c", request.getTemperatureC());
            detailsMap.put("humidity_pct", request.getHumidityPct());
            detailsMap.put("nh3_ppm", request.getNh3Ppm());
            detailsMap.put("co2_ppm", request.getCo2Ppm());

            // Save weight log
            if (request.getSampleAvgWeightKg() != null && request.getSampleAvgWeightKg().compareTo(BigDecimal.ZERO) > 0) {
                LivestockWeightLog wLog = LivestockWeightLog.builder()
                        .tenantId(tenantId)
                        .farmId(targetFarmId)
                        .targetType("GROUP")
                        .groupId(group.getId())
                        .recordDate(request.getLogDate())
                        .weightKg(request.getSampleAvgWeightKg())
                        .recordedByUserId(currentUserId)
                        .notes("Cân mẫu định kỳ " + request.getSampleCount() + " con")
                        .createdAt(Instant.now())
                        .build();
                livestockWeightLogRepository.save(wLog);
            }

            // Check environmental min-max alert
            if (request.getTemperatureC() != null) {
                if (request.getTemperatureC().compareTo(BigDecimal.valueOf(24.0)) < 0 || request.getTemperatureC().compareTo(BigDecimal.valueOf(32.5)) > 0) {
                    isAlert = true;
                    alertReason = "Nhiệt độ chuồng (" + request.getTemperatureC() + "°C) nằm ngoài ngưỡng an toàn (24.0 - 32.5°C)";
                }
            }
            if (request.getHumidityPct() != null) {
                if (request.getHumidityPct().compareTo(BigDecimal.valueOf(55.0)) < 0 || request.getHumidityPct().compareTo(BigDecimal.valueOf(75.0)) > 0) {
                    isAlert = true;
                    alertReason = (alertReason != null ? alertReason + "; " : "") + "Độ ẩm chuồng (" + request.getHumidityPct() + "%) nằm ngoài ngưỡng (55 - 75%)";
                }
            }
        }

        detailsMap.put("description", description);
        detailsMap.put("isAlert", isAlert);
        if (alertReason != null) detailsMap.put("alertReason", alertReason);

        String detailsJson = "{}";
        try {
            detailsJson = objectMapper.writeValueAsString(detailsMap);
        } catch (Exception ignored) {}

        // 3. Save LivestockEvent
        LivestockEvent event = LivestockEvent.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
                .targetType("GROUP")
                .livestockGroupId(group.getId())
                .eventType(entryType.toUpperCase())
                .eventDate(request.getLogDate())
                .withdrawalDays(0)
                .isQuarantined(isAlert)
                .isInventoryBackflushed(true)
                .detailsJson(detailsJson)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        event = livestockEventRepository.save(event);

        // Save consumed supplies linked to this event (for real cost breakdown & rollback on delete)
        if (!consumedSupplies.isEmpty()) {
            Long eventId = event.getId();
            for (LivestockEventSupply s : consumedSupplies) {
                s.setLivestockEventId(eventId);
            }
            livestockEventSupplyRepository.saveAll(consumedSupplies);
        }

        String authorName = userRepository.findById(currentUserId).map(User::getFullName).orElse("Nhân viên");

        return DailyLogResponse.builder()
                .id(event.getId())
                .farmId(targetFarmId)
                .barnId(barn != null ? barn.getId() : null)
                .barnName(barn != null ? barn.getName() : "Chuồng")
                .batchId(group.getId())
                .batchCode(group.getGroupCode())
                .logDate(event.getEventDate())
                .entryType(event.getEventType())
                .description(description)
                .detailsJson(event.getDetailsJson())
                .isAlert(isAlert)
                .alertReason(alertReason)
                .createdAt(event.getCreatedAt())
                .createdByFullName(authorName)
                .build();
    }

    @Override
    @Transactional
    public DailyLogResponse updateDailyLog(Long id, CreateDailyLogRequest request) {
        checkManagerPermission();
        LivestockEvent event = livestockEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu nhật ký", id));

        // Delete old event and re-create updated
        livestockEventRepository.delete(event);
        return createDailyLog(request);
    }

    @Override
    @Transactional
    public void deleteDailyLog(Long id) {
        checkManagerPermission();
        LivestockEvent event = livestockEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu nhật ký", id));

        // Restore inventory if supplies were consumed
        List<LivestockEventSupply> supplies = livestockEventSupplyRepository.findByLivestockEventId(id);
        for (LivestockEventSupply supply : supplies) {
            warehouseInventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(
                    supply.getWarehouseId(), supply.getMaterialId(), supply.getBatchNumber()
            ).ifPresent(inv -> {
                inv.setQuantityOnHand(inv.getQuantityOnHand().add(supply.getActualQuantity()));
                warehouseInventoryRepository.save(inv);
            });
        }
        livestockEventSupplyRepository.deleteAll(supplies);

        // Hoàn lại sĩ số đàn nếu xóa phiếu báo chết / loại thải (MORTALITY)
        if ("MORTALITY".equalsIgnoreCase(event.getEventType())
                && event.getLivestockGroupId() != null
                && StringUtils.hasText(event.getDetailsJson())) {
            try {
                Map<String, Object> details = objectMapper.readValue(event.getDetailsJson(), new TypeReference<>() {});
                int dead = details.get("dead_count") instanceof Number ? ((Number) details.get("dead_count")).intValue() : 0;
                int cull = details.get("cull_count") instanceof Number ? ((Number) details.get("cull_count")).intValue() : 0;
                int restoreQty = Math.max(0, dead + cull);
                if (restoreQty > 0) {
                    livestockGroupRepository.findById(event.getLivestockGroupId()).ifPresent(g -> {
                        int cur = g.getCurrentQuantity() != null ? g.getCurrentQuantity() : 0;
                        g.setCurrentQuantity(cur + restoreQty);
                        livestockGroupRepository.save(g);
                    });
                }
            } catch (Exception ignored) {}
        }

        livestockEventRepository.delete(event);
    }

    private List<LivestockEventSupply> deductInventoryFefo(Long tenantId, Long farmId, Long currentUserId, Material material, Long preferredWarehouseId, BigDecimal neededQty) {
        List<LivestockEventSupply> supplies = new ArrayList<>();
        if (neededQty == null || neededQty.compareTo(BigDecimal.ZERO) <= 0) return supplies;

        List<WarehouseInventory> lots;
        if (preferredWarehouseId != null) {
            lots = warehouseInventoryRepository.findFefoAvailableLots(farmId, preferredWarehouseId, material.getId());
        } else {
            lots = warehouseInventoryRepository.findFefoAvailableLotsByFarmAndMaterial(farmId, material.getId());
            Long currentBranchId = SecurityUtils.getCurrentBranchId();
            if (currentBranchId != null) {
                List<Long> branchWhIds = warehouseRepository.findByFarmIdAndBranchId(farmId, currentBranchId)
                        .stream().map(Warehouse::getId).collect(Collectors.toList());
                if (!branchWhIds.isEmpty()) {
                    lots = lots.stream().filter(l -> branchWhIds.contains(l.getWarehouseId())).collect(Collectors.toList());
                }
            }
        }

        BigDecimal totalAvailable = lots.stream()
                .map(inv -> inv.getQuantityOnHand().subtract(inv.getReservedQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAvailable.compareTo(neededQty) < 0) {
            throw new InsufficientStockException(
                    String.format("Kho không đủ số lượng tồn khả dụng cho vật tư '%s'. Cần: %,.2f %s, Tồn khả dụng: %,.2f %s",
                            material.getName(), neededQty, material.getStandardUnit(), totalAvailable, material.getStandardUnit()));
        }

        BigDecimal remainingToDeduct = neededQty;
        for (WarehouseInventory inv : lots) {
            if (remainingToDeduct.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal lotAvail = inv.getQuantityOnHand().subtract(inv.getReservedQuantity());
            if (lotAvail.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal deduct = lotAvail.min(remainingToDeduct);
            BigDecimal balanceBefore = inv.getQuantityOnHand();
            BigDecimal balanceAfter = balanceBefore.subtract(deduct);

            inv.setQuantityOnHand(balanceAfter);
            inv.setUpdatedAt(Instant.now());
            warehouseInventoryRepository.save(inv);

            // Record transaction thẻ kho
            BigDecimal unitPrice = inv.getUnitCost() != null ? inv.getUnitCost() : BigDecimal.ZERO;
            BigDecimal lineTotal = deduct.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            WarehouseInventoryTransaction trans = WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .warehouseId(inv.getWarehouseId())
                    .materialId(material.getId())
                    .batchNumber(inv.getBatchNumber())
                    .transactionType("DAILY_LOG_CONSUMPTION")
                    .referenceDocType("LIVESTOCK_EVENT")
                    .referenceDocId(0L)
                    .referenceItemId(0L)
                    .direction("OUT")
                    .quantity(deduct)
                    .unitPrice(unitPrice)
                    .totalAmount(lineTotal)
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(LocalDate.now())
                    .notes("Xuất kho tự động phục vụ ghi nhật ký chăn nuôi (" + material.getName() + ")")
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            warehouseInventoryTransactionRepository.save(trans);

            supplies.add(LivestockEventSupply.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .materialId(material.getId())
                    .warehouseId(inv.getWarehouseId())
                    .batchNumber(inv.getBatchNumber())
                    .actualQuantity(deduct)
                    .unit(material.getStandardUnit() != null ? material.getStandardUnit() : "KG")
                    .unitPrice(unitPrice)
                    .totalPrice(lineTotal)
                    .notes("Trừ kho FEFO nhật ký chăn nuôi")
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build());

            remainingToDeduct = remainingToDeduct.subtract(deduct);
        }
        return supplies;
    }

    private ConsumptionQuota findMatchingFeedQuota(List<ConsumptionQuota> allQuotas, int daysOld) {
        if (allQuotas == null || allQuotas.isEmpty()) {
            return null;
        }

        List<ConsumptionQuota> feedQuotas = allQuotas.stream()
                .filter(q -> !"VACCINE".equalsIgnoreCase(q.getQuotaType()) && !StringUtils.hasText(q.getVaccineName()))
                .filter(q -> (q.getFeedAmountG() != null && q.getFeedAmountG().compareTo(BigDecimal.ZERO) > 0)
                        || (q.getStandardQuantity() != null && q.getStandardQuantity().compareTo(BigDecimal.ZERO) > 0))
                .toList();

        if (feedQuotas.isEmpty()) {
            return null;
        }

        return feedQuotas.stream()
                .filter(q -> {
                    int from = q.getDayAgeFrom() != null ? q.getDayAgeFrom() : 1;
                    int to = q.getDayAgeTo() != null ? q.getDayAgeTo() : from;
                    return daysOld >= from && daysOld <= to;
                })
                .findFirst()
                .orElseGet(() -> feedQuotas.stream()
                        .min(Comparator.comparingInt(q -> {
                            int from = q.getDayAgeFrom() != null ? q.getDayAgeFrom() : 1;
                            int to = q.getDayAgeTo() != null ? q.getDayAgeTo() : from;
                            if (daysOld < from) {
                                return from - daysOld;
                            } else if (daysOld > to) {
                                return daysOld - to;
                            } else {
                                return 0;
                            }
                        }))
                        .orElse(null));
    }

    private void checkManagerPermission() {
        if (SecurityUtils.hasRole("ROLE_BARN_WORKER")
                && !SecurityUtils.hasRole("ROLE_FARM_OWNER")
                && !SecurityUtils.hasRole("ROLE_FARM_MANAGER")
                && !SecurityUtils.hasRole("ROLE_SUPER_ADMIN")
                && !SecurityUtils.hasAuthority("daily_logs.manage")) {
            throw new BusinessException("FORBIDDEN", "Công nhân chuồng trại không được phép sửa hoặc xóa phiếu nhật ký cũ");
        }
    }

    private Long resolveFarmId(Long farmId) {
        if (farmId != null) return farmId;
        Long current = SecurityUtils.getCurrentFarmId();
        return current != null ? current : 1L;
    }
}
