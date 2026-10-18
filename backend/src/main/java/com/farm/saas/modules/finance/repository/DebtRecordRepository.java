package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.DebtRecord;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DebtRecordRepository extends JpaRepository<DebtRecord, Long>, JpaSpecificationExecutor<DebtRecord> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM DebtRecord e WHERE e.id = :id")
    Optional<DebtRecord> findByIdForUpdate(@Param("id") Long id);
}
