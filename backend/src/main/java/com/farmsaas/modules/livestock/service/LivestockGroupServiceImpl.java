package com.farmsaas.modules.livestock.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.entity.ProductionZone;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.farm.repository.ProductionZoneRepository;
import com.farmsaas.modules.livestock.dto.LivestockGroupRequest;
import com.farmsaas.modules.livestock.dto.LivestockGroupResponse;
import com.farmsaas.modules.livestock.entity.LivestockBreed;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.livestock.entity.enums.LivestockGroupStatus;
import com.farmsaas.modules.livestock.repository.LivestockBreedRepository;
import com.farmsaas.modules.livestock.repository.LivestockGroupRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LivestockGroupServiceImpl implements LivestockGroupService {

    private final LivestockGroupRepository groupRepository;
    private final LivestockBreedRepository breedRepository;
    private final FarmRepository farmRepository;
    private final ProductionZoneRepository productionZoneRepository;

    @Override
    @Transactional
    public LivestockGroupResponse createGroup(Long farmId, LivestockGroupRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(request.getZoneId(), farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phân khu ID " + request.getZoneId() + " trong trang trại này."));

        LivestockBreed breed = breedRepository.findByIdAndTenantId(request.getBreedId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giống vật nuôi ID: " + request.getBreedId()));

        String groupCode = request.getGroupCode();
        if (groupCode == null || groupCode.isBlank()) {
            groupCode = generateGroupCode(tenantId, farmId);
        } else {
            groupCode = groupCode.trim().toUpperCase();
            if (groupRepository.existsByTenantIdAndFarmIdAndGroupCode(tenantId, farmId, groupCode)) {
                throw new BusinessException("Mã đàn/bầy '" + groupCode + "' đã tồn tại trong trang trại này.");
            }
        }

        Integer currentQty = request.getCurrentQuantity() != null ? request.getCurrentQuantity() : request.getInitialQuantity();

        LivestockGroup group = LivestockGroup.builder()
                .farmId(farmId)
                .zoneId(zone.getId())
                .groupCode(groupCode)
                .breedId(breed.getId())
                .initialQuantity(request.getInitialQuantity())
                .currentQuantity(currentQty)
                .entryDate(request.getEntryDate())
                .status(request.getStatus() != null ? request.getStatus() : LivestockGroupStatus.DANG_NUOI)
                .notes(request.getNotes())
                .build();
        group.setTenantId(tenantId);

        LivestockGroup saved = groupRepository.save(group);
        log.info("Created livestock group '{}' (ID: {}) for Farm ID: {}, Tenant ID: {}", saved.getGroupCode(), saved.getId(), farmId, tenantId);
        return LivestockGroupResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public LivestockGroupResponse updateGroup(Long farmId, Long groupId, LivestockGroupRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockGroup group = groupRepository.findByIdAndTenantIdAndFarmId(groupId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin đàn vật nuôi ID: " + groupId));

        if (group.getStatus() == LivestockGroupStatus.DONG_DAN) {
            throw new BusinessException("Không thể chỉnh sửa đàn vật nuôi đã đóng.");
        }

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(request.getZoneId(), farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phân khu ID " + request.getZoneId() + " trong trang trại này."));

        LivestockBreed breed = breedRepository.findByIdAndTenantId(request.getBreedId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giống vật nuôi ID: " + request.getBreedId()));

        if (request.getGroupCode() != null && !request.getGroupCode().isBlank()) {
            String newCode = request.getGroupCode().trim().toUpperCase();
            if (!group.getGroupCode().equalsIgnoreCase(newCode) &&
                    groupRepository.existsByTenantIdAndFarmIdAndGroupCode(tenantId, farmId, newCode)) {
                throw new BusinessException("Mã đàn/bầy '" + newCode + "' đã tồn tại trong trang trại này.");
            }
            group.setGroupCode(newCode);
        }

        group.setZoneId(zone.getId());
        group.setBreedId(breed.getId());
        group.setInitialQuantity(request.getInitialQuantity());
        if (request.getCurrentQuantity() != null) {
            group.setCurrentQuantity(request.getCurrentQuantity());
        }
        group.setEntryDate(request.getEntryDate());
        if (request.getStatus() != null) {
            group.setStatus(request.getStatus());
        }
        group.setNotes(request.getNotes());

        LivestockGroup updated = groupRepository.save(group);
        log.info("Updated livestock group ID: {} for Farm ID: {}", groupId, farmId);
        return LivestockGroupResponse.fromEntity(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public LivestockGroupResponse getGroupById(Long farmId, Long groupId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockGroup group = groupRepository.findByIdAndTenantIdAndFarmId(groupId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin đàn vật nuôi ID: " + groupId));
        return LivestockGroupResponse.fromEntity(group);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LivestockGroupResponse> searchGroups(Long farmId, Long zoneId, Long breedId, LivestockGroupStatus status, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Page<LivestockGroup> page = groupRepository.searchGroups(tenantId, farmId, zoneId, breedId, status, pageable);
        return page.map(LivestockGroupResponse::fromEntity);
    }

    @Override
    @Transactional
    public LivestockGroupResponse updateStatus(Long farmId, Long groupId, LivestockGroupStatus status) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockGroup group = groupRepository.findByIdAndTenantIdAndFarmId(groupId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin đàn vật nuôi ID: " + groupId));

        group.setStatus(status);
        LivestockGroup saved = groupRepository.save(group);
        log.info("Updated status for livestock group ID: {} to {}", groupId, status);
        return LivestockGroupResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public LivestockGroupResponse adjustQuantity(Long farmId, Long groupId, Integer quantityChange, String reason) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockGroup group = groupRepository.findByIdAndTenantIdAndFarmId(groupId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin đàn vật nuôi ID: " + groupId));

        int newQty = group.getCurrentQuantity() + quantityChange;
        if (newQty < 0) {
            throw new BusinessException("Số lượng hiện tại của đàn không thể âm (hiện có: " + group.getCurrentQuantity() + ", giảm: " + Math.abs(quantityChange) + ").");
        }

        group.setCurrentQuantity(newQty);
        if (newQty == 0) {
            group.setStatus(LivestockGroupStatus.DONG_DAN);
        }

        String noteAppend = "[Biến động số lượng: " + (quantityChange > 0 ? "+" : "") + quantityChange + " con. Lý do: " + reason + "]";
        group.setNotes(group.getNotes() != null ? group.getNotes() + "\n" + noteAppend : noteAppend);

        LivestockGroup saved = groupRepository.save(group);
        log.info("Adjusted quantity for group ID: {} by {} (new qty: {}). Reason: {}", groupId, quantityChange, newQty, reason);
        return LivestockGroupResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteGroup(Long farmId, Long groupId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        LivestockGroup group = groupRepository.findByIdAndTenantIdAndFarmId(groupId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin đàn vật nuôi ID: " + groupId));

        groupRepository.delete(group);
        log.info("Deleted livestock group ID: {} from Farm ID: {}", groupId, farmId);
    }

    private String generateGroupCode(Long tenantId, Long farmId) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String code;
        do {
            String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            code = "DAN-" + datePart + "-" + suffix;
        } while (groupRepository.existsByTenantIdAndFarmIdAndGroupCode(tenantId, farmId, code));
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
