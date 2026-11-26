package com.farm.saas.modules.purchase.config;

import com.farm.saas.modules.purchase.entity.PurchaseInvoice;
import com.farm.saas.modules.purchase.entity.PurchaseInvoiceItem;
import com.farm.saas.modules.purchase.repository.PurchaseInvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@Order(30)
@RequiredArgsConstructor
public class PurchaseDataInitializerRunner implements CommandLineRunner {

    private final PurchaseInvoiceRepository purchaseInvoiceRepository;

    @Override
    public void run(String... args) {
        try {
            if (purchaseInvoiceRepository.count() == 0) {
                log.info("Bảng purchase_invoices đang trống. Tiến hành khởi tạo 5 hóa đơn nhập hàng mẫu chuẩn thực tế...");
                seedBaselineInvoices();
                log.info("Khởi tạo hóa đơn nhập hàng thành công.");
            }
        } catch (Exception ex) {
            log.warn("Không thể khởi tạo hóa đơn nhập hàng mẫu: {}", ex.getMessage());
        }
    }

    private void seedBaselineInvoices() {
        // 1. PN-2026-015
        PurchaseInvoice inv1 = PurchaseInvoice.builder()
                .tenantId(1L)
                .farmId(1L)
                .branchId(1L)
                .invoiceNumber("PN-2026-015")
                .invoiceDate(LocalDate.now().minusDays(3))
                .supplierId(1L)
                .supplierName("Công ty Cổ phần Chăn nuôi C.P. Việt Nam")
                .invoiceType("FEED_MED")
                .destinationType("WAREHOUSE")
                .destinationName("Kho Cám Khu A (Gà)")
                .warehouseId(1L)
                .totalGoodsAmount(new BigDecimal("105250000.00"))
                .discountAmount(new BigDecimal("2000000.00"))
                .totalPaymentAmount(new BigDecimal("103250000.00"))
                .paidAmount(new BigDecimal("53250000.00"))
                .remainingDebt(new BigDecimal("50000000.00"))
                .paymentStatus("PARTIAL")
                .paymentMethod("BANK_TRANSFER")
                .creatorName("Trần Kỹ Thuật Viên")
                .approverName("Lê Kế Toán Kho")
                .notes("Nhập cám gà giai đoạn 1 và giai đoạn 2 cho lứa T11, thanh toán trước 50%, gối đầu 50 triệu")
                .createdAt(Instant.now().minusSeconds(86400 * 3))
                .build();

        List<PurchaseInvoiceItem> items1 = new ArrayList<>();
        items1.add(PurchaseInvoiceItem.builder()
                .invoice(inv1)
                .materialId(1L)
                .itemName("Cám Gà Con GĐ1 (0-14 ngày)")
                .unit("Bao")
                .quantity(new BigDecimal("100.00"))
                .lotCode("LOT-CGA1-2611A")
                .expiryDate(LocalDate.now().plusMonths(5))
                .unitPrice(new BigDecimal("362500.00"))
                .amount(new BigDecimal("36250000.00"))
                .build());
        items1.add(PurchaseInvoiceItem.builder()
                .invoice(inv1)
                .materialId(2L)
                .itemName("Cám Gà Thịt Giai Đoạn 2")
                .unit("Bao")
                .quantity(new BigDecimal("200.00"))
                .lotCode("LOT-CGA2-2611B")
                .expiryDate(LocalDate.now().plusMonths(6))
                .unitPrice(new BigDecimal("345000.00"))
                .amount(new BigDecimal("69000000.00"))
                .build());
        inv1.setItems(items1);
        purchaseInvoiceRepository.save(inv1);

        // 2. PN-2026-014
        PurchaseInvoice inv2 = PurchaseInvoice.builder()
                .tenantId(1L)
                .farmId(1L)
                .branchId(1L)
                .invoiceNumber("PN-2026-014")
                .invoiceDate(LocalDate.now().minusDays(7))
                .supplierId(2L)
                .supplierName("Công ty Cổ phần Tập đoàn Dabaco Việt Nam")
                .invoiceType("BREED")
                .destinationType("BARN")
                .destinationName("Chuồng Gà A1 - Lứa Gà Thịt T11")
                .barnId(1L)
                .totalGoodsAmount(new BigDecimal("48000000.00"))
                .discountAmount(BigDecimal.ZERO)
                .totalPaymentAmount(new BigDecimal("48000000.00"))
                .paidAmount(new BigDecimal("48000000.00"))
                .remainingDebt(BigDecimal.ZERO)
                .paymentStatus("PAID")
                .paymentMethod("BANK_TRANSFER")
                .creatorName("Trần Kỹ Thuật Viên")
                .approverName("Lê Kế Toán Kho")
                .notes("Nhập 3.000 con gà giống Mía lai 1 ngày tuổi tiêm sẵn Marek, đồng đều khỏe mạnh")
                .createdAt(Instant.now().minusSeconds(86400 * 7))
                .build();

        List<PurchaseInvoiceItem> items2 = new ArrayList<>();
        items2.add(PurchaseInvoiceItem.builder()
                .invoice(inv2)
                .materialId(10L)
                .itemName("Gà con giống Mía lai 1 ngày tuổi")
                .unit("Con")
                .quantity(new BigDecimal("3000.00"))
                .lotCode("LOT-GIA-MIA1")
                .expiryDate(LocalDate.now().plusMonths(12))
                .unitPrice(new BigDecimal("16000.00"))
                .amount(new BigDecimal("48000000.00"))
                .build());
        inv2.setItems(items2);
        purchaseInvoiceRepository.save(inv2);

        // 3. PN-2026-013
        PurchaseInvoice inv3 = PurchaseInvoice.builder()
                .tenantId(1L)
                .farmId(1L)
                .branchId(1L)
                .invoiceNumber("PN-2026-013")
                .invoiceDate(LocalDate.now().minusDays(10))
                .supplierId(4L)
                .supplierName("Công ty CJ Vina Agri")
                .invoiceType("FEED_MED")
                .destinationType("WAREHOUSE")
                .destinationName("Kho Cám Khu B (Heo)")
                .warehouseId(2L)
                .totalGoodsAmount(new BigDecimal("111000000.00"))
                .discountAmount(new BigDecimal("1000000.00"))
                .totalPaymentAmount(new BigDecimal("110000000.00"))
                .paidAmount(BigDecimal.ZERO)
                .remainingDebt(new BigDecimal("110000000.00"))
                .paymentStatus("UNPAID")
                .paymentMethod("DEBT")
                .creatorName("Trần Kỹ Thuật Viên")
                .approverName("Lê Kế Toán Kho")
                .notes("Mua gối đầu 300 bao cám vỗ béo heo thịt, hẹn thanh toán vào đợt xuất bán heo tới")
                .createdAt(Instant.now().minusSeconds(86400 * 10))
                .build();

        List<PurchaseInvoiceItem> items3 = new ArrayList<>();
        items3.add(PurchaseInvoiceItem.builder()
                .invoice(inv3)
                .materialId(3L)
                .itemName("Cám Heo Thịt Vỗ Béo Cao Cấp")
                .unit("Bao")
                .quantity(new BigDecimal("300.00"))
                .lotCode("LOT-CHB-2611A")
                .expiryDate(LocalDate.now().plusMonths(6))
                .unitPrice(new BigDecimal("370000.00"))
                .amount(new BigDecimal("111000000.00"))
                .build());
        inv3.setItems(items3);
        purchaseInvoiceRepository.save(inv3);

        // 4. PN-2026-012
        PurchaseInvoice inv4 = PurchaseInvoice.builder()
                .tenantId(1L)
                .farmId(1L)
                .branchId(1L)
                .invoiceNumber("PN-2026-012")
                .invoiceDate(LocalDate.now().minusDays(14))
                .supplierId(3L)
                .supplierName("Công ty TNHH Thú Y Xanh Việt Nam (GreenVet)")
                .invoiceType("FEED_MED")
                .destinationType("WAREHOUSE")
                .destinationName("Kho Thuốc & Vắc-Xin")
                .warehouseId(3L)
                .totalGoodsAmount(new BigDecimal("32950000.00"))
                .discountAmount(new BigDecimal("950000.00"))
                .totalPaymentAmount(new BigDecimal("32000000.00"))
                .paidAmount(new BigDecimal("32000000.00"))
                .remainingDebt(BigDecimal.ZERO)
                .paymentStatus("PAID")
                .paymentMethod("BANK_TRANSFER")
                .creatorName("Trần Kỹ Thuật Viên")
                .approverName("Nguyễn Văn Chủ")
                .notes("Nhập dự trữ kháng sinh phòng bệnh tiêu chảy và vắc xin dịch tả định kỳ")
                .createdAt(Instant.now().minusSeconds(86400 * 14))
                .build();

        List<PurchaseInvoiceItem> items4 = new ArrayList<>();
        items4.add(PurchaseInvoiceItem.builder()
                .invoice(inv4)
                .materialId(4L)
                .itemName("Kháng sinh Amox 50% đặc trị tiêu chảy")
                .unit("Lọ")
                .quantity(new BigDecimal("50.00"))
                .lotCode("LOT-AMX-2609")
                .expiryDate(LocalDate.now().plusMonths(10))
                .unitPrice(new BigDecimal("185000.00"))
                .amount(new BigDecimal("9250000.00"))
                .build());
        items4.add(PurchaseInvoiceItem.builder()
                .invoice(inv4)
                .materialId(5L)
                .itemName("Vắc-xin Dịch Tả Heo Cổ Điển")
                .unit("Lọ")
                .quantity(new BigDecimal("30.00"))
                .lotCode("LOT-VAC-2608")
                .expiryDate(LocalDate.now().plusMonths(9))
                .unitPrice(new BigDecimal("240000.00"))
                .amount(new BigDecimal("7200000.00"))
                .build());
        items4.add(PurchaseInvoiceItem.builder()
                .invoice(inv4)
                .materialId(6L)
                .itemName("Men tiêu hóa vi sinh Probio Active")
                .unit("Gói")
                .quantity(new BigDecimal("100.00"))
                .lotCode("LOT-PRO-2610")
                .expiryDate(LocalDate.now().plusMonths(12))
                .unitPrice(new BigDecimal("165000.00"))
                .amount(new BigDecimal("16500000.00"))
                .build());
        inv4.setItems(items4);
        purchaseInvoiceRepository.save(inv4);

        // 5. PN-2026-011
        PurchaseInvoice inv5 = PurchaseInvoice.builder()
                .tenantId(1L)
                .farmId(1L)
                .branchId(1L)
                .invoiceNumber("PN-2026-011")
                .invoiceDate(LocalDate.now().minusDays(20))
                .supplierId(1L)
                .supplierName("Công ty Cổ phần Chăn nuôi C.P. Việt Nam")
                .invoiceType("BREED")
                .destinationType("BARN")
                .destinationName("Chuồng Heo B1 - Lứa Heo Thịt H09")
                .barnId(3L)
                .totalGoodsAmount(new BigDecimal("174000000.00"))
                .discountAmount(new BigDecimal("4000000.00"))
                .totalPaymentAmount(new BigDecimal("170000000.00"))
                .paidAmount(new BigDecimal("130000000.00"))
                .remainingDebt(new BigDecimal("40000000.00"))
                .paymentStatus("PARTIAL")
                .paymentMethod("BANK_TRANSFER")
                .creatorName("Trần Kỹ Thuật Viên")
                .approverName("Lê Kế Toán Kho")
                .notes("Nhập 120 con heo giống cai sữa F1 trọng lượng bình quân 8.0 kg/con")
                .createdAt(Instant.now().minusSeconds(86400 * 20))
                .build();

        List<PurchaseInvoiceItem> items5 = new ArrayList<>();
        items5.add(PurchaseInvoiceItem.builder()
                .invoice(inv5)
                .materialId(11L)
                .itemName("Heo giống cai sữa siêu nạc F1")
                .unit("Con")
                .quantity(new BigDecimal("120.00"))
                .lotCode("LOT-HEO-F1-09")
                .expiryDate(LocalDate.now().plusMonths(12))
                .unitPrice(new BigDecimal("1450000.00"))
                .amount(new BigDecimal("174000000.00"))
                .build());
        inv5.setItems(items5);
        purchaseInvoiceRepository.save(inv5);
    }
}
