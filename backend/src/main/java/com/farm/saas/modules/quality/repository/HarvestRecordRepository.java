package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.HarvestRecord;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository truy xuất dữ liệu biên bản thu hoạch nông sản và xuất bán vật nuôi.
 */
@Repository
public interface HarvestRecordRepository extends JpaRepository<HarvestRecord, Long>, JpaSpecificationExecutor<HarvestRecord> {

    /**
     * Tìm danh sách các biên bản thu hoạch thuộc trang trại sắp xếp theo ngày thu hoạch và thời gian tạo giảm dần.
     *
     * @param farmId ID trang trại
     * @return Danh sách biên bản thu hoạch
     */
    java.util.List<HarvestRecord> findByFarmIdOrderByHarvestDateDescCreatedAtDesc(Long farmId);

    /**
     * Tìm danh sách phân trang các biên bản thu hoạch của một trang trại.
     *
     * @param farmId   ID trang trại
     * @param pageable Thông tin phân trang
     * @return Trang danh sách biên bản thu hoạch
     */
    org.springframework.data.domain.Page<HarvestRecord> findByFarmId(Long farmId, org.springframework.data.domain.Pageable pageable);

    /**
     * Tìm biên bản thu hoạch theo mã thu hoạch duy nhất trong phạm vi doanh nghiệp và trang trại.
     *
     * @param tenantId    ID khách thuê / doanh nghiệp
     * @param farmId      ID trang trại
     * @param harvestCode Mã định danh biên bản thu hoạch
     * @return Optional chứa biên bản thu hoạch nếu tìm thấy
     */
    java.util.Optional<HarvestRecord> findByTenantIdAndFarmIdAndHarvestCode(Long tenantId, Long farmId, String harvestCode);

    /**
     * Tìm danh sách các biên bản thu hoạch liên quan đến một vụ mùa trồng trọt.
     *
     * @param seasonId ID mùa vụ
     * @return Danh sách biên bản thu hoạch
     */
    java.util.List<HarvestRecord> findBySeasonId(Long seasonId);

    /**
     * Tìm danh sách các biên bản xuất bán/thu hoạch liên quan đến một đàn vật nuôi.
     *
     * @param livestockGroupId ID đàn vật nuôi
     * @return Danh sách biên bản thu hoạch
     */
    java.util.List<HarvestRecord> findByLivestockGroupId(Long livestockGroupId);

    /**
     * Tính tổng sản lượng thu hoạch thực tế lũy kế của một vụ mùa trồng trọt.
     *
     * @param seasonId ID mùa vụ
     * @return Tổng sản lượng đã thu hoạch (trả về 0 nếu chưa có thu hoạch)
     */
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(hr.quantity), 0) FROM HarvestRecord hr WHERE hr.seasonId = :seasonId")
    BigDecimal sumQuantityBySeasonId(@org.springframework.data.repository.query.Param("seasonId") Long seasonId);

    /**
     * Tính tổng sản lượng xuất bán/thu hoạch lũy kế của một đàn vật nuôi.
     *
     * @param groupId ID đàn vật nuôi
     * @return Tổng sản lượng đã xuất bán (trả về 0 nếu chưa có)
     */
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(hr.quantity), 0) FROM HarvestRecord hr WHERE hr.livestockGroupId = :groupId")
    BigDecimal sumQuantityByLivestockGroupId(@org.springframework.data.repository.query.Param("groupId") Long groupId);

    /**
     * Tính tổng sản lượng thu hoạch của toàn bộ trang trại.
     *
     * @param farmId ID trang trại
     * @return Tổng sản lượng thu hoạch toàn trang trại
     */
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(hr.quantity), 0) FROM HarvestRecord hr WHERE hr.farmId = :farmId")
    BigDecimal sumQuantityByFarmId(@org.springframework.data.repository.query.Param("farmId") Long farmId);
}
