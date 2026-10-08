package com.farmsaas.modules.finance.entity;

import com.farmsaas.common.entity.BaseSystemEntity;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.traceability.entity.ProductBatch;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "sales_order_items")
public class SalesOrderItem extends BaseSystemEntity {

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    private SalesOrder order;

    @Column(name = "batch_id")
    private Long batchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", insertable = false, updatable = false)
    private ProductBatch batch;

    @Column(name = "season_id")
    private Long seasonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "season_id", insertable = false, updatable = false)
    private CropSeason season;

    @Column(name = "herd_id")
    private Long herdId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "herd_id", insertable = false, updatable = false)
    private LivestockGroup herd;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "quantity_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantityKg;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "subtotal", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal;
}
