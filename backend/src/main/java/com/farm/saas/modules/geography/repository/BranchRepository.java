package com.farm.saas.modules.geography.repository;

import com.farm.saas.modules.geography.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {

    List<Branch> findByFarmIdOrderByIsDefaultDescIdAsc(Long farmId);

    List<Branch> findByFarmIdAndStatus(Long farmId, String status);

    Optional<Branch> findByFarmIdAndIsDefaultTrue(Long farmId);

    Optional<Branch> findByFarmIdAndCode(Long farmId, String code);

    boolean existsByFarmIdAndCode(Long farmId, String code);

    boolean existsByFarmIdAndCodeAndIdNot(Long farmId, String code, Long id);

    @Query("SELECT COUNT(b) FROM Branch b WHERE b.farmId = :farmId AND b.status = 'ACTIVE'")
    long countActiveBranchesByFarmId(@Param("farmId") Long farmId);
}
