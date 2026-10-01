package com.farmsaas.modules.notification.repository;

import com.farmsaas.common.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientIdAndTenantIdOrderByCreatedAtDesc(
            Long recipientId,
            Long tenantId,
            Pageable pageable
    );

    long countByRecipientIdAndTenantIdAndIsReadFalse(Long recipientId, Long tenantId);

    Optional<Notification> findByIdAndRecipientIdAndTenantId(Long id, Long recipientId, Long tenantId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true " +
           "WHERE n.recipientId = :recipientId AND n.tenantId = :tenantId AND n.isRead = false")
    int markAllAsReadByRecipientIdAndTenantId(
            @Param("recipientId") Long recipientId,
            @Param("tenantId") Long tenantId
    );

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate AND n.isRead = true")
    int deleteOldReadNotifications(@Param("cutoffDate") Instant cutoffDate);
}
