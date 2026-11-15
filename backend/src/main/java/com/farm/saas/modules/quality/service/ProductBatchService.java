package com.farm.saas.modules.quality.service;

import com.farm.saas.modules.quality.dto.request.*;
import com.farm.saas.modules.quality.dto.response.ProductBatchDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Giao diện dịch vụ nghiệp vụ quản lý lô sản phẩm thành phẩm (Product Batch).
 */
public interface ProductBatchService {

    /**
     * Tạo mới một lô thành phẩm từ các nguồn thu hoạch hoặc vụ mùa/đàn nuôi tương ứng.
     *
     * @param farmId  ID trang trại thực hiện đóng lô
     * @param request Dữ liệu yêu cầu tạo lô sản phẩm
     * @return Chi tiết lô sản phẩm vừa tạo
     */
    ProductBatchDetailResponse createProductBatch(Long farmId, CreateProductBatchRequest request);

    /**
     * Lấy danh sách phân trang các lô thành phẩm của một trang trại.
     *
     * @param farmId   ID trang trại
     * @param pageable Thông tin phân trang
     * @return Trang danh sách lô sản phẩm
     */
    Page<ProductBatchDetailResponse> getProductBatches(Long farmId, Pageable pageable);

    /**
     * Lấy danh sách phân trang các lô thành phẩm có bộ lọc trạng thái và từ khóa tìm kiếm.
     *
     * @param farmId   ID trang trại
     * @param status   Trạng thái lô cần lọc
     * @param keyword  Từ khóa tìm kiếm
     * @param pageable Thông tin phân trang
     * @return Trang danh sách lô sản phẩm
     */
    Page<ProductBatchDetailResponse> getProductBatches(Long farmId, String status, String keyword, Pageable pageable);

    /**
     * Lấy chi tiết thông tin một lô sản phẩm theo ID.
     *
     * @param farmId ID trang trại
     * @param id     ID lô sản phẩm
     * @return Chi tiết lô sản phẩm
     */
    ProductBatchDetailResponse getProductBatchById(Long farmId, Long id);

    /**
     * Phê duyệt chất lượng KCS cho lô thành phẩm và khởi tạo bản chụp truy xuất nguồn gốc.
     *
     * @param farmId  ID trang trại
     * @param id      ID lô sản phẩm
     * @param request Thông tin phê duyệt
     * @return Chi tiết lô sản phẩm sau khi phê duyệt
     */
    ProductBatchDetailResponse approveBatch(Long farmId, Long id, ApproveProductBatchRequest request);

    /**
     * Từ chối phê duyệt chất lượng lô sản phẩm khi không đạt KCS.
     *
     * @param farmId  ID trang trại
     * @param id      ID lô sản phẩm
     * @param request Lý do từ chối
     * @return Chi tiết lô sản phẩm sau khi từ chối
     */
    ProductBatchDetailResponse rejectBatch(Long farmId, Long id, RejectProductBatchRequest request);

    /**
     * Thu hồi khẩn cấp lô sản phẩm thành phẩm do vi phạm tiêu chuẩn hoặc sự cố an toàn.
     *
     * @param farmId  ID trang trại
     * @param id      ID lô sản phẩm
     * @param request Lý do và nội dung thu hồi
     * @return Chi tiết lô sản phẩm sau khi thu hồi
     */
    ProductBatchDetailResponse recallBatch(Long farmId, Long id, RecallProductBatchRequest request);

    /**
     * Ghi nhận lịch sử in tem nhãn QR truy xuất nguồn gốc cho lô sản phẩm.
     *
     * @param farmId  ID trang trại
     * @param id      ID lô sản phẩm
     * @param request Số lượng và kích thước tem in
     * @return Chi tiết lô sản phẩm sau khi ghi nhận in tem
     */
    ProductBatchDetailResponse printLabel(Long farmId, Long id, PrintLabelRequest request);
}
