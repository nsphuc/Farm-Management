package com.farm.saas.modules.auth.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmMemberRequest {

    @NotNull(message = "Thiếu định danh người dùng")
    private Long userId;

    @NotNull(message = "Thiếu định danh vai trò")
    private Long roleId;

    private Long branchId;

    @Builder.Default
    private Boolean allBarns = true;

    private List<Long> barnIds;
}
