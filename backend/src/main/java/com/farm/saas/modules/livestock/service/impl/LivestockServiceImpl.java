package com.farm.saas.modules.livestock.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.InsufficientStockException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.livestock.service.LivestockService;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.finance.entity.CostAllocation;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.CostAllocationRepository;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.entity.ZoneLocation;
import com.farm.saas.modules.geography.repository.OperationalCycleRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.finance.entity.DebtRecord;
import com.farm.saas.modules.finance.repository.DebtRecordRepository;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction;
import com.farm.saas.modules.inventory.entity.WarehouseIssue;
import com.farm.saas.modules.inventory.entity.WarehouseIssueItem;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryTransactionRepository;
import com.farm.saas.modules.inventory.repository.WarehouseIssueItemRepository;
import com.farm.saas.modules.inventory.repository.WarehouseIssueRepository;
import com.farm.saas.modules.livestock.dto.request.*;
import com.farm.saas.modules.livestock.dto.response.*;
import com.farm.saas.modules.livestock.entity.*;
import com.farm.saas.modules.livestock.repository.*;
import com.farm.saas.modules.masterdata.entity.CostCategory;
import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
public class LivestockServiceImpl implements LivestockService {

    private final LivestockGroupRepository livestockGroupRepository;
    private final LivestockIndividualRepository livestockIndividualRepository;
    private final LivestockWeightLogRepository livestockWeightLogRepository;
    private final LivestockEventRepository livestockEventRepository;
    private final LivestockEventSupplyRepository livestockEventSupplyRepository;
    private final LivestockBreedRepository livestockBreedRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final OperationalCycleRepository operationalCycleRepository;
    private final ZoneLocationRepository zoneLocationRepository;
    private final MaterialRepository materialRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseIssueRepository warehouseIssueRepository;
    private final WarehouseIssueItemRepository warehouseIssueItemRepository;
    private final WarehouseInventoryTransactionRepository warehouseInventoryTransactionRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PartnerRepository partnerRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private CostAllocationRepository costAllocationRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.farm.saas.modules.geography.repository.FarmRepository farmRepository;

