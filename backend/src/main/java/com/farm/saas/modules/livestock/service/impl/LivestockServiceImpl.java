package com.farm.saas.modules.livestock.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.InsufficientStockException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.livestock.service.LivestockService;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.geography.repository.OperationalCycleRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
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
import com.farm.saas.modules.masterdata.entity.Material;
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
    private final MaterialRepository materialRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseIssueRepository warehouseIssueRepository;
    private final WarehouseIssueItemRepository warehouseIssueItemRepository;
    private final WarehouseInventoryTransactionRepository warehouseInventoryTransactionRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final com.farm.saas.modules.hr.service.FarmTaskService farmTaskService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

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
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        String groupCode = request.getGroupCode();
        if (!StringUtils.hasText(groupCode)) {
            groupCode = "LG-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        if (livestockGroupRepository.existsByTenantIdAndFarmIdAndGroupCode(tenantId, farmId, groupCode)) {
            throw new BusinessException("DUPLICATE_GROUP_CODE", "Mã đàn đã tồn tại: " + groupCode);
        }

        LivestockGroup group = LivestockGroup.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .zoneId(request.getZoneId())
                .operationalCycleId(request.getOperationalCycleId())
                .groupCode(groupCode)
                .breedId(request.getBreedId())
                .initialQuantity(request.getInitialQuantity())
                .currentQuantity(request.getInitialQuantity())
                .entryDate(request.getEntryDate())
                .status("ACTIVE")
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        group = livestockGroupRepository.save(group);
        log.info("Created livestock group id={}, code={} on farmId={}", group.getId(), group.getGroupCode(), farmId);
        return mapToGroupDetailResponse(group);
    }

    @Override
    @Transactional
    public LivestockGroupDetailResponse updateGroup(Long farmId, Long id, UpdateLivestockGroupRequest request) {
        LivestockGroup group = findGroupOrThrow(farmId, id);

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

        group.setUpdatedAt(Instant.now());
        group.setUpdatedBy(SecurityUtils.getCurrentUserId());
        group = livestockGroupRepository.save(group);

        if (("SOLD".equalsIgnoreCase(group.getStatus()) || "CULLED".equalsIgnoreCase(group.getStatus()))
                && !group.getStatus().equalsIgnoreCase(oldStatus)) {
            farmTaskService.cancelPendingRoutineTasksForZone(farmId, group.getZoneId(), "Tự động kết thúc do đã thu hoạch / xuất chuồng");
        }

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
            throw new BusinessException("DUPLICATE_RFID_TAG", "Mã thẻ RFID đã tồn tại trong hệ thống: " + request.getRfidTagCode());
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
        return mapToIndividualDetailResponse(individual);
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
                throw new BusinessException("INVALID_WEIGHT_TARGET", "Đối tượng INDIVIDUAL chỉ cho phép truyền individualId (không truyền groupId)");
            }
        } else if ("GROUP".equals(request.getTargetType())) {
            if (request.getGroupId() == null || request.getIndividualId() != null) {
                throw new BusinessException("INVALID_WEIGHT_TARGET", "Đối tượng GROUP chỉ cho phép truyền groupId (không truyền individualId)");
            }
        } else {
            throw new BusinessException("INVALID_TARGET_TYPE", "targetType phải là GROUP hoặc INDIVIDUAL");
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
                throw new BusinessException("INVALID_EVENT_TARGET", "Đối tượng INDIVIDUAL chỉ cho phép truyền livestockIndividualId (không truyền livestockGroupId)");
            }
        } else if ("GROUP".equals(request.getTargetType())) {
            if (request.getLivestockGroupId() == null || request.getLivestockIndividualId() != null) {
                throw new BusinessException("INVALID_EVENT_TARGET", "Đối tượng GROUP chỉ cho phép truyền livestockGroupId (không truyền livestockIndividualId)");
            }
        } else {
            throw new BusinessException("INVALID_TARGET_TYPE", "targetType phải là GROUP hoặc INDIVIDUAL");
        }

        int withdrawalDays = request.getWithdrawalDays() != null ? request.getWithdrawalDays() : 0;
        LocalDate withdrawalEndDate = withdrawalDays > 0 ? request.getEventDate().plusDays(withdrawalDays) : null;
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

        // 3. Fluctuation in group quantity if BIRTH or SLAUGHTER
        if (request.getLivestockGroupId() != null && StringUtils.hasText(request.getDetailsJson())) {
            try {
                Map<String, Object> details = objectMapper.readValue(request.getDetailsJson(), new TypeReference<>() {});
                if ("BIRTH".equals(request.getEventType()) && details.containsKey("birth_count")) {
                    int count = Integer.parseInt(details.get("birth_count").toString());
                    livestockGroupRepository.findById(request.getLivestockGroupId()).ifPresent(g -> {
                        g.setCurrentQuantity(g.getCurrentQuantity() + count);
                        livestockGroupRepository.save(g);
                    });
                } else if ("SLAUGHTER".equals(request.getEventType()) && details.containsKey("slaughter_count")) {
                    int count = Integer.parseInt(details.get("slaughter_count").toString());
                    livestockGroupRepository.findById(request.getLivestockGroupId()).ifPresent(g -> {
                        int newQty = Math.max(0, g.getCurrentQuantity() - count);
                        g.setCurrentQuantity(newQty);
                        livestockGroupRepository.save(g);
                    });
                }
            } catch (Exception e) {
                log.warn("Failed to parse detailsJson for livestock quantity adjustments", e);
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
                .detailsJson(request.getDetailsJson())
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
                                    "Vật tư #" + sReq.getMaterialId() + " lô " + sReq.getBatchNumber() + " không có tồn kho trong kho #" + warehouseId));

                    BigDecimal available = inv.getQuantityOnHand().subtract(inv.getReservedQuantity());
                    if (available.compareTo(sReq.getActualQuantity()) < 0) {
                        throw new InsufficientStockException(
                                "Không đủ tồn kho khả dụng cho vật tư #" + sReq.getMaterialId() + " lô " + sReq.getBatchNumber() + ". Cần: " + sReq.getActualQuantity() + ", Khả dụng: " + available);
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
                                    .name("Chi phí Thuốc/Vắc xin Thú y")
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
                        .notes("Chi phí thuốc/vắc xin tự động xuất từ sự kiện chăn nuôi #" + event.getId())
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();

                farmExpenseRepository.save(expense);
            }

            event.setIsInventoryBackflushed(true);
            event = livestockEventRepository.save(event);
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

        String cycleName = null;
        if (group.getOperationalCycleId() != null) {
            cycleName = operationalCycleRepository.findById(group.getOperationalCycleId()).map(c -> c.getName()).orElse(null);
        }

        String breedName = null;
        if (group.getBreedId() != null) {
            breedName = livestockBreedRepository.findById(group.getBreedId()).map(b -> b.getBreedName()).orElse(null);
        }

        BigDecimal totalExpenses = farmExpenseRepository.sumConfirmedExpensesByLivestockGroupId(group.getId());
        if (totalExpenses == null) {
            totalExpenses = BigDecimal.ZERO;
        }

        LocalDate activeWithdrawalEndDate = livestockEventRepository.findMaxWithdrawalEndDateByGroupId(group.getId());
        boolean isInWithdrawalQuarantine = activeWithdrawalEndDate != null && !LocalDate.now().isAfter(activeWithdrawalEndDate);

        return LivestockGroupDetailResponse.builder()
                .id(group.getId())
                .farmId(group.getFarmId())
                .zoneId(group.getZoneId())
                .zoneName(zoneName)
                .operationalCycleId(group.getOperationalCycleId())
                .cycleName(cycleName)
                .groupCode(group.getGroupCode())
                .breedId(group.getBreedId())
                .breedName(breedName)
                .initialQuantity(group.getInitialQuantity())
                .currentQuantity(group.getCurrentQuantity())
                .entryDate(group.getEntryDate())
                .status(group.getStatus())
                .activeWithdrawalEndDate(activeWithdrawalEndDate)
                .isInWithdrawalQuarantine(isInWithdrawalQuarantine)
                .totalExpensesAmount(totalExpenses)
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
}
