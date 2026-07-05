const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = {
  mon: 'Senin', tue: 'Selasa', wed: 'Rabu', thu: 'Kamis',
  fri: 'Jumat', sat: 'Sabtu', sun: 'Minggu',
};

export function getDayLabel(key) {
  return DAY_LABELS[key] || key;
}

export const ORDERED_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * Menghitung apakah toko sedang buka SEKARANG berdasarkan jadwal mingguan,
 * memakai waktu WIB (Asia/Jakarta), lepas dari timezone perangkat pengguna.
 */
export function isWithinOperatingHours(operatingHours, now = new Date()) {
  if (!operatingHours) return null; // tidak ada jadwal -> tidak bisa dihitung

  const wibString = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour12: false });
  const wibDate = new Date(wibString);
  const dayKey = DAY_KEYS[wibDate.getDay()];
  const todaySchedule = operatingHours[dayKey];

  if (!todaySchedule || todaySchedule.closed) return false;
  if (!todaySchedule.open || !todaySchedule.close) return false;

  const currentMinutes = wibDate.getHours() * 60 + wibDate.getMinutes();
  const [openH, openM] = todaySchedule.open.split(':').map(Number);
  const [closeH, closeM] = todaySchedule.close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Status gabungan: toko dianggap buka hanya kalau toggle manual (is_open)
 * TIDAK dimatikan secara sengaja DAN sedang dalam jam operasional (kalau
 * jadwal diisi). Kalau jadwal kosong, pakai toggle manual saja.
 */
export function computeEffectiveOpenStatus(seller) {
  const withinSchedule = isWithinOperatingHours(seller?.operating_hours);
  if (withinSchedule === null) return Boolean(seller?.is_open);
  return Boolean(seller?.is_open) && withinSchedule;
}
