package com.farm.saas.modules.quality.controller;

import com.farm.saas.modules.quality.dto.response.PublicTraceabilityResponse;
import com.farm.saas.modules.quality.service.TraceabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller công khai phục vụ tra cứu thông tin truy xuất nguồn gốc (Public Traceability).
 * Điểm cuối API không yêu cầu xác thực bảo mật, cho phép người tiêu dùng cuối quét mã QR trên bao bì sản phẩm
 * để kiểm tra toàn bộ nhật ký sản xuất, chứng nhận VietGAP, chỉ tiêu KCS và cảnh báo thu hồi nếu có.
 */
@RestController
@RequestMapping("/api/v1/public/traceability")
@RequiredArgsConstructor
public class PublicTraceabilityController {

    private final TraceabilityService traceabilityService;

    /**
     * Tra cứu thông tin truy xuất nguồn gốc công khai dựa trên mã truy xuất (Traceability Code / QR Token).
     * Tự động tăng bộ đếm lượt quét và cập nhật thời gian quét gần nhất của bản chụp.
     *
     * @param traceabilityCode Mã chuỗi duy nhất trên tem QR truy xuất nguồn gốc
     * @return Dữ liệu truy xuất nguồn gốc công khai bao gồm doanh nghiệp, chứng nhận, nhật ký, thu hoạch và KCS
     */
    @GetMapping("/{traceabilityCode}")
    public ResponseEntity<PublicTraceabilityResponse> getPublicTraceability(@PathVariable String traceabilityCode) {
        return ResponseEntity.ok(traceabilityService.getPublicTraceability(traceabilityCode));
    }
}
