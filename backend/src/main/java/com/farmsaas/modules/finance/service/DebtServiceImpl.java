package com.farmsaas.modules.finance.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.finance.dto.DebtAgingReportDto;
import com.farmsaas.modules.finance.dto.DebtPaymentRequest;
import com.farmsaas.modules.finance.dto.DebtRecordRequest;
import com.farmsaas.modules.finance.dto.DebtRecordResponse;
import com.farmsaas.modules.finance.entity.DebtRecord;
import com.farmsaas.modules.finance.entity.enums.DebtStatus;
import com.farmsaas.modules.finance.entity.enums.DebtType;
import com.farmsaas.modules.finance.repository.DebtRecordRepository;
import com.farmsaas.modules.partner.entity.Partner;
import com.farmsaas.modules.partner.repository.PartnerRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DebtServiceImpl implements DebtService {

    private final DebtRecordRepository debtRecordRepository;
    private final PartnerRepository partnerRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional
    public DebtRecordResponse createDebt(Long farmId, DebtRecordRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Partner partner = partnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đối tác ID: " + request.getPartnerId()));

        BigDecimal paid = request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal remaining = request.getOriginalAmount().subtract(paid);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;

        DebtStatus status = request.getStatus();
        if (status == null) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                status = DebtStatus.DA_TAT_TOAN;
            } else if (LocalDate.now().isAfter(request.getDueDate())) {
                status = DebtStatus.QUA_HAN;
            } else {
                status = DebtStatus.TRONG_HAN;
            }
        }

        DebtRecord debt = DebtRecord.builder()
                .farmId(farmId)
                .partnerId(partner.getId())
                .partner(partner)
                .orderId(request.getOrderId())
                .debtType(request.getDebtType())
                .originalAmount(request.getOriginalAmount())
                .paidAmount(paid)
                .remainingAmount(remaining)
                .dueDate(request.getDueDate())
                .status(status)
                .notes(request.getNotes())
                .build();
        debt.setTenantId(tenantId);

        DebtRecord saved = debtRecordRepository.save(debt);
        log.info("Created debt record ID: {} for partner: {}, remaining: {}", saved.getId(), partner.getName(), remaining);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public DebtRecordResponse recordPayment(Long farmId, Long debtId, DebtPaymentRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        DebtRecord debt = debtRecordRepository.findByIdAndTenantIdAndFarmId(debtId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bản ghi công nợ ID: " + debtId));

        if (debt.getStatus() == DebtStatus.DA_TAT_TOAN) {
            throw new BusinessException("Khoản công nợ này đã được tất toán hoàn tất");
        }

        BigDecimal payAmount = request.getPaymentAmount();
        BigDecimal newPaid = debt.getPaidAmount().add(payAmount);
        BigDecimal newRemaining = debt.getRemainingAmount().subtract(payAmount);
        if (newRemaining.compareTo(BigDecimal.ZERO) < 0) {
            newRemaining = BigDecimal.ZERO;
        }

        debt.setPaidAmount(newPaid);
        debt.setRemainingAmount(newRemaining);

        if (newRemaining.compareTo(BigDecimal.ZERO) <= 0) {
            debt.setStatus(DebtStatus.DA_TAT_TOAN);
        } else if (LocalDate.now().isAfter(debt.getDueDate())) {
            debt.setStatus(DebtStatus.QUA_HAN);
        } else {
            debt.setStatus(DebtStatus.TRONG_HAN);
        }

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            String currNotes = debt.getNotes() != null ? debt.getNotes() + "; " : "";
            debt.setNotes(currNotes + "Thanh toán " + payAmount + ": " + request.getNotes());
        }

        DebtRecord updated = debtRecordRepository.save(debt);
        log.info("Recorded payment: {} for debt ID: {}, remaining: {}", payAmount, debtId, newRemaining);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public DebtRecordResponse getDebtById(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        DebtRecord debt = debtRecordRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công nợ ID: " + id));
        return mapToResponse(debt);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DebtRecordResponse> searchDebts(Long farmId, Long partnerId, DebtType debtType, DebtStatus status, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return debtRecordRepository.searchDebts(tenantId, farmId, partnerId, debtType, status, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public DebtAgingReportDto getAgingReport(Long farmId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        // Lấy tất cả các khoản nợ chưa tất toán
        List<DebtRecord> activeDebts = debtRecordRepository.findByTenantIdAndFarmIdAndStatusNot(tenantId, farmId, DebtStatus.DA_TAT_TOAN);

        BigDecimal totalReceivable = BigDecimal.ZERO;
        BigDecimal totalPayable = BigDecimal.ZERO;

        BigDecimal recCurrent = BigDecimal.ZERO;
        BigDecimal rec1To30 = BigDecimal.ZERO;
        BigDecimal rec31To60 = BigDecimal.ZERO;
        BigDecimal rec61To90 = BigDecimal.ZERO;
        BigDecimal recOver90 = BigDecimal.ZERO;

        BigDecimal payCurrent = BigDecimal.ZERO;
        BigDecimal pay1To30 = BigDecimal.ZERO;
        BigDecimal pay31To60 = BigDecimal.ZERO;
        BigDecimal pay61To90 = BigDecimal.ZERO;
        BigDecimal payOver90 = BigDecimal.ZERO;

        LocalDate today = LocalDate.now();
        List<DebtRecordResponse> responses = new ArrayList<>();

        for (DebtRecord d : activeDebts) {
            BigDecimal remaining = d.getRemainingAmount();
            long daysOver = ChronoUnit.DAYS.between(d.getDueDate(), today);

            DebtRecordResponse res = mapToResponse(d);
            responses.add(res);

            if (d.getDebtType() == DebtType.PHAI_THU_KHACH) {
                totalReceivable = totalReceivable.add(remaining);
                if (daysOver <= 0) {
                    recCurrent = recCurrent.add(remaining);
                } else if (daysOver <= 30) {
                    rec1To30 = rec1To30.add(remaining);
                } else if (daysOver <= 60) {
                    rec31To60 = rec31To60.add(remaining);
                } else if (daysOver <= 90) {
                    rec61To90 = rec61To90.add(remaining);
                } else {
                    recOver90 = recOver90.add(remaining);
                }
            } else {
                totalPayable = totalPayable.add(remaining);
                if (daysOver <= 0) {
                    payCurrent = payCurrent.add(remaining);
                } else if (daysOver <= 30) {
                    pay1To30 = pay1To30.add(remaining);
                } else if (daysOver <= 60) {
                    pay31To60 = pay31To60.add(remaining);
                } else if (daysOver <= 90) {
                    pay61To90 = pay61To90.add(remaining);
                } else {
                    payOver90 = payOver90.add(remaining);
                }
            }
        }

        return DebtAgingReportDto.builder()
                .farmId(farmId)
                .totalReceivable(totalReceivable)
                .totalPayable(totalPayable)
                .receivableCurrent(recCurrent)
                .receivable1To30(rec1To30)
                .receivable31To60(rec31To60)
                .receivable61To90(rec61To90)
                .receivableOver90(recOver90)
                .payableCurrent(payCurrent)
                .payable1To30(pay1To30)
                .payable31To60(pay31To60)
                .payable61To90(pay61To90)
                .payableOver90(payOver90)
                .records(responses)
                .build();
    }

    @Override
    @Transactional
    public void deleteDebt(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        DebtRecord debt = debtRecordRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công nợ ID: " + id));

        debtRecordRepository.delete(debt);
        log.info("Deleted debt record ID: {} from Farm ID: {}", id, farmId);
    }

    private DebtRecordResponse mapToResponse(DebtRecord d) {
        LocalDate today = LocalDate.now();
        long daysOver = 0;
        if (d.getDueDate() != null && today.isAfter(d.getDueDate())) {
            daysOver = ChronoUnit.DAYS.between(d.getDueDate(), today);
        }

        return DebtRecordResponse.builder()
                .id(d.getId())
                .tenantId(d.getTenantId())
                .farmId(d.getFarmId())
                .partnerId(d.getPartnerId())
                .partnerName(d.getPartner() != null ? d.getPartner().getName() : null)
                .partnerPhone(d.getPartner() != null ? d.getPartner().getPhone() : null)
                .orderId(d.getOrderId())
                .orderCode(d.getOrder() != null ? d.getOrder().getOrderCode() : null)
                .debtType(d.getDebtType())
                .originalAmount(d.getOriginalAmount())
                .paidAmount(d.getPaidAmount())
                .remainingAmount(d.getRemainingAmount())
                .dueDate(d.getDueDate())
                .status(d.getStatus())
                .daysOverdue(daysOver)
                .notes(d.getNotes())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
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
