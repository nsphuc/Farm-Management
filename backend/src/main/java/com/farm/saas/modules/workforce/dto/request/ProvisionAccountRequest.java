package com.farm.saas.modules.workforce.dto.request;

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
    @jakarta.validation.constraints.Pattern(regexp = "^$|^[A-Za-z0-9._%+-]+@gmail\\.com$", flags = jakarta.validation.constraints.Pattern.Flag.CASE_INSENSITIVE, message = "Email phải có định dạng @gmail.com")
    private String email;
    private List<String> roles;
}
