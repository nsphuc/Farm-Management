package com.farmsaas.modules.livestock.repository;

import com.farmsaas.modules.livestock.entity.LivestockBreed;
import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LivestockBreedRepository extends JpaRepository<LivestockBreed, Long> {

    List<LivestockBreed> findByTenantId(Long tenantId);

    List<LivestockBreed> findByTenantIdAndSpecies(Long tenantId, LivestockSpecies species);

    Optional<LivestockBreed> findByIdAndTenantId(Long id, Long tenantId);

    boolean existsByTenantIdAndSpeciesAndBreedName(Long tenantId, LivestockSpecies species, String breedName);
}
