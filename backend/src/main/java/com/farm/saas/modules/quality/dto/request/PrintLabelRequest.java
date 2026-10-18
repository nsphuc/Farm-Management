package com.farm.saas.modules.quality.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintLabelRequest {

    @NotBlank(message = "Kích thước tem không được để trống (50x50 hoặc 35x22)")
    @Pattern(regexp = "50x50|35x22", message = "Kích thước tem phải là 50x50 hoặc 35x22")
    private String labelSize;

    @NotNull(message = "Số lượng in không được để trống")
    @Min(value = 1, message = "Số lượng in phải lớn hơn hoặc bằng 1")
    private Integer printQuantity;

    private String printerModel;
}
