package com.farmsaas.modules.traceability.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.farmsaas.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

@Slf4j
@Service
public class QrCodeGeneratorServiceImpl implements QrCodeGeneratorService {

    @Override
    public String generateQrCodeBase64(String content, int width, int height) {
        byte[] pngBytes = generateQrCodeBytes(content, width, height);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngBytes);
    }

    @Override
    public byte[] generateQrCodeBytes(String content, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name());
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H); // High recovery (30%) cho tem in nhiệt
            hints.put(EncodeHintType.MARGIN, 1); // Viền tối thiểu 1 block chuẩn

            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height, hints);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate QR code for content '{}': {}", content, e.getMessage(), e);
            throw new BusinessException("Lỗi sinh mã QR code: " + e.getMessage());
        }
    }
}
