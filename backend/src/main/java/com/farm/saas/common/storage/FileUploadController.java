package com.farm.saas.common.storage;

import com.farm.saas.common.exception.ApiException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/uploads")
@RequiredArgsConstructor
@Tag(name = "Upload API", description = "Tải lên và phân phát hình ảnh tĩnh, tài liệu nông nghiệp")
public class FileUploadController {

    private final CloudinaryService cloudinaryService;
    private static final String UPLOAD_DIR = "uploads/images/";
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/svg+xml"
    );

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải ảnh từ máy tính (hỗ trợ cả lưu trữ đám mây Cloudinary và lưu trữ máy chủ cục bộ)")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FILE_EMPTY", "Tập tin không được để trống.");
        }

        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_FILE_TYPE", "Chỉ chấp nhận các định dạng ảnh: JPG, PNG, WEBP, GIF, SVG.");
        }

        try {
            // 1. Thử tải lên Cloudinary nếu đã cấu hình
            try {
                byte[] bytes = file.getBytes();
                String mime = (contentType != null && !contentType.isBlank()) ? contentType : "image/jpeg";
                String base64Data = "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);

                String cloudUrl = cloudinaryService.uploadImage(base64Data, "farm_saas/catalog");
                if (StringUtils.hasText(cloudUrl) && (cloudUrl.startsWith("http://") || cloudUrl.startsWith("https://"))) {
                    log.info("Uploaded image to cloud storage: {}", cloudUrl);
                    return ResponseEntity.ok(Map.of("url", cloudUrl));
                }
            } catch (Exception cloudEx) {
                log.warn("Cloudinary upload skipped or failed: {}", cloudEx.getMessage());
            }

            // 2. Fallback: Lưu vào thư mục máy chủ cục bộ
            Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";
            if (StringUtils.hasText(originalFilename)) {
                String cleanName = StringUtils.cleanPath(originalFilename);
                int dotIdx = cleanName.lastIndexOf('.');
                if (dotIdx >= 0) {
                    extension = cleanName.substring(dotIdx).toLowerCase();
                }
            }

            String uniqueFilename = UUID.randomUUID().toString() + extension;
            Path targetLocation = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String localUrl = "/api/v1/uploads/images/" + uniqueFilename;
            log.info("Saved image to local server: {}", localUrl);
            return ResponseEntity.ok(Map.of("url", localUrl));

        } catch (Exception e) {
            log.error("Failed to store file", e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_UPLOAD_FAILED", "Không thể lưu tệp hình ảnh: " + e.getMessage());
        }
    }

    @GetMapping("/images/{filename:.+}")
    @Operation(summary = "Xem và phân phát hình ảnh tĩnh đã tải lên")
    public ResponseEntity<Resource> serveImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize().resolve(filename).normalize();
            if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "image/jpeg";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

