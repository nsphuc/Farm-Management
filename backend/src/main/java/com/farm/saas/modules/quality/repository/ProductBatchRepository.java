package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.ProductBatch;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository truy xuất và thao tác dữ liệu lô sản phẩm thành phẩm (ProductBatch).
 */
@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long>, JpaSpecificationExecutor<ProductBatch> {

    /**
     * Tìm lô sản phẩm theo ID kèm khóa bi quan (Pessimistic Write Lock)
     * để chống tranh chấp đồng thời khi phê duyệt, từ chối hoặc thu hồi lô hàng.
     *
     * @param id ID của lô sản phẩm
     * @return Optional chứa lô sản phẩm có khóa chống tranh chấp
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM ProductBatch e WHERE e.id = :id")
    Optional<ProductBatch> findByIdForUpdate(@Param("id") Long id);

    /**
     * Tìm lô sản phẩm theo mã chuỗi tem QR truy xuất nguồn gốc.
     *
     * @param traceabilityCode Mã chuỗi truy xuất nguồn gốc công khai
     * @return Optional chứa lô sản phẩm nếu tìm thấy
     */
    Optional<ProductBatch> findByTraceabilityCode(String traceabilityCode);

    /**
     * Tìm lô sản phẩm theo mã lô trong phạm vi doanh nghiệp và trang trại.
     *
     * @param tenantId  ID khách thuê / doanh nghiệp
     * @param farmId    ID trang trại
     * @param batchCode Mã hiệu lô sản phẩm
     * @return Optional chứa lô sản phẩm nếu tìm thấy
     */
    Optional<ProductBatch> findByTenantIdAndFarmIdAndBatchCode(Long tenantId, Long farmId, String batchCode);

    /**
     * Lấy danh sách toàn bộ các lô sản phẩm của trang trại sắp xếp theo thời gian tạo mới nhất.
     *
     * @param farmId ID trang trại
     * @return Danh sách các lô sản phẩm
     */
    java.util.List<ProductBatch> findByFarmIdOrderByCreatedAtDesc(Long farmId);

    /**
     * Lấy danh sách phân trang các lô sản phẩm của một trang trại.
     *
     * @param farmId   ID trang trại
     * @param pageable Thông tin phân trang
     * @return Trang danh sách các lô sản phẩm
     */
    org.springframework.data.domain.Page<ProductBatch> findByFarmId(Long farmId, org.springframework.data.domain.Pageable pageable);
}
