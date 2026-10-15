package com.farm.saas.security.repository;

import com.farm.saas.security.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByCode(String code);

    @Query("SELECT r FROM Role r JOIN UserRole ur ON ur.roleId = r.id WHERE ur.userId = :userId")
    List<Role> findRolesByUserId(@Param("userId") Long userId);
}
