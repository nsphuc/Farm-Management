# Báo Cáo Kiểm Thử Biên Độ, Dữ Liệu Lỗi & Edge Cases (Đợt B — Boundary & Negative Test Report)

- **Ngày thực hiện**: 2026-11-26
- **Môi trường**: Backend `http://localhost:8080/api/v1`, Frontend `http://localhost:5173`, MySQL `farm_saas_dev` (port `3308`)
- **Phạm vi kiểm thử**:
  - **B1**: Biên độ Kho & FEFO (xuất/cho ăn vượt tồn kho, nhập số lượng âm, điều chuyển trùng kho nguồn/đích).
  - **B2**: Biên độ Chuồng nuôi, Xuất bán, Sổ quỹ & Nhân công (bán vượt sĩ số, `tare > gross`, số âm, báo chết vượt sĩ số, tạm ứng vượt lương).
  - **B3**: Vòng đời Tài khoản & Phiên đăng nhập (sai mật khẩu, JWT lỗi/hết hạn, thu hồi/đổi quyền tức thời).

---

## 1. Tóm tắt Kết quả (5 lỗi phát hiện `BND-01` – `BND-05`)

| Hạng mục | API | Giao diện (Chrome) | Trạng thái | Lỗi phát hiện |
|---|---|---|---|---|
| **B1.1 Cho ăn vượt tồn kho** | `400 INSUFFICIENT_STOCK` | Toast lỗi rõ ràng | **PASS** | — |
| **B1.2 Cho ăn số âm (`-10`)** | **`500 / by zero`** | — | **FAIL** | **`BND-01`** |
| **B1.3/B1.4 Điều chuyển trùng kho / vượt tồn** | `400 INVALID_INPUT_DATA` | — | **PASS** | — |
| **B2.1 Xuất bán vượt sĩ số (`5000 > 88`)** | **`500 Check constraint`** | Lộ SQL Hibernate lên toast | **FAIL** | **`BND-02`** |
| **B2.2 Xuất bán số âm / `tare > gross`** | **`500 Check constraint`** | UI chặn `tare > gross` & `min="0"` | **PARTIAL FAIL** | **`BND-03`** |
| **B2.3 Sổ quỹ số tiền âm (`-500.000`)** | **`500 Check constraint`** | HTML5 `min="1000"` chặn | **PARTIAL FAIL** | **`BND-03`** |
| **B2.4 Tạm ứng âm (`-100.000`) & vượt lương (`999.999.999`)** | **`500`** (âm) / **`200`** (vượt lương!) | UI cho qua `999.999.999` → sinh phiếu chi `-1 tỷ` | **FAIL** | **`BND-04`** |
| **B2.5 Báo chết vượt sĩ số (`9999 > 88`)** | **`201` (Không chặn!)** | — | **FAIL** | **`BND-05`** |
| **B3.1/B3.2/B3.3 Sai mật khẩu / JWT lỗi / Thiếu JWT** | `401 Unauthorized` | Tự chuyển sạch về `/login` | **PASS** | — |
| **B3.4 Đổi chi nhánh tức thời trên JWT cũ** | `403` ngay ở request kế tiếp | — | **PASS** | — |

---

## 2. Chi tiết 5 Lỗi Biên Độ Phát Hiện

### 2.1. `BND-01` [HIGH] — `DailyLogController/Service`: Nhập số lượng cám âm (`-10`) gây `500 / by zero`
- **Tái hiện**: `POST /api/v1/daily-logs` với `entryType = "FEED"`, `feedAmount = -10`, `feedUnit = "KG"`.
- **Thực tế**: Backend trả `500 Internal Server Error` với message `"/ by zero"`.
- **Kỳ vọng**: Phải validate `feedAmount > 0` ngay từ đầu và trả `400 Bad Request` kèm thông báo tiếng Việt rõ ràng.

### 2.2. `BND-02` [HIGH] — `FarmSalesController`: Xuất bán vượt sĩ số đàn (`5000 > 88`) gây `500` & lộ SQL Hibernate
- **Tái hiện**: Trên `/app/sales` hoặc `POST /api/v1/farms/1/sales` nhập `headsSold = 5000` cho lứa `DAN-HEO-26A` (chỉ còn `88 con`).
- **Thực tế**: Frontend không chặn `5000 > 88`; Backend cập nhật `currentQuantity` âm/sai trạng thái khiến MySQL văng `Check constraint 'chk_livestock_groups_status' is violated`, trả `500` và hiển thị nguyên câu SQL Hibernate lên toast UI (`BND-B2-oversell-ui.png`).
- **Kỳ vọng**: Cả Frontend (`SalesPage.jsx`) và Backend (`FarmSalesController`) phải chặn khi `headsSold > currentQuantity` và trả `400` (`"Số con xuất bán (5.000) vượt quá sĩ số hiện có trong chuồng (88 con)"`).

