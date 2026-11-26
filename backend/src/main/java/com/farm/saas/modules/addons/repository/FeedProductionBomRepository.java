package com.farm.saas.modules.addons.repository;

import com.farm.saas.modules.addons.entity.FeedProductionBom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedProductionBomRepository extends JpaRepository<FeedProductionBom, Long> {

    List<FeedProductionBom> findByFarmIdOrderByCodeAsc(Long farmId);

    Optional<FeedProductionBom> findByFarmIdAndCode(Long farmId, String code);
}
