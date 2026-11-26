package com.farm.saas.modules.geography.service.impl;

import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.geography.dto.request.CreateBranchRequest;
import com.farm.saas.modules.geography.dto.request.UpdateBranchRequest;
import com.farm.saas.modules.geography.dto.response.BranchResponse;
import com.farm.saas.modules.geography.entity.Branch;
import com.farm.saas.modules.geography.repository.BranchRepository;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.service.BranchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;
    private final FarmRepository farmRepository;
    private final com.farm.saas.common.security.FarmSecurityEvaluator farmSecurityEvaluator;

    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getBranches(Long farmId) {
        validateFarmExists(farmId);
        Long assignedBranchId = farmSecurityEvaluator.getAssignedBranchId(farmId);
        return branchRepository.findByFarmIdOrderByIsDefaultDescIdAsc(farmId)
                .stream()
                .filter(b -> assignedBranchId == null || b.getId().equals(assignedBranchId))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BranchResponse getBranchById(Long farmId, Long branchId) {
        validateFarmExists(farmId);
        Branch branch = branchRepository.findById(branchId)
                .filter(b -> b.getFarmId().equals(farmId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BRANCH_NOT_FOUND", "Không tìm thấy chi nhánh chỉ định."));
        return toResponse(branch);
    }

    @Override
    @Transactional
    public BranchResponse createBranch(Long farmId, CreateBranchRequest request) {
        validateFarmExists(farmId);
        String code = request.getCode().trim().toUpperCase();
        if (branchRepository.existsByFarmIdAndCode(farmId, code)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "DUPLICATE_BRANCH_CODE", "Mã chi nhánh [" + code + "] đã tồn tại trong trang trại.");
        }

        boolean isFirst = branchRepository.findByFarmIdOrderByIsDefaultDescIdAsc(farmId).isEmpty();
        boolean shouldBeDefault = isFirst || Boolean.TRUE.equals(request.getIsDefault());

        if (shouldBeDefault) {
            unsetExistingDefault(farmId);
        }

        Branch branch = Branch.builder()
                .farmId(farmId)
                .code(code)
                .name(request.getName().trim())
                .livestockType(request.getLivestockType())
                .address(request.getAddress())
                .phone(request.getPhone())
                .isDefault(shouldBeDefault)
                .status("ACTIVE")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        return toResponse(branchRepository.save(branch));
    }

    @Override
    @Transactional
    public BranchResponse updateBranch(Long farmId, Long branchId, UpdateBranchRequest request) {
        validateFarmExists(farmId);
        Branch branch = branchRepository.findById(branchId)
                .filter(b -> b.getFarmId().equals(farmId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BRANCH_NOT_FOUND", "Không tìm thấy chi nhánh chỉ định."));

        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(branch.getIsDefault())) {
            unsetExistingDefault(farmId);
            branch.setIsDefault(true);
        }

        branch.setName(request.getName().trim());
        if (request.getLivestockType() != null && !request.getLivestockType().isBlank()) {
            branch.setLivestockType(request.getLivestockType());
        }
        if (request.getAddress() != null) branch.setAddress(request.getAddress());
        if (request.getPhone() != null) branch.setPhone(request.getPhone());
        if (request.getStatus() != null) branch.setStatus(request.getStatus());

        branch.setUpdatedAt(Instant.now());
        branch.setUpdatedBy(SecurityUtils.getCurrentUserId());

        return toResponse(branchRepository.save(branch));
    }

    @Override
    @Transactional
    public void deleteBranch(Long farmId, Long branchId) {
        validateFarmExists(farmId);
        Branch branch = branchRepository.findById(branchId)
                .filter(b -> b.getFarmId().equals(farmId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BRANCH_NOT_FOUND", "Không tìm thấy chi nhánh chỉ định."));

        if (Boolean.TRUE.equals(branch.getIsDefault())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CANNOT_DELETE_DEFAULT_BRANCH", "Không thể xóa chi nhánh mặc định của trang trại.");
        }

        branchRepository.delete(branch);
    }

    @Override
    @Transactional
    public BranchResponse setDefaultBranch(Long farmId, Long branchId) {
        validateFarmExists(farmId);
        Branch branch = branchRepository.findById(branchId)
                .filter(b -> b.getFarmId().equals(farmId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BRANCH_NOT_FOUND", "Không tìm thấy chi nhánh chỉ định."));

        unsetExistingDefault(farmId);
        branch.setIsDefault(true);
        branch.setUpdatedAt(Instant.now());
        return toResponse(branchRepository.save(branch));
    }

    private void unsetExistingDefault(Long farmId) {
        branchRepository.findByFarmIdAndIsDefaultTrue(farmId).ifPresent(b -> {
            b.setIsDefault(false);
            branchRepository.save(b);
        });
    }

    private void validateFarmExists(Long farmId) {
        if (!farmRepository.existsById(farmId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "FARM_NOT_FOUND", "Trang trại không tồn tại: " + farmId);
        }
    }

    private BranchResponse toResponse(Branch b) {
        return BranchResponse.builder()
                .id(b.getId())
                .farmId(b.getFarmId())
                .code(b.getCode())
                .name(b.getName())
                .livestockType(b.getLivestockType())
                .address(b.getAddress())
                .phone(b.getPhone())
                .isDefault(b.getIsDefault())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
