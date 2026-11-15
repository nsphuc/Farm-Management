const fs = require('fs');
const path = require('path');

const UI_DIAGRAMS = {
  ui_public_trace: {
    caption: 'Hình 3.1: Giao diện Cổng Tra cứu Nguồn gốc Nông sản Công khai (/trace/:code)',
    code: `flowchart TD
    subgraph BrowserMobile["📱 MÀN HÌNH ĐIỆN THOẠI NGƯỜI TIÊU DÙNG (CỔNG CÔNG KHAI)"]
        direction TB
        subgraph TopBanner["1. Banner và Chứng nhận Nông sản"]
            Img["🖼️ Ảnh nông sản: Dưa Lưới Hoàng Kim VietGAP"]
            Badge["🏅 Chứng nhận VietGAP số 123/2026/NN-HCM"]
        end
        subgraph FarmInfo["2. Cơ sở Sản xuất"]
            FarmName["🏡 Nông trại Hữu cơ GreenFarm - Củ Chi, TP.HCM"]
            Hotline["📞 Hotline: 0909.123.456 | Email: contact@greenfarm.vn"]
        end
        subgraph BatchInfo["3. Chi tiết Lô Hàng Thu Hoạch"]
            Code["🏷️ Mã lô: BATCH-2026-DL01 | Khối lượng: 500 kg"]
            Date["📅 Ngày hái: 15/05/2026 | Hạn dùng: 30/05/2026"]
        end
        subgraph Timeline["4. Dòng Thời Gian Từ Nông Trại Đến Bàn Ăn (Farm-to-Fork)"]
            direction TB
            T1["🌱 01/03/2026: Gieo hạt giống F1 thuần chủng"] --> T2["💧 15/03/2026: Bón phân hữu cơ vi sinh đợt 1"]
            T2 --> T3["🛡️ 20/04/2026: Phun chế phẩm sinh học - Đếm ngược cách ly PHI 21 ngày"]
            T3 --> T4["✂️ 15/05/2026: KCS kiểm nghiệm độ ngọt 14.5 Brix và Thu hoạch"]
        end
        subgraph ShareBtn["5. Tương tác Người Tiêu Dùng"]
            BtnShare["🔗 Nút: Chia sẻ cho Bạn bè và Người thân"]
        end
    end`
  },
  ui_daily_ops: {
    caption: 'Hình 3.2: Giao diện Bàn làm việc Tác nghiệp và Chấm công Hiện trường (Workspace G)',
    code: `flowchart TD
    subgraph ScreenDaily["📱 GIAO DIỆN TÁC NGHIỆP HIỆN TRƯỜNG VÀ CHẤM CÔNG (/app/my-dashboard)"]
        direction TB
        subgraph Block1["Khối 1: Thẻ Chấm Công 1 Chạm (One-tap Timekeeping)"]
            GPS["📍 GPS: Trong nông trường (Cách tâm trại 45m - HỢP LỆ)"]
            Cam["📸 Camera: Đã nhận diện khuôn mặt công nhân"]
            BtnCheck["🟢 NÚT BẤM 1 CHẠM: VÀO CA LÀM VIỆC (07:30)"]
        end
        subgraph Block2["Khối 2: Công Việc Hôm Nay Của Tôi (Worker Tasks)"]
            direction TB
            Task1["1. [ ] Bón phân thúc lần 2 - Luống Dưa lưới số 03 (Ưu tiên: Gấp)"]
            BtnDo1["👉 Bắt đầu làm  |  ✅ Báo cáo xong và Chụp ảnh minh chứng"]
            Task2["2. [ ] Kiểm tra hệ thống tưới nhỏ giọt Nhà kính B (Ưu tiên: Bình thường)"]
        end
        subgraph Block3["Khối 3: Bảng Điểm Danh Tổ Nhóm và Ca Kíp"]
            RollCall["👥 Điểm danh nhanh 8 công nhân thời vụ | Lịch ca: Ca Sáng"]
            Leave["📝 Đơn xin nghỉ phép   |   ⏰ Đề xuất làm thêm giờ OT"]
        end
    end`
  },
  ui_farming_ops: {
    caption: 'Hình 3.3: Giao diện Bàn làm việc Vận hành Canh tác và Chăn nuôi (Workspace E)',
    code: `flowchart TD
    subgraph ScreenFarm["🖥️ GIAO DIỆN VẬN HÀNH CANH TÁC VÀ CHĂN NUÔI (/app/farming)"]
        direction TB
        subgraph HeaderOps["Thanh Điều Hướng Lĩnh Vực"]
            Switch["🔄 Nút Chuyển đổi: 🌿 TRỒNG TRỌT (CROP)  |  🐖 CHĂN NUÔI (LIVESTOCK)"]
            BtnNew["➕ Nút: Mở Mùa Vụ Mới / Nhập Đàn Mới"]
        end
        subgraph Tabs["Các Tab Quản Trị"]
            direction LR
            Tab1["Tab 1: Việc Cố Định và Thu Hoạch"]
            Tab2["Tab 2: Nhật Ký Phân Thuốc FEFO"]
            Tab3["Tab 3: Cách Ly PHI và Tăng Trọng ADG"]
        end
        subgraph ContentArea["Bảng Theo Dõi Mùa Vụ Thời Gian Thực"]
            Card1["🌿 Vụ Dưa Lưới Hoàng Kim số 01 - Nhà kính A1 (Ngày thứ 45/75)"]
            Bar1["📊 Tiến độ sinh trưởng: 60% | Dự kiến thu hoạch: 2.500 kg"]
            Card2["🐖 Đàn Heo Rừng Lai số 03 - Dãy chuồng C2 (Số lượng: 50 con)"]
            Bar2["📈 Tăng trọng bình quân ADG: 0.65 kg/ngày | Đã tiêm phòng: 100%"]
        end
    end`
  },
  ui_inventory: {
    caption: 'Hình 3.4: Giao diện Bàn làm việc Giám sát Kho bãi và Mã vạch (Workspace C)',
    code: `flowchart TD
    subgraph ScreenInv["🖥️ GIAO DIỆN QUẢN LÝ KHO BÃI VÀ THẺ KHO THỜI GIAN THỰC (/app/inventory)"]
        direction TB
        subgraph KPI_Cards["4 Thẻ Chỉ Số Tài Chính Kho"]
            direction LR
            KPI1["💰 TỔNG GIÁ TRỊ TỒN KHO: 850.000.000 đ"]
            KPI2["📥 CHI MUA VẬT TƯ THÁNG: 120.000.000 đ"]
            KPI3["⚠️ CẬN DATE 15 NGÀY: 3 Mặt hàng"]
            KPI4["🔴 TỒN DƯỚI AN TOÀN: 2 Mặt hàng"]
        end
        subgraph NavTabs["5 Tab Chứng Từ Vận Hành"]
            direction LR
            T_Stock["1. Tồn Kho Thực Tế"]
            T_Receipt["2. Phiếu Nhập Kho"]
            T_Issue["3. Phiếu Xuất Kho"]
            T_Trans["4. Chuyển Kho"]
            T_Take["5. Kiểm Kê"]
        end
        subgraph TableArea["Bảng Dữ Liệu Tồn Kho Chi Tiết"]
            R1["📦 Phân NPK Đầu Trâu 20-20-15 | Kho A | Tồn: 150 bao | Hạn dùng: 2027"]
            R2["📦 Hạt giống Dưa lưới F1 | Kho Lạnh | Tồn: 20 gói | Hạn dùng: 10/2026 (Ưu tiên FEFO)"]
            Btns["📝 Lập Phiếu Xuất Kho   |   📥 Lập Phiếu Nhập Hàng   |   📄 Xem Thẻ Kho"]
        end
    end`
  },
  ui_qa_kanban: {
    caption: 'Hình 3.5: Giao diện Đường ống Kiểm định QA và Tem nhãn QR (Workspace F)',
    code: `flowchart LR
    subgraph ScreenQA["🖥️ BẢNG KANBAN 4 LÀN KIỂM ĐỊNH CHẤT LƯỢNG NÔNG SẢN (/app/qa-traceability)"]
        direction LR
        subgraph Lane1["1. CHỜ DUYỆT KCS (2 lô)"]
            L1_Card1["📦 Lô Dưa Lưới BATCH-01<br>- Khối lượng: 500 kg<br>- Đo độ ngọt Brix"]
            L1_Card2["📦 Lô Cà Chua BATCH-02<br>- Khối lượng: 300 kg<br>- Lấy mẫu thử"]
        end
        subgraph Lane2["2. ĐẠT CHUẨN LƯU HÀNH (5 lô)"]
            L2_Card1["✅ Lô Dâu Tây Đà Lạt<br>- Đạt chuẩn VietGAP<br>- In Tem Mã QR"]
            L2_Card2["✅ Lô Dưa Leo Baby<br>- Đã xuất siêu thị<br>- Tra cứu QR"]
        end
        subgraph Lane3["3. BỊ ĐÁNH TRƯỢT (1 lô)"]
            L3_Card1["❌ Lô Cải Ngọt số 05<br>- Lý do: Sâu bệnh lá<br>- Chuyển ủ phân sinh học"]
        end
        subgraph Lane4["4. THU HỒI KHẨN CẤP (0 lô)"]
            L4_Card["🛡️ Không có lô vi phạm<br>- Nút Thu Hồi Khẩn Cấp"]
        end
    end`
  },
  ui_cost_accounting: {
    caption: 'Hình 3.6: Giao diện Quản trị Giá thành và Chi phí Sản xuất (Workspace H1)',
    code: `flowchart TD
    subgraph ScreenCost["🖥️ BẢNG PHÂN TÍCH GIÁ THÀNH ĐƠN VỊ VÀ NGÂN SÁCH (/app/cost-accounting)"]
        direction TB
        subgraph CostKPI["Thống Kê Tổng Chi Phí Mùa Vụ"]
            direction LR
            C_Total["💵 TỔNG CHI PHÍ: 150.000.000 đ"]
            C_Harvest["⚖️ SẢN LƯỢNG: 10.000 kg"]
            C_UnitCost["🎯 GIÁ THÀNH ĐƠN VỊ: 15.000 đ/kg"]
        end
        subgraph Cost5P["5 Nhóm Chi Phí Cấu Thành Giá Thành"]
            direction LR
            P1["1. Hạt giống: 15%"]
            P2["2. Phân bón, vật tư: 40%"]
            P3["3. Nhân công: 25%"]
            P4["4. Thuốc BVTV: 10%"]
            P5["5. Chi phí chung: 10%"]
        end
        subgraph BudgetCompare["Bảng Giám Sát Ngân Sách Các Trại"]
            B1["🏡 Trại Củ Chi: Đã chi 85tr / Trần ngân sách 100tr (85% - Bình thường)"]
            B2["🏡 Trại Đà Lạt: Đã chi 95tr / Trần ngân sách 100tr (95% - Cảnh báo vượt trần)"]
        end
    end`
  },
  ui_sales_cashflow: {
    caption: 'Hình 3.7: Giao diện Quản trị Bán hàng và Dòng tiền VietQR (Workspace H2)',
    code: `flowchart TD
    subgraph ScreenSales["🖥️ BÀN LÀM VIỆC BÁN HÀNG VÀ DÒNG TIỀN VIETQR (/app/sales-cashflow)"]
        direction TB
        subgraph SalesNav["Thanh Chức Năng Bán Hàng và Dòng Tiền"]
            direction LR
            TabOrd["1. Đơn Bán Sỉ"]
            TabDel["2. Đợt Giao Hàng"]
            TabPay["3. Thanh Toán VietQR"]
            TabDebt["4. Sổ Nợ Khách Hàng"]
            TabSet["5. Kết Toán Chu Kỳ"]
        end
        subgraph OrderDetail["Chi Tiết Đơn Hàng và Mã Quét VietQR"]
            Info["🛒 Đơn Hàng: ORD-2026-0089 - Khách hàng: Siêu thị VinMart | Tổng tiền: 45.000.000 đ"]
            QR_Box["📱 MÃ VIETQR TỰ ĐỘNG CHUẨN NAPAS247: MB Bank - STK: 0909123456 - Quét là thanh toán"]
        end
        subgraph DebtMonitor["Sổ Cái Giám Sát Công Nợ Hai Chiều"]
            D1["Siêu thị BigC: Nợ 30.000.000 đ (Hạn trả: 25/05/2026) | Nút: Nhắc nợ"]
            D2["Cửa hàng Xanh: Nợ 12.000.000 đ | Nút: Cấn trừ công nợ"]
        end
    end`
  },
  ui_geography: {
    caption: 'Hình 3.8: Giao diện Quản trị Mặt bằng Địa lý và Cây Phân khu (Workspace A)',
    code: `flowchart TD
    subgraph ScreenGeo["🖥️ QUẢN TRỊ BẢN ĐỒ MẶT BẰNG VÀ PHÂN CÔNG KHU VỰC (/app/geography)"]
        direction TB
        subgraph GeoTree["Cây Phân Cấp Địa Lý Trực Quan"]
            Farm["🏡 Nông Trại GreenFarm (15 Hecta)"]
            Farm --> Z1["🌿 Khu Trồng Trọt A (Nhà Màng Công Nghệ Cao)"]
            Farm --> Z2["🐖 Khu Chăn Nuôi B (Chuồng Trại Khép Kín)"]
            Farm --> Z3["🏢 Khu Kho Vận và Đóng Gói C"]
            Z1 --> L1["Nhà màng A1 (Luống 1 đến 10)"]
            Z1 --> L2["Nhà màng A2 (Luống 11 đến 20)"]
            Z2 --> L3["Dãy Chuồng Heo C1 (Ô 1 đến 8)"]
        end
        subgraph GeoAssign["Phân Công Quản Lý Khu Vực (Zone Managers)"]
            Assign1["👤 Kỹ sư Trần Văn B: Phụ trách toàn diện Khu Trồng Trọt A"]
            Assign2["👤 Bác sĩ Thú y Lê Thị C: Phụ trách toàn diện Khu Chăn Nuôi B"]
        end
    end`
  }
};

async function downloadUIs() {
  const cacheDir = path.resolve(__dirname, 'diagrams_cache');
  for (const k of Object.keys(UI_DIAGRAMS)) {
    const pngPath = path.join(cacheDir, k + '.png');
    if (fs.existsSync(pngPath)) {
      console.log('Cached UI:', k);
      continue;
    }
    const dia = UI_DIAGRAMS[k];
    try {
      const res = await fetch('https://kroki.io/mermaid/png', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: dia.code
      });
      if (res.status !== 200) {
        console.error('Failed to render UI:', k, res.status);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(pngPath, buf);
      console.log('Downloaded UI:', k, 'size:', buf.length);
    } catch (e) {
      console.error('Error fetching UI:', k, e.message);
    }
  }
}

if (require.main === module) {
  downloadUIs();
}

module.exports = { UI_DIAGRAMS };

