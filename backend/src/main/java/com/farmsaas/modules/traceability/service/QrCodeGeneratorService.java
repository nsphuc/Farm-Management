package com.farmsaas.modules.traceability.service;

public interface QrCodeGeneratorService {

    /**
     * Sinh chuỗi Data URI Base64 ("data:image/png;base64,...") của ảnh mã QR.
     */
    String generateQrCodeBase64(String content, int width, int height);

    /**
     * Sinh mảng byte PNG của mã QR (độ nét cao phục vụ in tem nhiệt).
     */
    byte[] generateQrCodeBytes(String content, int width, int height);
}