### 2.3. `BND-03` [MEDIUM] — Backend thiếu validation số dương (`> 0`) trên `FarmSalesController`, `CashbookController`, `WorkforceController`
- **Tái hiện**: Gửi API trực tiếp với `unitPricePerKg < 0`, `headsSold <= 0`, `netWeight <= 0`, `cashbook.amount <= 0`, `advance.amount <= 0`.
- **Thực tế**: Backend bỏ qua kiểm tra đầu vào, đẩy thẳng xuống DB làm văng `500 Check constraint 'chk_sales_orders_financials' / 'chk_farm_expenses_amount' is violated`.
- **Kỳ vọng**: Validate rõ ràng ở Backend để trả `400 Bad Request` thân thiện thay vì `500` lỗi DB constraint.

### 2.4. `BND-04` [HIGH] — `WorkforceController` & `WorkforcePage.jsx`: Cho phép Tạm ứng vượt quá lương còn lại (`999.999.999 đ`)
- **Tái hiện**: Mở modal `Tạm ứng` của nhân công (lương còn lại `17.000.000 đ`) nhập `999999999` và bấm xác nhận (`BND-B2-cashbook-workforce-validation.png`).
- **Thực tế**: Cả Frontend và Backend đều cho phép (`200 OK`), tự động sinh phiếu chi `PC-UNG-...` `-999.999.999 đ` trên Sổ quỹ (và khóa không cho xóa trên UI Sổ quỹ).
- **Kỳ vọng**: Chặn tạm ứng khi `amount <= 0` hoặc `amount > remainingSalary` (trừ khi có cấu hình cho phép ứng trước kỳ sau, nhưng tối thiểu phải cảnh báo/chặn vượt tổng lương tháng). *(Đã xóa phiếu test `PC-UNG-1-8321` trong DB sau kiểm thử.)*

### 2.5. `BND-05` [HIGH] — `DailyLogServiceImpl`: Báo chết/loại thải vượt sĩ số đàn (`9999 > 88`) không bị chặn & xóa log không hoàn sĩ số
- **Tái hiện**: `POST /api/v1/daily-logs` với `entryType = "MORTALITY"`, `deadCount = 9999` trên chuồng còn `88 con`.
- **Thực tế**: Backend trả `201 Created`, tự clamp `current_quantity` của lứa nuôi về `0`; khi xóa log test đó, `current_quantity` không tự hoàn trả về `88`. *(Đã khôi phục `current_quantity = 88` trong DB sau kiểm thử.)*
- **Kỳ vọng**: Chặn `deadCount + cullCount > currentQuantity` với `400 Bad Request` (`"Tổng số con chết & loại thải vượt quá sĩ số hiện tại của chuồng"`), và hoàn lại `currentQuantity` khi xóa nhật ký `MORTALITY`.

---

## 3. Ảnh Minh Chứng (`docs/testing/boundary-test/screenshots/`)
- `BND-B1-overstock-feed-ui.png`: Thông báo lỗi rõ ràng `400 INSUFFICIENT_STOCK` khi cho ăn vượt tồn kho (`4.000 bao > 125 bao`).
- `BND-B2-oversell-ui.png`: Bán vượt sĩ số `5.000 > 88` làm văng lỗi `500` kèm câu SQL Hibernate lên toast.
- `BND-B2-cashbook-workforce-validation.png`: Tạm ứng `999.999.999 đ` vượt lương thành công và sinh phiếu chi `-1 tỷ` trên Sổ quỹ.
- `BND-B3-invalid-token-redirect.png`: Token giả mạo/hết hạn tự điều hướng sạch về `/login`.


---

## 4. Kết quả Kiểm thử Hồi quy Sau Khắc phục (`BND-01` – `BND-05` — 2026-11-26)

| Hạng mục | Kết quả | Bằng chứng kiểm chứng thực tế |
|---|---|---|
| **`BND-01` (`FEED -10 kg`)** | **PASS** | `POST /api/v1/daily-logs` trả **`400 INVALID_FEED_AMOUNT`** (`"Số lượng cám cho ăn phải lớn hơn 0"`), không còn `500 / by zero`. |
| **`BND-02` (`Xuất bán 5000 > 88`)** | **PASS** | Frontend (`SalesPage.jsx`) chặn ngay với toast `"Số con xuất bán (5000 con) vượt quá sĩ số hiện có trong chuồng (88 con)"`; Backend trả **`400 HEADS_EXCEED_STOCK`**. (`BND-REG-01`) |
| **`BND-03` (Số âm trên Sales / Cashbook / Workforce)** | **PASS** | Cả 3 API đều trả **`400 INVALID_HEADS_SOLD / INVALID_AMOUNT`** thay vì `500 Check constraint`. |
| **`BND-04` (Tạm ứng vượt lương `999.999.999 đ`)** | **PASS** | Frontend (`WorkforcePage.jsx`) chặn ngay với toast `"Số tiền tạm ứng (999.999.999 ₫) vượt quá lương còn lại (17.000.000 ₫)"`; Backend trả **`400 ADVANCE_EXCEEDS_SALARY`**. (`BND-REG-02`) |
| **`BND-05` (Báo chết `9999 > 88`)** | **PASS** | `POST /api/v1/daily-logs` trả **`400 MORTALITY_EXCEEDS_STOCK`** (`"Tổng số con chết & loại thải (9999 con) vượt quá sĩ số hiện tại của chuồng (88 con)"`). |
