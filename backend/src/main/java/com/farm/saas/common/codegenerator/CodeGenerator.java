package com.farm.saas.common.codegenerator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class CodeGenerator {

    private final Map<String, AtomicLong> sequenceMap = new ConcurrentHashMap<>();
    private final JdbcTemplate jdbcTemplate;

    public CodeGenerator(@Autowired(required = false) JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Sinh mã định danh tăng dần theo chuẩn: [PREFIX]-[XXX] (001, 002, 003...)
     */
    public String generateCode(String prefix) {
        String cleanPrefix = prefix.replace("-", "").toUpperCase();
        long seq = sequenceMap.computeIfAbsent(cleanPrefix, this::getInitialSequence).incrementAndGet();
        int pad = seq >= 1000 ? 4 : 3;
        return String.format("%s-%0" + pad + "d", cleanPrefix, seq);
    }

    private AtomicLong getInitialSequence(String prefix) {
        if (jdbcTemplate == null) {
            return new AtomicLong(0);
        }
        try {
            Long maxSeq = null;
            switch (prefix) {
                case "SO":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(order_code, 4) AS UNSIGNED)) FROM sales_orders WHERE order_code LIKE 'SO-%'", Long.class);
                    break;
                case "DO":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(delivery_code, 4) AS UNSIGNED)) FROM sales_deliveries WHERE delivery_code LIKE 'DO-%'", Long.class);
                    break;
                case "PRT":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(partner_code, 5) AS UNSIGNED)) FROM partners WHERE partner_code LIKE 'PRT-%'", Long.class);
                    break;
                case "FRM":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(farm_code, 5) AS UNSIGNED)) FROM farms WHERE farm_code LIKE 'FRM-%'", Long.class);
                    break;
                case "SSN":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(season_code, 5) AS UNSIGNED)) FROM crop_seasons WHERE season_code LIKE 'SSN-%'", Long.class);
                    break;
                case "GRP":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(group_code, 5) AS UNSIGNED)) FROM livestock_groups WHERE group_code LIKE 'GRP-%'", Long.class);
                    break;
                case "EXP":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(expense_code, 5) AS UNSIGNED)) FROM expense_records WHERE expense_code LIKE 'EXP-%'", Long.class);
                    break;
                case "PAY":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(payment_code, 5) AS UNSIGNED)) FROM payment_transactions WHERE payment_code LIKE 'PAY-%'", Long.class);
                    break;
                case "CST":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(category_code, 5) AS UNSIGNED)) FROM cost_categories WHERE category_code LIKE 'CST-%'", Long.class);
                    break;
                case "EMP":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(employee_code, 5) AS UNSIGNED)) FROM employees WHERE employee_code LIKE 'EMP-%'", Long.class);
                    break;
                case "SHF":
                    maxSeq = jdbcTemplate.queryForObject(
                            "SELECT MAX(CAST(SUBSTRING(shift_code, 5) AS UNSIGNED)) FROM work_shifts WHERE shift_code LIKE 'SHF-%'", Long.class);
                    break;
                default:
                    break;
            }
            return new AtomicLong(maxSeq != null ? maxSeq : 0);
        } catch (Exception e) {
            return new AtomicLong(0);
        }
    }

    public String generatePartnerCode() {
        return generateCode("PRT");
    }

    public String generateFarmCode() {
        return generateCode("FRM");
    }

    public String generateZoneCode() {
        return generateCode("ZON");
    }

    public String generateLocationCode() {
        return generateCode("LOC");
    }

    public String generateVarietyCode() {
        return generateCode("VAR");
    }

    public String generateSeasonCode() {
        return generateCode("SSN");
    }

    public String generateLivestockGroupCode() {
        return generateCode("GRP");
    }

    public String generateRfidTagCode() {
        return generateCode("TAG");
    }

    public String generateWarehouseCode() {
        return generateCode("WHS");
    }

    public String generateMaterialCategoryCode() {
        return generateCode("MCT");
    }

    public String generateMaterialSkuCode() {
        return generateCode("SKU");
    }

    public String generateReceiptCode() {
        return generateCode("RC");
    }

    public String generateIssueCode() {
        return generateCode("IS");
    }

    public String generateTransferCode() {
        return generateCode("TR");
    }

    public String generateStocktakeCode() {
        return generateCode("STK");
    }

    public String generateHarvestCode() {
        return generateCode("HRV");
    }

    public String generateBatchCode() {
        return generateCode("BAT");
    }

    public String generateQcInspectionCode() {
        return generateCode("QC");
    }

    public String generateEmployeeCode() {
        return generateCode("EMP");
    }

    public String generateWorkShiftCode() {
        return generateCode("SHF");
    }

    public String generateSalesOrderCode() {
        return generateCode("SO");
    }

    public String generateDeliveryCode() {
        return generateCode("DO");
    }

    public String generatePaymentCode() {
        return generateCode("PAY");
    }

    public String generateExpenseCode() {
        return generateCode("EXP");
    }

    public String generateCostCategoryCode() {
        return generateCode("CST");
    }

    public String generateTaskCode() {
        return generateCode("TSK");
    }

    public String generateUuidTraceabilityCode() {
        return UUID.randomUUID().toString();
    }
}
