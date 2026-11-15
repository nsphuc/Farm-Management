import * as XLSX from 'xlsx';

/**
 * Tiện ích xuất dữ liệu ra file Excel (.xlsx) chuẩn Microsoft Excel
 * - Tự động tính toán độ rộng các cột (Auto-Fit Column Widths) cho vừa chữ
 * - Hỗ trợ đầy đủ tiếng Việt có dấu, định dạng số, ngày tháng, tiền tệ
 */
export function exportToExcel(filename, headers, rows) {
  if (!rows || rows.length === 0) {
    alert('Không có dữ liệu để xuất file.');
    return;
  }

  // 1. Dòng Tiêu đề (Header)
  const headerLabels = headers.map((h) => h.label || h.header || h);

  // 2. Dữ liệu các dòng
  const dataRows = rows.map((row) => {
    return headers.map((h) => {
      const key = typeof h === 'object' ? (h.key || h.accessor) : h;
      const val = typeof h.formatter === 'function' ? h.formatter(row[key], row) : row[key];
      return val === null || val === undefined ? '' : String(val);
    });
  });

  const fullSheetData = [headerLabels, ...dataRows];

  // 3. Tạo Worksheet
  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

  // 4. Tự động tính toán độ rộng các cột (Auto-fit Width)
  const colWidths = headerLabels.map((headerText, colIndex) => {
    let maxLength = String(headerText || '').length;

    dataRows.forEach((row) => {
      const cellText = String(row[colIndex] || '');
      if (cellText.length > maxLength) {
        maxLength = cellText.length;
      }
    });

    // Cộng thêm khoảng trống đệm (padding: 4 ký tự) và giới hạn an toàn tối thiểu 14, tối đa 60
    return { wch: Math.min(60, Math.max(14, maxLength + 4)) };
  });

  ws['!cols'] = colWidths;

  // 5. Tạo Workbook và xuất file .xlsx
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo Cáo Nông Trại');

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const baseName = filename.replace(/\.(csv|xlsx|xls)$/i, '');
  const cleanFilename = `${baseName}_${today}.xlsx`;

  XLSX.writeFile(wb, cleanFilename);
}

/**
 * Tự động chuyển hướng exportToCsv sang file Excel .xlsx có auto-fit cột
 */
export function exportToCsv(filename, headers, rows) {
  exportToExcel(filename, headers, rows);
}

/**
 * Mở hộp thoại in báo cáo
 */
export function printReport(title) {
  if (title) {
    document.title = title;
  }
  window.print();
}

