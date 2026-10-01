package com.farmsaas.modules.user.repository;

import com.farmsaas.modules.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles r LEFT JOIN FETCH r.permissions WHERE u.username = :loginId OR u.email = :loginId")
    Optional<User> findByUsernameOrEmailWithRoles(@Param("loginId") String loginId);

    Page<User> findByTenantId(Long tenantId, Pageable pageable);

    Optional<User> findByIdAndTenantId(Long id, Long tenantId);

    boolean existsByUsernameAndTenantId(String username, Long tenantId);

    boolean existsByEmailAndTenantId(String email, Long tenantId);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE User u SET u.lockUntil = null, u.failedLogins = 0 WHERE u.lockUntil IS NOT NULL AND u.lockUntil <= :currentTime")
    int unlockExpiredLockedUsers(@Param("currentTime") java.time.Instant currentTime);
}
