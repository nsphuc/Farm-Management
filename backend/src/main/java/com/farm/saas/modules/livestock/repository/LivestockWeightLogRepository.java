package com.farm.saas.modules.livestock.repository;

import com.farm.saas.modules.livestock.entity.LivestockWeightLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LivestockWeightLogRepository extends JpaRepository<LivestockWeightLog, Long>, JpaSpecificationExecutor<LivestockWeightLog> {
    java.util.List<LivestockWeightLog> findByGroupIdOrderByRecordDateDescCreatedAtDesc(Long groupId);
    java.util.List<LivestockWeightLog> findByIndividualIdOrderByRecordDateDescCreatedAtDesc(Long individualId);
    java.util.Optional<LivestockWeightLog> findTopByGroupIdOrderByRecordDateDescCreatedAtDesc(Long groupId);
    java.util.Optional<LivestockWeightLog> findTopByIndividualIdOrderByRecordDateDescCreatedAtDesc(Long individualId);
    java.util.Optional<LivestockWeightLog> findTopByIndividualIdAndRecordDateLessThanOrderByRecordDateDescCreatedAtDesc(Long individualId, java.time.LocalDate recordDate);
    java.util.Optional<LivestockWeightLog> findTopByGroupIdAndRecordDateLessThanOrderByRecordDateDescCreatedAtDesc(Long groupId, java.time.LocalDate recordDate);
}
