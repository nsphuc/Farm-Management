import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind classnames merger
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Fallback representation for null, undefined or empty values
 */
export const NULL_FALLBACK = '—';

/**
 * Format currency in VND (Việt Nam Đồng)
 * Example: 125000000 -> "125.000.000 ₫"
 */
export function formatCurrency(value, fallback = NULL_FALLBACK) {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numeric);
}

/**
 * Format decimal numbers (standard max 2 decimals, conversion factors 4 decimals)
 */
export function formatNumber(value, fractionDigits = 2, fallback = NULL_FALLBACK) {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return fallback;
  }
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value));
}

/**
 * Format conversion factor with 4 decimals
 */
export function formatConversionFactor(value, fallback = NULL_FALLBACK) {
  return formatNumber(value, 4, fallback);
}

/**
 * Format date in DD/MM/YYYY (Timezone: Asia/Ho_Chi_Minh)
 */
export function formatDate(value, fallback = NULL_FALLBACK) {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return fallback;
  }
}

/**
 * Format date and time in DD/MM/YYYY HH:mm (Timezone: Asia/Ho_Chi_Minh)
 */
export function formatDateTime(value, fallback = NULL_FALLBACK) {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return fallback;
  }
}

/**
 * Format time only in HH:mm (Timezone: Asia/Ho_Chi_Minh)
 */
export function formatTime(value, fallback = NULL_FALLBACK) {
  if (!value) return fallback;
  // If string is already HH:mm or HH:mm:ss
  if (typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.substring(0, 5);
  }
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return fallback;
  }
}

const KNOWN_WEIGHT_UNITS = ['TAN', 'TẤN', 'TON', 'KG', 'KILOGRAM', 'CON', 'QUA', 'THUNG', 'BO', 'LIT', 'GOI', 'BAO'];

/**
 * Format weight or yield quantity:
 * - If unit is TAN/TẤN/TON, displays in tấn
 * - If unit is other non-kg unit (CON, QUA, THUNG...), displays formatted number + unit
 * - If unit is KG (or unspecified), formats under 1 ton in kg (e.g. 850 kg), over 1 ton in tấn (e.g. 2.45 tấn)
 */
export function formatWeight(value, unitOrFallback = NULL_FALLBACK, fallback = NULL_FALLBACK) {
  let unit = null;
  let fb = NULL_FALLBACK;

  if (typeof unitOrFallback === 'string') {
    const upper = unitOrFallback.trim().toUpperCase();
    if (KNOWN_WEIGHT_UNITS.includes(upper)) {
      unit = upper;
      fb = fallback;
    } else {
      fb = unitOrFallback;
    }
  }

  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return fb;
  }

  const num = Number(value);

  // If unit is explicitly TAN / TẤN / TON, value is already in tons!
  if (unit === 'TAN' || unit === 'TẤN' || unit === 'TON') {
    return `${formatNumber(num, 2)} tấn`;
  }

  // If unit is a non-weight unit (e.g., CON, QUA, THUNG)
  if (unit && unit !== 'KG' && unit !== 'KILOGRAM') {
    return `${formatNumber(num, 2)} ${unit.toLowerCase()}`;
  }

  // Default weight behavior (value is in KG):
  if (num >= 1000) {
    const ton = num / 1000;
    return `${formatNumber(ton, 2)} tấn`;
  }
  return `${formatNumber(num, 2)} kg`;
}

/**
 * Format area: under 10,000 m2 in m² (e.g. 4.500 m²), over 10,000 m2 in ha (e.g. 3.5 ha)
 */
export function formatArea(valueInM2, fallback = NULL_FALLBACK) {
  if (valueInM2 === null || valueInM2 === undefined || valueInM2 === '' || isNaN(Number(valueInM2))) {
    return fallback;
  }
  const m2 = Number(valueInM2);
  if (m2 >= 10000) {
    const ha = m2 / 10000;
    return `${formatNumber(ha, 2)} ha`;
  }
  return `${formatNumber(m2, 2)} m²`;
}

/**
 * Safe string display - replaces empty/null with em-dash
 */
export function formatText(value, fallback = NULL_FALLBACK) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback;
  }
  return String(value);
}

/**
 * Calculate Haversine distance in meters between two GPS coordinates
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === null || lat1 === undefined ||
    lon1 === null || lon1 === undefined ||
    lat2 === null || lat2 === undefined ||
    lon2 === null || lon2 === undefined
  ) {
    return null;
  }

  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format local date as YYYY-MM-DD avoiding UTC date shifts across midnight
 */
export function formatLocalDate(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Kiểm tra xem ca làm việc (shiftStartTime - shiftEndTime) có bao trọn khung giờ của công việc (taskStartTime - taskEndTime) không.
 * Quy tắc cốt lõi: shiftStartTime <= taskStartTime VÀ shiftEndTime >= taskEndTime
 */
export function isShiftCoveringTask(shiftStartTime, shiftEndTime, taskStartTime, taskEndTime) {
  if (!shiftStartTime || !shiftEndTime || !taskStartTime || !taskEndTime) {
    return false;
  }
  const sStart = String(shiftStartTime).slice(0, 5);
  const sEnd = String(shiftEndTime).slice(0, 5);
  const tStart = String(taskStartTime).slice(0, 5);
  const tEnd = String(taskEndTime).slice(0, 5);

  const isOvernight = sEnd < sStart;
  if (!isOvernight) {
    if (tStart <= tEnd) {
      return sStart <= tStart && sEnd >= tEnd;
    }
    return false;
  } else {
    if (tStart <= tEnd) {
      const inNightBefore = tStart >= sStart;
      const inMorningAfter = tEnd <= sEnd;
      return inNightBefore || inMorningAfter;
    }
    return sStart <= tStart && sEnd >= tEnd;
  }
}

/**
 * Kiểm tra và tính toán trạng thái trễ hạn (Overdue) của một nhiệm vụ nông nghiệp.
 * Trả về { isOverdue: boolean, overdueText: string, overdueMinutes: number }
 */
export function checkTaskOverdue(task) {
  if (!task) return { isOverdue: false, overdueText: '', overdueMinutes: 0 };
  if (task.status === 'DONE' || task.status === 'CANCELLED') {
    return { isOverdue: false, overdueText: '', overdueMinutes: 0 };
  }

  let deadlineDate = null;
  if (task.deadline) {
    deadlineDate = new Date(task.deadline);
  } else if (task.endTime) {
    const timeParts = String(task.endTime).slice(0, 5).split(':');
    deadlineDate = new Date();
    deadlineDate.setHours(Number(timeParts[0]) || 0, Number(timeParts[1]) || 0, 0, 0);
  }

  if (deadlineDate && !isNaN(deadlineDate.getTime())) {
    const now = new Date();
    if (now > deadlineDate) {
      const diffMs = now.getTime() - deadlineDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      const overdueText = hours > 0 ? `Trễ ${hours}h ${mins}p` : `Trễ ${mins} phút`;
      return { isOverdue: true, overdueText, overdueMinutes: diffMins };
    }
  }

  if (task.isOverdue) {
    const mins = task.overdueMinutes || 0;
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    const overdueText = hours > 0 ? `Trễ ${hours}h ${m}p` : `Trễ ${m} phút`;
    return { isOverdue: true, overdueText, overdueMinutes: mins };
  }

  return { isOverdue: false, overdueText: '', overdueMinutes: 0 };
}
