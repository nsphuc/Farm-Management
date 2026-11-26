package com.farm.saas.modules.auth.repository;

import com.farm.saas.modules.auth.entity.FarmAddOnSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmAddOnSubscriptionRepository extends JpaRepository<FarmAddOnSubscription, Long> {

    List<FarmAddOnSubscription> findByFarmId(Long farmId);

    Optional<FarmAddOnSubscription> findByFarmIdAndAddonCode(Long farmId, String addonCode);

    boolean existsByFarmIdAndAddonCodeAndStatus(Long farmId, String addonCode, String status);
}
