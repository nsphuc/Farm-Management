package com.farm.saas.modules.livestock.service.impl;

import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.geography.entity.FarmDataRule;
import com.farm.saas.modules.geography.repository.FarmDataRuleRepository;
import com.farm.saas.modules.livestock.dto.request.*;
import com.farm.saas.modules.livestock.dto.response.ProgramDetailResponse;
import com.farm.saas.modules.livestock.service.LivestockSettingsService;
import com.farm.saas.modules.masterdata.entity.ConsumptionQuota;
import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import com.farm.saas.modules.masterdata.repository.ConsumptionQuotaRepository;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LivestockSettingsServiceImpl implements LivestockSettingsService {

    private final LivestockBreedRepository livestockBreedRepository;
    private final ConsumptionQuotaRepository consumptionQuotaRepository;
    private final FarmDataRuleRepository farmDataRuleRepository;
    private final com.farm.saas.modules.livestock.repository.LivestockGroupRepository livestockGroupRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProgramDetailResponse> getPrograms(Long farmId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<LivestockBreed> breeds;
        if (tenantId != null) {
            breeds = livestockBreedRepository.findByTenantId(tenantId);
        } else {
            breeds = livestockBreedRepository.findAll();
        }

        return breeds.stream()
                .map(b -> mapToProgramDetail(b, farmId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProgramDetailResponse getProgramById(Long id) {
        LivestockBreed breed = livestockBreedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chương trình nuôi", id));
        return mapToProgramDetail(breed, null);
    }

    @Override
    @Transactional
    public ProgramDetailResponse createProgram(Long farmId, CreateProgramRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null) tenantId = 1L;
        Long currentUserId = SecurityUtils.getCurrentUserId();

        LivestockBreed breed = LivestockBreed.builder()
                .tenantId(tenantId)
                .species(request.getSpecies() != null ? request.getSpecies() : "POULTRY")
                .breedName(request.getName())
                .standardGrowthDays(request.getTotalDays())
                .targetWeightKg(request.getTargetWeightKg())
                .fcrTarget(request.getFcrTarget())
                .adgTarget(request.getAdgTarget())
                .description(request.getDescription())
                .managementType("GROUP")
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        breed = livestockBreedRepository.save(breed);
        return mapToProgramDetail(breed, farmId);
    }

    @Override
    @Transactional
    public ProgramDetailResponse updateProgram(Long id, CreateProgramRequest request) {
        LivestockBreed breed = livestockBreedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chương trình nuôi", id));

        if (StringUtils.hasText(request.getName())) {
            breed.setBreedName(request.getName());
        }
        if (StringUtils.hasText(request.getSpecies())) {
            breed.setSpecies(request.getSpecies());
        }
        if (request.getTotalDays() != null) {
            breed.setStandardGrowthDays(request.getTotalDays());
        }
        if (request.getTargetWeightKg() != null) {
            breed.setTargetWeightKg(request.getTargetWeightKg());
        }
        if (request.getFcrTarget() != null) {
            breed.setFcrTarget(request.getFcrTarget());
        }
        if (request.getAdgTarget() != null) {
            breed.setAdgTarget(request.getAdgTarget());
        }
        if (request.getDescription() != null) {
            breed.setDescription(request.getDescription());
        }
        breed.setUpdatedAt(Instant.now());
        breed.setUpdatedBy(SecurityUtils.getCurrentUserId());

        breed = livestockBreedRepository.save(breed);
        return mapToProgramDetail(breed, null);
    }

    @Override
    @Transactional
    public void deleteProgram(Long id) {
        LivestockBreed breed = livestockBreedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chương trình nuôi", id));

        if (livestockGroupRepository.existsByBreedId(id)) {
            throw new IllegalArgumentException("Không thể xóa quy trình nuôi đang được gắn với các lứa nuôi trong hệ thống.");
        }

        List<ConsumptionQuota> quotas = consumptionQuotaRepository.findByLivestockBreedId(id);
        consumptionQuotaRepository.deleteAll(quotas);
        livestockBreedRepository.delete(breed);
    }

    @Override
    @Transactional
    public ProgramDetailResponse.FeedStandardItem addFeedStandard(Long programId, FeedStandardRequest request) {
        LivestockBreed breed = livestockBreedRepository.findById(programId)
                .orElseThrow(() -> new ResourceNotFoundException("Chương trình nuôi", programId));

        Long tenantId = breed.getTenantId();
        Long farmId = SecurityUtils.getCurrentFarmId() != null ? SecurityUtils.getCurrentFarmId() : 1L;

        int dayFrom = request.getDayAgeFrom() != null ? request.getDayAgeFrom() : 1;
        int dayTo = request.getDayAgeTo() != null ? request.getDayAgeTo() : dayFrom;

        ConsumptionQuota quota = ConsumptionQuota.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .livestockBreedId(programId)
                .materialId(request.getMaterialId())
                .stage(request.getStage() != null ? request.getStage() : "Nuôi thịt")
                .dayAgeFrom(dayFrom)
                .dayAgeTo(dayTo)
                .standardWeightKg(request.getStandardWeight())
                .feedAmountG(request.getFeedAmount())
                .standardQuantity(request.getFeedAmount() != null ? request.getFeedAmount() : BigDecimal.ZERO)
                .unitOfMeasure(request.getUnit() != null ? request.getUnit() : "g/con")
                .feedType(request.getFeedType())
                .quotaType("FEED")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        quota = consumptionQuotaRepository.save(quota);
        return toFeedStandardItem(quota);
    }

    @Override
    @Transactional
    public ProgramDetailResponse.FeedStandardItem updateFeedStandard(Long programId, Long quotaId, FeedStandardRequest request) {
        ConsumptionQuota quota = consumptionQuotaRepository.findById(quotaId)
                .orElseThrow(() -> new ResourceNotFoundException("Mốc định mức", quotaId));

        if (request.getDayAgeFrom() != null) quota.setDayAgeFrom(request.getDayAgeFrom());
        if (request.getDayAgeTo() != null) quota.setDayAgeTo(request.getDayAgeTo());
        if (request.getStage() != null) quota.setStage(request.getStage());
        if (request.getFeedType() != null) quota.setFeedType(request.getFeedType());
        if (request.getFeedAmount() != null) {
            quota.setFeedAmountG(request.getFeedAmount());
            quota.setStandardQuantity(request.getFeedAmount());
        }
        if (request.getUnit() != null) quota.setUnitOfMeasure(request.getUnit());
        if (request.getStandardWeight() != null) quota.setStandardWeightKg(request.getStandardWeight());
        if (request.getMaterialId() != null) quota.setMaterialId(request.getMaterialId());
        quota.setUpdatedAt(Instant.now());
        quota.setUpdatedBy(SecurityUtils.getCurrentUserId());

        quota = consumptionQuotaRepository.save(quota);
        return toFeedStandardItem(quota);
    }

    @Override
    @Transactional
    public void deleteQuota(Long quotaId) {
        consumptionQuotaRepository.deleteById(quotaId);
    }

    @Override
    @Transactional
    public List<ProgramDetailResponse.FeedStandardItem> batchRangeFeed(Long programId, BatchRangeFeedRequest request) {
        LivestockBreed breed = livestockBreedRepository.findById(programId)
                .orElseThrow(() -> new ResourceNotFoundException("Chương trình nuôi", programId));

        Long tenantId = breed.getTenantId();
        Long farmId = SecurityUtils.getCurrentFarmId() != null ? SecurityUtils.getCurrentFarmId() : 1L;

        int from = request.getFromDay();
        int to = request.getToDay();
        int step = (request.getStepDays() != null && request.getStepDays() > 0) ? request.getStepDays() : 1;

        int stepsCount = Math.max(1, (to - from) / step);
        BigDecimal startFeed = request.getStartFeedAmount();
        BigDecimal endFeed = request.getEndFeedAmount();
        BigDecimal feedStep = endFeed.subtract(startFeed).divide(BigDecimal.valueOf(stepsCount), 2, RoundingMode.HALF_UP);

        BigDecimal startWeight = request.getStartWeightKg() != null ? request.getStartWeightKg() : BigDecimal.ZERO;
        BigDecimal endWeight = request.getEndWeightKg() != null ? request.getEndWeightKg() : BigDecimal.ZERO;
        BigDecimal weightStep = endWeight.subtract(startWeight).divide(BigDecimal.valueOf(stepsCount), 3, RoundingMode.HALF_UP);

        List<ConsumptionQuota> created = new ArrayList<>();
        int currentDay = from;
        int i = 0;
        while (currentDay <= to) {
            int currentDayTo = Math.min(to, currentDay + step - 1);
            BigDecimal currentFeed = startFeed.add(feedStep.multiply(BigDecimal.valueOf(i)));
            BigDecimal currentWeight = startWeight.add(weightStep.multiply(BigDecimal.valueOf(i)));

            ConsumptionQuota q = ConsumptionQuota.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .livestockBreedId(programId)
                    .materialId(request.getMaterialId())
                    .stage(request.getStage() != null ? request.getStage() : "Định mức theo giai đoạn")
                    .feedType(request.getFeedType())
                    .dayAgeFrom(currentDay)
                    .dayAgeTo(currentDayTo)
                    .feedAmountG(currentFeed)
                    .standardQuantity(currentFeed)
                    .unitOfMeasure(request.getUnit() != null ? request.getUnit() : "g/con")
                    .standardWeightKg(currentWeight)
                    .quotaType("FEED")
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();

            created.add(q);
            currentDay = currentDayTo + 1;
            i++;
        }

        List<ConsumptionQuota> saved = consumptionQuotaRepository.saveAll(created);
        return saved.stream().map(this::toFeedStandardItem).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProgramDetailResponse.VaccineTimelineItem addVaccine(Long programId, VaccineTimelineRequest request) {
        LivestockBreed breed = livestockBreedRepository.findById(programId)
                .orElseThrow(() -> new ResourceNotFoundException("Chương trình nuôi", programId));

        Long tenantId = breed.getTenantId();
        Long farmId = SecurityUtils.getCurrentFarmId() != null ? SecurityUtils.getCurrentFarmId() : 1L;

        ConsumptionQuota quota = ConsumptionQuota.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .livestockBreedId(programId)
                .materialId(request.getMaterialId())
                .quotaType("VACCINE")
                .stage("Lịch tiêm phòng")
                .dayAgeFrom(request.getDayAge())
                .dayAgeTo(request.getDayAge())
                .vaccineName(request.getVaccineName())
                .dose(request.getDose())
                .route(request.getRoute())
                .notes(request.getNotes())
                .standardQuantity(BigDecimal.ONE)
                .unitOfMeasure("liều/con")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        quota = consumptionQuotaRepository.save(quota);
        return toVaccineItem(quota);
    }

    @Override
    @Transactional
    public ProgramDetailResponse.VaccineTimelineItem updateVaccine(Long programId, Long quotaId, VaccineTimelineRequest request) {
        ConsumptionQuota quota = consumptionQuotaRepository.findById(quotaId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch vắc-xin", quotaId));

        if (request.getDayAge() != null) {
            quota.setDayAgeFrom(request.getDayAge());
            quota.setDayAgeTo(request.getDayAge());
        }
        if (request.getVaccineName() != null) quota.setVaccineName(request.getVaccineName());
        if (request.getDose() != null) quota.setDose(request.getDose());
        if (request.getRoute() != null) quota.setRoute(request.getRoute());
        if (request.getNotes() != null) quota.setNotes(request.getNotes());
        if (request.getMaterialId() != null) quota.setMaterialId(request.getMaterialId());
        quota.setUpdatedAt(Instant.now());
        quota.setUpdatedBy(SecurityUtils.getCurrentUserId());

        quota = consumptionQuotaRepository.save(quota);
        return toVaccineItem(quota);
    }

    @Override
    @Transactional(readOnly = true)
    public String getEnvMetrics(Long farmId) {
        Long targetFarmId = farmId != null ? farmId : (SecurityUtils.getCurrentFarmId() != null ? SecurityUtils.getCurrentFarmId() : 1L);
        return farmDataRuleRepository.findById(targetFarmId)
                .map(FarmDataRule::getEnvMetricsJson)
                .filter(StringUtils::hasText)
                .orElse("[]");
    }

    @Override
    @Transactional
    public void updateEnvMetrics(Long farmId, String envMetricsJson) {
        Long targetFarmId = farmId != null ? farmId : (SecurityUtils.getCurrentFarmId() != null ? SecurityUtils.getCurrentFarmId() : 1L);
        FarmDataRule rule = farmDataRuleRepository.findById(targetFarmId)
                .orElseGet(() -> FarmDataRule.builder().farmId(targetFarmId).build());
        rule.setEnvMetricsJson(envMetricsJson);
        rule.setUpdatedAt(Instant.now());
        farmDataRuleRepository.save(rule);
    }

    @Override
    @Transactional(readOnly = true)
    public String getKpis(Long farmId) {
        Long targetFarmId = farmId != null ? farmId : (SecurityUtils.getCurrentFarmId() != null ? SecurityUtils.getCurrentFarmId() : 1L);
        return farmDataRuleRepository.findById(targetFarmId)
                .map(FarmDataRule::getKpiTargetsJson)
                .filter(StringUtils::hasText)
                .orElse("{}");
    }

    @Override
    @Transactional
    public void updateKpis(Long farmId, String kpisJson) {
        Long targetFarmId = farmId != null ? farmId : (SecurityUtils.getCurrentFarmId() != null ? SecurityUtils.getCurrentFarmId() : 1L);
        FarmDataRule rule = farmDataRuleRepository.findById(targetFarmId)
                .orElseGet(() -> FarmDataRule.builder().farmId(targetFarmId).build());
        rule.setKpiTargetsJson(kpisJson);
        rule.setUpdatedAt(Instant.now());
        farmDataRuleRepository.save(rule);
    }

    private ProgramDetailResponse mapToProgramDetail(LivestockBreed breed, Long farmId) {
        List<ConsumptionQuota> allQuotas = consumptionQuotaRepository.findByLivestockBreedId(breed.getId());

        List<ProgramDetailResponse.FeedStandardItem> feeds = allQuotas.stream()
                .filter(q -> !"VACCINE".equalsIgnoreCase(q.getQuotaType()) && StringUtils.hasText(q.getFeedType()) || q.getFeedAmountG() != null)
                .sorted(Comparator.comparing(q -> q.getDayAgeFrom() != null ? q.getDayAgeFrom() : 0))
                .map(this::toFeedStandardItem)
                .collect(Collectors.toList());

        List<ProgramDetailResponse.VaccineTimelineItem> vaccines = allQuotas.stream()
                .filter(q -> "VACCINE".equalsIgnoreCase(q.getQuotaType()) || StringUtils.hasText(q.getVaccineName()))
                .sorted(Comparator.comparing(q -> q.getDayAgeFrom() != null ? q.getDayAgeFrom() : 0))
                .map(this::toVaccineItem)
                .collect(Collectors.toList());

        String typeName = "Gia cầm thịt";
        if ("PIG".equalsIgnoreCase(breed.getSpecies()) || "SWINE".equalsIgnoreCase(breed.getSpecies())) {
            typeName = "Gia súc thịt";
        } else if ("CATTLE".equalsIgnoreCase(breed.getSpecies())) {
            typeName = "Bò thịt / Bò sữa";
        } else if ("AQUA".equalsIgnoreCase(breed.getSpecies())) {
            typeName = "Thủy sản";
        }

        return ProgramDetailResponse.builder()
                .id(breed.getId())
                .name(breed.getBreedName())
                .species(breed.getSpecies())
                .livestockType(breed.getSpecies())
                .livestockTypeName(typeName)
                .breedName(breed.getBreedName())
                .totalDays(breed.getStandardGrowthDays() != null ? breed.getStandardGrowthDays() : 45)
                .targetWeightKg(breed.getTargetWeightKg())
                .fcrTarget(breed.getFcrTarget())
                .adgTarget(breed.getAdgTarget())
                .description(breed.getDescription())
                .feedStandards(feeds)
                .vaccineTimeline(vaccines)
                .build();
    }

    private ProgramDetailResponse.FeedStandardItem toFeedStandardItem(ConsumptionQuota q) {
        return ProgramDetailResponse.FeedStandardItem.builder()
                .id(q.getId())
                .dayAge(q.getDayAgeFrom() != null ? q.getDayAgeFrom() : 1)
                .dayAgeFrom(q.getDayAgeFrom() != null ? q.getDayAgeFrom() : 1)
                .dayAgeTo(q.getDayAgeTo() != null ? q.getDayAgeTo() : q.getDayAgeFrom())
                .stage(q.getStage())
                .feedType(q.getFeedType() != null ? q.getFeedType() : "Cám tiêu chuẩn")
                .feedAmount(q.getFeedAmountG() != null ? q.getFeedAmountG() : q.getStandardQuantity())
                .unit(q.getUnitOfMeasure() != null ? q.getUnitOfMeasure() : "g/con")
                .standardWeight(q.getStandardWeightKg())
                .materialId(q.getMaterialId())
                .build();
    }

    private ProgramDetailResponse.VaccineTimelineItem toVaccineItem(ConsumptionQuota q) {
        return ProgramDetailResponse.VaccineTimelineItem.builder()
                .id(q.getId())
                .dayAge(q.getDayAgeFrom() != null ? q.getDayAgeFrom() : 1)
                .vaccineName(q.getVaccineName() != null ? q.getVaccineName() : "Vắc-xin phòng bệnh")
                .dose(q.getDose())
                .route(q.getRoute())
                .notes(q.getNotes())
                .materialId(q.getMaterialId())
                .build();
    }
}
