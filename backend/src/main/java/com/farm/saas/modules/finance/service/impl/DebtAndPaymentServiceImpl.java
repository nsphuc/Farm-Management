package com.farm.saas.modules.finance.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.finance.dto.request.AllocatePaymentRequest;
import com.farm.saas.modules.finance.dto.request.CreatePaymentTransactionRequest;
import com.farm.saas.modules.finance.dto.request.DebtOffsetRequest;
import com.farm.saas.modules.finance.dto.response.DebtRecordDetailResponse;
import com.farm.saas.modules.finance.dto.response.PaymentAllocationResponse;
import com.farm.saas.modules.finance.dto.response.PaymentTransactionDetailResponse;
import com.farm.saas.modules.finance.entity.*;
import com.farm.saas.modules.finance.repository.*;
import com.farm.saas.modules.finance.service.DebtAndPaymentService;
import com.farm.saas.modules.notification.service.NotificationService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DebtAndPaymentServiceImpl implements DebtAndPaymentService {

    private final DebtRecordRepository debtRecordRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PartnerRepository partnerRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<DebtRecordDetailResponse> getDebts(Long farmId, Long partnerId, String debtType, String status, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (farmId != null && farmId > 0) {
            validateFarm(farmId);
        }

        Specification<DebtRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));
            if (farmId != null && farmId > 0) {
                predicates.add(cb.equal(root.get("farmId"), farmId));
            }

            if (partnerId != null) {
                predicates.add(cb.equal(root.get("partnerId"), partnerId));
            }
            if (debtType != null && !debtType.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("debtType")), debtType.toUpperCase()));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.toUpperCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<DebtRecord> page = debtRecordRepository.findAll(spec, pageable);
        return page.map(this::toDebtDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public DebtRecordDetailResponse getDebtById(Long farmId, Long id) {
        validateFarm(farmId);
        DebtRecord debt = debtRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Debt record not found: " + id));
        if (!debt.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Debt record does not belong to specified farm");
        }
        return toDebtDetailResponse(debt);
    }

    @Override
    @Transactional
    public PaymentTransactionDetailResponse createPayment(Long farmId, CreatePaymentTransactionRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        validateFarm(farmId);

        String paymentCode = "PAY-" + farmId + "-" + (System.currentTimeMillis() % 10000000);

        boolean isChecker = SecurityUtils.getCurrentUser() != null &&
                SecurityUtils.getCurrentUser().hasAnyRole("ROLE_FARM_MANAGER", "ROLE_FARM_OWNER", "ROLE_SUPER_ADMIN");
        boolean isExpenseOrRefund = "PAYMENT".equalsIgnoreCase(request.getPaymentType()) || "REFUND".equalsIgnoreCase(request.getPaymentType());
        boolean shouldBePending = !isChecker && isExpenseOrRefund;

        String status = shouldBePending ? "PENDING" : "COMPLETED";
        Long confirmedBy = shouldBePending ? null : currentUserId;
        Instant confirmedAt = shouldBePending ? null : Instant.now();

        PaymentTransaction payment = PaymentTransaction.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .paymentCode(paymentCode)
                .paymentType(request.getPaymentType())
                .partnerId(request.getPartnerId())
                .salesOrderId(request.getSalesOrderId())
                .debtRecordId(request.getDebtRecordId())
                .amount(request.getAmount())
                .allocatedAmount(BigDecimal.ZERO)
                .paymentMethod(request.getPaymentMethod())
                .referenceCode(request.getReferenceCode())
                .qrTransferContent(request.getQrTransferContent())
                .proofImageUrl(request.getProofImageUrl())
                .paymentDate(request.getPaymentDate())
                .notes(request.getNotes())
                .status(status)
                .confirmedByUserId(confirmedBy)
                .confirmedAt(confirmedAt)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();

        payment = paymentTransactionRepository.save(payment);

        // If completed and allocations provided in request, process them sorted by debtRecordId ASC
        if ("COMPLETED".equals(status)) {
            if (request.getAllocations() != null && !request.getAllocations().isEmpty()) {
                List<CreatePaymentTransactionRequest.PaymentAllocationItemRequest> sortedItems = new ArrayList<>(request.getAllocations());
                sortedItems.sort(Comparator.comparing(CreatePaymentTransactionRequest.PaymentAllocationItemRequest::getDebtRecordId));

                for (CreatePaymentTransactionRequest.PaymentAllocationItemRequest item : sortedItems) {
                    applyAllocation(tenantId, farmId, payment, item.getDebtRecordId(), item.getAllocatedAmount(), item.getNotes());
                }
            } else if (payment.getDebtRecordId() != null) {
                applyAllocation(tenantId, farmId, payment, payment.getDebtRecordId(), payment.getAmount(), payment.getNotes());
            }
        }

        // GAP-ACC-08: Notify farm manager when payment transaction is recorded
        Farm farm = farmRepository.findById(farmId).orElse(null);
        Long managerUserId = farm != null ? farm.getManagerUserId() : null;
        sendNotificationQuietly(
                tenantId,
                managerUserId,
                "Phiếu giao dịch thanh toán mới: " + payment.getPaymentCode(),
                "Kế toán vừa lập phiếu giao dịch thanh toán [" + payment.getPaymentCode() + "] số tiền " + payment.getAmount() + " VNĐ.",
                "SYSTEM",
                "PAYMENT_TRANSACTION",
                payment.getId(),
                "/app/sales-cashflow"
        );

        return toPaymentDetailResponse(payment);
    }

    @Override
    @Transactional
    public PaymentTransactionDetailResponse confirmPayment(Long farmId, Long paymentId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        validateFarm(farmId);

        PaymentTransaction payment = paymentTransactionRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Payment transaction not found: " + paymentId));
        if (!payment.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Payment does not belong to specified farm");
        }

        if ("COMPLETED".equals(payment.getStatus())) {
            return toPaymentDetailResponse(payment);
        }

        payment.setStatus("COMPLETED");
        payment.setConfirmedByUserId(currentUserId);
        payment.setConfirmedAt(Instant.now());
        payment.setUpdatedAt(Instant.now());
        payment.setUpdatedBy(currentUserId);
        payment = paymentTransactionRepository.save(payment);

        if (payment.getDebtRecordId() != null && payment.getAllocatedAmount().compareTo(BigDecimal.ZERO) == 0) {
            applyAllocation(tenantId, farmId, payment, payment.getDebtRecordId(), payment.getAmount(), payment.getNotes());
        }

        return toPaymentDetailResponse(payment);
    }

    @Override
    @Transactional
    public PaymentTransactionDetailResponse cancelPayment(Long farmId, Long paymentId, String reason) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        validateFarm(farmId);

        PaymentTransaction payment = paymentTransactionRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Payment transaction not found: " + paymentId));
        if (!payment.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Payment does not belong to specified farm");
        }

        if ("CANCELLED".equals(payment.getStatus())) {
            return toPaymentDetailResponse(payment);
        }

        if (!"PENDING".equalsIgnoreCase(payment.getStatus()) && !"DRAFT".equalsIgnoreCase(payment.getStatus())) {
            throw new BusinessException("BAD_REQUEST", "Chỉ có thể hủy giao dịch thanh toán ở trạng thái PENDING hoặc DRAFT");
        }

        payment.setStatus("CANCELLED");
        if (reason != null && !reason.trim().isEmpty()) {
            String note = (payment.getNotes() != null && !payment.getNotes().isEmpty())
                    ? payment.getNotes() + " | Lý do hủy: " + reason.trim()
                    : "Lý do hủy: " + reason.trim();
            payment.setNotes(note);
        }
        payment.setUpdatedAt(Instant.now());
        payment.setUpdatedBy(currentUserId);
        payment = paymentTransactionRepository.save(payment);

        // GAP-ACC-08: Notify accountant on payment cancellation
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long accountantUserId = payment.getCreatedBy();
        if (accountantUserId == null) {
            accountantUserId = userRepository.findByUsername("accountant").map(User::getId).orElse(null);
        }
        sendNotificationQuietly(
                tenantId,
                accountantUserId,
                "Phiếu giao dịch thanh toán đã bị hủy: " + payment.getPaymentCode(),
                "Phiếu giao dịch thanh toán [" + payment.getPaymentCode() + "] đã bị hủy.",
                "WARNING",
                "PAYMENT_TRANSACTION",
                payment.getId(),
                "/app/sales-cashflow"
        );

        return toPaymentDetailResponse(payment);
    }

    @Override
    @Transactional
    public PaymentAllocationResponse allocatePayment(Long farmId, Long paymentId, AllocatePaymentRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        validateFarm(farmId);

        // Pessimistic write lock on payment transaction
        PaymentTransaction payment = paymentTransactionRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Payment transaction not found: " + paymentId));
        if (!payment.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Payment does not belong to specified farm");
        }

        DebtRecord debt = applyAllocation(tenantId, farmId, payment, request.getDebtRecordId(), request.getAllocatedAmount(), request.getNotes());

        SalesOrder order = null;
        if (debt.getSalesOrderId() != null) {
            order = salesOrderRepository.findById(debt.getSalesOrderId()).orElse(null);
        }

        return PaymentAllocationResponse.builder()
                .paymentId(payment.getId())
                .paymentCode(payment.getPaymentCode())
                .totalAmount(payment.getAmount())
                .allocatedAmount(payment.getAllocatedAmount())
                .status(payment.getStatus())
                .debtUpdate(PaymentAllocationResponse.DebtUpdateDto.builder()
                        .debtRecordId(debt.getId())
                        .salesOrderId(debt.getSalesOrderId())
                        .orderCode(order != null ? order.getOrderCode() : null)
                        .totalDebt(debt.getTotalDebt())
                        .paidAmount(debt.getPaidAmount())
                        .remainingDebt(debt.getRemainingDebt())
                        .status(debt.getStatus())
                        .build())
                .salesOrderUpdate(order != null ? PaymentAllocationResponse.SalesOrderUpdateDto.builder()
                        .orderId(order.getId())
                        .finalAmount(order.getFinalAmount())
                        .paidAmount(order.getPaidAmount())
                        .debtAmount(order.getDebtAmount())
                        .paymentStatus(order.getPaymentStatus())
                        .build() : null)
                .build();
    }

    private DebtRecord applyAllocation(Long tenantId, Long farmId, PaymentTransaction payment, Long debtRecordId, BigDecimal allocAmount, String notes) {
        // Pessimistic write lock on debt record
        DebtRecord debt = debtRecordRepository.findByIdForUpdate(debtRecordId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Debt record not found: " + debtRecordId));

        if (payment.getAllocatedAmount().add(allocAmount).compareTo(payment.getAmount()) > 0) {
            throw new BusinessException("INSUFFICIENT_PAYMENT_BALANCE",
                    "Số tiền phân bổ (" + allocAmount + ") vượt quá số tiền khả dụng của giao dịch thanh toán (" +
                            payment.getAmount().subtract(payment.getAllocatedAmount()) + ")");
        }

        if (allocAmount.compareTo(debt.getRemainingDebt()) > 0) {
            throw new BusinessException("INSUFFICIENT_REMAINING_DEBT",
                    "Số tiền phân bổ (" + allocAmount + ") vượt quá dư nợ còn lại của khoản nợ (" + debt.getRemainingDebt() + ")");
        }

        // Update payment transaction allocated amount
        payment.setAllocatedAmount(payment.getAllocatedAmount().add(allocAmount));
        payment.setUpdatedAt(Instant.now());
        paymentTransactionRepository.save(payment);

        // Update debt record
        BigDecimal newPaid = debt.getPaidAmount().add(allocAmount);
        BigDecimal newRemaining = debt.getTotalDebt().subtract(newPaid);
        debt.setPaidAmount(newPaid);
        debt.setRemainingDebt(newRemaining);
        if (newRemaining.compareTo(BigDecimal.ZERO) == 0) {
            debt.setStatus("SETTLED");
        }
        debt.setUpdatedAt(Instant.now());
        debtRecordRepository.save(debt);

        // Immutable insert into payment_allocations (#68)
        PaymentAllocation allocation = PaymentAllocation.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .paymentId(payment.getId())
                .debtRecordId(debt.getId())
                .allocatedAmount(allocAmount)
                .notes(notes)
                .createdAt(Instant.now())
                .build();
        paymentAllocationRepository.save(allocation);

        // Reverse sync to SalesOrder if applicable
        if (debt.getSalesOrderId() != null) {
            salesOrderRepository.findByIdForUpdate(debt.getSalesOrderId()).ifPresent(order -> {
                order.setPaidAmount(order.getPaidAmount().add(allocAmount));
                order.setDebtAmount(order.getFinalAmount().subtract(order.getPaidAmount()));
                if (order.getDebtAmount().compareTo(BigDecimal.ZERO) == 0) {
                    order.setPaymentStatus("PAID");
                } else {
                    order.setPaymentStatus("PARTIALLY_PAID");
                }
                order.setUpdatedAt(Instant.now());
                salesOrderRepository.save(order);
            });
        }

        return debt;
    }

    @Override
    @Transactional
    public PaymentTransactionDetailResponse offsetDebts(Long farmId, DebtOffsetRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        validateFarm(farmId);

        // Deadlock prevention: Lock in ascending ID order
        Long id1 = Math.min(request.getReceivableDebtId(), request.getPayableDebtId());
        Long id2 = Math.max(request.getReceivableDebtId(), request.getPayableDebtId());

        DebtRecord record1 = debtRecordRepository.findByIdForUpdate(id1)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Debt record not found: " + id1));
        DebtRecord record2 = debtRecordRepository.findByIdForUpdate(id2)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Debt record not found: " + id2));

        DebtRecord receivableDebt = record1.getId().equals(request.getReceivableDebtId()) ? record1 : record2;
        DebtRecord payableDebt = record1.getId().equals(request.getPayableDebtId()) ? record1 : record2;

        if (!"RECEIVABLE".equalsIgnoreCase(receivableDebt.getDebtType())) {
            throw new BusinessException("BAD_REQUEST", "Khoản nợ " + receivableDebt.getId() + " không phải loại RECEIVABLE");
        }
        if (!"PAYABLE".equalsIgnoreCase(payableDebt.getDebtType())) {
            throw new BusinessException("BAD_REQUEST", "Khoản nợ " + payableDebt.getId() + " không phải loại PAYABLE");
        }
        if (!receivableDebt.getPartnerId().equals(request.getPartnerId()) || !payableDebt.getPartnerId().equals(request.getPartnerId())) {
            throw new BusinessException("BAD_REQUEST", "Cả hai khoản nợ phải thuộc về cùng đối tác: " + request.getPartnerId());
        }

        BigDecimal offsetAmount = request.getOffsetAmount();
        BigDecimal maxOffset = receivableDebt.getRemainingDebt().min(payableDebt.getRemainingDebt());
        if (offsetAmount.compareTo(maxOffset) > 0) {
            throw new BusinessException("INVALID_OFFSET_AMOUNT",
                    "Số tiền cấn trừ (" + offsetAmount + ") vượt quá mức dư nợ khả dụng tối đa (" + maxOffset + ")");
        }

        String paymentCode = "OFFSET-" + farmId + "-" + (System.currentTimeMillis() % 10000000);

        PaymentTransaction payment = PaymentTransaction.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .paymentCode(paymentCode)
                .paymentType("RECEIPT")
                .partnerId(request.getPartnerId())
                .salesOrderId(receivableDebt.getSalesOrderId())
                .debtRecordId(receivableDebt.getId())
                .amount(offsetAmount)
                .allocatedAmount(offsetAmount)
                .paymentMethod("DEBT_OFFSET")
                .paymentDate(LocalDate.now())
                .notes(request.getNotes() != null ? request.getNotes() : "Cấn trừ công nợ 2 chiều")
                .status("COMPLETED")
                .confirmedByUserId(currentUserId)
                .confirmedAt(Instant.now())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();
        payment = paymentTransactionRepository.save(payment);

        // Update receivable debt
        receivableDebt.setPaidAmount(receivableDebt.getPaidAmount().add(offsetAmount));
        receivableDebt.setRemainingDebt(receivableDebt.getTotalDebt().subtract(receivableDebt.getPaidAmount()));
        if (receivableDebt.getRemainingDebt().compareTo(BigDecimal.ZERO) == 0) {
            receivableDebt.setStatus("SETTLED");
        }
        receivableDebt.setUpdatedAt(Instant.now());
        debtRecordRepository.save(receivableDebt);

        // Update payable debt
        payableDebt.setPaidAmount(payableDebt.getPaidAmount().add(offsetAmount));
        payableDebt.setRemainingDebt(payableDebt.getTotalDebt().subtract(payableDebt.getPaidAmount()));
        if (payableDebt.getRemainingDebt().compareTo(BigDecimal.ZERO) == 0) {
            payableDebt.setStatus("SETTLED");
        }
        payableDebt.setUpdatedAt(Instant.now());
        debtRecordRepository.save(payableDebt);

        // Create immutable payment allocations (#68)
        PaymentAllocation alloc1 = PaymentAllocation.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .paymentId(payment.getId())
                .debtRecordId(receivableDebt.getId())
                .allocatedAmount(offsetAmount)
                .notes("Cấn trừ nợ phải thu qua DEBT_OFFSET")
                .createdAt(Instant.now())
                .build();
        paymentAllocationRepository.save(alloc1);

        PaymentAllocation alloc2 = PaymentAllocation.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .paymentId(payment.getId())
                .debtRecordId(payableDebt.getId())
                .allocatedAmount(offsetAmount)
                .notes("Cấn trừ nợ phải trả qua DEBT_OFFSET")
                .createdAt(Instant.now())
                .build();
        paymentAllocationRepository.save(alloc2);

        // Reverse sync to SalesOrder
        if (receivableDebt.getSalesOrderId() != null) {
            salesOrderRepository.findByIdForUpdate(receivableDebt.getSalesOrderId()).ifPresent(order -> {
                order.setPaidAmount(order.getPaidAmount().add(offsetAmount));
                order.setDebtAmount(order.getFinalAmount().subtract(order.getPaidAmount()));
                if (order.getDebtAmount().compareTo(BigDecimal.ZERO) == 0) {
                    order.setPaymentStatus("PAID");
                } else {
                    order.setPaymentStatus("PARTIALLY_PAID");
                }
                order.setUpdatedAt(Instant.now());
                salesOrderRepository.save(order);
            });
        }

        // GAP-ACC-08: Notify farm manager on 2-way debt offset
        Farm farm = farmRepository.findById(farmId).orElse(null);
        Long managerUserId = farm != null ? farm.getManagerUserId() : null;
        sendNotificationQuietly(
                tenantId,
                managerUserId,
                "Cấn trừ công nợ 2 chiều: " + payment.getPaymentCode(),
                "Kế toán vừa thực hiện cấn trừ công nợ 2 chiều [" + payment.getPaymentCode() + "] số tiền " + payment.getAmount() + " VNĐ.",
                "SYSTEM",
                "PAYMENT_TRANSACTION",
                payment.getId(),
                "/app/sales-cashflow"
        );

        return toPaymentDetailResponse(payment);
    }

    private void sendNotificationQuietly(Long tenantId, Long recipientUserId, String title, String message, String type, String refType, Long refId, String actionUrl) {
        if (recipientUserId == null) return;
        try {
            notificationService.sendNotification(tenantId, recipientUserId, title, message, type, refType, refId, actionUrl);
        } catch (Exception ex) {
            log.warn("Failed to send payment notification to user id={}: {}", recipientUserId, ex.getMessage());
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

    private DebtRecordDetailResponse toDebtDetailResponse(DebtRecord debt) {
        String farmName = farmRepository.findById(debt.getFarmId()).map(Farm::getName).orElse(null);
        Partner partner = partnerRepository.findById(debt.getPartnerId()).orElse(null);
        String partnerCode = partner != null ? partner.getCode() : null;
        String partnerName = partner != null ? partner.getName() : null;
        String orderCode = debt.getSalesOrderId() != null
                ? salesOrderRepository.findById(debt.getSalesOrderId()).map(SalesOrder::getOrderCode).orElse(null)
                : null;

        long daysOverdue = 0;
        if (debt.getDueDate() != null && LocalDate.now().isAfter(debt.getDueDate())) {
            daysOverdue = ChronoUnit.DAYS.between(debt.getDueDate(), LocalDate.now());
        }

        return DebtRecordDetailResponse.builder()
                .id(debt.getId())
                .farmId(debt.getFarmId())
                .farmName(farmName)
                .partnerId(debt.getPartnerId())
                .partnerCode(partnerCode)
                .partnerName(partnerName)
                .salesOrderId(debt.getSalesOrderId())
                .orderCode(orderCode)
                .warehouseReceiptId(debt.getWarehouseReceiptId())
                .debtType(debt.getDebtType())
                .totalDebt(debt.getTotalDebt())
                .paidAmount(debt.getPaidAmount())
                .remainingDebt(debt.getRemainingDebt())
                .dueDate(debt.getDueDate())
                .daysOverdue(daysOverdue)
                .status(debt.getStatus())
                .createdAt(debt.getCreatedAt())
                .updatedAt(debt.getUpdatedAt())
                .build();
    }

    private PaymentTransactionDetailResponse toPaymentDetailResponse(PaymentTransaction p) {
        String farmName = farmRepository.findById(p.getFarmId()).map(Farm::getName).orElse(null);
        String partnerName = p.getPartnerId() != null
                ? partnerRepository.findById(p.getPartnerId()).map(Partner::getName).orElse(null)
                : null;
        String orderCode = p.getSalesOrderId() != null
                ? salesOrderRepository.findById(p.getSalesOrderId()).map(SalesOrder::getOrderCode).orElse(null)
                : null;
        String confirmedByName = p.getConfirmedByUserId() != null
                ? userRepository.findById(p.getConfirmedByUserId()).map(User::getFullName).orElse(null)
                : null;
        String creatorName = p.getCreatedBy() != null
                ? userRepository.findById(p.getCreatedBy()).map(User::getFullName).orElse(null)
                : null;

        List<PaymentAllocation> allocations = paymentAllocationRepository.findByPaymentId(p.getId());
        List<PaymentTransactionDetailResponse.PaymentAllocationItemDto> allocDtos = allocations.stream().map(a -> {
            BigDecimal remainingAfter = debtRecordRepository.findById(a.getDebtRecordId())
                    .map(DebtRecord::getRemainingDebt).orElse(BigDecimal.ZERO);
            return PaymentTransactionDetailResponse.PaymentAllocationItemDto.builder()
                    .id(a.getId())
                    .debtRecordId(a.getDebtRecordId())
                    .allocatedAmount(a.getAllocatedAmount())
                    .remainingDebtAfter(remainingAfter)
                    .notes(a.getNotes())
                    .allocatedAt(a.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return PaymentTransactionDetailResponse.builder()
                .id(p.getId())
                .farmId(p.getFarmId())
                .farmName(farmName)
                .paymentCode(p.getPaymentCode())
                .paymentType(p.getPaymentType())
                .partnerId(p.getPartnerId())
                .partnerName(partnerName)
                .salesOrderId(p.getSalesOrderId())
                .orderCode(orderCode)
                .debtRecordId(p.getDebtRecordId())
                .amount(p.getAmount())
                .allocatedAmount(p.getAllocatedAmount())
                .paymentMethod(p.getPaymentMethod())
                .referenceCode(p.getReferenceCode())
                .qrTransferContent(p.getQrTransferContent())
                .proofImageUrl(p.getProofImageUrl())
                .confirmedByUserId(p.getConfirmedByUserId())
                .confirmedByName(confirmedByName)
                .confirmedAt(p.getConfirmedAt())
                .paymentDate(p.getPaymentDate())
                .notes(p.getNotes())
                .status(p.getStatus())
                .allocations(allocDtos)
                .creatorFullName(creatorName)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
