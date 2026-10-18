package com.farm.saas.modules.geography.entity;

import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserFarmAccessId implements Serializable {
    private Long userId;
    private Long farmId;
}
