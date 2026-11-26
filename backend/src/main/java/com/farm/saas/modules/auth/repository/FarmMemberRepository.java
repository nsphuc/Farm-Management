package com.farm.saas.modules.auth.repository;

import com.farm.saas.modules.auth.entity.FarmMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmMemberRepository extends JpaRepository<FarmMember, Long>, JpaSpecificationExecutor<FarmMember> {

    List<FarmMember> findByFarmId(Long farmId);

    List<FarmMember> findByUserId(Long userId);

    Optional<FarmMember> findByFarmIdAndUserId(Long farmId, Long userId);

    boolean existsByFarmIdAndUserId(Long farmId, Long userId);

    void deleteByFarmIdAndUserId(Long farmId, Long userId);
}
