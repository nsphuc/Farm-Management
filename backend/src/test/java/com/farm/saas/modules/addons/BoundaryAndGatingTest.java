package com.farm.saas.modules.addons;

import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.modules.auth.repository.FarmAddOnSubscriptionRepository;
import com.farm.saas.modules.addons.repository.PayrollSheetRepository;
import com.farm.saas.modules.addons.service.impl.AddonsOperationsServiceImpl;
import com.farm.saas.modules.auth.entity.FarmAddOnSubscription;
import com.farm.saas.modules.livestock.dto.request.CreateDailyLogRequest;
import com.farm.saas.modules.livestock.entity.LivestockEvent;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
import com.farm.saas.modules.livestock.repository.LivestockEventRepository;
import com.farm.saas.modules.livestock.repository.LivestockEventSupplyRepository;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.livestock.service.impl.DailyLogServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoundaryAndGatingTest {

    @Mock private FarmAddOnSubscriptionRepository addonSubscriptionRepository;
    @Mock private PayrollSheetRepository payrollSheetRepository;

    @InjectMocks
    private AddonsOperationsServiceImpl addonsService;

    @Mock private LivestockGroupRepository livestockGroupRepository;
    @Mock private ZoneLocationRepository zoneLocationRepository;
    @Mock private LivestockBreedRepository livestockBreedRepository;
    @Mock private LivestockEventRepository livestockEventRepository;
    @Mock private LivestockEventSupplyRepository livestockEventSupplyRepository;

    @InjectMocks
    private DailyLogServiceImpl dailyLogService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockOwner() {
        CustomUserDetails owner = CustomUserDetails.builder()
                .id(2L).tenantId(1L).username("owner")
                .roles(Set.of("ROLE_FARM_OWNER"))
                .accessibleFarmIds(Set.of(1L))
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(owner, null, owner.getAuthorities()));
    }

    @Test
    void getPayrollSheets_throws403Forbidden_whenAddonNotSubscribed_andNeverAutoInserts() {
        when(addonSubscriptionRepository.findByFarmIdAndAddonCode(2L, "PAYROLL"))
                .thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class,
                () -> addonsService.getPayrollSheets(2L, null, "2026-11"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("ADDON_NOT_SUBSCRIBED", ex.getErrorCode());
        verify(addonSubscriptionRepository, never()).save(any());
    }

    @Test
    void getPayrollSheets_returnsList_whenAddonIsActive() {
        when(addonSubscriptionRepository.findByFarmIdAndAddonCode(1L, "PAYROLL"))
                .thenReturn(Optional.of(FarmAddOnSubscription.builder().farmId(1L).addonCode("PAYROLL").status("ACTIVE").build()));
        when(payrollSheetRepository.findByFarmIdAndPeriodMonth(1L, "2026-11"))
                .thenReturn(List.of());

        assertNotNull(addonsService.getPayrollSheets(1L, null, "2026-11"));
    }

    @Test
    void createDailyLog_rejectsNegativeFeedAmount_andMortalityExceedingStock() {
        mockOwner();
        LivestockGroup group = LivestockGroup.builder()
                .id(1L).farmId(1L).breedId(1L).currentQuantity(88).status("ACTIVE").build();
        when(livestockGroupRepository.findById(1L)).thenReturn(Optional.of(group));

        CreateDailyLogRequest negFeed = new CreateDailyLogRequest();
        negFeed.setFarmId(1L);
        negFeed.setBatchId(1L);
        negFeed.setEntryType("FEED");
        negFeed.setLogDate(LocalDate.now());
        negFeed.setFeedAmount(new BigDecimal("-10"));
        negFeed.setFeedUnit("KG");

        BusinessException feedEx = assertThrows(BusinessException.class, () -> dailyLogService.createDailyLog(negFeed));
        assertEquals("INVALID_FEED_AMOUNT", feedEx.getErrorCode());

        CreateDailyLogRequest overMort = new CreateDailyLogRequest();
        overMort.setFarmId(1L);
        overMort.setBatchId(1L);
        overMort.setEntryType("MORTALITY");
        overMort.setLogDate(LocalDate.now());
        overMort.setDeadCount(9999);
        overMort.setCullCount(0);

        BusinessException mortEx = assertThrows(BusinessException.class, () -> dailyLogService.createDailyLog(overMort));
        assertEquals("MORTALITY_EXCEEDS_STOCK", mortEx.getErrorCode());
    }
}
