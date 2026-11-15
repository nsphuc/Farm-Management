/**
 * Bảng quy đổi đơn vị đo lường chuẩn nông nghiệp (Agri-ERP Unit Converter)
 * Hỗ trợ quy đổi khối lượng (Mass), thể tích (Volume), và Từ điển từ đồng nghĩa (Unit Synonyms)
 * giữa danh mục vật tư và sức chứa của kệ kho.
 */

const MASS_FACTORS = {
  'tấn': 1000,
  'tan': 1000,
  'ton': 1000,
  'tons': 1000,
  'tạ': 100,
  'ta': 100,
  'yến': 10,
  'yen': 10,
  'kg': 1,
  'kilo': 1,
  'kilogram': 1,
  'kilograms': 1,
  'g': 0.001,
  'gram': 0.001,
  'gam': 0.001,
  'mg': 0.000001,
};

const VOLUME_FACTORS = {
  'm3': 1000,
  'm³': 1000,
  'khoi': 1000,
  'khối': 1000,
  'l': 1,
  'lit': 1,
  'lít': 1,
  'liter': 1,
  'litre': 1,
  'ml': 0.001,
};

/**
 * Từ điển từ đồng nghĩa ánh xạ đơn vị tiếng Anh - Việt & biến thể trong nông nghiệp
 */
const UNIT_SYNONYMS = {
  // Gói / Túi / Bịch / Bao / Bag / Pouch / Packet
  'bag': 'BAG',
  'bags': 'BAG',
  'goi': 'BAG',
  'gói': 'BAG',
  'bich': 'BAG',
  'bịch': 'BAG',
  'tui': 'BAG',
  'túi': 'BAG',
  'bao': 'BAG',
  'packet': 'BAG',
  'pouch': 'BAG',
  'pack': 'BAG',
  'sacks': 'BAG',
  'sack': 'BAG',

  // Cây / Gốc / Bầu / Cái / Chiếc / Pcs / Piece / Unit
  'piece': 'PIECE',
  'pieces': 'PIECE',
  'pcs': 'PIECE',
  'cai': 'PIECE',
  'cái': 'PIECE',
  'chiec': 'PIECE',
  'chiếc': 'PIECE',
  'cay': 'PIECE',
  'cây': 'PIECE',
  'goc': 'PIECE',
  'gốc': 'PIECE',
  'bau': 'PIECE',
  'bầu': 'PIECE',
  'chau': 'PIECE',
  'chậu': 'PIECE',
  'donvi': 'PIECE',
  'đơnvị': 'PIECE',
  'unit': 'PIECE',
  'units': 'PIECE',
  'cây/gốc': 'PIECE',
  'cay/goc': 'PIECE',
  'cái/chiếc': 'PIECE',
  'cai/chiec': 'PIECE',

  // Thùng / Kiện / Hộp / Carton / Box
  'thung': 'BOX',
  'thùng': 'BOX',
  'kien': 'BOX',
  'kiện': 'BOX',
  'hop': 'BOX',
  'hộp': 'BOX',
  'carton': 'BOX',
  'box': 'BOX',
  'boxes': 'BOX',
  'case': 'BOX',
  'cases': 'BOX',
  'kiện/thùng': 'BOX',
  'kien/thung': 'BOX',

  // Chai / Lọ / Bình / Hũ / Can / Bottle / Vial / Jar
  'chai': 'BOTTLE',
  'lo': 'BOTTLE',
  'lọ': 'BOTTLE',
  'binh': 'BOTTLE',
  'bình': 'BOTTLE',
  'hu': 'BOTTLE',
  'hũ': 'BOTTLE',
  'bottle': 'BOTTLE',
  'bottles': 'BOTTLE',
  'vial': 'BOTTLE',
  'vials': 'BOTTLE',
  'jar': 'BOTTLE',
  'jars': 'BOTTLE',
  'can': 'BOTTLE',

  // Con / Đầu con / Head / Animal
  'con': 'ANIMAL',
  'head': 'ANIMAL',
  'heads': 'ANIMAL',
  'animal': 'ANIMAL',
  'animals': 'ANIMAL',

  // Pallet
  'pallet': 'PALLET',
  'pallets': 'PALLET',

  // Cuộn / Roll
  'cuon': 'ROLL',
  'cuộn': 'ROLL',
  'roll': 'ROLL',
  'rolls': 'ROLL',

  // Liều / Dose
  'lieu': 'DOSE',
  'liều': 'DOSE',
  'dose': 'DOSE',
  'doses': 'DOSE',

  // Máy / Thiết bị / Machine
  'may': 'MACHINE',
  'máy': 'MACHINE',
  'thietbi': 'MACHINE',
  'thiếtbị': 'MACHINE',
  'machine': 'MACHINE',
};

