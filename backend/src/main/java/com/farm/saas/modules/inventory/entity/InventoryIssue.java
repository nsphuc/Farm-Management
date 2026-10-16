package com.farm.saas.modules.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity đại diện cho bảng warehouse_issues (Phiếu Xuất kho vật tư).
 * Nghiệp vụ: 3.4. Xuất kho (Inventory Issues).
 * Áp dụng Tenant Isolation & The Farm Barrier Guard: Liên kết chặt chẽ theo tenant_id và farm_id.
 * Hỗ trợ các mục đích: Xuất sản xuất, Tiêu dùng nội bộ, Bán hàng, Tiêu hủy, v.v.
 * Quy tắc bất biến: Không xóa vật lý, chỉ đổi trạng thái sang CANCELLED nếu hủy phiếu.
 */
@Entity
@Table(name = "warehouse_issues", uniqueConstraints = {
        @UniqueConstraint(name = "uk_warehouse_issues_code", columnNames = {"tenant_id", "farm_id", "issue_code"}),
        @UniqueConstraint(name = "uk_warehouse_issues_tenant_farm_id", columnNames = {"tenant_id", "farm_id", "id"}),
        @UniqueConstraint(name = "uk_warehouse_issues_tenant_id", columnNames = {"tenant_id", "id"})
}, indexes = {
        @Index(name = "idx_warehouse_issues_tenant", columnList = "tenant_id"),
        @Index(name = "idx_warehouse_issues_farm", columnList = "farm_id"),
        @Index(name = "idx_warehouse_issues_date", columnList = "issue_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // The Farm Barrier Guard
    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    // Kho bãi xuất hàng
    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    // Mã chứng từ phiếu xuất (duy nhất trong cùng Farm và Tenant, VD: PXK-20261017-001)
    @Column(name = "issue_code", nullable = false, length = 50)
    private String issueCode;

    // Loại hình xuất kho
    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", nullable = false, length = 50)
    private IssueType issueType;

    // Người nhận hàng / Bộ phận nhận
    @Column(name = "receiver_name", length = 150)
    private String receiverName;

    // Vụ mùa tiêu thụ vật tư (nếu có)
    @Column(name = "season_id")
    private Long seasonId;

    // Hoạt động canh tác liên quan (phục vụ Backflushing)
    @Column(name = "farming_log_id")
    private Long farmingLogId;

    // Sự kiện chăn nuôi liên quan
    @Column(name = "livestock_event_id")
    private Long livestockEventId;

    // Cờ đánh dấu phiếu xuất sinh tự động (Backflushed)
    @Column(name = "is_backflushed", nullable = false)
    @Builder.Default
    private Boolean isBackflushed = false;

    // Ngày hạch toán xuất kho
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    // Tổng giá trị tiền hàng xuất kho
    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "notes", length = 500)
    private String notes;

    // Trạng thái phiếu xuất: DRAFT, APPROVED, COMPLETED, CANCELLED
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private IssueStatus status = IssueStatus.COMPLETED;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by")
    private Long cancelledBy;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Version
    @Column(name = "version")
    private Long version;

    // Danh sách dòng chi tiết phiếu xuất kho
    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InventoryIssueDetail> items = new ArrayList<>();

    public void addItem(InventoryIssueDetail item) {
        if (items == null) {
            items = new ArrayList<>();
        }
        items.add(item);
        item.setIssue(this);
    }
}
