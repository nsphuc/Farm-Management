package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.Stocktake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface StocktakeRepository extends JpaRepository<Stocktake, Long>, JpaSpecificationExecutor<Stocktake> {
}
