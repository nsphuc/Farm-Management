package com.farmsaas.modules.finance.service;

import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.crop.repository.CropSeasonRepository;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.finance.dto.UnitCostCalculationResponse;
import com.farmsaas.modules.finance.entity.FarmExpense;
import com.farmsaas.modules.finance.entity.enums.CostType;
import com.farmsaas.modules.finance.repository.CostAllocationRepository;
import com.farmsaas.modules.finance.repository.FarmExpenseRepository;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.livestock.repository.LivestockGroupRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CostCalculationServiceImpl implements CostCalculationService {

    private final FarmExpenseRepository farmExpenseRepository;
    private final CostAllocationRepository costAllocationRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional(readOnly = true)
    public UnitCostCalculationResponse calculateSeasonUnitCost(Long farmId, Long seasonId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        CropSeason season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(seasonId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + seasonId));

        List<FarmExpense> expenses = farmExpenseRepository.findByTenantIdAndFarmIdAndSeasonId(tenantId, farmId, seasonId);

        BigDecimal directMaterial = BigDecimal.ZERO;
        BigDecimal directLabor = BigDecimal.ZERO;
        BigDecimal machinery = BigDecimal.ZERO;
        BigDecimal depreciation = BigDecimal.ZERO;
        BigDecimal indirectGeneral = BigDecimal.ZERO;

        for (FarmExpense exp : expenses) {
            BigDecimal amt = exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO;
            CostType type = exp.getCategory() != null ? exp.getCategory().getCostType() : CostType.GIAN_TIEP;
            switch (type) {
                case TRUC_TIEP_VAT_TU -> directMaterial = directMaterial.add(amt);
                case TRUC_TIEP_NHAN_CONG -> directLabor = directLabor.add(amt);
                case MAY_MOC -> machinery = machinery.add(amt);
                case KHAU_HAO -> depreciation = depreciation.add(amt);
                default -> indirectGeneral = indirectGeneral.add(amt);
            }
        }

        // Lấy chi phí gián tiếp phân bổ từ bảng cost_allocations
        BigDecimal allocatedOverhead = costAllocationRepository.sumAllocatedAmountBySeasonId(tenantId, farmId, seasonId);
        if (allocatedOverhead == null) allocatedOverhead = BigDecimal.ZERO;

        BigDecimal totalProductionCost = directMaterial
                .add(directLabor)
                .add(machinery)
                .add(depreciation)
                .add(indirectGeneral)
                .add(allocatedOverhead);

        BigDecimal actualYield = season.getActualYieldKg();
        BigDecimal estimatedYield = season.getEstimatedYieldKg();
        BigDecimal yieldToUse = (actualYield != null && actualYield.compareTo(BigDecimal.ZERO) > 0)
                ? actualYield
                : (estimatedYield != null ? estimatedYield : BigDecimal.ZERO);

        BigDecimal unitCostPerKg = BigDecimal.ZERO;
        if (yieldToUse.compareTo(BigDecimal.ZERO) > 0) {
            unitCostPerKg = totalProductionCost.divide(yieldToUse, 2, RoundingMode.HALF_UP);
        }

        BigDecimal areaM2 = season.getPlantedAreaM2() != null ? season.getPlantedAreaM2() : BigDecimal.ZERO;
        BigDecimal costPerM2 = BigDecimal.ZERO;
        if (areaM2.compareTo(BigDecimal.ZERO) > 0) {
            costPerM2 = totalProductionCost.divide(areaM2, 2, RoundingMode.HALF_UP);
        }

        log.info("Calculated unit cost for season {}: totalCost={}, yield={}, unitCost={}",
                season.getSeasonCode(), totalProductionCost, yieldToUse, unitCostPerKg);

        return UnitCostCalculationResponse.builder()
                .farmId(farmId)
                .seasonId(seasonId)
                .seasonCode(season.getSeasonCode())
                .cropTypeName(season.getCropType() != null ? season.getCropType().getName() : null)
                .directMaterialCost(directMaterial)
                .directLaborCost(directLabor)
                .machineryCost(machinery)
                .depreciationCost(depreciation)
                .indirectGeneralCost(indirectGeneral)
                .allocatedOverheadCost(allocatedOverhead)
                .totalProductionCost(totalProductionCost)
                .plantedAreaM2(areaM2)
                .actualHarvestYieldKg(actualYield)
                .estimatedYieldKg(estimatedYield)
                .unitCostPerKg(unitCostPerKg)
                .costPerM2(costPerM2)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UnitCostCalculationResponse calculateHerdUnitCost(Long farmId, Long herdId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockGroup herd = livestockGroupRepository.findByIdAndTenantIdAndFarmId(herdId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đàn vật nuôi ID: " + herdId));

        List<FarmExpense> expenses = farmExpenseRepository.findByTenantIdAndFarmIdAndHerdId(tenantId, farmId, herdId);

        BigDecimal directFeed = BigDecimal.ZERO;
        BigDecimal directLabor = BigDecimal.ZERO;
        BigDecimal machinery = BigDecimal.ZERO;
        BigDecimal depreciation = BigDecimal.ZERO;
        BigDecimal indirectGeneral = BigDecimal.ZERO;

        for (FarmExpense exp : expenses) {
            BigDecimal amt = exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO;
            CostType type = exp.getCategory() != null ? exp.getCategory().getCostType() : CostType.GIAN_TIEP;
            switch (type) {
                case TRUC_TIEP_VAT_TU -> directFeed = directFeed.add(amt);
                case TRUC_TIEP_NHAN_CONG -> directLabor = directLabor.add(amt);
                case MAY_MOC -> machinery = machinery.add(amt);
                case KHAU_HAO -> depreciation = depreciation.add(amt);
                default -> indirectGeneral = indirectGeneral.add(amt);
            }
        }

        BigDecimal totalCost = directFeed.add(directLabor).add(machinery).add(depreciation).add(indirectGeneral);

        // Tổng trọng lượng đàn (ước tính hoặc số lượng x trọng lượng trung bình)
        int currentQty = herd.getCurrentQuantity() != null ? herd.getCurrentQuantity() : 0;
        BigDecimal targetWeight = (herd.getBreed() != null && herd.getBreed().getTargetWeightKg() != null)
                ? herd.getBreed().getTargetWeightKg()
                : BigDecimal.ONE;
        BigDecimal totalHerdWeightKg = targetWeight.multiply(BigDecimal.valueOf(currentQty));

        BigDecimal unitCostPerKg = BigDecimal.ZERO;
        if (totalHerdWeightKg.compareTo(BigDecimal.ZERO) > 0) {
            unitCostPerKg = totalCost.divide(totalHerdWeightKg, 2, RoundingMode.HALF_UP);
        }

        return UnitCostCalculationResponse.builder()
                .farmId(farmId)
                .herdId(herdId)
                .herdCode(herd.getGroupCode())
                .cropTypeName(herd.getBreed() != null ? herd.getBreed().getBreedName() : null)
                .directMaterialCost(directFeed)
                .directLaborCost(directLabor)
                .machineryCost(machinery)
                .depreciationCost(depreciation)
                .indirectGeneralCost(indirectGeneral)
                .allocatedOverheadCost(BigDecimal.ZERO)
                .totalProductionCost(totalCost)
                .plantedAreaM2(BigDecimal.ZERO)
                .actualHarvestYieldKg(totalHerdWeightKg)
                .estimatedYieldKg(totalHerdWeightKg)
                .unitCostPerKg(unitCostPerKg)
                .costPerM2(BigDecimal.ZERO)
                .build();
    }

    private void validateFarmAccess(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức.");
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
