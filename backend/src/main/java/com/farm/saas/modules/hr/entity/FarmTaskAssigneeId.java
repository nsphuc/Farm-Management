package com.farm.saas.modules.hr.entity;

import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FarmTaskAssigneeId implements Serializable {
    private Long taskId;
    private Long employeeId;
}
