package com.farm.saas.modules.inventory.dto.response;

import com.farm.saas.modules.inventory.entity.IssueStatus;
import com.farm.saas.modules.inventory.entity.IssueType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO trả về thông tin chi tiết Phiếu Xuất kho.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryIssueResponse {

    @Schema(description = "ID phiếu xuất", example = "1")
    private Long id;

    @Schema(description = "ID Tenant", example = "1")
    private Long tenantId;

    @Schema(description = "ID Trang trại", example = "1")
    private Long farmId;

    @Schema(description = "ID Kho bãi", example = "1")
    private Long warehouseId;

    @Schema(description = "Tên kho bãi", example = "Kho Phân bón 01")
    private String warehouseName;

    @Schema(description = "Mã phiếu xuất", example = "PXK-20261017-001")
    private String issueCode;

    @Schema(description = "Loại xuất kho", example = "INTERNAL_USE")
    private IssueType issueType;

    @Schema(description = "Tên người nhận", example = "Nguyễn Văn A")
    private String receiverName;

    @Schema(description = "ID Vụ mùa canh tác", example = "1")
    private Long seasonId;

    @Schema(description = "ID Nhật ký canh tác", example = "1")
    private Long farmingLogId;

    @Schema(description = "ID Sự kiện chăn nuôi", example = "1")
    private Long livestockEventId;

    @Schema(description = "Cờ tự động sinh do Backflush", example = "false")
    private Boolean isBackflushed;

    @Schema(description = "Ngày xuất kho", example = "2026-10-17")
    private LocalDate issueDate;

    @Schema(description = "Tổng giá trị xuất kho", example = "500000.00")
    private BigDecimal totalAmount;

    @Schema(description = "Ghi chú", example = "Xuất bón lót")
    private String notes;

    @Schema(description = "Trạng thái phiếu xuất", example = "COMPLETED")
    private IssueStatus status;

    @Schema(description = "Danh sách chi tiết hàng xuất")
    private List<InventoryIssueItemResponse> items;

    @Schema(description = "Thời điểm tạo phiếu")
    private Instant createdAt;

    @Schema(description = "ID người tạo phiếu")
    private Long createdBy;
}
