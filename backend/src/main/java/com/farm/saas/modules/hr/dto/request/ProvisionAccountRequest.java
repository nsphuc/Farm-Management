package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProvisionAccountRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    private String initialPassword;
    private String email;
    private List<String> roles;
}
