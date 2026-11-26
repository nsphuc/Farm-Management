package com.farm.saas.modules.auth.repository;

import com.farm.saas.modules.auth.entity.SubscriptionOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionOrderRepository extends JpaRepository<SubscriptionOrder, Long> {

    Optional<SubscriptionOrder> findByOrderCode(String orderCode);

    Optional<SubscriptionOrder> findByVnpTxnRef(String vnpTxnRef);

    List<SubscriptionOrder> findByFarmIdOrderByCreatedAtDesc(Long farmId);

    Page<SubscriptionOrder> findByFarmId(Long farmId, Pageable pageable);

    Optional<SubscriptionOrder> findTopByFarmIdAndAddonCodeAndStatusOrderByCreatedAtDesc(
            Long farmId, String addonCode, String status);
}
