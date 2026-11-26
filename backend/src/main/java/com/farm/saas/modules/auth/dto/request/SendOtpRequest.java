package com.farm.saas.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendOtpRequest {

    @NotBlank(message = "Email không được để trống")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@gmail\\.com$", message = "Email bắt buộc phải có đuôi @gmail.com")
    private String email;

    @NotBlank(message = "Loại OTP không được để trống")
    private String type; // REGISTER, FORGOT_PASSWORD
}
