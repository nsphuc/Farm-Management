package com.farmsaas.modules.livestock.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.entity.ProductionZone;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.farm.repository.ProductionZoneRepository;
import com.farmsaas.modules.livestock.dto.LivestockIndividualRequest;
import com.farmsaas.modules.livestock.dto.LivestockIndividualResponse;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.livestock.entity.LivestockIndividual;
import com.farmsaas.modules.livestock.entity.enums.Gender;
import com.farmsaas.modules.livestock.entity.enums.HealthStatus;
import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;
import com.farmsaas.modules.livestock.repository.LivestockGroupRepository;
import com.farmsaas.modules.livestock.repository.LivestockIndividualRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class LivestockIndividualServiceImpl implements LivestockIndividualService {

    private final LivestockIndividualRepository individualRepository;
    private final LivestockGroupRepository groupRepository;
    private final FarmRepository farmRepository;
    private final ProductionZoneRepository productionZoneRepository;

    @Override
    @Transactional
    public LivestockIndividualResponse createIndividual(Long farmId, LivestockIndividualRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(request.getZoneId(), farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phân khu ID " + request.getZoneId() + " trong trang trại này."));

        LivestockGroup group = null;
        if (request.getGroupId() != null) {
            group = groupRepository.findByIdAndTenantIdAndFarmId(request.getGroupId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đàn ID: " + request.getGroupId() + " trong trang trại này."));
        }

        // Tự động sinh mã RFID theo chuẩn [SPECIES]-[YEAR]-[SEQUENCE] nếu để trống
        String rfidTagCode = request.getRfidTagCode();
        if (rfidTagCode == null || rfidTagCode.isBlank()) {
            LivestockSpecies species = request.getSpecies();
            if (species == null && group != null && group.getBreed() != null) {
                species = group.getBreed().getSpecies();
            }
            if (species == null) {
                species = LivestockSpecies.BO; // Mặc định nếu không chỉ định
            }
            rfidTagCode = generateRfidTagCode(tenantId, species);
        } else {
            rfidTagCode = rfidTagCode.trim().toUpperCase();
            if (individualRepository.existsByTenantIdAndRfidTagCode(tenantId, rfidTagCode)) {
                throw new BusinessException("Mã thẻ tai/RFID '" + rfidTagCode + "' đã tồn tại trong tổ chức.");
            }
        }

        LivestockIndividual individual = LivestockIndividual.builder()
                .farmId(farmId)
                .zoneId(zone.getId())
                .rfidTagCode(rfidTagCode)
                .groupId(group != null ? group.getId() : null)
                .gender(request.getGender() != null ? request.getGender() : Gender.DUC)
                .birthDate(request.getBirthDate())
                .motherTagCode(request.getMotherTagCode() != null ? request.getMotherTagCode().trim().toUpperCase() : null)
                .fatherTagCode(request.getFatherTagCode() != null ? request.getFatherTagCode().trim().toUpperCase() : null)
                .currentWeightKg(request.getCurrentWeightKg())
                .healthStatus(request.getHealthStatus() != null ? request.getHealthStatus() : HealthStatus.KHOE_MANH)
                .notes(request.getNotes())
                .build();
        individual.setTenantId(tenantId);

        LivestockIndividual saved = individualRepository.save(individual);
        log.info("Created livestock individual RFID '{}' (ID: {}) for Farm ID: {}, Tenant ID: {}",
                saved.getRfidTagCode(), saved.getId(), farmId, tenantId);
        return LivestockIndividualResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public LivestockIndividualResponse updateIndividual(Long farmId, Long individualId, LivestockIndividualRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockIndividual individual = individualRepository.findByIdAndTenantIdAndFarmId(individualId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cá thể vật nuôi ID: " + individualId));

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(request.getZoneId(), farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phân khu ID " + request.getZoneId() + " trong trang trại này."));

        if (request.getGroupId() != null) {
            groupRepository.findByIdAndTenantIdAndFarmId(request.getGroupId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đàn ID: " + request.getGroupId()));
            individual.setGroupId(request.getGroupId());
        } else {
            individual.setGroupId(null);
        }

        if (request.getRfidTagCode() != null && !request.getRfidTagCode().isBlank()) {
            String newRfid = request.getRfidTagCode().trim().toUpperCase();
            if (!individual.getRfidTagCode().equalsIgnoreCase(newRfid) &&
                    individualRepository.existsByTenantIdAndRfidTagCode(tenantId, newRfid)) {
                throw new BusinessException("Mã thẻ tai/RFID '" + newRfid + "' đã tồn tại trong tổ chức.");
            }
            individual.setRfidTagCode(newRfid);
        }

        individual.setZoneId(zone.getId());
        if (request.getGender() != null) individual.setGender(request.getGender());
        individual.setBirthDate(request.getBirthDate());
        individual.setMotherTagCode(request.getMotherTagCode() != null ? request.getMotherTagCode().trim().toUpperCase() : null);
        individual.setFatherTagCode(request.getFatherTagCode() != null ? request.getFatherTagCode().trim().toUpperCase() : null);
        individual.setCurrentWeightKg(request.getCurrentWeightKg());
        if (request.getHealthStatus() != null) individual.setHealthStatus(request.getHealthStatus());
        individual.setNotes(request.getNotes());

        LivestockIndividual updated = individualRepository.save(individual);
        log.info("Updated livestock individual ID: {} for Farm ID: {}", individualId, farmId);
        return LivestockIndividualResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public LivestockIndividualResponse updateHealthStatus(Long farmId, Long individualId, HealthStatus healthStatus, String notes) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockIndividual individual = individualRepository.findByIdAndTenantIdAndFarmId(individualId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cá thể vật nuôi ID: " + individualId));

        individual.setHealthStatus(healthStatus);
        if (notes != null && !notes.isBlank()) {
            String append = "[Cập nhật sức khỏe -> " + healthStatus + ": " + notes + "]";
            individual.setNotes(individual.getNotes() != null ? individual.getNotes() + "\n" + append : append);
        }

        LivestockIndividual saved = individualRepository.save(individual);
        log.info("Updated health status for individual ID: {} to {}", individualId, healthStatus);
        return LivestockIndividualResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public LivestockIndividualResponse getIndividualById(Long farmId, Long individualId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockIndividual individual = individualRepository.findByIdAndTenantIdAndFarmId(individualId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cá thể vật nuôi ID: " + individualId));
        return LivestockIndividualResponse.fromEntity(individual);
    }

    @Override
    @Transactional(readOnly = true)
    public LivestockIndividualResponse getIndividualByRfid(String rfidTagCode) {
        Long tenantId = getRequiredTenantId();
        LivestockIndividual individual = individualRepository.findByTenantIdAndRfidTagCode(tenantId, rfidTagCode.trim().toUpperCase())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cá thể có mã RFID/Thẻ tai: " + rfidTagCode));
        return LivestockIndividualResponse.fromEntity(individual);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LivestockIndividualResponse> searchIndividuals(
            Long farmId,
            Long zoneId,
            Long groupId,
            HealthStatus healthStatus,
            Gender gender,
            String keyword,
            Pageable pageable
    ) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Page<LivestockIndividual> page = individualRepository.searchIndividuals(
                tenantId, farmId, zoneId, groupId, healthStatus, gender, keyword, pageable
        );
        return page.map(LivestockIndividualResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deleteIndividual(Long farmId, Long individualId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockIndividual individual = individualRepository.findByIdAndTenantIdAndFarmId(individualId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cá thể vật nuôi ID: " + individualId));

        individualRepository.delete(individual);
        log.info("Deleted livestock individual ID: {} from Farm ID: {}", individualId, farmId);
    }

    /**
     * Thuật toán sinh mã RFID tự động: [SPECIES]-[YEAR]-[SEQUENCE]
     * Ví dụ: BO-2026-00001
     */
    private String generateRfidTagCode(Long tenantId, LivestockSpecies species) {
        int year = LocalDate.now().getYear();
        String prefix = species.name() + "-" + year + "-";

        long currentCount = individualRepository.countByTenantIdAndRfidTagCodeStartingWith(tenantId, prefix);
        long sequence = currentCount + 1;
        String code;
        do {
            code = String.format("%s%05d", prefix, sequence++);
        } while (individualRepository.existsByTenantIdAndRfidTagCode(tenantId, code));

        return code;
    }

    private void validateFarmAccess(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức.");
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
