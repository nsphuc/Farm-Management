package com.farm.saas.modules.livestock.repository;

import com.farm.saas.modules.livestock.entity.LivestockIndividual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LivestockIndividualRepository extends JpaRepository<LivestockIndividual, Long>, JpaSpecificationExecutor<LivestockIndividual> {
}
