package com.farm.saas.modules.livestock.repository;

import com.farm.saas.modules.livestock.entity.LivestockEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LivestockEventRepository extends JpaRepository<LivestockEvent, Long>, JpaSpecificationExecutor<LivestockEvent> {
    java.util.Optional<LivestockEvent> findByFarmIdAndId(Long farmId, Long id);
    java.util.List<LivestockEvent> findByLivestockGroupId(Long livestockGroupId);
    java.util.List<LivestockEvent> findByLivestockIndividualId(Long livestockIndividualId);

    @org.springframework.data.jpa.repository.Query("SELECT MAX(e.withdrawalEndDate) FROM LivestockEvent e WHERE e.livestockGroupId = :groupId")
    java.time.LocalDate findMaxWithdrawalEndDateByGroupId(@org.springframework.data.repository.query.Param("groupId") Long groupId);

    @org.springframework.data.jpa.repository.Query("SELECT MAX(e.withdrawalEndDate) FROM LivestockEvent e WHERE e.livestockIndividualId = :individualId")
    java.time.LocalDate findMaxWithdrawalEndDateByIndividualId(@org.springframework.data.repository.query.Param("individualId") Long individualId);
}
