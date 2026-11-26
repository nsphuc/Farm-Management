package com.farm.saas.modules.addons.service.impl;

import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.addons.dto.AddonsDto.*;
import com.farm.saas.modules.addons.entity.*;
import com.farm.saas.modules.addons.repository.*;
import com.farm.saas.modules.addons.service.AddonsOperationsService;
import com.farm.saas.modules.auth.dto.request.CreateCustomRoleRequest;
import com.farm.saas.modules.auth.dto.request.UpdateCustomRoleRequest;
import com.farm.saas.modules.auth.dto.response.RoleMatrixResponse;
import com.farm.saas.modules.auth.entity.FarmAddOnSubscription;
import com.farm.saas.modules.auth.repository.FarmAddOnSubscriptionRepository;
import com.farm.saas.modules.auth.service.UserService;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.entity.ZoneLocation;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryTransactionRepository;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddonsOperationsServiceImpl implements AddonsOperationsService {

    private final PayrollSheetRepository payrollSheetRepository;
    private final BreedingAnimalRepository breedingAnimalRepository;
    private final HatcheryBatchRepository hatcheryBatchRepository;
    private final FeedProductionBomRepository feedProductionBomRepository;
    private final FeedProductionOrderRepository feedProductionOrderRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final FarmAddOnSubscriptionRepository addonSubscriptionRepository;
    private final UserService userService;
    private final ZoneLocationRepository zoneLocationRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final LivestockBreedRepository livestockBreedRepository;
    private final MaterialRepository materialRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseInventoryTransactionRepository warehouseInventoryTransactionRepository;

    private void validateAddon(Long farmId, String addonCode) {
        if (farmId == null || farmId <= 0) return;
        FarmAddOnSubscription sub = addonSubscriptionRepository.findByFarmIdAndAddonCode(farmId, addonCode).orElse(null);
        if (sub == null || !"ACTIVE".equalsIgnoreCase(sub.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ADDON_NOT_SUBSCRIBED",
                    "Dịch vụ mở rộng " + addonCode + " chưa được kích hoạt cho trang trại này. Vui lòng nâng cấp gói tại Thiết lập chung.");
        }
    }

    // =========================================================================
    // 1. LƯƠNG & CHẤM CÔNG KPI
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<PayrollSheet> getPayrollSheets(Long farmId, Long branchId, String periodMonth) {
        validateAddon(farmId, "PAYROLL");
        String month = (periodMonth != null && !periodMonth.isBlank()) ? periodMonth.trim() : "2026-11";
        if (branchId != null && branchId > 0) {
            return payrollSheetRepository.findByFarmIdAndBranchIdAndPeriodMonth(farmId, branchId, month);
        }
        return payrollSheetRepository.findByFarmIdAndPeriodMonth(farmId, month);
    }

    @Override
    @Transactional
    public PayrollSheet updatePayrollSheet(Long farmId, Long id, UpdatePayrollRequest req) {
        validateAddon(farmId, "PAYROLL");
        PayrollSheet sheet = payrollSheetRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SHEET_NOT_FOUND", "Không tìm thấy dòng lương"));

        if ("PAID".equalsIgnoreCase(sheet.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ALREADY_PAID", "Bảng lương này đã chốt chi trả, không thể chỉnh sửa");
        }

        if (req.getActualWorkDays() != null) sheet.setActualWorkDays(req.getActualWorkDays());
        if (req.getKpiBonus() != null) sheet.setKpiBonus(req.getKpiBonus());
        if (req.getAllowance() != null) sheet.setAllowance(req.getAllowance());
        if (req.getAdvanceDeduction() != null) sheet.setAdvanceDeduction(req.getAdvanceDeduction());
        if (req.getNotes() != null) sheet.setNotes(req.getNotes());

        // Recalculate netSalary
        BigDecimal dailyRate = sheet.getBaseSalary().divide(sheet.getStandardWorkDays(), 2, RoundingMode.HALF_UP);
        BigDecimal baseEarned = dailyRate.multiply(sheet.getActualWorkDays());
        BigDecimal net = baseEarned
                .add(sheet.getKpiBonus())
                .add(sheet.getAllowance())
                .subtract(sheet.getAdvanceDeduction());
        sheet.setNetSalary(net.compareTo(BigDecimal.ZERO) > 0 ? net : BigDecimal.ZERO);

        return payrollSheetRepository.save(sheet);
    }

    @Override
    @Transactional
    public void closeAndPayPayroll(Long farmId, Long branchId, String periodMonth, ClosePayrollRequest req) {
        validateAddon(farmId, "PAYROLL");
        String month = (periodMonth != null && !periodMonth.isBlank()) ? periodMonth.trim() : "2026-11";
        List<PayrollSheet> sheets = (branchId != null && branchId > 0)
                ? payrollSheetRepository.findByFarmIdAndBranchIdAndPeriodMonth(farmId, branchId, month)
                : payrollSheetRepository.findByFarmIdAndPeriodMonth(farmId, month);

        if (sheets.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_PAYROLL_DATA", "Không có dữ liệu lương cần chi trả trong kỳ này");
        }

        BigDecimal totalPayment = BigDecimal.ZERO;
        for (PayrollSheet s : sheets) {
            if (!"PAID".equalsIgnoreCase(s.getStatus())) {
                totalPayment = totalPayment.add(s.getNetSalary());
                s.setStatus("PAID");
                s.setPaidAt(LocalDateTime.now());
                s.setAdvanceDeduction(BigDecimal.ZERO); // Reset advance to 0
            }
        }
        payrollSheetRepository.saveAll(sheets);

        // Tự động sinh Phiếu Chi trên Sổ quỹ
        if (totalPayment.compareTo(BigDecimal.ZERO) > 0) {
            FarmExpense expense = new FarmExpense();
            expense.setTenantId(farmId);
            expense.setFarmId(farmId);
            expense.setBranchId(branchId);
            expense.setExpenseCode("CHI-LUONG-" + month.replace("-", "") + "-" + (System.currentTimeMillis() % 1000));
            expense.setExpenseSource("PAYROLL");
            expense.setCostCategoryId(1L);
            expense.setEntryType("EXPENSE");
            expense.setCategoryName("Chi phí nhân công");
            expense.setNotes("Chốt bảng lương và chi trả kỳ " + month + " (" + sheets.size() + " nhân viên)");
            expense.setAmount(totalPayment);
            expense.setExpenseDate(LocalDate.now());
            expense.setPaymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "BANK_TRANSFER");
            expense.setUnitCostEligible(true);
            expense.setStatus("CONFIRMED");
            expense.setIsSystemLocked(true);
            expense.setCreatedAt(java.time.Instant.now());
            farmExpenseRepository.save(expense);
        }
    }

    // =========================================================================
    // 2. MỞ RỘNG VAI TRÒ (CUSTOM ROLES)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<RoleMatrixResponse> getCustomRoles(Long farmId) {
        validateAddon(farmId, "CUSTOM_ROLES");
        return userService.getRolesForFarm(farmId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleMatrixResponse.PermissionDto> getAllPermissions(Long farmId) {
        validateAddon(farmId, "CUSTOM_ROLES");
        return userService.getAllPermissions();
    }

    @Override
    @Transactional
    public RoleMatrixResponse createCustomRole(Long farmId, CreateCustomRoleRequest req) {
        validateAddon(farmId, "CUSTOM_ROLES");
        return userService.createCustomRole(farmId, req);
    }

    @Override
    @Transactional
    public RoleMatrixResponse updateCustomRole(Long farmId, Long roleId, UpdateCustomRoleRequest req) {
        validateAddon(farmId, "CUSTOM_ROLES");
        return userService.updateCustomRole(farmId, roleId, req);
    }

    @Override
    @Transactional
    public void deleteCustomRole(Long farmId, Long roleId) {
        validateAddon(farmId, "CUSTOM_ROLES");
        userService.deleteCustomRole(farmId, roleId);
    }

    // =========================================================================
    // 3. GIA SÚC SINH SẢN THEO THẺ TAI
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public BreedingSummaryResponse getBreedingSummary(Long farmId, Long branchId) {
        validateAddon(farmId, "BREEDING");
        List<BreedingAnimal> list = (branchId != null && branchId > 0)
                ? breedingAnimalRepository.findByFarmIdAndBranchIdOrderByTagCodeAsc(farmId, branchId)
                : breedingAnimalRepository.findByFarmIdOrderByTagCodeAsc(farmId);
        long total = list.size();
        long pregnant = list.stream().filter(a -> "PREGNANT".equalsIgnoreCase(a.getReproductiveStatus())).count();
        long lactating = list.stream().filter(a -> "LACTATING".equalsIgnoreCase(a.getReproductiveStatus())).count();
        long heifer = list.stream().filter(a -> "HEIFER".equalsIgnoreCase(a.getReproductiveStatus())).count();
        long mating = list.stream().filter(a -> "MATING".equalsIgnoreCase(a.getReproductiveStatus())).count();

        double avgBorn = list.stream()
                .filter(a -> a.getBornAliveCount() != null && a.getBornAliveCount() > 0)
                .mapToInt(BreedingAnimal::getBornAliveCount)
                .average()
                .orElse(0.0);

        return BreedingSummaryResponse.builder()
                .totalSows(total)
                .pregnantCount(pregnant)
                .lactatingCount(lactating)
                .heiferCount(heifer)
                .matingCount(mating)
                .avgBornAlive(Math.round(avgBorn * 10.0) / 10.0)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BreedingAnimal> getBreedingAnimals(Long farmId, Long branchId, String status, String keyword) {
        validateAddon(farmId, "BREEDING");
        List<BreedingAnimal> list = (branchId != null && branchId > 0)
                ? breedingAnimalRepository.findByFarmIdAndBranchIdOrderByTagCodeAsc(farmId, branchId)
                : breedingAnimalRepository.findByFarmIdOrderByTagCodeAsc(farmId);

        return list.stream()
                .filter(a -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                        if (!status.equalsIgnoreCase(a.getReproductiveStatus())) return false;
                    }
                    if (keyword != null && !keyword.isBlank()) {
                        String q = keyword.toLowerCase().trim();
                        return a.getTagCode().toLowerCase().contains(q) || a.getBreedName().toLowerCase().contains(q);
                    }
                    return true;
                })
                .toList();
    }

    @Override
    @Transactional
    public BreedingAnimal createBreedingAnimal(Long farmId, BreedingAnimalRequest req) {
        validateAddon(farmId, "BREEDING");
        LocalDate mating = req.getMatingDate();
        LocalDate expectedBirth = mating != null ? mating.plusDays(114) : null;

        BreedingAnimal animal = BreedingAnimal.builder()
                .tenantId(farmId)
                .farmId(farmId)
                .branchId(req.getBranchId())
                .tagCode(req.getTagCode().trim().toUpperCase())
                .breedName(req.getBreedName().trim())
                .parity(req.getParity() != null ? req.getParity() : 1)
                .reproductiveStatus(req.getReproductiveStatus() != null ? req.getReproductiveStatus() : "PREGNANT")
                .matingDate(mating)
                .expectedBirthDate(expectedBirth)
                .bornAliveCount(req.getBornAliveCount() != null ? req.getBornAliveCount() : 0)
                .weanedCount(req.getWeanedCount() != null ? req.getWeanedCount() : 0)
                .barnName(req.getBarnName() != null ? req.getBarnName() : "Chuồng Nái Đẻ A1")
                .notes(req.getNotes())
                .build();

        return breedingAnimalRepository.save(animal);
    }

    @Override
    @Transactional
    public BreedingAnimal updateBreedingAnimal(Long farmId, Long id, BreedingAnimalRequest req) {
        validateAddon(farmId, "BREEDING");
        BreedingAnimal animal = breedingAnimalRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ANIMAL_NOT_FOUND", "Không tìm thấy cá thể"));

        if (req.getTagCode() != null) animal.setTagCode(req.getTagCode().trim().toUpperCase());
        if (req.getBreedName() != null) animal.setBreedName(req.getBreedName().trim());
        if (req.getParity() != null) animal.setParity(req.getParity());
        if (req.getReproductiveStatus() != null) animal.setReproductiveStatus(req.getReproductiveStatus());
        if (req.getMatingDate() != null) {
            animal.setMatingDate(req.getMatingDate());
            animal.setExpectedBirthDate(req.getMatingDate().plusDays(114));
        }
        if (req.getBornAliveCount() != null) animal.setBornAliveCount(req.getBornAliveCount());
        if (req.getWeanedCount() != null) animal.setWeanedCount(req.getWeanedCount());
        if (req.getBarnName() != null) animal.setBarnName(req.getBarnName());
        if (req.getNotes() != null) animal.setNotes(req.getNotes());

        return breedingAnimalRepository.save(animal);
    }

    @Override
    @Transactional
    public BreedingAnimal recordBreedingEvent(Long farmId, Long id, BreedingEventRequest req) {
        validateAddon(farmId, "BREEDING");
        BreedingAnimal animal = breedingAnimalRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ANIMAL_NOT_FOUND", "Không tìm thấy cá thể"));

        String type = req.getEventType() != null ? req.getEventType().toUpperCase() : "MATING";
        LocalDate date = req.getEventDate() != null ? req.getEventDate() : LocalDate.now();

        if ("MATING".equals(type)) {
            animal.setMatingDate(date);
            animal.setExpectedBirthDate(date.plusDays(114)); // Heo mang thai 114 ngày
            animal.setReproductiveStatus("PREGNANT");
            animal.setNotes("Phối giống ngày " + date + (req.getNotes() != null ? ": " + req.getNotes() : ""));
        } else if ("BIRTH".equals(type)) {
            animal.setActualBirthDate(date);
            animal.setReproductiveStatus("LACTATING");
            animal.setParity(animal.getParity() + 1);
            if (req.getBornAliveCount() != null) animal.setBornAliveCount(req.getBornAliveCount());
            if (req.getWeanedCount() != null) animal.setWeanedCount(req.getWeanedCount());
            animal.setNotes("Đẻ ngày " + date + " được " + animal.getBornAliveCount() + " con còn sống");
        } else if ("WEANING".equals(type)) {
            animal.setReproductiveStatus("MATING");
            animal.setNotes("Cai sữa ngày " + date + ", sẵn sàng lên giống chu kỳ tiếp theo");
        }

        return breedingAnimalRepository.save(animal);
    }

    @Override
    @Transactional
    public void deleteBreedingAnimal(Long farmId, Long id) {
        validateAddon(farmId, "BREEDING");
        breedingAnimalRepository.deleteById(id);
    }

    // =========================================================================
    // 4. ẤP NỞ & TRỨNG GIỐNG
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public HatcherySummaryResponse getHatcherySummary(Long farmId) {
        validateAddon(farmId, "POULTRY_HATCHERY");
        List<HatcheryBatch> list = hatcheryBatchRepository.findByFarmIdOrderBySetDateDesc(farmId);

        long totalIncubating = list.stream()
                .filter(b -> "INCUBATING".equalsIgnoreCase(b.getStatus()))
                .mapToInt(HatcheryBatch::getTotalEggs)
                .sum();

        long totalSet = list.stream().mapToInt(HatcheryBatch::getTotalEggs).sum();
        long totalFertile = list.stream().mapToInt(HatcheryBatch::getFertileEggs).sum();
        long totalHatched = list.stream().mapToInt(HatcheryBatch::getActualHatchedCount).sum();

        double fertilityRate = totalSet > 0 ? (double) totalFertile * 100.0 / totalSet : 0.0;
        double hatchRate = totalFertile > 0 ? (double) totalHatched * 100.0 / totalFertile : 0.0;

        return HatcherySummaryResponse.builder()
                .totalIncubatingEggs(totalIncubating)
                .fertilityRate(Math.round(fertilityRate * 10.0) / 10.0)
                .hatchRate(Math.round(hatchRate * 10.0) / 10.0)
                .totalHatchedThisMonth(totalHatched)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<HatcheryBatch> getHatcheryBatches(Long farmId, Long branchId, String status, String eggType) {
        validateAddon(farmId, "POULTRY_HATCHERY");
        List<HatcheryBatch> list = (branchId != null && branchId > 0)
                ? hatcheryBatchRepository.findByFarmIdAndBranchIdOrderBySetDateDesc(farmId, branchId)
                : hatcheryBatchRepository.findByFarmIdOrderBySetDateDesc(farmId);

        return list.stream()
                .filter(b -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                        if (!status.equalsIgnoreCase(b.getStatus())) return false;
                    }
                    if (eggType != null && !eggType.isBlank() && !"ALL".equalsIgnoreCase(eggType)) {
                        if (!eggType.equalsIgnoreCase(b.getEggType())) return false;
                    }
                    return true;
                })
                .toList();
    }

    @Override
    @Transactional
    public HatcheryBatch createHatcheryBatch(Long farmId, CreateHatcheryBatchRequest req) {
        validateAddon(farmId, "POULTRY_HATCHERY");
        LocalDate setDate = req.getSetDate() != null ? req.getSetDate() : LocalDate.now();
        boolean isDuck = "DUCK".equalsIgnoreCase(req.getEggType());
        LocalDate expectedHatch = setDate.plusDays(isDuck ? 28 : 21); // Gà 21 ngày, Vịt 28 ngày

        String code = req.getBatchCode() != null && !req.getBatchCode().isBlank()
                ? req.getBatchCode().trim().toUpperCase()
                : "AP-" + (isDuck ? "VIT-" : "GA-") + System.currentTimeMillis() % 10000;

        HatcheryBatch batch = HatcheryBatch.builder()
                .tenantId(farmId)
                .farmId(farmId)
                .branchId(req.getBranchId())
                .batchCode(code)
                .eggType(isDuck ? "DUCK" : "CHICKEN")
                .breedName(req.getBreedName() != null ? req.getBreedName() : (isDuck ? "Vịt Cherry Valley" : "Gà Ri cao sản"))
                .setDate(setDate)
                .totalEggs(req.getTotalEggs() != null ? req.getTotalEggs() : 1000)
                .fertileEggs(req.getFertileEggs() != null ? req.getFertileEggs() : Math.round((req.getTotalEggs() != null ? req.getTotalEggs() : 1000) * 0.95f))
                .expectedHatchDate(expectedHatch)
                .destinationBarnName(req.getDestinationBarnName() != null ? req.getDestinationBarnName() : "Chuồng Úm A1")
                .status("INCUBATING")
                .notes(req.getNotes())
                .build();

        return hatcheryBatchRepository.save(batch);
    }

    @Override
    @Transactional
    public HatcheryBatch updateCandling(Long farmId, Long id, Integer fertileEggs) {
        validateAddon(farmId, "POULTRY_HATCHERY");
        HatcheryBatch batch = hatcheryBatchRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BATCH_NOT_FOUND", "Không tìm thấy mẻ ấp"));

        if (fertileEggs != null) {
            batch.setFertileEggs(fertileEggs);
        }
        return hatcheryBatchRepository.save(batch);
    }

    @Override
    @Transactional
    public HatcheryBatch finalizeHatch(Long farmId, Long id, FinalizeHatchRequest req) {
        validateAddon(farmId, "POULTRY_HATCHERY");
        HatcheryBatch batch = hatcheryBatchRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BATCH_NOT_FOUND", "Không tìm thấy mẻ ấp"));

        batch.setStatus("HATCHED");
        int hatchedCount = req.getActualHatchedCount() != null ? req.getActualHatchedCount() : 0;
        if (req.getActualHatchedCount() != null) batch.setActualHatchedCount(hatchedCount);
        if (req.getCullCount() != null) batch.setCullCount(req.getCullCount());
        if (req.getDestinationBarnName() != null) batch.setDestinationBarnName(req.getDestinationBarnName());
        if (req.getNotes() != null) batch.setNotes(req.getNotes());

        HatcheryBatch savedBatch = hatcheryBatchRepository.save(batch);

        // Liên thông Khu nuôi: tự động mở lứa nuôi (LivestockGroup) vào Chuồng nuôi đã chọn
        if (hatchedCount > 0) {
            ZoneLocation targetBarn = null;
            if (req.getDestinationBarnId() != null) {
                targetBarn = zoneLocationRepository.findById(req.getDestinationBarnId()).orElse(null);
            }
            if (targetBarn == null && savedBatch.getDestinationBarnName() != null && !savedBatch.getDestinationBarnName().isBlank()) {
                String targetName = savedBatch.getDestinationBarnName().trim().toLowerCase();
                List<Long> farmZoneIds = productionZoneRepository.findByFarmId(farmId).stream()
                        .map(ProductionZone::getId)
                        .toList();
                targetBarn = zoneLocationRepository.findAll().stream()
                        .filter(loc -> farmZoneIds.contains(loc.getZoneId())
                                && loc.getName() != null
                                && (loc.getName().trim().toLowerCase().equals(targetName)
                                || loc.getName().trim().toLowerCase().contains(targetName)
                                || targetName.contains(loc.getName().trim().toLowerCase())))
                        .findFirst()
                        .orElse(null);
            }

            if (targetBarn != null) {
                if (savedBatch.getDestinationBarnName() == null || savedBatch.getDestinationBarnName().isBlank()) {
                    savedBatch.setDestinationBarnName(targetBarn.getName());
                    hatcheryBatchRepository.save(savedBatch);
                }
                Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : farmId;
                ProductionZone zone = targetBarn.getZoneId() != null
                        ? productionZoneRepository.findById(targetBarn.getZoneId()).orElse(null)
                        : null;
                Long resolvedBranchId = savedBatch.getBranchId() != null
                        ? savedBatch.getBranchId()
                        : (zone != null ? zone.getBranchId() : null);

                List<LivestockBreed> breeds = livestockBreedRepository.findByTenantId(tenantId);
                if (breeds.isEmpty()) breeds = livestockBreedRepository.findAll();
                final boolean isDuck = "DUCK".equalsIgnoreCase(savedBatch.getEggType());
                Long resolvedBreedId = breeds.stream()
                        .filter(b -> {
                            String sp = (b.getSpecies() != null ? b.getSpecies() : "").toUpperCase();
                            return isDuck ? sp.contains("DUCK") : sp.contains("POULTRY") || sp.contains("CHICKEN");
                        })
                        .map(LivestockBreed::getId)
                        .findFirst()
                        .orElse(breeds.isEmpty() ? 1L : breeds.get(0).getId());

                List<LivestockGroup> activeGroups = livestockGroupRepository.findByLocationIdAndStatus(targetBarn.getId(), "ACTIVE");
                if (!activeGroups.isEmpty()) {
                    LivestockGroup existing = activeGroups.get(0);
                    existing.setInitialQuantity(existing.getInitialQuantity() + hatchedCount);
                    existing.setCurrentQuantity(existing.getCurrentQuantity() + hatchedCount);
                    existing.setUpdatedAt(Instant.now());
                    livestockGroupRepository.save(existing);
                } else {
                    String batchCode = "LUA-" + savedBatch.getBatchCode().replaceAll("[^A-Z0-9-]", "") + "-" + (System.currentTimeMillis() % 1000);
                    LivestockGroup newGroup = LivestockGroup.builder()
                            .tenantId(tenantId)
                            .farmId(farmId)
                            .branchId(resolvedBranchId)
                            .zoneId(targetBarn.getZoneId())
                            .locationId(targetBarn.getId())
                            .breedId(resolvedBreedId)
                            .groupCode(batchCode)
                            .initialQuantity(hatchedCount)
                            .currentQuantity(hatchedCount)
                            .unitPrice(BigDecimal.ZERO)
                            .totalCost(BigDecimal.ZERO)
                            .avgInitialWeightKg(BigDecimal.valueOf(0.045))
                            .entryDate(LocalDate.now())
                            .status("ACTIVE")
                            .managementType("GROUP")
                            .origin("Xuất từ lò ấp — Mẻ " + savedBatch.getBatchCode())
                            .notes("Tự động nhận đàn từ mẻ ấp " + savedBatch.getBatchCode() + " (" + hatchedCount + " con 1 ngày tuổi)")
                            .createdAt(Instant.now())
                            .createdBy(SecurityUtils.getCurrentUserId())
                            .build();
                    livestockGroupRepository.save(newGroup);
                }
            }
        }

        return savedBatch;
    }

    @Override
    @Transactional
    public void deleteHatcheryBatch(Long farmId, Long id) {
        validateAddon(farmId, "POULTRY_HATCHERY");
        hatcheryBatchRepository.deleteById(id);
    }

    // =========================================================================
    // 5. SẢN XUẤT PHỐI TRỘN CÁM (FEED PRODUCTION)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<FeedProductionBom> getBoms(Long farmId) {
        validateAddon(farmId, "FEED_MILL");
        return feedProductionBomRepository.findByFarmIdOrderByCodeAsc(farmId);
    }

    @Override
    @Transactional
    public FeedProductionBom createBom(Long farmId, CreateFeedBomRequest req) {
        validateAddon(farmId, "FEED_MILL");
        FeedProductionBom bom = FeedProductionBom.builder()
                .tenantId(farmId)
                .farmId(farmId)
                .code(req.getCode().trim().toUpperCase())
                .name(req.getName().trim())
                .targetSpecies(req.getTargetSpecies() != null ? req.getTargetSpecies() : "SWINE")
                .batchWeightKg(req.getBatchWeightKg() != null ? req.getBatchWeightKg() : BigDecimal.valueOf(100.0))
                .description(req.getDescription())
                .isActive(true)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<FeedProductionBomItem> items = new ArrayList<>();
        if (req.getItems() != null) {
            for (BomItemDto d : req.getItems()) {
                BigDecimal qty = d.getQuantityKg() != null ? d.getQuantityKg() : BigDecimal.ZERO;
                BigDecimal price = d.getUnitPrice() != null ? d.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal amt = qty.multiply(price);
                total = total.add(amt);

                items.add(FeedProductionBomItem.builder()
                        .bom(bom)
                        .materialId(d.getMaterialId())
                        .materialName(d.getMaterialName())
                        .quantityKg(qty)
                        .unitPrice(price)
                        .amount(amt)
                        .build());
            }
        }
        bom.setItems(items);
        bom.setTotalCost(total);
        bom.setCostPerKg(bom.getBatchWeightKg().compareTo(BigDecimal.ZERO) > 0
                ? total.divide(bom.getBatchWeightKg(), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO);

        return feedProductionBomRepository.save(bom);
    }

    @Override
    @Transactional
    public FeedProductionBom updateBom(Long farmId, Long id, CreateFeedBomRequest req) {
        validateAddon(farmId, "FEED_MILL");
        FeedProductionBom bom = feedProductionBomRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BOM_NOT_FOUND", "Không tìm thấy công thức BOM"));

        if (req.getName() != null) bom.setName(req.getName().trim());
        if (req.getTargetSpecies() != null) bom.setTargetSpecies(req.getTargetSpecies());
        if (req.getBatchWeightKg() != null) bom.setBatchWeightKg(req.getBatchWeightKg());
        if (req.getDescription() != null) bom.setDescription(req.getDescription());

        if (req.getItems() != null) {
            bom.getItems().clear();
            BigDecimal total = BigDecimal.ZERO;
            for (BomItemDto d : req.getItems()) {
                BigDecimal qty = d.getQuantityKg() != null ? d.getQuantityKg() : BigDecimal.ZERO;
                BigDecimal price = d.getUnitPrice() != null ? d.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal amt = qty.multiply(price);
                total = total.add(amt);

                bom.getItems().add(FeedProductionBomItem.builder()
                        .bom(bom)
                        .materialId(d.getMaterialId())
                        .materialName(d.getMaterialName())
                        .quantityKg(qty)
                        .unitPrice(price)
                        .amount(amt)
                        .build());
            }
            bom.setTotalCost(total);
            bom.setCostPerKg(bom.getBatchWeightKg().compareTo(BigDecimal.ZERO) > 0
                    ? total.divide(bom.getBatchWeightKg(), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);
        }

        return feedProductionBomRepository.save(bom);
    }

    @Override
    @Transactional
    public void deleteBom(Long farmId, Long id) {
        validateAddon(farmId, "FEED_MILL");
        feedProductionBomRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedProductionOrder> getFeedOrders(Long farmId, Long branchId) {
        validateAddon(farmId, "FEED_MILL");
        if (branchId != null && branchId > 0) {
            return feedProductionOrderRepository.findByFarmIdAndBranchIdOrderByExecutedDateDesc(farmId, branchId);
        }
        return feedProductionOrderRepository.findByFarmIdOrderByExecutedDateDesc(farmId);
    }

    @Override
    @Transactional
    public FeedProductionOrder executeFeedOrder(Long farmId, ExecuteFeedOrderRequest req) {
        validateAddon(farmId, "FEED_MILL");
        FeedProductionBom bom = feedProductionBomRepository.findById(req.getBomId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BOM_NOT_FOUND", "Không tìm thấy công thức"));

        int batchCount = req.getBatchCount() != null && req.getBatchCount() > 0 ? req.getBatchCount() : 1;
        BigDecimal totalKg = bom.getBatchWeightKg().multiply(BigDecimal.valueOf(batchCount));
        BigDecimal totalCost = bom.getTotalCost().multiply(BigDecimal.valueOf(batchCount));
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : farmId;

        String orderCode = "SX-CAM-" + LocalDate.now().toString().replace("-", "").substring(2) + "-" + (System.currentTimeMillis() % 1000);

        // Xác định kho đích nhận cám thành phẩm
        Warehouse targetWarehouse = null;
        if (req.getTargetWarehouseId() != null) {
            targetWarehouse = warehouseRepository.findById(req.getTargetWarehouseId()).orElse(null);
        }
        if (targetWarehouse == null && req.getTargetWarehouseName() != null && !req.getTargetWarehouseName().isBlank()) {
            String whName = req.getTargetWarehouseName().trim().toLowerCase();
            targetWarehouse = warehouseRepository.findByFarmId(farmId).stream()
                    .filter(w -> w.getName() != null && (w.getName().trim().toLowerCase().equals(whName)
                            || w.getName().trim().toLowerCase().contains(whName)
                            || whName.contains(w.getName().trim().toLowerCase())))
                    .findFirst()
                    .orElse(null);
        }

        FeedProductionOrder order = FeedProductionOrder.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .branchId(req.getBranchId())
                .orderCode(orderCode)
                .bomId(bom.getId())
                .bomName(bom.getName())
                .batchCount(batchCount)
                .totalOutputKg(totalKg)
                .targetWarehouseId(targetWarehouse != null ? targetWarehouse.getId() : req.getTargetWarehouseId())
                .targetWarehouseName(targetWarehouse != null ? targetWarehouse.getName()
                        : (req.getTargetWarehouseName() != null ? req.getTargetWarehouseName() : "Kho Cám Tự Trộn"))
                .totalMaterialCost(totalCost)
                .costPerKg(bom.getCostPerKg())
                .status("COMPLETED")
                .executedDate(LocalDate.now())
                .notes(req.getNotes() != null ? req.getNotes() : "Trộn " + batchCount + " mẻ thành công (" + totalKg + " kg)")
                .build();

        FeedProductionOrder savedOrder = feedProductionOrderRepository.save(order);

        // 1. Tự động trừ tồn kho nguyên liệu thô theo FEFO
        List<Material> tenantMaterials = materialRepository.findByTenantId(tenantId);
        if (bom.getItems() != null) {
            for (FeedProductionBomItem item : bom.getItems()) {
                BigDecimal requiredKg = (item.getQuantityKg() != null ? item.getQuantityKg() : BigDecimal.ZERO)
                        .multiply(BigDecimal.valueOf(batchCount));
                if (requiredKg.compareTo(BigDecimal.ZERO) <= 0) continue;

                Long matId = item.getMaterialId();
                if (matId == null && item.getMaterialName() != null) {
                    String mName = item.getMaterialName().trim().toLowerCase();
                    matId = tenantMaterials.stream()
                            .filter(m -> m.getName() != null && (m.getName().trim().toLowerCase().equals(mName)
                                    || m.getName().trim().toLowerCase().contains(mName)
                                    || mName.contains(m.getName().trim().toLowerCase())))
                            .map(Material::getId)
                            .findFirst()
                            .orElse(null);
                }

                if (matId != null) {
                    List<WarehouseInventory> lots = warehouseInventoryRepository.findFefoAvailableLotsByFarmAndMaterial(farmId, matId);
                    BigDecimal remaining = requiredKg;
                    for (WarehouseInventory lot : lots) {
                        if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
                        BigDecimal available = lot.getQuantityOnHand().subtract(lot.getReservedQuantity());
                        if (available.compareTo(BigDecimal.ZERO) <= 0) continue;
                        BigDecimal deduct = remaining.min(available);
                        BigDecimal before = lot.getQuantityOnHand();
                        BigDecimal after = before.subtract(deduct);
                        lot.setQuantityOnHand(after);
                        lot.setUpdatedAt(Instant.now());
                        warehouseInventoryRepository.save(lot);

                        warehouseInventoryTransactionRepository.save(WarehouseInventoryTransaction.builder()
                                .tenantId(tenantId)
                                .farmId(farmId)
                                .warehouseId(lot.getWarehouseId())
                                .materialId(matId)
                                .batchNumber(lot.getBatchNumber())
                                .transactionType("OUTWARD_PRODUCTION")
                                .referenceDocType("FEED_PRODUCTION_ORDER")
                                .referenceDocId(savedOrder.getId())
                                .referenceItemId(item.getId() != null ? item.getId() : savedOrder.getId())
                                .direction("OUT")
                                .quantity(deduct)
                                .unitPrice(lot.getUnitCost() != null ? lot.getUnitCost() : BigDecimal.ZERO)
                                .totalAmount(deduct.multiply(lot.getUnitCost() != null ? lot.getUnitCost() : BigDecimal.ZERO))
                                .balanceBefore(before)
                                .balanceAfter(after)
                                .transactionDate(LocalDate.now())
                                .notes("Xuất nguyên liệu cho lệnh trộn cám " + orderCode)
                                .createdAt(Instant.now())
                                .createdBy(SecurityUtils.getCurrentUserId())
                                .build());

                        remaining = remaining.subtract(deduct);
                    }
                }
            }
        }

        // 2. Tự động cộng kho cám thành phẩm vào kho đích
        if (targetWarehouse != null && totalKg.compareTo(BigDecimal.ZERO) > 0) {
            String sku = "CAM-" + bom.getCode().replaceAll("[^A-Z0-9-]", "");
            Material finishedMat = materialRepository.findByTenantIdAndSkuCode(tenantId, sku)
                    .orElseGet(() -> tenantMaterials.stream()
                            .filter(m -> m.getName() != null && m.getName().trim().equalsIgnoreCase(bom.getName().trim()))
                            .findFirst()
                            .orElseGet(() -> {
                                Long defaultCategoryId = tenantMaterials.stream()
                                        .map(Material::getCategoryId)
                                        .findFirst()
                                        .orElse(1L);
                                return materialRepository.save(Material.builder()
                                        .tenantId(tenantId)
                                        .categoryId(defaultCategoryId)
                                        .skuCode(sku)
                                        .name(bom.getName())
                                        .standardUnit("kg")
                                        .dispatchStrategy("FEFO")
                                        .expiryAlertDays(15)
                                        .minStockLevel(BigDecimal.ZERO)
                                        .unitPriceStandard(bom.getCostPerKg() != null ? bom.getCostPerKg() : BigDecimal.ZERO)
                                        .defaultPhiDays(0)
                                        .status("ACTIVE")
                                        .createdAt(Instant.now())
                                        .createdBy(SecurityUtils.getCurrentUserId())
                                        .build());
                            }));

            WarehouseInventory newLot = WarehouseInventory.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .warehouseId(targetWarehouse.getId())
                    .materialId(finishedMat.getId())
                    .batchNumber(orderCode)
                    .manufactureDate(LocalDate.now())
                    .inwardDate(LocalDate.now())
                    .expiryDate(LocalDate.now().plusDays(45))
                    .unitCost(bom.getCostPerKg() != null ? bom.getCostPerKg() : BigDecimal.ZERO)
                    .quantityOnHand(totalKg)
                    .reservedQuantity(BigDecimal.ZERO)
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            warehouseInventoryRepository.save(newLot);

            warehouseInventoryTransactionRepository.save(WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .warehouseId(targetWarehouse.getId())
                    .materialId(finishedMat.getId())
                    .batchNumber(orderCode)
                    .transactionType("INWARD_PRODUCTION")
                    .referenceDocType("FEED_PRODUCTION_ORDER")
                    .referenceDocId(savedOrder.getId())
                    .referenceItemId(savedOrder.getId())
                    .direction("IN")
                    .quantity(totalKg)
                    .unitPrice(bom.getCostPerKg() != null ? bom.getCostPerKg() : BigDecimal.ZERO)
                    .totalAmount(totalCost)
                    .balanceBefore(BigDecimal.ZERO)
                    .balanceAfter(totalKg)
                    .transactionDate(LocalDate.now())
                    .notes("Nhập kho thành phẩm từ lệnh trộn cám " + orderCode)
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build());
        }

        return savedOrder;
    }
}
