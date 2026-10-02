package com.farmsaas.modules.livestock.dto;

import com.farmsaas.modules.livestock.entity.enums.LivestockGroupStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockGroupRequest {

    @NotNull(message = "Phân khu chuồng trại không được để trống.")
    private Long zoneId;

    @Size(max = 50, message = "Mã bầy/đàn tối đa 50 ký tự.")
    private String groupCode; // nếu null, hệ thống tự sinh DAN-yyyyMMdd-XXXX

    @NotNull(message = "Giống vật nuôi không được để trống.")
    private Long breedId;

    @NotNull(message = "Số lượng ban đầu không được để trống.")
    @PositiveOrZero(message = "Số lượng ban đầu phải >= 0.")
    private Integer initialQuantity;

    private Integer currentQuantity;

    @NotNull(message = "Ngày nhập đàn không được để trống.")
    private LocalDate entryDate;

    private LivestockGroupStatus status;

    private String notes;
}
