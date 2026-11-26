package com.farm.saas.modules.geography.controller;

import com.farm.saas.modules.finance.entity.FarmFinancialSetting;
import com.farm.saas.modules.finance.repository.FarmFinancialSettingRepository;
import com.farm.saas.modules.geography.entity.FarmDataRule;
import com.farm.saas.modules.geography.repository.FarmDataRuleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/farms/{farmId}")
@RequiredArgsConstructor
@Tag(name = "Farm Settings", description = "Cấu hình Quy tắc Dữ liệu Trang trại & Cấu hình Tài chính VietQR")
public class FarmSettingsController {

    private final FarmDataRuleRepository farmDataRuleRepository;
    private final FarmFinancialSettingRepository farmFinancialSettingRepository;

    @GetMapping("/data-rules")
    @PreAuthorize("(hasAuthority('general_settings.view') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Lấy quy tắc dữ liệu trang trại", description = "Lấy cấu hình quản lý kho theo lô, hạn sử dụng, và số ngày giới hạn sửa nhật ký")
    public ResponseEntity<FarmDataRule> getDataRules(@PathVariable Long farmId) {
        FarmDataRule rules = farmDataRuleRepository.findByFarmId(farmId)
                .orElseGet(() -> farmDataRuleRepository.save(FarmDataRule.builder()
                        .farmId(farmId)
                        .manageByBatch(true)
                        .enforceExpiryDate(true)
                        .maxEditLogDays(3)
                        .autoDeductInventory(true)
                        .build()));
        return ResponseEntity.ok(rules);
    }

    @PutMapping("/data-rules")
    @PreAuthorize("(hasAuthority('general_settings.data_rules') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Cập nhật quy tắc dữ liệu trang trại", description = "Lưu cấu hình số ngày sửa nhật ký, trừ kho tự động")
    public ResponseEntity<FarmDataRule> updateDataRules(
            @PathVariable Long farmId,
            @RequestBody FarmDataRule request) {
        FarmDataRule rules = farmDataRuleRepository.findByFarmId(farmId)
                .orElseGet(() -> FarmDataRule.builder().farmId(farmId).build());

        if (request.getManageByBatch() != null) rules.setManageByBatch(request.getManageByBatch());
        if (request.getEnforceExpiryDate() != null) rules.setEnforceExpiryDate(request.getEnforceExpiryDate());
        if (request.getMaxEditLogDays() != null) rules.setMaxEditLogDays(Math.max(1, request.getMaxEditLogDays()));
        if (request.getAutoDeductInventory() != null) rules.setAutoDeductInventory(request.getAutoDeductInventory());
        rules.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(farmDataRuleRepository.save(rules));
    }

    @GetMapping("/financial-settings")
    @PreAuthorize("(hasAuthority('general_settings.view') or hasAuthority('cashbook.view') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Lấy cấu hình tài chính & VietQR", description = "Lấy thông tin tài khoản ngân hàng thụ hưởng và danh mục thu chi")
    public ResponseEntity<FarmFinancialSetting> getFinancialSettings(@PathVariable Long farmId) {
        FarmFinancialSetting settings = farmFinancialSettingRepository.findByFarmId(farmId)
                .orElseGet(() -> farmFinancialSettingRepository.save(FarmFinancialSetting.builder()
                        .farmId(farmId)
                        .bankBin("970436")
                        .bankName("Vietcombank")
                        .bankAccountNo("1026790945")
                        .bankAccountName("NGUYEN SI PHUC")
                        .build()));
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/financial-settings")
    @PreAuthorize("(hasAuthority('general_settings.financial') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    @Operation(summary = "Cập nhật cấu hình tài chính & VietQR", description = "Lưu tài khoản ngân hàng thụ hưởng VietQR Napas247")
    public ResponseEntity<FarmFinancialSetting> updateFinancialSettings(
            @PathVariable Long farmId,
            @RequestBody FarmFinancialSetting request) {
        FarmFinancialSetting settings = farmFinancialSettingRepository.findByFarmId(farmId)
                .orElseGet(() -> FarmFinancialSetting.builder().farmId(farmId).build());

        if (request.getBankBin() != null) settings.setBankBin(request.getBankBin().trim());
        if (request.getBankName() != null) settings.setBankName(request.getBankName().trim());
        if (request.getBankAccountNo() != null) settings.setBankAccountNo(request.getBankAccountNo().trim());
        if (request.getBankAccountName() != null) settings.setBankAccountName(request.getBankAccountName().trim().toUpperCase());
        if (request.getDefaultExpenseReasons() != null) settings.setDefaultExpenseReasons(request.getDefaultExpenseReasons());
        if (request.getDefaultIncomeReasons() != null) settings.setDefaultIncomeReasons(request.getDefaultIncomeReasons());
        settings.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(farmFinancialSettingRepository.save(settings));
    }
}
