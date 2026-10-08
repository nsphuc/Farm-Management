package com.farmsaas.modules.finance.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.finance.dto.SalesOrderItemDto;
import com.farmsaas.modules.finance.dto.SalesOrderRequest;
import com.farmsaas.modules.finance.dto.SalesOrderResponse;
import com.farmsaas.modules.finance.entity.DebtRecord;
import com.farmsaas.modules.finance.entity.SalesOrder;
import com.farmsaas.modules.finance.entity.SalesOrderItem;
import com.farmsaas.modules.finance.entity.enums.DebtStatus;
import com.farmsaas.modules.finance.entity.enums.DebtType;
import com.farmsaas.modules.finance.entity.enums.DeliveryStatus;
import com.farmsaas.modules.finance.entity.enums.PaymentStatus;
import com.farmsaas.modules.finance.repository.DebtRecordRepository;
import com.farmsaas.modules.finance.repository.SalesOrderItemRepository;
import com.farmsaas.modules.finance.repository.SalesOrderRepository;
import com.farmsaas.modules.partner.entity.Partner;
import com.farmsaas.modules.partner.repository.PartnerRepository;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalesOrderServiceImpl implements SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PartnerRepository partnerRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional
    public SalesOrderResponse createOrder(Long farmId, SalesOrderRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Partner partner = partnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đối tác khách hàng ID: " + request.getPartnerId()));

        String orderCode = request.getOrderCode();
        if (orderCode == null || orderCode.isBlank()) {
            orderCode = generateOrderCode(tenantId, farmId);
        } else {
            orderCode = orderCode.trim().toUpperCase();
            if (salesOrderRepository.existsByTenantIdAndFarmIdAndOrderCode(tenantId, farmId, orderCode)) {
                throw new BusinessException("Mã đơn hàng '" + orderCode + "' đã tồn tại trong trang trại.");
            }
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<SalesOrderItem> itemsToSave = new ArrayList<>();

        for (SalesOrderItemDto itemDto : request.getItems()) {
            BigDecimal qty = itemDto.getQuantityKg();
            BigDecimal price = itemDto.getUnitPrice();
            BigDecimal subtotal = qty.multiply(price).setScale(2, RoundingMode.HALF_UP);
            totalAmount = totalAmount.add(subtotal);

            SalesOrderItem item = SalesOrderItem.builder()
                    .batchId(itemDto.getBatchId())
                    .seasonId(itemDto.getSeasonId())
                    .herdId(itemDto.getHerdId())
                    .productName(itemDto.getProductName())
                    .quantityKg(qty)
                    .unitPrice(price)
                    .subtotal(subtotal)
                    .build();
            itemsToSave.add(item);
        }

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal vat = request.getVatAmount() != null ? request.getVatAmount() : BigDecimal.ZERO;
        BigDecimal finalAmount = totalAmount.subtract(discount).add(vat);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;

        BigDecimal paid = request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO;

        PaymentStatus paymentStatus = request.getPaymentStatus();
        if (paymentStatus == null) {
            if (paid.compareTo(BigDecimal.ZERO) <= 0) {
                paymentStatus = PaymentStatus.CHUA_THANH_TOAN;
            } else if (paid.compareTo(finalAmount) >= 0) {
                paymentStatus = PaymentStatus.DA_XONG;
            } else {
                paymentStatus = PaymentStatus.MOT_PHAN;
            }
        }

        SalesOrder order = SalesOrder.builder()
                .farmId(farmId)
                .orderCode(orderCode)
                .partnerId(partner.getId())
                .partner(partner)
                .orderDate(request.getOrderDate())
                .totalAmount(totalAmount)
                .discountAmount(discount)
                .vatAmount(vat)
                .finalAmount(finalAmount)
                .paidAmount(paid)
                .paymentStatus(paymentStatus)
                .deliveryStatus(request.getDeliveryStatus() != null ? request.getDeliveryStatus() : DeliveryStatus.CHO_XUAT)
                .notes(request.getNotes())
                .createdByUserId(SecurityUtils.getCurrentUserId())
                .build();
        order.setTenantId(tenantId);

        SalesOrder savedOrder = salesOrderRepository.save(order);

        for (SalesOrderItem item : itemsToSave) {
            item.setOrderId(savedOrder.getId());
            item.setOrder(savedOrder);
            salesOrderItemRepository.save(item);
        }
        savedOrder.setItems(itemsToSave);

        // Tự động ghi nhận sổ công nợ phải thu nếu thanh toán chưa đủ
        BigDecimal remaining = finalAmount.subtract(paid);
        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            DebtRecord debt = DebtRecord.builder()
                    .farmId(farmId)
                    .partnerId(partner.getId())
                    .partner(partner)
                    .orderId(savedOrder.getId())
                    .order(savedOrder)
                    .debtType(DebtType.PHAI_THU_KHACH)
                    .originalAmount(remaining)
                    .paidAmount(BigDecimal.ZERO)
                    .remainingAmount(remaining)
                    .dueDate(request.getOrderDate().plusDays(30)) // Hạn chuẩn 30 ngày
                    .status(DebtStatus.TRONG_HAN)
                    .notes("Công nợ tự động từ đơn hàng " + savedOrder.getOrderCode())
                    .build();
            debt.setTenantId(tenantId);
            debtRecordRepository.save(debt);
            log.info("Automatically generated debt record for order: {}, remaining amount: {}", savedOrder.getOrderCode(), remaining);
        }

        log.info("Created sales order: {} with total: {}", savedOrder.getOrderCode(), finalAmount);
        return mapToResponse(savedOrder);
    }

    @Override
    @Transactional
    public SalesOrderResponse updateOrder(Long farmId, Long id, SalesOrderRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        SalesOrder order = salesOrderRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn hàng ID: " + id));

        if (request.getPartnerId() != null) {
            Partner partner = partnerRepository.findById(request.getPartnerId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đối tác ID: " + request.getPartnerId()));
            order.setPartnerId(partner.getId());
            order.setPartner(partner);
        }

        if (request.getOrderDate() != null) order.setOrderDate(request.getOrderDate());
        if (request.getNotes() != null) order.setNotes(request.getNotes());
        if (request.getDeliveryStatus() != null) order.setDeliveryStatus(request.getDeliveryStatus());

        if (request.getPaidAmount() != null) {
            order.setPaidAmount(request.getPaidAmount());
            if (order.getPaidAmount().compareTo(order.getFinalAmount()) >= 0) {
                order.setPaymentStatus(PaymentStatus.DA_XONG);
            } else if (order.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                order.setPaymentStatus(PaymentStatus.MOT_PHAN);
            } else {
                order.setPaymentStatus(PaymentStatus.CHUA_THANH_TOAN);
            }

            // Đồng bộ công nợ
            Optional<DebtRecord> debtOpt = debtRecordRepository.findByTenantIdAndFarmIdAndOrderId(tenantId, farmId, id);
            if (debtOpt.isPresent()) {
                DebtRecord debt = debtOpt.get();
                BigDecimal remaining = order.getFinalAmount().subtract(order.getPaidAmount());
                debt.setRemainingAmount(remaining.max(BigDecimal.ZERO));
                debt.setPaidAmount(order.getPaidAmount());
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                    debt.setStatus(DebtStatus.DA_TAT_TOAN);
                } else if (LocalDate.now().isAfter(debt.getDueDate())) {
                    debt.setStatus(DebtStatus.QUA_HAN);
                } else {
                    debt.setStatus(DebtStatus.TRONG_HAN);
                }
                debtRecordRepository.save(debt);
            }
        }

        SalesOrder updated = salesOrderRepository.save(order);
        log.info("Updated sales order ID: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public SalesOrderResponse updateDeliveryStatus(Long farmId, Long id, DeliveryStatus status) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        SalesOrder order = salesOrderRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn hàng ID: " + id));

        order.setDeliveryStatus(status);
        SalesOrder updated = salesOrderRepository.save(order);
        log.info("Order ID: {} delivery status updated to: {}", id, status);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesOrderResponse getOrderById(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        SalesOrder order = salesOrderRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn hàng ID: " + id));
        return mapToResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalesOrderResponse> searchOrders(Long farmId, Long partnerId, PaymentStatus paymentStatus, DeliveryStatus deliveryStatus, LocalDate fromDate, LocalDate toDate, String keyword, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return salesOrderRepository.searchOrders(tenantId, farmId, partnerId, paymentStatus, deliveryStatus, fromDate, toDate, keyword, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void deleteOrder(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        SalesOrder order = salesOrderRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn hàng ID: " + id));

        salesOrderRepository.delete(order);
        log.info("Deleted sales order ID: {} from Farm ID: {}", id, farmId);
    }

    private String generateOrderCode(Long tenantId, Long farmId) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String code;
        do {
            String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            code = "ORD-" + datePart + "-" + suffix;
        } while (salesOrderRepository.existsByTenantIdAndFarmIdAndOrderCode(tenantId, farmId, code));
        return code;
    }

    private SalesOrderResponse mapToResponse(SalesOrder o) {
        List<SalesOrderItemDto> itemDtos = o.getItems() != null
                ? o.getItems().stream().map(i -> SalesOrderItemDto.builder()
                .id(i.getId())
                .batchId(i.getBatchId())
                .seasonId(i.getSeasonId())
                .herdId(i.getHerdId())
                .productName(i.getProductName())
                .quantityKg(i.getQuantityKg())
                .unitPrice(i.getUnitPrice())
                .subtotal(i.getSubtotal())
                .build()).collect(Collectors.toList())
                : List.of();

        BigDecimal remaining = o.getFinalAmount() != null && o.getPaidAmount() != null
                ? o.getFinalAmount().subtract(o.getPaidAmount()).max(BigDecimal.ZERO)
                : BigDecimal.ZERO;

        return SalesOrderResponse.builder()
                .id(o.getId())
                .tenantId(o.getTenantId())
                .farmId(o.getFarmId())
                .orderCode(o.getOrderCode())
                .partnerId(o.getPartnerId())
                .partnerName(o.getPartner() != null ? o.getPartner().getName() : null)
                .partnerPhone(o.getPartner() != null ? o.getPartner().getPhone() : null)
                .orderDate(o.getOrderDate())
                .totalAmount(o.getTotalAmount())
                .discountAmount(o.getDiscountAmount())
                .vatAmount(o.getVatAmount())
                .finalAmount(o.getFinalAmount())
                .paidAmount(o.getPaidAmount())
                .remainingAmount(remaining)
                .paymentStatus(o.getPaymentStatus())
                .deliveryStatus(o.getDeliveryStatus())
                .notes(o.getNotes())
                .createdByUserId(o.getCreatedByUserId())
                .items(itemDtos)
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
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
