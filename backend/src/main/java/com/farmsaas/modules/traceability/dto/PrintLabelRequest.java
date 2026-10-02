package com.farmsaas.modules.traceability.dto;

import com.farmsaas.modules.traceability.entity.enums.LabelSize;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintLabelRequest {

    @NotNull(message = "Kích thước tem in nhiệt không được để trống.")
    private LabelSize labelSize;

    @NotNull(message = "Số lượng tem cần in không được để trống.")
    @Positive(message = "Số lượng in phải lớn hơn 0.")
    private Integer printQuantity;

    private String printerModel;
}
