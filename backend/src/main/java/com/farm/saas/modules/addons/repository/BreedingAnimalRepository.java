package com.farm.saas.modules.addons.repository;

import com.farm.saas.modules.addons.entity.BreedingAnimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BreedingAnimalRepository extends JpaRepository<BreedingAnimal, Long> {

    List<BreedingAnimal> findByFarmIdOrderByTagCodeAsc(Long farmId);

    List<BreedingAnimal> findByFarmIdAndBranchIdOrderByTagCodeAsc(Long farmId, Long branchId);

    long countByFarmId(Long farmId);

    long countByFarmIdAndReproductiveStatus(Long farmId, String reproductiveStatus);
}
