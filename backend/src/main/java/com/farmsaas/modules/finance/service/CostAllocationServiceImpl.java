package com.farmsaas.modules.finance.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.crop.repository.CropSeasonRepository;
import com.farmsaas.modules.farm.entity.ProductionZone;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.farm.repository.ProductionZoneRepository;
import com.farmsaas.modules.finance.dto.CostAllocationRequest;
import com.farmsaas.modules.finance.dto.CostAllocationResponse;
import com.farmsaas.modules.finance.entity.CostAllocation;
import com.farmsaas.modules.finance.entity.FarmExpense;
import com.farmsaas.modules.finance.repository.CostAllocationRepository;
import com.farmsaas.modules.finance.repository.FarmExpenseRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CostAllocationServiceImpl implements CostAllocationService {

    private final CostAllocationRepository costAllocationRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional
    public CostAllocationResponse allocateCost(Long farmId, CostAllocationRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        FarmExpense expense = farmExpenseRepository.findByIdAndTenantIdAndFarmId(request.getExpenseId(), tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khoản chi phí gốc ID: " + request.getExpenseId()));

        ProductionZone zone = null;
        if (request.getZoneId() != null) {
            zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(request.getZoneId(), farmId, tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phân khu ID: " + request.getZoneId()));
        }

        CropSeason season = null;
        if (request.getSeasonId() != null) {
            season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(request.getSeasonId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy mùa vụ ID: " + request.getSeasonId()));
        }

        BigDecimal ratio = request.getAllocationRatio();
        BigDecimal allocatedAmount = request.getAllocatedAmount();
        if (allocatedAmount == null || allocatedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            allocatedAmount = expense.getAmount().multiply(ratio).setScale(2, RoundingMode.HALF_UP);
        }

        CostAllocation allocation = CostAllocation.builder()
                .farmId(farmId)
                .expenseId(expense.getId())
                .expense(expense)
                .zoneId(request.getZoneId())
                .zone(zone)
                .seasonId(request.getSeasonId())
                .season(season)
                .allocationRatio(ratio)
                .allocatedAmount(allocatedAmount)
                .notes(request.getNotes())
                .build();
        allocation.setTenantId(tenantId);

        CostAllocation saved = costAllocationRepository.save(allocation);
        log.info("Allocated cost from expense ID: {} to season ID: {}, amount: {}", expense.getId(), request.getSeasonId(), allocatedAmount);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CostAllocationResponse> getAllocationsByExpense(Long farmId, Long expenseId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return costAllocationRepository.findByTenantIdAndFarmIdAndExpenseId(tenantId, farmId, expenseId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CostAllocationResponse> getAllocationsBySeason(Long farmId, Long seasonId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return costAllocationRepository.findByTenantIdAndFarmIdAndSeasonId(tenantId, farmId, seasonId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAllocation(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        CostAllocation allocation = costAllocationRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phân bổ chi phí ID: " + id));

        costAllocationRepository.delete(allocation);
        log.info("Deleted cost allocation ID: {} from Farm ID: {}", id, farmId);
    }

    private CostAllocationResponse mapToResponse(CostAllocation ca) {
        return CostAllocationResponse.builder()
                .id(ca.getId())
                .tenantId(ca.getTenantId())
                .farmId(ca.getFarmId())
                .expenseId(ca.getExpenseId())
                .expenseCode(ca.getExpense() != null ? ca.getExpense().getExpenseCode() : null)
                .expenseAmount(ca.getExpense() != null ? ca.getExpense().getAmount() : null)
                .zoneId(ca.getZoneId())
                .zoneName(ca.getZone() != null ? ca.getZone().getName() : null)
                .seasonId(ca.getSeasonId())
                .seasonCode(ca.getSeason() != null ? ca.getSeason().getSeasonCode() : null)
                .allocationRatio(ca.getAllocationRatio())
                .allocatedAmount(ca.getAllocatedAmount())
                .notes(ca.getNotes())
                .createdAt(ca.getCreatedAt())
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
