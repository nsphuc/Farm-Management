package com.farm.saas.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCustomRoleRequest {

    @NotBlank(message = "Tên vai trò không được để trống")
    private String name;

    private String description;

    @NotEmpty(message = "Vui lòng chọn ít nhất một quyền hạn")
    private List<Long> permissionIds;
}
