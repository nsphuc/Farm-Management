package com.farm.saas.modules.finance.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.finance.dto.request.CreateSalesOrderRequest;
import com.farm.saas.modules.finance.dto.response.SalesOrderDetailResponse;
import com.farm.saas.modules.finance.entity.SalesDelivery;
import com.farm.saas.modules.finance.entity.SalesDeliveryItem;
import com.farm.saas.modules.finance.entity.SalesOrder;
import com.farm.saas.modules.finance.entity.SalesOrderItem;
import com.farm.saas.modules.finance.repository.*;
import com.farm.saas.modules.finance.service.SalesOrderService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.entity.WarehouseIssue;
import com.farm.saas.modules.inventory.entity.WarehouseIssueItem;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseIssueItemRepository;
import com.farm.saas.modules.inventory.repository.WarehouseIssueRepository;
import com.farm.saas.modules.platform.entity.Enterprise;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.EnterpriseRepository;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import com.farm.saas.modules.quality.entity.ProductBatch;
import com.farm.saas.modules.quality.repository.ProductBatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.farm.saas.common.codegenerator.CodeGenerator;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalesOrderServiceImpl implements SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final SalesDeliveryRepository salesDeliveryRepository;
    private final SalesDeliveryItemRepository salesDeliveryItemRepository;
    private final WarehouseIssueRepository warehouseIssueRepository;
    private final WarehouseIssueItemRepository warehouseIssueItemRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final ProductBatchRepository productBatchRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PartnerRepository partnerRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CodeGenerator codeGenerator;

    @Override
    @Transactional(readOnly = true)
    public Page<SalesOrderDetailResponse> getOrders(Long farmId, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Page<SalesOrder> page;
        if (farmId != null && farmId > 0) {
            validateFarm(farmId);
            page = salesOrderRepository.findByFarmId(farmId, pageable);
        } else {
            page = salesOrderRepository.findByTenantId(tenantId, pageable);
        }
        return page.map(this::toDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesOrderDetailResponse getOrderById(Long farmId, Long id) {
        validateFarm(farmId);
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Sales order not found: " + id));
        if (!order.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Sales order does not belong to specified farm");
        }
        return toDetailResponse(order);
    }

    @Override
    @Transactional
    public SalesOrderDetailResponse createOrder(Long farmId, CreateSalesOrderRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Farm farm = validateFarm(farmId);

        // Partner validation: BUYER or AGENT, and ACTIVE
        Partner partner = partnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Partner not found: " + request.getPartnerId()));
        if (!partner.getTenantId().equals(tenantId)) {
            throw new BusinessException("FORBIDDEN", "Access to partner forbidden");
        }
        if (!"BUYER".equalsIgnoreCase(partner.getPartnerType()) && !"AGENT".equalsIgnoreCase(partner.getPartnerType())) {
            throw new BusinessException("BAD_REQUEST", "Đối tác phải thuộc loại BUYER hoặc AGENT để tạo đơn bán sỉ");
        }
        if (!"ACTIVE".equalsIgnoreCase(partner.getStatus())) {
            throw new BusinessException("BAD_REQUEST", "Đối tác không ở trạng thái ACTIVE");
        }

        // Calculate financials
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CreateSalesOrderRequest.SalesOrderItemRequest itemReq : request.getItems()) {
            BigDecimal lineTotal = itemReq.getQuantity().multiply(itemReq.getUnitPrice());
            subtotal = subtotal.add(lineTotal);
        }

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        if (discount.compareTo(BigDecimal.ZERO) < 0 || discount.compareTo(subtotal) > 0) {
            throw new BusinessException("BAD_REQUEST", "Chiết khấu không hợp lệ (0 <= discount <= subtotal)");
        }

        BigDecimal vatRate = request.getVatRate() != null ? request.getVatRate() : BigDecimal.ZERO;
        BigDecimal taxableAmount = subtotal.subtract(discount);
        BigDecimal vatAmount = taxableAmount.multiply(vatRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal finalAmount = taxableAmount.add(vatAmount);

        // Credit limit check
        BigDecimal currentDebt = debtRecordRepository.sumActiveDebtByPartnerId(partner.getId());
        if (currentDebt == null) {
            currentDebt = BigDecimal.ZERO;
        }
        if (partner.getCreditLimit() != null && partner.getCreditLimit().compareTo(BigDecimal.ZERO) > 0) {
            if (currentDebt.add(finalAmount).compareTo(partner.getCreditLimit()) > 0) {
                throw new BusinessException("BAD_REQUEST", "EXCEED_CREDIT_LIMIT: Vượt quá hạn mức tín dụng của đối tác");
            }
        }

        String orderCode;
        do {
            orderCode = codeGenerator.generateSalesOrderCode();
        } while (salesOrderRepository.existsByTenantIdAndFarmIdAndOrderCode(tenantId, farmId, orderCode));

        SalesOrder order = SalesOrder.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .orderCode(orderCode)
                .partnerId(partner.getId())
                .orderDate(request.getOrderDate())
                .deliveryDate(request.getDeliveryDate())
                .subtotalAmount(subtotal)
                .discountAmount(discount)
                .vatRate(vatRate)
                .vatAmount(vatAmount)
                .finalAmount(finalAmount)
                .paidAmount(BigDecimal.ZERO)
                .debtAmount(finalAmount)
                .paymentStatus("UNPAID")
                .status("PENDING")
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();

        order = salesOrderRepository.save(order);

        // Save order items
        for (CreateSalesOrderRequest.SalesOrderItemRequest itemReq : request.getItems()) {
            BigDecimal linePrice = itemReq.getQuantity().multiply(itemReq.getUnitPrice());
            BigDecimal itemDiscount = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal itemVat = BigDecimal.ZERO;
            if (subtotal.compareTo(BigDecimal.ZERO) > 0) {
                itemVat = vatAmount.multiply(linePrice).divide(subtotal, 2, RoundingMode.HALF_UP);
            }
            BigDecimal itemFinal = linePrice.subtract(itemDiscount).add(itemVat);

            SalesOrderItem item = SalesOrderItem.builder()
                    .salesOrderId(order.getId())
                    .productBatchId(itemReq.getProductBatchId())
                    .itemName(itemReq.getItemName())
                    .quantity(itemReq.getQuantity())
                    .shippedQuantity(BigDecimal.ZERO)
                    .unit(itemReq.getUnit())
                    .unitPrice(itemReq.getUnitPrice())
                    .discountAmount(itemDiscount)
                    .vatAmount(itemVat)
                    .finalAmount(itemFinal)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .createdBy(currentUserId)
                    .updatedBy(currentUserId)
                    .build();
            salesOrderItemRepository.save(item);
        }

        // GAP-ACC-07: Notify farm manager when wholesale order created in PENDING
        if ("PENDING".equals(order.getStatus())) {
            Long managerUserId = farm != null ? farm.getManagerUserId() : null;
            sendNotificationQuietly(
                    tenantId,
                    managerUserId,
                    "Đơn bán sỉ B2B mới chờ duyệt: " + order.getOrderCode(),
                    "Kế toán vừa lập Đơn bán sỉ [" + order.getOrderCode() + "] với tổng thanh toán " + order.getFinalAmount() + " VNĐ đang chờ phê duyệt.",
                    "SYSTEM",
                    "SALES_ORDER",
                    order.getId(),
                    "/app/sales-cashflow"
            );
        }

        return toDetailResponse(order);
    }

    @Override
    @Transactional
    public SalesOrderDetailResponse confirmOrder(Long farmId, Long id) {
        validateFarm(farmId);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        SalesOrder order = salesOrderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Sales order not found: " + id));
        if (!order.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Sales order does not belong to specified farm");
        }
        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException("BAD_REQUEST", "Chỉ có thể duyệt đơn ở trạng thái PENDING");
        }

        List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(order.getId());
        for (SalesOrderItem item : items) {
            if (item.getProductBatchId() != null) {
                // Lock row product_batches using PESSIMISTIC_WRITE
                ProductBatch batch = productBatchRepository.findByIdForUpdate(item.getProductBatchId())
                        .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Product batch not found: " + item.getProductBatchId()));

                if (!"SELLING".equalsIgnoreCase(batch.getStatus()) &&
                        !"PRINTED".equalsIgnoreCase(batch.getStatus()) &&
                        !"READY_TO_PRINT".equalsIgnoreCase(batch.getStatus())) {
                    throw new BusinessException("BAD_REQUEST", "Lô hàng không ở trạng thái sẵn sàng bán: " + batch.getStatus());
                }

                BigDecimal available = batch.getRemainingQuantity().subtract(batch.getReservedQuantity());
                if (available.compareTo(item.getQuantity()) < 0) {
                    throw new BusinessException("BAD_REQUEST",
                            "INSUFFICIENT_BATCH_RESERVED_STOCK: Lô không đủ tồn khả dụng để giữ chỗ");
                }

                batch.setReservedQuantity(batch.getReservedQuantity().add(item.getQuantity()));
                batch.setStatus("SELLING");
                batch.setUpdatedAt(Instant.now());
                productBatchRepository.save(batch);
            }
        }

        order.setStatus("CONFIRMED");
        order.setUpdatedAt(Instant.now());
        order.setUpdatedBy(currentUserId);
        order = salesOrderRepository.save(order);

        // Tự động tạo Phiếu Giao Hàng DRAFT & Phiếu Xuất Kho cho Thủ Kho
        autoCreateDraftDeliveryAndIssueForOrder(farmId, order, items, currentUserId);

        // GAP-ACC-07: 2-way notification on confirmation
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long accountantUserId = order.getCreatedBy();
        if (accountantUserId == null) {
            accountantUserId = userRepository.findByUsername("accountant").map(User::getId).orElse(null);
        }
        sendNotificationQuietly(
                tenantId,
                accountantUserId,
                "Đơn bán sỉ [" + order.getOrderCode() + "] đã được phê duyệt",
                "Đơn bán sỉ [" + order.getOrderCode() + "] đã được phê duyệt và ghi nhận công nợ phải thu.",
                "SYSTEM",
                "SALES_ORDER",
                order.getId(),
                "/app/sales-cashflow"
        );

        // Notify warehouse staff to prepare goods
        Optional<User> whUserOpt = userRepository.findByUsername("warehouse");
        if (whUserOpt.isPresent()) {
            sendNotificationQuietly(
                    tenantId,
                    whUserOpt.get().getId(),
                    "Lệnh chuẩn bị giao hàng cho đơn bán sỉ: " + order.getOrderCode(),
                    "Đơn bán sỉ [" + order.getOrderCode() + "] đã được Giám đốc phê duyệt. Vui lòng chuẩn bị lô thành phẩm và lập phiếu xuất xe giao hàng.",
                    "SYSTEM",
                    "SALES_ORDER",
                    order.getId(),
                    "/app/sales-cashflow"
            );
        }

        return toDetailResponse(order);
    }

    @Override
    @Transactional
    public SalesOrderDetailResponse cancelOrder(Long farmId, Long id) {
        validateFarm(farmId);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        SalesOrder order = salesOrderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Sales order not found: " + id));
        if (!order.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Sales order does not belong to specified farm");
        }

        List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(order.getId());
        BigDecimal totalShipped = items.stream()
                .map(SalesOrderItem::getShippedQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalShipped.compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException("BAD_REQUEST", "Không thể hủy đơn hàng đã có đợt giao hàng hoàn tất");
        }

        if ("CONFIRMED".equalsIgnoreCase(order.getStatus())) {
            for (SalesOrderItem item : items) {
                if (item.getProductBatchId() != null) {
                    ProductBatch batch = productBatchRepository.findByIdForUpdate(item.getProductBatchId()).orElse(null);
                    if (batch != null) {
                        BigDecimal newReserved = batch.getReservedQuantity().subtract(item.getQuantity());
                        if (newReserved.compareTo(BigDecimal.ZERO) < 0) {
                            newReserved = BigDecimal.ZERO;
                        }
                        batch.setReservedQuantity(newReserved);
                        batch.setUpdatedAt(Instant.now());
                        productBatchRepository.save(batch);
                    }
                }
            }
        }

        // Hủy bản ghi công nợ dự kiến nếu chưa thanh toán
        debtRecordRepository.findBySalesOrderId(order.getId()).ifPresent(debt -> {
            if (debt.getPaidAmount() == null || debt.getPaidAmount().compareTo(BigDecimal.ZERO) == 0) {
                debt.setStatus("CANCELLED");
                debt.setUpdatedAt(Instant.now());
                debt.setUpdatedBy(currentUserId);
                debtRecordRepository.save(debt);
            }
        });

        order.setStatus("CANCELLED");
        order.setUpdatedAt(Instant.now());
        order.setUpdatedBy(currentUserId);
        order = salesOrderRepository.save(order);

        // GAP-ACC-07: Notify accountant on cancellation
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long accountantUserId = order.getCreatedBy();
        if (accountantUserId == null) {
            accountantUserId = userRepository.findByUsername("accountant").map(User::getId).orElse(null);
        }
        sendNotificationQuietly(
                tenantId,
                accountantUserId,
                "Đơn bán sỉ [" + order.getOrderCode() + "] đã bị hủy",
                "Đơn bán sỉ [" + order.getOrderCode() + "] đã bị hủy và đã hoàn trả tồn giữ chỗ.",
                "WARNING",
                "SALES_ORDER",
                order.getId(),
                "/app/sales-cashflow"
        );

        return toDetailResponse(order);
    }

    private void sendNotificationQuietly(Long tenantId, Long recipientUserId, String title, String message, String type, String refType, Long refId, String actionUrl) {
        if (recipientUserId == null) return;
        try {
            notificationService.sendNotification(tenantId, recipientUserId, title, message, type, refType, refId, actionUrl);
        } catch (Exception ex) {
            log.warn("Failed to send sales order notification to user id={}: {}", recipientUserId, ex.getMessage());
        }
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

    private String generateVietQrUrl(Long tenantId, String orderCode, BigDecimal debtAmount) {
        if (debtAmount == null || debtAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        Optional<Enterprise> entOpt = enterpriseRepository.findByTenantId(tenantId);
        if (entOpt.isPresent()) {
            Enterprise ent = entOpt.get();
            if (ent.getBankBin() != null && ent.getBankAccountNo() != null) {
                try {
                    String encodedContent = URLEncoder.encode("SO " + orderCode, StandardCharsets.UTF_8);
                    String accountName = ent.getBankAccountName() != null
                            ? URLEncoder.encode(ent.getBankAccountName(), StandardCharsets.UTF_8)
                            : "";
                    return String.format("https://img.vietqr.io/image/%s-%s-compact.png?amount=%s&addInfo=%s&accountName=%s",
                            ent.getBankBin(), ent.getBankAccountNo(), debtAmount.toPlainString(), encodedContent, accountName);
                } catch (Exception e) {
                    return null;
                }
            }
        }
        return null;
    }

    private SalesOrderDetailResponse toDetailResponse(SalesOrder order) {
        String farmName = farmRepository.findById(order.getFarmId()).map(Farm::getName).orElse(null);
        Partner partner = partnerRepository.findById(order.getPartnerId()).orElse(null);

        String partnerCode = partner != null ? partner.getCode() : null;
        String partnerName = partner != null ? partner.getName() : null;
        BigDecimal partnerCreditLimit = partner != null ? partner.getCreditLimit() : BigDecimal.ZERO;
        Integer paymentTermDays = partner != null ? partner.getPaymentTermDays() : 0;
        BigDecimal currentDebt = partner != null ? debtRecordRepository.sumActiveDebtByPartnerId(partner.getId()) : BigDecimal.ZERO;

        LocalDate dueDate = order.getOrderDate().plusDays(paymentTermDays);

        Optional<Enterprise> entOpt = enterpriseRepository.findByTenantId(order.getTenantId());
        String bankBin = entOpt.map(Enterprise::getBankBin).orElse(null);
        String bankName = entOpt.map(Enterprise::getBankName).orElse(null);
        String bankAccountNo = entOpt.map(Enterprise::getBankAccountNo).orElse(null);
        String bankAccountName = entOpt.map(Enterprise::getBankAccountName).orElse(null);

        String vietQrUrl = generateVietQrUrl(order.getTenantId(), order.getOrderCode(), order.getDebtAmount());

        List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(order.getId());
        List<SalesOrderDetailResponse.SalesOrderItemDto> itemDtos = items.stream().map(it -> {
            String batchCode = null;
            if (it.getProductBatchId() != null) {
                batchCode = productBatchRepository.findById(it.getProductBatchId()).map(ProductBatch::getBatchCode).orElse(null);
            }
            return SalesOrderDetailResponse.SalesOrderItemDto.builder()
                    .id(it.getId())
                    .productBatchId(it.getProductBatchId())
                    .batchCode(batchCode)
                    .itemName(it.getItemName())
                    .quantity(it.getQuantity())
                    .shippedQuantity(it.getShippedQuantity())
                    .unit(it.getUnit())
                    .unitPrice(it.getUnitPrice())
                    .discountAmount(it.getDiscountAmount())
                    .vatAmount(it.getVatAmount())
                    .finalAmount(it.getFinalAmount())
                    .totalPrice(it.getQuantity().multiply(it.getUnitPrice()))
                    .build();
        }).collect(Collectors.toList());

        String creatorName = order.getCreatedBy() != null
                ? userRepository.findById(order.getCreatedBy()).map(User::getFullName).orElse(null)
                : null;

        return SalesOrderDetailResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .orderDate(order.getOrderDate())
                .farmId(order.getFarmId())
                .farmName(farmName)
                .partnerId(order.getPartnerId())
                .partnerCode(partnerCode)
                .partnerName(partnerName)
                .partnerCreditLimit(partnerCreditLimit)
                .partnerCurrentDebt(currentDebt != null ? currentDebt : BigDecimal.ZERO)
                .paymentTermDays(paymentTermDays)
                .dueDate(dueDate)
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .vatRate(order.getVatRate())
                .vatAmount(order.getVatAmount())
                .finalAmount(order.getFinalAmount())
                .paidAmount(order.getPaidAmount())
                .debtAmount(order.getDebtAmount())
                .status(order.getStatus())
                .deliveryStatus(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .vietQrUrl(vietQrUrl)
                .bankBin(bankBin)
                .bankName(bankName)
                .bankAccountNo(bankAccountNo)
                .bankAccountName(bankAccountName)
                .items(itemDtos)
                .creatorFullName(creatorName)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private void autoCreateDraftDeliveryAndIssueForOrder(Long farmId, SalesOrder order, List<SalesOrderItem> items, Long currentUserId) {
        try {
            Long tenantId = order.getTenantId();
            Partner partner = partnerRepository.findById(order.getPartnerId()).orElse(null);
            String receiverName = partner != null ? partner.getName() : "Khách hàng mua sỉ";
            String shippingAddress = partner != null ? partner.getAddress() : null;

            // 1. Tạo Phiếu Giao Hàng SalesDelivery ở trạng thái DRAFT (Chờ xuất bến) nếu chưa có
            List<SalesDelivery> existingDeliveries = salesDeliveryRepository.findBySalesOrderId(order.getId());
            if (existingDeliveries.isEmpty()) {
                String delCode;
                do {
                    delCode = codeGenerator.generateDeliveryCode();
                } while (salesDeliveryRepository.existsByTenantIdAndFarmIdAndDeliveryCode(tenantId, farmId, delCode));
                SalesDelivery del = SalesDelivery.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .salesOrderId(order.getId())
                        .deliveryCode(delCode)
                        .deliveryDate(order.getDeliveryDate() != null ? order.getDeliveryDate() : LocalDate.now())
                        .receiverName(receiverName)
                        .shippingAddress(shippingAddress)
                        .status("DRAFT")
                        .totalShippedAmount(order.getFinalAmount())
                        .notes("Phiếu xuất hàng tự động từ đơn bán sỉ " + order.getOrderCode())
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .createdBy(currentUserId)
                        .updatedBy(currentUserId)
                        .build();
                del = salesDeliveryRepository.save(del);

                for (SalesOrderItem it : items) {
                    SalesDeliveryItem dItem = SalesDeliveryItem.builder()
                            .deliveryId(del.getId())
                            .salesOrderItemId(it.getId())
                            .productBatchId(it.getProductBatchId())
                            .quantity(it.getQuantity())
                            .unitPrice(it.getUnitPrice())
                            .totalPrice(it.getFinalAmount() != null ? it.getFinalAmount() : it.getQuantity().multiply(it.getUnitPrice()))
                            .notes(it.getItemName())
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();
                    salesDeliveryItemRepository.save(dItem);
                }
            }

            // 2. Tạo Phiếu Xuất Kho WarehouseIssue (SALE_FULFILLMENT) cho Thủ kho
            Long primaryWarehouseId = null;
            for (SalesOrderItem it : items) {
                if (it.getProductBatchId() != null) {
                    ProductBatch b = productBatchRepository.findById(it.getProductBatchId()).orElse(null);
                    if (b != null && b.getWarehouseId() != null) {
                        primaryWarehouseId = b.getWarehouseId();
                        break;
                    }
                }
            }
            if (primaryWarehouseId != null) {
                String issueCode = "ISS-" + order.getOrderCode();
                if (!warehouseIssueRepository.existsByTenantIdAndFarmIdAndIssueCode(tenantId, farmId, issueCode)) {
                    WarehouseIssue issue = WarehouseIssue.builder()
                            .tenantId(tenantId)
                            .farmId(farmId)
                            .warehouseId(primaryWarehouseId)
                            .issueCode(issueCode)
                            .issueType("SALE_FULFILLMENT")
                            .receiverName(receiverName)
                            .isBackflushed(false)
                            .issueDate(order.getDeliveryDate() != null ? order.getDeliveryDate() : LocalDate.now())
                            .totalAmount(order.getFinalAmount())
                            .notes("Phiếu xuất kho tự động cho đơn bán sỉ " + order.getOrderCode())
                            .status("DRAFT")
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();
                    issue = warehouseIssueRepository.save(issue);

                    for (SalesOrderItem it : items) {
                        if (it.getProductBatchId() != null) {
                            ProductBatch b = productBatchRepository.findById(it.getProductBatchId()).orElse(null);
                            Long materialId = 1L;
                            if (b != null && b.getWarehouseId() != null) {
                                materialId = warehouseInventoryRepository.findByWarehouseId(b.getWarehouseId())
                                        .stream()
                                        .filter(inv -> b.getBatchCode().equalsIgnoreCase(inv.getBatchNumber()))
                                        .map(WarehouseInventory::getMaterialId)
                                        .findFirst()
                                        .orElse(1L);
                            }
                            WarehouseIssueItem wItem = WarehouseIssueItem.builder()
                                    .issueId(issue.getId())
                                    .tenantId(tenantId)
                                    .materialId(materialId)
                                    .batchNumber(b != null ? b.getBatchCode() : "LOT-SALE")
                                    .enteredUnit(it.getUnit())
                                    .enteredQuantity(it.getQuantity())
                                    .conversionFactor(BigDecimal.ONE.setScale(4))
                                    .quantity(it.getQuantity())
                                    .unitPrice(it.getUnitPrice())
                                    .totalPrice(it.getFinalAmount() != null ? it.getFinalAmount() : it.getQuantity().multiply(it.getUnitPrice()))
                                    .createdAt(Instant.now())
                                    .createdBy(currentUserId)
                                    .build();
                            warehouseIssueItemRepository.save(wItem);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to auto-create delivery/issue for order {}: {}", order.getOrderCode(), ex.getMessage());
        }
    }
}
