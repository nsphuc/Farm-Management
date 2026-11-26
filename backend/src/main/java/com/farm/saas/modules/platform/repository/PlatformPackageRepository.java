package com.farm.saas.modules.platform.repository;

import com.farm.saas.modules.platform.entity.PlatformPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlatformPackageRepository extends JpaRepository<PlatformPackage, Long> {
    Optional<PlatformPackage> findByPackageCode(String packageCode);
}
