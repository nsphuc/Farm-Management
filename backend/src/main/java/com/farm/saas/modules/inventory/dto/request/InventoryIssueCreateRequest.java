package com.farm.saas.modules.inventory.dto.request;

import com.farm.saas.modules.inventory.entity.IssueType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO yêu cầu tạo Phiếu Xuất kho (Nghiệp vụ: 3.4 Xuất kho).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryIssueCreateRequest {

    @NotNull(message = "Kho bãi không được để trống")
    @Schema(description = "ID kho bãi xuất hàng", example = "1")
    private Long warehouseId;

    @Size(max = 50, message = "Mã phiếu xuất không được vượt quá 50 ký tự")
    @Schema(description = "Mã chứng từ xuất kho (Nếu để trống hệ thống sẽ tự sinh)", example = "PXK-20261017-001")
    private String issueCode;

    @NotNull(message = "Loại xuất kho không được để trống")
    @Schema(description = "Loại xuất kho (PRODUCTION_BACKFLUSH, INTERNAL_USE, SALE_FULFILLMENT, DAMAGE_DISPOSAL, TRANSFER)", example = "INTERNAL_USE")
    private IssueType issueType;

    @Size(max = 150, message = "Tên người nhận không được vượt quá 150 ký tự")
    @Schema(description = "Tên người nhận hàng", example = "Nguyễn Văn A - Đội trưởng đội sản xuất 1")
    private String receiverName;

    @Schema(description = "ID vụ mùa canh tác tiêu thụ (nếu có)", example = "1")
    private Long seasonId;

    @Schema(description = "ID nhật ký canh tác (phục vụ Backflush)", example = "1")
    private Long farmingLogId;

    @Schema(description = "ID sự kiện chăn nuôi", example = "1")
    private Long livestockEventId;

    @NotNull(message = "Ngày xuất kho không được để trống")
    @Schema(description = "Ngày hạch toán xuất kho", example = "2026-10-17")
    private LocalDate issueDate;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    @Schema(description = "Ghi chú phiếu xuất", example = "Xuất phân bón bón lót cho ruộng số 3")
    private String notes;

    @NotEmpty(message = "Danh sách chi tiết xuất kho không được để trống")
    @Valid
    @Schema(description = "Danh sách các mặt hàng xuất kho")
    private List<InventoryIssueItemRequest> items;
}
