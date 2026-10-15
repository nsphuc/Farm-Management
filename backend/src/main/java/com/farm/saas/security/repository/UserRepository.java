package com.farm.saas.security.repository;

import com.farm.saas.security.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Modifying
    @Query("UPDATE User u SET u.failedLogins = 0, u.lockUntil = null WHERE u.id = :userId")
    void resetFailedLogins(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE User u SET u.failedLogins = u.failedLogins + 1 WHERE u.id = :userId")
    void incrementFailedLogins(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE User u SET u.status = 'LOCKED', u.lockUntil = :lockUntil WHERE u.id = :userId")
    void lockUserAccount(@Param("userId") Long userId, @Param("lockUntil") Instant lockUntil);
}
