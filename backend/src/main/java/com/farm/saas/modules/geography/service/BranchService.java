package com.farm.saas.modules.geography.service;

import com.farm.saas.modules.geography.dto.request.CreateBranchRequest;
import com.farm.saas.modules.geography.dto.request.UpdateBranchRequest;
import com.farm.saas.modules.geography.dto.response.BranchResponse;

import java.util.List;

public interface BranchService {

    List<BranchResponse> getBranches(Long farmId);

    BranchResponse getBranchById(Long farmId, Long branchId);

    BranchResponse createBranch(Long farmId, CreateBranchRequest request);

    BranchResponse updateBranch(Long farmId, Long branchId, UpdateBranchRequest request);

    void deleteBranch(Long farmId, Long branchId);

    BranchResponse setDefaultBranch(Long farmId, Long branchId);
}
