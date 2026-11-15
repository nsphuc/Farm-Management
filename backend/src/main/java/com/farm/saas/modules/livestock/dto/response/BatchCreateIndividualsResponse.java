package com.farm.saas.modules.livestock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchCreateIndividualsResponse {
    private int totalCreated;
    private List<LivestockIndividualDetailResponse> items;
    private List<String> skippedTagCodes;
    private String message;
    private boolean inventoryDeducted;
    private BigDecimal totalTagCost;
    private String issueCode;
    private String expenseCode;
}

