package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.StocktakeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface StocktakeItemRepository extends JpaRepository<StocktakeItem, Long>, JpaSpecificationExecutor<StocktakeItem> {
}
