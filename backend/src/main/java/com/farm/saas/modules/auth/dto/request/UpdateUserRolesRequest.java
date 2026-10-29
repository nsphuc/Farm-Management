package com.farm.saas.modules.auth.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRolesRequest {

    private List<Long> roleIds;

    private List<String> roleCodes;

    private List<String> roles;

    private List<Long> assignedFarmIds;
}