export function normalizeUnit(unit) {
  if (!unit || typeof unit !== 'string') return '';
  return unit.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function getCanonicalUnit(unit) {
  const norm = normalizeUnit(unit);
  return UNIT_SYNONYMS[norm] || norm;
}

/**
 * Quy đổi số lượng của một dòng vật tư sang đơn vị sức chứa của kệ kho.
 * @param {Object} item Dòng vật tư (chứa standardUnit, enteredUnit, quantity, enteredQuantity, conversions)
 * @param {string} capacityUnit Đơn vị tính sức chứa của kệ (vd: 'tấn', 'kg', 'gói', 'thùng', 'cây')
 * @returns {number|null} Số lượng sau quy đổi, hoặc null nếu không thể quy đổi (khác hệ đơn vị)
 */
export function convertQuantityToCapacityUnit(item, capacityUnit) {
  if (!item || !capacityUnit) return null;

  const rawQty = Number(item.quantity) || Number(item.enteredQuantity) || 0;
  if (rawQty <= 0) return 0;

  const capNorm = normalizeUnit(capacityUnit);
  const stdNorm = normalizeUnit(item.standardUnit);
  const entNorm = normalizeUnit(item.enteredUnit);

  const capCanon = getCanonicalUnit(capacityUnit);
  const stdCanon = getCanonicalUnit(item.standardUnit);
  const entCanon = getCanonicalUnit(item.enteredUnit);

  // 1. Trùng khớp trực tiếp hoặc thông qua Từ điển từ đồng nghĩa với enteredUnit (vd: kệ 'gói', nhập 'BAG')
  if (entNorm && (entNorm === capNorm || entCanon === capCanon)) {
    return Number(item.enteredQuantity) || rawQty;
  }

  // 2. Trùng khớp trực tiếp hoặc thông qua Từ điển từ đồng nghĩa với standardUnit (vd: kệ 'cây', vật tư 'PIECE')
  if (stdNorm && (stdNorm === capNorm || stdCanon === capCanon)) {
    return rawQty;
  }

  // 3. Quy đổi thông qua bảng định mức đóng gói của vật tư (item.conversions)
  // Ví dụ: Bắp ngô standardUnit = KG, nhưng có conversion 1 Gói = 1 KG, kệ tính theo 'gói'
  const conversions = Array.isArray(item.conversions) ? item.conversions : [];
  for (const conv of conversions) {
    const convUnit = conv.unitName || conv.packagingUnit;
    const convNorm = normalizeUnit(convUnit);
    const convCanon = getCanonicalUnit(convUnit);
    const factor = Number(conv.conversionFactor) || 1;

    if (convNorm === capNorm || convCanon === capCanon) {
      if (factor > 0) {
        return rawQty / factor;
      }
    }
  }

  // 4. Quy đổi theo hệ Khối Lượng (Mass)
  const capMass = MASS_FACTORS[capNorm];
  const stdMass = MASS_FACTORS[stdNorm];
  const entMass = MASS_FACTORS[entNorm];

  if (capMass) {
    if (stdMass) {
      const totalKg = rawQty * stdMass;
      return totalKg / capMass;
    }
    if (entMass && item.enteredQuantity) {
      const totalKg = Number(item.enteredQuantity) * entMass;
      return totalKg / capMass;
    }
  }

  // 5. Quy đổi theo hệ Thể Tích (Volume)
  const capVol = VOLUME_FACTORS[capNorm];
  const stdVol = VOLUME_FACTORS[stdNorm];
  const entVol = VOLUME_FACTORS[entNorm];

  if (capVol) {
    if (stdVol) {
      const totalLiter = rawQty * stdVol;
      return totalLiter / capVol;
    }
    if (entVol && item.enteredQuantity) {
      const totalLiter = Number(item.enteredQuantity) * entVol;
      return totalLiter / capVol;
    }
  }

  // 6. Quy đổi liên hệ Chất Lỏng Nông Nghiệp: 1 Lít = 1 KG (1 m3 = 1 tấn)
  if (capMass) {
    if (stdVol) {
      const totalKg = rawQty * stdVol;
      return totalKg / capMass;
    }
    if (entVol && item.enteredQuantity) {
      const totalKg = Number(item.enteredQuantity) * entVol;
      return totalKg / capMass;
    }
  }

  if (capVol) {
    if (stdMass) {
      const totalLiter = rawQty * stdMass;
      return totalLiter / capVol;
    }
    if (entMass && item.enteredQuantity) {
      const totalLiter = Number(item.enteredQuantity) * entMass;
      return totalLiter / capVol;
    }
  }

  // 7. Nếu không thể quy đổi an toàn, trả về null để tránh so sánh sai lệch
  return null;
}
