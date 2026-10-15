package com.farm.saas.security.auth;

import com.farm.saas.security.entity.Permission;
import com.farm.saas.security.entity.Role;
import com.farm.saas.security.entity.User;
import com.farm.saas.security.repository.PermissionRepository;
import com.farm.saas.security.repository.RoleRepository;
import com.farm.saas.security.repository.UserFarmAccessRepository;
import com.farm.saas.security.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service tải thông tin người dùng từ Database và xây dựng CustomUserDetails cho Spring Security.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserFarmAccessRepository userFarmAccessRepository;

    public CustomUserDetailsService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            UserFarmAccessRepository userFarmAccessRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userFarmAccessRepository = userFarmAccessRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Khong tim thay nguoi dung voi username/email: " + usernameOrEmail));

        Set<String> roles = roleRepository.findRolesByUserId(user.getId()).stream()
                .map(Role::getCode)
                .collect(Collectors.toSet());

        Set<String> permissions = permissionRepository.findPermissionsByUserId(user.getId()).stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        List<Long> farmIds = userFarmAccessRepository.findFarmIdsByUserId(user.getId());

        return CustomUserDetails.fromUser(user, roles, permissions, farmIds);
    }
}
