package com.farm.saas.modules.organization.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

/**
 * DTO yêu cầu tạo mới Chu kỳ vận hành / Năm tài chính.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationalCycleCreateRequest {

    @Schema(description = "ID trang trại (tùy chọn nếu đã có trong URL)", example = "1")
    private Long farmId;

    @NotBlank(message = "Tên chu kỳ không được để trống")
    @Size(max = 150, message = "Tên chu kỳ không được vượt quá 150 ký tự")
    @Schema(description = "Tên chu kỳ vận hành", example = "Vụ Đông Xuân 2026 - Lô A")
    private String name;

    @NotNull(message = "Năm tài chính không được để trống")
    @Min(value = 2000, message = "Năm tài chính phải từ năm 2000 trở đi")
    @Schema(description = "Năm tài chính", example = "2026")
    private Integer fiscalYear;

    @NotNull(message = "Ngày bắt đầu chu kỳ không được để trống")
    @Schema(description = "Ngày bắt đầu", example = "2026-01-01")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc chu kỳ không được để trống")
    @Schema(description = "Ngày kết thúc (Phải >= ngày bắt đầu)", example = "2026-06-30")
    private LocalDate endDate;

    @jakarta.validation.constraints.AssertTrue(message = "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu")
    @com.fasterxml.jackson.annotation.JsonIgnore
    public boolean isDateRangeValid() {
        if (startDate == null || endDate == null) {
            return true;
        }
        return !endDate.isBefore(startDate);
    }
}
