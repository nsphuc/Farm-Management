package com.farm.saas.common.codegenerator;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class CodeGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private final AtomicLong sequence = new AtomicLong(System.currentTimeMillis() % 100000);

    public String generateCode(String prefix) {
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        long seq = sequence.incrementAndGet() % 100000;
        return String.format("%s%s-%04d", prefix, dateStr, seq);
    }

    public String generatePartnerCode() {
        return generateCode("PRT-");
    }

    public String generateFarmCode() {
        int part1 = (int) (Math.random() * 9000) + 1000;
        int part2 = (int) (Math.random() * 9000) + 1000;
        return String.format("FRM-%04d-%04d", part1, part2);
    }

    public String generateZoneCode() {
        return generateCode("ZON-");
    }

    public String generateLocationCode() {
        return generateCode("LOC-");
    }

    public String generateVarietyCode() {
        return generateCode("VAR-");
    }

    public String generateSeasonCode() {
        return generateCode("SSN-");
    }

    public String generateLivestockGroupCode() {
        return generateCode("GRP-");
    }

    public String generateRfidTagCode() {
        return generateCode("TAG-");
    }

    public String generateWarehouseCode() {
        return generateCode("WHS-");
    }

    public String generateMaterialCategoryCode() {
        return generateCode("MCT-");
    }

    public String generateMaterialSkuCode() {
        return generateCode("SKU-");
    }

    public String generateReceiptCode() {
        return generateCode("RC-");
    }

    public String generateIssueCode() {
        return generateCode("IS-");
    }

    public String generateTransferCode() {
        return generateCode("TR-");
    }

    public String generateStocktakeCode() {
        return generateCode("STK-");
    }

    public String generateHarvestCode() {
        return generateCode("HRV-");
    }

    public String generateBatchCode() {
        return generateCode("BAT-");
    }

    public String generateQcInspectionCode() {
        return generateCode("QC-");
    }

    public String generateEmployeeCode() {
        return generateCode("EMP-");
    }

    public String generateWorkShiftCode() {
        return generateCode("SHF-");
    }

    public String generateSalesOrderCode() {
        return generateCode("SO-");
    }

    public String generateDeliveryCode() {
        return generateCode("DO-");
    }

    public String generatePaymentCode() {
        return generateCode("PAY-");
    }

    public String generateExpenseCode() {
        return generateCode("EXP-");
    }

    public String generateCostCategoryCode() {
        return generateCode("CST-");
    }

    public String generateTaskCode() {
        return generateCode("TSK-");
    }

    public String generateUuidTraceabilityCode() {
        return UUID.randomUUID().toString();
    }
}
