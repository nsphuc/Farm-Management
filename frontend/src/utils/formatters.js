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

/**
 * Format weight: under 1 ton in kg (e.g. 850.50 kg), over 1 ton in tấn (e.g. 2.45 tấn)
 */
export function formatWeight(valueInKg, fallback = NULL_FALLBACK) {
  if (valueInKg === null || valueInKg === undefined || valueInKg === '' || isNaN(Number(valueInKg))) {
    return fallback;
  }
  const kg = Number(valueInKg);
  if (kg >= 1000) {
    const ton = kg / 1000;
    return `${formatNumber(ton, 2)} tấn`;
  }
  return `${formatNumber(kg, 2)} kg`;
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
