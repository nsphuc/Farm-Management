package com.farmsaas.modules.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendNotificationRequest {

    @NotNull(message = "Người nhận không được để trống.")
    private Long recipientId;

    @NotBlank(message = "Loại thông báo không được để trống.")
    @Size(max = 50, message = "Loại thông báo tối đa 50 ký tự.")
    private String type;

    @NotBlank(message = "Tiêu đề không được để trống.")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự.")
    private String title;

    @NotBlank(message = "Nội dung thông báo không được để trống.")
    private String message;

    private String dataJson;
}
