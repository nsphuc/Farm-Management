package com.farm.saas.modules.finance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sales_deliveries")
public class SalesDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "sales_order_id", nullable = false)
    private Long salesOrderId;

    @Column(name = "logistics_partner_id")
    private Long logisticsPartnerId;

    @Column(name = "delivery_code", nullable = false, length = 50)
    private String deliveryCode;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "driver_name", length = 150)
    private String driverName;

    @Column(name = "vehicle_plate", length = 50)
    private String vehiclePlate;

    @Column(name = "proof_of_delivery_url", length = 500)
    private String proofOfDeliveryUrl;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "delivered_by_user_id")
    private Long deliveredByUserId;

    @Column(name = "receiver_name", length = 150)
    private String receiverName;

    @Column(name = "shipping_address", length = 500)
    private String shippingAddress;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "total_shipped_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalShippedAmount;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

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
