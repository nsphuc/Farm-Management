package com.farm.saas.common.controller;

import com.farm.saas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system")
@Tag(name = "System Info", description = "Endpoints cung cấp thông tin hệ thống và trạng thái kết nối")
public class SystemInfoController {

    @GetMapping("/info")
    @Operation(summary = "Lấy thông tin hệ thống Farm SaaS", description = "Trả về trạng thái hoạt động, phiên bản và thời gian hệ thống")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemInfo() {
        Map<String, Object> info = Map.of(
                "application", "farm-saas-backend",
                "version", "0.0.1-SNAPSHOT",
                "status", "RUNNING",
                "database", "CONNECTED (MySQL 8)",
                "schemaVersion", "1.0",
                "timestamp", Instant.now().toString()
        );
        return ResponseEntity.ok(ApiResponse.success("Hệ thống Farm SaaS đang hoạt động bình thường", info));
    }
}
