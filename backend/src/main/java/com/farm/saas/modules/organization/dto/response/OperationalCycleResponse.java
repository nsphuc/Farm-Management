package com.farm.saas.modules.organization.dto.response;

import com.farm.saas.modules.organization.entity.OperationalCycleStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * DTO trả về thông tin chi tiết Chu kỳ vận hành cho Client.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationalCycleResponse {

    @Schema(description = "ID chu kỳ", example = "1")
    private Long id;

    @Schema(description = "ID trang trại sở tại", example = "10")
    private Long farmId;

    @Schema(description = "Tên chu kỳ", example = "Vụ Đông Xuân 2026 - Lô A")
    private String name;

    @Schema(description = "Năm tài chính", example = "2026")
    private Integer fiscalYear;

    @Schema(description = "Ngày bắt đầu chu kỳ", example = "2026-01-01")
    private LocalDate startDate;

    @Schema(description = "Ngày kết thúc chu kỳ", example = "2026-06-30")
    private LocalDate endDate;

    @Schema(description = "Trạng thái chu kỳ: PLANNING, ACTIVE, CLOSED", example = "ACTIVE")
    private OperationalCycleStatus status;

    @Schema(description = "Thời điểm khởi tạo bản ghi")
    private Instant createdAt;

    @Schema(description = "Thời điểm cập nhật mới nhất")
    private Instant updatedAt;
}
