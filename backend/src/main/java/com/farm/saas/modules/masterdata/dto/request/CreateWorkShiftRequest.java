package com.farm.saas.modules.masterdata.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWorkShiftRequest {

    @NotBlank(message = "Tên ca làm việc không được để trống")
    private String name;

    @NotBlank(message = "Mã ca làm việc không được để trống")
    private String shiftCode;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    private LocalTime endTime;

    @NotNull(message = "Thời gian nghỉ giữa ca không được để trống")
    @Min(value = 0, message = "Thời gian nghỉ giữa ca phải lớn hơn hoặc bằng 0")
    private Integer breakMinutes;

    @NotNull(message = "Thời gian ân hạn trễ không được để trống")
    @Min(value = 0, message = "Thời gian ân hạn trễ phải lớn hơn hoặc bằng 0")
    private Integer graceLateMinutes;

    @Builder.Default
    private Boolean isOvernight = false;
}
