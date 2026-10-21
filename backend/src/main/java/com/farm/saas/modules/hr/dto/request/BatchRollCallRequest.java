package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchRollCallRequest {

    @NotNull(message = "Trang trại không được để trống")
    private Long farmId;

    @NotNull(message = "Ca làm việc không được để trống")
    private Long shiftId;

    private LocalDate workDate;

    @NotBlank(message = "Loại điểm danh không được để trống (CHECK_IN hoặc CHECK_OUT)")
    private String actionType; // 'CHECK_IN' hoặc 'CHECK_OUT'

    @NotEmpty(message = "Danh sách nhân viên điểm danh không được để trống")
    private List<Long> employeeIds;

    @NotNull(message = "Tọa độ vĩ độ (latitude) không được để trống")
    private BigDecimal latitude;

    @NotNull(message = "Tọa độ kinh độ (longitude) không được để trống")
    private BigDecimal longitude;

    @NotBlank(message = "Ảnh chụp hiện trường nhóm nhân viên không được để trống")
    private String photoUrl;

    private String notes;
}
