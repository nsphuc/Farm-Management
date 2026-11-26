package com.farm.saas.common.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FarmSecurityEvaluatorTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private FarmSecurityEvaluator evaluator;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockUser(CustomUserDetails user) {
        var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void canAccessFarm_blocksCrossTenantIdor_forOwnerAndStaff() {
        CustomUserDetails ownerFarm1 = CustomUserDetails.builder()
                .id(2L)
                .tenantId(1L)
                .username("owner1")
                .roles(Set.of("ROLE_FARM_OWNER"))
                .accessibleFarmIds(Set.of(1L))
                .build();
        mockUser(ownerFarm1);

        when(jdbcTemplate.queryForObject("SELECT tenant_id FROM farms WHERE id = ?", Long.class, 1L)).thenReturn(1L);
        when(jdbcTemplate.queryForObject("SELECT tenant_id FROM farms WHERE id = ?", Long.class, 2L)).thenReturn(2L);

        assertTrue(evaluator.canAccessFarm(1L));
        assertFalse(evaluator.canAccessFarm(2L));
        assertThrows(AccessDeniedException.class, () -> evaluator.assertFarmAccess(2L));
    }

    @Test
    void resolveEffectiveBranchId_locksStaffToAssignedBranch_andRejectsCrossBranchTampering() {
        CustomUserDetails mgrCn1 = CustomUserDetails.builder()
                .id(3L)
                .tenantId(1L)
                .username("mgr1")
                .roles(Set.of("ROLE_FARM_MANAGER"))
                .accessibleFarmIds(Set.of(1L))
                .build();
        mockUser(mgrCn1);

        when(jdbcTemplate.queryForObject("SELECT tenant_id FROM farms WHERE id = ?", Long.class, 1L)).thenReturn(1L);
        when(jdbcTemplate.queryForList(anyString(), eq(3L), eq(1L)))
                .thenReturn(List.of(Map.of("branch_id", 1L)));

        // Staff omits branchId -> forced to assignedBranchId = 1
        assertEquals(1L, evaluator.resolveEffectiveBranchId(1L, null));
        // Staff passes matching branchId=1 -> allowed
        assertEquals(1L, evaluator.resolveEffectiveBranchId(1L, 1L));
        // Staff tampers with branchId=2 -> 403 AccessDeniedException
        assertThrows(AccessDeniedException.class, () -> evaluator.resolveEffectiveBranchId(1L, 2L));
    }

    @Test
    void resolveEffectiveBranchId_allowsOwnerToViewAllOrSpecificBranch() {
        CustomUserDetails owner = CustomUserDetails.builder()
                .id(2L)
                .tenantId(1L)
                .username("owner1")
                .roles(Set.of("ROLE_FARM_OWNER"))
                .accessibleFarmIds(Set.of(1L))
                .build();
        mockUser(owner);

        when(jdbcTemplate.queryForObject("SELECT tenant_id FROM farms WHERE id = ?", Long.class, 1L)).thenReturn(1L);

        assertNull(evaluator.resolveEffectiveBranchId(1L, null));
        assertEquals(2L, evaluator.resolveEffectiveBranchId(1L, 2L));
    }

    @Test
    void canAccessBarn_usesWordBoundaryMatching_preventingSubstringLeak() {
        CustomUserDetails worker = CustomUserDetails.builder()
                .id(6L)
                .tenantId(1L)
                .username("worker1")
                .roles(Set.of("ROLE_BARN_WORKER"))
                .accessibleFarmIds(Set.of(1L))
                .build();
        mockUser(worker);

        when(jdbcTemplate.queryForObject("SELECT tenant_id FROM farms WHERE id = ?", Long.class, 1L)).thenReturn(1L);
        when(jdbcTemplate.queryForList("SELECT all_barns, barn_ids FROM farm_members WHERE user_id = ? AND farm_id = ?", 6L, 1L))
                .thenReturn(List.of(Map.of("all_barns", false, "barn_ids", "[12]")));

        assertTrue(evaluator.canAccessBarn(1L, 12L));
        assertFalse(evaluator.canAccessBarn(1L, 1L));
        assertFalse(evaluator.canAccessBarn(1L, 2L));
    }
}
