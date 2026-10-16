package com.farm.saas.modules.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity đại diện cho bảng materials (Danh mục Mặt hàng / Vật tư nông nghiệp).
 * Lưu trữ thông tin SKU, đơn vị chuẩn, chiến lược xuất kho FIFO/FEFO và ngưỡng tồn kho.
 * Áp dụng Tenant Isolation: Vật tư thuộc về Tenant sở hữu.
 */
@Entity
@Table(name = "materials", uniqueConstraints = {
        @UniqueConstraint(name = "uk_materials_sku", columnNames = {"tenant_id", "sku_code"}),
        @UniqueConstraint(name = "uk_materials_tenant_id", columnNames = {"tenant_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation: Xác định Tenant sở hữu
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Nhóm vật tư (Foreign key tới material_categories)
    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    // Mã SKU quản lý vật tư (duy nhất trong Tenant, VD: SKU-NPK-202015, SKU-LUA-ST25)
    @Column(name = "sku_code", nullable = false, length = 50)
    private String skuCode;

    // Tên vật tư nông nghiệp
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    // Đơn vị tính chuẩn: KG, GRAM, LITER, ML, BAG, BOTTLE, DOSE, PIECE, BOX
    @Enumerated(EnumType.STRING)
    @Column(name = "standard_unit", nullable = false, length = 30)
    private StandardUnit standardUnit;

    // Chiến lược xuất kho: FIFO (Nhập trước xuất trước), FEFO (Hết hạn trước xuất trước)
    @Enumerated(EnumType.STRING)
    @Column(name = "dispatch_strategy", nullable = false, length = 20)
    @Builder.Default
    private DispatchStrategy dispatchStrategy = DispatchStrategy.FIFO;

    // Số ngày cảnh báo trước khi hết hạn sử dụng (mặc định 30 ngày)
    @Column(name = "expiry_alert_days", nullable = false)
    @Builder.Default
    private Integer expiryAlertDays = 30;

    // Ngưỡng tồn kho tối thiểu (cảnh báo thiếu hàng), >= 0.00
    @Column(name = "min_stock_level", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    // Ngưỡng tồn kho tối đa (cảnh báo tồn quá mức), có thể null hoặc >= minStockLevel
    @Column(name = "max_stock_level", precision = 12, scale = 2)
    private BigDecimal maxStockLevel;

    // Đơn giá tiêu chuẩn (tham chiếu giá mua/giá hạch toán), >= 0.00
    @Column(name = "unit_price_standard", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal unitPriceStandard = BigDecimal.ZERO;

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
}