    // ==========================================
    // 1. LIVESTOCK GROUPS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public Page<LivestockGroupDetailResponse> getGroups(Long farmId, String status, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<LivestockGroup> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            predicates = cb.and(predicates, cb.equal(root.get("farmId"), farmId));
            predicates = cb.and(predicates, cb.equal(root.get("tenantId"), tenantId));
            if (StringUtils.hasText(status)) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }
            return predicates;
        };

        return livestockGroupRepository.findAll(spec, pageable).map(this::mapToGroupDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public LivestockGroupDetailResponse getGroupById(Long farmId, Long id) {
        LivestockGroup group = findGroupOrThrow(farmId, id);
        return mapToGroupDetailResponse(group);
    }

    @Override
    @Transactional
    public LivestockGroupDetailResponse createGroup(Long farmId, CreateLivestockGroupRequest request) {
        final Long tenantId = (SecurityUtils.getCurrentTenantId() != null)
                ? SecurityUtils.getCurrentTenantId()
                : productionZoneRepository.findById(request.getZoneId())
                        .map(ProductionZone::getTenantId)
                        .orElse(1L);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        String groupCode = request.getGroupCode();
        if (!StringUtils.hasText(groupCode)) {
            groupCode = "LG-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        if (livestockGroupRepository.existsByTenantIdAndFarmIdAndGroupCode(tenantId, farmId, groupCode)) {
            throw new BusinessException("DUPLICATE_GROUP_CODE", "MÃ£ Ä‘Ã n Ä‘Ã£ tá»“n táº¡i: " + groupCode);
        }

        BigDecimal totalCost = request.getTotalCost();
        if ((totalCost == null || totalCost.compareTo(BigDecimal.ZERO) <= 0) && request.getUnitPrice() != null) {
            totalCost = request.getUnitPrice().multiply(BigDecimal.valueOf(request.getInitialQuantity()));
        }

        String mgmtType = request.getManagementType();
        if (!StringUtils.hasText(mgmtType)) {
            mgmtType = livestockBreedRepository.findById(request.getBreedId())
                    .map(b -> {
                        if (StringUtils.hasText(b.getManagementType())) return b.getManagementType();
                        return "POULTRY".equalsIgnoreCase(b.getSpecies()) ? "FLOCK_HERD" : "INDIVIDUAL_TAGGED";
                    })
                    .orElse("FLOCK_HERD");
        }

        LivestockGroup group = LivestockGroup.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .zoneId(request.getZoneId())
                .locationId(request.getLocationId())
                .operationalCycleId(request.getOperationalCycleId())
                .groupCode(groupCode)
                .breedId(request.getBreedId())
                .partnerId(request.getPartnerId())
                .initialQuantity(request.getInitialQuantity())
                .currentQuantity(request.getInitialQuantity())
                .unitPrice(request.getUnitPrice())
                .totalCost(totalCost)
                .avgInitialWeightKg(request.getAvgInitialWeightKg())
                .healthCertificate(request.getHealthCertificate())
                .origin(request.getOrigin())
                .notes(request.getNotes())
                .entryDate(request.getEntryDate())
                .status("ACTIVE")
                .managementType(mgmtType)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        group = livestockGroupRepository.save(group);

        // 1. Tá»± Ä‘á»™ng sinh cÃ´ng ná»£ pháº£i tráº£ NhÃ  cung cáº¥p con giá»‘ng náº¿u cÃ³ partnerId vÃ  totalCost
        if (request.getPartnerId() != null && totalCost != null && totalCost.compareTo(BigDecimal.ZERO) > 0) {
            Partner partner = partnerRepository.findByTenantIdAndId(tenantId, request.getPartnerId()).orElse(null);
            int paymentTerm = (partner != null && partner.getPaymentTermDays() != null) ? partner.getPaymentTermDays() : 30;
            LocalDate dueDate = request.getEntryDate().plusDays(paymentTerm);

            String breedName = livestockBreedRepository.findById(request.getBreedId())
                    .map(com.farm.saas.modules.masterdata.entity.LivestockBreed::getBreedName)
                    .orElse("Con giá»‘ng");
            String itemDesc = breedName + " (" + group.getInitialQuantity() + " con)";

            DebtRecord debt = DebtRecord.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .partnerId(request.getPartnerId())
                    .livestockGroupId(group.getId())
                    .notes(itemDesc)
                    .debtType("PAYABLE")
                    .totalDebt(totalCost)
                    .paidAmount(BigDecimal.ZERO)
                    .remainingDebt(totalCost)
                    .dueDate(dueDate)
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            debtRecordRepository.save(debt);
            log.info("Auto-created payable debt record for livestock group {} to supplier {}", group.getGroupCode(), request.getPartnerId());
        }

        // 2. Tá»± Ä‘á»™ng ghi nháº­n chi phÃ­ Ä‘áº§u vÃ o con giá»‘ng (FarmExpense) gáº¯n vá»›i Ä‘Ã n nuÃ´i
        if (totalCost != null && totalCost.compareTo(BigDecimal.ZERO) > 0) {
            CostCategory breedCostCategory = costCategoryRepository.findByTenantIdAndCode(tenantId, "CST-002")
                    .or(() -> costCategoryRepository.findByTenantIdAndCode(tenantId, "BREED_COST"))
                    .or(() -> costCategoryRepository.findByTenantId(tenantId).stream()
                            .filter(c -> c.getName() != null && c.getName().toLowerCase().contains("giá»‘ng"))
                            .findFirst())
                    .orElseGet(() -> {
                        CostCategory newCat = CostCategory.builder()
                                .tenantId(tenantId)
                                .name("Chi phÃ­ CÃ¢y giá»‘ng & Con giá»‘ng váº­t nuÃ´i")
                                .code("BREED_COST")
                                .costType("MATERIALS")
                                .createdAt(Instant.now())
                                .createdBy(currentUserId)
                                .build();
                        return costCategoryRepository.save(newCat);
                    });

            FarmExpense expense = FarmExpense.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .livestockGroupId(group.getId())
                    .costCategoryId(breedCostCategory.getId())
                    .expenseCode("EXP-BREED-" + group.getGroupCode())
                    .expenseSource("BREED_PURCHASE")
                    .referenceId(group.getId())
                    .expenseDate(request.getEntryDate())
                    .amount(totalCost)
                    .unitCostEligible(true)
                    .status("CONFIRMED")
                    .notes("Chi phÃ­ mua con giá»‘ng ban Ä‘áº§u Ä‘Ã n " + group.getGroupCode() + " (" + group.getInitialQuantity() + " con)")
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            farmExpenseRepository.save(expense);
            log.info("Auto-created farm expense for livestock group {}", group.getGroupCode());
        }

        // 3. Tá»± Ä‘á»™ng ghi nháº­n trá»ng lÆ°á»£ng ban Ä‘áº§u vÃ o LivestockWeightLog náº¿u cÃ³ avgInitialWeightKg
        if (request.getAvgInitialWeightKg() != null && request.getAvgInitialWeightKg().compareTo(BigDecimal.ZERO) > 0) {
            LivestockWeightLog initialWeight = LivestockWeightLog.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .targetType("GROUP")
                    .groupId(group.getId())
                    .recordDate(request.getEntryDate())
                    .weightKg(request.getAvgInitialWeightKg())
                    .recordedByUserId(currentUserId)
                    .notes("Trá»ng lÆ°á»£ng bÃ¬nh quÃ¢n nháº­p Ä‘Ã n ban Ä‘áº§u (" + group.getInitialQuantity() + " con)")
                    .createdAt(Instant.now())
                    .build();
            livestockWeightLogRepository.save(initialWeight);
            log.info("Auto-logged initial average weight for livestock group {}", group.getGroupCode());
        }

        // Äá»“ng bá»™ zone_locations sang OCCUPIED
        if (request.getLocationId() != null) {
            zoneLocationRepository.findById(request.getLocationId()).ifPresent(loc -> {
                if (Objects.equals(loc.getZoneId(), request.getZoneId()) && (tenantId == null || tenantId.equals(loc.getTenantId()))) {
                    loc.setStatus("OCCUPIED");
                    loc.setUpdatedAt(Instant.now());
                    zoneLocationRepository.save(loc);
                }
            });
        } else if (request.getZoneId() != null) {
            var locs = zoneLocationRepository.findByZoneId(request.getZoneId());
            if (locs.size() == 1 && "EMPTY".equalsIgnoreCase(locs.get(0).getStatus())) {
                var singleLoc = locs.get(0);
                singleLoc.setStatus("OCCUPIED");
                singleLoc.setUpdatedAt(Instant.now());
                zoneLocationRepository.save(singleLoc);
            }
        }

        log.info("Created livestock group id={}, code={} on farmId={}", group.getId(), group.getGroupCode(), farmId);
        return mapToGroupDetailResponse(group);
    }

    @Override
    @Transactional
    public LivestockGroupDetailResponse updateGroup(Long farmId, Long id, UpdateLivestockGroupRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        LivestockGroup group = findGroupOrThrow(farmId, id);

        final Long targetZoneId = group.getZoneId();
        if (request.getLocationId() != null) {
            zoneLocationRepository.findById(request.getLocationId()).ifPresent(loc -> {
                if (Objects.equals(loc.getZoneId(), targetZoneId) && (tenantId == null || tenantId.equals(loc.getTenantId()))) {
                    loc.setStatus("OCCUPIED");
                    loc.setUpdatedAt(Instant.now());
                    zoneLocationRepository.save(loc);
                }
            });
        }
        if (request.getLocationId() != null) {
            group.setLocationId(request.getLocationId());
        }
        if (request.getZoneId() != null) {
            group.setZoneId(request.getZoneId());
        }
        if (request.getCurrentQuantity() != null) {
            group.setCurrentQuantity(request.getCurrentQuantity());
        }
        String oldStatus = group.getStatus();
        if (StringUtils.hasText(request.getStatus())) {
            group.setStatus(request.getStatus());
        }
        if (StringUtils.hasText(request.getManagementType())) {
            group.setManagementType(request.getManagementType());
        }

        group.setUpdatedAt(Instant.now());
        group.setUpdatedBy(SecurityUtils.getCurrentUserId());
        group = livestockGroupRepository.save(group);

        if (("SOLD".equalsIgnoreCase(group.getStatus()) || "CULLED".equalsIgnoreCase(group.getStatus()) || "CLOSED".equalsIgnoreCase(group.getStatus()))
                && !group.getStatus().equalsIgnoreCase(oldStatus)) {
            // farmTaskService.cancelPendingRoutineTasksForZone - FarmTask deprecated
            releaseZoneLocationsIfEmpty(tenantId, farmId, group.getZoneId());
        }

        return mapToGroupDetailResponse(group);
    }

    @Override
    @Transactional
    public LivestockGroupDetailResponse closeGroup(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        LivestockGroup group = findGroupOrThrow(farmId, id);
        if ("SOLD".equalsIgnoreCase(group.getStatus()) || "CULLED".equalsIgnoreCase(group.getStatus())) {
            throw new BusinessException("GROUP_ALREADY_CLOSED", "ÄÃ n nuÃ´i Ä‘Ã£ á»Ÿ tráº¡ng thÃ¡i káº¿t thÃºc: " + group.getStatus());
        }

        // Quy trÃ¬nh 5: Tá»± Ä‘á»™ng tá»•ng há»£p chi phÃ­ (giá»‘ng, thá»©c Äƒn, thuá»‘c, tháº» tai, nhÃ¢n cÃ´ng) káº¿t chuyá»ƒn GiÃ¡ thÃ nh Ä‘Æ¡n vá»‹ (Unit Cost Allocation)
        BigDecimal directExpenses = farmExpenseRepository.sumConfirmedExpensesByLivestockGroupId(group.getId());
        if (directExpenses == null) directExpenses = BigDecimal.ZERO;

        BigDecimal allocatedCost = BigDecimal.ZERO;
        if (costAllocationRepository != null) {
            var allocations = costAllocationRepository.findByTargetTypeAndTargetId("LIVESTOCK_GROUP", group.getId());
            if (allocations != null) {
                allocatedCost = allocations.stream().map(CostAllocation::getAllocatedAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }
        BigDecimal totalCost = directExpenses.add(allocatedCost);

        BigDecimal totalYieldKg = BigDecimal.ZERO;
        totalYieldKg = BigDecimal.ZERO;
        if (totalYieldKg == null) totalYieldKg = BigDecimal.ZERO;

        BigDecimal unitCostPerKg = (totalYieldKg.compareTo(BigDecimal.ZERO) > 0)
                ? totalCost.divide(totalYieldKg, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        int headCount = (group.getInitialQuantity() != null && group.getInitialQuantity() > 0) ? group.getInitialQuantity() : 1;
        BigDecimal unitCostPerHead = totalCost.divide(BigDecimal.valueOf(headCount), 2, RoundingMode.HALF_UP);

        String costSummary = String.format("[Káº¾T TOÃN GIÃ THÃ€NH: Tá»•ng chi phÃ­ = %,.0f Ä‘ | Sáº£n lÆ°á»£ng xuáº¥t = %,.2f kg => GiÃ¡ thÃ nh = %,.0f Ä‘/kg (%,.0f Ä‘/con)]",
                totalCost, totalYieldKg, unitCostPerKg, unitCostPerHead);

        String existingNotes = group.getNotes() != null ? group.getNotes() : "";
        group.setNotes(existingNotes + (existingNotes.isBlank() ? "" : " | ") + costSummary);

        final Long gId = group.getId();
        final String gCode = group.getGroupCode();
        final String finalCostSummary = costSummary;

        group.setStatus("SOLD");
        group.setCurrentQuantity(0);
        group.setUpdatedAt(Instant.now());
        group.setUpdatedBy(SecurityUtils.getCurrentUserId());
        group = livestockGroupRepository.save(group);

            // farmTaskService.cancelPendingRoutineTasksForZone - FarmTask deprecated
        releaseZoneLocationsIfEmpty(tenantId, farmId, group.getZoneId());

        if (notificationService != null) {
            try {
                farmRepository.findById(farmId).ifPresent(f -> {
                    if (f.getManagerUserId() != null) {
                        notificationService.sendNotification(
                                tenantId,
                                f.getManagerUserId(),
                                "HoÃ n táº¥t xuáº¥t chuá»“ng & káº¿t toÃ¡n giÃ¡ thÃ nh Ä‘Ã n " + gCode,
                                "ÄÃ n " + gCode + " Ä‘Ã£ xuáº¥t chuá»“ng thÃ nh cÃ´ng. " + finalCostSummary,
                                "INFO",
                                "LIVESTOCK_GROUP",
                                gId,
                                "/app/farming"
                        );
                    }
                });
            } catch (Exception ex) {
                log.warn("Failed to send group close notification: {}", ex.getMessage());
            }
        }

        log.info("Closed / sold livestock group id={} on farmId={}, costSummary='{}'", gId, farmId, finalCostSummary);
        return mapToGroupDetailResponse(group);
    }

    // ==========================================
    // 2. LIVESTOCK INDIVIDUALS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public Page<LivestockIndividualDetailResponse> getIndividuals(Long farmId, Long groupId, String healthStatus, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<LivestockIndividual> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            predicates = cb.and(predicates, cb.equal(root.get("farmId"), farmId));
            predicates = cb.and(predicates, cb.equal(root.get("tenantId"), tenantId));
            if (groupId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("groupId"), groupId));
            }
            if (StringUtils.hasText(healthStatus)) {
                predicates = cb.and(predicates, cb.equal(root.get("healthStatus"), healthStatus));
            }
            return predicates;
        };

        return livestockIndividualRepository.findAll(spec, pageable).map(this::mapToIndividualDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public LivestockIndividualDetailResponse getIndividualById(Long farmId, Long id) {
        LivestockIndividual individual = findIndividualOrThrow(farmId, id);
        return mapToIndividualDetailResponse(individual);
    }

    @Override
    @Transactional
    public LivestockIndividualDetailResponse createIndividual(Long farmId, CreateLivestockIndividualRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        if (livestockIndividualRepository.existsByTenantIdAndRfidTagCode(tenantId, request.getRfidTagCode())) {
            throw new BusinessException("DUPLICATE_RFID_TAG", "MÃ£ tháº» RFID Ä‘Ã£ tá»“n táº¡i trong há»‡ thá»‘ng: " + request.getRfidTagCode());
        }

        String healthStatus = StringUtils.hasText(request.getHealthStatus()) ? request.getHealthStatus() : "HEALTHY";

        LivestockIndividual individual = LivestockIndividual.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .zoneId(request.getZoneId())
                .groupId(request.getGroupId())
                .rfidTagCode(request.getRfidTagCode())
                .gender(request.getGender())
                .birthDate(request.getBirthDate())
                .motherTagCode(request.getMotherTagCode())
                .fatherTagCode(request.getFatherTagCode())
                .currentWeightKg(request.getCurrentWeightKg())
                .healthStatus(healthStatus)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        individual = livestockIndividualRepository.save(individual);
        log.info("Created livestock individual id={}, tag={} on farmId={}", individual.getId(), individual.getRfidTagCode(), farmId);

        // Tá»± Ä‘á»™ng xuáº¥t kho 1 tháº» tai RFID & tÃ­nh chi phÃ­ náº¿u cÃ³ yÃªu cáº§u
        if (Boolean.TRUE.equals(request.getAutoDeductTagInventory()) && individual.getGroupId() != null) {
            LivestockGroup group = livestockGroupRepository.findById(individual.getGroupId()).orElse(null);
            if (group != null) {
                autoDeductTagSuppliesAndRecordExpense(
                        tenantId, farmId, currentUserId, group, 1,
                        request.getWarehouseId(), null, request.getTagMaterialId(), request.getTagUnitPrice());
            }
        }

        return mapToIndividualDetailResponse(individual);
    }

    @Override
    @Transactional
    public BatchCreateIndividualsResponse batchCreateIndividuals(Long farmId, BatchCreateIndividualsRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        LivestockGroup group = findGroupOrThrow(farmId, request.getGroupId());
        Long zoneId = request.getZoneId() != null ? request.getZoneId() : group.getZoneId();

        List<LivestockIndividual> toSave = new ArrayList<>();
        List<String> skippedCodes = new ArrayList<>();

        if ("RANGE".equalsIgnoreCase(request.getMode())) {
            int start = request.getStartNumber() != null ? request.getStartNumber() : 1;
            int count = request.getCount() != null ? request.getCount() : 1;
            int digits = request.getDigits() != null ? request.getDigits() : 4;
            String prefix = StringUtils.hasText(request.getPrefix()) ? request.getPrefix().trim().toUpperCase() : "TAG-";
            String healthStatus = StringUtils.hasText(request.getDefaultHealthStatus()) ? request.getDefaultHealthStatus() : "HEALTHY";
            String defaultGender = StringUtils.hasText(request.getDefaultGender()) ? request.getDefaultGender().toUpperCase() : "FEMALE";
            BigDecimal weight = request.getDefaultWeightKg() != null ? request.getDefaultWeightKg() : group.getAvgInitialWeightKg();
            LocalDate birthDate = request.getDefaultBirthDate() != null ? request.getDefaultBirthDate() : group.getEntryDate();

            List<String> generatedCodes = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                int num = start + i;
                generatedCodes.add(prefix + String.format("%0" + digits + "d", num));
            }

            List<LivestockIndividual> existing = livestockIndividualRepository.findByTenantIdAndRfidTagCodeIn(tenantId, generatedCodes);
            Set<String> existingTags = existing.stream().map(LivestockIndividual::getRfidTagCode).collect(Collectors.toSet());

            for (int i = 0; i < count; i++) {
                String code = generatedCodes.get(i);
                if (existingTags.contains(code)) {
                    skippedCodes.add(code);
                    continue;
                }

                String gender = defaultGender;
                if ("MIXED".equalsIgnoreCase(defaultGender)) {
                    gender = (i % 2 == 0) ? "FEMALE" : "MALE";
                }

                LivestockIndividual indiv = LivestockIndividual.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .zoneId(zoneId)
                        .groupId(group.getId())
                        .rfidTagCode(code)
                        .gender(gender)
                        .birthDate(birthDate)
                        .currentWeightKg(weight)
                        .healthStatus(healthStatus)
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();
                toSave.add(indiv);
            }
        } else if (request.getIndividuals() != null && !request.getIndividuals().isEmpty()) {
            Set<String> reqTags = request.getIndividuals().stream()
                    .map(CreateLivestockIndividualRequest::getRfidTagCode)
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .collect(Collectors.toSet());

            List<LivestockIndividual> existing = livestockIndividualRepository.findByTenantIdAndRfidTagCodeIn(tenantId, reqTags);
            Set<String> existingTags = existing.stream().map(LivestockIndividual::getRfidTagCode).collect(Collectors.toSet());
            Set<String> seenInBatch = new HashSet<>();

            for (CreateLivestockIndividualRequest item : request.getIndividuals()) {
                if (!StringUtils.hasText(item.getRfidTagCode())) continue;
                String tag = item.getRfidTagCode().trim().toUpperCase();
                if (existingTags.contains(tag) || seenInBatch.contains(tag)) {
                    skippedCodes.add(tag);
                    continue;
                }
                seenInBatch.add(tag);

                String healthStatus = StringUtils.hasText(item.getHealthStatus()) ? item.getHealthStatus() : "HEALTHY";
                String gender = StringUtils.hasText(item.getGender()) ? item.getGender().toUpperCase() : "FEMALE";
                BigDecimal weight = item.getCurrentWeightKg() != null ? item.getCurrentWeightKg() : group.getAvgInitialWeightKg();
                LocalDate birthDate = item.getBirthDate() != null ? item.getBirthDate() : group.getEntryDate();

                LivestockIndividual indiv = LivestockIndividual.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .zoneId(item.getZoneId() != null ? item.getZoneId() : zoneId)
                        .groupId(group.getId())
                        .rfidTagCode(tag)
                        .gender(gender)
                        .birthDate(birthDate)
                        .motherTagCode(item.getMotherTagCode())
                        .fatherTagCode(item.getFatherTagCode())
                        .currentWeightKg(weight)
                        .healthStatus(healthStatus)
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();
                toSave.add(indiv);
            }
        }

        List<LivestockIndividual> saved = livestockIndividualRepository.saveAll(toSave);
        log.info("Batch created {} livestock individuals (skipped {}) for group {} on farmId {}",
                saved.size(), skippedCodes.size(), group.getGroupCode(), farmId);

        // Tá»± Ä‘á»™ng xuáº¥t kho Tháº» tai RFID & Háº¡ch toÃ¡n chi phÃ­ Ä‘Ã n nuÃ´i
        TagDeductionResult tagDeduction = null;
        if (Boolean.TRUE.equals(request.getAutoDeductTagInventory()) && !saved.isEmpty()) {
            tagDeduction = autoDeductTagSuppliesAndRecordExpense(
                    tenantId, farmId, currentUserId, group, saved.size(),
                    request.getWarehouseId(), request.getStorageBinCode(), request.getTagMaterialId(), request.getTagUnitPrice());
        }

        List<LivestockIndividualDetailResponse> dtos = saved.stream()
                .map(this::mapToIndividualDetailResponse)
                .collect(Collectors.toList());

        String msg = String.format("GÃ¡n tháº» tai thÃ nh cÃ´ng %d cÃ¡ thá»ƒ (Bá» qua %d mÃ£ bá»‹ trÃ¹ng)", saved.size(), skippedCodes.size());
        if (tagDeduction != null && tagDeduction.deducted()) {
            msg += String.format(" | ÄÃ£ tá»± Ä‘á»™ng xuáº¥t kho %d tháº» tai (Phiáº¿u: %s) vÃ  háº¡ch toÃ¡n chi phÃ­: %s Ä‘",
                    saved.size(), tagDeduction.issueCode(), tagDeduction.totalCost());
        }

        return BatchCreateIndividualsResponse.builder()
                .totalCreated(saved.size())
                .items(dtos)
                .skippedTagCodes(skippedCodes)
                .message(msg)
                .inventoryDeducted(tagDeduction != null && tagDeduction.deducted())
                .totalTagCost(tagDeduction != null ? tagDeduction.totalCost() : BigDecimal.ZERO)
                .issueCode(tagDeduction != null ? tagDeduction.issueCode() : null)
                .expenseCode(tagDeduction != null ? tagDeduction.expenseCode() : null)
                .build();
    }

    /**
     * Tá»± Ä‘á»™ng xuáº¥t kho Tháº» tai RFID (Auto-Backflushing) vÃ  ghi nháº­n Chi phÃ­ Ä‘Ã n nuÃ´i (FarmExpense)
     */
    private TagDeductionResult autoDeductTagSuppliesAndRecordExpense(
            Long tenantId,
            Long farmId,
            Long currentUserId,
            LivestockGroup group,
            int tagCount,
            Long preferredWarehouseId,
            String preferredStorageBinCode,
            Long preferredMaterialId,
            BigDecimal customUnitPrice) {

        if (tagCount <= 0 || group == null) {
            return new TagDeductionResult(false, BigDecimal.ZERO, null, null);
        }

        // 1. TÃ¬m váº­t tÆ° Tháº» tai RFID
        Material tagMaterial = null;
        if (preferredMaterialId != null) {
            tagMaterial = materialRepository.findById(preferredMaterialId).orElse(null);
        }
        if (tagMaterial == null) {
            tagMaterial = materialRepository.findByTenantIdAndSkuCode(tenantId, "MAT_RFID_TAG")
                    .orElseGet(() -> materialRepository.findByTenantId(tenantId).stream()
                            .filter(m -> m.getName() != null && (m.getName().toLowerCase().contains("rfid") || m.getName().toLowerCase().contains("tháº» tai")))
                            .findFirst()
                            .orElse(null));
        }

        if (tagMaterial == null) {
            throw new BusinessException("TAG_MATERIAL_NOT_FOUND", "Há»‡ thá»‘ng chÆ°a tÃ¬m tháº¥y danh má»¥c váº­t tÆ° Tháº» tai RFID (SKU: MAT_RFID_TAG). Vui lÃ²ng kiá»ƒm tra danh má»¥c váº­t tÆ°!");
        }

        // 2. TÃ¬m kho xuáº¥t
        if (preferredWarehouseId == null) {
            throw new BusinessException("WAREHOUSE_REQUIRED", "Vui lÃ²ng chá»n kho chá»©a Tháº» tai RFID Ä‘á»ƒ thá»±c hiá»‡n xuáº¥t kho!");
        }
        Warehouse warehouse = warehouseRepository.findById(preferredWarehouseId)
                .orElseThrow(() -> new BusinessException("WAREHOUSE_NOT_FOUND", "KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin kho Ä‘Ã£ chá»n"));

        BigDecimal qtyToDeduct = BigDecimal.valueOf(tagCount);

        // 3. TÃ¬m lÃ´ tá»“n kho Ä‘á»ƒ xuáº¥t FEFO
        List<WarehouseInventory> stockList = warehouseInventoryRepository.findByWarehouseIdAndMaterialId(warehouse.getId(), tagMaterial.getId())
                .stream()
                .filter(s -> s.getQuantityOnHand() != null && s.getQuantityOnHand().compareTo(BigDecimal.ZERO) > 0)
                .filter(s -> !StringUtils.hasText(preferredStorageBinCode) || Objects.equals(s.getStorageBinCode(), preferredStorageBinCode))
                .sorted(Comparator.comparing(WarehouseInventory::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(WarehouseInventory::getInwardDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        BigDecimal totalAvailable = stockList.stream()
                .map(WarehouseInventory::getQuantityOnHand)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAvailable.compareTo(qtyToDeduct) < 0) {
            String binText = StringUtils.hasText(preferredStorageBinCode) ? " táº¡i vá»‹ trÃ­ ká»‡ '" + preferredStorageBinCode + "'" : "";
            throw new BusinessException(
                    "INSUFFICIENT_TAG_INVENTORY",
                    String.format("Kho '%s'%s khÃ´ng Ä‘á»§ sá»‘ lÆ°á»£ng Tháº» tai RFID tá»“n kho (Hiá»‡n cÃ³: %s cÃ¡i, Cáº§n xuáº¥t: %s cÃ¡i). Vui lÃ²ng nháº­p kho tháº» tai trÆ°á»›c khi gáº¯n tháº» hoáº·c bá» chá»n Tá»± Äá»™ng Xuáº¥t Kho!",
                            warehouse.getName(), binText, totalAvailable.stripTrailingZeros().toPlainString(), qtyToDeduct.toPlainString())
            );
        }

        BigDecimal unitPrice = (customUnitPrice != null && customUnitPrice.compareTo(BigDecimal.ZERO) > 0)
                ? customUnitPrice
                : (stockList.get(0).getUnitCost() != null ? stockList.get(0).getUnitCost()
                : (tagMaterial.getUnitPriceStandard() != null ? tagMaterial.getUnitPriceStandard() : BigDecimal.valueOf(15000)));

        BigDecimal totalCost = qtyToDeduct.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
        String binCodeUsed = StringUtils.hasText(preferredStorageBinCode) ? preferredStorageBinCode : stockList.get(0).getStorageBinCode();

        // 4. Táº¡o Phiáº¿u xuáº¥t kho WarehouseIssue trÆ°á»›c Ä‘á»ƒ cÃ³ ID ghi sá»• giao dá»‹ch
        String issueCode = "ISS-TAG-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        WarehouseIssue issue = WarehouseIssue.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(warehouse.getId())
                .issueCode(issueCode)
                .issueType("PRODUCTION_BACKFLUSH")
                .receiverName("Ká»¹ thuáº­t chÄƒn nuÃ´i / GÃ¡n tháº» tai")
                .livestockGroupId(group.getId())
                .isBackflushed(true)
                .issueDate(LocalDate.now())
                .totalAmount(totalCost)
                .status("COMPLETED")
                .approvedBy(currentUserId)
                .approvedAt(Instant.now())
                .notes("Tá»± Ä‘á»™ng xuáº¥t kho " + tagCount + " tháº» tai RFID (" + tagMaterial.getName() + ") cho Ä‘Ã n " + group.getGroupCode() + (StringUtils.hasText(binCodeUsed) ? " táº¡i ká»‡ " + binCodeUsed : ""))
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();
        issue = warehouseIssueRepository.save(issue);

        // 5. Trá»« kho theo lÃ´ FEFO vÃ  táº¡o Item + Transaction tÆ°Æ¡ng á»©ng
        BigDecimal remainingToDeduct = qtyToDeduct;
        for (WarehouseInventory inv : stockList) {
            if (remainingToDeduct.compareTo(BigDecimal.ZERO) <= 0) break;
            BigDecimal deductFromThis = inv.getQuantityOnHand().min(remainingToDeduct);
            BigDecimal balanceBefore = inv.getQuantityOnHand();
            BigDecimal balanceAfter = balanceBefore.subtract(deductFromThis);
            inv.setQuantityOnHand(balanceAfter);
            inv.setUpdatedAt(Instant.now());
            inv.setUpdatedBy(currentUserId);
            warehouseInventoryRepository.save(inv);

            BigDecimal lineTotal = deductFromThis.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

            // Táº¡o WarehouseIssueItem
            WarehouseIssueItem issueItem = WarehouseIssueItem.builder()
                    .issueId(issue.getId())
                    .tenantId(tenantId)
                    .materialId(tagMaterial.getId())
                    .batchNumber(inv.getBatchNumber())
                    .enteredUnit(tagMaterial.getStandardUnit() != null ? tagMaterial.getStandardUnit() : "PIECE")
                    .enteredQuantity(deductFromThis)
                    .conversionFactor(BigDecimal.ONE)
                    .quantity(deductFromThis)
                    .unitPrice(unitPrice)
                    .totalPrice(lineTotal)
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            issueItem = warehouseIssueItemRepository.save(issueItem);

            // Ghi sá»• transaction báº¥t biáº¿n cÃ³ referenceItemId há»£p lá»‡
            WarehouseInventoryTransaction trans = WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .warehouseId(warehouse.getId())
                    .materialId(tagMaterial.getId())
                    .batchNumber(inv.getBatchNumber())
                    .transactionType("OUTWARD")
                    .referenceDocType("WAREHOUSE_ISSUE")
                    .referenceDocId(issue.getId())
                    .referenceItemId(issueItem.getId())
                    .direction("OUT")
                    .quantity(deductFromThis)
                    .unitPrice(unitPrice)
                    .totalAmount(lineTotal)
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(LocalDate.now())
                    .notes("Xuáº¥t kho tá»± Ä‘á»™ng gÃ¡n tháº» tai Ä‘Ã n " + group.getGroupCode() + " theo phiáº¿u " + issueCode)
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            warehouseInventoryTransactionRepository.save(trans);

            remainingToDeduct = remainingToDeduct.subtract(deductFromThis);
        }

        // 6. Ghi nháº­n Chi phÃ­ Ä‘Ã n nuÃ´i (FarmExpense) cho Káº¿ toÃ¡n
        CostCategory tagCostCategory = costCategoryRepository.findByTenantIdAndCode(tenantId, "TAG_COST")
                .or(() -> costCategoryRepository.findByTenantId(tenantId).stream()
                        .filter(c -> c.getName() != null && (c.getName().toLowerCase().contains("tháº» tai") || c.getName().toLowerCase().contains("Ä‘á»‹nh danh")))
                        .findFirst())
                .orElseGet(() -> {
                    CostCategory newCat = CostCategory.builder()
                            .tenantId(tenantId)
                            .name("Chi phÃ­ Tháº» tai RFID & Váº­t tÆ° Ä‘á»‹nh danh")
                            .code("TAG_COST")
                            .costType("MATERIALS")
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();
                    return costCategoryRepository.save(newCat);
                });

        String expCode = "EXP-TAG-" + group.getGroupCode() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        FarmExpense expense = FarmExpense.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .livestockGroupId(group.getId())
                .costCategoryId(tagCostCategory.getId())
                .expenseCode(expCode)
                .expenseSource("TAGGING_BACKFLUSH")
                .referenceId(group.getId())
                .expenseDate(LocalDate.now())
                .amount(totalCost)
                .unitCostEligible(true)
                .status("CONFIRMED")
                .notes("Chi phÃ­ xuáº¥t kho " + tagCount + " tháº» tai RFID (" + tagMaterial.getName() + ") cho Ä‘Ã n " + group.getGroupCode())
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();
        farmExpenseRepository.save(expense);
        log.info("Auto-deducted {} ear tags (Total: {} VND, Issue: {}) and recorded expense {} for livestock group {}",
                tagCount, totalCost, issueCode, expCode, group.getGroupCode());

        return new TagDeductionResult(true, totalCost, issueCode, expCode);
    }

    private static class TagDeductionResult {
        private final boolean deducted;
        private final BigDecimal totalCost;
        private final String issueCode;
        private final String expenseCode;

        public TagDeductionResult(boolean deducted, BigDecimal totalCost, String issueCode, String expenseCode) {
            this.deducted = deducted;
            this.totalCost = totalCost;
            this.issueCode = issueCode;
            this.expenseCode = expenseCode;
        }

        public boolean deducted() { return deducted; }
        public BigDecimal totalCost() { return totalCost; }
        public String issueCode() { return issueCode; }
        public String expenseCode() { return expenseCode; }
    }

    @Override
    @Transactional
    public LivestockIndividualDetailResponse updateIndividual(Long farmId, Long id, UpdateLivestockIndividualRequest request) {
        LivestockIndividual individual = findIndividualOrThrow(farmId, id);

        if (request.getZoneId() != null) {
            individual.setZoneId(request.getZoneId());
        }
        if (request.getGroupId() != null) {
            individual.setGroupId(request.getGroupId());
        }
        if (StringUtils.hasText(request.getGender())) {
            individual.setGender(request.getGender());
        }
        if (request.getBirthDate() != null) {
            individual.setBirthDate(request.getBirthDate());
        }
        if (request.getMotherTagCode() != null) {
            individual.setMotherTagCode(request.getMotherTagCode());
        }
        if (request.getFatherTagCode() != null) {
            individual.setFatherTagCode(request.getFatherTagCode());
        }
        if (request.getCurrentWeightKg() != null) {
            individual.setCurrentWeightKg(request.getCurrentWeightKg());
        }
        if (StringUtils.hasText(request.getHealthStatus())) {
            individual.setHealthStatus(request.getHealthStatus());
        }

        individual.setUpdatedAt(Instant.now());
        individual.setUpdatedBy(SecurityUtils.getCurrentUserId());
        individual = livestockIndividualRepository.save(individual);
        return mapToIndividualDetailResponse(individual);
    }

    // ==========================================
    // 3. WEIGH-IN & ADG CALCULATION
    // ==========================================

    @Override
    @Transactional
    public WeightLogDetailResponse recordWeighIn(Long farmId, WeighInRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Strict XOR validation
        if ("INDIVIDUAL".equals(request.getTargetType())) {
            if (request.getIndividualId() == null || request.getGroupId() != null) {
                throw new BusinessException("INVALID_WEIGHT_TARGET", "Äá»‘i tÆ°á»£ng INDIVIDUAL chá»‰ cho phÃ©p truyá»n individualId (khÃ´ng truyá»n groupId)");
            }
        } else if ("GROUP".equals(request.getTargetType())) {
            if (request.getGroupId() == null || request.getIndividualId() != null) {
                throw new BusinessException("INVALID_WEIGHT_TARGET", "Äá»‘i tÆ°á»£ng GROUP chá»‰ cho phÃ©p truyá»n groupId (khÃ´ng truyá»n individualId)");
            }
        } else {
            throw new BusinessException("INVALID_TARGET_TYPE", "targetType pháº£i lÃ  GROUP hoáº·c INDIVIDUAL");
        }

        // 2. Lookup previous weight log to calculate ADG
        Optional<LivestockWeightLog> prevOpt;
        if ("INDIVIDUAL".equals(request.getTargetType())) {
            prevOpt = livestockWeightLogRepository.findTopByIndividualIdAndRecordDateLessThanOrderByRecordDateDescCreatedAtDesc(
                    request.getIndividualId(), request.getRecordDate());
        } else {
            prevOpt = livestockWeightLogRepository.findTopByGroupIdAndRecordDateLessThanOrderByRecordDateDescCreatedAtDesc(
                    request.getGroupId(), request.getRecordDate());
        }

        BigDecimal previousWeight = null;
        Long daysBetween = null;
        BigDecimal adgKgPerDay = null;

        if (prevOpt.isPresent()) {
            LivestockWeightLog prev = prevOpt.get();
            previousWeight = prev.getWeightKg();
            long days = ChronoUnit.DAYS.between(prev.getRecordDate(), request.getRecordDate());
            if (days > 0) {
                daysBetween = days;
                adgKgPerDay = request.getWeightKg().subtract(previousWeight)
                        .divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
            }
        }

        // 3. Save append-only weight log
        LivestockWeightLog logEntry = LivestockWeightLog.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .targetType(request.getTargetType())
                .individualId(request.getIndividualId())
                .groupId(request.getGroupId())
                .recordDate(request.getRecordDate())
                .weightKg(request.getWeightKg())
                .recordedByUserId(request.getRecordedByUserId() != null ? request.getRecordedByUserId() : currentUserId)
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        logEntry = livestockWeightLogRepository.save(logEntry);

        // 4. If individual, update currentWeightKg
        String rfidTagCode = null;
        if (request.getIndividualId() != null) {
            LivestockIndividual ind = livestockIndividualRepository.findById(request.getIndividualId()).orElse(null);
            if (ind != null) {
                ind.setCurrentWeightKg(request.getWeightKg());
                ind.setUpdatedAt(Instant.now());
                livestockIndividualRepository.save(ind);
                rfidTagCode = ind.getRfidTagCode();
            }
        }

        String groupCode = null;
        if (request.getGroupId() != null) {
            groupCode = livestockGroupRepository.findById(request.getGroupId()).map(LivestockGroup::getGroupCode).orElse(null);
        }

        String recorderName = null;
        if (logEntry.getRecordedByUserId() != null) {
            recorderName = userRepository.findById(logEntry.getRecordedByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        return WeightLogDetailResponse.builder()
                .id(logEntry.getId())
                .farmId(logEntry.getFarmId())
                .targetType(logEntry.getTargetType())
                .individualId(logEntry.getIndividualId())
                .rfidTagCode(rfidTagCode)
                .groupId(logEntry.getGroupId())
                .groupCode(groupCode)
                .recordDate(logEntry.getRecordDate())
                .weightKg(logEntry.getWeightKg())
                .previousWeightKg(previousWeight)
                .daysBetween(daysBetween)
                .adgKgPerDay(adgKgPerDay)
                .recordedByUserId(logEntry.getRecordedByUserId())
                .recordedByUserName(recorderName)
                .notes(logEntry.getNotes())
                .createdAt(logEntry.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WeightLogDetailResponse> getGroupWeightLogs(Long farmId, Long groupId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<LivestockWeightLog> logs = livestockWeightLogRepository.findByGroupIdOrderByRecordDateDescCreatedAtDesc(groupId);
        String groupCode = livestockGroupRepository.findById(groupId).map(LivestockGroup::getGroupCode).orElse(null);

        return logs.stream()
                .filter(l -> tenantId == null || tenantId.equals(l.getTenantId()))
                .map(l -> WeightLogDetailResponse.builder()
                        .id(l.getId())
                        .farmId(l.getFarmId())
                        .targetType(l.getTargetType())
                        .groupId(l.getGroupId())
                        .groupCode(groupCode)
                        .recordDate(l.getRecordDate())
                        .weightKg(l.getWeightKg())
                        .notes(l.getNotes())
                        .recordedByUserId(l.getRecordedByUserId())
                        .createdAt(l.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ==========================================
    // 4. LIVESTOCK EVENTS & AUTO-BACKFLUSHING
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public Page<LivestockEventDetailResponse> getEvents(Long farmId, Long groupId, Long individualId, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<LivestockEvent> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            predicates = cb.and(predicates, cb.equal(root.get("farmId"), farmId));
            predicates = cb.and(predicates, cb.equal(root.get("tenantId"), tenantId));
            if (groupId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("livestockGroupId"), groupId));
            }
            if (individualId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("livestockIndividualId"), individualId));
            }
            return predicates;
        };

        return livestockEventRepository.findAll(spec, pageable).map(this::mapToEventDetailResponse);
    }

    @Override
    @Transactional
    public LivestockEventDetailResponse createEvent(Long farmId, CreateLivestockEventRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Strict XOR validation
        if ("INDIVIDUAL".equals(request.getTargetType())) {
            if (request.getLivestockIndividualId() == null || request.getLivestockGroupId() != null) {
                throw new BusinessException("INVALID_EVENT_TARGET", "Äá»‘i tÆ°á»£ng INDIVIDUAL chá»‰ cho phÃ©p truyá»n livestockIndividualId (khÃ´ng truyá»n livestockGroupId)");
            }
        } else if ("GROUP".equals(request.getTargetType())) {
            if (request.getLivestockGroupId() == null || request.getLivestockIndividualId() != null) {
                throw new BusinessException("INVALID_EVENT_TARGET", "Äá»‘i tÆ°á»£ng GROUP chá»‰ cho phÃ©p truyá»n livestockGroupId (khÃ´ng truyá»n livestockIndividualId)");
            }
        } else {
            throw new BusinessException("INVALID_TARGET_TYPE", "targetType pháº£i lÃ  GROUP hoáº·c INDIVIDUAL");
        }

        int withdrawalDays = request.getWithdrawalDays() != null ? request.getWithdrawalDays() : 0;
        LocalDate withdrawalEndDate = request.getWithdrawalEndDate();
        if (withdrawalEndDate == null && withdrawalDays > 0) {
            withdrawalEndDate = request.getEventDate().plusDays(withdrawalDays);
        } else if (withdrawalEndDate != null && withdrawalDays == 0) {
            withdrawalDays = Math.max(0, (int) ChronoUnit.DAYS.between(request.getEventDate(), withdrawalEndDate));
        }
        boolean isQuarantined = Boolean.TRUE.equals(request.getIsQuarantined());

        // 2. Quarantine update
        if (isQuarantined) {
            if (request.getLivestockGroupId() != null) {
                livestockGroupRepository.findById(request.getLivestockGroupId()).ifPresent(g -> {
                    g.setStatus("QUARANTINED");
                    livestockGroupRepository.save(g);
                });
            } else if (request.getLivestockIndividualId() != null) {
                livestockIndividualRepository.findById(request.getLivestockIndividualId()).ifPresent(ind -> {
                    ind.setHealthStatus("QUARANTINED");
                    livestockIndividualRepository.save(ind);
                });
            }
        }

        // 3. Fluctuation in group quantity and health status
        int affected = request.getHeadCountAffected() != null ? request.getHeadCountAffected() : 0;
        if (request.getLivestockGroupId() != null) {
            if (affected == 0 && StringUtils.hasText(request.getDetailsJson())) {
                try {
                    Map<String, Object> details = objectMapper.readValue(request.getDetailsJson(), new TypeReference<>() {});
                    if (details.containsKey("birth_count")) {
                        affected = Integer.parseInt(details.get("birth_count").toString());
                    } else if (details.containsKey("slaughter_count")) {
                        affected = Integer.parseInt(details.get("slaughter_count").toString());
                    } else if (details.containsKey("affected_count")) {
                        affected = Integer.parseInt(details.get("affected_count").toString());
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse detailsJson for livestock quantity adjustments", e);
                }
            }

            if (affected > 0) {
                final int finalAffected = affected;
                livestockGroupRepository.findById(request.getLivestockGroupId()).ifPresent(g -> {
                    if ("MORTALITY".equals(request.getEventType()) || "CULLING".equals(request.getEventType())
                            || "SOLD".equals(request.getEventType()) || "SLAUGHTER".equals(request.getEventType())) {
                        int newQty = Math.max(0, g.getCurrentQuantity() - finalAffected);
                        g.setCurrentQuantity(newQty);
                        if (newQty == 0 && ("SOLD".equals(request.getEventType()) || "CULLING".equals(request.getEventType()) || "SLAUGHTER".equals(request.getEventType()))) {
                            g.setStatus("SOLD");
                        }
                        livestockGroupRepository.save(g);
                    } else if ("BIRTH".equals(request.getEventType())) {
                        g.setCurrentQuantity(g.getCurrentQuantity() + finalAffected);
                        livestockGroupRepository.save(g);
                    }
                });
            }
        } else if (request.getLivestockIndividualId() != null) {
            livestockIndividualRepository.findById(request.getLivestockIndividualId()).ifPresent(ind -> {
                if ("MORTALITY".equals(request.getEventType())) {
                    ind.setHealthStatus("DEAD");
                    livestockIndividualRepository.save(ind);
                } else if ("CULLING".equals(request.getEventType())) {
                    ind.setHealthStatus("CULLED");
                    livestockIndividualRepository.save(ind);
                } else if ("SOLD".equals(request.getEventType()) || "SLAUGHTER".equals(request.getEventType())) {
                    ind.setHealthStatus("SOLD");
                    livestockIndividualRepository.save(ind);
                } else if ("DISEASE_TREATMENT".equals(request.getEventType()) || "MEDICAL_TREATMENT".equals(request.getEventType())) {
                    ind.setHealthStatus("TREATING");
                    livestockIndividualRepository.save(ind);
                }
            });
        }

        String detailsJson = request.getDetailsJson();
        if (request.getHeadCountAffected() != null || request.getTotalCost() != null) {
            try {
                Map<String, Object> map = new HashMap<>();
                if (StringUtils.hasText(detailsJson)) {
                    map = objectMapper.readValue(detailsJson, new TypeReference<>() {});
                }
                if (request.getHeadCountAffected() != null) {
                    map.put("head_count_affected", request.getHeadCountAffected());
                }
                if (request.getTotalCost() != null) {
                    map.put("total_cost", request.getTotalCost());
                }
                detailsJson = objectMapper.writeValueAsString(map);
            } catch (Exception ex) {
                log.warn("Failed to serialize detailsJson with headCountAffected/totalCost", ex);
            }
        }

        // 4. Save LivestockEvent
        LivestockEvent event = LivestockEvent.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .targetType(request.getTargetType())
                .livestockGroupId(request.getLivestockGroupId())
                .livestockIndividualId(request.getLivestockIndividualId())
                .eventType(request.getEventType())
                .eventDate(request.getEventDate())
                .withdrawalDays(withdrawalDays)
                .withdrawalEndDate(withdrawalEndDate)
                .isQuarantined(isQuarantined)
                .detailsJson(detailsJson)
                .veterinarianUserId(request.getVeterinarianUserId() != null ? request.getVeterinarianUserId() : currentUserId)
                .isInventoryBackflushed(false)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        event = livestockEventRepository.save(event);

        // 5. Atomic Auto-Backflushing
        if (request.getSupplies() != null && !request.getSupplies().isEmpty()) {
            Map<Long, List<CreateLivestockEventRequest.LivestockEventSupplyRequest>> byWarehouse = request.getSupplies().stream()
                    .collect(Collectors.groupingBy(CreateLivestockEventRequest.LivestockEventSupplyRequest::getWarehouseId));

            for (Map.Entry<Long, List<CreateLivestockEventRequest.LivestockEventSupplyRequest>> entry : byWarehouse.entrySet()) {
                Long warehouseId = entry.getKey();
                List<CreateLivestockEventRequest.LivestockEventSupplyRequest> supplyList = entry.getValue();

                // Sort supplies deterministically to avoid deadlocks: (materialId, batchNumber)
                supplyList.sort(Comparator.comparing(CreateLivestockEventRequest.LivestockEventSupplyRequest::getMaterialId)
                        .thenComparing(CreateLivestockEventRequest.LivestockEventSupplyRequest::getBatchNumber));

                // Create WarehouseIssue
                String issueCode = "ISS-BF-LIVE-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                WarehouseIssue issue = WarehouseIssue.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(warehouseId)
                        .issueCode(issueCode)
                        .issueType("PRODUCTION_BACKFLUSH")
                        .livestockEventId(event.getId())
                        .isBackflushed(true)
                        .issueDate(request.getEventDate())
                        .totalAmount(BigDecimal.ZERO)
                        .status("COMPLETED")
                        .approvedBy(currentUserId)
                        .approvedAt(Instant.now())
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();

                issue = warehouseIssueRepository.save(issue);
                BigDecimal totalIssueAmount = BigDecimal.ZERO;

                for (var sReq : supplyList) {
                    // Lock inventory row PESSIMISTIC_WRITE
                    WarehouseInventory inv = warehouseInventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                            warehouseId, sReq.getMaterialId(), sReq.getBatchNumber())
                            .orElseThrow(() -> new InsufficientStockException(
                                    "Váº­t tÆ° #" + sReq.getMaterialId() + " lÃ´ " + sReq.getBatchNumber() + " khÃ´ng cÃ³ tá»“n kho trong kho #" + warehouseId));

                    BigDecimal available = inv.getQuantityOnHand().subtract(inv.getReservedQuantity());
                    if (available.compareTo(sReq.getActualQuantity()) < 0) {
                        throw new InsufficientStockException(
                                "KhÃ´ng Ä‘á»§ tá»“n kho kháº£ dá»¥ng cho váº­t tÆ° #" + sReq.getMaterialId() + " lÃ´ " + sReq.getBatchNumber() + ". Cáº§n: " + sReq.getActualQuantity() + ", Kháº£ dá»¥ng: " + available);
                    }

                    BigDecimal unitPrice = inv.getUnitCost() != null ? inv.getUnitCost() : BigDecimal.ZERO;
                    BigDecimal lineTotal = sReq.getActualQuantity().multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
                    totalIssueAmount = totalIssueAmount.add(lineTotal);

                    // Deduct stock
                    BigDecimal balanceBefore = inv.getQuantityOnHand();
                    BigDecimal balanceAfter = balanceBefore.subtract(sReq.getActualQuantity());
                    inv.setQuantityOnHand(balanceAfter);
                    warehouseInventoryRepository.save(inv);

                    // Create issue item
                    WarehouseIssueItem issueItem = WarehouseIssueItem.builder()
                            .issueId(issue.getId())
                            .tenantId(tenantId)
                            .materialId(sReq.getMaterialId())
                            .batchNumber(sReq.getBatchNumber())
                            .enteredUnit(sReq.getUnit())
                            .enteredQuantity(sReq.getActualQuantity())
                            .conversionFactor(BigDecimal.ONE)
                            .quantity(sReq.getActualQuantity())
                            .unitPrice(unitPrice)
                            .totalPrice(lineTotal)
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();

                    issueItem = warehouseIssueItemRepository.save(issueItem);

                    // Ledger transaction
                    WarehouseInventoryTransaction trans = WarehouseInventoryTransaction.builder()
                            .tenantId(tenantId)
                            .farmId(farmId)
                            .warehouseId(warehouseId)
                            .materialId(sReq.getMaterialId())
                            .batchNumber(sReq.getBatchNumber())
                            .transactionType("OUTWARD")
                            .referenceDocType("WAREHOUSE_ISSUE")
                            .referenceDocId(issue.getId())
                            .referenceItemId(issueItem.getId())
                            .direction("OUT")
                            .quantity(sReq.getActualQuantity())
                            .unitPrice(unitPrice)
                            .totalAmount(lineTotal)
                            .balanceBefore(balanceBefore)
                            .balanceAfter(balanceAfter)
                            .transactionDate(request.getEventDate())
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();

                    warehouseInventoryTransactionRepository.save(trans);

                    // Save LivestockEventSupply
                    LivestockEventSupply supplyEntity = LivestockEventSupply.builder()
                            .livestockEventId(event.getId())
                            .tenantId(tenantId)
                            .farmId(farmId)
                            .materialId(sReq.getMaterialId())
                            .warehouseId(warehouseId)
                            .batchNumber(sReq.getBatchNumber())
                            .actualQuantity(sReq.getActualQuantity())
                            .unit(sReq.getUnit())
                            .unitPrice(unitPrice)
                            .totalPrice(lineTotal)
                            .warehouseIssueItemId(issueItem.getId())
                            .notes(sReq.getNotes())
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();

                    livestockEventSupplyRepository.save(supplyEntity);
                }

                issue.setTotalAmount(totalIssueAmount);
                warehouseIssueRepository.save(issue);

                // Auto-create FarmExpense (#60)
                CostCategory costCategory = costCategoryRepository.findByTenantIdAndCostType(tenantId, "MATERIALS")
                        .stream().findFirst()
                        .orElseGet(() -> {
                            CostCategory newCat = CostCategory.builder()
                                    .tenantId(tenantId)
                                    .name("Chi phÃ­ Thuá»‘c/Váº¯c xin ThÃº y")
                                    .code("VET-DEFAULT")
                                    .costType("MATERIALS")
                                    .createdAt(Instant.now())
                                    .createdBy(currentUserId)
                                    .build();
                            return costCategoryRepository.save(newCat);
                        });

                String expCode = "EXP-BF-LIVE-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                FarmExpense expense = FarmExpense.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .costCategoryId(costCategory.getId())
                        .expenseCode(expCode)
                        .expenseSource("INVENTORY_BACKFLUSH")
                        .referenceId(issue.getId())
                        .livestockGroupId(event.getLivestockGroupId())
                        .expenseDate(request.getEventDate())
                        .amount(totalIssueAmount)
                        .unitCostEligible(true)
                        .status("CONFIRMED")
                        .notes("Chi phÃ­ thuá»‘c/váº¯c xin tá»± Ä‘á»™ng xuáº¥t tá»« sá»± kiá»‡n chÄƒn nuÃ´i #" + event.getId())
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();

                expense = farmExpenseRepository.save(expense);
                // budget consumed
            }

            event.setIsInventoryBackflushed(true);
            event = livestockEventRepository.save(event);
        }

        // 6. External Veterinary Service Expense (totalCost)
        if (request.getTotalCost() != null && request.getTotalCost().compareTo(BigDecimal.ZERO) > 0) {
            CostCategory serviceCat = costCategoryRepository.findByTenantIdAndCostType(tenantId, "SERVICES")
                    .stream().findFirst()
                    .orElseGet(() -> {
                        CostCategory newCat = CostCategory.builder()
                                .tenantId(tenantId)
                                .name("Chi phÃ­ Dá»‹ch vá»¥ ThÃº y")
                                .code("VET-SERVICE")
                                .costType("SERVICES")
                                .createdAt(Instant.now())
                                .createdBy(currentUserId)
                                .build();
                        return costCategoryRepository.save(newCat);
                    });

            String svcExpCode = "EXP-SVC-LIVE-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            FarmExpense svcExpense = FarmExpense.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .costCategoryId(serviceCat.getId())
                    .expenseCode(svcExpCode)
                    .expenseSource("VET_SERVICE")
                    .referenceId(event.getId())
                    .livestockGroupId(event.getLivestockGroupId())
                    .expenseDate(request.getEventDate())
                    .amount(request.getTotalCost())
                    .unitCostEligible(true)
                    .status("CONFIRMED")
                    .notes("Chi phÃ­ dá»‹ch vá»¥ thÃº y khÃ¡m/tiÃªm sá»± kiá»‡n #" + event.getId())
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();

            svcExpense = farmExpenseRepository.save(svcExpense);
            // budget consumed
        }

        log.info("Created livestock event id={} type={} on farmId={}", event.getId(), event.getEventType(), farmId);
        return mapToEventDetailResponse(event);
    }

    // ==========================================
    // HELPERS & MAPPERS
    // ==========================================

    private LivestockGroup findGroupOrThrow(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return livestockGroupRepository.findByFarmIdAndId(farmId, id)
                .filter(g -> tenantId == null || tenantId.equals(g.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("LivestockGroup", id));
    }

    private LivestockIndividual findIndividualOrThrow(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return livestockIndividualRepository.findByFarmIdAndId(farmId, id)
                .filter(ind -> tenantId == null || tenantId.equals(ind.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("LivestockIndividual", id));
    }

    private LivestockGroupDetailResponse mapToGroupDetailResponse(LivestockGroup group) {
        String zoneName = null;
        if (group.getZoneId() != null) {
            zoneName = productionZoneRepository.findById(group.getZoneId()).map(z -> z.getName()).orElse(null);
        }

        String locationName = null;
        if (group.getLocationId() != null) {
            locationName = zoneLocationRepository.findById(group.getLocationId()).map(ZoneLocation::getName).orElse(null);
        }

        String cycleName = null;
        if (group.getOperationalCycleId() != null) {
            cycleName = operationalCycleRepository.findById(group.getOperationalCycleId()).map(c -> c.getName()).orElse(null);
        }

        String breedName = null;
        if (group.getBreedId() != null) {
            breedName = livestockBreedRepository.findById(group.getBreedId()).map(b -> b.getBreedName()).orElse(null);
        }

        String partnerName = null;
        if (group.getPartnerId() != null) {
            partnerName = partnerRepository.findById(group.getPartnerId()).map(Partner::getName).orElse(null);
        }

        BigDecimal totalExpenses = farmExpenseRepository.sumConfirmedExpensesByLivestockGroupId(group.getId());
        if (totalExpenses == null) {
            totalExpenses = BigDecimal.ZERO;
        }

        LocalDate activeWithdrawalEndDate = livestockEventRepository.findMaxWithdrawalEndDateByGroupId(group.getId());
        boolean isInWithdrawalQuarantine = activeWithdrawalEndDate != null && !LocalDate.now().isAfter(activeWithdrawalEndDate);

        String mgmtType = group.getManagementType();
        if (!StringUtils.hasText(mgmtType)) {
            mgmtType = group.getBreedId() != null
                    ? livestockBreedRepository.findById(group.getBreedId()).map(LivestockBreed::getManagementType).orElse(null)
                    : null;
        }
        if (!StringUtils.hasText(mgmtType)) {
            mgmtType = "FLOCK_HERD";
        }
        int taggedCount = livestockIndividualRepository.countByGroupId(group.getId());

        String createdByName = null;
        if (group.getCreatedBy() != null) {
            createdByName = userRepository.findById(group.getCreatedBy())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                    .orElse(null);
        }

        return LivestockGroupDetailResponse.builder()
                .id(group.getId())
                .farmId(group.getFarmId())
                .zoneId(group.getZoneId())
                .zoneName(zoneName)
                .locationId(group.getLocationId())
                .locationName(locationName)
                .operationalCycleId(group.getOperationalCycleId())
                .cycleName(cycleName)
                .groupCode(group.getGroupCode())
                .breedId(group.getBreedId())
                .breedName(breedName)
                .partnerId(group.getPartnerId())
                .partnerName(partnerName)
                .initialQuantity(group.getInitialQuantity())
                .currentQuantity(group.getCurrentQuantity())
                .unitPrice(group.getUnitPrice())
                .totalCost(group.getTotalCost())
                .avgInitialWeightKg(group.getAvgInitialWeightKg())
                .healthCertificate(group.getHealthCertificate())
                .origin(group.getOrigin())
                .notes(group.getNotes())
                .entryDate(group.getEntryDate())
                .status(group.getStatus())
                .managementType(mgmtType)
                .taggedIndividualCount(taggedCount)
                .activeWithdrawalEndDate(activeWithdrawalEndDate)
                .isInWithdrawalQuarantine(isInWithdrawalQuarantine)
                .totalExpensesAmount(totalExpenses)
                .createdBy(group.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }

    private LivestockIndividualDetailResponse mapToIndividualDetailResponse(LivestockIndividual individual) {
        String zoneName = null;
        if (individual.getZoneId() != null) {
            zoneName = productionZoneRepository.findById(individual.getZoneId()).map(z -> z.getName()).orElse(null);
        }

        String groupCode = null;
        if (individual.getGroupId() != null) {
            groupCode = livestockGroupRepository.findById(individual.getGroupId()).map(LivestockGroup::getGroupCode).orElse(null);
        }

        // ADG lookup
        BigDecimal latestAdg = null;
        List<LivestockWeightLog> weightLogs = livestockWeightLogRepository.findByIndividualIdOrderByRecordDateDescCreatedAtDesc(individual.getId());
        if (weightLogs.size() >= 2) {
            LivestockWeightLog latest = weightLogs.get(0);
            LivestockWeightLog prev = weightLogs.get(1);
            long days = ChronoUnit.DAYS.between(prev.getRecordDate(), latest.getRecordDate());
            if (days > 0) {
                latestAdg = latest.getWeightKg().subtract(prev.getWeightKg())
                        .divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
            }
        }

        LocalDate activeWithdrawalEndDate = livestockEventRepository.findMaxWithdrawalEndDateByIndividualId(individual.getId());
        boolean isInWithdrawalQuarantine = activeWithdrawalEndDate != null && !LocalDate.now().isAfter(activeWithdrawalEndDate);

        return LivestockIndividualDetailResponse.builder()
                .id(individual.getId())
                .farmId(individual.getFarmId())
                .zoneId(individual.getZoneId())
                .zoneName(zoneName)
                .groupId(individual.getGroupId())
                .groupCode(groupCode)
                .rfidTagCode(individual.getRfidTagCode())
                .gender(individual.getGender())
                .birthDate(individual.getBirthDate())
                .motherTagCode(individual.getMotherTagCode())
                .fatherTagCode(individual.getFatherTagCode())
                .currentWeightKg(individual.getCurrentWeightKg())
                .healthStatus(individual.getHealthStatus())
                .latestAdgKgPerDay(latestAdg)
                .activeWithdrawalEndDate(activeWithdrawalEndDate)
                .isInWithdrawalQuarantine(isInWithdrawalQuarantine)
                .createdAt(individual.getCreatedAt())
                .updatedAt(individual.getUpdatedAt())
                .build();
    }

    private LivestockEventDetailResponse mapToEventDetailResponse(LivestockEvent event) {
        String groupCode = null;
        if (event.getLivestockGroupId() != null) {
            groupCode = livestockGroupRepository.findById(event.getLivestockGroupId()).map(LivestockGroup::getGroupCode).orElse(null);
        }

        String rfidTagCode = null;
        if (event.getLivestockIndividualId() != null) {
            rfidTagCode = livestockIndividualRepository.findById(event.getLivestockIndividualId()).map(LivestockIndividual::getRfidTagCode).orElse(null);
        }

        String vetName = null;
        if (event.getVeterinarianUserId() != null) {
            vetName = userRepository.findById(event.getVeterinarianUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        List<LivestockEventSupply> supplyEntities = livestockEventSupplyRepository.findByLivestockEventId(event.getId());
        List<LivestockEventDetailResponse.LivestockEventSupplyDto> supplies = supplyEntities.stream().map(s -> {
            Material m = materialRepository.findById(s.getMaterialId()).orElse(null);
            String whName = warehouseRepository.findById(s.getWarehouseId()).map(w -> w.getName()).orElse(null);
            return LivestockEventDetailResponse.LivestockEventSupplyDto.builder()
                    .id(s.getId())
                    .materialId(s.getMaterialId())
                    .skuCode(m != null ? m.getSkuCode() : null)
                    .materialName(m != null ? m.getName() : null)
                    .warehouseId(s.getWarehouseId())
                    .warehouseName(whName)
                    .batchNumber(s.getBatchNumber())
                    .actualQuantity(s.getActualQuantity())
                    .unit(s.getUnit())
                    .unitPrice(s.getUnitPrice())
                    .totalPrice(s.getTotalPrice())
                    .warehouseIssueItemId(s.getWarehouseIssueItemId())
                    .notes(s.getNotes())
                    .build();
        }).collect(Collectors.toList());

        return LivestockEventDetailResponse.builder()
                .id(event.getId())
                .farmId(event.getFarmId())
                .targetType(event.getTargetType())
                .livestockGroupId(event.getLivestockGroupId())
                .groupCode(groupCode)
                .livestockIndividualId(event.getLivestockIndividualId())
                .rfidTagCode(rfidTagCode)
                .eventType(event.getEventType())
                .eventDate(event.getEventDate())
                .withdrawalDays(event.getWithdrawalDays())
                .withdrawalEndDate(event.getWithdrawalEndDate())
                .isQuarantined(event.getIsQuarantined())
                .detailsJson(event.getDetailsJson())
                .veterinarianUserId(event.getVeterinarianUserId())
                .veterinarianUserName(vetName)
                .isInventoryBackflushed(event.getIsInventoryBackflushed())
                .supplies(supplies)
                .createdAt(event.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteGroup(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        LivestockGroup group = livestockGroupRepository.findById(id)
                .filter(g -> Objects.equals(g.getFarmId(), farmId))
                .filter(g -> tenantId == null || Objects.equals(g.getTenantId(), tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("LivestockGroup", id));

        group.setStatus("SOLD");
        group.setUpdatedAt(Instant.now());
        group.setUpdatedBy(SecurityUtils.getCurrentUserId());
        livestockGroupRepository.save(group);

            // farmTaskService.cancelPendingRoutineTasksForZone - FarmTask deprecated
        releaseZoneLocationsIfEmpty(tenantId, farmId, group.getZoneId());
    }

    private void releaseZoneLocationsIfEmpty(Long tenantId, Long farmId, Long zoneId) {
        if (zoneId == null) return;
        boolean hasActiveGroups = livestockGroupRepository.findAll((root, query, cb) -> cb.and(
                cb.equal(root.get("farmId"), farmId),
                cb.equal(root.get("zoneId"), zoneId),
                cb.not(root.get("status").in("SOLD", "CLOSED", "CULLED"))
        )).stream().findAny().isPresent();

        if (!hasActiveGroups) {
            var locs = zoneLocationRepository.findByZoneId(zoneId);
            for (var loc : locs) {
                if ("OCCUPIED".equalsIgnoreCase(loc.getStatus())) {
                    loc.setStatus("EMPTY");
                    loc.setUpdatedAt(Instant.now());
                    zoneLocationRepository.save(loc);
                }
            }
            log.info("Released zone locations for zoneId={} back to EMPTY", zoneId);
        }
    }

    @Override
    @Transactional
    public void deleteIndividual(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        LivestockIndividual ind = livestockIndividualRepository.findById(id)
                .filter(i -> Objects.equals(i.getFarmId(), farmId))
                .filter(i -> tenantId == null || Objects.equals(i.getTenantId(), tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("LivestockIndividual", id));

        // Kiá»ƒm tra xem Ä‘Ã£ phÃ¡t sinh sá»± kiá»‡n thÃº y hoáº·c y táº¿ nÃ o chÆ°a
        boolean hasEvents = livestockEventRepository != null && !livestockEventRepository.findByLivestockIndividualId(id).isEmpty();
        if (hasEvents) {
            // ÄÃ£ cÃ³ há»“ sÆ¡ thÃº y -> Äá»•i tráº¡ng thÃ¡i sang CULLED Ä‘á»ƒ báº£o toÃ n lá»‹ch sá»­ y táº¿
            ind.setHealthStatus("CULLED");
            ind.setUpdatedAt(Instant.now());
            ind.setUpdatedBy(SecurityUtils.getCurrentUserId());
            livestockIndividualRepository.save(ind);
            log.info("Marked individual id={} tag={} as CULLED due to existing veterinary events", id, ind.getRfidTagCode());
        } else {
            // XÃ³a nháº­t kÃ½ cÃ¢n náº¿u cÃ³ liÃªn káº¿t
            if (livestockWeightLogRepository != null) {
                var logs = livestockWeightLogRepository.findByIndividualIdOrderByRecordDateDescCreatedAtDesc(id);
                if (!logs.isEmpty()) {
                    livestockWeightLogRepository.deleteAll(logs);
                }
            }
            // ChÆ°a phÃ¡t sinh sá»± kiá»‡n y táº¿ -> Cho phÃ©p xÃ³a hoÃ n toÃ n khá»i há»‡ thá»‘ng (nháº­p nháº§m mÃ£ tháº»)
            livestockIndividualRepository.delete(ind);
            log.info("Physically deleted mistakenly tagged individual id={} tag={}", id, ind.getRfidTagCode());
        }
    }
}
