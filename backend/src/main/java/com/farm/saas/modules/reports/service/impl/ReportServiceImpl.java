package com.farm.saas.modules.reports.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.finance.entity.DebtRecord;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.entity.SalesOrder;
import com.farm.saas.modules.finance.repository.CostAllocationRepository;
import com.farm.saas.modules.finance.repository.DebtRecordRepository;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.finance.repository.SalesOrderRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.entity.LivestockWeightLog;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.livestock.repository.LivestockWeightLogRepository;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import com.farm.saas.modules.quality.repository.HarvestRecordRepository;
import com.farm.saas.modules.reports.dto.*;
import com.farm.saas.modules.reports.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final SalesOrderRepository salesOrderRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final CostAllocationRepository costAllocationRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final HarvestRecordRepository harvestRecordRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final LivestockWeightLogRepository livestockWeightLogRepository;
    private final MaterialRepository materialRepository;
    private final PartnerRepository partnerRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional(readOnly = true)
    public ExecutiveDashboardResponse getExecutiveDashboard(Long farmId, Integer fiscalYear) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        int year = fiscalYear != null ? fiscalYear : LocalDate.now().getYear();

        List<SalesOrder> orders = (farmId != null)
                ? salesOrderRepository.findByFarmId(farmId)
                : salesOrderRepository.findByTenantId(tenantId);

        BigDecimal totalRevenue = orders.stream()
                .filter(o -> !"CANCELLED".equalsIgnoreCase(o.getStatus()))
                .map(SalesOrder::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<FarmExpense> expenses = (farmId != null)
                ? farmExpenseRepository.findByFarmIdAndStatus(farmId, "CONFIRMED")
                : farmExpenseRepository.findByTenantIdAndStatus(tenantId, "CONFIRMED");

        BigDecimal totalExpense = expenses.stream()
                .map(FarmExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossProfit = totalRevenue.subtract(totalExpense);
        BigDecimal grossMarginPct = BigDecimal.ZERO;
        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            grossMarginPct = grossProfit.multiply(new BigDecimal("100")).divide(totalRevenue, 2, RoundingMode.HALF_UP);
        }

        BigDecimal totalHarvestYieldKg = (farmId != null)
                ? harvestRecordRepository.findByFarmIdOrderByHarvestDateDescCreatedAtDesc(farmId).stream()
                .map(h -> h.getQuantity() != null ? h.getQuantity() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                : BigDecimal.ZERO;

        long totalActiveSeasons = (farmId != null)
                ? cropSeasonRepository.findByFarmId(farmId).stream()
                .filter(s -> !"CLOSED".equalsIgnoreCase(s.getStatus()) && !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                .count()
                : 0L;

        long totalActiveLivestockHeads = (farmId != null)
                ? livestockGroupRepository.findByFarmId(farmId).stream()
                .filter(g -> !"SOLD".equalsIgnoreCase(g.getStatus()) && !"CLOSED".equalsIgnoreCase(g.getStatus()))
                .mapToLong(LivestockGroup::getCurrentQuantity)
                .sum()
                : 0L;

        List<WarehouseInventory> inventoryList = (farmId != null)
                ? warehouseInventoryRepository.findByFarmId(farmId)
                : warehouseInventoryRepository.findByTenantId(tenantId);

        BigDecimal totalInventoryValuation = inventoryList.stream()
                .map(inv -> inv.getQuantityOnHand().multiply(inv.getUnitCost()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<DebtRecord> debts = (farmId != null)
                ? debtRecordRepository.findByFarmId(farmId)
                : debtRecordRepository.findByTenantId(tenantId);

        BigDecimal totalReceivableDebt = debts.stream()
                .filter(d -> "RECEIVABLE".equalsIgnoreCase(d.getDebtType()) &&
                        ("ACTIVE".equalsIgnoreCase(d.getStatus()) || "OVERDUE".equalsIgnoreCase(d.getStatus())))
                .map(DebtRecord::getRemainingDebt)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPayableDebt = debts.stream()
                .filter(d -> "PAYABLE".equalsIgnoreCase(d.getDebtType()) &&
                        ("ACTIVE".equalsIgnoreCase(d.getStatus()) || "OVERDUE".equalsIgnoreCase(d.getStatus())))
                .map(DebtRecord::getRemainingDebt)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ExecutiveDashboardResponse.builder()
                .fiscalYear(year)
                .totalRevenue(totalRevenue)
                .totalExpense(totalExpense)
                .grossProfit(grossProfit)
                .grossMarginPct(grossMarginPct)
                .totalHarvestYieldKg(totalHarvestYieldKg)
                .totalActiveSeasons(totalActiveSeasons)
                .totalActiveLivestockHeads(totalActiveLivestockHeads)
                .totalInventoryValuation(totalInventoryValuation)
                .totalReceivableDebt(totalReceivableDebt)
                .totalPayableDebt(totalPayableDebt)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryAgingResponse getInventoryAging(Long farmId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<WarehouseInventory> items = (farmId != null)
                ? warehouseInventoryRepository.findByFarmId(farmId)
                : warehouseInventoryRepository.findByTenantId(tenantId);

        LocalDate now = LocalDate.now();

        long count0To30 = 0;
        BigDecimal qty0To30 = BigDecimal.ZERO;
        BigDecimal val0To30 = BigDecimal.ZERO;

        long count31To60 = 0;
        BigDecimal qty31To60 = BigDecimal.ZERO;
        BigDecimal val31To60 = BigDecimal.ZERO;

        long count61To90 = 0;
        BigDecimal qty61To90 = BigDecimal.ZERO;
        BigDecimal val61To90 = BigDecimal.ZERO;

        long countOver90 = 0;
        BigDecimal qtyOver90 = BigDecimal.ZERO;
        BigDecimal valOver90 = BigDecimal.ZERO;

        BigDecimal totalValuation = BigDecimal.ZERO;
        List<InventoryAgingResponse.ExpiringBatchAlert> alerts = new ArrayList<>();

        for (WarehouseInventory inv : items) {
            long ageDays = 0;
            if (inv.getInwardDate() != null) {
                ageDays = Math.max(0, ChronoUnit.DAYS.between(inv.getInwardDate(), now));
            }
            BigDecimal value = inv.getQuantityOnHand().multiply(inv.getUnitCost());
            totalValuation = totalValuation.add(value);

            if (ageDays <= 30) {
                count0To30++;
                qty0To30 = qty0To30.add(inv.getQuantityOnHand());
                val0To30 = val0To30.add(value);
            } else if (ageDays <= 60) {
                count31To60++;
                qty31To60 = qty31To60.add(inv.getQuantityOnHand());
                val31To60 = val31To60.add(value);
            } else if (ageDays <= 90) {
                count61To90++;
                qty61To90 = qty61To90.add(inv.getQuantityOnHand());
                val61To90 = val61To90.add(value);
            } else {
                countOver90++;
                qtyOver90 = qtyOver90.add(inv.getQuantityOnHand());
                valOver90 = valOver90.add(value);
            }

            // Expiry alert check
            if (inv.getExpiryDate() != null) {
                long daysUntilExpiry = ChronoUnit.DAYS.between(now, inv.getExpiryDate());
                Material material = materialRepository.findById(inv.getMaterialId()).orElse(null);
                int alertThreshold = material != null && material.getExpiryAlertDays() != null
                        ? material.getExpiryAlertDays()
                        : 30;

                if (daysUntilExpiry <= alertThreshold) {
                    alerts.add(InventoryAgingResponse.ExpiringBatchAlert.builder()
                            .inventoryId(inv.getId())
                            .materialId(inv.getMaterialId())
                            .materialName(material != null ? material.getName() : "Vật tư #" + inv.getMaterialId())
                            .lotNumber(inv.getBatchNumber())
                            .remainingQuantity(inv.getQuantityOnHand())
                            .expiryDate(inv.getExpiryDate())
                            .daysUntilExpiry(daysUntilExpiry)
                            .build());
                }
            }
        }

        return InventoryAgingResponse.builder()
                .bucket0To30(new InventoryAgingResponse.AgingBucket(count0To30, qty0To30, val0To30))
                .bucket31To60(new InventoryAgingResponse.AgingBucket(count31To60, qty31To60, val31To60))
                .bucket61To90(new InventoryAgingResponse.AgingBucket(count61To90, qty61To90, val61To90))
                .bucketOver90(new InventoryAgingResponse.AgingBucket(countOver90, qtyOver90, valOver90))
                .totalValuation(totalValuation)
                .expiringBatches(alerts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CropCostProfitResponse getCropCostProfit(Long farmId) {
        List<CropSeason> seasons = (farmId != null)
                ? cropSeasonRepository.findByFarmId(farmId)
                : Collections.emptyList();

        List<CropCostProfitResponse.CropSeasonFinancialSummary> seasonSummaries = new ArrayList<>();
        BigDecimal overallRev = BigDecimal.ZERO;
        BigDecimal overallCost = BigDecimal.ZERO;

        for (CropSeason season : seasons) {
            BigDecimal directCost = farmExpenseRepository.sumConfirmedExpensesBySeasonId(season.getId());
            BigDecimal allocatedCost = costAllocationRepository.sumAllocatedAmountByTarget("CROP_SEASON", season.getId());
            BigDecimal actualCost = (directCost != null ? directCost : BigDecimal.ZERO)
                    .add(allocatedCost != null ? allocatedCost : BigDecimal.ZERO);

            BigDecimal actualYieldKg = harvestRecordRepository.sumQuantityBySeasonId(season.getId());
            if (actualYieldKg == null || actualYieldKg.compareTo(BigDecimal.ZERO) == 0) {
                actualYieldKg = season.getActualYieldKg() != null ? season.getActualYieldKg() : BigDecimal.ZERO;
            }

            BigDecimal unitCostPerKg = BigDecimal.ZERO;
            if (actualYieldKg.compareTo(BigDecimal.ZERO) > 0) {
                unitCostPerKg = actualCost.divide(actualYieldKg, 2, RoundingMode.HALF_UP);
            }

            // Estimate revenue or from sales order items
            BigDecimal revenue = BigDecimal.ZERO;
            if (actualYieldKg.compareTo(BigDecimal.ZERO) > 0) {
                revenue = actualYieldKg.multiply(unitCostPerKg.multiply(new BigDecimal("1.35"))); // 35% markup estimate
            }

            BigDecimal grossProfit = revenue.subtract(actualCost);
            BigDecimal grossMarginPct = BigDecimal.ZERO;
            if (revenue.compareTo(BigDecimal.ZERO) > 0) {
                grossMarginPct = grossProfit.multiply(new BigDecimal("100")).divide(revenue, 2, RoundingMode.HALF_UP);
            }

            overallRev = overallRev.add(revenue);
            overallCost = overallCost.add(actualCost);

            seasonSummaries.add(CropCostProfitResponse.CropSeasonFinancialSummary.builder()
                    .seasonId(season.getId())
                    .seasonName(season.getSeasonCode())
                    .seasonCode(season.getSeasonCode())
                    .cropName(season.getSeasonCode())
                    .plannedBudget(BigDecimal.ZERO)
                    .actualCost(actualCost)
                    .actualYieldKg(actualYieldKg)
                    .unitCostPerKg(unitCostPerKg)
                    .revenue(revenue)
                    .grossProfit(grossProfit)
                    .grossMarginPct(grossMarginPct)
                    .build());
        }

        BigDecimal overallProfit = overallRev.subtract(overallCost);

        return CropCostProfitResponse.builder()
                .seasons(seasonSummaries)
                .overallRevenue(overallRev)
                .overallCost(overallCost)
                .overallGrossProfit(overallProfit)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public LivestockFcrResponse getLivestockFcr(Long farmId, Long groupId) {
        List<LivestockGroup> groups = new ArrayList<>();
        if (groupId != null) {
            livestockGroupRepository.findById(groupId).ifPresent(groups::add);
        } else if (farmId != null) {
            groups = livestockGroupRepository.findByFarmId(farmId);
        }

        List<LivestockFcrResponse.LivestockGroupFcrSummary> groupSummaries = new ArrayList<>();
        BigDecimal totalFcrSum = BigDecimal.ZERO;
        int fcrCount = 0;
        BigDecimal totalSurvivalRateSum = BigDecimal.ZERO;

        for (LivestockGroup g : groups) {
            int initQty = g.getInitialQuantity() != null ? g.getInitialQuantity() : 1;
            int currQty = g.getCurrentQuantity() != null ? g.getCurrentQuantity() : 0;
            BigDecimal survivalRate = initQty > 0
                    ? new BigDecimal(currQty).multiply(new BigDecimal("100")).divide(new BigDecimal(initQty), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            // Total weight gain from weight logs
            List<LivestockWeightLog> weightLogs = livestockWeightLogRepository.findByGroupIdOrderByRecordDateDescCreatedAtDesc(g.getId());
            BigDecimal totalWeightGainKg = BigDecimal.ZERO;
            if (weightLogs.size() >= 2) {
                BigDecimal minW = weightLogs.stream().map(LivestockWeightLog::getWeightKg).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
                BigDecimal maxW = weightLogs.stream().map(LivestockWeightLog::getWeightKg).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
                totalWeightGainKg = maxW.subtract(minW).multiply(new BigDecimal(currQty));
            } else if (!weightLogs.isEmpty()) {
                totalWeightGainKg = weightLogs.get(0).getWeightKg().multiply(new BigDecimal(currQty));
            } else {
                totalWeightGainKg = new BigDecimal(currQty * 30);
            }

            // Feed consumption: check feed expenses or weight logs or standard formula
            BigDecimal feedConsumedKg = BigDecimal.ZERO;
            BigDecimal feedExpenses = farmExpenseRepository.sumConfirmedExpensesByLivestockGroupId(g.getId());
            if (feedExpenses != null && feedExpenses.compareTo(BigDecimal.ZERO) > 0) {
                feedConsumedKg = feedExpenses.divide(new BigDecimal("15000"), 2, RoundingMode.HALF_UP); // ~15k VND/kg feed
            }
            if (feedConsumedKg.compareTo(BigDecimal.ZERO) == 0 && totalWeightGainKg.compareTo(BigDecimal.ZERO) > 0) {
                feedConsumedKg = totalWeightGainKg.multiply(new BigDecimal("2.50")); // Standard 2.50 FCR
            }

            BigDecimal fcr = BigDecimal.ZERO;
            if (totalWeightGainKg.compareTo(BigDecimal.ZERO) > 0 && feedConsumedKg.compareTo(BigDecimal.ZERO) > 0) {
                fcr = feedConsumedKg.divide(totalWeightGainKg, 2, RoundingMode.HALF_UP);
                totalFcrSum = totalFcrSum.add(fcr);
                fcrCount++;
            }

            totalSurvivalRateSum = totalSurvivalRateSum.add(survivalRate);

            groupSummaries.add(LivestockFcrResponse.LivestockGroupFcrSummary.builder()
                    .groupId(g.getId())
                    .groupCode(g.getGroupCode())
                    .groupName(g.getGroupCode())
                    .species(g.getGroupCode())
                    .totalFeedConsumedKg(feedConsumedKg)
                    .totalWeightGainKg(totalWeightGainKg)
                    .fcr(fcr)
                    .initialQuantity(initQty)
                    .currentQuantity(currQty)
                    .survivalRatePct(survivalRate)
                    .build());
        }

        BigDecimal avgFcr = fcrCount > 0 ? totalFcrSum.divide(new BigDecimal(fcrCount), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal overallSurvival = !groups.isEmpty() ? totalSurvivalRateSum.divide(new BigDecimal(groups.size()), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        return LivestockFcrResponse.builder()
                .groups(groupSummaries)
                .averageFcr(avgFcr)
                .overallSurvivalRate(overallSurvival)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DebtAgingResponse getDebtAging(Long farmId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<DebtRecord> debts = (farmId != null)
                ? debtRecordRepository.findByFarmId(farmId)
                : debtRecordRepository.findByTenantId(tenantId);

        LocalDate now = LocalDate.now();

        BigDecimal recCurrent = BigDecimal.ZERO;
        BigDecimal rec1To30 = BigDecimal.ZERO;
        BigDecimal rec31To60 = BigDecimal.ZERO;
        BigDecimal rec61To90 = BigDecimal.ZERO;
        BigDecimal recOver90 = BigDecimal.ZERO;
        BigDecimal recTotal = BigDecimal.ZERO;

        BigDecimal payCurrent = BigDecimal.ZERO;
        BigDecimal pay1To30 = BigDecimal.ZERO;
        BigDecimal pay31To60 = BigDecimal.ZERO;
        BigDecimal pay61To90 = BigDecimal.ZERO;
        BigDecimal payOver90 = BigDecimal.ZERO;
        BigDecimal payTotal = BigDecimal.ZERO;

        Map<Long, DebtAgingResponse.PartnerDebtAgingDetail> partnerMap = new HashMap<>();

        for (DebtRecord d : debts) {
            if ("SETTLED".equalsIgnoreCase(d.getStatus()) || d.getRemainingDebt().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal rem = d.getRemainingDebt();
            long overdueDays = 0;
            if (d.getDueDate() != null && now.isAfter(d.getDueDate())) {
                overdueDays = ChronoUnit.DAYS.between(d.getDueDate(), now);
            }

            boolean isReceivable = "RECEIVABLE".equalsIgnoreCase(d.getDebtType());
            if (isReceivable) {
                recTotal = recTotal.add(rem);
                if (overdueDays == 0) recCurrent = recCurrent.add(rem);
                else if (overdueDays <= 30) rec1To30 = rec1To30.add(rem);
                else if (overdueDays <= 60) rec31To60 = rec31To60.add(rem);
                else if (overdueDays <= 90) rec61To90 = rec61To90.add(rem);
                else recOver90 = recOver90.add(rem);
            } else {
                payTotal = payTotal.add(rem);
                if (overdueDays == 0) payCurrent = payCurrent.add(rem);
                else if (overdueDays <= 30) pay1To30 = pay1To30.add(rem);
                else if (overdueDays <= 60) pay31To60 = pay31To60.add(rem);
                else if (overdueDays <= 90) pay61To90 = pay61To90.add(rem);
                else payOver90 = payOver90.add(rem);
            }

            // Partner breakdown
            Partner partner = partnerRepository.findById(d.getPartnerId()).orElse(null);
            DebtAgingResponse.PartnerDebtAgingDetail detail = partnerMap.computeIfAbsent(d.getPartnerId(), k ->
                    DebtAgingResponse.PartnerDebtAgingDetail.builder()
                            .partnerId(d.getPartnerId())
                            .partnerCode(partner != null ? partner.getCode() : "PARTNER-" + d.getPartnerId())
                            .partnerName(partner != null ? partner.getName() : "Đối tác #" + d.getPartnerId())
                            .debtType(d.getDebtType())
                            .currentTerm(BigDecimal.ZERO)
                            .overdue1To30(BigDecimal.ZERO)
                            .overdue31To60(BigDecimal.ZERO)
                            .overdue61To90(BigDecimal.ZERO)
                            .overdueOver90(BigDecimal.ZERO)
                            .totalDebt(BigDecimal.ZERO)
                            .isBadDebtRisk(false)
                            .build()
            );

            detail.setTotalDebt(detail.getTotalDebt().add(rem));
            if (overdueDays == 0) detail.setCurrentTerm(detail.getCurrentTerm().add(rem));
            else if (overdueDays <= 30) detail.setOverdue1To30(detail.getOverdue1To30().add(rem));
            else if (overdueDays <= 60) detail.setOverdue31To60(detail.getOverdue31To60().add(rem));
            else if (overdueDays <= 90) detail.setOverdue61To90(detail.getOverdue61To90().add(rem));
            else {
                detail.setOverdueOver90(detail.getOverdueOver90().add(rem));
                detail.setIsBadDebtRisk(true);
            }
        }

        DebtAgingResponse.DebtAgingSummary recSummary = DebtAgingResponse.DebtAgingSummary.builder()
                .currentTerm(recCurrent)
                .overdue1To30(rec1To30)
                .overdue31To60(rec31To60)
                .overdue61To90(rec61To90)
                .overdueOver90(recOver90)
                .totalDebt(recTotal)
                .build();

        DebtAgingResponse.DebtAgingSummary paySummary = DebtAgingResponse.DebtAgingSummary.builder()
                .currentTerm(payCurrent)
                .overdue1To30(pay1To30)
                .overdue31To60(pay31To60)
                .overdue61To90(pay61To90)
                .overdueOver90(payOver90)
                .totalDebt(payTotal)
                .build();

        return DebtAgingResponse.builder()
                .receivable(recSummary)
                .payable(paySummary)
                .partnerDetails(new ArrayList<>(partnerMap.values()))
                .build();
    }
}
