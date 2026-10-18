package com.farm.saas.modules.finance.service.impl;

import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.finance.dto.request.CreateSalesDeliveryRequest;
import com.farm.saas.modules.finance.dto.request.UpdateDeliveryPodRequest;
import com.farm.saas.modules.finance.dto.response.SalesDeliveryDetailResponse;
import com.farm.saas.modules.finance.entity.*;
import com.farm.saas.modules.finance.repository.*;
import com.farm.saas.modules.finance.service.SalesDeliveryService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import com.farm.saas.modules.quality.entity.ProductBatch;
import com.farm.saas.modules.quality.entity.ProductBatchTransaction;
import com.farm.saas.modules.quality.repository.ProductBatchRepository;
import com.farm.saas.modules.quality.repository.ProductBatchTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalesDeliveryServiceImpl implements SalesDeliveryService {

    private final SalesDeliveryRepository salesDeliveryRepository;
    private final SalesDeliveryItemRepository salesDeliveryItemRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final ProductBatchRepository productBatchRepository;
    private final ProductBatchTransactionRepository productBatchTransactionRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PartnerRepository partnerRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<SalesDeliveryDetailResponse> getDeliveries(Long farmId, Pageable pageable) {
        validateFarm(farmId);
        Page<SalesDelivery> page = salesDeliveryRepository.findByFarmId(farmId, pageable);
        return page.map(this::toDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesDeliveryDetailResponse getDeliveryById(Long farmId, Long id) {
        validateFarm(farmId);
        SalesDelivery delivery = salesDeliveryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Sales delivery not found: " + id));
        if (!delivery.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Delivery does not belong to specified farm");
        }
        return toDetailResponse(delivery);
    }

    @Override
    @Transactional
    public SalesDeliveryDetailResponse createDelivery(Long farmId, CreateSalesDeliveryRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        validateFarm(farmId);

        SalesOrder order = salesOrderRepository.findByIdForUpdate(request.getSalesOrderId())
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Sales order not found: " + request.getSalesOrderId()));
        if (!order.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Sales order does not belong to specified farm");
        }
        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException("BAD_REQUEST", "Không thể tạo đợt giao hàng cho đơn đã bị hủy");
        }

        Partner partner = partnerRepository.findById(order.getPartnerId())
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Partner not found: " + order.getPartnerId()));

        String deliveryCode = request.getDeliveryCode();
        if (deliveryCode == null || deliveryCode.isBlank()) {
            deliveryCode = "DEL-" + farmId + "-" + (System.currentTimeMillis() % 10000000);
        }

        BigDecimal totalShippedAmount = BigDecimal.ZERO;

        // Verify over-delivery guard
        for (CreateSalesDeliveryRequest.SalesDeliveryItemRequest itemReq : request.getItems()) {
            SalesOrderItem orderItem = salesOrderItemRepository.findById(itemReq.getSalesOrderItemId())
                    .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Sales order item not found: " + itemReq.getSalesOrderItemId()));

            if (orderItem.getShippedQuantity().add(itemReq.getQuantity()).compareTo(orderItem.getQuantity()) > 0) {
                throw new ApiException(HttpStatus.CONFLICT, "OVER_DELIVERY_PROHIBITED",
                        "Số lượng giao (" + itemReq.getQuantity() + ") cộng số lượng đã giao (" +
                                orderItem.getShippedQuantity() + ") vượt quá số lượng đặt hàng (" + orderItem.getQuantity() + ")");
            }
            totalShippedAmount = totalShippedAmount.add(itemReq.getQuantity().multiply(orderItem.getUnitPrice()));
        }

        SalesDelivery delivery = SalesDelivery.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .salesOrderId(order.getId())
                .logisticsPartnerId(request.getLogisticsPartnerId())
                .deliveryCode(deliveryCode)
                .deliveryDate(request.getDeliveryDate())
                .driverName(request.getDriverName())
                .vehiclePlate(request.getVehiclePlate())
                .receiverName(request.getReceiverName())
                .shippingAddress(request.getShippingAddress())
                .status("DELIVERED")
                .deliveredByUserId(currentUserId)
                .totalShippedAmount(totalShippedAmount)
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();

        delivery = salesDeliveryRepository.save(delivery);

        // Execute inventory deduction & ledger entry (Flow 6)
        for (CreateSalesDeliveryRequest.SalesDeliveryItemRequest itemReq : request.getItems()) {
            SalesOrderItem orderItem = salesOrderItemRepository.findById(itemReq.getSalesOrderItemId()).get();
            BigDecimal deliveryQty = itemReq.getQuantity();

            // Pessimistic write lock on product batch
            ProductBatch batch = productBatchRepository.findByIdForUpdate(itemReq.getProductBatchId())
                    .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Product batch not found: " + itemReq.getProductBatchId()));

            BigDecimal balanceBefore = batch.getRemainingQuantity();
            BigDecimal balanceAfter = balanceBefore.subtract(deliveryQty);
            if (balanceAfter.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("BAD_REQUEST", "Số lượng tồn kho lô không đủ để xuất giao");
            }

            BigDecimal reservedBefore = batch.getReservedQuantity();
            BigDecimal reservedAfter = reservedBefore.subtract(deliveryQty);
            if (reservedAfter.compareTo(BigDecimal.ZERO) < 0) {
                reservedAfter = BigDecimal.ZERO;
            }

            batch.setRemainingQuantity(balanceAfter);
            batch.setReservedQuantity(reservedAfter);
            batch.setUpdatedAt(Instant.now());
            productBatchRepository.save(batch);

            // Save delivery item
            BigDecimal totalPrice = deliveryQty.multiply(orderItem.getUnitPrice());
            SalesDeliveryItem deliveryItem = SalesDeliveryItem.builder()
                    .deliveryId(delivery.getId())
                    .salesOrderItemId(orderItem.getId())
                    .productBatchId(batch.getId())
                    .quantity(deliveryQty)
                    .unitPrice(orderItem.getUnitPrice())
                    .totalPrice(totalPrice)
                    .notes(itemReq.getNotes())
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            deliveryItem = salesDeliveryItemRepository.save(deliveryItem);

            // Record in immutable product_batch_transactions ledger
            ProductBatchTransaction pbt = ProductBatchTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .productBatchId(batch.getId())
                    .transactionType("SALE_DISPATCH")
                    .referenceType("SALES_DELIVERY")
                    .referenceId(delivery.getId())
                    .referenceItemId(deliveryItem.getId())
                    .direction("OUT")
                    .quantity(deliveryQty)
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(delivery.getDeliveryDate())
                    .notes("Xuất giao hàng cho đơn " + order.getOrderCode())
                    .createdAt(Instant.now())
                    .createdBy(currentUserId)
                    .build();
            productBatchTransactionRepository.save(pbt);

            // Update order item shipped quantity
            orderItem.setShippedQuantity(orderItem.getShippedQuantity().add(deliveryQty));
            orderItem.setUpdatedAt(Instant.now());
            salesOrderItemRepository.save(orderItem);
        }

        // Update sales order status
        List<SalesOrderItem> allItems = salesOrderItemRepository.findBySalesOrderId(order.getId());
        boolean allFulfilled = allItems.stream().allMatch(it -> it.getShippedQuantity().compareTo(it.getQuantity()) >= 0);
        order.setStatus(allFulfilled ? "COMPLETED" : "DELIVERED");
        order.setUpdatedAt(Instant.now());
        order.setUpdatedBy(currentUserId);
        salesOrderRepository.save(order);

        // Auto-generate or update RECEIVABLE debt in debt_records
        Optional<DebtRecord> existingDebtOpt = debtRecordRepository.findBySalesOrderId(order.getId());
        if (existingDebtOpt.isEmpty()) {
            int termDays = partner.getPaymentTermDays() != null ? partner.getPaymentTermDays() : 30;
            LocalDate dueDate = delivery.getDeliveryDate().plusDays(termDays);
            DebtRecord debt = DebtRecord.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .partnerId(partner.getId())
                    .salesOrderId(order.getId())
                    .debtType("RECEIVABLE")
                    .totalDebt(order.getFinalAmount())
                    .paidAmount(BigDecimal.ZERO)
                    .remainingDebt(order.getFinalAmount())
                    .dueDate(dueDate)
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .createdBy(currentUserId)
                    .updatedBy(currentUserId)
                    .build();
            debtRecordRepository.save(debt);
        }

        return toDetailResponse(delivery);
    }

    @Override
    @Transactional
    public SalesDeliveryDetailResponse dispatchDelivery(Long farmId, Long id) {
        validateFarm(farmId);
        SalesDelivery delivery = salesDeliveryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Delivery not found: " + id));
        return toDetailResponse(delivery);
    }

    @Override
    @Transactional
    public SalesDeliveryDetailResponse updatePod(Long farmId, Long id, UpdateDeliveryPodRequest request) {
        validateFarm(farmId);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        SalesDelivery delivery = salesDeliveryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Delivery not found: " + id));
        if (!delivery.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Delivery does not belong to specified farm");
        }

        delivery.setProofOfDeliveryUrl(request.getProofOfDeliveryUrl());
        if (request.getReceiverName() != null && !request.getReceiverName().isBlank()) {
            delivery.setReceiverName(request.getReceiverName());
        }
        if (request.getNotes() != null) {
            delivery.setNotes(request.getNotes());
        }
        delivery.setStatus("DELIVERED");
        delivery.setUpdatedAt(Instant.now());
        delivery.setUpdatedBy(currentUserId);
        delivery = salesDeliveryRepository.save(delivery);

        return toDetailResponse(delivery);
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

    private SalesDeliveryDetailResponse toDetailResponse(SalesDelivery delivery) {
        String farmName = farmRepository.findById(delivery.getFarmId()).map(Farm::getName).orElse(null);
        SalesOrder order = salesOrderRepository.findById(delivery.getSalesOrderId()).orElse(null);
        String orderCode = order != null ? order.getOrderCode() : null;
        Long partnerId = order != null ? order.getPartnerId() : null;
        String partnerName = partnerId != null ? partnerRepository.findById(partnerId).map(Partner::getName).orElse(null) : null;
        String logisticsName = delivery.getLogisticsPartnerId() != null
                ? partnerRepository.findById(delivery.getLogisticsPartnerId()).map(Partner::getName).orElse(null)
                : null;
        String deliveredByName = delivery.getDeliveredByUserId() != null
                ? userRepository.findById(delivery.getDeliveredByUserId()).map(User::getFullName).orElse(null)
                : null;

        List<SalesDeliveryItem> items = salesDeliveryItemRepository.findByDeliveryId(delivery.getId());
        List<SalesDeliveryDetailResponse.SalesDeliveryItemDto> itemDtos = items.stream().map(it -> {
            String batchCode = productBatchRepository.findById(it.getProductBatchId()).map(ProductBatch::getBatchCode).orElse(null);
            String itemName = salesOrderItemRepository.findById(it.getSalesOrderItemId()).map(SalesOrderItem::getItemName).orElse("Item");
            return SalesDeliveryDetailResponse.SalesDeliveryItemDto.builder()
                    .id(it.getId())
                    .salesOrderItemId(it.getSalesOrderItemId())
                    .productBatchId(it.getProductBatchId())
                    .batchCode(batchCode)
                    .itemName(itemName)
                    .quantity(it.getQuantity())
                    .unitPrice(it.getUnitPrice())
                    .totalPrice(it.getTotalPrice())
                    .notes(it.getNotes())
                    .build();
        }).collect(Collectors.toList());

        return SalesDeliveryDetailResponse.builder()
                .id(delivery.getId())
                .deliveryCode(delivery.getDeliveryCode())
                .salesOrderId(delivery.getSalesOrderId())
                .orderCode(orderCode)
                .farmId(delivery.getFarmId())
                .farmName(farmName)
                .partnerId(partnerId)
                .partnerName(partnerName)
                .deliveryDate(delivery.getDeliveryDate())
                .logisticsPartnerId(delivery.getLogisticsPartnerId())
                .logisticsPartnerName(logisticsName)
                .driverName(delivery.getDriverName())
                .vehiclePlate(delivery.getVehiclePlate())
                .receiverName(delivery.getReceiverName())
                .shippingAddress(delivery.getShippingAddress())
                .proofOfDeliveryUrl(delivery.getProofOfDeliveryUrl())
                .status(delivery.getStatus())
                .totalShippedAmount(delivery.getTotalShippedAmount())
                .deliveredByUserId(delivery.getDeliveredByUserId())
                .deliveredByName(deliveredByName)
                .notes(delivery.getNotes())
                .items(itemDtos)
                .createdAt(delivery.getCreatedAt())
                .updatedAt(delivery.getUpdatedAt())
                .build();
    }
}
