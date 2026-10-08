package com.farmsaas.modules.finance.repository;

import com.farmsaas.modules.finance.entity.SalesOrder;
import com.farmsaas.modules.finance.entity.enums.DeliveryStatus;
import com.farmsaas.modules.finance.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    Optional<SalesOrder> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    boolean existsByTenantIdAndFarmIdAndOrderCode(Long tenantId, Long farmId, String orderCode);

    @Query("SELECT o FROM SalesOrder o " +
           "JOIN FETCH o.partner " +
           "WHERE o.tenantId = :tenantId AND o.farmId = :farmId " +
           "AND (:partnerId IS NULL OR o.partnerId = :partnerId) " +
           "AND (:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus) " +
           "AND (:deliveryStatus IS NULL OR o.deliveryStatus = :deliveryStatus) " +
           "AND (:fromDate IS NULL OR o.orderDate >= :fromDate) " +
           "AND (:toDate IS NULL OR o.orderDate <= :toDate) " +
           "AND (:keyword IS NULL OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(o.notes) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY o.orderDate DESC, o.createdAt DESC")
    Page<SalesOrder> searchOrders(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("partnerId") Long partnerId,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("deliveryStatus") DeliveryStatus deliveryStatus,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
