package com.farmsaas.modules.farm.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.dto.*;
import com.farmsaas.modules.farm.entity.FarmOperationalSetting;
import com.farmsaas.modules.farm.entity.OperationalCycle;
import com.farmsaas.modules.farm.repository.FarmOperationalSettingRepository;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.farm.repository.OperationalCycleRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OperationalCycleServiceImpl implements OperationalCycleService {

    private final FarmRepository farmRepository;
    private final OperationalCycleRepository operationalCycleRepository;
    private final FarmOperationalSettingRepository farmOperationalSettingRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CycleResponse> getCyclesByFarmId(Long farmId) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        List<OperationalCycle> cycles = operationalCycleRepository.findByFarmIdAndTenantIdOrderByStartDateDesc(farmId, tenantId);
        return cycles.stream()
                .map(CycleResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public CycleResponse createCycle(Long farmId, CreateCycleRequest request) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException("Ngày kết thúc chu kỳ phải sau ngày bắt đầu.");
        }

        OperationalCycle cycle = OperationalCycle.builder()
                .farmId(farmId)
                .name(request.getName().trim())
                .fiscalYear(request.getFiscalYear())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(request.getStatus() != null ? request.getStatus() : "PREPARING")
                .notes(request.getNotes())
                .build();
        cycle.setTenantId(tenantId);

        OperationalCycle saved = operationalCycleRepository.save(cycle);
        log.info("Created OperationalCycle: {} for farm: {}", saved.getName(), farmId);
        return CycleResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public CycleResponse updateCycle(Long farmId, Long cycleId, UpdateCycleRequest request) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        OperationalCycle cycle = operationalCycleRepository.findByIdAndFarmIdAndTenantId(cycleId, farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Chu kỳ vận hành", cycleId));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException("Ngày kết thúc chu kỳ phải sau ngày bắt đầu.");
        }

        cycle.setName(request.getName().trim());
        cycle.setFiscalYear(request.getFiscalYear());
        cycle.setStartDate(request.getStartDate());
        cycle.setEndDate(request.getEndDate());
        if (request.getStatus() != null) {
            cycle.setStatus(request.getStatus());
        }
        cycle.setNotes(request.getNotes());

        OperationalCycle saved = operationalCycleRepository.save(cycle);
        return CycleResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public CycleResponse updateCycleStatus(Long farmId, Long cycleId, String status) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        OperationalCycle cycle = operationalCycleRepository.findByIdAndFarmIdAndTenantId(cycleId, farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Chu kỳ vận hành", cycleId));

        cycle.setStatus(status);
        OperationalCycle saved = operationalCycleRepository.save(cycle);
        log.info("Updated status of Cycle {} to {}", cycleId, status);
        return CycleResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteCycle(Long farmId, Long cycleId) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        OperationalCycle cycle = operationalCycleRepository.findByIdAndFarmIdAndTenantId(cycleId, farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Chu kỳ vận hành", cycleId));

        operationalCycleRepository.delete(cycle);
        log.info("Deleted OperationalCycle: {} (ID: {})", cycle.getName(), cycleId);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmSettingResponse getFarmSettings(Long farmId) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        FarmOperationalSetting setting = farmOperationalSettingRepository.findByFarmIdAndTenantId(farmId, tenantId)
                .orElseGet(() -> {
                    FarmOperationalSetting newSetting = FarmOperationalSetting.builder()
                            .farmId(farmId)
                            .irrigationThresholdJson("{\"moisture_min\": 40, \"moisture_max\": 70, \"temp_max\": 35}")
                            .workShiftConfigJson("{\"morning\": \"06:00-10:30\", \"afternoon\": \"14:00-17:30\"}")
                            .generalSettingsJson("{}")
                            .build();
                    newSetting.setTenantId(tenantId);
                    return farmOperationalSettingRepository.save(newSetting);
                });

        return FarmSettingResponse.fromEntity(setting);
    }

    @Override
    @Transactional
    public FarmSettingResponse updateFarmSettings(Long farmId, FarmSettingRequest request) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        FarmOperationalSetting setting = farmOperationalSettingRepository.findByFarmIdAndTenantId(farmId, tenantId)
                .orElseGet(() -> {
                    FarmOperationalSetting s = new FarmOperationalSetting();
                    s.setFarmId(farmId);
                    s.setTenantId(tenantId);
                    return s;
                });

        if (request.getIrrigationThresholdJson() != null) {
            setting.setIrrigationThresholdJson(request.getIrrigationThresholdJson());
        }
        if (request.getWorkShiftConfigJson() != null) {
            setting.setWorkShiftConfigJson(request.getWorkShiftConfigJson());
        }
        if (request.getGeneralSettingsJson() != null) {
            setting.setGeneralSettingsJson(request.getGeneralSettingsJson());
        }

        FarmOperationalSetting saved = farmOperationalSettingRepository.save(setting);
        log.info("Updated FarmOperationalSetting for farmId: {}", farmId);
        return FarmSettingResponse.fromEntity(saved);
    }

    private void verifyFarmExists(Long farmId, Long tenantId) {
        if (!farmRepository.existsById(farmId)) {
            throw new EntityNotFoundException("Trang trại", farmId);
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
