package com.farm.saas.modules.geography;

import com.farm.saas.modules.geography.dto.request.CreateZoneLocationRequest;
import com.farm.saas.modules.geography.dto.request.UpdateZoneLocationRequest;
import com.farm.saas.modules.geography.dto.response.ZoneLocationResponse;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.entity.ZoneLocation;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.geography.service.impl.ProductionZoneServiceImpl;
import com.farm.saas.modules.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ZoneLocationServiceTest {

    @Mock
    private FarmRepository farmRepository;

    @Mock
    private ProductionZoneRepository productionZoneRepository;

    @Mock
    private ZoneLocationRepository zoneLocationRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ProductionZoneServiceImpl productionZoneService;

    private Farm mockFarm;
    private ProductionZone greenhouseZone;
    private ProductionZone barnZone;

    @BeforeEach
    void setUp() {
        mockFarm = Farm.builder()
                .id(1L)
                .tenantId(10L)
                .name("Trang Trại Công Nghệ Cao")
                .build();

        greenhouseZone = ProductionZone.builder()
                .id(101L)
                .tenantId(10L)
                .farmId(1L)
                .code("ZONE-GH-01")
                .name("Nhà Màng Cà Chua A1")
                .zoneType("GREENHOUSE")
                .areaM2(new BigDecimal("1000.00"))
                .status("ACTIVE")
                .build();

        barnZone = ProductionZone.builder()
                .id(102L)
                .tenantId(10L)
                .farmId(1L)
                .code("ZONE-BARN-01")
                .name("Chuồng Bò Sữa B1")
                .zoneType("BARN")
                .areaM2(new BigDecimal("2000.00"))
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Tạo vị trí cho phân khu GREENHOUSE lưu diện tích areaM2 chính xác")
    void testCreateLocationInGreenhouseWithAreaM2() {
        when(farmRepository.findById(1L)).thenReturn(Optional.of(mockFarm));
        when(productionZoneRepository.findByFarmIdAndId(1L, 101L)).thenReturn(Optional.of(greenhouseZone));
        when(zoneLocationRepository.existsByZoneIdAndCode(101L, "LOC-GH-001")).thenReturn(false);

        when(zoneLocationRepository.save(any(ZoneLocation.class))).thenAnswer(invocation -> {
            ZoneLocation loc = invocation.getArgument(0);
            loc.setId(501L);
            return loc;
        });

        CreateZoneLocationRequest request = CreateZoneLocationRequest.builder()
                .code("LOC-GH-001")
                .name("Luống Cà Chua 01")
                .areaM2(new BigDecimal("150.50"))
                .status("EMPTY")
                .build();

        ZoneLocationResponse response = productionZoneService.createLocation(1L, 101L, request);

        assertNotNull(response);
        assertEquals("LOC-GH-001", response.getCode());
        assertEquals("Luống Cà Chua 01", response.getName());
        assertEquals(new BigDecimal("150.50"), response.getAreaM2());
        assertNull(response.getCapacity());
        verify(zoneLocationRepository).save(any(ZoneLocation.class));
    }

    @Test
    @DisplayName("Tạo vị trí cho phân khu BARN lưu sức chứa capacity (đơn vị con) chính xác")
    void testCreateLocationInBarnWithCapacity() {
        when(farmRepository.findById(1L)).thenReturn(Optional.of(mockFarm));
        when(productionZoneRepository.findByFarmIdAndId(1L, 102L)).thenReturn(Optional.of(barnZone));
        when(zoneLocationRepository.existsByZoneIdAndCode(102L, "LOC-BARN-001")).thenReturn(false);

        when(zoneLocationRepository.save(any(ZoneLocation.class))).thenAnswer(invocation -> {
            ZoneLocation loc = invocation.getArgument(0);
            loc.setId(502L);
            return loc;
        });

        CreateZoneLocationRequest request = CreateZoneLocationRequest.builder()
                .code("LOC-BARN-001")
                .name("Ô Chuồng Bò Sữa Số 01")
                .capacity(25)
                .status("EMPTY")
                .build();

        ZoneLocationResponse response = productionZoneService.createLocation(1L, 102L, request);

        assertNotNull(response);
        assertEquals("LOC-BARN-001", response.getCode());
        assertEquals("Ô Chuồng Bò Sữa Số 01", response.getName());
        assertEquals(25, response.getCapacity());
        assertNull(response.getAreaM2());
        verify(zoneLocationRepository).save(any(ZoneLocation.class));
    }

    @Test
    @DisplayName("Cập nhật vị trí cho phép chỉnh sửa diện tích areaM2 và sức chứa capacity")
    void testUpdateLocationCapacityAndArea() {
        when(farmRepository.findById(1L)).thenReturn(Optional.of(mockFarm));
        when(productionZoneRepository.findByFarmIdAndId(1L, 101L)).thenReturn(Optional.of(greenhouseZone));

        ZoneLocation existingLocation = ZoneLocation.builder()
                .id(501L)
                .tenantId(10L)
                .farmId(1L)
                .zoneId(101L)
                .code("LOC-GH-001")
                .name("Luống Cà Chua Cũ")
                .status("EMPTY")
                .areaM2(new BigDecimal("100.00"))
                .build();

        when(zoneLocationRepository.findByZoneIdAndId(101L, 501L)).thenReturn(Optional.of(existingLocation));
        when(zoneLocationRepository.save(any(ZoneLocation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateZoneLocationRequest updateRequest = UpdateZoneLocationRequest.builder()
                .name("Luống Cà Chua Mới")
                .areaM2(new BigDecimal("175.25"))
                .capacity(null)
                .status("ACTIVE")
                .build();

        ZoneLocationResponse updatedResponse = productionZoneService.updateLocation(1L, 101L, 501L, updateRequest);

        assertNotNull(updatedResponse);
        assertEquals("Luống Cà Chua Mới", updatedResponse.getName());
        assertEquals(new BigDecimal("175.25"), updatedResponse.getAreaM2());
        assertEquals("ACTIVE", updatedResponse.getStatus());
        verify(zoneLocationRepository).save(existingLocation);
    }
}

