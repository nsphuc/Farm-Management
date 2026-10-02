package com.farmsaas.modules.inventory.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryBackflushRequest {
    private Long materialId;
    private String batchNumber; // nullable: if null or empty, system deducts via FIFO
    private BigDecimal quantity;
    private String unit;
}
