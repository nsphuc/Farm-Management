package com.farm.saas.common.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.TreeMap;

/**
 * Cloudinary Storage Service
 * Uploads images (Base64 data URIs or raw bytes) to Cloudinary cloud storage
 * Returns secure URL for database storage and cross-device display.
 * Includes graceful fallback to original data if cloud is unconfigured or unavailable.
 */
@Slf4j
@Service
public class CloudinaryService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${cloudinary.upload-preset:}")
    private String uploadPreset;

    private final RestTemplate restTemplate;

    public CloudinaryService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Upload an image (typically data:image/webp;base64,...) to Cloudinary.
     *
     * @param base64Data Base64 Data URI or image URL
     * @param folder     Cloudinary folder name (e.g., "farm_saas/attendance")
     * @return Cloudinary secure_url (https://res.cloudinary.com/...) or fallback to base64Data
     */
    public String uploadImage(String base64Data, String folder) {
        if (!StringUtils.hasText(base64Data)) {
            return base64Data;
        }

        // Already a remote URL (http:// or https://)
        if (base64Data.startsWith("http://") || base64Data.startsWith("https://")) {
            return base64Data;
        }

        // Check if Cloudinary is configured
        if (!StringUtils.hasText(cloudName)) {
            log.debug("Cloudinary cloud-name is not configured. Retaining original image payload.");
            return base64Data;
        }

        try {
            String uploadUrl = String.format("https://api.cloudinary.com/v1_1/%s/image/upload", cloudName.trim());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("file", base64Data);

            if (StringUtils.hasText(uploadPreset)) {
                // Unsigned Upload
                params.add("upload_preset", uploadPreset.trim());
                if (StringUtils.hasText(folder)) {
                    params.add("folder", folder.trim());
                }
            } else if (StringUtils.hasText(apiKey) && StringUtils.hasText(apiSecret)) {
                // Signed Upload
                long timestamp = System.currentTimeMillis() / 1000L;
                Map<String, String> signParams = new TreeMap<>();
                signParams.put("timestamp", String.valueOf(timestamp));
                if (StringUtils.hasText(folder)) {
                    signParams.put("folder", folder.trim());
                }

                // Generate SHA-1 signature
                StringBuilder toSign = new StringBuilder();
                for (Map.Entry<String, String> entry : signParams.entrySet()) {
                    if (toSign.length() > 0) {
                        toSign.append("&");
                    }
                    toSign.append(entry.getKey()).append("=").append(entry.getValue());
                }
                toSign.append(apiSecret.trim());

                MessageDigest md = MessageDigest.getInstance("SHA-1");
                byte[] digest = md.digest(toSign.toString().getBytes(StandardCharsets.UTF_8));
                StringBuilder hexSignature = new StringBuilder();
                for (byte b : digest) {
                    hexSignature.append(String.format("%02x", b));
                }

                params.add("timestamp", String.valueOf(timestamp));
                params.add("api_key", apiKey.trim());
                params.add("signature", hexSignature.toString());
                if (StringUtils.hasText(folder)) {
                    params.add("folder", folder.trim());
                }
            } else {
                log.warn("Cloudinary configuration incomplete: provide upload-preset or both api-key and api-secret. Falling back to local data.");
                return base64Data;
            }

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(params, headers);
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(uploadUrl, requestEntity, Map.class);

            if (response != null && response.containsKey("secure_url")) {
                String secureUrl = (String) response.get("secure_url");
                log.info("Uploaded selfie image to Cloudinary successfully: {}", secureUrl);
                return secureUrl;
            }

            log.warn("Cloudinary upload returned unexpected response: {}", response);
            return base64Data;
        } catch (Exception ex) {
            log.error("Failed to upload image to Cloudinary: {}. Using original data as fallback.", ex.getMessage());
            return base64Data;
        }
    }
}

