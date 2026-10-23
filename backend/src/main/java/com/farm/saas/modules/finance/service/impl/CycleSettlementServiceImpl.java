package com.farm.saas.modules.finance.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.finance.dto.request.ConfirmSettlementRequest;
import com.farm.saas.modules.finance.dto.response.CycleSettlementSummaryResponse;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.entity.SalesOrder;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.finance.repository.PaymentTransactionRepository;
import com.farm.saas.modules.finance.repository.SalesOrderRepository;
import com.farm.saas.modules.finance.service.CycleSettlementService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.OperationalCycle;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.OperationalCycleRepository;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.entity.CostCategory;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import com.farm.saas.modules.platform.entity.Enterprise;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.EnterpriseRepository;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CycleSettlementServiceImpl implements CycleSettlementService {

    private final OperationalCycleRepository operationalCycleRepository;
    private final FarmRepository farmRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final PartnerRepository partnerRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<CycleSettlementSummaryResponse> getCycleSettlements(Long farmId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<OperationalCycle> cycles;
        if (farmId != null && farmId > 0) {
            validateFarm(farmId);
            cycles = operationalCycleRepository.findByFarmId(farmId);
        } else {
            cycles = operationalCycleRepository.findByTenantId(tenantId);
        }

        Enterprise enterprise = enterpriseRepository.findByTenantId(tenantId).orElse(null);
        Map<Long, Farm> farmMap = farmRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Farm::getId, f -> f, (a, b) -> a));

        List<CycleSettlementSummaryResponse> result = new ArrayList<>();
        for (OperationalCycle c : cycles) {
            Farm farm = farmMap.get(c.getFarmId());
            result.add(buildSummaryResponse(c, farm, enterprise, false));
        }

        // Sắp xếp theo ngày bắt đầu giảm dần
        result.sort(Comparator.comparing(CycleSettlementSummaryResponse::getStartDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public CycleSettlementSummaryResponse getCycleSettlementSummary(Long farmId, Long cycleId) {
        validateFarm(farmId);
        Long tenantId = SecurityUtils.getCurrentTenantId();

        OperationalCycle cycle = operationalCycleRepository.findByFarmIdAndId(farmId, cycleId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Operational cycle not found: " + cycleId));

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Farm not found: " + farmId));

        Enterprise enterprise = enterpriseRepository.findByTenantId(tenantId).orElse(null);
        return buildSummaryResponse(cycle, farm, enterprise, true);
    }

    @Override
    @Transactional
    public CycleSettlementSummaryResponse confirmSettlement(Long farmId, Long cycleId, ConfirmSettlementRequest request) {
        validateFarm(farmId);
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        OperationalCycle cycle = operationalCycleRepository.findByFarmIdAndId(farmId, cycleId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Operational cycle not found: " + cycleId));

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Farm not found: " + farmId));

        // Khóa sổ chu kỳ sang CLOSED
        cycle.setStatus("CLOSED");
        cycle.setUpdatedAt(Instant.now());
        cycle.setUpdatedBy(currentUserId);
        cycle = operationalCycleRepository.save(cycle);

        // Bắn thông báo cho Giám đốc trại nếu có
        if (farm.getManagerUserId() != null) {
            notificationService.sendNotification(
                    tenantId,
                    farm.getManagerUserId(),
                    "Chủ đầu tư đã chốt sổ kết toán chu kỳ",
                    String.format("Chủ đầu tư (Owner) đã xác nhận nhận lợi nhuận và hoàn tất đóng sổ chu kỳ '%s' của trang trại %s.",
                            cycle.getName(), farm.getName()),
                    "INFO",
                    "CYCLE_SETTLEMENT",
                    cycle.getId(),
                    "/app/sales-cashflow"
            );
        }

        Enterprise enterprise = enterpriseRepository.findByTenantId(tenantId).orElse(null);
        CycleSettlementSummaryResponse res = buildSummaryResponse(cycle, farm, enterprise, true);

        // Đính kèm metadata kết toán vừa xác nhận
        res.setSettledAt(Instant.now());
        res.setSettledByUserId(currentUserId);
        userRepository.findById(currentUserId).ifPresent(u -> res.setSettledByUserName(u.getFullName()));
        if (request != null) {
            res.setSettlementTransactionCode(request.getSettlementTransactionCode());
            res.setSettlementProofUrl(request.getSettlementProofUrl());
            res.setNotes(request.getNotes());
        }

        return res;
    }

    private CycleSettlementSummaryResponse buildSummaryResponse(
            OperationalCycle cycle,
            Farm farm,
            Enterprise enterprise,
            boolean includeDetails) {

        Long farmId = cycle.getFarmId();
        Long tenantId = cycle.getTenantId();

        // 1. Tính Tổng Doanh Thu (Sales Orders trong chu kỳ)
        List<SalesOrder> allOrders = salesOrderRepository.findByFarmId(farmId);
        List<SalesOrder> cycleOrders = allOrders.stream().filter(o -> {
            if ("CANCELLED".equals(o.getStatus())) return false;
            if (o.getOrderDate() != null) {
                return !o.getOrderDate().isBefore(cycle.getStartDate()) && !o.getOrderDate().isAfter(cycle.getEndDate());
            }
            return false;
        }).toList();

        BigDecimal paidSum = cycleOrders.stream()
                .map(o -> o.getPaidAmount() != null ? o.getPaidAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal finalSum = cycleOrders.stream()
                .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRevenue = paidSum.compareTo(BigDecimal.ZERO) > 0 ? paidSum : finalSum;

        // 2. Tính Tổng Chi Phí (Farm Expenses trong chu kỳ)
        List<FarmExpense> allExpenses = farmExpenseRepository.findByTenantIdAndFarmId(tenantId, farmId);
        Set<Long> cycleSeasonIds = cropSeasonRepository.findByFarmId(farmId).stream()
                .filter(s -> cycle.getId().equals(s.getOperationalCycleId()))
                .map(CropSeason::getId)
                .collect(Collectors.toSet());
        Set<Long> cycleGroupIds = livestockGroupRepository.findByFarmId(farmId).stream()
                .filter(g -> cycle.getId().equals(g.getOperationalCycleId()))
                .map(LivestockGroup::getId)
                .collect(Collectors.toSet());

        List<FarmExpense> cycleExpenses = allExpenses.stream().filter(e -> {
            if (!"CONFIRMED".equalsIgnoreCase(e.getStatus()) && !"PAID".equalsIgnoreCase(e.getStatus())) return false;
            if (e.getSeasonId() != null && cycleSeasonIds.contains(e.getSeasonId())) return true;
            if (e.getLivestockGroupId() != null && cycleGroupIds.contains(e.getLivestockGroupId())) return true;
            if (e.getExpenseDate() != null) {
                return !e.getExpenseDate().isBefore(cycle.getStartDate()) && !e.getExpenseDate().isAfter(cycle.getEndDate());
            }
            return false;
        }).toList();

        BigDecimal totalExpense = cycleExpenses.stream()
                .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Lợi Nhuận Ròng (Net Profit)
        BigDecimal netProfit = totalRevenue.subtract(totalExpense);

        // 4. Sinh mã VietQR chuyển tiền về Owner
        String bankBin = enterprise != null && enterprise.getBankBin() != null ? enterprise.getBankBin() : "970422";
        String bankName = enterprise != null && enterprise.getBankName() != null ? enterprise.getBankName() : "MBBank";
        String bankAccountNo = enterprise != null && enterprise.getBankAccountNo() != null ? enterprise.getBankAccountNo() : "012345678901";
        String bankAccountName = enterprise != null && enterprise.getBankAccountName() != null ? enterprise.getBankAccountName() : "CHU DAU TU";

        String farmCode = farm != null && farm.getCode() != null ? farm.getCode() : ("TR" + farmId);
        String cleanCycleName = removeAccents(cycle.getName()).replaceAll("[^a-zA-Z0-9 ]", "").trim().toUpperCase();
        String rawContent = "KET TOAN " + farmCode + " " + cleanCycleName;
        if (rawContent.length() > 50) rawContent = rawContent.substring(0, 50);

        BigDecimal transferAmount = netProfit.compareTo(BigDecimal.ZERO) > 0 ? netProfit : BigDecimal.ZERO;
        String encodedAccountName = URLEncoder.encode(bankAccountName, StandardCharsets.UTF_8);
        String encodedContent = URLEncoder.encode(rawContent, StandardCharsets.UTF_8);

        String ownerVietQrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                bankBin, bankAccountNo, transferAmount.toPlainString(), encodedContent, encodedAccountName
        );

        List<CycleSettlementSummaryResponse.SettlementRevenueItemDto> revenueItems = Collections.emptyList();
        List<CycleSettlementSummaryResponse.SettlementExpenseItemDto> expenseItems = Collections.emptyList();

        if (includeDetails) {
            // Preload partners and cost categories
            Map<Long, String> partnerNameMap = partnerRepository.findByTenantId(tenantId).stream()
                    .collect(Collectors.toMap(Partner::getId, Partner::getName, (a, b) -> a));
            Map<Long, String> categoryNameMap = costCategoryRepository.findByTenantId(tenantId).stream()
                    .collect(Collectors.toMap(CostCategory::getId, CostCategory::getName, (a, b) -> a));

            revenueItems = cycleOrders.stream().map(o -> CycleSettlementSummaryResponse.SettlementRevenueItemDto.builder()
                    .orderId(o.getId())
                    .orderCode(o.getOrderCode())
                    .orderDate(o.getOrderDate())
                    .partnerName(partnerNameMap.getOrDefault(o.getPartnerId(), "Khách hàng B2B"))
                    .finalAmount(o.getFinalAmount())
                    .paidAmount(o.getPaidAmount())
                    .build()).toList();

            expenseItems = cycleExpenses.stream().map(e -> CycleSettlementSummaryResponse.SettlementExpenseItemDto.builder()
                    .expenseId(e.getId())
                    .expenseCode(e.getExpenseCode())
                    .expenseDate(e.getExpenseDate())
                    .categoryName(categoryNameMap.getOrDefault(e.getCostCategoryId(), "Chi phí vận hành"))
                    .expenseSource(e.getExpenseSource())
                    .amount(e.getAmount())
                    .receiptPhotoUrl(e.getReceiptPhotoUrl())
                    .build()).toList();
        }

        return CycleSettlementSummaryResponse.builder()
                .cycleId(cycle.getId())
                .cycleName(cycle.getName())
                .farmId(farmId)
                .farmName(farm != null ? farm.getName() : ("Trại #" + farmId))
                .farmCode(farmCode)
                .fiscalYear(cycle.getFiscalYear())
                .startDate(cycle.getStartDate())
                .endDate(cycle.getEndDate())
                .status(cycle.getStatus() != null ? cycle.getStatus() : "ACTIVE")
                .totalRevenue(totalRevenue)
                .totalExpense(totalExpense)
                .netProfit(netProfit)
                .ownerBankBin(bankBin)
                .ownerBankName(bankName)
                .ownerBankAccountNo(bankAccountNo)
                .ownerBankAccountName(bankAccountName)
                .qrTransferContent(rawContent)
                .ownerVietQrUrl(ownerVietQrUrl)
                .salesOrderCount((long) cycleOrders.size())
                .expenseCount((long) cycleExpenses.size())
                .recentRevenues(revenueItems)
                .recentExpenses(expenseItems)
                .settledAt(cycle.getUpdatedAt())
                .settledByUserId(cycle.getUpdatedBy())
                .build();
    }

    private Farm validateFarm(Long farmId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Farm not found: " + farmId));
        if (tenantId != null && !farm.getTenantId().equals(tenantId)) {
            throw new BusinessException("FORBIDDEN", "Access to farm forbidden");
        }
        return farm;
    }

    private String removeAccents(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("").replace('đ', 'd').replace('Đ', 'D');
    }
}
