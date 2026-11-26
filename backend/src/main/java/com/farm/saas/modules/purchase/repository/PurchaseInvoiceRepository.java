package com.farm.saas.modules.purchase.repository;

import com.farm.saas.modules.purchase.entity.PurchaseInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseInvoiceRepository extends JpaRepository<PurchaseInvoice, Long> {

    Optional<PurchaseInvoice> findByTenantIdAndId(Long tenantId, Long id);

    @Query("SELECT pi FROM PurchaseInvoice pi WHERE pi.tenantId = :tenantId " +
           "AND (:farmId IS NULL OR pi.farmId = :farmId) " +
           "AND (:branchId IS NULL OR pi.branchId = :branchId) " +
           "AND (:supplierId IS NULL OR pi.supplierId = :supplierId) " +
           "AND (:invoiceType IS NULL OR pi.invoiceType = :invoiceType) " +
           "AND (:paymentStatus IS NULL OR pi.paymentStatus = :paymentStatus) " +
           "ORDER BY pi.invoiceDate DESC, pi.id DESC")
    Page<PurchaseInvoice> findFiltered(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("branchId") Long branchId,
            @Param("supplierId") Long supplierId,
            @Param("invoiceType") String invoiceType,
            @Param("paymentStatus") String paymentStatus,
            Pageable pageable);

    List<PurchaseInvoice> findByTenantIdAndFarmId(Long tenantId, Long farmId);
}
