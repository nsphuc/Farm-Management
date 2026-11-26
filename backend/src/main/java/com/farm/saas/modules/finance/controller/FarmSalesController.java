package com.farm.saas.modules.finance.controller;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.finance.entity.DebtRecord;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.entity.FarmFinancialSetting;
import com.farm.saas.modules.finance.entity.SalesOrder;
import com.farm.saas.modules.finance.entity.SalesOrderItem;
import com.farm.saas.modules.finance.repository.DebtRecordRepository;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.finance.repository.FarmFinancialSettingRepository;
import com.farm.saas.modules.finance.repository.SalesOrderItemRepository;
import com.farm.saas.modules.finance.repository.SalesOrderRepository;
import com.farm.saas.modules.geography.entity.ZoneLocation;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1/sales", "/api/v1/farms/{farmId}/sales"})
@RequiredArgsConstructor
@Tag(name = "Farm Sales", description = "Quản lý bán vật nuôi xuất chuồng, trừ bì, tự động cập nhật sĩ số đàn, Sổ quỹ và VietQR")
public class FarmSalesController {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final ZoneLocationRepository zoneLocationRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final FarmFinancialSettingRepository farmFinancialSettingRepository;
    private final PartnerRepository partnerRepository;
    private final FarmSecurityEvaluator farmSecurity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateFarmSaleRequest {
        private Long farmId;
        private Long branchId;
        private Long partnerId;
        private String orderCode;
        private LocalDate saleDate;
        private Long livestockGroupId;
        private Integer headsSold;
        private BigDecimal grossWeightKg;
        private BigDecimal tareWeightKg;
        private BigDecimal unitPricePerKg;
        private String traderName;
        private String traderPhone;
        private String vehiclePlate;
        private String paymentMethod; // VIETQR, CASH, DEBT
        private BigDecimal paidAmount;
        private Boolean isFinalHarvest;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmSaleResponse {
        private Long id;
        private String orderCode;
        private LocalDate orderDate;
        private Long livestockGroupId;
        private String groupCode;
        private String barnName;
        private Integer headsSold;
        private BigDecimal grossWeightKg;
        private BigDecimal tareWeightKg;
        private BigDecimal netWeightKg;
        private BigDecimal avgWeightKg;
        private BigDecimal unitPrice;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
        private BigDecimal remainingDebt;
        private String paymentMethod;
        private String paymentStatus;
        private String traderName;
        private String traderPhone;
        private String vehiclePlate;
        private String vietQrUrl;
        private String notes;
        private Instant createdAt;
    }

    @PostMapping
    @Transactional
    @PreAuthorize("hasAnyAuthority('sales.create', 'PERM_FINANCE_SALES_ORDER') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    @Operation(summary = "Ghi nhận phiếu cân bán vật nuôi xuất chuồng trừ bì, giảm đàn và cập nhật Sổ quỹ / VietQR")
    public ResponseEntity<FarmSaleResponse> createSale(
            @PathVariable(required = false) Long farmId,
            @RequestBody CreateFarmSaleRequest request) {

        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : (request.getFarmId() != null ? request.getFarmId() : 1L);

        int headsSold = request.getHeadsSold() != null ? request.getHeadsSold() : 0;
        if (headsSold <= 0) {
            throw new BusinessException("INVALID_HEADS_SOLD", "Số con xuất bán phải lớn hơn 0");
        }
        BigDecimal gross = request.getGrossWeightKg() != null ? request.getGrossWeightKg() : BigDecimal.ZERO;
        BigDecimal tare = request.getTareWeightKg() != null ? request.getTareWeightKg() : BigDecimal.ZERO;
        if (gross.compareTo(BigDecimal.ZERO) <= 0 || tare.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("INVALID_WEIGHT", "Trọng lượng cân tổng phải lớn hơn 0 và trọng lượng bì không được âm");
        }
        BigDecimal netWeight = gross.subtract(tare);
        if (netWeight.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("INVALID_NET_WEIGHT", "Trọng lượng cân tịnh (tổng trừ bì) phải lớn hơn 0");
        }

        BigDecimal unitPrice = request.getUnitPricePerKg() != null ? request.getUnitPricePerKg() : BigDecimal.ZERO;
        if (unitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("INVALID_PRICE", "Đơn giá xuất bán không được nhỏ hơn 0");
        }
        BigDecimal totalAmount = netWeight.multiply(unitPrice).setScale(0, RoundingMode.HALF_UP);
        BigDecimal paidAmount = request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO;
        if (paidAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("INVALID_PAID_AMOUNT", "Số tiền thanh toán không được nhỏ hơn 0");
        }

        // Kiểm tra tồn đàn trước khi tạo phiếu xuất bán (BND-02)
        if (request.getLivestockGroupId() != null) {
            LivestockGroup targetGroup = livestockGroupRepository.findById(request.getLivestockGroupId())
                    .orElseThrow(() -> new BusinessException("GROUP_NOT_FOUND", "Không tìm thấy lứa nuôi #" + request.getLivestockGroupId()));
            if (!"ACTIVE".equalsIgnoreCase(targetGroup.getStatus())) {
                throw new BusinessException("GROUP_NOT_ACTIVE", "Lứa nuôi #" + targetGroup.getGroupCode() + " đã đóng, không thể xuất bán thêm");
            }
            int currentQty = targetGroup.getCurrentQuantity() != null ? targetGroup.getCurrentQuantity() : 0;
            if (headsSold > currentQty) {
                throw new BusinessException("HEADS_EXCEED_STOCK",
                        String.format("Số con xuất bán (%d con) vượt quá sĩ số hiện có trong chuồng (%d con)", headsSold, currentQty));
            }
        }
        BigDecimal debtAmount = totalAmount.subtract(paidAmount);
        if (debtAmount.compareTo(BigDecimal.ZERO) < 0) {
            debtAmount = BigDecimal.ZERO;
        }

        String orderCode = StringUtils.hasText(request.getOrderCode())
                ? request.getOrderCode().trim().toUpperCase()
                : "XBAN-" + LocalDate.now().toString().replace("-", "").substring(2) + "-" + (System.currentTimeMillis() % 10000);

        Long branchId = request.getBranchId();
        if (branchId == null && request.getLivestockGroupId() != null) {
            LivestockGroup g = livestockGroupRepository.findById(request.getLivestockGroupId()).orElse(null);
            if (g != null) branchId = g.getBranchId();
        }

        Long resolvedPartnerId = request.getPartnerId() != null ? request.getPartnerId() : 1L;
        String resolvedTraderName = request.getTraderName();
        String resolvedTraderPhone = request.getTraderPhone();
        if (request.getPartnerId() != null) {
            Partner p = partnerRepository.findById(request.getPartnerId()).orElse(null);
            if (p != null) {
                if (!StringUtils.hasText(resolvedTraderName)) resolvedTraderName = p.getName();
                if (!StringUtils.hasText(resolvedTraderPhone)) resolvedTraderPhone = p.getPhone();
            }
        }

        String paymentStatus = debtAmount.compareTo(BigDecimal.ZERO) == 0
                ? "PAID"
                : (paidAmount.compareTo(BigDecimal.ZERO) > 0 ? "PARTIALLY_PAID" : "UNPAID");

        // 1. Tạo SalesOrder
        SalesOrder order = SalesOrder.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
                .branchId(branchId)
                .partnerId(resolvedPartnerId)
                .orderCode(orderCode)
                .orderDate(request.getSaleDate() != null ? request.getSaleDate() : LocalDate.now())
                .status("COMPLETED")
                .subtotalAmount(totalAmount)
                .discountAmount(BigDecimal.ZERO)
                .vatRate(BigDecimal.ZERO)
                .vatAmount(BigDecimal.ZERO)
                .finalAmount(totalAmount)
                .paidAmount(paidAmount)
                .debtAmount(debtAmount)
                .paymentStatus(paymentStatus)
                .notes(String.format("[CÂN TRỪ BÌ] Thương lái: %s (%s), Xe: %s. Tổng: %s kg, Bì: %s kg, Tịnh: %s kg (%d con). %s",
                        resolvedTraderName, resolvedTraderPhone, request.getVehiclePlate(),
                        gross, tare, netWeight, request.getHeadsSold() != null ? request.getHeadsSold() : 0,
                        request.getNotes() != null ? request.getNotes() : ""))
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        order = salesOrderRepository.save(order);

        // Lưu Order Item
        SalesOrderItem item = SalesOrderItem.builder()
                .salesOrderId(order.getId())
                .livestockGroupId(request.getLivestockGroupId())
                .itemName("Xuất bán vật nuôi")
                .quantity(netWeight)
                .shippedQuantity(netWeight)
                .unit("KG")
                .unitPrice(unitPrice)
                .discountAmount(BigDecimal.ZERO)
                .vatAmount(BigDecimal.ZERO)
                .finalAmount(totalAmount)
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();
        salesOrderItemRepository.save(item);

        // 2. Trừ sĩ số đàn tại lứa nuôi và đóng lứa nếu chọn Xuất hết đàn
        String groupCodeStr = "Đàn xuất chuồng";
        String barnNameStr = "Chuồng xuất";
        if (request.getLivestockGroupId() != null) {
            LivestockGroup group = livestockGroupRepository.findById(request.getLivestockGroupId()).orElse(null);
            if (group != null) {
                groupCodeStr = group.getGroupCode();
                int sold = request.getHeadsSold() != null ? request.getHeadsSold() : 0;
                int remaining = Math.max(0, group.getCurrentQuantity() - sold);
                group.setCurrentQuantity(remaining);

                boolean finalHarvest = Boolean.TRUE.equals(request.getIsFinalHarvest()) || remaining == 0;
                if (finalHarvest) {
                    group.setStatus("COMPLETED");
                    if (group.getLocationId() != null) {
                        ZoneLocation barn = zoneLocationRepository.findById(group.getLocationId()).orElse(null);
                        if (barn != null) {
                            barn.setStatus("EMPTY");
                            barnNameStr = barn.getName();
                            zoneLocationRepository.save(barn);
                        }
                    }
                } else {
                    if (group.getLocationId() != null) {
                        ZoneLocation barn = zoneLocationRepository.findById(group.getLocationId()).orElse(null);
                        if (barn != null) barnNameStr = barn.getName();
                    }
                }
                livestockGroupRepository.save(group);
            }
        }

        // 3. Nếu tiền khách trả > 0 -> Tự động sinh Phiếu Thu trên Sổ quỹ
        if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            FarmExpense incomeSlip = FarmExpense.builder()
                    .tenantId(tenantId)
                    .farmId(targetFarmId)
                    .costCategoryId(1L)
                    .expenseCode("PT-BAN-" + order.getId())
                    .expenseSource("SALES_HARVEST")
                    .referenceId(order.getId())
                    .livestockGroupId(request.getLivestockGroupId())
                    .expenseDate(request.getSaleDate() != null ? request.getSaleDate() : LocalDate.now())
                    .amount(paidAmount)
                    .unitCostEligible(false)
                    .paymentMethod(StringUtils.hasText(request.getPaymentMethod()) ? request.getPaymentMethod() : "VIETQR")
                    .recipientName(request.getTraderName())
                    .notes(String.format("Thu tiền bán vật nuôi từ %s (%s con - %s kg)", request.getTraderName(), request.getHeadsSold(), netWeight))
                    .status("CONFIRMED")
                    .build();
            farmExpenseRepository.save(incomeSlip);
        }

        // 4. Nếu còn thiếu tiền -> Tự động sinh Công nợ phải thu thương lái
        if (debtAmount.compareTo(BigDecimal.ZERO) > 0) {
            DebtRecord debt = DebtRecord.builder()
                    .tenantId(tenantId)
                    .farmId(targetFarmId)
                    .partnerId(resolvedPartnerId)
                    .salesOrderId(order.getId())
                    .debtType("RECEIVABLE")
                    .totalDebt(totalAmount)
                    .paidAmount(paidAmount)
                    .remainingDebt(debtAmount)
                    .dueDate(order.getOrderDate().plusDays(15))
                    .notes(String.format("Nợ tiền mua gia súc/gia cầm xuất bán ngày %s từ thương lái %s", order.getOrderDate(), resolvedTraderName))
                    .status("ACTIVE")
                    .build();
            debtRecordRepository.save(debt);
        }

        // 5. Sinh VietQR động theo cấu hình tài khoản ngân hàng của trang trại
        String qrUrl = buildDynamicVietQrUrl(targetFarmId, totalAmount, "THANH TOAN " + orderCode);

        BigDecimal avgWeight = (request.getHeadsSold() != null && request.getHeadsSold() > 0)
                ? netWeight.divide(BigDecimal.valueOf(request.getHeadsSold()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        FarmSaleResponse response = FarmSaleResponse.builder()
                .id(order.getId())
                .orderCode(orderCode)
                .orderDate(order.getOrderDate())
                .livestockGroupId(request.getLivestockGroupId())
                .groupCode(groupCodeStr)
                .barnName(barnNameStr)
                .headsSold(request.getHeadsSold())
                .grossWeightKg(gross)
                .tareWeightKg(tare)
                .netWeightKg(netWeight)
                .avgWeightKg(avgWeight)
                .unitPrice(unitPrice)
                .totalAmount(totalAmount)
                .paidAmount(paidAmount)
                .remainingDebt(debtAmount)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(paymentStatus)
                .traderName(resolvedTraderName)
                .traderPhone(resolvedTraderPhone)
                .vehiclePlate(request.getVehiclePlate())
                .vietQrUrl(qrUrl)
                .notes(request.getNotes())
                .createdAt(order.getCreatedAt())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("(hasAnyAuthority('sales.view', 'PERM_FINANCE_SALES_ORDER') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Lấy danh sách các đơn bán xuất chuồng kèm VietQR")
    public ResponseEntity<Page<FarmSaleResponse>> getSales(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long filterFarmId,
            @RequestParam(required = false) Long branchId,
            @PageableDefault(sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable) {

        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : filterFarmId;
        Long requestedBranchId = branchId != null ? branchId : SecurityUtils.getCurrentBranchId();
        Long effectiveBranchId = farmSecurity.resolveEffectiveBranchId(targetFarmId, requestedBranchId);

        Page<SalesOrder> orders = targetFarmId != null
                ? salesOrderRepository.findByFarmId(targetFarmId, pageable)
                : salesOrderRepository.findAll(pageable);

        List<SalesOrder> content = orders.getContent();
        if (effectiveBranchId != null) {
            content = content.stream()
                    .filter(o -> o.getBranchId() == null || effectiveBranchId.equals(o.getBranchId()))
                    .collect(Collectors.toList());
        }

        Map<Long, String> partnerNames = new HashMap<>();
        List<FarmSaleResponse> list = content.stream().map(o -> {
            BigDecimal amt = o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO;
            BigDecimal paid = o.getPaidAmount() != null ? o.getPaidAmount() : amt;
            BigDecimal debt = o.getDebtAmount() != null ? o.getDebtAmount() : BigDecimal.ZERO;
            String pStatus = debt.compareTo(BigDecimal.ZERO) == 0
                    ? "PAID"
                    : (paid.compareTo(BigDecimal.ZERO) > 0 ? "PARTIAL" : "UNPAID");
            String qrUrl = buildDynamicVietQrUrl(o.getFarmId() != null ? o.getFarmId() : 1L, amt, "THANH TOAN " + o.getOrderCode());

            String pName = null;
            if (o.getPartnerId() != null) {
                pName = partnerNames.computeIfAbsent(o.getPartnerId(),
                        pid -> partnerRepository.findById(pid).map(Partner::getName).orElse(null));
            }

            return FarmSaleResponse.builder()
                    .id(o.getId())
                    .orderCode(o.getOrderCode())
                    .orderDate(o.getOrderDate())
                    .totalAmount(amt)
                    .paidAmount(paid)
                    .remainingDebt(debt)
                    .paymentStatus(pStatus)
                    .paymentMethod("VIETQR")
                    .traderName(pName)
                    .notes(o.getNotes())
                    .vietQrUrl(qrUrl)
                    .createdAt(o.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(new PageImpl<>(list, pageable, effectiveBranchId != null ? list.size() : orders.getTotalElements()));
    }

    private String buildDynamicVietQrUrl(Long farmId, BigDecimal amount, String description) {
        FarmFinancialSetting setting = farmFinancialSettingRepository.findByFarmId(farmId).orElse(null);
        String bankBin = resolveBankBin(
                setting != null ? setting.getBankName() : null,
                setting != null ? setting.getBankBin() : null
        );
        String accNo = (setting != null && StringUtils.hasText(setting.getBankAccountNo())) ? setting.getBankAccountNo().trim() : "1026790945";
        String accName = (setting != null && StringUtils.hasText(setting.getBankAccountName())) ? setting.getBankAccountName().trim() : "TRAI CHAN NUOI";

        String encodedDesc = URLEncoder.encode(description != null ? description : "THANH TOAN", StandardCharsets.UTF_8);
        String encodedName = URLEncoder.encode(accName, StandardCharsets.UTF_8);
        return String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                bankBin, accNo, amount != null ? amount.toPlainString() : "0", encodedDesc, encodedName);
    }

    private String resolveBankBin(String bankName, String explicitBin) {
        String n = bankName != null ? bankName.toLowerCase() : "";
        if (n.contains("mb") || n.contains("quân đội") || n.contains("quan doi")) return "970422";
        if (n.contains("bidv")) return "970418";
        if (n.contains("vietin") || n.contains("ctg")) return "970415";
        if (n.contains("agri")) return "970405";
        if (n.contains("techcom") || n.contains("tcb")) return "970407";
        if (n.contains("acb")) return "970416";
        if (n.contains("vpbank") || n.contains("vpb")) return "970432";
        if (n.contains("sacom") || n.contains("stb")) return "970403";
        if (n.contains("tpbank") || n.contains("tpb")) return "970423";
        if (n.contains("vib")) return "970441";
        if (n.contains("shb")) return "970443";
        if (n.contains("hdbank") || n.contains("hdb")) return "970437";
        if (n.contains("msb")) return "970426";
        if (n.contains("ocb")) return "970448";
        if (n.contains("vietcombank") || n.contains("vcb")) return "970436";
        if (StringUtils.hasText(explicitBin)) return explicitBin.trim();
        return "970436";
    }
}
